import { useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, FileUp } from 'lucide-react'
import { useStore } from '../lib/store'
import type { Nota } from '../lib/engine'
import type { Anexo } from '../lib/simples'
import { ANEXOS } from '../lib/simples'
import { money } from '../lib/format'
import { Button, Field, Panel, PanelHead, SelectField, copiar } from '../components/ui'

const MODELO = `cliente;emissao;vencimento;valor;pago_em
Construtora Alfa;05/01/2026;06/03/2026;48.500,00;10/03/2026
Hospital Central;12/01/2026;13/03/2026;22.000,00;
Mercado Bom Dia;20/01/2026;20/01/2026;3.150,00;20/01/2026`

function data(s: string): string | null {
  const t = s.trim()
  if (!t) return null
  let m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (m) {
    const ano = m[3]!.length === 2 ? '20' + m[3] : m[3]!
    return `${ano}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`
  }
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}

function valor(s: string) {
  const t = s.trim().replace(/[R$\s]/g, '')
  const n = t.includes(',') ? Number(t.replace(/\./g, '').replace(',', '.')) : Number(t)
  return Number.isFinite(n) ? n : NaN
}

export function lerCsv(texto: string) {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim())
  if (!linhas.length) return { notas: [] as Nota[], erros: ['Arquivo vazio.'] }
  const sep = linhas[0]!.includes(';') ? ';' : ','
  const cab = linhas[0]!.toLowerCase().split(sep).map((c) => c.trim().normalize('NFD').replace(/[̀-ͯ]/g, ''))
  const col = (...nomes: string[]) => cab.findIndex((c) => nomes.some((n) => c.includes(n)))
  const ic = col('cliente', 'tomador', 'destinatario')
  const ie = col('emissao', 'emitida')
  const iv = col('vencimento')
  const ival = col('valor')
  const ip = col('pago', 'pagamento', 'recebido')
  const erros: string[] = []
  if ([ic, ie, iv, ival].some((x) => x < 0)) return { notas: [], erros: ['Cabeçalho precisa ter as colunas: cliente, emissao, vencimento, valor e (opcional) pago_em.'] }
  const notas: Nota[] = []
  linhas.slice(1).forEach((l, i) => {
    const c = l.split(sep)
    const em = data(c[ie] ?? '')
    const ve = data(c[iv] ?? '')
    const v = valor(c[ival] ?? '')
    if (!em || !ve || !Number.isFinite(v)) {
      if (erros.length < 5) erros.push(`Linha ${i + 2}: data ou valor inválido.`)
      return
    }
    notas.push({ id: `imp-${i}`, cliente: (c[ic] ?? '').trim() || 'Sem nome', emissao: em, vencimento: ve, valor: v, pagoEm: data(c[ip] ?? '') ?? undefined })
  })
  return { notas, erros }
}

export default function Importar() {
  const { adicionar, avisar } = useStore()
  const nav = useNavigate()
  const [texto, setTexto] = useState('')
  const [form, setForm] = useState({ nome: '', cnpj: '', anexo: 'III' as Anexo, segmento: '', crescimento: '5', credito: '50' })
  const { notas, erros } = useMemo(() => (texto.trim() ? lerCsv(texto) : { notas: [], erros: [] }), [texto])
  const total = notas.reduce((s, n) => s + n.valor, 0)

  const arquivo = (ev: ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => setTexto(String(r.result ?? ''))
    r.readAsText(f, 'utf-8')
  }

  const salvar = () => {
    const id = 'e' + Math.random().toString(36).slice(2, 8)
    adicionar({
      id,
      nome: form.nome || 'Empresa importada',
      cnpj: form.cnpj,
      anexo: form.anexo,
      segmento: form.segmento || '—',
      cidade: '',
      responsavel: form.nome || 'cliente',
      telefone: '',
      crescimento: Number(form.crescimento.replace(',', '.')) / 100 || 0,
      vendaParaCredito: Number(form.credito.replace(',', '.')) / 100 || 0,
      notas,
    })
    avisar('Empresa adicionada à carteira')
    nav(`/app/empresa/${id}`)
  }

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="eyebrow">Nova empresa</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Importar notas de um cliente</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">
          Use o relatório de contas a receber do ERP ou a lista de NFS-e com as datas de pagamento. Pelo menos 12 meses de notas deixam a projeção confiável. Os dados ficam só neste navegador.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <PanelHead
            title="Notas (CSV)"
            hint="Colunas: cliente, emissao, vencimento, valor, pago_em. Separador ponto e vírgula ou vírgula."
            action={
              <div className="flex flex-wrap gap-2">
                <Button className="h-8 px-3 text-xs" onClick={() => copiar(MODELO, avisar, 'Modelo copiado')}>
                  <Copy size={14} /> Copiar modelo
                </Button>
                <Button className="h-8 px-3 text-xs" onClick={() => setTexto(MODELO)}>
                  Usar exemplo
                </Button>
              </div>
            }
          />
          <div className="space-y-3 p-5">
            <label htmlFor="csv-arquivo" className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-paper px-4 py-6 text-sm text-muted hover:border-accent hover:text-accent">
              <FileUp size={18} /> Escolher arquivo .csv
              <input id="csv-arquivo" type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={arquivo} />
            </label>
            <label htmlFor="csv-texto" className="block">
              <span className="mb-1.5 block text-[13px] font-medium">Ou cole o conteúdo</span>
              <textarea id="csv-texto" value={texto} onChange={(e) => setTexto(e.target.value)} rows={10} placeholder={MODELO} className="num w-full rounded-lg border border-line bg-paper p-3 text-xs outline-none focus:border-accent" />
            </label>
            {texto.trim() && (
              <div className="rounded-lg bg-sunken p-3 text-sm">
                <p>
                  <b className="num">{notas.length}</b> notas lidas · <span className="num">{money(total)}</span> · {notas.filter((n) => !n.pagoEm).length} em aberto
                </p>
                {erros.map((er) => (
                  <p key={er} className="mt-1 text-xs text-gap">
                    {er}
                  </p>
                ))}
              </div>
            )}
          </div>
        </Panel>
        <Panel className="h-fit lg:col-span-2">
          <PanelHead title="Dados da empresa" />
          <div className="space-y-4 p-5">
            <Field label="Razão social ou nome" id="imp-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <Field label="CNPJ" id="imp-cnpj" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
            <SelectField label="Anexo do Simples" id="imp-anexo" value={form.anexo} onChange={(e) => setForm({ ...form, anexo: e.target.value as Anexo })}>
              {(Object.keys(ANEXOS) as Anexo[]).map((k) => (
                <option key={k} value={k}>
                  {ANEXOS[k].nome}
                </option>
              ))}
            </SelectField>
            <Field label="Atividade" id="imp-seg" value={form.segmento} onChange={(e) => setForm({ ...form, segmento: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Crescimento 2027 (%)" id="imp-cresc" inputMode="decimal" value={form.crescimento} onChange={(e) => setForm({ ...form, crescimento: e.target.value })} />
              <Field label="Vendas p/ empresas c/ crédito (%)" id="imp-cred" inputMode="decimal" value={form.credito} onChange={(e) => setForm({ ...form, credito: e.target.value })} />
            </div>
            <Button variant="primary" className="w-full" disabled={notas.length === 0} onClick={salvar}>
              Analisar empresa
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  )
}
