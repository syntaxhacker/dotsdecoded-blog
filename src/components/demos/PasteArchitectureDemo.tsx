import { useState, useEffect, useCallback, useRef } from 'react'
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

type NodeId = 'client' | 'cdn' | 'lb' | 'api' | 'cache' | 'db' | 'storage' | 'worker'

interface ArchNode {
  id: NodeId
  label: string
  sub: string
  x: number
  y: number
}

const NODES: ArchNode[] = [
  { id: 'client', label: 'Client', sub: 'Browser / API', x: 50, y: 280 },
  { id: 'cdn', label: 'CDN', sub: 'Cloudflare', x: 180, y: 280 },
  { id: 'lb', label: 'Load Balancer', sub: 'NGINX', x: 310, y: 280 },
  { id: 'api', label: 'API Gateway', sub: 'Paste Service', x: 440, y: 280 },
  { id: 'cache', label: 'Cache', sub: 'Redis (hot pastes)', x: 440, y: 150 },
  { id: 'db', label: 'Database', sub: 'PostgreSQL (metadata)', x: 570, y: 280 },
  { id: 'storage', label: 'Object Store', sub: 'S3 / R2 (content)', x: 700, y: 280 },
  { id: 'worker', label: 'Cleanup Worker', sub: 'Expired paste scanner', x: 700, y: 150 },
]

interface Edge {
  from: NodeId
  to: NodeId
  delay: number
}

const CREATE_PATH: Edge[] = [
  { from: 'client', to: 'cdn', delay: 0 },
  { from: 'cdn', to: 'lb', delay: 200 },
  { from: 'lb', to: 'api', delay: 400 },
  { from: 'api', to: 'db', delay: 600 },
  { from: 'db', to: 'storage', delay: 800 },
  { from: 'storage', to: 'db', delay: 1000 },
  { from: 'db', to: 'api', delay: 1200 },
  { from: 'api', to: 'client', delay: 1400 },
]

const VIEW_PATH: Edge[] = [
  { from: 'client', to: 'cdn', delay: 0 },
  { from: 'cdn', to: 'lb', delay: 200 },
  { from: 'lb', to: 'api', delay: 400 },
  { from: 'api', to: 'cache', delay: 600 },
  { from: 'cache', to: 'api', delay: 800 },
  { from: 'api', to: 'client', delay: 1000 },
]

const VIEW_PATH_MISS: Edge[] = [
  { from: 'client', to: 'cdn', delay: 0 },
  { from: 'cdn', to: 'lb', delay: 200 },
  { from: 'lb', to: 'api', delay: 400 },
  { from: 'api', to: 'cache', delay: 600 },
  { from: 'cache', to: 'api', delay: 700 },
  { from: 'api', to: 'db', delay: 900 },
  { from: 'db', to: 'api', delay: 1100 },
  { from: 'api', to: 'cache', delay: 1200 },
  { from: 'cache', to: 'api', delay: 1300 },
  { from: 'api', to: 'client', delay: 1500 },
]

const ALL_EDGES: { from: NodeId; to: NodeId }[] = [
  { from: 'client', to: 'cdn' },
  { from: 'cdn', to: 'lb' },
  { from: 'lb', to: 'api' },
  { from: 'api', to: 'cache' },
  { from: 'cache', to: 'api' },
  { from: 'api', to: 'db' },
  { from: 'db', to: 'api' },
  { from: 'api', to: 'storage' },
  { from: 'storage', to: 'api' },
  { from: 'db', to: 'worker' },
  { from: 'worker', to: 'db' },
  { from: 'db', to: 'storage' },
  { from: 'storage', to: 'db' },
]

function getOffset(from: ArchNode, to: ArchNode): { x: number; y: number } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return { x: 0, y: 0 }
  return { x: dx / len * 30, y: dy / len * 30 }
}

interface Particle {
  id: number
  from: NodeId
  to: NodeId
  progress: number
}

export default function PasteArchitectureDemo() {
  const [flow, setFlow] = useState<'create' | 'view' | 'viewmiss' | null>(null)
  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set())
  const [particles, setParticles] = useState<Particle[]>([])
  const [highlighted, setHighlighted] = useState<NodeId | null>(null)
  const pidRef = useRef(0)

  const animate = useCallback((edges: Edge[], label: string) => {
    setFlow(label as 'create' | 'view' | 'viewmiss')
    setActiveEdges(new Set())
    setParticles([])

    edges.forEach((edge, i) => {
      const key = `${edge.from}-${edge.to}`
      setTimeout(() => {
        setActiveEdges(prev => new Set(prev).add(key))
        const pId = pidRef.current++
        setParticles(prev => [...prev, { id: pId, from: edge.from, to: edge.to, progress: 0 }])
        setHighlighted(edge.from as NodeId)

        const startTime = Date.now()
        const animId = setInterval(() => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / 500, 1)
          setParticles(prev => prev.map(p => p.id === pId ? { ...p, progress } : p))
          if (progress >= 1) {
            clearInterval(animId)
            setHighlighted(edge.to as NodeId)
          }
        }, 16)
      }, edge.delay)
    })

    const totalDuration = Math.max(...edges.map(e => e.delay)) + 600
    setTimeout(() => {
      setFlow(null)
      setActiveEdges(new Set())
      setParticles([])
      setHighlighted(null)
    }, totalDuration)
  }, [])

  return (
    <DemoBoundary name="Pastebin Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Full Architecture</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          The system spans CDN, load balancer, API service, Redis cache, PostgreSQL, and S3-compatible object storage. A background worker handles expiration cleanup.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => animate(CREATE_PATH, 'creating')} disabled={flow !== null} style={{
            flex: 1, padding: '10px 0',
            background: flow === 'creating' ? `${s.green}20` : s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            color: flow === 'creating' ? s.green : s.text2,
            cursor: flow !== null ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600,
            transition: 'all 0.15s ease',
          }}>
            {flow === 'creating' ? 'Animating Create...' : 'Animate Create Flow'}
          </button>
          <button onClick={() => animate(VIEW_PATH, 'viewing')} disabled={flow !== null} style={{
            flex: 1, padding: '10px 0',
            background: flow === 'viewing' ? `${s.accent}20` : s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            color: flow === 'viewing' ? s.accent : s.text2,
            cursor: flow !== null ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600,
            transition: 'all 0.15s ease',
          }}>
            {flow === 'viewing' ? 'Animating View...' : 'Animate View Flow (cache hit)'}
          </button>
          <button onClick={() => animate(VIEW_PATH_MISS, 'viewmiss')} disabled={flow !== null} style={{
            flex: 1, padding: '10px 0',
            background: flow === 'viewmiss' ? `${s.yellow}20` : s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            color: flow === 'viewmiss' ? s.yellow : s.text2,
            cursor: flow !== null ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600,
            transition: 'all 0.15s ease',
          }}>
            {flow === 'viewmiss' ? 'Animating Miss...' : 'Animate View Flow (cache miss)'}
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%', height: 420, overflow: 'hidden' }}>
          <svg width="100%" height="100%" viewBox="0 0 760 420" style={{ position: 'absolute', top: 0, left: 0 }}>
            {ALL_EDGES.map(edge => {
              const from = NODES.find(n => n.id === edge.from)!
              const to = NODES.find(n => n.id === edge.to)!
              const key = `${edge.from}-${edge.to}`
              const isActive = activeEdges.has(key)
              const off = getOffset(from, to)
              return (
                <line
                  key={key}
                  x1={from.x + off.x}
                  y1={from.y + off.y}
                  x2={to.x - off.x}
                  y2={to.y - off.y}
                  stroke={isActive ? s.accent : s.border}
                  strokeWidth={isActive ? 2.5 : 1}
                  strokeOpacity={isActive ? 0.9 : 0.3}
                  style={{ transition: 'stroke 0.15s, stroke-width 0.15s' }}
                />
              )
            })}
            {particles.map(p => {
              const from = NODES.find(n => n.id === p.from)!
              const to = NODES.find(n => n.id === p.to)!
              const x = from.x + (to.x - from.x) * p.progress
              const y = from.y + (to.y - from.y) * p.progress
              return (
                <circle key={p.id} cx={x} cy={y} r={4} fill={s.accent} opacity={0.9} />
              )
            })}
          </svg>

          {NODES.map(node => {
            const isHighlighted = highlighted === node.id
            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: node.x - 48,
                  top: node.y - 24,
                  width: 96,
                  height: 48,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isHighlighted ? `${s.accent}20` : s.bg3,
                  border: `1px solid ${isHighlighted ? s.accent : s.border}`,
                  borderRadius: 8,
                  transition: 'all 0.2s ease',
                  zIndex: 10,
                }}
              >
                <div style={{ color: isHighlighted ? s.accent : s.text, fontSize: 11, fontWeight: 600 }}>{node.label}</div>
                <div style={{ color: s.text3, fontSize: 9, marginTop: 1 }}>{node.sub}</div>
              </div>
            )
          })}
        </div>

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Create Flow</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {CREATE_PATH.filter((_, i) => i % 2 === 0).map(e => {
                  const from = NODES.find(n => n.id === e.from)!
                  const to = NODES.find(n => n.id === e.to)!
                  return (
                    <div key={`${e.from}-${e.to}`} style={{ color: s.text2, fontSize: 11 }}>
                      <span style={{ color: s.text3 }}>{from.label}</span> → <span style={{ color: s.accent }}>{to.label}</span>
                    </div>
                  )
                })}
                <div style={{ color: s.text3, fontSize: 11, marginTop: 4 }}>Store metadata in DB, content in S3</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>View Flow (cache hit)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {VIEW_PATH.filter((_, i) => i % 2 === 0).map(e => {
                  const from = NODES.find(n => n.id === e.from)!
                  const to = NODES.find(n => n.id === e.to)!
                  return (
                    <div key={`${e.from}-${e.to}`} style={{ color: s.text2, fontSize: 11 }}>
                      <span style={{ color: s.text3 }}>{from.label}</span> → <span style={{ color: s.green }}>{to.label}</span>
                    </div>
                  )
                })}
                <div style={{ color: s.green, fontSize: 11, marginTop: 4 }}>Hot paste served from Redis</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Cleanup Worker</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ color: s.text2, fontSize: 11 }}>
                  <span style={{ color: s.text3 }}>Worker</span> → <span style={{ color: s.red }}>DB scan</span> → <span style={{ color: s.text3 }}>Storage delete</span>
                </div>
                <div style={{ color: s.text3, fontSize: 11, marginTop: 4 }}>Soft-delete → grace → hard-delete</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
