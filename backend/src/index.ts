import express from 'express';
import cors from 'cors';
import path from 'path';
import { initSchema } from './db/database';
import authRoutes from './routes/auth';
import webauthnRoutes from './routes/webauthn';
import searchRoutes from './routes/search';
import entityRoutes from './routes/entities';
import pessoaRoutes from './routes/pessoa';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_DIST = path.join(__dirname, '../../frontend/dist');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/auth/webauthn', webauthnRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/pessoa', pessoaRoutes);
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(express.static(FRONTEND_DIST));
app.get('*', (_, res) => res.sendFile(path.join(FRONTEND_DIST, 'index.html')));

initSchema().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch(console.error);

export default app;
