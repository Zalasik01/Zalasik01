import { Router, Request, Response } from 'express';
import https from 'https';
import { getDb, initSchema } from '../db/database';
import { authenticate } from '../middleware/auth';

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
      res.on('data', (c) => { data += c; });
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('Parse error')); } });
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

function brasilAPIToEntity(api: any) {
  const status = api.descricao_situacao_cadastral?.toUpperCase() === 'ATIVA' ? 'active'
    : api.descricao_situacao_cadastral?.toUpperCase() === 'BAIXADA' ? 'inactive' : 'suspended';

  const cnpjFormatted = api.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');

  return {
    entity: {
      id: `cnpj_${api.cnpj}`, type: 'company', name: api.razao_social,
      document: cnpjFormatted, document_type: 'CNPJ', status,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      trade_name: api.nome_fantasia || null, secondary_date: api.data_inicio_atividade || null,
      source: 'brasilapi'
    },
    detail: {
      trade_name: api.nome_fantasia || null, legal_nature: api.natureza_juridica || null,
      main_activity: api.cnae_fiscal_descricao ? `${api.cnae_fiscal} — ${api.cnae_fiscal_descricao}` : null,
      share_capital: api.capital_social || null, foundation_date: api.data_inicio_atividade || null,
      size: api.porte || null, qsa: api.qsa || []
    },
    addresses: api.logradouro ? [{
      id: 1,
      street: `${api.descricao_tipo_de_logradouro || ''} ${api.logradouro}`.trim(),
      number: api.numero || 'S/N', complement: api.complemento || null,
      neighborhood: api.bairro || '', city: api.municipio || '',
      state: api.uf || '', zip_code: api.cep || '', is_current: 1
    }] : []
  };
}

router.get('/cnpj/:cnpj', authenticate, async (req: Request, res: Response) => {
  const cnpjRaw = cleanCNPJ(req.params.cnpj);
  if (cnpjRaw.length !== 14) { res.status(400).json({ error: 'CNPJ invalido.' }); return; }

  const db = getDb();
  await initSchema();
  const userResult = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [req.user!.userId] });
  const user = userResult.rows[0] as any;

  if (!user) { res.status(401).json({ error: 'Sessao expirada. Faca login novamente.' }); return; }
  if (Number(user.searches_used) >= Number(user.searches_limit)) {
    res.status(402).json({ error: 'Limite de buscas atingido.', upgrade_required: true }); return;
  }

  try {
    const api = await fetchBrasilAPI(cnpjRaw);
    if (api.message || api.error) { res.status(404).json({ error: 'CNPJ nao encontrado na Receita Federal.' }); return; }

    await db.execute({ sql: 'UPDATE users SET searches_used = searches_used + 1 WHERE id = ?', args: [user.id] });
    await db.execute({ sql: 'INSERT INTO search_history (user_id, query, query_type, results_count) VALUES (?, ?, ?, ?)', args: [user.id, req.params.cnpj, 'company', 1] });

    const result = brasilAPIToEntity(api);
    res.json({ ...result, phones: [], emails: [], processes: [], source: 'Receita Federal (BrasilAPI)' });
  } catch {
    res.status(503).json({ error: 'Servico da Receita Federal temporariamente indisponivel.' });
  }
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  const { q, type, page = '1', limit = '10' } = req.query as Record<string, string>;

  if (!q?.trim()) { res.status(400).json({ error: 'O parametro de busca e obrigatorio.' }); return; }

  const db = getDb();
  await initSchema();
  const userResult = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [req.user!.userId] });
  const user = userResult.rows[0] as any;

  if (!user) { res.status(401).json({ error: 'Sessao expirada. Faca login novamente.' }); return; }
  if (Number(user.searches_used) >= Number(user.searches_limit)) {
    res.status(402).json({ error: 'Limite de buscas atingido.', upgrade_required: true }); return;
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;
  const term = `%${q.trim()}%`;

  let whereParts = ['(e.name LIKE ? OR e.document LIKE ?)'];
  const args: any[] = [term, term];

  if (type === 'person' || type === 'company') { whereParts.push('e.type = ?'); args.push(type); }

  const where = whereParts.join(' AND ');

  const countResult = await db.execute({ sql: `SELECT COUNT(*) as total FROM entities e WHERE ${where}`, args });
  const total = Number((countResult.rows[0] as any).total);

  const dataResult = await db.execute({
    sql: `SELECT e.*,
      CASE WHEN e.type = 'person' THEN pd.birth_date ELSE cd.foundation_date END as secondary_date,
      CASE WHEN e.type = 'company' THEN cd.trade_name ELSE NULL END as trade_name
    FROM entities e
    LEFT JOIN person_details pd ON e.type = 'person' AND pd.entity_id = e.id
    LEFT JOIN company_details cd ON e.type = 'company' AND cd.entity_id = e.id
    WHERE ${where}
    ORDER BY e.name ASC
    LIMIT ? OFFSET ?`,
    args: [...args, limitNum, offset]
  });

  await db.execute({ sql: 'UPDATE users SET searches_used = searches_used + 1 WHERE id = ?', args: [user.id] });
  await db.execute({ sql: 'INSERT INTO search_history (user_id, query, query_type, results_count) VALUES (?, ?, ?, ?)', args: [user.id, q.trim(), type || 'all', total] });

  res.json({ data: dataResult.rows, meta: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
});

router.get('/history', authenticate, async (req: Request, res: Response) => {
  const db = getDb();
  await initSchema();
  const result = await db.execute({ sql: 'SELECT * FROM search_history WHERE user_id = ? ORDER BY searched_at DESC LIMIT 50', args: [req.user!.userId] });
  res.json({ data: result.rows });
});

router.get('/stats', authenticate, async (req: Request, res: Response) => {
  const db = getDb();
  await initSchema();
  const userId = req.user!.userId;

  const userResult = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [userId] });
  const user = userResult.rows[0] as any;
  const totalSearches = Number(((await db.execute({ sql: 'SELECT COUNT(*) as c FROM search_history WHERE user_id = ?', args: [userId] })).rows[0] as any).c);
  const todaySearches = Number(((await db.execute({ sql: "SELECT COUNT(*) as c FROM search_history WHERE user_id = ? AND date(searched_at) = date('now')", args: [userId] })).rows[0] as any).c);
  const recentResult = await db.execute({ sql: 'SELECT DISTINCT query FROM search_history WHERE user_id = ? ORDER BY searched_at DESC LIMIT 5', args: [userId] });

  res.json({
    user: { id: Number(user.id), name: user.name, email: user.email, plan: user.plan, searches_used: Number(user.searches_used), searches_limit: Number(user.searches_limit) },
    stats: { total_searches: totalSearches, today_searches: todaySearches, recent_queries: recentResult.rows.map((r: any) => r.query) }
  });
});

export default router;
