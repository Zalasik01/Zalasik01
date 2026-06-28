import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';
import { Entity, User } from '../types';

const router = Router();

router.get('/', authenticate, (req: Request, res: Response) => {
  const { q, type, page = '1', limit = '10' } = req.query as Record<string, string>;

  if (!q?.trim()) {
    res.status(400).json({ error: 'O parâmetro de busca é obrigatório.' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as User;

  if (user.searches_used >= user.searches_limit) {
    res.status(402).json({ error: 'Limite de buscas atingido. Faça upgrade do seu plano.', upgrade_required: true });
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
