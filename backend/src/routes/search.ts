import { Router, Request, Response } from 'express';
import https from 'https';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';
import { Entity, User } from '../types';

const router = Router();

function isCNPJ(q: string): boolean {
  return /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(q.trim());
}

function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

function fetchBrasilAPI(cnpj: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`;
    https.get(url, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Parse error')); }
      });
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

function brasilAPIToEntity(api: any): { entity: any; detail: any; addresses: any[] } {
  const status = api.descricao_situacao_cadastral?.toUpperCase() === 'ATIVA' ? 'active'
    : api.descricao_situacao_cadastral?.toUpperCase() === 'BAIXADA' ? 'inactive' : 'suspended';

  const cnpjFormatted = api.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');

  const entity = {
    id: `cnpj_${api.cnpj}`,
    type: 'company',
    name: api.razao_social,
    document: cnpjFormatted,
    document_type: 'CNPJ',
    status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    trade_name: api.nome_fantasia || null,
    secondary_date: api.data_inicio_atividade || null,
    source: 'brasilapi'
  };

  const detail = {
    trade_name: api.nome_fantasia || null,
    legal_nature: api.natureza_juridica || null,
    main_activity: api.cnae_fiscal_descricao
      ? `${api.cnae_fiscal} — ${api.cnae_fiscal_descricao}`
      : null,
    share_capital: api.capital_social || null,
    foundation_date: api.data_inicio_atividade || null,
    size: api.porte || null,
    qsa: api.qsa || []
  };

  const addresses: any[] = [];
  if (api.logradouro) {
    addresses.push({
      id: 1,
      street: `${api.descricao_tipo_de_logradouro || ''} ${api.logradouro}`.trim(),
      number: api.numero || 'S/N',
      complement: api.complemento || null,
      neighborhood: api.bairro || '',
      city: api.municipio || '',
      state: api.uf || '',
      zip_code: api.cep || '',
      is_current: 1
    });
  }

  return { entity, detail, addresses };
}

router.get('/cnpj/:cnpj', authenticate, async (req: Request, res: Response) => {
  const cnpjRaw = cleanCNPJ(req.params.cnpj);
  if (cnpjRaw.length !== 14) {
    res.status(400).json({ error: 'CNPJ invalido.' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as User;
  if (user.searches_used >= user.searches_limit) {
    res.status(402).json({ error: 'Limite de buscas atingido.', upgrade_required: true });
    return;
  }

  try {
    const api = await fetchBrasilAPI(cnpjRaw);
    if (api.message || api.error) {
      res.status(404).json({ error: 'CNPJ nao encontrado na Receita Federal.' });
      return;
    }

    db.prepare('UPDATE users SET searches_used = searches_used + 1 WHERE id = ?').run(user.id);
    db.prepare('INSERT INTO search_history (user_id, query, query_type, results_count) VALUES (?, ?, ?, ?)').run(user.id, req.params.cnpj, 'company', 1);

    const { entity, detail, addresses } = brasilAPIToEntity(api);
    res.json({ entity, detail, addresses, phones: [], emails: [], processes: [], source: 'Receita Federal (BrasilAPI)' });
  } catch {
    res.status(503).json({ error: 'Servico da Receita Federal temporariamente indisponivel.' });
  }
});

router.get('/', authenticate, (req: Request, res: Response) => {
  const { q, type, page = '1', limit = '10' } = req.query as Record<string, string>;

  if (!q?.trim()) {
    res.status(400).json({ error: 'O parametro de busca e obrigatorio.' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as User;

  if (user.searches_used >= user.searches_limit) {
    res.status(402).json({ error: 'Limite de buscas atingido. Faca upgrade do seu plano.', upgrade_required: true });
    return;
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;
  const term = `%${q.trim()}%`;

  let whereClause = '(e.name LIKE ? OR e.document LIKE ?)';
  const params: (string | number)[] = [term, term];

  if (type === 'person' || type === 'company') {
    whereClause += ' AND e.type = ?';
    params.push(type);
  }

  const countQuery = `SELECT COUNT(*) as total FROM entities e WHERE ${whereClause}`;
  const countResult = db.prepare(countQuery).get(...params) as { total: number };

  const dataQuery = `
    SELECT e.*,
      CASE WHEN e.type = 'person' THEN pd.birth_date ELSE cd.foundation_date END as secondary_date,
      CASE WHEN e.type = 'company' THEN cd.trade_name ELSE NULL END as trade_name
    FROM entities e
    LEFT JOIN person_details pd ON e.type = 'person' AND pd.entity_id = e.id
    LEFT JOIN company_details cd ON e.type = 'company' AND cd.entity_id = e.id
    WHERE ${whereClause}
    ORDER BY e.name ASC
    LIMIT ? OFFSET ?
  `;

  const results = db.prepare(dataQuery).all(...params, limitNum, offset) as Entity[];

  db.prepare('UPDATE users SET searches_used = searches_used + 1 WHERE id = ?').run(user.id);

  const queryType = type || 'all';
  db.prepare(
    'INSERT INTO search_history (user_id, query, query_type, results_count) VALUES (?, ?, ?, ?)'
  ).run(user.id, q.trim(), queryType, countResult.total);

  res.json({
    data: results,
    meta: {
      total: countResult.total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(countResult.total / limitNum)
    }
  });
});

router.get('/history', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const history = db.prepare(
    'SELECT * FROM search_history WHERE user_id = ? ORDER BY searched_at DESC LIMIT 50'
  ).all(req.user!.userId);
  res.json({ data: history });
});

router.get('/stats', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const userId = req.user!.userId;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
  const totalSearches = (db.prepare('SELECT COUNT(*) as c FROM search_history WHERE user_id = ?').get(userId) as any).c;
  const todaySearches = (db.prepare("SELECT COUNT(*) as c FROM search_history WHERE user_id = ? AND date(searched_at) = date('now')").get(userId) as any).c;
  const recentQueries = db.prepare('SELECT DISTINCT query FROM search_history WHERE user_id = ? ORDER BY searched_at DESC LIMIT 5').all(userId) as any[];
  res.json({
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan, searches_used: user.searches_used, searches_limit: user.searches_limit },
    stats: { total_searches: totalSearches, today_searches: todaySearches, recent_queries: recentQueries.map(r => r.query) }
  });
});

export default router;
