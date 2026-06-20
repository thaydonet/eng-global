import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import react from '@astrojs/react';

export default defineConfig({
  site: 'https://anh.lop12.com',
  devToolbar: {
    enabled: false,
  },
  integrations: [sitemap({
    changefreq: 'weekly',
    priority: 0.7,
    lastmod: new Date(),
    filter: (page) => !page.includes('/quiz/'),
  }), react()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {

      },
    },
    ssr: {
      noExternal: ['uuid'],
    },
  },
});