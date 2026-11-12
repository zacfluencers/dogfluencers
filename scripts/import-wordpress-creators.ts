/**
 * Imports creators from the old WordPress site's user export into the CRM,
 * tidying the data on the way in.
 *
 *   # 1. Dry run: writes a report and a preview CSV to <out-dir>. Nothing is sent anywhere.
 *   npx tsx scripts/import-wordpress-creators.ts <export.csv> <out-dir>
 *
 *   # 2. Import, once the report has been checked. Needs PUBLIC_SUPABASE_URL and
 *   #    SUPABASE_SERVICE_ROLE_KEY in .env.
 *   npx tsx --env-file=.env scripts/import-wordpress-creators.ts <export.csv> <out-dir> --commit
 *
 * Dogs: the old form took every dog in one box per question. scripts/dog-import.ts
 * splits them into one CRM dog each, lines up breeds and dates of birth,
 * maps diet to the CRM's options (keeping the owner's own words as food notes)
 * and estimates size from the breed. Estimated answers are marked `_estimated`,
 * shown as such to the team and to the owner, and confirmed when the owner
 * saves their profile. Households that don't line up are listed in the report
 * and keep their original answers in team notes.
 *
 * Re-running is safe: a creator whose email is already in the CRM is skipped,
 * never overwritten, so edits made since the first import survive.
 *
 * The export holds people's home addresses, phone numbers and dates of birth.
 * Keep it, and <out-dir>, outside the repository.
 *
 * Imported creators have no login (WordPress passwords can't be carried
 * over). They set one up from /creator/claim/, or by applying again with the
 * same email, which sends them the set-up link instead of a second profile.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import {
  normaliseDate,
  normalisePhone,
  normaliseSocial,
  normaliseUkPostcode,
  parseCount,
  ageOn,
} from '../src/system/crm/validation';
import { importDogs } from './dog-import';

const [, , inputPath, outDir, flag] = process.argv;
if (!inputPath || !outDir) {
  console.error('Usage: npx tsx scripts/import-wordpress-creators.ts <export.csv> <out-dir> [--commit]');
  process.exit(1);
}
const COMMIT = flag === '--commit';
const IMPORTED_ON = new Date().toISOString().slice(0, 10);

// Team test accounts in the export, not creators.
const INTERNAL_DOMAINS = /@(fluencersgroup|dogfluencers)\./i;

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : Array.isArray(v) ? v.join('; ') : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ---------------------------------------------------------------------------
// Tidying
// ---------------------------------------------------------------------------

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Spreadsheet apps prefix "'" to stop a value being read as a formula. */
const clean = (v: string | undefined) => (v ?? '').replace(/^'+/, '').replace(/\s+/g, ' ').trim();

/** Answers that mean "nothing to add". */
const NONEISH =
  /^(n\/?a|na|none?r?|none!|no(pe)?|nil|nothing|-|non|not really|no allergies|no known allergies|none known( of)?|non known|none (that )?i know( of)?|none i can think of|none im aware of|no preferences?|no dietary (restrictions|requirements)|no restrictions|everything|i eat everything|normal|any|anything|omnivore|meat eater|healthy diet|happy to work( with)? all|open to all|i would consider all|i('| a)?m easy|i would work with all brands|i am open to work with any brand|there isn.t one brand i would not work with|i haven.t found one yet ?!?)\.?$/i;
const isNone = (v: string) => v === '' || NONEISH.test(v.trim());

/** "Don't have one", "/", "." in an account box: no account. */
const NO_ACCOUNT = /^(?:i )?(?:don.?t|do not|dont)\s*(?:have|use)\s*(?:one|it|any|an? (?:account|channel))?|^[\/.\-?]+$|^no (?:account|channel)$/i;

/** Rate answers that mean "not set yet": left blank for the creator to fill in, not flagged. */
const NO_RATE =
  /^(?:[?.\-]+|negotiable|open to (?:offers|negotiation)|open|unsure.*|not sure.*|tbc|tbd|unknown|flexible|variable|varie?d|depends.*|dependent.*|discussion|up for discussion|i don.?t mind|free.*|gifted.*|happy to be gifted.*|work on commission)[!.]*$/i;

/** Only re-case text typed all in one case: "LONDON", "london" → "London". */
function tidyCase(v: string): string {
  if (!v) return v;
  if (v !== v.toLowerCase() && v !== v.toUpperCase()) return v;
  return v.toLowerCase().replace(/(^|[\s'\-(])(\p{L})/gu, (_, p, c) => p + c.toUpperCase());
}

const sentence = (v: string) => (v ? v[0].toUpperCase() + v.slice(1) : v);

/** "Sep 6, 20238:50 AM" (UK time) → ISO. */
function parseRegistered(v: string): string | null {
  const m = v.match(/^([A-Za-z]{3}) (\d{1,2}), (\d{4})(\d{1,2}):(\d{2}) (AM|PM)$/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[1].toLowerCase());
  let hour = Number(m[4]) % 12;
  if (m[6] === 'PM') hour += 12;
  const naive = Date.UTC(Number(m[3]), month, Number(m[2]), hour, Number(m[5]));
  // UK time to UTC: subtract the offset in force at that moment (BST or GMT).
  const at = new Date(naive);
  const offset =
    new Date(at.toLocaleString('en-US', { timeZone: 'Europe/London' })).getTime() -
    new Date(at.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  return new Date(naive - offset).toISOString();
}

/** Dates of birth arrive as 28/10/1971, 28101971, 28.10.1971, 28-10-1971 or 28/10/71. */
function parseDob(raw: string): string | null {
  let v = clean(raw);
  // "Feb 20,1985", "December 14 2006"
  const named = v.match(/^([A-Za-z]{3})[a-z]*\.? (\d{1,2}),? ?(\d{4})$/);
  if (named && MONTHS.includes(named[1].toLowerCase())) v = `${named[2]}/${MONTHS.indexOf(named[1].toLowerCase()) + 1}/${named[3]}`;
  // Odd separators: "17_10/1973", "15 -02 -1995", "13/03:1993"
  v = v.replace(/\s*[_:.\-\s]\s*/g, '/').replace(/\/+/g, '/');
  // Digits run together, once separators are gone: "28101971", "02/021972"
  const digits = v.replace(/\D/g, '');
  if (!/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v) && digits.length === 8) v = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  const short = v.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2})$/);
  if (short) v = `${short[1]}/${short[2]}/${Number(short[3]) > 30 ? '19' : '20'}${short[3]}`;
  let date = normaliseDate(v);
  // American order (month first), when the day can't be a month.
  if (!date) {
    const us = v.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
    if (us && Number(us[2]) > 12) date = normaliseDate(`${us[2]}/${us[1]}/${us[3]}`);
  }
  if (!date) return null;
  const age = ageOn(date);
  return age >= 16 && age <= 100 ? date : null;
}

/** "£50", "50", "50-100", "£30 per post" → the first figure. */
function parseRate(raw: string): number | null {
  const v = clean(raw).replace(/,/g, '');
  // Where post and reel are priced separately, the post figure.
  const post =
    v.match(/post[^\d£€]{0,20}[£€]?\s?(\d+(?:\.\d{1,2})?)/i) ??
    v.match(/[£€]?\s?(\d+(?:\.\d{1,2})?)\s?£?\s?(?:per|for|a|\/)\s?(?:a\s)?post/i);
  if (post) return Number(post[1]);
  const m = v.match(/(\d+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return n <= 100_000 ? n : null;
}

const MAP = <T extends string>(table: Record<string, T>, raw: string) => table[clean(raw).toLowerCase()] ?? null;

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const [header, ...data] = parseCsv(readFileSync(inputPath, 'utf8').replace(/^﻿/, ''));
const col = (name: string) => {
  const i = header.indexOf(name);
  if (i < 0) throw new Error(`Column not found: ${name}`);
  return i;
};
// The Dogfluencers WordPress user export (November 2026). "Dog size" and
// "Dog sex" exist but were never filled in.
const C = {
  registered: col('Registered'), name: col('Name'), email: col('Email'), phone: col('Phone'),
  address: col('Address 1'), town: col('Town / City'), county: col('County'), postcode: col('Postcode'),
  gender: col('Gender'), dob: col('D.O.B'),
  dogName: col('Dog name'), dogBreed: col('Dog breed'), dogDob: col('Dog DOB'), dogDiet: col('Dog dietary pref'), dogAllergies: col('Dog allergies'),
  avoid: col("Brands won't work with"), gifting: col('Gifting'),
  ig: col('IG account'), igF: col('IG followers'), tt: col('TikTok account'), ttF: col('TikTok followers'),
  yt: col('YouTube account'), ytF: col('YouTube followers'),
  rate: col('Rate per post / reel'), further: col('Further info'),
  vet: col('Vet'), behaviourist: col('Behaviourist'), nutritionist: col('Nutritionist'),
};

const COUNTRY_WORDS = /\b(england|scotland|wales|northern ireland|uk|united kingdom|great britain|gb)\b/i;

interface Issue { email: string; field: string; value: string; note: string }
const issues: Issue[] = [];
const skipped: { email: string; reason: string }[] = [];
const records: Record<string, unknown>[] = [];
const seen = new Set<string>();

for (const r of data) {
  const email = clean(r[C.email]).toLowerCase();
  if (!email) { skipped.push({ email: '(blank)', reason: 'No email' }); continue; }
  if (INTERNAL_DOMAINS.test(email)) { skipped.push({ email, reason: 'Team test account' }); continue; }
  if (seen.has(email)) { skipped.push({ email, reason: 'Duplicate email in export' }); continue; }
  seen.add(email);

  const notes: string[] = [];
  const flag = (field: string, value: string, note: string) => {
    issues.push({ email, field, value, note });
    notes.push(`${field}: "${value}"`);
  };

  // Name
  const fullName = tidyCase(clean(r[C.name]));
  const [first, ...rest] = fullName.split(' ');

  // Contact
  const rawPhone = clean(r[C.phone]);
  const phone = rawPhone ? normalisePhone(rawPhone) : null;
  if (rawPhone && !phone) flag('Phone', rawPhone, 'Not a recognisable number');

  // Address and country
  const rawPostcode = clean(r[C.postcode]);
  const found = `${rawPostcode} ${clean(r[C.address])}`.toUpperCase().match(/\b[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}\b/);
  const ukPostcode = (rawPostcode ? normaliseUkPostcode(rawPostcode) : null) ?? (found ? normaliseUkPostcode(found[0]) : null);
  let county = tidyCase(clean(r[C.county]));
  const town = tidyCase(clean(r[C.town]));
  const saysUk = COUNTRY_WORDS.test(county) || /^(london|middlesex|greater london)$/i.test(county);
  if (COUNTRY_WORDS.test(county)) county = ''; // "England", "UK": a country, not a county
  const country = ukPostcode || saysUk ? 'United Kingdom' : !rawPostcode && !town ? null : /ireland|dublin|cork/i.test(`${county} ${town}`) ? 'Ireland' : 'Other';
  if (country === 'Other') flag('Country', [town, county, rawPostcode].filter(Boolean).join(', '), 'Outside the UK, or a postcode that is not a UK one');
  if (rawPostcode && country === 'United Kingdom' && !ukPostcode) flag('Postcode', rawPostcode, 'Not a valid UK postcode');

  // About
  const gender = MAP({ female: 'woman', male: 'man', 'would-rather-not-say': 'prefer_not_to_say', other: 'self_described' }, r[C.gender]);
  const rawDob = clean(r[C.dob]);
  const dob = rawDob ? parseDob(rawDob) : null;
  if (rawDob && !dob) flag('Date of birth', rawDob, 'Not a readable date, or an unlikely age');

  // Agency answers, stored in `details` under the keys in src/agency/crm.ts.
  const details: Record<string, unknown> = {};
  const household = importDogs({
    names: r[C.dogName], breeds: r[C.dogBreed], dates: r[C.dogDob], diet: r[C.dogDiet], allergies: r[C.dogAllergies],
  });
  if (household.dogs.length) details.dogs = household.dogs;
  if (household.problems.length) {
    // The team checks these against the owner's own words.
    flag('Dogs', [r[C.dogName], r[C.dogBreed], r[C.dogDob]].map(clean).filter(Boolean).join(' / '), household.problems.join('; '));
  }
  const expertise = (
    [['vet', C.vet], ['behaviourist', C.behaviourist], ['nutritionist', C.nutritionist]] as const
  ).filter(([, c]) => clean(r[c]).toLowerCase() === 'yes').map(([k]) => k);
  if (expertise.length) details.expertise = expertise;
  const avoid = clean(r[C.avoid]);
  if (!isNone(avoid) && !/^(i would|i am|i'm|happy|open|there isn)/i.test(avoid)) details.brands_avoid = sentence(avoid).slice(0, 1000);

  // Socials
  const social = (platform: 'instagram' | 'tiktok' | 'youtube', raw: string, label: string) => {
    if (NO_ACCOUNT.test(clean(raw))) return null;
    let v = clean(raw).replace(/\s+/g, '').replace(/[^\w.@/:?=&%-]+$/u, '');
    if (!v || isNone(v)) return null;
    const pasted = v.search(/https?:\/\//i);
    if (pasted > 0) v = v.slice(pasted);
    const url = normaliseSocial(platform, v);
    if (url === 'invalid' || url === null) { flag(label, v, 'Not a handle or profile link we could read'); return null; }
    return url;
  };
  const followers = (raw: string, label: string) => {
    const v = clean(raw);
    if (!v || isNone(v)) return null;
    const m = v.replace(/,/g, '').match(/(\d+(?:\.\d+)?\s?[km]?)\b/i);
    const n = m ? parseCount(m[1].replace(/\s/g, '')) : null;
    if (n === null) flag(label, v, 'Not a number we could read');
    return n;
  };
  const instagram = social('instagram', r[C.ig], 'Instagram');
  const tiktok = social('tiktok', r[C.tt], 'TikTok');
  const youtube = social('youtube', r[C.yt], 'YouTube');

  const rawRate = clean(r[C.rate]);
  const rate = isNone(rawRate) || NO_RATE.test(rawRate) ? null : parseRate(rawRate);
  const figures = rawRate.replace(/,/g, '').match(/\d+(\.\d+)?/g) ?? [];
  if (rawRate && !isNone(rawRate) && !NO_RATE.test(rawRate) && (rate === null || figures.length > 1 || /€|euro/i.test(rawRate))) {
    flag('Rate', rawRate, rate === null ? 'No figure we could read' : `Kept ${rate}; the original says more`);
  }

  const further = clean(r[C.further]);
  const registered = parseRegistered(clean(r[C.registered]));

  records.push({
    created_at: registered ?? undefined,
    source: 'import',
    application_status: 'approved',
    first_name: first || null,
    last_name: rest.join(' ') || null,
    email,
    phone,
    address_line_1: tidyCase(clean(r[C.address])) || null,
    town: town || null,
    county: county || null,
    postcode: ukPostcode ?? (rawPostcode.toUpperCase() || null),
    country,
    gender,
    date_of_birth: dob,
    instagram_url: instagram,
    instagram_followers: followers(r[C.igF], 'Instagram followers'),
    tiktok_url: tiktok,
    tiktok_followers: followers(r[C.ttF], 'TikTok followers'),
    youtube_url: youtube,
    youtube_followers: youtube ? followers(r[C.ytF], 'YouTube followers') : null,
    rate_per_post: rate,
    join_gifting_network: clean(r[C.gifting]).toLowerCase() === 'yes',
    additional_notes: isNone(further) ? null : sentence(further).slice(0, 2000),
    details,
    admin_notes: [
      `Imported from the old website on ${IMPORTED_ON}.`,
      notes.length ? `Original answers that couldn't be tidied: ${notes.join('; ')}.` : '',
    ].filter(Boolean).join('\n'),
  });
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

mkdirSync(outDir, { recursive: true });
const count = (pred: (r: Record<string, unknown>) => boolean) => records.filter(pred).length;
const summary = {
  rows_in_export: data.length,
  to_import: records.length,
  skipped: skipped.length,
  with_phone: count((r) => Boolean(r.phone)),
  with_date_of_birth: count((r) => Boolean(r.date_of_birth)),
  uk: count((r) => r.country === 'United Kingdom'),
  outside_uk: count((r) => r.country === 'Other' || r.country === 'Ireland'),
  with_instagram: count((r) => Boolean(r.instagram_url)),
  with_tiktok: count((r) => Boolean(r.tiktok_url)),
  with_youtube: count((r) => Boolean(r.youtube_url)),
  dogs: records.reduce((n, r) => n + (((r.details as { dogs?: unknown[] }).dogs ?? []).length), 0),
  households_with_several_dogs: count((r) => (((r.details as { dogs?: unknown[] }).dogs ?? []).length) > 1),
  with_no_dog: count((r) => !(r.details as { dogs?: unknown[] }).dogs),
  dogs_with_estimated_size: records.reduce((n, r) => n + (((r.details as { dogs?: { _estimated?: string[] }[] }).dogs ?? []).filter((d) => d._estimated?.includes('size')).length), 0),
  dogs_with_date_of_birth: records.reduce((n, r) => n + (((r.details as { dogs?: { birth_date?: string }[] }).dogs ?? []).filter((d) => d.birth_date).length), 0),
  with_professional_background: count((r) => Boolean((r.details as { expertise?: unknown }).expertise)),
  in_gifting_network: count((r) => r.join_gifting_network === true),
  values_flagged: issues.length,
};
writeFileSync(join(outDir, 'import-report.json'), JSON.stringify({ summary, skipped, issues }, null, 2));

const previewCols = Object.keys(records[0] ?? {}).filter((k) => k !== 'details');
const detailCols = [...new Set(records.flatMap((r) => Object.keys(r.details as object)))].filter((k) => k !== 'dogs');
const dogCount = Math.max(1, ...records.map((r) => ((r.details as { dogs?: unknown[] }).dogs ?? []).length));
const DOG_KEYS = ['name', 'breed', 'size', 'birth_date', 'diet', 'food_notes', 'allergies', '_estimated'];
const dogCols = Array.from({ length: dogCount }, (_, i) => DOG_KEYS.map((k) => `dog_${i + 1}.${k}`)).flat();
const preview = [
  [...previewCols, ...detailCols.map((k) => `details.${k}`), ...dogCols].join(','),
  ...records.map((r) => {
    const dogs = ((r.details as { dogs?: Record<string, unknown>[] }).dogs ?? []);
    return [
      ...previewCols.map((k) => csvCell(r[k])),
      ...detailCols.map((k) => csvCell((r.details as Record<string, unknown>)[k])),
      ...Array.from({ length: dogCount }, (_, i) => DOG_KEYS.map((k) => csvCell(dogs[i]?.[k]))).flat(),
    ].join(',');
  }),
];
writeFileSync(join(outDir, 'import-preview.csv'), '﻿' + preview.join('\r\n'));

console.log(JSON.stringify(summary, null, 2));
console.log(`Report and preview written to ${outDir}`);

if (COMMIT) {
  const url = process.env.PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (run with --env-file=.env).');
    process.exit(1);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });
  let written = 0;
  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100);
    // Existing emails are skipped, never overwritten.
    const { data: inserted, error } = await db
      .from('creators')
      .upsert(batch, { onConflict: 'email', ignoreDuplicates: true })
      .select('id');
    if (error) {
      console.error(`Batch starting at row ${i + 1} failed:`, error.message);
      process.exit(1);
    }
    written += inserted?.length ?? 0;
  }
  console.log(`Imported ${written} creators (${records.length - written} were already in the CRM).`);
}
