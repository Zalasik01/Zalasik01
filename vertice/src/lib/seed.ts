import type { Activity, Client, DB, Deal, Member, Proposal, Stage } from './types'

// RNG determinístico: a demo é sempre a mesma, mas as datas acompanham o "hoje".
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DAY = 86_400_000
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 3_600_000).toISOString()
const ahead = (days: number) => new Date(Date.now() + days * DAY).toISOString()

export const MEMBERS: Member[] = [
  { id: 'm1', name: 'Nicolas Zalasik', email: 'nicolas@vertice.app', role: 'Owner', color: '#d4ab68' },
  { id: 'm2', name: 'Marina Albuquerque', email: 'marina@vertice.app', role: 'Closer', color: '#7c8cff' },
  { id: 'm3', name: 'Rafael Monteiro', email: 'rafael@vertice.app', role: 'Closer', color: '#4fd18b' },
  { id: 'm4', name: 'Beatriz Lacerda', email: 'beatriz@vertice.app', role: 'SDR', color: '#f08a5d' },
]

const PEOPLE: [string, string, string][] = [
  ['Helena Vasconcelos', 'Vasconcelos Odontologia Premium', 'Saúde'],
  ['Thiago Barreto', 'Barreto & Associados', 'Jurídico'],
  ['Camila Ferraz', 'Ferraz Arquitetura', 'Arquitetura'],
  ['Eduardo Prado', 'Prado Capital', 'Finanças'],
  ['Juliana Moraes', 'Clínica Lumière', 'Estética'],
  ['Gustavo Teixeira', 'Teixeira Engenharia', 'Engenharia'],
  ['Larissa Quintela', 'Quintela Imóveis de Alto Padrão', 'Imobiliário'],
  ['Ricardo Almeida', 'Almeida Holdings', 'Holding'],
  ['Fernanda Lobo', 'Lobo Educação Executiva', 'Educação'],
  ['Pedro Sampaio', 'Sampaio Agro', 'Agronegócio'],
  ['Isabela Rocha', 'Rocha Dermatologia', 'Saúde'],
  ['Marcelo Duarte', 'Duarte Tech Ventures', 'Tecnologia'],
  ['Aline Carvalho', 'Maison Carvalho', 'Moda'],
  ['Bruno Nogueira', 'Nogueira Investimentos', 'Finanças'],
  ['Patrícia Lemos', 'Instituto Lemos', 'Educação'],
  ['Felipe Cardoso', 'Cardoso Logística', 'Logística'],
  ['Renata Siqueira', 'Siqueira Wealth', 'Finanças'],
  ['André Fontes', 'Fontes Construtora', 'Engenharia'],
  ['Luana Medeiros', 'Medeiros Hotelaria Boutique', 'Hotelaria'],
  ['Diego Paiva', 'Paiva Advocacia Tributária', 'Jurídico'],
  ['Sofia Azevedo', 'Azevedo Cirurgia Plástica', 'Saúde'],
  ['Vinícius Leal', 'Leal Family Office', 'Holding'],
  ['Carolina Brandão', 'Brandão Eventos', 'Eventos'],
  ['Otávio Mendes', 'Mendes Vinhos', 'Bebidas'],
]

const OFFERS: [string, number, number][] = [
  ['Mentoria Executiva 12 meses', 36_000, 72_000],
  ['Consultoria de Crescimento', 48_000, 120_000],
  ['Programa de Liderança C-Level', 60_000, 150_000],
  ['Implementação Revenue Ops', 28_000, 64_000],
  ['Advisory Board Trimestral', 45_000, 90_000],
  ['Reestruturação Comercial', 55_000, 140_000],
  ['Imersão Estratégica Presencial', 18_000, 42_000],
  ['Branding Premium + Posicionamento', 32_000, 85_000],
]

const SOURCES = ['Indicação', 'LinkedIn', 'Evento', 'Inbound', 'Parceiro', 'Outbound']

export function createSeed(): DB {
  const r = rng(20261010)
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)]!
  const between = (a: number, b: number) => Math.round((a + r() * (b - a)) / 1000) * 1000

  const clients: Client[] = PEOPLE.map(([name, company, segment], i) => {
    const first = name.split(' ')[0]!.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const domain = company.split(' ')[0]!.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return {
      id: `c${i + 1}`,
      name,
      company,
      email: `${first}@${domain}.com.br`,
      phone: `+55 11 9${Math.floor(1000 + r() * 8999)}-${Math.floor(1000 + r() * 8999)}`,
      segment,
      status: i < 14 ? 'ativo' : i < 21 ? 'prospect' : 'inativo',
      createdAt: ago(30 + Math.floor(r() * 330)),
      tags: r() > 0.6 ? ['VIP'] : r() > 0.5 ? ['Recorrente'] : [],
    }
  })

  const deals: Deal[] = []
  let n = 1

  // Histórico: negócios ganhos/perdidos por mês-calendário nos últimos 12 meses, com crescimento consistente.
  const today = new Date()
  const dayIn = (month: number) => {
    const start = new Date(today.getFullYear(), today.getMonth() - month, 1)
    const span = month === 0 ? Math.max(1, today.getDate() - 1) : new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    const d = new Date(start.getTime() + Math.floor(r() * span) * DAY + 10 * 3_600_000)
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / DAY))
  }
  // Curva de receita suave (~6% a.m.) e, para o mês corrente, ~55% da meta já fechada.
  for (let month = 11; month >= 0; month--) {
    const target = month === 0 ? 275_000 : 300_000 * Math.pow(1.06, 11 - month) * (0.92 + r() * 0.16)
    let closed = 0
    while (closed < target * 0.95) {
      const [title, min, max] = pick(OFFERS)
      const value = Math.min(Math.round((between(min, max) * (1 + (11 - month) * 0.03)) / 1000) * 1000, Math.max(30_000, Math.round((target - closed) / 1000) * 1000 + 15_000))
      closed += value
      const closedDaysAgo = dayIn(month)
      const client = pick(clients.slice(0, 18))
      deals.push({
        id: `d${n++}`,
        title,
        clientId: client.id,
        ownerId: pick(MEMBERS.slice(0, 3)).id,
        value,
        stage: 'ganho',
        source: pick(SOURCES),
        createdAt: ago(closedDaysAgo + 20 + Math.floor(r() * 40)),
        expectedClose: ago(closedDaysAgo),
        closedAt: ago(closedDaysAgo),
        lastActivityAt: ago(closedDaysAgo),
        notes: '',
      })
    }
    const losses = 2 + Math.floor(r() * 2)
    for (let k = 0; k < losses; k++) {
      const [title, min, max] = pick(OFFERS)
      const closedDaysAgo = dayIn(month)
      deals.push({
        id: `d${n++}`,
        title,
        clientId: pick(clients).id,
        ownerId: pick(MEMBERS.slice(0, 3)).id,
        value: between(min, max),
        stage: 'perdido',
        source: pick(SOURCES),
        createdAt: ago(closedDaysAgo + 30),
        expectedClose: ago(closedDaysAgo),
        closedAt: ago(closedDaysAgo),
        lastActivityAt: ago(closedDaysAgo),
        notes: '',
      })
    }
  }

  // Pipeline aberto
  const open: [Stage, number][] = [
    ['lead', 6],
    ['qualificado', 5],
    ['reuniao', 4],
    ['proposta', 4],
    ['negociacao', 3],
  ]
  for (const [stage, count] of open) {
    for (let k = 0; k < count; k++) {
      const [title, min, max] = pick(OFFERS)
      const idle = r() > 0.78 ? 12 + Math.floor(r() * 12) : Math.floor(r() * 6)
      deals.push({
        id: `d${n++}`,
        title,
        clientId: pick(clients.slice(4)).id,
        ownerId: pick(MEMBERS).id,
        value: between(min, max),
        stage,
        source: pick(SOURCES),
        createdAt: ago(idle + 5 + Math.floor(r() * 30)),
        expectedClose: ahead(5 + Math.floor(r() * 55)),
        lastActivityAt: ago(idle, Math.floor(r() * 10)),
        notes: stage === 'negociacao' ? 'Decisor pediu condição especial de parcelamento em 6x.' : '',
      })
    }
  }

  const proposalDeals = deals.filter((d) => d.stage === 'proposta' || d.stage === 'negociacao')
  const recentWon = deals.filter((d) => d.stage === 'ganho').slice(-3)
  const proposals: Proposal[] = [...proposalDeals, ...recentWon].map((d, i) => {
    const status: Proposal['status'] =
      d.stage === 'ganho' ? 'aceita' : d.stage === 'negociacao' ? 'visualizada' : i % 2 ? 'enviada' : 'rascunho'
    const core = Math.round((d.value * 0.75) / 1000) * 1000
    return {
      id: `p${i + 1}`,
      number: 1040 + i,
      dealId: d.id,
      clientId: d.clientId,
      title: d.title,
      intro:
        'Desenhamos esta proposta a partir do diagnóstico realizado em nossa reunião. O objetivo é acelerar seu crescimento com previsibilidade e um time comercial de alta performance.',
      items: [
        { id: 'i1', description: `${d.title} — escopo principal`, qty: 1, price: core },
        { id: 'i2', description: 'Sessões de acompanhamento 1:1', qty: 4, price: Math.round((d.value - core) / 4 / 100) * 100 },
      ],
      discount: 0,
      installments: 6,
      status,
      validUntil: ahead(15),
      createdAt: ago(3 + i),
      viewedAt: status === 'visualizada' || status === 'aceita' ? ago(1 + (i % 3), 4) : undefined,
      acceptedAt: status === 'aceita' ? d.closedAt : undefined,
    }
  })

  const activities: Activity[] = [
    { id: 'a1', type: 'proposal_viewed', text: 'Ricardo Almeida visualizou a proposta #1041 pela 3ª vez', at: ago(0, 1), memberId: 'm2' },
    { id: 'a2', type: 'deal_won', text: 'Marina fechou “Programa de Liderança C-Level” com Prado Capital', at: ago(0, 3), memberId: 'm2' },
    { id: 'a3', type: 'stage_changed', text: 'Rafael moveu “Advisory Board Trimestral” para Negociação', at: ago(0, 6), memberId: 'm3' },
    { id: 'a4', type: 'client_created', text: 'Beatriz adicionou Luana Medeiros (Medeiros Hotelaria Boutique)', at: ago(1, 2), memberId: 'm4' },
    { id: 'a5', type: 'proposal_sent', text: 'Proposta #1043 enviada para Clínica Lumière', at: ago(1, 5), memberId: 'm1' },
    { id: 'a6', type: 'note', text: 'Nicolas registrou reunião de diagnóstico com Teixeira Engenharia', at: ago(2, 1), memberId: 'm1' },
    { id: 'a7', type: 'deal_created', text: 'Novo lead via Indicação: Leal Family Office', at: ago(2, 7), memberId: 'm4' },
  ]

  return {
    version: 1,
    workspace: {
      name: 'Zalasik Advisory',
      plan: 'escala',
      billingCycle: 'anual',
      monthlyGoal: 420_000,
      integrations: { stripe: true, whatsapp: true, gcal: true, slack: false, zapier: false, rdstation: false },
      twoFactor: true,
    },
    members: MEMBERS,
    clients,
    deals,
    proposals,
    activities,
  }
}
