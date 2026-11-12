/**
 * The CRM table's rows as HTML. One function draws them for both the server
 * render (which works without JavaScript) and the browser's instant
 * filtering, so the two can never disagree.
 */
import type { CrmConfig, DetailItem, ProfileStep, RepeatDef } from './types';
import type { CreatorRow } from './query';
import { APPLICATION_STATUSES, labelFor } from './options';
import { fmtAge, fmtCompact, fmtDate, fmtMoney } from './format';
import { ageOn, itemsOf, socialHandle } from './validation';

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

const blank = '<span class="crm-blank" aria-label="none">&middot;</span>';

// The handle, with its follower count beside it in muted figures.
const social = (url: string | null, count: number | null) =>
  url
    ? `<a href="${esc(url)}" target="_blank" rel="noreferrer" class="crm-link" title="${esc(socialHandle(url))}">${esc(socialHandle(url))}</a>${
        count === null ? '' : ` <span class="crm-muted crm-count">${esc(fmtCompact(count))}</span>`
      }`
    : blank;


export const statusChip = (status: string) =>
  `<span class="crm-chip" data-status="${esc(status)}">${esc(labelFor(APPLICATION_STATUSES, status))}</span>`;

/** One item in a few words, from its `summary` fields: "Rex: Tabby, 3 years". */
export function itemSummary(step: ProfileStep & { repeat: RepeatDef }, item: DetailItem): string {
  const parts = step.repeat.summary
    .map((key) => {
      const field = step.fields.find((f) => f.key === key);
      const v = item[key];
      if (!field || v === undefined || v === '') return '';
      if (field.type === 'date') {
        const age = typeof v === 'string' ? fmtAge(v) : '';
        return /^\d+$/.test(age) ? `${age} ${age === '1' ? 'year' : 'years'}` : age;
      }
      if (field.type === 'select') return labelFor(field.options, v as string);
      if (field.type === 'multi') return (v as string[]).map((x) => labelFor(field.options, x)).join(', ');
      return String(v);
    })
    .filter(Boolean);
  const [first, ...rest] = parts;
  return rest.length ? `${first}: ${rest.join(', ')}` : first ?? '';
}

const repeatSteps = (config: CrmConfig) => config.steps.filter((s): s is ProfileStep & { repeat: RepeatDef } => Boolean(s.repeat));

// Name, then what the team triages by (status, when they joined), then contact
// and reach. Wide enough to fit 1296px, the space at a 1440 screen. A repeated
// step (their pets) sits after location.
export const tableHeaders = (config: CrmConfig) => [
  { label: 'Name', sticky: true },
  { label: 'Status' },
  { label: 'Joined' },
  { label: 'Email' },
  { label: 'Location' },
  ...repeatSteps(config).map((s) => ({ label: s.repeat.tableLabel })),
  { label: 'Age', numeric: true },
  { label: 'Instagram' },
  { label: 'TikTok' },
  { label: 'YouTube' },
  { label: 'Rate', numeric: true },
  { label: 'Gifting' },
  { label: 'Login' },
];

export function rowHtml(c: CreatorRow, config: CrmConfig): string {
  const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || '<span class="muted">No name given</span>';
  const href = `/admin/creators/${esc(c.id)}/`;
  const place = [c.town, c.postcode].filter(Boolean).join(', ');
  return `<tr data-href="${href}">
    <td class="crm-sticky"><a href="${href}" class="crm-name" title="${esc(name.replace(/<[^>]+>/g, ''))}">${c.first_name || c.last_name ? esc(name) : name}</a></td>
    <td>${statusChip(c.application_status)}</td>
    <td class="crm-muted crm-nowrap">${esc(fmtDate(c.created_at))}</td>
    <td class="crm-muted crm-truncate" title="${esc(c.email)}">${esc(c.email)}</td>
    <td class="crm-truncate crm-place" title="${esc(place)}">${place ? esc(place) : blank}${c.country && c.country !== config.countries[0]?.value ? ` <span class="crm-muted">${esc(c.country)}</span>` : ''}</td>
    ${repeatSteps(config).map((s) => {
      const items = itemsOf(c.details, s.repeat).map((item) => itemSummary(s, item)).filter(Boolean);
      return items.length
        ? `<td class="crm-truncate" title="${esc(items.join('\n'))}">${esc(items[0])}${items.length > 1 ? ` <span class="crm-muted">+${items.length - 1}</span>` : ''}</td>`
        : `<td>${blank}</td>`;
    }).join('')}
    <td class="crm-num" title="${c.date_of_birth ? esc(fmtDate(c.date_of_birth)) : ''}">${c.date_of_birth ? ageOn(c.date_of_birth) : blank}</td>
    <td class="crm-nowrap">${social(c.instagram_url, c.instagram_followers)}</td>
    <td class="crm-nowrap">${social(c.tiktok_url, c.tiktok_followers)}</td>
    <td class="crm-nowrap">${social(c.youtube_url, c.youtube_followers)}</td>
    <td class="crm-num">${c.rate_per_post === null ? blank : esc(fmtMoney(c.rate_per_post, config.currency))}</td>
    <td>${c.join_gifting_network ? 'Yes' : '<span class="crm-muted">No</span>'}</td>
    <td>${c.has_login ? 'Yes' : `<span class="crm-muted">${c.source === 'import' ? 'Not yet' : 'No'}</span>`}</td>
  </tr>`;
}
