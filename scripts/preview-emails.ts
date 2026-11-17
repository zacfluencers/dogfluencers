/**
 * Writes the site's own emails to email/previews/ so they can be opened in a
 * browser without sending anything: the welcome email (sent when the team
 * approves a creator) as a creator called Sam would get it, and a sample
 * morning applications email with made-up applicants.
 *   npx tsx scripts/preview-emails.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { crm } from '../src/agency/crm';
import { agency } from '../src/agency/config';
import { welcomeEmail } from '../src/system/crm/emails';
import { renderDigest, type NewCreator } from '../src/system/crm/digest';

/** Made-up applicants for the sample morning email. */
export const sampleApplicants: NewCreator[] = [
  { id: 'sample-1', first_name: 'Hannah', last_name: 'Reid', town: 'Leeds', instagram_followers: 12400, tiktok_followers: 3100, youtube_followers: null },
  { id: 'sample-2', first_name: 'Tom', last_name: 'Ellis', town: 'Bristol', instagram_followers: 2800, tiktok_followers: null, youtube_followers: null },
  { id: 'sample-3', first_name: 'Priya', last_name: 'Shah', town: 'Manchester', instagram_followers: 48900, tiktok_followers: 15200, youtube_followers: 1200 },
];
export const sampleDigest = () => renderDigest({ creators: sampleApplicants, total: 3, pending: 5, label: 'Monday 16 November' }, agency.site.url, agency.name, crm.emailTheme);

const welcome = welcomeEmail(crm, agency.name, agency.site.url, 'Sam');
if (!welcome) throw new Error('No welcome email set up');
mkdirSync('email/previews', { recursive: true });
writeFileSync('email/previews/welcome.html', welcome.html);
console.log('Subject:', welcome.subject);
console.log('wrote email/previews/welcome.html');
writeFileSync('email/previews/morning.html', sampleDigest().html);
console.log('wrote email/previews/morning.html');
