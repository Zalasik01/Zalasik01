import { useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Mail, Phone, Plus, Search, Users } from 'lucide-react'
import { useStore } from '../lib/store'
import { cn, date, money } from '../lib/format'
import { isOpen } from '../lib/metrics'
import { Avatar, Badge, Button, Card, Empty, Input, Modal, PageHeader, Select } from '../components/ui'

const STATUS = {
  ativo: { label: 'Ativo', color: '#4fd18b' },
  prospect: { label: 'Prospect', color: '#7c8cff' },
  inativo: { label: 'Inativo', color: '#75758a' },
}

const COLORS = ['#d4ab68', '#7c8cff', '#4fd18b', '#f08a5d', '#5ec8e5', '#e5546b']

export default function Clients() {
  const { db, addClient, toast } = useStore()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [status, setStatus] = useState<'todos' | keyof typeof STATUS>('todos')
  const [sort, setSort] = useState<'ltv' | 'nome' | 'recente'>('ltv')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', segment: '' })

  const rows = useMemo(() => {
    const list = db.clients.map((c) => {
      const deals = db.deals.filter((d) => d.clientId === c.id)
      return {
        c,
        ltv: deals.filter((d) => d.stage === 'ganho').reduce((s, d) => s + d.value, 0),
        open: deals.filter(isOpen).reduce((s, d) => s + d.value, 0),
        count: deals.length,
      }
    })
    return list
      .filter((r) => (status === 'todos' ? true : r.c.status === status))
      .filter((r) => `${r.c.name} ${r.c.company} ${r.c.email} ${r.c.segment}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (sort === 'ltv' ? b.ltv - a.ltv : sort === 'nome' ? a.c.name.localeCompare(b.c.name) : b.c.createdAt.localeCompare(a.c.createdAt)))
  }, [db, q, status, sort])

  const totalLtv = rows.reduce((s, r) => s + r.ltv, 0)

  const exportCsv = () => {
    const header = 'Nome;Empresa;E-mail;Telefone;Segmento;Status;LTV\n'
    const body = rows.map((r) => [r.c.name, r.c.company, r.c.email, r.c.phone, r.c.segment, r.c.status, r.ltv].join(';')).join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + header + body], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'clientes-vertice.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast('Exportação concluída')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    addClient({ ...form, segment: form.segment || 'Outro', status: 'prospect', tags: [] })
    toast('Cliente adicionado')
    setForm({ name: '', company: '', email: '', phone: '', segment: '' })
    setCreating(false)
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Clientes"
        subtitle={`${rows.length} clientes · ${money(totalLtv)} em lifetime value`}
        actions={
          <>
            <Button onClick={exportCsv}>
              <Download size={15} /> Exportar CSV
            </Button>
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus size={15} /> Novo cliente
            </Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[.06] p-4">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, empresa, segmento…"
              className="h-9 w-full rounded-xl border border-white/10 bg-white/[.03] pr-3 pl-9 text-sm outline-none placeholder:text-ink-500 focus:border-gold-400/50"
            />
          </div>
          <div className="flex rounded-xl border border-white/10 p-0.5 text-xs">
            {(['todos', 'ativo', 'prospect', 'inativo'] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={cn('rounded-lg px-3 py-1.5 capitalize transition', status === s ? 'bg-white/10 text-ink-100' : 'text-ink-400')}>
                {s === 'todos' ? 'Todos' : STATUS[s].label}
              </button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="ml-auto h-9 rounded-xl border border-white/10 bg-ink-900 px-3 text-sm outline-none">
            <option value="ltv">Maior LTV</option>
            <option value="nome">Nome (A–Z)</option>
            <option value="recente">Mais recentes</option>
          </select>
        </div>

        {rows.length === 0 ? (
          <Empty icon={<Users size={22} />} title="Nenhum cliente encontrado" body="Ajuste os filtros ou adicione um novo cliente." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-500">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Segmento</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">LTV</th>
                  <th className="px-5 py-3 text-right font-medium">Em aberto</th>
                  <th className="px-5 py-3 font-medium">Cliente desde</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ c, ltv, open }, i) => (
                  <tr key={c.id} className="border-t border-white/[.04] transition hover:bg-white/[.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} color={COLORS[i % COLORS.length]} size={34} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-medium">
                            {c.name}
                            {c.tags.includes('VIP') && <Badge color="#d4ab68">VIP</Badge>}
                          </p>
                          <p className="truncate text-xs text-ink-500">{c.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-300">{c.segment}</td>
                    <td className="px-5 py-3">
                      <Badge color={STATUS[c.status].color}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS[c.status].color }} />
                        {STATUS[c.status].label}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{ltv ? money(ltv) : '—'}</td>
                    <td className="px-5 py-3 text-right text-ink-300">{open ? money(open) : '—'}</td>
                    <td className="px-5 py-3 text-ink-400">{date(c.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1 text-ink-500">
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="rounded-lg p-1.5 hover:bg-white/5 hover:text-ink-100" title={c.email}>
                            <Mail size={15} />
                          </a>
                        )}
                        {c.phone && (
                          <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 hover:bg-white/5 hover:text-ink-100" title={c.phone}>
                            <Phone size={15} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} title="Novo cliente">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nome" required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Empresa" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+55 11 9…" />
          </div>
          <Select label="Segmento" value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })}>
            <option value="">Selecione…</option>
            {['Saúde', 'Jurídico', 'Finanças', 'Educação', 'Imobiliário', 'Engenharia', 'Tecnologia', 'Holding', 'Outro'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Adicionar cliente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
