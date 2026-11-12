/**
 * Active content source for this site.
 *
 * This is the single swap point between placeholder fixtures and the CMS, and
 * it lives in the app layer rather than in `src/system`: the system layer must
 * not know which agency it is serving. The agency config decides; without a
 * `cms.sanity` block the site builds from the fixtures in `src/agency/content`.
 */
import { agency } from './agency/config';
import { content as fixtures } from './agency/content';
import { createSanitySource } from './system/content/sanity';
import type { ContentSource } from './system/content/source';

const sanity = agency.cms?.sanity;

export const content: ContentSource = sanity
  ? createSanitySource({ ...sanity, token: import.meta.env.SANITY_READ_TOKEN })
  : fixtures;

/** FAQs for the brand-facing pages: everything not aimed at creators. */
export async function brandFaqs() {
  return (await content.faqs()).filter((faq) => faq.category !== 'Creators');
}

/** FAQs for the creator-facing pages. */
export async function creatorFaqs() {
  return (await content.faqs()).filter((faq) => faq.category === 'Creators');
}

export * from './system/content/source';
