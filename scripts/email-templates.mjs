// Builds the Dogfluencers email templates from one email-safe shell, so the
// Mailchimp template and the Supabase sign-in emails always match the site:
// paper ground, white card, condensed capitals with the orange mark on the
// last word, night pill buttons, a night footer with the logo.
//
//   node scripts/email-templates.mjs
//
// Writes email/mailchimp-template.html and supabase/templates/*.html. Paste the
// Supabase ones into Supabase > Authentication > Emails (subject in each file's
// first line); upload the Mailchimp one under Templates > Code your own.
import { mkdirSync, writeFileSync } from 'node:fs';

const SITE = 'https://dogfluencers.agency';
const c = { paper: '#fffaf3', card: '#ffffff', night: '#1a1412', cream: '#f9ead0', creamSoft: '#fdf6ea', orange: '#f53d0c', orangeText: '#c4300a', muted: '#6b5d55', creamMuted: '#c9b99f', hairline: '#eee4d6' };
const font = "'Open Sans', Arial, Helvetica, sans-serif";
const display = "'Arial Narrow', 'Open Sans Condensed', 'Helvetica Neue', Arial, sans-serif";

/** "Confirm your *email*": the starred word gets the orange mark. */
const heading = (text, attrs = '') =>
  `<h1 ${attrs} style="margin:0 0 18px;font-family:${display};font-stretch:condensed;font-size:34px;line-height:1.08;font-weight:800;letter-spacing:-0.5px;text-transform:uppercase;color:${c.night}">${text.replace(/\*(.+?)\*/g, `<span style="background-color:${c.orange};color:${c.night};padding:0 6px;border-radius:8px">$1</span>`)}</h1>`;
const p = (text, attrs = '') => `<p ${attrs} style="margin:0 0 18px;font-family:${font};font-size:16px;line-height:1.65;color:${c.night}">${text}</p>`;
const small = (text) => `<p style="margin:0;font-family:${font};font-size:13px;line-height:1.6;color:${c.muted}">${text}</p>`;
const eyebrow = (text, attrs = '') => `<p ${attrs} style="margin:0 0 10px;font-family:${font};font-size:13px;font-weight:700;color:${c.orangeText}">${text}</p>`;
const button = (label, href, attrs = '') => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px"><tr>
  <td ${attrs} bgcolor="${c.night}" style="border-radius:999px">
    <a href="${href}" style="display:inline-block;padding:15px 30px;font-family:${font};font-size:15px;font-weight:700;line-height:1;color:${c.cream};text-decoration:none;border-radius:999px">${label}&nbsp;&rarr;</a>
  </td>
</tr></table>`;

function shell({ title, preheader, body, footer }) {
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; background:${c.paper}; -webkit-text-size-adjust:100%; }
  a { color:${c.night}; }
  img { border:0; display:block; }
  @media (max-width:620px) {
    .px { padding-left:24px !important; padding-right:24px !important; }
    .h1 { font-size:28px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${c.paper}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${c.paper}" style="background:${c.paper}">
<tr><td align="center" style="padding:32px 12px 40px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
    <tr><td class="px" style="padding:0 8px 24px">
      <a href="${SITE}/" style="text-decoration:none"><img src="${SITE}/logo.png" width="190" alt="Dogfluencers" style="width:190px;height:auto"></a>
    </td></tr>
    <tr><td bgcolor="${c.card}" style="background:${c.card};border-radius:24px;overflow:hidden">
${body}
    </td></tr>
    <tr><td style="padding-top:16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${c.night}" style="background:${c.night};border-radius:24px">
        <tr><td class="px" style="padding:30px 40px">
          <img src="${SITE}/logo-white.png" width="150" alt="Dogfluencers" style="width:150px;height:auto;margin:0 0 16px">
${footer}
        </td></tr>
      </table>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>
`;
}

const footLine = (html) => `          <p style="margin:0 0 8px;font-family:${font};font-size:13px;line-height:1.6;color:${c.creamMuted}">${html}</p>`;
const footLink = (label, href) => `<a href="${href}" style="color:${c.cream};text-decoration:underline">${label}</a>`;

/* ---------------------------------------------------------------- Mailchimp */
// Classic builder regions: mc:edit for each editable block, mc:repeatable so
// an opportunity or a story can be duplicated in the editor.
const detailRow = (label, value, key) => `
            <tr>
              <td style="padding:10px 0;border-top:1px solid ${c.hairline};font-family:${font};font-size:14px;color:${c.muted};width:38%;padding-right:14px;vertical-align:top">${label}</td>
              <td mc:edit="${key}" style="padding:10px 0;border-top:1px solid ${c.hairline};font-family:${font};font-size:14px;font-weight:600;color:${c.night};vertical-align:top">${value}</td>
            </tr>`;

const mailchimp = shell({
  title: '*|MC:SUBJECT|*',
  preheader: '*|MC_PREVIEW_TEXT|*',
  body: `
      <img mc:edit="hero_image" src="${SITE}/email/hero-owner-dog.jpg" width="600" alt="A dog owner crouching in a park with her black and white collie" style="width:100%;max-width:600px;height:auto;border-radius:24px 24px 0 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="px" style="padding:36px 40px 12px">
          ${eyebrow('New opportunity', 'mc:edit="eyebrow"')}
          <div mc:edit="headline">${heading('A new brand wants <span style="background-color:' + c.orange + ';color:' + c.night + ';padding:0 6px;border-radius:8px">dogs</span>', 'class="h1"')}</div>
          <div mc:edit="intro">
            ${p('Hi *|FNAME|*,')}
            ${p('Here&#8217;s a new gifting opportunity for dogs in the Dogfluencers network. Have a read, and apply if it suits you and your dog.')}
          </div>
        </td></tr>
        <tr mc:repeatable="opportunity" mc:variant="Opportunity"><td class="px" style="padding:0 40px 8px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${c.creamSoft}" style="background:${c.creamSoft};border-radius:16px">
            <tr><td style="padding:22px 24px 12px">
              <p mc:edit="opp_title" style="margin:0 0 10px;font-family:${display};font-stretch:condensed;font-size:22px;line-height:1.15;font-weight:800;text-transform:uppercase;color:${c.night}">Brand name: product</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${detailRow('What your dog gets', 'The product, sent to your door', 'opp_gets')}${detailRow('What we ask', 'A story or post, if your dog loves it', 'opp_ask')}${detailRow('Best for', 'All sizes and ages', 'opp_for')}${detailRow('Apply by', 'Friday 28 November', 'opp_deadline')}
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td class="px" style="padding:20px 40px 8px">
          <div mc:edit="cta">${button('Apply for this', `${SITE}/creator/login/`)}</div>
          <div mc:edit="small_print">${small('Gifting is free and there&#8217;s no commission. Brands choose the dogs that suit them, so if you&#8217;re not picked this time, there&#8217;s always the next one.')}</div>
        </td></tr>
        <tr mc:repeatable="story" mc:variant="Story"><td class="px" style="padding:28px 40px 4px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${c.hairline};padding-top:28px">
            ${eyebrow('From the network', 'mc:edit="story_eyebrow"')}
            <p mc:edit="story_title" style="margin:0 0 10px;font-family:${display};font-stretch:condensed;font-size:24px;line-height:1.12;font-weight:800;text-transform:uppercase;color:${c.night}">A short update headline</p>
            <div mc:edit="story_body">${p('A couple of lines of news: a campaign that went well, a tip for better content, or a reminder to keep your dog&#8217;s details up to date.')}</div>
          </td></tr></table>
        </td></tr>
        <tr><td class="px" style="padding:12px 40px 36px">
          <div mc:edit="signoff">${p('Thanks for being part of the pack,<br><strong>The Dogfluencers team</strong>', '')}</div>
        </td></tr>
      </table>`,
  footer: [
    footLine(`You&#8217;re receiving this because you and your dog are part of the Dogfluencers creator network.`),
    footLine(`${footLink('Update your dog&#8217;s profile', `${SITE}/creator/login/`)} &nbsp;&middot;&nbsp; ${footLink('Instagram', 'https://www.instagram.com/dogfluencers.agency/')} &nbsp;&middot;&nbsp; ${footLink('Email preferences', '*|UPDATE_PROFILE|*')} &nbsp;&middot;&nbsp; ${footLink('Unsubscribe', '*|UNSUB|*')}`),
    footLine('*|LIST:ADDRESSLINE|*'),
    `          *|IF:REWARDS|* <div style="margin-top:12px">*|REWARDS|*</div> *|END:IF|*`,
  ].join('\n'),
});

/* ----------------------------------------------------------------- Supabase */
// Go templates: {{ .SiteURL }} and {{ .TokenHash }}. Links go through
// /auth/confirm/ so they work in any browser (no PKCE cookie needed).
const supa = ({ subject, note, preheader, eyebrowText, title, lines, label, type, next, after }) =>
  `<!-- ${note} Subject: ${subject} -->\n` +
  shell({
    title: subject,
    preheader,
    body: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="px" style="padding:40px 40px 32px">
          ${eyebrow(eyebrowText)}
          ${heading(title, 'class="h1"')}
          ${lines.map((l) => p(l)).join('\n          ')}
          ${button(label, `{{ .SiteURL }}/auth/confirm/?token_hash={{ .TokenHash }}&amp;type=${type}&amp;next=${next}`)}
          ${small(after)}
        </td></tr>
      </table>`,
    footer: [
      footLine('Dogfluencers connects pet brands with dogs and the owners behind them.'),
      footLine(`Questions? ${footLink('support@dogfluencers.agency', 'mailto:support@dogfluencers.agency')} &nbsp;&middot;&nbsp; ${footLink('dogfluencers.agency', `${SITE}/`)}`),
    ].join('\n'),
  });

const files = {
  'email/mailchimp-template.html': mailchimp,
  'supabase/templates/confirm-signup.html': supa({
    subject: 'Confirm your email',
    note: 'Supabase > Authentication > Emails > Confirm signup.',
    preheader: 'One click to finish your Dogfluencers application.',
    eyebrowText: 'Creator network',
    title: 'Confirm your *email*',
    lines: ['Thanks for applying to join the Dogfluencers creator network. Confirm your email to finish setting up your and your dog&#8217;s profile.'],
    label: 'Confirm my email',
    type: 'email',
    next: '/creator/profile/%3Fwelcome%3D1',
    after: 'If you didn&#8217;t apply, you can ignore this email.',
  }),
  'supabase/templates/invite.html': supa({
    subject: 'Set up your Dogfluencers login',
    note: 'Supabase > Authentication > Emails > Invite user. Sent when a creator from the old website asks to claim their profile.',
    preheader: 'Choose a password to see and update your dog&#8217;s profile.',
    eyebrowText: 'Welcome back',
    title: 'Set up your *login*',
    lines: ['You joined our creator network through our old website, and your details are safe with us. Choose a password to log in, then check your and your dog&#8217;s details are still right: brands are matched against them.'],
    label: 'Set up my login',
    type: 'invite',
    next: '/creator/reset-password/%3Fclaim%3D1',
    after: 'The link works once, for 24 hours. If you didn&#8217;t ask for it, you can ignore this email.',
  }),
  'supabase/templates/reset-password.html': supa({
    subject: 'Reset your password',
    note: 'Supabase > Authentication > Emails > Reset password.',
    preheader: 'Choose a new password for your Dogfluencers login.',
    eyebrowText: 'Your login',
    title: 'Reset your *password*',
    lines: ['Someone asked to reset the password for your Dogfluencers creator login. Choose a new one below.'],
    label: 'Choose a new password',
    type: 'recovery',
    next: '/creator/reset-password/',
    after: 'The link works once, for an hour. If you didn&#8217;t ask for it, you can ignore this email and your password stays the same.',
  }),
};

mkdirSync('email', { recursive: true });
for (const [path, html] of Object.entries(files)) {
  writeFileSync(path, html);
  console.log('wrote', path, `${(html.length / 1024).toFixed(1)} KB`);
}
