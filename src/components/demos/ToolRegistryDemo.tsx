import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type ToolAccess = 'read-only' | 'write'
type ToolConcurrency = 'concurrency-safe' | 'serial'

interface Tool {
  name: string
  category: string
  categoryColor: string
  access: ToolAccess
  concurrency: ToolConcurrency
  description: string
  schema: string
  descriptionMethod: string
  permissionCheck: string
}

const tools: Tool[] = [
  {
    name: 'FileRead',
    category: 'File I/O',
    categoryColor: s.accent,
    access: 'read-only',
    concurrency: 'concurrency-safe',
    description: 'Read file contents at a given path with optional offset/limit',
    schema: '{\n  "path": "string (required)",\n  "offset": "number",\n  "limit": "number"\n}',
    descriptionMethod: 'Use when you need to examine file contents, understand code structure, or review configuration. Prefer for single file reads.',
    permissionCheck: 'Result: ALLOW\n  Path: "/src/index.ts" is within workspace\n  No restricted directories matched',
  },
  {
    name: 'FileWrite',
    category: 'File I/O',
    categoryColor: s.accent,
    access: 'write',
    concurrency: 'serial',
    description: 'Write content to a file, creating it if it does not exist',
    schema: '{\n  "path": "string (required)",\n  "content": "string (required)"\n}',
    descriptionMethod: 'Use when creating new files or completely replacing file contents. For partial edits, prefer FileEdit.',
    permissionCheck: 'Result: ALLOW\n  Path: "/src/utils.ts" is within workspace\n  User has not denied write access to this path',
  },
  {
    name: 'FileEdit',
    category: 'File I/O',
    categoryColor: s.accent,
    access: 'write',
    concurrency: 'serial',
    description: 'Apply a targeted search-and-replace edit to a specific region of a file',
    schema: '{\n  "path": "string (required)",\n  "old_string": "string (required)",\n  "new_string": "string (required)"\n}',
    descriptionMethod: 'Use when modifying existing code. Requires exact match on old_string. Prefer over FileWrite for surgical edits to avoid clobbering unrelated changes.',
    permissionCheck: 'Result: ALLOW\n  Path: "/src/app.tsx" is within workspace\n  old_string found at line 42\n  No permission denial on record',
  },
  {
    name: 'Glob',
    category: 'File I/O',
    categoryColor: s.accent,
    access: 'read-only',
    concurrency: 'concurrency-safe',
    description: 'Find files matching a glob pattern like "**/*.ts" or "src/**/*.test.*"',
    schema: '{\n  "pattern": "string (required)",\n  "path": "string (optional)"\n}',
    descriptionMethod: 'Use when you need to discover files by name pattern. Returns sorted paths. Prefer over directory listing when you know the filename pattern.',
    permissionCheck: 'Result: ALLOW\n  Pattern does not contain path traversal\n  Search root is within workspace',
  },
  {
    name: 'Grep',
    category: 'File I/O',
    categoryColor: s.accent,
    access: 'read-only',
    concurrency: 'concurrency-safe',
    description: 'Search file contents using regex patterns across the project',
    schema: '{\n  "pattern": "string (required)",\n  "path": "string (optional)",\n  "include": "string[]"\n}',
    descriptionMethod: 'Use when you need to find where something is defined, used, or referenced. Supports full regex. Faster than reading files one by one.',
    permissionCheck: 'Result: ALLOW\n  Regex pattern validated (no ReDoS risk)\n  Search scope restricted to workspace',
  },
  {
    name: 'Bash',
    category: 'Execution',
    categoryColor: s.orange,
    access: 'write',
    concurrency: 'serial',
    description: 'Run a shell command in the project directory and capture output',
    schema: '{\n  "command": "string (required)",\n  "timeout": "number (ms, default 120000)"\n}',
    descriptionMethod: 'Use for git operations, package managers, build commands, and CLI tools. Do NOT use for file I/O (use FileRead/FileWrite instead). Always explain what a command does before running it.',
    permissionCheck: 'Result: PROMPT_USER\n  Command contains "rm" -- requires confirmation\n  User previously approved "npm run build"',
  },
  {
    name: 'PowerShell',
    category: 'Execution',
    categoryColor: s.orange,
    access: 'write',
    concurrency: 'serial',
    description: 'Execute PowerShell commands on Windows environments',
    schema: '{\n  "command": "string (required)",\n  "timeout": "number (ms, default 120000)"\n}',
    descriptionMethod: 'Use when Bash is unavailable (Windows) or when PowerShell-specific cmdlets are needed. Same safety rules as Bash apply.',
    permissionCheck: 'Result: ALLOW\n  Platform: win32\n  Command matched allowed pattern "Get-*"',
  },
  {
    name: 'WebFetch',
    category: 'Web',
    categoryColor: s.purple,
    access: 'read-only',
    concurrency: 'concurrency-safe',
    description: 'Fetch and parse content from a URL into text or markdown',
    schema: '{\n  "url": "string (required)",\n  "format": "\u0022text\u0022 | \u0022markdown\u0022 (default \u0022markdown\u0022)"\n}',
    descriptionMethod: 'Use when you need to read documentation, API specs, or web pages. Do NOT use for making API calls with side effects. Content is summarized if very large.',
    permissionCheck: 'Result: ALLOW\n  URL scheme: https\n  Domain not on blocklist\n  No credentials in URL',
  },
  {
    name: 'WebSearch',
    category: 'Web',
    categoryColor: s.purple,
    access: 'read-only',
    concurrency: 'concurrency-safe',
    description: 'Perform a web search and return summarized results',
    schema: '{\n  "query": "string (required)",\n  "count": "number (default 8)"\n}',
    descriptionMethod: 'Use when the user asks about current events, external libraries, or topics not covered by your training data. Returns summarized snippets with source URLs.',
    permissionCheck: 'Result: ALLOW\n  Query does not contain PII patterns\n  Search quota not exceeded',
  },
  {
    name: 'Agent',
    category: 'Agent',
    categoryColor: s.green,
    access: 'write',
    concurrency: 'concurrency-safe',
    description: 'Spawn a sub-agent to handle an independent subtask in parallel',
    schema: '{\n  "task": "string (required)",\n  "tools": "string[] (optional)"\n}',
    descriptionMethod: 'Use when a complex task can be decomposed into independent subtasks. Each agent gets its own context window. Good for parallel file operations or research.',
    permissionCheck: 'Result: ALLOW\n  Sub-agent depth: 1 (max allowed: 3)\n  Requested tools subset is permitted',
  },
  {
    name: 'SendMessage',
    category: 'Agent',
    categoryColor: s.green,
    access: 'write',
    concurrency: 'serial',
    description: 'Send a message to another agent instance or return a final result',
    schema: '{\n  "recipient": "string (required)",\n  "content": "string (required)"\n}',
    descriptionMethod: 'Use to communicate results between sub-agents or to deliver a completed task answer back to the parent agent.',
    permissionCheck: 'Result: ALLOW\n  Recipient is a known agent ID\n  Message size: 2.3KB (under 100KB limit)',
  },
  {
    name: 'AskUserQuestion',
    category: 'Utility',
    categoryColor: s.yellow,
    access: 'read-only',
    concurrency: 'serial',
    description: 'Pause execution and ask the user a clarifying question',
    schema: '{\n  "question": "string (required)",\n  "options": "string[] (optional)"\n}',
    descriptionMethod: 'Use when you are genuinely uncertain about the user\'s intent and cannot reasonably infer it from context. Do NOT overuse -- prefer making reasonable assumptions.',
    permissionCheck: 'Result: ALLOW\n  No rate limit exceeded\n  This is the first question in this turn',
  },
  {
    name: 'Config',
    category: 'Utility',
    categoryColor: s.yellow,
    access: 'read-only',
    concurrency: 'concurrency-safe',
    description: 'Read or update workspace configuration values',
    schema: '{\n  "key": "string (required)",\n  "value": "string | object (optional)"\n}',
    descriptionMethod: 'Use to read settings like lint commands, preferred test runner, or project-specific conventions. Write to persist preferences for the session.',
    permissionCheck: 'Result: ALLOW\n  Key "lintCommand" is a recognized config key\n  Write access to config is permitted',
  },
  {
    name: 'TodoWrite',
    category: 'Utility',
    categoryColor: s.yellow,
    access: 'write',
    concurrency: 'serial',
    description: 'Maintain a task checklist to track progress on multi-step work',
    schema: '{\n  "todos": "{ id: string, content: string, status: "pending" | "done" }[]"\n}',
    descriptionMethod: 'Use when working on multi-step tasks (3+ steps) to maintain a visible checklist. Helps the user track progress and lets you resume context after interruptions.',
    permissionCheck: 'Result: ALLOW\n  Todo count: 6 (under 50 limit)\n  All IDs are unique',
  },
]

type FilterMode = 'all' | 'read-only' | 'write' | 'category'

export default function ToolRegistryDemo() {
  const [filter, setFilter] = useState<FilterMode>('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = tools
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      )
    }
    if (filter === 'read-only') list = list.filter((t) => t.access === 'read-only')
    if (filter === 'write') list = list.filter((t) => t.access === 'write')
    return list
  }, [filter, search])

  const categories = useMemo(() => {
    const map = new Map<string, { color: string; items: Tool[] }>()
    for (const t of filtered) {
      if (!map.has(t.category)) map.set(t.category, { color: t.categoryColor, items: [] })
      map.get(t.category)!.items.push(t)
    }
    return map
  }, [filtered])

  const readOnlyCount = tools.filter((t) => t.access === 'read-only').length
  const writeCount = tools.filter((t) => t.access === 'write').length

  const accessColor = (a: ToolAccess) => (a === 'read-only' ? s.green : s.red)
  const concurrencyColor = (c: ToolConcurrency) => (c === 'concurrency-safe' ? s.accent : s.yellow)

  const filterBtn = (label: string, mode: FilterMode) => {
    const active = filter === mode
    return (
      <button
        key={mode}
        onClick={() => setFilter(mode)}
        style={{
          padding: '5px 14px',
          borderRadius: 6,
          border: `1px solid ${active ? s.accent : s.border}`,
          background: active ? `${s.accent}18` : s.bg,
          color: active ? s.accent : s.text2,
          fontFamily: s.mono,
          fontSize: 12,
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </button>
    )
  }

  const renderCard = (tool: Tool) => {
    const isExpanded = expanded === tool.name
    return (
      <div
        key={tool.name}
        onClick={() => setExpanded(isExpanded ? null : tool.name)}
        style={{
          background: s.bg2,
          border: `1px solid ${isExpanded ? tool.categoryColor : s.border}`,
          borderRadius: 8,
          padding: 14,
          cursor: 'pointer',
          transition: 'all 0.15s',
          flex: '1 1 240px',
          minWidth: 220,
          maxWidth: 400,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: s.mono, fontSize: 14, fontWeight: 600, color: s.text }}>
            {tool.name}
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: s.mono,
              color: tool.categoryColor,
              background: `${tool.categoryColor}18`,
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            {tool.category}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontFamily: s.mono,
              color: accessColor(tool.access),
              background: `${accessColor(tool.access)}14`,
              padding: '2px 7px',
              borderRadius: 4,
            }}
          >
            {tool.access}
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: s.mono,
              color: concurrencyColor(tool.concurrency),
              background: `${concurrencyColor(tool.concurrency)}14`,
              padding: '2px 7px',
              borderRadius: 4,
            }}
          >
            {tool.concurrency}
          </span>
        </div>
        <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.4 }}>{tool.description}</div>

        {isExpanded && (
          <div style={{ marginTop: 14, borderTop: `1px solid ${s.border}`, paddingTop: 12 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Input Schema
              </div>
              <pre
                style={{
                  fontFamily: s.mono,
                  fontSize: 11,
                  color: s.text2,
                  background: s.bg,
                  padding: 10,
                  borderRadius: 6,
                  border: `1px solid ${s.border}`,
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {tool.schema}
              </pre>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Claude sees (description method)
              </div>
              <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.5, background: s.bg, padding: 10, borderRadius: 6, border: `1px solid ${s.border}` }}>
                {tool.descriptionMethod}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Permission Check
              </div>
              <pre
                style={{
                  fontFamily: s.mono,
                  fontSize: 11,
                  color: s.green,
                  background: s.bg,
                  padding: 10,
                  borderRadius: 6,
                  border: `1px solid ${s.border}`,
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {tool.permissionCheck}
              </pre>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <DemoBoundary name="Tool Registry">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: s.text, marginBottom: 14 }}>
            Claude Code Tool Registry
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}>
            <input
              type="text"
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: '1 1 180px',
                minWidth: 160,
                padding: '6px 12px',
                borderRadius: 6,
                border: `1px solid ${s.border}`,
                background: s.bg2,
                color: s.text,
                fontFamily: s.mono,
                fontSize: 12,
                outline: 'none',
              }}
            />
            {filterBtn('All', 'all')}
            {filterBtn('Read-Only', 'read-only')}
            {filterBtn('Write', 'write')}
            {filterBtn('By Category', 'category')}
          </div>

          <div style={{
            display: 'flex',
            gap: 16,
            marginBottom: 16,
            fontFamily: s.mono,
            fontSize: 11,
            color: s.text3,
          }}>
            <span>{tools.length} tools</span>
            <span style={{ color: s.green }}>{readOnlyCount} read-only</span>
            <span style={{ color: s.red }}>{writeCount} write</span>
          </div>

          {filter === 'category'
            ? Array.from(categories.entries()).map(([cat, { color, items }]) => (
                <div key={cat} style={{ marginBottom: 20 }}>
                  <div
                    onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: color, fontFamily: s.mono }}>
                      {cat}
                    </span>
                    <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>
                      ({items.length})
                    </span>
                    <span style={{ fontSize: 11, color: s.text3 }}>{expandedCategory === cat ? '[-]' : '[+]'}</span>
                  </div>
                  {expandedCategory !== cat ? null : (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {items.map(renderCard)}
                    </div>
                  )}
                </div>
              ))
            : (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {filtered.map(renderCard)}
              </div>
            )}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: s.text3, fontSize: 13, padding: 20 }}>
              No tools match your filter.
            </div>
          )}
        </div>
      </div>
    </DemoBoundary>
  )
}
