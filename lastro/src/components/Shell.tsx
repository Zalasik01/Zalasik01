import { NavLink, Outlet, Link } from 'react-router-dom'
import { Briefcase, Calculator, CalendarClock, Upload } from 'lucide-react'
import { useStore } from '../lib/store'
import { cn, diasAte } from '../lib/format'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <rect width="32" height="32" rx="7" fill="var(--accent)" />
        <path d="M9 8v16h14" fill="none" stroke="var(--accent-ink)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 19l4-5 3 3" fill="none" stroke="var(--accent-ink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-xl font-extrabold tracking-tight">Lastro</span>
    </span>
  )
}

const NAV = [
  { to: '/app', label: 'Carteira', icon: Briefcase, end: true },
  { to: '/app/calculadora', label: 'Preço a prazo', icon: Calculator },
  { to: '/app/calendario', label: 'Calendário 2027', icon: CalendarClock },
  { to: '/app/importar', label: 'Importar empresa', icon: Upload },
]

export function Shell() {
  const { hoje, aviso } = useStore()
  const faltam = diasAte(new Date(2027, 0, 1), hoje)
  return (
    <div className="min-h-screen">
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link to="/" aria-label="Início">
            <Logo />
          </Link>
          <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn('inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm', isActive ? 'bg-accent-soft font-medium text-accent' : 'text-muted hover:text-ink')
                }
              >
                <n.icon size={16} /> {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            {faltam > 0 ? (
              <span className="rounded-full bg-gap-soft px-3 py-1 font-medium text-gap">
                <span className="num">{faltam}</span> dias para o fim do regime de caixa
              </span>
            ) : (
              <span className="rounded-full bg-accent-soft px-3 py-1 font-medium text-accent">Regra de faturamento em vigor</span>
            )}
            <span className="hidden text-muted lg:inline">Escritório Moraes Contabilidade</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      {aviso && (
        <div role="status" className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-50 rounded-lg bg-ink px-4 py-3 text-sm text-paper shadow-lg animate-rise">
          {aviso}
        </div>
      )}
    </div>
  )
}
