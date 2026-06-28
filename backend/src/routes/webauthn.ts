import { Router, Request, Response } from 'express';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import { randomUUID } from 'crypto';
import { getDb, initSchema } from '../db/database';
import { authenticate, signToken } from '../middleware/auth';

const router = Router();

const RP_NAME = 'DataSearch';

// Derive RP ID (domain) and expected origin from the request so the same code
// works on any host (Railway, Fly.io, localhost) without reconfiguration.
function rpInfo(req: Request): { rpID: string; origin: string } {
  const origin = (req.headers.origin as string) || `https://${req.headers.host}`;
  let rpID = 'localhost';
  try { rpID = new URL(origin).hostname; } catch { /* keep default */ }
  return { rpID, origin };
}

const b64 = (u: Uint8Array) => Buffer.from(u).toString('base64url');
const fromB64 = (s: string) => new Uint8Array(Buffer.from(s, 'base64url'));

async function saveChallenge(challenge: string, userId: number | null): Promise<string> {
  const db = getDb();
  const id = randomUUID();
  await db.execute({ sql: 'INSERT INTO webauthn_challenges (id, challenge, user_id) VALUES (?, ?, ?)', args: [id, challenge, userId] });
  // best-effort cleanup of stale challenges (older than 10 min)
  await db.execute({ sql: "DELETE FROM webauthn_challenges WHERE created_at < datetime('now', '-10 minutes')", args: [] });
  return id;
}

async function takeChallenge(id: string): Promise<{ challenge: string; user_id: number | null } | null> {
  const db = getDb();
  const r = await db.execute({ sql: 'SELECT challenge, user_id FROM webauthn_challenges WHERE id = ?', args: [id] });
  if (!r.rows.length) return null;
  await db.execute({ sql: 'DELETE FROM webauthn_challenges WHERE id = ?', args: [id] });
  const row = r.rows[0] as any;
  return { challenge: row.challenge as string, user_id: row.user_id === null ? null : Number(row.user_id) };
}

// ---- Registration (user must be logged in) ----

router.post('/register/options', authenticate, async (req: Request, res: Response) => {
  await initSchema();
  const db = getDb();
  const { rpID } = rpInfo(req);
  const userId = req.user!.userId;

  const userR = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [userId] });
  const user = userR.rows[0] as any;
  if (!user) { res.status(404).json({ error: 'Usuario nao encontrado.' }); return; }

  const existing = await db.execute({ sql: 'SELECT credential_id, transports FROM webauthn_credentials WHERE user_id = ?', args: [userId] });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userID: new TextEncoder().encode(String(userId)),
    userName: user.email,
    userDisplayName: user.name,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred'
    },
    excludeCredentials: existing.rows.map((c: any) => ({
      id: c.credential_id,
      transports: c.transports ? JSON.parse(c.transports) : undefined
    }))
  });

  const challengeId = await saveChallenge(options.challenge, userId);
  res.json({ options, challengeId });
});

router.post('/register/verify', authenticate, async (req: Request, res: Response) => {
  await initSchema();
  const db = getDb();
  const { rpID, origin } = rpInfo(req);
  const { response, challengeId, deviceLabel } = req.body;
  const userId = req.user!.userId;

  const saved = await takeChallenge(challengeId);
  if (!saved) { res.status(400).json({ error: 'Desafio expirado. Tente novamente.' }); return; }

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: saved.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID
    });
    if (!verification.verified || !verification.registrationInfo) {
      res.status(400).json({ error: 'Nao foi possivel verificar a biometria.' }); return;
    }
    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
    const transports = response?.response?.transports as string[] | undefined;
    await db.execute({
      sql: 'INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, transports, device_label) VALUES (?, ?, ?, ?, ?, ?)',
      args: [
        userId,
        credentialID,
        b64(credentialPublicKey),
        counter,
        transports ? JSON.stringify(transports) : null,
        deviceLabel || 'Dispositivo'
      ]
    });
    res.json({ verified: true });
  } catch (e: any) {
    res.status(400).json({ error: 'Falha ao registrar biometria.', detail: e?.message });
  }
});

// ---- Authentication (usernameless: no email needed) ----

router.post('/login/options', async (req: Request, res: Response) => {
  await initSchema();
  const { rpID } = rpInfo(req);
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    allowCredentials: [] // discoverable credentials -> device picks the passkey
  });
  const challengeId = await saveChallenge(options.challenge, null);
  res.json({ options, challengeId });
});

router.post('/login/verify', async (req: Request, res: Response) => {
  await initSchema();
  const db = getDb();
  const { rpID, origin } = rpInfo(req);
  const { response, challengeId } = req.body;

  const saved = await takeChallenge(challengeId);
  if (!saved) { res.status(400).json({ error: 'Desafio expirado. Tente novamente.' }); return; }

  const credId: string = response?.id;
  if (!credId) { res.status(400).json({ error: 'Resposta invalida.' }); return; }

  const credR = await db.execute({ sql: 'SELECT * FROM webauthn_credentials WHERE credential_id = ?', args: [credId] });
  const cred = credR.rows[0] as any;
  if (!cred) { res.status(404).json({ error: 'Biometria nao reconhecida. Cadastre primeiro no seu dispositivo.' }); return; }

  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: saved.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: cred.credential_id,
        credentialPublicKey: fromB64(cred.public_key),
        counter: Number(cred.counter),
        transports: cred.transports ? JSON.parse(cred.transports) : undefined
      }
    });
    if (!verification.verified) { res.status(401).json({ error: 'Verificacao falhou.' }); return; }

    await db.execute({ sql: 'UPDATE webauthn_credentials SET counter = ? WHERE credential_id = ?', args: [verification.authenticationInfo.newCounter, credId] });

    const userR = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [Number(cred.user_id)] });
    const user = userR.rows[0] as any;
    if (!user) { res.status(404).json({ error: 'Usuario nao encontrado.' }); return; }

    const token = signToken({ userId: Number(user.id), email: user.email as string });
    res.json({
      token,
      user: { id: Number(user.id), name: user.name, email: user.email, plan: user.plan, searches_used: Number(user.searches_used), searches_limit: Number(user.searches_limit) }
    });
  } catch (e: any) {
    res.status(400).json({ error: 'Falha na autenticacao biometrica.', detail: e?.message });
  }
});

// Whether the logged-in user already has biometric credentials
router.get('/status', authenticate, async (req: Request, res: Response) => {
  await initSchema();
  const db = getDb();
  const r = await db.execute({ sql: 'SELECT id, device_label, created_at FROM webauthn_credentials WHERE user_id = ?', args: [req.user!.userId] });
  res.json({ enabled: r.rows.length > 0, credentials: r.rows });
});

export default router;
