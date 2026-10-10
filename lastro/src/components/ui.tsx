import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '../lib/format'
import type { Nivel } from '../lib/engine'

export function Button({ variant = 'secondary', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return (
    <button
      className={cn(
        'inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-accent text-accent-ink hover:brightness-110',
        variant === 'secondary' && 'border border-line bg-surface text-ink hover:bg-sunken',
        variant === 'ghost' && 'text-muted hover:bg-sunken hover:text-ink',
        className,
      )}
      {...p}
    />
  )
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('rounded-xl border border-line bg-surface', className)}>{children}</section>
}

export function PanelHead({ title, hint, action }: { title: ReactNode; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="font-display text-[17px] font-bold tracking-tight">{title}</h2>
        {hint && <p className="mt-0.5 text-[13px] text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

const NIVEL: Record<Nivel, { label: string; cls: string; dot: string }> = {
  critico: { label: 'Crítico', cls: 'bg-gap-soft text-gap', dot: 'bg-gap' },
  atencao: { label: 'Atenção', cls: 'bg-warn-soft text-warn', dot: 'bg-warn' },
  estavel: { label: 'Estável', cls: 'bg-ok-soft text-ok', dot: 'bg-ok' },
}

export function NivelPill({ nivel }: { nivel: Nivel }) {
  const n = NIVEL[nivel]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', n.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', n.dot)} />
      {n.label}
    </span>
  )
}

export function Field({ label, hint, id, className, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; id: string }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      <input id={id} className={cn('h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm outline-none focus:border-accent', className)} {...p} />
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  )
}

export function SelectField({ label, id, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; id: string }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      <select id={id} className="h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm outline-none focus:border-accent" {...p}>
        {children}
      </select>
    </label>
  )
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: ReactNode; tone?: 'gap' | 'ok' | 'warn' }) {
  return (
    <div className="min-w-0">
      <p className="eyebrow">{label}</p>
      <p className={cn('num mt-1.5 whitespace-nowrap text-xl font-semibold sm:text-2xl', tone === 'gap' && 'text-gap', tone === 'ok' && 'text-ok', tone === 'warn' && 'text-warn')}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  )
}

export async function copiar(texto: string, avisar: (m: string) => void, msg = 'Copiado') {
  try {
    await navigator.clipboard.writeText(texto)
    avisar(msg)
  } catch {
    avisar('Não foi possível copiar. Selecione o texto e copie manualmente.')
  }
}
