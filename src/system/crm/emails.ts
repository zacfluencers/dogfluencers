/**
 * The CRM's own emails, laid out in the agency's `emailTheme`, and the one
 * sender they share (Resend). Server-only.
 *
 * Every send to a creator goes through `mayEmail`, so while CRM_EMAIL_ALLOWLIST
 * is set (testing) nobody outside it is emailed.
 */
import type { Creator, CrmConfig, EmailTheme, ProfileStep, RepeatDef } from './types';
import { mayEmail } from './supabase';
import { esc, itemSummary } from './table';
import { fmtNumber, fullName } from './format';
import { itemsOf, socialHandle } from './validation';

/**
 * A white card on the agency's ground, with the agency's logo above it (or
 * its name, if it has no logo) and, if the theme has one, a dark footer with
 * icons and the agency's lines. Tables throughout, so Outlook renders it.
 */
export function emailLayout(theme: EmailTheme, brand: string, body: string): string {
  const f = theme.footer;
  const top = theme.logo
    ? `<img src="${esc(theme.logo.src)}" width="${theme.logo.width}" alt="${esc(theme.logo.alt)}" style="display:block;border:0;width:${theme.logo.width}px;height:auto">`
    : `<p style="margin:0;font-size:13px;font-weight:700;color:${theme.accent}">${esc(brand)}</p>`;
  const icons = f?.icons?.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px"><tr>${f.icons
        .map((i) => `<td style="padding:0 10px 0 0"><a href="${esc(i.href)}" style="text-decoration:none"><img src="${esc(i.src)}" width="32" height="32" alt="${esc(i.alt)}" style="display:block;border:0;width:32px;height:32px"></a></td>`)
        .join('')}</tr></table>`
    : '';
  const footer = f
    ? `<tr><td style="padding-top:16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${f.background}" style="background:${f.background};border-radius:24px">
          <tr><td style="padding:30px 36px">
            ${f.logo ? `<img src="${esc(f.logo.src)}" width="${f.logo.width}" alt="${esc(f.logo.alt)}" style="display:block;border:0;width:${f.logo.width}px;height:auto;margin:0 0 18px">` : ''}
            ${icons}
            ${f.lines.map((line) => `<p style="margin:0 0 8px;font-family:${theme.font};font-size:13px;line-height:1.6;color:${f.muted}">${line}</p>`).join('')}
          </td></tr>
        </table>
      </td></tr>`
    : '';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light only">
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:${theme.ground};color:${theme.ink};font-family:${theme.font}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${theme.ground}" style="background:${theme.ground}"><tr><td align="center" style="padding:32px 12px 40px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
      <tr><td style="padding:0 8px 24px">${top}</td></tr>
      <tr><td bgcolor="${theme.card}" style="background:${theme.card};border-radius:24px;padding:40px 36px">
        ${body}
      </td></tr>
      ${footer}
    </table>
  </td></tr></table>
</body></html>`;
}

/** Condensed capitals, with the theme's line under them if it has one. */
export const emailHeading = (theme: EmailTheme, text: string) =>
  `<h1 style="margin:0 0 14px;font-family:${theme.headingFont ?? theme.font};font-stretch:condensed;font-size:32px;line-height:1.08;font-weight:800;letter-spacing:-0.5px;text-transform:uppercase;color:${theme.ink}">${esc(text)}</h1>` +
  (theme.rule
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 22px"><tr><td height="5" bgcolor="${theme.rule}" style="height:5px;line-height:5px;font-size:5px;background:${theme.rule};border-radius:999px">&nbsp;</td></tr></table>`
    : '');

/** A pill button, as a table cell so Outlook keeps its colour. */
export const emailButton = (theme: EmailTheme, href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0"><tr><td bgcolor="${theme.button}" style="border-radius:999px"><a href="${esc(href)}" style="display:inline-block;padding:15px 30px;font-family:${theme.font};font-size:15px;font-weight:700;line-height:1;color:${theme.buttonInk};text-decoration:none;border-radius:999px">${esc(label)}&nbsp;&rarr;</a></td></tr></table>`;

export interface Email {
  from: string;
  to: string[];
  replyTo?: string[];
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(apiKey: string, email: Email): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: email.from,
      to: email.to,
      ...(email.replyTo?.length ? { reply_to: email.replyTo } : {}),
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });
  if (!response.ok) throw new Error(`Resend rejected the email: ${response.status} ${await response.text()}`);
}

/**
 * The welcome email for a creator the team has just approved, from the
 * agency's `welcome` copy. Null if the agency hasn't written one.
 */
export function welcomeEmail(config: CrmConfig, brand: string, origin: string, firstName: string | null) {
  const w = config.welcome;
  if (!w) return null;
  const t = config.emailTheme;
  const profile = `${origin}/creator/profile/`;
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const p = (text: string, top = 16) => `<p style="margin:${top}px 0 0;font-size:16px;line-height:1.65;color:${t.ink}">${esc(text)}</p>`;
  const h2 = (text: string) => `<h2 style="margin:36px 0 0;font-family:${t.headingFont ?? t.font};font-stretch:condensed;font-size:22px;line-height:1.15;font-weight:800;letter-spacing:-0.3px;text-transform:uppercase;color:${t.ink}">${esc(text)}</h2>`;

  const html = emailLayout(
    t,
    brand,
    `${emailHeading(t, greeting)}
    ${p(w.intro, 0)}
    ${h2('What happens next')}
    ${w.steps.map((s) => `<h3 style="margin:20px 0 0;font-size:16px;line-height:1.35;color:${t.ink}">${esc(s.title)}</h3>${p(s.body, 6)}`).join('')}
    ${emailButton(t, profile, 'View my profile')}
    ${h2('A few quick tips')}
    <ul style="margin:12px 0 0;padding:0 0 0 20px;font-size:16px;line-height:1.65;color:${t.ink}">${w.tips.map((tip) => `<li style="margin-top:8px">${esc(tip)}</li>`).join('')}</ul>
    ${p(w.help, 28)}
    ${p(w.close)}
    <p style="margin:16px 0 0;font-size:16px;line-height:1.6;font-weight:700;color:${t.ink}">${esc(w.signoff)}</p>`,
  );

  const text = [
    greeting,
    w.intro,
    'What happens next',
    ...w.steps.map((s) => `${s.title}\n${s.body}`),
    `View my profile: ${profile}`,
    'A few quick tips',
    ...w.tips.map((tip) => `- ${tip}`),
    w.help,
    w.close,
    w.signoff,
  ].join('\n\n');

  return { subject: w.subject, html, text };
}

/**
 * Sends the welcome email to one creator. Returns why it didn't send, or
 * null when it did. Never throws: approving someone must not fail because
 * an email couldn't go.
 */
export async function sendWelcome(
  config: CrmConfig,
  brand: string,
  origin: string,
  apiKey: string | undefined,
  creator: { email: string; first_name: string | null },
): Promise<string | null> {
  const email = welcomeEmail(config, brand, origin, creator.first_name);
  if (!email) return 'No welcome email is set up.';
  if (!apiKey) return 'Email isn’t connected yet (RESEND_API_KEY).';
  if (!mayEmail(creator.email)) return 'Not sent: this address is outside the testing allowlist.';
  try {
    await sendEmail(apiKey, { from: config.digest.from, to: [creator.email], replyTo: config.welcome?.replyTo, ...email });
    return null;
  } catch (error) {
    console.error('welcome email failed', error);
    return 'The welcome email couldn’t be sent. Try again later.';
  }
}

type Account = { platform: string; url: string; followers: number | null };

const accountsOf = (c: Creator): Account[] =>
  [
    { platform: 'Instagram', url: c.instagram_url, followers: c.instagram_followers },
    { platform: 'TikTok', url: c.tiktok_url, followers: c.tiktok_followers },
    { platform: 'YouTube', url: c.youtube_url, followers: c.youtube_followers },
  ].filter((a): a is Account => Boolean(a.url));

/** Whether approving this creator should tell the team, for a showcase post. */
export const isShowcaseCreator = (config: CrmConfig, c: Creator) =>
  Boolean(config.showcase) && accountsOf(c).some((a) => (a.followers ?? 0) >= config.showcase!.minFollowers);

/**
 * Tells the team a creator with a big following has just been approved, with
 * what a showcase post needs: where they are, their accounts and follower
 * counts, their repeated items (pets) and a link to their CRM page.
 */
export function showcaseEmail(config: CrmConfig, brand: string, origin: string, c: Creator) {
  const s = config.showcase!;
  const t = config.emailTheme;
  const name = fullName(c) || c.email;
  const crmLink = `${origin}/admin/creators/${c.id}/`;
  const where = [c.town, c.county].filter(Boolean).join(', ');
  const accounts = accountsOf(c);
  const biggest = accounts
    .filter((a) => (a.followers ?? 0) >= s.minFollowers)
    .map((a) => a.platform)
    .join(' and ');
  const min = s.minFollowers.toLocaleString('en-GB');
  const lead = `They have ${min}+ followers on ${biggest}, so they could be a great fit for a ${s.label} post.${where ? ` Based in ${where}.` : ''}`;
  const groups = config.steps
    .filter((step): step is ProfileStep & { repeat: RepeatDef } => Boolean(step.repeat))
    .map((step) => ({ label: step.repeat.tableLabel, items: itemsOf(c.details, step.repeat).map((item) => itemSummary(step, item)).filter(Boolean) }))
    .filter((g) => g.items.length);

  const label = (text: string, top = 28) =>
    `<p style="margin:${top}px 0 0;font-size:13px;line-height:1.4;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:${t.accent}">${esc(text)}</p>`;
  const row = (main: string, aside = '') =>
    `<tr><td style="padding:12px 0;border-top:1px solid #efe4d6;font-size:16px;line-height:1.5;color:${t.ink}">${main}${aside ? `<span style="color:${t.muted}"> &middot; ${aside}</span>` : ''}</td></tr>`;
  const table = (rows: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0">${rows}</table>`;

  const html = emailLayout(
    t,
    brand,
    `${label(s.label, 0)}
    <div style="height:10px;line-height:10px;font-size:10px">&nbsp;</div>
    ${emailHeading(t, `${name} just joined`)}
    <p style="margin:0;font-size:16px;line-height:1.65;color:${t.ink}">${esc(lead)}</p>
    ${label('Accounts')}
    ${table(accounts.map((a) => row(`<span style="color:${t.muted}">${esc(a.platform)}</span>&nbsp; <a href="${esc(a.url)}" style="color:${t.ink};font-weight:700;text-decoration:none">${esc(socialHandle(a.url))}</a>`, a.followers === null ? '' : `${esc(fmtNumber(a.followers))} followers`)).join(''))}
    ${groups.map((g) => `${label(g.label)}${table(g.items.map((item) => row(esc(item))).join(''))}`).join('')}
    ${emailButton(t, crmLink, 'View in the CRM')}
    <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:${t.muted}">Sent when a creator with ${min}+ followers on any platform is approved in the CRM.</p>`,
  );

  const text = [
    `${s.label}: ${name} just joined`,
    lead,
    ['Accounts', ...accounts.map((a) => `${a.platform}: ${socialHandle(a.url)}${a.followers === null ? '' : ` (${fmtNumber(a.followers)} followers)`} ${a.url}`)].join('\n'),
    ...groups.map((g) => [g.label, ...g.items].join('\n')),
    `View in the CRM: ${crmLink}`,
  ].join('\n\n');

  return { subject: `${s.label}: ${name}`, html, text };
}

/** Sends the showcase email, if this creator qualifies. Never throws. */
export async function sendShowcase(config: CrmConfig, brand: string, origin: string, apiKey: string | undefined, creator: Creator): Promise<void> {
  if (!apiKey || !isShowcaseCreator(config, creator)) return;
  try {
    await sendEmail(apiKey, { from: config.digest.from, to: config.showcase!.to, ...showcaseEmail(config, brand, origin, creator) });
  } catch (error) {
    console.error('showcase email failed', error);
  }
}
