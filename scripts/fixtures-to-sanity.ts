/**
 * Writes the agency's fixture content as a Sanity import file (NDJSON), so a new
 * Studio starts with everything the site already shows, statuses intact.
 *
 *   npx tsx scripts/fixtures-to-sanity.ts ../studio-<agency>/seed/seed.ndjson
 *   cd ../studio-<agency> && npx sanity dataset import seed/seed.ndjson production --replace
 *
 * Document IDs are derived from slugs, so re-running replaces rather than
 * duplicates. Imports the fixture files directly, not `content/index.ts`, which
 * needs Astro's `import.meta.env`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Faq, RichTextBlock } from '../src/system/types/content';
import { articles } from '../src/agency/content/articles';
import { creatorCategories } from '../src/agency/content/creators';
import { faqs, serviceFaqs } from '../src/agency/content/faqs';
import { brands, campaigns, statistics, testimonials } from '../src/agency/content/proof';
import { heroReel } from '../src/agency/content/reel';
import { services } from '../src/agency/content/services';
import { work } from '../src/agency/content/work';

const out = process.argv[2];
if (!out) {
  console.error('Usage: npx tsx scripts/fixtures-to-sanity.ts <output.ndjson>');
  process.exit(1);
}

type Doc = Record<string, unknown> & { _id: string; _type: string };

let keyCount = 0;
const key = () => `k${(keyCount++).toString(36).padStart(4, '0')}`;
const slug = (current: string) => ({ _type: 'slug', current });
const ref = (id: string) => ({ _type: 'reference', _ref: id, _key: key() });
const keyed = <T extends object>(items?: T[]) => items?.map((item) => ({ _key: key(), ...item }));

const faqId = (faq: Faq) => `faq-${faqs.indexOf(faq) + 1}`;
const brandIdByName = new Map(brands.map((brand) => [brand.name, `brand-${brand.slug}`]));

function block(text: string, style = 'normal', listItem?: 'bullet' | 'number') {
  return {
    _type: 'block',
    _key: key(),
    style,
    ...(listItem ? { listItem, level: 1 } : {}),
    markDefs: [],
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
  };
}

function portableText(body: RichTextBlock[]) {
  return body.flatMap((item): object[] => {
    switch (item.type) {
      case 'heading':
        return [block(item.text, `h${item.level}`)];
      case 'paragraph':
        return [block(item.text)];
      case 'list':
        return item.items.map((text) => block(text, 'normal', item.ordered ? 'number' : 'bullet'));
      case 'quote':
        return [{ _type: 'pullQuote', _key: key(), text: item.text, attribution: item.attribution }];
      case 'image':
        // Fixtures reference local paths; images are uploaded in the Studio.
        return [];
    }
  });
}

/** Drops undefined so the NDJSON carries only fields that have values. */
const clean = (doc: Doc): Doc => JSON.parse(JSON.stringify(doc));

const docs: Doc[] = [
  ...faqs.map((faq) => ({ _id: faqId(faq), _type: 'faq', ...faq })),

  ...services.map(({ slug: s, faqs: _faqs, media: _media, video: _video, seo: _seo, ...service }, index) => ({
    _id: `service-${s}`,
    _type: 'service',
    ...service,
    slug: slug(s),
    features: keyed(service.features),
    process: keyed(service.process),
    faqs: (serviceFaqs[s] ?? []).map((faq) => ref(faqId(faq))),
    order: index + 1,
  })),

  ...creatorCategories.map(({ slug: s, image: _image, ...category }) => ({
    _id: `creatorCategory-${s}`,
    _type: 'creatorCategory',
    ...category,
    slug: slug(s),
  })),

  ...brands.map(({ slug: s, logo: _logo, ...brand }, index) => ({
    _id: `brand-${s}`,
    _type: 'brand',
    ...brand,
    slug: slug(s),
    order: index + 1,
  })),

  ...statistics.map((statistic, index) => ({
    _id: `statistic-${index + 1}`,
    _type: 'statistic',
    ...statistic,
    order: index + 1,
  })),

  ...campaigns.map(({ slug: s, brand, testimonial: _t, heroImage: _h, gallery: _g, seo: _seo, ...campaign }, index) => {
    const brandId = brand ? brandIdByName.get(brand) : undefined;
    if (brand && !brandId) throw new Error(`Campaign ${s} names brand "${brand}", which has no brand record`);
    return {
      _id: `campaign-${s}`,
      _type: 'campaign',
      ...campaign,
      slug: slug(s),
      brand: brandId && { _type: 'reference', _ref: brandId },
      metrics: keyed(campaign.metrics),
      order: index + 1,
    };
  }),

  ...testimonials.map(({ campaign, image: _i, companyLogo: _l, video: _v, ...testimonial }, index) => ({
    _id: `testimonial-${index + 1}`,
    _type: 'testimonial',
    ...testimonial,
    campaign: campaign && { _type: 'reference', _ref: `campaign-${campaign}` },
    order: index + 1,
  })),

  ...articles.map(({ slug: s, body, relatedArticles, featuredImage: _f, seo: _seo, ...article }) => ({
    _id: `article-${s}`,
    _type: 'article',
    ...article,
    slug: slug(s),
    body: portableText(body),
    relatedArticles: relatedArticles?.map((related) => ref(`article-${related}`)),
  })),

  ...work.map((item, index) => ({
    _id: `work-${index + 1}`,
    _type: 'work',
    status: item.status,
    caption: item.caption,
    service: item.service && { _type: 'reference', _ref: `service-${item.service.slug}` },
    video: { _type: 'video', alt: item.video.alt },
    order: index + 1,
  })),

  ...heroReel.map((clip, index) => ({
    _id: `reelClip-${index + 1}`,
    _type: 'reelClip',
    status: clip.status,
    video: { _type: 'video', alt: clip.video.alt },
    order: index + 1,
  })),
];

// Media lives in public/ today and has to be uploaded in the Studio, so the
// script refuses to drop a file reference silently.
const withMedia = [...services, ...campaigns, ...testimonials, ...articles, ...creatorCategories, ...brands].filter(
  (record) =>
    ['media', 'video', 'image', 'logo', 'heroImage', 'featuredImage', 'companyLogo', 'gallery'].some(
      (field) => (record as unknown as Record<string, unknown>)[field]
    )
);
const reelWithMedia = heroReel.filter((clip) => clip.video.src);
if (withMedia.length || reelWithMedia.length) {
  console.warn(`Note: ${withMedia.length + reelWithMedia.length} records have media; upload it in the Studio.`);
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, docs.map((doc) => JSON.stringify(clean(doc))).join('\n') + '\n');
console.log(`Wrote ${docs.length} documents to ${out}`);
