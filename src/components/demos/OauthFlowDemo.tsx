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

interface OauthStep {
  id: number
  label: string
  from: string
  to: string
  desc: string
  color: string
  token?: string
}

const oauthSteps: OauthStep[] = [
  { id: 0, label: 'User clicks "Login with Google"', from: 'User', to: 'App', desc: 'The user initiates the login flow on your application. The app does not have the user\'s password — it asks Google to verify identity instead.', color: s.accent },
  { id: 1, label: 'App redirects to Authorization Server', from: 'App', to: 'Auth Server', desc: 'The app redirects the browser to Google\'s authorization URL with: client_id, redirect_uri, response_type=code, scope=openid profile email.', color: s.orange, token: 'redirect: accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_APP&redirect_uri=https://yourapp.com/callback&response_type=code&scope=openid%20profile%20email' },
  { id: 2, label: 'User logs in and grants consent', from: 'User', to: 'Auth Server', desc: 'Google shows a login screen. The user enters their Google credentials and sees: "Your App wants to access your Google Account" — they click Allow.', color: s.yellow },
  { id: 3, label: 'Auth Server returns authorization code', from: 'Auth Server', to: 'App', desc: 'Google redirects back to your app\'s callback URL with an authorization code: https://yourapp.com/callback?code=4/0AX4XfWg... This code is short-lived (10 minutes) and single-use.', color: s.purple, token: 'Authorization Code: 4/0AX4XfWgV7k8mN2pQ9rS3tU6vWxYz' },
  { id: 4, label: 'App exchanges code for tokens', from: 'App', to: 'Auth Server', desc: 'Your app\'s backend makes a server-to-server POST to Google\'s token endpoint with: code, client_id, client_secret, redirect_uri, grant_type=authorization_code. The client_secret is used here — the browser never sees it.', color: s.accent, token: 'POST /token { code: "4/0AX4Xf...", client_id: "YOUR_APP", client_secret: "SECRET", grant_type: "authorization_code" }' },
  { id: 5, label: 'Auth Server returns access + refresh tokens', from: 'Auth Server', to: 'App', desc: 'Google returns an access_token (short-lived, ~1 hour) and a refresh_token (long-lived, used to get new access tokens). The app stores these securely.', color: s.green, token: '{ "access_token": "ya29.a0AfH6...", "expires_in": 3600, "refresh_token": "1//0dx...", "token_type": "Bearer" }' },
  { id: 6, label: 'App accesses user data with access token', from: 'App', to: 'Resource Server', desc: 'The app calls Google\'s API (e.g., userinfo endpoint) with the access token in the Authorization header. The resource server validates the token and returns user data.', color: s.green, token: 'GET /oauth2/v3/userinfo Authorization: Bearer ya29.a0AfH6...' },
]

const roles = [
  { id: 'user', label: 'User', color: s.accent },
  { id: 'app', label: 'App (Client)', color: s.orange },
  { id: 'auth', label: 'Auth Server (Google)', color: s.purple },
  { id: 'resource', label: 'Resource Server', color: s.green },
]

export default function OauthFlowDemo() {
  const [step, setStep] = useState(-1)
  const currentStep = step >= 0 && step < oauthSteps.length ? oauthSteps[step] : null
  const isComplete = step >= oauthSteps.length

  const getRoleId = (name: string) => {
    if (name === 'User') return 'user'
    if (name === 'App') return 'app'
    if (name === 'Auth Server') return 'auth'
    return 'resource'
  }

  const nextStep = () => setStep(prev => prev + 1)
  const reset = () => setStep(-1)

  return (
    <DemoBoundary name="OAuth 2.0 Authorization Code Flow">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>OAuth 2.0 Authorization Code Flow</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Step through the most common OAuth flow. Watch how the authorization code, tokens, and user data travel between the four roles.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24, padding: '16px 0' }}>
          {roles.map((role) => {
            const isActive = currentStep && (getRoleId(currentStep.from) === role.id || getRoleId(currentStep.to) === role.id)
            return (
              <div key={role.id} style={{
                padding: '12px 16px', borderRadius: 10, textAlign: 'center',
                background: isActive ? `${role.color}12` : s.bg3,
                border: `1px solid ${isActive ? role.color : s.border}`,
                transition: 'all 0.3s', minWidth: 100,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: role.color, margin: '0 auto 8px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700 }}>
                  {role.label[0]}
                </div>
                <div style={{ color: isActive ? role.color : s.text3, fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>
                  {role.label}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 20 }}>
          {oauthSteps.map((st, idx) => {
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
                  {st.label}
                </span>
              </div>
            )
          })}
        </div>

        {currentStep && (
          <div style={{ background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Step {step + 1}: {currentStep.from} {'\u2192'} {currentStep.to}
            </div>
            <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
              {currentStep.desc}
            </div>
            {currentStep.token && (
              <div style={{ background: s.bg, borderRadius: 6, padding: '10px 12px', fontFamily: s.mono, fontSize: 11, color: s.yellow, lineHeight: 1.5, overflow: 'auto' }}>
                {currentStep.token}
              </div>
            )}
          </div>
        )}

        {isComplete && (
          <div style={{ background: `${s.green}10`, border: `1px solid ${s.green}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ color: s.green, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Flow Complete</div>
            <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6 }}>
              The app now has the user's access token. It can call Google's API on the user's behalf until the token expires. When it expires, the app uses the refresh token to get a new access token — no user interaction needed.
            </div>
            <div style={{ color: s.text3, fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
              Key security points: The authorization code is exchanged on the backend (client_secret is never exposed to the browser). The access token is short-lived. The refresh token is stored securely and used only server-to-server.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {step < oauthSteps.length ? (
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
