// src/lib/server/storage.ts
import { UTApi } from 'uploadthing/server';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '$lib/types';

let _utapi: UTApi | null = null;

function getUTApi(): UTApi {
  if (_utapi) return _utapi;

  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) {
    throw new Error('UPLOADTHING_TOKEN env var is required — add it to your .env file.');
  }

  _utapi = new UTApi({ token });
  return _utapi;
}

export interface UploadResult {
  url: string;
  publicId: string;
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

function detectMimeType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)
    return 'application/pdf';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return 'image/png';
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'image/webp';
  return null;
}

/**
 * Upload a file from a raw Buffer (used by busboy multipart parser).
 * This bypasses Bun's broken request.formData() which loses file content.
 */
export async function uploadBuffer(
  buffer: Buffer,
  filename: string,
  _folder: string
): Promise<UploadResult> {
  if (buffer.length === 0) {
    throw new FileValidationError('File appears to be empty. Please try again.');
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new FileValidationError(
      `File size ${(buffer.length / 1024 / 1024).toFixed(1)}MB exceeds the 5MB limit.`
    );
  }

  const bytes = new Uint8Array(buffer);
  const detectedType = detectMimeType(bytes);

  if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType)) {
    throw new FileValidationError(
      `"${filename}" is not a supported file type. Accepted: PDF, JPEG, PNG, WebP.`
    );
  }

  const utapi = getUTApi();

  const ext = detectedType.split('/')[1].replace('jpeg', 'jpg');
  const safeName = filename || `upload.${ext}`;

  const file = new File([buffer], safeName, { type: detectedType });
  const response = await utapi.uploadFiles(file);

  if (response.error) {
    console.error('Uploadthing error:', response.error);
    throw new Error(`Upload failed: ${response.error.message}`);
  }

  const uploaded = response.data;

  return {
    url: uploaded.ufsUrl,
    publicId: uploaded.key,
    name: safeName,
    mimeType: detectedType,
    size: buffer.length,
  };
}

export async function deleteDocument(publicId: string): Promise<void> {
  const utapi = getUTApi();
  await utapi.deleteFiles(publicId);
}
