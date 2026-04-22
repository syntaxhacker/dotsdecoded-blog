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

type Mode = 'start' | 'single' | 'vertical' | 'horizontal'

const SERVER_COLORS = [s.accent, s.green, s.orange, s.purple, s.yellow]

export default function ScalabilityCompareDemo() {
  const [mode, setMode] = useState<Mode>('start')
  const [serverSize, setServerSize] = useState(1)
  const [serverCount, setServerCount] = useState(1)
  const [maxCapacity, setMaxCapacity] = useState(100)
  const [requests, setRequests] = useState<{ id: number; target: number; x: number; done: boolean }[]>([])
  const [load, setLoad] = useState(0)
  const [overflow, setOverflow] = useState(0)
  const intervalRef = useRef<number>(0)
  const idRef = useRef(0)

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setMode('start')
    setServerSize(1)
    setServerCount(1)
    setMaxCapacity(100)
    setRequests([])
    setLoad(0)
    setOverflow(0)
    idRef.current = 0
  }

  const startLoad = () => {
    setRequests([])
    setLoad(0)
    setOverflow(0)
    idRef.current = 0
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = window.setInterval(() => {
      idRef.current++
      const id = idRef.current
      setRequests(prev => {
        const newReqs = [...prev, { id, target: -1, x: 0, done: false }]
        if (newReqs.length > 20) return newReqs.slice(-20)
        return newReqs
      })
    }, 600)
  }

  useEffect(() => {
    if (mode === 'start') return
    startLoad()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [mode])

  useEffect(() => {
    const cap = serverSize * serverCount * 100
    setMaxCapacity(cap)
  }, [serverSize, serverCount])

  useEffect(() => {
    const rate = serverSize * serverCount * 2
    const timer = setInterval(() => {
      setRequests(prev => {
        const updated = prev.map(r => {
          if (r.done) return r
          const newX = r.x + rate
          if (newX >= 100) return { ...r, x: 100, done: true }
          return { ...r, x: newX }
        })
        const active = updated.filter(r => !r.done).length
        setLoad(active)
        setOverflow(Math.max(0, active - rate * 3))
        return updated.slice(-20)
      })
    }, 100)
    return () => clearInterval(timer)
  }, [serverSize, serverCount, mode])

  const handleVertical = () => {
    setMode('vertical')
    setServerSize(prev => Math.min(prev + 1, 4))
  }

  const handleHorizontal = () => {
    setMode('horizontal')
    setServerCount(prev => Math.min(prev + 1, 5))
  }

  return (
    <DemoBoundary name="Scalability Comparison">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Vertical vs Horizontal Scaling</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Start with one server, then scale up (bigger machine) or scale out (more machines) to handle incoming requests.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={reset} style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 16px', color: s.text2, cursor: 'pointer', fontSize: 13 }}>Reset</button>
          <button onClick={() => { setMode('single'); startLoad() }} style={{ background: mode === 'single' ? s.yellow : s.bg3, border: `1px solid ${mode === 'single' ? s.yellow : s.border}`, borderRadius: 8, padding: '8px 16px', color: mode === 'single' ? '#000' : s.text2, cursor: 'pointer', fontSize: 13 }}>Start Load</button>
          <button onClick={handleVertical} disabled={serverSize >= 4} style={{ background: s.accent, border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: serverSize >= 4 ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: serverSize >= 4 ? 0.5 : 1 }}>
            Scale Up (Vertical) [{serverSize}x]
          </button>
          <button onClick={handleHorizontal} disabled={serverCount >= 5} style={{ background: s.green, border: 'none', borderRadius: 8, padding: '8px 16px', color: '#000', cursor: serverCount >= 5 ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: serverCount >= 5 ? 0.5 : 1 }}>
            Scale Out (Horizontal) [{serverCount}]
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {mode === 'vertical' ? 'Vertical Scaling' : mode === 'horizontal' ? 'Horizontal Scaling' : 'Server(s)'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Array.from({ length: serverCount }).map((_, si) => (
                <div key={si} style={{
                  width: 40 * serverSize, height: 50 * serverSize, background: s.bg3,
                  border: `2px solid ${SERVER_COLORS[si % SERVER_COLORS.length]}`, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.4s', minWidth: 40, minHeight: 50,
                }}>
                  <div style={{ fontSize: 10, color: SERVER_COLORS[si % SERVER_COLORS.length], fontFamily: s.mono, fontWeight: 700 }}>
                    {serverSize > 1 ? `S${si + 1}` : 'S'}
                    {serverSize > 1 && <div style={{ fontSize: 8, color: s.text3 }}>{serverSize}x</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Stats</div>
            <div style={{ background: s.bg, borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: s.text2 }}>Max Capacity</span>
                <span style={{ fontSize: 11, fontFamily: s.mono, color: s.accent }}>{maxCapacity} req/s</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: s.text2 }}>Current Load</span>
                <span style={{ fontSize: 11, fontFamily: s.mono, color: load > maxCapacity ? s.red : s.green }}>{load}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: s.text2 }}>Overflow</span>
                <span style={{ fontSize: 11, fontFamily: s.mono, color: overflow > 0 ? s.red : s.text3 }}>{overflow > 0 ? `${overflow} dropped` : '0'}</span>
              </div>
              <div style={{ height: 4, background: s.bg3, borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((load / maxCapacity) * 100, 100)}%`, background: load > maxCapacity ? s.red : s.green, borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: s.bg, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Incoming Requests</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', minHeight: 30 }}>
            {requests.map(r => (
              <div key={r.id} style={{
                width: 16, height: 16, borderRadius: 3,
                background: r.done ? s.green + '40' : s.accent,
                opacity: r.done ? 0.4 : 0.8,
                transition: 'all 0.2s',
              }} />
            ))}
            {requests.length === 0 && <span style={{ fontSize: 11, color: s.text3 }}>No requests yet</span>}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
