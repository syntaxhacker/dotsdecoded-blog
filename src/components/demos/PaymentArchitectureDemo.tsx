import { useState, useEffect, useCallback, useRef } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController from './SpeedController'
import { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Node {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

interface Edge {
  from: string
  to: string
  label: string
  step: number
}

const nodes: Node[] = [
  { id: 'client', label: 'Client\n(Browser / Mobile)', x: 40, y: 60, width: 120, height: 60 },
  { id: 'gateway', label: 'API Gateway\n(Rate Limit / Auth)', x: 250, y: 60, width: 130, height: 60 },
  { id: 'payment', label: 'Payment Service\n(Idempotency)', x: 430, y: 40, width: 130, height: 50 },
  { id: 'fraud', label: 'Fraud Service\n(ML + Rules)', x: 430, y: 120, width: 130, height: 50 },
  { id: 'ledger', label: 'Ledger Service\n(Double-Entry)', x: 430, y: 200, width: 130, height: 50 },
  { id: 'processor', label: 'Processor Adapter\n(Stripe / Adyen)', x: 640, y: 40, width: 130, height: 50 },
  { id: 'bank', label: 'Bank / Network\n(Visa / Mastercard)', x: 640, y: 120, width: 130, height: 50 },
  { id: 'webhook', label: 'Webhook Service\n(Event Delivery)', x: 640, y: 200, width: 130, height: 50 },
  { id: 'notify', label: 'Notification\n(Email / SMS)', x: 250, y: 200, width: 130, height: 50 },
]

const edges: Edge[] = [
  { from: 'client', to: 'gateway', label: 'POST /payments', step: 0 },
  { from: 'gateway', to: 'payment', label: 'Forward request', step: 1 },
  { from: 'payment', to: 'fraud', label: 'Check fraud', step: 2 },
  { from: 'fraud', to: 'payment', label: 'Score: 0.02', step: 3 },
  { from: 'payment', to: 'processor', label: 'Charge request', step: 4 },
  { from: 'processor', to: 'bank', label: 'Authorization', step: 5 },
  { from: 'bank', to: 'processor', label: 'Approved', step: 6 },
  { from: 'processor', to: 'payment', label: 'auth_xxx', step: 7 },
  { from: 'payment', to: 'ledger', label: 'Record debit/credit', step: 8 },
  { from: 'ledger', to: 'payment', label: 'Ledger OK', step: 9 },
  { from: 'payment', to: 'webhook', label: 'Fire event', step: 10 },
  { from: 'webhook', to: 'notify', label: 'Send receipt', step: 11 },
  { from: 'webhook', to: 'gateway', label: 'payment_intent.succeeded callback', step: 12 },
  { from: 'gateway', to: 'client', label: '200 OK', step: 13 },
]

const nodeColors: Record<string, string> = {
  client: s.accent,
  gateway: s.purple,
  payment: s.green,
  fraud: s.orange,
  ledger: s.yellow,
  processor: s.accent,
  bank: s.red,
  webhook: s.purple,
  notify: s.green,
}

export default function PaymentArchitectureDemo() {
  const [activeStep, setActiveStep] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [completedEdges, setCompletedEdges] = useState<number[]>([])
  const [activeEdge, setActiveEdge] = useState<number | null>(null)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepRef = useRef(-1)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const advanceStep = useCallback(() => {
    stepRef.current += 1
    setActiveStep(stepRef.current)

    if (stepRef.current >= edges.length) {
      setIsPlaying(false)
      setActiveEdge(null)
      setActiveNodeId(null)
      return
    }

    const edge = edges[stepRef.current]
    setActiveEdge(stepRef.current)
    setActiveNodeId(edge.from)
    setCompletedEdges(prev => [...prev, stepRef.current])

    const delay = getStepDelay(700, speed)
    timerRef.current = setTimeout(() => {
      setActiveNodeId(edge.to)
      setActiveEdge(null)

      const nextDelay = getStepDelay(400, speed)
      timerRef.current = setTimeout(() => {
        advanceStep()
      }, nextDelay)
    }, delay)
  }, [edges, speed])

  const startAnimation = useCallback(() => {
    clearTimer()
    stepRef.current = -1
    setActiveStep(-1)
    setCompletedEdges([])
    setActiveEdge(null)
    setActiveNodeId('client')
    setIsPlaying(true)

    const delay = getStepDelay(600, speed)
    timerRef.current = setTimeout(() => {
      advanceStep()
    }, delay)
  }, [clearTimer, advanceStep, speed])

  const resetAnimation = useCallback(() => {
    clearTimer()
    stepRef.current = -1
    setActiveStep(-1)
    setCompletedEdges([])
    setActiveEdge(null)
    setActiveNodeId(null)
    setIsPlaying(false)
  }, [clearTimer])

  useEffect(() => {
    return clearTimer
  }, [clearTimer])

  const svgW = 800
  const svgH = 280
  const pad = 20

  const edgePath = (from: string, to: string): string => {
    const f = nodes.find(n => n.id === from)
    const t = nodes.find(n => n.id === to)
    if (!f || !t) return ''
    const x1 = f.x + f.width
    const y1 = f.y + f.height / 2
    const x2 = t.x
    const y2 = t.y + t.height / 2
    const cx = (x1 + x2) / 2
    if (Math.abs(y1 - y2) < 20) {
      return `M${x1},${y1} L${x2},${y2}`
    }
    return `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`
  }

  return (
    <DemoBoundary name="Payment System Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, letterSpacing: -0.3 }}>Payment System Architecture</div>
          <div style={{ color: s.text2, fontSize: 13, marginTop: 4 }}>
            Complete end-to-end flow from checkout to settlement
          </div>
        </div>
        <SpeedController speed={speed} onSpeedChange={setSpeed} />
      </div>

      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, border: `1px solid ${s.border}`, marginBottom: 20 }}>
        <svg viewBox={`-${pad} -${pad} ${svgW + pad * 2} ${svgH + pad * 2}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {edges.map((edge, i) => {
            const path = edgePath(edge.from, edge.to)
            const isCompleted = completedEdges.includes(i)
            const isActive = activeEdge === i
            const f = nodes.find(n => n.id === edge.from)
            const t = nodes.find(n => n.id === edge.to)
            if (!f || !t || !path) return null

            const midX = (f.x + f.width + t.x) / 2
            const midY = Math.max(f.y, t.y) + Math.min(f.height, t.height) / 2

            return (
              <g key={i}>
                <path
                  d={path}
                  fill="none"
                  stroke={isActive ? s.yellow : isCompleted ? s.green : s.border}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  strokeDasharray={isCompleted ? 'none' : '6,4'}
                  opacity={isCompleted || isActive ? 1 : 0.3}
                  style={{ transition: 'all 0.3s ease' }}
                />
                {isActive && (
                  <circle r={4} fill={s.yellow}>
                    <animateMotion dur="0.7s" repeatCount="1" path={path} />
                  </circle>
                )}
                {(isCompleted || isActive) && (
                  <text x={midX} y={midY - 8} textAnchor="middle" fill={isActive ? s.yellow : s.text3} fontSize={9} fontFamily={s.mono}>
                    {edge.label}
                  </text>
                )}
              </g>
            )
          })}

          {nodes.map(node => {
            const isHighlighted = activeNodeId === node.id
            const color = nodeColors[node.id] || s.accent
            return (
              <g key={node.id}>
                <rect
                  x={node.x} y={node.y}
                  width={node.width} height={node.height}
                  rx={8} ry={8}
                  fill={isHighlighted ? `${color}25` : s.bg2}
                  stroke={isHighlighted ? color : s.border}
                  strokeWidth={isHighlighted ? 2 : 1}
                  style={{ transition: 'all 0.3s ease' }}
                />
                {node.label.split('\n').map((line, i) => (
                  <text
                    key={i}
                    x={node.x + node.width / 2}
                    y={node.y + node.height / 2 - (node.label.includes('\n') ? 4 : 0) + i * 14}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isHighlighted ? color : s.text}
                    fontSize={10}
                    fontFamily={s.mono}
                    fontWeight={isHighlighted ? 700 : 400}
                    style={{ transition: 'all 0.3s ease' }}
                  >
                    {line}
                  </text>
                ))}
                {isHighlighted && (
                  <rect
                    x={node.x - 3} y={node.y - 3}
                    width={node.width + 6} height={node.height + 6}
                    rx={10} ry={10}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="4,3"
                    opacity={0.6}
                  >
                    <animate attributeName="stroke-dashoffset" from="0" to="14" dur="1s" repeatCount="indefinite" />
                  </rect>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={startAnimation} disabled={isPlaying} style={{
          background: isPlaying ? s.bg3 : s.accent,
          border: 'none', borderRadius: 8, padding: '10px 20px',
          color: isPlaying ? s.text3 : '#fff',
          cursor: isPlaying ? 'not-allowed' : 'pointer',
          fontSize: 13, fontWeight: 600,
        }}>
          {isPlaying ? 'Animating...' : 'Animate Payment Flow'}
        </button>
        <button onClick={resetAnimation} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
          color: s.text2, cursor: 'pointer', fontSize: 13,
        }}>
          Reset
        </button>
      </div>

      {activeStep >= 0 && activeStep < edges.length && (
        <div style={{
          background: `${s.yellow}12`, border: `1px solid ${s.yellow}40`, borderRadius: 8,
          padding: '10px 14px',
        }}>
          <div style={{ color: s.yellow, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
            Step {activeStep + 1} of {edges.length}
          </div>
          <div style={{ color: s.text2, fontSize: 12 }}>
            <span style={{ color: s.text, fontWeight: 600 }}>{edges[activeStep].from}</span>
            {' -> '}
            <span style={{ color: s.text, fontWeight: 600 }}>{edges[activeStep].to}</span>
            : {edges[activeStep].label}
          </div>
        </div>
      )}

      {activeStep >= edges.length && (
        <div style={{
          background: `${s.green}12`, border: `1px solid ${s.green}40`, borderRadius: 8,
          padding: '10px 14px',
        }}>
          <div style={{ color: s.green, fontSize: 12, fontWeight: 600 }}>
            Payment Complete - Settlement in Progress
          </div>
          <div style={{ color: s.text2, fontSize: 11, marginTop: 2 }}>
            The payment was authorized, captured, and recorded in the ledger. Funds will settle in 1-2 business days.
          </div>
        </div>
      )}
    </div>
    </DemoBoundary>
  )
}
