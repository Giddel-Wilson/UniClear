// scripts/fix-orphaned-requests.ts
//
// Finds ClearanceRequest documents whose `student` reference points to a
// User document that no longer exists (e.g. the student was deleted but
// their clearance request wasn't), and removes those orphaned requests.
//
// Usage:
//   npx tsx scripts/fix-orphaned-requests.ts --dry-run   (preview only)
//   npx tsx scripts/fix-orphaned-requests.ts             (actually delete)

import 'dotenv/config';
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');

const ClearanceRequestSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const ClearanceRequest =
  mongoose.models.ClearanceRequest ||
  mongoose.model('ClearanceRequest', ClearanceRequestSchema, 'clearancerequests');

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

  const allRequests = await ClearanceRequest.find({}).select('student').lean();
  console.log(`→ Checking ${allRequests.length} clearance request(s)…\n`);

  const orphanedIds: string[] = [];

  for (const req of allRequests as any[]) {
    const studentExists = await User.exists({ _id: req.student });
    if (!studentExists) {
      orphanedIds.push(req._id.toString());
    }
  }

  if (orphanedIds.length === 0) {
    console.log('✓ No orphaned requests found. Database is clean.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${orphanedIds.length} orphaned request(s):`);
  orphanedIds.forEach((id) => console.log(`  - ${id}`));
  console.log();

  if (isDryRun) {
    console.log('→ Dry run only — no changes made. Remove --dry-run to actually delete.');
    await mongoose.disconnect();
    return;
  }

  const result = await ClearanceRequest.deleteMany({ _id: { $in: orphanedIds } });
  console.log(`✓ Deleted ${result.deletedCount} orphaned request(s).`);

  await mongoose.disconnect();
  console.log('✓ Done. Disconnected from MongoDB.');
}

main().catch((err) => {
  console.error('✗ Script failed:', err);
  process.exit(1);
});
