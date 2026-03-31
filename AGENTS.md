# DotsDecoded — Agent Guidelines

## Project

Technical blog built with Astro 6 + React + MDX. Static output. Deployed to Cloudflare Pages.

## Commands

- `bun run dev` — local dev server
- `bun run build` — production build + Pagefind index
- Do NOT run dev commands. User runs dev themselves. Only run build when asked to verify.

## Tech Stack

- **Framework**: Astro 6.1, React 19, MDX
- **Runtime**: Bun (not npm/node)
- **Build**: Vite 7, esbuild 0.24.2 (pinned — 0.27+ crashes on Node v24)
- **Syntax highlighting**: prismjs 1.30 (Monokai theme, hand-rolled CSS, bundled in BaseLayout)
- **Search**: Pagefind (full-text, builds at `astro build` time)
- **No WebGPU, no ASCII banners, no emoji in UI, no comments in code**

## File Structure

```
src/
  content.config.ts          # Astro v6 content collection schema (Zod)
  content/blog/*.mdx         # Blog posts
  layouts/
    BaseLayout.astro         # HTML shell, theme toggle, TOC scroll, copy-btn, Prism
    BlogPostLayout.astro     # TOC sidebar + content area
  components/demos/
    index.ts                 # Barrel export for all demo components
    *.tsx                    # Small, focused interactive demo components
  pages/
    index.astro              # Home: blog list + search
    blog/[...slug].astro     # Dynamic blog post page
    404.astro
  styles/global.css          # All styles (theme vars, layout, prose, Prism tokens)
```

## Content Collection Schema

Defined in `src/content.config.ts` (NOT `src/content/config.ts`). Uses Astro v6 glob loader.

Frontmatter fields:
- `title` (string, required)
- `description` (string, required)
- `date` (coerced to Date, required)
- `tags` (string array, default [])
- `draft` (boolean, default false) — draft posts are excluded from build
- `image` (string, optional) — path to custom OG image in `public/`, defaults to `/og-default.svg`

## Blog Post Rules

1. File naming: `kebab-case.mdx` in `src/content/blog/`
2. Frontmatter must follow the schema above
3. Use `##` (h2) and `###` (h3) headings for TOC — h1 is the page title
4. Code blocks use standard markdown fenced blocks with language tags (`js`, `bash`, `c`, `python`, `json`, `typescript`, `cpp`)
5. Prism auto-highlights all `<code>` blocks. Supported languages are imported in BaseLayout.astro — add new ones there if needed
6. Inline code uses single backticks. Code blocks use triple backticks with language tag
7. Keep paragraphs concise. Technical depth over verbosity
8. Assume zero knowledge — explain concepts with analogies before diving into technical details
9. Each major section should have an interactive demo placed inline immediately after the relevant heading

## Demo Architecture

Each blog post uses **multiple small, focused demo components** placed inline throughout the post — one per concept or section. This is NOT a single monolithic demo at the bottom.

### Why Small Inline Demos

- Each demo lives right next to the text it illustrates — the reader learns and immediately interacts
- Small components are easier to create, review, and debug
- Sub-agents can work on individual demos in parallel without conflicts
- Each demo is self-contained — no shared state or cross-demo dependencies

### Inline Demo Placement

Import all demos at the top of the MDX file and place them with `client:visible` right after the relevant heading:

```mdx
import IpOctetsDemo from '../../components/demos/IpOctetsDemo'
import CidrSubnetDemo from '../../components/demos/CidrSubnetDemo'

## IPv4 Structure

Explanation text here...

<IpOctetsDemo client:visible />

## Subnetting

More explanation...

<CidrSubnetDemo client:visible />
```

### Naming Convention

Format: `TopicActionDemo.tsx` where Topic matches the blog post subject and Action describes what the demo does.

Examples:
- `IpOctetsDemo.tsx` — click octets to see binary
- `CidrSubnetDemo.tsx` — drag slider to explore subnets
- `DnsResolutionDemo.tsx` — step through DNS lookup
- `NatSimulationDemo.tsx` — watch packet travel through NAT
- `PortExplorerDemo.tsx` — explore ports per connection type
- `JourneyDemo.tsx` — animate the full request journey
- `AttackDemo.tsx` — interact with different attack types
- `TraceDemo.tsx` — trace an IP through the evidence chain

## Demo Component Rules

1. Location: `src/components/demos/DemoName.tsx`
2. Must be a default export React component
3. Must be exported from `src/components/demos/index.ts` barrel file
4. Self-contained — all styles are inline (no CSS modules, no Tailwind classes)
5. Each demo has its own copy of the shared theme object `s` and any utility functions it needs (no shared imports between demos)
6. Use the shared theme object `s` at the top of the file for consistent colors:

```ts
const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}
```

7. Only import from `react` — no external libraries
8. Max width container: `maxWidth: 820` on root div
9. Font family on root: `fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"`
10. Use `s.mono` for any monospace text
11. Interactive elements should have clear visual feedback (hover states, active states, transitions)
12. Use `useState` for UI state, `useEffect` for animations
13. No comments in code
14. No emoji in UI text
15. Rendered in MDX with `<DemoName client:visible />`
16. Every demo must be wrapped with `<DemoBoundary name="Human Readable Name">` — import from `./DemoBoundary`. This catches render errors and shows a styled error UI with a retry button instead of crashing the page
17. Add `import DemoBoundary from './DemoBoundary'` after the react import

### Common Demo Pitfalls

- **Never shadow the theme object**: `steps.map((s, i) => ...)` shadows the module-level `s`. Use `(st, i)` or any other name instead
- **Defensive array handling**: If a component receives an array prop that might contain undefined elements (e.g., from state updates), guard with `Array.isArray(lines) ? lines.filter(Boolean) : []`
- **JSX text escaping**: Curly braces inside JSX text content must be escaped: `{'{...}'}` not `{...}` (the latter is interpreted as a JSX expression)
- **Object keys**: Never use duplicate keys in style objects — esbuild will error on `Duplicate key "fontSize"`
- **SVG overflow**: Never use `overflow: 'visible'` on SVG elements. Root nodes render at y=0, causing content to bleed above the viewBox. Always add padding to the viewBox (e.g., `viewBox={-40 -30 ${w + 80} ${h + 40}}`) and ensure the outer container has `overflow: 'hidden'`

## Creating a New Blog Post (Sub-Agent Guide)

When asked to create a new blog post, follow this workflow:

### Step 1: Plan the post structure

1. Choose a topic and outline 8-15 sections (h2 and h3 headings)
2. Identify which sections would benefit from interactive demos (typically 6-10 per post)
3. List the demo names and what each should do

### Step 2: Write the blog post MDX

1. Create `src/content/blog/topic-slug.mdx` with proper frontmatter
2. Import all demo components at the top
3. Write each section with explanation first, then place the demo inline after it
4. Use analogies and real-world examples before technical details
5. Include code blocks with proper language tags for Prism highlighting

### Blog Post Structure Template

Each post should follow a layered progression from zero knowledge to mastery:

1. **Foundation Layer (first ~40%)** — Assume NO prior knowledge. Use real-world analogies exclusively to build intuition. Never use jargon without 3+ examples explaining it.
2. **Concept Layer (next ~30%)** — Introduce formal terms only after analogies are mastered. Show step-by-step: "If you understand [analogy], [technical term] works like..." Include diagrams and manual walkthroughs.
3. **Implementation Layer (next ~20%)** — Provide code examples. Show code building a concrete case. Explain each parameter simply. Include "what if..." scenarios for common mistakes.
4. **Mastery Layer (final ~10%)** — Performance analysis. Real-world applications. Advanced variations. Self-check questions.

**Style**: Write like a patient mentor. Use "we" language. End each section with confidence. Include comparison tables and self-check checklists.

### Step 3: Create demo components

1. Create each demo as a separate file in `src/components/demos/`
2. Each demo is fully self-contained with its own `s` object and utilities
3. Keep each demo focused on ONE concept — if it does too much, split it
4. Add to barrel file `src/components/demos/index.ts`

### Step 4: Verify

1. Run `bun run build` to check for errors
2. Do NOT run dev commands

## Astro v6 Gotchas

- Content config is `src/content.config.ts` (NOT `src/content/config.ts`)
- Use `loader: glob(...)` in defineCollection
- Render posts with `import { render } from 'astro:content'` then `const { Content } = await render(post)` — `post.render()` does NOT exist
- Headings auto-generated by Astro: `## My Heading` becomes `<h2 id="my-heading">`
- Non-inline `<script>` tags get hoisted/bundled by Astro (run after DOM ready — fine for Prism)
- `is:inline` scripts in `<head>` survive Cloudflare adapter. Scripts in `<body>` of layouts get stripped

## Deployment

- **Platform**: Cloudflare Pages (dashboard Git integration)
- **Output**: Static (`output: 'static'` in astro.config.mjs)
- **Build command**: `bun run build` (runs `astro build && bun x pagefind --site dist`)
- **Build output directory**: `dist` (set in Cloudflare dashboard)
- **Node version**: 22 (set via `NODE_VERSION` env var in dashboard)
- **No GitHub Actions** — deployment is handled entirely by the dashboard Git integration on push to `main`
- The Cloudflare adapter is NOT used — it crashes on Node v22+ due to miniflare EPIPE

## Adding a New Prism Language

1. Install if needed (most are bundled with prismjs)
2. Add `import 'prismjs/components/prism-LANG'` in BaseLayout.astro's Prism `<script>` block
3. Use the language tag in fenced code blocks: ````LANG`

## Open Graph Meta Tags

Every page automatically gets OG and Twitter Card meta tags via `BaseLayout.astro`:

- `og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `og:site_name`, `og:locale`
- `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image`
- `<link rel="canonical">` for SEO

Blog posts additionally get `article:published_time` and `article:tag` meta tags.

The `site` URL is configured in `astro.config.mjs` (currently `https://dotsdecoded-blog.pages.dev`).

Default OG image is `public/og-default.svg`. Posts can override with a custom image via the `image` frontmatter field.

## Copy Button

Auto-injected on all `.prose pre` blocks via `is:inline` script in BaseLayout `<head>`. No manual work needed — any new code block gets a copy button automatically.

## Theme Colors (CSS custom properties)

Defined in `src/styles/global.css` under `:root` and `[data-theme="light"]`:
- `--bg`, `--bg2`, `--bg3` — background layers
- `--text`, `--text2`, `--text3` — text hierarchy
- `--border`, `--border2` — borders
- `--accent`, `--accent-dim` — primary accent (blue)
- `--green`, `--red` — semantic colors
- `--mono` — monospace font stack

## Dead Code to Clean Up

- `lil-gui` in devDependencies (no longer used)
- `.home-right` CSS rules in global.css (home is single-column now)
- `@astrojs/cloudflare` in dependencies (adapter removed, static output used instead)
