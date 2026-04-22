import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type Driver = {
  id: number
  x: number
  y: number
  dist: number
  eta: number
  rating: number
  status: 'idle' | 'offered' | 'accepted' | 'rejected'
}

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

const MW = 480
const MH = 320
const SCALE = 1

const RIDER = { x: MW / 2, y: MH / 2 }

const SEED_DRIVERS: Omit<Driver, 'dist' | 'eta' | 'status'>[] = [
  { id: 1, x: 260, y: 140, rating: 4.8 },
  { id: 2, x: 180, y: 200, rating: 4.5 },
  { id: 3, x: 360, y: 230, rating: 4.9 },
  { id: 4, x: 140, y: 110, rating: 4.2 },
  { id: 5, x: 400, y: 160, rating: 4.7 },
  { id: 6, x: 300, y: 320, rating: 4.6 },
  { id: 7, x: 220, y: 280, rating: 4.3 },
]

type Phase = 'idle' | 'calculating' | 'offering' | 'deciding' | 'accepted' | 'retrying' | 'done'

export default function DriverMatchDemo() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [log, setLog] = useState<string[]>([])
  const [sorted, setSorted] = useState<Driver[]>([])

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev, msg])
  }, [])

  const init = useCallback(() => {
    const d = SEED_DRIVERS.map((dr) => {
      const d2 = dist(dr.x, dr.y, RIDER.x, RIDER.y)
      return { ...dr, dist: Math.round(d2), eta: Math.round(d2 / 30 * 60), status: 'idle' as const }
    })
    setDrivers(d)
    setLog([])
    setPhase('idle')
    setCurrentIdx(0)
    setSorted([])
  }, [])

  useEffect(() => { init() }, [init])

  const start = () => {
    init()
    const ranked = [...drivers].sort((a, b) => a.dist - b.dist)
    setSorted(ranked)
    setPhase('calculating')
    addLog('Rider requests ride at center')
  }

  useEffect(() => {
    if (phase === 'calculating') {
      const ranked = [...drivers].sort((a, b) => a.dist - b.dist)
      setSorted(ranked)
      const t = setTimeout(() => {
        setPhase('offering')
        setCurrentIdx(0)
        addLog(`Offering ride to Driver ${ranked[0].id} (${ranked[0].dist}px away)`)
      }, getStepDelay(600, speed))
      return () => clearTimeout(t)
    }
  }, [phase, drivers, speed, addLog])

  useEffect(() => {
    if (phase === 'offering') {
      setDrivers((prev) => prev.map((d) =>
        d.id === sorted[currentIdx]?.id ? { ...d, status: 'offered' as const } : d
      ))
      const t = setTimeout(() => {
        setPhase('deciding')
      }, getStepDelay(800, speed))
      return () => clearTimeout(t)
    }
  }, [phase, currentIdx, sorted, speed])

  useEffect(() => {
    if (phase !== 'deciding') return
    const driver = sorted[currentIdx]
    if (!driver) return

    const reject = driver.rating < 4.5
    const t = setTimeout(() => {
      if (reject) {
        setDrivers((prev) => prev.map((d) =>
          d.id === driver.id ? { ...d, status: 'rejected' as const } : d
        ))
        addLog(`Driver ${driver.id} rejected (rating ${driver.rating})`)

        if (currentIdx + 1 < sorted.length) {
          setPhase('retrying')
        } else {
          setPhase('done')
          addLog('No drivers available!')
        }
      } else {
        setDrivers((prev) => prev.map((d) =>
          d.id === driver.id ? { ...d, status: 'accepted' as const } : d
        ))
        addLog(`Driver ${driver.id} accepted! ETA: ${driver.eta}s`)
        setPhase('accepted')
      }
    }, getStepDelay(700, speed))
    return () => clearTimeout(t)
  }, [phase, currentIdx, sorted, speed, addLog])

  useEffect(() => {
    if (phase === 'retrying') {
      const nextIdx = currentIdx + 1
      setCurrentIdx(nextIdx)
      const t = setTimeout(() => {
        setPhase('offering')
        addLog(`Offering ride to Driver ${sorted[nextIdx].id} (${sorted[nextIdx].dist}px away)`)
      }, getStepDelay(500, speed))
      return () => clearTimeout(t)
    }
  }, [phase, currentIdx, sorted, speed, addLog])

  const driverColor = (d: Driver) => {
    if (d.status === 'accepted') return s.green
    if (d.status === 'rejected') return s.red
    if (d.status === 'offered') return s.yellow
    return s.text3
  }

  return (
    <DemoBoundary name="Driver Matching Algorithm">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 12, overflow: 'hidden' }}>
              <svg width={MW} height={MH} style={{ display: 'block', borderRadius: 6 }}>
                <rect width={MW} height={MH} fill={s.bg} rx={6} />
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <line key={`h${i}`} x1={0} y1={i * 40 + 40} x2={MW} y2={i * 40 + 40} stroke={s.bg3} strokeWidth={0.5} />
                ))}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                  <line key={`v${i}`} x1={i * 40 + 40} y1={0} x2={i * 40 + 40} y2={MH} stroke={s.bg3} strokeWidth={0.5} />
                ))}
                {RIDER && (
                  <g>
                    <circle cx={RIDER.x} cy={RIDER.y} r={60} fill="none" stroke={s.accent} strokeWidth={1} strokeDasharray="3 3" opacity={0.4} />
                    <circle cx={RIDER.x} cy={RIDER.y} r={8} fill={s.accent} />
                    <text x={RIDER.x + 12} y={RIDER.y + 4} fill={s.accent} fontSize={10} fontFamily={s.mono}>RIDER</text>
                  </g>
                )}
                {drivers.map((d) => (
                  <g key={d.id}>
                    {d.status === 'offered' && (
                      <line x1={d.x} y1={d.y} x2={RIDER.x} y2={RIDER.y} stroke={s.yellow} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} />
                    )}
                    {d.status === 'accepted' && (
                      <line x1={d.x} y1={d.y} x2={RIDER.x} y2={RIDER.y} stroke={s.green} strokeWidth={2} opacity={0.7} />
                    )}
                    <circle cx={d.x} cy={d.y} r={d.status === 'offered' ? 10 : 7} fill={driverColor(d)} opacity={d.status === 'idle' ? 0.5 : 1} />
                    <text x={d.x} y={d.y + 1} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={7} fontWeight={700} fontFamily={s.mono}>
                      D{d.id}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={start} disabled={phase !== 'idle'}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 6, border: 'none',
                  background: phase !== 'idle' ? s.bg3 : s.accent, color: phase !== 'idle' ? s.text3 : '#fff',
                  fontSize: 13, fontWeight: 600, cursor: phase !== 'idle' ? 'not-allowed' : 'pointer',
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
              >
                Request Ride
              </button>
              <button onClick={init}
                style={{
                  padding: '8px 16px', borderRadius: 6, border: `1px solid ${s.border}`,
                  background: s.bg2, color: s.text2, fontSize: 13, cursor: 'pointer',
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
              >
                Reset
              </button>
              <SpeedController speed={speed} onSpeedChange={setSpeed} />
            </div>
          </div>

          <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sorted.length > 0 && (
              <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 8 }}>Ranked by Distance</div>
                {sorted.map((d, i) => (
                  <div key={d.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
                    borderBottom: `1px solid ${s.bg3}`, opacity: d.status === 'idle' ? 0.4 : 1,
                  }}>
                    <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, width: 16 }}>#{i + 1}</span>
                    <span style={{ fontSize: 12, fontFamily: s.mono, color: driverColor(d), flex: 1 }}>D{d.id}</span>
                    <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>{d.dist}px</span>
                    <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>{d.eta}s</span>
                    <span style={{
                      fontSize: 10, fontFamily: s.mono, color: s.yellow, padding: '1px 6px',
                      borderRadius: 3, background: `${s.yellow}15`,
                    }}>{d.rating}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12, flex: 1, overflowY: 'auto', maxHeight: 180 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 6 }}>Event Log</div>
              {log.length === 0 && <div style={{ fontSize: 12, color: s.text3 }}>Waiting for ride request...</div>}
              {log.map((l, i) => (
                <div key={i} style={{ fontSize: 11, fontFamily: s.mono, color: i === log.length - 1 ? s.text : s.text3, padding: '2px 0' }}>
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
