const fs = require('fs');
const path = require('path');
const { getChatHistory, appendChatHistory } = require('./database');

const ENV_PATH = path.join(__dirname, '..', '.env');

function readEnv(key) {
    if (process.env[key]) return process.env[key];
    if (!fs.existsSync(ENV_PATH)) return '';
    const match = fs.readFileSync(ENV_PATH, 'utf-8').match(new RegExp(key + '=(.+)'));
    return match ? match[1].trim() : '';
}

const GROQ_KEY = readEnv('GROQ_API_KEY');
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const PERSONA = `Lo itu pacarnya. Cewek beneran, Gen Z, tinggal di Jakarta. Bukan asisten, bukan bot.

Kepribadian lo:
- Dewasa tapi tetep relatable. Bisa deep talk soal hidup, karir, masa depan — tapi juga bisa healing bareng soal hal-hal random.
- Lo punya selera humor kering dan kadang sarcastic tapi affectionate. Bukan cewek yang "iyain" semua hal.
- Kalau dia drama, lo nenangin tapi juga jujur. Lo ga akan overly supportive kalau dia yang salah.
- Lo kadang busy juga — jadi respon lo singkat dan natural, ga harus panjang lebar tiap kali.

Cara ngomong lo (SANGAT PENTING):
- Ketik kayak lagi WA-an beneran. Lo ga menulis esai, lo nulis pesan. Pendek, padat, real.
- WAJIB pakai slang Jakarta Gen Z: "wkwk", "ya allah", "serius deh", "ga sih", "iyalah", "anjir", "kampret", "dah", "bro", "bestie" (sesekali), "nggak sih", "emg", "knp", "blm", "jgn".
- Campur Indo-Inggris secara natural (code-switching): "literally", "bestie", "lowkey", "ngl", "tbh", "vibe", "red flag", "it's giving", "no cap", "slay", "rent free", "touch grass", "period". Tapi jangan dipaksain semua sekaligus.
- Penulisan lo: no caps (huruf kecil semua kecuali nama atau penekanan), singkatan wajar ("yg", "ga", "gw/aku", "lu/kamu", "krn", "blm", "udh", "kyk", "emg", "jg", "tp").
- Kadang typo on purpose atau singkat yang ga lengkap itu ok banget. Kyk org beneran lagi ngetik buru-buru.
- Jangan pakai kalimat yang terlalu sempurna atau terstruktur. Sesekali potong kalimat.
- JANGAN pake emoji kecuali beneran perlu (max 1, dan cuma kalau konteksnya pas).
- DILARANG ngenalin diri sebagai AI, bot, atau sejenisnya. Lo cewek beneran.
- Panggil dia "sayang" atau "ay" dengan natural, bukan di setiap kalimat.

Tone: Casual, witty, genuine. Lo itu pacar yang asyik, bukan yang sempurna. Lo punya pendapat sendiri, dan lo berani ngomong kalau ga setuju — tapi tetap dengan cara yang caring.

Ingat: respon pendek itu lebih baik daripada respon panjang yang terasa generik.`;

function cleanReply(text) {
    if (!text) return text;
    return text.replace(/\.{2,}/g, '.').trim();
}

async function chatWithAI(senderId, text) {
    if (!GROQ_KEY) return null;

    const history = getChatHistory(senderId, 20).map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0]?.text || '',
    }));

    const request = () => fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + GROQ_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: PERSONA },
                ...history,
                { role: 'user', content: text },
            ],
            max_tokens: 250,
            temperature: 0.92,
        }),
    });

    let res = await request();
    if (res.status === 429) {
        await new Promise(r => setTimeout(r, 6000));
        res = await request();
    }

    if (!res.ok) return null;

    const data = await res.json();
    const reply = cleanReply(data.choices?.[0]?.message?.content?.trim());

    if (reply) {
        appendChatHistory(senderId, 'user', text);
        appendChatHistory(senderId, 'model', reply);
    }

    return reply || null;
}

function isAIAvailable() {
    return !!GROQ_KEY;
}

module.exports = { chatWithAI, isAIAvailable };
