import { useState, useRef, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

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
  tech: string[]
  tier: number
}

const SERVICES: ServiceNode[] = [
  { id: 'mobile', label: 'Mobile / Web', color: s.text, desc: 'Client apps for iOS, Android, and Web', tech: ['Swift', 'Kotlin', 'React', 'WebGL'], tier: 0 },
  { id: 'cdn', label: 'CDN (Tiles)', color: s.orange, desc: 'Edge-cached map tiles, Street View panoramas, and static assets', tech: ['Cloudflare', 'Akamai', 'Edge Cache'], tier: 1 },
  { id: 'lb', label: 'Load Balancer', color: s.accent, desc: 'GFE (Google Front End) terminates TLS and routes to API Gateway', tech: ['Google Front End', 'Maglev'], tier: 2 },
  { id: 'gateway', label: 'API Gateway', color: s.purple, desc: 'Routes requests to microservices. Handles auth, rate limiting, and request validation.', tech: ['Apigee', 'OAuth2', 'Rate Limiting'], tier: 3 },
  { id: 'tile', label: 'Tile Service', color: s.orange, desc: 'Serves map tiles from CDN or renders vector tiles on the fly', tech: ['Vector Tiles', 'MVT', 'GCS'], tier: 4 },
  { id: 'geocode', label: 'Geocoding Service', color: s.green, desc: 'Forward and reverse geocoding using spatial index', tech: ['Bigtable', 'QuadTree', 'N-gram Index'], tier: 4 },
  { id: 'routing', label: 'Routing Service', color: s.accent, desc: 'A* pathfinding on road graph with traffic-aware weights', tech: ['Cassandra', 'A*', 'gRPC'], tier: 4 },
  { id: 'traffic', label: 'Traffic Service', color: s.yellow, desc: 'Real-time speed multipliers from GPS probes and road sensors', tech: ['Kafka', 'Spark', 'Bigtable'], tier: 4 },
  { id: 'places', label: 'Places Service', color: s.purple, desc: 'POI search, nearby discovery, and place details', tech: ['Geohash', 'Inverted Index', 'Bigtable'], tier: 4 },
  { id: 'nav', label: 'Navigation Service', color: s.green, desc: 'Turn-by-turn guidance, maneuver slicing, ETA prediction', tech: ['ML Model', 'TTS', 'WebSocket'], tier: 4 },
  { id: 'streetview', label: 'Street View Service', color: s.red, desc: 'Serves 360-degree panoramas from car fleet', tech: ['GCS', 'Panorama Stitching', 'CDN'], tier: 4 },
  { id: 'spatial', label: 'Spatial Index (DB)', color: s.text3, desc: 'Geohash + quadtree index for all location data', tech: ['Bigtable', 'Cassandra', 'Redis'], tier: 5 },
  { id: 'roadgraph', label: 'Road Graph (DB)', color: s.text3, desc: 'Edge-weighted directed graph of global roads', tech: ['Cassandra', 'In-Memory Cache'], tier: 5 },
  { id: 'poi', label: 'POI Database', color: s.text3, desc: '150M+ points of interest with categories and features', tech: ['Bigtable', 'Redis Cache'], tier: 5 },
]

const TIER_LABELS = ['Client', 'CDN', 'Edge', 'Gateway', 'Services', 'Data Stores']

const TIER_COLORS = [s.text, s.orange, s.accent, s.purple, s.text, s.text3]

const CONNS: { from: string; to: string; label: string }[] = [
  { from: 'mobile', to: 'cdn', label: 'tiles + panoramas' },
  { from: 'mobile', to: 'lb', label: 'API calls' },
  { from: 'cdn', to: 'tile', label: 'cache miss' },
  { from: 'lb', to: 'gateway', label: 'HTTPS' },
  { from: 'gateway', to: 'tile', label: '/tiles' },
  { from: 'gateway', to: 'geocode', label: '/geocode' },
  { from: 'gateway', to: 'routing', label: '/directions' },
  { from: 'gateway', to: 'traffic', label: '/traffic' },
  { from: 'gateway', to: 'places', label: '/places' },
  { from: 'gateway', to: 'nav', label: '/navigate' },
  { from: 'gateway', to: 'streetview', label: '/streetview' },
  { from: 'routing', to: 'traffic', label: 'speed data' },
  { from: 'routing', to: 'spatial', label: 'index lookup' },
  { from: 'routing', to: 'roadgraph', label: 'graph load' },
  { from: 'geocode', to: 'spatial', label: 'quadtree' },
  { from: 'places', to: 'spatial', label: 'geohash' },
  { from: 'places', to: 'poi', label: 'place data' },
  { from: 'nav', to: 'routing', label: 'route req' },
  { from: 'traffic', to: 'spatial', label: 'probe index' },
  { from: 'streetview', to: 'cdn', label: 'upload panorama' },
]

export default function MapsArchitectureDemo() {
  const [selected, setSelected] = useState<string | null>(null)
  const [animStep, setAnimStep] = useState(-1)
  const [animRunning, setAnimRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const ANIM_PATH = ['mobile', 'lb', 'gateway', 'routing', 'traffic', 'roadgraph', 'routing', 'gateway', 'mobile']

  const startAnim = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setAnimRunning(true)
    setAnimStep(0)
    let i = 0
    const tick = () => {
      if (i < ANIM_PATH.length) {
        setAnimStep(i)
        i++
        timerRef.current = setTimeout(tick, 600)
      } else {
        setAnimRunning(false)
      }
    }
    timerRef.current = setTimeout(tick, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const svc = SERVICES.find(sv => sv.id === selected)

  const TIERS = Array.from(new Set(SERVICES.map(s => s.tier))).sort((a, b) => a - b)

  const getPos = (id: string) => {
    const svc = SERVICES.find(s => s.id === id)!
    const sameTier = SERVICES.filter(s => s.tier === svc.tier)
    const idx = sameTier.indexOf(svc)
    const total = sameTier.length
    const colSpacing = 120
    const startX = 500 - (total - 1) * colSpacing / 2
    const x = startX + idx * colSpacing
    const y = 50 + svc.tier * 90
    return { x, y }
  }

  const animNode = animStep >= 0 && animStep < ANIM_PATH.length ? ANIM_PATH[animStep] : null

  const isAnimatingEdge = (from: string, to: string) => {
    if (animStep < 0) return false
    const i = ANIM_PATH.indexOf(from)
    if (i >= 0 && i + 1 < ANIM_PATH.length && ANIM_PATH[i + 1] === to) {
      return animStep > i
    }
    if (i === animStep) return true
    return false
  }

  return (
    <DemoBoundary name="Google Maps System Architecture">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.text, letterSpacing: -0.3 }}>System Architecture</div>
            <button onClick={startAnim} disabled={animRunning} style={{
              padding: '8px 18px', borderRadius: 6, border: 'none',
              background: animRunning ? s.bg3 : s.accent, color: animRunning ? s.text3 : '#fff',
              fontSize: 12, fontWeight: 600, cursor: animRunning ? 'not-allowed' : 'pointer',
              fontFamily: s.mono,
            }}>
              {animRunning ? 'Routing Request...' : 'Animate Request'}
            </button>
          </div>

          <p style={{ color: s.text2, fontSize: 13, margin: '0 0 14px', lineHeight: 1.5 }}>
            Click any service to see details. Press "Animate Request" to trace a navigation request through the system.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16 }}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 8, overflow: 'hidden' }}>
              <svg width={500} height={580} viewBox="0 0 500 580" style={{ display: 'block' }}>
                {CONNS.map((c, i) => {
                  const from = getPos(c.from)
                  const to = getPos(c.to)
                  const isAnimated = isAnimatingEdge(c.from, c.to)
                  return (
                    <g key={i}>
                      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                        stroke={isAnimated ? s.accent : s.border}
                        strokeWidth={isAnimated ? 2.5 : 0.8}
                        strokeDasharray={isAnimated ? 'none' : '4 4'}
                        opacity={isAnimated ? 1 : 0.4}
                        style={{ transition: 'all 0.3s' }}
                      />
                      {(isAnimated || selected && (c.from === selected || c.to === selected)) && (
                        <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 5}
                          textAnchor="middle" fill={s.accent} fontSize={7} fontFamily={s.mono}
                          opacity={0.8}>
                          {c.label}
                        </text>
                      )}
                    </g>
                  )
                })}

                {SERVICES.map(sv => {
                  const pos = getPos(sv.id)
                  const isSelected = selected === sv.id
                  const isAnimNode = animNode === sv.id
                  const isOtherAnim = animNode && (ANIM_PATH.includes(sv.id) && sv.id !== animNode)

                  return (
                    <g key={sv.id} onClick={() => setSelected(isSelected ? null : sv.id)} style={{ cursor: 'pointer' }}>
                      <rect x={pos.x - 48} y={pos.y - 14} width={96} height={28} rx={6}
                        fill={isAnimNode ? `${s.accent}30` : isSelected ? `${sv.color}20` : s.bg3}
                        stroke={isAnimNode ? s.accent : isSelected ? sv.color : s.border}
                        strokeWidth={isAnimNode ? 2.5 : isSelected ? 2 : 1}
                        style={{ transition: 'all 0.3s' }}
                      />
                      <text x={pos.x} y={pos.y + 4} textAnchor="middle" dominantBaseline="middle"
                        fill={isAnimNode ? s.accent : isSelected ? sv.color : isOtherAnim ? s.text : s.text2}
                        fontSize={9} fontWeight={isAnimNode || isSelected ? 700 : 500}
                        fontFamily={s.mono}
                        style={{ transition: 'all 0.3s' }}
                      >
                        {sv.label}
                      </text>
                      {isAnimNode && (
                        <circle cx={pos.x + 52} cy={pos.y - 8} r={5} fill={s.green} stroke={s.bg2} strokeWidth={1.5} />
                      )}
                    </g>
                  )
                })}

                {TIERS.map((tier, i) => (
                  <text key={tier} x={10} y={50 + tier * 90}
                    fill={TIER_COLORS[i]} fontSize={8} fontFamily={s.mono} opacity={0.6}>
                    {TIER_LABELS[i]}
                  </text>
                ))}
              </svg>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {svc ? (
                <div style={{ background: s.bg, border: `1px solid ${svc.color}44`, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: svc.color, marginBottom: 6 }}>{svc.label}</div>
                  <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.5, marginBottom: 8 }}>{svc.desc}</div>
                  <div style={{ fontSize: 11, color: s.text3, marginBottom: 4, fontFamily: s.mono }}>Tech Stack</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {svc.tech.map(t => (
                      <span key={t} style={{
                        fontSize: 10, fontFamily: s.mono, padding: '2px 7px', borderRadius: 3,
                        background: s.bg3, color: s.text2, border: `1px solid ${s.border}`,
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 12, color: s.text3, textAlign: 'center', lineHeight: 1.5 }}>
                    Click a service to see details
                  </div>
                </div>
              )}

              {animStep >= 0 && (
                <div style={{ background: s.bg, border: `1px solid ${s.accent}40`, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, fontFamily: s.mono, textTransform: 'uppercase', letterSpacing: 1 }}>Request Flow</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {ANIM_PATH.slice(0, animStep + 1).map((id, i) => {
                      const sv = SERVICES.find(s => s.id === id)!
                      return (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '3px 6px', borderRadius: 4,
                          background: i === animStep ? `${s.accent}15` : 'transparent',
                        }}>
                          <span style={{
                            width: 16, height: 16, borderRadius: '50%',
                            background: i === animStep ? s.green : s.bg3,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, color: '#fff', fontFamily: s.mono,
                            flexShrink: 0,
                          }}>{i + 1}</span>
                          <span style={{
                            fontSize: 11, fontFamily: s.mono,
                            color: i === animStep ? s.accent : s.text3,
                          }}>{sv.label}</span>
                        </div>
                      )
                    })}
                    {animRunning && (
                      <div style={{ fontSize: 10, color: s.text3, textAlign: 'center', padding: 4, fontFamily: s.mono }}>
                        Processing...
                      </div>
                    )}
                    {!animRunning && animStep >= ANIM_PATH.length - 1 && (
                      <div style={{ fontSize: 10, color: s.green, textAlign: 'center', padding: 4, fontFamily: s.mono }}>
                        Route displayed on client
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 10, color: s.text3, marginBottom: 4, fontFamily: s.mono, textTransform: 'uppercase', letterSpacing: 1 }}>Data Flow</div>
                <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, lineHeight: 1.6 }}>
                  Client {'>'} CDN {'>'} LB {'>'} Gateway {'>'} Services {'>'} DB
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
