import { Link, useNavigate } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronRight, Lightbulb, Sparkles, Trophy } from 'lucide-react'
import { useStore } from '../lib/store'
import { computeKpis, funnel, insights, isOpen, leaderboard, probability, revenueBySource } from '../lib/metrics'
import { cn, money, moneyCompact, pct, relative } from '../lib/format'
import { STAGES } from '../lib/types'
import { Avatar, Badge, Card, CardHeader, PageHeader } from '../components/ui'

function Kpi({ label, value, delta, sub, positive = true }: { label: string; value: string; delta?: string; sub?: string; positive?: boolean }) {
  return (
    <Card className="p-5">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="mt-2 text-[26px] font-semibold tracking-tight">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta && (
          <span className={cn('inline-flex items-center gap-0.5 font-medium', positive ? 'text-emerald-400' : 'text-rose-400')}>
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {delta}
          </span>
        )}
        {sub && <span className="text-ink-500">{sub}</span>}
      </div>
    </Card>
  )
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-ink-850 px-3 py-2 text-xs shadow-xl">
      <p className="text-ink-400 capitalize">{label?.endsWith('*') ? `${label.slice(0, -1)} · mês em andamento` : label}</p>
      <p className="mt-0.5 font-semibold text-ink-100">{money(payload[0]!.value)}</p>
    </div>
  )
}

const INSIGHT_STYLE = {
  risk: { icon: AlertTriangle, color: 'text-rose-300', bg: 'bg-rose-400/10' },
  opportunity: { icon: Lightbulb, color: 'text-gold-300', bg: 'bg-gold-400/10' },
  win: { icon: Trophy, color: 'text-emerald-300', bg: 'bg-emerald-400/10' },
}

export default function Dashboard() {
  const { db } = useStore()
  const nav = useNavigate()
  const k = computeKpis(db)
  const f = funnel(db)
  const lb = leaderboard(db)
  const sources = revenueBySource(db)
  const hot = db.deals
    .filter(isOpen)
    .sort((a, b) => b.value * probability(b) - a.value * probability(a))
    .slice(0, 5)
  const client = (id: string) => db.clients.find((c) => c.id === id)

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Visão geral"
        subtitle={`${db.workspace.name} · atualizado agora`}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi label="Receita do mês" value={money(k.thisMonth)} delta={pct(k.goalProgress, 0)} sub={`da meta de ${moneyCompact(k.goal)}`} />
        <Kpi label="Forecast ponderado" value={money(k.forecast)} sub={`${k.openCount} negócios · ${moneyCompact(k.pipeline)} bruto`} />
        <Kpi label="Taxa de conversão" value={pct(k.winRate, 0)} sub="últimos 90 dias" />
        <Kpi label="Ticket médio" value={money(k.avgTicket)} sub={`ciclo de ${Math.round(k.cycle)} dias`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="flex flex-col xl:col-span-2">
          <CardHeader
            title="Receita fechada"
            subtitle={`${moneyCompact(k.arr12)} nos últimos 12 meses`}
            action={<Badge color="#d4ab68">Meta {moneyCompact(k.goal)}/mês</Badge>}
          />
          <div className="min-h-72 flex-1 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={k.series} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4ab68" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#d4ab68" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} width={60} tickFormatter={(v: number) => moneyCompact(v).replace('R$ ', '')} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,.1)' }} />
                <ReferenceLine y={k.goal} stroke="#d4ab68" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="receita" stroke="#e2c48f" strokeWidth={2} fill="url(#rev)" activeDot={{ r: 5, fill: '#e2c48f', stroke: '#08080b', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-gold-400/10 blur-3xl" />
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Sparkles size={15} className="text-gold-300" /> Insights do Copiloto
              </span>
            }
            subtitle="Gerados a partir dos seus dados"
          />
          <div className="space-y-2 px-3 pb-4">
            {insights(db).slice(0, 3).map((ins) => {
              const s = INSIGHT_STYLE[ins.tone]
              return (
                <button
                  key={ins.title}
                  onClick={() => ins.action && nav(ins.action.to)}
                  className="flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-white/[.03]"
                >
                  <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', s.bg, s.color)}>
                    <s.icon size={15} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{ins.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-ink-400">{ins.body}</span>
                    {ins.action && <span className="mt-1.5 inline-flex items-center gap-0.5 text-xs text-gold-300">{ins.action.label} <ChevronRight size={12} /></span>}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Funil de vendas" subtitle="Valor por etapa" action={<Link to="/app/pipeline" className="text-xs text-gold-300 hover:underline">Abrir pipeline</Link>} />
          <div className="space-y-3 px-5 pb-5">
            {f.map((s) => {
              const max = Math.max(...f.map((x) => x.value))
              return (
                <div key={s.id}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-ink-300">
                      {s.label} <span className="text-ink-500">· {s.count}</span>
                    </span>
                    <span className="font-medium">{moneyCompact(s.value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[.04]">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(s.value / max) * 100}%`, background: s.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Negócios quentes" subtitle="Maior receita esperada" />
          <div className="px-2 pb-3">
            {hot.map((d) => {
              const st = STAGES.find((s) => s.id === d.stage)!
              return (
                <Link key={d.id} to={`/app/pipeline?negocio=${d.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[.03]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{d.title}</p>
                    <p className="truncate text-xs text-ink-500">{client(d.clientId)?.company}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{moneyCompact(d.value)}</p>
                    <Badge color={st.color}>{st.label}</Badge>
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Ranking do time" subtitle="Receita nos últimos 90 dias" />
          <div className="space-y-1 px-2 pb-3">
            {lb.map((r, i) => (
              <div key={r.member.id} className="flex items-center gap-3 rounded-xl px-3 py-2">
                <span className="w-4 text-xs text-ink-500">{i + 1}</span>
                <Avatar name={r.member.name} color={r.member.color} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{r.member.name}</p>
                  <p className="text-xs text-ink-500">
                    {r.member.role} · {r.count} negócios
                  </p>
                </div>
                <p className="text-sm font-medium">{moneyCompact(r.value)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Receita por canal" subtitle="Últimos 12 meses" />
          <div className="h-56 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sources} layout="vertical" margin={{ left: 10, right: 24 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="source" axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,.03)' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                  {sources.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#e2c48f' : `rgba(212,171,104,${0.55 - i * 0.07})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Atividade" subtitle="Em tempo real" />
          <div className="px-5 pb-5">
            <ol className="relative space-y-4 border-l border-white/[.07] pl-5">
              {db.activities.slice(0, 6).map((a) => {
                const m = db.members.find((x) => x.id === a.memberId)
                return (
                  <li key={a.id} className="relative">
                    <span className="absolute top-1.5 -left-[25px] h-2 w-2 rounded-full ring-4 ring-ink-900" style={{ background: m?.color ?? '#d4ab68' }} />
                    <p className="text-sm leading-snug text-ink-200">{a.text}</p>
                    <p className="mt-0.5 text-[11px] text-ink-500">{relative(a.at)}</p>
                  </li>
                )
              })}
            </ol>
          </div>
        </Card>
      </div>
    </div>
  )
}
