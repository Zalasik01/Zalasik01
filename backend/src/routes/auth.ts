import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, initSchema } from '../db/database';
import { signToken } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: 'Nome, e-mail e senha sao obrigatorios.' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'A senha deve ter no minimo 8 caracteres.' });
    return;
  }

  const db = getDb();
  await initSchema();

  const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email.toLowerCase().trim()] });
  if (existing.rows.length > 0) {
    res.status(409).json({ error: 'Este e-mail ja esta cadastrado.' });
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await db.execute({
    sql: 'INSERT INTO users (name, email, password_hash, plan, searches_limit) VALUES (?, ?, ?, ?, ?)',
    args: [name.trim(), email.toLowerCase().trim(), hash, 'free', 10]
  });

  const userId = Number(result.lastInsertRowid);
  const token = signToken({ userId, email: email.toLowerCase().trim() });

  res.status(201).json({
    token,
    user: { id: userId, name: name.trim(), email: email.toLowerCase().trim(), plan: 'free', searches_used: 0, searches_limit: 10 }
  });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    res.status(400).json({ error: 'E-mail e senha sao obrigatorios.' });
    return;
  }

  const db = getDb();
  await initSchema();

  const result = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email.toLowerCase().trim()] });
  const user = result.rows[0] as any;

  if (!user) {
    res.status(401).json({ error: 'Credenciais invalidas.' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash as string);
  if (!valid) {
    res.status(401).json({ error: 'Credenciais invalidas.' });
    return;
  }

  const token = signToken({ userId: Number(user.id), email: user.email as string });
  res.json({
    token,
    user: { id: Number(user.id), name: user.name, email: user.email, plan: user.plan, searches_used: Number(user.searches_used), searches_limit: Number(user.searches_limit) }
  });
});

export default router;
