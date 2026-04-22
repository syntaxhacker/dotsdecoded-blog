import { useState, useEffect, useRef } from 'react'
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

export default function LatencyThroughputDemo() {
  const [latency, setLatency] = useState(50)
  const [throughput, setThroughput] = useState(100)
  const [numRequests, setNumRequests] = useState(10)
  const [running, setRunning] = useState(false)
  const [packets, setPackets] = useState<{ id: number; x: number; sent: boolean; arrived: boolean }[]>([])
  const [completed, setCompleted] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const frameRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  const reset = () => {
    setRunning(false)
    setPackets([])
    setCompleted(0)
    setElapsed(0)
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
  }

  const start = () => {
    reset()
    const init: { id: number; x: number; sent: boolean; arrived: boolean }[] = []
    for (let i = 0; i < numRequests; i++) {
      init.push({ id: i, x: 0, sent: false, arrived: false })
    }
    setPackets(init)
    setRunning(true)
    startRef.current = performance.now()
  }

  useEffect(() => {
    if (!running) return

    let sentCount = 0
    let completedCount = 0
    const interval = 1000 / throughput
    let lastSend = 0

    const animate = (now: number) => {
      const dt = now - startRef.current
      setElapsed(dt)

      const elapsedSec = dt / 1000

      setPackets(prev => prev.map(p => {
        if (!p.sent && sentCount / throughput * 1000 <= dt) {
          sentCount++
          return { ...p, sent: true, x: 0 }
        }
        if (p.sent && !p.arrived) {
          const sendTime = (p.id / throughput) * 1000
          const progress = Math.min((dt - sendTime) / latency, 1)
          if (progress >= 1) {
            completedCount++
            return { ...p, arrived: true, x: 100 }
          }
          return { ...p, x: progress * 100 }
        }
        return p
      }))

      setCompleted(completedCount)

      if (completedCount >= numRequests) {
        setRunning(false)
        return
      }

      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [running, latency, throughput, numRequests])

  const littlesLawW = throughput > 0 ? (latency / 1000).toFixed(3) : '0'
  const littlesLawL = throughput > 0 ? (throughput * latency / 1000).toFixed(1) : '0'
  const totalTime = numRequests > 0 && throughput > 0 ? ((numRequests / throughput) * 1000 + latency).toFixed(0) : '0'

  return (
    <DemoBoundary name="Latency vs Throughput">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Latency vs Throughput</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Adjust latency (delay per packet) and throughput (packets per second) to see how they affect total completion time.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: s.text2, fontWeight: 600 }}>Latency (ms)</span>
              <span style={{ fontSize: 12, fontFamily: s.mono, color: s.accent }}>{latency}ms</span>
            </div>
            <input type="range" min={10} max={200} value={latency} onChange={e => setLatency(+e.target.value)} disabled={running} style={{ width: '100%', accentColor: s.accent }} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: s.text2, fontWeight: 600 }}>Throughput (pkt/s)</span>
              <span style={{ fontSize: 12, fontFamily: s.mono, color: s.green }}>{throughput}</span>
            </div>
            <input type="range" min={1} max={200} value={throughput} onChange={e => setThroughput(+e.target.value)} disabled={running} style={{ width: '100%', accentColor: s.green }} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: s.text2, fontWeight: 600 }}>Total Requests</span>
              <span style={{ fontSize: 12, fontFamily: s.mono, color: s.orange }}>{numRequests}</span>
            </div>
            <input type="range" min={3} max={30} value={numRequests} onChange={e => setNumRequests(+e.target.value)} disabled={running} style={{ width: '100%', accentColor: s.orange }} />
          </div>
          <div style={{ background: s.bg, borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Little's Law: L = lambda * W</div>
            <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text2, lineHeight: 1.8 }}>
              <div>W (wait time): <span style={{ color: s.accent }}>{littlesLawW}s</span></div>
              <div>lambda (rate): <span style={{ color: s.green }}>{throughput}/s</span></div>
              <div>L (in flight): <span style={{ color: s.orange }}>{littlesLawL}</span></div>
            </div>
          </div>
        </div>

        <div style={{ background: s.bg, borderRadius: 8, padding: 16, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 1 }}>Pipeline Visualization</span>
            <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>
              {completed}/{numRequests} completed
              {running && <span style={{ color: s.accent }}> | {elapsed.toFixed(0)}ms elapsed</span>}
            </span>
          </div>

          <svg viewBox="0 0 700 60" style={{ width: '100%', height: 'auto' }}>
            <rect x={0} y={10} width={700} height={40} rx={6} fill={s.bg3} />
            <text x={10} y={34} fill={s.text3} fontSize={9} fontFamily={s.mono}>Client</text>
            <text x={660} y={34} fill={s.text3} fontSize={9} fontFamily={s.mono}>Server</text>
            {packets.map((p, idx) => {
              const x = 50 + (p.x / 100) * 600
              return (
                <g key={p.id}>
                  {p.sent && !p.arrived && (
                    <circle cx={x} cy={30} r={6} fill={s.accent} opacity={0.8}>
                      <animate attributeName="opacity" values="0.5;1;0.5" dur="0.4s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {p.arrived && (
                    <circle cx={650} cy={30 - (idx % 5) * 5 + 10} r={4} fill={s.green} />
                  )}
                </g>
              )
            })}
          </svg>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            <div style={{ fontSize: 11, color: s.text2 }}>
              Est. total time: <span style={{ fontFamily: s.mono, color: s.yellow }}>{totalTime}ms</span>
            </div>
            {!running && completed === numRequests && completed > 0 && (
              <div style={{ fontSize: 11, color: s.green, fontWeight: 600 }}>
                Actual: {elapsed.toFixed(0)}ms
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={reset} style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 20px', color: s.text2, cursor: 'pointer', fontSize: 13 }}>Reset</button>
          <button onClick={start} disabled={running} style={{ background: s.accent, border: 'none', borderRadius: 8, padding: '8px 20px', color: '#fff', cursor: running ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: running ? 0.6 : 1 }}>
            {running ? 'Running...' : 'Run Simulation'}
          </button>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
