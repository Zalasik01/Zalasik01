import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, FileText, Plus } from 'lucide-react'
import { proposalTotal, useStore } from '../lib/store'
import { cn, money, relative } from '../lib/format'
import { isOpen } from '../lib/metrics'
import type { ProposalStatus } from '../lib/types'
import { Badge, Button, Card, Empty, Modal, PageHeader, Select } from '../components/ui'

export const PROPOSAL_STATUS: Record<ProposalStatus, { label: string; color: string }> = {
  rascunho: { label: 'Rascunho', color: '#75758a' },
  enviada: { label: 'Enviada', color: '#7c8cff' },
  visualizada: { label: 'Visualizada', color: '#d4ab68' },
  aceita: { label: 'Aceita', color: '#4fd18b' },
  recusada: { label: 'Recusada', color: '#e5546b' },
}

export default function Proposals() {
  const { db, createProposal } = useStore()
  const nav = useNavigate()
  const [filter, setFilter] = useState<'todas' | ProposalStatus>('todas')
  const [picking, setPicking] = useState(false)
  const openDeals = db.deals.filter(isOpen)
  const [dealId, setDealId] = useState(openDeals[0]?.id ?? '')

  const list = db.proposals.filter((p) => filter === 'todas' || p.status === filter)
  const sent = db.proposals.filter((p) => p.status !== 'rascunho')
  const accepted = db.proposals.filter((p) => p.status === 'aceita')
  const viewed = db.proposals.filter((p) => p.viewedAt)

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Propostas"
        subtitle="Propostas elegantes, com rastreio de leitura e aceite em um clique"
        actions={
          <Button variant="primary" onClick={() => setPicking(true)}>
            <Plus size={15} /> Nova proposta
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Em aberto', money(db.proposals.filter((p) => ['enviada', 'visualizada'].includes(p.status)).reduce((s, p) => s + proposalTotal(p), 0))],
          ['Taxa de abertura', sent.length ? `${Math.round((viewed.length / sent.length) * 100)}%` : '—'],
          ['Taxa de aceite', sent.length ? `${Math.round((accepted.length / sent.length) * 100)}%` : '—'],
          ['Aceitas (valor)', money(accepted.reduce((s, p) => s + proposalTotal(p), 0))],
        ].map(([l, v]) => (
          <Card key={l} className="p-5">
            <p className="text-xs text-ink-400">{l}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{v}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex gap-1 overflow-x-auto border-b border-white/[.06] p-3 text-xs">
          {(['todas', 'rascunho', 'enviada', 'visualizada', 'aceita', 'recusada'] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={cn('rounded-lg px-3 py-1.5 whitespace-nowrap capitalize transition', filter === s ? 'bg-white/10 text-ink-100' : 'text-ink-400 hover:text-ink-200')}>
              {s === 'todas' ? 'Todas' : PROPOSAL_STATUS[s].label}
              <span className="ml-1.5 text-ink-500">{s === 'todas' ? db.proposals.length : db.proposals.filter((p) => p.status === s).length}</span>
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <Empty icon={<FileText size={22} />} title="Nenhuma proposta aqui" body="Crie uma proposta a partir de um negócio do pipeline." />
        ) : (
          <div className="divide-y divide-white/[.04]">
            {list.map((p) => {
              const client = db.clients.find((c) => c.id === p.clientId)
              const st = PROPOSAL_STATUS[p.status]
              return (
                <Link key={p.id} to={`/app/propostas/${p.id}`} className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-white/[.02]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[.04] text-ink-400">
                    <FileText size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      <span className="text-ink-500">#{p.number}</span> {p.title}
                    </p>
                    <p className="truncate text-xs text-ink-500">
                      {client?.company} · criada {relative(p.createdAt)}
                    </p>
                  </div>
                  {p.viewedAt && p.status !== 'aceita' && (
                    <span className="hidden items-center gap-1 text-xs text-gold-300 sm:inline-flex">
                      <Eye size={13} /> vista {relative(p.viewedAt)}
                    </span>
                  )}
                  <Badge color={st.color}>{st.label}</Badge>
                  <span className="w-32 text-right font-semibold">{money(proposalTotal(p))}</span>
                </Link>
              )
            })}
          </div>
        )}
      </Card>

      <Modal open={picking} onClose={() => setPicking(false)} title="Nova proposta">
        {openDeals.length === 0 ? (
          <p className="text-sm text-ink-400">Crie um negócio no pipeline primeiro.</p>
        ) : (
          <div className="space-y-4">
            <Select label="Para qual negócio?" value={dealId} onChange={(e) => setDealId(e.target.value)}>
              {openDeals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} — {db.clients.find((c) => c.id === d.clientId)?.company} ({money(d.value)})
                </option>
              ))}
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPicking(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const p = createProposal(dealId)
                  nav(`/app/propostas/${p.id}`)
                }}
              >
                Criar e editar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
