/**
 * Turns the old WordPress site's dog answers into the CRM's dogs, for
 * scripts/import-wordpress-creators.ts. The old form asked for every dog in
 * one box per question ("Teddy & Bailey", "Beagle & Beagle Mix",
 * "02/20/2020, 04/29/2020"), so this splits them, lines names up with breeds
 * and dates, tidies diet into the CRM's options, and estimates size from the
 * breed. Anything it can't line up is reported, never guessed silently.
 */
import { ageOn, normaliseDate } from '../src/system/crm/validation';

export interface ImportedDog {
  name?: string;
  breed?: string;
  size?: string;
  birth_date?: string;
  diet?: string[];
  food_notes?: string;
  allergies?: string;
  /** Filled in by the import rather than the owner: shown as estimated until they save. */
  _estimated?: string[];
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const today = new Date();
const todayIso = today.toISOString().slice(0, 10);

const tidy = (v: string) => v.replace(/\s+/g, ' ').trim();
const title = (v: string) => (v && v === v.toLowerCase() ? v.replace(/(^|[\s'-])(\p{L})/gu, (_, p, c) => p + c.toUpperCase()) : v);
const NONE = /^(n\/?a|na|none?|non|no|nil|nothing|-|none known|no allergies|not known|unknown|n\/a\.?|none that i know of|none so far|no known allergies)\.?$/i;
const isNone = (v: string) => !v.trim() || NONE.test(v.trim());

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------

/** "Teddy & Bailey", "Hugo, Hunter", "Margot (and Remi)", "Mars - Teddy" → names. */
export function splitNames(raw: string): string[] {
  let v = tidy(raw);
  if (isNone(v)) return [];
  v = v.replace(/\(\s*(?:and|&)\s+([^)]+)\)/gi, ', $1');
  return v
    .split(/\s*(?:,|&|\+|;|\||\/|\band\b|\s-\s)\s*/i)
    .map((x) => title(tidy(x.replace(/[.!]+$/, ''))))
    .filter((x) => x && !isNone(x));
}

// ---------------------------------------------------------------------------
// Breeds
// ---------------------------------------------------------------------------

/**
 * One breed per dog when the counts match ("Beagle & Beagle Mix"), one breed
 * for every dog when only one is given ("Working Cocker Spaniels"), otherwise
 * null: the team reads the original. A cross ("Pomeranian/Japanese spitz Mix")
 * stays one breed.
 */
export function splitBreeds(raw: string, count: number): string[] | null {
  const v = tidy(raw);
  if (!v || isNone(v)) return [];
  if (count <= 1) return [title(v)];
  const parts = v
    .split(/\s*(?:,|&|\+|;|\||\band\b)\s*/i)
    .map((x) => title(tidy(x)))
    .filter(Boolean);
  if (parts.length === count) return parts;
  if (parts.length === 1) return Array(count).fill(singular(parts[0]));
  return null;
}

/** "Working Cocker Spaniels" → "Working Cocker Spaniel", for a breed shared by several dogs. */
function singular(breed: string): string {
  return breed
    .replace(/^(both|all|x\d+|\d+\s*x)\s+/i, '')
    .replace(/(\p{L}{3,})(ies)$/u, '$1y')
    .replace(/(\p{L}{3,}[^s])s$/u, '$1');
}

// ---------------------------------------------------------------------------
// Dates of birth
// ---------------------------------------------------------------------------

/** One date as typed, to YYYY-MM-DD. Day first, unless the second number can only be a day. */
export function parseDogDate(raw: string): string | null {
  let v = tidy(raw).toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, '$1');
  // "23 August 2023", "Jan27 2025", "August 2023"
  const named = v.match(/^(?:(\d{1,2})\s*)?([a-z]{3})[a-z]*\.?\s*(\d{1,2})?,?\s*(\d{4})$/);
  if (named && MONTHS.includes(named[2])) {
    const day = named[1] ?? named[3] ?? '1';
    return normaliseDate(`${day}/${MONTHS.indexOf(named[2]) + 1}/${named[4]}`);
  }
  v = v.replace(/[.\-:_ ]+/g, '/');
  if (/^\d{8}$/.test(v)) v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
  if (/^\d{6}$/.test(v)) v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!m) return null;
  let [d, mo, y] = [Number(m[1]), Number(m[2]), m[3]];
  const year = y.length === 2 ? `20${y}` : y;
  if (mo > 12 && d <= 12) [d, mo] = [mo, d]; // American order
  return normaliseDate(`${d}/${mo}/${year}`);
}

const DATE_TOKEN =
  /\b(?:\d{1,2}(?:st|nd|rd|th)?\s+[a-z]{3,9}\.?,?\s+\d{4}|[a-z]{3,9}\.?\s*\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|[a-z]{3,9}\s+\d{4}|\d{1,2}[/.\-:]\d{1,2}[/.\-:]\d{2,4}|\d{8}|\d{6})\b/gi;

export interface DatesResult {
  /** One per dog, in name order; undefined where none could be placed. */
  dates: (string | undefined)[];
  /** Which of those were worked out from an age or a year. */
  estimated: boolean[];
  /** Why the result isn't a clean one-to-one match, for the report. */
  problem?: string;
}

/**
 * Lines dates up with dogs: by name where the owner wrote one beside a date
 * ("Koda: 28/12/22 Ivy: 15/05/2025"), in order otherwise. "Both same" or a
 * single date for several dogs born together gives each the same date. Ages
 * ("12 and 1") and bare years ("2020") become estimated dates.
 */
export function placeDates(raw: string, names: string[]): DatesResult {
  const count = Math.max(1, names.length);
  const v = tidy(raw);
  const empty = { dates: Array(count).fill(undefined), estimated: Array(count).fill(false) };
  if (!v || isNone(v)) return empty;

  const found: { iso: string; at: number }[] = [];
  for (const m of v.matchAll(DATE_TOKEN)) {
    const iso = parseDogDate(m[0]);
    if (iso) found.push({ iso, at: m.index ?? 0 });
  }
  const valid = found.filter((f) => f.iso <= todayIso && ageOn(f.iso, today) <= 30);
  const problems: string[] = [];
  if (valid.length < found.length) problems.push('a date in the future or over 30 years ago');

  if (valid.length) {
    // Named: "Rocco 21/09/2020"
    const lower = v.toLowerCase();
    const byName = names.map((n) => {
      const at = lower.indexOf(n.toLowerCase());
      if (at < 0) return undefined;
      return valid.find((d) => d.at > at && !names.some((o) => o !== n && lower.indexOf(o.toLowerCase(), at + n.length) >= 0 && lower.indexOf(o.toLowerCase(), at + n.length) < d.at))?.iso;
    });
    if (names.length > 1 && byName.every(Boolean)) return { dates: byName, estimated: Array(count).fill(false) };

    if (valid.length === count) return { dates: valid.map((d) => d.iso), estimated: Array(count).fill(false), problem: problems[0] };
    if (valid.length === 1 && (count === 1 || /\b(both|same|all)\b/i.test(v))) {
      return { dates: Array(count).fill(valid[0].iso), estimated: Array(count).fill(false), problem: problems[0] };
    }
    const dates = Array.from({ length: count }, (_, i) => valid[i]?.iso);
    return { dates, estimated: Array(count).fill(false), problem: `${valid.length} dates for ${count} dog${count === 1 ? '' : 's'}` };
  }

  // No full dates: bare years ("2020, 2021") or ages ("12 and 1", "8,8 & 5").
  const years = [...v.matchAll(/\b(19[89]\d|20[0-2]\d)\b/g)].map((m) => Number(m[1]));
  const ages = years.length ? [] : [...v.matchAll(/\b(\d{1,2})(?:\s*(?:years?|yrs?|y\/?o))?\b/gi)].map((m) => Number(m[1])).filter((n) => n <= 25);
  const guess = (years.length ? years.map((y) => `${y}-07-01`) : ages.map((a) => `${today.getFullYear() - a}-${todayIso.slice(5)}`)).filter(
    (iso) => iso <= todayIso,
  );
  if (guess.length === count || (guess.length === 1 && count === 1)) {
    return { dates: guess.slice(0, count), estimated: Array(count).fill(true), problem: undefined };
  }
  return { ...empty, problem: 'no date we could read' };
}

// ---------------------------------------------------------------------------
// Diet and size
// ---------------------------------------------------------------------------

const DIET: [string, RegExp][] = [
  ['raw', /\braw\b|barf|natures menu|bella ?& ?duke|paleo/i],
  ['dry', /kibble|\bdry\b|biscuit|dried/i],
  ['wet', /\bwet\b|\btins?\b|tinned|pouch|canned/i],
  ['fresh', /fresh|cooked|home ?(made|cooked)|butternut|lily'?s|tails\.com|natural/i],
  ['grain_free', /grain[\s-]?free|no grain|gluten[\s-]?free/i],
  ['vet_diet', /prescription|vet diet|veterinary|hypoallergenic|hydrolysed|renal|sensitive stomach diet/i],
];

/** Diet answers that mean "no preference". */
const NO_PREFERENCE =
  /^(?:they |he |she |will |eats |likes )*(?:any(?:thing)?|everything|all|normal|mixed|not (?:fussy|picky)|no (?:specific )?(?:dietary )?(?:preferences?|restrictions|requirements)|anything (?:&|and) everything|most things|doesn.t have any|nothing|no|nil|none|n\/?a|na|non)[!. ]*$/i;
const noPreference = (v: string) => isNone(v) || NO_PREFERENCE.test(v);

/** Free-text diet → the CRM's diet options. Empty when nothing matches. */
export function mapDiet(raw: string): string[] {
  const v = tidy(raw);
  if (noPreference(v)) return [];
  return DIET.filter(([, re]) => re.test(v)).map(([k]) => k);
}

/** The owner's own words about food, kept when they say more than an option does ("Chicken, no beef"). */
export function foodNotes(raw: string): string | undefined {
  const v = tidy(raw);
  if (noPreference(v)) return undefined;
  const plain = /^(raw( fed| food)?|kibble|dry( food)?|wet( food)?|fresh|grain[\s-]?free|raw and kibble|kibble and wet)\.?$/i;
  return plain.test(v) ? undefined : v.slice(0, 500);
}

// Breed → size, by typical adult weight (the CRM's bands: toy under 5kg,
// small 5 to 10, medium 10 to 25, large 25 to 40, giant over 40). Longest
// names first, so "miniature schnauzer" wins over "schnauzer". Crosses and
// breeds that vary a lot (doodles, lurchers, bullies) are left blank.
const SIZES: [RegExp, string][] = [
  [/toy poodle|chihuahua|yorkshire|yorkie|pomeranian|\bpom\b|papillon|maltese|miniature pinscher|min ?pin|chinese crested|griffon|japanese chin|russian toy|yorkipoo|chorkie|pomchi/i, 'toy'],
  [/miniature schnauzer|mini(ature)? schnauzer|miniature poodle|mini(ature)? dachshund|sausage dog|cavalier|king charles|shih[\s-]?tzu|shitzu|shih[\s-]?poo|bichon|bischon|cavapoo|cavachon|maltipoo|jack russell|\bjrt\b|westie|west highland|border terrier|lhasa|havanese|pug\b|boston terrier|patterdale|norfolk terrier|norwich terrier|cairn|jackapoo|jackadoodle|schnoodle|coton|shiba|italian greyhound|dachshund|cockapoo|cockerpoo|shorkie|frug/i, 'small'],
  [/french bulldog|frenchie|beagle|cocker spaniel|\bcocker\b|sprocker|springer|border collie|staffordshire bull|\bstaff(y|ie)?\b|corgi|whippet|shetland|sheltie|australian shepherd|aussie|english bulldog|british bulldog|\bbulldog|standard schnauzer|husky|samoyed|basset|bull terrier|welsh terrier|fox terrier|kelpie|brittany|keeshond|puggle|sprollie|cockapoo working|shar[\s-]?pei|chow chow/i, 'medium'],
  [/labrador|\blab\b|golden retriever|\bgolden\b|german shepherd|\bgsd\b|rottweiler|doberman|dobermann|boxer|dalmatian|belgian malinois|malinois|weimaraner|greyhound|rhodesian|flat[\s-]?coat|retriever|pointer|vizsla|setter|akita|standard poodle|ridgeback|dutch shepherd|bloodhound|airedale/i, 'large'],
  [/great dane|newfoundland|mastiff|saint bernard|st\.? bernard|irish wolfhound|leonberger|cane corso|dogue de bordeaux|bernese|pyrenees|anatolian|tibetan mastiff/i, 'giant'],
];
const UNSURE = /\bmix|mixed|\bcross|\bx\b|mutt|mongrel|rescue|doodle|lurcher|bully|unknown|not sure/i;

/** A size estimated from the breed, or null when the breed doesn't settle it. */
export function sizeFromBreed(breed: string | undefined): string | null {
  if (!breed || UNSURE.test(breed)) return null;
  const hits = new Set<string>();
  for (const [re, size] of SIZES) if (re.test(breed)) { hits.add(size); break; }
  return hits.size === 1 ? [...hits][0] : null;
}

// ---------------------------------------------------------------------------
// One household
// ---------------------------------------------------------------------------

export interface DogsResult {
  dogs: ImportedDog[];
  problems: string[];
}

export function importDogs(raw: { names: string; breeds: string; dates: string; diet: string; allergies: string }): DogsResult {
  const problems: string[] = [];
  let names = splitNames(raw.names);
  const breedsAlone = splitBreeds(raw.breeds, 1);
  if (!names.length && !(breedsAlone ?? []).length) return { dogs: [], problems: ['no dog'] };
  if (!names.length) names = [''];
  if (names.length > 6) {
    problems.push(`${names.length} dogs named, the CRM holds 6`);
    names = names.slice(0, 6);
  }

  const breeds = splitBreeds(raw.breeds, names.length);
  if (breeds === null) problems.push('breeds could not be matched to each dog');
  const dated = placeDates(raw.dates, names);
  if (dated.problem) problems.push(dated.problem);

  const diet = mapDiet(raw.diet);
  const food = foodNotes(raw.diet);
  const allergyText = isNone(raw.allergies) ? '' : tidy(raw.allergies).slice(0, 1000);

  const dogs = names.map((name, i): ImportedDog => {
    const dog: ImportedDog = {};
    const estimated: string[] = [];
    if (name) dog.name = name.slice(0, 80);
    const breed = breeds?.[i] ?? (breeds === null ? tidy(raw.breeds) : undefined);
    if (breed) dog.breed = breed.slice(0, 120);
    const size = sizeFromBreed(breeds ? breed : undefined);
    if (size) { dog.size = size; estimated.push('size'); }
    if (dated.dates[i]) {
      dog.birth_date = dated.dates[i];
      if (dated.estimated[i]) estimated.push('birth_date');
    }
    if (diet.length) dog.diet = diet;
    if (food) dog.food_notes = food;
    // Allergies naming one dog go to that dog; otherwise to every dog.
    if (allergyText) {
      const named = names.filter((n) => n && allergyText.toLowerCase().includes(n.toLowerCase()));
      if (!named.length || named.includes(name)) dog.allergies = allergyText;
    }
    if (estimated.length) dog._estimated = estimated;
    return dog;
  });
  return { dogs, problems };
}
