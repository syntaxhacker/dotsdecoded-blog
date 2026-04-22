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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

type LayerKey = 'browser' | 'cdn' | 'api' | 'database'

interface Layer {
  key: LayerKey
  name: string
  latency: string
  color: string
  ttl: string
}

const layers: Layer[] = [
  { key: 'browser', name: 'Browser Cache', latency: '0ms', color: s.accent, ttl: 'max-age: 3600' },
  { key: 'cdn', name: 'CDN (Edge)', latency: '10-30ms', color: s.green, ttl: 'max-age: 86400' },
  { key: 'api', name: 'API Server (Redis)', latency: '1-5ms', color: s.orange, ttl: '60-300s' },
  { key: 'database', name: 'Database', latency: '50-200ms', color: s.red, ttl: 'Source of truth' },
]

export default function CacheLayerDemo() {
  const [warmCache, setWarmCache] = useState(false)
  const [activeLayer, setActiveLayer] = useState<LayerKey | null>(null)
  const [cacheHit, setCacheHit] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [log, setLog] = useState<{ text: string; color: string }[]>([])
  const [layerStates, setLayerStates] = useState<Record<LayerKey, 'empty' | 'cached'>>({
    browser: 'empty', cdn: 'empty', api: 'empty', database: 'cached',
  })
  const [stats, setStats] = useState({ requests: 0, hits: 0, misses: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addLog = (text: string, color: string) => {
    setLog(prev => [...prev.slice(-6), { text, color }])
  }

  const simulateRequest = () => {
    if (requesting) return
    setRequesting(true)
    setCacheHit(false)
    setLog([])
    setStats(prev => ({ ...prev, requests: prev.requests + 1 }))

    const checkOrder: LayerKey[] = ['browser', 'cdn', 'api', 'database']
    let delay = 0

    for (let i = 0; i < checkOrder.length; i++) {
      const layerKey = checkOrder[i]
      const layer = layers.find(l => l.key === layerKey)!
      const isCached = warmCache || layerStates[layerKey] === 'cached'

      delay += 300

      timerRef.current = setTimeout(() => {
        setActiveLayer(layerKey)

        if (isCached && layerKey !== 'database') {
          setCacheHit(true)
          setStats(prev => ({ ...prev, hits: prev.hits + 1 }))
          addLog(`${layer.name}: CACHE HIT (${layer.latency})`, layer.color)
          if (layerKey === 'browser') {
            addLog('Response returned from browser cache -- fastest possible', s.green)
          } else if (layerKey === 'cdn') {
            addLog('Response returned from edge node -- no origin hit', s.green)
          } else {
            addLog('Response returned from Redis -- no DB query needed', s.green)
          }
          setTimeout(() => {
            setRequesting(false)
            setActiveLayer(null)
          }, 600)
          return
        }

        if (i === checkOrder.length - 1 || !warmCache && layerKey === 'database') {
          addLog(`${layer.name}: CACHE MISS -- fetching from source`, s.yellow)
          if (layerKey === 'database') {
            setStats(prev => ({ ...prev, misses: prev.misses + 1 }))
            timerRef.current = setTimeout(() => {
              addLog('Database query executed (50-200ms)', s.red)
              addLog('Response returned, populating upstream caches...', s.orange)
              if (!warmCache) {
                setLayerStates({ browser: 'cached', cdn: 'cached', api: 'cached', database: 'cached' })
              }
              setTimeout(() => {
                setRequesting(false)
                setActiveLayer(null)
              }, 800)
            }, 300)
          }
        } else {
          addLog(`${layer.name}: MISS -- checking next layer`, s.text3)
        }
      }, delay)
    }
  }

  const toggleWarm = () => {
    setWarmCache(prev => !prev)
    if (!warmCache) {
      setLayerStates({ browser: 'cached', cdn: 'cached', api: 'cached', database: 'cached' })
    } else {
      setLayerStates({ browser: 'empty', cdn: 'empty', api: 'empty', database: 'cached' })
    }
    setLog([])
    setStats({ requests: 0, hits: 0, misses: 0 })
  }

  const reset = () => {
    setWarmCache(false)
    setLayerStates({ browser: 'empty', cdn: 'empty', api: 'empty', database: 'cached' })
    setLog([])
    setStats({ requests: 0, hits: 0, misses: 0 })
    setActiveLayer(null)
    setRequesting(false)
    setCacheHit(false)
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  return (
    <DemoBoundary name="Cache Layers">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Caching Layers</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          A request flows through caching layers from fastest to slowest. Each layer that has the data short-circuits the journey.
          Toggle warm cache to see the difference.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
          <button onClick={toggleWarm} style={{
            background: warmCache ? s.green : s.bg3,
            border: `1px solid ${warmCache ? s.green : s.border}`,
            borderRadius: 8, padding: '8px 16px',
            color: warmCache ? '#fff' : s.text2, cursor: 'pointer', fontSize: 13,
            transition: 'all 0.2s',
          }}>
            {warmCache ? 'Warm Cache (all layers populated)' : 'Cold Cache (only DB has data)'}
          </button>
          <div style={{ flex: 1 }} />
          {stats.requests > 0 && (
            <span style={{ color: stats.hits > stats.misses ? s.green : s.orange, fontFamily: s.mono, fontSize: 12 }}>
              {stats.hits} hits / {stats.misses} misses
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {layers.map((layer, idx) => {
            const isActive = activeLayer === layer.key
            const isHit = isActive && cacheHit
            const hasData = warmCache || layerStates[layer.key] === 'cached'

            return (
              <div key={layer.key}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: isHit ? `${layer.color}15` : isActive ? `${s.yellow}15` : s.bg,
                  border: `2px solid ${isHit ? layer.color : isActive ? s.yellow : s.border}`,
                  borderRadius: 10, padding: '14px 18px',
                  transition: 'all 0.3s',
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: isHit ? layer.color : isActive ? s.yellow : hasData ? `${layer.color}66` : s.text3,
                    transition: 'all 0.3s', flexShrink: 0,
                    boxShadow: isHit ? `0 0 12px ${layer.color}66` : 'none',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: layer.color, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{layer.name}</div>
                    <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>
                      Latency: {layer.latency} | TTL: {layer.ttl}
                    </div>
                  </div>
                  <div style={{
                    color: isHit ? s.green : isActive && !cacheHit ? s.yellow : s.text3,
                    fontFamily: s.mono, fontSize: 12, fontWeight: 600,
                    transition: 'color 0.3s',
                  }}>
                    {isHit ? 'HIT' : isActive && !cacheHit ? 'CHECKING...' : hasData ? 'CACHED' : 'EMPTY'}
                  </div>
                </div>
                {idx < layers.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                    <svg width={20} height={16}>
                      <line x1={10} y1={0} x2={10} y2={12} stroke={s.border} strokeWidth={1.5} />
                      <polygon points="6,10 10,16 14,10" fill={s.border} />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={simulateRequest} disabled={requesting} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: requesting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
            opacity: requesting ? 0.5 : 1,
          }}>Send Request</button>
        </div>

        {log.length > 0 && (
          <div style={{ background: s.bg, borderRadius: 8, padding: 12, border: `1px solid ${s.border}` }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Request Trace</div>
            {log.map((entry, i) => (
              <div key={i} style={{
                color: entry.color, fontFamily: s.mono, fontSize: 11, lineHeight: 1.8,
                paddingLeft: 10, borderLeft: `2px solid ${entry.color}`,
              }}>
                {entry.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
