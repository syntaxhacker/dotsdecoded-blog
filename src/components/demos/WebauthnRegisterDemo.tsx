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
  { title: 'Ready to Register', desc: 'Click Next to begin the WebAuthn registration ceremony.' },
  { title: 'Generate Challenge', desc: 'The server creates a random 32-byte challenge to ensure the registration is fresh and cannot be replayed by attackers.' },
  { title: 'Create Credential', desc: 'The browser calls navigator.credentials.create() with publicKey options including the challenge, relying party info, and user details.' },
  { title: 'User Verification', desc: 'The platform authenticator prompts for fingerprint, face scan, or PIN to authorize key generation.' },
  { title: 'Key Generation', desc: 'The authenticator generates a new key pair using ES256 (ECDSA over P-256). The private key never leaves the secure hardware.' },
  { title: 'Build Attestation', desc: 'The authenticator signs the public key credential and builds the attestation object containing credential ID, public key, and signature.' },
  { title: 'Send to Server', desc: 'The client sends the attestation object to the server via POST /auth/register for validation and storage.' },
  { title: 'Credential Stored', desc: 'The server validates the attestation signature, verifies the challenge, and stores the credential for future authentication.' },
]

const createCode = `const credential = await navigator.credentials.create({
  publicKey: {
    challenge: new Uint8Array([...]),
    rp: { name: "Example Corp", id: "example.com" },
    user: {
      id: new Uint8Array([1,2,3,4]),
      name: "user@example.com",
      displayName: "User"
    },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    authenticatorSelection: {
      userVerification: "required"
    },
    attestation: "direct"
  }
});`

const attestationCode = `{
  id: "AagGx...3Dsf",
  type: "public-key",
  response: {
    clientDataJSON: { ... },
    attestationObject: {
      fmt: "packed",
      authData: {
        rpIdHash: "4996...",
        flags: { UP: 1, UV: 1, AT: 1 },
        counter: 0,
        credentialData: {
          aaguid: "d41e...",
          credentialId: "AagGx...3Dsf",
          publicKey: { ... }
        }
      },
      attStmt: { alg: -7, sig: "..." }
    }
  }
}`

const MAX_STEP = 7

export default function WebauthnRegisterDemo() {
  const [step, setStep] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [speed, setSpeed] = useState(50)

  const highlightedCreate = useMemo(
    () => Prism.highlight(createCode, Prism.languages.javascript, 'javascript'), []
  )
  const highlightedAttest = useMemo(
    () => Prism.highlight(attestationCode, Prism.languages.javascript, 'javascript'), []
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

  const challengeHex = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'

  const renderContent = () => {
    const st = steps[step]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: s.accent, fontFamily: s.mono, fontSize: 12, fontWeight: 600 }}>
            Step {step} of {MAX_STEP}
          </div>
          <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>registration</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: s.text }}>{st.title}</div>
        <div style={{ color: s.text2, fontSize: 14, lineHeight: 1.6 }}>{st.desc}</div>
        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10,
          padding: 16, minHeight: 100,
        }}>
          {step === 0 && (
            <div style={{ color: s.text3, fontStyle: 'italic', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              Press Next Step to start the registration ceremony
            </div>
          )}
          {step === 1 && (
            <div>
              <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Random Challenge (32 bytes)
              </div>
              <div style={{
                fontFamily: s.mono, fontSize: 13, color: s.accent,
                wordBreak: 'break-all', lineHeight: 1.8,
                background: `${s.accent}08`, borderRadius: 8, padding: 12,
              }}>
                {challengeHex}
              </div>
            </div>
          )}
          {step === 2 && (
            <div style={{ whiteSpace: 'pre', fontSize: 12, lineHeight: 1.6, overflowX: 'auto' }}>
              <code dangerouslySetInnerHTML={{ __html: highlightedCreate }} />
            </div>
          )}
          {step === 3 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '12px 0' }}>
              <div style={{
                width: 80, height: 80, borderRadius: 16,
                border: `2px solid ${s.accent}`, background: `${s.accent}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4,
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 3 4.58V17a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-2.42A5 5 0 0 0 17 10V7a5 5 0 0 0-5-5z"/>
                </svg>
                <span style={{ color: s.accent, fontSize: 9, fontWeight: 600 }}>Fingerprint</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, color: s.text3, fontSize: 13,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.yellow }} />
                  Awaiting user gesture...
                </div>
                <div style={{ color: s.text3, fontSize: 11 }}>
                  Touch the sensor or enter your PIN
                </div>
              </div>
            </div>
          )}
          {step === 4 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: s.bg2, borderRadius: 8, padding: 12 }}>
                <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>Algorithm</div>
                <div style={{ color: s.green, fontFamily: s.mono, fontSize: 13 }}>ES256</div>
              </div>
              <div style={{ background: s.bg2, borderRadius: 8, padding: 12 }}>
                <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>Curve</div>
                <div style={{ color: s.green, fontFamily: s.mono, fontSize: 13 }}>P-256</div>
              </div>
              <div style={{ background: s.bg2, borderRadius: 8, padding: 12 }}>
                <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>Public Key (04...)</div>
                <div style={{ color: s.yellow, fontFamily: s.mono, fontSize: 11, wordBreak: 'break-all' }}>
                  04a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
                </div>
              </div>
              <div style={{ background: s.bg2, borderRadius: 8, padding: 12 }}>
                <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>Private Key</div>
                <div style={{ color: s.red, fontFamily: s.mono, fontSize: 13 }}>Secure Enclave</div>
              </div>
            </div>
          )}
          {step === 5 && (
            <div style={{ whiteSpace: 'pre', fontSize: 11, lineHeight: 1.5, overflowX: 'auto' }}>
              <code dangerouslySetInnerHTML={{ __html: highlightedAttest }} />
            </div>
          )}
          {step === 6 && (
            <div>
              <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                POST /auth/register
              </div>
              <div style={{ background: s.bg2, borderRadius: 8, padding: 12, fontFamily: s.mono, fontSize: 12 }}>
                <div style={{ color: s.text3, marginBottom: 4 }}>credentialId:</div>
                <div style={{ color: s.accent, wordBreak: 'break-all', marginBottom: 12 }}>AagGx...3Dsf</div>
                <div style={{ color: s.text3, marginBottom: 4 }}>publicKey:</div>
                <div style={{ color: s.yellow, wordBreak: 'break-all' }}>04a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2</div>
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
              <div style={{ color: s.green, fontWeight: 700, fontSize: 16 }}>Registration Complete</div>
              <div style={{ color: s.text3, fontSize: 13, marginTop: 8 }}>
                Credential stored on server. The authenticator now holds the private key for future logins.
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <DemoBoundary name="WebAuthn Registration Flow">
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
            background: i <= step ? s.accent : s.bg3,
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
          background: s.accent, border: 'none', borderRadius: 8,
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
