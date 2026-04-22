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

const KW = '#f92672'
const STR = '#e6db74'
const FN = '#a6e22e'
const CM = '#75715e'
const NUM = '#ae81ff'
const OP = '#f8f8f2'
const CACHE = '#5b8def'

interface Token {
  text: string
  color: string
}

function tokenize(code: string): Token[] {
  const tokens: Token[] = []
  const lines = code.split('\n')
  for (const line of lines) {
    const trimmed = line.trimStart()
    const indent = line.length - trimmed.length

    if (trimmed.startsWith('//')) {
      if (indent > 0) tokens.push({ text: ' '.repeat(indent), color: OP })
      tokens.push({ text: trimmed, color: CM })
      tokens.push({ text: '\n', color: OP })
      continue
    }

    const parts = trimmed.split(/(\$(\[\d+\])?|_c\(\d+\))/g)
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!part) continue
      if (part.startsWith('$') || part.startsWith('_c(')) {
        tokens.push({ text: part, color: CACHE })
      } else {
        const subParts = part.split(/(\b(?:function|const|let|return|if|else|import|from|useMemo)\b)/g)
        for (const sp of subParts) {
          if (!sp) continue
          if (/^(function|const|let|return|if|else|import|from)$/.test(sp)) {
            tokens.push({ text: sp, color: KW })
          } else if (sp === 'useMemo') {
            tokens.push({ text: sp, color: FN })
          } else {
            const strParts = sp.split(/('(?:[^'\\]|\\.)*')/g)
            for (const st of strParts) {
              if (!st) continue
              if (st.startsWith("'")) {
                tokens.push({ text: st, color: STR })
              } else {
                const numParts = st.split(/(\b\d+\.?\d*\b)/g)
                for (const np of numParts) {
                  if (!np) continue
                  if (/^\d+\.?\d*$/.test(np) && np.length > 0) {
                    tokens.push({ text: np, color: NUM })
                  } else {
                    tokens.push({ text: np, color: OP })
                  }
                }
              }
            }
          }
        }
      }
    }
    tokens.push({ text: '\n', color: OP })
  }
  return tokens
}

interface Example {
  title: string
  label: string
  note: string
  before: string
  after: string
}

const examples: Example[] = [
  {
    title: 'Memoization Added Automatically',
    label: 'Derived values cached without useMemo',
    note: 'The compiler wraps the computation in a cache check. If product.price or product.discount hasn\'t changed, the cached formatted string is reused.',
    before: `function ProductCard({ product }) {
  const price = product.price * (1 - product.discount)
  const formatted = price.toFixed(2)
  return <div>{product.name}: ${'${formatted}'}</div>
}`,
    after: `function ProductCard({ product }) {
  const $ = _c(2);
  let t0;
  if ($[0] !== product.price || $[1] !== product.discount) {
    t0 = (product.price * (1 - product.discount)).toFixed(2);
    $[0] = product.price;
    $[1] = product.discount;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return <div>{product.name}: {t0}</div>
}`,
  },
  {
    title: 'useMemo Preserved',
    label: 'Manual memoization kept intact',
    note: 'When you already have useMemo, the compiler respects it. It only memoizes the JSX output around your existing memo. No double-memoization, no wasted work.',
    before: `function Chart({ data, filter }) {
  const filtered = useMemo(
    () => data.filter(filter),
    [data, filter]
  );
  return <ul>{filtered.map(d => <li key={d.id}>{d.value}</li>)}</ul>
}`,
    after: `function Chart({ data, filter }) {
  const $ = _c(2);
  const filtered = useMemo(() => data.filter(filter), [data, filter]);
  let t0;
  if ($[0] !== filtered) {
    t0 = <ul>{filtered.map(d => <li key={d.id}>{d.value}</li>)}</ul>;
    $[0] = filtered;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}`,
  },
  {
    title: 'Derived State Computed Efficiently',
    label: 'Chain of derivations collapsed into one cache',
    note: 'Two derived values (filtered + sorted) are computed together inside a single cache check. The compiler merges them into one memoized block instead of caching each separately.',
    before: `function SearchResults({ items, query }) {
  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  return sorted.map(item => <div key={item.id}>{item.name}</div>);
}`,
    after: `function SearchResults({ items, query }) {
  const $ = _c(3);
  let t0;
  if ($[0] !== items || $[1] !== query) {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    t0 = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    $[0] = items;
    $[1] = query;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0.map(item => <div key={item.id}>{item.name}</div>);
}`,
  },
]

function CodePanel({ code, label }: { code: string; label: string }) {
  const tokens = useMemo(() => tokenize(code), [code])
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        fontSize: 11, fontFamily: s.mono, color: s.text3,
        textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
      }}>
        {label}
      </div>
      <div style={{
        background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
        padding: '14px 16px', overflowX: 'auto',
      }}>
        <div style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 12.5, lineHeight: 1.65 }}>
          {tokens.map((t, i) => (
            <span key={i} style={{ color: t.color }}>{t.text}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function BeforeAfterDemo() {
  const [active, setActive] = useState(0)
  const ex = examples[active]

  return (
    <DemoBoundary name="Before and After — React Compiler Output">
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {examples.map((e, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                flex: 1, padding: '10px 8px', border: `1px solid ${i === active ? s.accent : s.border}`,
                borderRadius: 6, background: i === active ? 'rgba(91,141,239,0.1)' : s.bg2,
                color: i === active ? s.text : s.text3, cursor: 'pointer',
                fontFamily: s.mono, fontSize: 11.5, textAlign: 'center',
                transition: 'all 0.15s ease', lineHeight: 1.3,
              }}
            >
              {e.title}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
          <CodePanel code={ex.before} label="Your Code" />
          <CodePanel code={ex.after} label="Compiled Output" />
        </div>

        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 6,
          background: s.bg2, border: `1px solid ${s.border}`,
          fontSize: 12.5, color: s.text2, lineHeight: 1.5,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}>
          <span style={{ color: s.accent, fontFamily: s.mono, fontWeight: 600, fontSize: 11 }}>
            {ex.label}
          </span>
          {' — '}
          {ex.note}
        </div>
      </div>
    </DemoBoundary>
  )
}
