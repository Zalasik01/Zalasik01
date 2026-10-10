import type { Empresa, Nota } from './engine.ts'
import type { Anexo } from './simples.ts'

// Carteira de exemplo de um escritório contábil. Notas geradas de forma determinística a partir do "hoje".
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

interface Perfil {
  nome: string
  cnpj: string
  anexo: Anexo
  segmento: string
  cidade: string
  responsavel: string
  faturamentoMensal: number
  notasPorMes: number
  prazos: number[] // dias de prazo concedidos (sorteados)
  atrasoMax: number
  inadimplencia: number
  crescimento: number
  vendaParaCredito: number
  clientes: string[]
}

const PERFIS: Perfil[] = [
  {
    nome: 'Nexo Engenharia Elétrica',
    cnpj: '34.218.905/0001-12',
    anexo: 'III',
    segmento: 'Manutenção elétrica industrial',
    cidade: 'Campinas, SP',
    responsavel: 'Ricardo Nunes',
    faturamentoMensal: 210_000,
    notasPorMes: 9,
    prazos: [60, 90, 90, 120],
    atrasoMax: 25,
    inadimplencia: 0.03,
    crescimento: 0.08,
    vendaParaCredito: 0.92,
    clientes: ['Grupo Votoran Cimentos', 'Ambev Jaguariúna', 'Rede Hospitalar Santa Lúcia', 'Shopping Iguatemi Campinas', 'Condomínio Logístico Viracopos'],
  },
  {
    nome: 'Clínica Respira',
    cnpj: '27.661.430/0001-85',
    anexo: 'III',
    segmento: 'Fisioterapia e pneumologia (convênios)',
    cidade: 'Belo Horizonte, MG',
    responsavel: 'Dra. Paula Andrade',
    faturamentoMensal: 145_000,
    notasPorMes: 6,
    prazos: [60, 90, 90, 105],
    atrasoMax: 45,
    inadimplencia: 0.06,
    crescimento: 0.05,
    vendaParaCredito: 0.15,
    clientes: ['Unimed BH', 'Bradesco Saúde', 'SulAmérica', 'Amil', 'Particular'],
  },
  {
    nome: 'Alfa Usinagem de Precisão',
    cnpj: '19.402.877/0001-40',
    anexo: 'II',
    segmento: 'Peças usinadas para montadoras',
    cidade: 'Joinville, SC',
    responsavel: 'Marcos Wiese',
    faturamentoMensal: 260_000,
    notasPorMes: 14,
    prazos: [28, 45, 60, 60],
    atrasoMax: 15,
    inadimplencia: 0.015,
    crescimento: 0.04,
    vendaParaCredito: 0.97,
    clientes: ['Tupy Fundições', 'WEG Equipamentos', 'Whirlpool Joinville', 'Schulz Compressores', 'Embraco'],
  },
  {
    nome: 'Studio Pixel Comunicação',
    cnpj: '41.903.256/0001-07',
    anexo: 'III',
    segmento: 'Agência de marketing digital (fee mensal)',
    cidade: 'Recife, PE',
    responsavel: 'Camila Rêgo',
    faturamentoMensal: 92_000,
    notasPorMes: 11,
    prazos: [15, 30, 30, 45],
    atrasoMax: 40,
    inadimplencia: 0.09,
    crescimento: 0.1,
    vendaParaCredito: 0.6,
    clientes: ['Moura Dubeux', 'Rede Pague Menos Imóveis', 'Colégio Equipe', 'Clínica Derma Recife', 'Restaurante Leite', 'Startup Agrotech'],
  },
  {
    nome: 'Vale Norte Construções',
    cnpj: '22.570.118/0001-63',
    anexo: 'IV',
    segmento: 'Obras e reformas comerciais (medições)',
    cidade: 'Goiânia, GO',
    responsavel: 'Eduardo Sales',
    faturamentoMensal: 300_000,
    notasPorMes: 4,
    prazos: [45, 60, 90],
    atrasoMax: 30,
    inadimplencia: 0.04,
    crescimento: 0.06,
    vendaParaCredito: 0.85,
    clientes: ['Atacadão Goiânia', 'Rede Bretas', 'Colégio Ateneu', 'Hospital do Coração Anis Rassi'],
  },
  {
    nome: 'Rota Certa Transportes',
    cnpj: '30.884.612/0001-29',
    anexo: 'III',
    segmento: 'Frete rodoviário fracionado',
    cidade: 'Ribeirão Preto, SP',
    responsavel: 'Sandra Moretti',
    faturamentoMensal: 180_000,
    notasPorMes: 16,
    prazos: [30, 30, 45, 60],
    atrasoMax: 20,
    inadimplencia: 0.025,
    crescimento: 0.03,
    vendaParaCredito: 0.9,
    clientes: ['Usina São Martinho', 'Coplana', 'Distribuidora Fênix', 'Agro Amazônia', 'Rede Savegnago'],
  },
  {
    nome: 'Empório Trigo & Cia',
    cnpj: '38.117.540/0001-91',
    anexo: 'I',
    segmento: 'Padaria e empório (varejo)',
    cidade: 'Curitiba, PR',
    responsavel: 'Helena Kowalski',
    faturamentoMensal: 120_000,
    notasPorMes: 20,
    prazos: [0, 0, 0, 30],
    atrasoMax: 2,
    inadimplencia: 0.002,
    crescimento: 0.04,
    vendaParaCredito: 0.05,
    clientes: ['Consumidor final (cartão)', 'Consumidor final (Pix)', 'Café Colonial Eventos', 'Hotel Bourbon'],
  },
  {
    nome: 'Lumen Software',
    cnpj: '45.020.773/0001-58',
    anexo: 'V',
    segmento: 'Desenvolvimento sob demanda',
    cidade: 'Florianópolis, SC',
    responsavel: 'Tiago Becker',
    faturamentoMensal: 155_000,
    notasPorMes: 5,
    prazos: [30, 45, 60],
    atrasoMax: 20,
    inadimplencia: 0.02,
    crescimento: 0.15,
    vendaParaCredito: 0.95,
    clientes: ['Banco Regional Sul', 'Cooperativa Aurora', 'Intelbras', 'Grupo Koch'],
  },
]

export function criarCarteira(hoje = new Date()): Empresa[] {
  return PERFIS.map((p, idx) => {
    const r = rng(1000 + idx * 97)
    const notas: Nota[] = []
    let seq = 1
    for (let m = 13; m >= 0; m--) {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - m, 1)
      const diasNoMes = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0).getDate()
      const limite = m === 0 ? hoje.getDate() - 1 : diasNoMes
      if (limite < 1) continue
      const sazonal = 1 + 0.12 * Math.sin(((inicio.getMonth() + idx) / 12) * Math.PI * 2)
      const qtd = Math.max(1, Math.round((p.notasPorMes * limite) / diasNoMes))
      const alvo = (p.faturamentoMensal * sazonal * limite) / diasNoMes
      for (let k = 0; k < qtd; k++) {
        const emissao = new Date(inicio.getFullYear(), inicio.getMonth(), 1 + Math.floor(r() * limite), 12)
        const prazo = p.prazos[Math.floor(r() * p.prazos.length)]!
        const vencimento = new Date(emissao.getTime() + prazo * 86_400_000)
        const valor = Math.round(((alvo / qtd) * (0.7 + r() * 0.6)) / 10) * 10
        const calote = r() < p.inadimplencia
        const atraso = r() < 0.55 ? Math.floor(r() * p.atrasoMax) : 0
        const pagamento = new Date(vencimento.getTime() + atraso * 86_400_000)
        notas.push({
          id: `${idx + 1}-${seq}`,
          cliente: p.clientes[Math.floor(r() * p.clientes.length)]!,
          emissao: iso(emissao),
          vencimento: iso(vencimento),
          valor,
          pagoEm: !calote && pagamento < hoje ? iso(pagamento) : undefined,
        })
        seq++
      }
    }
    notas.sort((a, b) => a.emissao.localeCompare(b.emissao))
    return {
      id: `e${idx + 1}`,
      nome: p.nome,
      cnpj: p.cnpj,
      anexo: p.anexo,
      segmento: p.segmento,
      cidade: p.cidade,
      responsavel: p.responsavel,
      telefone: '',
      crescimento: p.crescimento,
      vendaParaCredito: p.vendaParaCredito,
      notas,
    }
  })
}
