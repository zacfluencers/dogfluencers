// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

import { agency } from './src/agency/config.ts';

// https://astro.build/config
export default defineConfig({
  // Canonical origin for the active agency. Swapping the agency folder swaps the domain.
  site: agency.site.url,
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Marketing pages stay prerendered. The adapter serves the routes that opt
  // out with `prerender = false`: the enquiry endpoint and the creator CRM.
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !agency.site.excludeFromSitemap.some((path) => page.endsWith(path)) &&
        // The creator CRM: forms, accounts and the team's pages, all noindex.
        !/\/(admin|creator|auth|join|api)\//.test(new URL(page).pathname),
    }),
  ],
});
