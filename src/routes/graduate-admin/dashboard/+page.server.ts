// src/routes/graduate-admin/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db';
import { User, ClearanceRequest } from '$lib/server/models';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user?.role !== 'graduate_admin') throw redirect(303, '/auth/login');

  await connectDB();

  const [totalStudents, totalAdmins, completedCount, pendingCount, adminsByDept] =
    await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'admin' }),
      ClearanceRequest.countDocuments({ overallStatus: 'completed' }),
      ClearanceRequest.countDocuments({ overallStatus: 'in_progress' }),
      User.aggregate([
        { $match: { role: 'admin' } },
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 },
            admins: { $push: { name: '$name', email: '$email', id: { $toString: '$_id' } } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

  return {
    stats: { totalStudents, totalAdmins, completedCount, pendingCount },
    adminsByDept: JSON.parse(JSON.stringify(adminsByDept)),
  };
};
