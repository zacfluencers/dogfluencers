/**
 * Turns a WordPress site's blog posts into the local article fixtures
 * (`src/agency/content/articles.ts`), for an agency that builds without a CMS.
 *
 *   npx tsx scripts/import-wordpress-articles-to-fixtures.ts <wordpress-origin> <out.ts> [--status approved|placeholder]
 *
 * The sibling of `scripts/import-wordpress-articles.ts` (which writes Sanity
 * ndjson): same parsing, same house style, different output. Re-running
 * overwrites the output file, so make hand edits in the fixtures only once the
 * import is final.
 *
 * Kept: headings (h2, h3; h4 and h5 become h3), paragraphs, bulleted and
 * numbered lists, bold and links, images within the text and the featured
 * image, dates. Images are downloaded at original size (WordPress's -1024x683
 * copies are skipped for the upload they came from) into
 * `public/images/insights/<post-slug>/`, scaled down to 1600px wide when
 * larger, and referenced by local path with their dimensions. Links to another
 * migrated post point at its new /insights/ address, links to the old pages at
 * their new ones, and links to the old home page at /. Dropped: embeds
 * (Instagram and others), italics, underlines and any other markup the site
 * doesn't render. Em and en dashes become a colon, comma or "to", per the
 * site's copy rules.
 *
 * Alt text: WordPress's alt text is mostly the post title, sometimes another
 * post's. `ALT` below holds a short description of each photo, written by
 * looking at it; an image missing from it falls back to the WordPress alt
 * text, and the run warns so one can be written.
 *
 * Old addresses (/post-slug/) need redirects to /insights/post-slug/: see the
 * `redirects` in vercel.json.
 */
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parse, type HTMLElement, type Node, NodeType } from 'node-html-parser';
import sharp from 'sharp';
import type { Article, InlineSpan, RichTextBlock } from '../src/system/types/content';

const [, , originArg, outPath, ...rest] = process.argv;
if (!originArg || !outPath) {
  console.error(
    'Usage: npx tsx scripts/import-wordpress-articles-to-fixtures.ts <wordpress-origin> <out.ts> [--status approved|placeholder]',
  );
  process.exit(1);
}
const origin = originArg.replace(/\/$/, '');
const status = rest[rest.indexOf('--status') + 1] === 'placeholder' ? 'placeholder' : 'approved';
const AUTHOR = 'Dogfluencers';
const CATEGORY = 'Influencer marketing';
const MAX_WIDTH = 1600;
const IMAGE_DIR = 'public/images/insights';

/** Old WordPress pages and their addresses on the new site (also in vercel.json). */
const PAGES: Record<string, string> = {
  blog: '/insights/',
  'about-us': '/about/',
  brands: '/for-brands/',
  influencers: '/for-creators/',
  faq: '/for-creators/',
  'privacy-policy': '/privacy/',
  'terms-conditions': '/terms/',
  'mailing-list-signup': '/join/',
  login: '/creator/login/',
  account: '/creator/profile/',
};

/** Descriptions of each photo, keyed `<post-slug>/<file>`, written by looking at them. */
const ALT: Record<string, string> = {
  'behind-the-scenes-creating-captivating-ad-content-with-dog-influencers/Behind-the-Scenes-Creating-Captivating-Ad-Content-with-Dog-Influencers.avif':
    'A golden retriever nose to nose with a woman in a hat, outdoors in the sun',
  'behind-the-scenes-creating-captivating-ad-content-with-dog-influencers/pexels-rdne-8489664.jpg':
    'A woman holding a small white fluffy dog adjusts a phone on a ring light at her desk',
  'best-hashtag-strategy-for-dog-influencers/Best-Hashtag-Strategy-.for-Dog-Influencers.jpeg':
    'A yellow sticky note with a hashtag drawn on it, on a desk beside a keyboard and a pen',
  'best-hashtag-strategy-for-dog-influencers/Best-Hashtag-Strategy-for-Dog-Influencers.jpeg':
    'A woman sitting in a field with a group of dogs, including border collies and papillons',
  'creating-a-successful-brand-collaboration-with-dogfluencers/pexels-cottonbro-7430325-scaled.jpg':
    'A group of colleagues around a meeting table, one standing to present',
  'creating-a-successful-brand-collaboration-with-dogfluencers/pexels-yankrukov-7693152.jpg':
    'Two people shaking hands across a desk in an office',
  'creating-engaging-user-generated-content-with-your-pooch/pexels-ekaterina-bolovtsova-4680276-scaled.jpg':
    'A man and a woman at a white desk in a bright room, with a husky beside them',
  'creating-engaging-user-generated-content-with-your-pooch/pexels-polina-zimmerman-3782235.jpg':
    'A corkboard covered in handwritten notes with words such as Vision, Passion and Culture',
  'dog-modeling-101-the-ultimate-guide/pexels-blue-bird-7210754.jpg':
    'A person walking five dogs on leads along a dirt path',
  'dog-modeling-101-the-ultimate-guide/pexels-samson-katt-5256144-scaled.jpg':
    'A dog sitting at a table opposite a person typing on a laptop',
  'everything-you-need-to-know-about-dogpool-from-deadpool-wolverine/Everything-You-Need-to-Know-About-Dogpool-from-Deadpool-Wolverine-1.webp':
    'Deadpool making a heart shape with his hands beside a small dog in a matching costume',
  'everything-you-need-to-know-about-dogpool-from-deadpool-wolverine/Everything-You-Need-to-Know-About-Dogpool-from-Deadpool-Wolverine.webp':
    'Deadpool with his arms crossed beside a small dog in a matching costume',
  'everything-you-need-to-know-about-pippin-from-come-outside/Everything-You-Need-to-Know-About-Pippin-from-Come-Outside.jpg':
    'A woman in a flying helmet and goggles hugging a shaggy dog beside a spotted light aircraft',
  'everything-you-need-to-know-about-pippin-from-come-outside/Screenshot-2024-08-15-at-15.56.32.png':
    'Close-up of a shaggy brown dog resting its chin on a table',
  'how-to-leverage-dog-influencers-for-your-brands-marketing-strategy/pexels-blue-bird-7210359-scaled.jpg':
    'A smiling woman sitting on grass between a chocolate labrador and a border collie',
  'how-to-leverage-dog-influencers-for-your-brands-marketing-strategy/pexels-mikael-blomkvist-6476255.jpg':
    'Four colleagues looking over papers together at a desk in an open-plan office',
  'how-to-optimize-your-instagram-profile-for-maximum-engagement/How-to-Optimize-Your-Instagram-Profile-for-Maximum-Engagement.webp':
    'A hand holding a phone showing a grid of photos on Instagram, in front of a laptop',
  'how-to-optimize-your-instagram-profile-for-maximum-engagement/shutterstock_444805723.jpg':
    'A chihuahua in heart-shaped sunglasses and a pink dressing gown, holding a phone, on a pink sofa',
  'how-to-rent-a-puppy-for-a-day/Rent-a-Puppy-for-a-Day-1.webp':
    'A smiling woman on a park bench holding a white dog in a red harness',
  'how-to-rent-a-puppy-for-a-day/Rent-a-Puppy-for-a-Day.webp':
    'A shiba inu sitting on a yellow armchair',
  'mistakes-to-avoid-when-renting-a-puppy-for-a-day/Mistakes-to-Avoid-When-Renting-a-Puppy-for-a-Day.jpeg':
    'A man on a leather sofa reaching out to stroke a fluffy dog',
  'mistakes-to-avoid-when-renting-a-puppy-for-a-day/Mistakes-to-Avoid-When-Renting-a-Puppy-for-a-Day.webp':
    'A woman crouched on front steps holding the lead of a white dog in a red harness',
  'the-benefits-of-collaborating-with-dog-influencers-for-product-launches/pexels-eva-bronzini-7661590-1.jpg':
    'A white card with Branding written in orange above a list: identity, logo, design, strategy, marketing',
  'the-benefits-of-collaborating-with-dog-influencers-for-product-launches/pexels-startup-stock-photos-7096-scaled.jpg':
    'People working together at a table with notebooks, a laptop and a coffee cup',
  'the-biggest-dog-model-influencers-of-2024/pexels-samson-katt-5255206-scaled.jpg':
    'A small white dog in sunglasses on a chair, being photographed on a phone',
  'the-role-of-authenticity-in-dog-influencer-marketing/pexels-rdne-7413936.jpg':
    'Printed charts and graphs spread across a desk',
  'the-role-of-authenticity-in-dog-influencer-marketing/pexels-rdne-8489664-scaled.jpg':
    'A woman holding a small white fluffy dog adjusts a phone on a ring light at her desk',
  'tips-on-shopping-for-designer-dog-apparel/pexels-blue-bird-7210436-scaled.jpg':
    'A smiling woman hugging a golden retriever outdoors',
  'tips-on-shopping-for-designer-dog-apparel/pexels-yaroslav-shuraev-9632107-scaled.jpg':
    'A laughing woman lying on a blanket on the grass with a husky',
  'top-10-dog-models-the-best-breeds-for-dog-modelling-and-how-to-succeed/pexels-kateryna-babaieva-1423213-3715583.jpg':
    'A husky lying in the snow',
  'top-10-dog-models-the-best-breeds-for-dog-modelling-and-how-to-succeed/pexels-nishizuka-25426-191353-scaled.jpg':
    'Close-up of a chihuahua lying down',
  'top-designer-dog-apparel-brands-for-your-dog/Designer-Dog-Apparel-Brands-.jpeg':
    'A man playing with a jumping dog in a park',
  'top-designer-dog-apparel-brands-for-your-dog/Designer-Dog-Apparel-Brands-.webp':
    'A white terrier in a yellow raincoat looking up at a person in a matching yellow coat',
  'unleash-the-power-of-dog-influencers-why-brands-should-partner-with-services-like-dogfluencers/shutterstock_2336547149-scaled.jpg':
    'A woman photographing a Jack Russell terrier on a sofa with her phone',
  'why-quality-assurance-matters-in-influencer-marketing/Why-Quality-Assurance-Matters-in-Influencer-Marketing.avif':
    'A smiling woman looking at a photo of a dog on her phone',
  'why-quality-assurance-matters-in-influencer-marketing/pexels-startup-stock-photos-7096.jpg':
    'People working together at a table with notebooks, a laptop and a coffee cup',
  'working-with-a-dog-modelling-agency-uk-everything-you-need-to-know/pexels-cup-of-couple-8473661-scaled.jpg':
    'A Pomeranian looking out of a brown pet carrier bag worn on a man\'s shoulder',
  'working-with-a-dog-modelling-agency-uk-everything-you-need-to-know/pexels-sam-lion-5731815-scaled.jpg':
    'A smiling woman holding a shiba inu in a red jumper outdoors',
  'your-complete-guide-to-ugc-for-pet-food-brands/DO-2026-02-27T144823.276.png':
    'A husky looking at a hand holding out a bowl of dry dog food, on a green background',
  'your-complete-guide-to-ugc-for-pet-food-brands/DO-2026-02-27T144858.584.png':
    'A corgi looking up at a person holding out a bowl of dry dog food',
};

interface WpPost {
  slug: string;
  date: string;
  modified: string;
  title: { rendered: string };
  content: { rendered: string };
  _embedded?: { 'wp:featuredmedia'?: { source_url?: string; alt_text?: string }[] };
}

const decode = (s: string) => parse(`<p>${s}</p>`).text;

/** House style: no em or en dashes. A spaced dash is a pause (comma), an unspaced one an aside (colon). */
const undash = (s: string) =>
  s
    .replace(/(\d)\s*[–—]\s*(\d)/g, '$1 to $2')
    .replace(/\s+[–—]\s+/g, ', ')
    .replace(/[–—]/g, ': ');

type Span = { text: string; bold: boolean; href?: string };

function inline(node: Node, bold: boolean, href: string | undefined, spans: Span[], mapHref: (h: string) => string) {
  if (node.nodeType === NodeType.TEXT_NODE) {
    const text = undash(decode(node.rawText));
    // A link around nothing but punctuation (a stray full stop) is dropped.
    if (text) spans.push({ text, bold, href: href && /[A-Za-z0-9]/.test(text) ? href : undefined });
    return;
  }
  if (node.nodeType !== NodeType.ELEMENT_NODE) return;
  const el = node as HTMLElement;
  const tag = el.tagName?.toLowerCase();
  if (tag === 'br') {
    spans.push({ text: ' ', bold, href });
    return;
  }
  if (tag === 'script' || tag === 'style' || tag === 'iframe' || tag === 'img') return;
  const nextBold = bold || tag === 'strong' || tag === 'b';
  const nextHref = tag === 'a' && el.getAttribute('href') ? mapHref(el.getAttribute('href')!) : href;
  for (const child of el.childNodes) inline(child, nextBold, nextHref, spans, mapHref);
}

/** An element's text as tidy spans: neighbours merged, whitespace collapsed, link edges trimmed. */
function spansOf(el: HTMLElement, mapHref: (h: string) => string): Span[] {
  const spans: Span[] = [];
  for (const child of el.childNodes) inline(child, false, undefined, spans, mapHref);
  const merged: Span[] = [];
  for (const span of spans) {
    const last = merged[merged.length - 1];
    if (last && last.bold === span.bold && last.href === span.href) last.text += span.text;
    else merged.push({ ...span });
  }
  // Spaces at a marked run's edges move outside it, so a link never
  // underlines the gap beside it.
  const tidy: Span[] = [];
  for (const span of merged) {
    span.text = span.text.replace(/\s+/g, ' ');
    if (!span.bold && !span.href) {
      const last = tidy[tidy.length - 1];
      if (last && !last.bold && !last.href) last.text += span.text;
      else tidy.push(span);
      continue;
    }
    const [, lead, core, trail] = span.text.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
    const plain = (text: string) => {
      const last = tidy[tidy.length - 1];
      if (last && !last.bold && !last.href) last.text += text;
      else tidy.push({ text, bold: false });
    };
    if (lead) plain(lead);
    if (core) tidy.push({ ...span, text: core });
    if (trail) plain(trail);
  }
  const out = tidy.filter((s) => s.text);
  if (out.length) {
    out[0].text = out[0].text.replace(/^\s+/, '');
    out[out.length - 1].text = out[out.length - 1].text.replace(/\s+$/, '');
  }
  return out
    .filter((s) => s.text)
    .map((s) => ({ ...s, text: s.text.replace(/ {2,}/g, ' ').replace(/(?<!\.)\.\.(?!\.)/g, '.') }));
}

const plainText = (spans: Span[]) => spans.map((s) => s.text).join('');
const marked = (spans: Span[]) => spans.some((s) => s.bold || s.href);
const toInline = (spans: Span[]): InlineSpan[] =>
  spans.map((s) => ({ text: s.text, ...(s.bold && { bold: true }), ...(s.href && { href: s.href }) }));

/** WordPress serves resized copies as name-1024x683.jpg; the original drops the size. */
const originalImage = (src: string) => src.replace(/-\d+x\d+(\.\w+)$/, '$1');

let imageBytes = 0;

/** Downloads an image into public/, scaled to MAX_WIDTH, and returns its local path and size. */
async function localImage(src: string, slug: string) {
  const url = originalImage(src);
  const file = basename(new URL(url).pathname);
  const dir = join(IMAGE_DIR, slug);
  const path = join(dir, file);
  mkdirSync(dir, { recursive: true });
  if (!existsSync(path)) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} fetching ${url}`);
    const input = Buffer.from(await response.arrayBuffer());
    const meta = await sharp(input).metadata();
    if ((meta.width ?? 0) > MAX_WIDTH) {
      await sharp(input).rotate().resize({ width: MAX_WIDTH }).toFile(path);
    } else {
      writeFileSync(path, input);
    }
  }
  const { width, height } = await sharp(path).metadata();
  imageBytes += statSync(path).size;
  return { key: `${slug}/${file}`, src: `/${path.replace(/^public\//, '')}`, width, height };
}

/** The opening of the post, cut at a sentence end, for the excerpt and meta description. */
function excerptFrom(paragraphs: string[]): string {
  const sentences = paragraphs.join(' ').match(/[^.!?]+[.!?]+/g) ?? [];
  let out = '';
  for (const sentence of sentences) {
    if (out && (out + sentence).length > 220) break;
    out += sentence;
  }
  return out.trim();
}

async function main() {
  const response = await fetch(`${origin}/wp-json/wp/v2/posts?per_page=100&_embed=wp:featuredmedia`);
  if (!response.ok) throw new Error(`${response.status} fetching posts`);
  const posts = (await response.json()) as WpPost[];
  const slugs = new Set(posts.map((p) => p.slug));
  const titles = new Map(posts.map((p) => [decode(p.title.rendered).trim(), p.slug]));
  const host = (h: string) => h.replace(/^www\./, '');

  const mapHref = (href: string) => {
    // A post title pasted where the address belongs ("http://How to ...").
    const pasted = decode(href).replace(/^https?:\/\//, '').trim();
    if (titles.has(pasted)) return `/insights/${titles.get(pasted)}/`;
    try {
      const url = new URL(href, origin);
      if (host(url.hostname) !== host(new URL(origin).hostname)) return href;
      const slug = url.pathname.replace(/^\/|\/$/g, '');
      if (!slug) return '/';
      if (slugs.has(slug)) return `/insights/${slug}/`;
      return PAGES[slug] ?? url.pathname;
    } catch {
      return href;
    }
  };

  const warnings: string[] = [];
  /** Alt text: the written description, else WordPress's unless it names a different post. */
  const altFor = (key: string, slug: string, wpAlt: string) => {
    if (ALT[key]) return ALT[key];
    const alt = undash(decode(wpAlt).trim());
    const namesOther = titles.has(alt) && titles.get(alt) !== slug;
    warnings.push(`no written alt for ${key} (WordPress: "${alt}")`);
    return namesOther ? '' : alt;
  };

  const articles: Article[] = [];
  const report: string[] = [];
  for (const post of posts) {
    const root = parse(post.content.rendered);
    const body: RichTextBlock[] = [];
    const paragraphs: string[] = [];
    const dropped = new Map<string, number>();
    const drop = (what: string) => dropped.set(what, (dropped.get(what) ?? 0) + 1);

    for (const el of root.childNodes.filter((n): n is HTMLElement => n.nodeType === NodeType.ELEMENT_NODE)) {
      const tag = el.tagName.toLowerCase();
      if (tag === 'p') {
        const spans = spansOf(el, mapHref);
        const text = plainText(spans);
        if (!text.trim()) continue;
        body.push({ type: 'paragraph', text, ...(marked(spans) && { spans: toInline(spans) }) });
        paragraphs.push(text);
      } else if (/^h[2-6]$/.test(tag)) {
        const text = plainText(spansOf(el, mapHref));
        if (text.trim()) body.push({ type: 'heading', level: tag === 'h2' ? 2 : 3, text });
      } else if (tag === 'ul' || tag === 'ol') {
        const items = el
          .querySelectorAll('li')
          .map((li) => spansOf(li, mapHref))
          .filter((spans) => plainText(spans).trim());
        if (items.length) {
          body.push({
            type: 'list',
            ...(tag === 'ol' && { ordered: true }),
            items: items.map(plainText),
            ...(items.some(marked) && { spans: items.map(toInline) }),
          });
        }
      } else if (tag === 'figure' && el.classList.contains('wp-block-image') && el.querySelector('img')) {
        const img = el.querySelector('img')!;
        const src = img.getAttribute('src');
        if (!src) continue;
        const local = await localImage(src, post.slug);
        const caption = el.querySelector('figcaption')?.text.trim();
        body.push({
          type: 'image',
          image: {
            src: local.src,
            alt: altFor(local.key, post.slug, img.getAttribute('alt') ?? ''),
            width: local.width,
            height: local.height,
          },
          ...(caption && { caption: undash(decode(caption)) }),
        });
      } else if (tag === 'figure' && el.classList.contains('wp-block-embed')) {
        drop(`${el.classList.contains('is-provider-instagram') ? 'instagram' : 'other'} embed`);
      } else {
        drop(`<${tag}>`);
      }
    }

    const media = post._embedded?.['wp:featuredmedia']?.[0];
    let featuredImage: Article['featuredImage'];
    if (media?.source_url) {
      const local = await localImage(media.source_url, post.slug);
      featuredImage = {
        src: local.src,
        alt: altFor(local.key, post.slug, media.alt_text ?? ''),
        width: local.width,
        height: local.height,
      };
    }

    const article: Article = {
      title: undash(decode(post.title.rendered)).trim(),
      slug: post.slug,
      excerpt: excerptFrom(paragraphs),
      category: CATEGORY,
      publishDate: post.date.slice(0, 10),
      ...(post.modified.slice(0, 10) !== post.date.slice(0, 10) && { updatedDate: post.modified.slice(0, 10) }),
      author: AUTHOR,
      status,
      ...(featuredImage && { featuredImage }),
      body,
    };
    articles.push(article);
    report.push(
      `${post.slug}: ${body.length} blocks${
        dropped.size ? `, dropped ${[...dropped].map(([what, n]) => `${what} x${n}`).join(', ')}` : ''
      }`,
    );
  }

  const header = `import type { Article } from '../../system/types/content';

/**
 * The blog from the old WordPress site (${new URL(origin).hostname}), migrated with
 * \`scripts/import-wordpress-articles-to-fixtures.ts\` on ${new Date().toISOString().slice(0, 10)}.
 *
 * These were already published by the business, so they are \`${status}\`. Images
 * live in \`public/images/insights/<slug>/\`, and \`vercel.json\` redirects each old
 * \`/post-slug/\` address to \`/insights/post-slug/\`. Edit freely: re-running the
 * import overwrites this file.
 */
`;
  // JSON with bare keys reads like the hand-written fixtures. Keys only ever
  // start a line, and strings never contain a raw newline, so this is safe.
  const data = JSON.stringify(articles, null, 2).replace(/^(\s*)"([A-Za-z_]\w*)":/gm, '$1$2:');
  writeFileSync(outPath, `${header}export const articles: Article[] = ${data};\n`);

  console.log(report.join('\n'));
  if (warnings.length) console.warn(`\n${warnings.join('\n')}`);
  console.log(
    `\n${posts.length} articles (${status}) written to ${outPath}; images in ${IMAGE_DIR}: ${(imageBytes / 1024 / 1024).toFixed(1)} MB`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
