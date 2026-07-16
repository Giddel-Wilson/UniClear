// src/routes/admin/review/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db';
import { ClearanceRequest } from '$lib/server/models';
import type { ClearanceStatus } from '$lib/types';

const VALID_FILTERS: (ClearanceStatus | 'all')[] = ['all', 'pending', 'approved', 'rejected', 'not_submitted'];

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user || locals.user.role === 'student') throw redirect(303, '/auth/login');

  const { department } = locals.user;

  const filterParam = url.searchParams.get('status') ?? 'pending';
  const activeFilter = VALID_FILTERS.includes(filterParam as any) ? filterParam : 'pending';
  const searchQuery = (url.searchParams.get('search') ?? '').trim();

  await connectDB();

  const matchStage = department
    ? { clearances: { $elemMatch: { department } } }
    : {};

  const allRequests = await ClearanceRequest.find(matchStage)
    .populate('student', 'name email matricNumber faculty programme graduationYear')
    .sort({ updatedAt: -1 })
    .lean();

  // Drop orphaned requests (student reference no longer resolves)
  const validRequests = allRequests.filter((r) => r.student != null);

  const scopedClearances = (r: any) =>
    department ? r.clearances.filter((c: any) => c.department === department) : r.clearances;

  const withScoped = validRequests.map((r) => ({ ...r, clearances: scopedClearances(r) }));

  // ── Apply search first — name, email, or matric number, case-insensitive ──
  const searchLower = searchQuery.toLowerCase();
  const searchScoped = searchQuery
    ? withScoped.filter((r) => {
        const s = r.student as any;
        return (
          s.name?.toLowerCase().includes(searchLower) ||
          s.email?.toLowerCase().includes(searchLower) ||
          s.matricNumber?.toLowerCase().includes(searchLower) ||
          s.programme?.toLowerCase().includes(searchLower) ||
          s.faculty?.toLowerCase().includes(searchLower)
        );
      })
    : withScoped;

  // Counts reflect the current search scope, so tab badges stay meaningful
  // while searching
  const counts = {
    all: searchScoped.length,
    pending: searchScoped.filter((r) => r.clearances.some((c: any) => c.status === 'pending')).length,
    approved: searchScoped.filter((r) =>
      r.clearances.length > 0 && r.clearances.every((c: any) => c.status === 'approved')
    ).length,
    rejected: searchScoped.filter((r) => r.clearances.some((c: any) => c.status === 'rejected')).length,
    not_submitted: searchScoped.filter((r) =>
      r.clearances.every((c: any) => c.status === 'not_submitted')
    ).length,
  };

  const filtered =
    activeFilter === 'all'
      ? searchScoped
      : searchScoped.filter((r) => r.clearances.some((c: any) => c.status === activeFilter));

  return {
    requests: JSON.parse(JSON.stringify(filtered)),
    counts,
    activeFilter,
    searchQuery,
    adminDept: department ?? null,
  };
};
