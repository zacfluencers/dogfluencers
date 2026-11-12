import type { DetailValue, FieldDef } from './types';
import { labelFor } from './options';

/** Display formatting for the CRM. Dates are UK style: 14 Oct 2026. */

export const fmtDate = (iso: string | null | undefined, locale = 'en-GB') =>
  iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/London' }) : '';

export const fmtNumber = (n: number | null | undefined, locale = 'en-GB') =>
  n === null || n === undefined ? '' : n.toLocaleString(locale);

/** 12,500 → "12.5K". Blank for no value. */
export const fmtCompact = (n: number | null | undefined, locale = 'en-GB') =>
  n === null || n === undefined ? '' : new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export const fmtMoney = (n: number | null | undefined, symbol: string) =>
  n === null || n === undefined ? '' : `${symbol}${Number(n).toLocaleString('en-GB', { maximumFractionDigits: 2 })}`;

/** A date of birth as an age: "3", or "8 months" under one. */
export function fmtAge(iso: string, today = new Date()): string {
  const [y, m, d] = iso.split('-').map(Number);
  let months = (today.getFullYear() - y) * 12 + (today.getMonth() + 1 - m);
  if (today.getDate() < d) months -= 1;
  if (months < 0) return '';
  if (months < 12) return months === 1 ? '1 month' : `${months} months`;
  return String(Math.floor(months / 12));
}

export const fullName = (c: { first_name: string | null; last_name: string | null }) =>
  [c.first_name, c.last_name].filter(Boolean).join(' ').trim();

/** Mailchimp's view of a creator, for the team. */
export const emailMarketingLabel = (c: { email_marketing?: string | null; email_marketing_at?: string | null; mailchimp_synced_at?: string | null }) => {
  const since = c.email_marketing_at ? ` since ${fmtDate(c.email_marketing_at)}` : '';
  if (c.email_marketing === 'subscribed') return 'Subscribed in Mailchimp';
  if (c.email_marketing === 'unsubscribed') return `Unsubscribed${since}`;
  if (c.email_marketing === 'cleaned') return `Address bounced${since}`;
  return c.mailchimp_synced_at ? 'In Mailchimp' : 'Not in Mailchimp yet';
};

/** One answer as the team reads it: option labels, a date with its age. */
export function answerText(field: FieldDef, value: DetailValue | undefined): string | null {
  if (value === undefined || value === '' || (Array.isArray(value) && !value.length)) return null;
  if (field.type === 'select') return labelFor(field.options, value as string);
  if (field.type === 'multi') return (value as string[]).map((x) => labelFor(field.options, x)).join(', ');
  if (field.type === 'date' && typeof value === 'string') {
    const age = fmtAge(value);
    return `${fmtDate(value)}${age ? ` (${/^\d+$/.test(age) ? `age ${age}` : age})` : ''}`;
  }
  return String(value);
}
