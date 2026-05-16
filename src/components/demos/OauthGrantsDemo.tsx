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

interface GrantType {
  id: string
  name: string
  description: string
  security: string
  useCase: string
  tokenExchange: string
  bestFor: string
  status: 'recommended' | 'deprecated' | 'specialized'
  color: string
  icon: string
}

const grants: GrantType[] = [
  {
    id: 'authcode',
    name: 'Authorization Code',
    description: 'The client redirects the user to the authorization server. After the user authenticates and consents, an authorization code is returned to the client via a redirect URI. The client then exchanges this code for tokens using a server-to-server call with the client_secret.',
    security: 'Highest. Authorization code is short-lived and single-use. PKCE adds cryptographic binding. Client_secret is never exposed to the browser.',
    useCase: 'Web applications with a backend server (Node, Rails, Django, etc.). The standard for most modern apps.',
    tokenExchange: 'Step 1: User authorizes. Step 2: Code returned via redirect. Step 3: Server exchanges code + client_secret for tokens.',
    bestFor: 'Web apps with confidential clients (can keep a secret).',
    status: 'recommended',
    color: s.green,
    icon: 'AC',
  },
  {
    id: 'implicit',
    name: 'Implicit (Deprecated)',
    description: 'The client receives the access token directly in the URL fragment after user authorization, without an intermediate authorization code. There is no client authentication step.',
    security: 'Low. Access token is exposed in the browser URL. No client authentication. No refresh tokens. Vulnerable to access token interception.',
    useCase: 'Legacy single-page applications (SPAs) that cannot use PKCE. Superseded by Authorization Code + PKCE for all modern SPAs.',
    tokenExchange: 'Step 1: User authorizes. Step 2: Access token returned directly in URL fragment.',
    bestFor: 'Nothing. Use Authorization Code + PKCE instead.',
    status: 'deprecated',
    color: s.red,
    icon: 'IM',
  },
  {
    id: 'clientcred',
    name: 'Client Credentials',
    description: 'The client authenticates directly with the authorization server using its client_id and client_secret (or other credentials like a JWT assertion). No user involvement at all.',
    security: 'High for machine-to-machine. No user context means no user impersonation risk. The client must protect its credentials.',
    useCase: 'Server-to-server communication. Cron jobs, background workers, microservices talking to APIs. No user is present.',
    tokenExchange: 'Step 1: Client POSTs client_id + client_secret to /token. Step 2: Access token returned directly.',
    bestFor: 'Backend services, APIs, daemons, cron jobs.',
    status: 'specialized',
    color: s.accent,
    icon: 'CC',
  },
  {
    id: 'device',
    name: 'Device Code',
    description: 'The device displays a code and URL. The user visits the URL on another device (phone, laptop) and enters the code to authorize. The device polls the auth server until the user completes authorization.',
    security: 'Good. No browser on the device means no phishing via fake browser UI. User must trust the device code flow. Short-lived device codes.',
    useCase: 'Smart TVs, game consoles, CLI tools, IoT devices — anything with limited or no browser capabilities.',
    tokenExchange: 'Step 1: Device requests device_code + user_code. Step 2: User visits URL on another device, enters code. Step 3: Device polls for tokens.',
    bestFor: 'Devices without a browser or with constrained input.',
    status: 'specialized',
    color: s.orange,
    icon: 'DC',
  },
]

const scenarios = [
  { label: 'Your web app (React + Express backend)', grant: 'authcode' },
  { label: 'A cron job that calls an internal API', grant: 'clientcred' },
  { label: 'A smart TV app that shows weather', grant: 'device' },
  { label: 'Legacy SPA from 2015', grant: 'implicit' },
  { label: 'Mobile app (iOS/Android)', grant: 'authcode' },
  { label: 'Microservice A calling Microservice B', grant: 'clientcred' },
  { label: 'CLI tool that accesses user data', grant: 'device' },
  { label: 'Server-rendered Rails app', grant: 'authcode' },
]

export default function OauthGrantsDemo() {
  const [selected, setSelected] = useState<string>('authcode')

  const current = grants.find(g => g.id === selected)
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)

  const scenarioGrant = selectedScenario ? grants.find(g => g.id === scenarios.find(s => s.label === selectedScenario)?.grant) : null

  return (
    <DemoBoundary name="OAuth Grant Types Comparison">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>OAuth 2.0 Grant Types</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          OAuth 2.0 defines multiple grant types (flows) for different scenarios. Each grant type is designed for a specific kind of client application.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {grants.map(g => (
            <button key={g.id} onClick={() => { setSelected(g.id); setSelectedScenario(null) }} style={{
              flex: 1, padding: '12px 8px', borderRadius: 8, textAlign: 'center', cursor: 'pointer',
              background: selected === g.id ? `${g.color}15` : s.bg3,
              border: `1px solid ${selected === g.id ? g.color : s.border}`,
              transition: 'all 0.2s',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: g.color, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>
                {g.icon}
              </div>
              <div style={{ color: selected === g.id ? g.color : s.text2, fontSize: 11, fontWeight: 600 }}>{g.name}</div>
              <div style={{
                display: 'inline-block', marginTop: 4, padding: '2px 6px', borderRadius: 4,
                background: g.status === 'recommended' ? `${s.green}20` : g.status === 'deprecated' ? `${s.red}20` : `${s.yellow}20`,
                color: g.status === 'recommended' ? s.green : g.status === 'deprecated' ? s.red : s.yellow,
                fontSize: 9, fontWeight: 600,
              }}>
                {g.status === 'recommended' ? 'RECOMMENDED' : g.status === 'deprecated' ? 'DEPRECATED' : 'SPECIALIZED'}
              </div>
            </button>
          ))}
        </div>

        {current && (
          <div style={{ background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: current.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700 }}>{current.icon}</div>
              <div>
                <div style={{ color: s.text, fontSize: 15, fontWeight: 700 }}>{current.name}</div>
                <div style={{ color: s.text3, fontSize: 11 }}>{current.bestFor}</div>
              </div>
            </div>
            <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{current.description}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: s.bg, borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Security</div>
                <div style={{ color: current.status === 'deprecated' ? s.red : s.green, fontSize: 12, lineHeight: 1.5 }}>{current.security}</div>
              </div>
              <div style={{ background: s.bg, borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Use Case</div>
                <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>{current.useCase}</div>
              </div>
              <div style={{ background: s.bg, borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Token Exchange</div>
                <div style={{ color: s.yellow, fontSize: 11, fontFamily: s.mono, lineHeight: 1.5 }}>{current.tokenExchange}</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Which Grant Should You Use?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {scenarios.map(sc => {
              const g = grants.find(g => g.id === sc.grant)
              if (!g) return null
              const isSelected = selectedScenario === sc.label
              return (
                <div key={sc.label} onClick={() => setSelectedScenario(isSelected ? null : sc.label)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  background: isSelected ? `${g.color}10` : 'transparent',
                  borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${isSelected ? g.color : 'transparent'}`,
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: g.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, color: '#fff', fontWeight: 700, flexShrink: 0,
                  }}>
                    {g.icon}
                  </div>
                  <span style={{ color: s.text2, fontSize: 12, flex: 1 }}>{sc.label}</span>
                  <span style={{ color: g.color, fontSize: 11, fontWeight: 600, fontFamily: s.mono }}>{g.name}</span>
                </div>
              )
            })}
          </div>
          {selectedScenario && scenarioGrant && (
            <div style={{ background: `${scenarioGrant.color}08`, borderRadius: 8, padding: 12, marginTop: 10 }}>
              <div style={{ color: scenarioGrant.color, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{scenarioGrant.name}</div>
              <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>{scenarioGrant.bestFor}</div>
            </div>
          )}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
