/**
 * Writes the site's own emails to email/previews/ so they can be opened in a
 * browser without sending anything: the welcome email (sent when the team
 * approves a creator) as a creator called Sam would get it, and a sample
 * morning applications email with made-up applicants, and the New Creator
 * Showcase email for a made-up creator with a big following.
 *   npx tsx scripts/preview-emails.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { crm } from '../src/agency/crm';
import { agency } from '../src/agency/config';
import { showcaseEmail, welcomeEmail } from '../src/system/crm/emails';
import type { Creator } from '../src/system/crm/types';
import { renderDigest, type NewCreator } from '../src/system/crm/digest';

/** Made-up applicants for the sample morning email. */
export const sampleApplicants: NewCreator[] = [
  { id: 'sample-1', first_name: 'Hannah', last_name: 'Reid', town: 'Leeds', instagram_followers: 12400, tiktok_followers: 3100, youtube_followers: null },
  { id: 'sample-2', first_name: 'Tom', last_name: 'Ellis', town: 'Bristol', instagram_followers: 2800, tiktok_followers: null, youtube_followers: null },
  { id: 'sample-3', first_name: 'Priya', last_name: 'Shah', town: 'Manchester', instagram_followers: 48900, tiktok_followers: 15200, youtube_followers: 1200 },
];
/** A made-up creator with a big following, for the showcase email. */
export const sampleShowcaseCreator = {
  id: '00000000-0000-0000-0000-000000000000', first_name: 'Priya', last_name: 'Shah', email: 'priya@example.com',
  town: 'Manchester', county: 'Greater Manchester',
  instagram_url: 'https://www.instagram.com/bonnieandbiscuit/', instagram_followers: 48900,
  tiktok_url: 'https://www.tiktok.com/@bonnieandbiscuit', tiktok_followers: 15200,
  youtube_url: null, youtube_followers: null,
  details: { dogs: [
    { name: 'Bonnie', breed: 'Cockapoo', birth_date: '2023-03-14' },
    { name: 'Biscuit', breed: 'Cavalier King Charles Spaniel', birth_date: '2025-06-02' },
  ] },
  application_status: 'approved',
} as unknown as Creator;
export const sampleShowcase = () => showcaseEmail(crm, agency.name, agency.site.url, sampleShowcaseCreator);

export const sampleDigest = () => renderDigest({ creators: sampleApplicants, total: 3, pending: 5, label: 'Monday 16 November' }, agency.site.url, agency.name, crm.emailTheme);

const welcome = welcomeEmail(crm, agency.name, agency.site.url, 'Sam');
if (!welcome) throw new Error('No welcome email set up');
mkdirSync('email/previews', { recursive: true });
writeFileSync('email/previews/welcome.html', welcome.html);
console.log('Subject:', welcome.subject);
console.log('wrote email/previews/welcome.html');
writeFileSync('email/previews/morning.html', sampleDigest().html);
console.log('wrote email/previews/morning.html');
const showcase = sampleShowcase();
writeFileSync('email/previews/showcase.html', showcase.html);
console.log('Subject:', showcase.subject);
console.log('wrote email/previews/showcase.html');
