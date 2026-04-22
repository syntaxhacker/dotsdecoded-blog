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

type StepStatus = 'pending' | 'active' | 'passed' | 'blocked'

interface PipelineStep {
  label: string
  desc: string
  status: StepStatus
  detail: string
}

const requestOptions = [
  {
    label: 'GET /api/users (valid, authenticated)',
    method: 'GET', path: '/api/users',
    auth: true, rateLimit: false,
    routeTo: 'Users Service', routeColor: s.accent,
  },
  {
    label: 'POST /api/orders (valid, authenticated)',
    method: 'POST', path: '/api/orders',
    auth: true, rateLimit: false,
    routeTo: 'Orders Service', routeColor: s.green,
  },
  {
    label: 'GET /api/payments (valid, authenticated)',
    method: 'GET', path: '/api/payments',
    auth: true, rateLimit: false,
    routeTo: 'Payments Service', routeColor: s.orange,
  },
  {
    label: 'GET /api/users (no auth token)',
    method: 'GET', path: '/api/users',
    auth: false, rateLimit: false,
    routeTo: '', routeColor: '',
  },
  {
    label: 'POST /api/orders (rate limited)',
    method: 'POST', path: '/api/orders',
    auth: true, rateLimit: true,
    routeTo: '', routeColor: '',
  },
]

const services = [
  { name: 'Users Service', color: s.accent },
  { name: 'Orders Service', color: s.green },
  { name: 'Payments Service', color: s.orange },
]

function buildSteps(req: typeof requestOptions[0]): PipelineStep[] {
  const steps: PipelineStep[] = [
    { label: 'Receive Request', desc: 'Gateway receives the incoming request', status: 'pending', detail: `${req.method} ${req.path}` },
    { label: 'Authentication', desc: 'Verify JWT token or API key', status: 'pending', detail: req.auth ? 'Bearer token valid -- user:john@example.com' : 'Missing Authorization header' },
    { label: 'Rate Limiting', desc: 'Check requests per minute for this client', status: 'pending', detail: req.rateLimit ? 'Rate limit exceeded: 101/100 rpm' : 'Within limit: 23/100 rpm' },
    { label: 'Routing', desc: 'Match path to backend service', status: 'pending', detail: `Path "${req.path}" -> ${req.routeTo}` },
    { label: 'Transformation', desc: 'Add headers, strip internal fields', status: 'pending', detail: 'Added X-Request-Id, X-Forwarded-For' },
    { label: 'Logging', desc: 'Record request for observability', status: 'pending', detail: `Logged: ${req.method} ${req.path} -> ${req.routeTo || 'BLOCKED'}` },
  ]

  if (!req.auth) {
    steps[1].status = 'blocked'
    steps[1].detail = '401 Unauthorized -- missing or invalid token'
    for (let i = 2; i < steps.length; i++) steps[i].detail = 'Skipped -- request blocked'
    return steps
  }
  if (req.rateLimit) {
    steps[1].status = 'passed'
    steps[1].detail = 'Bearer token valid -- user:john@example.com'
    steps[2].status = 'blocked'
    steps[2].detail = '429 Too Many Requests -- retry after 30s'
    for (let i = 3; i < steps.length; i++) steps[i].detail = 'Skipped -- request blocked'
    return steps
  }
  return steps
}

export default function ApiGatewayDemo() {
  const [selectedReq, setSelectedReq] = useState(0)
  const [running, setRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [steps, setSteps] = useState<PipelineStep[]>([])
  const [logEntries, setLogEntries] = useState<string[]>([])

  const req = requestOptions[selectedReq]

  const startPipeline = () => {
    const pipeline = buildSteps(req)
    setSteps(pipeline)
    setCurrentStep(0)
    setRunning(true)
    setLogEntries([])
  }

  useState(() => {
    if (!running || currentStep < 0) return
    const step = steps[currentStep]
    if (!step) return
  })

  useState(() => {
    if (!running || currentStep < 0) return
    const step = steps[currentStep]
    if (!step) { setRunning(false); return }
  })

  const advanceStep = () => {
    if (currentStep < 0) return
    setSteps(prev => {
      const updated = [...prev]
      const st = updated[currentStep]
      if (st.status === 'blocked') {
        setLogEntries(le => [...le, `BLOCKED at ${st.label}: ${st.detail}`])
        setRunning(false)
        return updated
      }
      updated[currentStep] = { ...st, status: 'passed' }
      setLogEntries(le => [...le, `${st.label}: ${st.detail}`])
      const next = currentStep + 1
      if (next >= updated.length) {
        setRunning(false)
        setLogEntries(le => [...le, `Response: 200 OK from ${req.routeTo}`])
        return updated
      }
      setCurrentStep(next)
      return updated
    })
  }

  const reset = () => {
    setSteps([])
    setCurrentStep(-1)
    setRunning(false)
    setLogEntries([])
  }

  const stepColors: Record<StepStatus, string> = {
    pending: s.text3,
    active: s.yellow,
    passed: s.green,
    blocked: s.red,
  }

  return (
    <DemoBoundary name="API Gateway">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>API Gateway Pipeline</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Watch a request flow through the gateway pipeline: authentication, rate limiting, routing, transformation, and logging. Try different requests including blocked ones.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: s.text3, fontSize: 12 }}>Request:</span>
          <select value={selectedReq} onChange={e => { setSelectedReq(Number(e.target.value)); reset() }} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 10px',
            color: s.text, fontSize: 11, fontFamily: s.mono, cursor: 'pointer', outline: 'none', maxWidth: 320,
          }}>
            {requestOptions.map((r, i) => (
              <option key={i} value={i}>{r.label}</option>
            ))}
          </select>
          <button onClick={startPipeline} disabled={running} style={{
            background: s.accent, border: 'none', borderRadius: 6, padding: '6px 16px',
            color: '#fff', cursor: running ? 'default' : 'pointer', fontSize: 12, fontWeight: 600,
            opacity: running ? 0.6 : 1,
          }}>Send</button>
          {running && (
            <button onClick={advanceStep} style={{
              background: s.yellow, border: 'none', borderRadius: 6, padding: '6px 16px',
              color: '#000', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>Next Step</button>
          )}
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 12px',
            color: s.text2, cursor: 'pointer', fontSize: 12,
          }}>Reset</button>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Gateway Pipeline</div>
            {steps.length === 0 && (
              <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: '30px 0', background: s.bg3, borderRadius: 8 }}>
                Select a request and press Send
              </div>
            )}
            {steps.map((step, i) => (
              <div key={step.label} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', marginBottom: 4,
                background: i === currentStep ? `${stepColors[step.status]}10` : s.bg3,
                border: `1px solid ${i === currentStep ? stepColors[step.status] : s.border}`,
                borderRadius: 8, transition: 'all 0.3s',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step.status === 'pending' ? 'transparent' : stepColors[step.status] + '20',
                  border: `2px solid ${stepColors[step.status]}`,
                  fontSize: 11, color: stepColors[step.status], fontWeight: 700, flexShrink: 0,
                }}>
                  {step.status === 'passed' ? '\u2713' : step.status === 'blocked' ? '\u2717' : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: step.status === 'pending' ? s.text3 : stepColors[step.status], fontSize: 13, fontWeight: 600 }}>
                    {step.label}
                  </div>
                  <div style={{ color: s.text3, fontSize: 10 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Step Detail</div>
            <div style={{ background: s.bg3, borderRadius: 8, padding: 14, marginBottom: 12, minHeight: 80 }}>
              {currentStep >= 0 && steps[currentStep] && (
                <div>
                  <div style={{ color: stepColors[steps[currentStep].status], fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    {steps[currentStep].label}
                  </div>
                  <div style={{ color: s.text2, fontSize: 12, fontFamily: s.mono, lineHeight: 1.6 }}>
                    {steps[currentStep].detail}
                  </div>
                </div>
              )}
              {steps.length === 0 && (
                <div style={{ color: s.text3, fontSize: 12 }}>Press Send to start the pipeline</div>
              )}
            </div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Event Log</div>
            <div style={{ background: s.bg3, borderRadius: 8, padding: 12, maxHeight: 200, overflowY: 'auto' }}>
              {logEntries.length === 0 && <div style={{ color: s.text3, fontSize: 12 }}>No events yet</div>}
              {logEntries.map((entry, i) => (
                <div key={i} style={{
                  color: entry.startsWith('BLOCKED') ? s.red : s.green,
                  fontSize: 11, fontFamily: s.mono, padding: '2px 0', borderBottom: i < logEntries.length - 1 ? `1px solid ${s.border}` : 'none',
                }}>{entry}</div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Backend Services</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {services.map(svc => {
            const isTarget = req.routeTo === svc.name
            return (
              <div key={svc.name} style={{
                flex: 1, background: s.bg3, borderRadius: 8, padding: '10px 14px',
                border: `1px solid ${isTarget && !req.rateLimit && req.auth ? svc.color : s.border}`,
                opacity: isTarget && !req.rateLimit && req.auth ? 1 : 0.5,
                transition: 'all 0.3s',
              }}>
                <div style={{ color: isTarget && !req.rateLimit && req.auth ? svc.color : s.text3, fontSize: 12, fontWeight: 600 }}>
                  {svc.name}
                </div>
                <div style={{ color: s.text3, fontSize: 10, marginTop: 2 }}>
                  {isTarget && !req.rateLimit && req.auth ? 'Receiving traffic' : 'Idle'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
