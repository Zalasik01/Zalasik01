import { ANO_VIRADA, aReceber, concentracao, notasDeTransicao, precoAPrazo, type Empresa, type projecao } from './engine'
import { money, pct } from './format'

export const JUROS_PADRAO = 0.025 // custo médio de capital de giro para PMEs, ao mês (editável na calculadora)

export interface Acao {
  id: string
  prioridade: 'alta' | 'media' | 'baixa'
  titulo: string
  detalhe: string
  valor?: number
  quando: string
}

export function gerarPlano(e: Empresa, a: ReturnType<typeof projecao>, hoje: Date): Acao[] {
  const acoes: Acao[] = []
  const rec = aReceber(e, hoje)
  const transicao = notasDeTransicao(e, hoje)
  const totalTransicao = transicao.reduce((s, n) => s + n.valor, 0)
  const conc = concentracao(e)
  const pmr = Math.round(a.comportamento.prazoMedio)

  if (a.picoCapitalDeGiro > 0) {
    acoes.push({
      id: 'reserva',
      prioridade: a.picoSobreFaturamento >= 0.4 ? 'alta' : 'media',
      titulo: `Reservar ${money(a.picoCapitalDeGiro)} de capital de giro`,
      detalhe: `É o maior valor acumulado de DAS pago antes do recebimento, atingido em ${a.mesPico}/${ANO_VIRADA}. Equivale a ${pct(a.picoSobreFaturamento, 0)} do faturamento mensal. Se não houver caixa, negocie agora uma linha de capital de giro, porque em janeiro a procura será maior.`,
      valor: a.picoCapitalDeGiro,
      quando: 'Até 31/12',
    })
  }

  if (totalTransicao > 0) {
    acoes.push({
      id: 'transicao',
      prioridade: 'alta',
      titulo: `Antecipar o recebimento de ${transicao.length} notas de ${ANO_VIRADA - 1}`,
      detalhe: `${money(totalTransicao)} emitidos até dezembro devem ser recebidos só em ${ANO_VIRADA}, e a resolução não diz como serão tributados. O que entrar até 31/12 segue a regra de caixa e sai da zona de incerteza. Ofereça desconto para pagamento antecipado quando o custo for menor que o DAS em risco (${money(totalTransicao * a.aliquota)}).`,
      valor: totalTransicao,
      quando: 'Até 31/12',
    })
  }

  if (rec.vencidas.length) {
    acoes.push({
      id: 'cobranca',
      prioridade: rec.totalVencido > a.rbt12 / 24 ? 'alta' : 'media',
      titulo: `Cobrar ${rec.vencidas.length} notas vencidas (${money(rec.totalVencido)})`,
      detalhe: `Pela regra nova, cada nota não paga já terá gerado DAS na emissão. Hoje isso representaria ${money(rec.totalVencido * a.aliquota)} pagos sem receber. Comece pelos maiores valores e ofereça Pix com vencimento curto.`,
      valor: rec.totalVencido,
      quando: 'Esta semana',
    })
  }

  if (pmr > 35) {
    const p = precoAPrazo({ valorAVista: 1000, aliquota: a.aliquota, parcelasDias: [pmr], jurosMes: JUROS_PADRAO, inadimplencia: a.comportamento.inadimplencia })
    acoes.push({
      id: 'preco',
      prioridade: pmr > 60 ? 'alta' : 'media',
      titulo: `Reprecificar vendas a prazo: +${pct(p.acrescimo)} para ${pmr} dias`,
      detalhe: `Com prazo médio de ${pmr} dias, juros de ${pct(JUROS_PADRAO)} a.m. e inadimplência de ${pct(a.comportamento.inadimplencia)}, o preço a prazo precisa ser ${pct(p.acrescimo)} maior que o à vista para render o mesmo. Desse acréscimo, ${pct(p.custoImpostoAntecipado / 1000)} é só o imposto antecipado. Alternativa: desconto de até ${pct(p.descontoEquivalenteAVista)} para Pix à vista.`,
      quando: 'Novas propostas e renovações',
    })
  }

  const top = conc[0]
  if (top && top.participacao > 0.3 && conc.length > 1) {
    acoes.push({
      id: 'concentracao',
      prioridade: 'media',
      titulo: `Renegociar prazo com ${top.cliente}`,
      detalhe: `${top.cliente} responde por ${pct(top.participacao, 0)} do que está a receber (${money(top.valor)} em ${top.notas} notas). Reduzir 30 dias de prazo com esse cliente libera caixa equivalente a ${money(top.valor * a.aliquota)} de DAS antecipado.`,
      valor: top.valor,
      quando: 'Até 31/12',
    })
  }

  if (a.comportamento.inadimplencia > 0.03) {
    acoes.push({
      id: 'inadimplencia',
      prioridade: 'media',
      titulo: `Reduzir inadimplência de ${pct(a.comportamento.inadimplencia)}`,
      detalhe: `Notas não pagas continuarão gerando DAS: cerca de ${money(a.impostoSobreCalote)} por ano no ritmo atual. Exija entrada ou garantia para clientes novos e migre contratos recorrentes para Pix Automático.`,
      valor: a.impostoSobreCalote,
      quando: 'Contínuo',
    })
  }

  if (e.vendaParaCredito >= 0.6) {
    acoes.push({
      id: 'ibscbs',
      prioridade: 'baixa',
      titulo: 'Avaliar IBS/CBS fora do DAS para o 2º semestre',
      detalhe: `${pct(e.vendaParaCredito, 0)} da receita vem de empresas que tomam crédito de IBS/CBS. Elas tendem a preferir fornecedores que transferem crédito integral. A próxima janela de opção vai de 1º a 31 de março de ${ANO_VIRADA}.`,
      quando: `Março/${ANO_VIRADA}`,
    })
  }

  acoes.push({
    id: 'emissao',
    prioridade: 'baixa',
    titulo: 'Alinhar emissão de notas à entrega real',
    detalhe: 'Segurar a emissão para adiar o DAS cria risco fiscal. A nota deve acompanhar a entrega ou a medição aceita pelo cliente. O ganho de caixa precisa vir de prazo, preço e cobrança.',
    quando: 'Contínuo',
  })

  const ordem = { alta: 0, media: 1, baixa: 2 }
  return acoes.sort((x, y) => ordem[x.prioridade] - ordem[y.prioridade])
}

export function mensagemCliente(e: Empresa, a: ReturnType<typeof projecao>, acoes: Acao[]) {
  const primeiro = e.responsavel.split(' ').find((p) => !p.endsWith('.')) ?? e.responsavel
  const principais = acoes.filter((x) => x.prioridade !== 'baixa').slice(0, 3)
  return [
    `Olá, ${primeiro}! Tudo bem?`,
    '',
    `A partir de janeiro de ${ANO_VIRADA}, o Simples Nacional deixa de calcular o DAS pelo que a ${e.nome} recebe e passa a calcular pelas notas emitidas. Como seus clientes pagam em média em ${Math.round(a.comportamento.prazoMedio)} dias, vocês vão pagar imposto antes de receber.`,
    '',
    `Pelas notas dos últimos 12 meses, a diferença pode chegar a ${money(a.picoCapitalDeGiro)} em ${a.mesPico}/${ANO_VIRADA}.`,
    '',
    'O que recomendamos fazer ainda este ano:',
    ...principais.map((x, i) => `${i + 1}. ${x.titulo}`),
    '',
    'Podemos marcar 30 minutos esta semana para passar os números juntos?',
  ].join('\n')
}

export function mensagemCobranca(empresa: string, cliente: string, valor: number, notas: number) {
  return [
    `Olá, equipe ${cliente}!`,
    '',
    `Identificamos ${notas === 1 ? 'uma nota em aberto' : `${notas} notas em aberto`} da ${empresa}, somando ${money(valor)}.`,
    'Para facilitar, podemos enviar um Pix com vencimento em 3 dias úteis. Se preferir, conseguimos dividir em duas parcelas ainda este mês.',
    '',
    'Podem nos confirmar a melhor opção?',
  ].join('\n')
}
