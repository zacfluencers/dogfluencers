/**
 * Enquiry form handling: validate a submission and email it through Resend.
 *
 * Agency-agnostic. The route in `src/pages` passes in the agency config and the
 * API key; nothing here knows which agency it is serving.
 */
import type { AgencyConfig } from '../types/agency';
import type { EmailTheme } from '../crm/types';
import { emailButton, emailHeading, emailLayout } from '../crm/emails';
import { esc } from '../crm/table';

/** Field names, labels and limits, in the order they appear in the email. */
const FIELDS = [
  { name: 'name', label: 'Name', required: true, max: 200 },
  { name: 'company', label: 'Company', required: true, max: 200 },
  { name: 'email', label: 'Email', required: true, max: 320 },
  { name: 'website', label: 'Website', required: false, max: 500 },
  { name: 'service', label: 'Service required', required: true, max: 200 },
  { name: 'package', label: 'Package', required: false, max: 200 },
  { name: 'category', label: 'Product category', required: false, max: 200 },
  { name: 'budget', label: 'Budget', required: false, max: 200 },
  { name: 'timing', label: 'Campaign timing', required: false, max: 200 },
  { name: 'quantity', label: 'Estimated product quantity', required: false, max: 200 },
  { name: 'audience', label: 'Target audience', required: false, max: 500 },
  { name: 'objective', label: 'Campaign objective', required: true, max: 5000 },
  { name: 'notes', label: 'Anything else', required: false, max: 5000 },
] as const;

/** Hidden field real visitors never fill. Anything in it is a bot. */
export const HONEYPOT_FIELD = 'fax';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EnquiryResult =
  | { ok: true; spam?: boolean }
  | { ok: false; status: number; error: string };

export async function handleEnquiry(
  form: FormData,
  agency: AgencyConfig,
  apiKey: string | undefined,
  /** The agency's email look; without it the email is plain text only. */
  theme?: EmailTheme,
): Promise<EnquiryResult> {
  // Pretend success so a bot learns nothing.
  if (String(form.get(HONEYPOT_FIELD) ?? '').trim()) return { ok: true, spam: true };

  const values: Record<string, string> = {};
  for (const field of FIELDS) {
    const value = String(form.get(field.name) ?? '').trim();
    if (field.required && !value) return { ok: false, status: 400, error: `${field.label} is required.` };
    if (value.length > field.max) return { ok: false, status: 400, error: `${field.label} is too long.` };
    values[field.name] = value;
  }
  if (!EMAIL.test(values.email)) return { ok: false, status: 400, error: 'Email address looks invalid.' };

  const target = agency.contact.enquiries;
  if (!target || !apiKey) {
    console.error('Enquiry received but delivery is not configured (enquiries or RESEND_API_KEY missing).');
    return { ok: false, status: 503, error: 'Enquiries are not configured.' };
  }

  const text = FIELDS.filter((field) => values[field.name])
    .map((field) => `${field.label}:\n${values[field.name]}`)
    .join('\n\n');

  const subject = `New enquiry: ${values.company} (${values.name})`;
  const html = theme ? enquiryHtml(theme, agency.name, values) : undefined;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: target.from,
      to: [target.to],
      reply_to: values.email,
      subject,
      text: `New enquiry from the ${agency.name} website.\n\n${text}\n`,
      ...(html ? { html } : {}),
    }),
  });

  if (!response.ok) {
    console.error('Resend rejected the enquiry email', response.status, await response.text());
    return { ok: false, status: 502, error: 'The enquiry could not be sent.' };
  }
  return { ok: true };
}

/** The team's copy of an enquiry: every answer in a two-column list, and a reply button. */
export function enquiryHtml(theme: EmailTheme, agencyName: string, values: Record<string, string>): string {
  const rows = FIELDS.filter((field) => values[field.name])
    .map((field) => {
      const long = field.name === 'objective' || field.name === 'notes' || field.name === 'audience';
      const value = esc(values[field.name]).replace(/\n/g, '<br>');
      return `<tr>
        <td style="padding:11px 14px 11px 0;border-top:1px solid #eee4d6;font-size:14px;line-height:1.5;color:${theme.muted};width:34%;vertical-align:top">${esc(field.label)}</td>
        <td style="padding:11px 0;border-top:1px solid #eee4d6;font-size:${long ? 15 : 14}px;line-height:1.6;font-weight:${long ? 400 : 600};color:${theme.ink};vertical-align:top">${value}</td>
      </tr>`;
    })
    .join('');
  return emailLayout(
    theme,
    agencyName,
    `${emailHeading(theme, 'New enquiry')}
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${theme.ink}"><strong>${esc(values.company)}</strong> sent a brief through the ${esc(agencyName)} website.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:${theme.font}">${rows}</table>
    ${emailButton(theme, `mailto:${values.email}?subject=${encodeURIComponent(`Re: your ${agencyName} enquiry`)}`, `Reply to ${values.name.split(' ')[0]}`)}`,
  );
}
