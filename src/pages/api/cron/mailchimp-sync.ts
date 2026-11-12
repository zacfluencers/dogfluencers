/**
 * Hourly: brings subscription changes back from Mailchimp, then sends new
 * and changed creators to it (src/system/crm/mailchimp.ts). Does nothing
 * until MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID are set, and sends
 * nothing until MAILCHIMP_SYNC_ENABLED=true. Vercel sends
 * CRON_SECRET as a bearer token, so nobody else can trigger it.
 *
 * ?dry=1 names the audience and says how many creators are waiting to go,
 * without sending any.
 */
import type { APIRoute } from 'astro';
import { agency } from '../../../agency/config';
import { crm } from '../../../agency/crm';
import { audienceSummary, pullFromMailchimp, pushToMailchimp } from '../../../system/crm/mailchimp';
import { isCrmConfigured, serviceClient } from '../../../system/crm/supabase';

export const prerender = false;
// The first run sends every creator; later runs only what changed.
export const maxDuration = 300;

const env = (name: string) => (import.meta.env[name] as string | undefined) || process.env[name];

export const GET: APIRoute = async ({ request, url }) => {
  const secret = env('CRON_SECRET');
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const apiKey = env('MAILCHIMP_API_KEY');
  const audienceId = env('MAILCHIMP_AUDIENCE_ID');
  if (!isCrmConfigured() || !apiKey || !audienceId) return Response.json({ skipped: 'Mailchimp not configured' });

  const db = serviceClient();
  // The audience is shared with the group's other contacts: the agency's
  // name as a tag picks out its creators.
  const settings = { apiKey: String(apiKey), audienceId: String(audienceId), audienceTag: agency.name };
  if (url.searchParams.get('dry') === '1') {
    const { data, error } = await db.rpc('mailchimp_pending', { p_limit: 1000 });
    if (error) throw error;
    return Response.json({ dry: true, audience: await audienceSummary(settings, crm), waiting: data?.length ?? 0 });
  }

  // String(): Astro inlines a build-time "true" as the boolean true.
  if (String(env('MAILCHIMP_SYNC_ENABLED')) !== 'true') return Response.json({ skipped: 'MAILCHIMP_SYNC_ENABLED is not true' });

  // Two hours back, so a slow or missed run never leaves a gap.
  const pulled = await pullFromMailchimp(db, settings, new Date(Date.now() - 2 * 60 * 60 * 1000));
  const pushed = await pushToMailchimp(db, settings, crm);
  if (pushed.failed) console.error('mailchimp sync failures', pushed.errors);
  return Response.json({ pulled, pushed });
};
