# Dogfluencers

Marketing site and creator CRM for Dogfluencers (dogfluencers.agency), a dog and
pet influencer marketing agency, part of Fluencers Group.

Astro 5 · Tailwind 4 · static pages with a few server routes · Vercel · Supabase (CRM) · Resend (email)

## Getting started

```bash
npm install
npm run dev
```

http://localhost:4321

## Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Dev server. Placeholder content is visible (review mode). |
| `npm run build` | Production build. Unapproved content is stripped. |
| `npx astro check` | Types and templates. Keep this at zero errors. |

## Structure

```
src/
  system/      Portable framework: no agency names, copy or niche words
  agency/      Everything Dogfluencers: config, brand tokens, components, content, CRM questions
  layouts/     Page shells that wire agency data into components
  pages/       Routes
scripts/       Database, admin, import and email scripts
supabase/      CRM schema migrations and auth email templates
```

`CLAUDE.md` holds the design language, the content-honesty rules and the CRM notes.
`LAUNCH-CHECKLIST.md` lists what remains before go-live.

## Environment variables

See `.env.example`. None are needed to run the marketing pages locally; the
enquiry form needs `RESEND_API_KEY`, and the CRM needs the Supabase values.

## Content status

Content carries `status: 'approved' | 'placeholder'`. Placeholders show in
development and in review builds (`PUBLIC_SHOW_PLACEHOLDERS=true`), and are removed
from production builds so unverified claims cannot ship.
