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

type PageState = 'form' | 'success' | 'error'

export default function CapybaraDemo() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [page, setPage] = useState<PageState>('form')
  const [steps, setSteps] = useState<Array<{ action: string; code: string; assertion?: string; pass?: boolean }>>([])
  const [showCode, setShowCode] = useState(false)

  const addStep = useCallback((action: string, code: string, assertion?: string, pass?: boolean) => {
    setSteps((prev) => [...prev, { action, code, assertion, pass }])
  }, [])

  const handleVisit = useCallback(() => {
    setPage('form')
    setEmail('')
    setPassword('')
    setSteps([])
    addStep('Navigate to the sign-up page', 'visit "/users/sign_up"')
  }, [addStep])

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value)
    if (value && !steps.some((st) => st.code.startsWith('fill_in "Email"'))) {
      addStep('Fill in the email field', 'fill_in "Email", with: "user@example.com"')
    }
  }, [steps, addStep])

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value)
    if (value && !steps.some((st) => st.code.startsWith('fill_in "Password"'))) {
      addStep('Fill in the password field', 'fill_in "Password", with: "********"')
    }
  }, [steps, addStep])

  const handleSubmit = useCallback(() => {
    const hasEmail = email.includes('@')
    const hasPass = password.length >= 6

    if (hasEmail && hasPass) {
      addStep('Click the sign-up button', 'click_button "Sign Up"', 'expect(page).to have_text "Welcome"', true)
      setPage('success')
    } else {
      addStep('Click the sign-up button', 'click_button "Sign Up"', 'expect(page).to have_text "error"', false)
      setPage('error')
    }
  }, [email, password, steps, addStep])

  const handleReset = useCallback(() => {
    setPage('form')
    setEmail('')
    setPassword('')
    setSteps([])
  }, [])

  const capybaraCodeHtml = useMemo(() => {
    const lines = [
      'require "rails_helper"',
      '',
      'RSpec.describe "Sign Up", type: :system do',
      '  it "creates a new account" do',
    ]
    steps.forEach((step) => {
      lines.push(`    ${step.code}`)
      if (step.assertion) {
        lines.push(`    ${step.assertion}`)
      }
    })
    lines.push('  end', 'end')
    return Prism.highlight(lines.join('\n'), Prism.languages.ruby, 'ruby')
  }, [steps])

  return (
    <DemoBoundary name="Capybara Browser Simulator">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <button
            onClick={handleVisit}
            style={{ background: s.accent, border: 'none', borderRadius: 6, padding: '7px 16px', color: '#fff', fontFamily: s.mono, fontSize: 12, cursor: 'pointer' }}
          >
            visit "/users/sign_up"
          </button>
          <button
            onClick={() => setShowCode(!showCode)}
            style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '7px 16px', color: s.text2, fontFamily: s.mono, fontSize: 12, cursor: 'pointer' }}
          >
            {showCode ? 'Hide Code' : 'Show Code'}
          </button>
          {steps.length > 0 && (
            <button
              onClick={handleReset}
              style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '7px 16px', color: s.text2, fontFamily: s.mono, fontSize: 12, cursor: 'pointer' }}
            >
              Reset
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ background: s.bg3, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${s.border}` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.red }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.yellow }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green }} />
                <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginLeft: 8 }}>localhost:3000/users/sign_up</span>
              </div>

              <div style={{ padding: 24 }}>
                {page === 'form' || page === 'error' ? (
                  <div>
                    <div style={{ color: s.text, fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Create Account</div>
                    <div style={{ color: s.text3, fontSize: 13, marginBottom: 20 }}>Join us today</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <label style={{ color: s.text2, fontSize: 12, fontFamily: s.mono, display: 'block', marginBottom: 6 }}>Email</label>
                        <input
                          type="text"
                          value={email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          placeholder="you@example.com"
                          style={{
                            background: s.bg, border: `1px solid ${page === 'error' && !email.includes('@') ? s.red : s.border}`,
                            borderRadius: 6, padding: '8px 12px', color: s.text, fontFamily: s.mono, fontSize: 13,
                            outline: 'none', width: '100%', boxSizing: 'border-box',
                          }}
                        />
                        {page === 'error' && !email.includes('@') && (
                          <div style={{ color: s.red, fontSize: 11, fontFamily: s.mono, marginTop: 4 }}>Email is invalid</div>
                        )}
                      </div>
                      <div>
                        <label style={{ color: s.text2, fontSize: 12, fontFamily: s.mono, display: 'block', marginBottom: 6 }}>Password</label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                          placeholder="6+ characters"
                          style={{
                            background: s.bg, border: `1px solid ${page === 'error' && password.length < 6 ? s.red : s.border}`,
                            borderRadius: 6, padding: '8px 12px', color: s.text, fontFamily: s.mono, fontSize: 13,
                            outline: 'none', width: '100%', boxSizing: 'border-box',
                          }}
                        />
                        {page === 'error' && password.length < 6 && (
                          <div style={{ color: s.red, fontSize: 11, fontFamily: s.mono, marginTop: 4 }}>Password is too short (minimum is 6 characters)</div>
                        )}
                      </div>
                      <button
                        onClick={handleSubmit}
                        style={{ background: s.accent, border: 'none', borderRadius: 6, padding: '10px 20px', color: '#fff', fontFamily: s.mono, fontSize: 13, cursor: 'pointer', marginTop: 4, width: '100%' }}
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', background: `${s.green}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                      color: s.green, fontSize: 24, fontFamily: s.mono, fontWeight: 700,
                    }}>+</div>
                    <div style={{ color: s.text, fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Welcome!</div>
                    <div style={{ color: s.text2, fontSize: 13, marginBottom: 16 }}>Your account has been created successfully.</div>
                    <button onClick={handleReset} style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '7px 16px', color: s.text2, fontFamily: s.mono, fontSize: 12, cursor: 'pointer' }}>Start Over</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showCode && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: s.bg3, padding: '8px 14px', borderBottom: `1px solid ${s.border}`, color: s.text3, fontSize: 11, fontFamily: s.mono }}>
                  Generated Capybara Code
                </div>
                <div style={{ padding: 14, maxHeight: 340, overflowY: 'auto' }}>
                  {steps.length === 0 ? (
                    <div style={{ color: s.text3, fontSize: 12, fontFamily: s.mono, fontStyle: 'italic' }}>
                      Interact with the form to see code...
                    </div>
                  ) : (
                    <div className="capc" style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 12, lineHeight: 1.7, overflowX: 'auto' }}>
                      <style>{`
.capc code .token.keyword { color: #f92672; }
.capc code .token.string, .capc code .token.char, .capc code .token.builtin, .capc code .token.inserted { color: #e6db74; }
.capc code .token.number, .capc code .token.constant, .capc code .token.symbol, .capc code .token.property, .capc code .token.tag, .capc code .token.boolean, .capc code .token.deleted { color: #ae81ff; }
.capc code .token.selector, .capc code .token.attr-name { color: #f92672; }
.capc code .token.attr-value, .capc code .token.atrule { color: #e6db74; }
.capc code .token.function, .capc code .token.class-name { color: #a6e22e; }
.capc code .token.operator, .capc code .token.entity, .capc code .token.url, .capc code .token.punctuation { color: #f8f8f2; }
.capc code .token.comment, .capc code .token.prolog, .capc code .token.doctype, .capc code .token.cdata { color: #75715e; font-style: italic; }
.capc code .token.parameter, .capc code .token.variable, .capc code .token.regex, .capc code .token.important { color: #fd971f; }
`}</style>
                      <code dangerouslySetInnerHTML={{ __html: capybaraCodeHtml }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DemoBoundary>
  )
}
