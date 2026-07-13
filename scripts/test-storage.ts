// src/lib/server/storage.ts
import { UTApi } from 'uploadthing/server';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '$lib/types';

let _utapi: UTApi | null = null;

function getUTApi(): UTApi {
  if (_utapi) return _utapi;

  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) {
    throw new Error(
      'UPLOADTHING_TOKEN env var is required — add it to your .env file.'
    );
  }

  _utapi = new UTApi({ token });
  return _utapi;
}

export interface UploadResult {
  url: string;
  publicId: string; // Uploadthing file key — used for deletion
  name: string;
  mimeType: string;
  size: number;
}

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}

/**
 * Determine a file's real MIME type by sniffing its magic bytes.
 * Never trusts the browser-declared type — some browsers/OS combos report
 * "application/octet-stream" for valid PDFs etc (common on Windows).
 */
function detectMimeType(bytes: Uint8Array): string | null {
  // PDF: %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'application/pdf';
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

export async function uploadDocument(
  file: File,
  _folder: string // kept for API compatibility, Uploadthing uses app-level folders
): Promise<UploadResult> {
  // 1. Size check (cheap, before reading content)
  if (file.size > MAX_FILE_SIZE) {
    throw new FileValidationError(
      `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the 5MB limit.`
    );
  }

  // 2. Detect real MIME type from magic bytes
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const detectedType = detectMimeType(bytes);

  if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType)) {
    throw new FileValidationError(
      `"${file.name}" is not a supported file type. Accepted: PDF, JPEG, PNG, WebP.`
    );
  }

  // 3. Upload via Uploadthing
  const utapi = getUTApi();

  // Re-create a File with the verified MIME type (fixes octet-stream issues)
  const verifiedFile = new File(
    [buffer],
    file.name || `upload.${detectedType.split('/')[1]}`,
    { type: detectedType }
  );

  const response = await utapi.uploadFiles(verifiedFile);

  if (response.error) {
    console.error('Uploadthing error:', response.error);
    throw new Error(`Upload failed: ${response.error.message}`);
  }

  const uploaded = response.data;

  return {
    url: uploaded.ufsUrl ?? uploaded.url,
    publicId: uploaded.key,
    name: file.name || uploaded.name,
    mimeType: detectedType,
    size: file.size,
  };
}

export async function deleteDocument(publicId: string): Promise<void> {
  const utapi = getUTApi();
  await utapi.deleteFiles(publicId);
}