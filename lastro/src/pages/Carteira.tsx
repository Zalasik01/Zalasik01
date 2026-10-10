import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Info, RotateCcw, Search } from 'lucide-react'
import { useStore } from '../lib/store'
import { nivel, type Nivel } from '../lib/engine'
import { cn, money, moneyK, pct } from '../lib/format'
import { Button, NivelPill, Panel, PanelHead, Stat } from '../components/ui'

export function CenarioToggle() {
  const { cenario, setCenario } = useStore()
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <div className="inline-flex rounded-lg border border-line bg-surface p-0.5" role="group" aria-label="Cenário de transição">
        {(
          [
            ['pior', 'Pior caso'],
            ['neutro', 'Sem bitributação'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} onClick={() => setCenario(id)} className={cn('rounded-md px-3 py-1.5', cenario === id ? 'bg-ink text-paper' : 'text-muted hover:text-ink')}>
            {label}
          </button>
        ))}
      </div>
      <span className="group relative inline-flex items-center gap-1 text-xs text-muted">
        <Info size={14} />
        <span className="hidden sm:inline">Regra de transição</span>
        <span className="pointer-events-none absolute top-6 right-0 z-10 hidden w-72 rounded-lg border border-line bg-surface p-3 text-xs leading-relaxed text-ink shadow-lg group-hover:block">
          A Resolução CGSN 190/2026 não definiu como ficam as notas emitidas em 2026 e recebidas em 2027. No <b>pior caso</b>, elas são tributadas no recebimento e as notas de 2027 na emissão, somando os dois DAS no início do ano.
        </span>
      </span>
    </div>
  )
}

export default function Carteira() {
  const { empresas, analise, restaurar, avisar } = useStore()
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState<'todos' | Nivel>('todos')

  const linhas = useMemo(
    () =>
      empresas
        .map((e) => {
          const a = analise(e)
          return { e, a, n: nivel(a.picoSobreFaturamento) }
        })
        .sort((x, y) => y.a.picoCapitalDeGiro - x.a.picoCapitalDeGiro),
    [empresas, analise],
  )
  const visiveis = linhas.filter((l) => (filtro === 'todos' || l.n === filtro) && `${l.e.nome} ${l.e.cnpj} ${l.e.segmento}`.toLowerCase().includes(q.toLowerCase()))
  const soma = (f: (l: (typeof linhas)[number]) => number) => linhas.reduce((s, l) => s + f(l), 0)
  const criticos = linhas.filter((l) => l.n === 'critico').length
  const atencao = linhas.filter((l) => l.n === 'atencao').length

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Carteira · {empresas.length} empresas do Simples Nacional</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Quem vai ficar sem caixa em 2027</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-muted">
            A partir de janeiro, o DAS é calculado sobre as notas emitidas, não sobre o que entrou na conta. Esta é a diferença de caixa que cada cliente vai precisar cobrir.
          </p>
        </div>
        <CenarioToggle />
      </div>

      <Panel className="grid grid-cols-2 gap-6 p-5 lg:grid-cols-4">
        <Stat label="Clientes em risco" value={`${criticos + atencao} de ${linhas.length}`} sub={`${criticos} críticos · ${atencao} em atenção`} tone={criticos ? 'gap' : 'ok'} />
        <Stat label="Capital de giro a reservar" value={moneyK(soma((l) => l.a.picoCapitalDeGiro))} sub="soma dos picos de cada cliente" tone="gap" />
        <Stat label="Recebíveis de 2026 que caem em 2027" value={moneyK(soma((l) => l.a.recebiveisAntigos2027))} sub="sem regra de transição definida" tone="warn" />
        <Stat label="DAS sobre vendas não recebidas" value={moneyK(soma((l) => l.a.impostoSobreCalote))} sub="custo anual estimado da inadimplência" />
      </Panel>

      <Panel>
        <PanelHead
          title="Empresas por exposição"
          hint="Ordenadas pelo maior valor que precisarão desembolsar antes de receber."
          action={
            <div className="flex flex-wrap gap-2">
              <label className="relative">
                <span className="sr-only">Buscar empresa</span>
                <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
                <input id="busca-carteira" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar empresa ou CNPJ" className="h-9 w-56 rounded-lg border border-line bg-paper pr-3 pl-9 text-sm outline-none focus:border-accent" />
              </label>
              <select id="filtro-nivel" aria-label="Filtrar por nível" value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)} className="h-9 rounded-lg border border-line bg-paper px-3 text-sm">
                <option value="todos">Todos os níveis</option>
                <option value="critico">Crítico</option>
                <option value="atencao">Atenção</option>
                <option value="estavel">Estável</option>
              </select>
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-5 py-3 font-medium">Empresa</th>
                <th className="px-3 py-3 font-medium">Nível</th>
                <th className="px-3 py-3 text-right font-medium">Alíquota efetiva</th>
                <th className="px-3 py-3 text-right font-medium">Prazo médio</th>
                <th className="px-3 py-3 text-right font-medium">Inadimplência</th>
                <th className="px-3 py-3 text-right font-medium">Caixa a reservar</th>
                <th className="px-3 py-3 text-right font-medium">% do faturamento mensal</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {visiveis.map(({ e, a, n }) => (
                <tr key={e.id} className="border-b border-line last:border-0 hover:bg-sunken">
                  <td className="px-5 py-3.5">
                    <Link to={`/app/empresa/${e.id}`} className="font-medium hover:text-accent">
                      {e.nome}
                    </Link>
                    <p className="text-xs text-muted">
                      <span className="num">{e.cnpj}</span> · Anexo {e.anexo} · {e.segmento}
                    </p>
                  </td>
                  <td className="px-3 py-3.5">
                    <NivelPill nivel={n} />
                  </td>
                  <td className="num px-3 py-3.5 text-right">{pct(a.aliquota, 2)}</td>
                  <td className="num whitespace-nowrap px-3 py-3.5 text-right">{Math.round(a.comportamento.prazoMedio)} dias</td>
                  <td className="num px-3 py-3.5 text-right">{pct(a.comportamento.inadimplencia)}</td>
                  <td className={cn('num px-3 py-3.5 text-right font-semibold', n === 'critico' && 'text-gap')}>{money(a.picoCapitalDeGiro)}</td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-sunken">
                        <div className={cn('h-full rounded-full', n === 'critico' ? 'bg-gap' : n === 'atencao' ? 'bg-warn' : 'bg-ok')} style={{ width: `${Math.min(100, a.picoSobreFaturamento * 100)}%` }} />
                      </div>
                      <span className="num w-12 text-right">{pct(a.picoSobreFaturamento, 0)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link to={`/app/empresa/${e.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                      Diagnóstico <ArrowUpRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted">
                    Nenhuma empresa encontrada com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-faint">
        <p>Carteira de demonstração com notas fictícias. Importe as notas de um cliente real em “Importar empresa”.</p>
        <Button
          variant="ghost"
          className="h-8 text-xs"
          onClick={() => {
            restaurar()
            avisar('Carteira de demonstração restaurada')
          }}
        >
          <RotateCcw size={13} /> Restaurar demonstração
        </Button>
      </div>
    </div>
  )
}
