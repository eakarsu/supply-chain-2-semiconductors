require('dotenv').config({ path: require('path').resolve(__dirname, '../.env'), quiet: true });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./db');
const { DomainError } = require('./src/domain');
const { list, validateRuntime } = require('./src/runtime');

function createApp() {
  validateRuntime();
  const app = express();
  const allowedOrigins = list('CORS_ORIGINS');
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ credentials: false, origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))) return callback(null, true);
    callback(new DomainError(403, 'ORIGIN_NOT_ALLOWED', 'Origin is not allowed'));
  } }));
  app.use(express.json({ limit: '256kb', strict: true }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'semichain-traceability' }));
  app.get('/api/ready', async (_req, res) => {
    try { await db.query('SELECT 1 FROM semichain_migrations LIMIT 1'); res.json({ status: 'ready' }); }
    catch { res.status(503).json({ status: 'not_ready' }); }
  });
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/runtime-ai', require('./routes/runtime-ai'));
  app.use('/api/traceability', require('./routes/traceability'));
  app.use('/api', (req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unsupported API route' } }));
  app.use((error, _req, res, _next) => {
    if (error instanceof DomainError) return res.status(error.status).json({ error: { code: error.code, message: error.message, details: error.details, eventId: error.eventId } });
    if (error?.type === 'entity.too.large') return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds 256kb' } });
    console.error('Unhandled request failure', { name: error?.name, code: error?.code });
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Request failed' } });
  });
  return app;
}

function start() {
  const app = createApp(); const port = Number(process.env.PORT || 3015);
  const host = process.env.HOST || '127.0.0.1';
  const server = app.listen(port, host, () => console.log(`SemiChain traceability API listening on ${host}:${port}`));
  const shutdown = () => server.close(() => db.end().finally(() => process.exit(0)));
  process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);
  return server;
}

if (require.main === module) start();
module.exports = { createApp, start };
