import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type EffectKind = 'capture' | 'render' | 'mutate' | 'create' | 'call'

interface Effect {
  kind: EffectKind
  label: string
  source: string
  target: string
  description: string
  memoNote: string
}

interface LineInfo {
  code: string
  indent: number
  effects: Effect[]
}

const lines: LineInfo[] = [
  {
    code: 'function TodoList({ todos }) {',
    indent: 0,
    effects: [],
  },
  {
    code: 'const count = todos.length',
    indent: 1,
    effects: [
      {
        kind: 'capture',
        label: 'LoadProperty(todos, \'length\')',
        source: 'todos',
        target: 'count',
        description: 'Reads the .length property from the todos prop. The compiler records that count depends on todos.',
        memoNote: 'If todos changes, count must be recomputed. The compiler auto-memoizes this binding.',
      },
    ],
  },
  {
    code: 'const filtered = todos.filter(t => t.done)',
    indent: 1,
    effects: [
      {
        kind: 'call',
        label: 'Call(todos.filter, [todos])',
        source: 'todos',
        target: 'filtered',
        description: 'Calls .filter() on the todos array. The compiler tracks the call receiver (todos) as an input.',
        memoNote: 'filtered is derived from todos. If todos reference is stable, this call is skipped.',
      },
      {
        kind: 'create',
        label: 'FunctionExpression',
        source: '',
        target: 'callback',
        description: 'The arrow function t => t.done is a new closure created each render. The compiler sees this as a pure function with no external captures.',
        memoNote: 'Pure closures with no captures can be hoisted or memoized by the compiler.',
      },
    ],
  },
  {
    code: 'const summary = `Done: ${filtered.length} / ${count}`',
    indent: 1,
    effects: [
      {
        kind: 'capture',
        label: 'TemplateLiteral',
        source: 'filtered, count',
        target: 'summary',
        description: 'A template literal that reads filtered.length and count. Both are captured as dependencies of summary.',
        memoNote: 'summary is recomputed only when filtered or count changes. The compiler chains dependencies transitively.',
      },
    ],
  },
  {
    code: 'return <div>{summary}</div>',
    indent: 1,
    effects: [
      {
        kind: 'render',
        label: 'JSX Element',
        source: 'summary',
        target: 'output',
        description: 'summary is consumed by JSX and reaches the render output. This marks it as "render-relevant".',
        memoNote: 'The compiler knows the return value depends on summary. If summary is unchanged, the component render can bail out.',
      },
    ],
  },
  {
    code: '}',
    indent: 0,
    effects: [],
  },
]

const effectColors: Record<EffectKind, string> = {
  capture: s.accent,
  render: s.green,
  mutate: s.red,
  create: s.text3,
  call: s.purple,
}

const effectLabels: Record<EffectKind, string> = {
  capture: 'Capture',
  render: 'Render',
  mutate: 'Mutate',
  create: 'Create',
  call: 'Call',
}

const effectDescs: Record<EffectKind, string> = {
  capture: 'Value flows into this variable',
  render: 'Value reaches JSX output',
  mutate: 'Value is mutated in place',
  create: 'New value created (pure)',
  call: 'Function/method invoked',
}

function Dot({ kind }: { kind: EffectKind }) {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: effectColors[kind],
        flexShrink: 0,
        boxShadow: `0 0 6px ${effectColors[kind]}40`,
      }}
    />
  )
}

export default function AliasEffectDemo() {
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)

  return (
    <DemoBoundary name="Alias Effect Explorer">
      <div
        style={{
          maxWidth: 820,
          margin: '0 auto',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            padding: '10px 14px',
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
          }}
        >
          {(Object.keys(effectColors) as EffectKind[]).map((kind) => (
            <div key={kind} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Dot kind={kind} />
              <span style={{ color: s.text2, fontSize: 11, fontFamily: s.mono }}>
                {effectLabels[kind]}
              </span>
              <span style={{ color: s.text3, fontSize: 10 }}>
                -- {effectDescs[kind]}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            background: '#0d1017',
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {lines.map((line, i) => {
            const isActive = selectedLine === i
            const isHovered = hoveredLine === i
            const hasEffects = line.effects.length > 0

            return (
              <div
                key={i}
                onClick={() => setSelectedLine(isActive ? null : i)}
                onMouseEnter={() => setHoveredLine(i)}
                onMouseLeave={() => setHoveredLine(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 14px 6px 0',
                  cursor: hasEffects ? 'pointer' : 'default',
                  background: isActive
                    ? 'rgba(91, 141, 239, 0.07)'
                    : isHovered && hasEffects
                      ? 'rgba(91, 141, 239, 0.03)'
                      : undefined,
                  borderLeft: isActive ? `3px solid ${s.accent}` : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div
                  style={{
                    width: 40,
                    textAlign: 'right',
                    paddingRight: 12,
                    color: s.text3,
                    fontSize: 11,
                    fontFamily: s.mono,
                    userSelect: 'none',
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    flex: 1,
                    fontFamily: s.mono,
                    fontSize: 13,
                    lineHeight: '20px',
                    color: isActive || isHovered ? s.text : s.text2,
                    paddingLeft: line.indent * 16,
                    whiteSpace: 'pre',
                  }}
                >
                  {highlightSyntax(line.code)}
                </div>
                <div style={{ display: 'flex', gap: 5, paddingLeft: 12, flexShrink: 0 }}>
                  {line.effects.map((eff, ei) => (
                    <Dot key={ei} kind={eff.kind} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {selectedLine !== null && lines[selectedLine].effects.length > 0 && (
          <div
            style={{
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>Line {selectedLine + 1}</span>
              <span
                style={{
                  color: s.text2,
                  fontSize: 12,
                  fontFamily: s.mono,
                  background: s.bg3,
                  padding: '3px 8px',
                  borderRadius: 4,
                }}
              >
                {lines[selectedLine].code.trim()}
              </span>
            </div>

            {lines[selectedLine].effects.map((eff, ei) => (
              <div
                key={ei}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  padding: '10px 12px',
                  background: `${effectColors[eff.kind]}08`,
                  borderRadius: 6,
                  border: `1px solid ${effectColors[eff.kind]}20`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Dot kind={eff.kind} />
                  <span
                    style={{
                      color: effectColors[eff.kind],
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: s.mono,
                    }}
                  >
                    {effectLabels[eff.kind]}: {eff.label}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>SOURCE</span>
                    <span
                      style={{
                        color: eff.source ? s.accent : s.text3,
                        fontSize: 11,
                        fontFamily: s.mono,
                        background: s.bg3,
                        padding: '2px 6px',
                        borderRadius: 3,
                      }}
                    >
                      {eff.source || 'none (pure)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: s.text3, fontSize: 10 }}>
                    &rarr;
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>TARGET</span>
                    <span
                      style={{
                        color: s.green,
                        fontSize: 11,
                        fontFamily: s.mono,
                        background: s.bg3,
                        padding: '2px 6px',
                        borderRadius: 3,
                      }}
                    >
                      {eff.target}
                    </span>
                  </div>
                </div>

                <div style={{ color: s.text2, fontSize: 11, lineHeight: '16px' }}>
                  {eff.description}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                    padding: '6px 8px',
                    background: 'rgba(91, 141, 239, 0.06)',
                    borderRadius: 4,
                    borderLeft: `2px solid ${s.accent}`,
                  }}
                >
                  <span style={{ color: s.accent, fontSize: 10, fontFamily: s.mono, flexShrink: 0, marginTop: 1 }}>
                    MEMO
                  </span>
                  <span style={{ color: s.text2, fontSize: 11, lineHeight: '16px' }}>
                    {eff.memoNote}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ color: s.text2, fontSize: 11, lineHeight: '17px' }}>
            The compiler builds a precise data flow graph from these effects. Each variable tracks where its value came from (capture) and where it goes (render). When a prop changes, the compiler walks this graph to determine exactly which computations to rerun -- and skips everything else.
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              background: s.bg3,
              borderRadius: 4,
            }}
          >
            <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>DEPENDENCY CHAIN</span>
            <span style={{ color: s.accent, fontSize: 11, fontFamily: s.mono }}>todos</span>
            <span style={{ color: s.text3, fontSize: 10 }}>&rarr;</span>
            <span style={{ color: s.accent, fontSize: 11, fontFamily: s.mono }}>count</span>
            <span style={{ color: s.text3, fontSize: 10 }}>&rarr;</span>
            <span style={{ color: s.accent, fontSize: 11, fontFamily: s.mono }}>filtered</span>
            <span style={{ color: s.text3, fontSize: 10 }}>&rarr;</span>
            <span style={{ color: s.accent, fontSize: 11, fontFamily: s.mono }}>summary</span>
            <span style={{ color: s.text3, fontSize: 10 }}>&rarr;</span>
            <span style={{ color: s.green, fontSize: 11, fontFamily: s.mono }}>render</span>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

function highlightSyntax(code: string) {
  const parts: React.ReactNode[] = []
  let i = 0
  const len = code.length

  while (i < len) {
    if (code.startsWith('function', i)) {
      parts.push(<span key={i} style={{ color: '#f92672' }}>function</span>)
      i += 8
    } else if (code.startsWith('const', i)) {
      parts.push(<span key={i} style={{ color: '#f92672' }}>const</span>)
      i += 5
    } else if (code.startsWith('return', i)) {
      parts.push(<span key={i} style={{ color: '#f92672' }}>return</span>)
      i += 6
    } else if (code.slice(i, i + 2) === '=>') {
      parts.push(<span key={i} style={{ color: '#f92672' }}>{'=>'}</span>)
      i += 2
    } else if (code[i] === '{' || code[i] === '}') {
      parts.push(<span key={i} style={{ color: '#f8f8f2' }}>{code[i]}</span>)
      i += 1
    } else if (code[i] === '(' || code[i] === ')') {
      parts.push(<span key={i} style={{ color: '#f8f8f2' }}>{code[i]}</span>)
      i += 1
    } else if (code[i] === '.' || code[i] === ',' || code[i] === '/' || code[i] === ':') {
      parts.push(<span key={i} style={{ color: '#f8f8f2' }}>{code[i]}</span>)
      i += 1
    } else if (code[i] === '<' || code[i] === '>' || code[i] === '/') {
      parts.push(<span key={i} style={{ color: '#f8f8f2' }}>{code[i]}</span>)
      i += 1
    } else if (code[i] === '`') {
      const end = code.indexOf('`', i + 1)
      const raw = end === -1 ? code.slice(i) : code.slice(i, end + 1)
      parts.push(<span key={i} style={{ color: '#e6db74' }}>{raw}</span>)
      i += raw.length
    } else if (code[i] === "'" || code[i] === '"') {
      const q = code[i]
      let j = i + 1
      while (j < len && code[j] !== q) j++
      const str = code.slice(i, j + 1)
      parts.push(<span key={i} style={{ color: '#e6db74' }}>{str}</span>)
      i += str.length
    } else if (/[A-Z]/.test(code[i])) {
      let j = i
      while (j < len && /\w/.test(code[j])) j++
      parts.push(<span key={i} style={{ color: '#a6e22e' }}>{code.slice(i, j)}</span>)
      i = j
    } else if (/\w/.test(code[i])) {
      const identifiers = new Set(['TodoList', 'filter', 'length', 'done', 'div'])
      let j = i
      while (j < len && /[\w$]/.test(code[j])) j++
      const word = code.slice(i, j)
      if (identifiers.has(word)) {
        parts.push(<span key={i} style={{ color: '#a6e22e' }}>{word}</span>)
      } else {
        parts.push(<span key={i} style={{ color: '#f8f8f2' }}>{word}</span>)
      }
      i = j
    } else {
      parts.push(<span key={i} style={{ color: '#f8f8f2' }}>{code[i]}</span>)
      i += 1
    }
  }

  return <>{parts}</>
}
