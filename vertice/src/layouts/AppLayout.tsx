import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, FileText, KanbanSquare, LayoutDashboard, LogOut, Menu, Plus, Search, Settings, Sparkles, Users, X } from 'lucide-react'
import { Logo } from '../components/Logo'
import { Avatar, Button } from '../components/ui'
import { CommandPalette } from '../components/CommandPalette'
import { DealModal } from '../components/DealModal'
import { useStore } from '../lib/store'
import { cn, relative } from '../lib/format'
import { computeKpis } from '../lib/metrics'

const NAV = [
  { to: '/app', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/app/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/app/clientes', label: 'Clientes', icon: Users },
  { to: '/app/propostas', label: 'Propostas', icon: FileText },
  { to: '/app/copiloto', label: 'Copiloto IA', icon: Sparkles, badge: 'IA' },
]

const PLAN_LABEL = { essencial: 'Essencial', escala: 'Escala', private: 'Private' }

export function AppLayout() {
  const { db, session, signOut } = useStore()
  const nav = useNavigate()
  const [palette, setPalette] = useState(false)
  const [newDeal, setNewDeal] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [notifs, setNotifs] = useState(false)
  const kpis = computeKpis(db)

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((p) => !p)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const closePalette = useCallback(() => setPalette(false), [])
  const openNewDeal = useCallback(() => setNewDeal(true), [])

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        <button className="lg:hidden text-ink-400" onClick={() => setMobileNav(false)} aria-label="Fechar menu">
          <X size={18} />
        </button>
      </div>
      <div className="px-3">
        <button
          onClick={() => setPalette(true)}
          className="flex h-9 w-full items-center gap-2 rounded-xl border border-white/[.07] bg-white/[.03] px-3 text-sm text-ink-400 hover:border-white/15"
        >
          <Search size={14} />
          <span className="flex-1 text-left">Buscar…</span>
          <kbd className="rounded border border-white/10 px-1 text-[10px]">⌘K</kbd>
        </button>
      </div>
      <nav className="mt-4 flex-1 space-y-0.5 px-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileNav(false)}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
                isActive ? 'bg-white/[.07] text-ink-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)]' : 'text-ink-400 hover:bg-white/[.03] hover:text-ink-200',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={17} className={isActive ? 'text-gold-300' : ''} />
                <span className="flex-1">{item.label}</span>
                {item.badge && <span className="rounded-md bg-gold-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold-300">{item.badge}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="m-3 rounded-2xl border border-gold-400/15 bg-gradient-to-b from-gold-400/[.08] to-transparent p-4">
        <p className="text-xs text-ink-400">Meta de {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</p>
        <p className="mt-1 text-sm font-semibold">{Math.round(kpis.goalProgress)}% atingida</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.06]">
          <div className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-200" style={{ width: `${Math.min(100, kpis.goalProgress)}%` }} />
        </div>
      </div>

      <div className="border-t border-white/[.06] p-3">
        <NavLink
          to="/app/configuracoes"
          onClick={() => setMobileNav(false)}
          className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2 text-sm', isActive ? 'bg-white/[.07] text-ink-100' : 'text-ink-400 hover:text-ink-200')}
        >
          <Settings size={17} /> Configurações
        </NavLink>
        <div className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2">
          <Avatar name={session?.name ?? 'Você'} size={30} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{session?.name}</p>
            <p className="truncate text-[11px] text-ink-500">
              {db.workspace.name} · {PLAN_LABEL[db.workspace.plan]}
            </p>
          </div>
          <button
            onClick={() => {
              signOut()
              nav('/')
            }}
            className="text-ink-500 hover:text-ink-200"
            title="Sair"
            aria-label="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-ink-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/[.06] bg-ink-950 lg:block">{sidebar}</aside>
      {mobileNav && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileNav(false)}>
          <aside className="h-full w-72 border-r border-white/10 bg-ink-950 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/[.06] bg-ink-950/80 px-4 backdrop-blur-xl sm:px-8">
          <button className="text-ink-300 lg:hidden" onClick={() => setMobileNav(true)} aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <div className="hidden text-sm text-ink-400 sm:block">
            Bom dia, <span className="text-ink-100">{session?.name.split(' ')[0]}</span> ✦
          </div>
          <div className="flex-1" />
          <div className="relative">
            <button onClick={() => setNotifs((n) => !n)} className="relative rounded-xl p-2 text-ink-400 hover:bg-white/5 hover:text-ink-100" aria-label="Notificações">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gold-400 ring-2 ring-ink-950" />
            </button>
            {notifs && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-ink-900 p-2 shadow-2xl animate-fade-up">
                <p className="px-3 py-2 text-xs font-semibold text-ink-400">Atividade recente</p>
                {db.activities.slice(0, 5).map((a) => (
                  <div key={a.id} className="rounded-xl px-3 py-2 text-sm hover:bg-white/[.03]">
                    <p className="text-ink-200">{a.text}</p>
                    <p className="mt-0.5 text-[11px] text-ink-500">{relative(a.at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button variant="primary" size="sm" onClick={() => setNewDeal(true)}>
            <Plus size={15} /> <span className="hidden sm:inline">Novo negócio</span>
          </Button>
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8" onClick={() => notifs && setNotifs(false)}>
          <Outlet />
        </main>
      </div>

      <CommandPalette open={palette} onClose={closePalette} onNewDeal={openNewDeal} />
      {newDeal && <DealModal open onClose={() => setNewDeal(false)} />}
    </div>
  )
}
