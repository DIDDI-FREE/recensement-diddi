import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import syncRoutes from './routes/sync';
import fichesRoutes from './routes/fiches';
import statsRoutes from './routes/stats';
import adminRoutes from './routes/admin';
import photosRoutes from './routes/photos';
import { seedIfNeeded } from './seed-runner';

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Limite généreuse : le batch de sync transporte les photos en base64
app.use(express.json({ limit: '100mb' }));
app.use(cors());

app.get('/api/health', (_req, res) => res.json({ statut: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/fiches', fichesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/photos', photosRoutes);

app.use((_req, res) => res.status(404).json({ erreur: 'Route introuvable' }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERREUR]', err);
  res.status(500).json({ erreur: 'Erreur interne du serveur' });
});

async function main() {
  await seedIfNeeded();

  app.listen(PORT, () => {
    console.log(`API DiddiFree démarrée sur http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Échec du démarrage :', err);
  process.exit(1);
});
