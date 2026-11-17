/**
 * Creator CRM: the contract between the portable system and an agency.
 *
 * The system owns the core of a creator record (contact, address, sizes,
 * socials, rate, status), which every agency needs and which lives in real
 * database columns. An agency adds its own niche questions as `ProfileStep`s;
 * their answers live in the `details` JSON column, keyed by field key. The
 * join form, profile page, CRM table filters, detail page and CSV export are
 * all generated from these definitions, so a new agency changes its questions
 * here and never edits a component.
 */

export interface Option {
  value: string;
  label: string;
}

interface FieldBase {
  /** Stored under this key in `details`. Lowercase snake_case. */
  key: string;
  label: string;
  hint?: string;
  required?: boolean;
  /** Offer this field as a filter in the CRM table. */
  filter?: boolean;
  /** A shorter label for the CRM filter bar. */
  filterLabel?: string;
  /** The label the team sees (detail page, export), when `label` speaks to the creator. */
  teamLabel?: string;
}

/** An age range, inclusive, in whole years worked out from a date on the day. */
export type AgeBand = Option & { min: number; max: number };

export type FieldDef =
  | (FieldBase & { type: 'text'; max?: number; placeholder?: string })
  | (FieldBase & { type: 'textarea'; max?: number; placeholder?: string })
  | (FieldBase & { type: 'select'; options: Option[] })
  | (FieldBase & { type: 'multi'; options: Option[] })
  /**
   * A date in the past, such as a birthday. Stored as YYYY-MM-DD and shown
   * with the age it gives today. With `bands` (and `filter`) the CRM filters
   * by age range, so a filter never goes stale the way a stored age would.
   */
  | (FieldBase & { type: 'date'; bands?: AgeBand[]; maxYears?: number });

/**
 * A step whose fields are asked once per item, with "add another": one
 * entry per pet, child or vehicle. Answers are stored as a list under `key`.
 */
export interface RepeatDef {
  /** Stored under this key in `details`, as a list of answer sets. */
  key: string;
  /** One item, for headings and the export: "Pet" gives "Pet 1", "Pet 2". */
  item: string;
  /** Most items allowed. At least one is always asked for. */
  max: number;
  /** The add button: "Add another pet". */
  add: string;
  /** Fields that sum an item up in the CRM table, in order. A date shows as an age. */
  summary: string[];
  /** The CRM table's column heading: "Pets". */
  tableLabel: string;
}

/** One page of the join form. */
export interface ProfileStep {
  id: string;
  title: string;
  /** The heading the team sees, when `title` speaks to the creator. */
  teamTitle?: string;
  blurb: string;
  fields: FieldDef[];
  /** Ask this step's fields once per item, with "add another". */
  repeat?: RepeatDef;
}

/** Colours and type for the CRM's emails, so each agency's look in its own inbox. */
export interface EmailTheme {
  ground: string;
  card: string;
  ink: string;
  muted: string;
  accent: string;
  button: string;
  buttonInk: string;
  font: string;
  /** A display face for headings, with fallbacks. */
  headingFont?: string;
  /** The line under each heading, e.g. the brand's accent. Omit for none. */
  rule?: string;
  /** Logo above the card (a hosted PNG: email clients block SVG). */
  logo?: { src: string; alt: string; width: number };
  /** A dark footer under the card. `lines` are trusted HTML from the agency config. */
  footer?: {
    background: string;
    ink: string;
    muted: string;
    logo?: { src: string; alt: string; width: number };
    icons?: { src: string; href: string; alt: string }[];
    lines: string[];
  };
}

/**
 * The welcome email the team can send from the CRM when they approve a
 * creator. Plain text in each part; the system lays it out.
 */
export interface WelcomeEmail {
  subject: string;
  /** Opens the email, after "Hi <first name>,". */
  intro: string;
  steps: { title: string; body: string }[];
  tips: string[];
  help: string;
  close: string;
  signoff: string;
  /** Replies go here, since the sending address can't receive mail. */
  replyTo: string[];
}

export interface CrmConfig {
  /** Agency questions, shown as their own steps after "About you". */
  steps: ProfileStep[];
  /**
   * The owner's own sizes and diet ("Sizes and diet": top, bottoms, shoe,
   * dietary requirements, allergies). Tops and bottoms share one scale; labels
   * carry the local size. Omit for an agency whose gifting never includes
   * anything for the creator themselves, and the step disappears everywhere.
   */
  clothingSizes?: Option[];
  /** Countries offered for the address. The first is the default. */
  countries: Option[];
  /** Currency symbol for the creator's rate. */
  currency: string;
  minAge: number;
  /** Shown beside the consent checkbox. */
  consent: { text: string; privacyHref: string; termsHref: string };
  /** The morning email listing new applications. */
  digest: { to: string[]; from: string };
  /** The look of every CRM email. */
  emailTheme: EmailTheme;
  /** Sent, if the team ticks the box, when a creator is moved to Approved. */
  welcome?: WelcomeEmail;
}

export type ApplicationStatus = 'new' | 'reviewing' | 'approved' | 'rejected' | 'inactive';

/** One answer: a string, or a list for multi fields. */
export type DetailValue = string | string[];

/**
 * One item of a repeated step (one pet, say), keyed by field key. `_estimated`
 * lists any keys filled in by the team or an import rather than the creator;
 * it is dropped the next time the creator saves, which confirms them.
 */
export type DetailItem = Record<string, DetailValue>;

/** Agency answers, keyed by `FieldDef.key`; a repeated step's are a list under its `repeat.key`. */
export type Details = Record<string, DetailValue | DetailItem[]>;

/** A creator row exactly as the database returns it. */
export interface Creator {
  id: string;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
  source: 'signup' | 'import';
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  town: string | null;
  county: string | null;
  postcode: string | null;
  country: string | null;
  gender: string | null;
  date_of_birth: string | null;
  clothing_size: string | null;
  trouser_size: string | null;
  shoe_size: string | null;
  dietary_requirements: string | null;
  allergies: string | null;
  instagram_url: string | null;
  instagram_followers: number | null;
  tiktok_url: string | null;
  tiktok_followers: number | null;
  youtube_url: string | null;
  youtube_followers: number | null;
  rate_per_post: number | null;
  join_gifting_network: boolean;
  additional_notes: string | null;
  details: Details;
  privacy_consent_at: string | null;
  application_status: ApplicationStatus;
  admin_notes: string | null;
  /** Mailchimp's subscription status, null until first synced. Team only. */
  /** When a signup confirmed their email; null until then (imports: from their login). */
  email_confirmed_at?: string | null;
  email_marketing?: 'subscribed' | 'unsubscribed' | 'cleaned' | null;
  email_marketing_at?: string | null;
  mailchimp_synced_at?: string | null;
}
