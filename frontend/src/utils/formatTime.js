/**
 * Utility functions untuk format timestamp dengan timezone Asia/Jakarta (WIB).
 * 
 * SQLite menyimpan timestamp dalam UTC (CURRENT_TIMESTAMP).
 * Semua fungsi di sini mengkonversi ke WIB secara otomatis.
 */

const TIMEZONE = 'Asia/Jakarta';
const LOCALE = 'id-ID';

/**
 * Safely parse timestamp — handle unix epoch detik, milidetik, dan ISO string.
 */
function parseTimestamp(timestamp) {
  if (!timestamp) return null;
  if (typeof timestamp === 'number' && timestamp < 1e12) {
    return new Date(timestamp * 1000); // unix epoch dalam detik
  }
  return new Date(timestamp); // milidetik atau ISO string
}

/**
 * Format jam saja: "19:21"
 */
export function formatJam(timestamp) {
  const date = parseTimestamp(timestamp);
  if (!date || isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString(LOCALE, {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format tanggal saja: "17/06/2026"
 */
export function formatTanggal(timestamp) {
  const date = parseTimestamp(timestamp);
  if (!date || isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(LOCALE, {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format tanggal + jam: "17/06/2026 19:21"
 */
export function formatTanggalJam(timestamp) {
  const date = parseTimestamp(timestamp);
  if (!date || isNaN(date.getTime())) return '-';
  return date.toLocaleString(LOCALE, {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format tanggal + jam lengkap: "Selasa, 17 Juni 2026 19:21"
 */
export function formatTanggalJamLengkap(timestamp) {
  const date = parseTimestamp(timestamp);
  if (!date || isNaN(date.getTime())) return '-';
  return date.toLocaleString(LOCALE, {
    timeZone: TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format relative time (e.g. "5 menit yang lalu") dengan WIB context.
 * Kita hitung selisih manual karena date-fns formatDistanceToNow tidak support timezone.
 */
export function formatRelatif(timestamp) {
  const date = parseTimestamp(timestamp);
  if (!date || isNaN(date.getTime())) return '-';
  
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'baru saja';
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  if (diffDay < 7) return `${diffDay} hari yang lalu`;
  
  // Fallback ke tanggal+jam
  return formatTanggalJam(timestamp);
}
