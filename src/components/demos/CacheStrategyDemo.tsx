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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

type CacheLevel = 'browser' | 'cdn' | 'redis' | 'db'

const endpoints = [
  { path: '/api/users', method: 'GET', desc: 'User list (changes rarely)', defaultTtl: 300, cacheKey: 'users:all' },
  { path: '/api/users/42', method: 'GET', desc: 'Single user profile', defaultTtl: 60, cacheKey: 'users:42' },
  { path: '/api/orders', method: 'GET', desc: 'Order list (changes often)', defaultTtl: 10, cacheKey: 'orders:recent' },
  { path: '/api/users', method: 'POST', desc: 'Create new user', defaultTtl: 0, cacheKey: 'N/A' },
]

const cacheLevels: { key: CacheLevel; name: string; latency: string; desc: string; color: string }[] = [
  { key: 'browser', name: 'Browser Cache', latency: '0ms', desc: 'Cached by the browser using Cache-Control headers', color: s.accent },
  { key: 'cdn', name: 'CDN (Cloudflare)', latency: '5-20ms', desc: 'Edge servers worldwide cache static content', color: s.green },
  { key: 'redis', name: 'Redis Cache', latency: '<1ms', desc: 'In-memory cache on your server for API responses', color: s.orange },
  { key: 'db', name: 'Database', latency: '5-50ms', desc: 'Source of truth -- slowest but always fresh', color: s.red },
]

export default function CacheStrategyDemo() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(0)
  const [requestCount, setRequestCount] = useState(0)
  const [hits, setHits] = useState<Record<CacheLevel, number>>({ browser: 0, cdn: 0, redis: 0, db: 0 })

  const ep = endpoints[selectedEndpoint]
  const isWrite = ep.method === 'POST'

  const simulateRequest = () => {
    const nextCount = requestCount + 1
    setRequestCount(nextCount)
    const newHits = { ...hits }

    if (isWrite) {
      newHits.db = hits.db + 1
      setHits(newHits)
      return
    }

    if (nextCount === 1 || Math.random() < 0.3) {
      newHits.db = hits.db + 1
    } else if (Math.random() < 0.5) {
      newHits.redis = hits.redis + 1
    } else if (Math.random() < 0.6) {
      newHits.cdn = hits.cdn + 1
    } else {
      newHits.browser = hits.browser + 1
    }
    setHits(newHits)
  }

  const totalHits = hits.browser + hits.cdn + hits.redis + hits.db
  const hitPct = totalHits > 0 ? Math.round(((totalHits - hits.db) / totalHits) * 100) : 0

  return (
    <DemoBoundary name="Cache Strategy">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Caching Strategies</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Caching is the #1 way to make your API fast. Each cache layer has different latency and scope. Send requests to see where they land.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {endpoints.map((ep2, idx) => (
            <button key={ep2.path} onClick={() => { setSelectedEndpoint(idx); setRequestCount(0); setHits({ browser: 0, cdn: 0, redis: 0, db: 0 }) }} style={{
              background: selectedEndpoint === idx ? (ep2.method === 'POST' ? s.red : s.accent) : s.bg3,
              border: `1px solid ${selectedEndpoint === idx ? (ep2.method === 'POST' ? s.red : s.accent) : s.border}`,
              borderRadius: 8, padding: '8px 16px',
              color: selectedEndpoint === idx ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 13, fontFamily: s.mono, transition: 'all 0.2s',
            }}>
              <span style={{ fontWeight: 700 }}>{ep2.method}</span> {ep2.path}
            </button>
          ))}
        </div>

        <div style={{ background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: s.text, fontWeight: 700, fontSize: 14 }}>{ep.desc}</span>
            <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>
              TTL: {ep.defaultTtl === 0 ? 'no-cache' : `${ep.defaultTtl}s`}
            </span>
          </div>
          <div style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>
            Cache key: {ep.cacheKey}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {cacheLevels.map((cl) => (
            <div key={cl.key} style={{
              flex: 1, textAlign: 'center', padding: 14, borderRadius: 10,
              background: s.bg3, border: `1px solid ${s.border}`,
              opacity: hits[cl.key] > 0 || requestCount === 0 ? 1 : 0.4,
              transition: 'all 0.3s',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: hits[cl.key] > 0 ? cl.color : s.text3, margin: '0 auto 8px', transition: 'all 0.3s' }} />
              <div style={{ color: cl.color, fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{cl.name}</div>
              <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>{cl.latency}</div>
              <div style={{ color: s.text, fontFamily: s.mono, fontSize: 16, fontWeight: 700, marginTop: 6 }}>{hits[cl.key]}</div>
              <div style={{ color: s.text3, fontSize: 10 }}>hits</div>
            </div>
          ))}
        </div>

        {totalHits > 0 && (
          <div style={{ background: s.bg3, borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: s.text2, fontSize: 13 }}>{requestCount} requests sent</span>
            <span style={{ color: hitPct > 50 ? s.green : s.orange, fontFamily: s.mono, fontSize: 13, fontWeight: 700 }}>
              {hitPct}% cache hit rate
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button onClick={() => { setRequestCount(0); setHits({ browser: 0, cdn: 0, redis: 0, db: 0 }) }} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={simulateRequest} style={{
            background: isWrite ? s.red : s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            {isWrite ? 'POST (bypasses cache)' : 'Send GET Request'}
          </button>
        </div>

        <div style={{ marginTop: 24, borderTop: `1px solid ${s.border}`, paddingTop: 20 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Where Each Cache Lives</div>
          {cacheLevels.map((cl) => (
            <div key={cl.key} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${s.border}` }}>
              <div style={{ minWidth: 100 }}>
                <span style={{ color: cl.color, fontSize: 13, fontWeight: 600 }}>{cl.name}</span>
              </div>
              <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>{cl.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
