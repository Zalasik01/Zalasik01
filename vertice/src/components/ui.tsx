import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { X } from 'lucide-react'
import { cn, initials } from '../lib/format'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 cursor-pointer active:scale-[.98]',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-[15px]',
        variant === 'primary' &&
          'bg-gradient-to-b from-gold-300 to-gold-500 text-ink-950 shadow-[0_8px_30px_-8px] shadow-gold-500/50 hover:brightness-110',
        variant === 'secondary' && 'bg-white/[.06] text-ink-100 border border-white/10 hover:bg-white/10',
        variant === 'ghost' && 'text-ink-300 hover:text-ink-100 hover:bg-white/5',
        variant === 'danger' && 'bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20',
        className,
      )}
      {...props}
    />
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-2xl border border-white/[.07] bg-ink-900/80', className)}>{children}</div>
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
      <div>
        <h3 className="text-sm font-semibold text-ink-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Badge({ children, color, className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium', className)}
      style={color ? { background: `${color}1f`, color } : undefined}
    >
      {children}
    </span>
  )
}

export function Avatar({ name, color = '#d4ab68', size = 32 }: { name: string; color?: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-ink-900"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `${color}26`, color }}
      title={name}
    >
      {initials(name)}
    </span>
  )
}

const field =
  'w-full rounded-xl border border-white/10 bg-ink-950/60 px-3.5 text-sm text-ink-100 placeholder:text-ink-500 outline-none transition focus:border-gold-400/60 focus:ring-4 focus:ring-gold-400/10'

export function Input({ label, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium text-ink-300">{label}</span>}
      <input className={cn(field, 'h-10', className)} {...props} />
    </label>
  )
}

export function Textarea({ label, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium text-ink-300">{label}</span>}
      <textarea className={cn(field, 'min-h-24 py-2.5', className)} {...props} />
    </label>
  )
}

export function Select({ label, className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium text-ink-300">{label}</span>}
      <select className={cn(field, 'h-10 appearance-none', className)} {...props}>
        {children}
      </select>
    </label>
  )
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition', checked ? 'bg-gold-400' : 'bg-ink-600')}
    >
      <span className={cn('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition', checked && 'translate-x-5')} />
    </button>
  )
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string }) {
  useEscape(onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[10vh] backdrop-blur-sm animate-fade-in" onMouseDown={onClose}>
      <div className={cn('w-full rounded-2xl border border-white/10 bg-ink-900 shadow-2xl animate-fade-up', width)} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/[.06] px-5 py-4">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-400 hover:bg-white/5 hover:text-ink-100" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEscape(onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[2px] animate-fade-in" onMouseDown={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-ink-900 shadow-2xl animate-slide-in" onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-300">{icon}</div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-400">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

/** Renderiza o markdown simples produzido pelo Copiloto (negrito, listas, separadores). */
export function RichText({ text }: { text: string }) {
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') ? (
        <strong key={i} className="font-semibold text-ink-100">
          {part.slice(2, -2)}
        </strong>
      ) : (
        part
      ),
    )
  return (
    <div className="space-y-2 text-sm leading-relaxed text-ink-200">
      {text.split('\n').map((line, i) => {
        if (line.trim() === '---') return <hr key={i} className="border-white/10" />
        if (!line.trim()) return null
        if (line.startsWith('- ')) return <p key={i} className="flex gap-2 pl-1"><span className="text-gold-400">•</span><span>{inline(line.slice(2))}</span></p>
        return <p key={i}>{inline(line)}</p>
      })}
    </div>
  )
}
