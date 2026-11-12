/** Signs out a creator or a team member. POST only, so a link can't do it. */
import type { APIRoute } from 'astro';
import { safeNext, visitorClient } from '../../system/crm/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData().catch(() => new FormData());
  await visitorClient(request, cookies).auth.signOut();
  return redirect(safeNext(form.get('next'), '/'), 303);
};
