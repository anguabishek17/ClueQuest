import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { initDb } from './db/client.js';
import { seedDatabase } from './db/seed.js';
import { authRouter } from './routes/authRoutes.js';
import { gameRouter } from './routes/gameRoutes.js';
import { eventRouter } from './routes/eventRoutes.js';
import { adminRouter } from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function createServer() {
  const app = express();

  // Basic Middlewares
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Initialize and Seed Database
  try {
    await initDb();
    await seedDatabase();
  } catch (err) {
    console.error('Database initialization/seed warning:', err);
  }

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CLUE QUEST API Server',
      institution: 'VSB Engineering College - ECE Department',
      time: new Date().toISOString(),
    });
  });

  // API Route Mounts
  app.use('/api/auth', authRouter);
  app.use('/api/game', gameRouter);
  app.use('/api/event', eventRouter);
  app.use('/api/admin', adminRouter);

  // Vite Dev Server Integration or Static Production Serving
  if (config.nodeEnv !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: rootDir,
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(rootDir, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`
  ==================================================================
  ⚡ CLUE QUEST • ECE ELECTRONICS CLUB SERVER ACTIVE
  🏫 VSB Engineering College — Department of ECE
  🌐 Local URL: http://localhost:${config.port}
  🔒 Authoritative Scoring Engine: READY (40 Participants Seeded)
  ==================================================================
    `);
  });
}

createServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
