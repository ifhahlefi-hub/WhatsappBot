const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');
if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
}

dotenv.config({ path: envPath });

const defaultEnv = {
  ADMIN_PORT: '3001',
  BOT_PORT: '3000',
  SOCKET_CORS_ORIGIN: '*',
  JWT_SECRET: 'dev-jwt-secret-change-me',
  JWT_REFRESH_SECRET: 'dev-jwt-refresh-secret-change-me',
  JWT_EXPIRE: '30m',
  JWT_REFRESH_EXPIRE: '7d',
  RATE_LIMIT_WINDOW: '15',
  RATE_LIMIT_MAX: '100',
  DATABASE_PATH: 'database.sqlite',
  SUPER_ADMIN_EMAIL: 'superadmin@localhost',
  NODE_ENV: 'development'
};

for (const [key, value] of Object.entries(defaultEnv)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

const loggers = require('./utils/logger');
const { initDB } = require('./database');
// const { findAvailablePort } = require('./utils/port'); // Removed as requested
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const exportRoutes = require('./routes/export');

// Admin API port - pisah dari Bot port
const PREFERRED_ADMIN_PORT = parseInt(process.env.ADMIN_PORT, 10) || 3001;

let io; // global io instance
let actualPort = null; // port yang benar-benar digunakan

async function startServer() {
  initDB(); // Initialize SQLite and run migrations

  const app = express();
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    }
  });

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false
  }));
  app.use(cors({ origin: process.env.SOCKET_CORS_ORIGIN || '*' }));
  app.use(express.json({ limit: '10mb' }));

  // Rate Limiting
  const isDev = process.env.NODE_ENV === 'development';
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
    max: isDev ? 10000 : parseInt(process.env.RATE_LIMIT_MAX || '100'),
    message: { success: false, message: 'Terlalu banyak permintaan, coba lagi nanti.', error_code: 'RATE_LIMIT_EXCEEDED' }
  });
  app.use('/api', limiter);

  // Access Logging
  app.use((req, res, next) => {
    loggers.access.info(`${req.method} ${req.url} - ${req.ip}`);
    next();
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api', apiRoutes);

  // Serve Frontend React Static Files
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));

  app.use((req, res) => {
    if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    } else {
      res.status(404).send('Frontend belum di-build. Jalankan "npm run build:frontend".');
    }
  });

  // Socket.IO Connection
  io.on('connection', (socket) => {
    loggers.socket.info(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      loggers.socket.info(`Client disconnected: ${socket.id}`);
    });
  });

  const PORT = process.env.ADMIN_PORT || process.env.PORT || String(PREFERRED_ADMIN_PORT);
  process.env.ADMIN_PORT = PORT;
  actualPort = PORT;
  
  server.listen(PORT, '0.0.0.0', () => {
    loggers.access.info(`Admin API aktif di http://localhost:${PORT}`);
    loggers.access.info(`Socket.IO aktif di http://localhost:${PORT}`);
    console.log(`[INFO] Admin API aktif di http://localhost:${PORT}`);
    console.log(`[INFO] Socket.IO aktif di http://localhost:${PORT}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      loggers.error.error(`Port ${PORT} sudah digunakan!`);
      console.error(`[ERROR] Port ${PORT} sudah digunakan!`);
      console.error(`Jalankan: npx kill-port ${PORT} lalu coba lagi.`);
      process.exit(1);
    }
    loggers.error.error(`Server error: ${err.message}`);
    throw err;
  });

  return { app, server, io };
}

function getIO() {
  return io;
}

function getActualPort() {
  return actualPort;
}

// Allow standalone execution: node src/server.js
if (require.main === module) {
  startServer().then(() => {
    console.log('[INFO] Admin API server started (standalone mode)');
  }).catch((err) => {
    console.error('[FATAL] Failed to start Admin API:', err.message);
    process.exit(1);
  });
}

module.exports = { startServer, getIO, getActualPort };
