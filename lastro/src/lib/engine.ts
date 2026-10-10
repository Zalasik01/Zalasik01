// Motor de cálculo do Lastro. Funções puras: recebem os dados e a data de referência, sem tocar no navegador.
import { aliquotaEfetiva, type Anexo } from './simples.ts'

export interface Nota {
  id: string
  cliente: string
  emissao: string // AAAA-MM-DD
  vencimento: string
  valor: number
  pagoEm?: string
}

export interface Empresa {
  id: string
  nome: string
  cnpj: string
  anexo: Anexo
  segmento: string
  cidade: string
  responsavel: string
  telefone: string
  crescimento: number // fração anual esperada para 2027
  vendaParaCredito: number // fração da receita vendida a empresas fora do Simples (tomam crédito de IBS/CBS)
  notas: Nota[]
}

export type Cenario = 'pior' | 'neutro'

const DAY = 86_400_000
export const ANO_VIRADA = 2027

export const parse = (iso: string) => new Date(iso + 'T12:00:00')
export const chave = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const addMeses = (ano: number, mes: number, n: number) => {
  const d = new Date(ano, mes + n, 1)
  return { ano: d.getFullYear(), mes: d.getMonth() }
}
const dias = (a: Date, b: Date) => (b.getTime() - a.getTime()) / DAY
const soma = (xs: number[]) => xs.reduce((s, x) => s + x, 0)

/** Últimos 12 meses completos antes de `hoje`, do mais antigo para o mais recente. */
export function historico(e: Empresa, hoje: Date) {
  const meses = Array.from({ length: 12 }, (_, i) => {
    const { ano, mes } = addMeses(hoje.getFullYear(), hoje.getMonth(), i - 12)
    return { chave: chave(new Date(ano, mes, 1)), ano, mes, faturado: 0, recebido: 0 }
  })
  const idx = new Map(meses.map((m, i) => [m.chave, i]))
  for (const n of e.notas) {
    const f = idx.get(chave(parse(n.emissao)))
    if (f !== undefined) meses[f]!.faturado += n.valor
    if (n.pagoEm) {
      const r = idx.get(chave(parse(n.pagoEm)))
      if (r !== undefined) meses[r]!.recebido += n.valor
    }
  }
  return meses
}

/** Comportamento de recebimento observado em notas "maduras" (emitidas há mais de 180 dias). */
export function comportamento(e: Empresa, hoje: Date) {
  const maduras = e.notas.filter((n) => dias(parse(n.emissao), hoje) >= 180)
  const total = soma(maduras.map((n) => n.valor)) || 1
  const lag = Array(7).fill(0) as number[]
  let somaPrazo = 0
  let pago = 0
  for (const n of maduras) {
    if (!n.pagoEm) continue
    const em = parse(n.emissao)
    const pg = parse(n.pagoEm)
    const k = Math.min(6, (pg.getFullYear() - em.getFullYear()) * 12 + pg.getMonth() - em.getMonth())
    lag[Math.max(0, k)]! += n.valor / total
    somaPrazo += dias(em, pg) * n.valor
    pago += n.valor
  }
  const inadimplencia = Math.max(0, 1 - soma(lag))
  const prazoMedio = pago ? somaPrazo / pago : 0
  const atrasos = e.notas.filter((n) => n.pagoEm).map((n) => Math.max(0, dias(parse(n.vencimento), parse(n.pagoEm!))))
  const atrasoMedio = atrasos.length ? soma(atrasos) / atrasos.length : 0
  return { lag, inadimplencia, prazoMedio, atrasoMedio }
}

export function aReceber(e: Empresa, hoje: Date) {
  const abertas = e.notas.filter((n) => !n.pagoEm)
  const vencidas = abertas.filter((n) => parse(n.vencimento) < hoje)
  const aVencer = abertas.filter((n) => parse(n.vencimento) >= hoje)
  return {
    abertas,
    vencidas,
    aVencer,
    totalVencido: soma(vencidas.map((n) => n.valor)),
    totalAVencer: soma(aVencer.map((n) => n.valor)),
  }
}

export interface MesProjetado {
  chave: string
  rotulo: string
  faturado: number
  recebidoNotas2027: number
  recebidoNotasAntigas: number
  dasCaixa: number
  dasFaturamento: number
  diferenca: number
  acumulado: number
}

const ROTULOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/**
 * Projeta 2027 nas duas regras:
 * - caixa (como era): DAS sobre o que foi recebido no mês;
 * - faturamento (CGSN 190/2026): DAS sobre as notas emitidas no mês.
 * No cenário "pior", recebimentos de notas emitidas até 2026 também são tributados em 2027
 * (a resolução não trouxe regra de transição para esses recebíveis).
 */
export function projecao(e: Empresa, hoje: Date, cenario: Cenario = 'pior') {
  const hist = historico(e, hoje)
  const comp = comportamento(e, hoje)
  const rbt12 = soma(hist.map((m) => m.faturado))
  const aliquota = aliquotaEfetiva(e.anexo, rbt12)
  const porMes = new Map(hist.map((m) => [m.mes, m.faturado]))
  const base = (mes: number) => porMes.get(mes) ?? rbt12 / 12

  // Recebíveis de notas emitidas antes de 2027 que caem em 2027.
  const antigos = Array(12).fill(0) as number[]
  const lancar = (ano: number, mes: number, valor: number) => {
    if (ano === ANO_VIRADA) antigos[mes]! += valor
  }
  for (const n of e.notas) {
    if (n.pagoEm) continue
    const venc = parse(n.vencimento)
    const atrasado = dias(venc, hoje)
    const chance = atrasado > 60 ? 0.3 : 1 - comp.inadimplencia
    const previsto = new Date(Math.max(venc.getTime(), hoje.getTime()) + comp.atrasoMedio * DAY)
    lancar(previsto.getFullYear(), previsto.getMonth(), n.valor * chance)
  }
  // Notas que ainda serão emitidas até dezembro do ano anterior à virada.
  const jaEmitidoMesAtual = soma(e.notas.filter((n) => chave(parse(n.emissao)) === chave(hoje)).map((n) => n.valor))
  for (let k = 0; ; k++) {
    const { ano, mes } = addMeses(hoje.getFullYear(), hoje.getMonth(), k)
    if (ano >= ANO_VIRADA) break
    const emitir = k === 0 ? Math.max(0, base(mes) - jaEmitidoMesAtual) : base(mes)
    comp.lag.forEach((frac, j) => {
      const r = addMeses(ano, mes, j + (k === 0 ? 1 : 0))
      lancar(r.ano, r.mes, emitir * frac)
    })
  }

  const faturado = ROTULOS.map((_, m) => base(m) * (1 + e.crescimento))
  let acumulado = 0
  const meses: MesProjetado[] = faturado.map((fat, m) => {
    const recebido2027 = soma(comp.lag.map((frac, j) => (m - j >= 0 ? faturado[m - j]! * frac : 0)))
    const dasCaixa = aliquota * (recebido2027 + antigos[m]!)
    const dasFaturamento = aliquota * fat + (cenario === 'pior' ? aliquota * antigos[m]! : 0)
    const diferenca = dasFaturamento - dasCaixa
    acumulado += diferenca
    return {
      chave: `${ANO_VIRADA}-${String(m + 1).padStart(2, '0')}`,
      rotulo: ROTULOS[m]!,
      faturado: fat,
      recebidoNotas2027: recebido2027,
      recebidoNotasAntigas: antigos[m]!,
      dasCaixa,
      dasFaturamento,
      diferenca,
      acumulado,
    }
  })

  const pico = meses.reduce((p, m) => (m.acumulado > p.acumulado ? m : p), meses[0]!)
  const mediaMensal = rbt12 / 12 || 1
  return {
    rbt12,
    aliquota,
    comportamento: comp,
    meses,
    recebiveisAntigos2027: soma(antigos),
    picoCapitalDeGiro: Math.max(0, pico.acumulado),
    mesPico: pico.rotulo,
    picoSobreFaturamento: Math.max(0, pico.acumulado) / mediaMensal,
    impostoSobreCalote: aliquota * soma(faturado) * comp.inadimplencia,
    dasAnoCaixa: soma(meses.map((m) => m.dasCaixa)),
    dasAnoFaturamento: soma(meses.map((m) => m.dasFaturamento)),
  }
}

export type Nivel = 'critico' | 'atencao' | 'estavel'

export function nivel(picoSobreFaturamento: number): Nivel {
  if (picoSobreFaturamento >= 0.4) return 'critico'
  if (picoSobreFaturamento >= 0.15) return 'atencao'
  return 'estavel'
}

/**
 * Preço mínimo para vender a prazo sem perder valor frente à venda à vista.
 * F = (1 − inad) / n × Σ 1/(1+i)^(t/30) é o valor presente de R$ 1 a receber nas parcelas.
 * Regra de caixa: o imposto sai junto com o recebimento → x = P / F.
 * Regra de faturamento: o imposto sai na emissão, inclusive sobre o que não for pago → x = P(1 − a) / (F − a).
 */
export function precoAPrazo(p: { valorAVista: number; aliquota: number; parcelasDias: number[]; jurosMes: number; inadimplencia: number }) {
  const { valorAVista: P, aliquota: a, parcelasDias, jurosMes: i, inadimplencia: d } = p
  const desconto = (t: number) => 1 / Math.pow(1 + i, t / 30)
  const vp = soma(parcelasDias.map(desconto)) / parcelasDias.length
  const F = (1 - d) * vp
  const semRisco = P / vp
  const regraCaixa = P / F
  const viavel = F - a > 0.0001
  const regraFaturamento = viavel ? (P * (1 - a)) / (F - a) : Infinity
  return {
    viavel,
    precoMinimo: regraFaturamento,
    precoMinimoRegraAntiga: regraCaixa,
    custoFinanceiro: semRisco - P,
    custoRisco: regraCaixa - semRisco,
    custoImpostoAntecipado: regraFaturamento - regraCaixa,
    acrescimo: regraFaturamento / P - 1,
    descontoEquivalenteAVista: 1 - P / regraFaturamento,
  }
}

/** Notas emitidas antes da virada que ainda estarão em aberto em 2027. */
export function notasDeTransicao(e: Empresa, hoje: Date) {
  const comp = comportamento(e, hoje)
  return e.notas.filter((n) => {
    if (n.pagoEm || parse(n.emissao).getFullYear() >= ANO_VIRADA) return false
    const previsto = new Date(Math.max(parse(n.vencimento).getTime(), hoje.getTime()) + comp.atrasoMedio * DAY)
    return previsto.getFullYear() >= ANO_VIRADA
  })
}

export function concentracao(e: Empresa) {
  const abertas = e.notas.filter((n) => !n.pagoEm)
  const total = soma(abertas.map((n) => n.valor)) || 1
  const porCliente = new Map<string, { valor: number; notas: number; maisAntiga: string }>()
  for (const n of abertas) {
    const c = porCliente.get(n.cliente) ?? { valor: 0, notas: 0, maisAntiga: n.vencimento }
    c.valor += n.valor
    c.notas += 1
    if (n.vencimento < c.maisAntiga) c.maisAntiga = n.vencimento
    porCliente.set(n.cliente, c)
  }
  return [...porCliente.entries()]
    .map(([cliente, c]) => ({ cliente, ...c, participacao: c.valor / total }))
    .sort((a, b) => b.valor - a.valor)
}
