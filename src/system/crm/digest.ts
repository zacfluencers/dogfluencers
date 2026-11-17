/**
 * The morning email to the team: who applied yesterday (midnight to midnight,
 * UK time), and on Mondays a nudge if any applications are still marked New.
 * No new applications and nothing waiting means no email. Server-only.
 */
import type { CrmConfig, EmailTheme } from './types';
import { emailButton, emailHeading, emailLayout, sendEmail } from './emails';
import { serviceClient } from './supabase';
import { fmtCompact } from './format';
import { esc } from './table';

const TZ = 'Europe/London';
// A busy day lists the first 50 and points to the CRM for the rest.
const LIST_LIMIT = 50;

/** Milliseconds UK time is ahead of UTC at a moment (0 or 1 hour). */
function ukOffset(at: Date) {
  const local = new Date(at.toLocaleString('en-US', { timeZone: TZ }));
  const utc = new Date(at.toLocaleString('en-US', { timeZone: 'UTC' }));
  return local.getTime() - utc.getTime();
}

/** The UTC moment a UK calendar day starts. */
function ukMidnight(y: number, m: number, d: number) {
  const naive = Date.UTC(y, m - 1, d);
  return new Date(naive - ukOffset(new Date(naive - ukOffset(new Date(naive)))));
}

/** Yesterday in the UK, as a UTC range. Fixed boundaries, so each application lands in exactly one email. */
export function ukYesterday(now = new Date()) {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now).split('-').map(Number);
  const end = ukMidnight(y, m, d);
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  const start = ukMidnight(prev.getUTCFullYear(), prev.getUTCMonth() + 1, prev.getUTCDate());
  const isMonday = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'long' }).format(now) === 'Monday';
  const label = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(start);
  return { start, end, isMonday, label };
}

/** The hour of the day in the UK, 0 to 23. */
export const ukHour = (now = new Date()) =>
  Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: 'numeric', hourCycle: 'h23' }).format(now));

export interface NewCreator {
  id: string;
  first_name: string | null;
  last_name: string | null;
  town: string | null;
  instagram_followers: number | null;
  tiktok_followers: number | null;
  youtube_followers: number | null;
}

export async function buildDigest(origin: string, agencyName: string, theme: EmailTheme, now = new Date()) {
  const { start, end, isMonday, label } = ukYesterday(now);
  const db = serviceClient();
  const from = start.toISOString();
  const to = end.toISOString();

  // Applications only, with a confirmed email: creators imported from the old
  // site never count as new, and an unconfirmed signup may be a bot.
  const [fresh, freshCount, waiting] = await Promise.all([
    db
      .from('creators')
      .select('id, first_name, last_name, town, instagram_followers, tiktok_followers, youtube_followers')
      .eq('source', 'signup')
      .not('email_confirmed_at', 'is', null)
      .gte('created_at', from)
      .lt('created_at', to)
      .order('created_at', { ascending: true })
      .limit(LIST_LIMIT),
    db.from('creators').select('id', { count: 'exact', head: true }).eq('source', 'signup').not('email_confirmed_at', 'is', null).gte('created_at', from).lt('created_at', to),
    // Still New, leaving out signups that never confirmed their email (likely bots).
    db.from('creators').select('id', { count: 'exact', head: true }).eq('application_status', 'new').or('source.neq.signup,email_confirmed_at.not.is.null'),
  ]);
  if (fresh.error) throw fresh.error;
  if (freshCount.error) throw freshCount.error;
  if (waiting.error) throw waiting.error;

  const creators = (fresh.data ?? []) as NewCreator[];
  const total = freshCount.count ?? creators.length;
  const pending = waiting.count ?? 0;
  const send = total > 0 || (isMonday && pending > 0);
  return { send, ...renderDigest({ creators, total, pending, label }, origin, agencyName, theme), total, pending };
}

/**
 * Lays out the morning email from its facts: yesterday's applicants, how many
 * there were and how many are still New. Separate from the lookup, so a sample
 * can be rendered with the same code (scripts/preview-emails.ts).
 */
export function renderDigest(
  { creators, total, pending, label }: { creators: NewCreator[]; total: number; pending: number; label: string },
  origin: string,
  agencyName: string,
  theme: EmailTheme,
) {
  const crm = `${origin}/admin/creators/`;
  const name = (c: NewCreator) => [c.first_name, c.last_name].filter(Boolean).join(' ') || 'No name given';
  const reach = (c: NewCreator) =>
    [
      c.instagram_followers !== null && `${fmtCompact(c.instagram_followers)} on Instagram`,
      c.tiktok_followers !== null && `${fmtCompact(c.tiktok_followers)} on TikTok`,
      c.youtube_followers !== null && `${fmtCompact(c.youtube_followers)} on YouTube`,
    ]
      .filter(Boolean)
      .join(', ');

  const subject =
    total > 0
      ? `${total} new creator application${total === 1 ? '' : 's'} on ${label}`
      : `${pending} creator application${pending === 1 ? '' : 's'} still waiting for review`;

  const more = total > creators.length ? total - creators.length : 0;
  const lines = creators.map((c) => `${name(c)}${c.town ? `, ${c.town}` : ''}${reach(c) ? `. ${reach(c)}` : ''}\n${crm}${c.id}/`);
  const text = [
    `${agencyName} creator applications`,
    total > 0 ? `${total} applied on ${label}:` : `Nobody new applied on ${label}.`,
    ...lines,
    more ? `And ${more} more in the CRM.` : '',
    pending > 0 ? `${pending} still marked New. Moving them out of New stops this reminder.` : '',
    `Open the CRM: ${crm}?status=new`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const t = theme;
  const html = emailLayout(
    t,
    `${agencyName} creator applications`,
    `${emailHeading(t, subject)}
    ${creators
      .map(
        (c) => `<p style="margin:0;padding:14px 0;border-top:1px solid #eee4d6;font-size:16px;line-height:1.5"><a href="${esc(`${crm}${c.id}/`)}" style="color:${t.ink};font-weight:700">${esc(name(c))}</a>${c.town ? `, ${esc(c.town)}` : ''}<br><span style="color:${t.muted};font-size:14px">${esc(reach(c))}</span></p>`,
      )
      .join('')}
    ${more ? `<p style="margin:16px 0 0;color:${t.muted}">And ${more} more in the CRM.</p>` : ''}
    ${pending > 0 ? `<p style="margin:24px 0 0;font-size:16px;line-height:1.6">${pending} still marked New. Moving them out of New stops this reminder.</p>` : ''}
    ${emailButton(t, `${crm}?status=new`, 'Open the CRM')}`,
  );

  return { subject, text, html };
}

export async function sendDigest(config: CrmConfig, apiKey: string, email: { subject: string; text: string; html: string }, to = config.digest.to) {
  await sendEmail(apiKey, { from: config.digest.from, to, ...email });
}
