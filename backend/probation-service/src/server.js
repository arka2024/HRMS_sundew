import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import path from 'path';
import { connectDb } from './config/db.js';
import { PORT } from './config/env.js';
import { authRouter } from './routes/auth.routes.js';
import { probationRouter } from './routes/probation.routes.js';
import { managerRouter } from './routes/manager.routes.js';
import { evaluationRouter } from './routes/evaluation.routes.js';
import { probationExtensionRouter } from './routes/probation-extension.routes.js';
import { evaluationUnlockRequestRouter } from './routes/evaluation-unlock-request.routes.js';
import { associateManagerMappingRouter } from './routes/associate-manager-mapping.routes.js';
import { ensureDummyManager } from './repositories/manager.repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());

app.use('/api', authRouter);
app.use('/api', probationRouter);
app.use('/api', managerRouter);
app.use('/api', evaluationRouter);
app.use('/api', probationExtensionRouter);
app.use('/api', evaluationUnlockRequestRouter);
app.use('/api', associateManagerMappingRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await connectDb();
    await ensureDummyManager();
    app.listen(PORT, () => {
      console.log(`Probation service running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start probation service:', error);
    process.exit(1);
  }
}

start();
