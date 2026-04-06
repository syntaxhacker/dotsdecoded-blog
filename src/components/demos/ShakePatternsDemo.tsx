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

type Pattern = {
  name: string
  shakeable: boolean
  code: string
  import: string | null
  result: string
  explanation: string
}

const patterns: Pattern[] = [
  {
    name: 'Named Exports',
    shakeable: true,
    code: 'export function add(a, b) { return a + b }\nexport function multiply(a, b) { return a * b }',
    import: "import { add } from './math'",
    result: 'Only `add` is bundled',
    explanation:
      "Named exports give the bundler precise information about what each export is. It can safely remove `multiply` because nothing imports it.",
  },
  {
    name: 'Default Export Object',
    shakeable: false,
    code: 'export default {\n  add: (a, b) => a + b,\n  multiply: (a, b) => a * b,\n}',
    import: "import math from './math'\nmath.add(1, 2)",
    result: 'Entire default export is bundled',
    explanation:
      "Default exports are a single opaque value. The bundler can't know which properties of the object are used without running the code. It must include everything.",
  },
  {
    name: 'Re-exports',
    shakeable: true,
    code: "// utils/index.js\nexport { formatDate } from './format'\nexport { validateEmail } from './validate'",
    import: "import { formatDate } from './utils'",
    result: 'Only `formatDate` and its dependencies are bundled',
    explanation:
      "Modern bundlers (Rollup 2+, Vite) can trace through re-exports. They follow the chain and only include what's actually used at the leaf level.",
  },
  {
    name: 'Class with Methods',
    shakeable: false,
    code: 'export class Validator {\n  validateEmail() { /* ... */ }\n  validatePhone() { /* ... */ }\n  validateURL() { /* ... */ }\n}',
    import: "import { Validator } from './validator'\nnew Validator().validateEmail()",
    result: 'Entire class with all methods is bundled',
    explanation:
      'Classes are bundled as a whole unit. The bundler can\'t separate individual methods. Prefer standalone functions when tree shaking matters.',
  },
  {
    name: 'Dynamic Import',
    shakeable: true,
    code: "const module = await import('./heavy-lib')\nmodule.doSomething()",
    import: null,
    result: '`heavy-lib` is split into a separate chunk',
    explanation:
      "Dynamic imports create a code-splitting point. The module is loaded on demand, not included in the initial bundle. This is even better than tree shaking \u2014 the code isn't loaded at all until needed.",
  },
  {
    name: 'Conditional Export',
    shakeable: false,
    code: "const isProd = process.env.NODE_ENV === 'production'\nexport const logger = isProd\n  ? { log: () => {}, warn: () => {} }\n  : { log: console.log, warn: console.warn }",
    import: "import { logger } from './logger'",
    result: 'Both branches are bundled',
    explanation:
      "The bundler can't evaluate runtime conditions. Both the production and development branches are included. Use bundler-specific features like `define` or `process.env.NODE_ENV` replacement instead.",
  },
]

function highlight(code: string): string {
  const lines = code.split('\n')
  return lines.map((rawLine, i) => {
    const num = String(i + 1).padStart(2, ' ')
    const parts: { text: string; color: string }[] = []
    let remaining = rawLine
    let inComment = false

    while (remaining.length > 0) {
      if (inComment) {
        parts.push({ text: remaining, color: '#75715e' })
        remaining = ''
        continue
      }

      const commentMatch = remaining.match(/^(\/\/.*)$/)
      if (commentMatch) {
        parts.push({ text: commentMatch[1], color: '#75715e' })
        remaining = ''
        continue
      }

      const strMatch = remaining.match(/^('[^']*'|"[^"]*")/)
      if (strMatch) {
        parts.push({ text: strMatch[1], color: '#e6db74' })
        remaining = remaining.slice(strMatch[1].length)
        continue
      }

      const kwMatch = remaining.match(/^(export|import|from|default|const|await|new|class|return|process)\b/)
      if (kwMatch) {
        parts.push({ text: kwMatch[1], color: '#f92672' })
        remaining = remaining.slice(kwMatch[1].length)
        continue
      }

      const fnMatch = remaining.match(/^(function|validateEmail|validatePhone|validateURL|formatDate|log|warn|doSomething|add|multiply)\b/)
      if (fnMatch) {
        parts.push({ text: fnMatch[1], color: '#a6e22e' })
        remaining = remaining.slice(fnMatch[1].length)
        continue
      }

      parts.push({ text: remaining[0], color: s.text })
      remaining = remaining.slice(1)
    }

    const codeText = parts.map(p =>
      `<span style="color:${p.color}">${escHtml(p.text)}</span>`
    ).join('')

    return `<span style="color:${s.text3};user-select:none">${num}</span>  ${codeText}`
  }).join('\n')
}

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default function ShakePatternsDemo() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const highlighted = useMemo(() => patterns.map((p) => highlight(p.code)), [])

  return (
    <DemoBoundary name="Tree Shaking Patterns">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {patterns.map((p, i) => {
            const isOpen = openIdx === i
            return (
              <div
                key={i}
                style={{
                  borderRadius: 8,
                  border: `1px solid ${isOpen ? (p.shakeable ? s.green : s.red) : s.border}`,
                  background: isOpen ? s.bg2 : s.bg,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '14px 18px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: s.text,
                    fontFamily: 'inherit',
                    fontSize: 15,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                      color: p.shakeable ? s.bg : '#fff',
                      background: p.shakeable ? s.green : s.red,
                      flexShrink: 0,
                    }}
                  >
                    {p.shakeable ? 'SHAKEABLE' : 'NOT SHAKEABLE'}
                  </span>
                  <span style={{ fontWeight: 500, flex: 1 }}>{p.name}</span>
                  <span
                    style={{
                      color: s.text3,
                      fontSize: 12,
                      transition: 'transform 0.2s',
                      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      display: 'inline-block',
                    }}
                  >
                    {'\u25B6'}
                  </span>
                </button>
                <div
                  style={{
                    maxHeight: isOpen ? 1200 : 0,
                    opacity: isOpen ? 1 : 0,
                    transition: 'max-height 0.35s ease, opacity 0.25s ease',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div
                      style={{
                        background: s.bg,
                        borderRadius: 6,
                        border: `1px solid ${s.border}`,
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ padding: '6px 12px 2px', fontSize: 11, color: s.text3, fontWeight: 600, letterSpacing: '0.5px' }}>
                        CODE
                      </div>
                      <div
                        style={{
                          whiteSpace: 'pre' as const,
                          padding: '4px 12px 12px',
                          fontFamily: s.mono,
                          fontSize: 13,
                          lineHeight: 1.6,
                        }}
                        dangerouslySetInnerHTML={{ __html: highlighted[i] }}
                      />
                    </div>
                    {p.import && (
                      <div
                        style={{
                          background: s.bg,
                          borderRadius: 6,
                          border: `1px solid ${s.border}`,
                          padding: '10px 14px',
                          fontFamily: s.mono,
                          fontSize: 13,
                          lineHeight: 1.6,
                          color: s.accent,
                        }}
                      >
                        <span style={{ color: s.text3, fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: 6, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                          IMPORT
                        </span>
                        {p.import}
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 14px',
                        borderRadius: 6,
                        background: p.shakeable
                          ? 'rgba(61,214,140,0.08)'
                          : 'rgba(232,93,93,0.08)',
                        border: `1px solid ${p.shakeable ? 'rgba(61,214,140,0.2)' : 'rgba(232,93,93,0.2)'}`,
                        fontSize: 13,
                        color: p.shakeable ? s.green : s.red,
                        fontWeight: 500,
                      }}
                    >
                      <span style={{ fontSize: 15 }}>{'\u2192'}</span>
                      {p.result}
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: s.text2 }}>
                      {p.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DemoBoundary>
  )
}
