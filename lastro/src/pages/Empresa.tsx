import { useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, Copy, MessageSquareText, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { ANO_VIRADA, aReceber, concentracao, nivel, notasDeTransicao, parse } from '../lib/engine'
import { ANEXOS, faixaDe } from '../lib/simples'
import { cn, dataBR, money, moneyK, pct } from '../lib/format'
import { gerarPlano, mensagemCliente, mensagemCobranca } from '../lib/plano'
import { Button, NivelPill, Panel, PanelHead, Stat, copiar } from '../components/ui'
import { CenarioToggle } from './Carteira'

const ABAS = [
  ['diagnostico', 'Diagnóstico 2027'],
  ['recebiveis', 'Recebíveis'],
  ['plano', 'Plano de ação'],
  ['ibscbs', 'IBS/CBS no DAS?'],
] as const
type Aba = (typeof ABAS)[number][0]

function Dica({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold capitalize">
        {label}/{ANO_VIRADA}
      </p>
      {payload.map((p) => (
        <p key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="num">{money(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function EmpresaPage() {
  const { id } = useParams()
  const { empresas, analise, hoje, avisar, remover, atualizar } = useStore()
  const [params, setParams] = useSearchParams()
  const aba = (params.get('aba') as Aba) || 'diagnostico'
  const e = empresas.find((x) => x.id === id)
  const a = e ? analise(e) : null
  const plano = useMemo(() => (e && a ? gerarPlano(e, a, hoje) : []), [e, a, hoje])
  const [confirmar, setConfirmar] = useState(false)
  if (!e || !a) return <Navigate to="/app" replace />

  const n = nivel(a.picoSobreFaturamento)
  const rec = aReceber(e, hoje)
  const transicao = new Set(notasDeTransicao(e, hoje).map((x) => x.id))
  const conc = concentracao(e)
  const faixa = faixaDe(e.anexo, a.rbt12)
  const msg = mensagemCliente(e, a, plano)
  const lagRotulos = ['No mês', '+1 mês', '+2 meses', '+3 meses', '+4 meses', '+5 meses', '+6 ou mais']

  return (
    <div className="space-y-6 animate-rise">
      <Link to="/app" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} /> Carteira
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">{e.nome}</h1>
            <NivelPill nivel={n} />
          </div>
          <p className="mt-1 text-sm text-muted">
            <span className="num">{e.cnpj}</span> · {e.segmento} · {e.cidade} · {ANEXOS[e.anexo].nome}, {faixa.indice + 1}ª faixa
          </p>
        </div>
        <CenarioToggle />
      </div>

      <Panel className="grid grid-cols-2 gap-6 p-5 lg:grid-cols-5">
        <Stat label="Caixa a reservar" value={money(a.picoCapitalDeGiro)} sub={`pico em ${a.mesPico}/${ANO_VIRADA}`} tone={n === 'critico' ? 'gap' : n === 'atencao' ? 'warn' : 'ok'} />
        <Stat label="Receita bruta 12 meses" value={moneyK(a.rbt12)} sub={`alíquota efetiva ${pct(a.aliquota, 2)}`} />
        <Stat label="Prazo médio de recebimento" value={`${Math.round(a.comportamento.prazoMedio)} dias`} sub={`atraso médio ${Math.round(a.comportamento.atrasoMedio)} dias`} />
        <Stat label="Inadimplência" value={pct(a.comportamento.inadimplencia)} sub={`${money(a.impostoSobreCalote)}/ano de DAS sem receber`} />
        <Stat label="DAS em 2027" value={moneyK(a.dasAnoFaturamento)} sub={`vs. ${moneyK(a.dasAnoCaixa)} pela regra de caixa`} />
      </Panel>

      <div className="flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {ABAS.map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={aba === k}
            onClick={() => setParams({ aba: k })}
            className={cn('-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm', aba === k ? 'border-accent font-semibold text-ink' : 'border-transparent text-muted hover:text-ink')}
          >
            {label}
            {k === 'plano' && <span className="num ml-1.5 rounded bg-sunken px-1.5 text-xs">{plano.length}</span>}
          </button>
        ))}
      </div>

      {aba === 'diagnostico' && (
        <div className="grid gap-6 xl:grid-cols-3">
          <Panel className="xl:col-span-2">
            <PanelHead title="DAS mês a mês em 2027" hint="Barras: imposto pela regra antiga (caixa) e pela nova (faturamento). Linha: diferença acumulada que sai do caixa da empresa." />
            <div className="h-80 px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={a.meses} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="rotulo" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => moneyK(v).replace('R$ ', '')} />
                  <Tooltip content={<Dica />} cursor={{ fill: 'var(--sunken)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} iconType="circle" iconSize={8} />
                  <Bar dataKey="dasCaixa" name="DAS pela regra de caixa" fill="var(--chart-b)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="dasFaturamento" name="DAS pela regra de faturamento" fill="var(--chart-a)" radius={[3, 3, 0, 0]} />
                  <Line dataKey="acumulado" name="Diferença acumulada" stroke="var(--gap)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Como os clientes pagam" hint="Parte de cada R$ 100 faturados que entra em cada mês, pelas notas dos últimos 12 meses." />
            <div className="space-y-2.5 p-5">
              {a.comportamento.lag.map((f, i) => (
                <div key={i} className="grid grid-cols-[80px_1fr_56px] items-center gap-3 text-sm">
                  <span className="text-muted">{lagRotulos[i]}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-sunken">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${f * 100}%` }} />
                  </div>
                  <span className="num text-right">{money(f * 100)}</span>
                </div>
              ))}
              <div className="grid grid-cols-[80px_1fr_56px] items-center gap-3 text-sm">
                <span className="text-gap">Não pagou</span>
                <div className="h-2 overflow-hidden rounded-full bg-sunken">
                  <div className="h-full rounded-full bg-gap" style={{ width: `${a.comportamento.inadimplencia * 100}%` }} />
                </div>
                <span className="num text-right text-gap">{money(a.comportamento.inadimplencia * 100)}</span>
              </div>
              <p className="pt-3 text-xs leading-relaxed text-muted">
                Tudo o que não entra no mesmo mês da nota vira imposto pago antes do dinheiro. Notas emitidas até dez/{ANO_VIRADA - 1} e recebidas em {ANO_VIRADA}: <b className="num text-ink">{money(a.recebiveisAntigos2027)}</b>.
              </p>
            </div>
          </Panel>

          <Panel className="xl:col-span-3">
            <PanelHead title="Tabela da projeção" hint={`Faturamento projetado com crescimento de ${pct(e.crescimento, 0)} sobre o mesmo mês do último ano.`} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-line text-right text-xs text-muted">
                    <th className="px-5 py-2.5 text-left font-medium">Mês</th>
                    <th className="px-3 py-2.5 font-medium">Faturado</th>
                    <th className="px-3 py-2.5 font-medium">Recebido (notas {ANO_VIRADA})</th>
                    <th className="px-3 py-2.5 font-medium">Recebido (notas antigas)</th>
                    <th className="px-3 py-2.5 font-medium">DAS caixa</th>
                    <th className="px-3 py-2.5 font-medium">DAS faturamento</th>
                    <th className="px-5 py-2.5 font-medium">Diferença acumulada</th>
                  </tr>
                </thead>
                <tbody className="num">
                  {a.meses.map((m) => (
                    <tr key={m.chave} className="border-b border-line text-right last:border-0">
                      <td className="px-5 py-2 text-left font-sans capitalize">
                        {m.rotulo}/{String(ANO_VIRADA).slice(2)}
                      </td>
                      <td className="px-3 py-2">{money(m.faturado)}</td>
                      <td className="px-3 py-2">{money(m.recebidoNotas2027)}</td>
                      <td className="px-3 py-2 text-muted">{money(m.recebidoNotasAntigas)}</td>
                      <td className="px-3 py-2">{money(m.dasCaixa)}</td>
                      <td className="px-3 py-2">{money(m.dasFaturamento)}</td>
                      <td className={cn('px-5 py-2 font-semibold', m.acumulado > 0 ? 'text-gap' : 'text-ok')}>{money(m.acumulado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {aba === 'recebiveis' && (
        <div className="grid gap-6 xl:grid-cols-3">
          <Panel>
            <PanelHead title="A receber por cliente" hint={`${money(rec.totalVencido + rec.totalAVencer)} em aberto · ${money(rec.totalVencido)} vencido`} />
            <ul className="divide-y divide-line">
              {conc.map((c) => (
                <li key={c.cliente} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.cliente}</p>
                    <p className="text-xs text-muted">
                      {c.notas} {c.notas === 1 ? 'nota' : 'notas'} · {pct(c.participacao, 0)} do total
                    </p>
                  </div>
                  <span className="num text-sm">{money(c.valor)}</span>
                  <button
                    title={`Copiar mensagem de cobrança para ${c.cliente}`}
                    aria-label={`Copiar mensagem de cobrança para ${c.cliente}`}
                    onClick={() => copiar(mensagemCobranca(e.nome, c.cliente, c.valor, c.notas), avisar, 'Mensagem de cobrança copiada')}
                    className="rounded-md p-1.5 text-muted hover:bg-sunken hover:text-accent"
                  >
                    <MessageSquareText size={16} />
                  </button>
                </li>
              ))}
              {conc.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted">Nada em aberto.</li>}
            </ul>
          </Panel>

          <Panel className="xl:col-span-2">
            <PanelHead title="Notas em aberto" hint={`Coluna “DAS antecipado”: quanto cada nota custaria em imposto antes de ser paga, pela regra de ${ANO_VIRADA}.`} />
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-line text-left text-xs text-muted">
                    <th className="px-5 py-2.5 font-medium">Cliente</th>
                    <th className="px-3 py-2.5 font-medium">Emissão</th>
                    <th className="px-3 py-2.5 font-medium">Vencimento</th>
                    <th className="px-3 py-2.5 font-medium">Situação</th>
                    <th className="px-3 py-2.5 text-right font-medium">Valor</th>
                    <th className="px-5 py-2.5 text-right font-medium">DAS antecipado</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rec.abertas]
                    .sort((x, y) => x.vencimento.localeCompare(y.vencimento))
                    .map((nota) => {
                      const atraso = Math.floor((hoje.getTime() - parse(nota.vencimento).getTime()) / 86_400_000)
                      return (
                        <tr key={nota.id} className="border-b border-line last:border-0">
                          <td className="px-5 py-2.5">{nota.cliente}</td>
                          <td className="num px-3 py-2.5 text-muted">{dataBR(nota.emissao)}</td>
                          <td className="num px-3 py-2.5">{dataBR(nota.vencimento)}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {atraso > 0 ? (
                                <span className="rounded bg-gap-soft px-1.5 py-0.5 text-xs font-medium text-gap">vencida há {atraso}d</span>
                              ) : (
                                <span className="rounded bg-sunken px-1.5 py-0.5 text-xs text-muted">a vencer</span>
                              )}
                              {transicao.has(nota.id) && <span className="rounded bg-warn-soft px-1.5 py-0.5 text-xs font-medium text-warn">cai em {ANO_VIRADA}</span>}
                            </div>
                          </td>
                          <td className="num px-3 py-2.5 text-right">{money(nota.valor)}</td>
                          <td className="num px-5 py-2.5 text-right text-gap">{money(nota.valor * a.aliquota)}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {aba === 'plano' && (
        <div className="grid gap-6 xl:grid-cols-5">
          <Panel className="xl:col-span-3">
            <PanelHead title="O que fazer, em ordem" hint="Gerado a partir das notas da empresa. Valores recalculam ao trocar o cenário." />
            <ol className="divide-y divide-line">
              {plano.map((acao, i) => (
                <li key={acao.id} className="flex gap-4 px-5 py-4">
                  <span
                    className={cn(
                      'num flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                      acao.prioridade === 'alta' ? 'bg-gap-soft text-gap' : acao.prioridade === 'media' ? 'bg-warn-soft text-warn' : 'bg-sunken text-muted',
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="font-semibold">{acao.titulo}</p>
                      <span className="text-xs text-muted">{acao.quando}</span>
                    </div>
                    <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-muted">{acao.detalhe}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel className="h-fit xl:col-span-2">
            <PanelHead
              title="Mensagem para o cliente"
              hint="Pronta para enviar por WhatsApp ou e-mail."
              action={
                <Button className="h-8 px-3 text-xs" onClick={() => copiar(msg, avisar, 'Mensagem copiada')}>
                  <Copy size={14} /> Copiar
                </Button>
              }
            />
            <pre className="whitespace-pre-wrap p-5 font-sans text-sm leading-relaxed">{msg}</pre>
          </Panel>
        </div>
      )}

      {aba === 'ibscbs' && <IbsCbs empresaId={e.id} vendaParaCredito={e.vendaParaCredito} aliquota={a.aliquota} anexo={e.anexo} rbt12={a.rbt12} onChange={(v) => atualizar(e.id, { vendaParaCredito: v })} />}

      <div className="flex justify-end border-t border-line pt-4">
        {confirmar ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Remover {e.nome} da carteira?</span>
            <Button variant="ghost" onClick={() => setConfirmar(false)}>
              Cancelar
            </Button>
            <Button
              className="text-gap"
              onClick={() => {
                remover(e.id)
                avisar('Empresa removida')
              }}
            >
              Remover
            </Button>
          </div>
        ) : (
          <Button variant="ghost" className="text-xs" onClick={() => setConfirmar(true)}>
            <Trash2 size={14} /> Remover da carteira
          </Button>
        )}
      </div>
    </div>
  )
}

// Parcela de PIS + Cofins dentro do DAS (aprox., faixas intermediárias da LC 123). Serve de referência
// para o crédito que o comprador consegue tomar enquanto a empresa recolhe IBS/CBS dentro do DAS.
const PARCELA_PIS_COFINS: Record<string, number> = { I: 0.155, II: 0.14, III: 0.156, IV: 0.1715, V: 0.1715 }
const CBS_ESTIMADA = 0.092 // estimativa de referência (CGIBS, Res. 14/2026); a alíquota definitiva é fixada pelo Senado

function IbsCbs({ vendaParaCredito, aliquota, anexo, rbt12, onChange }: { empresaId: string; vendaParaCredito: number; aliquota: number; anexo: string; rbt12: number; onChange: (v: number) => void }) {
  const [compras, setCompras] = useState(0.35)
  const creditoDas = aliquota * PARCELA_PIS_COFINS[anexo]!
  const perdaCliente = Math.max(0, CBS_ESTIMADA - creditoDas)
  const vendasCredito = rbt12 * vendaParaCredito
  const custoForaDas = CBS_ESTIMADA * (1 - compras) - creditoDas
  const recomenda = vendaParaCredito >= 0.6 && perdaCliente > 0.05

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <Panel className="xl:col-span-3">
        <PanelHead title="Triagem: vale tirar IBS/CBS do DAS?" hint={`Próxima janela de opção: 1º a 31 de março de ${ANO_VIRADA}, valendo para o 2º semestre.`} />
        <div className="space-y-6 p-5">
          <label htmlFor="venda-credito" className="block">
            <span className="flex justify-between text-sm font-medium">
              Receita vendida a empresas que tomam crédito <span className="num">{pct(vendaParaCredito, 0)}</span>
            </span>
            <input id="venda-credito" type="range" min={0} max={1} step={0.01} value={vendaParaCredito} onChange={(ev) => onChange(Number(ev.target.value))} className="mt-2 w-full accent-[var(--accent)]" />
            <span className="text-xs text-faint">Clientes do Lucro Real ou Presumido. Consumidor final e empresas do Simples não contam.</span>
          </label>
          <label htmlFor="compras-credito" className="block">
            <span className="flex justify-between text-sm font-medium">
              Compras e insumos com crédito, sobre a receita <span className="num">{pct(compras, 0)}</span>
            </span>
            <input id="compras-credito" type="range" min={0} max={0.9} step={0.01} value={compras} onChange={(ev) => setCompras(Number(ev.target.value))} className="mt-2 w-full accent-[var(--accent)]" />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Crédito que o cliente toma hoje" value={pct(creditoDas, 2)} sub="da compra, com IBS/CBS no DAS" />
            <Stat label="Crédito fora do DAS" value={`≈ ${pct(CBS_ESTIMADA, 1)}`} sub="CBS de referência estimada" />
            <Stat label="Crédito que seus clientes perdem/ano" value={moneyK(vendasCredito * perdaCliente)} sub="argumento de negociação deles" tone="warn" />
          </div>

          <div className={cn('rounded-lg p-4 text-sm leading-relaxed', recomenda ? 'bg-accent-soft' : 'bg-sunken')}>
            <p className="font-semibold">{recomenda ? 'Vale simular com os XMLs antes de março.' : 'Manter IBS/CBS no DAS parece adequado por enquanto.'}</p>
            <p className="mt-1 text-muted">
              {recomenda
                ? `A maior parte da receita vem de compradores que valorizam crédito. Fora do DAS, o custo líquido estimado de CBS seria de ${pct(Math.max(0, custoForaDas), 1)} da receita, em troca de transferir crédito integral e evitar pedidos de desconto.`
                : 'Poucos clientes tomam crédito, então o benefício de transferir crédito integral tende a não compensar a apuração fora do DAS.'}
            </p>
          </div>
          <p className="text-xs leading-relaxed text-faint">
            Triagem simplificada para priorizar a carteira. Usa a CBS de referência estimada pelo CGIBS (Res. 14/2026) e a parcela aproximada de PIS/Cofins no DAS. A decisão deve usar a apuração completa com os XMLs de entrada e saída.
          </p>
        </div>
      </Panel>
      <Panel className="h-fit xl:col-span-2">
        <PanelHead title="Por que isso importa" />
        <div className="space-y-3 p-5 text-sm leading-relaxed text-muted">
          <p>Empresas do Simples podem recolher IBS e CBS fora do DAS e continuar no Simples para os demais tributos (o “Simples híbrido”).</p>
          <p>No DAS, o comprador só aproveita como crédito o valor de IBS/CBS embutido na guia. Fora dele, aproveita o valor integral. Para quem vende a médias e grandes empresas, isso vira critério de escolha de fornecedor.</p>
          <p>A opção feita em março vale para o 2º semestre de {ANO_VIRADA} e continua valendo nos períodos seguintes até a empresa desistir.</p>
        </div>
      </Panel>
    </div>
  )
}
