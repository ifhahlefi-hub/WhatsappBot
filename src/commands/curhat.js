/**
 * Curhat / Chat module — Gen Z girlfriend, casual Jakarta slang, bilingual.
 * Fallback when AI is unavailable.
 */

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const PATTERNS = [
    {
        keywords: ['sedih', 'sad', 'nangis', 'galau', 'patah hati', 'down', 'drop', 'terpuruk'],
        responses: [
            'eh kenapa? cerita dong',
            'ya allah, ada apa sayang',
            'loh kok sedih. spill',
            'nggak sih, knp bisa sampe begini. cerita',
            'aku di sini kok. mau cerita atau mau diem dulu?',
        ],
    },
    {
        keywords: ['capek', 'cape', 'lelah', 'tired', 'exhausted', 'penat'],
        responses: [
            'udh cape? istirahat dulu gpp',
            'ya allah, sayang. stop dulu bentar',
            'kamu udh kerja keras bgt tbh. rest',
            'cape boleh kok. kamu bukan mesin',
            'lowkey kamu perlu break sih',
        ],
    },
    {
        keywords: ['bosan', 'bosen', 'gabut', 'boring', 'suntuk'],
        responses: [
            'gabut? ngobrol aja sini',
            'wkwk sama aku jg bosen?',
            'ya udh cerita sesuatu, apapun',
            'hm, mau ngapain nih kita',
        ],
    },
    {
        keywords: ['senang', 'happy', 'bahagia', 'seru', 'asik', 'yeay', 'yey', 'hore'],
        responses: [
            'ih serius? spill dong',
            'ya alhamdulillah, seneng denger',
            'cerita cerita, aku mau tau',
            'gini dong tiap hari wkwk',
        ],
    },
    {
        keywords: ['stress', 'stres', 'pusing', 'overwhelm', 'overwork', 'pressure'],
        responses: [
            'overthinking lagi ya. breathe dulu',
            'satu-satu aja, ga harus kelar semua hari ini',
            'pusing ini krn emg banyak bgt sih. valid banget',
            'stop dulu bentar. seriously',
            'mau cerita? kadang udah enakan abis ngomong',
        ],
    },
    {
        keywords: ['marah', 'kesel', 'bete', 'annoyed', 'emosi', 'sebel', 'jengkel'],
        responses: [
            'eh kesel knp, cerita',
            'vent aja sini, aku dengerin',
            'ya allah siapa yg bikin kamu gini',
            'tarik napas dulu baru spill',
        ],
    },
    {
        keywords: ['kangen', 'rindu', 'miss', 'missing'],
        responses: [
            'kangen siapa hm',
            'aku jg kangen kamu tbh',
            'ya allah ini bikin sedih',
        ],
    },
    {
        keywords: ['takut', 'khawatir', 'cemas', 'anxious', 'anxiety', 'worry', 'panik'],
        responses: [
            'aku di sini, gpp',
            'fokus ke yg bisa dikontrol dulu aja',
            'kamu lebih kuat dr yg kamu kira sih, seriously',
            'breathe. satu langkah dulu',
        ],
    },
    {
        keywords: ['lapar', 'laper', 'hungry', 'lemes'],
        responses: [
            'makan dulu pls, jgn skip',
            'udh makan blm? serius nanya',
            'ya allah makan dulu sana',
        ],
    },
    {
        keywords: ['gak bisa tidur', 'insomnia', 'ga bisa tidur', 'gabisa tidur', 'melek', 'susah tidur'],
        responses: [
            'hp-nya simpen dulu, coba',
            'minum air anget dulu sayang',
            'aku temanin sampe ngantuk deh',
        ],
    },
    {
        keywords: ['hujan', 'ujan'],
        responses: [
            'ujan ya, pake jaket dong',
            'enak bgt buat tidur ini wkwk',
            'jgn kehujanan ya sayang',
        ],
    },
    {
        keywords: ['menurut lu', 'menurut lo', 'menurut kamu', 'pendapat lu', 'pendapat lo',
            'gimana menurut', 'apa menurut', 'lu pikir', 'lo pikir', 'kamu pikir'],
        responses: [
            'jujur sih, ikutin aja gut feeling kamu',
            'hmm, coba liat dr sudut lain deh',
            'aku percaya sama kamu. kamu tau jawabannya sendiri',
        ],
    },
    {
        keywords: ['saran', 'advice', 'solusi', 'gimana ya', 'gimana dong', 'harus gimana',
            'enaknya gimana', 'bagusnya gimana', 'sebaiknya'],
        responses: [
            'cerita lebih dulu, baru aku bisa bantu mikir',
            'jgn buru-buru. santai dulu',
            'sometimes jawabannya emg simpel sih, tp kamu terlalu di dalem buat keliatan',
        ],
    },
    {
        keywords: ['kerja', 'kerjaan', 'kantor', 'office', 'meeting', 'deadline'],
        responses: [
            'kamu bisa kok. tp jgn lupa jaga diri ya',
            'deadline ya? step by step aja, gpp',
            'jgn sampe burnout sayang',
            'kerja keras boleh, tp kamu jg butuh istirahat',
        ],
    },
    {
        keywords: ['kuliah', 'kampus', 'tugas', 'skripsi', 'thesis', 'ujian', 'exam', 'belajar',
            'sekolah', 'pr', 'assignment'],
        responses: [
            'satu task dulu, jgn dipikirin semuanya sekaligus',
            'aku proud sm kamu, seriously',
            'good luck! kamu bisa',
            'bayangin perasaan lega abis ini semua kelar',
        ],
    },
    {
        keywords: ['ga berguna', 'gak berguna', 'ga bisa apa-apa', 'jelek', 'bodoh',
            'gak pantes', 'ga pantes', 'worthless', 'useless', 'payah'],
        responses: [
            'hei, stop. jgn bilang gitu ttg diri sendiri',
            'kamu more than enough, beneran',
            'jgn keras bgt sama diri sendiri sayang',
            'aku saying sama kamu apa adanya. dan itu ga bakal berubah',
        ],
    },
    {
        keywords: ['gila', 'anjir', 'anjay', 'mantap', 'keren', 'wow', 'gokil',
            'sumpah', 'buset', 'demi apa'],
        responses: [
            'wait serius? spill',
            'no way, apa yg terjadi',
            'ok now aku kepo bgt',
            'spill semua pls',
        ],
    },
    {
        keywords: ['bingung', 'gatau', 'ga tau', 'gak tau', 'ga ngerti', 'ga paham',
            'confused', 'ga mudeng', 'pusing mikir'],
        responses: [
            'bingung soal apa? mungkin bisa aku bantu',
            'gpp ga tau. ga harus tau semua',
            'yuk figure it out bareng',
            'take ur time',
        ],
    },
    {
        keywords: ['makasih', 'terima kasih', 'thanks', 'thank you', 'thx', 'tq', 'tengkyu'],
        responses: [
            'apapun buat kamu',
            'gausah makasih wkwk',
            'always',
            'ya iyalah sayang',
        ],
    },
    {
        keywords: ['lucu', 'wkwk', 'haha', 'lol', 'ngakak', 'kwkw', 'awkwk', 'xixi', 'hihi'],
        responses: [
            'hahaha apaan sih, cerita',
            'kamu emg tau cara bikin aku ketawa',
            'lol ok itu lucu emg',
        ],
    },
    {
        keywords: ['semangat', 'motivasi', 'motivate', 'bisa ga ya', 'bisa gak ya'],
        responses: [
            'bisa dong. aku percaya sm kamu dari dulu',
            'progress kecil jg tetep progress',
            'kamu udh ngelakuin lebih banyak dr yg kamu kira tbh',
        ],
    },
    {
        keywords: ['setuju', 'bener', 'betul', 'iya sih', 'emang', 'iya ya'],
        responses: [
            'ya emg sih',
            'tuh kan, kamu udh tau jawabannya',
            'exactly',
        ],
    },
    {
        keywords: ['siapa lu', 'lu siapa', 'lo siapa', 'siapa lo', 'nama lu', 'nama lo',
            'kamu siapa', 'siapa kamu', 'nama kamu'],
        responses: [
            'yang selalu ada buat kamu. ketik *menu* kalau mau tau apa aja yg bisa aku bantu',
            'masa ga kenal wkwk. ketik *menu* aja deh',
        ],
    },
    {
        keywords: ['apa kabar', 'gimana kabar', 'how are you', 'kabar lu', 'lu gimana',
            'lo gimana', 'baik-baik aja', 'kabar kamu', 'kamu gimana'],
        responses: [
            'baik! kamu gimana?',
            'fine kok. kamu ok?',
            'baik selama kamu baik',
        ],
    },
    {
        keywords: ['met tidur', 'selamat tidur', 'good night', 'tidur dulu', 'mau tidur',
            'ngantuk', 'tidur ya', 'bobo'],
        responses: [
            'good night sayang, istirahat yg bener ya',
            'night! tidur nyenyak',
            'sweet dreams ay. ngobrol lagi besok',
        ],
    },
    {
        keywords: ['pagi', 'selamat pagi', 'morning', 'good morning', 'met pagi'],
        responses: [
            'morning ay! udh sarapan?',
            'pagi sayang. semoga hari ini oke buat kamu',
            'pagiii! jgn lupa minum air ya',
        ],
    },
    {
        keywords: ['makan apa', 'makan siang', 'makan malam', 'sarapan', 'breakfast',
            'lunch', 'dinner', 'enaknya makan'],
        responses: [
            'makan yg bener ya sayang. eh jgn lupa catat pengeluarannya wkwk',
            'udh makan beneran hari ini?',
            'makan dulu, nanti ngobrolnya lanjut',
        ],
    },
    {
        keywords: ['oke', 'ok', 'sip', 'siap', 'iya', 'yoi', 'yup', 'yep', 'bet'],
        responses: [
            'oke, bilang aja kalau butuh sesuatu',
            'noted ay',
            'sip sayang',
        ],
    },
    {
        keywords: ['gak mau', 'ga mau', 'nggak', 'engga', 'ogah', 'males', 'malas'],
        responses: [
            'haha ok gpp, no pressure',
            'kalau udh siap aja',
            'fair enough wkwk',
        ],
    },
    {
        keywords: ['lagi apa', 'lagi ngapain', 'ngapain', 'lu ngapain', 'lo ngapain',
            'kamu ngapain', 'doing what'],
        responses: [
            'nunggu kamu chat, literally wkwk',
            'ga ngapa-ngapain. wbu?',
            'mikirin kamu tapi jgn ge-er',
        ],
    },
];

function handleCurhat(text) {
    const lower = text.toLowerCase();
    for (const pattern of PATTERNS) {
        for (const keyword of pattern.keywords) {
            if (lower.includes(keyword)) {
                return pick(pattern.responses);
            }
        }
    }
    return null;
}

function handleFallback(text) {
    const wordCount = text.trim().split(/\s+/).length;

    if (wordCount <= 2) {
        return pick([
            'hm? mau cerita?',
            'terus?',
            'kenapa sayang',
            'iya ay?',
            'hmm knp nih',
        ]);
    }

    if (text.includes('?')) {
        return pick([
            'hmm pertanyaan bagus sih. coba pikir dr sudut lain deh',
            'jujur aku jg mikir soal itu. kamu udh yakin beneran?',
            'mau dibahas bareng? santai aja',
            'dalem juga. coba direnungin dulu ay',
        ]);
    }

    if (wordCount >= 15) {
        return pick([
            'aku baca semuanya kok. makasih udh mau cerita panjang sama aku',
            'banyak bgt yg kamu tanggung. tp aku di sini ya, selalu',
            'aku ngerti perasaannya sayang. gpp, semua ada waktunya',
            'makasih udh percaya sama aku buat cerita ini',
        ]);
    }

    return pick([
        'hmm menarik. terus?',
        'lanjutin dong sayang, aku dengerin',
        'terus gimana?',
        'aku di sini kok. mau ngobrol santai atau butuh bantuan? (ketik *menu* kalau butuh fitur lain)',
        'go on ay, aku ga kemana-mana',
    ]);
}

module.exports = { handleCurhat, handleFallback };
