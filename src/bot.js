const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    downloadMediaMessage,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const QRCodeImage = require('qrcode');
const path = require('path');
const fs = require('fs');

const { db, getUserDataByJid, updateLastActive } = require('./database');
const { handleHalo, handleJam } = require('./commands/general');
const { handleMenu } = require('./commands/menu');
const { handleTodoList, handleTodoAdd, handleTodoDone, handleResetTodo } = require('./commands/todo');
const { handleCatat, handleTotal, handleHapusPengeluaran, handleEditPengeluaran, handleResetKeuangan, handleBatas } = require('./commands/finance');
const { exportTodoExcel, exportFinanceExcel, exportFinancePDF, cleanupExports } = require('./commands/export');
const { handleCurhat, handleFallback } = require('./commands/curhat');
const { chatWithAI, isAIAvailable } = require('./ai');
const { startServer, getIO } = require('./server');
const { forceAcquireLock } = require('./utils/process-manager');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..');
const AUTH_DIR = path.join(DATA_DIR, 'auth_info');
const logger = pino({ level: 'silent' });

console.log('========================================');
console.log('   WhatsApp Daily Assistant Bot');
console.log('   Powered by Irza Fhahlefi');
console.log('========================================\n');

// Prevent duplicate bot processes
if (!forceAcquireLock('bot')) {
  console.error('[FATAL] Tidak bisa mengakuisisi lock. Bot mungkin sudah berjalan.');
  process.exit(1);
}

// loadDB and getUserCount removed, DB logic is now handled in server.js
console.log(`[bot] AI ${isAIAvailable() ? 'active (Groq)' : 'inactive'}`);

// Start Admin API server (async, auto port detection)
// Skip jika BOT_ONLY=true (saat dijalankan via npm run dev, server.js berjalan terpisah)
if (process.env.BOT_ONLY === 'true') {
  console.log('[INFO] BOT_ONLY mode — Admin API dijalankan terpisah via server.js');
  // Still init DB for bot queries
  const { initDB } = require('./database');
  initDB();
} else {
  startServer().then(({ io }) => {
    console.log('[INFO] Admin API server started successfully');
    console.log('[INFO] WhatsApp Bot berjalan di port ' + (process.env.BOT_PORT || 'N/A') + ' (bot process)');
  }).catch((err) => {
    console.error('[ERROR] Failed to start Admin API:', err.message);
    console.error('[ERROR] Bot tetap berjalan tanpa Admin API.');
  });
}

function extractText(message) {
    if (!message) return null;
    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message.imageMessage) return message.imageMessage.caption || '';
    return null;
}

function routeCommand(text, userData) {
    const raw = text.trim();
    const cmd = raw.toLowerCase();

    if (cmd === 'export todo') return { type: 'export', handler: 'todo' };
    if (cmd === 'export pdf keuangan' || cmd === 'export pdf pengeluaran') return { type: 'export', handler: 'keuangan-pdf' };
    if (cmd === 'export keuangan' || cmd === 'export pengeluaran') return { type: 'export', handler: 'keuangan' };
    if (cmd === 'reset keuangan' || cmd === 'reset pengeluaran') return handleResetKeuangan(userData);
    if (cmd === 'reset todo') return handleResetTodo(userData);
    if (cmd === 'halo' || cmd === 'hai' || cmd === 'hi' || cmd === 'hello') return handleHalo();
    if (cmd === 'menu') return handleMenu();
    if (cmd === 'jam') return handleJam();
    if (cmd === 'total') return handleTotal(userData);

    if (cmd.startsWith('done')) return handleTodoDone(userData, raw.slice(4).trim());
    if (cmd.startsWith('todo')) {
        const args = raw.slice(4).trim();
        return args ? handleTodoAdd(userData, args) : handleTodoList(userData);
    }
    if (cmd.startsWith('edit')) return handleEditPengeluaran(userData, raw.slice(4).trim());
    if (cmd.startsWith('hapus')) return handleHapusPengeluaran(userData, raw.slice(5).trim());
    if (cmd.startsWith('catat')) return handleCatat(userData, raw.slice(5).trim());
    if (cmd.startsWith('batas')) return handleBatas(userData, raw.slice(5).trim());

    return null;
}

async function sendExport(sock, sender, handler, userData) {
    const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const exporters = {
        'todo': [exportTodoExcel, XLSX_MIME, 'Ga ada tugas yang bisa di-export nih'],
        'keuangan': [exportFinanceExcel, XLSX_MIME, 'Ga ada catatan pengeluaran buat di-export'],
        'keuangan-pdf': [exportFinancePDF, 'application/pdf', 'Ga ada catatan pengeluaran buat dibikin PDF'],
    };

    const [exporter, mimetype, emptyMsg] = exporters[handler];
    const result = await exporter(userData);

    if (!result) return sock.sendMessage(sender, { text: emptyMsg });

    const buffer = fs.readFileSync(result.filePath);
    try { fs.unlinkSync(result.filePath); } catch { }

    return sock.sendMessage(sender, { document: buffer, fileName: result.fileName, mimetype });
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    let version;
    try {
        const info = await fetchLatestBaileysVersion();
        version = info.version;
    } catch {
        version = [2, 3000, 1015901307];
    }

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        version,
        logger,
        browser: ['WhatsApp Bot', 'Chrome', '1.0.0'],
        generateHighQualityLinkPreview: false,
    });

    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            console.log('\n[auth] Scan QR:\n');
            qrcode.generate(qr, { small: true });
            QRCodeImage.toFile('./qr.png', qr, { width: 400, errorCorrectionLevel: 'H' }, (err) => {
                if (err) console.error('[auth] Failed to save QR image', err);
                else console.log('[auth] QR code saved to qr.png');
            });
        }

        if (connection === 'close') {
            const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (code === DisconnectReason.loggedOut) {
                console.log('[conn] Logged out. Menghapus auth_info dan memulai scan ulang.');
                try {
                    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
                    console.log('[conn] auth_info berhasil dibersihkan.');
                } catch (err) {
                    console.error('[conn] Gagal membersihkan auth_info:', err.message);
                }
                setTimeout(startBot, 3000);
                return;
            }
            setTimeout(startBot, 3000);
        }

        if (connection === 'open') {
            console.log('[conn] Connected\n');
            cleanupExports();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (!type || !['notify', 'append'].includes(type)) {
            console.log(`[msg] Ignoring messages.upsert type=${type || 'unknown'}`);
            return;
        }

        for (const msg of messages) {
            try {
                if (msg.key.fromMe) continue;
                if (msg.key.remoteJid === 'status@broadcast') continue;

                const hasImage = msg.message?.imageMessage
                    || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

                let text = extractText(msg.message);
                if (text === null && !hasImage) continue;
                if (!text && hasImage) text = '';

                const sender = msg.key.remoteJid;
                const name = msg.pushName || 'Unknown';
                const profilePicUrl = await sock.profilePictureUrl(sender).catch(() => null);
                
                const user = getUserDataByJid(sender);
                updateLastActive(sender, name, profilePicUrl);
                
                console.log(`[msg] ${name}: ${text || '[image]'}`);

                // Insert user message to chat history
                if (text) {
                    db.prepare("INSERT INTO chat_history (user_id, message_type, message, sender, status) VALUES (?, ?, ?, ?, ?)").run(
                        user.id, 'text', text, 'user', 'Terkirim'
                    );
                    
                    const io = getIO();
                    if (io) io.emit('chat_update', { userId: user.id });
                }

                const userData = user; // fallback for commands

                const command = routeCommand(text || '', userData);

                // Special: reset chat history
                if (text?.trim().toLowerCase() === 'reset chat') {
                    db.prepare("UPDATE chat_history SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = ?").run(user.id);
                    await sock.sendMessage(sender, { text: 'Oke, kita mulai fresh lagi ya' });
                    const io = getIO();
                    if (io) io.emit('chat_update', { userId: user.id });
                    continue;
                }
                if (command && text) {
                    if (typeof command === 'object' && command.type === 'export') {
                        await sendExport(sock, sender, command.handler, userData);
                    } else {
                        await sock.sendMessage(sender, { text: command });
                        db.prepare("INSERT INTO chat_history (user_id, message_type, message, sender, status) VALUES (?, ?, ?, ?, ?)").run(
                            user.id, 'text', command, 'bot', 'Terkirim'
                        );
                        const io = getIO();
                        if (io) io.emit('chat_update', { userId: user.id });
                    }
                    continue;
                }

                let imageBuffer = null;
                let reply = null;
                let aiUsage = null;
                let aiModel = null;

                if (isAIAvailable() && text) {
                    const historyData = db.prepare(`
                        SELECT sender, message 
                        FROM chat_history 
                        WHERE user_id = ? AND deleted_at IS NULL 
                        ORDER BY timestamp DESC LIMIT 20
                    `).all(user.id);
                    const history = historyData.reverse().map(h => ({
                        role: h.sender === 'bot' ? 'assistant' : 'user',
                        content: h.message || ''
                    }));
                    
                    const aiResult = await chatWithAI(text, history);
                    if (aiResult) {
                        reply = aiResult.reply;
                        aiUsage = aiResult.usage;
                        aiModel = aiResult.model;
                    }
                }

                if (!reply && text) {
                    reply = handleCurhat(text) || handleFallback(text);
                }

                if (reply) {
                    await sock.sendMessage(sender, { text: reply });
                    
                    if (aiUsage) {
                        db.prepare(`
                            INSERT INTO chat_history (user_id, message_type, message, sender, status, prompt_tokens, completion_tokens, total_tokens, ai_model) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).run(user.id, 'text', reply, 'bot', 'Terkirim', aiUsage.prompt_tokens, aiUsage.completion_tokens, aiUsage.total_tokens, aiModel);
                        
                        db.prepare(`
                            UPDATE users 
                            SET prompt_tokens = prompt_tokens + ?, 
                                completion_tokens = completion_tokens + ?, 
                                total_tokens = total_tokens + ? 
                            WHERE id = ?
                        `).run(aiUsage.prompt_tokens, aiUsage.completion_tokens, aiUsage.total_tokens, user.id);
                    } else {
                        db.prepare("INSERT INTO chat_history (user_id, message_type, message, sender, status) VALUES (?, ?, ?, ?, ?)").run(
                            user.id, 'text', reply, 'bot', 'Terkirim'
                        );
                    }
                    
                    const io = getIO();
                    if (io) io.emit('chat_update', { userId: user.id });
                }

            } catch (err) {
                console.error('[err]', err.message);
            }
        }
    });
}

startBot().catch(err => {
    console.error('[fatal]', err);
    process.exit(1);
});
