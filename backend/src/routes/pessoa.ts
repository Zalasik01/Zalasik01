import { Router, Request, Response } from 'express';
import https from 'https';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';
import { User } from '../types';

const router = Router();

const TRANSPARENCIA_KEY = process.env.TRANSPARENCIA_API_KEY || '';
const DATAJUD_KEY = process.env.DATAJUD_API_KEY || '';

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
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers },
      timeout: 10000
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

async function fetchServidoresPublicos(nome: string, pagina = 1): Promise<any[]> {
  if (!TRANSPARENCIA_KEY) return [];
  const url = `https://api.portaldatransparencia.gov.br/api-de-dados/servidores?nome=${encodeURIComponent(nome)}&pagina=${pagina}&tamanhoPagina=10`;
  const result = await httpsGet(url, { 'chave-api-dados': TRANSPARENCIA_KEY, 'Accept': 'application/json' });
  if (result.status !== 200 || !Array.isArray(result.body)) return [];
  return result.body;
}

async function fetchProcessosCNJ(nome: string, tribunal = 'tjsp'): Promise<any[]> {
  if (!DATAJUD_KEY) return [];
  const url = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`;
  const query = {
    query: { match: { 'partes.nome': { query: nome, operator: 'and', fuzziness: 'AUTO' } } },
    size: 10,
    _source: ['numeroProcesso', 'tribunal', 'classe', 'assuntos', 'partes', 'dataAjuizamento', 'orgaoJulgador', 'movimentos']
  };
  const result = await httpsPost(url, query, { 'Authorization': `APIKey ${DATAJUD_KEY}`, 'Content-Type': 'application/json' });
  if (result.status !== 200 || !result.body?.hits?.hits) return [];
  return result.body.hits.hits.map((h: any) => h._source);
}

router.get('/servidores', authenticate, async (req: Request, res: Response) => {
  const { nome, pagina = '1' } = req.query as Record<string, string>;

  if (!nome?.trim()) {
    res.status(400).json({ error: 'Nome obrigatorio.' });
    return;
  }

  if (!TRANSPARENCIA_KEY) {
    res.status(503).json({
      error: 'API do Portal da Transparencia nao configurada.',
      requires_key: true,
      info: 'Configure a variavel de ambiente TRANSPARENCIA_API_KEY'
    });
    return;
  }

  try {
    const servidores = await fetchServidoresPublicos(nome, parseInt(pagina));
    const formatted = servidores.map((s: any) => ({
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

    res.json({ data: formatted, source: 'Portal da Transparência (Governo Federal)', total: formatted.length });
  } catch (err: any) {
    res.status(503).json({ error: 'Erro ao consultar Portal da Transparencia.' });
  }
});

router.get('/processos', authenticate, async (req: Request, res: Response) => {
  const { nome, tribunal = 'tjsp' } = req.query as Record<string, string>;

  if (!nome?.trim()) {
    res.status(400).json({ error: 'Nome obrigatorio.' });
    return;
  }

  if (!DATAJUD_KEY) {
    res.status(503).json({
      error: 'API do CNJ DataJud nao configurada.',
      requires_key: true,
      info: 'Configure a variavel de ambiente DATAJUD_API_KEY'
    });
    return;
  }

  try {
    const processos = await fetchProcessosCNJ(nome, tribunal);
    const formatted = processos.map((p: any) => ({
      numero: p.numeroProcesso,
      tribunal: p.tribunal,
      classe: p.classe?.nome || null,
      assuntos: p.assuntos?.map((a: any) => a.nome) || [],
      partes: p.partes?.map((pt: any) => ({ nome: pt.nome, tipo: pt.tipo })) || [],
      data_ajuizamento: p.dataAjuizamento,
      orgao_julgador: p.orgaoJulgador?.nome || null,
      ultima_movimentacao: p.movimentos?.[0]?.nome || null
    }));

    res.json({ data: formatted, source: `CNJ DataJud — ${tribunal.toUpperCase()}`, total: formatted.length });
  } catch {
    res.status(503).json({ error: 'Erro ao consultar CNJ DataJud.' });
  }
});

router.get('/status', authenticate, (_req: Request, res: Response) => {
  res.json({
    transparencia: {
      configured: !!TRANSPARENCIA_KEY,
      url: 'https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email',
      env_var: 'TRANSPARENCIA_API_KEY'
    },
    datajud: {
      configured: !!DATAJUD_KEY,
      url: 'https://datajud-wiki.cnj.jus.br/api-publica/acesso',
      env_var: 'DATAJUD_API_KEY'
    }
  });
});

export { fetchServidoresPublicos, fetchProcessosCNJ };
export default router;
