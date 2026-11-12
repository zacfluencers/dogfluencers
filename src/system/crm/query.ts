/**
 * Filtering and sorting for the CRM table, shared by the browser (instant
 * filtering) and the CSV export (which applies the same query server-side,
 * so an export always matches what is on screen).
 */
import type { AgeBand, Creator, CrmConfig, Details, DetailValue, FieldDef, Option, RepeatDef } from './types';
import { AGE_BANDS } from './options';
import { agencyEntries, ageOn, answersOf, itemsOf } from './validation';

/** The slice of a creator the table needs. */
export interface CreatorRow {
  id: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  town: string | null;
  county: string | null;
  postcode: string | null;
  country: string | null;
  gender: string | null;
  date_of_birth: string | null;
  instagram_url: string | null;
  instagram_followers: number | null;
  tiktok_url: string | null;
  tiktok_followers: number | null;
  youtube_url: string | null;
  youtube_followers: number | null;
  rate_per_post: number | null;
  join_gifting_network: boolean;
  application_status: Creator['application_status'];
  source: Creator['source'];
  has_login: boolean;
  /** The agency fields used as filters, and every repeated step's items. */
  details: Details;
}

/** An agency field the CRM can filter on, with the choices its filter offers. */
export interface FilterField {
  field: FieldDef;
  repeat?: RepeatDef;
  options: Option[];
}

export function filterFields(config: CrmConfig): FilterField[] {
  return agencyEntries(config).flatMap(({ field, repeat }): FilterField[] => {
    if (!field.filter) return [];
    if (field.type === 'select' || field.type === 'multi') return [{ field, repeat, options: field.options }];
    if (field.type === 'date' && field.bands?.length) return [{ field, repeat, options: field.bands }];
    return [];
  });
}

/** Whether one answer matches a filter's chosen value. A date matches when its age falls in the band. */
export function answerMatches(f: FilterField, answer: DetailValue, value: string, today = new Date()): boolean {
  if (f.field.type === 'date') {
    const band = (f.options as AgeBand[]).find((b) => b.value === value);
    if (!band || typeof answer !== 'string') return false;
    const years = ageOn(answer, today);
    return years >= band.min && years <= band.max;
  }
  return Array.isArray(answer) ? answer.includes(value) : answer === value;
}

export function toRow(c: Creator, config: CrmConfig): CreatorRow {
  const details: Details = {};
  for (const step of config.steps) if (step.repeat) {
    const items = itemsOf(c.details, step.repeat);
    if (items.length) details[step.repeat.key] = items;
  }
  for (const { field, repeat } of filterFields(config)) {
    if (!repeat && c.details?.[field.key] !== undefined) details[field.key] = c.details[field.key];
  }
  return {
    id: c.id, created_at: c.created_at, first_name: c.first_name, last_name: c.last_name, email: c.email,
    phone: c.phone, town: c.town, county: c.county, postcode: c.postcode, country: c.country, gender: c.gender,
    date_of_birth: c.date_of_birth,
    instagram_url: c.instagram_url, instagram_followers: c.instagram_followers,
    tiktok_url: c.tiktok_url, tiktok_followers: c.tiktok_followers,
    youtube_url: c.youtube_url, youtube_followers: c.youtube_followers,
    rate_per_post: c.rate_per_post === null ? null : Number(c.rate_per_post),
    join_gifting_network: c.join_gifting_network, application_status: c.application_status,
    source: c.source, has_login: Boolean(c.auth_user_id), details,
  };
}

export const SORTS = [
  { value: 'joined_desc', label: 'Newest first' },
  { value: 'joined_asc', label: 'Oldest first' },
  { value: 'followers_desc', label: 'Most followers (total)' },
  { value: 'instagram_desc', label: 'Most Instagram followers' },
  { value: 'tiktok_desc', label: 'Most TikTok followers' },
  { value: 'youtube_desc', label: 'Most YouTube followers' },
  { value: 'age_asc', label: 'Youngest first' },
  { value: 'age_desc', label: 'Eldest first' },
  { value: 'rate_desc', label: 'Highest rate' },
  { value: 'rate_asc', label: 'Lowest rate' },
  { value: 'name_asc', label: 'Name, A to Z' },
] as const;

export type SortKey = (typeof SORTS)[number]['value'];

/** Core filters by name, agency filters as `f.<key>`. */
export type CreatorQuery = Record<string, string | undefined> & { q?: string; sort?: string };

export const CORE_FILTERS = ['q', 'status', 'gender', 'age', 'gifting', 'country', 'source', 'sort'] as const;

export const totalFollowers = (c: Pick<CreatorRow, 'instagram_followers' | 'tiktok_followers' | 'youtube_followers'>) =>
  (c.instagram_followers ?? 0) + (c.tiktok_followers ?? 0) + (c.youtube_followers ?? 0);

function compareNullable(a: number | null, b: number | null, dir: 1 | -1) {
  if (a === null && b === null) return 0;
  if (a === null) return 1; // blanks always last
  if (b === null) return -1;
  return (a - b) * dir;
}

export function queryCreators<T extends CreatorRow>(rows: T[], query: CreatorQuery, config: CrmConfig): T[] {
  const terms = (query.q ?? '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  const agencyFilters = filterFields(config)
    .map((f) => ({ filter: f, value: query[`f.${f.field.key}`] }))
    .filter((x): x is { filter: FilterField; value: string } => Boolean(x.value));
  // Repeated steps' text answers (a pet's name, say) are searchable too.
  const itemText = (c: T) =>
    config.steps
      .filter((s) => s.repeat)
      .flatMap((s) => itemsOf(c.details, s.repeat!).flatMap((item) => s.fields.filter((f) => f.type === 'text').map((f) => item[f.key])))
      .filter((v): v is string => typeof v === 'string');

  const band = AGE_BANDS.find((b) => b.value === query.age);
  const today = new Date();
  const age = (c: T) => (c.date_of_birth ? ageOn(c.date_of_birth, today) : null);

  const filtered = rows.filter((c) => {
    if (query.status && c.application_status !== query.status) return false;
    if (query.gender && c.gender !== query.gender) return false;
    if (band) {
      const years = age(c);
      if (years === null || years < band.min || years > band.max) return false;
    }
    if (query.country && c.country !== query.country) return false;
    if (query.source === 'import' && c.source !== 'import') return false;
    if (query.source === 'signup' && c.source !== 'signup') return false;
    if (query.gifting === 'yes' && !c.join_gifting_network) return false;
    if (query.gifting === 'no' && c.join_gifting_network) return false;
    // A repeated step matches when any one item does: a household with a
    // young pet and an old one is found by a search for young ones.
    for (const { filter, value } of agencyFilters) {
      if (!answersOf(c.details, filter.field, filter.repeat).some((a) => answerMatches(filter, a, value, today))) return false;
    }
    if (terms.length) {
      const haystack = [
        c.first_name, c.last_name, c.email, c.town, c.county, c.postcode, c.country,
        c.instagram_url, c.tiktok_url, c.youtube_url, c.phone, ...itemText(c),
      ].join(' ').toLowerCase();
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });

  const name = (c: T) => `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim().toLowerCase() || '￿';
  const by: Record<SortKey, (a: T, b: T) => number> = {
    joined_desc: (a, b) => b.created_at.localeCompare(a.created_at),
    joined_asc: (a, b) => a.created_at.localeCompare(b.created_at),
    followers_desc: (a, b) => totalFollowers(b) - totalFollowers(a),
    instagram_desc: (a, b) => compareNullable(a.instagram_followers, b.instagram_followers, -1),
    tiktok_desc: (a, b) => compareNullable(a.tiktok_followers, b.tiktok_followers, -1),
    youtube_desc: (a, b) => compareNullable(a.youtube_followers, b.youtube_followers, -1),
    age_asc: (a, b) => compareNullable(age(a), age(b), 1),
    age_desc: (a, b) => compareNullable(age(a), age(b), -1),
    rate_desc: (a, b) => compareNullable(a.rate_per_post, b.rate_per_post, -1),
    rate_asc: (a, b) => compareNullable(a.rate_per_post, b.rate_per_post, 1),
    name_asc: (a, b) => name(a).localeCompare(name(b)),
  };
  const sort = (query.sort as SortKey) in by ? (query.sort as SortKey) : 'joined_desc';
  return [...filtered].sort(by[sort]);
}

/** Reads a query from the address bar: core keys plus `f.<key>` for agency filters. */
export function parseCreatorQuery(params: URLSearchParams, config: CrmConfig): CreatorQuery {
  const out: CreatorQuery = {};
  const keys = [...CORE_FILTERS, ...filterFields(config).map((f) => `f.${f.field.key}`)];
  for (const k of keys) {
    const v = params.get(k);
    if (v) out[k] = v;
  }
  return out;
}
