/**
 * Curhat / Chat module — Gen Z girlfriend, casual Jakarta slang + corporate code-switch, bilingual.
 * Fallback when AI is unavailable.
 */

// Track last index picked per category so the same line doesn't fire twice in a row.
const lastIndex = {};

function pick(arr, key) {
    if (arr.length === 1) return arr[0];
    let idx = Math.floor(Math.random() * arr.length);
    if (key !== undefined) {
        while (idx === lastIndex[key]) {
            idx = Math.floor(Math.random() * arr.length);
        }
        lastIndex[key] = idx;
    }
    return arr[idx];
}

const PATTERNS = [
    {
        id: 'sad',
        keywords: ['sedih', 'sad', 'nangis', 'galau', 'patah hati', 'down', 'drop', 'terpuruk'],
        responses: [
            'eh, kenapa tiba-tiba sedih gini. cerita dong, aku dengerin kok',
            'ya allah sayang, ada apa. spill aja, no judgement',
            'loh kok down, cerita ke aku, aku gapunya rapat lain, fokus ke kamu aja',
            'aku notice kamu agak off dari tadi. mau cerita atau mau dipeluk dulu aja',
            'sedihnya kelihatan banget di chat kamu tbh. cerita pelan-pelan aja gpp',
            'nggak harus kuat terus kok. sini, cerita apa yg bikin sedih',
            'gapapa nangis, aku gabakal nge-judge. spill semuanya',
            'lagi berat ya kayaknya. take your time, aku nggak buru-buru kemana-mana',
            'real talk, ada apa, kelihatan kamu lagi nggak oke',
        ],
    },
    {
        id: 'tired',
        keywords: ['capek', 'cape', 'lelah', 'tired', 'exhausted', 'penat', 'drained'],
        responses: [
            'kamu kayaknya lagi low battery mode nih beneran, charge dulu yuk',
            'udh capek segini, stop dulu bentar, kamu bukan robot yg harus on 24/7',
            'istirahat dulu sayang, kerjaan bisa nyusul, kamu nggak ada tombol restart kalo udh drop',
            'aku tau kamu kerja keras bgt, tp badan kamu jg butuh hard stop sesekali',
            'capek itu valid kok, nggak usah dipaksa produktif terus',
            'rebahan dulu, hp taro jauh, biar bener-bener charge bukan setengah-setengah',
            'kamu udh banyak banget effort hari ini, sisanya nanti aja',
            'lowkey worried sama kamu kalo terus-terusan kayak gini',
            'pause dulu, gapapa, nggak semua hari harus all out',
        ],
    },
    {
        id: 'bored',
        keywords: ['bosan', 'bosen', 'gabut', 'boring', 'suntuk'],
        responses: [
            'gabut ya, sini ngobrol aja, aku free kok',
            'wkwk sama, mood aku jg lagi flat hari ini',
            'cerita apa kek, random jg gapapa, aku tetep dengerin',
            'mau aku kasih topik atau kamu yg mulai duluan',
            'bosen tanda kamu butuh distraksi yg lebih seru, aku available',
            'gabut mode on ya, literally sama kayak aku',
            'ayo ngobrolin hal random aja, biar nggak makin suntuk',
            'kalo bosen gini biasanya kamu pengen ngapain sih',
        ],
    },
    {
        id: 'happy',
        keywords: ['senang', 'happy', 'bahagia', 'seru', 'asik', 'yeay', 'yey', 'hore'],
        responses: [
            'ih serius? spill semuanya, aku excited bgt denger ini',
            'yes! akhirnya ada good news, cerita dong detailnya',
            'seneng denger kamu happy gini, energinya nular ke aku jg',
            'literally bikin hari aku jg jadi lebih oke, gimana ceritanya',
            'main character moment ya ini, ceritain dong',
            'aku ikut bahagia bgt, kasih tau aku semua detailnya pls',
            'gini dong tiap hari, kamu pantes seneng terus',
            'high-key proud denger ini, lanjut cerita',
        ],
    },
    {
        id: 'stress',
        keywords: ['stress', 'stres', 'pusing', 'overwhelm', 'overwork', 'pressure', 'burnout'],
        responses: [
            'ini udh kerasa kayak silent burnout sih, jgn dipendam sendirian',
            'satu-satu aja, nggak harus kelar semua hari ini',
            'breathe dulu bentar, aku tunggu kok',
            'overthinking lagi ya, coba tarik napas pelan-pelan dulu',
            'pusingnya valid bgt sih kalo emg beban kamu segitu banyak',
            'stop scroll kerjaan bentar, fokus napas dulu',
            'kamu boleh nggak baik-baik aja kok, aku tetep di sini',
            'cerita aja semuanya, kadang udh enakan abis di-spill',
            'jgn nge-push diri sendiri kayak lagi sprint terus, kasih jeda dikit',
        ],
    },
    {
        id: 'angry',
        keywords: ['marah', 'kesel', 'bete', 'annoyed', 'emosi', 'sebel', 'jengkel'],
        responses: [
            'eh kesel kenapa, cerita, aku siap dengerin tanpa nge-judge',
            'vent aja semua di sini, aku gabakal ngebantah duluan',
            'siapa sih yg bikin kamu segini emosi',
            'tarik napas dulu, abis itu spill semuanya',
            'kamu berhak marah kalo emg ada alasannya, valid kok itu',
            'cerita, aku team kamu di sini',
            'kalo perlu ngomel-ngomel dulu jg gapapa, aku tahan',
            'real talk, ada apa, kelihatan banget kamu lagi panas',
        ],
    },
    {
        id: 'miss',
        keywords: ['kangen', 'rindu', 'miss', 'missing'],
        responses: [
            'kangen siapa nih',
            'aku jg kangen kamu tbh, literally dari tadi mikirin',
            'ya allah jgn bikin sedih, nanti aku jg jadi kangen makin parah',
            'kangen-kangenan boleh, asal jgn keseringan sedihnya',
            'sini cerita kangennya kayak gimana',
            'rindu emang gaada obatnya selain ngobrol kayak gini',
            'aku di sini kok walau cuma chat, nggak kemana-mana',
        ],
    },
    {
        id: 'love',
        keywords: ['sayang kamu', 'cinta kamu', 'i love you', 'love you', 'aku cinta kamu', 'aku sayang kamu'],
        responses: [
            'aku jg sayang kamu, beneran',
            'literally bikin hari aku jadi lebih baik denger ini',
            'aku jg, lebih dari yg kamu kira',
            'ini bukan basa-basi ya, aku emang sayang kamu apa adanya',
            'kamu tau itu bikin aku senyum sendiri kan',
            'love you too, no cap',
        ],
    },
    {
        id: 'anxious',
        keywords: ['takut', 'khawatir', 'cemas', 'anxious', 'anxiety', 'worry', 'panik'],
        responses: [
            'aku di sini, nggak kemana-mana, gapapa',
            'fokus ke yg bisa dikontrol dulu aja, sisanya pelan-pelan',
            'kamu lebih kuat dr yg kamu kira, real talk',
            'breathe, satu langkah dulu, nggak usah liat semuanya sekaligus',
            'cemas itu valid, tp jgn biarin dia yg nyetir',
            'worry-nya boleh ada, tp jgn sampe dia yg ambil alih',
            'kalo overthinking lagi, sini cerita biar keluar dulu dr kepala',
            'kamu nggak sendirian ngadepin ini',
        ],
    },
    {
        id: 'hungry',
        keywords: ['lapar', 'laper', 'hungry', 'lemes'],
        responses: [
            'makan dulu pls, jgn di-skip, aku serius',
            'udh makan blm hari ini? jawab jujur',
            'ya allah makan dulu sana, ngobrolnya nanti lanjut',
            'lapar tu sinyal badan minta diperhatiin, jgn diabaikan',
            'mau makan apa, kasih tau biar aku ikut seneng bayanginnya',
            'self-care nomor satu itu makan tepat waktu, gas dulu',
        ],
    },
    {
        id: 'insomnia',
        keywords: ['gak bisa tidur', 'insomnia', 'ga bisa tidur', 'gabisa tidur', 'melek', 'susah tidur'],
        responses: [
            'hp-nya simpen dulu coba, biar mata ikutan istirahat',
            'minum air anget dulu sayang, terus rebahan',
            'aku temenin sampe ngantuk, cerita aja apa yg bikin susah tidur',
            'pikiran lagi rame ya kayaknya, coba tulis dulu yg bikin overthinking',
            'gausah dipaksa tidur, pelan-pelan aja, aku gak kemana-mana',
            'lampu diredupin, scroll dikit aja, abis itu coba pejamin mata',
        ],
    },
    {
        id: 'rain',
        keywords: ['hujan', 'ujan'],
        responses: [
            'ujan ya, pake jaket dong kalo keluar',
            'enak bgt buat tidur ini, jgn lupa selimutan',
            'jgn kehujanan ya, nanti masuk angin',
            'mood buat ngeteh sambil liat ujan sih ini',
            'inget bawa payung kalo mau keluar nanti',
        ],
    },
    {
        id: 'opinion',
        keywords: ['menurut lu', 'menurut lo', 'menurut kamu', 'pendapat lu', 'pendapat lo',
            'gimana menurut', 'apa menurut', 'lu pikir', 'lo pikir', 'kamu pikir'],
        responses: [
            'jujur sih, ikutin gut feeling kamu aja, biasanya itu yg paling jujur',
            'coba liat dr sudut lain dulu deh, baru putusin',
            'aku percaya kamu udh tau jawabannya sendiri, cuma butuh diyakinin',
            'kalo ditanya pendapat aku, aku lebih milih liat apa yg bikin kamu tenang',
            'nggak ada jawaban yg 100% bener di sini, yg penting kamu nyaman',
            'coba sleep on it dulu, besok mikir lagi',
        ],
    },
    {
        id: 'advice',
        keywords: ['saran', 'advice', 'solusi', 'gimana ya', 'gimana dong', 'harus gimana',
            'enaknya gimana', 'bagusnya gimana', 'sebaiknya'],
        responses: [
            'cerita lebih detail dulu, baru aku bisa bantu mikir bareng',
            'jgn buru-buru decide, santai dulu',
            'kadang jawabannya emang simpel, cuma kamu kebanyakan di dalem buat liat jelas',
            'coba breakdown dulu masalahnya jadi bagian kecil, biar nggak overwhelmed',
            'aku bisa kasih perspektif, tp keputusan tetep di tangan kamu ya',
            'mau brainstorm bareng? cerita aja situasinya',
        ],
    },
    {
        id: 'work',
        keywords: ['kerja', 'kerjaan', 'kantor', 'office', 'meeting', 'deadline'],
        responses: [
            'deadline ya? anggep aja soft deadline, step by step gpp',
            'meeting kelamaan lagi? quick sync yg jadi sejam tu emg parah sih',
            'kamu bisa kok, tp jgn lupa kasih hard stop buat diri sendiri',
            'kerja keras boleh, asal jgn sampe silent burnout',
            'jgn lupa makan siang di antara kerjaan ya',
            'aku proud sama effort kamu di kerjaan, real talk',
            'kalo udh terlalu banyak, boleh kok bilang nggak ke satu dua hal',
            'lock in buat yg penting dulu, sisanya nanti aja',
        ],
    },
    {
        id: 'study',
        keywords: ['kuliah', 'kampus', 'tugas', 'skripsi', 'thesis', 'ujian', 'exam', 'belajar',
            'sekolah', 'pr', 'assignment'],
        responses: [
            'satu task dulu, jgn dipikirin semuanya sekaligus',
            'aku proud sm kamu, beneran, ini effort yg gede',
            'good luck, kamu pasti bisa lewatin ini',
            'bayangin lega-nya pas ini semua kelar, deket lagi kok',
            'lock in dulu sebentar, fokus ke yg di depan mata aja',
            'kalo capek, break sebentar gpp, nggak harus marathon terus',
            'kamu udh banyak progress walau nggak kerasa',
        ],
    },
    {
        id: 'insecure',
        keywords: ['ga berguna', 'gak berguna', 'ga bisa apa-apa', 'jelek', 'bodoh',
            'gak pantes', 'ga pantes', 'worthless', 'useless', 'payah'],
        responses: [
            'hei, stop, jgn ngomong gitu soal diri kamu sendiri',
            'kamu more than enough, beneran, ini bukan basa-basi',
            'jgn keras-keras sama diri sendiri, kamu udh usaha kok',
            'aku sayang kamu apa adanya, itu nggak bakal berubah',
            'kata-kata itu nggak fair buat kamu sendiri, tarik lagi deh',
            'kamu lagi liat diri kamu lewat lensa yg salah aja ini',
            'real talk, kamu jauh lebih baik dr yg kamu kira',
        ],
    },
    {
        id: 'surprise',
        keywords: ['gila', 'anjir', 'anjay', 'mantap', 'keren', 'wow', 'gokil',
            'sumpah', 'buset', 'demi apa'],
        responses: [
            'wait serius? spill sekarang juga',
            'iyakah, apa yg kejadian, kepo bgt aku',
            'demi apa, cerita dong, jgn nanggung',
            'green flag banget kalo emg itu ceritanya, lanjut',
            'no way, terus gimana',
            'ok ceritain detail, aku udh duduk siap dengerin',
        ],
    },
    {
        id: 'confused',
        keywords: ['bingung', 'gatau', 'ga tau', 'gak tau', 'ga ngerti', 'ga paham',
            'confused', 'ga mudeng', 'pusing mikir'],
        responses: [
            'bingung soal apa, coba cerita, mungkin bisa aku bantu liat lebih jelas',
            'gapapa nggak tau, nggak harus tau semua hal',
            'kamu nggak sendirian kok ngerasa bingung soal ini',
            'take your time, nggak usah dipaksa nemu jawaban sekarang',
            'coba pelan-pelan kita uraikan satu-satu',
            'wajar kok confused, situasinya emang nggak simpel',
        ],
    },
    {
        id: 'thanks',
        keywords: ['makasih', 'terima kasih', 'thanks', 'thank you', 'thx', 'tq', 'tengkyu'],
        responses: [
            'apapun buat kamu',
            'gausah makasih, ini emang udah tugas aku sebagai pacar kamu wkwk',
            'always, kamu tau itu',
            'ya iyalah sayang, santai aja',
            'no need to thank me, seriously',
        ],
    },
    {
        id: 'funny',
        keywords: ['lucu', 'wkwk', 'haha', 'lol', 'ngakak', 'kwkw', 'awkwk', 'xixi', 'hihi'],
        responses: [
            'hahaha apaan sih, cerita lebih detail',
            'kamu emang tau cara bikin aku ketawa',
            'lol ini lucu beneran, lanjut',
            'literally ngakak baca ini',
            'kamu punya bakat jadi comic relief tau nggak',
        ],
    },
    {
        id: 'motivate',
        keywords: ['semangat', 'motivasi', 'motivate', 'bisa ga ya', 'bisa gak ya'],
        responses: [
            'bisa dong, aku percaya sama kamu dari awal',
            'progress kecil tetap progress, jgn diremehin',
            'kamu udh ngelakuin lebih banyak dr yg kamu sadari',
            'lock in dulu, sisanya ngalir sendiri',
            'kamu pasti bisa, no cap',
            'satu langkah aja dulu, nggak usah liat garis finish',
        ],
    },
    {
        id: 'agree',
        keywords: ['setuju', 'bener', 'betul', 'iya sih', 'emang', 'iya ya'],
        responses: [
            'ya emang sih',
            'tuh kan, kamu udh tau jawabannya dari awal',
            "exactly, that's the point",
            'green flag banget kalo kamu udh nyadar itu',
            'fair point sih',
        ],
    },
    {
        id: 'identity',
        keywords: ['siapa lu', 'lu siapa', 'lo siapa', 'siapa lo', 'nama lu', 'nama lo',
            'kamu siapa', 'siapa kamu', 'nama kamu'],
        responses: [
            'yang selalu ada buat kamu. ketik *menu* kalau mau tau apa aja yg bisa aku bantu',
            'masa ga kenal wkwk. ketik *menu* aja deh',
        ],
    },
    {
        id: 'howareyou',
        keywords: ['apa kabar', 'gimana kabar', 'how are you', 'kabar lu', 'lu gimana',
            'lo gimana', 'baik-baik aja', 'kabar kamu', 'kamu gimana'],
        responses: [
            'baik, kamu gimana',
            'fine kok, kamu ok nggak',
            'baik selama kamu jg baik',
            'so far so good, kamu gimana hari ini',
        ],
    },
    {
        id: 'goodnight',
        keywords: ['met tidur', 'selamat tidur', 'good night', 'tidur dulu', 'mau tidur',
            'ngantuk', 'tidur ya', 'bobo'],
        responses: [
            'good night sayang, istirahat yg bener ya',
            'night, tidur nyenyak',
            'sweet dreams, ngobrol lagi besok',
            'low battery mode, time to charge, night',
        ],
    },
    {
        id: 'morning',
        keywords: ['pagi', 'selamat pagi', 'morning', 'good morning', 'met pagi'],
        responses: [
            'morning, udh sarapan',
            'pagi sayang, semoga hari ini oke buat kamu',
            'pagii, jgn lupa minum air',
        ],
    },
    {
        id: 'eat',
        keywords: ['makan apa', 'makan siang', 'makan malam', 'sarapan', 'breakfast',
            'lunch', 'dinner', 'enaknya makan'],
        responses: [
            'makan yg bener ya, eh jgn lupa catet pengeluarannya jg wkwk',
            'udh makan beneran hari ini',
            'makan dulu, nanti ngobrolnya lanjut',
        ],
    },
    {
        id: 'ok',
        keywords: ['oke', 'ok', 'sip', 'siap', 'iya', 'yoi', 'yup', 'yep', 'bet'],
        responses: [
            'oke, bilang aja kalo butuh sesuatu',
            'noted',
            'sip sayang',
        ],
    },
    {
        id: 'decline',
        keywords: ['gak mau', 'ga mau', 'nggak', 'engga', 'ogah', 'males', 'malas'],
        responses: [
            'haha ok gpp, no pressure',
            'kalo udh siap aja',
            'fair enough',
        ],
    },
    {
        id: 'doing',
        keywords: ['lagi apa', 'lagi ngapain', 'ngapain', 'lu ngapain', 'lo ngapain',
            'kamu ngapain', 'doing what'],
        responses: [
            'nunggu kamu chat, literally',
            'ga ngapa-ngapain, wbu',
            'mikirin kamu tapi jgn ge-er',
        ],
    },
];

function handleCurhat(text) {
    const lower = text.toLowerCase();
    for (const pattern of PATTERNS) {
        for (const keyword of pattern.keywords) {
            if (lower.includes(keyword)) {
                return pick(pattern.responses, pattern.id);
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
            'lanjutin dong, masih nunggu',
            'oke, terus gimana',
        ], 'fb_short');
    }

    if (text.includes('?')) {
        return pick([
            'pertanyaan bagus sih, coba liat dr sudut lain deh',
            'jujur aku jg masih mikirin itu, kamu udh yakin beneran?',
            'mau dibahas bareng? santai aja, nggak buru-buru',
            'dalem juga ini, coba direnungin dulu',
            'real talk, itu pertanyaan yg nggak ada jawaban gampang',
            'hmm, kira-kira kamu udh ada bayangan jawabannya sendiri belum',
            'good question, tp menurut kamu sendiri gimana',
        ], 'fb_question');
    }

    if (wordCount >= 15) {
        return pick([
            'aku baca semuanya kok, makasih udh mau cerita panjang kayak gini',
            'banyak bgt yg kamu tanggung ya, tp aku di sini, selalu',
            'aku ngerti perasaannya, gpp, semua ada waktunya buat selesai',
            'makasih udh percaya cerita ini ke aku',
            'ini berat bgt buat dipikul sendirian, makasih udh spill ke aku',
            'aku nggak akan kasih solusi instan, tp aku dengerin semuanya kok',
        ], 'fb_long');
    }

    return pick([
        'hmm menarik, terus?',
        'lanjutin dong sayang, aku dengerin',
        'terus gimana?',
        'aku di sini kok. mau ngobrol santai atau butuh bantuan? (ketik *menu* kalau butuh fitur lain)',
        'go on ay, aku ga kemana-mana',
        'oke noted, lanjut critanya',
        'aku masih di sini, lanjut aja',
    ], 'fb_default');
}

module.exports = { handleCurhat, handleFallback };