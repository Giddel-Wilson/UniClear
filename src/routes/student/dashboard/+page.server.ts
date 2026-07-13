// src/routes/student/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db';
import { User, ClearanceRequest } from '$lib/server/models';
import { ALL_DEPARTMENTS } from '$lib/types';
import type { Department } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'student') throw redirect(303, '/auth/login');

  await connectDB();

  const currentSession = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

  let request = await ClearanceRequest.findOne({
    student: locals.user.id,
    academicSession: currentSession,
  })
    .populate('student', 'name email matricNumber faculty programme graduationYear')
    .lean();

  // Auto-create clearance request with all departments on first login
  if (!request) {
    const student = await User.findById(locals.user.id).lean();
    const clearances = ALL_DEPARTMENTS.map((dept: Department) => ({
      department: dept,
      status: 'not_submitted' as const,
      documents: [],
    }));

    const created = await ClearanceRequest.create({
      student: locals.user.id,
      academicSession: currentSession,
      graduationYear: student?.graduationYear ?? new Date().getFullYear(),
      clearances,
      overallStatus: 'in_progress',
    });

    request = await ClearanceRequest.findById(created._id)
      .populate('student', 'name email matricNumber faculty programme graduationYear')
      .lean();
  }

  const approved = request!.clearances.filter((c) => c.status === 'approved').length;
  const total = request!.clearances.length;
  const progress = Math.round((approved / total) * 100);

  return {
    request: JSON.parse(JSON.stringify(request)),
    progress,
    approved,
    total,
    currentSession,
  };
};
