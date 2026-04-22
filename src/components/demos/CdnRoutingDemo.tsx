import { useState, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

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

interface EdgeLocation {
  name: string
  x: number
  y: number
  region: string
}

const origin = { name: 'Origin (Virginia)', x: 200, y: 150 }

const edgeLocations: EdgeLocation[] = [
  { name: 'US East', x: 240, y: 130, region: 'North America' },
  { name: 'US West', x: 80, y: 120, region: 'North America' },
  { name: 'Europe', x: 370, y: 100, region: 'Europe' },
  { name: 'Asia', x: 510, y: 150, region: 'Asia Pacific' },
  { name: 'South America', x: 170, y: 280, region: 'South America' },
]

interface UserRequest {
  id: number
  user: string
  x: number
  y: number
  targetX: number
  targetY: number
  latency: number
  cached: boolean
  progress: number
  done: boolean
}

const users = [
  { user: 'User A (New York)', x: 260, y: 125 },
  { user: 'User B (Tokyo)', x: 530, y: 140 },
  { user: 'User C (London)', x: 380, y: 90 },
  { user: 'User D (Sao Paulo)', x: 180, y: 295 },
  { user: 'User E (Sydney)', x: 560, y: 310 },
]

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

function nearestEdge(x: number, y: number): EdgeLocation {
  let nearest = edgeLocations[0]
  let minD = Infinity
  for (const loc of edgeLocations) {
    const d = dist(x, y, loc.x, loc.y)
    if (d < minD) { minD = d; nearest = loc }
  }
  return nearest
}

export default function CdnRoutingDemo() {
  const [cdnEnabled, setCdnEnabled] = useState(false)
  const [requests, setRequests] = useState<UserRequest[]>([])
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [userIdx, setUserIdx] = useState(-1)
  const [cacheInvalidated, setCacheInvalidated] = useState(false)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    if (!running || userIdx >= users.length - 1) {
      if (userIdx >= users.length - 1) setRunning(false)
      return
    }

    const t = setTimeout(() => {
      const next = userIdx + 1
      const u = users[next]
      const edge = nearestEdge(u.x, u.y)
      const originDist = dist(u.x, u.y, origin.x, origin.y)
      const edgeDist = dist(u.x, u.y, edge.x, edge.y)
      const originLatency = Math.round(originDist * 2.5)
      const edgeLatency = Math.round(edgeDist * 2.5)

      const cached = !cacheInvalidated && next > 0

      if (cdnEnabled) {
        const targetX = edge.x
        const targetY = edge.y
        const latency = cached ? Math.round(edgeLatency * 0.3) : edgeLatency + 10
        setRequests(prev => [...prev, {
          id: next, user: u.user, x: u.x, y: u.y,
          targetX, targetY, latency, cached, progress: 0, done: false,
        }])
        setLog(l => [...l, `${u.user} -> ${edge.name} (${cached ? 'cache hit' : 'cache miss'}, ${latency}ms)`])
      } else {
        const latency = originLatency
        setRequests(prev => [...prev, {
          id: next, user: u.user, x: u.x, y: u.y,
          targetX: origin.x, targetY: origin.y, latency, cached: false, progress: 0, done: false,
        }])
        setLog(l => [...l, `${u.user} -> ${origin.name} (${latency}ms)`])
      }

      setUserIdx(next)
    }, getStepDelay(900, speed))

    return () => clearTimeout(t)
  }, [running, userIdx, speed, cdnEnabled, cacheInvalidated])

  useEffect(() => {
    if (requests.length === 0) return
    const animating = requests.filter(r => !r.done)
    if (animating.length === 0) return

    const t = setInterval(() => {
      setRequests(prev => prev.map(r => {
        if (r.done) return r
        const newProgress = r.progress + 3
        if (newProgress >= 100) return { ...r, progress: 100, done: true }
        return { ...r, progress: newProgress }
      }))
    }, getStepDelay(50, speed))

    return () => clearInterval(t)
  }, [requests, speed])

  const toggleCdn = (enabled: boolean) => {
    setCdnEnabled(enabled)
    setRequests([])
    setUserIdx(-1)
    setRunning(false)
    setLog([])
    setCacheInvalidated(false)
  }

  const start = () => {
    setRequests([])
    setUserIdx(-1)
    setRunning(true)
    setLog([])
    setCacheInvalidated(false)
  }

  const invalidateCache = () => {
    setCacheInvalidated(true)
    setLog(l => [...l, 'Cache invalidated on all edge nodes'])
  }

  const w = 620
  const h = 360

  return (
    <DemoBoundary name="CDN Routing">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>CDN Routing</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Compare requests with and without CDN. Watch how edge caching reduces latency for users worldwide.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => toggleCdn(false)} style={{
            background: !cdnEnabled ? s.red : s.bg3, border: `1px solid ${!cdnEnabled ? s.red : s.border}`,
            borderRadius: 8, padding: '6px 16px', color: !cdnEnabled ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>Without CDN</button>
          <button onClick={() => toggleCdn(true)} style={{
            background: cdnEnabled ? s.green : s.bg3, border: `1px solid ${cdnEnabled ? s.green : s.border}`,
            borderRadius: 8, padding: '6px 16px', color: cdnEnabled ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>With CDN</button>
          <button onClick={start} disabled={running} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '6px 16px',
            color: '#fff', cursor: running ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
            opacity: running ? 0.6 : 1,
          }}>Send Requests</button>
          {cdnEnabled && requests.some(r => r.cached) && (
            <button onClick={invalidateCache} style={{
              background: s.yellow + '20', border: `1px solid ${s.yellow}`, borderRadius: 8, padding: '6px 16px',
              color: s.yellow, cursor: 'pointer', fontSize: 13,
            }}>Invalidate Cache</button>
          )}
          <div style={{ flex: 1 }} />
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ overflow: 'hidden', borderRadius: 8, border: `1px solid ${s.border}`, marginBottom: 12 }}>
          <svg viewBox={`-20 -20 ${w + 40} ${h + 40}`} style={{ width: '100%', display: 'block' }}>
            <rect x={-20} y={-20} width={w + 40} height={h + 40} fill={s.bg} />

            {cdnEnabled && edgeLocations.map(loc => (
              <g key={loc.name}>
                <rect x={loc.x - 22} y={loc.y - 22} width={44} height={44} rx={8} fill={s.green + '15'} stroke={s.green + '60'} strokeWidth={1.5} />
                <text x={loc.x} y={loc.y - 4} textAnchor="middle" fill={s.green} fontSize={9} fontWeight={700}>{loc.name}</text>
                <text x={loc.x} y={loc.y + 8} textAnchor="middle" fill={s.text3} fontSize={7}>Edge</text>
              </g>
            ))}

            <rect x={origin.x - 26} y={origin.y - 26} width={52} height={52} rx={10} fill={s.orange + '15'} stroke={s.orange} strokeWidth={1.5} />
            <text x={origin.x} y={origin.y - 5} textAnchor="middle" fill={s.orange} fontSize={8} fontWeight={700}>Origin</text>
            <text x={origin.x} y={origin.y + 7} textAnchor="middle" fill={s.text3} fontSize={7}>Virginia</text>

            {cdnEnabled && requests.filter(r => r.done && r.cached).length > 0 && edgeLocations.map(loc => (
              <rect key={`cached-${loc.name}`} x={loc.x - 8} y={loc.y + 16} width={16} height={10} rx={3} fill={s.green + '30'} />
            ))}

            {requests.map(req => {
              const progress = req.progress / 100
              const cx = req.x + (req.targetX - req.x) * progress
              const cy = req.y + (req.targetY - req.y) * progress
              return (
                <g key={req.id}>
                  <line x1={req.x} y1={req.y} x2={req.targetX} y2={req.targetY}
                    stroke={req.cached ? s.green + '30' : cdnEnabled ? s.accent + '30' : s.red + '30'}
                    strokeWidth={1} strokeDasharray="4,4" />
                  <circle cx={req.x} cy={req.y} r={5} fill={s.accent} opacity={0.6} />
                  <circle cx={cx} cy={cy} r={4} fill={req.cached ? s.green : s.accent}>
                    <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" />
                  </circle>
                  {req.done && (
                    <text x={(req.x + req.targetX) / 2} y={(req.y + req.targetY) / 2 - 8}
                      textAnchor="middle" fill={req.cached ? s.green : s.text2} fontSize={8} fontFamily={s.mono}>
                      {req.latency}ms {req.cached ? '(cached)' : ''}
                    </text>
                  )}
                </g>
              )
            })}

            {users.map((u, i) => (
              <g key={u.user}>
                <circle cx={u.x} cy={u.y} r={6} fill={i <= userIdx ? s.accent : s.text3} />
                <text x={u.x} y={u.y + 18} textAnchor="middle" fill={s.text3} fontSize={7}>{u.user.split(' ')[0]} {u.user.split(' ')[1]}</text>
              </g>
            ))}
          </svg>
        </div>

        {requests.length > 0 && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.accent }} />
              <span style={{ color: s.text3, fontSize: 11 }}>Request in flight</span>
            </div>
            {cdnEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.green }} />
                <span style={{ color: s.text3, fontSize: 11 }}>Cache hit</span>
              </div>
            )}
            <div style={{ marginLeft: 'auto', color: s.text2, fontSize: 12, fontFamily: s.mono }}>
              Avg: {requests.filter(r => r.done).length > 0
                ? Math.round(requests.filter(r => r.done).reduce((a, r) => a + r.latency, 0) / requests.filter(r => r.done).length)
                : 0}ms
            </div>
          </div>
        )}

        {log.length > 0 && (
          <div style={{ background: s.bg, borderRadius: 8, padding: 12, maxHeight: 110, overflowY: 'auto', border: `1px solid ${s.border}` }}>
            {log.map((entry, i) => (
              <div key={i} style={{ fontFamily: s.mono, fontSize: 11, lineHeight: 1.6, color: entry.includes('invalidated') ? s.yellow : s.text3 }}>
                {entry}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
