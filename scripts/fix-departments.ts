// scripts/fix-departments.ts
//
// One-time cleanup: your database may still have data from earlier department
// lists (16-department or 14-department versions). This script:
//   1. Deletes admin accounts whose department no longer exists
//   2. Rebuilds every student's ClearanceRequest.clearances array to match
//      exactly the current 8 departments — preserving any existing status/
//      documents for departments that still exist, dropping the rest
//
// Usage:
//   npx tsx scripts/fix-departments.ts

import 'dotenv/config';
import mongoose from 'mongoose';

const CURRENT_DEPARTMENTS = [
  'dean', 'hod', 'exams_records', 'bursary',
  'library', 'medical', 'alumni', 'senate',
] as const;

const UserSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');

const ClearanceRequestSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const ClearanceRequest =
  mongoose.models.ClearanceRequest ||
  mongoose.model('ClearanceRequest', ClearanceRequestSchema, 'clearancerequests');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('✗ MONGODB_URI is not set.');
    process.exit(1);
  }

  console.log('→ Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log('✓ Connected.\n');

  // ── 1. Remove admin accounts in stale departments ────────────────────────
  const staleAdmins = await User.find({
    role: 'admin',
    department: { $nin: CURRENT_DEPARTMENTS },
  }).lean();

  if (staleAdmins.length > 0) {
    console.log(`→ Found ${staleAdmins.length} admin(s) in departments that no longer exist:`);
    for (const a of staleAdmins as any[]) {
      console.log(`    - ${a.name} (${a.department}) — ${a.email}`);
    }
    await User.deleteMany({ role: 'admin', department: { $nin: CURRENT_DEPARTMENTS } });
    console.log(`✓ Removed ${staleAdmins.length} stale admin account(s).\n`);
  } else {
    console.log('• No stale admin accounts found.\n');
  }

  // ── 2. Rebuild every ClearanceRequest's department list ─────────────────
  const requests = await ClearanceRequest.find({});
  console.log(`→ Checking ${requests.length} clearance request(s)…\n`);

  let fixed = 0;

  for (const reqDoc of requests as any[]) {
    const existing: any[] = reqDoc.clearances ?? [];
    const existingByDept = new Map(existing.map((c) => [c.department, c]));

    const rebuilt = CURRENT_DEPARTMENTS.map((dept) => {
      const found = existingByDept.get(dept);
      return (
        found ?? {
          department: dept,
          status: 'not_submitted',
          documents: [],
        }
      );
    });

    const droppedCount = existing.length - existing.filter((c) => CURRENT_DEPARTMENTS.includes(c.department)).length;

    reqDoc.clearances = rebuilt;
    await reqDoc.save();
    fixed++;

    if (droppedCount > 0) {
      console.log(`  ✓ Request ${reqDoc._id} — dropped ${droppedCount} stale department(s), now has ${rebuilt.length}`);
    }
  }

  console.log(`\n✓ ${fixed} clearance request(s) rebuilt to match current 8 departments.`);

  await mongoose.disconnect();
  console.log('✓ Done. Disconnected from MongoDB.');
}

main().catch((err) => {
  console.error('✗ Cleanup failed:', err);
  process.exit(1);
});
