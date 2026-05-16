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

const stringManipTypes = [
  { name: 'Uppercase<S>', input: 'hello', output: 'HELLO', color: s.accent },
  { name: 'Lowercase<S>', input: 'HELLO', output: 'hello', color: s.green },
  { name: 'Capitalize<S>', input: 'hello', output: 'Hello', color: s.yellow },
  { name: 'Uncapitalize<S>', input: 'Hello', output: 'hello', color: s.purple },
]

const typeDefCode = `type EventName = \`on\${Capitalize<string>}\`
// Matches: "onClick", "onChange", "onSubmit"

type Handlers = {
  [E in Events as \`on\${Capitalize<E>}\`]: (e: any) => void
}`

const pathCode = `type ParseRoute<T extends string> =
  T extends \`\${infer Base}/:\${infer Param}\`
    ? { base: Base; param: Param }
    : { base: T; param: never }

type Route1 = ParseRoute<'users/:id'>
// { base: "users"; param: "id" }

type Route2 = ParseRoute<'posts/:slug/comments'>
// { base: "posts/:slug/comments"; param: never }
`

const recursivePathCode = `type PathParams<T extends string> =
  T extends \`\${string}:\${infer Param}/\${infer Rest}\`
    ? Param | PathParams<Rest>
    : T extends \`\${string}:\${infer Param}\`
      ? Param
      : never

type Params = PathParams<'/users/:userId/posts/:postId'>
// "userId" | "postId"
`

type Tab = 'string-manip' | 'event-handlers' | 'path-parsing' | 'recursive'

export default function TsTemplateLiteralDemo() {
  const [tab, setTab] = useState<Tab>('string-manip')
  const [customInput, setCustomInput] = useState('helloWorld')
  const [activeTransform, setActiveTransform] = useState('Uppercase')
  const [highlighted, setHighlighted] = useState({ path: false, recursive: false })

  const customResult = useMemo(() => {
    switch (activeTransform) {
      case 'Uppercase': return customInput.toUpperCase()
      case 'Lowercase': return customInput.toLowerCase()
      case 'Capitalize': return customInput.charAt(0).toUpperCase() + customInput.slice(1)
      case 'Uncapitalize': return customInput.charAt(0).toLowerCase() + customInput.slice(1)
      default: return customInput
    }
  }, [customInput, activeTransform])

  const highlightedCode = useMemo(() => {
    const map: Record<string, string> = {}
    map['defs'] = Prism.highlight(typeDefCode, Prism.languages.typescript, 'typescript')
    map['path'] = Prism.highlight(pathCode, Prism.languages.typescript, 'typescript')
    map['recursive'] = Prism.highlight(recursivePathCode, Prism.languages.typescript, 'typescript')
    return map
  }, [])

  return (
    <DemoBoundary name="TypeScript Template Literal Types">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{`
          .tsl-code .token.keyword { color: #f92672; }
          .tsl-code .token.string, .tsl-code .token.char, .tsl-code .token.builtin, .tsl-code .token.inserted { color: #e6db74; }
          .tsl-code .token.number, .tsl-code .token.constant, .tsl-code .token.symbol, .tsl-code .token.property, .tsl-code .token.tag, .tsl-code .token.boolean, .tsl-code .token.deleted { color: #ae81ff; }
          .tsl-code .token.selector, .tsl-code .token.attr-name { color: #f92672; }
          .tsl-code .token.attr-value, .tsl-code .token.atrule { color: #e6db74; }
          .tsl-code .token.function, .tsl-code .token.class-name { color: #a6e22e; }
          .tsl-code .token.operator, .tsl-code .token.entity, .tsl-code .token.url, .tsl-code .token.punctuation { color: #f8f8f2; }
          .tsl-code .token.comment, .tsl-code .token.prolog, .tsl-code .token.doctype, .tsl-code .token.cdata { color: #75715e; font-style: italic; }
          .tsl-code .token.parameter, .tsl-code .token.variable, .tsl-code .token.regex, .tsl-code .token.important { color: #fd971f; }
        `}</style>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { id: 'string-manip' as Tab, label: 'String Manipulation Types' },
            { id: 'event-handlers' as Tab, label: 'Event Handlers' },
            { id: 'path-parsing' as Tab, label: 'URL Path Parsing' },
            { id: 'recursive' as Tab, label: 'Recursive Parsing' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '7px 16px',
                background: tab === t.id ? s.accent : s.bg2,
                border: `1px solid ${tab === t.id ? s.accent : s.border}`,
                borderRadius: 6,
                color: tab === t.id ? '#fff' : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                fontWeight: tab === t.id ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'string-manip' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {stringManipTypes.map(t => (
                <div
                  key={t.name}
                  style={{
                    flex: '1 1 180px',
                    background: s.bg2,
                    border: `1px solid ${s.border}`,
                    borderRadius: 8,
                    padding: '12px 14px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontFamily: s.mono, fontSize: 11, color: t.color, marginBottom: 8, fontWeight: 600 }}>
                    {t.name}
                  </div>
                  <div style={{ fontFamily: s.mono, fontSize: 14, color: s.text, marginBottom: 4 }}>
                    {t.output}
                  </div>
                  <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
                    {'<'} {t.input} {'>'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '16px 20px',
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                Interactive: Try Your Own Input
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, display: 'block', marginBottom: 4 }}>
                    Input String
                  </label>
                  <input
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: s.bg2,
                      border: `1px solid ${s.border}`,
                      borderRadius: 6,
                      color: s.text,
                      fontFamily: s.mono,
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, display: 'block', marginBottom: 4 }}>
                    Transform
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['Uppercase', 'Lowercase', 'Capitalize', 'Uncapitalize'].map(t => (
                      <button
                        key={t}
                        onClick={() => setActiveTransform(t)}
                        style={{
                          padding: '7px 12px',
                          background: activeTransform === t ? s.accent : s.bg3,
                          border: `1px solid ${activeTransform === t ? s.accent : s.border}`,
                          borderRadius: 5,
                          color: activeTransform === t ? '#fff' : s.text2,
                          fontFamily: s.mono,
                          fontSize: 10,
                          cursor: 'pointer',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{
                marginTop: 12,
                padding: '10px 14px',
                background: s.bg2,
                border: `1px solid ${s.accent}40`,
                borderRadius: 6,
                fontFamily: s.mono,
                fontSize: 14,
                color: s.accent,
              }}>
                Result: type = &apos;{customResult}&apos;
              </div>
            </div>
          </div>
        )}

        {tab === 'event-handlers' && (
          <div>
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
                <code className="tsl-code" dangerouslySetInnerHTML={{ __html: highlightedCode['defs'] }} />
              </div>
            </div>

            <div style={{
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: 16,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Evaluated Handlers
              </div>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginBottom: 8 }}>
                {'{'}
              </div>
              {['click', 'focus', 'blur', 'submit'].map(event => (
                <div key={event} style={{
                  padding: '5px 12px 5px 20px',
                  fontFamily: s.mono, fontSize: 12,
                  color: s.text,
                }}>
                  <span style={{ color: s.accent }}>on{event.charAt(0).toUpperCase() + event.slice(1)}</span>:{' '}
                  <span style={{ color: s.text3 }}>(event: any) =&gt; void</span>
                </div>
              ))}
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginTop: 8 }}>
                {'}'}
              </div>
            </div>
          </div>
        )}

        {tab === 'path-parsing' && (
          <div>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: 16,
            }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}` }}>
                <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Path Parser Type
                </span>
              </div>
              <div style={{ padding: 16, fontFamily: s.mono, fontSize: 13, lineHeight: 1.7, overflowX: 'auto' }}>
                <code className="tsl-code" dangerouslySetInnerHTML={{ __html: highlightedCode['path'] }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { path: 'users/:id', base: 'users', param: 'id' },
                { path: 'posts/:slug', base: 'posts', param: 'slug' },
                { path: 'products/:productId', base: 'products', param: 'productId' },
              ].map(route => (
                <div
                  key={route.path}
                  style={{
                    flex: '1 1 200px',
                    background: s.bg2,
                    border: `1px solid ${s.border}`,
                    borderRadius: 8,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={() => setHighlighted({ ...highlighted, path: true })}
                  onMouseLeave={() => setHighlighted({ ...highlighted, path: false })}
                >
                  <div style={{ fontFamily: s.mono, fontSize: 12, color: s.text, marginBottom: 8 }}>
                    {route.path}
                  </div>
                  <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
                    {'{'} base: &quot;{route.base}&quot;; param: &quot;{route.param}&quot; {'}'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'recursive' && (
          <div>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: 16,
            }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}` }}>
                <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Recursive Path Parser
                </span>
              </div>
              <div style={{ padding: 16, fontFamily: s.mono, fontSize: 13, lineHeight: 1.7, overflowX: 'auto' }}>
                <code className="tsl-code" dangerouslySetInnerHTML={{ __html: highlightedCode['recursive'] }} />
              </div>
            </div>

            <div style={{
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: 16,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Recursive Evaluation: /users/:userId/posts/:postId
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { step: 1, match: 'userId', remaining: '/posts/:postId', result: 'userId | ...' },
                  { step: 2, match: 'postId', remaining: '(done)', result: 'postId' },
                ].map(step => (
                  <div
                    key={step.step}
                    style={{
                      padding: '10px 14px',
                      background: s.bg,
                      border: `1px solid ${s.accent}30`,
                      borderRadius: 6,
                      fontFamily: s.mono,
                      fontSize: 11,
                      lineHeight: 1.6,
                    }}
                  >
                    <div style={{ color: s.accent, marginBottom: 4 }}>
                      Step {step.step}: Extract param
                    </div>
                    <div style={{ color: s.text2 }}>
                      Match param: <span style={{ color: s.green }}>&quot;:{step.match}&quot;</span>
                    </div>
                    <div style={{ color: s.text3 }}>
                      Remaining: {step.remaining}
                    </div>
                  </div>
                ))}
                <div style={{
                  padding: '10px 14px',
                  background: s.bg,
                  border: `1px solid ${s.green}40`,
                  borderRadius: 6,
                  fontFamily: s.mono,
                  fontSize: 12,
                  color: s.green,
                }}>
                  Final result: &quot;userId&quot; | &quot;postId&quot;
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
