const { db } = require('../database');
const { getIO } = require('../server');

// Helpers
function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(num);
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getTodayTotal(userId) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const row = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE created_by = ? AND date(created_at) = ? AND deleted_at IS NULL").get(userId, todayStr);
    return row.total || 0;
}

function getTodayExpenses(userId) {
    const todayStr = new Date().toISOString().slice(0, 10);
    return db.prepare("SELECT * FROM expenses WHERE created_by = ? AND date(created_at) = ? AND deleted_at IS NULL").all(userId, todayStr);
}

function getAllExpenses(userId) {
    return db.prepare("SELECT * FROM expenses WHERE created_by = ? AND deleted_at IS NULL").all(userId);
}

const MSG_CATAT_OK = ['Oke sayang, udah aku catet ya', 'Siap, udah tercatat!'];
const MSG_CATAT_WARN = ['Hmm sayang, pengeluaran hari ini udah lumayan banyak lho...'];
const MSG_CATAT_OVER = ['Sayang... aku udah catet, tapi pengeluaran kamu hari ini udah *lewat batas* lho.'];
const MSG_TOTAL_GOOD = ['Ini rekap pengeluaranmu sayang~ kamu hebat ngatur uangnya!'];
const MSG_TOTAL_WARN = ['Ini rekapnya sayang... pengeluaran hari ini udah lumayan banyak, hati-hati ya'];
const MSG_TOTAL_OVER = ['Sayang... ini rekapnya. Hari ini udah *melebihi batas*. Besok kita hemat bareng ya?'];
const MSG_EMPTY = ['Belum ada pengeluaran yang dicatat sayang~'];
const MSG_HAPUS = ['Udah aku hapus ya sayang~'];
const MSG_EDIT = ['Udah aku perbaiki ya sayang~'];

// Dummy for now until limit is stored
function getSpendingStatus(userId) { return 'ok'; }
function buildSpendingMeter(userId) { return ''; }

function handleBatas(userData, args) {
    return 'Maaf sayang, fitur batas harian sedang dalam maintenance ya~';
}

function handleCatat(userData, args) {
    if (!args || args.trim().length === 0) return 'Sayang, formatnya gini ya~\nContoh: *catat 25000 makan siang*';
    const parts = args.trim().split(/\s+/);
    const nominal = parseInt(parts[0], 10);
    const keterangan = parts.slice(1).join(' ').trim();
    if (isNaN(nominal) || nominal <= 0) return 'Hmm, nominalnya harus angka positif ya sayang~\nContoh: *catat 25000 makan siang*';
    if (!keterangan) return 'Keterangannya jangan kosong dong sayang~\nContoh: *catat 25000 makan siang*';

    db.prepare("INSERT INTO expenses (category, description, amount, created_by) VALUES ('Umum', ?, ?, ?)").run(keterangan, nominal, userData.id);
    const io = getIO(); if(io) io.emit('expense_update');

    return `${pick(MSG_CATAT_OK)}\n\n*${keterangan}*\n${formatRupiah(nominal)}\n${new Date().toLocaleString('id-ID')}`;
}

function handleTotal(userData) {
    const expenses = getAllExpenses(userData.id);
    if (expenses.length === 0) return pick(MSG_EMPTY);

    const todayExps = getTodayExpenses(userData.id);
    const totalAll = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalToday = todayExps.reduce((sum, item) => sum + item.amount, 0);

    let response = `${pick(MSG_TOTAL_GOOD)}\n\n*Rekap Pengeluaran*\n----------------------------\n\n`;
    if (todayExps.length > 0) {
        response += `*Hari Ini:*\n`;
        todayExps.forEach((item, i) => { response += `  ${i + 1}. ${item.description} — ${formatRupiah(item.amount)}\n`; });
        response += `\n*Total Hari Ini:* ${formatRupiah(totalToday)}\n`;
    } else {
        response += `Belum ada pengeluaran hari ini~\n`;
    }
    response += `\n----------------------------\nTotal Keseluruhan : ${formatRupiah(totalAll)}\nJumlah Transaksi  : ${expenses.length}\n\n_Ketik *hapus [no]* / *edit [no]* / *export keuangan*_`;
    return response;
}

function handleHapusPengeluaran(userData, indexStr) {
    const expenses = getAllExpenses(userData.id);
    if (expenses.length === 0) return pick(MSG_EMPTY);
    const index = parseInt(indexStr.trim(), 10);
    if (isNaN(index)) return 'Hmm, nomornya harus angka ya sayang~\nContoh: *hapus 1*';
    if (index < 1 || index > expenses.length) return `Nomor ${index} ga ada sayang~ yang tersedia: 1 - ${expenses.length}`;
    
    const target = expenses[index - 1];
    db.prepare("UPDATE expenses SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?").run(target.id);
    const io = getIO(); if(io) io.emit('expense_update');
    
    return `${pick(MSG_HAPUS)}\n\n*${target.description}*\n${formatRupiah(target.amount)}\n\n_Sisa transaksi: ${expenses.length - 1}_`;
}

function handleEditPengeluaran(userData, args) {
    return 'Maaf sayang, fitur edit sedang diupgrade ya~';
}

function handleResetKeuangan(userData) {
    const count = db.prepare("UPDATE expenses SET deleted_at = CURRENT_TIMESTAMP WHERE created_by = ? AND deleted_at IS NULL").run(userData.id).changes;
    const io = getIO(); if(io) io.emit('expense_update');
    return count === 0 ? 'Ga ada data yang perlu direset kok sayang~' : `*Data Keuangan Direset*\n\n${count} transaksi udah dihapus ya sayang~\nSekarang bersih, kita mulai dari awal lagi ya!`;
}

module.exports = { handleCatat, handleTotal, handleHapusPengeluaran, handleEditPengeluaran, handleResetKeuangan, handleBatas };
