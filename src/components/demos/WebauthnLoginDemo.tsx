import { useState, useEffect, useCallback, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'
import Prism from 'prismjs'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const steps = [
  { title: 'Ready to Login', desc: 'Click Next to begin the WebAuthn authentication (assertion) ceremony.' },
  { title: 'Server Sends Challenge', desc: 'The server generates a fresh random challenge and sends it to the client along with the relying party ID.' },
  { title: 'Get Credential', desc: 'The browser calls navigator.credentials.get() with the challenge and credential options.' },
  { title: 'User Verification', desc: 'The authenticator prompts the user for fingerprint, face scan, or PIN to authorize the signing operation.' },
  { title: 'Sign Challenge', desc: 'The authenticator retrieves the private key from secure storage and signs the challenge.' },
  { title: 'Build Assertion', desc: 'The authenticator builds the assertion response containing the signature and authenticator data.' },
  { title: 'Server Verifies', desc: 'The server extracts the credential ID, looks up the stored public key, and verifies the signature.' },
  { title: 'Authenticated', desc: 'The signature is valid. The server issues a session token and grants access.' },
]

const getCode = `const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: new Uint8Array([...]),
    allowCredentials: [{
      type: "public-key",
      id: new Uint8Array([...])
    }],
    userVerification: "required"
  }
});`

const assertionCode = `{
  id: "AagGx...3Dsf",
  type: "public-key",
  response: {
    clientDataJSON: {
      type: "webauthn.get",
      challenge: "...",
      origin: "https://example.com"
    },
    authenticatorData: {
      rpIdHash: "4996...",
      flags: { UP: 1, UV: 1 },
      counter: 1
    },
    signature: "3045..."
  }
}`

const MAX_STEP = 7

export default function WebauthnLoginDemo() {
  const [step, setStep] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [speed, setSpeed] = useState(50)

  const highlightedGet = useMemo(
    () => Prism.highlight(getCode, Prism.languages.javascript, 'javascript'), []
  )
  const highlightedAssertion = useMemo(
    () => Prism.highlight(assertionCode, Prism.languages.javascript, 'javascript'), []
  )

  const goNext = useCallback(() => {
    setStep(prev => Math.min(prev + 1, MAX_STEP))
  }, [])
  const goPrev = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 0))
  }, [])
  const reset = useCallback(() => {
    setStep(0)
    setAutoPlay(false)
  }, [])

  useEffect(() => {
    if (!autoPlay) return
    const id = setInterval(() => {
      setStep(prev => {
        if (prev >= MAX_STEP) {
          setAutoPlay(false)
          return prev
        }
        return prev + 1
      })
    }, getStepDelay(2000, speed))
    return () => clearInterval(id)
  }, [autoPlay, speed])

  const challengeHex = 'f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5'

  const renderContent = () => {
    const st = steps[step]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: s.purple, fontFamily: s.mono, fontSize: 12, fontWeight: 600 }}>
            Step {step} of {MAX_STEP}
          </div>
          <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>assertion</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: s.text }}>{st.title}</div>
        <div style={{ color: s.text2, fontSize: 14, lineHeight: 1.6 }}>{st.desc}</div>
        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10,
          padding: 16, minHeight: 100,
        }}>
          {step === 0 && (
            <div style={{ color: s.text3, fontStyle: 'italic', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              Press Next Step to start authentication
            </div>
          )}
          {step === 1 && (
            <div>
              <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Challenge from Server
              </div>
              <div style={{
                fontFamily: s.mono, fontSize: 13, color: s.purple,
                wordBreak: 'break-all', lineHeight: 1.8,
                background: `${s.purple}08`, borderRadius: 8, padding: 12,
              }}>
                {challengeHex}
              </div>
              <div style={{ color: s.text3, fontSize: 11, marginTop: 8 }}>
                The server also sends: rpId: example.com, timeout: 60000
              </div>
            </div>
          )}
          {step === 2 && (
            <div style={{ whiteSpace: 'pre', fontSize: 12, lineHeight: 1.6, overflowX: 'auto' }}>
              <code dangerouslySetInnerHTML={{ __html: highlightedGet }} />
            </div>
          )}
          {step === 3 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '12px 0' }}>
              <div style={{
                width: 80, height: 80, borderRadius: 16,
                border: `2px solid ${s.purple}`, background: `${s.purple}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4,
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={s.purple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span style={{ color: s.purple, fontSize: 9, fontWeight: 600 }}>Face ID</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, color: s.text3, fontSize: 13,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.yellow }} />
                  Awaiting biometric verification...
                </div>
                <div style={{ color: s.text3, fontSize: 11 }}>
                  Look at the camera or touch the sensor
                </div>
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Signing Operation
              </div>
              <div style={{
                fontFamily: s.mono, fontSize: 11, background: s.bg2, borderRadius: 8, padding: 12, lineHeight: 1.8,
              }}>
                <div style={{ color: s.text3 }}>Private key (P-256) used to sign:</div>
                <div style={{ color: s.accent, wordBreak: 'break-all', margin: '8px 0' }}>{challengeHex.slice(0, 32)}...</div>
                <div style={{ color: s.text3 }}>Algorithm: ES256 | Signature scheme: ECDSA</div>
                <div style={{ color: s.green, marginTop: 8 }}>Signature: 3045022100a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b202...</div>
              </div>
            </div>
          )}
          {step === 5 && (
            <div style={{ whiteSpace: 'pre', fontSize: 11, lineHeight: 1.5, overflowX: 'auto' }}>
              <code dangerouslySetInnerHTML={{ __html: highlightedAssertion }} />
            </div>
          )}
          {step === 6 && (
            <div>
              <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Verification
              </div>
              <div style={{
                fontFamily: s.mono, fontSize: 12,
                background: s.bg2, borderRadius: 8, padding: 12, lineHeight: 1.8,
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green }} />
                  <span style={{ color: s.text }}>Lookup credential AagGx...3Dsf</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green }} />
                  <span style={{ color: s.text }}>Retrieve stored public key</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green }} />
                  <span style={{ color: s.text }}>Verify signature against challenge</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green }} />
                  <span style={{ color: s.text }}>Check counter value (1 &gt; 0)</span>
                </div>
              </div>
            </div>
          )}
          {step === 7 && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: `${s.green}15`, border: `2px solid ${s.green}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={s.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div style={{ color: s.green, fontWeight: 700, fontSize: 16 }}>Authentication Successful</div>
              <div style={{ color: s.text3, fontSize: 13, marginTop: 8 }}>
                Session token issued. Access granted.
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <DemoBoundary name="WebAuthn Login Flow">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <style>{`
        code .token.keyword { color: #f92672; }
        code .token.string, code .token.char, code .token.builtin, code .token.inserted { color: #e6db74; }
        code .token.number, code .token.constant, code .token.symbol, code .token.property, code .token.tag, code .token.boolean, code .token.deleted { color: #ae81ff; }
        code .token.selector, code .token.attr-name { color: #f92672; }
        code .token.attr-value, code .token.atrule { color: #e6db74; }
        code .token.function, code .token.class-name { color: #a6e22e; }
        code .token.operator, code .token.entity, code .token.url, code .token.punctuation { color: #f8f8f2; }
        code .token.comment, code .token.prolog, code .token.doctype, code .token.cdata { color: #75715e; font-style: italic; }
        code .token.parameter, code .token.variable, code .token.regex, code .token.important { color: #fd971f; }
      `}</style>
      <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
        {steps.map((st, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= step ? s.purple : s.bg3,
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      {renderContent()}
      <div style={{ display: 'flex', gap: 8, marginTop: 20, alignItems: 'center' }}>
        <button onClick={reset} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: '8px 16px', color: s.text2, cursor: 'pointer', fontSize: 12,
        }}>Reset</button>
        <button onClick={goPrev} disabled={step === 0} style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: '8px 16px', color: step === 0 ? s.text3 : s.text,
          cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: 12,
          opacity: step === 0 ? 0.4 : 1,
        }}>Back</button>
        <button onClick={goNext} disabled={step >= MAX_STEP} style={{
          background: s.purple, border: 'none', borderRadius: 8,
          padding: '8px 16px', color: '#fff',
          cursor: step >= MAX_STEP ? 'not-allowed' : 'pointer',
          fontSize: 12, fontWeight: 600,
          opacity: step >= MAX_STEP ? 0.4 : 1, flex: 1,
        }}>{step >= MAX_STEP ? 'Complete' : 'Next Step'}</button>
        <button onClick={() => setAutoPlay(p => !p)} style={{
          background: autoPlay ? s.green : s.bg3,
          border: `1px solid ${autoPlay ? s.green : s.border}`,
          borderRadius: 8, padding: '8px 16px',
          color: autoPlay ? '#000' : s.text2, cursor: 'pointer', fontSize: 12,
        }}>{autoPlay ? 'Stop' : 'Auto'}</button>
        <SpeedController speed={speed} onSpeedChange={setSpeed} />
      </div>
    </div>
    </DemoBoundary>
  )
}
