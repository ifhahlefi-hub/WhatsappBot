/**
 * Export commands — generate Excel and PDF files for todo and finance data.
 * Clean, minimal, black-and-white accounting style.
 */

const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { db } = require('../database');

const EXPORT_DIR = path.join(__dirname, '..', '..', 'exports');

if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

// =============================================
// SHARED HELPERS
// =============================================

const FONT = {
    title: { name: 'Calibri', size: 14, bold: true },
    subtitle: { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF666666' } },
    header: { name: 'Calibri', size: 10, bold: true },
    body: { name: 'Calibri', size: 10 },
    subtotal: { name: 'Calibri', size: 10, bold: true, italic: true },
    total: { name: 'Calibri', size: 11, bold: true },
    footer: { name: 'Calibri', size: 8, italic: true, color: { argb: 'FF999999' } },
    summaryLabel: { name: 'Calibri', size: 10 },
    summaryValue: { name: 'Calibri', size: 10, bold: true },
};

const THIN = { style: 'thin', color: { argb: 'FF000000' } };
const MEDIUM = { style: 'medium', color: { argb: 'FF000000' } };
const DOUBLE = { style: 'double', color: { argb: 'FF000000' } };
const NONE = { style: 'none' };

const ACCT_FMT = '_(\"Rp\"* #,##0_)';

function getTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function getExportDate() {
    return new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        timeZone: 'Asia/Jakarta',
    });
}

function getExportTime() {
    return new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', hour12: false,
    });
}

function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(num);
}

/** Apply border to all cells in a row */
function borderRow(row, colCount, top, bottom) {
    for (let i = 1; i <= colCount; i++) {
        row.getCell(i).border = {
            top: top || THIN,
            bottom: bottom || THIN,
            left: THIN,
            right: THIN,
        };
    }
}

// =============================================
// GROUP EXPENSES BY DATE
// =============================================

function groupByDate(pengeluaran) {
    const byDate = {};
    pengeluaran.forEach(item => {
        // Fallback for created_at formatting
        let dateObj = new Date(item.created_at);
        if (isNaN(dateObj.getTime())) dateObj = new Date();
        
        // Format to YYYY-MM-DD
        const dateStr = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
        const displayDate = dateStr; // e.g. 2026-06-17

        if (!byDate[displayDate]) byDate[displayDate] = [];
        byDate[displayDate].push(item);
    });
    return byDate;
}

function extractTime(createdAt) {
    let dateObj = new Date(createdAt);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
}

// =============================================
// TODO EXPORT (Excel)
// =============================================

async function exportTodoExcel(userData) {
    return null; // Todo features were disabled during SQLite migration

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WhatsApp Assistant Bot';
    const sheet = workbook.addWorksheet('Todo List');

    sheet.getColumn(1).width = 8;
    sheet.getColumn(2).width = 48;
    sheet.getColumn(3).width = 18;
    const COL = 3;

    // Title
    sheet.mergeCells('A1:C1');
    const title = sheet.getCell('A1');
    title.value = 'DAFTAR TUGAS';
    title.font = FONT.title;
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // Subtitle
    sheet.mergeCells('A2:C2');
    const sub = sheet.getCell('A2');
    sub.value = `Diekspor: ${getExportDate()}, ${getExportTime()} WIB`;
    sub.font = FONT.subtitle;
    sub.alignment = { horizontal: 'center' };
    sheet.getRow(2).height = 18;

    sheet.getRow(3).height = 6;

    // Header
    const hdr = sheet.addRow(['No', 'Tugas', 'Status']);
    hdr.font = FONT.header;
    hdr.height = 26;
    for (let i = 1; i <= COL; i++) {
        hdr.getCell(i).alignment = { horizontal: 'center', vertical: 'middle' };
        hdr.getCell(i).border = { top: MEDIUM, bottom: MEDIUM, left: THIN, right: THIN };
    }

    // Data
    db.todo.forEach((task, idx) => {
        const row = sheet.addRow([idx + 1, task, 'Belum Selesai']);
        row.font = FONT.body;
        row.height = 22;
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        borderRow(row, COL, THIN, THIN);
    });

    // Total
    const totalRow = sheet.addRow(['', `Total: ${db.todo.length} tugas`, '']);
    totalRow.font = FONT.total;
    totalRow.height = 24;
    for (let i = 1; i <= COL; i++) {
        totalRow.getCell(i).border = { top: MEDIUM, bottom: DOUBLE, left: THIN, right: THIN };
    }

    // Footer
    const sp = sheet.addRow([]); sp.height = 12;
    sheet.mergeCells(`A${sheet.rowCount + 1}:C${sheet.rowCount + 1}`);
    const fc = sheet.getCell(`A${sheet.rowCount}`);
    fc.value = `Dibuat oleh WhatsApp Assistant by Irza Fhahlefi — ${getExportDate()}, ${getExportTime()} WIB`;
    fc.font = FONT.footer;
    fc.alignment = { horizontal: 'center' };

    const fileName = `Todo_List_${getTimestamp()}.xlsx`;
    const filePath = path.join(EXPORT_DIR, fileName);
    await workbook.xlsx.writeFile(filePath);
    return { filePath, fileName };
}

// =============================================
// FINANCE EXPORT — EXCEL
// =============================================

async function exportFinanceExcel(userData) {
    const expenses = db.prepare("SELECT * FROM expenses WHERE created_by = ? AND deleted_at IS NULL").all(userData.id);
    if (!expenses || expenses.length === 0) return null;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WhatsApp Assistant Bot';
    const sheet = workbook.addWorksheet('Laporan Keuangan', {
        pageSetup: { paperSize: 9, orientation: 'portrait' },
    });

    sheet.getColumn(1).width = 18;
    sheet.getColumn(2).width = 10;
    sheet.getColumn(3).width = 6;
    sheet.getColumn(4).width = 36;
    sheet.getColumn(5).width = 22;
    const COL = 5;

    // Title
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'LAPORAN PENGELUARAN';
    titleCell.font = { ...FONT.title, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 36;

    // Period
    sheet.mergeCells('A2:E2');
    const periodCell = sheet.getCell('A2');
    const dates = expenses.map(e => {
        let d = new Date(e.created_at);
        return isNaN(d.getTime()) ? null : d.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
    }).filter(Boolean);
    const uniqueDates = [...new Set(dates)].sort();
    let periodText = '';
    if (uniqueDates.length === 1) periodText = `Periode: ${uniqueDates[0]}`;
    else if (uniqueDates.length > 1) periodText = `Periode: ${uniqueDates[0]} s/d ${uniqueDates[uniqueDates.length - 1]}`;
    periodCell.value = periodText;
    periodCell.font = FONT.subtitle;
    periodCell.alignment = { horizontal: 'center' };
    sheet.getRow(2).height = 18;

    // Export time
    sheet.mergeCells('A3:E3');
    const tsCell = sheet.getCell('A3');
    tsCell.value = `Diekspor: ${getExportDate()}, ${getExportTime()} WIB`;
    tsCell.font = { ...FONT.subtitle, size: 8 };
    tsCell.alignment = { horizontal: 'center' };
    sheet.getRow(3).height = 16;

    sheet.getRow(4).height = 8;

    // Table Header
    const headerRow = sheet.addRow(['Tanggal', 'Jam', 'No', 'Keterangan', 'Jumlah (Rp)']);
    headerRow.font = FONT.header;
    headerRow.height = 28;
    for (let i = 1; i <= COL; i++) {
        headerRow.getCell(i).alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.getCell(i).border = { top: MEDIUM, bottom: MEDIUM, left: THIN, right: THIN };
    }

    // Data
    const byDate = groupByDate(expenses);
    const dateKeys = Object.keys(byDate).sort();
    const hasMultipleDates = dateKeys.length > 1;
    let globalIndex = 0;

    dateKeys.forEach((date) => {
        const entries = byDate[date];
        let dateSubtotal = 0;

        entries.forEach((item, idx) => {
            globalIndex++;
            dateSubtotal += item.nominal;

            const row = sheet.addRow([
                idx === 0 ? date : '',
                extractTime(item.created_at),
                globalIndex,
                item.description,
                item.amount,
            ]);

            row.font = FONT.body;
            row.height = 22;
            row.getCell(1).alignment = { vertical: 'middle' };
            row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
            row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
            row.getCell(4).alignment = { vertical: 'middle', wrapText: true };
            row.getCell(5).numFmt = ACCT_FMT;
            row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
            borderRow(row, COL, THIN, THIN);
        });

        // Subtotal per date
        if (hasMultipleDates) {
            const subRow = sheet.addRow(['', '', '', `Subtotal ${date}`, dateSubtotal]);
            subRow.font = FONT.subtotal;
            subRow.height = 24;
            subRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
            subRow.getCell(5).numFmt = ACCT_FMT;
            subRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
            for (let i = 1; i <= COL; i++) {
                subRow.getCell(i).border = { top: THIN, bottom: THIN, left: THIN, right: THIN };
            }
        }
    });

    // Grand Total
    const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRow = sheet.addRow(['', '', '', 'TOTAL PENGELUARAN', grandTotal]);
    totalRow.font = FONT.total;
    totalRow.height = 28;
    totalRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    totalRow.getCell(5).numFmt = ACCT_FMT;
    totalRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    for (let i = 1; i <= COL; i++) {
        totalRow.getCell(i).border = { top: MEDIUM, bottom: DOUBLE, left: THIN, right: THIN };
    }

    // Summary
    const sp1 = sheet.addRow([]); sp1.height = 14;

    const summaryHdr = sheet.addRow(['', '', '', 'RINGKASAN', '']);
    summaryHdr.font = FONT.header;
    summaryHdr.height = 24;
    for (let i = 4; i <= 5; i++) {
        summaryHdr.getCell(i).border = { top: MEDIUM, bottom: MEDIUM, left: THIN, right: THIN };
        summaryHdr.getCell(i).alignment = { vertical: 'middle' };
    }

    const summaryItems = [
        ['Jumlah Transaksi', expenses.length],
        ['Total Pengeluaran', grandTotal],
        ['Rata-rata / Transaksi', Math.round(grandTotal / expenses.length)],
        ['Jumlah Hari', dateKeys.length],
    ];

    summaryItems.forEach((data, idx) => {
        const row = sheet.addRow(['', '', '', data[0], data[1]]);
        row.height = 20;
        row.getCell(4).font = FONT.summaryLabel;
        row.getCell(4).alignment = { vertical: 'middle' };
        row.getCell(5).font = FONT.summaryValue;
        row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
        if (idx === 1 || idx === 2) row.getCell(5).numFmt = ACCT_FMT;
        for (let i = 4; i <= 5; i++) {
            row.getCell(i).border = { top: THIN, bottom: THIN, left: THIN, right: THIN };
        }
    });

    // Bottom border on last summary
    const lastRow = sheet.getRow(sheet.rowCount);
    for (let i = 4; i <= 5; i++) {
        lastRow.getCell(i).border = { top: THIN, bottom: MEDIUM, left: THIN, right: THIN };
    }

    // Footer
    const sp2 = sheet.addRow([]); sp2.height = 16;
    sheet.mergeCells(`A${sheet.rowCount + 1}:E${sheet.rowCount + 1}`);
    const footerCell = sheet.getCell(`A${sheet.rowCount}`);
    footerCell.value = `Laporan dibuat otomatis oleh WhatsApp Assistant by Irza Fhahlefi — ${getExportDate()}, ${getExportTime()} WIB`;
    footerCell.font = FONT.footer;
    footerCell.alignment = { horizontal: 'center' };

    const fileName = `Laporan_Keuangan_${getTimestamp()}.xlsx`;
    const filePath = path.join(EXPORT_DIR, fileName);
    await workbook.xlsx.writeFile(filePath);
    return { filePath, fileName };
}

// =============================================
// FINANCE EXPORT — PDF
// =============================================

async function exportFinancePDF(userData) {
    const expenses = db.prepare("SELECT * FROM expenses WHERE created_by = ? AND deleted_at IS NULL").all(userData.id);
    if (!expenses || expenses.length === 0) return null;

    return new Promise((resolve, reject) => {
        const fileName = `Laporan_Keuangan_${getTimestamp()}.pdf`;
        const filePath = path.join(EXPORT_DIR, fileName);
        const stream = fs.createWriteStream(filePath);

        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 40, bottom: 40, left: 40, right: 40 },
        });

        doc.pipe(stream);

        const pageWidth = doc.page.width - 80;
        const black = '#000000';
        const gray = '#666666';
        const lightGray = '#999999';

        // Column definitions
        const colDefs = [
            { label: 'Tanggal', width: pageWidth * 0.18 },
            { label: 'Jam', width: pageWidth * 0.10 },
            { label: 'No', width: pageWidth * 0.06 },
            { label: 'Keterangan', width: pageWidth * 0.40 },
            { label: 'Jumlah (Rp)', width: pageWidth * 0.26 },
        ];

        const tableLeft = 40;
        const tableWidth = colDefs.reduce((s, c) => s + c.width, 0);

        function drawLine(x, y, w, weight) {
            doc.save().moveTo(x, y).lineTo(x + w, y)
                .strokeColor(black).lineWidth(weight || 0.5).stroke().restore();
        }

        function drawCellBorder(x, y, w, h) {
            doc.save().rect(x, y, w, h)
                .strokeColor(black).lineWidth(0.5).stroke().restore();
        }

        function drawTableRow(y, values, options = {}) {
            const {
                fontColor = black,
                fontSize = 9,
                bold = false,
                alignments = ['left', 'center', 'center', 'left', 'right'],
                height = 22,
                topBorder = 0.5,
                bottomBorder = 0.5,
            } = options;

            // Draw cell borders
            let x = tableLeft;
            colDefs.forEach((col, i) => {
                drawCellBorder(x, y, col.width, height);

                const padding = 6;
                const textAlign = alignments[i];
                const textY = y + (height - fontSize) / 2;

                doc.save();
                doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
                    .fontSize(fontSize)
                    .fillColor(fontColor);

                doc.text(String(values[i] || ''), x + padding, textY, {
                    width: col.width - padding * 2,
                    align: textAlign,
                });
                doc.restore();

                x += col.width;
            });

            // Thicker borders if specified
            if (topBorder > 0.5) {
                drawLine(tableLeft, y, tableWidth, topBorder);
            }
            if (bottomBorder > 0.5) {
                drawLine(tableLeft, y + height, tableWidth, bottomBorder);
            }

            return y + height;
        }

        // ── TITLE ──

        doc.font('Helvetica-Bold').fontSize(16).fillColor(black);
        doc.text('LAPORAN PENGELUARAN', tableLeft, 40, {
            width: tableWidth, align: 'center',
        });

        // Period
        const dates = expenses.map(e => {
            let d = new Date(e.created_at);
            return isNaN(d.getTime()) ? null : d.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
        }).filter(Boolean);
        const uniqueDates = [...new Set(dates)].sort();
        let periodText = '';
        if (uniqueDates.length === 1) periodText = `Periode: ${uniqueDates[0]}`;
        else if (uniqueDates.length > 1) periodText = `Periode: ${uniqueDates[0]} s/d ${uniqueDates[uniqueDates.length - 1]}`;

        doc.font('Helvetica').fontSize(9).fillColor(gray);
        doc.text(periodText, tableLeft, 62, { width: tableWidth, align: 'center' });

        doc.font('Helvetica').fontSize(8).fillColor(lightGray);
        doc.text(`Diekspor: ${getExportDate()}, ${getExportTime()} WIB`, tableLeft, 76, {
            width: tableWidth, align: 'center',
        });

        // ── TABLE HEADER ──

        let currentY = 98;

        currentY = drawTableRow(currentY, colDefs.map(c => c.label), {
            bold: true,
            fontSize: 9,
            height: 26,
            alignments: ['center', 'center', 'center', 'center', 'center'],
            topBorder: 1.5,
            bottomBorder: 1.5,
        });

        // ── DATA ROWS ──

        const byDate = groupByDate(expenses);
        const dateKeys = Object.keys(byDate).sort();
        const hasMultipleDates = dateKeys.length > 1;
        let globalIndex = 0;
        const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

        dateKeys.forEach((date) => {
            const entries = byDate[date];
            let dateSubtotal = 0;

            entries.forEach((item, idx) => {
                globalIndex++;
                dateSubtotal += item.amount;

                if (currentY > doc.page.height - 100) {
                    doc.addPage();
                    currentY = 40;
                }

                currentY = drawTableRow(currentY, [
                    idx === 0 ? date : '',
                    extractTime(item.created_at),
                    globalIndex,
                    item.description,
                    formatRupiah(item.amount),
                ], { height: 22 });
            });

            if (hasMultipleDates) {
                if (currentY > doc.page.height - 100) {
                    doc.addPage();
                    currentY = 40;
                }

                currentY = drawTableRow(currentY, [
                    '', '', '', `Subtotal ${date}`, formatRupiah(dateSubtotal),
                ], {
                    bold: true,
                    fontSize: 9,
                    height: 24,
                    alignments: ['left', 'center', 'center', 'right', 'right'],
                });
            }
        });

        // ── GRAND TOTAL ──

        if (currentY > doc.page.height - 120) {
            doc.addPage();
            currentY = 40;
        }

        currentY = drawTableRow(currentY, [
            '', '', '', 'TOTAL PENGELUARAN', formatRupiah(grandTotal),
        ], {
            bold: true,
            fontSize: 10,
            height: 28,
            alignments: ['left', 'center', 'center', 'right', 'right'],
            topBorder: 1.5,
            bottomBorder: 0.5,
        });

        // Double bottom line
        drawLine(tableLeft, currentY, tableWidth, 1.5);

        // ── SUMMARY ──

        currentY += 16;

        if (currentY > doc.page.height - 140) {
            doc.addPage();
            currentY = 40;
        }

        const summaryLeft = tableLeft + colDefs[0].width + colDefs[1].width + colDefs[2].width;
        const summaryCol1 = colDefs[3].width;
        const summaryCol2 = colDefs[4].width;
        const summaryWidth = summaryCol1 + summaryCol2;

        // Summary header
        drawCellBorder(summaryLeft, currentY, summaryWidth, 24);
        drawLine(summaryLeft, currentY, summaryWidth, 1.5);
        drawLine(summaryLeft, currentY + 24, summaryWidth, 1.5);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(black);
        doc.text('RINGKASAN', summaryLeft + 6, currentY + 7, { width: summaryWidth - 12 });
        currentY += 24;

        const summaryItems = [
            ['Jumlah Transaksi', String(expenses.length)],
            ['Total Pengeluaran', formatRupiah(grandTotal)],
            ['Rata-rata / Transaksi', formatRupiah(Math.round(grandTotal / expenses.length))],
            ['Jumlah Hari', String(dateKeys.length)],
        ];

        summaryItems.forEach((item) => {
            const rowH = 20;
            drawCellBorder(summaryLeft, currentY, summaryCol1, rowH);
            drawCellBorder(summaryLeft + summaryCol1, currentY, summaryCol2, rowH);

            doc.font('Helvetica').fontSize(9).fillColor(black);
            doc.text(item[0], summaryLeft + 6, currentY + 5, { width: summaryCol1 - 12 });

            doc.font('Helvetica-Bold').fontSize(9).fillColor(black);
            doc.text(item[1], summaryLeft + summaryCol1 + 6, currentY + 5, {
                width: summaryCol2 - 12, align: 'right',
            });

            currentY += rowH;
        });

        drawLine(summaryLeft, currentY, summaryWidth, 1.5);

        // ── FOOTER ──

        currentY += 20;
        if (currentY > doc.page.height - 40) {
            doc.addPage();
            currentY = 40;
        }

        doc.font('Helvetica').fontSize(7).fillColor(lightGray);
        doc.text(
            `Laporan dibuat otomatis oleh WhatsApp Assistant by Irza Fhahlefi — ${getExportDate()}, ${getExportTime()} WIB`,
            tableLeft, currentY, { width: tableWidth, align: 'center' }
        );

        doc.end();
        stream.on('finish', () => resolve({ filePath, fileName }));
        stream.on('error', reject);
    });
}

// =============================================
// CLEANUP
// =============================================

function cleanupExports() {
    try {
        if (!fs.existsSync(EXPORT_DIR)) return;
        const files = fs.readdirSync(EXPORT_DIR);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        files.forEach(file => {
            const fp = path.join(EXPORT_DIR, file);
            const stat = fs.statSync(fp);
            if (stat.mtimeMs < oneHourAgo) fs.unlinkSync(fp);
        });
    } catch (err) {
        console.error('[EXPORT] Gagal membersihkan file export lama:', err.message);
    }
}

module.exports = { exportTodoExcel, exportFinanceExcel, exportFinancePDF, cleanupExports };
