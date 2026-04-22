import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://dotsdecoded-blog.pages.dev',
  integrations: [react(), mdx()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
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
