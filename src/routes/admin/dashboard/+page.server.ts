// src/routes/admin/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db';
import { ClearanceRequest } from '$lib/server/models';

const RECENT_LIMIT = 5;

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user || locals.user.role === 'student') throw redirect(303, '/auth/login');

  const { department } = locals.user;

  await connectDB();

  const matchStage = department
    ? { clearances: { $elemMatch: { department } } }
    : {};

  const [recentRaw, allForStats] = await Promise.all([
    ClearanceRequest.find(matchStage)
      .populate('student', 'name email matricNumber faculty programme graduationYear')
      .sort({ updatedAt: -1 })
      .limit(RECENT_LIMIT * 2) // fetch extra headroom in case some are orphaned
      .lean(),
    ClearanceRequest.find(matchStage).select('clearances student').lean(),
  ]);

  const scopedClearances = (r: any) =>
    department ? r.clearances.filter((c: any) => c.department === department) : r.clearances;

  // Drop any request whose student reference no longer resolves (orphaned data)
  const recent = recentRaw
    .filter((r) => r.student != null)
    .slice(0, RECENT_LIMIT)
    .map((r) => ({ ...r, clearances: scopedClearances(r) }));

  const validForStats = allForStats.filter((r) => r.student != null);

  const total = validForStats.length;
  const pending = validForStats.filter((r) =>
    scopedClearances(r).some((c: any) => c.status === 'pending')
  ).length;
  const approved = validForStats.filter((r) => {
    const items = scopedClearances(r);
    return items.length > 0 && items.every((c: any) => c.status === 'approved');
  }).length;

  return {
    requests: JSON.parse(JSON.stringify(recent)),
    stats: { total, pending, approved },
    adminDept: department ?? null,
  };
};
