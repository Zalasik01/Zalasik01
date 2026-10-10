import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { useStore } from '../lib/store'

export function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="glass flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm shadow-2xl animate-fade-up">
          {t.tone === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
          {t.tone === 'info' && <Info size={16} className="text-gold-300" />}
          {t.tone === 'error' && <XCircle size={16} className="text-rose-400" />}
          {t.title}
        </div>
      ))}
    </div>
  )
}
