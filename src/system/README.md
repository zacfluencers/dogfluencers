# Agency website system

The portable half of the build. Everything here is agency-agnostic: no agency name,
no niche word, no marketing copy, no brand colour.

## The one rule

**`src/system` must never import from `src/agency`.**

Components receive agency data as props. `src/layouts` and `src/pages` are the glue
that wires the two together, and they are the only files allowed to import from
both. If a system component needs the agency config, it takes it as a prop — see
`Header.astro`, `Footer.astro`, `ContactForm.astro`.

## Porting to another agency

1. Copy `src/system/`, `src/layouts/`, `src/pages/` and `src/styles/global.css` into
   the new repo.
2. Create `src/agency/` with four things:
   - `config.ts` — an `AgencyConfig` (see `types/agency.ts`). `assertAgencyConfig`
     fails the build loudly if a required value is missing.
   - `theme.css` — the brand tokens. Define every custom property that
     `styles/global.css` maps into Tailwind; the semantic names are fixed, the
     values are yours.
   - `content/` — a module exporting `content: ContentSource`.
   - assets in `public/`.
3. Copy `astro.config.mjs` (it reads the domain from the agency config) and
   `CLAUDE.md`, replacing the visual-language section with the new brand.

No file in `src/system` should need editing. If one does, that is a signal the
abstraction is wrong — fix it here rather than forking the component.

## Layout

```
types/       content model + agency config contract (mirrors the Sanity schema)
content/     ContentSource interface, publish filtering, Sanity adapter stub
             (the resolver itself lives at src/content.ts — see below)
lib/         SEO resolution and JSON-LD builders
styles/      structural tokens, base element styles, type scale
components/
  global/    Container Section Button TextLink Media ClipTile ClipsToggle RichText Breadcrumbs
             Header Footer Wordmark PageHeader SectionHeader Eyebrow
  sections/  Hero HeroReel PositioningStatement LogoCloud Stats ServiceGrid ServiceCard
             ServiceRows MediaFeature WorkGrid
             ProcessSteps CampaignGrid CampaignCard CreatorNetwork
             CreatorCategoryGrid Testimonials Faq Cta ArticleGrid ArticleCard
             ImageGallery ContactForm
  crm/       FormField CreatorFields JoinForm CreatorsTable CrmUnavailable
  seo/       SeoHead StructuredData
crm/         creator CRM engine: field contract (types.ts), validation, filters,
             CSV, Supabase clients, server actions, morning digest. The agency
             supplies a CrmConfig (its questions, sizes, countries, consent).
  dev/       PlaceholderMark ContentRequired (render only in development)
```

## Content source

`content/source.ts` defines `ContentSource`. `src/content.ts` (app layer) picks the active
implementation: `content/sanity.ts` when the agency config has a `cms.sanity` block,
the agency's fixtures otherwise.

Each agency has its own Sanity project and its own Studio repo, with a schema that
mirrors `types/content.ts`. To set up a new agency's CMS, copy an existing Studio,
change its `projectId`, and put the same ID in the new agency config. No component
changes, because the types in `types/content.ts` are the schema contract.

## Optional content

Every section handles missing content by rendering nothing rather than an empty
shell. `publishable()` strips `status: 'placeholder'` records in production, so a
section whose content has not been approved disappears instead of publishing an
unverified claim. `ContentRequired` marks the gap during development only.
