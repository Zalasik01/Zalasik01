import { Router, Request, Response } from 'express';
import { getDb, initSchema } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const db = getDb();
  await initSchema();

  const entityResult = await db.execute({ sql: 'SELECT * FROM entities WHERE id = ?', args: [req.params.id] });
  const entity = entityResult.rows[0] as any;

  if (!entity) { res.status(404).json({ error: 'Entidade nao encontrada.' }); return; }

  const [addresses, phones, emails, processes] = await Promise.all([
    db.execute({ sql: 'SELECT * FROM addresses WHERE entity_id = ? ORDER BY is_current DESC', args: [entity.id] }),
    db.execute({ sql: 'SELECT * FROM phones WHERE entity_id = ?', args: [entity.id] }),
    db.execute({ sql: 'SELECT * FROM emails WHERE entity_id = ?', args: [entity.id] }),
    db.execute({ sql: 'SELECT * FROM legal_processes WHERE entity_id = ? ORDER BY last_update DESC', args: [entity.id] })
  ]);

  let detail = null;
  if (entity.type === 'person') {
    const r = await db.execute({ sql: 'SELECT * FROM person_details WHERE entity_id = ?', args: [entity.id] });
    detail = r.rows[0] || null;
  } else {
    const r = await db.execute({ sql: 'SELECT * FROM company_details WHERE entity_id = ?', args: [entity.id] });
    detail = r.rows[0] || null;
  }

  res.json({
    entity,
    detail,
    addresses: addresses.rows,
    phones: phones.rows,
    emails: emails.rows,
    processes: processes.rows
  });
});

export default router;
