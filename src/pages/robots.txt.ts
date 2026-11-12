import type { APIRoute } from 'astro';
import { agency } from '../agency/config';

/**
 * Generated so the sitemap URL follows the agency domain automatically.
 */
export const GET: APIRoute = () => {
  const body = [
    'User-agent: *',
    'Allow: /',
    // The CRM, creator accounts and email-link routes are private.
    'Disallow: /admin/',
    'Disallow: /creator/',
    'Disallow: /auth/',
    'Disallow: /api/',
    '',
    `Sitemap: ${new URL('sitemap-index.xml', `${agency.site.url}/`).href}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
