import type { DB, Deal } from './types'
import { OPEN_STAGES, STAGES } from './types'
import { daysBetween, money, pct } from './format'

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const DAY = 86_400_000

export const isOpen = (d: Deal) => OPEN_STAGES.includes(d.stage)
export const probability = (d: Deal) => STAGES.find((s) => s.id === d.stage)!.probability / 100

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

export function monthlyRevenue(db: DB, months = 12) {
  const now = new Date()
  const buckets: { key: string; mes: string; receita: number; negocios: number }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ key: monthKey(d), mes: MONTHS[d.getMonth()]!, receita: 0, negocios: 0 })
  }
  for (const deal of db.deals) {
    if (deal.stage !== 'ganho' || !deal.closedAt) continue
    const b = buckets.find((x) => x.key === monthKey(new Date(deal.closedAt!)))
    if (b) {
      b.receita += deal.value
      b.negocios += 1
    }
  }
  // O mês corrente ainda está em andamento: sinalizamos no eixo para a queda não parecer tendência.
  buckets.at(-1)!.mes += '*'
  return buckets
}

export function wonBetween(db: DB, fromDaysAgo: number, toDaysAgo = 0) {
  const from = Date.now() - fromDaysAgo * DAY
  const to = Date.now() - toDaysAgo * DAY
  return db.deals.filter((d) => {
    if (d.stage !== 'ganho' || !d.closedAt) return false
    const t = new Date(d.closedAt).getTime()
    return t >= from && t <= to
  })
}

const sum = (deals: Deal[]) => deals.reduce((s, d) => s + d.value, 0)

export function computeKpis(db: DB) {
  const series = monthlyRevenue(db)
  const thisMonth = series.at(-1)!.receita
  // Janela móvel: últimos 30 dias vs. os 30 anteriores (comparação justa em qualquer dia do mês).
  const last30 = sum(wonBetween(db, 30))
  const prev30 = sum(wonBetween(db, 60, 30))
  const open = db.deals.filter(isOpen)
  const pipeline = sum(open)
  const forecast = open.reduce((s, d) => s + d.value * probability(d), 0)

  const closed90 = db.deals.filter((d) => d.closedAt && daysBetween(d.closedAt) <= 90 && (d.stage === 'ganho' || d.stage === 'perdido'))
  const won90 = closed90.filter((d) => d.stage === 'ganho')
  const winRate = closed90.length ? (won90.length / closed90.length) * 100 : 0

  const won12 = wonBetween(db, 365)
  const avgTicket = won12.length ? sum(won12) / won12.length : 0
  const cycle = won12.length
    ? won12.reduce((s, d) => s + daysBetween(d.createdAt, d.closedAt!), 0) / won12.length
    : 0

  const arr12 = sum(won12)
  const goal = db.workspace.monthlyGoal
  return {
    thisMonth,
    last30,
    growth: prev30 ? ((last30 - prev30) / prev30) * 100 : 0,
    pipeline,
    openCount: open.length,
    forecast,
    winRate,
    avgTicket,
    cycle,
    arr12,
    goal,
    goalProgress: goal ? (thisMonth / goal) * 100 : 0,
    series,
  }
}

export function staleDeals(db: DB, days = 10) {
  return db.deals
    .filter((d) => isOpen(d) && daysBetween(d.lastActivityAt) >= days)
    .sort((a, b) => b.value - a.value)
}

export function funnel(db: DB) {
  return OPEN_STAGES.map((id) => {
    const deals = db.deals.filter((d) => d.stage === id)
    const stage = STAGES.find((s) => s.id === id)!
    return { id, label: stage.label, color: stage.color, count: deals.length, value: sum(deals) }
  })
}

export function revenueBySource(db: DB) {
  const map = new Map<string, number>()
  for (const d of wonBetween(db, 365)) map.set(d.source, (map.get(d.source) ?? 0) + d.value)
  return [...map.entries()].map(([source, value]) => ({ source, value })).sort((a, b) => b.value - a.value)
}

export function leaderboard(db: DB, days = 90) {
  const won = wonBetween(db, days)
  return db.members
    .map((m) => {
      const mine = won.filter((d) => d.ownerId === m.id)
      return { member: m, value: sum(mine), count: mine.length }
    })
    .sort((a, b) => b.value - a.value)
}

export interface Insight {
  tone: 'risk' | 'opportunity' | 'win'
  title: string
  body: string
  action?: { label: string; to: string }
}

export function insights(db: DB): Insight[] {
  const k = computeKpis(db)
  const out: Insight[] = []
  const stale = staleDeals(db)
  if (stale.length) {
    out.push({
      tone: 'risk',
      title: `${stale.length} negócios esfriando`,
      body: `${money(sum(stale))} parados há mais de 10 dias. O maior é “${stale[0]!.title}” (${money(stale[0]!.value)}).`,
      action: { label: 'Ver no pipeline', to: '/app/pipeline?filtro=parados' },
    })
  }
  const viewed = db.proposals.filter((p) => p.status === 'visualizada')
  if (viewed.length) {
    out.push({
      tone: 'opportunity',
      title: `${viewed.length} propostas visualizadas sem resposta`,
      body: 'Clientes que abrem a proposta mais de uma vez fecham 3,4× mais quando recebem contato em até 24h.',
      action: { label: 'Abrir propostas', to: '/app/propostas' },
    })
  }
  const gap = k.goal - k.thisMonth
  if (gap > 0) {
    out.push({
      tone: 'opportunity',
      title: `Faltam ${money(gap)} para a meta do mês`,
      body: `Seu forecast ponderado é ${money(k.forecast)}. Priorize os negócios em Negociação para fechar a lacuna.`,
      action: { label: 'Perguntar ao Copiloto', to: '/app/copiloto' },
    })
  } else {
    out.push({ tone: 'win', title: 'Meta do mês batida 🎯', body: `Você está em ${pct(k.goalProgress, 0)} da meta. Considere elevar a meta do próximo mês.` })
  }
  if (k.growth > 0) {
    out.push({ tone: 'win', title: `Receita ${pct(k.growth, 0)} acima dos 30 dias anteriores`, body: `Ticket médio de ${money(k.avgTicket)} e taxa de conversão de ${pct(k.winRate, 0)}.` })
  }
  return out
}
