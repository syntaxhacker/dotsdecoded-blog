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

const identityCode = `function identity<T>(arg: T): T {
  return arg
}

const a = identity(42)    // T inferred as 42
const b = identity('hi')  // T inferred as 'hi'
`

const constrainedCode = `function getLength<T extends { length: number }>(arg: T): number {
  return arg.length
}

getLength('hello')   // OK: string has length
getLength([1, 2, 3]) // OK: array has length
// getLength(42)     // Error: number has no length
`

const interfaceCode = `interface ApiResponse<T> {
  data: T
  status: number
  error: string | null
}

interface User { name: string; email: string }

const resp: ApiResponse<User> = {
  data: { name: 'alice', email: 'a@b.com' },
  status: 200,
  error: null,
}
`

const unconstrainedCode = `function getLengthUnsafe<T>(arg: T): number {
  // Error: Property 'length' does not exist on type 'T'
  // return arg.length

  // Without extends, T could be anything
  // number, boolean, object, etc.
  return 0
}
`

const sections = [
  { id: 'identity', label: 'Identity Function', code: identityCode },
  { id: 'constrained', label: 'Constrained Generic', code: constrainedCode },
  { id: 'interface', label: 'Generic Interface', code: interfaceCode },
  { id: 'unconstrained', label: 'Without Constraint', code: unconstrainedCode },
]

export default function TsGenericsDemo() {
  const [active, setActive] = useState('identity')
  const [showInference, setShowInference] = useState(false)
  const [inferenceStep, setInferenceStep] = useState(0)

  const highlighted = useMemo(() => {
    const map: Record<string, string> = {}
    for (const section of sections) {
      map[section.id] = Prism.highlight(section.code, Prism.languages.typescript, 'typescript')
    }
    return map
  }, [])

  const activeSec = sections.find(se => se.id === active) || sections[0]

  const inferenceSteps = [
    { label: 'Call: identity(42)', detail: 'TypeScript sees argument type 42 (numeric literal)' },
    { label: 'T is inferred as 42', detail: 'No explicit type argument needed — TypeScript infers T from the argument' },
    { label: 'Return type is T = 42', detail: 'The return type matches the input type exactly, preserving the literal' },
    { label: 'Call: identity("hi")', detail: 'TypeScript sees argument type "hi" (string literal)' },
    { label: 'T is inferred as "hi"', detail: 'Each call gets its own T inference' },
    { label: 'Return type is T = "hi"', detail: 'Type information is preserved through the generic' },
  ]

  return (
    <DemoBoundary name="TypeScript Generics">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{`
          .tsg-code .token.keyword { color: #f92672; }
          .tsg-code .token.string, .tsg-code .token.char, .tsg-code .token.builtin, .tsg-code .token.inserted { color: #e6db74; }
          .tsg-code .token.number, .tsg-code .token.constant, .tsg-code .token.symbol, .tsg-code .token.property, .tsg-code .token.tag, .tsg-code .token.boolean, .tsg-code .token.deleted { color: #ae81ff; }
          .tsg-code .token.selector, .tsg-code .token.attr-name { color: #f92672; }
          .tsg-code .token.attr-value, .tsg-code .token.atrule { color: #e6db74; }
          .tsg-code .token.function, .tsg-code .token.class-name { color: #a6e22e; }
          .tsg-code .token.operator, .tsg-code .token.entity, .tsg-code .token.url, .tsg-code .token.punctuation { color: #f8f8f2; }
          .tsg-code .token.comment, .tsg-code .token.prolog, .tsg-code .token.doctype, .tsg-code .token.cdata { color: #75715e; font-style: italic; }
          .tsg-code .token.parameter, .tsg-code .token.variable, .tsg-code .token.regex, .tsg-code .token.important { color: #fd971f; }
        `}</style>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {sections.map(se => (
            <button
              key={se.id}
              onClick={() => setActive(se.id)}
              style={{
                padding: '7px 16px',
                background: active === se.id ? s.accent : s.bg2,
                border: `1px solid ${active === se.id ? s.accent : s.border}`,
                borderRadius: 6,
                color: active === se.id ? '#fff' : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                fontWeight: active === se.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {se.label}
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
          <div style={{
            padding: '10px 16px',
            borderBottom: `1px solid ${s.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3 }}>
              TypeScript Playground
            </span>
            <span style={{
              fontFamily: s.mono, fontSize: 10,
              color: active === 'unconstrained' ? s.red : s.green,
            }}>
              {active === 'unconstrained' ? 'Error: missing constraint' : 'Valid'}
            </span>
          </div>
          <div style={{
            padding: 16,
            fontFamily: s.mono,
            fontSize: 13,
            lineHeight: 1.7,
            overflowX: 'auto',
          }}>
            <code className="tsg-code" dangerouslySetInnerHTML={{ __html: highlighted[active] }} />
          </div>
        </div>

        {active === 'identity' && (
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
                Type Inference
              </span>
              <button
                onClick={() => {
                  setShowInference(!showInference)
                  setInferenceStep(0)
                }}
                style={{
                  padding: '4px 12px',
                  background: showInference ? s.accent : s.bg3,
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 10,
                  fontFamily: s.mono,
                  cursor: 'pointer',
                }}
              >
                {showInference ? 'Reset' : 'Step Through Inference'}
              </button>
            </div>
            {showInference && (
              <div style={{ padding: 12 }}>
                <div style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 12,
                  flexWrap: 'wrap',
                }}>
                  {inferenceSteps.map((st, i) => (
                    <button
                      key={i}
                      onClick={() => setInferenceStep(i)}
                      style={{
                        padding: '5px 10px',
                        background: i === inferenceStep ? s.accent : i < inferenceStep ? `${s.green}20` : s.bg3,
                        border: `1px solid ${i === inferenceStep ? s.accent : i < inferenceStep ? s.green : s.border}`,
                        borderRadius: 4,
                        color: i === inferenceStep ? '#fff' : i < inferenceStep ? s.green : s.text3,
                        fontFamily: s.mono,
                        fontSize: 10,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {i < inferenceStep ? '\u2713 ' : ''}{i + 1}
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
                    {inferenceSteps[inferenceStep].label}
                  </div>
                  <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
                    {inferenceSteps[inferenceStep].detail}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {active === 'constrained' && (
          <div style={{
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            padding: '12px 16px',
          }}>
            <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Constraint Check
            </div>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: s.green }}>OK</span>
                <span>getLength('hello') - string has .length</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: s.green }}>OK</span>
                <span>getLength([1, 2]) - array has .length</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: s.red }}>ERR</span>
                <span>getLength(42) - number has no .length</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
