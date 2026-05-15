import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type ComponentId = 'client' | 'cdn' | 'lb' | 'gateway' | 'tweet' | 'timeline' | 'user' | 'search' | 'trending' | 'cache' | 'db' | 'queue' | 'media'

interface CompInfo {
  id: ComponentId
  label: string
  color: string
  desc: string
  details: string[]
}

const components: CompInfo[] = [
  { id: 'client', label: 'Client', color: s.text2, desc: 'Mobile app or web browser', details: ['HTTP/2 requests', 'Long polling for real-time', 'TLS termination'] },
  { id: 'cdn', label: 'CDN', color: s.green, desc: 'Static assets, edge caching', details: ['Media files cached at edge', 'Static HTML/JS bundles', 'DDoS mitigation'] },
  { id: 'lb', label: 'Load Balancer', color: s.accent, desc: 'Traffic distribution', details: ['Round-robin routing', 'Health checks', 'Rate limiting'] },
  { id: 'gateway', label: 'API Gateway', color: s.yellow, desc: 'Request routing and auth', details: ['Authentication/authorization', 'Rate limiting per user', 'Request validation', 'Throttling'] },
  { id: 'tweet', label: 'Tweet Service', color: s.accent, desc: 'Create and serve tweets', details: ['Store tweet in Cassandra', 'Publish tweet_created event', 'Serve tweet by ID'] },
  { id: 'timeline', label: 'Timeline Service', color: s.green, desc: 'Assemble and serve timelines', details: ['Read from Redis cache', 'Merge push + pull sources', 'Rank by recency'] },
  { id: 'user', label: 'User Service', color: s.orange, desc: 'User profiles and follow graph', details: ['CRUD user profiles', 'Follow/unfollow logic', 'Follower list cache'] },
  { id: 'search', label: 'Search Service', color: s.purple, desc: 'Index and search tweets', details: ['Tokenize tweet content', 'Update Elasticsearch', 'Rank search results'] },
  { id: 'trending', label: 'Trending Service', color: s.red, desc: 'Compute trending topics', details: ['Extract hashtags', 'Count-Min Sketch update', 'Sliding window aggregation'] },
  { id: 'cache', label: 'Redis Cache', color: s.red, desc: 'In-memory data store', details: ['Timeline sorted sets', 'Tweet content cache', 'User follow sets', 'Rate limiter counters'] },
  { id: 'db', label: 'Cassandra', color: s.purple, desc: 'Distributed database', details: ['Tweets table', 'User table', 'Likes table', 'Replicated across AZs'] },
  { id: 'queue', label: 'Kafka', color: s.orange, desc: 'Event bus', details: ['tweet_created events', 'Fanout triggers', 'Search indexing', 'Notification delivery'] },
  { id: 'media', label: 'Media Store', color: s.yellow, desc: 'Object storage (S3)', details: ['Image uploads', 'Video transcoding', 'CDN origin'] },
]

interface FlowStep {
  source: ComponentId
  target: ComponentId
  action: string
  stepNum: number
}

const tweetFlow: FlowStep[] = [
  { source: 'client', target: 'cdn', action: 'POST /api/v1/tweet', stepNum: 1 },
  { source: 'cdn', target: 'lb', action: 'Forward to origin', stepNum: 2 },
  { source: 'lb', target: 'gateway', action: 'Route to API Gateway', stepNum: 3 },
  { source: 'gateway', target: 'tweet', action: 'Validate, forward to Tweet Service', stepNum: 4 },
  { source: 'tweet', target: 'db', action: 'INSERT tweet in Cassandra', stepNum: 5 },
  { source: 'tweet', target: 'queue', action: 'Publish tweet_created event', stepNum: 6 },
  { source: 'queue', target: 'timeline', action: 'Fanout to followers timeline cache', stepNum: 7 },
  { source: 'timeline', target: 'cache', action: 'SET timeline:{user_id} in Redis', stepNum: 8 },
  { source: 'queue', target: 'search', action: 'Index tweet in Elasticsearch', stepNum: 9 },
  { source: 'queue', target: 'trending', action: 'Update Count-Min Sketch', stepNum: 10 },
  { source: 'queue', target: 'user', action: 'Notify followers of new tweet', stepNum: 11 },
  { source: 'tweet', target: 'client', action: '201 Created response', stepNum: 12 },
]

const compPositions: Record<ComponentId, { x: number; y: number }> = {
  client: { x: 60, y: 160 },
  cdn: { x: 180, y: 100 },
  lb: { x: 300, y: 160 },
  gateway: { x: 420, y: 160 },
  tweet: { x: 540, y: 60 },
  timeline: { x: 540, y: 160 },
  user: { x: 540, y: 260 },
  search: { x: 680, y: 60 },
  trending: { x: 680, y: 160 },
  cache: { x: 400, y: 290 },
  db: { x: 540, y: 350 },
  queue: { x: 420, y: 60 },
  media: { x: 680, y: 290 },
}

export default function TwitterArchitectureDemo() {
  const [selected, setSelected] = useState<ComponentId | null>(null)
  const [flowStep, setFlowStep] = useState(-1)

  const activeFlowStep = flowStep >= 0 && flowStep < tweetFlow.length ? tweetFlow[flowStep] : null
  const selectedInfo = selected ? components.find(c => c.id === selected) : null

  const allEdges: [ComponentId, ComponentId][] = [
    ['client', 'cdn'], ['client', 'lb'],
    ['cdn', 'lb'],
    ['lb', 'gateway'],
    ['gateway', 'tweet'], ['gateway', 'timeline'], ['gateway', 'user'],
    ['tweet', 'db'], ['tweet', 'queue'],
    ['timeline', 'cache'],
    ['queue', 'timeline'], ['queue', 'search'], ['queue', 'trending'], ['queue', 'user'],
    ['search', 'db'],
    ['tweet', 'client'],
  ]

  return (
    <DemoBoundary name="Twitter System Architecture">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>Tweet Post Flow:</span>
            <button onClick={() => setFlowStep(flowStep >= tweetFlow.length - 1 ? 0 : flowStep + 1)} style={{
              padding: '5px 12px', fontSize: 11, fontFamily: s.mono, borderRadius: 5,
              border: `1px solid ${s.green}`, background: `${s.green}10`, color: s.green, cursor: 'pointer',
            }}>
              {flowStep < 0 ? 'Animate' : flowStep >= tweetFlow.length - 1 ? 'Restart' : 'Next Step'}
            </button>
            <button onClick={() => setFlowStep(-1)} style={{
              padding: '5px 12px', fontSize: 11, fontFamily: s.mono, borderRadius: 5,
              border: `1px solid ${s.border}`, background: 'transparent', color: s.text3, cursor: 'pointer',
            }}>
              Reset
            </button>
            {activeFlowStep && (
              <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text2, marginLeft: 'auto' }}>
                Step {activeFlowStep.stepNum}/{tweetFlow.length}: {activeFlowStep.action}
              </span>
            )}
          </div>

          <div style={{ padding: 12 }}>
            <svg width="100%" viewBox="-10 -10 790 420" style={{ display: 'block' }}>
              {allEdges.map(([from, to]) => {
                const fp = compPositions[from]
                const tp = compPositions[to]
                const isActive = activeFlowStep && (
                  (activeFlowStep.source === from && activeFlowStep.target === to) ||
                  (activeFlowStep.source === to && activeFlowStep.target === from)
                )
                return (
                  <line key={`${from}-${to}`} x1={fp.x} y1={fp.y} x2={tp.x} y2={tp.y}
                    stroke={isActive ? s.accent : s.border2}
                    strokeWidth={isActive ? 2.5 : 0.8}
                    opacity={isActive ? 1 : 0.25}
                    style={{ transition: 'all 0.3s' }}
                  />
                )
              })}

              {Array.from(new Set(allEdges.flatMap(e => e))).map(compId => {
                const comp = components.find(c => c.id === compId)
                if (!comp) return null
                const pos = compPositions[compId]
                const isActive = activeFlowStep && (
                  activeFlowStep.source === compId || activeFlowStep.target === compId
                )
                const isSelected = selected === compId
                const w = 100
                const h = 36
                return (
                  <g key={compId} onClick={() => setSelected(isSelected ? null : compId)} style={{ cursor: 'pointer' }}>
                    <rect
                      x={pos.x - w / 2} y={pos.y - h / 2} width={w} height={h} rx={6}
                      fill={isActive ? `${s.accent}25` : isSelected ? `${s.accent}12` : s.bg3}
                      stroke={isActive ? s.accent : isSelected ? s.accent : s.border2}
                      strokeWidth={isActive || isSelected ? 2 : 1}
                      style={{ transition: 'all 0.3s' }}
                    />
                    <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="central"
                      fill={isActive ? '#fff' : comp.color} fontSize={10} fontFamily={s.mono} fontWeight={600}>
                      {comp.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {activeFlowStep && (
            <div style={{
              padding: '8px 14px', borderTop: `1px solid ${s.border}`, borderBottom: `1px solid ${s.border}`,
              background: `${s.accent}08`, fontSize: 12, fontFamily: s.mono, color: s.text2,
            }}>
              <span style={{ color: s.accent }}>Step {activeFlowStep.stepNum}: </span>
              {components.find(c => c.id === activeFlowStep.source)?.label} -- {activeFlowStep.action} -- {components.find(c => c.id === activeFlowStep.target)?.label}
            </div>
          )}

          {selectedInfo && (
            <div style={{ padding: '12px 14px', borderTop: `1px solid ${s.border}`, background: s.bg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: selectedInfo.color }} />
                <span style={{ fontSize: 13, fontFamily: s.mono, color: selectedInfo.color, fontWeight: 600 }}>{selectedInfo.label}</span>
              </div>
              <div style={{ fontSize: 11, color: s.text2, marginBottom: 6 }}>{selectedInfo.desc}</div>
              {selectedInfo.details.map((d, i) => (
                <div key={i} style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 2, paddingLeft: 10, borderLeft: `2px solid ${s.border}` }}>
                  {d}
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: '8px 14px', borderTop: `1px solid ${s.border}`, display: 'flex', gap: 14, fontSize: 10, fontFamily: s.mono, color: s.text3, flexWrap: 'wrap' }}>
            <span>Click any component for details</span>
            <span style={{ color: s.accent }}>Highlighted = active in current flow step</span>
            <span>Lines show data flow direction</span>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
