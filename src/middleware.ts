/**
 * Keeps the CRM and creator-only pages behind a login. Runs only for
 * on-demand requests: prerendered marketing pages are untouched.
 *
 * This is the first gate, not the only one. Every admin page checks admin
 * rights again, and the database refuses admin reads to anyone not in
 * `public.admins`.
 */
import { defineMiddleware } from 'astro:middleware';
import { getSession, isCrmConfigured, noStore } from './system/crm/supabase';

const ADMIN = /^\/admin\/(?!login\/)/;
const CREATOR_ONLY = /^\/creator\/(profile|reset-password)\//;
const PRIVATE = /^\/(admin|creator|join|auth)\//;

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) return next();
  const { pathname, search } = context.url;
  if (!PRIVATE.test(pathname)) return next();

  if (isCrmConfigured()) {
    // Reading the user also refreshes the session cookie when it is due.
    const session = await getSession(context.request, context.cookies);
    context.locals.session = session;

    const needsAdmin = ADMIN.test(pathname);
    if (!session.user && (needsAdmin || CREATOR_ONLY.test(pathname))) {
      const login = needsAdmin ? '/admin/login/' : '/creator/login/';
      return context.redirect(`${login}?next=${encodeURIComponent(pathname + search)}`, 303);
    }
  }

  const response = await next();
  noStore(response.headers);
  return response;
});
