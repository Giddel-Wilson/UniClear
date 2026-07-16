// src/routes/auth/logout/+page.server.ts
import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';

export const actions: Actions = {
  default: async ({ cookies }) => {
    cookies.delete('cs_session', { path: '/' });
    throw redirect(303, '/auth/login');
  },
};
