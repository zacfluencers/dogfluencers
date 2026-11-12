# Dogfluencers: launch checklist

Written 11 November 2026, for the session on 12 November.

The rebuild is design-complete and on Vercel as a private review build (project
`dogfluencers`, team zac-4957s-projects, behind Vercel login). Everything below is
what stands between that and dogfluencers.agency going live.

## Bring to the session

- [ ] **The WordPress user export (CSV)** of Dogfluencers creators. Keep it outside
      the repo (it holds addresses, phone numbers and dates of birth), e.g. `~/ShipStudio/dog-private/`.
- [ ] Access to: Supabase (to create a project), Resend, Vercel, GitHub
      (zacfluencers), and wherever dogfluencers.agency's DNS is managed.
- [ ] Emails of the team members who need CRM admin access.

## 1. Git and Vercel (do first; everything else deploys through it)

- [x] Create the private GitHub repo `zacfluencers/dogfluencers` and push (12 Nov).
- [x] Connect it to the `dogfluencers` Vercel project, so `main` deploys production
      and branches get previews (replaces deploying by CLI).
- [ ] Upgrade the Vercel CLI (`npm i -g vercel@latest`): 54.14 can't add preview env vars.
- [x] Set `PUBLIC_SHOW_PLACEHOLDERS=true` for **Preview only** until launch.
- [ ] Check `dogfluencers.vercel.app` stays off or protected: the first deploy made it
      public for a couple of minutes with unconfirmed content.

## 2. Creator CRM (Supabase) and the WordPress import

- [x] Create Supabase project "Dogfluencers", Ireland (eu-west-1), beside Vercel's `dub1`.
- [x] Put the four Supabase values and `CRON_SECRET` in `.env` and Vercel (12 Nov; `CRM_EMAIL_ALLOWLIST` on production too).
- [x] `npx tsx --env-file=.env scripts/db-migrate.ts`
- [x] Admins added (12 Nov): Zac, Nicola, Jonathan. Each should change the shared starting password.
- [x] Import script written for the dog export (12 Nov): one CRM dog per dog,
      sizes estimated from breed. Dry run: 1,337 creators, 1,824 dogs.
- [x] Imported 12 Nov: 1,337 creators, 1,824 dogs. The ~100 households flagged in
      `~/ShipStudio/dog-private/import-out/import-report.json` have their original answers in team notes.
- [ ] Paste the three Dogfluencers email templates in `supabase/templates/` into
      Supabase > Authentication > Emails (subjects are in each file's first line).
- [ ] Supabase > Authentication > URL Configuration: Site URL and Redirect URLs.
- [ ] Supabase custom SMTP through Resend, so login emails aren't rate limited.
- [ ] Test the whole flow with `example.com` / team addresses only: apply at `/join/`,
      log in, edit profile, claim an imported profile at `/creator/claim/`, work the
      list at `/admin/creators/`, CSV export.

## 3. Email: Resend and the forms

- [ ] Verify `send.dogfluencers.agency` in Resend (DNS records at the registrar).
      Don't touch existing MX or SPF records.
- [ ] `RESEND_API_KEY` in Vercel.
- [ ] Confirm the enquiry inbox: currently `jonathan@fluencersgroup.com`
      (`src/agency/config.ts`, `contact.enquiries`).
- [ ] Send a test enquiry from `/contact/`; check the no-JS path lands on `/contact/thanks/`.
- [ ] `CRM_EMAIL_ALLOWLIST` on while testing; remove from production at launch.
- [ ] Morning applications email: `CRM_DIGEST_ENABLED=true` in production after launch.
- [ ] Mailchimp (optional at launch): `MAILCHIMP_API_KEY`, `MAILCHIMP_AUDIENCE_ID`,
      check the agency tag says "Dogfluencers", then `MAILCHIMP_SYNC_ENABLED=true`.
- [ ] `scripts/announce-new-site.ts`: check its wording for Dogfluencers before use.
      **Never send to all creators without the client's go-ahead.**

## 4. Automatic emails

Sent today: the team's new-enquiry email, the team's morning applications email,
and Supabase's confirm-email, set-up-login and reset-password emails.

- [ ] Agree with the client which automatic emails to add, and their wording:
  - [x] **Welcome / you're approved**: built (12 Nov) as a tick box when the team
        approves someone. Draft wording in `crm.ts` (`welcome`) needs the client's OK.
  - [ ] **Not this time** (optional), kind wording, if the team declines one.
  - [ ] **Enquiry received** auto-reply to a brand: thanks, what happens next, when to
        expect a reply.
  - [ ] **Profile reminder** (optional) for creators with missing details or a stale profile.
- [ ] Build them in the Dogfluencers style (paper, white card, condensed capitals,
      night pill button), sent through Resend from `send.dogfluencers.agency`.
- [ ] Restyle the morning applications email (`src/system/crm/digest.ts`), which still
      has a generic look, to match.
- [ ] Every one goes through the `CRM_EMAIL_ALLOWLIST` guard while testing, and none
      sends in bulk.

## 5. Confirmations needed from the client

- [ ] Old blog posts say content in seven days and 100-dog drops; the terms define a gift drop as up to 100 dogs. Update to match the packages (12 days, up to 1,000), or leave?

Anything unconfirmed stays hidden in production (`status: 'placeholder'`).

- [ ] **Poppy's Picnic and Zesty Paws**: confirmed clients, and usage rights for the
      videos. Until then the work sections are hidden on the live site.
- [ ] Usage rights for every creator video and photo used (hero, services, mastheads).
- [ ] The six partner brands in the logo strip (Harringtons, Omni, Buddy & Lola, Bunty,
      Total Pet, Puptons) are still current.
- [ ] Real network numbers for the stats (currently TBC, hidden live).
- [ ] Case studies: real ones, or the section stays hidden.
- [ ] What the 12 month quality assurance covers (`services.ts`).
- [ ] An SVG of the logo.

## 6. Before go-live

- [ ] Full review on real devices (phone and desktop): video playback, sound, the
      hero stickers, menu, forms.
- [ ] Look at a production build with placeholders stripped: whole sections disappear
      (work, stats, case studies). Check each page still flows and bands still alternate.
- [ ] Old WordPress URLs: list every page and post on the live site and add redirects
      in `vercel.json` for any that change (the blog posts are done).
- [ ] Legal pages (privacy, cookies, terms) reflect the new CRM and data held.
- [ ] Favicon, social share image, page titles and descriptions per page.
- [ ] Performance: ~39 MB of video in `public/`; check the homepage on a mobile connection.
- [ ] `npx astro check` at 0 errors, `npm run build`, dash scan of `.vercel/output/static/`.

## 7. Go live

- [ ] **Remove `PUBLIC_SHOW_PLACEHOLDERS` from Production** (on since 12 Nov for client feedback), so launch strips unconfirmed content.
- [ ] Add dogfluencers.agency and www to the Vercel project; point DNS (apex A to
      Vercel, www CNAME), keeping MX, SPF and Resend records.
- [ ] Update Supabase Site URL and Redirect URLs to the real domain.
- [ ] Remove `CRM_EMAIL_ALLOWLIST` from production; set `CRM_DIGEST_ENABLED=true`.
- [ ] Smoke test live: enquiry, application, login, admin.
- [ ] Only then, with the client's go-ahead: the new-site email to imported creators.
