// scripts/test-cloudinary.ts
//
// Standalone test: uploads a tiny in-memory PNG directly via the Cloudinary
// Node SDK, completely outside of SvelteKit/Vite/Bun's request handling.
// This isolates whether the problem is the SDK + your credentials/account,
// or something specific to how the SvelteKit app invokes it.
//
// Usage:
//   npx tsx scripts/test-cloudinary.ts

import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

console.log('Config check:');
console.log('  cloud_name:', cloud_name);
console.log('  api_key:', api_key);
console.log('  api_secret:', api_secret ? `${api_secret.slice(0, 4)}...${api_secret.slice(-4)}` : 'MISSING');

if (!cloud_name || !api_key || !api_secret) {
  console.error('✗ Missing credentials in .env');
  process.exit(1);
}

cloudinary.config({ cloud_name, api_key, api_secret, secure: true });

// Smallest valid 1x1 transparent PNG, base64-encoded
const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const dataUri = `data:image/png;base64,${tinyPngBase64}`;

async function main() {
  console.log('\n→ Attempting upload via Cloudinary Node SDK...\n');

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'clearance/test',
      resource_type: 'image',
    });

    console.log('✓ SUCCESS');
    console.log('  secure_url:', result.secure_url);
    console.log('  public_id:', result.public_id);

    // Clean up the test upload
    await cloudinary.uploader.destroy(result.public_id);
    console.log('✓ Test file cleaned up.');
  } catch (err: any) {
    console.error('✗ FAILED');
    console.error('  message:', err?.message);
    console.error('  http_code:', err?.http_code);
    console.error('  error:', JSON.stringify(err?.error, null, 2));
    console.error('  full error object:', JSON.stringify(err, null, 2));
  }
}

main();
