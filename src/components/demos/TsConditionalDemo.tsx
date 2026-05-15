import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const excludeDef = `type Exclude<T, U> = T extends U ? never : T`

type FruitUnion = 'apple' | 'banana' | 'cherry' | 'date'

const unionMembers: { label: string; value: string }[] = [
  { label: 'apple', value: 'apple' },
  { label: 'banana', value: 'banana' },
  { label: 'cherry', value: 'cherry' },
  { label: 'date', value: 'date' },
]

const evaluationSteps: Record<string, { cond: string; result: string }[]> = {
  'apple': [
    { cond: "'apple' extends 'banana' ?", result: 'false - keep apple' },
  ],
  'banana': [
    { cond: "'banana' extends 'banana' ?", result: 'true - drop (never)' },
  ],
  'cherry': [
    { cond: "'cherry' extends 'banana' ?", result: 'false - keep cherry' },
  ],
  'date': [
    { cond: "'date' extends 'banana' ?", result: 'false - keep date' },
  ],
}

const toArrayCode = `type ToArray<T> = T extends unknown ? T[] : never

// Distributive: T splits on union members
type Result = ToArray<string | number>
// => string[] | number[]

// Non-distributive: wrapped in [T]
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never
type Result2 = ToArrayNonDist<string | number>
// => (string | number)[]
`

const examples = [
  {
    id: 'exclude',
    label: 'Exclude',
    code: `type Exclude<T, U> = T extends U ? never : T

type Fruit = 'apple' | 'banana' | 'cherry' | 'date'
type NoBanana = Exclude<Fruit, 'banana'>
// 'apple' | 'cherry' | 'date'`,
  },
  {
    id: 'extract',
    label: 'Extract',
    code: `type Extract<T, U> = T extends U ? T : never

type Fruit = 'apple' | 'banana' | 'cherry' | 'date'
type OnlyBanana = Extract<Fruit, 'banana' | 'date'>
// 'banana' | 'date'`,
  },
  {
    id: 'nonnull',
    label: 'NonNullable',
    code: `type NonNullable<T> = T extends null | undefined ? never : T

type Maybe = string | null | undefined
type Definite = NonNullable<Maybe>
// string`,
  },
]

export default function TsConditionalDemo() {
  const [excludeTarget, setExcludeTarget] = useState('banana')
  const [activeExample, setActiveExample] = useState('exclude')
  const [stepIdx, setStepIdx] = useState(0)
  const [showDistribution, setShowDistribution] = useState(false)

  const filteredMembers = useMemo(() => {
    return unionMembers.filter(m => m.value !== excludeTarget)
  }, [excludeTarget])

  const highlighted = useMemo(() => {
    const map: Record<string, string> = {}
    for (const ex of examples) {
      map[ex.id] = Prism.highlight(ex.code, Prism.languages.typescript, 'typescript')
    }
    map['toArray'] = Prism.highlight(toArrayCode, Prism.languages.typescript, 'typescript')
    return map
  }, [])

  const currentExample = examples.find(ex => ex.id === activeExample) || examples[0]

  const distributionSteps = [
    { label: 'Union input', detail: "ToArray<string | number> receives the union string | number" },
    { label: 'Distribution starts', detail: "TypeScript splits the union: evaluate each member independently" },
    { label: 'Branch 1: string', detail: "string extends unknown ? string[] : never => string[]" },
    { label: 'Branch 2: number', detail: "number extends unknown ? number[] : never => number[]" },
    { label: 'Union result', detail: "Final type: string[] | number[]" },
  ]

  return (
    <DemoBoundary name="TypeScript Conditional Types">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{`
          .tsc-code .token.keyword { color: #f92672; }
          .tsc-code .token.string, .tsc-code .token.char, .tsc-code .token.builtin, .tsc-code .token.inserted { color: #e6db74; }
          .tsc-code .token.number, .tsc-code .token.constant, .tsc-code .token.symbol, .tsc-code .token.property, .tsc-code .token.tag, .tsc-code .token.boolean, .tsc-code .token.deleted { color: #ae81ff; }
          .tsc-code .token.selector, .tsc-code .token.attr-name { color: #f92672; }
          .tsc-code .token.attr-value, .tsc-code .token.atrule { color: #e6db74; }
          .tsc-code .token.function, .tsc-code .token.class-name { color: #a6e22e; }
          .tsc-code .token.operator, .tsc-code .token.entity, .tsc-code .token.url, .tsc-code .token.punctuation { color: #f8f8f2; }
          .tsc-code .token.comment, .tsc-code .token.prolog, .tsc-code .token.doctype, .tsc-code .token.cdata { color: #75715e; font-style: italic; }
          .tsc-code .token.parameter, .tsc-code .token.variable, .tsc-code .token.regex, .tsc-code .token.important { color: #fd971f; }
        `}</style>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {examples.map(ex => (
            <button
              key={ex.id}
              onClick={() => setActiveExample(ex.id)}
              style={{
                padding: '7px 16px',
                background: activeExample === ex.id ? s.accent : s.bg2,
                border: `1px solid ${activeExample === ex.id ? s.accent : s.border}`,
                borderRadius: 6,
                color: activeExample === ex.id ? '#fff' : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                fontWeight: activeExample === ex.id ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>

        <div style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}` }}>
            <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Type Definition
            </span>
          </div>
          <div style={{ padding: 16, fontFamily: s.mono, fontSize: 13, lineHeight: 1.7, overflowX: 'auto' }}>
            <code className="tsc-code" dangerouslySetInnerHTML={{ __html: highlighted[activeExample] }} />
          </div>
        </div>

        {activeExample === 'exclude' && (
          <div style={{
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            <div style={{
              padding: '10px 14px',
              borderBottom: `1px solid ${s.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Distributive Evaluation
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>Exclude:</span>
                {['banana', 'apple', 'cherry', 'date'].map(target => (
                  <button
                    key={target}
                    onClick={() => setExcludeTarget(target)}
                    style={{
                      padding: '3px 8px',
                      background: excludeTarget === target ? s.red : s.bg3,
                      border: `1px solid ${excludeTarget === target ? s.red : s.border}`,
                      borderRadius: 4,
                      color: excludeTarget === target ? '#fff' : s.text2,
                      fontFamily: s.mono,
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                  >
                    {target}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginBottom: 10 }}>
                Exclude&lt;Fruit, '{excludeTarget}'&gt; evaluates each member:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {unionMembers.map(m => {
                  const isExcluded = m.value === excludeTarget
                  return (
                    <div
                      key={m.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '8px 12px',
                        background: isExcluded ? `${s.red}0c` : `${s.green}0c`,
                        border: `1px solid ${isExcluded ? s.red : s.green}30`,
                        borderRadius: 6,
                        fontFamily: s.mono,
                        fontSize: 12,
                        opacity: filteredMembers.includes(m) ? 1 : 0.5,
                      }}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: isExcluded ? s.red : s.green,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0,
                      }}>
                        {isExcluded ? '\u2717' : '\u2713'}
                      </span>
                      <span style={{ color: isExcluded ? s.red : s.green, flex: 1 }}>
                        '{m.value}' extends '{excludeTarget}' ?
                      </span>
                      <span style={{ color: isExcluded ? s.text3 : s.text2, textAlign: 'right' }}>
                        {isExcluded ? 'never (dropped)' : `${m.value} (kept)`}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div style={{
                marginTop: 12,
                padding: '10px 14px',
                background: s.bg,
                border: `1px solid ${s.accent}40`,
                borderRadius: 6,
                fontFamily: s.mono,
                fontSize: 12,
                color: s.text,
              }}>
                Result:{' '}
                <span style={{ color: s.accent }}>
                  {filteredMembers.map(m => `'${m.value}'`).join(' | ') || 'never'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeExample === 'exclude' && (
          <div style={{
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 14px',
              borderBottom: `1px solid ${s.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Distribution vs Non-Distribution
              </span>
              <button
                onClick={() => setShowDistribution(!showDistribution)}
                style={{
                  padding: '4px 12px',
                  background: showDistribution ? s.accent : s.bg3,
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 10,
                  fontFamily: s.mono,
                  cursor: 'pointer',
                }}
              >
                {showDistribution ? 'Reset' : 'Step Through'}
              </button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontFamily: s.mono, fontSize: 13, lineHeight: 1.7, overflowX: 'auto', marginBottom: 12 }}>
                <code className="tsc-code" dangerouslySetInnerHTML={{ __html: highlighted['toArray'] }} />
              </div>
              {showDistribution && (
                <div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    {distributionSteps.map((st, i) => (
                      <button
                        key={i}
                        onClick={() => setStepIdx(i)}
                        style={{
                          padding: '4px 10px',
                          background: i === stepIdx ? s.accent : i < stepIdx ? `${s.green}20` : s.bg3,
                          border: `1px solid ${i === stepIdx ? s.accent : i < stepIdx ? s.green : s.border}`,
                          borderRadius: 4,
                          color: i === stepIdx ? '#fff' : i < stepIdx ? s.green : s.text3,
                          fontFamily: s.mono,
                          fontSize: 10,
                          cursor: 'pointer',
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <div style={{
                    background: s.bg,
                    border: `1px solid ${s.accent}40`,
                    borderRadius: 6,
                    padding: '10px 14px',
                  }}>
                    <div style={{ fontFamily: s.mono, fontSize: 12, color: s.accent, marginBottom: 4 }}>
                      {distributionSteps[stepIdx].label}
                    </div>
                    <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2 }}>
                      {distributionSteps[stepIdx].detail}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
