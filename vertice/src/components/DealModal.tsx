import { useState, type FormEvent } from 'react'
import { useStore } from '../lib/store'
import { OPEN_STAGES, STAGES, type Stage } from '../lib/types'
import { Button, Input, Modal, Select, Textarea } from './ui'

export function DealModal({ open, onClose, defaultStage = 'lead' }: { open: boolean; onClose: () => void; defaultStage?: Stage }) {
  const { db, addDeal, addClient, toast } = useStore()
  const [clientMode, setClientMode] = useState<'existente' | 'novo'>('existente')
  const [form, setForm] = useState({
    title: '',
    value: '',
    clientId: db.clients[0]?.id ?? '',
    newName: '',
    newCompany: '',
    stage: defaultStage,
    ownerId: 'm1',
    source: 'Indicação',
    expectedClose: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
    notes: '',
  })
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    let clientId = form.clientId
    if (clientMode === 'novo') {
      const c = addClient({
        name: form.newName,
        company: form.newCompany || form.newName,
        email: '',
        phone: '',
        segment: 'Outro',
        status: 'prospect',
        tags: [],
      })
      clientId = c.id
    }
    addDeal({
      title: form.title,
      value: Number(form.value.replace(/\D/g, '')) || 0,
      clientId,
      ownerId: form.ownerId,
      stage: form.stage,
      source: form.source,
      expectedClose: new Date(form.expectedClose).toISOString(),
      notes: form.notes,
    })
    toast('Negócio criado no pipeline')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo negócio">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Título do negócio" placeholder="Ex.: Mentoria Executiva 12 meses" required value={form.title} onChange={set('title')} autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Valor (R$)" inputMode="numeric" placeholder="48.000" required value={form.value} onChange={set('value')} />
          <Select label="Etapa" value={form.stage} onChange={set('stage')}>
            {OPEN_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGES.find((x) => x.id === s)!.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-300">Cliente</span>
            <button type="button" className="text-xs text-gold-300 hover:underline" onClick={() => setClientMode((m) => (m === 'novo' ? 'existente' : 'novo'))}>
              {clientMode === 'novo' ? 'Escolher existente' : '+ Novo cliente'}
            </button>
          </div>
          {clientMode === 'existente' ? (
            <Select value={form.clientId} onChange={set('clientId')}>
              {db.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.company}
                </option>
              ))}
            </Select>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Nome do contato" required value={form.newName} onChange={set('newName')} />
              <Input placeholder="Empresa" value={form.newCompany} onChange={set('newCompany')} />
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Select label="Responsável" value={form.ownerId} onChange={set('ownerId')}>
            {db.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name.split(' ')[0]}
              </option>
            ))}
          </Select>
          <Select label="Origem" value={form.source} onChange={set('source')}>
            {['Indicação', 'LinkedIn', 'Evento', 'Inbound', 'Parceiro', 'Outbound'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Input label="Previsão" type="date" value={form.expectedClose} onChange={set('expectedClose')} />
        </div>
        <Textarea label="Notas" placeholder="Contexto, dores, decisores…" value={form.notes} onChange={set('notes')} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Criar negócio
          </Button>
        </div>
      </form>
    </Modal>
  )
}
