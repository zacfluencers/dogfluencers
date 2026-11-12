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

/** A white card on the agency's ground, with a wordmark line on top. */
export function emailLayout(theme: EmailTheme, brand: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:32px 16px;background:${theme.ground};color:${theme.ink};font-family:${theme.font}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${theme.card};border-radius:24px">
      <tr><td style="padding:36px 32px">
        <p style="margin:0 0 24px;font-size:13px;font-weight:700;color:${theme.accent}">${esc(brand)}</p>
        ${body}
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export const emailHeading = (theme: EmailTheme, text: string) =>
  `<h1 style="margin:0 0 20px;font-family:${theme.headingFont ?? theme.font};font-size:28px;line-height:1.08;font-weight:800;letter-spacing:-.02em;text-transform:uppercase">${esc(text)}</h1>`;

export const emailButton = (theme: EmailTheme, href: string, label: string) =>
  `<p style="margin:28px 0 0"><a href="${esc(href)}" style="display:inline-block;padding:14px 26px;background:${theme.button};color:${theme.buttonInk};text-decoration:none;font-size:15px;font-weight:600;border-radius:999px">${esc(label)}</a></p>`;

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
  const p = (text: string, top = 16) => `<p style="margin:${top}px 0 0;font-size:16px;line-height:1.6;color:${t.muted}">${esc(text)}</p>`;
  const h2 = (text: string) => `<h2 style="margin:32px 0 0;font-size:18px;line-height:1.3;color:${t.ink}">${esc(text)}</h2>`;

  const html = emailLayout(
    t,
    brand,
    `${emailHeading(t, greeting)}
    ${p(w.intro, 0)}
    ${h2('What happens next')}
    ${w.steps.map((s) => `<h3 style="margin:20px 0 0;font-size:16px;line-height:1.35;color:${t.ink}">${esc(s.title)}</h3>${p(s.body, 6)}`).join('')}
    ${emailButton(t, profile, 'View my profile')}
    ${h2('A few quick tips')}
    <ul style="margin:12px 0 0;padding:0 0 0 20px;font-size:16px;line-height:1.6;color:${t.muted}">${w.tips.map((tip) => `<li style="margin-top:8px">${esc(tip)}</li>`).join('')}</ul>
    ${p(w.help, 28)}
    ${p(w.close)}
    <p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:${t.muted}">${esc(w.signoff)}</p>`,
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
