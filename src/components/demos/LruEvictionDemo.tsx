import { useState, useCallback } from 'react'
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

const COLORS = [s.accent, s.green, s.purple, s.orange, s.yellow, s.red, '#e879a5', '#6bdfff']

interface CacheEntry {
  key: string
  color: string
}

export default function LruEvictionDemo() {
  const [capacity] = useState(5)
  const [cache, setCache] = useState<CacheEntry[]>([])
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [evictions, setEvictions] = useState(0)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [evictingKey, setEvictingKey] = useState<string | null>(null)
  const [accessingKey, setAccessingKey] = useState<string | null>(null)
  const nextKeyRef = useState(() => 1)

  const addKey = useCallback(() => {
    const keyIdx = nextKeyRef[0]
    const key = `K${keyIdx}`
    nextKeyRef[1](keyIdx + 1)
    const color = COLORS[(keyIdx - 1) % COLORS.length]

    setEvictingKey(null)
    setAccessingKey(null)

    setCache(prev => {
      const existing = prev.find(e => e.key === key)
      if (existing) {
        const filtered = prev.filter(e => e.key !== key)
        setHits(h => h + 1)
        setLastAction(`CACHE HIT: "${key}" moved to front`)
        setAccessingKey(key)
        return [existing, ...filtered]
      }

      if (prev.length >= capacity) {
        const evicted = prev[prev.length - 1]
        setEvictions(e => e + 1)
        setEvictingKey(evicted.key)
        setMisses(m => m + 1)
        setLastAction(`EVICTION: "${evicted.key}" removed (LRU). "${key}" added`)
        setTimeout(() => setEvictingKey(null), 800)
        return [{ key, color }, ...prev.slice(0, -1)]
      }

      setMisses(m => m + 1)
      setLastAction(`CACHE MISS: "${key}" added to cache`)
      return [{ key, color }, ...prev]
    })
  }, [capacity, nextKeyRef])

  const accessKey = useCallback((entry: CacheEntry) => {
    setEvictingKey(null)
    setAccessingKey(entry.key)
    setHits(h => h + 1)
    setLastAction(`CACHE HIT: "${entry.key}" accessed, moved to front`)

    setCache(prev => {
      const filtered = prev.filter(e => e.key !== entry.key)
      return [entry, ...filtered]
    })
  }, [])

  const reset = () => {
    setCache([])
    setHits(0)
    setMisses(0)
    setEvictions(0)
    setLastAction(null)
    setEvictingKey(null)
    setAccessingKey(null)
    nextKeyRef[1](1)
  }

  const totalAccess = hits + misses
  const hitRate = totalAccess > 0 ? Math.round((hits / totalAccess) * 100) : 0

  return (
    <DemoBoundary name="LRU Cache Eviction">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>LRU Eviction</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Cache holds {capacity} items. Add new keys or click existing ones to "access" them.
          The least recently used item is evicted when the cache is full.
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Hits', value: hits, color: s.green },
            { label: 'Misses', value: misses, color: s.yellow },
            { label: 'Evictions', value: evictions, color: s.red },
            { label: 'Hit Rate', value: `${hitRate}%`, color: s.accent },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 8px', textAlign: 'center',
            }}>
              <div style={{ color: stat.color, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ color: s.text3, fontSize: 10 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: s.green, fontSize: 12, fontWeight: 700 }}>MOST RECENT</span>
            <span style={{ color: s.red, fontSize: 12, fontWeight: 700 }}>LEAST RECENT (next to evict)</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {cache.length === 0 && (
              <div style={{ flex: 1, background: s.bg, border: `1px dashed ${s.border}`, borderRadius: 10, padding: 24, textAlign: 'center', color: s.text3, fontSize: 13 }}>
                Cache is empty. Click "Add Key" to start.
              </div>
            )}
            {cache.map((entry, idx) => (
              <div key={entry.key} style={{
                flex: 1, minWidth: 0,
                transition: 'all 0.3s ease',
              }}>
                <button onClick={() => accessKey(entry)} style={{
                  width: '100%', background: evictingKey === entry.key ? `${s.red}22` : accessingKey === entry.key ? `${s.green}22` : s.bg,
                  border: `2px solid ${evictingKey === entry.key ? s.red : accessingKey === entry.key ? s.green : s.border}`,
                  borderRadius: 10, padding: '14px 8px', cursor: 'pointer', transition: 'all 0.3s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: entry.color,
                    opacity: evictingKey === entry.key ? 0.3 : 1, transition: 'opacity 0.3s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 11,
                  }}>
                    {entry.key}
                  </div>
                  <div style={{ color: evictingKey === entry.key ? s.red : s.text2, fontFamily: s.mono, fontSize: 11, transition: 'color 0.3s' }}>
                    {evictingKey === entry.key ? 'EVICTING' : `#${idx}`}
                  </div>
                </button>
                {idx < cache.length - 1 && (
                  <div style={{ textAlign: 'center', marginTop: 4, marginBottom: 4 }}>
                    <svg width={24} height={12}><line x1={0} y1={6} x2={24} y2={6} stroke={s.border} strokeWidth={1} strokeDasharray="3 2" /></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: lastAction?.includes('HIT') ? `${s.green}11` : lastAction?.includes('EVICTION') ? `${s.red}11` : lastAction?.includes('MISS') ? `${s.yellow}11` : s.bg3,
          border: `1px solid ${lastAction?.includes('HIT') ? s.green : lastAction?.includes('EVICTION') ? s.red : lastAction?.includes('MISS') ? s.yellow : s.border}`,
          borderRadius: 8, padding: '10px 14px', marginBottom: 16, transition: 'all 0.3s',
        }}>
          <div style={{
            color: lastAction?.includes('HIT') ? s.green : lastAction?.includes('EVICTION') ? s.red : lastAction?.includes('MISS') ? s.yellow : s.text3,
            fontFamily: s.mono, fontSize: 12, transition: 'color 0.3s',
          }}>
            {lastAction || 'Waiting for operations...'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={addKey} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
          }}>Add Key</button>
          <button onClick={() => { for (let i = 0; i < 3; i++) setTimeout(() => addKey(), i * 200) }} style={{
            background: s.purple, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>Add +3</button>
        </div>

        <div style={{ marginTop: 20, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Eviction Policies Compared</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { name: 'LRU', desc: 'Evicts the least recently accessed item. Good general-purpose policy.', color: s.accent },
              { name: 'LFU', desc: 'Evicts the least frequently accessed item. Better for stable access patterns.', color: s.green },
              { name: 'FIFO', desc: 'Evicts the oldest item regardless of access. Simple but can evict popular items.', color: s.orange },
              { name: 'TTL', desc: 'Evicts items based on expiration time. Good for time-sensitive data.', color: s.purple },
            ].map(pol => (
              <div key={pol.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: pol.color, flexShrink: 0 }} />
                <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 36 }}>{pol.name}</span>
                <span style={{ color: s.text2, fontSize: 12 }}>{pol.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
