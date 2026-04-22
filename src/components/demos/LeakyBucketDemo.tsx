import { useState, useEffect, useCallback, useRef } from 'react'
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

interface Drop {
  id: number
  color: string
  entering: boolean
}

export default function LeakyBucketDemo() {
  const [bucketSize, setBucketSize] = useState(5)
  const [leakRate, setLeakRate] = useState(1)
  const [queue, setQueue] = useState<Drop[]>([])
  const [processed, setProcessed] = useState(0)
  const [overflowed, setOverflowed] = useState(0)
  const [nextId, setNextId] = useState(0)
  const [droppingOut, setDroppingOut] = useState(false)
  const queueRef = useRef<Drop[]>([])
  const nextIdRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setQueue(prev => {
        if (prev.length === 0) return prev
        const next = [...prev]
        for (let i = 0; i < leakRate && next.length > 0; i++) {
          next.shift()
        }
        queueRef.current = next
        return next
      })
      setProcessed(prev => prev + leakRate)
      setDroppingOut(true)
      setTimeout(() => setDroppingOut(false), 300)
    }, 1000)
    return () => clearInterval(interval)
  }, [leakRate])

  const addRequest = useCallback(() => {
    const id = nextIdRef.current++
    setNextId(id + 1)
    const colors = [s.accent, s.green, s.purple, s.orange, s.yellow]
    const color = colors[id % colors.length]

    setQueue(prev => {
      if (prev.length >= bucketSize) {
        setOverflowed(o => o + 1)
        queueRef.current = prev
        return prev
      }
      const next = [...prev, { id, color, entering: true }]
      queueRef.current = next
      setTimeout(() => {
        setQueue(q => q.map(d => d.id === id ? { ...d, entering: false } : d))
      }, 300)
      return next
    })
  }, [bucketSize])

  const reset = () => {
    setQueue([])
    queueRef.current = []
    setProcessed(0)
    setOverflowed(0)
    setNextId(0)
    nextIdRef.current = 0
  }

  const fillPct = bucketSize > 0 ? (queue.length / bucketSize) * 100 : 0

  return (
    <DemoBoundary name="Leaky Bucket Algorithm">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Leaky Bucket</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Requests enter the bucket at any rate. They leak out at a fixed rate. If the bucket fills up, new requests overflow (get rejected).
          This smooths out traffic bursts into a steady stream.
        </p>

        <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>Bucket Size (queue capacity)</label>
            <input type="range" min={1} max={10} value={bucketSize} onChange={e => setBucketSize(Number(e.target.value))} style={{ width: '100%', accentColor: s.accent }} />
            <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{bucketSize}</span>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>Leak Rate (processed/sec)</label>
            <input type="range" min={1} max={5} value={leakRate} onChange={e => setLeakRate(Number(e.target.value))} style={{ width: '100%', accentColor: s.green }} />
            <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{leakRate}/s</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'stretch', marginBottom: 20 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6 }}>Incoming requests</div>
            <svg width={200} height={220} style={{ display: 'block' }}>
              <defs>
                <linearGradient id="leakBucketFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={`${s.accent}44`} />
                  <stop offset="100%" stopColor={`${s.accent}11`} />
                </linearGradient>
              </defs>
              <rect x={50} y={10} width={100} height={160} rx={8} fill={s.bg} stroke={s.border} strokeWidth={1.5} />
              <rect x={51} y={11} width={98} height={158} rx={7} fill="url(#leakBucketFill)" />
              <rect x={50} y={10} width={100} height={160} rx={8} fill="none" stroke={s.border} strokeWidth={1.5} />

              {queue.map((drop, i) => {
                const row = Math.floor(i / 3)
                const col = i % 3
                const cx = 75 + col * 25
                const cy = 155 - row * 28
                return (
                  <circle key={drop.id} cx={cx} cy={cy} r={9} fill={drop.color} opacity={drop.entering ? 0.5 : 0.9}>
                    <animate attributeName="opacity" from="0.5" to="0.9" dur="0.3s" fill="freeze" />
                  </circle>
                )
              })}

              {droppingOut && (
                <>
                  {[...Array(leakRate)].map((_, i) => (
                    <circle key={`out-${i}`} cx={85 + i * 25} cy={180} r={7} fill={s.green} opacity={0.7}>
                      <animate attributeName="cy" from="180" to="215" dur="0.3s" fill="freeze" />
                      <animate attributeName="opacity" from="0.7" to="0" dur="0.3s" fill="freeze" />
                    </circle>
                  ))}
                </>
              )}

              <text x={100} y={25} textAnchor="middle" fill={s.text3} fontSize={11} fontFamily={s.mono}>
                {queue.length}/{bucketSize}
              </text>

              <line x1={75} y1={170} x2={75} y2={180} stroke={s.green} strokeWidth={1.5} strokeDasharray="3 2" />
              <line x1={100} y1={170} x2={100} y2={180} stroke={s.green} strokeWidth={1.5} strokeDasharray="3 2" />
              <line x1={125} y1={170} x2={125} y2={180} stroke={s.green} strokeWidth={1.5} strokeDasharray="3 2" />

              <text x={100} y={200} textAnchor="middle" fill={s.green} fontSize={10} fontFamily={s.mono}>
                {leakRate}/s out
              </text>
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 140 }}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ color: s.accent, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>{queue.length}</div>
              <div style={{ color: s.text3, fontSize: 11 }}>In Queue</div>
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ color: s.green, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>{processed}</div>
              <div style={{ color: s.text3, fontSize: 11 }}>Processed</div>
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ color: s.red, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>{overflowed}</div>
              <div style={{ color: s.text3, fontSize: 11 }}>Overflowed</div>
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ color: s.text, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>
                {fillPct.toFixed(0)}%
              </div>
              <div style={{ color: s.text3, fontSize: 11 }}>Full</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={addRequest} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
          }}>Add Request</button>
          <button onClick={() => { for (let i = 0; i < 3; i++) setTimeout(() => addRequest(), i * 80) }} style={{
            background: s.purple, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>Burst +3</button>
        </div>

        <div style={{ marginTop: 20, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Token Bucket vs Leaky Bucket</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: 12 }}>
              <div style={{ color: s.accent, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Token Bucket</div>
              <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>Burst-friendly. Tokens refill over time. Empty bucket = reject.</div>
            </div>
            <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: 12 }}>
              <div style={{ color: s.green, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Leaky Bucket</div>
              <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>Smooths output. Requests queue up. Full bucket = reject.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
