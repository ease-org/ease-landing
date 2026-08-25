// {{cookiecutter.project_slug}}/web/astro.config.mjs
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://ease-health.org',
  integrations: [svelte()],
  output: 'static',
  // Locale-prefixed routing: `/` = en (default, unprefixed), `/fi/` = fi.
  // Pages live in src/pages/ (en) and src/pages/fi/ (fi); this block keeps
  // Astro aware of the locale map for its i18n helpers and checks.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fi'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
