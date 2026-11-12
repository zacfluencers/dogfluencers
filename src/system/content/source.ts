/**
 * Content source abstraction.
 *
 * Implemented by the agency's fixtures and by `createSanitySource`.
 * `src/content.ts` picks one from the agency config; components never know which.
 */
import type {
  Article,
  Brand,
  Campaign,
  ContentStatus,
  CreatorCategory,
  Faq,
  ReelClip,
  WorkItem,
  Service,
  Statistic,
  Testimonial,
} from '../types/content';

export interface ContentSource {
  services(): Promise<Service[]>;
  service(slug: string): Promise<Service | undefined>;
  campaigns(): Promise<Campaign[]>;
  campaign(slug: string): Promise<Campaign | undefined>;
  brands(): Promise<Brand[]>;
  testimonials(): Promise<Testimonial[]>;
  creatorCategories(): Promise<CreatorCategory[]>;
  statistics(): Promise<Statistic[]>;
  faqs(): Promise<Faq[]>;
  articles(): Promise<Article[]>;
  article(slug: string): Promise<Article | undefined>;
  heroReel(): Promise<ReelClip[]>;
  work(): Promise<WorkItem[]>;
}

/** True during `astro dev`, false in a production build. */
export const IS_DEV = import.meta.env.DEV;

/**
 * Review mode: placeholders, their badges and the content-required notes all
 * render. Always on in `astro dev`; on in a build only when the deployment
 * sets `PUBLIC_SHOW_PLACEHOLDERS=true`, which the client-review deployment
 * does. Every placeholder shown this way carries its visible badge, so an
 * unverified claim never appears unlabelled. Unset it at launch.
 */
export const SHOW_PLACEHOLDERS = IS_DEV || import.meta.env.PUBLIC_SHOW_PLACEHOLDERS === 'true';

/**
 * Builds drop anything still marked `placeholder`, so unverified metrics,
 * testimonials, logos and case studies can never ship — unless review mode is
 * on (see `SHOW_PLACEHOLDERS`), where they are kept so the layout is reviewable.
 */
export function publishable<T extends { status: ContentStatus }>(records: T[]): T[] {
  if (SHOW_PLACEHOLDERS) return records;
  return records.filter((record) => record.status === 'approved');
}

/** Records awaiting sign-off, for the dev-only content checklist. */
export function pending<T extends { status: ContentStatus }>(records: T[]): T[] {
  return records.filter((record) => record.status === 'placeholder');
}
