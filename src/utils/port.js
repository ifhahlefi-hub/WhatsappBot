/**
 * Port utility - auto-detects available port and handles EADDRINUSE gracefully.
 * Supports Windows and Linux/macOS.
 */
const net = require('net');
const { execSync } = require('child_process');

/**
 * Check if a port is available.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '0.0.0.0');
  });
}

/**
 * Try to kill a process using a specific port.
 * @param {number} port
 * @returns {boolean} true if a process was killed
 */
function tryKillProcessOnPort(port) {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, {
        encoding: 'utf-8',
        timeout: 5000,
      }).trim();
      if (result) {
        const lines = result.split('\n');
        const pids = new Set();
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') pids.add(pid);
        }
        for (const pid of pids) {
          try {
            execSync(`taskkill /PID ${pid} /F`, { timeout: 5000 });
            console.log(`[PORT] Proses PID ${pid} pada port ${port} berhasil dihentikan.`);
          } catch {
            // Process may have already exited
          }
        }
        return pids.size > 0;
      }
    } else {
      const result = execSync(`lsof -ti :${port}`, {
        encoding: 'utf-8',
        timeout: 5000,
      }).trim();
      if (result) {
        const pids = result.split('\n');
        for (const pid of pids) {
          try {
            execSync(`kill -9 ${pid}`, { timeout: 5000 });
            console.log(`[PORT] Proses PID ${pid} pada port ${port} berhasil dihentikan.`);
          } catch {
            // Process may have already exited
          }
        }
        return pids.length > 0;
      }
    }
  } catch {
    // No process found on port, that's fine
  }
  return false;
}

/**
 * Find the next available port starting from `startPort`.
 * Tries up to `maxAttempts` consecutive ports.
 * @param {number} startPort
 * @param {number} maxAttempts
 * @returns {Promise<number>}
 */
async function findAvailablePort(startPort, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
    if (i === 0) {
      console.log(`[PORT] Port ${port} sedang digunakan, mencari port alternatif...`);
    }
  }
  throw new Error(
    `Tidak dapat menemukan port yang tersedia dari ${startPort} hingga ${startPort + maxAttempts - 1}`
  );
}

module.exports = { isPortAvailable, findAvailablePort, tryKillProcessOnPort };
