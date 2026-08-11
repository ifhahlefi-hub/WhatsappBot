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
  try {
    initDB(); // Initialize SQLite and run migrations
  } catch (err) {
    console.error('[WARN] initDB failed at startup:', err?.message || err);
    loggers.error.error(`DB init failed: ${err?.message || err}`);
  }

  const app = express();
  const server = http.createServer(app);

  try {
    io = new Server(server, {
      cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
      }
    });
  } catch (err) {
    console.error('[WARN] Socket.IO init failed:', err?.message || err);
    io = null;
  }

  // Security Middleware
  try {
    app.use(helmet({
      contentSecurityPolicy: false
    }));
    app.use(cors({ origin: process.env.SOCKET_CORS_ORIGIN || '*' }));
    app.use(express.json({ limit: '10mb' }));
  } catch (err) {
    console.error('[WARN] Middleware setup failed:', err?.message || err);
  }

  // Rate Limiting
  const isDev = process.env.NODE_ENV === 'development';
  try {
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
      max: isDev ? 10000 : parseInt(process.env.RATE_LIMIT_MAX || '100'),
      message: { success: false, message: 'Terlalu banyak permintaan, coba lagi nanti.', error_code: 'RATE_LIMIT_EXCEEDED' }
    });
    app.use('/api', limiter);
  } catch (err) {
    console.error('[WARN] Rate limiter setup failed:', err?.message || err);
  }

  // Access Logging
  app.use((req, res, next) => {
    try {
      loggers.access.info(`${req.method} ${req.url} - ${req.ip}`);
    } catch (err) {
      console.error('[WARN] Access log failed:', err?.message || err);
    }
    next();
  });

  try {
    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/export', exportRoutes);
    app.use('/api', apiRoutes);
  } catch (err) {
    console.error('[WARN] API route setup failed:', err?.message || err);
  }

  // Serve Frontend React Static Files
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  try {
    app.use(express.static(frontendDist));
  } catch (err) {
    console.error('[WARN] Frontend static setup failed:', err?.message || err);
  }

  app.use((req, res) => {
    try {
      if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
        res.sendFile(path.join(frontendDist, 'index.html'));
      } else {
        res.status(404).send('Frontend belum di-build. Jalankan "npm run build:frontend".');
      }
    } catch (err) {
      console.error('[WARN] Frontend fallback route failed:', err?.message || err);
      res.status(500).send('Frontend unavailable');
    }
  });

  // Socket.IO Connection
  try {
    if (io) {
      io.on('connection', (socket) => {
        loggers.socket.info(`Client connected: ${socket.id}`);

        socket.on('disconnect', () => {
          loggers.socket.info(`Client disconnected: ${socket.id}`);
        });
      });
    }
  } catch (err) {
    console.error('[WARN] Socket.IO connection setup failed:', err?.message || err);
  }

  const PORT = parseInt(process.env.ADMIN_PORT || process.env.PORT || String(PREFERRED_ADMIN_PORT), 10) || PREFERRED_ADMIN_PORT;
  process.env.ADMIN_PORT = String(PORT);
  actualPort = PORT;
  
  const bindServer = () => {
    return new Promise((resolve, reject) => {
      server.listen(PORT, '0.0.0.0', () => {
        const actual = server.address()?.port || PORT;
        actualPort = actual;
        process.env.ADMIN_PORT = String(actual);
        loggers.access.info(`Admin API aktif di http://localhost:${actual}`);
        loggers.access.info(`Socket.IO aktif di http://localhost:${actual}`);
        console.log(`[INFO] Admin API aktif di http://localhost:${actual}`);
        console.log(`[INFO] Socket.IO aktif di http://localhost:${actual}`);
        resolve({ app, server, io });
      }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          loggers.error.error(`Port ${PORT} sudah digunakan!`);
          console.error(`[WARN] Port ${PORT} sudah digunakan!`);
          console.warn('[WARN] Mencoba bind ke port acak yang tersedia...');
          try {
            server.listen(0, '0.0.0.0', () => {
              const fallbackPort = server.address()?.port || 0;
              actualPort = fallbackPort;
              process.env.ADMIN_PORT = String(fallbackPort);
              loggers.access.info(`Admin API fallback aktif di http://localhost:${fallbackPort}`);
              console.log(`[INFO] Admin API fallback aktif di http://localhost:${fallbackPort}`);
              resolve({ app, server, io });
            });
          } catch (bindErr) {
            console.error('[WARN] Fallback bind failed:', bindErr?.message || bindErr);
            reject(bindErr);
          }
          return;
        }
        loggers.error.error(`Server error: ${err.message}`);
        console.error('[WARN] Server runtime error:', err?.message || err);
        reject(err);
      });
    });
  };

  try {
    const result = await bindServer();
    return result;
  } catch (err) {
    console.error('[WARN] startServer did not finish:', err?.message || err);
    return { app, server, io: null };
  }
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
