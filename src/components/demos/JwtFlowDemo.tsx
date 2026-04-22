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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

const headerJson = JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2)
const payloadJson = JSON.stringify({ sub: '1234567890', name: 'Jane Doe', role: 'admin', iat: 1713744000 }, null, 2)

function b64Url(str: string) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const headerB64 = b64Url(headerJson)
const payloadB64 = b64Url(payloadJson)
const signatureB64 = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

interface Step {
  id: number
  label: string
  desc: string
  activeColor: string
}

const steps: Step[] = [
  { id: 0, label: 'User Sends Credentials', desc: 'The user submits their username and password to the login endpoint.', activeColor: s.accent },
  { id: 1, label: 'Server Verifies', desc: 'The server checks the credentials against the database. If valid, it creates a JWT.', activeColor: s.orange },
  { id: 2, label: 'JWT Created', desc: 'The server encodes the header, payload, and signs with its secret key.', activeColor: s.green },
  { id: 3, label: 'Token Sent to Client', desc: 'The server returns the JWT in the response. The client stores it (localStorage, cookie, or memory).', activeColor: s.purple },
  { id: 4, label: 'Client Sends Request', desc: 'The client includes the JWT in the Authorization header: Bearer <token>.', activeColor: s.accent },
  { id: 5, label: 'Server Verifies JWT', desc: 'The server decodes the header and payload, then verifies the signature using its secret key.', activeColor: s.green },
  { id: 6, label: 'Response Returned', desc: 'If the signature is valid and the token has not expired, the server processes the request.', activeColor: s.yellow },
]

export default function JwtFlowDemo() {
  const [step, setStep] = useState(-1)
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'expired' | 'tampered' | null>(null)

  const currentStep = step >= 0 && step < steps.length ? steps[step] : null
  const isComplete = step >= steps.length

  const tamperedPayloadB64 = useMemo(() => b64Url(JSON.stringify({ sub: '1234567890', name: 'Jane Doe', role: 'superadmin', iat: 1713744000 })), [])

  const displayPayload = tokenStatus === 'tampered' ? tamperedPayloadB64 : payloadB64
  const displaySig = tokenStatus === 'tampered' ? 'INVALID_SIGNATURE' : signatureB64

  const tokenParts = [
    { label: 'Header', value: headerB64, color: s.red, decoded: headerJson },
    { label: 'Payload', value: displayPayload, color: s.purple, decoded: tokenStatus === 'tampered' ? JSON.stringify({ sub: '1234567890', name: 'Jane Doe', role: 'superadmin', iat: 1713744000 }, null, 2) : payloadJson },
    { label: 'Signature', value: displaySig, color: s.green, decoded: tokenStatus === 'tampered' ? 'Signature verification FAILED!\nExpected: SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c\nGot: INVALID_SIGNATURE\n\nThe payload was tampered with (role changed from "admin" to "superadmin").' : 'HMACSHA256(\n  base64UrlEncode(header) + "." +\n  base64UrlEncode(payload),\n  your-256-bit-secret\n)' },
  ]

  const nextStep = () => {
    setStep(prev => prev + 1)
    setTokenStatus(null)
  }

  const reset = () => {
    setStep(-1)
    setTokenStatus(null)
  }

  return (
    <DemoBoundary name="JWT Authentication Flow">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>JWT Authentication Flow</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Click through each step to see how JWT authentication works. Then try submitting an expired or tampered token.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
          {steps.map((st, idx) => {
            const isActive = step === idx
            const isPast = step > idx
            return (
              <div key={st.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                background: isActive ? `${st.activeColor}12` : 'transparent',
                borderRadius: 8, border: `1px solid ${isActive ? st.activeColor : 'transparent'}`,
                borderLeft: `3px solid ${isPast ? st.activeColor : isActive ? st.activeColor : s.border}`,
                transition: 'all 0.3s',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isPast ? st.activeColor : isActive ? `${st.activeColor}30` : s.bg3,
                  color: isPast ? '#fff' : isActive ? st.activeColor : s.text3,
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {isPast ? '\u2713' : idx + 1}
                </div>
                <span style={{ color: isActive ? st.activeColor : isPast ? s.text2 : s.text3, fontSize: 13, fontWeight: isActive ? 700 : 500, flex: 1 }}>
                  {st.label}
                </span>
                {isActive && (
                  <span style={{ color: s.text2, fontSize: 12, maxWidth: 300, lineHeight: 1.4 }}>
                    {st.desc}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {(currentStep || isComplete) && (
          <div style={{ background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              {isComplete ? 'JWT Token Structure' : `Step ${step + 1}: ${currentStep?.label ?? ''}`}
            </div>
            {isComplete ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {tokenParts.map((part) => (
                    <div key={part.label} style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ color: s.text3, fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{part.label}</div>
                      <div style={{
                        background: s.bg, borderRadius: 6, padding: '8px 10px',
                        fontFamily: s.mono, fontSize: 10, color: part.color,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        border: `1px solid ${part.color}30`,
                      }}>
                        {part.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {tokenParts.map((part) => (
                    <div key={part.label + '-decoded'} style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ color: s.text3, fontSize: 10, marginBottom: 4 }}>{part.label} (decoded)</div>
                      <div style={{
                        background: s.bg, borderRadius: 6, padding: '8px 10px',
                        fontFamily: s.mono, fontSize: 10, color: part.color === s.green && tokenStatus === 'tampered' ? s.red : s.text2,
                        whiteSpace: 'pre-wrap', lineHeight: 1.5,
                        border: `1px solid ${part.color === s.green && tokenStatus === 'tampered' ? s.red : s.border}`,
                      }}>
                        {part.decoded}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={() => setTokenStatus('valid')} style={btnStyle(s.green, tokenStatus === 'valid')}>
                    Verify Valid Token
                  </button>
                  <button onClick={() => setTokenStatus('expired')} style={btnStyle(s.yellow, tokenStatus === 'expired')}>
                    Expired Token
                  </button>
                  <button onClick={() => setTokenStatus('tampered')} style={btnStyle(s.red, tokenStatus === 'tampered')}>
                    Tamper Payload
                  </button>
                </div>
                {tokenStatus && (
                  <div style={{
                    background: tokenStatus === 'valid' ? `${s.green}10` : `${s.red}10`,
                    border: `1px solid ${tokenStatus === 'valid' ? s.green : s.red}`,
                    borderRadius: 8, padding: '10px 14px', marginTop: 8,
                  }}>
                    <div style={{ color: tokenStatus === 'valid' ? s.green : s.red, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                      {tokenStatus === 'valid' ? '200 OK - Access Granted' : tokenStatus === 'expired' ? '401 Unauthorized - Token Expired' : '401 Unauthorized - Invalid Signature'}
                    </div>
                    <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
                      {tokenStatus === 'valid'
                        ? 'Signature verified. Payload intact. Token has not expired. User "Jane Doe" (role: admin) is authenticated.'
                        : tokenStatus === 'expired'
                        ? 'The "exp" claim shows this token expired at 2024-04-22T00:00:00Z. The client must obtain a new token by logging in again.'
                        : 'The signature does not match the payload. Either the secret key is wrong, or the payload was modified after signing. The role was changed from "admin" to "superadmin" — this tampering is detected and rejected.'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6 }}>
                {currentStep?.desc ?? ''}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {step < steps.length ? (
            <button onClick={nextStep} style={btnStyle(s.accent, false)}>
              {step === -1 ? 'Start Flow' : step === steps.length - 1 ? 'View Token' : 'Next Step'}
            </button>
          ) : (
            <button onClick={reset} style={btnStyle(s.bg3, false)}>
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )

  function btnStyle(color: string, active: boolean): React.CSSProperties {
    return {
      background: active ? color : `${color}18`,
      border: `1px solid ${active ? color : color}`,
      borderRadius: 8, padding: '8px 20px', color: active ? '#fff' : color,
      cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
    }
  }
}
