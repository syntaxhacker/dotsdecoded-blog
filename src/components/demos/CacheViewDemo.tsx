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

const LAYERS = [
  { id: 'browser', name: 'Browser Local', desc: 'Per-user month cache (IndexedDB)', hot: 'Instant for same month' },
  { id: 'cdn', name: 'Edge CDN', desc: 'Regional POP cache (30s-5m TTL)', hot: 'Shared across users in region' },
  { id: 'redis', name: 'Regional Redis', desc: 'Materialized month views', hot: 'Hot months stay warm' },
  { id: 'matview', name: 'App Materialized', desc: 'Pre-computed aggregates', hot: 'Free/busy + search index' },
  { id: 'db', name: 'DB Primary', desc: 'Source of truth (Spanner)', hot: 'Strong consistency' },
]

export default function CacheViewDemo() {
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [invalidations, setInvalidations] = useState(0)
  const [latency, setLatency] = useState(0)
  const [path, setPath] = useState<Array<{ layer: string; hit: boolean; ms: number }>>([])
  const [invWave, setInvWave] = useState<string[]>([])
  const [mode, setMode] = useState<'warm' | 'chaos'>('warm')

  const hitRate = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0
  const avgLat = hits + misses > 0 ? Math.round(latency / (hits + misses)) : 0

  const loadMonth = () => {
    const newPath: Array<{ layer: string; hit: boolean; ms: number }> = []
    let total = 0
    let hitCount = 0

    const decide = (id: string) => {
      if (mode === 'warm') return id !== 'db'
      return Math.random() > 0.6
    }

    LAYERS.forEach((l, i) => {
      const isHit = decide(l.id)
      const ms = isHit ? [2, 4, 12, 18, 48][i] : [0, 0, 0, 0, 48][i]
      newPath.push({ layer: l.id, hit: isHit, ms })
      total += ms
      if (isHit) hitCount++
    })

    setPath(newPath)
    setHits(h => h + hitCount)
    setMisses(m => m + (5 - hitCount))
    setLatency(l => l + total)
    setTimeout(() => setPath([]), 1400)
  }

  const updateEvent = () => {
    const wave: string[] = []
    const order = [...LAYERS].reverse()
    order.forEach((l, i) => {
      setTimeout(() => {
        wave.push(l.id)
        setInvWave([...wave])
        if (i === order.length - 1) {
          setInvalidations(iv => iv + 1)
          setTimeout(() => {
            setInvWave([])
            if (mode === 'chaos' && Math.random() > 0.5) {
              setTimeout(() => setInvWave(['redis', 'cdn']), 200)
              setTimeout(() => setInvWave([]), 900)
            }
          }, 600)
        }
      }, i * 180)
    })
    setTimeout(() => { if (mode === 'warm') loadMonth() }, 1100)
  }

  const warm = () => { setMode('warm'); setHits(18); setMisses(2); setLatency(340); setInvalidations(1) }
  const chaos = () => { setMode('chaos'); setHits(4); setMisses(11); setLatency(890); setInvalidations(7) }
  const reset = () => { setHits(0); setMisses(0); setInvalidations(0); setLatency(0); setPath([]); setInvWave([]); setMode('warm') }

  return (
    <DemoBoundary name="Cache and View Materialization">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={loadMonth} style={{ background: s.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>Load Month View (User 1234)</button>
          <button onClick={updateEvent} style={{ background: s.orange, color: '#000', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>Update Single Event → Invalidate</button>
          <button onClick={warm} style={{ background: s.green, color: '#000', border: 'none', borderRadius: 4, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>Warm Cache</button>
          <button onClick={chaos} style={{ background: s.red, color: '#fff', border: 'none', borderRadius: 4, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>Chaos Mode</button>
          <button onClick={reset} style={{ background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>Reset</button>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {LAYERS.map((l, i) => {
            const p = path.find(x => x.layer === l.id)
            const inv = invWave.includes(l.id)
            const bg = inv ? 'rgba(232,93,93,0.2)' : p ? (p.hit ? 'rgba(61,214,140,0.15)' : 'rgba(232,93,93,0.15)') : s.bg3
            const bd = inv ? s.red : p ? (p.hit ? s.green : s.red) : s.border
            return (
              <div key={i} style={{ flex: 1, background: bg, border: `1px solid ${bd}`, borderRadius: 6, padding: 8, transition: 'all 0.2s' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: p ? (p.hit ? s.green : s.red) : s.text }}>{l.name}</div>
                <div style={{ fontSize: 9, color: s.text3 }}>{l.desc}</div>
                <div style={{ fontSize: 9, color: s.text2, marginTop: 3 }}>{l.hot}</div>
                {p && <div style={{ fontSize: 10, color: p.hit ? s.green : s.red, marginTop: 2 }}>{p.hit ? 'HIT' : 'MISS'} {p.ms}ms</div>}
                {inv && <div style={{ fontSize: 9, color: s.red, marginTop: 2 }}>PURGED</div>}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12 }}>Hit rate <span style={{ color: s.green, fontFamily: s.mono }}>{hitRate}%</span></div>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12 }}>Avg latency <span style={{ color: s.accent, fontFamily: s.mono }}>{avgLat}ms</span></div>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12 }}>Invalidations today <span style={{ color: s.orange, fontFamily: s.mono }}>{invalidations}</span></div>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12 }}>Mode <span style={{ color: mode === 'warm' ? s.green : s.red }}>{mode}</span></div>
        </div>

        <div style={{ fontSize: 10, color: s.text3 }}>Calendar reads are extremely skewed: 80% of users look at current + next month. Browser + CDN + materialized Redis cover 95% of traffic with &lt;20ms. An event update invalidates top-down; recompute of materialized view is the expensive step (hence fanout to regional replicas only on change). Chaos mode shows random invalidations that force deeper fetches.</div>
      </div>
    </DemoBoundary>
  )
}
