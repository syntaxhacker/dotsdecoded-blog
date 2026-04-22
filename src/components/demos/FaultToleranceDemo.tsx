import { useState, useEffect, useCallback, useRef } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

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

interface Component {
  id: string
  label: string
  alive: boolean
  capacity: number
  color: string
  x: number
  y: number
}

const initialComponents: Component[] = [
  { id: 'lb', label: 'Load Balancer', alive: true, capacity: 100, color: s.accent, x: 300, y: 30 },
  { id: 's1', label: 'Server 1', alive: true, capacity: 50, color: s.green, x: 180, y: 130 },
  { id: 's2', label: 'Server 2', alive: true, capacity: 50, color: s.green, x: 300, y: 130 },
  { id: 's3', label: 'Server 3', alive: true, capacity: 50, color: s.green, x: 420, y: 130 },
  { id: 'db1', label: 'DB Primary', alive: true, capacity: 100, color: s.orange, x: 240, y: 230 },
  { id: 'db2', label: 'DB Replica', alive: true, capacity: 100, color: s.purple, x: 360, y: 230 },
]

export default function FaultToleranceDemo() {
  const [components, setComponents] = useState<Component[]>(initialComponents)
  const [requests, setRequests] = useState<{ id: number; target: string; progress: number; done: boolean; rerouted: boolean }[]>([])
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [log, setLog] = useState<string[]>([])
  const [totalReq, setTotalReq] = useState(0)
  const [dropped, setDropped] = useState(0)
  const idRef = useRef(0)

  const addLog = useCallback((msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 8))
  }, [])

  const aliveServers = components.filter(c => c.id.startsWith('s') && c.alive)
  const aliveDb = components.filter(c => c.id.startsWith('db') && c.alive)
  const totalCapacity = aliveServers.reduce((a, c) => a + c.capacity, 0)
  const availability = aliveServers.length > 0 && aliveDb.length > 0
    ? Math.min(100, Math.round((totalCapacity / 150) * 100))
    : 0

  const toggleComponent = (id: string) => {
    setComponents(prev => {
      const target = prev.find(c => c.id === id)
      if (!target) return prev
      const newAlive = !target.alive
      addLog(`${newAlive ? 'STARTED' : 'KILLED'} ${target.label}`)
      return prev.map(c => c.id === id ? { ...c, alive: newAlive } : c)
    })
  }

  useEffect(() => {
    if (!running || aliveServers.length === 0 || aliveDb.length === 0) return
    const interval = setInterval(() => {
      idRef.current++
      const id = idRef.current
      const target = aliveServers[Math.floor(Math.random() * aliveServers.length)].id
      setRequests(prev => [...prev.slice(-12), { id, target, progress: 0, done: false, rerouted: false }])
      setTotalReq(prev => prev + 1)
    }, getStepDelay(500, speed))
    return () => clearInterval(interval)
  }, [running, aliveServers.length, aliveDb.length, speed])

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => {
      setRequests(prev => prev.map(r => {
        if (r.done) return r
        const targetAlive = components.find(c => c.id === r.target)?.alive
        if (!targetAlive && !r.rerouted) {
          const newTarget = aliveServers.length > 0 ? aliveServers[Math.floor(Math.random() * aliveServers.length)].id : ''
          if (!newTarget) {
            setDropped(d => d + 1)
            addLog(`Request #${r.id} DROPPED - no servers available`)
            return { ...r, done: true, rerouted: true }
          }
          addLog(`Request #${r.id} rerouted to ${newTarget}`)
          return { ...r, target: newTarget, progress: 0, rerouted: true }
        }
        const newProgress = r.progress + 5
        if (newProgress >= 100) return { ...r, progress: 100, done: true }
        return { ...r, progress: newProgress }
      }).filter(r => !r.done).slice(-12))
    }, getStepDelay(80, speed))
    return () => clearInterval(timer)
  }, [running, components, aliveServers, speed, addLog])

  const resetAll = () => {
    setComponents(initialComponents)
    setRequests([])
    setLog([])
    setTotalReq(0)
    setDropped(0)
    idRef.current = 0
  }

  const compMap = Object.fromEntries(components.map(c => [c.id, c]))

  return (
    <DemoBoundary name="Fault Tolerance">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Fault Tolerance</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Click a component to kill it. Watch traffic reroute automatically.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {components.map(c => (
            <button key={c.id} onClick={() => toggleComponent(c.id)} style={{
              background: c.alive ? `${c.color}20` : `${s.red}20`,
              border: `1px solid ${c.alive ? c.color : s.red}`,
              borderRadius: 6, padding: '4px 10px', color: c.alive ? c.color : s.red,
              cursor: 'pointer', fontSize: 11, fontFamily: s.mono, transition: 'all 0.2s',
            }}>
              {c.alive ? 'Kill' : 'Revive'} {c.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={resetAll} style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '4px 10px', color: s.text2, cursor: 'pointer', fontSize: 11 }}>Reset</button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <svg viewBox="0 0 600 280" style={{ width: '100%', height: 'auto', marginBottom: 16, overflow: 'hidden' }}>
          {components.map(c => (
            <g key={c.id}>
              <rect x={c.x - 50} y={c.y - 18} width={100} height={36} rx={8} fill={c.alive ? s.bg3 : `${s.red}15`} stroke={c.alive ? c.color : s.red} strokeWidth={2} strokeDasharray={c.alive ? 'none' : '6 3'} />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fill={c.alive ? c.color : s.red} fontSize={11} fontWeight={600} fontFamily={s.mono}>{c.alive ? c.label : 'DEAD'}</text>
              {!c.alive && <line x1={c.x - 40} y1={c.y - 14} x2={c.x + 40} y2={c.y + 14} stroke={s.red} strokeWidth={2} />}
            </g>
          ))}

          {components.filter(c => c.id.startsWith('s')).map(c => {
            const lb = compMap['lb']
            return (
              <line key={`line-lb-${c.id}`} x1={lb.x} y1={lb.y + 18} x2={c.x} y2={c.y - 18} stroke={c.alive ? `${c.color}40` : `${s.red}30`} strokeWidth={1.5} />
            )
          })}

          {components.filter(c => c.id.startsWith('db')).map(c => {
            return (
              <g key={`line-db-${c.id}`}>
                {components.filter(sv => sv.id.startsWith('s') && sv.alive).map(sv => (
                  <line key={`line-${sv.id}-${c.id}`} x1={sv.x} y1={sv.y + 18} x2={c.x} y2={c.y - 18} stroke={c.alive ? `${c.color}30` : `${s.red}20`} strokeWidth={1} />
                ))}
              </g>
            )
          })}

          {requests.filter(r => !r.done).map(r => {
            const target = compMap[r.target]
            if (!target) return null
            const lb = compMap['lb']
            const fromX = lb.x
            const fromY = lb.y + 18
            const toX = target.x
            const toY = target.y - 18
            const currentX = fromX + (toX - fromX) * (r.progress / 100)
            const currentY = fromY + (toY - fromY) * (r.progress / 100)
            return (
              <circle key={r.id} cx={currentX} cy={currentY} r={4} fill={r.rerouted ? s.yellow : s.accent} opacity={0.8}>
                <animate attributeName="opacity" values="0.4;1;0.4" dur="0.4s" repeatCount="indefinite" />
              </circle>
            )
          })}
        </svg>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: s.bg, borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>System Health</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: s.text2 }}>Availability</span>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: s.mono, color: availability >= 90 ? s.green : availability >= 50 ? s.yellow : s.red }}>{availability}%</span>
            </div>
            <div style={{ height: 6, background: s.bg3, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${availability}%`, background: availability >= 90 ? s.green : availability >= 50 ? s.yellow : s.red, borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 11, color: s.text2 }}>Total Served</span>
              <span style={{ fontSize: 11, fontFamily: s.mono, color: s.green }}>{totalReq}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: s.text2 }}>Dropped</span>
              <span style={{ fontSize: 11, fontFamily: s.mono, color: dropped > 0 ? s.red : s.text3 }}>{dropped}</span>
            </div>
          </div>
          <div style={{ background: s.bg, borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Event Log</div>
            <div style={{ maxHeight: 80, overflowY: 'auto' }}>
              {log.length === 0 && <div style={{ fontSize: 11, color: s.text3, textAlign: 'center', padding: '8px 0' }}>No events yet</div>}
              {log.map((msg, idx) => (
                <div key={idx} style={{ fontSize: 10, fontFamily: s.mono, color: msg.includes('DROPPED') ? s.red : msg.includes('rerouted') ? s.yellow : s.text3, marginBottom: 2, lineHeight: 1.4 }}>
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
