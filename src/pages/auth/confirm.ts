/**
 * Landing point for links in Supabase emails: confirm signup, set up a login
 * (invite) and reset password. Handles both "?token_hash=" links (the email
 * templates in supabase/templates) and the default "?code=" links.
 *
 * Opening the link proves the creator owns the email, so this is where an
 * imported profile with that email is linked to their new login.
 */
import type { APIRoute } from 'astro';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeNext, visitorClient } from '../../system/crm/supabase';
import { linkImportedProfile } from '../../system/crm/server';

export const prerender = false;

export const GET: APIRoute = async ({ url, request, cookies, redirect }) => {
  const next = safeNext(url.searchParams.get('next'), '/creator/profile/');
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const supabase = visitorClient(request, cookies);

  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;

  if (ok) {
    const { data } = await supabase.auth.getUser();
    if (data.user) await linkImportedProfile(data.user);
    return redirect(next, 303);
  }

  // Usually an expired link, or one opened in a different browser.
  return redirect(next.startsWith('/creator/reset-password/') ? '/creator/forgot-password/?error=link' : '/creator/login/?error=link', 303);
};
