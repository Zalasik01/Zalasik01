import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Minus } from 'lucide-react'
import { Logo } from '../components/Shell'
import { aliquotaEfetiva, type Anexo } from '../lib/simples'
import { cn, diasAte, money, pct } from '../lib/format'

const FONTES = [
  { n: 1, nome: 'Fenacon: regime de caixa deixará de ser utilizado na apuração do Simples Nacional', url: 'https://fenacon.org.br/noticias/regime-de-caixa-deixara-de-ser-utilizado-na-apuracao-do-simples-nacional/' },
  { n: 2, nome: 'Portal Contábeis: fim do regime de caixa em 2027 muda gestão', url: 'https://www.contabeis.com.br/artigos/78817/simples-nacional-fim-do-regime-de-caixa-em-2027-muda-gestao/' },
  { n: 3, nome: 'Tribuna PR / Serasa Experian: inadimplência de empresas bate recorde', url: 'https://www.tribunapr.com.br/noticias/economia/inadimplencia-de-empresas-bate-recorde-e-atinge-91-milhoes-no-brasil' },
  { n: 4, nome: 'Correio Braziliense: o calote silencioso de 2027 (dados FecomercioSP e Banco Central)', url: 'https://blogs.correiobraziliense.com.br/aricunha/inadimplencia-das-empresas-2027/' },
  { n: 5, nome: 'Tecnospeed: Reforma Tributária para o Simples Nacional (janelas de opção)', url: 'https://blog.tecnospeed.com.br/reforma-tributaria-para-simples-nacional/' },
  { n: 6, nome: 'Elscon: regime de caixa do Simples em 2027 e as vendas a prazo', url: 'https://www.elscon.com.br/post/regime-caixa-simples-2027' },
]

function Hero() {
  const [fat, setFat] = useState(150_000)
  const [prazo, setPrazo] = useState(75)
  const [anexo, setAnexo] = useState<Anexo>('III')
  const aliq = aliquotaEfetiva(anexo, fat * 12)
  const buraco = aliq * fat * (prazo / 30)
  const faltam = diasAte(new Date(2027, 0, 1))

  return (
    <section className="ledger border-b border-line">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <div>
          <p className="eyebrow">Para escritórios contábeis · Simples Nacional</p>
          <h1 className="mt-4 font-display text-5xl leading-[0.98] font-extrabold tracking-tight sm:text-6xl">
            Em janeiro, seus clientes vão pagar imposto <span className="text-gap">antes de receber.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            O Simples Nacional deixa de aceitar o regime de caixa em 2027. O Lastro lê as notas de cada cliente, calcula quanto caixa vai faltar e entrega o plano para resolver antes da virada.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/app" className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-6 font-medium text-accent-ink hover:brightness-110">
              Ver a carteira de demonstração <ArrowRight size={18} />
            </Link>
            <a href="#problema" className="inline-flex h-12 items-center rounded-lg border border-line bg-surface px-6 font-medium hover:bg-sunken">
              Entender a mudança
            </a>
          </div>
          {faltam > 0 && (
            <p className="mt-6 text-sm text-muted">
              Faltam <b className="num text-gap">{faltam} dias</b> para a regra nova.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-[0_24px_60px_-30px_rgba(16,32,28,0.35)]">
          <p className="eyebrow">Faça a conta de um cliente</p>
          <div className="mt-5 space-y-5">
            <label htmlFor="hero-fat" className="block">
              <span className="flex justify-between text-sm">
                Faturamento mensal <b className="num">{money(fat)}</b>
              </span>
              <input id="hero-fat" type="range" min={20_000} max={390_000} step={5_000} value={fat} onChange={(e) => setFat(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" />
            </label>
            <label htmlFor="hero-prazo" className="block">
              <span className="flex justify-between text-sm">
                Prazo médio para receber <b className="num">{prazo} dias</b>
              </span>
              <input id="hero-prazo" type="range" min={0} max={150} step={5} value={prazo} onChange={(e) => setPrazo(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" />
            </label>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Anexo">
              {(['I', 'II', 'III', 'IV', 'V'] as Anexo[]).map((a) => (
                <button key={a} onClick={() => setAnexo(a)} className={cn('rounded-md border px-3 py-1 text-sm', anexo === a ? 'border-ink bg-ink text-paper' : 'border-line text-muted hover:text-ink')}>
                  Anexo {a}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-xl bg-gap-soft p-5">
            <p className="text-sm text-gap">DAS pago sobre dinheiro que ainda não entrou</p>
            <p className="num mt-1 text-4xl font-semibold text-gap">{money(buraco)}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Alíquota efetiva de <span className="num">{pct(aliq, 2)}</span> × {money(fat)} × {(prazo / 30).toFixed(1).replace('.', ',')} meses de prazo. É o capital de giro extra que fica preso, permanentemente, enquanto o prazo não mudar. No primeiro trimestre pode dobrar por causa das notas de 2026 sem regra de transição.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <div>
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden gap-7 text-sm text-muted md:flex">
            <a href="#problema" className="hover:text-ink">A mudança</a>
            <a href="#produto" className="hover:text-ink">Produto</a>
            <a href="#mercado" className="hover:text-ink">Mercado</a>
            <a href="#precos" className="hover:text-ink">Preços</a>
          </nav>
          <Link to="/app" className="inline-flex h-9 items-center rounded-lg bg-ink px-4 text-sm font-medium text-paper">
            Abrir demonstração
          </Link>
        </div>
      </header>

      <Hero />

      <section id="problema" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">A mudança</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight">Duas regras, o mesmo mês, caixas diferentes.</h2>
            <p className="mt-4 leading-relaxed text-muted">
              A Resolução CGSN 190/2026 extingue a opção pelo regime de caixa a partir de 1º de janeiro de 2027<sup>1</sup>. A receita do mês passa a ser a das notas emitidas, independentemente de quando o cliente paga<sup>2</sup>. A resolução não criou regra de transição para as notas de 2026 recebidas em 2027<sup>6</sup>.
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Serviço de R$ 100.000 em janeiro, pago em 30/60/90 dias</th>
                  <th className="px-3 py-3 text-right font-medium">Recebe</th>
                  <th className="px-3 py-3 text-right font-medium">DAS até 2026</th>
                  <th className="px-5 py-3 text-right font-medium">DAS em 2027</th>
                </tr>
              </thead>
              <tbody className="num">
                {[
                  ['Janeiro', 0, 0, 13_000],
                  ['Fevereiro', 33_333, 4_333, 0],
                  ['Março', 33_333, 4_333, 0],
                  ['Abril', 33_334, 4_334, 0],
                ].map(([mes, rec, antes, depois]) => (
                  <tr key={mes as string} className="border-b border-line last:border-0">
                    <td className="px-5 py-2.5 font-sans">{mes}</td>
                    <td className="px-3 py-2.5 text-right">{money(rec as number)}</td>
                    <td className="px-3 py-2.5 text-right text-muted">{money(antes as number)}</td>
                    <td className={cn('px-5 py-2.5 text-right', (depois as number) > 0 && 'font-semibold text-gap')}>{money(depois as number)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-line px-5 py-3 text-xs text-muted">Alíquota efetiva ilustrativa de 13%. O imposto total é igual; o que muda é o mês em que ele sai do caixa. Se o cliente não pagar, o DAS já foi pago.</p>
          </div>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
          {[
            ['9,1 milhões', 'de CNPJs com dívidas em atraso em junho de 2026, recorde da série. 95% são micro e pequenas empresas.', 3],
            ['¾ do crédito vencido', 'está com pequenas e médias empresas, que têm só 43% do crédito total. O atraso de micro empresas subiu 45% em um ano.', 4],
            ['1 a 31 de março', 'é a próxima janela para tirar IBS e CBS do DAS. A decisão depende de quanto da receita vem de clientes que tomam crédito.', 5],
          ].map(([v, t, f]) => (
            <div key={v as string} className="bg-surface p-6">
              <p className="font-display text-3xl font-extrabold tracking-tight">{v}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t}
                <sup>{f}</sup>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="produto" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="eyebrow">Produto</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-extrabold tracking-tight">Da carteira inteira ao plano de cada cliente.</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              ['Importe as notas', 'Contas a receber do ERP ou lista de notas com datas de pagamento, em CSV. O Lastro aprende como cada cliente da empresa paga: no mês, em 30, 60, 90 dias ou nunca.'],
              ['Veja quem está em risco', 'A carteira é ordenada pelo caixa que cada empresa vai precisar reservar, com o mês do pico, nas duas hipóteses de transição. Os críticos aparecem primeiro.'],
              ['Entregue o plano', 'Ações com valor e prazo: reservar capital, antecipar recebíveis de 2026, reprecificar prazo, cobrar vencidos. Mensagem pronta para o cliente e para os devedores.'],
            ].map(([t, d], i) => (
              <li key={t}>
                <span className="num text-sm font-semibold text-accent">Passo {i + 1}</span>
                <h3 className="mt-2 font-display text-xl font-bold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-14 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line p-6">
              <h3 className="font-display text-lg font-bold">Preço a prazo</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Calcula o preço mínimo para que vender em 60 ou 90 dias renda o mesmo que vender à vista, separando juros, risco de calote e imposto antecipado. Mostra o desconto máximo para Pix à vista.
              </p>
            </div>
            <div className="rounded-xl border border-line p-6">
              <h3 className="font-display text-lg font-bold">Triagem do Simples híbrido</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Indica quais clientes devem simular IBS/CBS fora do DAS antes de março, pelo peso das vendas a empresas que tomam crédito. A apuração detalhada continua com o contador.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="mercado" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Por que ninguém resolveu isso ainda</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight">Os simuladores olham o imposto. O problema é o caixa.</h2>
            <p className="mt-4 leading-relaxed text-muted">
              As ferramentas da reforma para o Simples comparam cenários de IBS/CBS dentro e fora do DAS e geram relatórios pontuais. Elas não acompanham recebíveis, inadimplência e prazo, que é onde a regra de faturamento dói. O escritório contábil é quem vai receber a ligação em fevereiro.
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[440px] text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="px-5 py-3 text-left font-medium" />
                  <th className="px-3 py-3 font-medium">Simuladores da reforma</th>
                  <th className="px-5 py-3 font-medium text-accent">Lastro</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Compara IBS/CBS dentro e fora do DAS', true, 'triagem'],
                  ['Projeta o DAS sobre faturamento vs. caixa', false, true],
                  ['Usa o comportamento real de pagamento', false, true],
                  ['Trata notas de 2026 recebidas em 2027', false, true],
                  ['Precifica venda a prazo com imposto antecipado', false, true],
                  ['Ordena a carteira do escritório por risco', 'parcial', true],
                  ['Gera plano de ação e mensagens', false, true],
                ].map(([t, a, b]) => (
                  <tr key={t as string} className="border-b border-line last:border-0">
                    <td className="px-5 py-2.5">{t}</td>
                    {[a, b].map((v, i) => (
                      <td key={i} className="px-3 py-2.5 text-center">
                        {v === true ? <Check size={16} className="mx-auto text-accent" /> : v === false ? <Minus size={16} className="mx-auto text-faint" /> : <span className="text-xs text-muted">{v as string}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="precos" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="eyebrow">Preços</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight">Cobrado por empresa analisada.</h2>
          <p className="mt-3 max-w-2xl text-muted">O escritório repassa como consultoria de virada. Um único cliente bem orientado paga o ano.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['Escritório', 'R$ 249', 'até 25 empresas', ['Carteira e diagnóstico', 'Plano de ação e mensagens', 'Calculadora de preço a prazo']],
              ['Escritório Plus', 'R$ 590', 'até 100 empresas', ['Tudo do Escritório', 'Importação em lote', 'Relatório com a marca do escritório'], true],
              ['Empresa', 'R$ 79', '1 CNPJ, direto', ['Diagnóstico da própria empresa', 'Acompanhamento mensal', 'Convite ao contador']],
            ].map(([nome, preco, sub, itens, destaque]) => (
              <div key={nome as string} className={cn('rounded-xl border p-6', destaque ? 'border-accent ring-1 ring-accent' : 'border-line')}>
                <p className="font-display text-xl font-bold">{nome as string}</p>
                <p className="mt-3">
                  <span className="num text-3xl font-semibold">{preco as string}</span>
                  <span className="text-sm text-muted">/mês</span>
                </p>
                <p className="text-sm text-muted">{sub as string}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {(itens as string[]).map((i) => (
                    <li key={i} className="flex gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-accent" /> {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-ink p-6 text-paper sm:p-8">
            <p className="max-w-xl font-display text-2xl font-bold">Veja o diagnóstico de uma carteira de demonstração com 8 empresas.</p>
            <Link to="/app" className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-6 font-medium text-accent-ink">
              Abrir demonstração <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-12 text-sm sm:px-6">
        <p className="eyebrow">Fontes</p>
        <ol className="mt-3 space-y-1.5 text-muted">
          {FONTES.map((f) => (
            <li key={f.n}>
              <sup>{f.n}</sup>{' '}
              <a href={f.url} target="_blank" rel="noreferrer" className="hover:text-accent hover:underline">
                {f.nome}
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-xs text-faint">Lastro não substitui a orientação do contador. Projeções baseadas nas notas informadas e nas regras publicadas até outubro de 2026.</p>
      </footer>
    </div>
  )
}
