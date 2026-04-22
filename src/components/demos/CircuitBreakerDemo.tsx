import { useState, useEffect, useCallback } from 'react'
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

type CircuitState = 'closed' | 'open' | 'half-open'

const THRESHOLD = 5
const HALF_OPEN_MAX = 2
const TIMEOUT = 5000

interface CircuitData {
  state: CircuitState
  failureCount: number
  successCount: number
  totalCalls: number
  blockedCalls: number
  allowedCalls: number
  lastFailure: number | null
}

export default function CircuitBreakerDemo() {
  const [serviceBDown, setServiceBDown] = useState(false)
  const [circuit, setCircuit] = useState<CircuitData>({
    state: 'closed', failureCount: 0, successCount: 0,
    totalCalls: 0, blockedCalls: 0, allowedCalls: 0, lastFailure: null,
  })
  const [log, setLog] = useState<string[]>([])
  const [autoSending, setAutoSending] = useState(false)

  const makeCall = useCallback(() => {
    setCircuit(prev => {
      const next = { ...prev, totalCalls: prev.totalCalls + 1 }

      if (next.state === 'open') {
        const now = Date.now()
        if (next.lastFailure && now - next.lastFailure > TIMEOUT) {
          next.state = 'half-open'
          setLog(l => [...l.slice(-12), `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Circuit HALF-OPEN: testing if Service B recovered...`])
          next.successCount = 0
        } else {
          next.blockedCalls++
          setLog(l => [...l.slice(-12), `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] CALL BLOCKED by circuit breaker (state: OPEN). Fallback returned.`])
          return next
        }
      }

      if (next.state === 'half-open') {
        if (serviceBDown) {
          next.failureCount++
          next.state = 'open'
          next.lastFailure = Date.now()
          setLog(l => [...l.slice(-12), `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Test call FAILED in half-open. Circuit back to OPEN.`])
        } else {
          next.successCount++
          next.allowedCalls++
          setLog(l => [...l.slice(-12), `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Test call SUCCEEDED (${next.successCount}/${HALF_OPEN_MAX}). ${next.successCount >= HALF_OPEN_MAX ? 'Circuit CLOSED.' : 'Still testing...'}`])
          if (next.successCount >= HALF_OPEN_MAX) {
            next.state = 'closed'
            next.failureCount = 0
          }
        }
        return next
      }

      if (serviceBDown) {
        next.failureCount++
        next.lastFailure = Date.now()
        setLog(l => [...l.slice(-12), `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Call FAILED. Failures: ${next.failureCount}/${THRESHOLD}`])
        if (next.failureCount >= THRESHOLD) {
          next.state = 'open'
          setLog(l => [...l.slice(-12), `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Circuit OPENED. All calls will be blocked for ${TIMEOUT / 1000}s.`])
        }
      } else {
        next.failureCount = 0
        next.successCount++
        next.allowedCalls++
        setLog(l => [...l.slice(-12), `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Call SUCCEEDED. Response: 200 OK`])
      }
      return next
    })
  }, [serviceBDown])

  useEffect(() => {
    if (!autoSending) return
    const interval = setInterval(makeCall, 700)
    return () => clearInterval(interval)
  }, [autoSending, makeCall])

  const stateConfig = {
    closed: { label: 'CLOSED', color: s.green, desc: 'Normal operation. All calls pass through to Service B.' },
    open: { label: 'OPEN', color: s.red, desc: 'Circuit tripped. All calls are blocked and return fallback immediately.' },
    'half-open': { label: 'HALF-OPEN', color: s.yellow, desc: `Testing recovery. Up to ${HALF_OPEN_MAX} calls allowed to check if Service B is back.` },
  }

  const st = stateConfig[circuit.state]

  return (
    <DemoBoundary name="Circuit Breaker Pattern">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Circuit Breaker Pattern</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Break Service B and watch the circuit breaker detect failures, open the circuit, block calls, then test recovery.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setServiceBDown(prev => !prev)} style={modeBtn(serviceBDown, s.red)}>
            Service B: {serviceBDown ? 'DOWN' : 'UP'}
          </button>
          <button onClick={makeCall} style={modeBtn(false, s.accent)}>Send Request</button>
          <button onClick={() => setAutoSending(prev => !prev)} style={modeBtn(autoSending, s.orange)}>
            Auto-Send: {autoSending ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => {
            setCircuit({ state: 'closed', failureCount: 0, successCount: 0, totalCalls: 0, blockedCalls: 0, allowedCalls: 0, lastFailure: null })
            setLog([])
            setServiceBDown(false)
            setAutoSending(false)
          }} style={modeBtn(false, s.bg3)}>Reset</button>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ background: s.bg3, borderRadius: 10, padding: 16, border: `2px solid ${st.color}`, transition: 'all 0.3s', textAlign: 'center', marginBottom: 12 }}>
              <div style={{ color: st.color, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{st.label}</div>
              <div style={{ color: s.text3, fontSize: 12, lineHeight: 1.5 }}>{st.desc}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: s.bg3, borderRadius: 8, padding: 10, textAlign: 'center' }}>
                <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Failures</div>
                <div style={{ color: circuit.failureCount >= THRESHOLD ? s.red : s.orange, fontSize: 22, fontWeight: 700, fontFamily: s.mono }}>{circuit.failureCount}/{THRESHOLD}</div>
              </div>
              <div style={{ background: s.bg3, borderRadius: 8, padding: 10, textAlign: 'center' }}>
                <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Total Calls</div>
                <div style={{ color: s.text, fontSize: 22, fontWeight: 700, fontFamily: s.mono }}>{circuit.totalCalls}</div>
              </div>
              <div style={{ background: s.bg3, borderRadius: 8, padding: 10, textAlign: 'center' }}>
                <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Allowed</div>
                <div style={{ color: s.green, fontSize: 22, fontWeight: 700, fontFamily: s.mono }}>{circuit.allowedCalls}</div>
              </div>
              <div style={{ background: s.bg3, borderRadius: 8, padding: 10, textAlign: 'center' }}>
                <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Blocked</div>
                <div style={{ color: s.red, fontSize: 22, fontWeight: 700, fontFamily: s.mono }}>{circuit.blockedCalls}</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, background: s.bg, borderRadius: 10, padding: 12, maxHeight: 280, overflowY: 'auto', border: `1px solid ${s.border}` }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Event Log</div>
            {log.length === 0 && <div style={{ color: s.text3, fontSize: 11 }}>Send requests to see the circuit breaker in action.</div>}
            {log.map((entry, idx) => (
              <div key={idx} style={{
                color: entry.includes('BLOCKED') || entry.includes('OPENED') || entry.includes('FAILED') || entry.includes('back to OPEN')
                  ? s.red
                  : entry.includes('SUCCEEDED') || entry.includes('CLOSED')
                  ? s.green
                  : s.yellow,
                fontSize: 11, fontFamily: s.mono, lineHeight: 1.7,
              }}>
                {entry}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, alignItems: 'center', color: s.text3, fontSize: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.green }} />
            Closed (normal)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.red }} />
            Open (blocking)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.yellow }} />
            Half-Open (testing)
          </span>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )

  function modeBtn(active: boolean, color: string): React.CSSProperties {
    return { background: active ? `${color}18` : s.bg3, border: `1px solid ${active ? color : s.border}`, borderRadius: 8, padding: '8px 14px', color: active ? color : s.text3, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }
  }
}
