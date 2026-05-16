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

interface InferExample {
  id: string
  label: string
  definition: string
  usage: string
  result: string
  detail: string
  steps: { label: string; detail: string }[]
}

const examples: InferExample[] = [
  {
    id: 'returntype',
    label: 'ReturnType<T>',
    definition: `type ReturnType<T> =
  T extends (...args: any[]) => infer R
    ? R
    : never`,
    usage: `function greet(name: string): string {
  return "Hello, " + name
}

type R = ReturnType<typeof greet>`,
    result: 'string',
    detail: 'TypeScript matches the function signature and infers R from the return type annotation.',
    steps: [
      { label: 'T = typeof greet', detail: 'The function type (name: string) => string' },
      { label: 'Match signature', detail: 'T extends (...args: any[]) => infer R ?' },
      { label: 'Infer R = string', detail: 'The return type of greet is string, so R = string' },
      { label: 'Result: string', detail: 'Conditional resolves to the true branch: R' },
    ],
  },
  {
    id: 'parameters',
    label: 'Parameters<T>',
    definition: `type Parameters<T> =
  T extends (...args: infer P) => any
    ? P
    : never`,
    usage: `function fetchUser(id: number, cache: boolean): Promise<User> {
  return api.get("/users/" + id, { cache })
}

type P = Parameters<typeof fetchUser>`,
    result: '[id: number, cache: boolean]',
    detail: 'TypeScript infers the entire parameter tuple, preserving labels and types.',
    steps: [
      { label: 'T = typeof fetchUser', detail: 'The function type (id: number, cache: boolean) => Promise<User>' },
      { label: 'Match signature', detail: 'T extends (...args: infer P) => any ?' },
      { label: 'Infer P = [id: number, cache: boolean]', detail: 'The entire parameter list is captured as a tuple' },
      { label: 'Result: [id: number, cache: boolean]', detail: 'Parameter names and types are preserved' },
    ],
  },
  {
    id: 'instance',
    label: 'InstanceType<T>',
    definition: `type InstanceType<T> =
  T extends abstract new (...args: any[]) => infer R
    ? R
    : never`,
    usage: `class UserService {
  constructor(private db: Database) {}
  async getUser(id: string) { ... }
}

type Service = InstanceType<typeof UserService>`,
    result: 'UserService',
    detail: 'InstanceType matches constructor signatures and infers the instance type.',
    steps: [
      { label: 'T = typeof UserService', detail: 'The constructor type new (db: Database) => UserService' },
      { label: 'Match constructor', detail: 'T extends abstract new (...args: any[]) => infer R ?' },
      { label: 'Infer R = UserService', detail: 'The instance type of the class' },
      { label: 'Result: UserService', detail: 'InstanceType gives you the class instance type' },
    ],
  },
  {
    id: 'custom',
    label: 'Custom: Unwrap Array',
    definition: `type ElementType<T> =
  T extends (infer U)[]
    ? U
    : T`,
    usage: `type Items = ElementType<string[]>
type Single = ElementType<number>`,
    result: 'string (for string[])',
    detail: 'Custom infer pattern: extract element type from an array.',
    steps: [
      { label: 'T = string[]', detail: 'Array type matches the pattern (infer U)[]' },
      { label: 'Match array', detail: 'string[] extends (infer U)[] ?' },
      { label: 'Infer U = string', detail: 'The element type of the array is string' },
      { label: 'Result: string', detail: 'For non-array T, returns T unchanged' },
    ],
  },
]

export default function TsInferDemo() {
  const [active, setActive] = useState('returntype')
  const [stepIdx, setStepIdx] = useState(0)

  const current = examples.find(ex => ex.id === active) || examples[0]

  const highlighted = useMemo(() => {
    const map: Record<string, { def: string; usage: string }> = {}
    for (const ex of examples) {
      map[ex.id] = {
        def: Prism.highlight(ex.definition, Prism.languages.typescript, 'typescript'),
        usage: Prism.highlight(ex.usage, Prism.languages.typescript, 'typescript'),
      }
    }
    return map
  }, [])

  return (
    <DemoBoundary name="TypeScript infer Keyword">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{`
          .tsi-code .token.keyword { color: #f92672; }
          .tsi-code .token.string, .tsi-code .token.char, .tsi-code .token.builtin, .tsi-code .token.inserted { color: #e6db74; }
          .tsi-code .token.number, .tsi-code .token.constant, .tsi-code .token.symbol, .tsi-code .token.property, .tsi-code .token.tag, .tsi-code .token.boolean, .tsi-code .token.deleted { color: #ae81ff; }
          .tsi-code .token.selector, .tsi-code .token.attr-name { color: #f92672; }
          .tsi-code .token.attr-value, .tsi-code .token.atrule { color: #e6db74; }
          .tsi-code .token.function, .tsi-code .token.class-name { color: #a6e22e; }
          .tsi-code .token.operator, .tsi-code .token.entity, .tsi-code .token.url, .tsi-code .token.punctuation { color: #f8f8f2; }
          .tsi-code .token.comment, .tsi-code .token.prolog, .tsi-code .token.doctype, .tsi-code .token.cdata { color: #75715e; font-style: italic; }
          .tsi-code .token.parameter, .tsi-code .token.variable, .tsi-code .token.regex, .tsi-code .token.important { color: #fd971f; }
        `}</style>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {examples.map(ex => (
            <button
              key={ex.id}
              onClick={() => { setActive(ex.id); setStepIdx(0) }}
              style={{
                padding: '7px 16px',
                background: active === ex.id ? s.accent : s.bg2,
                border: `1px solid ${active === ex.id ? s.accent : s.border}`,
                borderRadius: 6,
                color: active === ex.id ? '#fff' : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                fontWeight: active === ex.id ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexDirection: 'row', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px' }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '8px 14px',
                borderBottom: `1px solid ${s.border}`,
                fontFamily: s.mono, fontSize: 10, color: s.text3,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                Type Definition
              </div>
              <div style={{ padding: 14, fontFamily: s.mono, fontSize: 12.5, lineHeight: 1.7, overflowX: 'auto' }}>
                <code className="tsi-code" dangerouslySetInnerHTML={{ __html: highlighted[current.id]?.def || '' }} />
              </div>
            </div>
          </div>

          <div style={{ flex: '1 1 280px' }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '8px 14px',
                borderBottom: `1px solid ${s.border}`,
                fontFamily: s.mono, fontSize: 10, color: s.text3,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                Usage
              </div>
              <div style={{ padding: 14, fontFamily: s.mono, fontSize: 12.5, lineHeight: 1.7, overflowX: 'auto' }}>
                <code className="tsi-code" dangerouslySetInnerHTML={{ __html: highlighted[current.id]?.usage || '' }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: s.bg2,
          border: `1px solid ${s.accent}40`,
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          <div style={{
            padding: '8px 14px',
            borderBottom: `1px solid ${s.accent}20`,
            fontFamily: s.mono, fontSize: 10, color: s.text3,
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            Result
          </div>
          <div style={{ padding: 14 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: s.mono,
            }}>
              <span style={{
                background: s.accent,
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
              }}>
                {current.id === 'returntype' ? 'R' : current.id === 'parameters' ? 'P' : current.id === 'instance' ? 'R' : 'U'}
              </span>
              <span style={{
                fontSize: 16,
                color: s.text,
                fontWeight: 600,
              }}>
                {current.result}
              </span>
            </div>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, marginTop: 8, lineHeight: 1.5 }}>
              {current.detail}
            </div>
          </div>
        </div>

        <div style={{
          background: s.bg,
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
              Step-by-Step Inference
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {current.steps.map((st, i) => (
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
                  {i < stepIdx ? '\u2713 ' : ''}{i + 1}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{
              padding: '10px 14px',
              background: s.bg2,
              border: `1px solid ${s.accent}40`,
              borderRadius: 6,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 12, color: s.accent, marginBottom: 6, fontWeight: 600 }}>
                {current.steps[stepIdx].label}
              </div>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
                {current.steps[stepIdx].detail}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
