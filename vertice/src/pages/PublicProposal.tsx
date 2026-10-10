import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Lock, PartyPopper } from 'lucide-react'
import { proposalTotal, useStore } from '../lib/store'
import { date, moneyCents } from '../lib/format'
import { Button } from '../components/ui'
import { ProposalDocument } from '../components/ProposalDocument'

/** Página que o cliente final recebe: sem login, com aceite em um clique. */
export default function PublicProposal() {
  const { id } = useParams()
  const { db, session, setProposalStatus } = useStore()
  const p = db.proposals.find((x) => x.id === id)
  const [plan, setPlan] = useState<number | null>(null)

  useEffect(() => {
    if (p?.status === 'enviada') setProposalStatus(p.id, 'visualizada')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id])

  if (!p) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="font-serif text-3xl">Proposta não encontrada</p>
          <Link to="/" className="mt-4 inline-block text-sm text-gold-300 hover:underline">
            Voltar ao início
          </Link>
        </div>
      </div>
    )
  }

  const client = db.clients.find((c) => c.id === p.clientId)
  const owner = db.members.find((m) => m.id === db.deals.find((d) => d.id === p.dealId)?.ownerId)
  const total = proposalTotal(p)
  const options = [...new Set([1, p.installments])]
  const chosen = plan ?? p.installments
  const accepted = p.status === 'aceita'

  return (
    <div className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl animate-fade-up">
        {session && (
          <Link to={`/app/propostas/${p.id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100">
            <ArrowLeft size={15} /> Voltar ao editor (visível só para você)
          </Link>
        )}
        {p.status === 'rascunho' && (
          <p className="mb-4 rounded-xl border border-white/10 bg-white/[.03] px-4 py-2 text-center text-xs text-ink-400">Pré-visualização de rascunho — o cliente ainda não recebeu esta proposta.</p>
        )}
        <ProposalDocument
          p={p}
          client={client}
          owner={owner}
          workspace={db.workspace.name}
          footer={
            accepted ? (
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                  <PartyPopper size={22} />
                </span>
                <div>
                  <p className="font-medium">Proposta aceita{p.acceptedAt ? ` em ${date(p.acceptedAt)}` : ''}</p>
                  <p className="text-sm text-ink-400">Obrigado pela confiança! Nossa equipe entrará em contato em até 24h para o kickoff.</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">Escolha a forma de pagamento</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {options.map((n) => (
                    <button
                      key={n}
                      onClick={() => setPlan(n)}
                      className={`rounded-xl border p-4 text-left transition ${chosen === n ? 'border-gold-400/60 bg-gold-400/[.06]' : 'border-white/10 hover:border-white/20'}`}
                    >
                      <p className="text-sm font-medium">{n === 1 ? 'À vista' : `${n}× sem juros`}</p>
                      <p className="text-xs text-ink-400">{n === 1 ? moneyCents(total) : `${n} parcelas de ${moneyCents(total / n)}`}</p>
                    </button>
                  ))}
                </div>
                <Button variant="primary" size="lg" className="mt-5 w-full" disabled={p.status === 'rascunho' || p.status === 'recusada'} onClick={() => setProposalStatus(p.id, 'aceita')}>
                  <CheckCircle2 size={18} /> Aceitar proposta
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink-500">
                  <Lock size={11} /> Aceite com validade jurídica · registro de data, hora e IP
                </p>
              </div>
            )
          }
        />
        <p className="mt-8 text-center text-xs text-ink-500">
          Enviado com <Link to="/" className="text-gold-300 hover:underline">Vértice</Link>
        </p>
      </div>
    </div>
  )
}
