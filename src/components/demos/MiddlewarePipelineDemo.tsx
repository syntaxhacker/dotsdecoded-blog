import { useState } from 'react'
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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface Middleware {
  id: string
  name: string
  enabled: boolean
  color: string
  desc: string
  before: string
  after: string
}

const middlewares: Middleware[] = [
  {
    id: 'cors', name: 'CORS', enabled: true, color: s.accent,
    desc: 'Adds Access-Control-Allow-Origin headers so browsers allow cross-origin requests',
    before: '', after: 'Access-Control-Allow-Origin: *',
  },
  {
    id: 'rate', name: 'Rate Limiter', enabled: true, color: s.orange,
    desc: 'Blocks requests exceeding 100/min per IP to prevent abuse',
    before: 'Check counter for 203.0.113.50', after: 'Counter: 42/100',
  },
  {
    id: 'auth', name: 'Auth (JWT)', enabled: true, color: s.green,
    desc: 'Validates JWT token from Authorization header and sets current_user',
    before: 'Token: Bearer eyJhbG...', after: 'user_id: 42',
  },
  {
    id: 'logging', name: 'Request Logger', enabled: true, color: s.purple,
    desc: 'Logs method, path, status code, and response time for observability',
    before: '', after: 'POST /api/users 201 142ms',
  },
  {
    id: 'params', name: 'Strong Params', enabled: true, color: s.yellow,
    desc: 'Filters request body to only allow whitelisted parameters',
    before: '{name:"Bob",role:"admin",id:999}', after: '{name:"Bob"}',
  },
  {
    id: 'csrf', name: 'CSRF', enabled: true, color: s.red,
    desc: 'Verifies CSRF token on state-changing requests (POST/PUT/DELETE)',
    before: 'Token: abc123', after: 'Valid',
  },
]

const frameworks = [
  {
    name: 'Express (Node)',
    code: `app.use(cors())
app.use(rateLimit({ max: 100 }))
app.use(verifyJWT)
app.use(requestLogger)
app.use(express.json())

app.post('/users', (req, res) => {
  const user = User.create(req.body)
  res.json(user, 201)
})`,
    color: s.green,
  },
  {
    name: 'Rails',
    code: `class ApplicationController < ActionController::Base
  before_action :set_cors_headers
  before_action :rate_limit!
  before_action :authenticate_user!
  before_action :set_request_log
  before_action :log_request

  def create
    @user = User.create(user_params)
    render json: @user, status: :created
  end
end`,
    color: s.red,
  },
  {
    name: 'Gin (Go)',
    code: `r := gin.New()
r.Use(gin.Logger())
r.Use(gin.Recovery())
r.Use(middleware.CORS())
r.Use(middleware.RateLimit(100))
r.Use(middleware.Auth())

r.POST("/users", func(c *gin.Context) {
  var user User
  c.BindJSON(&user)
  db.Create(&user)
  c.JSON(201, user)
})`,
    color: s.accent,
  },
]

export default function MiddlewarePipelineDemo() {
  const [mw, setMw] = useState(middlewares)
  const [activeMiddleware, setActiveMiddleware] = useState<string | null>(null)
  const [selectedFramework, setSelectedFramework] = useState(0)
  const [requestPhase, setRequestPhase] = useState<'idle' | 'incoming' | 'process' | 'response'>('idle')

  const toggle = (id: string) => {
    setMw(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m))
  }

  const simulate = () => {
    setRequestPhase('incoming')
    setActiveMiddleware(null)

    const enabledMw = mw.filter(m => m.enabled)
    let i = 0

    const next = () => {
      if (i < enabledMw.length) {
        setActiveMiddleware(enabledMw[i].id)
        i++
        setTimeout(next, 400)
      } else {
        setRequestPhase('process')
        setTimeout(() => {
          setRequestPhase('response')
          setTimeout(() => {
            let j = enabledMw.length - 1
            const reverse = () => {
              if (j >= 0) {
                setActiveMiddleware(enabledMw[j].id)
                j--
                setTimeout(reverse, 300)
              } else {
                setRequestPhase('idle')
                setActiveMiddleware(null)
              }
            }
            reverse()
          }, 500)
        }, 500)
      }
    }
    setTimeout(next, 300)
  }

  const enabledMw = mw.filter(m => m.enabled)

  return (
    <DemoBoundary name="Middleware Pipeline">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Middleware Pipeline</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Middleware wraps your request handler like layers of an onion. Each one can read, modify, or reject the request before it reaches your code.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {frameworks.map((fw, idx) => (
            <button key={fw.name} onClick={() => setSelectedFramework(idx)} style={{
              background: selectedFramework === idx ? fw.color : s.bg3,
              border: `1px solid ${selectedFramework === idx ? fw.color : s.border}`,
              borderRadius: 8, padding: '8px 16px', color: selectedFramework === idx ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
            }}>{fw.name}</button>
          ))}
        </div>

        <div style={{ background: s.bg, borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <pre style={{ margin: 0, fontFamily: s.mono, fontSize: 12, lineHeight: 1.6, color: s.text2, whiteSpace: 'pre-wrap' }}>
            {frameworks[selectedFramework].code}
          </pre>
        </div>

        <div style={{ color: s.text3, fontSize: 11, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Toggle middleware and watch the request flow
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            background: requestPhase === 'incoming' ? `${s.accent}15` : s.bg3,
            borderRadius: 8, border: `1px solid ${requestPhase === 'incoming' ? s.accent : s.border}`,
            transition: 'all 0.3s',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: requestPhase === 'incoming' ? s.accent : s.text3, transition: 'all 0.3s' }} />
            <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>Request arrives</span>
            <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>POST /api/users</span>
          </div>

          {enabledMw.map((m) => {
            const isActive = activeMiddleware === m.id
            return (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                background: isActive ? `${m.color}15` : s.bg3,
                borderRadius: 8,
                border: `1px solid ${isActive ? m.color : s.border}`,
                borderLeft: `3px solid ${m.color}`,
                transition: 'all 0.3s',
              }}>
                <button onClick={() => toggle(m.id)} style={{
                  width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: m.enabled ? m.color : s.border,
                  position: 'relative', transition: 'all 0.2s', flexShrink: 0,
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2,
                    left: m.enabled ? 18 : 2,
                    transition: 'left 0.2s',
                  }} />
                </button>
                <span style={{ color: isActive ? m.color : s.text, fontSize: 13, fontWeight: isActive ? 700 : 600, transition: 'all 0.3s', minWidth: 100 }}>
                  {m.name}
                </span>
                {isActive && (
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11, flex: 1 }}>
                    {requestPhase === 'response' ? m.after : m.before}
                  </span>
                )}
              </div>
            )
          })}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            background: requestPhase === 'process' ? `${s.green}15` : s.bg3,
            borderRadius: 8, border: `1px solid ${requestPhase === 'process' ? s.green : s.border}`,
            transition: 'all 0.3s',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: requestPhase === 'process' ? s.green : s.text3, transition: 'all 0.3s' }} />
            <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>Your Controller</span>
            <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>User.create(params)</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button onClick={simulate} disabled={requestPhase !== 'idle'} style={{
            background: requestPhase === 'idle' ? s.accent : s.bg3, border: 'none', borderRadius: 8,
            padding: '10px 24px', color: requestPhase === 'idle' ? '#fff' : s.text3,
            cursor: requestPhase === 'idle' ? 'pointer' : 'default', fontSize: 13, fontWeight: 600,
            opacity: requestPhase === 'idle' ? 1 : 0.6,
          }}>
            {requestPhase === 'idle' ? 'Simulate Request' : 'Running...'}
          </button>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
