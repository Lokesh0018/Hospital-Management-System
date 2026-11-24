import http from 'http';
import { app } from './app.js';
import { ENV } from './config/env.js';
import prisma from './database/prisma.js';
import { initSocket } from './socket/socket.init.js';

const PORT = ENV.PORT || 5000;

/**
 * Initialize HTTP Server & Attach Socket.IO
 */
const server = http.createServer(app);
const io = initSocket(server);

server.listen(PORT, () => {
  console.log('====================================================');
  console.log('  🏥 Hospital Management System (HMS) Backend API  ');
  console.log('====================================================');
  console.log(`  🚀 Server listening on : http://localhost:${PORT}`);
  console.log(`  🌱 Environment         : ${ENV.NODE_ENV}`);
  console.log(`  ⚡ Real-Time Socket.IO : Enabled & Operational`);
  console.log(`  ❤️  Health Check        : http://localhost:${PORT}/health`);
  console.log(`  🔐 Auth Endpoints      : http://localhost:${PORT}/api/v1/auth`);
  console.log('====================================================\n');
});

/**
 * Graceful Shutdown Handler
 */
const shutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    console.log('[Server] HTTP connections closed.');

    try {
      await prisma.$disconnect();
      console.log('[Server] Database disconnected cleanly.');
    } catch (dbError) {
      console.error('[Server] Error disconnecting from database:', dbError);
    }

    process.exit(0);
  });

  // Force close after 10s if connections don't drain
  setTimeout(() => {
    console.error('[Server] Could not close connections in time, forcefully terminating.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Process Exception & Rejection Handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  process.exit(1);
});

export { app, server };
export default server;
