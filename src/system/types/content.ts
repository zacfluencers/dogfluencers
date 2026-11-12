/**
 * Portable content model.
 *
 * These types mirror the Sanity schema one-for-one so that a Sanity-backed
 * ContentSource can be dropped in without touching a single component.
 * Nothing here may reference a specific agency or niche.
 */

/**
 * Every record carries a status. `placeholder` means "structure is real, the
 * content is not yet signed off". Proof content (metrics, testimonials, brand
 * logos, campaigns) is only rendered in production when `approved`, so an
 * unfinished site omits a section rather than publishing an invented claim.
 */
export type ContentStatus = 'approved' | 'placeholder';

export interface ImageRef {
  /** Omit to render the tinted fallback surface instead of a broken image. */
  src?: string;
  /** Empty string marks the image as decorative. */
  alt: string;
  width?: number;
  height?: number;
}

/** A short muted, looping clip. Omit `src` to render the missing-media surface. */
export interface VideoRef {
  src?: string;
  /** Still shown before the clip loads, and instead of it without JavaScript. */
  poster?: string;
  /** Describes the clip for assistive technology. */
  alt: string;
  /** The full-length video, with sound. Where a grid supports it, the clip opens this in a player. */
  full?: string;
}

/** One clip in the homepage hero reel. Portrait, 9:16. */
export interface ReelClip {
  id: string;
  video: VideoRef;
  status: ContentStatus;
}

/**
 * A piece of creator content made for a client, shown as proof of the work
 * itself rather than a quote about it. Portrait, 9:16.
 */
export interface WorkItem {
  id: string;
  /** Client name. Only shown once the client relationship is approved. */
  brand?: string;
  service?: { title: string; slug: string };
  /** One line on what was made, e.g. "Paid social cut-down". */
  caption?: string;
  video: VideoRef;
  status: ContentStatus;
}

export interface Seo {
  title?: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
  socialImage?: ImageRef;
}

export interface Link {
  label: string;
  href: string;
  /** Analytics event name, dispatched on click. No provider is assumed. */
  event?: string;
  external?: boolean;
}

export interface Metric {
  label: string;
  value: string;
  context?: string;
}

export interface Statistic extends Metric {
  status: ContentStatus;
}

export interface Brand {
  name: string;
  slug: string;
  logo?: ImageRef;
  category?: string;
  website?: string;
  description?: string;
  featured?: boolean;
  status: ContentStatus;
  /**
   * Optical correction, 1 by default: a mark that reads light (thin type, a
   * tall icon beside small text) can be nudged up so it matches the others.
   */
  logoScale?: number;
  /** Set when the working relationship has ended, so copy can stay accurate. */
  relationshipEnded?: boolean;
}

export type ServiceSlug = string;

export interface ServiceFeature {
  title: string;
  description?: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
  image?: ImageRef;
}

/** A priced package for a service, e.g. a gifting campaign size. */
export interface ServicePackage {
  name: string;
  /** As shown, e.g. "£2,850". */
  price: string;
  /** Beside the price, e.g. "+ VAT". */
  priceNote?: string;
  /** One line on who it suits. */
  summary?: string;
  /** What's included, one item per line. A leading figure is set in bold. */
  inclusions: string[];
  /** Picks this package out in the accent. Only for a fact the business stands behind. */
  featured?: boolean;
  /** A short label above a featured package, e.g. "Most popular". */
  badge?: string;
}

export interface Service {
  title: string;
  slug: ServiceSlug;
  shortDescription: string;
  description?: string;
  media?: ImageRef;
  /** Example clip, 9:16. Shown as a still that plays on hover in service grids. */
  video?: VideoRef;
  features?: ServiceFeature[];
  process?: ProcessStep[];
  /** Priced packages, shown as a band on the service page. */
  packages?: ServicePackage[];
  /** The packages band's heading and intro; sensible defaults apply. */
  packagesHeading?: string;
  packagesIntro?: string;
  /** Under the packages, e.g. what every package includes or excludes. */
  packagesNote?: string;
  faqs?: Faq[];
  seo?: Seo;
  featured?: boolean;
  status: ContentStatus;
}

export interface Campaign {
  title: string;
  slug: string;
  brand?: string;
  campaignType?: string;
  summary: string;
  objective?: string;
  solution?: string;
  results?: string;
  metrics?: Metric[];
  creatorCount?: number;
  gallery?: ImageRef[];
  /** Creator clips made for the campaign, 9:16, shown as "The work" on its page. */
  videos?: VideoRef[];
  heroImage?: ImageRef;
  testimonial?: Testimonial;
  featured?: boolean;
  publishDate?: string;
  seo?: Seo;
  status: ContentStatus;
}

export interface Testimonial {
  quote: string;
  person: string;
  role?: string;
  company?: string;
  image?: ImageRef;
  companyLogo?: ImageRef;
  /** The work made for this client, 9:16. Plays beside the featured quote. */
  video?: VideoRef;
  /** Slug of the campaign this quote is about; links the quote to its case study. */
  campaign?: string;
  featured?: boolean;
  status: ContentStatus;
}

export interface CreatorCategory {
  name: string;
  slug: string;
  description?: string;
  image?: ImageRef;
  featured?: boolean;
  order?: number;
  status: ContentStatus;
}

export interface Faq {
  question: string;
  answer: string;
  category?: string;
  order?: number;
  status: ContentStatus;
}

export interface Article {
  title: string;
  slug: string;
  excerpt: string;
  /** Portable-text-shaped blocks, kept deliberately narrow. */
  body: RichTextBlock[];
  author?: string;
  publishDate?: string;
  updatedDate?: string;
  featuredImage?: ImageRef;
  category?: string;
  tags?: string[];
  seo?: Seo;
  relatedArticles?: string[];
  status: ContentStatus;
}

/**
 * A run of text inside a paragraph or list item: bold and links only, the
 * two marks articles need (an emphasised phrase, a link to another article).
 * `text` on the block is always the plain version.
 */
export interface InlineSpan {
  text: string;
  bold?: boolean;
  href?: string;
}

export type RichTextBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string; spans?: InlineSpan[] }
  | { type: 'list'; ordered?: boolean; items: string[]; spans?: InlineSpan[][] }
  /** A photo within the text, shown at its own proportions. */
  | { type: 'image'; image: ImageRef; caption?: string }
  | { type: 'quote'; text: string; attribution?: string };
