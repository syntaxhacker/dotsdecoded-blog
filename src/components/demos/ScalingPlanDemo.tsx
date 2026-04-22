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

interface ScalingStrategy {
  id: string
  name: string
  problem: string
  solution: string
  impact: 'high' | 'medium' | 'low'
  stage: 'initial' | 'growth' | 'scale'
  enabled: boolean
  details: string[]
}

const initialStrategies: ScalingStrategy[] = [
  {
    id: 'cache',
    name: 'Cache Hot URLs',
    problem: '80% of traffic hits 20% of URLs. DB cannot handle 20K read QPS alone.',
    solution: 'Redis cache with cache-aside pattern. TTL 1 hour. Cache the top 20% of URLs.',
    impact: 'high',
    stage: 'initial',
    enabled: true,
    details: ['Cache hit: ~1ms response time', 'Cache miss: DB read + cache populate', 'LRU eviction for memory limits', 'Reduces DB read load by ~80%'],
  },
  {
    id: 'cdn',
    name: 'CDN Edge Caching',
    problem: 'Users worldwide experience latency from origin server round-trips.',
    solution: 'Cache 301 redirects at CDN edge. Serve redirects without hitting origin.',
    impact: 'high',
    stage: 'initial',
    enabled: true,
    details: ['Edge nodes serve redirects in <10ms', 'Cache-Control headers for TTL', 'Purge cache on URL deletion', 'Handles 80%+ of read traffic'],
  },
  {
    id: 'sharding',
    name: 'Database Sharding',
    problem: 'Single DB cannot store billions of URLs or handle write throughput.',
    solution: 'Shard by short_code hash. Route queries to correct shard.',
    impact: 'high',
    stage: 'growth',
    enabled: false,
    details: ['Consistent hashing for shard routing', 'Each shard holds a subset of URLs', 'Add shards without rehashing all data', 'Read/write throughput scales linearly'],
  },
  {
    id: 'rate-limit',
    name: 'Rate Limiting',
    problem: 'Abuse: someone creating millions of short URLs per second.',
    solution: 'Token bucket per IP on POST /api/shorten. 10 requests/min for anonymous.',
    impact: 'medium',
    stage: 'initial',
    enabled: true,
    details: ['Token bucket algorithm', 'Per-IP and per-user limits', 'Return 429 Too Many Requests', 'Distributed counter via Redis'],
  },
  {
    id: 'async-analytics',
    name: 'Async Analytics Pipeline',
    problem: 'Writing analytics on every redirect adds latency and load.',
    solution: 'Fire-and-forget click events to message queue. Workers process async.',
    impact: 'high',
    stage: 'growth',
    enabled: false,
    details: ['Click event published to Kafka/SQS', 'Redirect returns immediately', 'Workers aggregate in batches', 'Time-series DB for analytics queries'],
  },
  {
    id: 'multi-region',
    name: 'Multi-Region Deployment',
    problem: 'Single region outage takes the entire service down.',
    solution: 'Deploy to 3+ regions. Active-active with eventual consistency.',
    impact: 'high',
    stage: 'scale',
    enabled: false,
    details: ['Cross-region DB replication', 'GeoDNS for nearest region', 'Conflict resolution for writes', '99.99%+ availability target'],
  },
]

const stageLabel = { initial: 'Initial', growth: 'Growth', scale: 'Hyperscale' }
const stageColor: Record<string, string> = { initial: s.green, growth: s.yellow, scale: s.red }
const impactColor: Record<string, string> = { high: s.red, medium: s.yellow, low: s.green }

export default function ScalingPlanDemo() {
  const [strategies, setStrategies] = useState<ScalingStrategy[]>(initialStrategies)
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggle = (id: string) => {
    setStrategies(prev => prev.map(st => st.id === id ? { ...st, enabled: !st.enabled } : st))
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => prev === id ? null : id)
  }

  const enabledCount = strategies.filter(st => st.enabled).length
  const highImpactCount = strategies.filter(st => st.enabled && st.impact === 'high').length

  return (
    <DemoBoundary name="Scaling Plan">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontFamily: s.mono, color: s.text2 }}>Toggle strategies to build your scaling plan</span>
            <div style={{ marginLeft: 'auto', fontSize: 12, fontFamily: s.mono, display: 'flex', gap: 12 }}>
              <span style={{ color: s.green }}>{enabledCount}/{strategies.length} enabled</span>
              <span style={{ color: s.red }}>{highImpactCount} high-impact</span>
            </div>
          </div>

          {strategies.map(st => (
            <div key={st.id} style={{
              borderBottom: `1px solid ${s.border}`,
              opacity: st.enabled ? 1 : 0.5,
              transition: 'opacity 0.2s',
            }}>
              <div style={{
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              }} onClick={() => toggleExpand(st.id)}>
                <button onClick={(e) => { e.stopPropagation(); toggle(st.id); }} style={{
                  width: 20, height: 20, borderRadius: 5, border: `2px solid ${st.enabled ? stageColor[st.stage] : s.border}`,
                  background: st.enabled ? stageColor[st.stage] : 'transparent', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {st.enabled && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>+</span>}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontFamily: s.mono, color: st.enabled ? s.text : s.text3, fontWeight: 600 }}>{st.name}</span>
                    <span style={{
                      fontSize: 9, fontFamily: s.mono, padding: '2px 6px', borderRadius: 3,
                      background: 'rgba(91,141,239,0.1)', color: stageColor[st.stage], fontWeight: 600,
                    }}>
                      {stageLabel[st.stage]}
                    </span>
                    <span style={{
                      fontSize: 9, fontFamily: s.mono, padding: '2px 6px', borderRadius: 3,
                      background: 'rgba(232,93,93,0.1)', color: impactColor[st.impact], fontWeight: 600,
                    }}>
                      {st.impact.toUpperCase()} IMPACT
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>{expanded === st.id ? '-' : '+'}</span>
              </div>

              {expanded === st.id && (
                <div style={{ padding: '0 16px 14px 48px' }}>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: s.mono, color: s.red }}>PROBLEM: </span>
                    <span style={{ fontSize: 12, color: s.text2 }}>{st.problem}</span>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontFamily: s.mono, color: s.green }}>SOLUTION: </span>
                    <span style={{ fontSize: 12, color: s.text2 }}>{st.solution}</span>
                  </div>
                  {st.details.map((d, i) => (
                    <div key={i} style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 3, paddingLeft: 10, borderLeft: `2px solid ${s.border}` }}>
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{ padding: '14px 16px', background: s.bg, display: 'flex', gap: 24, fontSize: 11, fontFamily: s.mono, color: s.text3, flexWrap: 'wrap' }}>
            <span style={{ color: s.green }}>Initial: cache + CDN + rate limit</span>
            <span style={{ color: s.yellow }}>Growth: sharding + async analytics</span>
            <span style={{ color: s.red }}>Hyperscale: multi-region</span>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
