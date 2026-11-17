/**
 * CSV export of every creator field, in reading order. Passwords live only in
 * Supabase Auth, so they can never end up here.
 */
import type { Creator, CrmConfig, DetailItem, DetailValue, FieldDef } from './types';
import { APPLICATION_STATUSES, GENDERS, labelFor } from './options';
import { formatPhone, itemsOf } from './validation';
import { emailMarketingLabel } from './format';

type Column = { header: string; value: (c: Creator) => string | number | null };

const answer = (f: FieldDef, v: DetailValue | undefined): string | null => {
  if (v === undefined || v === '') return null;
  if (f.type === 'select') return labelFor(f.options, v as string);
  if (f.type === 'multi') return (v as string[]).map((x) => labelFor(f.options, x)).join('; ');
  return v as string;
};
const header = (f: FieldDef) => (f.teamLabel ?? f.label).replace(/\?$/, '');

/**
 * `items` is how many items of each repeated step to give columns to (the
 * most any exported creator has): "Pet 1: Colour", "Pet 2: Colour".
 */
export function csvColumns(config: CrmConfig, items: Record<string, number> = {}): Column[] {
  const agency: Column[] = config.steps.flatMap((step): Column[] => {
    const repeat = step.repeat;
    if (!repeat) return step.fields.map((f) => ({ header: header(f), value: (c) => answer(f, c.details?.[f.key] as DetailValue | undefined) }));
    const count = Math.max(1, items[repeat.key] ?? 1);
    return Array.from({ length: count }, (_, n) =>
      step.fields.map((f): Column => ({
        header: `${repeat.item} ${n + 1}: ${header(f)}`,
        value: (c) => {
          const item: DetailItem | undefined = itemsOf(c.details, repeat)[n];
          const text = answer(f, item?.[f.key]);
          const estimated = Array.isArray(item?._estimated) && item._estimated.includes(f.key);
          return text && estimated ? `${text} (estimated)` : text;
        },
      })),
    ).flat();
  });

  return [
    { header: 'Creator ID', value: (c) => c.id },
    { header: 'Date joined', value: (c) => c.created_at.slice(0, 10) },
    { header: 'Last updated', value: (c) => c.updated_at.slice(0, 10) },
    { header: 'Source', value: (c) => (c.source === 'import' ? 'Imported from old site' : 'Join form') },
    { header: 'Has a login', value: (c) => (c.auth_user_id ? 'Yes' : 'No') },
    { header: 'Application status', value: (c) => labelFor(APPLICATION_STATUSES, c.application_status) },
    { header: 'First name', value: (c) => c.first_name },
    { header: 'Last name', value: (c) => c.last_name },
    { header: 'Email', value: (c) => c.email },
    { header: 'Phone', value: (c) => formatPhone(c.phone) },
    { header: 'Address line 1', value: (c) => c.address_line_1 },
    { header: 'Address line 2', value: (c) => c.address_line_2 },
    { header: 'Town or city', value: (c) => c.town },
    { header: 'County', value: (c) => c.county },
    { header: 'Postcode', value: (c) => c.postcode },
    { header: 'Country', value: (c) => c.country },
    { header: 'Gender', value: (c) => labelFor(GENDERS, c.gender) },
    { header: 'Date of birth', value: (c) => c.date_of_birth },
    ...agency,
    ...(config.clothingSizes?.length
      ? ([
          { header: 'Top size', value: (c) => c.clothing_size },
          { header: 'Bottoms size', value: (c) => c.trouser_size },
          { header: 'Shoe size', value: (c) => c.shoe_size },
          { header: 'Dietary requirements', value: (c) => c.dietary_requirements },
          { header: 'Allergies', value: (c) => c.allergies },
        ] as Column[])
      : []),
    { header: 'Instagram', value: (c) => c.instagram_url },
    { header: 'Instagram followers', value: (c) => c.instagram_followers },
    { header: 'TikTok', value: (c) => c.tiktok_url },
    { header: 'TikTok followers', value: (c) => c.tiktok_followers },
    { header: 'YouTube', value: (c) => c.youtube_url },
    { header: 'YouTube followers', value: (c) => c.youtube_followers },
    { header: `Rate per post or reel (${config.currency})`, value: (c) => (c.rate_per_post === null ? null : Number(c.rate_per_post)) },
    { header: 'Gifting network', value: (c) => (c.join_gifting_network ? 'Yes' : 'No') },
    { header: 'Anything else', value: (c) => c.additional_notes },
    { header: 'Marketing emails', value: (c) => emailMarketingLabel(c) },
    { header: 'Privacy consent given', value: (c) => c.privacy_consent_at?.slice(0, 10) ?? null },
    { header: 'Team notes', value: (c) => c.admin_notes },
  ];
}

function cell(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  // Stop spreadsheet apps treating text as a formula (CSV injection).
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function creatorsToCsv(rows: Creator[], config: CrmConfig): string {
  const items: Record<string, number> = {};
  for (const step of config.steps) if (step.repeat) {
    items[step.repeat.key] = Math.max(1, ...rows.map((r) => itemsOf(r.details, step.repeat!).length));
  }
  const columns = csvColumns(config, items);
  const lines = [columns.map((c) => cell(c.header)).join(',')];
  for (const row of rows) lines.push(columns.map((c) => cell(c.value(row))).join(','));
  // Byte-order mark so Excel opens accents and emoji correctly.
  return '﻿' + lines.join('\r\n') + '\r\n';
}
