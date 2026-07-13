// src/routes/auth/register/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db';
import { User } from '$lib/server/models';
import { hashPassword, signToken } from '$lib/server/auth';
import { RegisterStudentSchema } from '$lib/server/validation';
import { ALL_DEPARTMENTS } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) throw redirect(303, '/student/dashboard');
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = Object.fromEntries(await request.formData());

    const parsed = RegisterStudentSchema.safeParse(formData);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join('; ');
      return fail(400, { message });
    }

    const { name, email, password, matricNumber, faculty, programme, graduationYear } = parsed.data;

    await connectDB();

    const existing = await User.findOne({ $or: [{ email }, { matricNumber }] }).lean();
    if (existing) {
      return fail(409, {
        message: existing.email === email
          ? 'An account with this email already exists.'
          : 'This matric number is already registered.',
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'student',
      matricNumber,
      faculty,
      programme,
      graduationYear,
    });

    const sessionUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role as 'student',
      matricNumber: user.matricNumber,
    };

    const token = signToken(sessionUser);
    cookies.set('cs_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    throw redirect(303, '/student/dashboard');
  },
};
