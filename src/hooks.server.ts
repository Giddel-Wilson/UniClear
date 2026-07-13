// src/hooks.server.ts
import 'dotenv/config';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { verifyToken, getTokenFromCookieHeader } from '$lib/server/auth';

const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/'];

export const handle: Handle = async ({ event, resolve }) => {
  const cookieHeader = event.request.headers.get('cookie');
  const token        = getTokenFromCookieHeader(cookieHeader);
  const user         = token ? verifyToken(token) : null;

  event.locals.user = user;

  const path = event.url.pathname;
  const isAdmin = user?.role === 'admin' || user?.role === 'graduate_admin' || user?.role === 'superadmin';

  // ── Unauthenticated guard ────────────────────────────────────────────────
  if (!user && !PUBLIC_ROUTES.some(r => path.startsWith(r))) {
    throw redirect(303, '/auth/login');
  }

  // ── RBAC: students cannot access admin areas ─────────────────────────────
  if (user?.role === 'student' && (path.startsWith('/admin') || path.startsWith('/graduate-admin'))) {
    throw redirect(303, '/student/dashboard');
  }

  // ── RBAC: regular admins cannot access graduate-admin panel ─────────────
  if (user?.role === 'admin' && path.startsWith('/graduate-admin')) {
    throw redirect(303, '/admin/dashboard');
  }

  // ── RBAC: non-students cannot access student area ────────────────────────
  if (isAdmin && path.startsWith('/student')) {
    const dest = user?.role === 'graduate_admin' ? '/graduate-admin/dashboard' : '/admin/dashboard';
    throw redirect(303, dest);
  }

  // ── Post-login redirect away from public pages ───────────────────────────
  if (user && PUBLIC_ROUTES.includes(path)) {
    if (user.role === 'student')        throw redirect(303, '/student/dashboard');
    if (user.role === 'graduate_admin') throw redirect(303, '/graduate-admin/dashboard');
    throw redirect(303, '/admin/dashboard');
  }

  return resolve(event);
};
