// scripts/reset-admin-passwords.ts
//
// Resets the password for every admin, graduate_admin, and superadmin account
// to a fresh secure temporary password, then generates a PDF listing everyone's
// name, email, role, department, and new password.
//
// WHY RESET INSTEAD OF "RETRIEVE": passwords are stored as bcrypt hashes —
// a one-way transformation. Nobody, including someone with full database
// access, can recover the original plaintext password from a hash. The only
// way to give admins usable credentials again is to set new ones.
//
// Usage:
//   npx tsx scripts/reset-admin-passwords.ts
//
// Requires MONGODB_URI in your .env file.
//
// ⚠ SECURITY: the generated PDF contains plaintext passwords. Distribute it
// securely (e.g. hand-deliver, encrypted email), then delete the file. Never
// commit it to git or leave it in a shared folder.

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const UserSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');

const DEPARTMENT_LABELS: Record<string, string> = {
  dean: 'Dean of Faculty',
  hod: 'Head of Department',
  exams_records: 'Exams & Records (Registry)',
  bursary: 'Bursary',
  library: 'Library',
  medical: 'Medical Centre',
  alumni: 'Alumni Association',
  senate: 'Senate / Academic Board',
};

function generatePassword(): string {
  // 12 random bytes -> base64 -> strip non-alphanumerics -> take 12 chars
  // then append one digit and one symbol to guarantee complexity.
  const raw = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  const base = raw.slice(0, 10);
  const digit = crypto.randomInt(0, 10).toString();
  const symbols = '!@#$%&*';
  const symbol = symbols[crypto.randomInt(0, symbols.length)];
  return `${base}${digit}${symbol}`;
}

interface ResetRecord {
  name: string;
  email: string;
  role: string;
  department: string | null;
  newPassword: string;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('✗ MONGODB_URI is not set.');
    process.exit(1);
  }

  console.log('→ Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log('✓ Connected.\n');

  const admins = await User.find({
    role: { $in: ['admin', 'graduate_admin', 'superadmin'] },
  }).sort({ role: 1, department: 1, name: 1 });

  if (admins.length === 0) {
    console.log('• No admin accounts found. Nothing to reset.');
    await mongoose.disconnect();
    return;
  }

  console.log(`→ Resetting passwords for ${admins.length} account(s)…\n`);

  const records: ResetRecord[] = [];

  for (const admin of admins as any[]) {
    const newPassword = generatePassword();
    const passwordHash = await bcrypt.hash(newPassword, 12);

    admin.passwordHash = passwordHash;
    await admin.save();

    records.push({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      department: admin.department ?? null,
      newPassword,
    });

    console.log(`  ✓ ${admin.name.padEnd(28)} (${admin.role}) → ${admin.email}`);
  }

  console.log(`\n✓ ${records.length} password(s) reset.\n`);

  // ── Generate PDF ──────────────────────────────────────────────────────────
  const outputDir = path.resolve(process.cwd());
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputPath = path.join(outputDir, `admin-credentials-${timestamp}.pdf`);

  await generatePDF(records, outputPath);

  console.log(`✓ PDF generated: ${outputPath}`);
  console.log('\n⚠ SECURITY REMINDER:');
  console.log('  This file contains plaintext passwords. Distribute it securely');
  console.log('  and delete it once every admin has logged in and you have');
  console.log('  confirmed the handoff. Do not commit it to git.\n');

  await mongoose.disconnect();
  console.log('✓ Done. Disconnected from MongoDB.');
}

function generatePDF(records: ResetRecord[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('UniClear — Admin Credentials', { align: 'left' });
    doc.fontSize(9).font('Helvetica').fillColor('#666666').text(
      `Generated ${new Date().toLocaleString('en-NG', { dateStyle: 'long', timeStyle: 'short' })}`,
    );
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#b91c1c').text(
      'CONFIDENTIAL — Contains plaintext passwords. Distribute securely and delete after handoff.',
    );
    doc.moveDown(1.5);
    doc.fillColor('#000000');

    // Table setup
    const startX = doc.x;
    let y = doc.y;
    const colWidths = { name: 110, email: 155, role: 75, dept: 110, password: 90 };
    const rowHeight = 22;

    function drawRow(
      cells: string[],
      opts: { bold?: boolean; bg?: string } = {}
    ) {
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
      let x = startX;
      const widths = [colWidths.name, colWidths.email, colWidths.role, colWidths.dept, colWidths.password];

      if (opts.bg) {
        doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowHeight).fill(opts.bg);
        doc.fillColor('#000000');
      }

      doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5);
      cells.forEach((cell, i) => {
        doc.text(cell, x + 4, y + 6, { width: widths[i] - 8, ellipsis: true });
        x += widths[i];
      });
      y += rowHeight;
    }

    // Header row
    drawRow(['Name', 'Email', 'Role', 'Department', 'New Password'], { bold: true, bg: '#e5e7eb' });

    // Data rows
    records.forEach((r, i) => {
      drawRow(
        [
          r.name,
          r.email,
          r.role.replace('_', ' '),
          r.department ? (DEPARTMENT_LABELS[r.department] ?? r.department) : '—',
          r.newPassword,
        ],
        { bg: i % 2 === 0 ? '#f9fafb' : undefined }
      );
    });

    doc.moveDown(2);
    y += 20;
    doc.fontSize(8).fillColor('#666666').text(
      'Each admin should change their password after first login where possible.',
      startX,
      y
    );

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

main().catch((err) => {
  console.error('✗ Script failed:', err);
  process.exit(1);
});
