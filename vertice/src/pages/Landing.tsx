import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  FileSignature,
  KanbanSquare,
  Lock,
  Quote,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { Logo } from '../components/Logo'
import { Button } from '../components/ui'
import { useStore } from '../lib/store'
import { cn } from '../lib/format'

const PLANS = [
  {
    id: 'essencial',
    name: 'Essencial',
    price: 497,
    desc: 'Para especialistas que vendem sozinhos e querem previsibilidade.',
    features: ['1 usuário', 'Pipeline e clientes ilimitados', 'Propostas com rastreio de leitura', 'Dashboard de receita', 'Copiloto IA — 100 consultas/mês'],
  },
  {
    id: 'escala',
    name: 'Escala',
    price: 1497,
    highlight: true,
    desc: 'Para times comerciais que fecham contratos de 5 e 6 dígitos.',
    features: ['Até 10 usuários', 'Tudo do Essencial', 'Forecast ponderado e metas por closer', 'Copiloto IA ilimitado', 'Integrações: Stripe, WhatsApp, Google Agenda', 'Onboarding 1:1 com especialista'],
  },
  {
    id: 'private',
    name: 'Private',
    price: 4900,
    from: true,
    desc: 'Para operações que precisam de governança e atendimento dedicado.',
    features: ['Usuários ilimitados', 'Tudo do Escala', 'SSO / SAML e trilha de auditoria', 'Gerente de sucesso dedicado', 'SLA de 99,95% e suporte 24/7', 'Implementação white-glove'],
  },
]

const FAQ = [
  ['Para quem é o Vértice?', 'Para negócios que vendem serviços e produtos de alto valor — consultorias, mentorias, clínicas premium, escritórios, agências e imobiliárias de alto padrão. Se cada contrato vale R$ 10 mil ou mais, o Vértice foi feito para você.'],
  ['Como o Copiloto IA usa meus dados?', 'O Copiloto analisa apenas os dados do seu workspace para gerar previsões, apontar riscos e escrever follow-ups. Nada é usado para treinar modelos de terceiros e todos os dados são criptografados em repouso e em trânsito.'],
  ['Consigo migrar do meu CRM atual?', 'Sim. Importamos planilhas, Pipedrive, HubSpot e RD Station. No plano Escala e Private, nosso time faz a migração completa por você.'],
  ['Existe fidelidade?', 'Não. Os planos mensais podem ser cancelados a qualquer momento. No plano anual você economiza 20%.'],
  ['Meus clientes precisam de conta para ver a proposta?', 'Não. Eles recebem um link elegante com a sua marca, podem visualizar, escolher a forma de pagamento e aceitar com um clique — e você é avisado na hora.'],
]

const TESTIMONIALS = [
  { quote: 'Saímos de planilhas para um forecast que erra menos de 8%. O Vértice virou o painel da nossa reunião de segunda-feira.', name: 'Helena Vasconcelos', role: 'CEO, Vasconcelos Odontologia Premium' },
  { quote: 'A proposta com rastreio de leitura mudou nosso timing de follow-up. Aumentamos a conversão em 31% em um trimestre.', name: 'Eduardo Prado', role: 'Sócio, Prado Capital' },
  { quote: 'O Copiloto me diz toda manhã onde focar. Parece ter um head comercial sênior do lado, 24 horas por dia.', name: 'Fernanda Lobo', role: 'Fundadora, Lobo Educação Executiva' },
]

function HeroPreview() {
  const bars = [38, 44, 41, 52, 49, 58, 63, 61, 72, 78, 84, 96]
  return (
    <div className="relative mx-auto mt-16 max-w-5xl animate-fade-up [animation-delay:200ms]">
      <div className="absolute -inset-x-20 -top-20 -bottom-10 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(212,171,104,.18),transparent_65%)]" />
      <div className="glass overflow-hidden rounded-3xl p-2 ring-gold-glow">
        <div className="rounded-[20px] border border-white/[.06] bg-ink-950/90 p-5 sm:p-7">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="ml-3 text-xs text-ink-500">app.vertice.com.br</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {[
              ['Receita do mês', 'R$ 487 mil', '+18,4%'],
              ['Pipeline aberto', 'R$ 1,9 mi', '22 negócios'],
              ['Conversão 90d', '41%', '+6 p.p.'],
              ['Ticket médio', 'R$ 68 mil', '+12%'],
            ].map(([l, v, d]) => (
              <div key={l} className="rounded-2xl border border-white/[.06] bg-white/[.02] p-4 text-left">
                <p className="text-[11px] text-ink-500">{l}</p>
                <p className="mt-1 text-xl font-semibold tracking-tight">{v}</p>
                <p className="mt-1 text-[11px] text-emerald-400">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[.06] bg-white/[.02] p-4 sm:col-span-2">
              <p className="text-left text-[11px] text-ink-500">Receita fechada · 12 meses</p>
              <div className="mt-4 flex h-32 items-end gap-2">
                {bars.map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-gold-600/40 to-gold-300" style={{ height: `${h}%`, opacity: 0.35 + i * 0.055 }} />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gold-400/20 bg-gradient-to-b from-gold-400/10 to-transparent p-4 text-left">
              <p className="flex items-center gap-1.5 text-[11px] text-gold-300">
                <Sparkles size={12} /> Copiloto
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-200">
                Fechando os 3 negócios em negociação você <b className="text-ink-100">bate a meta com folga de R$ 62 mil</b>. Comece pela Prado Capital — a proposta foi aberta 3× hoje.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const { session, signIn } = useStore()
  const nav = useNavigate()
  const [annual, setAnnual] = useState(true)
  const [faq, setFaq] = useState<number | null>(0)

  const demo = () => {
    if (!session) signIn({ name: 'Nicolas Zalasik', email: 'nicolas@vertice.app' })
    nav('/app')
  }

  return (
    <div className="relative overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[900px] bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

      <header className="sticky top-0 z-30 border-b border-white/[.04] bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-ink-400 md:flex">
            <a href="#recursos" className="hover:text-ink-100">Recursos</a>
            <a href="#copiloto" className="hover:text-ink-100">Copiloto IA</a>
            <a href="#precos" className="hover:text-ink-100">Preços</a>
            <a href="#faq" className="hover:text-ink-100">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to={session ? '/app' : '/entrar'} className="hidden px-3 text-sm text-ink-300 hover:text-ink-100 sm:block">
              {session ? 'Abrir app' : 'Entrar'}
            </Link>
            <Button variant="primary" size="sm" onClick={demo}>
              Ver demo ao vivo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 pt-20 pb-24 text-center sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-4xl animate-fade-up">
          <a href="#copiloto" className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-ink-300 hover:text-ink-100">
            <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[10px] font-semibold text-gold-300">NOVO</span>
            Copiloto IA que prevê sua receita <ArrowRight size={12} />
          </a>
          <h1 className="mt-8 font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl md:text-[88px]">
            Venda como os <br className="hidden sm:block" />
            <span className="text-gradient-gold italic">melhores do mundo.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-300">
            O Vértice é o Revenue OS para negócios high-ticket. Pipeline, propostas que se vendem sozinhas e um copiloto de IA que diz exatamente onde está o seu próximo contrato de seis dígitos.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="primary" size="lg" onClick={demo}>
              Explorar a demo <ArrowRight size={16} />
            </Button>
            <Button size="lg" onClick={() => nav('/criar-conta')}>
              Começar 14 dias grátis
            </Button>
          </div>
          <p className="mt-4 text-xs text-ink-500">Sem cartão de crédito · Migração assistida · Cancele quando quiser</p>
        </div>
        <HeroPreview />
      </section>

      {/* Logos */}
      <section className="border-y border-white/[.05] bg-ink-900/40 px-4 py-10">
        <p className="text-center text-xs tracking-[0.2em] text-ink-500 uppercase">Escolhido por operações que faturam R$ 5 mi+ por ano</p>
        <div className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-center gap-x-12 gap-y-4 font-serif text-xl text-ink-500 sm:text-2xl">
          {['Prado Capital', 'Lumière', 'Almeida Holdings', 'Quintela', 'Lobo Executive', 'Siqueira Wealth'].map((n) => (
            <span key={n} className="italic opacity-70 transition hover:opacity-100">{n}</span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 py-20 text-center sm:px-6 md:grid-cols-4">
        {[
          ['R$ 2,4 bi', 'em contratos fechados'],
          ['+34%', 'de conversão média'],
          ['-41%', 'no ciclo de vendas'],
          ['4,9/5', 'avaliação dos clientes'],
        ].map(([v, l]) => (
          <div key={l}>
            <p className="font-serif text-4xl sm:text-5xl">{v}</p>
            <p className="mt-2 text-sm text-ink-400">{l}</p>
          </div>
        ))}
      </section>

      {/* Features bento */}
      <section id="recursos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-gold-400 uppercase">Recursos</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">Tudo o que um time de elite precisa. Nada que atrapalhe.</h2>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            { icon: KanbanSquare, title: 'Pipeline visual', body: 'Arraste negócios entre etapas, veja probabilidade e valor ponderado em tempo real. Negócios esfriando ganham alerta automático.', span: 'md:col-span-2' },
            { icon: Sparkles, title: 'Copiloto IA', body: 'Pergunte em português. Receba previsões, riscos e follow-ups prontos.' },
            { icon: FileSignature, title: 'Propostas que fecham', body: 'Links elegantes com sua marca, parcelamento e aceite em um clique. Saiba quando o cliente abriu.' },
            { icon: TrendingUp, title: 'Forecast ponderado', body: 'Projeção de receita por etapa e por closer, com cenários pessimista, realista e otimista.', span: 'md:col-span-2' },
            { icon: Target, title: 'Metas e ranking', body: 'Acompanhe a meta do mês e a performance de cada closer, sem planilhas.' },
            { icon: BarChart3, title: 'Inteligência de canais', body: 'Descubra quais canais trazem os contratos maiores e invista onde dá retorno.' },
            { icon: Lock, title: 'Segurança bancária', body: 'Criptografia AES-256, 2FA, SSO e conformidade com a LGPD.' },
          ].map((f) => (
            <div key={f.title} className={cn('group glass rounded-3xl p-7 transition hover:border-gold-400/25', f.span)}>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-300 ring-1 ring-gold-400/20 transition group-hover:scale-105">
                <f.icon size={20} />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Copilot */}
      <section id="copiloto" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-gold-400 uppercase">Copiloto IA</p>
            <h2 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">Um head comercial sênior, disponível 24/7.</h2>
            <p className="mt-5 text-ink-300 leading-relaxed">
              O Copiloto lê todo o seu pipeline, propostas e histórico de vendas para responder às perguntas que realmente importam — e agir sobre elas.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {['“Vou bater a meta este mês?”', '“Quais negócios estão em risco?”', '“Escreva um follow-up para a Prado Capital.”', '“Qual canal traz os maiores contratos?”'].map((q) => (
                <li key={q} className="flex items-center gap-3 text-ink-200">
                  <Zap size={15} className="text-gold-400" /> {q}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-3xl p-6 ring-gold-glow">
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-white/[.07] px-4 py-3 text-sm">Onde devo focar hoje?</div>
            <div className="mt-4 flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-gold-300">
                <Sparkles size={15} />
              </div>
              <div className="space-y-2 text-sm leading-relaxed text-ink-300">
                <p>Cruzei valor, probabilidade e tempo sem contato. Seus 3 negócios de maior impacto hoje:</p>
                <p>1. <b className="text-ink-100">Advisory Board</b> · Almeida Holdings — R$ 86 mil</p>
                <p>2. <b className="text-ink-100">Reestruturação Comercial</b> · Prado Capital — R$ 124 mil</p>
                <p>3. <b className="text-ink-100">Mentoria Executiva</b> · Clínica Lumière — R$ 64 mil</p>
                <p className="text-gold-300">Juntos: R$ 214 mil em receita ponderada.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="glass rounded-3xl p-7">
              <Quote size={22} className="text-gold-400/60" />
              <blockquote className="mt-4 font-serif text-xl leading-snug text-ink-100">“{t.quote}”</blockquote>
              <figcaption className="mt-6 text-sm">
                <p className="font-medium">{t.name}</p>
                <p className="text-ink-500">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-gold-400 uppercase">Preços</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">Um único contrato a mais paga o ano inteiro.</h2>
          <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/[.03] p-1 text-sm">
            {[false, true].map((a) => (
              <button key={String(a)} onClick={() => setAnnual(a)} className={cn('rounded-full px-4 py-1.5 transition', annual === a ? 'bg-white/10 text-ink-100' : 'text-ink-400')}>
                {a ? 'Anual · -20%' : 'Mensal'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {PLANS.map((p) => {
            const price = annual ? Math.round(p.price * 0.8) : p.price
            return (
              <div key={p.id} className={cn('relative flex flex-col rounded-3xl p-8', p.highlight ? 'bg-gradient-to-b from-gold-400/[.12] to-ink-900 ring-gold-glow' : 'glass')}>
                {p.highlight && <span className="absolute -top-3 left-8 rounded-full bg-gold-300 px-3 py-1 text-[11px] font-semibold text-ink-950">Mais escolhido</span>}
                <h3 className="font-serif text-2xl">{p.name}</h3>
                <p className="mt-2 min-h-10 text-sm text-ink-400">{p.desc}</p>
                <p className="mt-6">
                  {p.from && <span className="text-sm text-ink-400">a partir de </span>}
                  <span className="text-4xl font-semibold tracking-tight">R$ {price.toLocaleString('pt-BR')}</span>
                  <span className="text-sm text-ink-400">/mês</span>
                </p>
                <Button variant={p.highlight ? 'primary' : 'secondary'} className="mt-6" onClick={() => nav('/criar-conta?plano=' + p.id)}>
                  {p.id === 'private' ? 'Falar com especialista' : 'Começar teste grátis'}
                </Button>
                <ul className="mt-8 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-3 text-ink-300">
                      <Check size={16} className="mt-0.5 shrink-0 text-gold-400" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-serif text-4xl tracking-tight">Perguntas frequentes</h2>
        <div className="mt-10 divide-y divide-white/[.06] rounded-3xl border border-white/[.06]">
          {FAQ.map(([q, a], i) => (
            <div key={q}>
              <button onClick={() => setFaq(faq === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-medium">
                {q}
                <ChevronDown size={18} className={cn('shrink-0 text-ink-400 transition', faq === i && 'rotate-180')} />
              </button>
              {faq === i && <p className="px-6 pb-6 text-sm leading-relaxed text-ink-400 animate-fade-in">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 sm:px-6">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-gold-400/20 bg-gradient-to-br from-gold-400/[.14] via-ink-900 to-ink-900 px-6 py-20 text-center">
          <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
          <div className="relative">
            <h2 className="font-serif text-4xl tracking-tight sm:text-6xl">
              Seu próximo contrato <span className="text-gradient-gold italic">já está no pipeline.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-ink-300">Explore a demo completa com dados reais de uma operação high-ticket. Leva 30 segundos.</p>
            <Button variant="primary" size="lg" className="mt-10" onClick={demo}>
              Entrar na demo <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[.05] px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-ink-500 sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} Vértice Tecnologia. Feito no Brasil para vender no mundo.</p>
        </div>
      </footer>
    </div>
  )
}
