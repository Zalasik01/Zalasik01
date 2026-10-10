import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, ExternalLink, Plus, Save, Send, Trash2 } from 'lucide-react'
import { proposalTotal, useStore } from '../lib/store'
import { money, uid } from '../lib/format'
import type { Proposal } from '../lib/types'
import { Badge, Button, Card, Input, Select, Textarea } from '../components/ui'
import { ProposalDocument } from '../components/ProposalDocument'
import { PROPOSAL_STATUS } from './Proposals'

export default function ProposalEditor() {
  const { id } = useParams()
  const { db, saveProposal, setProposalStatus, toast } = useStore()
  const nav = useNavigate()
  const original = db.proposals.find((p) => p.id === id)
  const [p, setP] = useState<Proposal | undefined>(original)
  if (!original || !p) return <Navigate to="/app/propostas" replace />

  const client = db.clients.find((c) => c.id === p.clientId)
  const deal = db.deals.find((d) => d.id === p.dealId)
  const owner = db.members.find((m) => m.id === deal?.ownerId)
  const locked = original.status === 'aceita'
  const dirty = JSON.stringify(p) !== JSON.stringify({ ...original, status: p.status, viewedAt: p.viewedAt, acceptedAt: p.acceptedAt })
  const link = `${location.origin}${location.pathname}#/p/${p.id}`

  const patch = (x: Partial<Proposal>) => setP({ ...p, ...x })
  const patchItem = (itemId: string, x: Partial<Proposal['items'][number]>) => patch({ items: p.items.map((i) => (i.id === itemId ? { ...i, ...x } : i)) })

  const save = () => {
    saveProposal({ ...p, status: original.status, viewedAt: original.viewedAt, acceptedAt: original.acceptedAt })
    toast('Proposta salva')
  }

  const send = async () => {
    save()
    setProposalStatus(p.id, 'enviada')
    setP({ ...p, status: 'enviada' })
    try {
      await navigator.clipboard.writeText(link)
      toast('Proposta enviada · link copiado')
    } catch {
      toast('Proposta enviada')
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link to="/app/propostas" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100">
          <ArrowLeft size={15} /> Propostas
        </Link>
        <Badge color={PROPOSAL_STATUS[original.status].color}>{PROPOSAL_STATUS[original.status].label}</Badge>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link)
                toast('Link copiado')
              } catch {
                toast('Não foi possível copiar', 'error')
              }
            }}
          >
            <Copy size={15} /> Copiar link
          </Button>
          <Button onClick={() => (dirty && save(), nav(`/p/${p.id}`))}>
            <ExternalLink size={15} /> Ver como cliente
          </Button>
          {!locked && (
            <Button onClick={save} disabled={!dirty}>
              <Save size={15} /> Salvar
            </Button>
          )}
          {!locked && original.status === 'rascunho' && (
            <Button variant="primary" onClick={send}>
              <Send size={15} /> Enviar ao cliente
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[440px_1fr]">
        <Card className="h-fit p-5">
          <fieldset disabled={locked} className="space-y-4 disabled:opacity-60">
            <Input label="Título" value={p.title} onChange={(e) => patch({ title: e.target.value })} />
            <Textarea label="Introdução" value={p.intro} onChange={(e) => patch({ intro: e.target.value })} className="min-h-28" />
            <div>
              <p className="mb-2 text-xs font-medium text-ink-300">Itens</p>
              <div className="space-y-2">
                {p.items.map((i) => (
                  <div key={i.id} className="rounded-xl border border-white/[.06] p-3">
                    <input
                      value={i.description}
                      onChange={(e) => patchItem(i.id, { description: e.target.value })}
                      placeholder="Descrição"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-ink-500"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={i.qty}
                        onChange={(e) => patchItem(i.id, { qty: Math.max(1, Number(e.target.value)) })}
                        className="h-8 w-16 rounded-lg border border-white/10 bg-ink-950/60 px-2 text-sm outline-none"
                        aria-label="Quantidade"
                      />
                      <span className="text-xs text-ink-500">×</span>
                      <input
                        type="number"
                        min={0}
                        value={i.price}
                        onChange={(e) => patchItem(i.id, { price: Math.max(0, Number(e.target.value)) })}
                        className="h-8 flex-1 rounded-lg border border-white/10 bg-ink-950/60 px-2 text-sm outline-none"
                        aria-label="Preço unitário"
                      />
                      <button type="button" onClick={() => patch({ items: p.items.filter((x) => x.id !== i.id) })} className="p-1.5 text-ink-500 hover:text-rose-300" aria-label="Remover item">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => patch({ items: [...p.items, { id: uid(), description: '', qty: 1, price: 0 }] })}>
                <Plus size={14} /> Adicionar item
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Desconto (%)" type="number" min={0} max={50} value={p.discount} onChange={(e) => patch({ discount: Math.min(50, Math.max(0, Number(e.target.value))) })} />
              <Select label="Parcelas" value={p.installments} onChange={(e) => patch({ installments: Number(e.target.value) })}>
                {[1, 2, 3, 6, 10, 12].map((n) => (
                  <option key={n} value={n}>
                    {n === 1 ? 'À vista' : `${n}×`}
                  </option>
                ))}
              </Select>
              <Input label="Validade" type="date" value={p.validUntil.slice(0, 10)} onChange={(e) => e.target.value && patch({ validUntil: new Date(e.target.value).toISOString() })} />
            </div>
          </fieldset>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-gold-400/[.06] px-4 py-3">
            <span className="text-sm text-ink-300">Total</span>
            <span className="text-lg font-semibold text-gold-200">{money(proposalTotal(p))}</span>
          </div>
          {original.status === 'enviada' && (
            <p className="mt-4 text-xs leading-relaxed text-ink-500">
              💡 Abra “Ver como cliente” para simular a experiência do seu cliente — a visualização e o aceite atualizam o pipeline em tempo real.
            </p>
          )}
        </Card>

        <div>
          <p className="mb-3 text-xs font-medium text-ink-500">Pré-visualização ao vivo</p>
          <ProposalDocument p={p} client={client} owner={owner} workspace={db.workspace.name} />
        </div>
      </div>
    </div>
  )
}
