/**
 * Process Manager - prevents duplicate Node.js processes.
 * Uses a lockfile mechanism to ensure single-instance execution.
 */
const fs = require('fs');
const path = require('path');

const LOCK_DIR = path.join(__dirname, '..', '..', 'logs');

/**
 * Create a lockfile for a service. If lockfile exists with a running PID, returns false.
 * @param {string} serviceName - e.g., 'bot', 'admin'
 * @returns {boolean} true if lock acquired
 */
function acquireLock(serviceName) {
  const lockFile = path.join(LOCK_DIR, `${serviceName}.lock`);

  // Ensure logs directory exists
  if (!fs.existsSync(LOCK_DIR)) {
    fs.mkdirSync(LOCK_DIR, { recursive: true });
  }

  // Check existing lock
  if (fs.existsSync(lockFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));
      const pid = data.pid;

      // Check if the process is still running
      if (isProcessRunning(pid)) {
        console.log(`[LOCK] ${serviceName} sudah berjalan (PID: ${pid}).`);
        return false;
      } else {
        console.log(`[LOCK] Lockfile ditemukan tapi proses PID ${pid} sudah mati. Mengambil alih...`);
      }
    } catch {
      // Corrupted lockfile, overwrite
    }
  }

  // Write new lockfile
  fs.writeFileSync(lockFile, JSON.stringify({
    pid: process.pid,
    service: serviceName,
    startedAt: new Date().toISOString()
  }));

  // Clean up lockfile on exit
  const cleanup = () => {
    try {
      if (fs.existsSync(lockFile)) {
        const data = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));
        if (data.pid === process.pid) {
          fs.unlinkSync(lockFile);
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });

  return true;
}

/**
 * Force-kill existing process for a service and acquire the lock.
 * @param {string} serviceName
 * @returns {boolean} true if lock acquired
 */
function forceAcquireLock(serviceName) {
  const lockFile = path.join(LOCK_DIR, `${serviceName}.lock`);

  if (!fs.existsSync(LOCK_DIR)) {
    fs.mkdirSync(LOCK_DIR, { recursive: true });
  }

  if (fs.existsSync(lockFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));
      const pid = data.pid;

      if (isProcessRunning(pid) && pid !== process.pid) {
        console.log(`[LOCK] Menghentikan proses lama ${serviceName} (PID: ${pid})...`);
        try {
          process.kill(pid, 'SIGTERM');
          // Give it a moment to shut down
          const start = Date.now();
          while (isProcessRunning(pid) && Date.now() - start < 3000) {
            // busy wait briefly
          }
          if (isProcessRunning(pid)) {
            process.kill(pid, 'SIGKILL');
          }
          console.log(`[LOCK] Proses lama ${serviceName} (PID: ${pid}) berhasil dihentikan.`);
        } catch {
          // Process may have already exited
        }
      }
    } catch {
      // Corrupted lockfile
    }
  }

  return acquireLock(serviceName);
}

/**
 * Check if a process with given PID is running.
 * @param {number} pid
 * @returns {boolean}
 */
function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Release the lock for a service.
 * @param {string} serviceName
 */
function releaseLock(serviceName) {
  const lockFile = path.join(LOCK_DIR, `${serviceName}.lock`);
  try {
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  } catch {
    // Ignore
  }
}

module.exports = { acquireLock, forceAcquireLock, releaseLock, isProcessRunning };
