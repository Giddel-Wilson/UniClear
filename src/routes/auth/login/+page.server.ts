// src/routes/auth/login/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db';
import { User } from '$lib/server/models';
import { verifyPassword, signToken } from '$lib/server/auth';
import { LoginSchema } from '$lib/server/validation';

function destinationFor(role: string): string {
  if (role === 'student') return '/student/dashboard';
  if (role === 'graduate_admin') return '/graduate-admin/dashboard';
  return '/admin/dashboard'; // admin, superadmin
}

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) throw redirect(303, destinationFor(locals.user.role));
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = Object.fromEntries(await request.formData());

    const parsed = LoginSchema.safeParse(formData);
    if (!parsed.success) {
      return fail(400, { message: parsed.error.errors[0].message });
    }

    const { email, password } = parsed.data;

    await connectDB();

    const user = await User.findOne({ email }).select('+passwordHash').lean();
    if (!user) {
      return fail(401, { message: 'Invalid email or password.' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return fail(401, { message: 'Invalid email or password.' });
    }

    const sessionUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
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

    throw redirect(303, destinationFor(user.role));
  },
};
