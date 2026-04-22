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

interface Request {
  id: number
  clientIdx: number
  serverIdx: number
  progress: number
  active: boolean
  done: boolean
}

const clientLabels = ['Client A', 'Client B', 'Client C']
const serverLabels = ['Server 1', 'Server 2', 'Server 3']
const serverColors = [s.accent, s.green, s.orange]

export default function LoadBalancerOverviewDemo() {
  const [lbEnabled, setLbEnabled] = useState(true)
  const [requests, setRequests] = useState<Request[]>([])
  const [serverLoad, setServerLoad] = useState([0, 0, 0])
  const [nextId, setNextId] = useState(0)
  const [autoSend, setAutoSend] = useState(false)

  const sendRequest = useCallback(() => {
    const id = nextId
    setNextId(p => p + 1)
    const clientIdx = Math.floor(Math.random() * 3)
    let serverIdx: number
    if (lbEnabled) {
      const min = Math.min(...serverLoad)
      const candidates = serverLoad.reduce<number[]>((acc, l, i) => {
        if (l === min) acc.push(i)
        return acc
      }, [])
      serverIdx = candidates[Math.floor(Math.random() * candidates.length)]
    } else {
      serverIdx = 0
    }
    const req: Request = { id, clientIdx, serverIdx, progress: 0, active: true, done: false }
    setRequests(prev => [...prev, req])
    setServerLoad(prev => {
      const copy = [...prev]
      copy[serverIdx]++
      return copy
    })
  }, [lbEnabled, serverLoad, nextId])

  useEffect(() => {
    if (!autoSend) return
    const t = setInterval(sendRequest, 800)
    return () => clearInterval(t)
  }, [autoSend, sendRequest])

  useEffect(() => {
    if (requests.length === 0) return
    const t = setInterval(() => {
      setRequests(prev => {
        let changed = false
        const updated = prev.map(r => {
          if (!r.active) return r
          changed = true
          const np = r.progress + 2
          if (np >= 100) {
            setServerLoad(sl => {
              const c = [...sl]
              c[r.serverIdx] = Math.max(0, c[r.serverIdx] - 1)
              return c
            })
            return { ...r, progress: 100, active: false, done: true }
          }
          return { ...r, progress: np }
        })
        if (!changed && prev.every(r => !r.active)) {
          setTimeout(() => setRequests(p => p.filter(r => r.progress >= 100).length > 3 ? [] : p), 2000)
        }
        return updated
      })
    }, 30)
    return () => clearInterval(t)
  }, [requests.length])

  const reset = () => {
    setRequests([])
    setServerLoad([0, 0, 0])
    setNextId(0)
    setAutoSend(false)
  }

  const w = 760
  const h = 320
  const cx = w / 2
  const cy = h / 2
  const clientX = 80
  const serverX = w - 80
  const lbX = cx
  const clientY = [60, 160, 260]
  const serverY = [60, 160, 260]

  return (
    <DemoBoundary name="Load Balancer Overview">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Load Balancer Overview</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Toggle the load balancer on and off. Watch how traffic distributes evenly with an LB -- and how one server gets crushed without it.
        </p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <button onClick={() => { setLbEnabled(!lbEnabled); reset() }} style={{
            background: lbEnabled ? s.green : s.red, border: 'none', borderRadius: 8, padding: '8px 18px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
          }}>
            {lbEnabled ? 'LB: ON' : 'LB: OFF'}
          </button>
          <button onClick={sendRequest} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '8px 18px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>Send Request</button>
          <button onClick={() => setAutoSend(!autoSend)} style={{
            background: autoSend ? s.orange : s.bg3, border: `1px solid ${autoSend ? s.orange : s.border}`,
            borderRadius: 8, padding: '8px 18px', color: autoSend ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>{autoSend ? 'Stop Auto' : 'Auto Send'}</button>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 18px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
        </div>
        <div style={{ overflow: 'hidden', borderRadius: 10, background: s.bg, border: `1px solid ${s.border}` }}>
          <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }}>
            {lbEnabled && (
              <rect x={lbX - 50} y={cy - 30} width={100} height={60} rx={10} fill={s.green} fillOpacity={0.15} stroke={s.green} strokeWidth={1.5} />
            )}
            {clientY.map((y, i) => (
              <g key={`c${i}`}>
                <rect x={clientX - 30} y={y - 18} width={60} height={36} rx={8} fill={s.bg3} stroke={s.border} strokeWidth={1} />
                <text x={clientX} y={y + 5} textAnchor="middle" fill={s.text2} fontSize={10} fontFamily={s.mono}>{clientLabels[i]}</text>
              </g>
            ))}
            {serverY.map((y, i) => (
              <g key={`s${i}`}>
                <rect x={serverX - 30} y={y - 18} width={60} height={36} rx={8}
                  fill={serverLoad[i] > 3 && !lbEnabled ? `${s.red}30` : s.bg3}
                  stroke={serverLoad[i] > 3 && !lbEnabled ? s.red : s.border} strokeWidth={1} />
                <text x={serverX} y={y - 2} textAnchor="middle" fill={s.text2} fontSize={10} fontFamily={s.mono}>{serverLabels[i]}</text>
                <text x={serverX} y={y + 12} textAnchor="middle" fill={serverLoad[i] > 3 && !lbEnabled ? s.red : s.text3} fontSize={9} fontFamily={s.mono}>
                  {serverLoad[i]} active
                </text>
              </g>
            ))}
            {lbEnabled && (
              <text x={lbX} y={cy + 5} textAnchor="middle" fill={s.green} fontSize={11} fontWeight={700} fontFamily={s.mono}>LB</text>
            )}
            {!lbEnabled && (
              <g>
                <line x1={clientX + 30} y1={cy} x2={serverX - 30} y2={cy} stroke={s.border} strokeWidth={1} strokeDasharray="6 4" />
                <text x={cx} y={cy - 8} textAnchor="middle" fill={s.red} fontSize={11} fontWeight={700} fontFamily={s.mono}>NO LB</text>
              </g>
            )}
            {requests.filter(r => r.active).map(r => {
              const fromX = clientX + 30
              const fromY = clientY[r.clientIdx]
              const toX = serverX - 30
              const toY = serverY[r.serverIdx]
              let midX = cx
              let midY = cy
              if (lbEnabled) {
                const phase = r.progress / 100
                if (phase < 0.5) {
                  const t = phase * 2
                  midX = fromX + (cx - fromX) * t
                  midY = fromY + (cy - fromY) * t
                } else {
                  const t = (phase - 0.5) * 2
                  midX = cx + (toX - cx) * t
                  midY = cy + (toY - cy) * t
                }
              } else {
                const t = r.progress / 100
                midX = fromX + (toX - fromX) * t
                midY = fromY + (toY - fromY) * t
              }
              return (
                <g key={r.id}>
                  <circle cx={midX} cy={midY} r={5} fill={serverColors[r.serverIdx]} opacity={0.9} />
                  <circle cx={midX} cy={midY} r={8} fill={serverColors[r.serverIdx]} opacity={0.2} />
                </g>
              )
            })}
          </svg>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <div style={{ flex: 1, background: s.bg3, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Server Load</div>
            {serverLabels.map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: serverColors[i], fontSize: 11, fontFamily: s.mono, minWidth: 60 }}>{label}</span>
                <div style={{ flex: 1, height: 4, background: s.bg, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (serverLoad[i] / 5) * 100)}%`,
                    height: '100%', background: serverLoad[i] > 3 ? s.red : serverColors[i],
                    borderRadius: 2, transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ color: serverLoad[i] > 3 ? s.red : s.text3, fontSize: 11, fontFamily: s.mono, minWidth: 16, textAlign: 'right' }}>
                  {serverLoad[i]}
                </span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, background: s.bg3, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Status</div>
            <div style={{ color: lbEnabled ? s.green : s.red, fontSize: 13, fontWeight: 600 }}>
              {lbEnabled ? 'Traffic distributed evenly' : 'Server 1 overwhelmed'}
            </div>
            <div style={{ color: s.text3, fontSize: 12, marginTop: 6 }}>
              {lbEnabled
                ? 'Requests are balanced across all servers using least connections.'
                : 'All requests go to Server 1. Other servers are idle while Server 1 is overloaded.'}
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
