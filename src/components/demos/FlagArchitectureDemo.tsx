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

const nodes = [
  { id: 'dashboard', label: 'Admin Dashboard', desc: 'Create and update flag rules', color: s.yellow },
  { id: 'api', label: 'Flag Config Service', desc: 'REST API for flag CRUD + evaluation', color: s.accent },
  { id: 'db', label: 'Database', desc: 'Persistent flag config + audit log', color: s.orange },
  { id: 'cache', label: 'CDN Edge Cache', desc: 'Flag config cached globally (30s TTL)', color: s.purple },
  { id: 'stream', label: 'Streaming Gateway', desc: 'SSE/WebSocket push on flag change', color: s.green },
  { id: 'sdk', label: 'SDK Client', desc: 'Local evaluation in-app', color: s.green },
  { id: 'result', label: 'Flag Value', desc: 'Boolean or multivariate result', color: s.text },
]

const connections: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [1, 5],
  [1, 4], [5, 6],
]

const edgeLabels: Record<string, string> = {
  '0->1': 'HTTP POST/PUT',
  '1->2': 'SQL write',
  '2->3': 'Cache warm',
  '1->5': 'REST GET',
  '1->4': 'fanout SSE',
  '5->6': 'eval return',
}

const nodeWidth = 130
const nodeHeight = 60

function layoutNodes(w: number): { id: string; x: number; y: number }[] {
  return [
    { id: 'dashboard', x: w / 2 - 65, y: 0 },
    { id: 'api', x: w / 2 - 65 - 80, y: 110 },
    { id: 'db', x: w / 2 - 65 - 150, y: 220 },
    { id: 'cache', x: w / 2 - 65 + 150, y: 220 },
    { id: 'stream', x: w / 2 - 65 + 150, y: 110 },
    { id: 'sdk', x: w / 2 - 65 - 80, y: 340 },
    { id: 'result', x: w / 2 - 65 - 80, y: 430 },
  ]
}

const streamEvents = [
  { label: 'Flag updated', detail: '"new-checkout" rollout changed from 0% to 50%' },
  { label: 'Cache invalidated', detail: 'CDN purge for flag config key' },
  { label: 'SSE event pushed', detail: 'event: flag_update\ndata: {"flag":"new-checkout","rollout":50}' },
  { label: 'SDK re-evaluates', detail: 'Local eval updates cached flag value' },
  { label: 'App receives update', detail: 'new-checkout = false (still 49% hash threshold)' },
]

type ConnStatus = 'idle' | 'active' | 'done'

export default function FlagArchitectureDemo() {
  const [activeStreamStep, setActiveStreamStep] = useState(-1)
  const [streaming, setStreaming] = useState(false)
  const [connStatus, setConnStatus] = useState<Record<string, ConnStatus>>({})
  const [activeConn, setActiveConn] = useState<[number, number] | null>(null)
  const [evalResult, setEvalResult] = useState<string>('--')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const w = 500
  const positions = layoutNodes(w)

  const resetStream = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveStreamStep(-1)
    setStreaming(false)
    setConnStatus({})
    setActiveConn(null)
    setEvalResult('--')
  }

  const startStream = () => {
    resetStream()
    setStreaming(true)
    setActiveStreamStep(0)

    const steps = [
      { conn: [0, 1] as [number, number], delay: 600 },
      { conn: [1, 2] as [number, number], delay: 600 },
      { conn: [2, 3] as [number, number], delay: 800 },
      { conn: [1, 4] as [number, number], delay: 400 },
      { conn: [1, 5] as [number, number], delay: 500 },
      { conn: [5, 6] as [number, number], delay: 400 },
    ]

    let totalDelay = 0
    steps.forEach((step, i) => {
      totalDelay += step.delay
      timeoutRef.current = setTimeout(() => {
        setActiveConn(step.conn)
        setActiveStreamStep(i + 1)
        setConnStatus(prev => ({
          ...prev,
          [`${step.conn[0]}->${step.conn[1]}`]: 'done',
        }))
        setTimeout(() => setActiveConn(null), 300)

        if (i === steps.length - 1) {
          setTimeout(() => {
            setEvalResult('new-checkout = true')
            setStreaming(false)
          }, 500)
        }
      }, totalDelay)
    })
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const getConnColor = (from: number, to: number): string => {
    const key = `${from}->${to}`
    if (connStatus[key] === 'done') return s.green
    if (activeConn && activeConn[0] === from && activeConn[1] === to) return s.accent
    return s.border2
  }

  const getConnWidth = (from: number, to: number): number => {
    const key = `${from}->${to}`
    if (connStatus[key] === 'done') return 2.5
    if (activeConn && activeConn[0] === from && activeConn[1] === to) return 3
    return 1.5
  }

  return (
    <DemoBoundary name="Flag Architecture">
      <div style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{
          background: s.bg2, borderRadius: 12, padding: '20px 24px',
          border: `1px solid ${s.border}`,
        }}>
          <div style={{
            fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 4,
            letterSpacing: -0.3,
          }}>
            Architecture
          </div>
          <div style={{
            fontSize: 13, color: s.text3, marginBottom: 16, lineHeight: 1.5,
          }}>
            Toggle "Simulate Flag Change" to see the update propagate through the system via CDN cache and SSE streaming.
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button
              onClick={startStream}
              disabled={streaming}
              style={{
                background: streaming ? s.bg3 : s.accent,
                border: 'none', borderRadius: 8, padding: '8px 20px',
                color: '#fff', cursor: streaming ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600,
              }}
            >
              {streaming ? 'Propagating...' : 'Simulate Flag Change'}
            </button>
            <button
              onClick={resetStream}
              style={{
                background: s.bg3, border: `1px solid ${s.border}`,
                borderRadius: 8, padding: '8px 20px',
                color: s.text2, cursor: 'pointer', fontSize: 13,
              }}
            >
              Reset
            </button>
          </div>

          <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
            <svg width={w} height={540} viewBox={`0 0 ${w} 540`} style={{ display: 'block', margin: '0 auto' }}>
              {connections.map(([from, to]) => {
                const f = positions[from]
                const t = positions[to]
                const color = getConnColor(from, to)
                const width = getConnWidth(from, to)

                const fx = f.x + nodeWidth / 2
                const fy = from === 1 && to === 5 ? f.y + nodeHeight
                  : from === 1 && to === 2 ? f.y + nodeHeight
                  : from === 1 && to === 4 ? f.y + nodeHeight
                  : f.y + nodeHeight
                const tx = t.x + nodeWidth / 2
                const ty = to === 2 && from === 1 ? t.y
                  : to === 4 && from === 1 ? t.y
                  : to === 5 && from === 1 ? t.y
                  : t.y

                return (
                  <g key={`${from}->${to}`}>
                    <line
                      x1={fx} y1={fy} x2={tx} y2={ty}
                      stroke={color} strokeWidth={width}
                      strokeDasharray={connStatus[`${from}->${to}`] === 'done' ? 'none' : '6,4'}
                      style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                    />
                    {activeConn && activeConn[0] === from && activeConn[1] === to && (
                      <circle r={5} fill={s.accent} style={{ transition: 'all 0.2s' }}>
                        <animateMotion
                          dur="0.4s"
                          repeatCount="1"
                          path={`M${fx},${fy} L${tx},${ty}`}
                          fill="freeze"
                        />
                      </circle>
                    )}
                    <text
                      x={(fx + tx) / 2} y={(fy + ty) / 2 - 6}
                      textAnchor="middle" fill={s.text3}
                      fontSize={9} fontFamily={s.mono}
                    >
                      {edgeLabels[`${from}->${to}`] || ''}
                    </text>
                  </g>
                )
              })}

              {positions.map((pos, i) => {
                const node = nodes[i]
                return (
                  <g key={node.id}>
                    <rect
                      x={pos.x} y={pos.y}
                      width={nodeWidth} height={nodeHeight} rx={10}
                      fill={s.bg} stroke={node.color}
                      strokeWidth={activeStreamStep >= i ? 2 : 1.5}
                      style={{ transition: 'stroke-width 0.3s' }}
                    />
                    <text
                      x={pos.x + nodeWidth / 2}
                      y={pos.y + 24}
                      textAnchor="middle"
                      fill={node.color}
                      fontSize={12} fontWeight={600}
                      fontFamily={s.mono}
                    >
                      {node.label}
                    </text>
                    <text
                      x={pos.x + nodeWidth / 2}
                      y={pos.y + 44}
                      textAnchor="middle"
                      fill={s.text3}
                      fontSize={9}
                    >
                      {node.desc}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {activeStreamStep > 0 && (
            <div style={{
              marginTop: 16, background: s.bg, borderRadius: 8,
              border: `1px solid ${s.border}`,
            }}>
              <div style={{
                padding: '10px 14px', borderBottom: `1px solid ${s.border}`,
                color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1,
              }}>
                Event Stream
              </div>
              <div style={{ padding: '6px 0' }}>
                {streamEvents.slice(0, activeStreamStep).map((evt, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 14px', display: 'flex', gap: 12,
                      alignItems: 'flex-start',
                      background: i === activeStreamStep - 1 ? `${s.accent}10` : 'transparent',
                    }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: s.green, flexShrink: 0, marginTop: 4,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>
                        {evt.label}
                      </div>
                      <div style={{ color: s.text2, fontSize: 12, fontFamily: s.mono, marginTop: 2 }}>
                        {evt.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {evalResult !== '--' && (
            <div style={{
              marginTop: 12, padding: '10px 16px', borderRadius: 8,
              background: `${s.green}15`,
              border: `1px solid ${s.green}`,
              fontSize: 14, fontWeight: 700, color: s.green,
              fontFamily: s.mono,
            }}>
              {evalResult}
            </div>
          )}
        </div>
      </div>
    </DemoBoundary>
  )
}
