/**
 * What the CRM pages do on the server: register, claim, sign in, save a
 * profile, list and update creators. Server-only.
 */
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Creator, CrmConfig } from './types';
import { mayEmail, serviceClient } from './supabase';
import { buildSchemas, fieldErrorsFrom, formToInput, toRecord, type FieldErrors } from './validation';

export const HONEYPOT = 'company_website';

export type FormResult =
  | { ok: true; kind: 'confirm' | 'signed_in' | 'claim' }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

const alreadyRegistered = (): FormResult => ({
  ok: false,
  message: 'There is already an account with this email.',
  fieldErrors: { email: 'This email is already registered. Try logging in instead.' },
});

/**
 * Emails a creator imported from the old site a link to set up their login.
 * Their existing profile is never changed by someone who has only typed the
 * email address: it is linked to the login once they open the link.
 */
async function sendClaimLink(email: string, origin: string) {
  if (!mayEmail(email)) return;
  const admin = serviceClient();
  const redirectTo = `${origin}/auth/confirm/?next=${encodeURIComponent('/creator/reset-password/?claim=1')}`;
  const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (!error) return;
  // Invited before but never finished: send a set-password link instead.
  if (error.code === 'email_exists' || error.status === 422) {
    await admin.auth.resetPasswordForEmail(email, { redirectTo });
    return;
  }
  console.error('claim invite failed', error.code, error.message);
}

export async function registerCreator(
  supabase: SupabaseClient,
  form: FormData,
  origin: string,
  config: CrmConfig,
): Promise<FormResult> {
  // Real people never see or fill this field.
  if (String(form.get(HONEYPOT) ?? '').trim() !== '') return { ok: true, kind: 'confirm' };

  const parsed = buildSchemas(config).registration.safeParse(formToInput(form, config));
  if (!parsed.success) {
    return { ok: false, message: 'Some details need another look.', fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const { email, password, privacy_consent: _consent, ...rest } = parsed.data as Record<string, unknown> & {
    email: string;
    password: string;
  };

  // Testing: never email anyone outside the allowlist, including by signing up.
  if (!mayEmail(email)) {
    return { ok: false, message: 'Applications are not open yet: this site is being tested. Please check back soon.' };
  }

  const admin = serviceClient();
  const existing = await admin.from('creators').select('id, auth_user_id').eq('email', email).maybeSingle();
  if (existing.data?.auth_user_id) return alreadyRegistered();
  if (existing.data) {
    await sendClaimLink(email, origin);
    return { ok: true, kind: 'claim' };
  }

  // 1. The login, in Supabase Auth. The password goes to Auth only.
  const record = toRecord(rest);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm/?next=${encodeURIComponent('/creator/profile/?welcome=1')}`,
      data: { first_name: record.first_name, last_name: record.last_name },
    },
  });

  if (error) {
    if (error.code === 'user_already_exists' || error.code === 'email_exists') return alreadyRegistered();
    // Supabase rejects some addresses itself; with custom SMTP, the mail
    // server rejecting one surfaces as a failed confirmation email instead.
    if (error.code === 'email_address_invalid' || /sending confirmation email/i.test(error.message)) {
      return { ok: false, message: 'Some details need another look.', fieldErrors: { email: "We couldn't send an email to this address. Check it's typed correctly." } };
    }
    if (error.code === 'weak_password') {
      return { ok: false, message: 'Please choose a stronger password.', fieldErrors: { password: error.message } };
    }
    if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
      return { ok: false, message: 'Too many attempts. Please wait a few minutes and try again.' };
    }
    console.error('signUp failed', error.code, error.message);
    return { ok: false, message: 'We could not create your account just now. Please try again.' };
  }
  // With email confirmation on, Supabase hides whether an email exists by
  // returning a user with no identities.
  if (!data.user || data.user.identities?.length === 0) return alreadyRegistered();

  // 2. The profile, linked to the new login.
  const { error: insertError } = await admin.from('creators').insert({
    ...record,
    email,
    auth_user_id: data.user.id,
    source: 'signup',
    privacy_consent_at: new Date().toISOString(),
  });

  if (insertError) {
    // Roll back the login so the creator can try again cleanly.
    await admin.auth.admin.deleteUser(data.user.id);
    if (data.session) await supabase.auth.signOut();
    if (insertError.code === '23505') return alreadyRegistered();
    console.error('creator insert failed', insertError.code, insertError.message);
    return { ok: false, message: 'We could not save your application. Please try again.' };
  }

  return { ok: true, kind: data.session ? 'signed_in' : 'confirm' };
}

/** For "I was in the network before": always the same answer, so emails can't be guessed. */
export async function requestClaim(email: string, origin: string) {
  if (!mayEmail(email)) return;
  const admin = serviceClient();
  const { data } = await admin.from('creators').select('id, auth_user_id').eq('email', email).maybeSingle();
  if (data && !data.auth_user_id) await sendClaimLink(email, origin);
  // A creator's login, or a team member's (who has no creator row). Supabase
  // sends nothing to an address without a login.
  else await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm/?next=${encodeURIComponent('/creator/reset-password/')}`,
  });
}

/**
 * After a creator proves they own the email (by opening an emailed link),
 * attach an imported, unclaimed profile with that email to their login.
 */
export async function linkImportedProfile(user: User) {
  if (!user.email) return;
  const admin = serviceClient();
  const { error } = await admin
    .from('creators')
    .update({ auth_user_id: user.id })
    .eq('email', user.email)
    .is('auth_user_id', null);
  if (error) console.error('profile link failed', error.code, error.message);
}

/**
 * The columns a creator may read: every one but the team's notes. Matches the
 * column grant in the migration. `select('*')` would ask for admin_notes too,
 * and Postgres refuses the whole query.
 */
const OWN_COLUMNS = [
  'id', 'auth_user_id', 'created_at', 'updated_at', 'source',
  'first_name', 'last_name', 'email', 'phone',
  'address_line_1', 'address_line_2', 'town', 'county', 'postcode', 'country',
  'gender', 'date_of_birth', 'clothing_size', 'trouser_size', 'shoe_size', 'dietary_requirements', 'allergies',
  'instagram_url', 'instagram_followers', 'tiktok_url', 'tiktok_followers', 'youtube_url', 'youtube_followers',
  'rate_per_post', 'join_gifting_network', 'additional_notes', 'details', 'privacy_consent_at', 'application_status',
].join(', ');

export type OwnProfile = Omit<Creator, 'admin_notes'>;

/** The signed-in creator's own row, through Row Level Security. */
export async function ownProfile(supabase: SupabaseClient, user: User): Promise<OwnProfile | null> {
  const { data, error } = await supabase.from('creators').select(OWN_COLUMNS).eq('auth_user_id', user.id).maybeSingle();
  if (error) console.error('own profile read failed', error.code, error.message);
  return (data as OwnProfile | null) ?? null;
}

export async function updateOwnProfile(
  supabase: SupabaseClient,
  user: User,
  form: FormData,
  config: CrmConfig,
): Promise<FormResult> {
  const parsed = buildSchemas(config).profile.safeParse(formToInput(form, config));
  if (!parsed.success) {
    return { ok: false, message: 'Some details need another look.', fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  // Runs as the creator: RLS limits this to their own row, and column
  // privileges stop them changing their status or the team's notes.
  const { data, error } = await supabase
    .from('creators')
    .update(toRecord(parsed.data as Record<string, unknown>))
    .eq('auth_user_id', user.id)
    .select('id');
  if (error || !data?.length) {
    console.error('profile update failed', error?.code, error?.message);
    return { ok: false, message: 'We could not save your changes. Please try again.' };
  }
  return { ok: true, kind: 'signed_in' };
}

/** Every creator, a thousand at a time (Supabase returns at most 1,000 rows per call). */
export async function listAllCreators(supabase: SupabaseClient): Promise<Creator[]> {
  const out: Creator[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.rpc('admin_list_creators', { p_offset: offset, p_limit: 1000 });
    if (error) throw error;
    const page = (data ?? []) as Creator[];
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

export async function getCreator(supabase: SupabaseClient, id: string): Promise<Creator | null> {
  const { data, error } = await supabase.rpc('admin_get_creator', { p_id: id });
  if (error) return null;
  return ((data ?? []) as Creator[])[0] ?? null;
}
