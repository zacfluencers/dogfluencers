/**
 * Tells creators imported from the old WordPress site that the new site is
 * live, and asks them to set up a login (/creator/claim/) and check their
 * profile. Emails go through Resend from the verified send subdomain, with
 * replies to the public contact address.
 *
 *   npx tsx --env-file=.env scripts/announce-new-site.ts --test you@example.com
 *   npx tsx --env-file=.env scripts/announce-new-site.ts --list
 *   npx tsx --env-file=.env scripts/announce-new-site.ts --send
 *   npx tsx --env-file=.env scripts/announce-new-site.ts --only a@x.com,b@y.com
 *
 * --test sends one copy to the address given and nothing else. --list counts
 * who would get it. --send emails every imported creator who hasn't set up a
 * login yet: only with the client's say-so. --only sends to just the imported
 * creators named, e.g. after correcting an address that bounced.
 */
import { createClient } from '@supabase/supabase-js';
import { agency } from '../src/agency/config';

const { PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, RESEND_API_KEY: resendKey } = process.env;
const [mode, testTo] = process.argv.slice(2);
if (!url || !key || !resendKey || !['--test', '--list', '--send', '--only'].includes(mode ?? '') || ((mode === '--test' || mode === '--only') && !testTo)) {
  console.error('Usage: npx tsx --env-file=.env scripts/announce-new-site.ts --test <email> | --list | --send | --only <emails>');
  process.exit(1);
}

const SITE = agency.site.url.replace(/\/$/, '');
const FROM = `${agency.name} <hello@send.dogfluencers.agency>`;
const REPLY_TO = agency.contact.email;
const SUBJECT = 'Our new website is live';

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function email(firstName: string | null, to: string) {
  const hi = firstName ? `Hi ${escape(firstName.trim())},` : 'Hi,';
  const claim = `${SITE}/creator/claim/`;
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:40px 24px;background:#f6f6f6;color:#090909;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:500">
    <div style="max-width:520px;margin:0 auto">
      <p style="margin:0 0 32px;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6a6a6a">${agency.name}</p>
      <h1 style="margin:0 0 24px;font-size:28px;line-height:1.1;font-weight:700;letter-spacing:-.04em;text-transform:uppercase">Our new website is live</h1>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.55">${hi}</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.55">You joined the ${agency.name} creator network through our old website. We've moved to a new one, and your details have come with us.</p>
      <p style="margin:0 0 32px;font-size:16px;line-height:1.55">Set up your login to see and update your profile.</p>
      <a href="${claim}" style="display:inline-block;padding:16px 28px;background:#4e52ed;color:#f6f6f6;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">Set up your login</a>
      <p style="margin:24px 0 0;font-size:14px;line-height:1.55">Enter ${escape(to)} and we'll email you a link to choose a password.</p>
    </div>
  </body>
</html>`;
  const text = `${hi.replace(/&amp;/g, '&')}

You joined the ${agency.name} creator network through our old website. We've moved to a new one, and your details have come with us.

Set up your login to see and update your profile.

Set up your login: ${claim}
Enter ${to} and we'll email you a link to choose a password.`;
  return { from: FROM, to: [to], reply_to: REPLY_TO, subject: SUBJECT, html, text };
}

async function sendBatch(messages: ReturnType<typeof email>[]) {
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

if (mode === '--test') {
  await sendBatch([email('Zac', testTo!)]);
  console.log(`Test sent to ${testTo}`);
  process.exit(0);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await db
  .from('creators')
  .select('first_name, email')
  .eq('source', 'import')
  .is('auth_user_id', null)
  .not('email', 'is', null);
if (error) throw error;
const only = mode === '--only' ? new Set(testTo!.split(',').map((e) => e.trim().toLowerCase())) : null;
const recipients = data.filter((c) => c.email?.includes('@') && (!only || only.has(c.email)));
console.log(`${recipients.length} imported creators without a login`);

if (mode === '--send' || mode === '--only') {
  // Resend takes up to 100 per batch call and a few calls a second.
  for (let i = 0; i < recipients.length; i += 100) {
    await sendBatch(recipients.slice(i, i + 100).map((c) => email(c.first_name, c.email)));
    console.log(`Sent ${Math.min(i + 100, recipients.length)} of ${recipients.length}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
}
