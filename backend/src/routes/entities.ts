import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth';
import { Entity } from '../types';

const router = Router();

router.get('/:id', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const entity = db.prepare('SELECT * FROM entities WHERE id = ?').get(req.params.id) as Entity | undefined;

  if (!entity) {
    res.status(404).json({ error: 'Entidade não encontrada.' });
    return;
  }

  const addresses = db.prepare('SELECT * FROM addresses WHERE entity_id = ? ORDER BY is_current DESC').all(entity.id);
  const phones = db.prepare('SELECT * FROM phones WHERE entity_id = ?').all(entity.id);
  const emails = db.prepare('SELECT * FROM emails WHERE entity_id = ?').all(entity.id);
  const processes = db.prepare('SELECT * FROM legal_processes WHERE entity_id = ? ORDER BY last_update DESC').all(entity.id);

  let detail = null;
  if (entity.type === 'person') {
    detail = db.prepare('SELECT * FROM person_details WHERE entity_id = ?').get(entity.id);
  } else {
    detail = db.prepare('SELECT * FROM company_details WHERE entity_id = ?').get(entity.id);
  }

  res.json({ entity, detail, addresses, phones, emails, processes });
});

export default router;
