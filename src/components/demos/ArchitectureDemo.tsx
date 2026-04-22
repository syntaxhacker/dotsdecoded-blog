import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type ComponentId = 'client' | 'cdn' | 'lb' | 'api' | 'cache' | 'db' | 'queue' | 'workers'

interface ComponentInfo {
  id: ComponentId
  label: string
  color: string
  description: string
  details: string[]
}

const components: ComponentInfo[] = [
  {
    id: 'client', label: 'Client', color: s.text2,
    description: 'Browser or mobile app making HTTP requests',
    details: ['Sends GET /{code} for redirects', 'Sends POST /api/shorten to create links', 'Receives 301/307 redirect responses'],
  },
  {
    id: 'cdn', label: 'CDN', color: s.green,
    description: 'Content Delivery Network (e.g., Cloudflare, Akamai)',
    details: ['Caches redirect responses at edge nodes worldwide', 'Reduces latency for hot short URLs', 'Handles 80%+ of redirect traffic without hitting origin'],
  },
  {
    id: 'lb', label: 'Load Balancer', color: s.accent,
    description: 'Distributes traffic across API servers',
    details: ['Round-robin or least-connections', 'Health checks on backend servers', 'SSL termination', 'Rate limiting'],
  },
  {
    id: 'api', label: 'API Servers', color: s.yellow,
    description: 'Application servers handling business logic',
    details: ['Generate short codes (Base62 or hash)', 'Validate URLs, check for malware', 'Read/write to cache and database', ' Stateless - scale horizontally'],
  },
  {
    id: 'cache', label: 'Redis Cache', color: s.red,
    description: 'In-memory cache for hot short URLs',
    details: ['Key: short_code, Value: original_url', 'TTL-based expiration (e.g., 1 hour)', 'Covers 80/20 rule: 20% of URLs get 80% of traffic', 'Cache-aside pattern: check cache first, then DB'],
  },
  {
    id: 'db', label: 'Database', color: s.purple,
    description: 'Persistent storage for all URL mappings',
    details: ['Primary: NoSQL (DynamoDB, Cassandra) for scale', 'Alternative: sharded PostgreSQL', 'Indexed on short_code for O(1) lookup', 'Replicated for durability'],
  },
  {
    id: 'queue', label: 'Message Queue', color: s.orange,
    description: 'Async pipeline for analytics events',
    details: ['Kafka or SQS for click events', 'Decouples redirect path from analytics', 'Guarantees delivery even during spikes', 'Multiple consumers for different processing'],
  },
  {
    id: 'workers', label: 'Analytics Workers', color: s.text3,
    description: 'Process click events and build analytics',
    details: ['Parse IP to country (GeoIP)', 'Aggregate click counts', 'Store in time-series database', 'Build dashboards and reports'],
  },
]

interface FlowStep {
  component: ComponentId
  action: string
}

const shortenFlow: FlowStep[] = [
  { component: 'client', action: 'POST /api/shorten { url: "..." }' },
  { component: 'lb', action: 'Route to available API server' },
  { component: 'api', action: 'Validate URL, generate short code' },
  { component: 'db', action: 'INSERT new URL mapping' },
  { component: 'cache', action: 'SET short:aB3x9Q -> original_url' },
  { component: 'api', action: 'Return { short_url: ".../aB3x9Q" }' },
  { component: 'client', action: 'Receive 201 Created' },
]

const redirectHotFlow: FlowStep[] = [
  { component: 'client', action: 'GET /aB3x9Q' },
  { component: 'cdn', action: 'HIT: Return cached 301 redirect' },
  { component: 'client', action: 'Redirect to original URL' },
]

const redirectColdFlow: FlowStep[] = [
  { component: 'client', action: 'GET /aB3x9Q' },
  { component: 'cdn', action: 'MISS: Forward to origin' },
  { component: 'lb', action: 'Route to API server' },
  { component: 'api', action: 'Check cache for short:aB3x9Q' },
  { component: 'cache', action: 'MISS: Cache does not have entry' },
  { component: 'db', action: 'SELECT original_url WHERE code = "aB3x9Q"' },
  { component: 'cache', action: 'SET short:aB3x9Q -> original_url (populate cache)' },
  { component: 'queue', action: 'Publish click event for analytics' },
  { component: 'api', action: 'Return 301 redirect' },
  { component: 'client', action: 'Redirect to original URL' },
]

export default function ArchitectureDemo() {
  const [selected, setSelected] = useState<ComponentId | null>(null)
  const [flow, setFlow] = useState<'shorten' | 'hot' | 'cold'>('shorten')
  const [flowStep, setFlowStep] = useState(-1)

  const flowData = flow === 'shorten' ? shortenFlow : flow === 'hot' ? redirectHotFlow : redirectColdFlow
  const selectedInfo = selected ? components.find(c => c.id === selected) : null

  const compPositions: Record<ComponentId, { x: number; y: number }> = {
    client: { x: 60, y: 130 },
    cdn: { x: 200, y: 80 },
    lb: { x: 340, y: 130 },
    api: { x: 480, y: 130 },
    cache: { x: 620, y: 60 },
    db: { x: 620, y: 200 },
    queue: { x: 480, y: 260 },
    workers: { x: 620, y: 260 },
  }

  const edges: [ComponentId, ComponentId][] = [
    ['client', 'cdn'], ['client', 'lb'],
    ['cdn', 'lb'],
    ['lb', 'api'],
    ['api', 'cache'], ['api', 'db'],
    ['api', 'queue'],
    ['queue', 'workers'],
  ]

  return (
    <DemoBoundary name="System Architecture">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: 'hidden' }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${s.border}`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginRight: 4 }}>Request flow:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {([
                { key: 'shorten' as const, label: 'Shorten URL' },
                { key: 'hot' as const, label: 'Redirect (cache hit)' },
                { key: 'cold' as const, label: 'Redirect (cache miss)' },
              ]).map(f => (
                <button key={f.key} onClick={() => { setFlow(f.key); setFlowStep(-1); }} style={{
                  padding: '5px 12px', fontSize: 11, fontFamily: s.mono, borderRadius: 5,
                  border: `1px solid ${flow === f.key ? s.accent : s.border}`,
                  background: flow === f.key ? 'rgba(91,141,239,0.15)' : 'transparent',
                  color: flow === f.key ? s.accent : s.text3, cursor: 'pointer',
                }}>
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={() => setFlowStep(prev => prev >= flowData.length - 1 ? 0 : prev + 1)} style={{
              marginLeft: 8, padding: '5px 12px', fontSize: 11, fontFamily: s.mono, borderRadius: 5,
              border: `1px solid ${s.green}`, background: 'rgba(61,214,140,0.1)', color: s.green, cursor: 'pointer',
            }}>
              {flowStep < 0 ? 'Play' : 'Next'}
            </button>
            <button onClick={() => setFlowStep(-1)} style={{
              padding: '5px 12px', fontSize: 11, fontFamily: s.mono, borderRadius: 5,
              border: `1px solid ${s.border}`, background: 'transparent', color: s.text3, cursor: 'pointer',
            }}>
              Reset
            </button>
          </div>

          <div style={{ padding: 16 }}>
            <svg width="100%" viewBox="-20 -10 760 320" style={{ display: 'block' }}>
              {edges.map(([from, to]) => {
                const fp = compPositions[from]
                const tp = compPositions[to]
                const fromActive = flowStep >= 0 && flowData[flowStep]?.component === from
                const toActive = flowStep >= 0 && flowData[flowStep]?.component === to
                return (
                  <line key={`${from}-${to}`} x1={fp.x} y1={fp.y} x2={tp.x} y2={tp.y}
                    stroke={fromActive || toActive ? s.accent : s.border}
                    strokeWidth={fromActive || toActive ? 2 : 1}
                    opacity={fromActive || toActive ? 1 : 0.4}
                    style={{ transition: 'all 0.3s' }}
                  />
                )
              })}
              {components.map(comp => {
                const pos = compPositions[comp.id]
                const isActive = flowStep >= 0 && flowData[flowStep]?.component === comp.id
                const wasActive = flowStep >= 0 && flowData.slice(0, flowStep + 1).some(st => st.component === comp.id)
                const isSelected = selected === comp.id
                const w = 110
                const h = 40
                return (
                  <g key={comp.id} onClick={() => setSelected(isSelected ? null : comp.id)} style={{ cursor: 'pointer' }}>
                    <rect
                      x={pos.x - w / 2} y={pos.y - h / 2} width={w} height={h} rx={8}
                      fill={isActive ? 'rgba(91,141,239,0.2)' : wasActive ? 'rgba(91,141,239,0.08)' : isSelected ? 'rgba(91,141,239,0.1)' : s.bg3}
                      stroke={isActive ? s.accent : wasActive ? s.accent : isSelected ? s.accent : s.border2}
                      strokeWidth={isActive || isSelected ? 2 : 1}
                      style={{ transition: 'all 0.3s' }}
                    />
                    <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="central"
                      fill={isActive ? '#fff' : comp.color} fontSize={12} fontFamily={s.mono} fontWeight={600}>
                      {comp.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {flowStep >= 0 && flowStep < flowData.length && (
            <div style={{
              padding: '10px 16px', borderTop: `1px solid ${s.border}`, borderBottom: `1px solid ${s.border}`,
              background: 'rgba(91,141,239,0.06)', fontSize: 13, fontFamily: s.mono,
            }}>
              <span style={{ color: s.accent }}>Step {flowStep + 1}/{flowData.length}: </span>
              <span style={{ color: s.text2 }}>{components.find(c => c.id === flowData[flowStep].component)?.label} -- </span>
              <span style={{ color: s.text }}>{flowData[flowStep].action}</span>
            </div>
          )}

          {selectedInfo && (
            <div style={{ padding: '14px 16px', borderTop: `1px solid ${s.border}`, background: s.bg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: selectedInfo.color }} />
                <span style={{ fontSize: 14, fontFamily: s.mono, color: selectedInfo.color, fontWeight: 600 }}>{selectedInfo.label}</span>
              </div>
              <div style={{ fontSize: 13, color: s.text2, marginBottom: 8 }}>{selectedInfo.description}</div>
              {selectedInfo.details.map((d, i) => (
                <div key={i} style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 3, paddingLeft: 12, borderLeft: `2px solid ${s.border}` }}>
                  {d}
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: '12px 16px', borderTop: `1px solid ${s.border}`, display: 'flex', gap: 16, fontSize: 11, fontFamily: s.mono, color: s.text3, flexWrap: 'wrap' }}>
            <span>Click components for details</span>
            <span style={{ color: s.accent }}>Blue = active flow step</span>
            <span>Arrows show data flow direction</span>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
