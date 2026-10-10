import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { Logo } from '../components/Logo'
import { Button, Input } from '../components/ui'
import { useStore } from '../lib/store'

export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, updateWorkspace, toast } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const from = (loc.state as { from?: string } | null)?.from ?? '/app'
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', company: '', password: '' })
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const name = form.name || form.email.split('@')[0]!.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      signIn({ name, email: form.email })
      if (mode === 'signup' && form.company) updateWorkspace({ name: form.company })
      toast(mode === 'signup' ? 'Conta criada. Bem-vindo ao Vértice!' : `Bem-vindo de volta, ${name.split(' ')[0]}!`)
      nav(from)
    }, 700)
  }

  const demo = () => {
    signIn({ name: 'Nicolas Zalasik', email: 'nicolas@vertice.app' })
    nav('/app')
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/">
          <Logo />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12 animate-fade-up">
          <h1 className="font-serif text-4xl tracking-tight">{mode === 'login' ? 'Bem-vindo de volta' : 'Comece seus 14 dias'}</h1>
          <p className="mt-2 text-sm text-ink-400">
            {mode === 'login' ? 'Entre para acompanhar sua receita.' : 'Sem cartão. Configuração em menos de 2 minutos.'}
          </p>

          <button
            onClick={demo}
            className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-gold-400/25 bg-gold-400/[.06] p-4 text-left transition hover:bg-gold-400/10"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400/15 text-gold-300">
              <Sparkles size={18} />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium">Entrar com a conta demo</span>
              <span className="block text-xs text-ink-400">Workspace com 12 meses de dados reais</span>
            </span>
            <ArrowRight size={16} className="text-gold-300" />
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-ink-500">
            <span className="h-px flex-1 bg-white/10" /> ou com e-mail <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <Input label="Seu nome" required value={form.name} onChange={set('name')} placeholder="Ana Ribeiro" />
                <Input label="Empresa" value={form.company} onChange={set('company')} placeholder="Ribeiro Consultoria" />
              </>
            )}
            <Input label="E-mail corporativo" type="email" required value={form.email} onChange={set('email')} placeholder="voce@empresa.com.br" />
            <Input label="Senha" type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="••••••••" />
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-400">
            {mode === 'login' ? (
              <>
                Ainda não tem conta? <Link to="/criar-conta" className="text-gold-300 hover:underline">Teste grátis</Link>
              </>
            ) : (
              <>
                Já tem conta? <Link to="/entrar" className="text-gold-300 hover:underline">Entrar</Link>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-white/[.06] bg-ink-900 lg:block">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="absolute top-1/3 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gold-400/20 blur-[120px]" />
        <div className="relative flex h-full flex-col justify-end p-16">
          <p className="font-serif text-4xl leading-tight">
            “Fechamos <span className="text-gradient-gold italic">R$ 1,2 milhão</span> no primeiro trimestre usando o Vértice. Nunca tivemos tanta clareza.”
          </p>
          <p className="mt-6 text-sm text-ink-400">Ricardo Almeida · Almeida Holdings</p>
        </div>
      </div>
    </div>
  )
}
