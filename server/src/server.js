import app from './app.js';
import { env } from './config/env.js';

const PORT = parseInt(env.PORT, 10);
const HOST = '0.0.0.0'; // Required for Render deployment

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ CareerMatch API running on http://${HOST}:${PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Allowed origin: ${env.FRONTEND_URL}`);
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err);
  process.exit(1);
});

export default server;

