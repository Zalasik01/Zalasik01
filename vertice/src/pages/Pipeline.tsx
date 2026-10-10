import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { AlertTriangle, CalendarDays, Clock, FileText, Plus, Search, Trash2, Trophy, XCircle } from 'lucide-react'
import { useStore } from '../lib/store'
import { OPEN_STAGES, STAGES, type Deal, type Stage } from '../lib/types'
import { cn, date, daysBetween, money, moneyCompact } from '../lib/format'
import { Avatar, Badge, Button, Drawer, Input, PageHeader, Select, Textarea } from '../components/ui'
import { DealModal } from '../components/DealModal'

function DealCard({ deal, overlay, onOpen }: { deal: Deal; overlay?: boolean; onOpen?: () => void }) {
  const { db } = useStore()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id })
  const client = db.clients.find((c) => c.id === deal.clientId)
  const owner = db.members.find((m) => m.id === deal.ownerId)
  const idle = daysBetween(deal.lastActivityAt)
  const hasProposal = db.proposals.some((p) => p.dealId === deal.id)
  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : listeners)}
      {...(overlay ? {} : attributes)}
      onClick={onOpen}
      className={cn(
        'group cursor-grab rounded-xl border border-white/[.07] bg-ink-850 p-3.5 transition select-none hover:border-white/15 active:cursor-grabbing',
        isDragging && 'opacity-30',
        overlay && 'rotate-2 border-gold-400/40 shadow-2xl shadow-black/60',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-snug font-medium">{deal.title}</p>
        {owner && <Avatar name={owner.name} color={owner.color} size={22} />}
      </div>
      <p className="mt-1 truncate text-xs text-ink-400">{client?.company}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-gold-200">{money(deal.value)}</span>
        <div className="flex items-center gap-2 text-ink-500">
          {hasProposal && <FileText size={13} />}
          {idle >= 10 ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-300">
              <AlertTriangle size={10} /> {idle}d parado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px]">
              <Clock size={11} /> {idle === 0 ? 'hoje' : `${idle}d`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function Column({ stage, deals, onOpen, onAdd }: { stage: Stage; deals: Deal[]; onOpen: (id: string) => void; onAdd: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const meta = STAGES.find((s) => s.id === stage)!
  const total = deals.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex w-[290px] shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
          <span className="text-sm font-medium">{meta.label}</span>
          <span className="text-xs text-ink-500">{deals.length}</span>
        </div>
        <span className="text-xs text-ink-400">{moneyCompact(total)}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[420px] flex-1 flex-col gap-2 rounded-2xl border border-dashed p-2 transition',
          isOver ? 'border-gold-400/50 bg-gold-400/[.04]' : 'border-white/[.05] bg-white/[.015]',
        )}
      >
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} onOpen={() => onOpen(d.id)} />
        ))}
        <button onClick={onAdd} className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs text-ink-500 transition hover:bg-white/[.03] hover:text-ink-200">
          <Plus size={13} /> Adicionar
        </button>
      </div>
    </div>
  )
}

function CloseZone({ stage }: { stage: 'ganho' | 'perdido' }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const won = stage === 'ganho'
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-2xl border border-dashed py-5 text-sm transition',
        won ? 'border-emerald-400/30 text-emerald-300' : 'border-rose-400/30 text-rose-300',
        isOver && (won ? 'scale-[1.02] bg-emerald-400/10' : 'scale-[1.02] bg-rose-400/10'),
      )}
    >
      {won ? <Trophy size={16} /> : <XCircle size={16} />} Solte aqui para marcar como {won ? 'ganho' : 'perdido'}
    </div>
  )
}

function DealDrawer({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const { db, updateDeal, moveDeal, deleteDeal, createProposal, toast } = useStore()
  const nav = useNavigate()
  const client = db.clients.find((c) => c.id === deal.clientId)
  const proposals = db.proposals.filter((p) => p.dealId === deal.id)
  const [notes, setNotes] = useState(deal.notes)
  const stage = STAGES.find((s) => s.id === deal.stage)!

  return (
    <div className="p-6">
      <Badge color={stage.color}>{stage.label}</Badge>
      <h2 className="mt-3 font-serif text-3xl leading-tight">{deal.title}</h2>
      <p className="mt-1 text-sm text-ink-400">
        {client?.name} · {client?.company}
      </p>
      <p className="mt-5 text-3xl font-semibold tracking-tight text-gold-200">{money(deal.value)}</p>
      <p className="text-xs text-ink-500">{stage.probability}% de probabilidade · {money(deal.value * (stage.probability / 100))} ponderado</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Select label="Etapa" value={deal.stage} onChange={(e) => (moveDeal(deal.id, e.target.value as Stage), toast('Etapa atualizada'))}>
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
        <Select label="Responsável" value={deal.ownerId} onChange={(e) => updateDeal(deal.id, { ownerId: e.target.value })}>
          {db.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
        <Input label="Valor (R$)" type="number" defaultValue={deal.value} onBlur={(e) => updateDeal(deal.id, { value: Number(e.target.value) || 0 })} />
        <Input
          label="Previsão de fechamento"
          type="date"
          defaultValue={deal.expectedClose.slice(0, 10)}
          onBlur={(e) => e.target.value && updateDeal(deal.id, { expectedClose: new Date(e.target.value).toISOString() })}
        />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-white/[.06] p-4 text-sm">
        <div>
          <dt className="text-xs text-ink-500">Origem</dt>
          <dd className="mt-0.5">{deal.source}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-500">Criado em</dt>
          <dd className="mt-0.5">{date(deal.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-500">Última atividade</dt>
          <dd className="mt-0.5">{daysBetween(deal.lastActivityAt)} dias atrás</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-500">E-mail</dt>
          <dd className="mt-0.5 truncate">{client?.email || '—'}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <Textarea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== deal.notes && (updateDeal(deal.id, { notes }), toast('Notas salvas'))} placeholder="Dores, decisores, próximos passos…" />
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-medium text-ink-300">Propostas</p>
        {proposals.map((p) => (
          <button key={p.id} onClick={() => nav(`/app/propostas/${p.id}`)} className="mb-2 flex w-full items-center justify-between rounded-xl border border-white/[.06] px-3 py-2.5 text-sm hover:bg-white/[.03]">
            <span className="flex items-center gap-2">
              <FileText size={14} className="text-gold-300" /> Proposta #{p.number}
            </span>
            <span className="text-xs text-ink-400 capitalize">{p.status}</span>
          </button>
        ))}
        <Button
          className="w-full"
          onClick={() => {
            const p = createProposal(deal.id)
            nav(`/app/propostas/${p.id}`)
          }}
        >
          <FileText size={15} /> Criar proposta
        </Button>
      </div>

      <div className="mt-8 flex gap-2 border-t border-white/[.06] pt-6">
        <Button variant="primary" className="flex-1" onClick={() => (moveDeal(deal.id, 'ganho'), toast('Negócio ganho! 🎉'), onClose())}>
          <Trophy size={15} /> Marcar ganho
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            deleteDeal(deal.id)
            toast('Negócio excluído', 'info')
            onClose()
          }}
          aria-label="Excluir negócio"
        >
          <Trash2 size={15} />
        </Button>
      </div>
    </div>
  )
}

export default function Pipeline() {
  const { db, moveDeal, toast } = useStore()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [owner, setOwner] = useState('todos')
  const [dragging, setDragging] = useState<string | null>(null)
  const [newIn, setNewIn] = useState<Stage | null>(null)
  const staleOnly = params.get('filtro') === 'parados'
  const openId = params.get('negocio')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const deals = useMemo(
    () =>
      db.deals.filter((d) => {
        if (owner !== 'todos' && d.ownerId !== owner) return false
        if (staleOnly && daysBetween(d.lastActivityAt) < 10) return false
        if (!q) return true
        const c = db.clients.find((x) => x.id === d.clientId)
        return `${d.title} ${c?.name} ${c?.company}`.toLowerCase().includes(q.toLowerCase())
      }),
    [db, q, owner, staleOnly],
  )

  const openDeal = db.deals.find((d) => d.id === openId)
  const total = deals.filter((d) => OPEN_STAGES.includes(d.stage)).reduce((s, d) => s + d.value, 0)

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null)
    const stage = e.over?.id as Stage | undefined
    if (!stage) return
    const deal = db.deals.find((d) => d.id === e.active.id)
    if (!deal || deal.stage === stage) return
    moveDeal(deal.id, stage)
    toast(stage === 'ganho' ? `🎉 ${deal.title} ganho!` : `Movido para ${STAGES.find((s) => s.id === stage)!.label}`, stage === 'perdido' ? 'info' : 'success')
  }

  const setOpen = (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('negocio', id)
    else next.delete('negocio')
    setParams(next)
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Pipeline"
        subtitle={`${money(total)} em ${deals.filter((d) => OPEN_STAGES.includes(d.stage)).length} negócios abertos`}
        actions={
          <Button variant="primary" onClick={() => setNewIn('lead')}>
            <Plus size={15} /> Novo negócio
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrar negócios…"
            className="h-9 w-full rounded-xl border border-white/10 bg-white/[.03] pr-3 pl-9 text-sm outline-none placeholder:text-ink-500 focus:border-gold-400/50"
          />
        </div>
        <select
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="h-9 rounded-xl border border-white/10 bg-ink-900 px-3 text-sm outline-none"
        >
          <option value="todos">Todo o time</option>
          {db.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            const next = new URLSearchParams(params)
            if (staleOnly) next.delete('filtro')
            else next.set('filtro', 'parados')
            setParams(next)
          }}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm transition',
            staleOnly ? 'border-rose-400/40 bg-rose-400/10 text-rose-300' : 'border-white/10 text-ink-400 hover:text-ink-200',
          )}
        >
          <AlertTriangle size={14} /> Parados há 10+ dias
        </button>
        <span className="ml-auto hidden items-center gap-1.5 text-xs text-ink-500 md:flex">
          <CalendarDays size={13} /> Arraste os cards para mover entre etapas
        </span>
      </div>

      <DndContext sensors={sensors} onDragStart={(e) => setDragging(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
          <div className="flex gap-4">
            {OPEN_STAGES.map((s) => (
              <Column key={s} stage={s} deals={deals.filter((d) => d.stage === s)} onOpen={setOpen} onAdd={() => setNewIn(s)} />
            ))}
          </div>
        </div>
        <div className={cn('mt-2 flex gap-4 transition-all', dragging ? 'opacity-100' : 'opacity-40')}>
          <CloseZone stage="ganho" />
          <CloseZone stage="perdido" />
        </div>
        <DragOverlay dropAnimation={null}>{dragging && db.deals.find((d) => d.id === dragging) ? <DealCard deal={db.deals.find((d) => d.id === dragging)!} overlay /> : null}</DragOverlay>
      </DndContext>

      <Drawer open={!!openDeal} onClose={() => setOpen(null)}>
        {openDeal && <DealDrawer key={openDeal.id} deal={openDeal} onClose={() => setOpen(null)} />}
      </Drawer>
      {newIn && <DealModal open defaultStage={newIn} onClose={() => setNewIn(null)} />}
    </div>
  )
}
