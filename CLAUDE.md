# Dogfluencers

Marketing site and creator CRM for Dogfluencers (dogfluencers.agency), a dog and pet
influencer marketing agency, part of Fluencers Group. Pet brands enquire through
the contact form; dog owners apply to the creator network at `/join/`, and the
team works applicants at `/admin/creators/`.

This project stands alone. It shares no accounts, database, email domain,
repository or content with any other agency site. Don't link it to, or copy
settings from, another agency's project.

Astro 5 + Tailwind 4, Vercel (Dublin region, `dub1`). Marketing pages are static
and build from the fixtures in `src/agency/content` (no CMS yet;
`cms.sanity` in the agency config would switch to Sanity, same interface).

## Architecture: the agency boundary

| Layer | Path | Rule |
| --- | --- | --- |
| System | `src/system/**` | Portable framework. **Never imports from `src/agency`.** No agency name, niche word or copy. |
| Agency | `src/agency/**` | Everything Dogfluencers: config, brand tokens (`theme.css`), its own components (`components/ui`, `components/sections`), content, CRM questions (`crm.ts`). |
| Glue | `src/content.ts`, `src/layouts/**`, `src/pages/**` | The only files allowed to import from both. |

The marketing pages are built from Dogfluencers' own components in
`src/agency/components`. The system supplies the engine: content loading,
`publishable()`, motion reveals, forms, the CRM, rich text.

## Content and honesty rules

Every content record carries `status: 'approved' | 'placeholder'`.
`publishable()` in `src/system/content/source.ts` keeps placeholders in **review
mode** and strips them otherwise. Review mode (`SHOW_PLACEHOLDERS`) is always on in
`astro dev`, and on in a build with `PUBLIC_SHOW_PLACEHOLDERS=true` (review builds
only, never production). The visual "placeholder" badges were removed at the
client's request, so review builds show unconfirmed content unlabelled: never
make one public.

**Never invent** client relationships, campaign metrics, creator counts,
testimonials or awards. If content is missing, use `<ContentRequired>`
(review-mode only) rather than filling the gap.

Today: the work posts (Poppy's Picnic, Zesty Paws) were approved on 12 November
2026. The stats are approved: "Dogs in the network" 1,800+ from the CRM, and 200+
campaigns, 10,000+ creators gifted and 10,000+ pieces of content, supplied by the
team on 13 November. Two real case studies (13 November): Adaptil firework season
and Omni, both Influencer Gifting, with the team's figures and four full creator videos
each (`public/video/full/adaptil-*`, `omni-*`; sources in
`~/ShipStudio/dog-raw/campaigns/`). Testimonials are still placeholders. The six partner
brands in the logo strip are approved with a TODO to confirm. Usage rights for
the creator videos and photos are to be confirmed. Search for `TODO(confirm)`.

**No em or en dashes in anything the site renders** (copy, titles, form options,
notes). Use a comma, colon or full stop; `to` for ranges; `|` as the title
separator. Check a build with a search of `.vercel/output/static/` for `—`, `–`
and their entities.

## Visual language

Clean first, in the manner of Airbnb and Linear, with a playful edge that is
rationed. Recorded here as built.

### Colour

Three brand colours, in `src/agency/theme.css`: orange `#f53d0c`, night
`#1a1412`, cream `#f9ead0`. Derived steps: paper `#fffaf3` (page ground),
cream-soft, `--orange-text` `#c4300a` (orange as small text on light grounds),
night-muted, cream-muted. Bands: `band-paper`, `band-cream`, `band-night`,
`band-orange`; neighbours never share a band.

**Buttons are night with cream text** (`--btn-fill`, `--btn-ink`), turning orange
on hover; on orange and night bands they are cream with night text. A deeper
orange with white text was tried and rejected by the client. Cream on orange is
3.2:1: display type only, never body copy.

No gradients, no grain, no paw wallpaper.

### Type

Open Sans variable (`@fontsource-variable/open-sans`, width axis), self-hosted.
Headings: condensed (`font-stretch: 75%`), ExtraBold 800, uppercase, tight
tracking. Body: Open Sans, sentence case. Classes: `d-display`, `d-h1`, `d-h2`,
`d-h3`, `d-lead`, `d-body`, `d-small`, `d-ui`, `d-muted`.

### The mark

`MarkedText` wraps `*word*` in `.text-mark`; the theme draws a rounded orange bar
behind it. **Mark only the last word** of a heading: marks don't wrap, and
`rowMarks()` in `DogMotion.astro` stretches the bar across the heading's whole
bottom row, so it always underlines a full row, never part of one. One mark per
heading that earns it.

### Shape

Rounded: `--radius-lg` 1.5rem, `--radius-md` 1rem, `--radius-sm`, pills for
buttons and chips. Filled cards (cream, or paper on a cream band), no outlined
cards. Shared spacing tokens: `--grid-gap`, `--card-pad`, `--overlay-inset`.
Every paw is the logo paw (`components/ui/Paw.astro`).

### Signature components

- `Hero` (homepage): copy left, a three-tile video mosaic right (one tall, two
  stacked), a floating white card with the paw avatar, partner logos below.
  On phones the main tile goes full width with the two small tiles beneath.
- **Hero stickers (easter egg):** clicking a hero tile slaps down a sticker
  (die-cut logo paw, GOOD DOG, WOOF!, PAWSOME) in one layer above all tiles; it
  can hang over tile edges, holds, then peels away. No hint, on purpose.
- `PageHead`: interior masthead, same mosaic, breadcrumbs, a `FloatCard`.
- `Deal`: the Linear/Stripe-style dark panel (big figures in hairline cells,
  requirement pills, CTA), on For Creators, For Brands and each service page.
  On phones the figures become compact rows.
- `ServiceRows` (/services/): sticky pill nav plus one rounded panel per service.
- `Pricing`: transparent packages on the Influencer Gifting and UGC pages, as one
  white panel split by hairlines (Stripe-like), each column with a scale bar
  (its leading figure against the biggest package), price + VAT, ticked
  inclusions with bold figures and its own button. Prices match the group's
  published packages: gifting £2,850 to £8,500 (150 to 1,000 dogs), UGC £1,440 to
  £7,200 (10 to 100 videos, 12 day delivery). The site's claims follow them:
  drops of up to 1,000 dogs, content in 12 days. The old blog posts (seven
  days, 100 dogs) and the terms' gift-drop definition (up to 100) are left for
  the client to decide.
- Case study and work videos are always the creator's **full** edit with sound,
  never cut down; only hero and masthead loops are short cuts. Covers and
  posters avoid burnt-in captions (crop above them from the source).
- `CallStrip`: a night strip fixed to the bottom with "Book a call with
  Jonathan" (Calendly), hidden on creator pages (`ctaStrip.hideOn`).
- `WorkPosts`: full creator videos with an optional sound button, no text under
  them. `work.ts` holds four rows of four, mixing brands (Omni,
  Adaptil, Zesty Paws, Poppy's Picnic); each page shows its own row via
  `workRow(work, n)`, so the section changes across the site. `Bento`, `Steps`, `Feature`, `ListSplit`, `Categories`, `CampaignCards`,
  `Pricing`, `StatRow`, `Faq`, `CtaBand`.

### Video and motion

- **Every video must be tagged BT.709 (standard colour).** iPhone sources are
  often HDR (HLG); a clip that keeps that tag plays brighter than the rest in
  browsers. Don't tone-map (it washes the picture out): relabel the stream with
  the `h264_metadata` bitstream filter, as in `scripts/check-video-colour.sh`,
  and run that script after adding any video.
- Short loops in `public/video/` (720×1280 H.264, `+faststart`, poster `.jpg`);
  full work videos with audio in `public/video/full/`. Owner-and-dog loops cut from the Omni creator
  videos (Georgia, Natasha, Evie, Fern, Hannah) lead the homepage hero and most
  mastheads; no page shows the same clip twice (service videos also appear on
  the homepage and For Brands). Sources live outside the
  repo in `~/ShipStudio/dog-raw`. Loops are listed in `src/agency/content/clips.ts`.
- `Media.astro` shows the poster over the video until it is actually playing (no
  flash), plays only while half on screen, preloads ahead of arrival. Wrap a
  group in `data-clip-group` with one `ClipToggle` (WCAG 2.2.2).
- Sound: turning one video's sound on mutes the others and restarts it; leaving
  the screen mutes and pauses it.
- Reveals from the system's `Motion.astro` (`html[data-motion]`), plus
  `DogMotion.astro`: `[data-play]` gets `.is-playing`/`.is-in`, marks wipe in.
- A page reached from a link opens at the top (back/forward keep position).
- `prefers-reduced-motion` is honoured everywhere.

### Tried and removed

- A slanted sticker in the hero, then the "100 dogs, one drop" callout.
- Like and comment icons on work cards; text under the work videos; the arrow
  in the work section.
- Deep orange buttons with white text.
- A site-wide "orange mode" switch.

## Gotchas

- **Astro scoped styles outrank Tailwind utilities** (utilities sit in a layer).
  Put spacing and responsive rules for a component in its scoped `<style>`.
- Element resets live in `@layer base`; keep new element rules there.
- The page wrapper is `.wrap`, never `.container`.
- `trailingSlash: 'always'`: internal links need the trailing slash.
- The system `ContactForm` button keeps its own scoped styles; the theme
  overrides it with `:is(a, button).btn.btn-primary`.

## Creator CRM

Portable engine in `src/system/crm/` and `src/system/components/crm/`.
Dogfluencers' questions are defined in `src/agency/crm.ts` and stored in the
`details` JSON column by key. The join form, profile page, filters, table,
detail page, CSV export and Mailchimp tags are all generated from those
definitions. Never rename a key that holds answers.

**Dogs are a repeated step** (`repeat` on the step): each dog has its own name,
breed, size, date of birth, diet, food notes and allergies, stored as a list in
`details.dogs`, up to six. "Add another dog" works on the join form and the
profile. Filters match any dog (a household with a puppy and a senior is found
by both), the table has a Dogs column ("Bonnie: Cockapoo, 3 years", +1 for
more), search covers dog names and breeds, the export gives each dog its own
columns, and Mailchimp tags every dog's size, age band and diet. Ages are worked
out from each dog's date of birth on the day (`type: 'date'` with `bands`), so
they never go stale. Other agency questions: account type, content, professional
background (vet, behaviourist, nutritionist...), skills, favourite and avoided brands.

**Estimated answers.** An imported dog's size is estimated from its breed, and
a date of birth worked out from an age or a lone year is estimated too. These
are listed in the item's `_estimated`; the team sees "(estimated, not yet
confirmed)", the owner sees "We filled this in for you. Please check it's
right", and saving the profile confirms them (the key is dropped).

**Improvements carried into this CRM** (keep them):
- Every creator loads past Supabase's 1,000-row cap (`listAllCreators` pages through).
- The morning email counts the real total and lists the first 50.
- A creator whose confirmation link expired can ask for a new one from the login
  page; the option appears only once their password matches, so it never reveals
  which emails have accounts.
- Approving a creator offers a tick box to send the welcome email (`welcome` in
  `crm.ts`, `sendWelcome`). A tick box, not automatic, so a wrong click sends
  nothing; shown only on the move into Approved, so it can't send twice. Rejected
  creators are never emailed automatically. Replies go to the team (`replyTo`).
- CRM emails share one layout and sender (`src/system/crm/emails.ts`) in the
  agency's `emailTheme`, and every send to a creator goes through `mayEmail`.
- Dropdowns draw their own chevron with side padding (`.form-select`), because
  Safari ignores padding on the native arrow.
- Creator and team logins are linked from the header and footer; login pages
  link onward (join, claim, contact).

Security: passwords only in Supabase Auth; Row Level Security limits a creator to
their own row; admins are rows in `public.admins`, added only with
`scripts/add-admin.ts`; team reads and writes go through `admin_*` functions that
check `is_admin()`. CRM pages send `Cache-Control: private, no-store` and `noindex`.

**Not set up yet.** Its own Supabase project ("Dogfluencers", eu-west-1) is to be
created; then `scripts/db-migrate.ts`, `scripts/add-admin.ts`, the three templates
in `supabase/templates/` pasted into Supabase > Authentication > Emails, Site
and Redirect URLs, and custom SMTP through Resend.

**Importing the old WordPress creators:** `scripts/import-wordpress-creators.ts`
with `scripts/dog-import.ts` (dry run, then `--commit`). The November 2026 export
(1,338 rows) gives 1,337 creators and 1,824 dogs; 361 households have more than
one. The old form took every dog in one box per question, so the import splits
names, lines up breeds and dates (by name where the owner wrote one beside a
date), maps diet to options and keeps the owner's words as food notes, and
estimates size from breed. About 100 households that don't line up are listed in
the report, with their original answers in team notes. The export and the
script's output are personal data: they live in `~/ShipStudio/dog-private/`,
never in the repo.

**Testing guard:** with `CRM_EMAIL_ALLOWLIST` set, the site emails (and accepts
applications from) only those domains. It's off in Production since launch (17
November 2026, client go-ahead) and stays on in Preview. Tests use `example.com`
addresses. **Never email creators in bulk
without the client's permission** (`scripts/announce-new-site.ts`).

## Email

Enquiries (`src/pages/api/contact.ts`) send through Resend with `RESEND_API_KEY`,
from `enquiries@send.dogfluencers.agency` once that domain is verified. The
recipient is `contact.enquiries` in `src/agency/config.ts` (to confirm).

## Deployment

GitHub `zacfluencers/dogfluencers` (private) → Vercel project `dogfluencers`
(connected 12 November 2026). Push to `main` deploys production; any other branch
gets a preview. **Review mode is off in Production** (`PUBLIC_SHOW_PLACEHOLDERS`
removed 17 November 2026 for launch), so production strips anything still
`placeholder` (today, the testimonials). Preview builds keep it on. Never set
it on Production again.

Launch, 17 November 2026: dogfluencers.agency moves from the old WordPress site to
this project. Every old WordPress page and post redirects in `vercel.json`.

`LAUNCH-CHECKLIST.md` lists everything before go-live.

## Commands

```bash
npm run dev      # localhost:4321
npm run build
npx astro check  # keep at 0 errors

npx tsx --env-file=.env scripts/db-migrate.ts
npx tsx --env-file=.env scripts/add-admin.ts <email>
npx tsx scripts/import-wordpress-creators.ts <csv> <out-dir>   # dry run; --commit to import
```
