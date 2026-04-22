import { useState, useCallback, useRef } from 'react'
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

interface HashEntry {
  url: string
  bucket: number
  id: number
}

function hashUrl(url: string, space: number): number {
  let h = 0
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) - h + url.charCodeAt(i)) | 0
  }
  return Math.abs(h) % space
}

function generateUrl(count: number): string {
  const domains = ['google.com', 'github.com', 'amazon.com', 'twitter.com', 'youtube.com', 'reddit.com', 'stackoverflow.com', 'netflix.com', 'wikipedia.org', 'linkedin.com']
  const paths = ['/docs', '/api/v2', '/users', '/blog/post', '/search', '/feed', '/profile', '/settings', '/explore', '/trending']
  const d = domains[count % domains.length]
  const p = paths[(count * 7 + 3) % paths.length]
  return `https://${d}${p}?id=${count}`
}

const GRID_SIZES = [8, 16, 32, 64]

export default function HashCollisionDemo() {
  const [gridSize, setGridSize] = useState(16)
  const [entries, setEntries] = useState<HashEntry[]>([])
  const [autoRunning, setAutoRunning] = useState(false)
  const [resolution, setResolution] = useState<'none' | 'rehash' | 'append'>('none')
  const idRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const buckets = new Array(gridSize).fill(0).map(() => [] as HashEntry[])

  entries.forEach(entry => {
    buckets[entry.bucket].push(entry)
  })

  const collisions = buckets.filter(b => b.length > 1).length
  const collisionRate = entries.length > 0 ? ((collisions / gridSize) * 100).toFixed(1) : '0.0'

  const addOne = useCallback(() => {
    const url = generateUrl(idRef.current)
    const bucket = hashUrl(url, gridSize)
    const entry: HashEntry = { url, bucket, id: idRef.current }
    idRef.current++
    setEntries(prev => {
      const existing = prev.find(e => e.bucket === bucket)
      if (existing && resolution === 'rehash') {
        const newBucket = (bucket + 1) % gridSize
        return [...prev, { ...entry, bucket: newBucket }]
      }
      if (existing && resolution === 'append') {
        return [...prev, entry]
      }
      return [...prev, entry]
    })
  }, [gridSize, resolution])

  const toggleAuto = useCallback(() => {
    if (autoRunning) {
      if (timerRef.current) clearInterval(timerRef.current)
      setAutoRunning(false)
    } else {
      setAutoRunning(true)
      timerRef.current = setInterval(() => {
        addOne()
      }, 80)
    }
  }, [autoRunning, addOne])

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setAutoRunning(false)
    setEntries([])
    idRef.current = 0
  }

  const maxBucketSize = Math.max(...buckets.map(b => b.length), 1)

  return (
    <DemoBoundary name="Hash Collision Simulator">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: 'hidden' }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${s.border}`, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>Hash space:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {GRID_SIZES.map(gs => (
                <button key={gs} onClick={() => { setGridSize(gs); reset(); }} style={{
                  padding: '4px 10px', fontSize: 11, fontFamily: s.mono, borderRadius: 4,
                  border: `1px solid ${gridSize === gs ? s.accent : s.border}`,
                  background: gridSize === gs ? 'rgba(91,141,239,0.15)' : 'transparent',
                  color: gridSize === gs ? s.accent : s.text3, cursor: 'pointer',
                }}>
                  {gs}x{gs}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginLeft: 8 }}>Resolution:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['none', 'rehash', 'append'] as const).map(r => (
                <button key={r} onClick={() => setResolution(r)} style={{
                  padding: '4px 10px', fontSize: 11, fontFamily: s.mono, borderRadius: 4,
                  border: `1px solid ${resolution === r ? s.yellow : s.border}`,
                  background: resolution === r ? 'rgba(224,176,64,0.15)' : 'transparent',
                  color: resolution === r ? s.yellow : s.text3, cursor: 'pointer', textTransform: 'capitalize',
                }}>
                  {r}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button onClick={addOne} style={{
                padding: '5px 12px', fontSize: 12, fontFamily: s.mono, borderRadius: 5,
                border: `1px solid ${s.green}`, background: 'rgba(61,214,140,0.1)', color: s.green, cursor: 'pointer',
              }}>
                +1 URL
              </button>
              <button onClick={() => { for (let i = 0; i < 20; i++) setTimeout(addOne, i * 30) }} style={{
                padding: '5px 12px', fontSize: 12, fontFamily: s.mono, borderRadius: 5,
                border: `1px solid ${s.accent}`, background: 'rgba(91,141,239,0.1)', color: s.accent, cursor: 'pointer',
              }}>
                +20
              </button>
              <button onClick={toggleAuto} style={{
                padding: '5px 12px', fontSize: 12, fontFamily: s.mono, borderRadius: 5,
                border: `1px solid ${autoRunning ? s.red : s.orange}`,
                background: autoRunning ? 'rgba(232,93,93,0.1)' : 'rgba(232,148,90,0.1)',
                color: autoRunning ? s.red : s.orange, cursor: 'pointer',
              }}>
                {autoRunning ? 'Stop' : 'Auto'}
              </button>
              <button onClick={reset} style={{
                padding: '5px 12px', fontSize: 12, fontFamily: s.mono, borderRadius: 5,
                border: `1px solid ${s.border}`, background: 'transparent', color: s.text3, cursor: 'pointer',
              }}>
                Reset
              </button>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: 2,
              maxWidth: gridSize * 28 + (gridSize - 1) * 2, margin: '0 auto',
            }}>
              {buckets.map((bucket, bi) => {
                const hasCollision = bucket.length > 1
                const intensity = Math.min(bucket.length / Math.max(maxBucketSize, 1), 1)
                const bg = hasCollision
                  ? `rgba(232, 93, 93, ${0.15 + intensity * 0.7})`
                  : bucket.length > 0
                    ? `rgba(61, 214, 140, ${0.15 + intensity * 0.5})`
                    : s.bg
                const border = hasCollision ? s.red : bucket.length > 0 ? s.green : s.border
                return (
                  <div key={bi} title={`Bucket ${bi}: ${bucket.length} URL(s)${hasCollision ? ' (COLLISION)' : ''}`} style={{
                    aspectRatio: '1', background: bg, border: `1px solid ${border}`,
                    borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: gridSize <= 16 ? 10 : 8, fontFamily: s.mono,
                    color: hasCollision ? s.red : bucket.length > 0 ? s.green : s.text3,
                    fontWeight: hasCollision ? 700 : 400,
                    transition: 'all 0.15s',
                  }}>
                    {bucket.length > 0 ? bucket.length : ''}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ padding: '12px 16px', borderTop: `1px solid ${s.border}`, background: s.bg, display: 'flex', gap: 24, fontSize: 12, fontFamily: s.mono, flexWrap: 'wrap' }}>
            <span>Total hashes: <span style={{ color: s.text }}>{entries.length}</span></span>
            <span>Collisions: <span style={{ color: collisions > 0 ? s.red : s.green }}>{collisions}</span></span>
            <span>Collision rate: <span style={{ color: parseFloat(collisionRate) > 20 ? s.red : parseFloat(collisionRate) > 5 ? s.yellow : s.green }}>{collisionRate}%</span></span>
            <span>Load factor: <span style={{ color: s.text2 }}>{gridSize > 0 ? (entries.length / gridSize).toFixed(2) : '0.00'}</span></span>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
