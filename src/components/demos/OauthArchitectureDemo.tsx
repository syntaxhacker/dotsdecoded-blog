import { useState, useEffect, useRef } from 'react'
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

interface Step {
  id: number
  label: string
  from: number
  to: number
  detail: string
  tokenType?: string
  tokenDesc?: string
}

const entities = [
  { id: 0, label: 'Resource\nOwner (User)', x: 10, y: 55, color: s.accent, icon: 'U' },
  { id: 1, label: 'Client\n(App)', x: 30, y: 55, color: s.orange, icon: 'A' },
  { id: 2, label: 'Authorization\nServer', x: 60, y: 30, color: s.purple, icon: 'AS' },
  { id: 3, label: 'Resource\nServer (API)', x: 75, y: 55, color: s.green, icon: 'RS' },
]

const steps: Step[] = [
  { id: 0, label: 'User initiates login', from: 0, to: 1, detail: 'The user clicks "Login with Google" in the app. This starts the OAuth dance.', tokenType: 'Click' },
  { id: 1, label: 'Redirect to Auth Server', from: 1, to: 2, detail: 'The app redirects to the authorization server with: client_id, redirect_uri, response_type=code, scope, and PKCE code_challenge.', tokenType: 'Redirect URI' },
  { id: 2, label: 'User authenticates & consents', from: 0, to: 2, detail: 'The user logs in at the authorization server and grants permission. The auth server asks "Allow App to access your data?"', tokenType: 'Credentials + Consent' },
  { id: 3, label: 'Authorization code issued', from: 2, to: 1, detail: 'The auth server redirects back to the app with a short-lived, single-use authorization code in the URL.', tokenType: 'Authorization Code' },
  { id: 4, label: 'Exchange code for tokens', from: 1, to: 2, detail: 'The app makes a secure server-to-server POST with: code, client_id, client_secret, code_verifier, grant_type=authorization_code.', tokenType: 'POST /token' },
  { id: 5, label: 'Tokens returned', from: 2, to: 1, detail: 'The auth server returns access_token, refresh_token, and id_token. The app stores them securely on the backend.', tokenType: 'access_token + refresh_token + id_token' },
  { id: 6, label: 'API call with access token', from: 1, to: 3, detail: 'The app calls the resource server API (e.g., /userinfo) with the access_token in the Authorization: Bearer header.', tokenType: 'Authorization: Bearer <access_token>' },
  { id: 7, label: 'Resource server validates token', from: 3, to: 2, detail: 'The resource server validates the token signature, checks expiry, verifies the audience (aud), and checks that the issuer (iss) is trusted.', tokenType: 'JWKS validation + exp check' },
  { id: 8, label: 'User data returned', from: 3, to: 1, detail: 'The resource server returns the requested user data (email, profile, etc.). The app presents this to the user.', tokenType: '200 OK + User Data' },
  { id: 9, label: '(Later) Token refresh', from: 1, to: 2, detail: 'When the access token expires, the app uses the refresh_token to get a new access_token. No user interaction needed.', tokenType: 'refresh_token -> new access_token' },
]

const entityPositions = entities.reduce((acc, e) => {
  acc[e.id] = { x: e.x, y: e.y }
  return acc
}, {} as Record<number, { x: number; y: number }>)

export default function OauthArchitectureDemo() {
  const [step, setStep] = useState(-1)
  const [animating, setAnimating] = useState(false)
  const [animProgress, setAnimProgress] = useState(0)
  const animRef = useRef<number | null>(null)

  const currentStep = step >= 0 && step < steps.length ? steps[step] : null
  const isComplete = step >= steps.length

  useEffect(() => {
    if (!animating) return
    const start = performance.now()
    const dur = 800
    const animate = (now: number) => {
      const pct = Math.min((now - start) / dur, 1)
      setAnimProgress(pct)
      if (pct < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        setAnimating(false)
        setAnimProgress(1)
      }
    }
    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [animating])

  const nextStep = () => {
    setAnimating(true)
    setAnimProgress(0)
    setStep(prev => prev + 1)
  }

  const reset = () => {
    setStep(-1)
    setAnimating(false)
    setAnimProgress(0)
  }

  const getLinePos = (from: number, to: number, progress: number) => {
    const f = entityPositions[from]
    const t = entityPositions[to]
    if (!f || !t) return null
    const x1 = f.x
    const y1 = f.y
    const x2 = t.x
    const y2 = t.y
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len === 0) return null
    const ux = dx / len
    const uy = dy / len
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    const px = x1 + dx * progress
    const py = y1 + dy * progress
    return { x1, y1, x2, y2, px, py, ux, uy, midX, midY }
  }

  const arrowW = 70
  const arrowH = 20

  return (
    <DemoBoundary name="OAuth Architecture and Full Flow">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Full OAuth 2.0 Architecture</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          The four parties in OAuth 2.0 and how tokens flow between them. Step through the complete authorization code flow.
        </p>

        <div style={{ position: 'relative', width: '100%', height: 260, marginBottom: 20 }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', top: 0, left: 0 }}>
            {currentStep && (
              <g>
                <line
                  x1={entityPositions[currentStep.from]?.x ?? 0}
                  y1={entityPositions[currentStep.from]?.y ?? 0}
                  x2={entityPositions[currentStep.to]?.x ?? 0}
                  y2={entityPositions[currentStep.to]?.y ?? 0}
                  stroke={currentStep.id % 2 === 0 ? s.green : s.accent}
                  strokeWidth={0.8}
                  strokeDasharray="1.5,1"
                  opacity={0.3}
                />
              </g>
            )}
            {currentStep && (() => {
              const pos = getLinePos(currentStep.from, currentStep.to, animProgress)
              if (!pos) return null
              const angle = Math.atan2(pos.y2 - pos.y1, pos.x2 - pos.x1) * 180 / Math.PI
              return (
                <g>
                  <line x1={pos.x1} y1={pos.y1} x2={pos.x2} y2={pos.y2}
                    stroke={currentStep.id % 2 === 0 ? s.green : s.accent}
                    strokeWidth={1.5}
                    strokeDasharray="2,1.5"
                    opacity={0.6 + animProgress * 0.4}
                  />
                  <g transform={`translate(${pos.px}, ${pos.py}) rotate(${angle})`}>
                    <rect x={-arrowW / 2} y={-arrowH / 2} width={arrowW} height={arrowH}
                      rx={4} ry={4}
                      fill={currentStep.id % 2 === 0 ? s.green : s.accent}
                      opacity={0.9}
                    />
                    <text x={0} y={0} textAnchor="middle" dominantBaseline="central"
                      fill="#fff" fontSize={4} fontWeight={700}>
                      {currentStep.tokenType && currentStep.tokenType.length > 20
                        ? currentStep.tokenType.substring(0, 18) + '..'
                        : currentStep.tokenType ?? ''}
                    </text>
                  </g>
                </g>
              )
            })()}
          </svg>

          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {entities.map(e => {
              const isActive = currentStep && (currentStep.from === e.id || currentStep.to === e.id)
              return (
                <div key={e.id} style={{
                  position: 'absolute',
                  left: `${e.x}%`,
                  top: `${e.y}%`,
                  transform: 'translate(-50%, -50%)',
                  padding: '10px 14px', borderRadius: 10,
                  textAlign: 'center',
                  background: isActive ? `${e.color}20` : s.bg3,
                  border: `1px solid ${isActive ? e.color : s.border}`,
                  transition: 'all 0.3s',
                  zIndex: 10,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: e.color,
                    margin: '0 auto 4px auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: '#fff', fontWeight: 700,
                  }}>
                    {e.icon}
                  </div>
                  <div style={{ color: isActive ? e.color : s.text2, fontSize: 9, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'pre-wrap' }}>
                    {e.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 20 }}>
          {steps.map((st, idx) => {
            const isActive = step === idx
            const isPast = step > idx
            const fromEntity = entities.find(e => e.id === st.from)
            const toEntity = entities.find(e => e.id === st.to)
            return (
              <div key={st.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                background: isActive ? `${st.id % 2 === 0 ? s.green : s.accent}10` : 'transparent',
                borderRadius: 6, borderLeft: `3px solid ${isPast ? (st.id % 2 === 0 ? s.green : s.accent) : isActive ? (st.id % 2 === 0 ? s.green : s.accent) : s.border}`,
                transition: 'all 0.3s', cursor: 'pointer',
              }} onClick={() => { if (!isActive) { setStep(idx); setAnimating(true); setAnimProgress(0) } }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isPast ? (st.id % 2 === 0 ? s.green : s.accent) : isActive ? `${st.id % 2 === 0 ? s.green : s.accent}30` : s.bg3,
                  color: isPast ? '#fff' : isActive ? (st.id % 2 === 0 ? s.green : s.accent) : s.text3,
                  fontSize: 9, fontWeight: 700, flexShrink: 0,
                }}>
                  {isPast ? '\u2713' : idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: isActive ? (st.id % 2 === 0 ? s.green : s.accent) : isPast ? s.text2 : s.text3, fontSize: 11, fontWeight: isActive ? 700 : 500 }}>
                    {fromEntity?.label.replace('\n', ' ')} {'\u2192'} {toEntity?.label.replace('\n', ' ')}
                  </div>
                  <div style={{ color: isActive ? s.text : s.text3, fontSize: 9, marginTop: 1 }}>
                    {st.label}
                  </div>
                </div>
                {st.tokenType && (
                  <div style={{
                    background: s.bg, borderRadius: 4, padding: '2px 6px',
                    fontFamily: s.mono, fontSize: 7, color: s.yellow, maxWidth: 120,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {st.tokenType}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {currentStep && (
          <div style={{ background: s.bg3, borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Step {step + 1}: {currentStep.label}
            </div>
            <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6 }}>
              {currentStep.detail}
            </div>
            {currentStep.tokenType && (
              <div style={{ marginTop: 8, background: s.bg, borderRadius: 6, padding: '8px 10px', fontFamily: s.mono, fontSize: 10, color: s.yellow }}>
                {currentStep.tokenDesc ?? ''}
                Token / Data: {currentStep.tokenType}
              </div>
            )}
          </div>
        )}

        {isComplete && (
          <div style={{ background: `${s.green}10`, border: `1px solid ${s.green}`, borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <div style={{ color: s.green, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Full Lifecycle Complete</div>
            <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.6 }}>
              The app has: (1) obtained user consent, (2) received tokens, (3) called the API successfully, (4) has the ability to refresh tokens without user interaction. The entire flow demonstrates the separation of concerns: the auth server handles identity, the resource server handles data, and the app orchestrates them.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {step < steps.length ? (
            <button onClick={nextStep} style={{
              background: `${s.accent}18`, border: `1px solid ${s.accent}`, borderRadius: 8,
              padding: '8px 20px', color: s.accent, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {step === -1 ? 'Start Flow' : 'Next Step'}
            </button>
          ) : (
            <button onClick={reset} style={{
              background: `${s.bg3}`, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '8px 20px', color: s.text2, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
