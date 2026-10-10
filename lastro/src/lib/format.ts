const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

export const money = (v: number) => brl.format(Math.round(v))
export const moneyK = (v: number) => 'R$ ' + compact.format(v)
export const pct = (v: number, d = 1) => `${(v * 100).toFixed(d).replace('.', ',')}%`
export const dataBR = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
export const cn = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ')
export const diasAte = (alvo: Date, hoje = new Date()) => Math.ceil((alvo.getTime() - hoje.getTime()) / 86_400_000)
