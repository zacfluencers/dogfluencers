/**
 * Sanity content source.
 *
 * Each agency has its own Sanity project, so queries are not scoped by agency.
 * The Studio schema mirrors `src/system/types/content.ts` field for field; the
 * GROQ projections below flatten references, slugs and assets into that shape.
 *
 * Runs at build time only (every content page is prerendered), so the site
 * picks up edits on the next deploy. Only published documents are read; drafts
 * never reach the site.
 */
import { createClient, type SanityClient } from '@sanity/client';
import type {
  Article,
  ContentStatus,
  Brand,
  Campaign,
  CreatorCategory,
  Faq,
  ReelClip,
  InlineSpan,
  RichTextBlock,
  Service,
  Statistic,
  Testimonial,
  WorkItem,
} from '../types/content';
import { publishable, type ContentSource } from './source';

export interface SanityConfig {
  projectId: string;
  dataset: string;
  apiVersion?: string;
  /** Read token, server-side only. Only needed if the dataset is private. */
  token?: string;
}

const image = (field: string) =>
  `${field}{ "src": asset->url, "alt": coalesce(alt, ""), "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height }`;

// Posters are sized for a 9:16 tile and served as WebP or AVIF where supported.
const video = (field: string) =>
  `${field}{ "src": file.asset->url, "poster": poster.asset->url + "?w=720&q=75&auto=format", "alt": coalesce(alt, ""), "full": fullFile.asset->url }`;

const seo = `seo{ title, description, canonical, noIndex, ${image('socialImage')} }`;

const faq = `question, answer, category, order, status`;

const testimonial = `
  quote, person, role, company, featured, status,
  ${image('image')}, ${image('companyLogo')}, ${video('video')},
  "campaign": campaign->slug.current
`;

const QUERIES = {
  services: `*[_type == "service"] | order(order asc) {
    title, "slug": slug.current, shortDescription, description, featured, status,
    ${image('media')}, ${video('video')},
    features[]{ title, description },
    process[]{ number, title, description, ${image('image')} },
    packages[]{ name, price, priceNote, summary, inclusions, featured, badge }, packagesHeading, packagesIntro, packagesNote,
    "faqs": faqs[]->{ ${faq} },
    ${seo}
  }`,
  campaigns: `*[_type == "campaign"] | order(order asc, publishDate desc) {
    title, "slug": slug.current, "brand": brand->name, campaignType, summary,
    objective, solution, results, creatorCount, featured, publishDate, status,
    metrics[]{ label, value, context },
    ${image('heroImage')},
    "gallery": gallery[]{ "src": asset->url, "alt": coalesce(alt, ""), "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height },
    "videos": ${video('videos[]')},
    "testimonial": testimonial->{ ${testimonial} },
    ${seo}
  }`,
  brands: `*[_type == "brand"] | order(order asc) {
    name, "slug": slug.current, category, website, description, featured,
    relationshipEnded, status, ${image('logo')}
  }`,
  testimonials: `*[_type == "testimonial"] | order(order asc) { ${testimonial} }`,
  creatorCategories: `*[_type == "creatorCategory"] | order(order asc) {
    name, "slug": slug.current, description, featured, order, status, ${image('image')}
  }`,
  statistics: `*[_type == "statistic"] | order(order asc) { label, value, context, status }`,
  faqs: `*[_type == "faq"] | order(order asc) { ${faq} }`,
  articles: `*[_type == "article"] | order(publishDate desc) {
    title, "slug": slug.current, excerpt,
    "body": body[]{
      ...,
      _type == "image" => {
        _type, caption,
        "image": { "src": asset->url, "alt": coalesce(alt, ""), "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height }
      }
    },
    author, publishDate, updatedDate,
    category, tags, status, ${image('featuredImage')},
    "relatedArticles": relatedArticles[]->slug.current,
    ${seo}
  }`,
  heroReel: `*[_type == "reelClip"] | order(order asc) {
    "id": _id, status, "video": coalesce(${video('video')}, { "alt": "" })
  }`,
  work: `*[_type == "work"] | order(order asc) {
    "id": _id, status, caption,
    "brand": brand->name, "brandStatus": brand->status,
    "service": service->{ title, "slug": slug.current },
    "video": coalesce(${video('video')}, { "alt": "" })
  }`,
} as const;

/** GROQ returns null for absent fields; the content model uses undefined. */
function stripNulls<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripNulls) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== null) out[key] = stripNulls(entry);
    }
    return out as T;
  }
  return value;
}

interface PortableSpan {
  text?: string;
  marks?: string[];
}

interface PortableMarkDef {
  _key: string;
  _type: string;
  href?: string;
}

interface PortableBlock {
  _type: string;
  style?: string;
  listItem?: 'bullet' | 'number';
  children?: PortableSpan[];
  markDefs?: PortableMarkDef[];
  text?: string;
  attribution?: string;
  /** Image blocks, projected by the query. */
  image?: { src?: string; alt?: string; width?: number; height?: number };
  caption?: string;
}

/** Portable Text into the deliberately narrow `RichTextBlock` shape. */
export function toRichText(blocks: PortableBlock[] = []): RichTextBlock[] {
  const out: RichTextBlock[] = [];
  for (const block of blocks) {
    if (block._type === 'pullQuote') {
      out.push({ type: 'quote', text: block.text ?? '', attribution: block.attribution });
      continue;
    }
    if (block._type === 'image') {
      const img = block.image;
      if (img?.src) out.push({ type: 'image', image: { src: img.src, alt: img.alt ?? '', width: img.width, height: img.height }, ...(block.caption && { caption: block.caption }) });
      continue;
    }
    if (block._type !== 'block') continue;
    const text = (block.children ?? []).map((span) => span.text ?? '').join('');
    const spans = toSpans(block);
    if (block.listItem) {
      const ordered = block.listItem === 'number';
      const previous = out[out.length - 1];
      if (previous?.type === 'list' && Boolean(previous.ordered) === ordered) {
        previous.items.push(text);
        if (spans) (previous.spans ??= previous.items.slice(0, -1).map((t) => [{ text: t }])).push(spans);
        else previous.spans?.push([{ text }]);
      } else {
        out.push({ type: 'list', ordered, items: [text], ...(spans && { spans: [spans] }) });
      }
    } else if (block.style === 'h2' || block.style === 'h3') {
      out.push({ type: 'heading', level: block.style === 'h2' ? 2 : 3, text });
    } else if (text.trim()) {
      out.push({ type: 'paragraph', text, ...(spans && { spans }) });
    }
  }
  return out;
}

/** Bold and link marks as spans; undefined when the block has neither. */
function toSpans(block: PortableBlock): InlineSpan[] | undefined {
  const links = new Map((block.markDefs ?? []).filter((d) => d._type === 'link' && d.href).map((d) => [d._key, d.href!]));
  let marked = false;
  const spans = (block.children ?? []).map((span) => {
    const out: InlineSpan = { text: span.text ?? '' };
    for (const mark of span.marks ?? []) {
      if (mark === 'strong') out.bold = true;
      else if (links.has(mark)) out.href = links.get(mark);
    }
    if (out.bold || out.href) marked = true;
    return out;
  });
  return marked ? spans : undefined;
}

export function createSanitySource(config: SanityConfig): ContentSource {
  const client: SanityClient = createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    apiVersion: config.apiVersion ?? '2025-01-01',
    token: config.token,
    // Builds run right after a publish, when the CDN can still serve the old
    // result for a few minutes. A build makes a handful of requests; skip it.
    useCdn: false,
    perspective: 'published',
  });

  // A static build calls each method from many pages; fetch each list once.
  // Not in dev: the server outlives any one edit, so it would keep serving
  // whatever Sanity held when it started.
  const cache = new Map<string, Promise<unknown>>();
  function fetchList<T>(key: keyof typeof QUERIES): Promise<T[]> {
    const fetchRows = () => client.fetch<T[]>(QUERIES[key]).then((rows) => stripNulls(rows ?? []));
    if (import.meta.env.DEV) return fetchRows();
    if (!cache.has(key)) cache.set(key, fetchRows());
    return cache.get(key) as Promise<T[]>;
  }

  const services = async () =>
    publishable(await fetchList<Service>('services')).map((service) => ({
      ...service,
      faqs: service.faqs && publishable(service.faqs),
    }));

  const campaigns = async () =>
    publishable(await fetchList<Campaign>('campaigns')).map((campaign) => ({
      ...campaign,
      testimonial:
        campaign.testimonial && publishable([campaign.testimonial]).length ? campaign.testimonial : undefined,
    }));

  const articles = async () =>
    publishable(await fetchList<Article & { body: PortableBlock[] }>('articles')).map((article) => ({
      ...article,
      body: toRichText(article.body),
    }));

  return {
    services,
    async service(slug) {
      return (await services()).find((service) => service.slug === slug);
    },
    campaigns,
    async campaign(slug) {
      return (await campaigns()).find((campaign) => campaign.slug === slug);
    },
    async brands() {
      return publishable(await fetchList<Brand>('brands'));
    },
    async testimonials() {
      return publishable(await fetchList<Testimonial>('testimonials'));
    },
    async creatorCategories() {
      return publishable(await fetchList<CreatorCategory>('creatorCategories'));
    },
    async statistics() {
      return publishable(await fetchList<Statistic>('statistics'));
    },
    async faqs() {
      return publishable(await fetchList<Faq>('faqs'));
    },
    articles,
    async article(slug) {
      return (await articles()).find((article) => article.slug === slug);
    },
    async heroReel() {
      return publishable(await fetchList<ReelClip>('heroReel'));
    },
    async work() {
      // A piece names its client, so it is only as publishable as the client
      // relationship: an approved piece for an unconfirmed brand stays out.
      const items = await fetchList<WorkItem & { brandStatus?: ContentStatus }>('work');
      return publishable(
        items.map(({ brandStatus, ...item }) => ({
          ...item,
          status: item.brand && brandStatus !== 'approved' ? 'placeholder' : item.status,
        })),
      );
    },
  };
}
