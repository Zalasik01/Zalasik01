import { cn } from '../lib/format'

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-ink-700 to-ink-900 ring-1 ring-white/10">
        <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden>
          <defs>
            <linearGradient id="vg" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#f1dfb9" />
              <stop offset="1" stopColor="#c09048" />
            </linearGradient>
          </defs>
          <path d="M6 7l10 19L26 7" fill="none" stroke="url(#vg)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="16" cy="26" r="2.2" fill="#f1dfb9" />
        </svg>
      </span>
      {withText && <span className="font-serif text-[22px] leading-none tracking-tight">Vértice</span>}
    </span>
  )
}
