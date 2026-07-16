// src/routes/admin/review/[id]/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db';
import { ClearanceRequest } from '$lib/server/models';
import { ReviewSchema } from '$lib/server/validation';
import { z } from 'zod';

const DepartmentEnum = z.enum([
  'dean', 'hod', 'exams_records', 'bursary',
  'library', 'medical', 'alumni', 'senate',
]);

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user || locals.user.role === 'student') throw redirect(303, '/auth/login');

  if (!/^[a-f\d]{24}$/i.test(params.id)) throw error(400, 'Invalid request ID');

  await connectDB();

  const request = await ClearanceRequest.findById(params.id)
    .populate('student', 'name email matricNumber faculty programme graduationYear')
    .lean();

  if (!request) throw error(404, 'Clearance request not found');
  if (!request.student) throw error(404, 'This request references a student that no longer exists');

  const adminDept = locals.user.department;
  if (adminDept) {
    const canAccess = request.clearances.some((c) => c.department === adminDept);
    if (!canAccess) throw error(403, 'You are not authorized to review this request');
  }

  return {
    request: JSON.parse(JSON.stringify(request)),
    adminDept: adminDept ?? null,
  };
};

export const actions: Actions = {
  // ── Normal review: only works on items currently 'pending' ────────────────
  review: async ({ request, locals, params }) => {
    if (!locals.user || locals.user.role === 'student') {
      return fail(403, { message: 'Unauthorized.' });
    }

    const formData = Object.fromEntries(await request.formData());
    const parsed = ReviewSchema.safeParse({ ...formData, requestId: params.id });

    if (!parsed.success) {
      return fail(400, { message: parsed.error.issues[0].message });
    }

    const { requestId, department, action, comment } = parsed.data;

    if (locals.user.department && locals.user.department !== department) {
      return fail(403, { message: 'You can only review your own department.' });
    }

    await connectDB();

    const clearanceRequest = await ClearanceRequest.findById(requestId);
    if (!clearanceRequest) return fail(404, { message: 'Request not found.' });

    const item = clearanceRequest.clearances.find((c) => c.department === department);
    if (!item) return fail(400, { message: 'Department not found in this request.' });

    if (item.status !== 'pending') {
      return fail(400, { message: 'This item is not pending review.' });
    }

    item.status = action === 'approve' ? 'approved' : 'rejected';
    item.comment = comment;
    item.reviewedBy = locals.user.id as any;
    item.reviewedAt = new Date();

    const allApproved = clearanceRequest.clearances.every((c) => c.status === 'approved');
    const anyRejected = clearanceRequest.clearances.some((c) => c.status === 'rejected');
    clearanceRequest.overallStatus = allApproved ? 'completed' : anyRejected ? 'rejected' : 'in_progress';

    await clearanceRequest.save();
    return { success: true, action, department };
  },

  // ── Revert: undo a prior approve/reject decision, sending it back to
  //    pending so it can be re-reviewed. Available for accidents/oversight. ──
  revert: async ({ request, locals, params }) => {
    if (!locals.user || locals.user.role === 'student') {
      return fail(403, { message: 'Unauthorized.' });
    }

    const formData = Object.fromEntries(await request.formData());
    const deptParsed = DepartmentEnum.safeParse(formData.department);

    if (!deptParsed.success) {
      return fail(400, { message: 'Invalid department.' });
    }

    const department = deptParsed.data;

    if (locals.user.department && locals.user.department !== department) {
      return fail(403, { message: 'You can only modify your own department.' });
    }

    if (!/^[a-f\d]{24}$/i.test(params.id)) {
      return fail(400, { message: 'Invalid request ID.' });
    }

    await connectDB();

    const clearanceRequest = await ClearanceRequest.findById(params.id);
    if (!clearanceRequest) return fail(404, { message: 'Request not found.' });

    const item = clearanceRequest.clearances.find((c) => c.department === department);
    if (!item) return fail(400, { message: 'Department not found in this request.' });

    if (item.status !== 'approved' && item.status !== 'rejected') {
      return fail(400, { message: 'Only approved or rejected items can be reverted.' });
    }

    const previousStatus = item.status;
    item.status = 'pending';
    item.comment = undefined;
    item.reviewedBy = undefined;
    item.reviewedAt = undefined;

    const allApproved = clearanceRequest.clearances.every((c) => c.status === 'approved');
    const anyRejected = clearanceRequest.clearances.some((c) => c.status === 'rejected');
    clearanceRequest.overallStatus = allApproved ? 'completed' : anyRejected ? 'rejected' : 'in_progress';

    await clearanceRequest.save();
    return { success: true, action: 'revert', previousStatus, department };
  },
};
