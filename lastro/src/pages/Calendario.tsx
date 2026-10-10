import { useStore } from '../lib/store'
import { cn, diasAte } from '../lib/format'
import { Panel } from '../components/ui'

interface Marco {
  inicio: Date
  fim?: Date
  data: string
  titulo: string
  texto: string
  fonte?: { nome: string; url: string }
  semData?: boolean
}

const MARCOS: Marco[] = [
  {
    inicio: new Date(2026, 8, 1),
    fim: new Date(2026, 8, 30),
    data: '1 a 30 set 2026',
    titulo: 'Opção por IBS/CBS fora do DAS (1º semestre de 2027)',
    texto: 'Primeira janela para o Simples híbrido. Quem não optou segue recolhendo IBS e CBS dentro do DAS.',
    fonte: { nome: 'Tecnospeed · CGSN 2026', url: 'https://blog.tecnospeed.com.br/reforma-tributaria-para-simples-nacional/' },
  },
  {
    inicio: new Date(2026, 10, 30),
    data: '30 nov 2026',
    titulo: 'Último dia para cancelar a opção de setembro',
    texto: 'Se a simulação mostrou que sair do DAS não compensa, ainda dá para desistir.',
    fonte: { nome: 'Tecnospeed · CGSN 2026', url: 'https://blog.tecnospeed.com.br/reforma-tributaria-para-simples-nacional/' },
  },
  {
    inicio: new Date(2026, 11, 31),
    data: '31 dez 2026',
    titulo: 'Último dia do regime de caixa no Simples',
    texto: 'Tudo o que for recebido até aqui é tributado pela regra antiga. Antecipar recebimentos reduz a incerteza da transição.',
    fonte: { nome: 'Fenacon · CGSN 190/2026', url: 'https://fenacon.org.br/noticias/regime-de-caixa-deixara-de-ser-utilizado-na-apuracao-do-simples-nacional/' },
  },
  {
    inicio: new Date(2027, 0, 1),
    data: '1 jan 2027',
    titulo: 'DAS passa a ser calculado sobre o faturamento',
    texto: 'A receita do mês é a das notas emitidas, mesmo que o cliente pague depois ou não pague. A CBS começa a ser cobrada e o IBS entra com alíquota de teste de 0,1%.',
    fonte: { nome: 'Portal Contábeis', url: 'https://www.contabeis.com.br/artigos/78817/simples-nacional-fim-do-regime-de-caixa-em-2027-muda-gestao/' },
  },
  {
    inicio: new Date(2027, 2, 1),
    fim: new Date(2027, 2, 31),
    data: '1 a 31 mar 2027',
    titulo: 'Opção por IBS/CBS fora do DAS (2º semestre de 2027)',
    texto: 'Segunda janela. Cancelamento possível até 31 de maio. A opção continua valendo nos períodos seguintes.',
    fonte: { nome: 'Tecnospeed · CGSN 2026', url: 'https://blog.tecnospeed.com.br/reforma-tributaria-para-simples-nacional/' },
  },
  {
    inicio: new Date(2099, 0, 1),
    data: 'Sem data',
    semData: true,
    titulo: 'Split payment',
    texto: 'O recolhimento automático no momento do pagamento foi adiado pelo Comitê Gestor do IBS em agosto de 2026 e não tem nova data.',
    fonte: { nome: 'Nota Gateway', url: 'https://notagateway.com.br/?p=14298' },
  },
]

export default function Calendario() {
  const { hoje } = useStore()
  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="eyebrow">Prazos da virada</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Calendário 2026–2027</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">As datas que mudam o caixa das empresas do Simples. Cada item traz a fonte para conferência.</p>
      </div>
      <Panel className="p-2 sm:p-4">
        <ol className="relative">
          {MARCOS.map((m, i) => {
            const fim = m.fim ?? m.inicio
            const passou = !m.semData && fim < hoje
            const agora = !m.semData && m.inicio <= hoje && fim >= hoje
            const faltam = diasAte(m.inicio, hoje)
            return (
              <li key={i} className="grid grid-cols-[96px_1fr] gap-4 rounded-lg p-3 sm:grid-cols-[150px_1fr] sm:p-4">
                <div className="pt-0.5">
                  <p className={cn('num text-sm font-semibold', passou && 'text-faint')}>{m.data}</p>
                  <p className="mt-1 text-xs">
                    {m.semData ? (
                      <span className="text-muted">a definir</span>
                    ) : passou ? (
                      <span className="text-faint">encerrado</span>
                    ) : agora ? (
                      <span className="font-semibold text-accent">em andamento</span>
                    ) : (
                      <span className="font-semibold text-gap">em {faltam} dias</span>
                    )}
                  </p>
                </div>
                <div className={cn('border-l-2 pl-4', passou ? 'border-line' : agora ? 'border-accent' : 'border-gap')}>
                  <p className={cn('font-semibold', passou && 'text-muted')}>{m.titulo}</p>
                  <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-muted">{m.texto}</p>
                  {m.fonte && (
                    <a href={m.fonte.url} target="_blank" rel="noreferrer" className="mt-1.5 inline-block text-xs text-accent hover:underline">
                      Fonte: {m.fonte.nome}
                    </a>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </Panel>
      <p className="text-xs text-faint">Datas conforme resoluções do CGSN publicadas em 2026 e noticiadas pelas fontes indicadas. Confira sempre o texto oficial antes de decidir.</p>
    </div>
  )
}
