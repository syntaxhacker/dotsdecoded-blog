import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://dotsdecoded-blog.pages.dev',
  integrations: [react(), mdx()],
  output: 'static',
  vite: {
    plugins: [{
      name: 'pagefind-dev-stub',
      configureServer(server) {
        server.middlewares.use('/pagefind/pagefind.js', (_req, res) => {
          res.writeHead(200, { 'Content-Type': 'application/javascript' });
          res.end('export const search=async()=>({results:[]})');
        });
      },
    }],
  },
});
