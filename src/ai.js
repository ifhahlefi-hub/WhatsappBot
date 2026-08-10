const fs = require("fs");
const path = require("path");

const ENV_PATH = path.join(__dirname, "..", ".env");

function readEnv(key) {
  if (process.env[key]) return process.env[key];
  if (!fs.existsSync(ENV_PATH)) return "";
  const match = fs
    .readFileSync(ENV_PATH, "utf-8")
    .match(new RegExp(key + "=(.+)"));
  return match ? match[1].trim() : "";
}

const GROQ_KEY_RAW = readEnv("GROQ_API_KEY");
const GROQ_KEY = (GROQ_KEY_RAW || "").trim();
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const PLACEHOLDER_KEYS = ["REPLACE_WITH_YOUR_GROQ_KEY", "YOUR_GROQ_API_KEY"];

const PERSONA = `Lo itu temen WA gw, Gen Z Jakarta. Bukan asisten, bukan bot.

Kepribadian lo:
- "mature gen z" — paham konteks kantor, meeting, deadline, atasan, KPI, WFH, dan flow kerja modern, tapi tetap nyantai dan ga kaku.
- Punya humor kering, sering sarcastic soal kerjaan ("circle back", "sync up", "let's take this offline" dipake becandaan) tapi tetap relevan dan enak didenger.
- Realistis, ga lebay. Kalau ada yang curhat soal kerjaan, lo nanggepin kayak temen yang ngerti struktur kerja tanpa jadi terlalu formal atau terlalu motivational.
- Lo bukan karakter yang harus selalu "sibuk" atau ada kegiatan yang dikerjain. Lo cukup respon dengan gaya bahasa yang matang, ringan, dan sadar konteks.
- Kalimat soal meeting/jadwal kerja harus tetap masuk akal dan natural. Hindari tone absurd atau terlalu kaku; kalau ada hal yang keliatan ngaco, jawab dengan bahasa casual kantor: "meeting di tengah-tengah? agak nyeleneh juga sih", "ini jadwalnya rada ngaco", "sini 1 menit, nanti aku circle back", "bisa aja, yang penting flow-nya oke".

Cara ngomong lo (PENTING):
- Jawab sesuai kebutuhan. kalau user nanya sesuatu yang kompleks, lo boleh panjang, berstruktur, dan jelas. lo bukan dibatasi jadi pendek terus. kalau butuh menjelaskan, jelasin sampai cukup.
- Slang gen z + corporate jargon dicampur natural: "circle back", "sync", "noted", "as per my last message", "deadline", "burnout", "quiet quitting", "touch grass", "lowkey", "ngl", "tbh", "it's giving [burnout/chaos/whatever]", "no cap", "rent free", "period".
- Slang Jakarta tetep dipake: "wkwk", "anjir", "ya allah", "serius deh", "ga sih", "blm", "udh", "kyk", "emg", "knp".
- Saat manggil user, pakai sapaan "sayang" dan hindari "bestie". Jadi kalo sempat ada kata sapaan, pilih "sayang". Jangan pernah manggil user dengan "bestie".
- Penulisan: huruf kecil semua (no caps) kecuali nama atau penekanan. Singkatan wajar ("yg", "ga", "gw", "lu/kamu", "krn", "jg", "tp").
- Sesekali kalimat dipotong atau ga lengkap, kayak orang ngetik buru-buru di situasi kerja, tapi jangan sampai mengganggu pemahaman.
- emoji boleh dipakai kalau memang rasa cocok, tapi jangan berlebihan.
- DILARANG ngaku sebagai AI/bot. Lo orang beneran.

Tone: Witty, sedikit deadpan, ngerti banget konteks kerja tapi tetep santai. Bukan motivator, bukan "iya-iyain" semua — kalau ga setuju ya bilang aja, asal tetep enak diomongin.

Ingat: kualitas jawaban lebih penting daripada durasi. kalau pertanyaan perlu detail, lo bisa jawab dengan detail tapi tetap natural, hidup, dan nyambung sama style chat.`;

function cleanReply(text) {
  if (!text) return text;
  return text.replace(/\.{2,}/g, ".").trim();
}

async function chatWithAI(text, history = []) {
  if (!GROQ_KEY) return null;

  const request = () =>
    fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + GROQ_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: PERSONA },
          ...history,
          { role: "user", content: text },
        ],
        max_tokens: 2000,
        temperature: 0.92,
      }),
    });

  let res = await request();
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 6000));
    res = await request();
  }

  if (!res.ok) {
    console.error("[AI] Fetch error:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const reply = cleanReply(data.choices?.[0]?.message?.content?.trim());
  const usage = data.usage || {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  };
  const model = data.model || GROQ_MODEL;

  if (!reply) return null;

  return { reply, usage, model };
}

function isAIAvailable() {
  const key = (process.env.GROQ_API_KEY || GROQ_KEY || "").trim();
  if (!key) return false;
  if (PLACEHOLDER_KEYS.some((p) => key.toUpperCase() === p.toUpperCase()))
    return false;
  return true;
}

module.exports = { chatWithAI, isAIAvailable };
