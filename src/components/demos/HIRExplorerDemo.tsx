import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

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

const examples = [
  {
    label: 'if / else',
    source: `function Greeting(props) {
  if (props.isLoggedIn) {
    return <h1>Welcome back!</h1>
  }
  return <h1>Please sign in</h1>
}`,
    hir: `Greeting(<Object> props$0): <unknown> $8
bb0 (block):
  [1] $2 = LoadLocal <Object> props$0
  [2] $3 = PropertyLoad $2.isLoggedIn
  [3] If ($3) then:bb2 else:bb1 fallthrough=bb1
bb1 (block):
  predecessor blocks: bb0
  [4] Return Implicit <h1>Please sign in</h1>
bb2 (block):
  predecessor blocks: bb0
  [5] Return Implicit <h1>Welcome back!</h1>`,
  },
  {
    label: 'useState',
    source: `function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  )
}`,
    hir: `Counter(): <unknown> $14
bb0 (block):
  [1] $1 = useState(0)
  [2] $2 = LoadLocal $1
  [3] $3 = PropertyLoad $2.0
  [4] $4 = PropertyLoad $2.1
  [5] $5 = LoadLocal $3
  [6] $6 = Binary $5 + 1
  [7] $7 = Function @context[$4]:
    [1] $8 = LoadContext $4
    [2] $9 = LoadContext $3
    [3] $10 = Binary $9 + 1
    [4] $11 = Call $8($10)
    [5] Return Void
  [8] $12 = JsxFragment:
    <button onClick={$7}>{$5}</button>
  [9] Return Implicit $12`,
  },
  {
    label: 'map',
    source: `function List({ items }) {
  return items.map(item => (
    <li key={item.id}>{item.name}</li>
  ))
}`,
    hir: `List(<Object> props$0): <unknown> $8
bb0 (block):
  [1] $1 = LoadLocal <Object> props$0
  [2] $2 = PropertyLoad $1.items
  [3] $3 = Function ($4):
    [1] $5 = PropertyLoad $4.id
    [2] $6 = PropertyLoad $4.name
    [3] $7 = JsxFragment: <li key={$5}>{$6}</li>
    [4] Return Implicit $7
  [4] $8 = Call $2.map($3)
  [5] Return Implicit $8`,
  },
]

function highlightHir(raw: string) {
  const lines = raw.split('\n')
  return lines.map((line, i) => {
    const parts: { text: string; color: string }[] = []
    let remaining = line

    const blockHeader = remaining.match(/^(bb\d+)\s*(\(block\))/)
    if (blockHeader) {
      parts.push({ text: blockHeader[1], color: s.accent })
      parts.push({ text: blockHeader[2], color: s.text2 })
      remaining = remaining.slice(blockHeader[0].length)
    }

    if (remaining.startsWith('  predecessor blocks:')) {
      parts.push({ text: remaining, color: s.text3 })
      return <span key={i}>{parts.map((p, j) => <span key={j} style={{ color: p.color }}>{p.text}</span>)}</span>
    }

    if (remaining.match(/^\s*\[?\d+\]?\s*[A-Z]/) || remaining.match(/^\s*\[/)) {
      const instrMatch = remaining.match(/^(\s*)(\[\d+\])\s/)
      if (instrMatch) {
        parts.push({ text: instrMatch[1], color: s.text })
        parts.push({ text: instrMatch[2], color: s.orange })
        remaining = remaining.slice(instrMatch[0].length)
      }

      const funcSig = remaining.match(/^(Function)\s+(@context\[\$\d+\]|\(\$\d+\)):/)
      if (funcSig) {
        parts.push({ text: funcSig[1], color: '#a6e22e' })
        parts.push({ text: funcSig[2], color: s.purple })
        remaining = remaining.slice(funcSig[0].length)
      }

      if (remaining) {
        const colored = colorInstructionBody(remaining)
        parts.push(...colored)
      }
    } else if (remaining.trim()) {
      const colored = colorTopLevel(remaining)
      parts.push(...colored)
    }

    if (parts.length === 0) {
      parts.push({ text: line, color: s.text })
    }

    return <span key={i}>{parts.map((p, j) => <span key={j} style={{ color: p.color }}>{p.text}</span>)}{'\n'}</span>
  })
}

function colorInstructionBody(text: string): { text: string; color: string }[] {
  const result: { text: string; color: string }[] = []
  const re = /(LoadLocal|PropertyLoad|LoadContext|Binary|Call|Return|If|Function|JsxFragment|useState|Array|Object|String|Number|Boolean|Void|Implicit|ReactivePrimitives|CreateArray|GetIterator|IteratorResult|Start|Test|Loop|Break|Throw|Null|Undefined)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ text: text.slice(lastIndex, match.index), color: s.text })
    }
    const word = match[1]
    if (['Object', 'String', 'Number', 'Boolean', 'Void', 'Implicit', 'Null', 'Undefined'].includes(word)) {
      result.push({ text: word, color: s.purple })
    } else {
      result.push({ text: word, color: '#a6e22e' })
    }
    lastIndex = re.lastIndex
  }
  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), color: s.text })
  }
  return result
}

function colorTopLevel(text: string): { text: string; color: string }[] {
  const result: { text: string; color: string }[] = []
  const re = /(<Object>\s*|<unknown>\s*|:\s*<unknown>\s*|\$\d+)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ text: text.slice(lastIndex, match.index), color: s.text })
    }
    const m = match[1]
    if (m.startsWith('$')) {
      result.push({ text: m, color: s.orange })
    } else if (m.includes('<Object>')) {
      result.push({ text: m, color: s.purple })
    } else if (m.includes('<unknown>')) {
      result.push({ text: m, color: s.purple })
    } else {
      result.push({ text: m, color: s.text })
    }
    lastIndex = re.lastIndex
  }
  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), color: s.text })
  }
  return result
}

export default function HIRExplorerDemo() {
  const [selected, setSelected] = useState(0)
  const example = examples[selected]
  const highlightedHir = useMemo(() => highlightHir(example.hir), [example.hir])

  return (
    <DemoBoundary name="HIR Explorer">
      <div style={{
        maxWidth: 820,
        margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          gap: 6,
          padding: '12px 14px',
          background: s.bg2,
          borderBottom: `1px solid ${s.border}`,
        }}>
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: `1px solid ${i === selected ? s.accent : s.border}`,
                background: i === selected ? 'rgba(91, 141, 239, 0.12)' : s.bg,
                color: i === selected ? s.accent : s.text3,
                fontFamily: s.mono,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>
        <div style={{
          display: 'flex',
          minHeight: 340,
        }}>
          <div style={{
            flex: 1,
            padding: '14px 16px',
            borderRight: `1px solid ${s.border}`,
            overflow: 'auto',
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: s.text3,
              marginBottom: 10,
            }}>
              Source Code
            </div>
            <div style={{
              fontFamily: s.mono,
              fontSize: 13,
              lineHeight: 1.6,
              color: s.text,
            }}>
              {example.source.split('\n').map((line, i) => (
                <div key={i} style={{ whiteSpace: 'pre' }}>{line}</div>
              ))}
            </div>
          </div>
          <div style={{
            flex: 1,
            padding: '14px 16px',
            overflow: 'auto',
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: s.text3,
              marginBottom: 10,
            }}>
              HIR Output
            </div>
            <div style={{
              fontFamily: s.mono,
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: 'pre',
            }}>
              {highlightedHir}
            </div>
          </div>
        </div>
        <div style={{
          padding: '10px 16px',
          borderTop: `1px solid ${s.border}`,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'Instructions', color: '#a6e22e' },
            { label: 'Types', color: s.purple },
            { label: 'Block IDs', color: s.accent },
            { label: 'SSA Values', color: s.orange },
            { label: 'Metadata', color: s.text3 },
          ].map(({ label, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: s.text2 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </DemoBoundary>
  )
}
