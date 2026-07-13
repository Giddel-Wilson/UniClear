// src/routes/admin/review/[id]/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db';
import { ClearanceRequest } from '$lib/server/models';
import { ReviewSchema } from '$lib/server/validation';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user || locals.user.role === 'student') throw redirect(303, '/auth/login');

  // Validate ObjectId format to prevent injection
  if (!/^[a-f\d]{24}$/i.test(params.id)) throw error(400, 'Invalid request ID');

  await connectDB();

  const request = await ClearanceRequest.findById(params.id)
    .populate('student', 'name email matricNumber faculty programme graduationYear')
    .lean();

  if (!request) throw error(404, 'Clearance request not found');

  // Admin can only review their own department's items
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
  review: async ({ request, locals, params }) => {
    if (!locals.user || locals.user.role === 'student') {
      return fail(403, { message: 'Unauthorized.' });
    }

    const formData = Object.fromEntries(await request.formData());
    const parsed = ReviewSchema.safeParse({ ...formData, requestId: params.id });

    if (!parsed.success) {
      return fail(400, { message: parsed.error.errors[0].message });
    }

    const { requestId, department, action, comment } = parsed.data;

    // RBAC: admin can only review their own department
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

    // Recalculate overall status
    const allApproved = clearanceRequest.clearances.every((c) => c.status === 'approved');
    const anyRejected = clearanceRequest.clearances.some((c) => c.status === 'rejected');
    clearanceRequest.overallStatus = allApproved ? 'completed' : anyRejected ? 'rejected' : 'in_progress';

    await clearanceRequest.save();
    return { success: true, action };
  },
};
