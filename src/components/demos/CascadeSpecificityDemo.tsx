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

function parseSpecificity(selector: string): [number, number, number, number] {
  let str = selector.replace(/\s+/g, '')
  str = str.replace(/\[.*?\]/g, '')
  str = str.replace(/:not\([^)]*\)/g, '')
  let ids = 0
  let classes = 0
  let elements = 0
  let remaining = str
  const idMatches = remaining.match(/#[a-zA-Z_-][\w-]*/g)
  if (idMatches) ids = idMatches.length
  remaining = remaining.replace(/#[a-zA-Z_-][\w-]*/g, '')
  const classMatches = remaining.match(/\.[a-zA-Z_-][\w-]*/g)
  if (classMatches) classes = classMatches.length
  remaining = remaining.replace(/\.[a-zA-Z_-][\w-]*/g, '')
  const pseudoMatches = remaining.match(/:[a-zA-Z-]+(?![\w-]*\()/g)
  if (pseudoMatches) classes += pseudoMatches.length
  remaining = remaining.replace(/:[a-zA-Z-]+(?![\w-]*\()/g, '')
  const attrMatches = remaining.match(/\[[^\]]+\]/g)
  if (attrMatches) classes += attrMatches.length
  remaining = remaining.replace(/\[[^\]]+\]/g, '')
  const tagMatches = remaining.match(/[a-zA-Z][\w-]*/g)
  if (tagMatches) elements = tagMatches.length
  return [0, ids, classes, elements]
}

function specificityColor(spec: [number, number, number, number]): string {
  const [, ids, classes, elements] = spec
  if (ids > 0) return s.purple
  if (classes > 0) return s.accent
  if (elements > 0) return s.green
  return s.text3
}

function compareSpec(a: [number, number, number, number], b: [number, number, number, number]): number {
  for (let i = 0; i < 4; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return 0
}

function CascadeSpecificityDemo() {
  const [rules, setRules] = useState([
    { selector: 'div', property: 'color', value: 'red', important: false },
    { selector: '.box', property: 'color', value: 'blue', important: false },
  ])

  const addRule = () => {
    setRules([...rules, { selector: '', property: 'color', value: 'green', important: false }])
  }

  const removeRule = (idx: number) => {
    if (rules.length <= 1) return
    setRules(rules.filter((_, i) => i !== idx))
  }

  const updateRule = (idx: number, field: string, val: string | boolean) => {
    const next = [...rules]
    if (field === 'important') {
      next[idx] = { ...next[idx], important: val as boolean }
    } else {
      next[idx] = { ...next[idx], [field]: val }
    }
    setRules(next)
  }

  const computed = useMemo(() => {
    return rules.map((rule) => ({
      ...rule,
      spec: parseSpecificity(rule.selector),
    }))
  }, [rules])

  const winnerIdx = useMemo(() => {
    let bestIdx = 0
    for (let i = 1; i < computed.length; i++) {
      const r = computed[i]
      const b = computed[bestIdx]
      if (r.important && !b.important) {
        bestIdx = i
      } else if (r.important === b.important) {
        const cmp = compareSpec(r.spec, b.spec)
        if (cmp > 0) bestIdx = i
        else if (cmp === 0 && i > bestIdx) bestIdx = i
      }
    }
    return bestIdx
  }, [computed])

  return (
    <DemoBoundary name="Cascade & Specificity">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: s.text3, fontSize: 12, fontFamily: s.mono, marginBottom: 12 }}>
            CSS Rules (targeting the same property)
          </div>
          {computed.map((rule, i) => {
            const col = specificityColor(rule.spec)
            const isWinner = i === winnerIdx
            return (
              <div key={i} style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                marginBottom: 8,
                padding: '8px 12px',
                background: isWinner ? s.accent + '15' : s.bg2,
                border: `1px solid ${isWinner ? s.accent : s.border}`,
                borderRadius: 6,
              }}>
                <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, width: 20, flexShrink: 0 }}>
                  {i + 1}.
                </div>
                <input
                  value={rule.selector}
                  onChange={(e) => updateRule(i, 'selector', e.target.value)}
                  placeholder="selector"
                  style={{
                    flex: 1,
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: 4,
                    padding: '6px 10px',
                    color: col,
                    fontFamily: s.mono,
                    fontSize: 13,
                    outline: 'none',
                    minWidth: 0,
                  }}
                />
                <div style={{ color: s.text3, fontSize: 13 }}>{rule.property}:</div>
                <input
                  value={rule.value}
                  onChange={(e) => updateRule(i, 'value', e.target.value)}
                  placeholder="value"
                  style={{
                    width: 80,
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: 4,
                    padding: '6px 10px',
                    color: s.green,
                    fontFamily: s.mono,
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => updateRule(i, 'important', !rule.important)}
                  style={{
                    padding: '4px 8px',
                    background: rule.important ? s.red + '33' : s.bg,
                    border: `1px solid ${rule.important ? s.red : s.border}`,
                    borderRadius: 4,
                    color: rule.important ? s.red : s.text3,
                    fontFamily: s.mono,
                    fontSize: 10,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  !important
                </button>
                <div style={{
                  fontFamily: s.mono,
                  fontSize: 12,
                  color: col,
                  minWidth: 90,
                  textAlign: 'center',
                  flexShrink: 0,
                }}>
                  ({rule.spec.join(', ')})
                </div>
                <button
                  onClick={() => removeRule(i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: s.text3,
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: '0 4px',
                    fontFamily: 'inherit',
                  }}
                >
                  x
                </button>
                {isWinner && (
                  <div style={{
                    fontFamily: s.mono,
                    fontSize: 10,
                    color: s.green,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    WINS
                  </div>
                )}
              </div>
            )
          })}
          <button
            onClick={addRule}
            style={{
              background: s.bg2,
              border: `1px dashed ${s.border}`,
              borderRadius: 6,
              padding: '8px 16px',
              color: s.text2,
              fontFamily: s.mono,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            + Add Rule
          </button>
        </div>

        <div style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          padding: 14,
          marginTop: 16,
        }}>
          <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8 }}>SPECIFICITY REFERENCE</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'element', spec: '0,0,0,1', color: s.green, example: 'div, p, span' },
              { label: '.class', spec: '0,0,1,0', color: s.accent, example: '.box, .active' },
              { label: '#id', spec: '0,1,0,0', color: s.purple, example: '#main, #nav' },
              { label: 'inline style', spec: '1,0,0,0', color: s.orange, example: 'style="..."' },
            ].map((item) => (
              <div key={item.label} style={{ minWidth: 120 }}>
                <div style={{ fontFamily: s.mono, fontSize: 12, color: item.color, fontWeight: 600 }}>{item.spec}</div>
                <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginTop: 2 }}>{item.example}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

export default CascadeSpecificityDemo
