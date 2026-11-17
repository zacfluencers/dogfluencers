/**
 * The morning applications email, at 9am UK time. Vercel schedules run in
 * UTC, so vercel.json calls this at 8:00 and 9:00 UTC and whichever run isn't
 * 9am in the UK (summer time or not) stops without sending. Vercel sends
 * CRON_SECRET as a bearer token, so nobody else can trigger it.
 *
 * ?dry=1 shows what would be sent, and whether sending is switched on;
 * ?to=<email> sends a test to one person.
 */
import type { APIRoute } from 'astro';
import { agency } from '../../../agency/config';
import { crm } from '../../../agency/crm';
import { buildDigest, sendDigest, ukHour } from '../../../system/crm/digest';
import { isCrmConfigured, serviceClient } from '../../../system/crm/supabase';

export const prerender = false;

const env = (name: string) => (import.meta.env[name] as string | undefined) || process.env[name];

export const GET: APIRoute = async ({ request, url }) => {
  const secret = env('CRON_SECRET');
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Off until the team switches it on (CRM_DIGEST_ENABLED=true), so a site
  // under test never sends on its own. ?dry=1 still works.
  // String(): Astro inlines a build-time "true" as the boolean true.
  const enabled = String(env('CRM_DIGEST_ENABLED')) === 'true';
  if (!isCrmConfigured()) return Response.json({ sent: false, skipped: 'CRM not configured' });

  const dry = url.searchParams.get('dry') === '1';
  const testTo = url.searchParams.get('to');
  // Daily housekeeping, before the hour check so it runs whichever UTC run
  // this is: delete signups that never confirmed their email within a week
  // (likely bots), and their logins.
  let purged = 0;
  if (!dry && !testTo) {
    const { data, error } = await serviceClient().rpc('purge_unconfirmed_signups', { p_days: 7 });
    if (error) console.error('purge unconfirmed signups failed', error.code, error.message);
    else purged = Number(data ?? 0);
  }

  if (!dry && !testTo && ukHour() !== 9) return Response.json({ sent: false, skipped: 'not 9am in the UK', purged });

  const digest = await buildDigest(agency.site.url, agency.name, crm.emailTheme);
  if (dry) return Response.json({ sent: false, dry: true, enabled, ...digest });
  if (!enabled) return Response.json({ sent: false, skipped: 'CRM_DIGEST_ENABLED is not true' });
  if (!digest.send) return Response.json({ sent: false, total: digest.total, pending: digest.pending });

  const apiKey = env('RESEND_API_KEY');
  if (!apiKey) return Response.json({ error: 'RESEND_API_KEY missing' }, { status: 503 });
  const subject = testTo ? `[Test] ${digest.subject}` : digest.subject;
  await sendDigest(crm, apiKey, { ...digest, subject }, testTo ? [testTo] : undefined);
  return Response.json({ sent: true, subject });
};
