import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { proposalSubtotal, proposalTotal } from '../lib/store'
import type { Client, Member, Proposal } from '../lib/types'
import { date, money, moneyCents } from '../lib/format'
import { Logo } from './Logo'

export function ProposalDocument({ p, client, workspace, owner, footer }: { p: Proposal; client?: Client; workspace: string; owner?: Member; footer?: ReactNode }) {
  const subtotal = proposalSubtotal(p)
  const total = proposalTotal(p)
  return (
    <article className="overflow-hidden rounded-3xl border border-white/[.08] bg-ink-900 shadow-2xl">
      <header className="relative overflow-hidden border-b border-white/[.06] px-8 pt-8 pb-10 sm:px-12">
        <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-gold-400/15 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <Logo />
          <span className="text-xs text-ink-500">Proposta #{p.number}</span>
        </div>
        <p className="relative mt-12 text-xs tracking-[0.2em] text-gold-400 uppercase">Proposta comercial para {client?.company}</p>
        <h1 className="relative mt-3 font-serif text-4xl leading-tight sm:text-5xl">{p.title || 'Sem título'}</h1>
        <p className="relative mt-5 max-w-2xl text-sm leading-relaxed text-ink-300 whitespace-pre-line">{p.intro}</p>
        <div className="relative mt-8 flex flex-wrap gap-x-10 gap-y-3 text-xs">
          <div>
            <p className="text-ink-500">Preparada para</p>
            <p className="mt-0.5 text-ink-200">{client?.name}</p>
          </div>
          <div>
            <p className="text-ink-500">Por</p>
            <p className="mt-0.5 text-ink-200">
              {owner?.name ?? 'Equipe'} · {workspace}
            </p>
          </div>
          <div>
            <p className="text-ink-500">Válida até</p>
            <p className="mt-0.5 text-ink-200">{date(p.validUntil)}</p>
          </div>
        </div>
      </header>

      <section className="px-8 py-8 sm:px-12">
        <h2 className="text-xs font-semibold tracking-wider text-ink-400 uppercase">Investimento</h2>
        <div className="mt-4 divide-y divide-white/[.05]">
          {p.items.map((i) => (
            <div key={i.id} className="flex items-start justify-between gap-4 py-4">
              <div className="flex gap-3">
                <Check size={16} className="mt-0.5 shrink-0 text-gold-400" />
                <div>
                  <p className="text-sm text-ink-100">{i.description || 'Item'}</p>
                  {i.qty > 1 && (
                    <p className="text-xs text-ink-500">
                      {i.qty} × {money(i.price)}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm font-medium whitespace-nowrap">{money(i.qty * i.price)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2 border-t border-white/[.08] pt-5 text-sm">
          {p.discount > 0 && (
            <>
              <div className="flex justify-between text-ink-400">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Condição especial (-{p.discount}%)</span>
                <span>-{money(subtotal - total)}</span>
              </div>
            </>
          )}
          <div className="flex items-end justify-between pt-2">
            <span className="text-ink-300">Investimento total</span>
            <span className="font-serif text-4xl text-gold-200">{money(total)}</span>
          </div>
          {p.installments > 1 && (
            <p className="text-right text-xs text-ink-400">
              ou {p.installments}× de {moneyCents(total / p.installments)} sem juros
            </p>
          )}
        </div>
      </section>
      {footer && <footer className="border-t border-white/[.06] bg-white/[.015] px-8 py-6 sm:px-12">{footer}</footer>}
    </article>
  )
}
