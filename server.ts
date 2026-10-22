import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { registerAuthRoutes } from './server/routes/auth.ts';
import { registerStudentRoutes } from './server/routes/student.ts';
import { registerCommitteeRoutes } from './server/routes/committee.ts';
import { registerAdminRoutes } from './server/routes/admin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  // Body parser with 10MB limit for document uploads (Pas Foto, KK, etc.)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Register API Routes
  registerAuthRoutes(app);
  registerStudentRoutes(app);
  registerCommitteeRoutes(app);
  registerAdminRoutes(app);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'PPDB Online Pondok Pesantren Al-Ikhlash',
      academic_year: '2027/2028',
      time: new Date().toISOString()
    });
  });

  // Serve static assets or mount Vite
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PPDB Al-Ikhlash Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
