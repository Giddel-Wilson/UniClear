// scripts/seed.ts
//
// Creates the Graduate Programme Administrator account (top-level admin manager)
// and, optionally, a starter set of department admins covering every clearance
// checkpoint a graduating student needs signed off.
//
// Usage:
//   npx tsx scripts/seed.ts
//
// Requires MONGODB_URI in your .env file. Reads credentials from env vars so
// nothing sensitive is hardcoded — see the SEED_* variables below.

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ── Inline schema (kept independent of SvelteKit's $lib aliasing so this
//    script can run standalone with plain ts-node/tsx, no Vite required) ──
const DEPARTMENT_VALUES = [
  'dean', 'hod', 'exams_records', 'bursary',
  'library', 'medical', 'alumni', 'senate',
] as const;

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String, required: true, unique: true,
      lowercase: true, trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'admin', 'graduate_admin', 'superadmin'],
      default: 'student',
    },
    department: { type: String, enum: DEPARTMENT_VALUES },
    matricNumber: { type: String, trim: true, sparse: true },
    faculty: { type: String, trim: true },
    programme: { type: String, trim: true },
    graduationYear: { type: Number },
    adminNote: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// ── Configuration — override via env vars, falls back to sane defaults ────
const SEED_GRAD_ADMIN_NAME     = process.env.SEED_GRAD_ADMIN_NAME     ?? 'Graduate Programme Administrator';
const SEED_GRAD_ADMIN_EMAIL    = process.env.SEED_GRAD_ADMIN_EMAIL    ?? 'gradadmin@university.edu.ng';
const SEED_GRAD_ADMIN_PASSWORD = process.env.SEED_GRAD_ADMIN_PASSWORD ?? 'ChangeMe123!Secure';

// Set to "false" to skip creating the starter department admins
const SEED_DEPARTMENT_ADMINS = process.env.SEED_DEPARTMENT_ADMINS !== 'false';
const SEED_DEFAULT_PASSWORD  = process.env.SEED_DEFAULT_ADMIN_PASSWORD ?? 'TempPass123!';

interface SeedAdmin {
  name: string;
  email: string;
  department: (typeof DEPARTMENT_VALUES)[number];
  note: string;
}

// One starter admin per mandatory clearance checkpoint
const STARTER_ADMINS: SeedAdmin[] = [
  { name: 'Dean, Faculty Office',    email: 'dean@university.edu.ng',          department: 'dean',          note: 'Academic sign-off — faculty level' },
  { name: 'Head of Department',      email: 'hod@university.edu.ng',           department: 'hod',           note: 'Academic sign-off — department level' },
  { name: 'Exams & Records Officer', email: 'examsrecords@university.edu.ng',  department: 'exams_records', note: 'Confirms results, transcripts, no outstanding carryovers' },
  { name: 'Bursary Officer',         email: 'bursary@university.edu.ng',       department: 'bursary',       note: 'Confirms no outstanding fees' },
  { name: 'University Librarian',    email: 'library@university.edu.ng',       department: 'library',       note: 'Confirms no overdue books / fines' },
  { name: 'Medical Centre Officer',  email: 'medical@university.edu.ng',       department: 'medical',       note: 'Confirms no outstanding medical bills' },
  { name: 'Alumni Relations Officer',email: 'alumni@university.edu.ng',        department: 'alumni',        note: 'Confirms alumni registration' },
  { name: 'Senate Registrar',        email: 'senate@university.edu.ng',        department: 'senate',        note: 'Final Senate/Academic Board clearance' },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('✗ MONGODB_URI is not set. Add it to your .env file before seeding.');
    process.exit(1);
  }

  console.log('→ Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log('✓ Connected.\n');

  // ── 1. Graduate Programme Administrator ─────────────────────────────────
  const existingGradAdmin = await User.findOne({ email: SEED_GRAD_ADMIN_EMAIL });

  if (existingGradAdmin) {
    console.log(`• Graduate Admin already exists (${SEED_GRAD_ADMIN_EMAIL}) — skipping.`);
  } else {
    const passwordHash = await bcrypt.hash(SEED_GRAD_ADMIN_PASSWORD, 12);
    await User.create({
      name: SEED_GRAD_ADMIN_NAME,
      email: SEED_GRAD_ADMIN_EMAIL,
      passwordHash,
      role: 'graduate_admin',
      adminNote: 'Top-level account — manages all department admins',
    });
    console.log('✓ Graduate Programme Administrator created:');
    console.log(`    email:    ${SEED_GRAD_ADMIN_EMAIL}`);
    console.log(`    password: ${SEED_GRAD_ADMIN_PASSWORD}`);
    console.log('    ⚠ Change this password immediately after first login.\n');
  }

  // ── 2. Starter department admins ────────────────────────────────────────
  if (SEED_DEPARTMENT_ADMINS) {
    console.log('→ Seeding starter department admins…\n');
    let created = 0;
    let skipped = 0;

    for (const admin of STARTER_ADMINS) {
      const existing = await User.findOne({ email: admin.email });
      if (existing) {
        skipped++;
        continue;
      }

      const passwordHash = await bcrypt.hash(SEED_DEFAULT_PASSWORD, 12);
      await User.create({
        name: admin.name,
        email: admin.email,
        passwordHash,
        role: 'admin',
        department: admin.department,
        adminNote: admin.note,
      });
      created++;
      console.log(`  ✓ ${admin.name.padEnd(28)} (${admin.department})  →  ${admin.email}`);
    }

    console.log(`\n  ${created} admin(s) created, ${skipped} already existed.`);
    if (created > 0) {
      console.log(`  Default password for all new admins: ${SEED_DEFAULT_PASSWORD}`);
      console.log('  ⚠ Each admin should change their password on first login.\n');
    }
  } else {
    console.log('• Skipping department admin seeding (SEED_DEPARTMENT_ADMINS=false).\n');
  }

  await mongoose.disconnect();
  console.log('✓ Done. Disconnected from MongoDB.');
}

main().catch((err) => {
  console.error('✗ Seed failed:', err);
  process.exit(1);
});
