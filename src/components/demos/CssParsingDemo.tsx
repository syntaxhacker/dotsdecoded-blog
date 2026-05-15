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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 12, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

const SAMPLE_CSS = `/* element selector */
p {
  color: blue;
  font-size: 16px;
}
/* class selector */
.highlight {
  color: green;
  font-weight: bold;
}
/* id selector */
#main-title {
  color: red;
  font-size: 24px;
  text-align: center;
}
/* element + class */
p.highlight {
  background: yellow;
  color: purple;
}`

interface CssProperty {
  name: string
  value: string
}

interface CssRule {
  selector: string
  properties: CssProperty[]
  specificity: [number, number, number, number]
  type: 'element' | 'class' | 'id' | 'compound'
}

function computeSpecificity(selector: string): [number, number, number, number] {
  let idCount = 0
  let classCount = 0
  let elementCount = 0
  const parts = selector.split(/(?=[.#])/).filter(Boolean)
  for (const part of parts) {
    if (part.startsWith('#')) idCount++
    else if (part.startsWith('.')) classCount++
    else elementCount++
  }
  if (!selector.startsWith('.') && !selector.startsWith('#') && !parts.length) elementCount = 1
  return [idCount, classCount, elementCount, 0] as [number, number, number, number]
}

function parseSelector(selector: string): 'element' | 'class' | 'id' | 'compound' {
  if (selector.startsWith('#')) return 'id'
  if (selector.startsWith('.')) return 'class'
  if (selector.includes('.') || selector.includes('#')) return 'compound'
  return 'element'
}

function parseCSS(css: string): CssRule[] {
  const rules: CssRule[] = []
  const blockRe = /([^{]+)\{([^}]+)\}/g
  let m: RegExpExecArray | null
  const re = new RegExp(blockRe.source, 'g')
  while ((m = re.exec(css)) !== null) {
    const selector = m[1].trim().replace(/\n/g, '')
    const propsStr = m[2].trim()
    const properties: CssProperty[] = []
    const propRe = /\s*([\w-]+)\s*:\s*([^;]+);?\s*/g
    let pm: RegExpExecArray | null
    while ((pm = propRe.exec(propsStr)) !== null) {
      properties.push({ name: pm[1].trim(), value: pm[2].trim() })
    }
    if (selector && properties.length > 0) {
      rules.push({
        selector,
        properties,
        specificity: computeSpecificity(selector),
        type: parseSelector(selector),
      })
    }
  }
  return rules
}

const rules = parseCSS(SAMPLE_CSS)

const SAMPLE_ELEMENT = '<p class="highlight" id="main-title">'

const finalStyles: { property: string; cascade: { selector: string; value: string; specificity: [number, number, number, number]; win: boolean }[] }[] = [
  {
    property: 'color',
    cascade: [
      { selector: 'p.highlight', value: 'purple', specificity: [0, 1, 1, 0], win: true },
      { selector: '.highlight', value: 'green', specificity: [0, 1, 0, 0], win: false },
      { selector: 'p', value: 'blue', specificity: [0, 0, 1, 0], win: false },
    ],
  },
  {
    property: 'font-size',
    cascade: [
      { selector: '#main-title', value: '24px', specificity: [1, 0, 0, 0], win: true },
      { selector: 'p', value: '16px', specificity: [0, 0, 1, 0], win: false },
    ],
  },
  {
    property: 'font-weight',
    cascade: [
      { selector: '.highlight', value: 'bold', specificity: [0, 1, 0, 0], win: true },
    ],
  },
  {
    property: 'text-align',
    cascade: [
      { selector: '#main-title', value: 'center', specificity: [1, 0, 0, 0], win: true },
    ],
  },
  {
    property: 'background',
    cascade: [
      { selector: 'p.highlight', value: 'yellow', specificity: [0, 1, 1, 0], win: true },
    ],
  },
]

export default function CssParsingDemo() {
  const [selectedRule, setSelectedRule] = useState<number | null>(null)
  const [showCascade, setShowCascade] = useState(false)

  const specStr = (spec: [number, number, number, number]) => `(${spec[0]},${spec[1]},${spec[2]},${spec[3]})`

  return (
    <DemoBoundary name="CSS Parsing">
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text }}>
      <div style={SEC}>
        <div style={H}>CSS Parsing</div>
        <p style={{ color: s.text2, fontSize: 13, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          CSS source text is parsed into a CSSOM tree of rules. Each rule has a selector, properties,
          and a specificity score. The cascade resolves conflicts when multiple rules target the same property.
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            padding: '6px 14px', color: s.text2, fontSize: 13, fontFamily: s.mono,
            background: s.bg3, borderRadius: 6, cursor: 'default',
          }}>{rules.length} rules parsed</span>
          {!showCascade && (
            <button onClick={() => setShowCascade(true)} style={{
              padding: '6px 14px', background: s.accent, color: '#fff', border: 'none',
              borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>Show Cascade Resolution</button>
          )}
          {showCascade && (
            <button onClick={() => setShowCascade(false)} style={{
              padding: '6px 14px', background: s.purple, color: '#fff', border: 'none',
              borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>Show Parsed Rules</button>
          )}
        </div>

        {!showCascade ? (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: '1 1 45%' }}>
              <div style={{
                padding: '8px 14px', background: s.bg3, borderTopLeftRadius: 8, borderTopRightRadius: 8,
                fontSize: 11, fontWeight: 700, color: s.text2, textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>CSS Source</div>
              <div style={{
                background: s.bg, border: `1px solid ${s.border}`, borderTop: 'none',
                borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
                padding: 14, fontFamily: s.mono, fontSize: 12, lineHeight: 1.7,
                overflow: 'auto', maxHeight: 360, whiteSpace: 'pre',
              }}>
                {SAMPLE_CSS}
              </div>
            </div>

            <div style={{ flex: '1 1 55%' }}>
              <div style={{
                padding: '8px 14px', background: s.bg3, borderTopLeftRadius: 8, borderTopRightRadius: 8,
                fontSize: 11, fontWeight: 700, color: s.text2, textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>CSSOM Tree</div>
              <div style={{
                background: s.bg, border: `1px solid ${s.border}`, borderTop: 'none',
                borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
                padding: 14, fontFamily: s.mono, fontSize: 12, lineHeight: 1.7,
                overflowY: 'auto', maxHeight: 360,
              }}>
                <div style={{ marginBottom: 8, color: s.text3, fontSize: 11 }}>StyleSheet</div>
                {rules.map((rule, idx) => {
                  const isSelected = selectedRule === idx
                  const tc = {
                    element: { color: s.accent, bg: 'rgba(91,141,239,.12)' },
                    class: { color: s.green, bg: 'rgba(61,214,140,.12)' },
                    id: { color: s.yellow, bg: 'rgba(224,176,64,.12)' },
                    compound: { color: s.purple, bg: 'rgba(155,123,234,.12)' },
                  }[rule.type]
                  return (
                    <div key={idx} onClick={() => setSelectedRule(isSelected ? null : idx)} style={{
                      padding: '8px 12px', marginBottom: 6,
                      background: isSelected ? s.bg3 : 'transparent',
                      border: `1px solid ${isSelected ? rule.type === 'id' ? s.yellow : rule.type === 'class' ? s.green : rule.type === 'compound' ? s.purple : s.accent : s.border}`,
                      borderRadius: 6, cursor: 'pointer',
                      transition: 'all .15s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                          padding: '2px 7px', borderRadius: 3, fontSize: 10, fontWeight: 700,
                          background: tc.bg, color: tc.color,
                        }}>{rule.type}</span>
                        <span style={{ color: isSelected ? s.text : s.accent, fontSize: 13, fontWeight: 600 }}>
                          {rule.selector}
                        </span>
                        <span style={{ marginLeft: 'auto', color: s.text3, fontSize: 11, fontFamily: s.mono }}>
                          {specStr(rule.specificity)}
                        </span>
                      </div>
                      {isSelected && (
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${s.border}` }}>
                          <div style={{ color: s.text3, fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Specificity: {specStr(rule.specificity)}
                          </div>
                          <div style={{ fontSize: 11, color: s.text3 }}>
                            {rule.specificity[0]} inline + {rule.specificity[1]} ID{rule.specificity[2] > 0 ? ` + ${rule.specificity[2]} class` : ''}
                            {rule.specificity[3] > 0 ? ` + ${rule.specificity[3]} element` : ''}
                          </div>
                          <div style={{ marginTop: 6 }}>
                            {rule.properties.map((prop, pi) => (
                              <div key={pi} style={{ display: 'flex', gap: 8, padding: '2px 0', fontSize: 12 }}>
                                <span style={{ color: s.orange }}>{prop.name}</span>
                                <span style={{ color: s.text3 }}>:</span>
                                <span style={{ color: s.green }}>{prop.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              padding: '10px 14px', background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: 6, marginBottom: 14, fontFamily: s.mono, fontSize: 12,
            }}>
              <div style={{ color: s.text3, fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                Target Element
              </div>
              <span style={{ color: s.accent }}>{SAMPLE_ELEMENT}</span>
            </div>

            <div style={{
              padding: '8px 14px', background: s.bg3, borderTopLeftRadius: 8, borderTopRightRadius: 8,
              fontSize: 11, fontWeight: 700, color: s.text2, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>Cascade Resolution</div>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderTop: 'none',
              borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
              padding: 14, fontFamily: s.mono, fontSize: 12, lineHeight: 1.7,
              overflow: 'auto', maxHeight: 400,
            }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                <span style={{ width: 100 }}>Property</span>
                <span style={{ flex: 1 }}>Contenders</span>
                <span style={{ width: 80, textAlign: 'right' }}>Winner</span>
              </div>
              {finalStyles.map((st, idx) => (
                <div key={idx} style={{
                  padding: '8px 10px', marginBottom: 6,
                  background: 'rgba(91,141,239,.04)',
                  border: `1px solid ${s.border2}`, borderRadius: 6,
                }}>
                  <div style={{ fontWeight: 600, color: s.orange, marginBottom: 6, fontSize: 11 }}>
                    {st.property}
                  </div>
                  {st.cascade.map((c, ci) => (
                    <div key={ci} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0',
                      opacity: c.win ? 1 : 0.5,
                    }}>
                      <span style={{ width: 60, color: c.win ? s.green : s.text3, fontSize: 11, fontFamily: s.mono }}>
                        {c.win ? 'WIN' : 'LOSE'}
                      </span>
                      <span style={{ color: c.win ? s.text : s.text3, fontSize: 12, flex: 1 }}>
                        {c.selector}
                      </span>
                      <span style={{ color: c.win ? s.green : s.text3, fontSize: 11 }}>
                        {c.value}
                      </span>
                      <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>
                        {specStr(c.specificity)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{
                marginTop: 12, padding: '10px 14px', background: 'rgba(61,214,140,.06)',
                border: '1px solid rgba(61,214,140,.2)', borderRadius: 6,
              }}>
                <div style={{ color: s.green, fontWeight: 700, fontSize: 11, marginBottom: 4 }}>
                  Final Computed Styles for &lt;p class="highlight" id="main-title"&gt;
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {finalStyles.map((st, idx) => {
                    const winner = st.cascade.find(c => c.win)
                    return (
                      <span key={idx} style={{
                        padding: '3px 10px', background: s.bg3, borderRadius: 4, fontSize: 11,
                      }}>
                        <span style={{ color: s.orange }}>{st.property}</span>
                        <span style={{ color: s.text3 }}>: </span>
                        <span style={{ color: s.green, fontWeight: 600 }}>{winner?.value}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
