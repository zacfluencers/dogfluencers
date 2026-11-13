/**
 * Agency configuration contract.
 *
 * One object per agency, supplied by `src/agency/config.ts`. Components read
 * terminology and positioning from here and must never hard-code an agency
 * name, niche or noun.
 */
import type { ImageRef, Link, Seo } from './content';

export interface AgencySite {
  /** Canonical origin, no trailing slash. */
  url: string;
  /** Route suffixes kept out of sitemap.xml. */
  excludeFromSitemap: string[];
  locale: string;
  /** ISO 3166-1 alpha-2, used for hreflang and Organization schema. */
  country: string;
}

export interface AgencyContact {
  email: string;
  phone?: string;
  /** Only rendered when supplied by the business. */
  addressLines?: string[];
  companyName?: string;
  companyNumber?: string;
  /** Where the enquiry form delivers. Server-side only, never rendered. */
  enquiries?: {
    /** Inbox that receives each enquiry. */
    to: string;
    /** Sender, on a domain verified with the email provider. */
    from: string;
  };
}

export interface AgencyTerminology {
  /** e.g. "home cooks" — used in body copy. */
  creatorNoun: string;
  /** e.g. "pet brands" */
  brandNoun: string;
  /** Singular creator noun for form and card labels. */
  creatorNounSingular: string;
  /** What the agency calls a piece of creator content. */
  contentNoun: string;
}

export interface AgencyPositioning {
  oneLine: string;
  long: string;
  heroEyebrow?: string;
  heroHeadline: string;
  heroDescription: string;
}

export interface AgencyCtas {
  primary: Link;
  secondary: Link;
}

export interface AgencyNavItem extends Link {
  /** A dropdown's links; `description` is a one-line hint under each. */
  children?: (Link & { description?: string })[];
}

export type HomepageSection =
  | 'work'
  | 'hero'
  | 'brands'
  | 'positioning'
  | 'stats'
  | 'services'
  | 'process'
  | 'campaigns'
  | 'creatorNetwork'
  | 'testimonials'
  | 'insights'
  | 'cta';

export interface AgencyLogo extends ImageRef {
  /** Variant for dark backgrounds. Omit if the logo works on both. */
  srcDark?: string;
  /**
   * Typographic fallback, used only when no `src` is supplied — for an agency
   * whose artwork has not arrived yet. Renders as live text so it inherits
   * currentColor and needs no light/dark asset pair.
   */
  wordmark?: {
    primary: string;
    secondary?: string;
  };
}

export interface AgencyConfig {
  name: string;
  slug: string;
  shortName: string;
  niche: string;
  logo: AgencyLogo;
  site: AgencySite;
  contact: AgencyContact;
  terminology: AgencyTerminology;
  positioning: AgencyPositioning;
  ctas: AgencyCtas;
  /** Service slugs this agency offers, in display order. */
  enabledServices: string[];
  navigation: AgencyNavItem[];
  footerNavigation: { heading: string; links: Link[] }[];
  /**
   * Account entry points shown in the header, beside the theme switch at
   * desktop and under the buttons in the mobile menu (e.g. a creator login).
   * Keep to one or two: the header is the brand's, not a portal's.
   * `shortLabel` is used in the desktop row, where space is tight.
   */
  accountLinks?: (Link & { shortLabel?: string })[];
  /**
   * One always-in-reach action fixed along the bottom of the screen (e.g.
   * booking a call). `hideOn` lists path prefixes where it's left out.
   */
  ctaStrip?: { lead?: string; link: Link; hideOn?: string[] };
  /**
   * Sister agencies in the same group, shown as a set of logos on the About
   * page. Logos sit in /public and may be any single colour on a transparent
   * ground: they're repainted in --ink. `href` links each one when set.
   */
  sisterAgencies?: { name: string; logo: ImageRef; href?: string; logoScale?: number }[];
  legalLinks: Link[];
  socialLinks: Link[];
  homepageSections: HomepageSection[];
  seo: Required<Pick<Seo, 'title' | 'description'>> & {
    socialImage?: ImageRef;
    primaryKeywords: string[];
    secondaryKeywords: string[];
  };
  /** Copy describing who the creator network is and who can join. */
  creatorNetwork: {
    description: string;
    joinUrl: string;
    /** Set false when the agency does not pay for every opportunity. */
    allOpportunitiesPaid: boolean;
  };
  brandAudience: {
    description: string;
    categories: string[];
  };
  /** Where content comes from. Omit `sanity` to build from the local fixtures. */
  cms?: {
    sanity?: { projectId: string; dataset: string };
  };
}

const REQUIRED_PATHS = [
  'name',
  'slug',
  'site.url',
  'contact.email',
  'terminology.creatorNoun',
  'positioning.heroHeadline',
  'ctas.primary.label',
  'seo.title',
  'seo.description',
  'creatorNetwork.joinUrl',
] as const;

function read(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object') return (value as Record<string, unknown>)[key];
    return undefined;
  }, source);
}

/**
 * Fails the build loudly when required agency configuration is missing, rather
 * than silently rendering a broken site.
 */
export function assertAgencyConfig(config: AgencyConfig): AgencyConfig {
  const missing = REQUIRED_PATHS.filter((path) => {
    const value = read(config, path);
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Agency configuration is incomplete. Missing required values: ${missing.join(', ')}. ` +
        'Fill these in src/agency/config.ts before building.'
    );
  }

  if (config.site.url.endsWith('/')) {
    throw new Error('agency.site.url must not end with a trailing slash.');
  }

  return config;
}
