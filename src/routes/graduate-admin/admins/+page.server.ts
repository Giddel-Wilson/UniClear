// src/routes/graduate-admin/admins/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db';
import { User } from '$lib/server/models';
import { hashPassword } from '$lib/server/auth';
import { CreateAdminSchema, UpdateAdminSchema, DeleteAdminSchema } from '$lib/server/validation';
import { ALL_DEPARTMENTS, DEPARTMENT_LABELS } from '$lib/types';
import type { Department } from '$lib/types';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user?.role !== 'graduate_admin') throw redirect(303, '/auth/login');

  await connectDB();

  const filterDept = url.searchParams.get('dept') as Department | null;
  const query = filterDept ? { role: 'admin', department: filterDept } : { role: 'admin' };

  const admins = await User.find(query)
    .select('-passwordHash')
    .sort({ department: 1, name: 1 })
    .lean();

  // Build a map of which departments have coverage
  const coveredDepts = new Set(admins.map(a => a.department));
  const uncoveredDepts = ALL_DEPARTMENTS.filter(d => !coveredDepts.has(d));

  return {
    admins: JSON.parse(JSON.stringify(admins)),
    uncoveredDepts,
    filterDept,
    openAction: url.searchParams.get('action') ?? null,
  };
};

export const actions: Actions = {
  // ── Create a new department admin ─────────────────────────────────────────
  create: async ({ request, locals }) => {
    if (locals.user?.role !== 'graduate_admin') return fail(403, { message: 'Forbidden.' });

    const data = Object.fromEntries(await request.formData());
    const parsed = CreateAdminSchema.safeParse(data);
    if (!parsed.success) {
      return fail(400, { action: 'create', message: parsed.error.errors[0].message });
    }

    const { name, email, password, department, adminNote } = parsed.data;

    await connectDB();

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return fail(409, { action: 'create', message: 'An account with this email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    await User.create({ name, email, passwordHash, role: 'admin', department, adminNote });

    return { success: true, action: 'create', message: `Admin account created for ${name}.` };
  },

  // ── Update name / department / note ──────────────────────────────────────
  update: async ({ request, locals }) => {
    if (locals.user?.role !== 'graduate_admin') return fail(403, { message: 'Forbidden.' });

    const data = Object.fromEntries(await request.formData());
    const parsed = UpdateAdminSchema.safeParse(data);
    if (!parsed.success) {
      return fail(400, { action: 'update', message: parsed.error.errors[0].message });
    }

    const { adminId, name, department, adminNote } = parsed.data;

    await connectDB();

    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    if (!admin) return fail(404, { action: 'update', message: 'Admin not found.' });

    if (name)       admin.name       = name;
    if (department) admin.department = department;
    if (adminNote !== undefined) admin.adminNote = adminNote;

    await admin.save();
    return { success: true, action: 'update', message: `${admin.name} updated successfully.` };
  },

  // ── Reset password ────────────────────────────────────────────────────────
  resetPassword: async ({ request, locals }) => {
    if (locals.user?.role !== 'graduate_admin') return fail(403, { message: 'Forbidden.' });

    const data        = Object.fromEntries(await request.formData());
    const adminId     = (data.adminId as string)?.trim();
    const newPassword = (data.newPassword as string)?.trim();

    if (!adminId || !/^[a-f\d]{24}$/i.test(adminId)) {
      return fail(400, { action: 'resetPassword', message: 'Invalid admin ID.' });
    }
    if (!newPassword || newPassword.length < 10) {
      return fail(400, { action: 'resetPassword', message: 'New password must be at least 10 characters.' });
    }

    await connectDB();

    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    if (!admin) return fail(404, { action: 'resetPassword', message: 'Admin not found.' });

    admin.passwordHash = await hashPassword(newPassword);
    await admin.save();

    return { success: true, action: 'resetPassword', message: `Password reset for ${admin.name}.` };
  },

  // ── Reassign to a different department ───────────────────────────────────
  reassign: async ({ request, locals }) => {
    if (locals.user?.role !== 'graduate_admin') return fail(403, { message: 'Forbidden.' });

    const data       = Object.fromEntries(await request.formData());
    const adminId    = (data.adminId as string)?.trim();
    const newDept    = (data.newDepartment as string)?.trim() as Department;

    if (!adminId || !/^[a-f\d]{24}$/i.test(adminId)) {
      return fail(400, { action: 'reassign', message: 'Invalid admin ID.' });
    }
    if (!newDept || !Object.keys(DEPARTMENT_LABELS).includes(newDept)) {
      return fail(400, { action: 'reassign', message: 'Invalid department.' });
    }

    await connectDB();

    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    if (!admin) return fail(404, { action: 'reassign', message: 'Admin not found.' });

    const oldDept = admin.department;
    admin.department = newDept;
    await admin.save();

    return {
      success: true,
      action: 'reassign',
      message: `${admin.name} moved from ${DEPARTMENT_LABELS[oldDept as Department] ?? oldDept} → ${DEPARTMENT_LABELS[newDept]}.`,
    };
  },

  // ── Delete admin account ──────────────────────────────────────────────────
  delete: async ({ request, locals }) => {
    if (locals.user?.role !== 'graduate_admin') return fail(403, { message: 'Forbidden.' });

    const data   = Object.fromEntries(await request.formData());
    const parsed = DeleteAdminSchema.safeParse(data);
    if (!parsed.success) {
      return fail(400, { action: 'delete', message: 'Invalid admin ID.' });
    }

    await connectDB();

    const admin = await User.findOne({ _id: parsed.data.adminId, role: 'admin' });
    if (!admin) return fail(404, { action: 'delete', message: 'Admin not found.' });

    const adminName = admin.name;
    await User.deleteOne({ _id: admin._id });

    return { success: true, action: 'delete', message: `${adminName} has been removed.` };
  },
};
