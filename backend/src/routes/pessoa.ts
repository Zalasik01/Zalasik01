import { Router, Request, Response } from 'express';
import https from 'https';

const router = Router();

const TRANSPARENCIA_KEY = process.env.TRANSPARENCIA_API_KEY || '';

// Public key documented at datajud-wiki.cnj.jus.br/api-publica/acesso
const DATAJUD_PUBLIC_KEY = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';
const DATAJUD_KEY = process.env.DATAJUD_API_KEY || DATAJUD_PUBLIC_KEY;

// Most searched tribunals — searched in parallel
const DEFAULT_TRIBUNALS = ['tjsp', 'tjrj', 'tjmg', 'tjrs', 'tjpr', 'tjba', 'tjce', 'stj', 'tst', 'trf1', 'trf3'];

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

async function searchDatajudTribunal(tribunal: string, nome: string): Promise<any[]> {
  try {
    const url = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`;
    const query = {
      query: {
        bool: {
          should: [
            { match: { 'partes.nome': { query: nome, operator: 'and', fuzziness: 'AUTO' } } },
            { match_phrase: { 'partes.nome': nome } }
          ],
          minimum_should_match: 1
        }
      },
      size: 5,
      _source: ['numeroProcesso', 'tribunal', 'classe', 'assuntos', 'partes', 'dataAjuizamento',
                'orgaoJulgador', 'movimentos', 'grau', 'sistema', 'formato', 'dataHoraUltimaAtualizacao']
    };
    const result = await httpsPost(url, query, { 'Authorization': `APIKey ${DATAJUD_KEY}` });
    if (result.status !== 200 || !result.body?.hits?.hits?.length) return [];
    return result.body.hits.hits.map((h: any) => {
      const p = h._source;
      const ultimoMov = p.movimentos?.[0];
      return {
        numero: p.numeroProcesso,
        tribunal: p.tribunal || tribunal.toUpperCase(),
        classe: p.classe?.nome || null,
        grau: p.grau || null,
        sistema: p.sistema?.nome || null,
        assuntos: p.assuntos?.map((a: any) => a.nome).filter(Boolean) || [],
        partes: p.partes?.map((pt: any) => ({ nome: pt.nome, tipo: pt.tipoParte || pt.tipo })).filter((pt: any) => pt.nome) || [],
        data_ajuizamento: p.dataAjuizamento || null,
        orgao_julgador: p.orgaoJulgador?.nome || null,
        ultima_movimentacao: ultimoMov ? `${ultimoMov.nome || ''} — ${ultimoMov.dataHora ? new Date(ultimoMov.dataHora).toLocaleDateString('pt-BR') : ''}`.trim() : null,
        ultima_atualizacao: p.dataHoraUltimaAtualizacao || null,
        formato: p.formato?.nome || null,
        fonte_tribunal: tribunal.toUpperCase()
      };
    });
  } catch {
    return [];
  }
}

router.get('/servidores', async (req: Request, res: Response) => {
  const { nome, pagina = '1' } = req.query as Record<string, string>;
  if (!nome?.trim()) { res.status(400).json({ error: 'Nome obrigatorio.' }); return; }
  if (!TRANSPARENCIA_KEY) {
    res.status(503).json({ error: 'API nao configurada.', requires_key: true, info: 'Configure TRANSPARENCIA_API_KEY' });
    return;
  }
  try {
    const url = `https://api.portaldatransparencia.gov.br/api-de-dados/servidores?nome=${encodeURIComponent(nome)}&pagina=${pagina}&tamanhoPagina=10`;
    const result = await httpsGet(url, { 'chave-api-dados': TRANSPARENCIA_KEY, 'Accept': 'application/json' });
    if (result.status !== 200 || !Array.isArray(result.body)) { res.json({ data: [], source: 'Portal da Transparencia' }); return; }
    const formatted = result.body.map((s: any) => ({
      id: s.id || s.idServidor,
      nome: s.nome,
      cpf: s.cpf || null,
      orgao: s.orgao?.nome || s.orgaoExercicio?.nome || null,
      cargo: s.cargo?.nome || s.descricaoCargo || null,
      funcao: s.funcao?.nome || null,
      municipio: s.municipioExercicio?.nome || null,
      uf: s.municipioExercicio?.uf || null,
      remuneracao: s.remuneracaoBasicaBruta || null,
      situacao: s.situacaoVinculo?.nome || 'Ativo'
    }));
    res.json({ data: formatted, source: 'Portal da Transparencia (Governo Federal)', total: formatted.length });
  } catch {
    res.status(503).json({ error: 'Erro ao consultar Portal da Transparencia.' });
  }
});

router.get('/processos', async (req: Request, res: Response) => {
  const { nome, tribunais } = req.query as Record<string, string>;
  if (!nome?.trim()) { res.status(400).json({ error: 'Nome obrigatorio.' }); return; }

  const tribunaisList = tribunais
    ? tribunais.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_TRIBUNALS;

  try {
    const results = await Promise.all(tribunaisList.map(t => searchDatajudTribunal(t, nome.trim())));
    const all = results.flat();

    // Deduplicate by process number
    const seen = new Set<string>();
    const unique = all.filter(p => {
      if (seen.has(p.numero)) return false;
      seen.add(p.numero);
      return true;
    });

    res.json({
      data: unique,
      source: 'CNJ DataJud',
      tribunais_consultados: tribunaisList,
      total: unique.length
    });
  } catch {
    res.status(503).json({ error: 'Erro ao consultar CNJ DataJud.' });
  }
});

// Search a specific tribunal
router.get('/processos/:tribunal', async (req: Request, res: Response) => {
  const { nome } = req.query as Record<string, string>;
  const tribunal = req.params.tribunal.toLowerCase();
  if (!nome?.trim()) { res.status(400).json({ error: 'Nome obrigatorio.' }); return; }

  try {
    const data = await searchDatajudTribunal(tribunal, nome.trim());
    res.json({ data, source: `CNJ DataJud — ${tribunal.toUpperCase()}`, total: data.length });
  } catch {
    res.status(503).json({ error: 'Erro ao consultar CNJ DataJud.' });
  }
});

router.get('/status', (_req: Request, res: Response) => {
  res.json({
    transparencia: { configured: !!TRANSPARENCIA_KEY, env_var: 'TRANSPARENCIA_API_KEY', url: 'https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email' },
    datajud: { configured: true, using_public_key: !process.env.DATAJUD_API_KEY, tribunais_disponiveis: DEFAULT_TRIBUNALS }
  });
});

export default router;
