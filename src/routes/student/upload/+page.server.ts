// src/routes/student/upload/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db';
import { ClearanceRequest } from '$lib/server/models';
import { uploadBuffer, FileValidationError } from '$lib/server/storage';
import { parseMultipart } from '$lib/server/parseMultipart';
import { z } from 'zod';

const DeptEnum = z.enum([
  'dean', 'hod', 'exams_records', 'bursary',
  'library', 'medical', 'alumni', 'senate',
]);

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'student') throw redirect(303, '/auth/login');
  return {};
};

export const actions: Actions = {
  upload: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { message: 'Unauthorized.' });

    // Use busboy to parse multipart — Bun's request.formData() loses file content
    let parsed;
    try {
      parsed = await parseMultipart(request);
    } catch (err) {
      console.error('Multipart parse error:', err);
      return fail(400, { message: 'Could not parse uploaded files. Please try again.' });
    }

    const { fields, files } = parsed;

    // TEMP DIAGNOSTIC
    console.log('── parseMultipart diagnostic ──');
    console.log('fields:', fields);
    console.log('files.length:', files.length);
    for (const f of files) {
      console.log('  filename:', JSON.stringify(f.filename), '| size:', f.buffer.length, '| mimeType:', f.mimeType);
    }
    console.log('───────────────────────────────');

    // Validate department
    const deptParsed = DeptEnum.safeParse(fields.department);
    if (!deptParsed.success) {
      return fail(400, { message: 'Invalid department.' });
    }
    const department = deptParsed.data;

    if (files.length === 0) {
      return fail(400, { message: 'No files provided.' });
    }

    if (files.length > 5) {
      return fail(400, { message: 'Maximum 5 files allowed per upload.' });
    }

    await connectDB();

    const currentSession = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
    const clearanceRequest = await ClearanceRequest.findOne({
      student: locals.user.id,
      academicSession: currentSession,
    });

    if (!clearanceRequest) {
      return fail(404, { message: 'Clearance request not found.' });
    }

    const clearanceItem = clearanceRequest.clearances.find((c) => c.department === department);
    if (!clearanceItem) {
      return fail(400, { message: 'Department not found in your clearance.' });
    }

    if (clearanceItem.status === 'approved') {
      return fail(400, { message: 'This department has already approved your clearance.' });
    }

    try {
      const uploadedDocs = await Promise.all(
        files.map((f) => uploadBuffer(f.buffer, f.filename, locals.user!.id))
      );

      clearanceItem.documents.push(
        ...uploadedDocs.map((doc) => ({
          name: doc.name,
          url: doc.url,
          publicId: doc.publicId,
          mimeType: doc.mimeType,
          size: doc.size,
          uploadedAt: new Date(),
        }))
      );
      clearanceItem.status = 'pending';
      clearanceItem.comment = undefined;

      await clearanceRequest.save();
      return { success: true };
    } catch (err) {
      if (err instanceof FileValidationError) {
        return fail(400, { message: err.message });
      }
      console.error('Upload error:', err);
      return fail(500, { message: 'Upload failed. Please try again.' });
    }
  },
};