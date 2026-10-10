import { useState } from 'react'
import { Building2, Check, CreditCard, Download, Plug, RotateCcw, Shield, UserPlus, Users } from 'lucide-react'
import { useStore } from '../lib/store'
import { cn, date, money } from '../lib/format'
import type { PlanId } from '../lib/types'
import { Avatar, Badge, Button, Card, Input, Modal, PageHeader, Select, Toggle } from '../components/ui'

const TABS = [
  { id: 'workspace', label: 'Workspace', icon: Building2 },
  { id: 'plano', label: 'Plano e faturamento', icon: CreditCard },
  { id: 'equipe', label: 'Equipe', icon: Users },
  { id: 'integracoes', label: 'Integrações', icon: Plug },
  { id: 'seguranca', label: 'Segurança', icon: Shield },
] as const

const PLANS: { id: PlanId; name: string; price: number; seats: string }[] = [
  { id: 'essencial', name: 'Essencial', price: 497, seats: '1 usuário' },
  { id: 'escala', name: 'Escala', price: 1497, seats: 'Até 10 usuários' },
  { id: 'private', name: 'Private', price: 4900, seats: 'Ilimitado' },
]

const INTEGRATIONS = [
  { id: 'stripe', name: 'Stripe', desc: 'Cobrança automática quando a proposta é aceita', color: '#635bff' },
  { id: 'whatsapp', name: 'WhatsApp Business', desc: 'Envie propostas e follow-ups pelo WhatsApp', color: '#25d366' },
  { id: 'gcal', name: 'Google Agenda', desc: 'Reuniões sincronizadas com cada negócio', color: '#4285f4' },
  { id: 'slack', name: 'Slack', desc: 'Notificações de negócios ganhos no canal do time', color: '#e01e5a' },
  { id: 'zapier', name: 'Zapier', desc: 'Conecte com mais de 6.000 aplicativos', color: '#ff4a00' },
  { id: 'rdstation', name: 'RD Station', desc: 'Leads qualificados direto para o pipeline', color: '#19c1ce' },
]

export default function Settings() {
  const { db, session, updateWorkspace, resetDemo, toast } = useStore()
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('workspace')
  const [ws, setWs] = useState({ name: db.workspace.name, goal: String(db.workspace.monthlyGoal) })
  const [invite, setInvite] = useState(false)
  const [changingPlan, setChangingPlan] = useState<PlanId | null>(null)
  const w = db.workspace
  const current = PLANS.find((p) => p.id === w.plan)!
  const price = (p: number) => (w.billingCycle === 'anual' ? Math.round(p * 0.8) : p)

  const invoices = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i, 5)
    return { id: `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`, date: d.toISOString(), value: price(current.price) }
  })

  return (
    <div className="animate-fade-up">
      <PageHeader title="Configurações" subtitle="Gerencie seu workspace, plano e equipe" />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm whitespace-nowrap transition', tab === t.id ? 'bg-white/[.07] text-ink-100' : 'text-ink-400 hover:text-ink-200')}
            >
              <t.icon size={16} className={tab === t.id ? 'text-gold-300' : ''} /> {t.label}
            </button>
          ))}
        </nav>

        <div className="space-y-4">
          {tab === 'workspace' && (
            <>
              <Card className="p-6">
                <h3 className="font-semibold">Dados do workspace</h3>
                <div className="mt-5 grid max-w-xl gap-4 sm:grid-cols-2">
                  <Input label="Nome da empresa" value={ws.name} onChange={(e) => setWs({ ...ws, name: e.target.value })} />
                  <Input label="Meta mensal de receita (R$)" type="number" value={ws.goal} onChange={(e) => setWs({ ...ws, goal: e.target.value })} />
                  <Input label="Seu nome" value={session?.name ?? ''} disabled />
                  <Input label="E-mail" value={session?.email ?? ''} disabled />
                </div>
                <Button
                  variant="primary"
                  className="mt-6"
                  onClick={() => {
                    updateWorkspace({ name: ws.name, monthlyGoal: Number(ws.goal) || w.monthlyGoal })
                    toast('Workspace atualizado')
                  }}
                >
                  Salvar alterações
                </Button>
              </Card>
              <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div>
                  <h3 className="font-semibold">Restaurar dados de demonstração</h3>
                  <p className="mt-1 text-sm text-ink-400">Volta o workspace ao estado original da demo.</p>
                </div>
                <Button onClick={resetDemo}>
                  <RotateCcw size={15} /> Restaurar
                </Button>
              </Card>
            </>
          )}

          {tab === 'plano' && (
            <>
              <Card className="relative overflow-hidden p-6">
                <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-gold-400/10 blur-3xl" />
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Badge color="#d4ab68">Plano atual</Badge>
                    <h3 className="mt-3 font-serif text-3xl">{current.name}</h3>
                    <p className="mt-1 text-sm text-ink-400">
                      {money(price(current.price))}/mês · cobrança {w.billingCycle} · próxima fatura em {date(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toISOString())}
                    </p>
                  </div>
                  <div className="flex rounded-xl border border-white/10 p-0.5 text-xs">
                    {(['mensal', 'anual'] as const).map((c) => (
                      <button key={c} onClick={() => updateWorkspace({ billingCycle: c })} className={cn('rounded-lg px-3 py-1.5 capitalize', w.billingCycle === c ? 'bg-white/10' : 'text-ink-400')}>
                        {c}
                        {c === 'anual' && ' · -20%'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    ['Usuários', db.members.length, w.plan === 'essencial' ? 1 : w.plan === 'escala' ? 10 : 0],
                    ['Consultas ao Copiloto', 642, w.plan === 'essencial' ? 100 : 0],
                    ['Propostas este mês', db.proposals.length, 0],
                  ].map(([l, v, max]) => (
                    <div key={l as string} className="rounded-xl border border-white/[.06] p-4">
                      <p className="text-xs text-ink-400">{l}</p>
                      <p className="mt-1 text-lg font-semibold">
                        {v as number} <span className="text-sm font-normal text-ink-500">/ {max ? max : '∞'}</span>
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.06]">
                        <div className="h-full rounded-full bg-gold-400" style={{ width: max ? `${Math.min(100, ((v as number) / (max as number)) * 100)}%` : '12%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                {PLANS.map((p) => (
                  <Card key={p.id} className={cn('p-5', p.id === w.plan && 'ring-gold-glow')}>
                    <p className="font-serif text-xl">{p.name}</p>
                    <p className="mt-1 text-xs text-ink-400">{p.seats}</p>
                    <p className="mt-4 text-2xl font-semibold">
                      {money(price(p.price))}
                      <span className="text-sm font-normal text-ink-400">/mês</span>
                    </p>
                    <Button className="mt-4 w-full" variant={p.id === w.plan ? 'secondary' : 'primary'} disabled={p.id === w.plan} onClick={() => setChangingPlan(p.id)}>
                      {p.id === w.plan ? (
                        <>
                          <Check size={15} /> Plano atual
                        </>
                      ) : PLANS.findIndex((x) => x.id === p.id) > PLANS.findIndex((x) => x.id === w.plan) ? (
                        'Fazer upgrade'
                      ) : (
                        'Mudar plano'
                      )}
                    </Button>
                  </Card>
                ))}
              </div>

              <Card>
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <h3 className="text-sm font-semibold">Faturas</h3>
                  <span className="flex items-center gap-2 text-xs text-ink-400">
                    <CreditCard size={14} /> Visa •••• 4242
                  </span>
                </div>
                <div className="divide-y divide-white/[.04]">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                      <span className="flex-1 text-ink-300">{inv.id}</span>
                      <span className="text-ink-400">{date(inv.date)}</span>
                      <Badge color="#4fd18b">Paga</Badge>
                      <span className="w-24 text-right font-medium">{money(inv.value)}</span>
                      <button className="text-ink-500 hover:text-ink-100" onClick={() => toast('Download da fatura iniciado', 'info')} aria-label="Baixar fatura">
                        <Download size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {tab === 'equipe' && (
            <Card>
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                  <h3 className="text-sm font-semibold">Membros</h3>
                  <p className="text-xs text-ink-400">{db.members.length} de {w.plan === 'essencial' ? 1 : w.plan === 'escala' ? 10 : '∞'} assentos em uso</p>
                </div>
                <Button size="sm" variant="primary" onClick={() => setInvite(true)}>
                  <UserPlus size={14} /> Convidar
                </Button>
              </div>
              <div className="divide-y divide-white/[.04]">
                {db.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={m.name} color={m.color} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="truncate text-xs text-ink-500">{m.email}</p>
                    </div>
                    <Badge color={m.role === 'Owner' ? '#d4ab68' : '#a3a3b5'}>{m.role}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'integracoes' && (
            <div className="grid gap-4 md:grid-cols-2">
              {INTEGRATIONS.map((i) => (
                <Card key={i.id} className="flex items-start gap-4 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold" style={{ background: `${i.color}22`, color: i.color }}>
                    {i.name[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{i.name}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{i.desc}</p>
                  </div>
                  <Toggle
                    checked={!!w.integrations[i.id]}
                    onChange={(v) => {
                      updateWorkspace({ integrations: { ...w.integrations, [i.id]: v } })
                      toast(`${i.name} ${v ? 'conectado' : 'desconectado'}`, v ? 'success' : 'info')
                    }}
                  />
                </Card>
              ))}
            </div>
          )}

          {tab === 'seguranca' && (
            <Card className="divide-y divide-white/[.05]">
              {[
                { title: 'Autenticação em dois fatores', desc: 'Exige um código do app autenticador a cada login.', value: w.twoFactor, set: (v: boolean) => updateWorkspace({ twoFactor: v }) },
              ].map((row) => (
                <div key={row.title} className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-medium">{row.title}</p>
                    <p className="text-sm text-ink-400">{row.desc}</p>
                  </div>
                  <Toggle checked={row.value} onChange={(v) => (row.set(v), toast(v ? '2FA ativado' : '2FA desativado', 'info'))} />
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-medium">SSO / SAML</p>
                  <p className="text-sm text-ink-400">Login único com Google Workspace, Okta ou Azure AD.</p>
                </div>
                {w.plan === 'private' ? <Badge color="#4fd18b">Disponível</Badge> : <Badge color="#d4ab68">Plano Private</Badge>}
              </div>
              <div className="p-5">
                <p className="font-medium">Sessões ativas</p>
                <div className="mt-3 space-y-2 text-sm">
                  {[
                    ['MacBook Pro · São Paulo, BR', 'Sessão atual'],
                    ['iPhone 17 · São Paulo, BR', 'há 2 h'],
                  ].map(([d, t]) => (
                    <div key={d} className="flex justify-between rounded-xl border border-white/[.06] px-4 py-3">
                      <span className="text-ink-300">{d}</span>
                      <span className="text-xs text-ink-500">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal open={invite} onClose={() => setInvite(false)} title="Convidar membro">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setInvite(false)
            toast('Convite enviado por e-mail')
          }}
          className="space-y-4"
        >
          <Input label="E-mail" type="email" required placeholder="nome@empresa.com.br" autoFocus />
          <Select label="Função" defaultValue="Closer">
            <option>Admin</option>
            <option>Closer</option>
            <option>SDR</option>
          </Select>
          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              Enviar convite
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!changingPlan} onClose={() => setChangingPlan(null)} title="Confirmar mudança de plano">
        {changingPlan && (
          <div>
            <p className="text-sm text-ink-300">
              Você vai mudar para o plano <b className="text-ink-100">{PLANS.find((p) => p.id === changingPlan)!.name}</b> por{' '}
              <b className="text-ink-100">{money(price(PLANS.find((p) => p.id === changingPlan)!.price))}/mês</b>. O valor é ajustado proporcionalmente na próxima fatura.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setChangingPlan(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  updateWorkspace({ plan: changingPlan })
                  toast('Plano atualizado com sucesso')
                  setChangingPlan(null)
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
