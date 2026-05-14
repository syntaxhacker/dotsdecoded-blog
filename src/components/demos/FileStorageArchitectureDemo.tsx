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

interface Node {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  color: string
}

const nodes: Node[] = [
  { id: 'client', label: 'Client\nDevices', x: 20, y: 140, w: 120, h: 60, color: s.accent },
  { id: 'cdn', label: 'CDN\n(Cloudflare)', x: 190, y: 140, w: 120, h: 60, color: s.purple },
  { id: 'lb', label: 'Load\nBalancer', x: 360, y: 140, w: 100, h: 60, color: s.orange },
  { id: 'api', label: 'API\nServers', x: 510, y: 140, w: 100, h: 60, color: s.yellow },
  { id: 'metadata', label: 'Metadata\nService', x: 510, y: 30, w: 100, h: 50, color: s.green },
  { id: 'db', label: 'Metadata\nDB', x: 660, y: 30, w: 100, h: 50, color: s.green },
  { id: 'chunk', label: 'Chunk\nService', x: 510, y: 250, w: 100, h: 50, color: s.accent },
  { id: 'blob', label: 'Blob Store\n(S3/GCS)', x: 660, y: 250, w: 110, h: 50, color: s.accent },
  { id: 'dedup', label: 'Dedup\nCache', x: 360, y: 250, w: 100, h: 50, color: s.red },
  { id: 'notify', label: 'Notify\nService', x: 360, y: 30, w: 100, h: 50, color: s.yellow },
]

const flowPath: { from: string; to: string }[] = [
  { from: 'client', to: 'cdn' },
  { from: 'cdn', to: 'lb' },
  { from: 'lb', to: 'api' },
  { from: 'api', to: 'chunk' },
  { from: 'chunk', to: 'dedup' },
  { from: 'dedup', to: 'chunk' },
  { from: 'chunk', to: 'blob' },
  { from: 'api', to: 'metadata' },
  { from: 'metadata', to: 'db' },
  { from: 'api', to: 'notify' },
  { from: 'notify', to: 'client' },
]

function getCenter(n: Node): { x: number; y: number } {
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 }
}

interface ArrowProps {
  from: Node
  to: Node
  active: boolean
  idx: number
}

function Arrow({ from, to, active, idx }: ArrowProps) {
  const f = getCenter(from)
  const t = getCenter(to)
  const dx = t.x - f.x
  const dy = t.y - f.y
  const len = Math.sqrt(dx * dx + dy * dy)

  const inset = 8
  const nx = dx / len
  const ny = dy / len
  const sx = f.x + nx * (Math.max(from.w, from.h) / 2 + inset)
  const sy = f.y + ny * (Math.max(from.w, from.h) / 2 + inset)
  const ex = t.x - nx * (Math.max(to.w, to.h) / 2 + inset)
  const ey = t.y - ny * (Math.max(to.w, to.h) / 2 + inset)

  return (
    <line
      x1={sx} y1={sy} x2={ex} y2={ey}
      stroke={active ? s.accent : s.border2}
      strokeWidth={active ? 2.5 : 1.5}
      strokeLinecap="round"
      style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
    />
  )
}

export default function FileStorageArchitectureDemo() {
  const [activeStep, setActiveStep] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const steps = [
    { label: 'Client uploads file', from: 'client', to: 'cdn', desc: 'File chunked and sent over TLS' },
    { label: 'CDN routes request', from: 'cdn', to: 'lb', desc: 'Edge node forwards to origin' },
    { label: 'Load balancer distributes', from: 'lb', to: 'api', desc: 'Least-connections routing' },
    { label: 'API sends to chunk service', from: 'api', to: 'chunk', desc: 'Chunks forwarded for processing' },
    { label: 'Dedup check', from: 'chunk', to: 'dedup', desc: 'SHA-256 hash looked up in dedup cache' },
    { label: 'Store new chunks', from: 'chunk', to: 'blob', desc: 'New chunks compressed, encrypted, stored' },
    { label: 'Update metadata', from: 'api', to: 'metadata', desc: 'File version + chunk assignments recorded' },
    { label: 'Save to metadata DB', from: 'metadata', to: 'db', desc: 'Transaction committed' },
    { label: 'Notify other devices', from: 'api', to: 'notify', desc: 'Push notification sent to connected clients' },
    { label: 'Sync to clients', from: 'notify', to: 'client', desc: 'Other devices pull latest changes' },
  ]

  const play = () => {
    setIsPlaying(true)
    setActiveStep(0)
    let i = 0
    timerRef.current = setInterval(() => {
      i++
      setActiveStep(i)
      if (i >= steps.length) {
        if (timerRef.current) clearInterval(timerRef.current)
        setIsPlaying(false)
      }
    }, 800)
  }

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsPlaying(false)
    setActiveStep(-1)
  }

  const currentEdge = activeStep >= 0 && activeStep < steps.length
    ? { from: steps[activeStep].from, to: steps[activeStep].to }
    : null

  const svgW = 800
  const svgH = 340

  return (
    <DemoBoundary name="File Storage Architecture">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
        System Architecture
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        End-to-end flow from client upload through CDN, load balancer, API servers, chunk processing,
        metadata storage, and cross-device sync notification.
      </p>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12,
        padding: 16, marginBottom: 16, overflow: 'hidden',
      }}>
        <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', maxWidth: svgW }}>
          {nodes.map(n => {
            const isHighlighted = currentEdge && (currentEdge.from === n.id || currentEdge.to === n.id)
            return (
              <g key={n.id}>
                <rect
                  x={n.x} y={n.y} width={n.w} height={n.h} rx={10}
                  fill={isHighlighted ? `${n.color}30` : `${n.color}15`}
                  stroke={isHighlighted ? n.color : s.border}
                  strokeWidth={isHighlighted ? 2 : 1}
                  style={{ transition: 'all 0.3s' }}
                />
                <text
                  x={n.x + n.w / 2} y={n.y + n.h / 2}
                  fill={isHighlighted ? n.color : s.text2}
                  fontSize={11}
                  fontWeight={600}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ transition: 'fill 0.3s' }}
                >
                  {n.label.split('\n').map((line, li) => (
                    <tspan key={li} x={n.x + n.w / 2} dy={li === 0 ? 0 : 14}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            )
          })}

          {flowPath.map((edge, idx) => {
            const from = nodes.find(n => n.id === edge.from)
            const to = nodes.find(n => n.id === edge.to)
            if (!from || !to) return null
            const active = currentEdge && currentEdge.from === edge.from && currentEdge.to === edge.to
            return <Arrow key={idx} from={from} to={to} active={!!active} idx={idx} />
          })}
        </svg>
      </div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12,
        padding: 14, marginBottom: 16, minHeight: 60,
      }}>
        {activeStep >= 0 && activeStep < steps.length ? (
          <div>
            <div style={{ color: s.text, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Step {activeStep + 1}: {steps[activeStep].label}
            </div>
            <div style={{ color: s.text2, fontSize: 12 }}>
              {steps[activeStep].desc}
            </div>
          </div>
        ) : (
          <div style={{ color: s.text3, fontSize: 12 }}>
            Press Play to animate the upload flow through the architecture.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={reset}
          style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: '10px 20px', color: s.text2, cursor: 'pointer', fontSize: 13,
          }}
        >
          Reset
        </button>
        <button
          onClick={play}
          disabled={isPlaying}
          style={{
            background: isPlaying ? s.bg3 : s.accent, border: 'none', borderRadius: 8,
            padding: '10px 20px', color: isPlaying ? s.text3 : '#fff',
            cursor: isPlaying ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
          }}
        >
          {isPlaying ? 'Animating...' : 'Play Architecture Flow'}
        </button>
      </div>
    </div>
    </DemoBoundary>
  )
}
