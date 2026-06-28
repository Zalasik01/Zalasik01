import { Router, Request, Response } from 'express';
import https from 'https';

const router = Router();

const TRANSPARENCIA_KEY = process.env.TRANSPARENCIA_API_KEY || '';

// Public key documented at datajud-wiki.cnj.jus.br/api-publica/acesso
const DATAJUD_PUBLIC_KEY = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';
const DATAJUD_KEY = process.env.DATAJUD_API_KEY || DATAJUD_PUBLIC_KEY;

// State code (positions 15-16 of CNJ number) -> UF, for state/electoral/military courts
const UF_BY_CODE: Record<string, string> = {
  '01': 'ac', '02': 'al', '03': 'ap', '04': 'am', '05': 'ba', '06': 'ce', '07': 'df',
  '08': 'es', '09': 'go', '10': 'ma', '11': 'mt', '12': 'ms', '13': 'mg', '14': 'pa',
  '15': 'pb', '16': 'pr', '17': 'pe', '18': 'pi', '19': 'rj', '20': 'rn', '21': 'rs',
  '22': 'ro', '23': 'rr', '24': 'sc', '25': 'se', '26': 'sp', '27': 'to'
};

const MILITAR_ESTADUAL: Record<string, string> = { '13': 'tjmmg', '21': 'tjmrs', '26': 'tjmsp' };

/**
 * Derives the DataJud tribunal alias from a CNJ process number.
 * Format: NNNNNNN-DD.AAAA.J.TR.OOOO (20 digits).
 * J = justice segment (pos 14), TR = tribunal/region (pos 15-16).
 */
function tribunalFromNumber(numero: string): string | null {
  const digits = numero.replace(/\D/g, '');
  if (digits.length !== 20) return null;
  const segmento = digits[13];
  const tr = digits.substring(14, 16);
  switch (segmento) {
    case '1': return 'stf';       // not in public API, but mapped for completeness
    case '3': return 'stj';
    case '4': {                   // Justiça Federal -> trf1..trf6
      const r = parseInt(tr, 10);
      return r >= 1 && r <= 6 ? `trf${r}` : null;
    }
    case '5': {                   // Justiça do Trabalho -> TST (00) or trt1..trt24
      const r = parseInt(tr, 10);
      return r === 0 ? 'tst' : `trt${r}`;
    }
    case '6': {                   // Justiça Eleitoral -> tre-uf
      const uf = UF_BY_CODE[tr];
      return uf ? `tre-${uf}` : null;
    }
    case '7': return 'stm';       // Justiça Militar da União
    case '8': {                   // Justiça Estadual -> tjuf
      const uf = UF_BY_CODE[tr];
      return uf ? `tj${uf}` : null;
    }
    case '9': return MILITAR_ESTADUAL[tr] || null; // Justiça Militar Estadual
    default: return null;
  }
}

function httpsGet(url: string, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function httpsPost(url: string, body: object, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers },
      timeout: 15000
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(payload);
    req.end();
  });
}

function formatProcesso(p: any, tribunalAlias: string) {
  const ultimoMov = Array.isArray(p.movimentos)
    ? [...p.movimentos].sort((a, b) => (b.dataHora || '').localeCompare(a.dataHora || ''))[0]
    : null;
  return {
    numero: p.numeroProcesso,
    tribunal: p.tribunal || tribunalAlias.toUpperCase(),
    classe: p.classe?.nome || null,
    classe_codigo: p.classe?.codigo || null,
    grau: p.grau || null,
    sistema: p.sistema?.nome || null,
    nivel_sigilo: p.nivelSigilo ?? null,
    assuntos: p.assuntos?.map((a: any) => a.nome).filter(Boolean) || [],
    data_ajuizamento: p.dataAjuizamento || null,
    orgao_julgador: p.orgaoJulgador?.nome || null,
    ultima_movimentacao: ultimoMov ? `${ultimoMov.nome || ''}${ultimoMov.dataHora ? ' — ' + new Date(ultimoMov.dataHora).toLocaleDateString('pt-BR') : ''}`.trim() : null,
    ultima_atualizacao: p.dataHoraUltimaAtualizacao || null,
    formato: p.formato?.nome || null,
    total_movimentos: Array.isArray(p.movimentos) ? p.movimentos.length : 0,
    fonte_tribunal: tribunalAlias.toUpperCase()
  };
}

async function searchByNumber(numero: string): Promise<any[]> {
  const tribunal = tribunalFromNumber(numero);
  if (!tribunal) return [];
  try {
    const url = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`;
    const numeroDigits = numero.replace(/\D/g, '');
    const query = {
      query: { match: { numeroProcesso: numeroDigits } },
      size: 5,
      _source: ['numeroProcesso', 'tribunal', 'classe', 'assuntos', 'dataAjuizamento', 'nivelSigilo',
                'orgaoJulgador', 'movimentos', 'grau', 'sistema', 'formato', 'dataHoraUltimaAtualizacao']
    };
    const result = await httpsPost(url, query, { 'Authorization': `APIKey ${DATAJUD_KEY}` });
    if (result.status !== 200 || !result.body?.hits?.hits?.length) return [];
    return result.body.hits.hits.map((h: any) => formatProcesso(h._source, tribunal));
  } catch {
    return [];
  }
}

const TRANSP_BASE = 'https://api.portaldatransparencia.gov.br/api-de-dados';

async function buscarPEP(nome: string): Promise<any[]> {
  try {
    const url = `${TRANSP_BASE}/peps?nome=${encodeURIComponent(nome)}&pagina=1`;
    const r = await httpsGet(url, { 'chave-api-dados': TRANSPARENCIA_KEY, 'Accept': 'application/json' });
    if (r.status !== 200 || !Array.isArray(r.body)) return [];
    return r.body.map((p: any) => ({
      nome: (p.nome || '').trim(),
      cpf: (p.cpf || '').trim() || null,
      funcao: (p.descricao_funcao || '').trim() || null,
      orgao: (p.nome_orgao || '').trim() || null,
      inicio_exercicio: p.dt_inicio_exercicio || null,
      fim_exercicio: p.dt_fim_exercicio || null
    }));
  } catch { return []; }
}

async function buscarSancoes(nome: string, lista: 'ceis' | 'cnep'): Promise<any[]> {
  try {
    const url = `${TRANSP_BASE}/${lista}?nomeSancionado=${encodeURIComponent(nome)}&pagina=1`;
    const r = await httpsGet(url, { 'chave-api-dados': TRANSPARENCIA_KEY, 'Accept': 'application/json' });
    if (r.status !== 200 || !Array.isArray(r.body)) return [];
    return r.body.map((s: any) => ({
      nome: s.pessoa?.nome || s.nomeSancionado || null,
      documento: s.pessoa?.cpfFormatado || s.pessoa?.cnpjFormatado || null,
      tipo_pessoa: s.pessoa?.tipo || null,
      tipo_sancao: s.tipoSancao?.descricaoResumida || null,
      orgao_sancionador: s.orgaoSancionador?.nome || null,
      fonte: s.fonteSancao?.nomeExibicao || null,
      inicio_sancao: s.dataInicioSancao || null,
      fim_sancao: s.dataFimSancao || null,
      lista: lista.toUpperCase()
    })).filter((s: any) => s.nome);
  } catch { return []; }
}

/**
 * Aggregated person/company search by name across the public sources that
 * actually support name lookups: PEP (politically exposed persons) and the
 * sanction lists CEIS + CNEP. (The /servidores endpoint requires an SIAPE org
 * code or CPF, so it cannot be searched by name alone.)
 */
router.get('/busca', async (req: Request, res: Response) => {
  const { nome } = req.query as Record<string, string>;
  if (!nome?.trim()) { res.status(400).json({ error: 'Nome obrigatorio.' }); return; }
  if (!TRANSPARENCIA_KEY) {
    res.status(503).json({ error: 'API nao configurada.', requires_key: true, info: 'Configure TRANSPARENCIA_API_KEY' });
    return;
  }
  const termo = nome.trim();
  try {
    const [pep, ceis, cnep] = await Promise.all([
      buscarPEP(termo),
      buscarSancoes(termo, 'ceis'),
      buscarSancoes(termo, 'cnep')
    ]);
    const sancoes = [...ceis, ...cnep];
    res.json({
      pep,
      sancoes,
      source: 'Portal da Transparencia (Governo Federal)',
      total: pep.length + sancoes.length
    });
  } catch {
    res.status(503).json({ error: 'Erro ao consultar Portal da Transparencia.' });
  }
});

/**
 * Process lookup. The public DataJud API does NOT expose party names (LGPD),
 * so processes can only be found by their CNJ number, not by person name.
 */
router.get('/processos', async (req: Request, res: Response) => {
  const { numero, nome } = req.query as Record<string, string>;

  // Name-based search is impossible on the public API — return an honest signal.
  if (!numero?.trim() && nome?.trim()) {
    res.json({
      data: [],
      source: 'CNJ DataJud',
      name_search_unsupported: true,
      info: 'A API publica do CNJ nao permite busca por nome (LGPD). Informe o numero do processo.'
    });
    return;
  }

  if (!numero?.trim()) { res.status(400).json({ error: 'Numero do processo obrigatorio.' }); return; }

  const numeroDigits = numero.replace(/\D/g, '');
  if (numeroDigits.length !== 20) {
    res.status(400).json({ error: 'Numero de processo invalido. Use o formato CNJ (20 digitos).' });
    return;
  }

  const tribunal = tribunalFromNumber(numeroDigits);
  if (!tribunal) {
    res.status(400).json({ error: 'Nao foi possivel identificar o tribunal a partir do numero informado.' });
    return;
  }

  try {
    const data = await searchByNumber(numeroDigits);
    res.json({ data, source: `CNJ DataJud — ${tribunal.toUpperCase()}`, tribunal, total: data.length });
  } catch {
    res.status(503).json({ error: 'Erro ao consultar CNJ DataJud.' });
  }
});

router.get('/status', (_req: Request, res: Response) => {
  res.json({
    transparencia: {
      configured: !!TRANSPARENCIA_KEY,
      env_var: 'TRANSPARENCIA_API_KEY',
      url: 'https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email',
      fontes_por_nome: ['PEP (politicamente expostos)', 'CEIS (inidoneos)', 'CNEP (empresas punidas)']
    },
    datajud: { configured: true, using_public_key: !process.env.DATAJUD_API_KEY, search_by: 'numero_processo', note: 'API publica nao expoe nomes de partes (LGPD)' }
  });
});

export default router;
