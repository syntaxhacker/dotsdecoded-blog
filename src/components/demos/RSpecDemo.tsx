import { useState, useCallback, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
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

interface TestCase {
  id: string
  label: string
  code: string
  passes: boolean
  failureMessage: string
  duration: string
}

const tests: TestCase[] = [
  {
    id: 'valid-user',
    label: 'User is valid with email and password',
    code: `describe User do
  it "is valid with email and password" do
    user = User.new(
      email: "test@example.com",
      password: "secure123"
    )
    expect(user).to be_valid
  end
end`,
    passes: true,
    failureMessage: '',
    duration: '0.002s',
  },
  {
    id: 'invalid-no-email',
    label: 'User is invalid without email',
    code: `describe User do
  it "is invalid without email" do
    user = User.new(password: "secure123")
    user.valid?
    expect(user.errors[:email]).to include(
      "can't be blank"
    )
  end
end`,
    passes: true,
    failureMessage: '',
    duration: '0.001s',
  },
  {
    id: 'email-uniqueness',
    label: 'Email must be unique',
    code: `describe User do
  it "requires unique email" do
    User.create!(email: "taken@example.com",
                 password: "secret")
    dup = User.new(email: "taken@example.com",
                   password: "secret")
    expect(dup).not_to be_valid
    expect(dup.errors[:email]).to include(
      "has already been taken"
    )
  end
end`,
    passes: true,
    failureMessage: '',
    duration: '0.015s',
  },
  {
    id: 'password-length',
    label: 'Password must be 8+ characters',
    code: `describe User do
  it "rejects short passwords" do
    user = User.new(
      email: "test@example.com",
      password: "abc"
    )
    expect(user).not_to be_valid
    expect(user.errors[:password]).to include(
      "is too short (minimum is 8 characters)"
    )
  end
end`,
    passes: false,
    failureMessage: `Failure/Error: expect(user.errors[:password]).to include(
  "is too short (minimum is 8 characters)")
  expected ["is too short"] to include "is too short (minimum is 8 characters)"
  Diff:
  @@ -1,2 +1,2 @@
  -["is too short (minimum is 8 characters)"]
  +["is too short"]`,
    duration: '0.003s',
  },
  {
    id: 'email-format',
    label: 'Email format validation',
    code: `describe User do
  it "rejects invalid email format" do
    user = User.new(
      email: "not-an-email",
      password: "secure123"
    )
    expect(user).not_to be_valid
  end
end`,
    passes: true,
    failureMessage: '',
    duration: '0.001s',
  },
]

export default function RSpecDemo() {
  const [results, setResults] = useState<Record<string, { status: 'idle' | 'pass' | 'fail'; time: string }>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const runTest = useCallback((tc: TestCase) => {
    setResults((prev) => ({ ...prev, [tc.id]: { status: 'idle', time: '' } }))
    setTimeout(() => {
      setResults((prev) => ({
        ...prev,
        [tc.id]: {
          status: tc.passes ? 'pass' : 'fail',
          time: tc.duration,
        },
      }))
    }, 400 + Math.random() * 600)
  }, [])

  const runAll = useCallback(() => {
    setResults({})
    tests.forEach((tc, idx) => {
      setTimeout(() => {
        setResults((prev) => ({
          ...prev,
          [tc.id]: {
            status: tc.passes ? 'pass' : 'fail',
            time: tc.duration,
          },
        }))
      }, 300 + idx * 350 + Math.random() * 200)
    })
  }, [])

  const expandedTest = tests.find((t) => t.id === expandedId)
  const passCount = Object.values(results).filter((r) => r.status === 'pass').length
  const failCount = Object.values(results).filter((r) => r.status === 'fail').length
  const totalCount = tests.length
  const doneCount = Object.values(results).filter((r) => r.status !== 'idle').length

  const expandedCodeHtml = useMemo(() => {
    if (!expandedTest) return ''
    return Prism.highlight(expandedTest.code, Prism.languages.ruby, 'ruby')
  }, [expandedTest])

  return (
    <DemoBoundary name="RSpec Test Runner">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>spec/models/user_spec.rb</div>
            {doneCount > 0 && (
              <div style={{ display: 'flex', gap: 8, fontFamily: s.mono, fontSize: 12 }}>
                <span style={{ color: s.green }}>{passCount} passed</span>
                {failCount > 0 && <span style={{ color: s.red }}>{failCount} failed</span>}
                <span style={{ color: s.text3 }}>{doneCount}/{totalCount}</span>
              </div>
            )}
          </div>
          <button
            onClick={runAll}
            style={{
              background: s.bg3,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
              padding: '6px 14px',
              color: s.text2,
              fontFamily: s.mono,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Run All
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tests.map((tc) => {
            const result = results[tc.id]
            const isExpanded = expandedId === tc.id
            const isRunning = result?.status === 'idle'
            const isDone = result?.status === 'pass' || result?.status === 'fail'

            return (
              <div key={tc.id} style={{ border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : tc.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    background: isExpanded ? s.bg2 : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: s.mono,
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                    color: isDone ? (result.status === 'pass' ? s.green : s.red) : isRunning ? s.yellow : s.text3,
                    background: isDone
                      ? result.status === 'pass'
                        ? `${s.green}22`
                        : `${s.red}22`
                      : isRunning
                        ? `${s.yellow}22`
                        : `${s.bg3}`,
                  }}>
                    {isDone ? (result.status === 'pass' ? '.' : 'F') : isRunning ? '~' : '-'}
                  </div>
                  <span style={{ color: isDone ? s.text : s.text2, fontSize: 13, flex: 1 }}>{tc.label}</span>
                  {result?.time && <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>{result.time}</span>}
                  <button
                    onClick={(e) => { e.stopPropagation(); runTest(tc) }}
                    style={{
                      background: s.bg3,
                      border: `1px solid ${s.border}`,
                      borderRadius: 4,
                      padding: '3px 10px',
                      color: s.text3,
                      fontFamily: s.mono,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    Run
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${s.border}`, background: s.bg }}>
                    <div className="rdc" style={{ padding: 14, overflowX: 'auto' }}>
                      <div style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 12, lineHeight: 1.6 }}>
                        <style>{`
.rdc code .token.keyword { color: #f92672; }
.rdc code .token.string, .rdc code .token.char, .rdc code .token.builtin, .rdc code .token.inserted { color: #e6db74; }
.rdc code .token.number, .rdc code .token.constant, .rdc code .token.symbol, .rdc code .token.property, .rdc code .token.tag, .rdc code .token.boolean, .rdc code .token.deleted { color: #ae81ff; }
.rdc code .token.selector, .rdc code .token.attr-name { color: #f92672; }
.rdc code .token.attr-value, .rdc code .token.atrule { color: #e6db74; }
.rdc code .token.function, .rdc code .token.class-name { color: #a6e22e; }
.rdc code .token.operator, .rdc code .token.entity, .rdc code .token.url, .rdc code .token.punctuation { color: #f8f8f2; }
.rdc code .token.comment, .rdc code .token.prolog, .rdc code .token.doctype, .rdc code .token.cdata { color: #75715e; font-style: italic; }
.rdc code .token.parameter, .rdc code .token.variable, .rdc code .token.regex, .rdc code .token.important { color: #fd971f; }
`}</style>
                        <code dangerouslySetInnerHTML={{ __html: expandedCodeHtml }} />
                      </div>
                    </div>
                    {isDone && result.status === 'fail' && tc.failureMessage && (
                      <div style={{ padding: '12px 14px', borderTop: `1px solid ${s.red}33`, background: `${s.red}0a` }}>
                        <div style={{ color: s.red, fontSize: 11, fontFamily: s.mono, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Failure</div>
                        <div style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 11, lineHeight: 1.5, color: s.red }}>
                          {tc.failureMessage}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {expandedTest && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}` }}>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 4 }}>PRO TIP</div>
            <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
              {expandedTest.passes
                ? 'This test passes because the assertion matches the actual behavior of the code under test.'
                : 'This test fails because the expected error message does not match what the model actually produces. The fix: update the expectation to match the real message, or change the validation to produce the expected message.'}
            </div>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
