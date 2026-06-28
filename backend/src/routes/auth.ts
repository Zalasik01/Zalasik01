import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/database';
import { signToken } from '../middleware/auth';
import { User } from '../types';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres.' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash, plan, searches_limit) VALUES (?, ?, ?, ?, ?)'
  ).run(name.trim(), email.toLowerCase().trim(), hash, 'free', 10);

  const userId = result.lastInsertRowid as number;
  const token = signToken({ userId, email: email.toLowerCase().trim() });

  res.status(201).json({ token, user: { id: userId, name: name.trim(), email: email.toLowerCase().trim(), plan: 'free', searches_used: 0, searches_limit: 10 } });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as User | undefined;

  if (!user) {
    res.status(401).json({ error: 'Credenciais inválidas.' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Credenciais inválidas.' });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      searches_used: user.searches_used,
      searches_limit: user.searches_limit
    }
  });
});

export default router;
