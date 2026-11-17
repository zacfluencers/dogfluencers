/**
 * Writes the site's own emails to email/previews/ so they can be opened in a
 * browser without sending anything: the welcome email (sent when the team
 * approves a creator) as a creator called Sam would get it.
 *   npx tsx scripts/preview-emails.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { crm } from '../src/agency/crm';
import { agency } from '../src/agency/config';
import { welcomeEmail } from '../src/system/crm/emails';

const welcome = welcomeEmail(crm, agency.name, agency.site.url, 'Sam');
if (!welcome) throw new Error('No welcome email set up');
mkdirSync('email/previews', { recursive: true });
writeFileSync('email/previews/welcome.html', welcome.html);
console.log('Subject:', welcome.subject);
console.log('wrote email/previews/welcome.html');
