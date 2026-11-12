/**
 * Dogfluencers content source.
 *
 * Implements the same `ContentSource` interface a Sanity-backed source will,
 * so swapping CMS in touches only `src/content.ts`.
 *
 * `publishable()` strips anything still marked `placeholder` from production
 * builds, so unverified proof content cannot ship.
 */
import type { ContentSource } from '../../system/content/source';
import { publishable } from '../../system/content/source';
import { services } from './services';
import { creatorCategories } from './creators';
import { faqs, serviceFaqs } from './faqs';
import { brands, campaigns, statistics, testimonials } from './proof';
import { articles } from './articles';
import { heroReel } from './reel';
import { work } from './work';

export const content: ContentSource = {
  async services() {
    return publishable(services).map((service) => ({
      ...service,
      faqs: service.faqs ?? serviceFaqs[service.slug],
    }));
  },
  async service(slug) {
    return (await this.services()).find((service) => service.slug === slug);
  },
  async campaigns() {
    return publishable(campaigns);
  },
  async campaign(slug) {
    return publishable(campaigns).find((campaign) => campaign.slug === slug);
  },
  async brands() {
    return publishable(brands);
  },
  async testimonials() {
    return publishable(testimonials);
  },
  async creatorCategories() {
    return publishable(creatorCategories);
  },
  async statistics() {
    return publishable(statistics);
  },
  async faqs() {
    return publishable(faqs);
  },
  async articles() {
    return publishable(articles).sort((a, b) =>
      (b.publishDate ?? '').localeCompare(a.publishDate ?? '')
    );
  },
  async article(slug) {
    return publishable(articles).find((article) => article.slug === slug);
  },
  async heroReel() {
    return publishable(heroReel);
  },
  async work() {
    return publishable(work);
  },
};

/**
 * Outstanding content the business owes before launch. Mirrors the checklist in
 * AGENCY_CONFIG_TEMPLATE.md and is what the dev-only notices point at.
 */
export const contentRequirements = [
  'Confirm the enquiry inbox, and verify send.dogfluencers.agency in Resend',
  'Supply the logo as SVG',
  'Confirm the six partner brands are still happy to be listed',
  'Supply verified network and campaign statistics, or drop the stats section',
  'Supply approved client testimonials with names, roles and companies',
  'Supply 3+ real case studies with verified metrics and cleared imagery',
  'Supply 4 to 6 portrait (9:16) dog clips for the homepage hero, rights cleared',
  'Supply one example clip (9:16) per service',
  'Confirm which service each piece of work was made under',
  'Confirm what the 12 months quality assurance covers',
  'Sign off service copy and the creator questions in crm.ts',
  'Review privacy, cookie and terms copy for Dogfluencers',
];
