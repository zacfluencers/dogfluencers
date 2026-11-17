// Builds the Dogfluencers email templates from one email-safe shell, so the
// Mailchimp template and the Supabase sign-in emails always match the site:
// paper ground, white card, condensed capitals with the orange mark on the
// last word, night pill buttons, a night footer with the logo.
//
//   node scripts/email-templates.mjs
//
// Writes email/mailchimp-gifting-campaign.html and supabase/templates/*.html. Paste the
// Supabase ones into Supabase > Authentication > Emails (subject in each file's
// first line); upload the Mailchimp one under Templates > Code your own.
import { mkdirSync, writeFileSync } from 'node:fs';

const SITE = 'https://dogfluencers.agency';
const c = { paper: '#fffaf3', card: '#ffffff', night: '#1a1412', cream: '#f9ead0', creamSoft: '#fdf6ea', orange: '#f53d0c', orangeText: '#c4300a', muted: '#6b5d55', creamMuted: '#c9b99f', hairline: '#eee4d6' };
const font = "'Open Sans', Arial, Helvetica, sans-serif";
const display = "'Arial Narrow', 'Open Sans Condensed', 'Helvetica Neue', Arial, sans-serif";

/**
 * The site's mark: a rounded orange bar along the heading's whole bottom row,
 * behind the lower part of the letters. Email can't measure where a line
 * wraps, so the marked words always start the bottom row on their own (a
 * break before them), and the bar is a pill-shaped block pulled up under
 * them. Clients paint block backgrounds beneath text, so the letters stay on
 * top. Where negative margins are stripped (Outlook.com) the pill sits just
 * under the row; classic Outlook shows a square bar.
 */
const mark = (words, breakBefore = true) =>
  `${breakBefore ? '<br>' : ''}<span style="display:inline-block;vertical-align:top;white-space:nowrap"><span style="display:block">${words}</span>` +
  `<span style="display:block;height:0.34em;margin:-0.5em -0.14em 0;background-color:${c.orange};border-radius:999px;line-height:0;mso-line-height-rule:exactly">&nbsp;</span></span>`;

/** "Reset your *password*": the starred words become the marked bottom row. */
const heading = (text, attrs = '') =>
  `<h1 ${attrs} style="margin:0 0 18px;font-family:${display};font-stretch:condensed;font-size:34px;line-height:1.08;font-weight:800;letter-spacing:-0.5px;text-transform:uppercase;color:${c.night}">${text.replace(/\s*\*(.+?)\*/g, (_, words, at) => mark(words, at > 0))}</h1>`;
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
// A gifting campaign email, in the same nine sections as the group's other
// creator networks: header, details, about the product, key message, post
// ideas, a fixed friendly reminder, content requirements, gifting
// information, join the network. [Square brackets] are for the team to fill
// in; the reminder and the disclosure wording are fixed (not mc:edit), so
// they say the same thing in every campaign. Classic builder: Templates,
// Create template, Code your own. Send to the "Dogfluencers" tag.
const h2 = (text) => `<p style="margin:0 0 12px;font-family:${display};font-stretch:condensed;font-size:22px;line-height:1.15;font-weight:800;letter-spacing:-0.3px;text-transform:uppercase;color:${c.night}">${text}</p>`;
const section = (title, inner, { tint = false, key } = {}) => `
        <tr><td class="px" style="padding:0 40px 16px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${tint ? ` bgcolor="${c.creamSoft}" style="background:${c.creamSoft};border-radius:16px"` : ''}>
            <tr><td style="${tint ? 'padding:22px 24px 8px' : `padding:20px 0 4px;border-top:1px solid ${c.hairline}`}">
              ${h2(title)}
              <div${key ? ` mc:edit="${key}"` : ''}>${inner}</div>
            </td></tr>
          </table>
        </td></tr>`;
const detailRow = (label, value, key) => `
            <tr>
              <td style="padding:9px 14px 9px 0;border-top:1px solid ${c.hairline};font-family:${font};font-size:14px;color:${c.muted};width:36%;vertical-align:top">${label}</td>
              <td mc:edit="${key}" style="padding:9px 0;border-top:1px solid ${c.hairline};font-family:${font};font-size:14px;font-weight:600;color:${c.night};vertical-align:top">${value}</td>
            </tr>`;
const bullets = (items) => `<ul style="margin:0 0 14px;padding:0 0 0 20px;font-family:${font};font-size:16px;line-height:1.65;color:${c.night}">${items.map((i) => `<li style="margin:0 0 4px">${i}</li>`).join('')}</ul>`;
const link = (label, href) => `<a href="${href}" style="color:${c.night};font-weight:700;text-decoration:underline">${label}</a>`;

const mailchimp = shell({
  title: '*|MC:SUBJECT|*',
  preheader: '*|MC_PREVIEW_TEXT|*',
  body: `
      <img mc:edit="hero_image" src="${SITE}/email/hero-owner-dog.jpg" width="600" alt="[Describe the image: the product, or a dog with it]" style="width:100%;max-width:600px;height:auto;border-radius:24px 24px 0 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <!-- 1. Campaign header -->
        <tr><td class="px" style="padding:36px 40px 8px">
          ${eyebrow('Gifting campaign')}
          <div mc:edit="headline">${heading('New gifting campaign: *[Brand name]*', 'class="h1"')}</div>
          <div mc:edit="intro">${p('Hi *|FNAME|*, a new gifting campaign is going out to dogs in the Dogfluencers network. Here&#8217;s everything you need to know.')}</div>
        </td></tr>
        <!-- 2. Campaign details -->
        <tr><td class="px" style="padding:0 40px 16px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${c.creamSoft}" style="background:${c.creamSoft};border-radius:16px">
            <tr><td style="padding:22px 24px 12px">
              ${h2('Campaign details')}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${detailRow('Brand', '[Brand name]', 'd_brand')}${detailRow('Gifted', '[Products dogs could receive]', 'd_gifted')}${detailRow('Best suited to', '[Dog size, age, breed, diet or allergies the brand is looking for]', 'd_suited')}${detailRow('Profiles to tag', '[Brand handle] @dogfluencers.agency', 'd_tag')}${detailRow('Link to use', '[Campaign link]', 'd_link')}${detailRow('Discount code', '[Code and offer details]', 'd_code')}
              </table>
            </td></tr>
          </table>
        </td></tr>
        <!-- 3. About the product -->${section('About the product', p('[A short introduction to the brand and products: what they are, the key ingredients or features, and their main selling points.]'), { key: 's_about' })}
        <!-- 4. Key campaign message -->${section('Key campaign message', p('[The main message creators should share, plus any product points, launch details or wording to include.]'), { key: 's_message' })}
        <!-- 5. Post ideas -->${section('Post ideas', bullets(['Your dog&#8217;s first taste or first reaction', 'Unboxing, with your dog inspecting', 'A day in your dog&#8217;s routine, with the product in it', 'Walkies, playtime or training with it', 'An honest update after a week or two']), { key: 's_ideas' })}
        <!-- 6. Friendly reminder (standard wording, locked) -->${section('Friendly reminder', p('We match gifting to your dog&#8217;s profile: their breed, size, age, diet, any allergies, and the content you make. This email goes to our whole network, and if you&#8217;re in our gifting network your dog is considered automatically, so there&#8217;s nothing to opt in to.') + p('Dogs are chosen to fit each brand&#8217;s brief, so not everyone is picked every time, and this email doesn&#8217;t guarantee you&#8217;ll receive the product.'), { tint: true })}
        <!-- 7. Content requirements -->${section('Content requirements', `<div mc:edit="s_requirements">${bullets(['Minimum content: [e.g. one story]', 'Post by: [Deadline]', 'Hold content until: [Date, if any]'])}</div>` + small('Read the feeding guide and instructions, introduce new food gradually, and never film anything that puts your dog at risk. Always disclose your collaborations: put #ad at the start of anything paid for or directed by the brand, say when a product was gifted, and turn on Instagram&#8217;s paid partnership label or TikTok&#8217;s branded content toggle where relevant.') + '<div style="height:12px;line-height:12px">&nbsp;</div>')}
        <!-- 8. Gifting information -->${section('Gifting information', p(`Everything you need to know about PR boxes and gift drops: ${link('read our gifting guidelines', `${SITE}/for-creators/gifting-guidelines/`)}.`) + p(`New puppy, moved house or changed your dog&#8217;s food? ${link('Update your profile', `${SITE}/creator/login/`)} so we send the right products to the right place.`))}
        <!-- 9. Join the network -->${section('Join the network', p('Not part of the Dogfluencers network yet? It&#8217;s free to join, and you&#8217;ll hear about gifting, paid campaigns and UGC work for your dog.') + button('Join here', `${SITE}/join/`))}
        <tr><td class="px" style="padding:4px 40px 36px">
          <div mc:edit="signoff">${p('Thanks for being part of the pack,<br><strong>The Dogfluencers team</strong>')}</div>
        </td></tr>
      </table>`,
  footer: [
    `          <p style="margin:0 0 8px;font-family:${display};font-stretch:condensed;font-size:18px;font-weight:800;text-transform:uppercase;color:${c.cream}">Stay connected</p>`,
    footLine(`You&#8217;re getting this because you joined the Dogfluencers creator network. ${footLink('Instagram', 'https://www.instagram.com/dogfluencers.agency/')}`),
    footLine('Dogfluencers is run by Fluencers Group LTD. *|LIST:ADDRESSLINE|*'),
    footLine(`${footLink('Update your email preferences', '*|UPDATE_PROFILE|*')} &nbsp;&middot;&nbsp; ${footLink('Unsubscribe', '*|UNSUB|*')}`),
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
  'email/mailchimp-gifting-campaign.html': mailchimp,
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
    title: '*Set up your login*',
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
