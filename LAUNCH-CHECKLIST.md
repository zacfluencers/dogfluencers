# Dogfluencers: launch checklist

**Live since 17 November 2026** at dogfluencers.agency (Vercel, DNS on Vercel DNS).
Updated 17 November 2026, after launch. What's done is listed briefly at the end;
everything still open is first.

## Still to do

### Needs the client

- [x] **The new-site email to imported creators**: scheduled in Mailchimp for
      Thursday 19 November 2026, 9am UK, in 5 batches an hour apart (about 250 each),
      to the subscribed members of the "Dogfluencers" tag. Template:
      `email/mailchimp-new-website.html`. Before 9am: check the Resend plan covers the
      claim emails it will trigger (the free plan stops at 100 a day).
- [ ] **Usage rights** for every creator video and photo on the site (heroes, mastheads,
      work, case studies). All are marked `TODO(confirm)`.
- [ ] **Adaptil and Omni** happy to be named in the case studies, with the figures shown.
- [ ] **The six partner logos** (Omni, Harringtons, Buddy & Lola, Bunty, Total Pet,
      Puptons) still current.
- [ ] **Welcome email wording** (`welcome` in `src/agency/crm.ts`). One tip says
      "#gifted for gifted products and #ad for paid work"; the gifting guidelines say not
      to rely on "gifted" alone. Align with the guidelines, or keep?
- [ ] **What the 12 month quality assurance covers** (`services.ts`).
- [ ] **Old blog posts and terms** say content in seven days and gift drops of up to
      100 dogs; the packages say 12 days and up to 1,000. Update, or leave?
- [ ] **Testimonials**: real, approved quotes, or the section stays hidden (it is
      stripped from the live site today).
- [ ] **An SVG of the logo** (the site uses PNGs).
- [ ] **Legal pages** (privacy, cookies, terms): written for the CRM and the data it
      holds; the client (or their adviser) should read them through.

### Optional automatic emails (agree with the client first)

- [ ] **Enquiry received** auto-reply to a brand: thanks, what happens next, when to
      expect a reply.
- [ ] **Not this time**, kind wording, if the team declines an applicant.
- [ ] **Profile reminder** for creators with missing details or an old profile.

### Team housekeeping

- [ ] **Each admin changes the shared starting password** (Zac, Nicola, Jonathan,
      Alison) at `/creator/forgot-password/`.
- [ ] **Confirm signup subject** in Supabase > Authentication > Emails: change Supabase's
      default "Confirm your email address" to "Confirm your email".
- [ ] **One real application and one real enquiry** through the live forms, now the
      bot checks are on, to confirm a person gets through cleanly.
- [ ] **Full review on real devices** (phone and desktop): video playback and sound,
      the hero stickers, the menu, both forms.

### Technical, when convenient

- [ ] **Video weight**: `public/video` is now 131 MB (111 MB of it full-length work and
      case study videos, which only load as you scroll to them). Check the homepage on a
      mobile connection; re-encode the heaviest full videos if it feels slow.
- [ ] **Upgrade the Vercel CLI** (`npm i -g vercel@latest`; this machine has 54.14).
- [ ] **Cloudflare Turnstile** on the forms, only if spam gets past the current checks.

## Done

- **Site**: rebuilt in Astro on Vercel; review mode off in Production (only the
  testimonials are stripped); every old WordPress page, post and category redirects;
  favicon and share image; `astro check` at 0 errors; no dashes in rendered copy.
- **Content**: real stats (1,800+ dogs, 200+ campaigns, 10,000+ creators gifted, 10,000+
  pieces of content); Adaptil and Omni case studies with full videos; the work section
  mixes Omni, Adaptil, Zesty Paws and Poppy's Picnic; transparent pricing; Mass Gifting
  renamed Influencer Gifting (old address redirects); Omni's new logo first.
- **Domain**: dogfluencers.agency and www on Vercel; `dogfluencers.vercel.app` redirects to it (except `/api/`); DNS on Vercel DNS with every old
  record (Google Workspace MX, SPF, verification, DKIM) recreated first.
- **CRM**: Supabase (eu-west-1); 1,337 creators and 1,824 dogs imported; four admins
  (Zac, Nicola, Jonathan, Alison); always light, in Dogfluencers' style; the owner
  "Sizes and diet" step removed; applications open (allowlist off in Production, kept
  on Preview).
- **Email**: `send.dogfluencers.agency` verified in Resend; Supabase sends through it;
  the confirm, invite and reset emails, the welcome email, the morning applications
  email (9am UK, on) and the team's enquiry email all share one branded design with the
  Fluencers Group address; enquiries go to Jonathan.
- **Mailchimp**: hourly sync to the existing Dogfluencers audience (unsubscribes kept
  and carried over); "Dogfluencers | Gifting campaign" template uploaded.
- **Spam protection**: honeypots, origin check, a signed start time on both forms, and
  unconfirmed applications kept out of the CRM and deleted after 7 days.
- **Tested live**: a real application (confirm email, CRM, then removed), the welcome,
  enquiry and morning emails to Zac and Jonathan, team login.
