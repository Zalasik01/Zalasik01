import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createSeed } from './seed'
import type { Activity, ActivityType, Client, DB, Deal, Proposal, Session, Stage, Workspace } from './types'
import { STAGES } from './types'
import { uid } from './format'

const DB_KEY = 'vertice:db:v1'
const SESSION_KEY = 'vertice:session:v1'

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function save(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* armazenamento indisponível: a demo segue em memória */
  }
}

interface Toast {
  id: string
  title: string
  tone: 'success' | 'info' | 'error'
}

interface StoreValue {
  db: DB
  session: Session | null
  toasts: Toast[]
  signIn: (s: Session) => void
  signOut: () => void
  toast: (title: string, tone?: Toast['tone']) => void
  resetDemo: () => void
  addClient: (c: Omit<Client, 'id' | 'createdAt'>) => Client
  updateClient: (id: string, patch: Partial<Client>) => void
  addDeal: (d: Omit<Deal, 'id' | 'createdAt' | 'lastActivityAt'>) => Deal
  updateDeal: (id: string, patch: Partial<Deal>) => void
  moveDeal: (id: string, stage: Stage) => void
  deleteDeal: (id: string) => void
  saveProposal: (p: Proposal) => void
  createProposal: (dealId: string) => Proposal
  setProposalStatus: (id: string, status: Proposal['status']) => void
  updateWorkspace: (patch: Partial<Workspace>) => void
  log: (type: ActivityType, text: string, dealId?: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => load<DB>(DB_KEY) ?? createSeed())
  const [session, setSession] = useState<Session | null>(() => load<Session>(SESSION_KEY))
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => save(DB_KEY, db), [db])
  useEffect(() => save(SESSION_KEY, session), [session])

  const toast = useCallback((title: string, tone: Toast['tone'] = 'success') => {
    const id = uid()
    setToasts((t) => [...t, { id, title, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const activity = (type: ActivityType, text: string, dealId?: string): Activity => ({
    id: uid(),
    type,
    text,
    dealId,
    at: new Date().toISOString(),
    memberId: 'm1',
  })

  const value = useMemo<StoreValue>(() => {
    const now = () => new Date().toISOString()
    const clientName = (id: string) => db.clients.find((c) => c.id === id)?.company ?? 'cliente'

    return {
      db,
      session,
      toasts,
      toast,
      signIn: (s) => setSession(s),
      signOut: () => setSession(null),
      resetDemo: () => {
        setDb(createSeed())
        toast('Dados de demonstração restaurados', 'info')
      },
      log: (type, text, dealId) => setDb((d) => ({ ...d, activities: [activity(type, text, dealId), ...d.activities] })),

      addClient: (c) => {
        const client: Client = { ...c, id: 'c' + uid(), createdAt: now() }
        setDb((d) => ({
          ...d,
          clients: [client, ...d.clients],
          activities: [activity('client_created', `Novo cliente: ${client.name} (${client.company})`), ...d.activities],
        }))
        return client
      },
      updateClient: (id, patch) =>
        setDb((d) => ({ ...d, clients: d.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      addDeal: (input) => {
        const deal: Deal = { ...input, id: 'd' + uid(), createdAt: now(), lastActivityAt: now() }
        setDb((d) => ({
          ...d,
          deals: [deal, ...d.deals],
          activities: [activity('deal_created', `Novo negócio “${deal.title}” com ${clientName(deal.clientId)}`, deal.id), ...d.activities],
        }))
        return deal
      },
      updateDeal: (id, patch) =>
        setDb((d) => ({
          ...d,
          deals: d.deals.map((x) => (x.id === id ? { ...x, ...patch, lastActivityAt: now() } : x)),
        })),
      moveDeal: (id, stage) =>
        setDb((d) => {
          const deal = d.deals.find((x) => x.id === id)
          if (!deal || deal.stage === stage) return d
          const label = STAGES.find((s) => s.id === stage)!.label
          const closed = stage === 'ganho' || stage === 'perdido'
          const type: ActivityType = stage === 'ganho' ? 'deal_won' : stage === 'perdido' ? 'deal_lost' : 'stage_changed'
          const text =
            stage === 'ganho'
              ? `Negócio ganho: “${deal.title}” com ${clientName(deal.clientId)}`
              : `“${deal.title}” movido para ${label}`
          return {
            ...d,
            deals: d.deals.map((x) =>
              x.id === id ? { ...x, stage, lastActivityAt: now(), closedAt: closed ? now() : undefined } : x,
            ),
            activities: [activity(type, text, id), ...d.activities],
          }
        }),
      deleteDeal: (id) =>
        setDb((d) => ({
          ...d,
          deals: d.deals.filter((x) => x.id !== id),
          proposals: d.proposals.filter((p) => p.dealId !== id),
        })),

      createProposal: (dealId) => {
        const deal = db.deals.find((d) => d.id === dealId)!
        const number = Math.max(1000, ...db.proposals.map((p) => p.number)) + 1
        const p: Proposal = {
          id: 'p' + uid(),
          number,
          dealId,
          clientId: deal.clientId,
          title: deal.title,
          intro:
            'Desenhamos esta proposta a partir do diagnóstico realizado em nossa reunião. O objetivo é acelerar seu crescimento com previsibilidade e execução impecável.',
          items: [{ id: uid(), description: `${deal.title} — escopo principal`, qty: 1, price: deal.value }],
          discount: 0,
          installments: 6,
          status: 'rascunho',
          validUntil: new Date(Date.now() + 15 * 86_400_000).toISOString(),
          createdAt: now(),
        }
        setDb((d) => ({ ...d, proposals: [p, ...d.proposals] }))
        return p
      },
      saveProposal: (p) => setDb((d) => ({ ...d, proposals: d.proposals.map((x) => (x.id === p.id ? p : x)) })),
      setProposalStatus: (id, status) =>
        setDb((d) => {
          const p = d.proposals.find((x) => x.id === id)
          if (!p) return d
          const patch: Partial<Proposal> = { status }
          let deals = d.deals
          let acts = d.activities
          if (status === 'enviada') {
            acts = [activity('proposal_sent', `Proposta #${p.number} enviada para ${clientName(p.clientId)}`, p.dealId), ...acts]
            deals = deals.map((x) => (x.id === p.dealId && ['lead', 'qualificado', 'reuniao'].includes(x.stage) ? { ...x, stage: 'proposta', lastActivityAt: now() } : x))
          }
          if (status === 'visualizada') patch.viewedAt = now()
          if (status === 'aceita') {
            patch.acceptedAt = now()
            const total = proposalTotal(p)
            deals = deals.map((x) => (x.id === p.dealId ? { ...x, stage: 'ganho', value: total, closedAt: now(), lastActivityAt: now() } : x))
            acts = [activity('proposal_accepted', `${clientName(p.clientId)} aceitou a proposta #${p.number} 🎉`, p.dealId), ...acts]
          }
          return { ...d, deals, activities: acts, proposals: d.proposals.map((x) => (x.id === id ? { ...x, ...patch } : x)) }
        }),
      updateWorkspace: (patch) => setDb((d) => ({ ...d, workspace: { ...d.workspace, ...patch } })),
    }
  }, [db, session, toasts, toast])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore fora do StoreProvider')
  return ctx
}

export function proposalSubtotal(p: Pick<Proposal, 'items'>) {
  return p.items.reduce((s, i) => s + i.qty * i.price, 0)
}

export function proposalTotal(p: Pick<Proposal, 'items' | 'discount'>) {
  return Math.max(0, proposalSubtotal(p) * (1 - p.discount / 100))
}
