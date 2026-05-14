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

interface ServiceNode {
  id: string
  label: string
  color: string
  desc: string
  details: string[]
  x: number
  y: number
}

const services: ServiceNode[] = [
  { id: 'client', label: 'Client Apps', color: s.text2, desc: 'Web, iOS, Android, Smart TV, Game Console', details: ['Netflix UI rendered on device', 'HLS/DASH player with ABR logic', 'DRM client for content decryption', 'Offline download manager'], x: 60, y: 120 },
  { id: 'cdn', label: 'CDN / Open Connect', color: s.green, desc: 'Netflix-owned CDN appliances at ISP peering points', details: ['Custom Open Connect appliances deployed in ISP data centers', 'Serve 95%+ of traffic without touching origin', 'Pre-position popular content during off-peak hours', 'Regional cache hierarchy with LRU eviction'], x: 220, y: 80 },
  { id: 'gateway', label: 'API Gateway', color: s.accent, desc: 'Zuul-based gateway handling auth, routing, rate limiting', details: ['Routes requests to appropriate microservice', 'Authentication and token validation', 'Rate limiting per profile/device', 'Request logging and metrics'], x: 340, y: 120 },
  { id: 'catalog', label: 'Catalog Service', color: s.purple, desc: 'Content metadata, search, browse', details: ['PostgreSQL + Redis cache', 'Full-text search with Elasticsearch', 'Personalized row ordering', 'Genre and mood-based browsing'], x: 480, y: 60 },
  { id: 'playback', label: 'Playback Service', color: s.orange, desc: 'Streaming session management, ABR decisions', details: ['Assigns CDN endpoint per session', 'Generates HLS/DASH manifest URLs', 'Tracks per-session bitrate and buffering', 'Reports QoS metrics in real-time'], x: 480, y: 150 },
  { id: 'recs', label: 'Recommendation', color: s.yellow, desc: 'Personalized ML model serving', details: ['Collaborative filtering pipeline', 'Content-based tag matching', 'A/B test framework for model variants', 'Real-time and batch inference paths'], x: 620, y: 60 },
  { id: 'user', label: 'User Service', color: s.red, desc: 'Profiles, auth, watch history, billing', details: ['Profile CRUD with avatar and maturity settings', 'Watch history + progress tracking in Cassandra', 'Billing via Stripe integration', 'Multi-factor authentication'], x: 620, y: 150 },
  { id: 'encoding', label: 'Encoding Service', color: s.green, desc: 'Transcoding, packaging, DRM', details: ['FFmpeg-based distributed transcoding cluster', 'Dynamic packaging into HLS + DASH', 'Per-title encoding optimization', 'Widevine, FairPlay, PlayReady DRM'], x: 340, y: 240 },
  { id: 'db', label: 'Data Stores', color: s.text3, desc: 'Cassandra, PostgreSQL, S3, Elasticsearch, Redis', details: ['Cassandra: watch history, session state', 'PostgreSQL: catalog, billing, user data', 'S3: thumbnails, artwork, subtitle files', 'Elasticsearch: search indexing and suggestions', 'Redis: cache layer with TTL-based eviction', 'DynamoDB: high-throughput event logging'], x: 620, y: 240 },
]

const connections: { from: string; to: string; label: string }[] = [
  { from: 'client', to: 'cdn', label: 'stream segments' },
  { from: 'client', to: 'gateway', label: 'API calls' },
  { from: 'gateway', to: 'catalog', label: 'browse' },
  { from: 'gateway', to: 'playback', label: 'play request' },
  { from: 'gateway', to: 'user', label: 'auth/profile' },
  { from: 'gateway', to: 'recs', label: 'recommend' },
  { from: 'playback', to: 'cdn', label: 'assign edge' },
  { from: 'playback', to: 'encoding', label: 'manifest' },
  { from: 'catalog', to: 'db', label: 'metadata' },
  { from: 'playback', to: 'db', label: 'sessions' },
  { from: 'user', to: 'db', label: 'profiles' },
  { from: 'recs', to: 'db', label: 'models' },
  { from: 'client', to: 'playback', label: 'QoS reports' },
]

interface FlowStep {
  id: string
  label: string
  detail: string
}

const playFlow: FlowStep[] = [
  { id: 'client', label: 'User taps play', detail: 'Client sends POST /api/playback/init with video_id and profile_id' },
  { id: 'gateway', label: 'API Gateway', detail: 'Zuul validates JWT token, checks rate limit, routes to Playback Service' },
  { id: 'playback', label: 'Playback Service', detail: 'Fetches user profile, device capabilities, and network conditions from session store' },
  { id: 'catalog', label: 'Catalog Query', detail: 'Looks up video metadata: available audio tracks, subtitle languages, DRM schemes' },
  { id: 'encoding', label: 'Manifest Generation', detail: 'Encoding service generates personalized HLS/DASH manifest with license URLs' },
  { id: 'cdn', label: 'CDN Assignment', detail: 'Playback assigns the nearest Open Connect appliance and returns stream URLs' },
  { id: 'client', label: 'Playback begins', detail: 'Client fetches manifest, starts ABR, reports QoS telemetry every 10 seconds' },
]

export default function NetflixArchitectureDemo() {
  const [selected, setSelected] = useState<string | null>(null)
  const [flowActive, setFlowActive] = useState(false)
  const [flowStep, setFlowStep] = useState(-1)
  const [speed, setSpeed] = useState(1)

  const svc = services.find(sv => sv.id === selected)
  const relatedConns = connections.filter(c => c.from === selected || c.to === selected)

  const resetFlow = useCallback(() => {
    setFlowActive(false)
    setFlowStep(-1)
  }, [])

  const startFlow = useCallback(() => {
    resetFlow()
    setFlowActive(true)
  }, [resetFlow])

  useEffect(() => {
    if (!flowActive) return
    const t = setTimeout(() => {
      setFlowStep(prev => {
        if (prev >= playFlow.length - 1) {
          setFlowActive(false)
          return prev
        }
        return prev + 1
      })
    }, getStepDelay(1000, speed))
    return () => clearTimeout(t)
  }, [flowActive, flowStep, speed])

  useEffect(() => {
    if (flowActive && flowStep === -1) {
      setFlowStep(0)
    }
  }, [flowActive, flowStep])

  const computedRelatedConns = relatedConns

  return (
    <DemoBoundary name="Netflix System Architecture">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, padding: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Netflix Architecture</div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
            Click any service to see details, or press "Play" to trace a play request through the full architecture.
          </p>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
            <button onClick={flowActive ? resetFlow : startFlow} style={{
              background: flowActive ? s.red : s.green, border: 'none', borderRadius: 8,
              padding: '8px 24px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {flowActive ? 'Stop' : 'Play'}
            </button>
            <button onClick={resetFlow} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '8px 16px', color: s.text2, cursor: 'pointer', fontSize: 13,
            }}>Reset</button>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>

          <div style={{ overflow: 'hidden', borderRadius: 8, border: `1px solid ${s.border}`, background: s.bg, marginBottom: 16 }}>
            <svg viewBox="-10 -10 790 340" style={{ width: '100%', display: 'block' }}>
              {connections.map((c, i) => {
                const from = services.find(sv => sv.id === c.from)
                const to = services.find(sv => sv.id === c.to)
                if (!from || !to) return null

                let activeConn = false
                if (flowStep >= 0 && flowStep < playFlow.length) {
                  const step = playFlow[flowStep]
                  activeConn = (step.id === c.from) || (step.id === c.to)
                }

                const hovered = selected && (c.from === selected || c.to === selected)
                return (
                  <g key={i}>
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={activeConn ? s.green : hovered ? s.accent : s.border}
                      strokeWidth={activeConn ? 2.5 : hovered ? 1.5 : 0.8}
                      strokeDasharray={activeConn ? 'none' : '4 4'}
                      opacity={activeConn ? 1 : hovered ? 0.8 : 0.3}
                      style={{ transition: 'all 0.3s' }} />
                    {(activeConn || hovered) && (
                      <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6}
                        textAnchor="middle" fill={activeConn ? s.green : s.accent}
                        fontSize={8} fontFamily={s.mono} opacity={0.9}>
                        {c.label}
                      </text>
                    )}
                  </g>
                )
              })}

              {services.map(sv => {
                const isSelected = selected === sv.id
                const isFlowActive = flowStep >= 0 && flowStep < playFlow.length && playFlow[flowStep].id === sv.id
                const isRelated = selected && connections.some(
                  c => (c.from === selected && c.to === sv.id) || (c.to === selected && c.from === sv.id)
                )
                const w = sv.label.length > 15 ? 110 : 90
                const h = 36
                return (
                  <g key={sv.id} onClick={() => setSelected(isSelected ? null : sv.id)} style={{ cursor: 'pointer' }}>
                    <rect x={sv.x - w / 2} y={sv.y - h / 2} width={w} height={h} rx={8}
                      fill={isFlowActive ? `${sv.color}30` : isSelected ? `${sv.color}20` : isRelated ? `${sv.color}10` : s.bg3}
                      stroke={isFlowActive ? s.green : isSelected ? sv.color : isRelated ? `${sv.color}80` : s.border2}
                      strokeWidth={isFlowActive ? 3 : isSelected ? 2 : 1}
                      style={{ transition: 'all 0.3s' }} />
                    <text x={sv.x} y={sv.y + 1} textAnchor="middle" dominantBaseline="middle"
                      fill={isFlowActive ? '#fff' : isSelected ? sv.color : isRelated ? s.text : s.text2}
                      fontSize={isFlowActive ? 10 : 9} fontWeight={600}
                      fontFamily={s.mono}
                      style={{ transition: 'fill 0.2s' }}>
                      {sv.label}
                    </text>
                    {(isFlowActive || isSelected) && (
                      <circle cx={sv.x + w / 2 + 6} cy={sv.y - h / 2 - 6} r={4}
                        fill={isFlowActive ? s.green : sv.color} opacity={0.8}>
                        {isFlowActive && <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" />}
                      </circle>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: s.bg, borderRadius: 8, padding: 16, border: `1px solid ${s.border}`, minHeight: 140 }}>
              {flowStep >= 0 && flowStep < playFlow.length ? (
                <div>
                  <div style={{ fontSize: 11, color: s.text3, marginBottom: 8, fontFamily: s.mono }}>STEP {flowStep + 1} OF {playFlow.length}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', background: `${s.green}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: s.mono, fontSize: 10, color: s.green, fontWeight: 700,
                    }}>{flowStep + 1}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: services.find(sv => sv.id === playFlow[flowStep].id)?.color || s.text }}>
                      {playFlow[flowStep].label}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.6 }}>
                    {playFlow[flowStep].detail}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', paddingTop: 30, color: s.text3, fontSize: 12 }}>
                  Press "Play" to trace a play request or click a service for details
                </div>
              )}
            </div>

            <div style={{ background: s.bg, borderRadius: 8, padding: 16, border: `1px solid ${s.border}`, minHeight: 140 }}>
              {svc ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: svc.color }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: svc.color }}>{svc.label}</div>
                  </div>
                  <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.5, marginBottom: 10 }}>{svc.desc}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {svc.details.map((d, i) => (
                      <div key={i} style={{ fontSize: 10, color: s.text3, paddingLeft: 8, borderLeft: `2px solid ${s.border}`, fontFamily: s.mono }}>
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', paddingTop: 30, color: s.text3, fontSize: 12 }}>
                  Select a service node to see its details
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 12 }}>
            <div style={{ display: 'flex', gap: 16, fontSize: 10, fontFamily: s.mono, color: s.text3, flexWrap: 'wrap' }}>
              <span>Click nodes to inspect</span>
              <span style={{ color: s.green }}>Green = active flow step</span>
              <span style={{ color: s.accent }}>Blue = selection highlight</span>
              <span>Lines show data flow direction</span>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
