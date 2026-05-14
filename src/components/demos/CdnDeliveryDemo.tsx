import { useState, useEffect, useCallback } from 'react'
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

interface CacheNode {
  label: string
  x: number
  y: number
  color: string
}

interface RequestPath {
  id: number
  user: string
  userX: number
  userY: number
  hops: { label: string; x: number; y: number; cached: boolean }[]
  currentHop: number
  done: boolean
  totalLatency: number
  cached: boolean
}

const edgeNodes: CacheNode[] = [
  { label: 'Edge (US East)', x: 420, y: 80, color: s.green },
  { label: 'Edge (Europe)', x: 550, y: 50, color: s.green },
  { label: 'Edge (Asia)', x: 680, y: 100, color: s.green },
]

const regionalNodes: CacheNode[] = [
  { label: 'Regional (US)', x: 350, y: 180, color: s.yellow },
  { label: 'Regional (EU)', x: 520, y: 170, color: s.yellow },
  { label: 'Regional (APAC)', x: 650, y: 200, color: s.yellow },
]

const origin: CacheNode = { label: 'Origin (Virginia)', x: 350, y: 280, color: s.red }

interface UserData {
  label: string
  x: number
  y: number
  edgeIdx: number
}

const users: UserData[] = [
  { label: 'New York', x: 390, y: 60, edgeIdx: 0 },
  { label: 'London', x: 510, y: 30, edgeIdx: 1 },
  { label: 'Tokyo', x: 690, y: 80, edgeIdx: 2 },
  { label: 'Sao Paulo', x: 250, y: 300, edgeIdx: 0 },
  { label: 'Sydney', x: 720, y: 310, edgeIdx: 2 },
]

function getHops(user: UserData, edge: CacheNode, cacheHit: boolean): { label: string; x: number; y: number; cached: boolean }[] {
  if (cacheHit) {
    return [
      { label: edge.label, x: edge.x, y: edge.y, cached: true },
    ]
  }
  const region = edge.label.includes('US') ? regionalNodes[0] : edge.label.includes('Europe') ? regionalNodes[1] : regionalNodes[2]
  return [
    { label: edge.label, x: edge.x, y: edge.y, cached: false },
    { label: region.label, x: region.x, y: region.y, cached: false },
    { label: origin.label, x: origin.x, y: origin.y, cached: false },
  ]
}

export default function CdnDeliveryDemo() {
  const [requests, setRequests] = useState<RequestPath[]>([])
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [userIdx, setUserIdx] = useState(-1)
  const [useWarmCache, setUseWarmCache] = useState(true)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    if (!running || userIdx >= users.length - 1) {
      if (userIdx >= users.length - 1) setRunning(false)
      return
    }
    const t = setTimeout(() => {
      const next = userIdx + 1
      const user = users[next]
      const edge = edgeNodes[user.edgeIdx]
      const cacheHit = useWarmCache && next > 0

      const hops = getHops(user, edge, cacheHit)
      const latency = cacheHit ? 15 + Math.round(Math.random() * 20) : 80 + hops.length * 40 + Math.round(Math.random() * 60)

      setRequests(prev => {
        const existing = prev.find(r => r.id === next)
        if (existing) return prev
        return [...prev, { id: next, user: user.label, userX: user.x, userY: user.y, hops, currentHop: -1, done: false, totalLatency: latency, cached: cacheHit }]
      })
      setLog(l => [...l, `${user.label}: ${cacheHit ? 'CACHE HIT' : 'CACHE MISS'} -> ${edge.label} (${latency}ms)`])
      setUserIdx(next)
    }, getStepDelay(1200, speed))
    return () => clearTimeout(t)
  }, [running, userIdx, speed, useWarmCache])

  useEffect(() => {
    if (requests.length === 0) return
    const active = requests.filter(r => !r.done)
    if (active.length === 0) return

    const t = setInterval(() => {
      setRequests(prev => prev.map(r => {
        if (r.done) return r
        if (r.currentHop < 0) return { ...r, currentHop: 0 }
        const nextHop = r.currentHop + 1
        if (nextHop >= r.hops.length) return { ...r, done: true }
        const delay = r.hops[nextHop].cached ? 0 : 1
        if (delay > 0) return r
        return { ...r, currentHop: nextHop }
      }))

      setRequests(prev => prev.map(r => {
        if (r.done || r.currentHop < 0) return r
        const nextHop = r.currentHop + 1
        if (nextHop >= r.hops.length) return r
        if (Math.random() < 0.015) {
          return { ...r, currentHop: nextHop }
        }
        return r
      }))
    }, getStepDelay(200, speed))
    return () => clearInterval(t)
  }, [requests, speed])

  const start = useCallback(() => {
    setRequests([])
    setUserIdx(-1)
    setRunning(true)
    setLog([])
  }, [])

  const toggleCache = () => {
    setUseWarmCache(prev => !prev)
    setRequests([])
    setUserIdx(-1)
    setRunning(false)
    setLog([])
  }

  const sw = 780
  const sh = 360

  return (
    <DemoBoundary name="CDN Delivery">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, padding: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>CDN Cache Hierarchy</div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
            Requests flow through edge nodes, regional caches, then origin. Warm caches serve from the edge in under 20ms.
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={start} disabled={running} style={{
              background: running ? s.text3 : s.accent, border: 'none', borderRadius: 8,
              padding: '8px 24px', color: '#fff', cursor: running ? 'default' : 'pointer',
              fontSize: 13, fontWeight: 600, opacity: running ? 0.5 : 1,
            }}>Send Requests</button>
            <button onClick={toggleCache} style={{
              background: useWarmCache ? `${s.green}20` : s.bg3,
              border: `1px solid ${useWarmCache ? s.green : s.border}`, borderRadius: 8,
              padding: '8px 16px', color: useWarmCache ? s.green : s.text2, cursor: 'pointer', fontSize: 13,
            }}>{useWarmCache ? 'Warm Cache' : 'Cold Cache'}</button>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>

          <div style={{ overflow: 'hidden', borderRadius: 8, border: `1px solid ${s.border}`, marginBottom: 12, background: s.bg }}>
            <svg viewBox={`-10 -10 ${sw + 20} ${sh + 20}`} style={{ width: '100%', display: 'block' }}>
              {edgeNodes.map(n => (
                <rect key={n.label} x={n.x - 50} y={n.y - 20} width={100} height={40} rx={8}
                  fill={`${s.green}15`} stroke={s.green} strokeWidth={1.5} />
              ))}
              {edgeNodes.map(n => (
                <text key={`l-${n.label}`} x={n.x} y={n.y + 2} textAnchor="middle" fill={s.green} fontSize={9} fontFamily={s.mono} fontWeight={700}>{n.label}</text>
              ))}

              {regionalNodes.map(n => (
                <rect key={n.label} x={n.x - 55} y={n.y - 18} width={110} height={36} rx={6}
                  fill={`${s.yellow}10`} stroke={s.yellow} strokeWidth={1} />
              ))}
              {regionalNodes.map(n => (
                <text key={`l-${n.label}`} x={n.x} y={n.y + 2} textAnchor="middle" fill={s.yellow} fontSize={8} fontFamily={s.mono}>{n.label}</text>
              ))}

              <rect x={origin.x - 55} y={origin.y - 18} width={110} height={36} rx={6}
                fill={`${s.red}10`} stroke={s.red} strokeWidth={1} />
              <text x={origin.x} y={origin.y + 2} textAnchor="middle" fill={s.red} fontSize={8} fontFamily={s.mono}>{origin.label}</text>

              {edgeNodes.map((e, i) => (
                <line key={`e-r${i}`} x1={e.x} y1={e.y + 20} x2={regionalNodes[i].x} y2={regionalNodes[i].y - 18}
                  stroke={s.border} strokeWidth={0.5} strokeDasharray="3 3" opacity={0.4} />
              ))}
              {regionalNodes.map((r, i) => (
                <line key={`r-o${i}`} x1={r.x} y1={r.y + 18} x2={origin.x} y2={origin.y - 18}
                  stroke={s.border} strokeWidth={0.5} strokeDasharray="3 3" opacity={0.4} />
              ))}

              {users.map((u, i) => (
                <circle key={`u-${i}`} cx={u.x} cy={u.y} r={5} fill={i <= userIdx ? s.accent : s.text3} opacity={0.7} />
              ))}
              {users.map((u, i) => (
                <text key={`ul-${i}`} x={u.x} y={u.y + 14} textAnchor="middle" fill={s.text3} fontSize={7}>{u.label}</text>
              ))}

              {requests.map(req => {
                if (req.currentHop < 0) return null
                const currentHop = Math.min(req.currentHop, req.hops.length - 1)
                const hop = req.hops[currentHop]
                const edge = edgeNodes.find(e => e.label === hop.label) || regionalNodes.find(r => r.label === hop.label) || origin
                const progress = req.done ? 1 : 0.5 + Math.sin(Date.now() / 200) * 0.3
                const cx = req.userX + (hop.x - req.userX) * progress * 0.7
                const cy = req.userY + (hop.y - req.userY) * progress * 0.7
                if (req.currentHop > 0) {
                  return (
                    <g key={`req-${req.id}`}>
                      <line x1={req.userX} y1={req.userY} x2={edge.x} y2={edge.y} stroke={req.cached ? s.green : s.accent} strokeWidth={0.5} strokeDasharray="3 3" opacity={0.3} />
                      <circle cx={edge.x} cy={edge.y} r={3} fill={req.cached ? s.green : s.yellow} opacity={0.8} />
                    </g>
                  )
                }
                return (
                  <g key={`req-${req.id}`}>
                    <line x1={req.userX} y1={req.userY} x2={edge.x} y2={edge.y} stroke={req.cached ? s.green : s.accent} strokeWidth={0.5} strokeDasharray="3 3" opacity={0.3} />
                    <circle cx={cx} cy={cy} r={3} fill={req.cached ? s.green : s.accent}>
                      <animate attributeName="r" values="2;4;2" dur="0.8s" repeatCount="indefinite" />
                    </circle>
                  </g>
                )
              })}
            </svg>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Edge Node', color: s.green, desc: 'First stop, 5-15ms latency' },
              { label: 'Regional Cache', color: s.yellow, desc: 'Second tier, 20-40ms' },
              { label: 'Origin', color: s.red, desc: 'Source of truth, 80-200ms' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                <span style={{ color: s.text3, fontSize: 11 }}>{item.label}: {item.desc}</span>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', color: s.text2, fontSize: 12, fontFamily: s.mono }}>
              Served: {requests.filter(r => r.done).length}/{requests.length}
            </div>
          </div>

          {log.length > 0 && (
            <div style={{ background: s.bg, borderRadius: 8, padding: 10, maxHeight: 100, overflowY: 'auto', border: `1px solid ${s.border}` }}>
              {log.map((entry, i) => (
                <div key={i} style={{ fontFamily: s.mono, fontSize: 10, lineHeight: 1.6, color: s.text3 }}>
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
