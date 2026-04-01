# DotsDecoded Blog

## Tech Stack
- Astro 6.1 + React 19 + MDX, Bun runtime, Vite 7, esbuild 0.24.2 (pinned)
- Static output, deployed to Cloudflare Pages
- Pagefind for search, Prism.js for syntax highlighting (Monokai theme)

## Commands
- `bun run dev` -- local dev server (do NOT run dev commands -- user runs dev themselves)
- `bun run build` -- production build + Pagefind index. Run this to verify changes.

## Blog Posts
1. `ip-addresses-explained.mdx` -- 13 demos
2. `libuv-nodejs-under-the-hood.mdx` -- 13 demos
3. `ssh-keys-auth.mdx` -- 13 demos
4. `sql-vs-nosql.mdx` -- 10 demos
5. `database-internals.mdx` -- 10 demos
6. `how-claude-code-works.mdx` -- 8 demos (581 lines), based on https://github.com/nirholas/claude-code

## Demo Component Rules
- Location: `src/components/demos/DemoName.tsx`
- Default export React component, exported from `src/components/demos/index.ts`
- Wrapped with `<DemoBoundary name="Human Readable Name">` from `./DemoBoundary`
- Self-contained: own `s` theme object, own utility copies, only imports from `react`
- All styles inline, no CSS modules, no Tailwind
- Max width 820, font family: `"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"`
- Use `s.mono` for monospace text
- Rendered in MDX with `<DemoName client:visible />`
- No comments in code, no emoji in UI text
- For timed animations: import SpeedController + `getStepDelay` from `./SpeedController`

## Shared Theme Object `s`
```
bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d'
text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b'
border: '#3e4a5b', border2: '#536279'
accent: '#5b8def', green: '#3dd68c', red: '#e85d5d'
yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a'
mono: "'SF Mono', 'Cascadia Code', Consolas, monospace"
```

## Common Demo Pitfalls
- Never shadow the theme object: `steps.map((s, i) => ...)` shadows `s`. Use `(st, i)` instead
- Defensive array handling: guard with `Array.isArray(x) ? x.filter(Boolean) : []`
- JSX text escaping: `{'{...}'}` not `{...}` (latter is JSX expression)
- Never duplicate keys in style objects (esbuild errors)
- SVG overflow: never use `overflow: 'visible'`. Add viewBox padding instead
- No `scrollIntoView` -- use `container.scrollTop = container.scrollHeight` on the demo's own scrollable container
- SpeedController: for setInterval, recreate via `useEffect` when `speed` changes

## How Claude Code Blog Post -- Source Research
Research was done on a cloned copy of the Claude Code repo at `/tmp/claude-code/`. Key source files:

### Streaming
- `src/services/api/claude.ts` -- `queryModel` async generator, raw SSE stream, content block accumulation, stream watchdog, retry system
- `src/utils/messages.ts` -- `handleMessageFromStream()`, dispatches stream events to React state
- `src/services/tools/StreamingToolExecutor.ts` -- starts executing tools before full response is complete

### MCP
- `src/services/mcp/client.ts` -- `connectToServer`, `fetchToolsForClient`, `callMCPTool`, `processMCPResult`
- `src/services/mcp/config.ts` -- config loading from all scopes (enterprise, claudeai, plugin, user, project, dynamic)
- `src/services/mcp/types.ts` -- Zod schemas for 8 transport types (stdio, sse, http, ws, sse-ide, ws-ide, sdk, claudeai-proxy)
- `src/services/mcp/auth.ts` -- `ClaudeAuthProvider`, OAuth flow, XAA auth, token refresh
- `src/services/mcp/InProcessTransport.ts` -- linked in-process transport pair for Chrome/Computer Use servers
- `src/utils/mcpInstructionsDelta.ts` -- cache-friendly delta-based MCP instruction injection

### Plan Mode
- `src/tools/EnterPlanModeTool/EnterPlanModeTool.ts` -- stashes previous mode, changes to 'plan'
- `src/tools/ExitPlanModeTool/ExitPlanModeV2Tool.ts` -- reads plan file, validates, restores mode
- `src/tools/AgentTool/built-in/planAgent.ts` -- read-only planning agent, omits CLAUDE.md
- `src/utils/plans.ts` -- plan file storage in `~/.claude/plans/`

### CLAUDE.md and Memory
- `src/utils/claudemd.ts` (1480 lines) -- file discovery, loading order, @include, conditional rules
- `src/context.ts` -- `getUserContext()`, injects into system prompt
- `src/memdir/memdir.ts` -- auto-memory, persistent file-based memory system
- `src/tools/AgentTool/agentMemory.ts` -- agent memory scopes (user, project, local)
- `src/tools/AgentTool/agentMemorySnapshot.ts` -- snapshot-based memory bootstrapping

### Codebase Reading
- `src/tools/GlobTool/GlobTool.ts` -- delegates to ripgrep, capped at 100 files
- `src/tools/GrepTool/GrepTool.ts` -- ripgrep regex search, 500 char line cap, 20s timeout
- `src/tools/FileReadTool/FileReadTool.ts` -- line-level offset/limit, dedup by mtime, image/PDF support
- `src/tools/LSPTool/LSPTool.ts` -- 9 operations, deferred, plugin-only, 10MB file limit
- `src/utils/ripgrep.ts` -- vendored binary, 3 resolution modes (system, embedded, builtin)
- `src/utils/bash/` -- tree-sitter for bash security analysis only (NOT source code parsing)

### Build System
- `scripts/build-bundle.ts` -- esbuild single-file output, no code splitting
- `src/shims/bun-bundle.ts` -- feature flag shim (204+ imports across codebase)
- `src/utils/lazySchema.ts` -- memoized Zod schema construction (482+ uses)

## Git State
- Branch: `feat/demo-color-refresh`
- Do NOT push -- Claude Code blog post is local only per user request
- Previous PR #4 on this branch with SpeedController + SVG fix
