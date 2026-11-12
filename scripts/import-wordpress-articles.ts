/**
 * Turns a WordPress site's blog posts into Sanity articles, ready for
 * `sanity dataset import`.
 *
 *   npx tsx scripts/import-wordpress-articles.ts <wordpress-origin> <out.ndjson> [--status approved|placeholder]
 *
 *   # then, from the Studio repo:
 *   npx sanity dataset import <out.ndjson> production --missing
 *
 * `--missing` only creates documents that don't exist yet, so re-running never
 * overwrites edits made in the Studio since.
 *
 * Kept: headings (h2, h3), paragraphs, bulleted and numbered lists, bold and
 * links, images within the text and the featured image (both uploaded to
 * Sanity on import, at original size), dates. Links to another migrated post
 * are pointed at its new /insights/ address, and links to the old home page
 * at /. Dropped: embeds and any other markup the site doesn't render.
 * Em and en dashes become a colon or comma, per the site's copy rules.
 *
 * Old addresses (/post-slug/) need redirects to /insights/post-slug/: see the
 * `redirects` in vercel.json.
 */
import { writeFileSync } from 'node:fs';
import { parse, type HTMLElement, type Node, NodeType } from 'node-html-parser';

const [, , originArg, outPath, ...rest] = process.argv;
if (!originArg || !outPath) {
  console.error('Usage: npx tsx scripts/import-wordpress-articles.ts <wordpress-origin> <out.ndjson> [--status approved|placeholder]');
  process.exit(1);
}
const origin = originArg.replace(/\/$/, '');
const status = rest[rest.indexOf('--status') + 1] === 'placeholder' ? 'placeholder' : 'approved';
const AUTHOR = 'Dogfluencers';
const CATEGORY = 'Influencer marketing';

interface WpPost {
  slug: string;
  date: string;
  modified: string;
  title: { rendered: string };
  content: { rendered: string };
  _embedded?: { 'wp:featuredmedia'?: { source_url?: string; alt_text?: string }[] };
}

let keySeq = 0;
const key = () => `k${(keySeq++).toString(36)}`;

const decode = (s: string) => parse(`<p>${s}</p>`).text;

/** House style: no em or en dashes. A spaced dash is a pause (comma), an unspaced one an aside (colon). */
const undash = (s: string) =>
  s
    .replace(/(\d)\s*[–—]\s*(\d)/g, '$1 to $2')
    .replace(/\s+[–—]\s+/g, ', ')
    .replace(/[–—]/g, ': ');

type Span = { _type: 'span'; _key: string; text: string; marks: string[] };
type MarkDef = { _type: 'link'; _key: string; href: string };

function inline(node: Node, marks: string[], spans: Span[], markDefs: MarkDef[], mapHref: (h: string) => string) {
  if (node.nodeType === NodeType.TEXT_NODE) {
    const text = undash(decode(node.rawText));
    if (text) spans.push({ _type: 'span', _key: key(), text, marks });
    return;
  }
  const el = node as HTMLElement;
  const tag = el.tagName?.toLowerCase();
  let next = marks;
  if (tag === 'strong' || tag === 'b') next = [...marks, 'strong'];
  if (tag === 'a' && el.getAttribute('href')) {
    const def: MarkDef = { _type: 'link', _key: key(), href: mapHref(el.getAttribute('href')!) };
    markDefs.push(def);
    next = [...marks, def._key];
  }
  if (tag === 'br') {
    spans.push({ _type: 'span', _key: key(), text: '\n', marks });
    return;
  }
  for (const child of el.childNodes) inline(child, next, spans, markDefs, mapHref);
}

function block(el: HTMLElement, style: string, mapHref: (h: string) => string, listItem?: 'bullet' | 'number') {
  const spans: Span[] = [];
  const markDefs: MarkDef[] = [];
  for (const child of el.childNodes) inline(child, [], spans, markDefs, mapHref);
  // Tidy whitespace at the edges and merge neighbours with identical marks.
  const merged: Span[] = [];
  for (const span of spans) {
    const last = merged[merged.length - 1];
    if (last && last.marks.join() === span.marks.join()) last.text += span.text;
    else merged.push({ ...span });
  }
  // Spaces at a marked run's edges move outside it, so a link never
  // underlines the gap beside it.
  const tidy: Span[] = [];
  for (const span of merged) {
    if (!span.marks.length) {
      tidy.push(span);
      continue;
    }
    const [, lead, core, trail] = span.text.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
    if (lead) tidy.push({ _type: 'span', _key: key(), text: lead, marks: [] });
    tidy.push({ ...span, text: core });
    if (trail) tidy.push({ _type: 'span', _key: key(), text: trail, marks: [] });
  }
  merged.length = 0;
  merged.push(...tidy.filter((s) => s.text));
  if (merged.length) {
    merged[0].text = merged[0].text.replace(/^\s+/, '');
    merged[merged.length - 1].text = merged[merged.length - 1].text.replace(/\s+$/, '');
  }
  const used = new Set(merged.flatMap((s) => s.marks));
  const text = merged.map((s) => s.text).join('');
  if (!text.trim()) return undefined;
  return {
    _type: 'block',
    _key: key(),
    style,
    ...(listItem && { listItem, level: 1 }),
    children: merged.map((s) => ({ ...s, text: s.text.replace(/\s+/g, ' ') })),
    markDefs: markDefs.filter((d) => used.has(d._key)),
  };
}

/** WordPress serves resized copies as name-1024x683.jpg; the original drops the size. */
const originalImage = (src: string) => src.replace(/-\d+x\d+(\.\w+)$/, '$1');

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
  const titles = new Set(posts.map((p) => decode(p.title.rendered).trim()));

  const mapHref = (href: string) => {
    try {
      const url = new URL(href, origin);
      if (url.origin !== new URL(origin).origin) return href;
      const slug = url.pathname.replace(/^\/|\/$/g, '');
      if (!slug) return '/';
      return slugs.has(slug) ? `/insights/${slug}/` : url.pathname;
    } catch {
      return href;
    }
  };

  const lines: string[] = [];
  const report: string[] = [];
  for (const post of posts) {
    const root = parse(post.content.rendered);
    const body: unknown[] = [];
    const paragraphs: string[] = [];
    const dropped = new Set<string>();
    for (const el of root.childNodes.filter((n): n is HTMLElement => n.nodeType === NodeType.ELEMENT_NODE)) {
      const tag = el.tagName.toLowerCase();
      if (tag === 'p') {
        const b = block(el, 'normal', mapHref);
        if (b) {
          body.push(b);
          paragraphs.push(b.children.map((c) => c.text).join(''));
        }
      } else if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
        const b = block(el, tag === 'h4' ? 'h3' : tag, mapHref);
        if (b) body.push({ ...b, children: b.children.map((c) => ({ ...c, marks: [] })), markDefs: [] });
      } else if (tag === 'ul' || tag === 'ol') {
        for (const li of el.querySelectorAll('li')) {
          const b = block(li, 'normal', mapHref, tag === 'ol' ? 'number' : 'bullet');
          if (b) body.push(b);
        }
      } else if (tag === 'figure' && el.querySelector('img')) {
        const img = el.querySelector('img')!;
        const src = img.getAttribute('src');
        if (src) {
          const alt = decode(img.getAttribute('alt') ?? '').trim();
          const caption = el.querySelector('figcaption')?.text.trim();
          body.push({
            _type: 'image',
            _key: key(),
            // The original upload, not WordPress's resized copy (-1024x683).
            _sanityAsset: `image@${originalImage(src)}`,
            alt: titles.has(alt) ? '' : alt,
            ...(caption && { caption: undash(caption) }),
          });
        }
      } else {
        dropped.add(tag);
      }
    }

    const media = post._embedded?.['wp:featuredmedia']?.[0];
    const title = undash(decode(post.title.rendered));
    const doc = {
      _id: `article-wp-${post.slug}`,
      _type: 'article',
      status,
      title,
      slug: { _type: 'slug', current: post.slug },
      excerpt: excerptFrom(paragraphs),
      body,
      author: AUTHOR,
      category: CATEGORY,
      publishDate: post.date.slice(0, 10),
      ...(post.modified.slice(0, 10) !== post.date.slice(0, 10) && { updatedDate: post.modified.slice(0, 10) }),
      ...(media?.source_url && {
        featuredImage: {
          _type: 'image',
          _sanityAsset: `image@${media.source_url}`,
          // WordPress often fills alt text with a post title (sometimes the
          // wrong one). A misleading description is worse than none, so a
          // title-like alt is dropped; describe the photo in the Studio.
          alt: titles.has(decode(media.alt_text ?? '').trim()) ? '' : decode(media.alt_text ?? '').trim(),
        },
      }),
    };
    lines.push(JSON.stringify(doc));
    report.push(`${post.slug}: ${body.length} blocks${dropped.size ? `, dropped <${[...dropped].join('>, <')}>` : ''}`);
  }

  writeFileSync(outPath, lines.join('\n') + '\n');
  console.log(report.join('\n'));
  console.log(`\n${posts.length} articles (${status}) written to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
