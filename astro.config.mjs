import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

import react from '@astrojs/react';

export default defineConfig({
  site: 'https://anh.lop12.com', // Học Tiếng Anh - Global Success
  devToolbar: {
    enabled: false,
  },
  integrations: [tailwind(), sitemap({
    changefreq: 'weekly',
    priority: 0.7,
    lastmod: new Date(),
    filter: (page) => !page.includes('/quiz/'),
  }), react()],
  vite: {
    server: {
      proxy: {

      },
    },
  },
});