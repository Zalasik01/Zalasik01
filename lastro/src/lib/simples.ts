// Tabelas do Simples Nacional (LC 123/2006, com redação da LC 155/2016).
// Alíquota efetiva = (RBT12 × alíquota nominal − parcela a deduzir) / RBT12.

export type Anexo = 'I' | 'II' | 'III' | 'IV' | 'V'

interface Faixa {
  ate: number
  aliquota: number
  deduzir: number
}

const LIMITES = [180_000, 360_000, 720_000, 1_800_000, 3_600_000, 4_800_000]

const tabela = (aliquotas: number[], deduzir: number[]): Faixa[] =>
  LIMITES.map((ate, i) => ({ ate, aliquota: aliquotas[i]!, deduzir: deduzir[i]! }))

export const ANEXOS: Record<Anexo, { nome: string; faixas: Faixa[] }> = {
  I: { nome: 'Anexo I · Comércio', faixas: tabela([4, 7.3, 9.5, 10.7, 14.3, 19], [0, 5_940, 13_860, 22_500, 87_300, 378_000]) },
  II: { nome: 'Anexo II · Indústria', faixas: tabela([4.5, 7.8, 10, 11.2, 14.7, 30], [0, 5_940, 13_860, 22_500, 85_500, 720_000]) },
  III: { nome: 'Anexo III · Serviços', faixas: tabela([6, 11.2, 13.5, 16, 21, 33], [0, 9_360, 17_640, 35_640, 125_640, 648_000]) },
  IV: { nome: 'Anexo IV · Serviços (construção, limpeza, vigilância)', faixas: tabela([4.5, 9, 10.2, 14, 22, 33], [0, 8_100, 12_420, 39_780, 183_780, 828_000]) },
  V: { nome: 'Anexo V · Serviços intelectuais', faixas: tabela([15.5, 18, 19.5, 20.5, 23, 30.5], [0, 4_500, 9_900, 17_100, 62_100, 540_000]) },
}

export function faixaDe(anexo: Anexo, rbt12: number) {
  const faixas = ANEXOS[anexo].faixas
  const idx = faixas.findIndex((f) => rbt12 <= f.ate)
  return { indice: idx === -1 ? faixas.length - 1 : idx, ...faixas[idx === -1 ? faixas.length - 1 : idx]! }
}

/** Alíquota efetiva em fração (0,0812 = 8,12%). */
export function aliquotaEfetiva(anexo: Anexo, rbt12: number) {
  if (rbt12 <= 0) return ANEXOS[anexo].faixas[0]!.aliquota / 100
  const f = faixaDe(anexo, rbt12)
  return Math.max(0, (rbt12 * (f.aliquota / 100) - f.deduzir) / rbt12)
}
