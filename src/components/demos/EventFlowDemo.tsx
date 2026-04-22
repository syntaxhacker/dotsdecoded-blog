import { useState, useEffect, useRef, useCallback } from 'react'
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

type EventType = 'order-placed' | 'payment-processed' | 'inventory-updated' | 'shipping-scheduled' | 'email-sent' | 'analytics-updated'

interface EventNode {
  id: EventType
  label: string
  status: 'idle' | 'active' | 'done'
  x: number
  y: number
  color: string
}

const W = 760
const H = 420

const initialNodes: EventNode[] = [
  { id: 'order-placed', label: 'Order Placed', status: 'idle', x: 60, y: H / 2, color: s.accent },
  { id: 'payment-processed', label: 'Payment Processed', status: 'idle', x: 260, y: H / 2 - 70, color: s.green },
  { id: 'inventory-updated', label: 'Inventory Updated', status: 'idle', x: 460, y: H / 2 - 70, color: s.yellow },
  { id: 'shipping-scheduled', label: 'Shipping Scheduled', status: 'idle', x: 660, y: H / 2 - 70, color: s.purple },
  { id: 'email-sent', label: 'Email Sent', status: 'idle', x: 260, y: H / 2 + 70, color: s.orange },
  { id: 'analytics-updated', label: 'Analytics Updated', status: 'idle', x: 460, y: H / 2 + 70, color: s.red },
]

const edges: [EventType, EventType][] = [
  ['order-placed', 'payment-processed'],
  ['order-placed', 'email-sent'],
  ['order-placed', 'analytics-updated'],
  ['payment-processed', 'inventory-updated'],
  ['inventory-updated', 'shipping-scheduled'],
]

const orchestrationEdges: [EventType, EventType][] = [
  ['order-placed', 'payment-processed'],
  ['order-placed', 'email-sent'],
  ['order-placed', 'analytics-updated'],
  ['payment-processed', 'inventory-updated'],
  ['inventory-updated', 'shipping-scheduled'],
]

const choreographySequence: EventType[] = [
  'order-placed',
  'payment-processed',
  'inventory-updated',
  'shipping-scheduled',
  'email-sent',
  'analytics-updated',
]

export default function EventFlowDemo() {
  const [nodes, setNodes] = useState<EventNode[]>(initialNodes)
  const [mode, setMode] = useState<'choreography' | 'orchestration'>('choreography')
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [step, setStep] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [pulseEdge, setPulseEdge] = useState<[EventType, EventType] | null>(null)

  const start = useCallback(() => {
    setNodes(initialNodes.map((n) => ({ ...n, status: 'idle' })))
    setRunning(true)
    setDone(false)
    setStep(0)
    setPulseEdge(null)
  }, [])

  useEffect(() => {
    if (!running) return
    if (step >= choreographySequence.length) {
      setRunning(false)
      setDone(true)
      return
    }

    const delay = getStepDelay(800, speed)
    const t = setTimeout(() => {
      const currentEvent = choreographySequence[step]
      setNodes((prev) =>
        prev.map((n) => (n.id === currentEvent ? { ...n, status: 'active' } : n))
      )

      if (step > 0) {
        const prevEvent = choreographySequence[step - 1]
        const edgeExists = edges.some(
          ([from, to]) => from === prevEvent && to === currentEvent
        )
        if (edgeExists) {
          setPulseEdge([prevEvent, currentEvent])
        } else {
          setPulseEdge(null)
        }
      }

      const t2 = setTimeout(() => {
        setNodes((prev) =>
          prev.map((n) => (n.id === currentEvent ? { ...n, status: 'done' } : n))
        )
        setStep((prev) => prev + 1)
        setPulseEdge(null)
      }, delay * 0.6)

      return () => clearTimeout(t2)
    }, delay)

    return () => clearTimeout(t)
  }, [running, step, speed])

  const getNode = (id: EventType) => nodes.find((n) => n.id === id)!

  return (
    <DemoBoundary name="Event Flow">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
          <div style={{
            display: 'flex', borderRadius: 6, overflow: 'hidden', border: `1px solid ${s.border}`,
          }}>
            {(['choreography', 'orchestration'] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); start() }} style={{
                padding: '6px 16px', border: 'none', cursor: 'pointer',
                background: mode === m ? s.accent : s.bg2, color: mode === m ? '#fff' : s.text3,
                fontFamily: s.mono, fontSize: 11, fontWeight: 600,
              }}>
                {m === 'choreography' ? 'Choreography' : 'Orchestration'}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, padding: '4px 10px', borderRadius: 4, background: s.bg2, border: `1px solid ${s.border}`, fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
            {mode === 'choreography'
              ? 'Each service listens for events and reacts independently. No central coordinator.'
              : 'A central orchestrator (workflow engine) tells each service what to do next.'}
          </div>
        </div>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden',
        }}>
          <svg width="100%" viewBox={`${-20} ${-20} ${W + 40} ${H + 40}`} style={{ display: 'block' }}>
            {mode === 'orchestration' && (
              <>
                <line x1={380} y1={-10} x2={380} y2={H + 10} stroke={s.border} strokeDasharray="4 4" strokeWidth={1} />
                <text x={380} y={H + 30} textAnchor="middle" fill={s.text3} fontSize={9} fontFamily={s.mono}>
                  ORCHESTRATOR
                </text>
              </>
            )}

            {edges.map(([fromId, toId]) => {
              const from = getNode(fromId)
              const to = getNode(toId)
              const isPulsing = pulseEdge && pulseEdge[0] === fromId && pulseEdge[1] === toId
              const fromDone = from.status === 'done' || from.status === 'active'
              const toDone = to.status === 'done' || to.status === 'active'
              const dx = to.x - from.x
              const dy = to.y - from.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              const ux = dx / dist
              const uy = dy / dist
              const x1 = from.x + ux * 55
              const y1 = from.y + uy * 22
              const x2 = to.x - ux * 65
              const y2 = to.y - uy * 22

              return (
                <g key={`${fromId}-${toId}`}>
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={isPulsing ? s.accent : fromDone && toDone ? s.border2 : s.border}
                    strokeWidth={isPulsing ? 2.5 : 1.5}
                    strokeDasharray={isPulsing ? 'none' : '4 3'}
                  />
                  {isPulsing && (
                    <circle cx={x1} cy={y1} r={3} fill={s.accent}>
                      <animate attributeName="cx" from={x1} to={x2} dur="0.6s" fill="freeze" />
                      <animate attributeName="cy" from={y1} to={y2} dur="0.6s" fill="freeze" />
                    </circle>
                  )}
                </g>
              )
            })}

            {nodes.map((node) => (
              <g key={node.id}>
                <rect
                  x={node.x - 55} y={node.y - 20}
                  width={110} height={40} rx={8}
                  fill={node.status === 'active' ? `${node.color}25` : node.status === 'done' ? `${node.color}15` : s.bg2}
                  stroke={node.status === 'active' ? node.color : node.status === 'done' ? node.color : s.border}
                  strokeWidth={node.status === 'active' ? 2 : 1}
                />
                {node.status === 'active' && (
                  <rect
                    x={node.x - 55} y={node.y - 20}
                    width={110} height={40} rx={8}
                    fill="none"
                    stroke={node.color}
                    strokeWidth={2}
                    opacity={0.5}
                  >
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="1s" repeatCount="indefinite" />
                  </rect>
                )}
                <text
                  x={node.x} y={node.y + 4}
                  textAnchor="middle"
                  fill={node.status === 'idle' ? s.text3 : node.color}
                  fontSize={11}
                  fontFamily={s.mono}
                  fontWeight={node.status !== 'idle' ? 600 : 400}
                >
                  {node.label}
                </text>
                {node.status === 'done' && (
                  <text x={node.x + 50} y={node.y - 10} fill={s.green} fontSize={12}>
                    &#10003;
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginTop: 12 }}>
          <button
            onClick={start}
            disabled={running}
            style={{
              padding: '8px 28px', background: running ? s.bg3 : s.accent,
              color: running ? s.text3 : '#fff', border: 'none', borderRadius: 6,
              fontSize: 13, fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer',
              fontFamily: s.mono, transition: 'all 0.2s',
            }}
          >
            {done ? 'Replay' : running ? 'Running...' : 'Trigger Order'}
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <div style={{
            flex: 1, padding: '8px 12px', borderRadius: 6, background: s.bg2,
            border: `1px solid ${s.border}`, fontFamily: s.mono, fontSize: 10,
          }}>
            <div style={{ color: s.accent, fontWeight: 600, marginBottom: 4 }}>CHOREOGRAPHY</div>
            <div style={{ color: s.text3, lineHeight: 1.5 }}>
              Services react to events on their own. Decentralized, loosely coupled, but harder to trace failures.
            </div>
          </div>
          <div style={{
            flex: 1, padding: '8px 12px', borderRadius: 6, background: s.bg2,
            border: `1px solid ${s.border}`, fontFamily: s.mono, fontSize: 10,
          }}>
            <div style={{ color: s.yellow, fontWeight: 600, marginBottom: 4 }}>ORCHESTRATION</div>
            <div style={{ color: s.text3, lineHeight: 1.5 }}>
              A central workflow engine coordinates. Easier to monitor, but creates coupling to the orchestrator.
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
