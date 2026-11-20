/**
 * Validation for the creator forms, shared by the browser (instant feedback on
 * each step) and the server (the real check). Form values arrive as strings;
 * these schemas turn them into clean, typed values ready for the database.
 *
 * Agency questions are built from their `FieldDef`s. In forms they are named
 * `d.<key>`, so they can never collide with a core column.
 */
import { z } from 'astro/zod';
import type { CrmConfig, DetailItem, Details, DetailValue, FieldDef, ProfileStep, RepeatDef } from './types';
import { GENDERS } from './options';

export const DETAIL_PREFIX = 'd.';
export const detailName = (key: string) => `${DETAIL_PREFIX}${key}`;
/** A repeated step's field for item `index`: `d.pets.0.colour`. */
export const itemName = (group: string, index: number | string, key: string) => `${DETAIL_PREFIX}${group}.${index}.${key}`;
/** The prefix every field of a repeated step shares: `d.pets.`. */
export const groupPrefix = (group: string) => `${DETAIL_PREFIX}${group}.`;
const ITEM_NAME = /^d\.([a-z0-9_]+)\.(\d+)\.([a-z0-9_]+)$/;
/** `d.pets.2.colour` → { group: 'pets', index: 2, key: 'colour' }. */
export function parseItemName(name: string): { group: string; index: number; key: string } | null {
  const m = name.match(ITEM_NAME);
  return m ? { group: m[1], index: Number(m[2]), key: m[3] } : null;
}

// ---------------------------------------------------------------------------
// Normalisers (also used by the import script)
// ---------------------------------------------------------------------------

/**
 * UK numbers in any common shape ("07700 900123", "+44 (0)7700 900123",
 * "447700900123") become "+447700900123". Other countries are accepted in
 * international form ("+234 803 123 4567"). Null when it can't be read.
 */
export function normalisePhone(raw: string): string | null {
  let digits = raw.replace(/[\s()\-.‪‬']/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  if (/^\+440\d{9,10}$/.test(digits)) digits = `+44${digits.slice(4)}`;
  if (/^44\d{9,10}$/.test(digits)) digits = `+${digits}`;
  if (/^0\d{9,10}$/.test(digits)) digits = `+44${digits.slice(1)}`;
  if (/^\+44\d{9,10}$/.test(digits)) return digits;
  if (/^\+[1-9]\d{7,14}$/.test(digits)) return digits;
  return null;
}

/** "+447700900123" → "07700 900123". Other numbers are shown as stored. */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return '';
  if (/^\+447\d{9}$/.test(e164)) return `07${e164.slice(4, 7)} ${e164.slice(7)}`;
  if (/^\+44\d{9,10}$/.test(e164)) return `0${e164.slice(3)}`;
  return e164;
}

const UK_POSTCODE = /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/;

/** "bl52hg" → "BL5 2HG". Null if it isn't a UK postcode. */
export function normaliseUkPostcode(raw: string): string | null {
  const compact = raw.toUpperCase().replace(/\s+/g, '');
  const m = compact.match(UK_POSTCODE);
  return m ? `${m[1]} ${m[2]}` : null;
}

/** "13,800", "10k", "1.3K", "2m" → whole numbers. Null if it can't be read. */
export function parseCount(raw: string): number | null {
  const v = raw.trim().toLowerCase().replace(/[,\s]/g, '');
  const m = v.match(/^(\d+(?:\.\d+)?)([km]?)$/);
  if (!m) return null;
  const n = Number(m[1]) * (m[2] === 'k' ? 1_000 : m[2] === 'm' ? 1_000_000 : 1);
  return Number.isFinite(n) && n <= 1_000_000_000 ? Math.round(n) : null;
}

/** "£50", "50.00", "1,200" → number. Null if it can't be read. */
export function parseMoney(raw: string): number | null {
  const v = raw.trim().replace(/[£$€,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  const n = Number(v);
  return n <= 99_999_999 ? n : null;
}

type Platform = 'instagram' | 'tiktok' | 'youtube';

const SOCIAL = {
  instagram: { hosts: ['instagram.com', 'www.instagram.com', 'm.instagram.com'], handle: /^[A-Za-z0-9._]{1,30}$/, base: 'https://www.instagram.com/' },
  tiktok: { hosts: ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com'], handle: /^[A-Za-z0-9._]{2,24}$/, base: 'https://www.tiktok.com/@' },
  youtube: { hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com'], handle: /^[A-Za-z0-9._-]{3,30}$/, base: 'https://www.youtube.com/@' },
} as const;

/**
 * "@handle", "handle" or a full profile link → a clean profile URL. Null for
 * empty input and "invalid" if it can't be read.
 */
export function normaliseSocial(platform: Platform, raw: string): string | null | 'invalid' {
  const value = raw.trim();
  if (!value) return null;
  const cfg = SOCIAL[platform];

  const looksLikeUrl = /^(https?:\/\/)?([a-z]+\.)?(instagram|tiktok|youtube)\.com\//i.test(value);
  if (!looksLikeUrl) {
    const handle = value.replace(/^@/, '');
    return cfg.handle.test(handle) ? cfg.base + handle : 'invalid';
  }

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return 'invalid';
  }
  if (!(cfg.hosts as readonly string[]).includes(url.hostname.toLowerCase())) return 'invalid';
  const path = url.pathname.replace(/\/+$/, '');
  if (!path) return 'invalid';

  // Links are often pasted with an "@" Instagram doesn't use, or without
  // the one TikTok does. Both are read the same.
  if (platform === 'instagram') {
    const handle = (path.split('/')[1] ?? '').replace(/^@/, '');
    return cfg.handle.test(handle) ? cfg.base + handle : 'invalid';
  }
  if (platform === 'tiktok') {
    const m = path.match(/^\/@?([A-Za-z0-9._]{2,24})$/) ?? path.match(/^\/@([A-Za-z0-9._]{2,24})/);
    return m ? cfg.base + m[1] : 'invalid';
  }
  const m = path.match(/^\/(@[A-Za-z0-9._-]{3,30}|channel\/[A-Za-z0-9_-]{10,40}|c\/[A-Za-z0-9._-]{1,100}|user\/[A-Za-z0-9._-]{1,100})/);
  return m ? `https://www.youtube.com/${m[1]}` : 'invalid';
}

/** "https://www.instagram.com/jane" → "@jane", for tables. */
export function socialHandle(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] ?? '';
    return last.startsWith('@') ? last : `@${last}`;
  } catch {
    return url;
  }
}

/** "1990-04-05" or "05/04/1990" → "1990-04-05". Null if not a real date. */
export function normaliseDate(raw: string): string | null {
  const v = raw.trim();
  let y: number, m: number, d: number;
  let match = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = v.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/))) [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function ageOn(dob: string, today = new Date()): number {
  const [y, m, d] = dob.split('-').map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  return age;
}

// ---------------------------------------------------------------------------
// Field schemas
// ---------------------------------------------------------------------------

const custom = (ctx: z.RefinementCtx, message: string) => {
  ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  return z.NEVER;
};

// Untouched optional fields arrive as undefined (or null from the database):
// treat those the same as an empty box.
const str = z.preprocess((v) => (v === undefined || v === null ? '' : String(v)), z.string());

const requiredText = (message: string, max: number) =>
  str
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, { message })
    .refine((v) => v.length <= max, { message: `Keep this under ${max} characters` });

const optionalText = (max: number) =>
  str
    .transform((v) => v.trim())
    .refine((v) => v.length <= max, { message: `Keep this under ${max} characters` })
    .transform((v) => (v === '' ? null : v));

const oneOf = (values: readonly string[], message: string, required: boolean) =>
  str.transform((v, ctx) => {
    if (v === '') return required ? custom(ctx, message) : null;
    return values.includes(v) ? v : custom(ctx, message);
  });

const optionalCount = str.transform((v, ctx) => {
  if (v.trim() === '') return null;
  const n = parseCount(v);
  return n === null ? custom(ctx, 'Enter a number, like 12500 or 12.5k') : n;
});

const socialUrl = (platform: Platform, label: string) =>
  str.transform((v, ctx) => {
    const result = normaliseSocial(platform, v);
    return result === 'invalid' ? custom(ctx, `Enter your ${label} handle (like @yourname) or profile link`) : result;
  });

function detailSchema(field: FieldDef): z.ZodTypeAny {
  const message = `Choose ${field.type === 'multi' ? 'at least one' : 'an option'}`;
  switch (field.type) {
    case 'date':
      return str.transform((v, ctx) => {
        if (v.trim() === '') return field.required ? custom(ctx, `Fill in ${field.label.toLowerCase()}`) : null;
        const date = normaliseDate(v);
        if (!date) return custom(ctx, 'Enter a valid date');
        if (date > new Date().toISOString().slice(0, 10)) return custom(ctx, 'That date is in the future');
        if (ageOn(date) > (field.maxYears ?? 120)) return custom(ctx, 'Check the year');
        return date;
      });
    case 'text':
    case 'textarea': {
      const max = field.max ?? (field.type === 'text' ? 200 : 2000);
      return field.required ? requiredText(`Fill in ${field.label.toLowerCase()}`, max) : optionalText(max);
    }
    case 'select':
      return oneOf(field.options.map((o) => o.value), message, Boolean(field.required));
    case 'multi': {
      const values = field.options.map((o) => o.value);
      return z
        .preprocess((v) => (v === undefined || v === null || v === '' ? [] : Array.isArray(v) ? v : [v]), z.array(z.string()))
        .transform((list, ctx) => {
          const clean = [...new Set(list)].filter((v) => values.includes(v));
          if (clean.length !== new Set(list).size) return custom(ctx, 'Choose from the list');
          if (field.required && clean.length === 0) return custom(ctx, message);
          return clean;
        });
    }
  }
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

export interface BuiltStep {
  id: string;
  title: string;
  blurb: string;
  /** Form field names on this step, in order. */
  names: string[];
  /** A repeated step's fields are named from this prefix, item by item. */
  prefix?: string;
  schema: z.ZodTypeAny;
}

/** Whether a form field name belongs to a step. */
export const stepOwns = (step: Pick<BuiltStep, 'names' | 'prefix'>, name: string) =>
  step.names.includes(name) || Boolean(step.prefix && name.startsWith(step.prefix));

/** The item numbers a set of form values holds for a repeated step, in order. At least [0]. */
export function itemIndexes(values: Record<string, unknown>, group: string): number[] {
  const found = new Set<number>();
  for (const name of Object.keys(values)) {
    const parsed = parseItemName(name);
    if (parsed && parsed.group === group) found.add(parsed.index);
  }
  return found.size ? [...found].sort((a, b) => a - b) : [0];
}

const isBlank = (v: unknown) => v === null || v === undefined || (Array.isArray(v) && v.length === 0);

/**
 * A repeated step: reads every item from the flat form values, checks each
 * with the step's field rules, and returns the list under `d.<key>`. Errors
 * name the item's own field, so they land beside it.
 */
function groupSchema(step: ProfileStep & { repeat: RepeatDef }): z.ZodTypeAny {
  const { repeat } = step;
  const fields = step.fields.map((f) => ({ field: f, schema: detailSchema(f) }));
  return z.record(z.unknown()).transform((input, ctx) => {
    const indexes = itemIndexes(input, repeat.key);
    if (indexes.length > repeat.max) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [itemName(repeat.key, indexes[0], fields[0].field.key)], message: `Add up to ${repeat.max}` });
      return z.NEVER;
    }
    let failed = false;
    const items: DetailItem[] = [];
    for (const index of indexes) {
      const item: DetailItem = {};
      for (const { field, schema } of fields) {
        const name = itemName(repeat.key, index, field.key);
        const result = schema.safeParse(input[name]);
        if (!result.success) {
          failed = true;
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [name], message: result.error.issues[0]?.message ?? 'Check this' });
        } else if (!isBlank(result.data)) item[field.key] = result.data as DetailValue;
      }
      items.push(item);
    }
    return failed ? z.NEVER : { [detailName(repeat.key)]: items };
  });
}

const hasRepeat = (s: ProfileStep): s is ProfileStep & { repeat: RepeatDef } => Boolean(s.repeat);

/**
 * Checks plain fields and every repeated step together, reporting all their
 * errors at once, and merges the results into one object.
 */
function combine(plain: z.ZodTypeAny, groups: z.ZodTypeAny[]): z.ZodTypeAny {
  if (!groups.length) return plain;
  return z.record(z.unknown()).transform((input, ctx) => {
    let ok = true;
    const out: Record<string, unknown> = {};
    for (const schema of [plain, ...groups]) {
      const result = schema.safeParse(input);
      if (result.success) Object.assign(out, result.data);
      else {
        ok = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const issue of result.error.issues) ctx.addIssue(issue as any);
      }
    }
    return ok ? out : z.NEVER;
  });
}

type Shape = Record<string, z.ZodTypeAny>;

interface SocialValues {
  instagram_url?: string | null;
  instagram_followers?: number | null;
  tiktok_url?: string | null;
  tiktok_followers?: number | null;
  youtube_url?: string | null;
  youtube_followers?: number | null;
}

/** Needs at least one account, and a follower count for each account given. */
function checkSocials(v: SocialValues, ctx: z.RefinementCtx) {
  if (!v.instagram_url && !v.tiktok_url && !v.youtube_url) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['instagram_url'], message: 'Add at least one Instagram, TikTok or YouTube account' });
  }
  for (const p of ['instagram', 'tiktok', 'youtube'] as const) {
    if (v[`${p}_url`] && (v[`${p}_followers`] === null || v[`${p}_followers`] === undefined)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [`${p}_followers`], message: 'Add your follower count' });
    }
  }
}

interface AddressValues {
  postcode?: string | null;
  country?: string | null;
}

/** UK postcodes are checked and tidied; elsewhere any short code is accepted. */
function checkPostcode(v: AddressValues, ctx: z.RefinementCtx) {
  if (!v.postcode) return;
  if (v.country === 'United Kingdom') {
    const pc = normaliseUkPostcode(v.postcode);
    if (pc) v.postcode = pc;
    else ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['postcode'], message: 'Enter a UK postcode, like SW1A 1AA' });
  }
}

export const emailSchema = str
  .transform((v) => v.trim().toLowerCase())
  .refine((v) => v.length > 0, { message: 'Enter your email' })
  .refine((v) => v.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), { message: 'Enter a valid email, like name@example.com' });

export const passwordSchema = str
  .refine((v) => v.length > 0, { message: 'Create a password of at least 8 characters' })
  .refine((v) => v.length === 0 || v.length >= 8, { message: 'Use at least 8 characters' })
  .refine((v) => v.length <= 72, { message: 'Keep it under 72 characters' })
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), { message: 'Include at least one letter and one number' });

export function buildSchemas(config: CrmConfig) {
  const nameShape: Shape = {
    first_name: requiredText('Enter your first name', 80),
    last_name: requiredText('Enter your last name', 80),
  };

  const email = emailSchema;
  const password = passwordSchema;

  const aboutShape: Shape = {
    phone: str.transform((v, ctx) => {
      if (v.trim() === '') return custom(ctx, 'Enter your phone number');
      return normalisePhone(v) ?? custom(ctx, 'Enter a UK mobile like 07700 900123, or an international number starting +');
    }),
    address_line_1: requiredText('Enter the first line of your address', 200),
    address_line_2: optionalText(200),
    town: requiredText('Enter your town or city', 80),
    county: optionalText(80),
    postcode: requiredText('Enter your postcode', 12),
    country: oneOf(config.countries.map((c) => c.value), 'Choose a country', true),
    gender: oneOf(GENDERS.map((g) => g.value), 'Choose an option', true),
    date_of_birth: str.transform((v, ctx) => {
      if (v.trim() === '') return custom(ctx, 'Enter your date of birth');
      const date = normaliseDate(v);
      if (!date) return custom(ctx, 'Enter a valid date');
      const age = ageOn(date);
      if (age < config.minAge) return custom(ctx, `You need to be ${config.minAge} or older to join`);
      if (age > 110) return custom(ctx, 'Check the year');
      return date;
    }),
  };

  // The owner's own sizes and diet: only for agencies that ask (see CrmConfig).
  const sizes = config.clothingSizes?.map((s) => s.value) ?? [];
  const hasSizes = sizes.length > 0;
  const sizesShape: Shape = hasSizes
    ? {
        clothing_size: oneOf(sizes, 'Choose a size', false),
        trouser_size: oneOf(sizes, 'Choose a size', false),
        shoe_size: optionalText(20),
        dietary_requirements: optionalText(500),
        allergies: optionalText(500),
      }
    : {};

  const socialsShape: Shape = {
    instagram_url: socialUrl('instagram', 'Instagram'),
    instagram_followers: optionalCount,
    tiktok_url: socialUrl('tiktok', 'TikTok'),
    tiktok_followers: optionalCount,
    youtube_url: socialUrl('youtube', 'YouTube'),
    youtube_followers: optionalCount,
    rate_per_post: str.transform((v, ctx) => {
      if (v.trim() === '') return null;
      return parseMoney(v) ?? custom(ctx, `Enter an amount, like ${config.currency}150`);
    }),
    join_gifting_network: str.transform((v, ctx) =>
      v === 'yes' ? true : v === 'no' ? false : custom(ctx, 'Choose yes or no'),
    ),
    additional_notes: optionalText(2000),
  };

  const consentShape: Shape = {
    privacy_consent: str.refine((v) => v === 'yes', { message: 'Please tick the box to continue' }),
  };

  const agencyShape = (step: ProfileStep): Shape =>
    step.repeat ? {} : Object.fromEntries(step.fields.map((f) => [detailName(f.key), detailSchema(f)]));

  // Each refinement reads only the fields it names, so its input is left open.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Refine = (v: any, ctx: z.RefinementCtx) => void;
  const step = (id: string, title: string, blurb: string, shape: Shape, refine?: Refine): BuiltStep => {
    const base = z.object(shape);
    return { id, title, blurb, names: Object.keys(shape), schema: refine ? base.superRefine(refine) : base };
  };

  const agencyStep = (s: ProfileStep): BuiltStep =>
    hasRepeat(s)
      ? { id: s.id, title: s.title, blurb: s.blurb, names: [], prefix: groupPrefix(s.repeat.key), schema: groupSchema(s) }
      : step(s.id, s.title, s.blurb, agencyShape(s));
  const groups = config.steps.filter(hasRepeat).map(groupSchema);

  const steps: BuiltStep[] = [
    step('account', 'Your account', 'So you can log in and update your details later.', { ...nameShape, email, password }),
    step('about', 'About you', 'Where to send products, and how to reach you.', aboutShape, checkPostcode),
    ...config.steps.map(agencyStep),
    ...(hasSizes ? [step('sizes', 'Sizes and diet', 'So anything we send fits. All optional.', sizesShape)] : []),
    step('socials', 'Your socials', 'Add at least one account. Handles or profile links both work.', { ...socialsShape, ...consentShape }, checkSocials),
  ];

  const allAgency = Object.assign({}, ...config.steps.map(agencyShape)) as Shape;
  const both: Refine = (v: SocialValues & AddressValues, ctx) => {
    checkSocials(v, ctx);
    checkPostcode(v, ctx);
  };

  return {
    steps,
    registration: combine(
      z.object({ ...nameShape, email, password, ...aboutShape, ...allAgency, ...sizesShape, ...socialsShape, ...consentShape }).superRefine(both),
      groups,
    ),
    profile: combine(z.object({ ...nameShape, ...aboutShape, ...allAgency, ...sizesShape, ...socialsShape }).superRefine(both), groups),
  };
}

export type FieldErrors = Record<string, string>;

/** First error message per field, keyed by form field name. */
export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Every agency field, flattened from the steps (a repeated step's included). */
export const agencyFields = (config: CrmConfig) => config.steps.flatMap((s) => s.fields);

/** Every agency field with the repeated step it belongs to, if any. */
export const agencyEntries = (config: CrmConfig): { field: FieldDef; repeat?: RepeatDef }[] =>
  config.steps.flatMap((s) => s.fields.map((field) => ({ field, repeat: s.repeat })));

/** A creator's repeated items for a step: their pets, say. */
export function itemsOf(details: Details | null | undefined, repeat: RepeatDef): DetailItem[] {
  const list = details?.[repeat.key];
  return Array.isArray(list) ? list.filter((x): x is DetailItem => typeof x === 'object' && x !== null) : [];
}

/** Every answer a creator gave to one field: one, or one per item for a repeated step. */
export function answersOf(details: Details | null | undefined, field: FieldDef, repeat?: RepeatDef): DetailValue[] {
  if (repeat) return itemsOf(details, repeat).map((item) => item[field.key]).filter((v): v is DetailValue => !isBlank(v));
  const v = details?.[field.key];
  return v === undefined || isBlank(v) ? [] : [v as DetailValue];
}

/** Reads a submitted form into the plain object the schemas expect. */
export function formToInput(form: FormData, config: CrmConfig): Record<string, unknown> {
  const multi = new Set(config.steps.filter((s) => !s.repeat).flatMap((s) => s.fields).filter((f) => f.type === 'multi').map((f) => detailName(f.key)));
  const groupMulti = new Map(
    config.steps.filter(hasRepeat).map((s) => [s.repeat.key, new Set(s.fields.filter((f) => f.type === 'multi').map((f) => f.key))]),
  );
  const out: Record<string, unknown> = {};
  for (const key of new Set(form.keys())) {
    const item = parseItemName(key);
    const isMulti = multi.has(key) || Boolean(item && groupMulti.get(item.group)?.has(item.key));
    out[key] = isMulti ? form.getAll(key).map(String) : String(form.get(key) ?? '');
  }
  return out;
}

/** Splits parsed form output into database columns and the `details` object. */
export function toRecord(data: Record<string, unknown>): Record<string, unknown> & { details: Details } {
  const details: Details = {};
  const columns: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith(DETAIL_PREFIX)) {
      if (!isBlank(value)) details[key.slice(DETAIL_PREFIX.length)] = value as Details[string];
    } else {
      columns[key] = value;
    }
  }
  return { ...columns, details };
}

/** A stored creator as form values, for the profile page. */
export function recordToValues(c: Record<string, unknown> & { details?: Details }): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(c)) {
    if (key === 'details' || value === null || value === undefined) continue;
    if (typeof value === 'boolean') out[key] = value ? 'yes' : 'no';
    else out[key] = String(value);
  }
  for (const [key, value] of Object.entries(c.details ?? {})) {
    if (Array.isArray(value) && value.some((x) => typeof x === 'object' && x !== null)) {
      (value as DetailItem[]).forEach((item, i) => {
        for (const [k, v] of Object.entries(item)) out[itemName(key, i, k)] = v;
      });
    } else out[detailName(key)] = value as DetailValue;
  }
  return out;
}

/** Labels for the core fields, as the forms show them. */
const CORE_LABELS: Record<string, string> = {
  first_name: 'First name', last_name: 'Last name', email: 'Email', password: 'Password',
  phone: 'Phone', date_of_birth: 'Date of birth', gender: 'Gender',
  address_line_1: 'Address line 1', address_line_2: 'Address line 2', town: 'Town or city', county: 'County', postcode: 'Postcode', country: 'Country',
  clothing_size: 'Top size', trouser_size: 'Bottoms size', shoe_size: 'Shoe size', dietary_requirements: 'Dietary requirements', allergies: 'Allergies',
  instagram_url: 'Instagram', instagram_followers: 'Instagram followers', tiktok_url: 'TikTok', tiktok_followers: 'TikTok followers',
  youtube_url: 'YouTube', youtube_followers: 'YouTube subscribers', rate_per_post: 'Rate per post',
  join_gifting_network: 'Join the gifting network?', additional_notes: 'Anything else we should know', privacy_consent: 'Consent',
};

/** The anchor a field's wrapper carries (FormField), for "jump to" links. */
export const fieldAnchor = (name: string) => `f-${name.replace(/[^a-z0-9_-]/gi, '-')}-field`;

/**
 * A field's label for a list of problems: "Size (Bonnie)" for a repeated
 * item, named by its first summary field, or "Size (Dog 2)" if that's blank.
 */
export function fieldLabel(config: CrmConfig, name: string, values: Record<string, unknown> = {}): string {
  const item = parseItemName(name);
  if (item) {
    const step = config.steps.find((s) => s.repeat?.key === item.group);
    const label = step?.fields.find((f) => f.key === item.key)?.label ?? item.key;
    const nameKey = step?.repeat?.summary[0];
    const raw = nameKey ? values[itemName(item.group, item.index, nameKey)] : undefined;
    const who = typeof raw === 'string' && raw.trim() ? raw.trim() : `${step?.repeat?.item ?? 'Item'} ${item.index + 1}`;
    return `${label} (${who})`;
  }
  if (name.startsWith(DETAIL_PREFIX)) {
    const key = name.slice(DETAIL_PREFIX.length);
    const field = config.steps.flatMap((s) => s.fields).find((f) => f.key === key);
    return field?.teamLabel && field.label.length > 40 ? field.teamLabel : field?.label ?? key;
  }
  return CORE_LABELS[name] ?? name;
}

/**
 * What a stored profile still needs before it will save: each field that
 * fails, with its message. Imported profiles often lack questions the old
 * site never asked, and the creator should see them before pressing save.
 */
export function profileGaps(config: CrmConfig, values: Record<string, unknown>): FieldErrors {
  const built = buildSchemas(config);
  const input: Record<string, unknown> = { ...values };
  for (const step of built.steps) for (const n of step.names) if (!(n in input)) input[n] = '';
  const result = built.profile.safeParse(input);
  return result.success ? {} : fieldErrorsFrom(result.error);
}
