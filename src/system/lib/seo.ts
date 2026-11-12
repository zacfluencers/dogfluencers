import type { AgencyConfig } from '../types/agency';
import type { Seo } from '../types/content';

export interface ResolvedSeo {
  title: string;
  description: string;
  canonical: string;
  noIndex: boolean;
  socialImage?: string;
}

/**
 * Page metadata wins, agency defaults fill the gaps. Titles are suffixed with
 * the agency name unless the page already is the agency title.
 */
export function resolveSeo(
  agency: AgencyConfig,
  page: Seo | undefined,
  currentUrl: URL
): ResolvedSeo {
  const rawTitle = page?.title?.trim();
  const title = !rawTitle
    ? agency.seo.title
    : rawTitle.includes(agency.name)
      ? rawTitle
      : `${rawTitle} | ${agency.name}`;

  const canonicalPath = page?.canonical ?? currentUrl.pathname;
  const canonical = new URL(canonicalPath, agency.site.url).href;

  const socialImage = page?.socialImage?.src ?? agency.seo.socialImage?.src;

  return {
    title,
    description: page?.description?.trim() || agency.seo.description,
    canonical,
    noIndex: page?.noIndex ?? false,
    socialImage: socialImage ? new URL(socialImage, agency.site.url).href : undefined,
  };
}

export function absoluteUrl(agency: AgencyConfig, path: string): string {
  return new URL(path, agency.site.url).href;
}

export interface BreadcrumbItem { label: string; href?: string; }

export function breadcrumbSchema(agency: AgencyConfig, items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(agency, item.href) } : {}),
    })),
  };
}

/** Organization + WebSite. No ratings, reviews or prices — none are verifiable. */
export function organizationSchema(agency: AgencyConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: agency.name,
    url: agency.site.url,
    description: agency.positioning.oneLine,
    ...(agency.logo.src ? { logo: absoluteUrl(agency, agency.logo.src) } : {}),
    ...(agency.socialLinks.length ? { sameAs: agency.socialLinks.map((link) => link.href) } : {}),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: agency.contact.email,
      ...(agency.contact.phone ? { telephone: agency.contact.phone } : {}),
    },
  };
}

export function websiteSchema(agency: AgencyConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: agency.name,
    url: agency.site.url,
    inLanguage: agency.site.locale,
  };
}

export function serviceSchema(
  agency: AgencyConfig,
  service: { title: string; slug: string; shortDescription: string }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.shortDescription,
    serviceType: service.title,
    url: absoluteUrl(agency, `/services/${service.slug}/`),
    provider: { '@type': 'Organization', name: agency.name, url: agency.site.url },
  };
}

export function articleSchema(
  agency: AgencyConfig,
  article: { title: string; slug: string; excerpt: string; publishDate?: string; updatedDate?: string; author?: string; featuredImage?: { src?: string } }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    url: absoluteUrl(agency, `/insights/${article.slug}/`),
    ...(article.publishDate ? { datePublished: article.publishDate } : {}),
    ...(article.updatedDate ? { dateModified: article.updatedDate } : {}),
    ...(article.featuredImage?.src ? { image: absoluteUrl(agency, article.featuredImage.src) } : {}),
    author: { '@type': 'Organization', name: article.author ?? agency.name },
    publisher: { '@type': 'Organization', name: agency.name, url: agency.site.url },
  };
}
