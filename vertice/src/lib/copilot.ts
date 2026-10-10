import type { DB } from './types'
import { STAGES } from './types'
import { computeKpis, funnel, isOpen, leaderboard, probability, revenueBySource, staleDeals } from './metrics'
import { daysBetween, money, pct } from './format'

// Motor do Copiloto: interpreta a pergunta e responde com análises calculadas sobre os dados reais do workspace.
// A interface é a mesma de um LLM (pergunta → texto em streaming), então trocar por uma API de IA é direto.

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export const SUGGESTIONS = [
  'Qual a previsão de receita para este mês?',
  'Quais negócios estão em risco?',
  'Onde devo focar hoje?',
  'Como está a performance do time?',
  'Qual canal traz mais receita?',
  'Escreva um follow-up para o maior negócio em negociação',
]

export function answer(db: DB, question: string): string {
  const q = norm(question)
  const k = computeKpis(db)
  const clientOf = (id: string) => db.clients.find((c) => c.id === id)
  const open = db.deals.filter(isOpen)

  if (/follow|mensagem|email|e-mail|escrev/.test(q)) {
    const target = [...open].filter((d) => d.stage === 'negociacao').sort((a, b) => b.value - a.value)[0] ?? open[0]
    if (!target) return 'Não há negócios abertos no momento para escrever um follow-up.'
    const c = clientOf(target.clientId)!
    const first = c.name.split(' ')[0]
    return `Aqui está um follow-up para **${c.name}** (${c.company}) sobre **${target.title}** — ${money(target.value)}:\n\n---\n\nOlá, ${first}! Tudo bem?\n\nRetomando nossa conversa sobre o ${target.title.toLowerCase()}: preparei uma condição que respeita o momento de caixa que você comentou — investimento em até 6x, com início dos trabalhos já na próxima semana.\n\nPara garantir a agenda do time sênior, consigo segurar essa condição até sexta-feira. Faz sentido batermos 15 minutos amanhã para alinhar os últimos detalhes?\n\nAbraço!\n\n---\n\n💡 **Por que funciona:** escassez real (agenda do time), remove a objeção de preço que está registrada nas notas e propõe um próximo passo de baixo atrito.`
  }

  if (/risco|parad|esfri|perder|atencao/.test(q)) {
    const stale = staleDeals(db)
    if (!stale.length) return '✅ Nenhum negócio em risco. Todos os negócios abertos tiveram atividade nos últimos 10 dias.'
    const lines = stale
      .slice(0, 5)
      .map((d) => `- **${d.title}** · ${clientOf(d.clientId)?.company} — ${money(d.value)}, sem atividade há **${daysBetween(d.lastActivityAt)} dias** (${STAGES.find((s) => s.id === d.stage)!.label})`)
    const total = stale.reduce((s, d) => s + d.value, 0)
    return `⚠️ Encontrei **${stale.length} negócios em risco**, somando **${money(total)}**:\n\n${lines.join('\n')}\n\n**Recomendação:** negócios sem contato por mais de 14 dias perdem cerca de metade da chance de fechamento. Comece pelos de maior valor e ofereça um próximo passo concreto (reunião com data marcada), não apenas um "e aí?".`
  }

  if (/previs|forecast|projec|meta|fechar o mes/.test(q)) {
    const neg = open.filter((d) => d.stage === 'negociacao')
    const best = k.thisMonth + neg.reduce((s, d) => s + d.value, 0)
    return `📈 **Previsão de receita**\n\n- Receita já fechada no mês: **${money(k.thisMonth)}** (${pct(k.goalProgress, 0)} da meta de ${money(k.goal)})\n- Forecast ponderado do pipeline: **${money(k.forecast)}**\n- Cenário otimista (fechando tudo em Negociação): **${money(best)}**\n\n${best >= k.goal ? `Fechando os ${neg.length} negócios em Negociação, você **bate a meta** com folga de ${money(best - k.goal)}.` : `Mesmo no cenário otimista faltariam ${money(k.goal - best)}. Acelere os negócios em Proposta.`}\n\nSua taxa de conversão nos últimos 90 dias é **${pct(k.winRate, 0)}** e o ciclo médio de venda é de **${Math.round(k.cycle)} dias**.`
  }

  if (/time|equipe|vendedor|closer|performance|ranking/.test(q)) {
    const lb = leaderboard(db)
    const lines = lb.map((r, i) => `${['🥇', '🥈', '🥉', '4º'][i] ?? `${i + 1}º`} **${r.member.name}** — ${money(r.value)} em ${r.count} negócios`)
    return `👥 **Performance do time (últimos 90 dias)**\n\n${lines.join('\n')}\n\n${lb[0] ? `${lb[0].member.name.split(' ')[0]} lidera com ${pct((lb[0].value / Math.max(1, lb.reduce((s, r) => s + r.value, 0))) * 100, 0)} da receita do período. ` : ''}Vale replicar o playbook de quem lidera em uma sessão de role-play semanal.`
  }

  if (/canal|origem|fonte|marketing|lead/.test(q)) {
    const src = revenueBySource(db)
    const total = src.reduce((s, r) => s + r.value, 0)
    const lines = src.map((r) => `- **${r.source}**: ${money(r.value)} (${pct((r.value / total) * 100, 0)})`)
    return `🧭 **Receita por canal (12 meses)**\n\n${lines.join('\n')}\n\n**${src[0]?.source}** é seu canal mais forte. Para negócios high-ticket, indicação e eventos costumam trazer ciclos mais curtos — considere um programa formal de indicação com benefício para o cliente indicador.`
  }

  if (/foco|focar|hoje|priorid|fazer/.test(q)) {
    const ranked = [...open]
      .map((d) => ({ d, score: d.value * probability(d) * (daysBetween(d.lastActivityAt) > 7 ? 1.4 : 1) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
    const lines = ranked.map(({ d }, i) => `${i + 1}. **${d.title}** · ${clientOf(d.clientId)?.company} — ${money(d.value)} (${STAGES.find((s) => s.id === d.stage)!.label}, ${Math.round(probability(d) * 100)}% de chance)`)
    return `🎯 **Seu foco para hoje**\n\nCruzei valor, probabilidade e tempo sem contato. Estes 3 negócios têm o maior impacto esperado:\n\n${lines.join('\n')}\n\nJuntos eles representam **${money(ranked.reduce((s, r) => s + r.d.value * probability(r.d), 0))}** em receita ponderada.`
  }

  if (/funil|pipeline|etapa|conversao/.test(q)) {
    const f = funnel(db)
    const lines = f.map((s) => `- **${s.label}**: ${s.count} negócios · ${money(s.value)}`)
    return `🔻 **Seu funil hoje**\n\n${lines.join('\n')}\n\nPipeline total: **${money(k.pipeline)}** · Ponderado: **${money(k.forecast)}** · Conversão 90d: **${pct(k.winRate, 0)}**.`
  }

  return `Aqui vai um resumo do seu negócio agora:\n\n- 💰 Receita do mês: **${money(k.thisMonth)}** (${pct(k.goalProgress, 0)} da meta) · últimos 30 dias: ${money(k.last30)} (${k.growth >= 0 ? '+' : ''}${pct(k.growth, 0)})\n- 🧮 Pipeline aberto: **${money(k.pipeline)}** em ${k.openCount} negócios\n- 🎯 Conversão (90d): **${pct(k.winRate, 0)}** · Ticket médio: **${money(k.avgTicket)}**\n- ⏱️ Ciclo médio: **${Math.round(k.cycle)} dias**\n\nPosso detalhar previsão de receita, negócios em risco, performance do time, canais ou escrever follow-ups. É só pedir.`
}
