// scripts/wipe-data.ts
//
// Destructive cleanup: deletes ALL clearance requests and ALL student
// accounts, while preserving admin, graduate_admin, and superadmin accounts
// untouched (including their current passwords).
//
// Use this to reset the system to a clean slate before a new academic
// session, while keeping department admins set up and ready to go.
//
// Usage:
//   npx tsx scripts/wipe-data.ts
//
// Safety: requires typing "WIPE" to confirm before anything is deleted.
// Run with --dry-run first to preview what would be deleted with no changes.
//
//   npx tsx scripts/wipe-data.ts --dry-run

import 'dotenv/config';
import mongoose from 'mongoose';
import readline from 'readline';

const UserSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');

const ClearanceRequestSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const ClearanceRequest =
  mongoose.models.ClearanceRequest ||
  mongoose.model('ClearanceRequest', ClearanceRequestSchema, 'clearancerequests');

function askConfirmation(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('✗ MONGODB_URI is not set.');
    process.exit(1);
  }

  console.log('→ Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log('✓ Connected.\n');

  const [studentCount, clearanceCount, adminCount] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    ClearanceRequest.countDocuments({}),
    User.countDocuments({ role: { $in: ['admin', 'graduate_admin', 'superadmin'] } }),
  ]);

  console.log('── Current data ──────────────────────────');
  console.log(`  Students to delete:            ${studentCount}`);
  console.log(`  Clearance requests to delete:  ${clearanceCount}`);
  console.log(`  Admin accounts to PRESERVE:    ${adminCount}`);
  console.log('───────────────────────────────────────────\n');

  if (studentCount === 0 && clearanceCount === 0) {
    console.log('• Nothing to wipe. System is already clean.');
    await mongoose.disconnect();
    return;
  }

  if (isDryRun) {
    console.log('→ Dry run only — no changes made. Remove --dry-run to actually wipe.');
    await mongoose.disconnect();
    return;
  }

  console.log('⚠ This will PERMANENTLY delete all student accounts and clearance data.');
  console.log('⚠ Admin accounts and their passwords will NOT be touched.\n');

  const answer = await askConfirmation('Type WIPE (all caps) to confirm, or anything else to cancel: ');

  if (answer !== 'WIPE') {
    console.log('\n✗ Cancelled. No changes made.');
    await mongoose.disconnect();
    return;
  }

  console.log('\n→ Wiping data…\n');

  const clearanceResult = await ClearanceRequest.deleteMany({});
  console.log(`  ✓ Deleted ${clearanceResult.deletedCount} clearance request(s).`);

  const studentResult = await User.deleteMany({ role: 'student' });
  console.log(`  ✓ Deleted ${studentResult.deletedCount} student account(s).`);

  const remainingAdmins = await User.countDocuments({
    role: { $in: ['admin', 'graduate_admin', 'superadmin'] },
  });
  console.log(`  ✓ Preserved ${remainingAdmins} admin account(s) — untouched.\n`);

  console.log('✓ Wipe complete. System is reset to a clean slate.');

  await mongoose.disconnect();
  console.log('✓ Done. Disconnected from MongoDB.');
}

main().catch((err) => {
  console.error('✗ Wipe failed:', err);
  process.exit(1);
});
