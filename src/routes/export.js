const express = require('express');
const path = require('path');
const fs = require('fs');
const { db } = require('../database');
const { authenticate } = require('../middlewares/auth');
const { canExportPdf, canExportExcel } = require('../middlewares/permissions');
const loggers = require('../utils/logger');
// Menggunakan command lama yang akan kita sesuaikan
const { exportFinanceExcel, exportFinancePDF } = require('../commands/export');

const router = express.Router();

router.get('/excel', authenticate, canExportExcel, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        let query = "SELECT e.*, u.push_name as creator_name, u.whatsapp_number FROM expenses e LEFT JOIN users u ON e.created_by = u.id WHERE e.deleted_at IS NULL";
        const params = [];

        if (start_date && end_date) {
            query += " AND date(e.created_at) BETWEEN ? AND ?";
            params.push(start_date, end_date);
        }

        query += " ORDER BY e.created_at ASC";
        
        const expenses = db.prepare(query).all(...params);
        
        // Transform ke format lama agar compatible dengan exportFinanceExcel
        const formattedData = {
            pengeluaran: expenses.map(e => ({
                waktu: new Date(e.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }).replace(/\./g, ':'),
                nominal: e.amount,
                keterangan: e.description,
                kategori: e.category,
                creator_name: e.creator_name
            }))
        };

        const result = await exportFinanceExcel(formattedData);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Tidak ada data pengeluaran', error_code: 'EXP_404' });
        }

        loggers.export.info(`Export Excel dilakukan oleh ${req.user.email} dari ${req.ip}`);
        db.prepare("INSERT INTO audit_logs (admin_id, action, module, description, ip_address) VALUES (?, ?, ?, ?, ?)").run(
            req.user.id, 'Export Excel', 'Export', 'Mengunduh laporan pengeluaran format Excel', req.ip
        );

        res.download(result.filePath, result.fileName, (err) => {
            if (!err) fs.unlinkSync(result.filePath);
        });

    } catch (err) {
        loggers.error.error('Export Excel error:', err);
        res.status(500).json({ success: false, message: 'Gagal melakukan export Excel', error_code: 'SYS_500' });
    }
});

router.get('/pdf', authenticate, canExportPdf, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        let query = "SELECT e.*, u.push_name as creator_name, u.whatsapp_number FROM expenses e LEFT JOIN users u ON e.created_by = u.id WHERE e.deleted_at IS NULL";
        const params = [];

        if (start_date && end_date) {
            query += " AND date(e.created_at) BETWEEN ? AND ?";
            params.push(start_date, end_date);
        }

        query += " ORDER BY e.created_at ASC";
        
        const expenses = db.prepare(query).all(...params);
        
        const formattedData = {
            pengeluaran: expenses.map(e => ({
                waktu: new Date(e.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }).replace(/\./g, ':'),
                nominal: e.amount,
                keterangan: e.description,
                kategori: e.category,
                creator_name: e.creator_name
            }))
        };

        const result = await exportFinancePDF(formattedData);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Tidak ada data pengeluaran', error_code: 'EXP_404' });
        }

        loggers.export.info(`Export PDF dilakukan oleh ${req.user.email} dari ${req.ip}`);
        db.prepare("INSERT INTO audit_logs (admin_id, action, module, description, ip_address) VALUES (?, ?, ?, ?, ?)").run(
            req.user.id, 'Export PDF', 'Export', 'Mengunduh laporan pengeluaran format PDF', req.ip
        );

        res.download(result.filePath, result.fileName, (err) => {
            if (!err) fs.unlinkSync(result.filePath);
        });

    } catch (err) {
        loggers.error.error('Export PDF error:', err);
        res.status(500).json({ success: false, message: 'Gagal melakukan export PDF', error_code: 'SYS_500' });
    }
});

module.exports = router;
