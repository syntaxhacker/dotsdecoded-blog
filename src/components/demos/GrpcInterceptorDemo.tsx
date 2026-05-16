import { useState, useCallback } from 'react'
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

interface Interceptor {
  key: string
  label: string
  side: 'client' | 'server'
  color: string
  desc: string
  onByDefault: boolean
}

const allInterceptors: Interceptor[] = [
  { key: 'client-logging', label: 'Logging', side: 'client', color: s.accent, desc: 'Log request method, metadata, duration', onByDefault: true },
  { key: 'client-auth', label: 'Auth Token', side: 'client', color: s.purple, desc: 'Attach JWT bearer token to metadata', onByDefault: true },
  { key: 'client-retry', label: 'Retry', side: 'client', color: s.yellow, desc: 'Retry on transient failures (max 3 attempts)', onByDefault: false },
  { key: 'server-auth', label: 'Auth Verify', side: 'server', color: s.purple, desc: 'Validate JWT token, extract user identity', onByDefault: true },
  { key: 'server-metrics', label: 'Metrics', side: 'server', color: s.green, desc: 'Count requests, record latency histogram', onByDefault: true },
  { key: 'server-ratelimit', label: 'Rate Limit', side: 'server', color: s.red, desc: 'Check per-user rate limit, return 429 if exceeded', onByDefault: false },
]

const sideSorter = { client: 0, server: 1 }

export default function GrpcInterceptorDemo() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    allInterceptors.forEach(ix => { init[ix.key] = ix.onByDefault })
    return init
  })
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [log, setLog] = useState<string[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const [resultMsg, setResultMsg] = useState('')

  const toggle = (key: string) => {
    setEnabled(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const run = useCallback(() => {
    const order: Interceptor[] = allInterceptors
      .filter(ix => enabled[ix.key])
      .sort((a, b) => {
        if (a.side !== b.side) return sideSorter[a.side] - sideSorter[b.side]
        return allInterceptors.indexOf(a) - allInterceptors.indexOf(b)
      })

    const clientIxs = order.filter(ix => ix.side === 'client')
    const serverIxs = order.filter(ix => ix.side === 'server')
    const totalSteps = clientIxs.length + 1 + serverIxs.length + 1
    const logEntries: string[] = []
    let idx = 0

    setLog([])
    setPhase('running')
    setActiveIdx(-1)

    const step = () => {
      if (idx < clientIxs.length) {
        const ix = clientIxs[idx]
        logEntries.push(`[Client] ${ix.label}: ${ix.desc}`)
        setLog([...logEntries])
        setActiveIdx(allInterceptors.indexOf(ix))
        idx++
        setTimeout(step, 500)
      } else if (idx === clientIxs.length) {
        logEntries.push('[---] gRPC call: HEADERS + DATA over HTTP/2')
        setLog([...logEntries])
        setActiveIdx(-1)
        idx++
        setTimeout(step, 400)
      } else if (idx < clientIxs.length + 1 + serverIxs.length) {
        const si = idx - clientIxs.length - 1
        const ix = serverIxs[si]
        logEntries.push(`[Server] ${ix.label}: ${ix.desc}`)
        setLog([...logEntries])
        setActiveIdx(allInterceptors.indexOf(ix))
        idx++
        setTimeout(step, 500)
      } else {
        logEntries.push('[OK] Response returned to client')
        setLog([...logEntries])
        setResultMsg('200 OK: User returned successfully')
        setActiveIdx(-1)
        setPhase('done')
      }
    }

    setTimeout(step, 300)
  }, [enabled])

  const reset = () => {
    setPhase('idle')
    setLog([])
    setActiveIdx(-1)
    setResultMsg('')
  }

  const clientIxs = allInterceptors.filter(ix => ix.side === 'client')
  const serverIxs = allInterceptors.filter(ix => ix.side === 'server')

  return (
    <DemoBoundary name="gRPC Interceptor Chain">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Interceptor Chain</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Toggle interceptors on or off. When you send a request, they execute in order:
          client-side first (top to bottom), then the gRPC call, then server-side (top to bottom).
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Client Interceptors</div>
            {clientIxs.map((ix, i) => (
              <div key={ix.key} style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                padding: '8px 10px', borderRadius: 8,
                background: activeIdx === allInterceptors.indexOf(ix) ? `${ix.color}20` : 'transparent',
                border: activeIdx === allInterceptors.indexOf(ix) ? `1.5px solid ${ix.color}` : '1.5px solid transparent',
                transition: 'all 0.3s',
              }}>
                <input type="checkbox" checked={enabled[ix.key]}
                  onChange={() => toggle(ix.key)}
                  style={{ accentColor: ix.color }} />
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: enabled[ix.key] ? ix.color : s.text3,
                  transition: 'all 0.2s',
                }} />
                <span style={{
                  color: enabled[ix.key] ? s.text : s.text3,
                  fontSize: 12, fontWeight: 600,
                  transition: 'color 0.2s',
                }}>{ix.label}</span>
                <span style={{ color: s.text3, fontSize: 10, marginLeft: 'auto' }}>
                  {i === 0 ? '1st' : i === 1 ? '2nd' : `${i + 1}th`}
                </span>
              </div>
            ))}
          </div>

          <div style={{ flex: '0 0 80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: 2, height: '100%', background: `linear-gradient(180deg, ${s.accent}, ${s.green})`,
              borderRadius: 1,
            }} />
          </div>

          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Server Interceptors</div>
            {serverIxs.map((ix, i) => (
              <div key={ix.key} style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                padding: '8px 10px', borderRadius: 8,
                background: activeIdx === allInterceptors.indexOf(ix) ? `${ix.color}20` : 'transparent',
                border: activeIdx === allInterceptors.indexOf(ix) ? `1.5px solid ${ix.color}` : '1.5px solid transparent',
                transition: 'all 0.3s',
              }}>
                <input type="checkbox" checked={enabled[ix.key]}
                  onChange={() => toggle(ix.key)}
                  style={{ accentColor: ix.color }} />
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: enabled[ix.key] ? ix.color : s.text3,
                  transition: 'all 0.2s',
                }} />
                <span style={{
                  color: enabled[ix.key] ? s.text : s.text3,
                  fontSize: 12, fontWeight: 600,
                  transition: 'color 0.2s',
                }}>{ix.label}</span>
                <span style={{ color: s.text3, fontSize: 10, marginLeft: 'auto' }}>
                  {i === 0 ? '1st' : i === 1 ? '2nd' : `${i + 1}th`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {log.length > 0 && (
          <div style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 8, padding: '10px 14px', marginBottom: 16, maxHeight: 180, overflowY: 'auto',
          }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Execution Trace</div>
            {log.map((entry, i) => (
              <div key={i} style={{
                fontFamily: s.mono, fontSize: 11, color: s.text2,
                padding: '3px 0', borderBottom: i < log.length - 1 ? `1px solid ${s.border}` : 'none',
              }}>
                <span style={{ color: s.text3, marginRight: 8 }}>{i + 1}.</span>
                {entry}
              </div>
            ))}
            {phase === 'done' && (
              <div style={{
                fontFamily: s.mono, fontSize: 11, color: s.green,
                padding: '6px 0', fontWeight: 700,
                borderTop: `1px solid ${s.border}`, marginTop: 4,
              }}>
                {resultMsg}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={run} disabled={phase === 'running'} style={{
            background: phase === 'running' ? s.bg3 : s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: phase === 'running' ? s.text3 : '#fff', cursor: phase === 'running' ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600, flex: 1,
          }}>{phase === 'running' ? 'Executing...' : 'Send Request'}</button>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: `1px solid ${s.border}`, paddingTop: 12 }}>
          <div style={{ color: s.text3, fontSize: 11 }}>Interceptor execution order:</div>
          {allInterceptors.map((ix, i) => (
            <div key={ix.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ix.color, flexShrink: 0 }} />
              <span style={{ color: enabled[ix.key] ? s.text2 : s.text3, fontSize: 10 }}>{ix.label}</span>
              {i < allInterceptors.length - 1 && (
                <span style={{ color: s.text3, fontSize: 10, margin: '0 2px' }}>{'>'}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
