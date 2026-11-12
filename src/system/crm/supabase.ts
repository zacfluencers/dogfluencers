/**
 * Supabase clients for the on-demand CRM routes. Server-only: nothing here
 * is imported by a client script, and the service role key never leaves the
 * server.
 *
 * Settings come from the environment (`.env` locally, the Vercel project in
 * production):
 *   PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY  the visitor's client
 *   SUPABASE_SERVICE_ROLE_KEY                      full access, server only
 */
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';

const env = (name: string): string | undefined =>
  (import.meta.env[name] as string | undefined) || (typeof process !== 'undefined' ? process.env[name] : undefined);

const url = () => env('PUBLIC_SUPABASE_URL');
const anonKey = () => env('PUBLIC_SUPABASE_ANON_KEY');
const serviceKey = () => env('SUPABASE_SERVICE_ROLE_KEY');

/**
 * While the site is a rebuild under test, CRM_EMAIL_ALLOWLIST (comma-separated
 * domains or addresses) limits who the site may email: sign-up confirmations,
 * set-up links and resets go to those only. Unset, anyone may be emailed.
 */
export function mayEmail(email: string): boolean {
  const list = env('CRM_EMAIL_ALLOWLIST')?.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (!list?.length) return true;
  const address = email.trim().toLowerCase();
  return list.some((entry) => (entry.includes('@') ? address === entry : address.endsWith(`@${entry}`)));
}

/** False until the Supabase settings exist, so pages can say so plainly. */
export const isCrmConfigured = () => Boolean(url() && anonKey() && serviceKey());

/**
 * Acts as the signed-in visitor. Every query runs through Row Level Security,
 * so a creator only ever sees their own row.
 */
export function visitorClient(request: Request, cookies: AstroCookies): SupabaseClient {
  return createServerClient(url()!, anonKey()!, {
    cookies: {
      getAll: () =>
        parseCookieHeader(request.headers.get('cookie') ?? '').map(({ name, value }) => ({ name, value: value ?? '' })),
      setAll: (list) => list.forEach(({ name, value, options }) => cookies.set(name, value, { ...options, path: '/' })),
    },
  });
}

/**
 * Full access, bypassing Row Level Security. Used only to create a profile
 * at registration, to link an imported profile to its new login, and to read
 * new applications for the morning email.
 */
export function serviceClient(): SupabaseClient {
  return createClient(url()!, serviceKey()!, { auth: { autoRefreshToken: false, persistSession: false } });
}

export interface Session {
  supabase: SupabaseClient;
  user: User | null;
}

/** The visitor's client and their verified user, or null when signed out. */
export async function getSession(request: Request, cookies: AstroCookies): Promise<Session> {
  const supabase = visitorClient(request, cookies);
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user ?? null };
}

/** Admin rights are checked inside the database (`public.is_admin`), not just here. */
export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}

/** Only ever redirect to a path on this site. */
export function safeNext(value: unknown, fallback: string): string {
  const v = typeof value === 'string' ? value : '';
  return v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : fallback;
}

/** Pages carrying personal data must never be cached or indexed. */
export function noStore(headers: Headers) {
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
}
