// Verificações do motor de cálculo. Rodar com: npm test
import assert from 'node:assert/strict'
import { aliquotaEfetiva } from './simples.ts'
import { nivel, precoAPrazo, projecao, type Empresa } from './engine.ts'
import { criarCarteira } from './seed.ts'

const perto = (a: number, b: number, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`)

// Alíquota efetiva: Anexo III, RBT12 R$ 1,2 mi → (1.200.000 × 16% − 35.640) / 1.200.000 = 13,03%
perto(aliquotaEfetiva('III', 1_200_000), (1_200_000 * 0.16 - 35_640) / 1_200_000)
// Primeira faixa é a nominal
perto(aliquotaEfetiva('I', 150_000), 0.04)
// Anexo V, RBT12 R$ 2 mi → (2.000.000 × 23% − 62.100) / 2.000.000
perto(aliquotaEfetiva('V', 2_000_000), (2_000_000 * 0.23 - 62_100) / 2_000_000)

// Preço a prazo: sem juros, sem calote, à vista → nada muda
const neutro = precoAPrazo({ valorAVista: 1000, aliquota: 0.1, parcelasDias: [0], jurosMes: 0, inadimplencia: 0 })
perto(neutro.precoMinimo, 1000)
perto(neutro.custoImpostoAntecipado, 0)

// Sem juros mas com calote de 10%: regra antiga x = P/0,9; nova x = P·0,9/(0,9−0,1) → imposto sobre o calote encarece
const calote = precoAPrazo({ valorAVista: 1000, aliquota: 0.1, parcelasDias: [30], jurosMes: 0, inadimplencia: 0.1 })
perto(calote.precoMinimoRegraAntiga, 1000 / 0.9)
perto(calote.precoMinimo, (1000 * 0.9) / 0.8)
assert.ok(calote.custoImpostoAntecipado > 0)

// Com juros: imposto antecipado custa mais quanto maior o prazo
const p30 = precoAPrazo({ valorAVista: 1000, aliquota: 0.12, parcelasDias: [30], jurosMes: 0.025, inadimplencia: 0.02 })
const p90 = precoAPrazo({ valorAVista: 1000, aliquota: 0.12, parcelasDias: [90], jurosMes: 0.025, inadimplencia: 0.02 })
assert.ok(p90.custoImpostoAntecipado > p30.custoImpostoAntecipado)
// Decomposição soma o total
perto(p90.custoFinanceiro + p90.custoRisco + p90.custoImpostoAntecipado, p90.precoMinimo - 1000, 1e-6)

// Projeção: empresa que recebe tudo à vista não tem descasamento
const hoje = new Date(2026, 9, 10, 12)
const avista: Empresa = {
  id: 'x', nome: 'À vista', cnpj: '', anexo: 'I', segmento: '', cidade: '', responsavel: '', telefone: '', crescimento: 0, vendaParaCredito: 0,
  notas: Array.from({ length: 14 }, (_, i) => {
    const d = new Date(2025, 8 + i, 5)
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-05`
    return { id: String(i), cliente: 'C', emissao: s, vencimento: s, valor: 10_000, pagoEm: d < hoje ? s : undefined }
  }),
}
const pa = projecao(avista, hoje, 'neutro')
assert.ok(pa.picoCapitalDeGiro < 1, `pico ${pa.picoCapitalDeGiro}`)
assert.equal(nivel(pa.picoSobreFaturamento), 'estavel')

// Carteira de exemplo: quem vende a 90 dias deve aparecer pior do que o varejo à vista
const carteira = criarCarteira(hoje)
const res = Object.fromEntries(carteira.map((e) => [e.nome, projecao(e, hoje, 'pior')]))
for (const [nome, r] of Object.entries(res)) {
  console.log(`${nome.padEnd(28)} RBT12 ${Math.round(r.rbt12).toLocaleString('pt-BR').padStart(10)}  alíq ${(r.aliquota * 100).toFixed(2)}%  PMR ${Math.round(r.comportamento.prazoMedio)}d  inad ${(r.comportamento.inadimplencia * 100).toFixed(1)}%  pico ${Math.round(r.picoCapitalDeGiro).toLocaleString('pt-BR').padStart(8)} (${(r.picoSobreFaturamento * 100).toFixed(1)}% · ${nivel(r.picoSobreFaturamento)}) em ${r.mesPico}  transição ${Math.round(r.recebiveisAntigos2027).toLocaleString('pt-BR')}`)
}
assert.ok(res['Nexo Engenharia Elétrica']!.picoCapitalDeGiro > res['Empório Trigo & Cia']!.picoCapitalDeGiro)
assert.equal(nivel(res['Empório Trigo & Cia']!.picoSobreFaturamento), 'estavel')

console.log('\n✔ todos os testes passaram')
