/**
 * General commands: halo, jam
 */

function getJamWIB() {
    const now = new Date();
    const wib = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    return wib.getHours();
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}


function handleHalo() {
    const jam = getJamWIB();

    if (jam >= 4 && jam < 11) {
        return pick([
            'pagi sayang. udh sarapan?',
            'morning ay! semoga harinya oke',
            'pagiii. jgn lupa sarapan ya',
            'hai! baru bangun?',
            'morning. minum air dulu ya sebelum ngapa-ngapain',
        ]);
    } else if (jam >= 11 && jam < 15) {
        return pick([
            'hei sayang, udh makan siang?',
            'hai ay! lagi sibuk?',
            'lagi istirahat atau masih nonstop nih',
            'hay, gimana harinya sejauh ini?',
            'hai sayang, jgn skip makan ya',
        ]);
    } else if (jam >= 15 && jam < 18) {
        return pick([
            'hei sayang, harinya gimana?',
            'hai ay! capek?',
            'sore nih. bentar lagi pulang?',
            'hay, cerita dong harinya',
            'hei, kamu baik-baik aja?',
        ]);
    } else {
        return pick([
            'hei sayang, jgn begadang bgt ya',
            'hai ay! udh makan malem?',
            'masih melek juga nih. gimana harinya?',
            'hei, cerita dong hari ini gimana',
            'malam sayang. istirahat yg bener ok',
            'hai ay, aku di sini kok kalau mau ngobrol',
        ]);
    }
}

/**
 * Handle "jam" command.
 */
function handleJam() {
    const now = new Date();

    const tanggal = now.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        timeZone: 'Asia/Jakarta',
    });

    const waktu = now.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'Asia/Jakarta', hour12: false,
    });

    return `sekarang ${tanggal}, ${waktu} WIB sayang`;
}

module.exports = { handleHalo, handleJam };
