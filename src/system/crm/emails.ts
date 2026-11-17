/**
 * The CRM's own emails, laid out in the agency's `emailTheme`, and the one
 * sender they share (Resend). Server-only.
 *
 * Every send to a creator goes through `mayEmail`, so while CRM_EMAIL_ALLOWLIST
 * is set (testing) nobody outside it is emailed.
 */
import type { CrmConfig, EmailTheme } from './types';
import { mayEmail } from './supabase';
import { esc } from './table';

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
