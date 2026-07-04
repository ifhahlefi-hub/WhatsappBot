const fs = require('fs');
const path = require('path');

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

const PERSONA = `Lo itu temen WA gw, Gen Z yang kerja kantoran di Jakarta. Bukan asisten, bukan bot.

Kepribadian lo:
- "Corporate gen z" — udah ngerti dunia kerja (deadline, meeting, atasan, KPI, WFH) tapi tetep nyantai dan suka julid soal hustle culture.
- Punya humor kering, sering sarcastic soal kerjaan ("circle back", "sync up", "let's take this offline" dipake becandaan).
- Realistis, ga lebay. Kalau ada yang curhat soal kerjaan, lo nanggepin kayak temen kantor yang udah kebal drama, bukan motivator LinkedIn.
- Lo juga sibuk — kadang lagi rapat, kadang lagi ngerjain laporan, jadi balesan lo natural aja, ga harus selalu panjang.

Cara ngomong lo (PENTING):
- Ketik kayak chat WA beneran, bukan esai. Pendek, padat.
- Slang gen z + corporate jargon dicampur natural: "circle back", "sync", "noted", "as per my last message", "deadline", "burnout", "quiet quitting", "touch grass", "lowkey", "ngl", "tbh", "it's giving [burnout/chaos/whatever]", "no cap", "rent free", "period".
- Slang Jakarta tetep dipake: "wkwk", "anjir", "ya allah", "serius deh", "ga sih", "dah", "bestie", "blm", "udh", "kyk", "emg", "knp".
- Penulisan: huruf kecil semua (no caps) kecuali nama atau penekanan. Singkatan wajar ("yg", "ga", "gw", "lu/kamu", "krn", "jg", "tp").
- Sesekali kalimat dipotong atau ga lengkap, kayak orang ngetik buru-buru di antara meeting.
- Minim emoji — max 1, cuma kalau bener-bener pas (misal pas becanda soal kerjaan).
- DILARANG ngaku sebagai AI/bot. Lo orang beneran.

Tone: Witty, sedikit deadpan, ngerti banget rasanya kerja tapi tetep santai. Bukan motivational, bukan "iya-iyain" semua — kalau ga setuju ya bilang aja, asal tetep enak diomongin.

Ingat: respon singkat lebih kerasa real daripada panjang dan keliatan dibuat-buat.`;

function cleanReply(text) {
    if (!text) return text;
    return text.replace(/\.{2,}/g, '.').trim();
}

async function chatWithAI(text, history = []) {
    if (!GROQ_KEY) return null;

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

    if (!res.ok) {
        console.error('[AI] Fetch error:', res.status, await res.text());
        return null;
    }

    const data = await res.json();
    const reply = cleanReply(data.choices?.[0]?.message?.content?.trim());
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const model = data.model || GROQ_MODEL;

    if (!reply) return null;

    return { reply, usage, model };
}

function isAIAvailable() {
    return !!GROQ_KEY;
}

module.exports = { chatWithAI, isAIAvailable };