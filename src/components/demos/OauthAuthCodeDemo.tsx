import { useState } from 'react'
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

interface FlowStep {
  id: number
  label: string
  from: string
  to: string
  detail: string
  color: string
  data?: string
}

const flowSteps: FlowStep[] = [
  { id: 0, label: 'User clicks Login', from: 'User', to: 'App', detail: 'The user clicks "Login with Google" on your application. The app does not have the user\'s password.', color: s.accent },
  { id: 1, label: 'Generate PKCE challenge', from: 'App', to: 'App', detail: 'The app generates a random code_verifier (a long random string) and computes code_challenge = SHA256(code_verifier). This binds the authorization request to this specific client session.', color: s.orange, data: 'code_verifier: dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk\ncode_challenge: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM' },
  { id: 2, label: 'Redirect to Auth Server', from: 'App', to: 'Auth Server', detail: 'Browser redirects to the authorization server with client_id, redirect_uri, response_type=code, and code_challenge.', color: s.orange, data: 'GET /authorize?\n  response_type=code&\n  client_id=YOUR_APP&\n  redirect_uri=https://app.com/callback&\n  code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&\n  code_challenge_method=S256' },
  { id: 3, label: 'User signs in & consents', from: 'User', to: 'Auth Server', detail: 'Auth server shows login screen. User enters credentials and approves the permissions your app is requesting.', color: s.yellow },
  { id: 4, label: 'Authorization Code returned', from: 'Auth Server', to: 'App', detail: 'Server redirects back to your app with a single-use authorization code. This code is short-lived (typically 10 minutes). Without the code_verifier, this code alone is useless.', color: s.purple, data: 'Redirect: https://app.com/callback?code=4/0AX4XfWgV7k8mN2pQ9rS3tU6vWxYz' },
  { id: 5, label: 'Exchange code + verifier', from: 'App', to: 'Auth Server', detail: 'Your backend sends a server-to-server POST with the authorization code AND the original code_verifier. The auth server verifies that SHA256(code_verifier) matches the code_challenge from step 2.', color: s.accent, data: 'POST /token\n{\n  "grant_type": "authorization_code",\n  "code": "4/0AX4XfWgV7k8mN2pQ9rS3tU6vWxYz",\n  "client_id": "YOUR_APP",\n  "client_secret": "YOUR_SECRET",\n  "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"\n}' },
  { id: 6, label: 'Tokens issued', from: 'Auth Server', to: 'App', detail: 'Server returns access_token (short-lived), refresh_token (long-lived), and id_token (OIDC). The app now has a time-limited key to act on the user\'s behalf.', color: s.green, data: '{\n  "access_token": "ya29.a0AfH6...",\n  "token_type": "Bearer",\n  "expires_in": 3600,\n  "refresh_token": "1//0dx...",\n  "id_token": "eyJhbGciOiJSUzI1NiIs..."\n}' },
]

const roles = [
  { id: 'user', label: 'User (Resource Owner)', color: s.accent },
  { id: 'app', label: 'App (Client)', color: s.orange },
  { id: 'auth', label: 'Auth Server', color: s.purple },
]

export default function OauthAuthCodeDemo() {
  const [step, setStep] = useState(-1)
  const currentStep = step >= 0 && step < flowSteps.length ? flowSteps[step] : null
  const isComplete = step >= flowSteps.length

  const getRoleId = (name: string) => {
    if (name === 'User') return 'user'
    if (name === 'App') return 'app'
    return 'auth'
  }

  const nextStep = () => setStep(prev => prev + 1)
  const reset = () => setStep(-1)

  return (
    <DemoBoundary name="OAuth Authorization Code Flow with PKCE">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Authorization Code Flow with PKCE</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Step through the most secure OAuth 2.0 flow. PKCE (Proof Key for Code Exchange) ensures that even if the authorization code is intercepted, it cannot be exchanged for tokens without the original code_verifier.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
          {roles.map(role => {
            const isActive = currentStep && (getRoleId(currentStep.from) === role.id || getRoleId(currentStep.to) === role.id)
            return (
              <div key={role.id} style={{
                padding: '10px 14px', borderRadius: 10, textAlign: 'center',
                background: isActive ? `${role.color}12` : s.bg3,
                border: `1px solid ${isActive ? role.color : s.border}`,
                transition: 'all 0.3s', minWidth: 110,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: role.color, margin: '0 auto 6px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700 }}>
                  {role.label[0]}
                </div>
                <div style={{ color: isActive ? role.color : s.text3, fontSize: 10, fontWeight: 600, lineHeight: 1.3 }}>
                  {role.label}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 20 }}>
          {flowSteps.map((st, idx) => {
            const isActive = step === idx
            const isPast = step > idx
            return (
              <div key={st.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                background: isActive ? `${st.color}12` : 'transparent',
                borderRadius: 6, borderLeft: `3px solid ${isPast ? st.color : isActive ? st.color : s.border}`,
                transition: 'all 0.3s',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isPast ? st.color : isActive ? `${st.color}30` : s.bg3,
                  color: isPast ? '#fff' : isActive ? st.color : s.text3,
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}>
                  {isPast ? '\u2713' : idx + 1}
                </div>
                <span style={{ color: isActive ? st.color : isPast ? s.text2 : s.text3, fontSize: 12, fontWeight: isActive ? 700 : 500 }}>
                  {st.from !== 'App' || st.to !== 'App' ? `${st.from} \u2192 ${st.to}: ` : ''}{st.label}
                </span>
              </div>
            )
          })}
        </div>

        {currentStep && (
          <div style={{ background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {currentStep.from && currentStep.to ? `Step ${step + 1}: ${currentStep.from} \u2192 ${currentStep.to}` : `Step ${step + 1}: ${currentStep.label}`}
            </div>
            <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6, marginBottom: currentStep.data ? 12 : 0 }}>
              {currentStep.detail}
            </div>
            {currentStep.data && (
              <div style={{ background: s.bg, borderRadius: 6, padding: '10px 12px', fontFamily: s.mono, fontSize: 11, color: s.yellow, lineHeight: 1.5, whiteSpace: 'pre-wrap', overflow: 'auto' }}>
                {currentStep.data}
              </div>
            )}
          </div>
        )}

        {isComplete && (
          <div style={{ background: `${s.green}10`, border: `1px solid ${s.green}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ color: s.green, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Flow Complete</div>
            <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6 }}>
              The app has received access_token, refresh_token, and id_token. PKCE prevented any authorization code interception attack because the attacker would need the original code_verifier to exchange the code.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {step < flowSteps.length ? (
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
