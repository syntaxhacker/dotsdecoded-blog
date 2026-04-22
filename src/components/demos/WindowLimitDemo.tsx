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

const WINDOW_SECONDS = 10
const MAX_REQUESTS = 5

interface RequestEvent {
  time: number
  allowed: boolean
}

export default function WindowLimitDemo() {
  const [fixedEvents, setFixedEvents] = useState<RequestEvent[]>([])
  const [slidingEvents, setSlidingEvents] = useState<RequestEvent[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [fixedRejected, setFixedRejected] = useState(0)
  const [slidingRejected, setSlidingRejected] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1
        if (next >= WINDOW_SECONDS * 2) {
          setRunning(false)
          return next
        }
        return next
      })
    }, 600)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running])

  const sendRequest = () => {
    const now = elapsed

    const fixedWindowStart = Math.floor(now / WINDOW_SECONDS) * WINDOW_SECONDS
    const fixedCount = fixedEvents.filter(e => e.time >= fixedWindowStart && e.time < fixedWindowStart + WINDOW_SECONDS).length
    const fixedAllowed = fixedCount < MAX_REQUESTS
    if (!fixedAllowed) setFixedRejected(r => r + 1)

    const slidingCount = slidingEvents.filter(e => e.time > now - WINDOW_SECONDS).length
    const slidingAllowed = slidingCount < MAX_REQUESTS
    if (!slidingAllowed) setSlidingRejected(r => r + 1)

    setFixedEvents(prev => [...prev, { time: now, allowed: fixedAllowed }])
    setSlidingEvents(prev => [...prev, { time: now, allowed: slidingAllowed }])
  }

  const burstAtBoundary = () => {
    if (!running) {
      setRunning(true)
      setElapsed(WINDOW_SECONDS - 1)
      setFixedEvents([])
      setSlidingEvents([])
      setFixedRejected(0)
      setSlidingRejected(0)
    }
    for (let i = 0; i < 4; i++) {
      setTimeout(() => sendRequest(), i * 100)
    }
    setTimeout(() => {
      setElapsed(prev => prev + 1)
      for (let i = 0; i < 4; i++) {
        setTimeout(() => sendRequest(), i * 100)
      }
    }, 800)
  }

  const reset = () => {
    setFixedEvents([])
    setSlidingEvents([])
    setElapsed(0)
    setRunning(false)
    setFixedRejected(0)
    setSlidingRejected(0)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const currentFixedWindow = Math.floor(elapsed / WINDOW_SECONDS) * WINDOW_SECONDS
  const fixedCount = fixedEvents.filter(e => e.time >= currentFixedWindow && e.time < currentFixedWindow + WINDOW_SECONDS).length
  const slidingCount = slidingEvents.filter(e => e.time > elapsed - WINDOW_SECONDS).length

  const renderTimeline = (events: RequestEvent[], label: string, color: string, count: number) => {
    const maxTime = WINDOW_SECONDS * 2
    const scale = 380 / maxTime

    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: color, fontWeight: 700, fontSize: 14 }}>{label}</span>
          <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 12 }}>
            {count}/{MAX_REQUESTS} used
          </span>
        </div>

        <div style={{ position: 'relative', height: 60, background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, overflow: 'hidden', marginBottom: 6 }}>
          {[0, WINDOW_SECONDS].map(ws => (
            <div key={ws} style={{
              position: 'absolute', left: ws * scale, top: 0, bottom: 0, width: 1,
              background: s.border2, zIndex: 1,
            }} />
          ))}

          {label === 'Fixed Window' && (
            <div style={{
              position: 'absolute', left: currentFixedWindow * scale, width: WINDOW_SECONDS * scale,
              top: 0, bottom: 0, background: `${color}10`, borderRight: `1px dashed ${color}44`,
            }} />
          )}

          {label === 'Sliding Window' && (
            <div style={{
              position: 'absolute', left: Math.max(0, (elapsed - WINDOW_SECONDS)) * scale, width: WINDOW_SECONDS * scale,
              top: 0, bottom: 0, background: `${color}10`, borderRight: `1px dashed ${color}44`,
            }} />
          )}

          {events.map((ev, i) => (
            <div key={i} style={{
              position: 'absolute', left: ev.time * scale - 4, top: ev.allowed ? 14 : 34,
              width: 8, height: 8, borderRadius: '50%',
              background: ev.allowed ? color : s.red,
            }} />
          ))}

          <div style={{
            position: 'absolute', left: elapsed * scale - 1, top: 0, bottom: 0, width: 2,
            background: s.yellow, zIndex: 2, transition: 'left 0.3s',
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>0s</span>
          <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>{WINDOW_SECONDS}s</span>
          <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>{WINDOW_SECONDS * 2}s</span>
        </div>
      </div>
    )
  }

  return (
    <DemoBoundary name="Fixed vs Sliding Window">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Fixed Window vs Sliding Window</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Both limit to {MAX_REQUESTS} requests per {WINDOW_SECONDS}s window. The fixed window resets at boundaries (allowing double bursts).
          The sliding window tracks a rolling time period (smoother, fairer).
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ color: s.text3, fontSize: 12, lineHeight: '32px', marginRight: 4 }}>Elapsed:</span>
          <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13, background: s.bg3, borderRadius: 6, padding: '6px 12px' }}>
            {elapsed}s
          </span>
          {!running && elapsed < WINDOW_SECONDS * 2 && (
            <button onClick={() => setRunning(true)} style={{
              background: s.green, border: 'none', borderRadius: 8, padding: '6px 14px',
              color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>Start Clock</button>
          )}
          <button onClick={burstAtBoundary} style={{
            background: s.orange, border: 'none', borderRadius: 8, padding: '6px 14px',
            color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>Burst at Boundary</button>
        </div>

        {renderTimeline(fixedEvents, 'Fixed Window', s.accent, fixedCount)}
        {renderTimeline(slidingEvents, 'Sliding Window', s.green, slidingCount)}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={sendRequest} disabled={elapsed >= WINDOW_SECONDS * 2} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: elapsed >= WINDOW_SECONDS * 2 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
            opacity: elapsed >= WINDOW_SECONDS * 2 ? 0.5 : 1,
          }}>Send Request</button>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: 12, border: `1px solid ${s.border}` }}>
            <div style={{ color: s.accent, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Fixed Window</div>
            <div style={{ color: s.red, fontFamily: s.mono, fontSize: 13 }}>{fixedRejected} rejected</div>
            <div style={{ color: s.text3, fontSize: 11, marginTop: 4 }}>Counter resets at window boundary</div>
          </div>
          <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: 12, border: `1px solid ${s.border}` }}>
            <div style={{ color: s.green, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Sliding Window</div>
            <div style={{ color: s.red, fontFamily: s.mono, fontSize: 13 }}>{slidingRejected} rejected</div>
            <div style={{ color: s.text3, fontSize: 11, marginTop: 4 }}>Rolling period, no boundary exploit</div>
          </div>
        </div>

        <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>The Boundary Problem</div>
          <p style={{ color: s.text2, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Click "Burst at Boundary" to see the exploit: send 4 requests at t=9s, then 4 more at t=10s.
            Fixed window allows all 8 (new window resets the counter). Sliding window rejects 3 of them
            (the 4 from t=9s are still within the 10s rolling window).
          </p>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
