import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, FileText, LayoutDashboard, Plus, Search, Settings, Sparkles, Users, KanbanSquare, type LucideIcon } from 'lucide-react'
import { useStore } from '../lib/store'
import { cn, money } from '../lib/format'

interface Item {
  id: string
  label: string
  hint?: string
  icon: LucideIcon
  group: string
  run: () => void
}

export function CommandPalette({ open, onClose, onNewDeal }: { open: boolean; onClose: () => void; onNewDeal: () => void }) {
  const { db } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  const items = useMemo<Item[]>(() => {
    const go = (to: string) => () => {
      nav(to)
      onClose()
    }
    const base: Item[] = [
      { id: 'new', label: 'Criar novo negócio', icon: Plus, group: 'Ações', run: () => (onClose(), onNewDeal()) },
      { id: 'ask', label: 'Perguntar ao Copiloto', icon: Sparkles, group: 'Ações', run: go('/app/copiloto') },
      { id: 'dash', label: 'Visão geral', icon: LayoutDashboard, group: 'Navegar', run: go('/app') },
      { id: 'pipe', label: 'Pipeline', icon: KanbanSquare, group: 'Navegar', run: go('/app/pipeline') },
      { id: 'cli', label: 'Clientes', icon: Users, group: 'Navegar', run: go('/app/clientes') },
      { id: 'prop', label: 'Propostas', icon: FileText, group: 'Navegar', run: go('/app/propostas') },
      { id: 'set', label: 'Configurações', icon: Settings, group: 'Navegar', run: go('/app/configuracoes') },
    ]
    const term = q.trim().toLowerCase()
    if (!term) return base
    const deals: Item[] = db.deals
      .filter((d) => d.title.toLowerCase().includes(term) || db.clients.find((c) => c.id === d.clientId)?.company.toLowerCase().includes(term))
      .slice(0, 6)
      .map((d) => ({
        id: d.id,
        label: d.title,
        hint: `${db.clients.find((c) => c.id === d.clientId)?.company} · ${money(d.value)}`,
        icon: Briefcase,
        group: 'Negócios',
        run: go(`/app/pipeline?negocio=${d.id}`),
      }))
    const clients: Item[] = db.clients
      .filter((c) => `${c.name} ${c.company}`.toLowerCase().includes(term))
      .slice(0, 5)
      .map((c) => ({ id: c.id, label: c.name, hint: c.company, icon: Users, group: 'Clientes', run: go(`/app/clientes?q=${encodeURIComponent(c.name)}`) }))
    return [...base.filter((b) => b.label.toLowerCase().includes(term)), ...deals, ...clients]
  }, [q, db, nav, onClose, onNewDeal])

  if (!open) return null

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') (e.preventDefault(), setActive((a) => Math.min(items.length - 1, a + 1)))
    if (e.key === 'ArrowUp') (e.preventDefault(), setActive((a) => Math.max(0, a - 1)))
    if (e.key === 'Enter') items[active]?.run()
    if (e.key === 'Escape') onClose()
  }

  let lastGroup = ''
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-[14vh] backdrop-blur-sm animate-fade-in" onMouseDown={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl animate-fade-up" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/[.06] px-4">
          <Search size={18} className="text-ink-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => (setQ(e.target.value), setActive(0))}
            onKeyDown={onKey}
            placeholder="Busque negócios, clientes ou ações…"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-500"
          />
          <kbd className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-ink-400">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 && <p className="px-3 py-8 text-center text-sm text-ink-400">Nada encontrado para “{q}”.</p>}
          {items.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null
            lastGroup = item.group
            return (
              <div key={item.id}>
                {header && <p className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-wider text-ink-500 uppercase">{header}</p>}
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={item.run}
                  className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm', i === active ? 'bg-white/[.06] text-ink-100' : 'text-ink-300')}
                >
                  <item.icon size={16} className={i === active ? 'text-gold-300' : 'text-ink-500'} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="truncate text-xs text-ink-500">{item.hint}</span>}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
