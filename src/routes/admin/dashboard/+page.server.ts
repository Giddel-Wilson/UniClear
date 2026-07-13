// src/routes/admin/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db';
import { ClearanceRequest } from '$lib/server/models';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user || locals.user.role === 'student') throw redirect(303, '/auth/login');

  const { department } = locals.user;

  await connectDB();

  // For superadmin: all; for admin: only their department's pending items
  const matchStage = department
    ? {
        clearances: {
          $elemMatch: { department, status: { $in: ['pending', 'approved', 'rejected'] } },
        },
      }
    : {};

  const requests = await ClearanceRequest.find(matchStage)
    .populate('student', 'name email matricNumber faculty programme graduationYear')
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  // Filter clearances to only the admin's department (for display)
  const filtered = requests.map((r) => ({
    ...r,
    clearances: department
      ? r.clearances.filter((c) => c.department === department)
      : r.clearances,
  }));

  const pending = filtered.filter((r) =>
    r.clearances.some((c) => c.status === 'pending')
  ).length;
  const approved = filtered.filter((r) =>
    r.clearances.every((c) => c.status === 'approved')
  ).length;

  return {
    requests: JSON.parse(JSON.stringify(filtered)),
    stats: { total: filtered.length, pending, approved },
    adminDept: department ?? null,
  };
};
