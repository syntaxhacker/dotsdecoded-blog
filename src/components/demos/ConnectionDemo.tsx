import { useState, useEffect, useRef } from 'react'
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

type ConnType = 'polling' | 'websocket' | 'sse'

interface Packet {
  id: number
  direction: 'client' | 'server'
  label: string
  color: string
  y: number
}

function generatePackets(type: ConnType): Packet[] {
  const pkts: Packet[] = []
  let id = 0
  let y = 0

  if (type === 'polling') {
    for (let i = 0; i < 4; i++) {
      pkts.push({ id: id++, direction: 'client', label: 'GET /poll', color: s.accent, y: y++ })
      pkts.push({ id: id++, direction: 'server', label: '200 [] (no data)', color: s.text3, y: y++ })
      pkts.push({ id: id++, direction: 'client', label: 'GET /poll', color: s.accent, y: y++ })
      pkts.push({ id: id++, direction: 'server', label: '200 ["msg"]', color: s.green, y: y++ })
    }
  } else if (type === 'websocket') {
    pkts.push({ id: id++, direction: 'client', label: 'WS handshake (upgrade)', color: s.accent, y: y++ })
    pkts.push({ id: id++, direction: 'server', label: '101 Switching Protocols', color: s.green, y: y++ })
    pkts.push({ id: id++, direction: 'server', label: 'msg: "Hey there"', color: s.green, y: y++ })
    pkts.push({ id: id++, direction: 'client', label: 'msg: "Hi back"', color: s.accent, y: y++ })
    pkts.push({ id: id++, direction: 'server', label: 'msg: "How are you?"', color: s.green, y: y++ })
    pkts.push({ id: id++, direction: 'client', label: 'msg: "Good!"', color: s.accent, y: y++ })
    pkts.push({ id: id++, direction: 'server', label: 'msg: "Great, talk later"', color: s.green, y: y++ })
  } else {
    pkts.push({ id: id++, direction: 'client', label: 'GET /events', color: s.accent, y: y++ })
    pkts.push({ id: id++, direction: 'server', label: '200 (stream open)', color: s.green, y: y++ })
    pkts.push({ id: id++, direction: 'server', label: 'data: msg1', color: s.green, y: y++ })
    pkts.push({ id: id++, direction: 'server', label: 'data: msg2', color: s.green, y: y++ })
    pkts.push({ id: id++, direction: 'server', label: 'data: msg3', color: s.green, y: y++ })
    pkts.push({ id: id++, direction: 'client', label: 'GET /events (reconnect)', color: s.orange, y: y++ })
    pkts.push({ id: id++, direction: 'server', label: '200 (stream resumes)', color: s.green, y: y++ })
  }

  return pkts
}

const connInfo: Record<ConnType, { name: string; latency: string; overhead: string; direction: string; useCase: string; connType: string }> = {
  polling: { name: 'Long Polling', latency: '200-1000ms', overhead: 'High (full HTTP each time)', direction: 'Client -> Server only', useCase: 'Legacy browsers', connType: 'HTTP request/response' },
  websocket: { name: 'WebSocket', latency: '<50ms', overhead: 'Very low (2-byte frames)', direction: 'Bidirectional', useCase: 'Chat, gaming, collab', connType: 'Persistent TCP socket' },
  sse: { name: 'Server-Sent Events', latency: '<100ms', overhead: 'Low (chunked HTTP)', direction: 'Server -> Client only', useCase: 'Notifications, feeds', connType: 'HTTP long-lived' },
}

export default function ConnectionDemo() {
  const [activeType, setActiveType] = useState<ConnType>('polling')
  const [animating, setAnimating] = useState(false)
  const [visiblePkts, setVisiblePkts] = useState(0)
  const [speed, setSpeed] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  const packets = generatePackets(activeType)
  const info = connInfo[activeType]

  useEffect(() => {
    if (!animating) return
    if (visiblePkts >= packets.length) {
      setAnimating(false)
      return
    }
    const delay = getStepDelay(400, speed)
    const t = setTimeout(() => setVisiblePkts((v) => v + 1), delay)
    return () => clearTimeout(t)
  }, [animating, visiblePkts, packets.length, speed])

  useEffect(() => {
    setVisiblePkts(0)
    setAnimating(false)
  }, [activeType])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [visiblePkts])

  const start = () => {
    setVisiblePkts(0)
    setAnimating(true)
  }

  return (
    <DemoBoundary name="Connection Protocols">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['polling', 'websocket', 'sse'] as ConnType[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: activeType === t ? s.bg3 : s.bg2,
                border: `1px solid ${activeType === t ? s.border2 : s.border}`,
                borderRadius: 6,
                color: activeType === t ? s.text : s.text3,
                fontFamily: s.mono,
                fontSize: 11,
                fontWeight: activeType === t ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {info.name === 'Long Polling' ? 'Long Polling' : t === 'websocket' ? 'WebSocket' : 'SSE'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '8px 14px',
                borderBottom: `1px solid ${s.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {info.name} — Sequence Diagram
                </span>
                <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
                  {visiblePkts}/{packets.length}
                </span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <svg width="100%" viewBox="0 0 380 360" style={{ display: 'block' }}>
                  <line x1="60" y1="10" x2="60" y2="350" stroke={s.border} strokeWidth="1" strokeDasharray="4 3" />
                  <line x1="320" y1="10" x2="320" y2="350" stroke={s.border} strokeWidth="1" strokeDasharray="4 3" />

                  <rect x="15" y="0" width="90" height="24" rx="4" fill={s.accent} fillOpacity="0.15" stroke={s.accent} strokeWidth="1" />
                  <text x="60" y="16" textAnchor="middle" fill={s.accent} fontSize="11" fontFamily={s.mono} fontWeight="600">CLIENT</text>

                  <rect x="275" y="0" width="90" height="24" rx="4" fill={s.green} fillOpacity="0.15" stroke={s.green} strokeWidth="1" />
                  <text x="320" y="16" textAnchor="middle" fill={s.green} fontSize="11" fontFamily={s.mono} fontWeight="600">SERVER</text>

                  {packets.slice(0, visiblePkts).map((pkt) => {
                    const isClient = pkt.direction === 'client'
                    const x1 = isClient ? 65 : 315
                    const x2 = isClient ? 315 : 65
                    const py = 40 + pkt.y * 42
                    return (
                      <g key={pkt.id}>
                        <line x1={x1} y1={py} x2={x2} y2={py} stroke={pkt.color} strokeWidth="1.5" markerEnd="url(#arrow)" />
                        <text x={isClient ? 190 : 190} y={py - 6} textAnchor="middle" fill={pkt.color} fontSize="9" fontFamily={s.mono}>
                          {pkt.label}
                        </text>
                      </g>
                    )
                  })}

                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill={s.text2} />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          <div style={{ width: 240, flexShrink: 0 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '14px',
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Protocol Comparison
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {([
                  ['Protocol', info.name],
                  ['Connection', info.connType],
                  ['Direction', info.direction],
                  ['Latency', info.latency],
                  ['Overhead', info.overhead],
                  ['Best for', info.useCase],
                ] as const).map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: s.text3, marginBottom: 1 }}>{label}</div>
                    <div style={{ fontSize: 12, color: s.text2, fontFamily: s.mono }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={start}
            disabled={animating}
            style={{
              padding: '8px 28px',
              background: animating ? s.bg3 : s.accent,
              color: animating ? s.text3 : '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: animating ? 'not-allowed' : 'pointer',
              fontFamily: s.mono,
              transition: 'all 0.2s',
            }}
          >
            {visiblePkts >= packets.length && !animating ? 'Replay' : animating ? 'Running...' : 'Animate'}
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
      </div>
    </DemoBoundary>
  )
}
