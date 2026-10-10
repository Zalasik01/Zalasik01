import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, RotateCcw, Sparkles } from 'lucide-react'
import { useStore } from '../lib/store'
import { answer, SUGGESTIONS } from '../lib/copilot'
import { Avatar, RichText } from '../components/ui'
import { cn } from '../lib/format'

interface Msg {
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
}

export default function Copilot() {
  const { db, session } = useStore()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])
  useEffect(() => () => window.clearInterval(timer.current), [])

  const ask = (question: string) => {
    if (!question.trim() || busy) return
    setInput('')
    setBusy(true)
    const full = answer(db, question)
    setMessages((m) => [...m, { role: 'user', text: question }, { role: 'assistant', text: '', streaming: true }])

    // Simula o streaming de um LLM, palavra a palavra.
    const tokens = full.split(/(\s+)/)
    let i = 0
    window.setTimeout(() => {
      timer.current = window.setInterval(() => {
        i = Math.min(tokens.length, i + 3)
        const done = i >= tokens.length
        setMessages((m) => [...m.slice(0, -1), { role: 'assistant', text: tokens.slice(0, i).join(''), streaming: !done }])
        if (done) {
          window.clearInterval(timer.current)
          setBusy(false)
        }
      }, 28)
    }, 450)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(input)
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col animate-fade-up">
      <div className="flex-1 overflow-y-auto pb-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gold-400/30 blur-2xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-600 text-ink-950 shadow-2xl">
                <Sparkles size={28} />
              </div>
            </div>
            <h1 className="mt-6 font-serif text-4xl tracking-tight">Como posso ajudar a vender mais hoje?</h1>
            <p className="mt-2 max-w-md text-sm text-ink-400">
              O Copiloto analisa {db.deals.length} negócios, {db.clients.length} clientes e {db.proposals.length} propostas do seu workspace em tempo real.
            </p>
            <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)} className="glass rounded-2xl px-4 py-3 text-left text-sm text-ink-300 transition hover:border-gold-400/30 hover:text-ink-100">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end gap-3">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-white/[.07] px-4 py-3 text-sm">{m.text}</div>
                  <Avatar name={session?.name ?? 'Você'} size={30} />
                </div>
              ) : (
                <div key={i} className="flex gap-3">
                  <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-gold-300">
                    <Sparkles size={15} />
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    {m.text ? (
                      <RichText text={m.text + (m.streaming ? ' ▍' : '')} />
                    ) : (
                      <div className="flex items-center gap-1 pt-2">
                        {[0, 1, 2].map((d) => (
                          <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-300" style={{ animationDelay: `${d * 120}ms` }} />
                        ))}
                        <span className="ml-2 text-xs text-ink-500">Analisando seus dados…</span>
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
            {!busy && (
              <div className="flex flex-wrap gap-2 pl-10">
                {SUGGESTIONS.filter((s) => !messages.some((m) => m.text === s))
                  .slice(0, 3)
                  .map((s) => (
                    <button key={s} onClick={() => ask(s)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-400 hover:border-gold-400/30 hover:text-ink-100">
                      {s}
                    </button>
                  ))}
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form onSubmit={submit} className="glass flex items-end gap-2 rounded-2xl p-2 focus-within:border-gold-400/40">
        {messages.length > 0 && (
          <button type="button" onClick={() => !busy && setMessages([])} className="p-2.5 text-ink-500 hover:text-ink-200" title="Nova conversa" aria-label="Nova conversa">
            <RotateCcw size={17} />
          </button>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              ask(input)
            }
          }}
          rows={1}
          placeholder="Pergunte sobre receita, riscos, time, canais…"
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-ink-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || busy}
          className={cn('flex h-10 w-10 items-center justify-center rounded-xl transition', input.trim() && !busy ? 'bg-gold-300 text-ink-950' : 'bg-white/[.06] text-ink-500')}
          aria-label="Enviar"
        >
          <ArrowUp size={18} />
        </button>
      </form>
      <p className="mt-2 text-center text-[11px] text-ink-500">O Copiloto usa apenas os dados do seu workspace. Respostas podem conter imprecisões.</p>
    </div>
  )
}
