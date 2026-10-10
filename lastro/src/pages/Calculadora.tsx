import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { precoAPrazo } from '../lib/engine'
import { JUROS_PADRAO } from '../lib/plano'
import { cn, money, pct } from '../lib/format'
import { Field, Panel, PanelHead, SelectField } from '../components/ui'

const CONDICOES: Record<string, { label: string; dias: number[] }> = {
  avista: { label: 'À vista', dias: [0] },
  d30: { label: '30 dias', dias: [30] },
  d45: { label: '45 dias', dias: [45] },
  d60: { label: '60 dias', dias: [60] },
  d90: { label: '90 dias', dias: [90] },
  p3: { label: '3× (30/60/90)', dias: [30, 60, 90] },
  p6: { label: '6× (30 a 180)', dias: [30, 60, 90, 120, 150, 180] },
  d120: { label: '120 dias', dias: [120] },
}

const num = (s: string) => Number(s.replace(/\./g, '').replace(',', '.')) || 0

export default function Calculadora() {
  const { empresas, analise } = useStore()
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? '')
  const emp = empresas.find((e) => e.id === empresaId)
  const base = emp ? analise(emp) : null
  const [valor, setValor] = useState('50000')
  const [condicao, setCondicao] = useState('d90')
  const [juros, setJuros] = useState(String(JUROS_PADRAO * 100).replace('.', ','))
  const [aliq, setAliq] = useState<string | null>(null)
  const [inad, setInad] = useState<string | null>(null)

  const aliquota = aliq !== null ? num(aliq) / 100 : (base?.aliquota ?? 0.1)
  const inadimplencia = inad !== null ? num(inad) / 100 : (base?.comportamento.inadimplencia ?? 0.02)
  const P = num(valor)
  const i = num(juros) / 100
  const r = precoAPrazo({ valorAVista: P, aliquota, parcelasDias: CONDICOES[condicao]!.dias, jurosMes: i, inadimplencia })

  const tabela = useMemo(
    () =>
      Object.entries(CONDICOES)
        .filter(([k]) => k !== 'avista')
        .map(([k, c]) => ({ k, c, r: precoAPrazo({ valorAVista: 1000, aliquota, parcelasDias: c.dias, jurosMes: i, inadimplencia }) })),
    [aliquota, i, inadimplencia],
  )

  const partes = [
    { label: 'Custo financeiro do prazo', v: r.custoFinanceiro, cls: 'bg-[var(--chart-b)]' },
    { label: 'Risco de não receber', v: r.custoRisco, cls: 'bg-warn' },
    { label: 'Imposto pago antes de receber', v: r.custoImpostoAntecipado, cls: 'bg-gap' },
  ]
  const totalPartes = partes.reduce((s, p) => s + Math.max(0, p.v), 0) || 1

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="eyebrow">Ferramenta de precificação</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Quanto cobrar para vender a prazo</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">
          A partir de {2027}, cada venda a prazo adianta o imposto. Esta conta mostra o preço mínimo para que vender a prazo renda o mesmo que vender à vista.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="h-fit lg:col-span-2">
          <PanelHead title="Dados da venda" />
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-1">
            <SelectField
              label="Usar dados da empresa"
              id="calc-empresa"
              value={empresaId}
              onChange={(ev) => {
                setEmpresaId(ev.target.value)
                setAliq(null)
                setInad(null)
              }}
            >
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </SelectField>
            <Field label="Preço à vista (R$)" id="calc-valor" inputMode="decimal" value={valor} onChange={(ev) => setValor(ev.target.value)} />
            <SelectField label="Condição de pagamento" id="calc-condicao" value={condicao} onChange={(ev) => setCondicao(ev.target.value)}>
              {Object.entries(CONDICOES).map(([k, c]) => (
                <option key={k} value={k}>
                  {c.label}
                </option>
              ))}
            </SelectField>
            <Field label="Alíquota efetiva do Simples (%)" id="calc-aliq" inputMode="decimal" value={aliq ?? (aliquota * 100).toFixed(2).replace('.', ',')} onChange={(ev) => setAliq(ev.target.value)} />
            <Field label="Custo do dinheiro (% ao mês)" id="calc-juros" inputMode="decimal" value={juros} onChange={(ev) => setJuros(ev.target.value)} hint="Juros do capital de giro ou rendimento que a empresa deixa de ter." />
            <Field label="Inadimplência esperada (%)" id="calc-inad" inputMode="decimal" value={inad ?? (inadimplencia * 100).toFixed(1).replace('.', ',')} onChange={(ev) => setInad(ev.target.value)} />
          </div>
        </Panel>

        <div className="space-y-6 lg:col-span-3">
          <Panel className="p-6">
            {r.viavel ? (
              <>
                <p className="eyebrow">Preço mínimo em {CONDICOES[condicao]!.label}</p>
                <p className="num mt-2 text-4xl font-semibold sm:text-5xl">{money(r.precoMinimo)}</p>
                <p className="mt-2 text-sm text-muted">
                  <span className="num font-semibold text-gap">+{pct(r.acrescimo)}</span> sobre o preço à vista. Pela regra de caixa bastariam <span className="num">{money(r.precoMinimoRegraAntiga)}</span>.
                </p>
                <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-sunken">
                  {partes.map((p) => (
                    <div key={p.label} className={p.cls} style={{ width: `${(Math.max(0, p.v) / totalPartes) * 100}%` }} />
                  ))}
                </div>
                <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                  {partes.map((p) => (
                    <div key={p.label}>
                      <dt className="flex items-center gap-2 text-xs text-muted">
                        <span className={cn('h-2 w-2 rounded-full', p.cls)} /> {p.label}
                      </dt>
                      <dd className="num mt-1 font-semibold">{money(p.v)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-6 rounded-lg bg-accent-soft p-4 text-sm">
                  <p className="font-semibold">Alternativa: desconto no Pix à vista</p>
                  <p className="mt-1 text-muted">
                    Se a tabela já usa {money(r.precoMinimo)} como preço a prazo, dá para oferecer até <b className="num text-ink">{pct(r.descontoEquivalenteAVista)}</b> de desconto à vista sem perder nada. O cliente economiza, e a empresa elimina o risco e o imposto adiantado.
                  </p>
                </div>
              </>
            ) : (
              <div>
                <p className="font-display text-xl font-bold text-gap">Não existe preço que compense</p>
                <p className="mt-2 text-sm text-muted">Com esse prazo, juros e inadimplência, o valor presente do que se espera receber fica abaixo do imposto pago na emissão. Encurte o prazo ou exija entrada.</p>
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHead title="Acréscimo mínimo por condição" hint="Mesmos parâmetros, para montar a tabela de preços." />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-line text-right text-xs text-muted">
                    <th className="px-5 py-2.5 text-left font-medium">Condição</th>
                    <th className="px-3 py-2.5 font-medium">Regra de caixa</th>
                    <th className="px-3 py-2.5 font-medium">Regra de faturamento</th>
                    <th className="px-5 py-2.5 font-medium">Desconto Pix equivalente</th>
                  </tr>
                </thead>
                <tbody className="num">
                  {tabela.map(({ k, c, r: t }) => (
                    <tr key={k} className={cn('border-b border-line text-right last:border-0', k === condicao && 'bg-accent-soft')}>
                      <td className="px-5 py-2.5 text-left font-sans">{c.label}</td>
                      <td className="px-3 py-2.5 text-muted">+{pct(t.precoMinimoRegraAntiga / 1000 - 1)}</td>
                      <td className="px-3 py-2.5 font-semibold">{t.viavel ? `+${pct(t.acrescimo)}` : 'inviável'}</td>
                      <td className="px-5 py-2.5">{t.viavel ? pct(t.descontoEquivalenteAVista) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
