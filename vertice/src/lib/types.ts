export type Stage = 'lead' | 'qualificado' | 'reuniao' | 'proposta' | 'negociacao' | 'ganho' | 'perdido'

export const STAGES: { id: Stage; label: string; probability: number; color: string }[] = [
  { id: 'lead', label: 'Lead', probability: 10, color: '#75758a' },
  { id: 'qualificado', label: 'Qualificado', probability: 25, color: '#7c8cff' },
  { id: 'reuniao', label: 'Reunião', probability: 40, color: '#5ec8e5' },
  { id: 'proposta', label: 'Proposta', probability: 60, color: '#d4ab68' },
  { id: 'negociacao', label: 'Negociação', probability: 80, color: '#f08a5d' },
  { id: 'ganho', label: 'Ganho', probability: 100, color: '#4fd18b' },
  { id: 'perdido', label: 'Perdido', probability: 0, color: '#e5546b' },
]

export const OPEN_STAGES: Stage[] = ['lead', 'qualificado', 'reuniao', 'proposta', 'negociacao']

export interface Member {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Admin' | 'Closer' | 'SDR'
  color: string
}

export interface Client {
  id: string
  name: string
  company: string
  email: string
  phone: string
  segment: string
  status: 'ativo' | 'prospect' | 'inativo'
  createdAt: string
  tags: string[]
}

export interface Deal {
  id: string
  title: string
  clientId: string
  ownerId: string
  value: number
  stage: Stage
  source: string
  createdAt: string
  expectedClose: string
  closedAt?: string
  lastActivityAt: string
  notes: string
}

export interface ProposalItem {
  id: string
  description: string
  qty: number
  price: number
}

export type ProposalStatus = 'rascunho' | 'enviada' | 'visualizada' | 'aceita' | 'recusada'

export interface Proposal {
  id: string
  number: number
  dealId: string
  clientId: string
  title: string
  intro: string
  items: ProposalItem[]
  discount: number
  installments: number
  status: ProposalStatus
  validUntil: string
  createdAt: string
  viewedAt?: string
  acceptedAt?: string
}

export type ActivityType =
  | 'deal_created'
  | 'stage_changed'
  | 'deal_won'
  | 'deal_lost'
  | 'proposal_sent'
  | 'proposal_viewed'
  | 'proposal_accepted'
  | 'client_created'
  | 'note'

export interface Activity {
  id: string
  type: ActivityType
  text: string
  at: string
  dealId?: string
  memberId?: string
}

export interface Workspace {
  name: string
  plan: PlanId
  billingCycle: 'mensal' | 'anual'
  monthlyGoal: number
  integrations: Record<string, boolean>
  twoFactor: boolean
}

export type PlanId = 'essencial' | 'escala' | 'private'

export interface Session {
  name: string
  email: string
}

export interface DB {
  version: number
  workspace: Workspace
  members: Member[]
  clients: Client[]
  deals: Deal[]
  proposals: Proposal[]
  activities: Activity[]
}
