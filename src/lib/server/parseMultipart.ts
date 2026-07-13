// src/lib/server/parseMultipart.ts
//
// Zero-dependency multipart/form-data parser using only Web APIs.
// Replaces busboy which crashes on Bun due to missing TextDecoder internals.

export interface ParsedFile {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface ParsedMultipart {
  fields: Record<string, string>;
  files: ParsedFile[];
}

export async function parseMultipart(request: Request): Promise<ParsedMultipart> {
  const contentType = request.headers.get('content-type') ?? '';
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);

  if (!boundaryMatch) {
    throw new Error('No boundary found in Content-Type header');
  }

  const boundary = boundaryMatch[1] ?? boundaryMatch[2];
  const body = await request.arrayBuffer();
  const bytes = new Uint8Array(body);

  // TEMP DIAGNOSTIC
  const raw = new TextDecoder().decode(bytes.slice(0, 500));
  console.log('── raw body (first 500 chars) ──');
  console.log(JSON.stringify(raw));
  console.log('boundary:', JSON.stringify(boundary));
  console.log('body total bytes:', bytes.length);
  console.log('────────────────────────────────');

  const fields: Record<string, string> = {};
  const files: ParsedFile[] = [];

  // Split body by boundary
  const boundaryBytes = new TextEncoder().encode('--' + boundary);
  const parts = splitByBoundary(bytes, boundaryBytes);

  for (const part of parts) {
    if (part.length === 0) continue;

    // Split headers from body at \r\n\r\n
    const headerEnd = findSequence(part, new Uint8Array([0x0d, 0x0a, 0x0d, 0x0a]));
    if (headerEnd === -1) continue;

    const headerBytes = part.slice(0, headerEnd);
    // Body starts after \r\n\r\n, strip trailing \r\n
    let bodyPart = part.slice(headerEnd + 4);
    if (bodyPart[bodyPart.length - 2] === 0x0d && bodyPart[bodyPart.length - 1] === 0x0a) {
      bodyPart = bodyPart.slice(0, -2);
    }

    const headers = new TextDecoder().decode(headerBytes);
    const dispositionMatch = headers.match(
      /content-disposition:\s*form-data;[^;]*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i
    );
    if (!dispositionMatch) continue;

    const name = dispositionMatch[1];
    const filename = dispositionMatch[2];
    const contentTypeMatch = headers.match(/content-type:\s*([^\r\n]+)/i);
    const partMimeType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';

    if (filename !== undefined) {
      // It's a file field — skip zero-byte phantom entries
      if (bodyPart.length > 0) {
        files.push({
          filename,
          mimeType: partMimeType,
          buffer: Buffer.from(bodyPart),
        });
      }
    } else {
      // It's a text field
      fields[name] = new TextDecoder().decode(bodyPart);
    }
  }

  return { fields, files };
}

/** Split a Uint8Array by a delimiter sequence, returning parts between delimiters */
function splitByBoundary(data: Uint8Array, boundary: Uint8Array): Uint8Array[] {
  const parts: Uint8Array[] = [];
  let start = 0;

  while (start < data.length) {
    const idx = findSequence(data, boundary, start);
    if (idx === -1) break;

    if (idx > start) {
      // strip leading \r\n before boundary
      const slice = data.slice(start, idx);
      const trimmed = slice[0] === 0x0d && slice[1] === 0x0a ? slice.slice(2) : slice;
      if (trimmed.length > 0) parts.push(trimmed);
    }

    start = idx + boundary.length;

    // After boundary: either \r\n (more parts) or --\r\n (final boundary)
    if (data[start] === 0x2d && data[start + 1] === 0x2d) break; // --
    if (data[start] === 0x0d && data[start + 1] === 0x0a) start += 2; // \r\n
  }

  return parts;
}

/** Find the first occurrence of needle in haystack starting at offset */
function findSequence(haystack: Uint8Array, needle: Uint8Array, offset = 0): number {
  outer: for (let i = offset; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}