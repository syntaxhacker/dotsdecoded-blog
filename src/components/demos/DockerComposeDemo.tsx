import { useState, useEffect, useCallback, useRef } from 'react'
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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const serviceCard: React.CSSProperties = {
  background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 16,
  textAlign: 'center', minWidth: 140, transition: 'all 0.4s ease',
}

interface Service {
  name: string
  image: string
  port: string
  color: string
  status: 'stopped' | 'starting' | 'healthy' | 'unhealthy'
  replicas: number
  logs: string[]
}

const initialServices: Service[] = [
  { name: 'web', image: 'flask:3.1', port: '5000', color: s.accent, status: 'stopped', replicas: 1, logs: [] },
  { name: 'db', image: 'postgres:16', port: '5432', color: s.green, status: 'stopped', replicas: 1, logs: [] },
  { name: 'cache', image: 'redis:7', port: '6379', color: s.yellow, status: 'stopped', replicas: 1, logs: [] },
]

type LogFn = (svcIdx: number, msg: string) => void

export default function DockerComposeDemo() {
  const [services, setServices] = useState<Service[]>(initialServices.map(svc => ({ ...svc, logs: [] })))
  const [starting, setStarting] = useState(false)
  const [speed, setSpeed] = useState(1)
  const startRef = useRef(false)

  const addLog: LogFn = useCallback((svcIdx, msg) => {
    setServices(prev => {
      const next = prev.map(s => ({ ...s, logs: [...s.logs] }))
      next[svcIdx] = { ...next[svcIdx], logs: [...next[svcIdx].logs, `[${new Date().toISOString().slice(11, 19)}] ${msg}`] }
      return next
    })
  }, [])

  const setStatus = useCallback((svcIdx: number, status: Service['status']) => {
    setServices(prev => {
      const next = prev.map(s => ({ ...s, logs: [...s.logs] }))
      next[svcIdx] = { ...next[svcIdx], status }
      return next
    })
  }, [])

  const startAll = useCallback(async () => {
    if (startRef.current) return
    startRef.current = true
    setStarting(true)
    setServices(prev => prev.map(s => ({ ...s, status: 'stopped' as const, logs: [] })))

    setStatus(2, 'starting')
    addLog(2, 'Starting cache (redis:7)...')
    await new Promise(r => setTimeout(r, getStepDelay(600, speed)))
    addLog(2, 'Cache server started, accepting connections on port 6379')
    setStatus(2, 'healthy')

    setStatus(1, 'starting')
    addLog(1, 'Starting db (postgres:16)...')
    await new Promise(r => setTimeout(r, getStepDelay(500, speed)))
    addLog(1, 'Database system is ready to accept connections on port 5432')
    setStatus(1, 'healthy')

    setStatus(0, 'starting')
    addLog(0, 'Starting web (flask:3.1)...')
    await new Promise(r => setTimeout(r, getStepDelay(400, speed)))
    addLog(0, 'Waiting for db:5432... connected')
    addLog(0, 'Waiting for cache:6379... connected')
    await new Promise(r => setTimeout(r, getStepDelay(300, speed)))
    addLog(0, 'Flask app running on http://0.0.0.0:5000')
    setStatus(0, 'healthy')

    startRef.current = false
    setStarting(false)
  }, [speed, addLog, setStatus])

  const stopService = useCallback((svcIdx: number) => {
    setStatus(svcIdx, 'stopped')
    addLog(svcIdx, 'Received SIGTERM, shutting down...')
    if (svcIdx === 0) {
      addLog(0, 'Closing connections to db and cache')
    }
    setTimeout(() => addLog(svcIdx, 'Process exited'), getStepDelay(300, speed))
  }, [speed, addLog, setStatus])

  const scaleWeb = useCallback(() => {
    setServices(prev => {
      const next = prev.map(s => ({ ...s, logs: [...s.logs] }))
      next[0] = { ...next[0], replicas: next[0].replicas + 1 }
      const r = next[0].replicas
      next[0].logs = [...next[0].logs, `[${new Date().toISOString().slice(11, 19)}] Scaling web to ${r} replica${r > 1 ? 's' : ''}`]
      return next
    })
  }, [])

  useEffect(() => {
    return () => { startRef.current = false }
  }, [])

  const logContainer: React.CSSProperties = {
    background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
    padding: 12, maxHeight: 160, overflowY: 'auto', fontFamily: s.mono, fontSize: 11,
    lineHeight: 1.6, marginTop: 12,
  }

  return (
    <DemoBoundary name="Docker Compose">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={H}>Docker Compose Multi-Container App</div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' }}>
          {services.map((svc, i) => {
            const statusColors: Record<Service['status'], string> = {
              stopped: s.border, starting: s.yellow, healthy: s.green, unhealthy: s.red,
            }
            const statusLabels: Record<Service['status'], string> = {
              stopped: 'Stopped', starting: 'Starting...', healthy: 'Healthy', unhealthy: 'Unhealthy',
            }
            return (
              <div key={svc.name} style={{ ...serviceCard, borderColor: statusColors[svc.status], position: 'relative', flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: svc.color, marginBottom: 4, fontFamily: s.mono }}>{svc.name}</div>
                <div style={{ fontSize: 11, color: s.text3, marginBottom: 2 }}>{svc.image}</div>
                <div style={{ fontSize: 11, color: s.text3, marginBottom: 8 }}>Port {svc.port}</div>
                <div style={{
                  display: 'inline-block', padding: '2px 10px', borderRadius: 10,
                  background: `${statusColors[svc.status]}22`, color: statusColors[svc.status],
                  fontSize: 10, fontWeight: 600, fontFamily: s.mono,
                  transition: 'all 0.3s',
                }}>
                  {svc.replicas > 1 && svc.name === 'web' ? `${svc.replicas}x ` : ''}{statusLabels[svc.status]}
                </div>
              </div>
            )
          })}
        </div>

        <svg viewBox="0 0 500 40" style={{ width: '100%', height: 40, marginBottom: 16, display: 'block' }}>
          <line x1="70" y1="20" x2="210" y2="20" stroke={services[1].status === 'healthy' ? s.green : s.border} strokeWidth="2" strokeDasharray="4 3" />
          <line x1="210" y1="20" x2="350" y2="20" stroke={services[2].status === 'healthy' ? s.green : s.border} strokeWidth="2" strokeDasharray="4 3" />
          <line x1="70" y1="20" x2="350" y2="20" stroke={s.border} strokeWidth="1" strokeDasharray="2 4" />
          <circle cx="210" cy="20" r="10" fill={s.bg3} stroke={s.accent} strokeWidth="2" />
          <text x="210" y="24" textAnchor="middle" fill={s.accent} fontSize="9" fontFamily="monospace">db</text>
          <text x="140" y="10" textAnchor="middle" fill={s.text3} fontSize="8" fontFamily="monospace">depends_on</text>
          <text x="280" y="10" textAnchor="middle" fill={s.text3} fontSize="8" fontFamily="monospace">depends_on</text>
          <text x="420" y="24" fill={s.accent} fontSize="9" fontFamily="monospace">network: app-net</text>
          {services.map((svc, i) => {
            const xPos = 70 + i * 140
            return (
              <g key={svc.name}>
                <rect x={xPos - 25} y="5" width="50" height="30" rx="6" fill={svc.status === 'healthy' ? `${svc.color}22` : 'transparent'} stroke={svc.status === 'healthy' ? svc.color : s.border} strokeWidth="1.5" />
                <text x={xPos} y="25" textAnchor="middle" fill={svc.status === 'healthy' ? svc.color : s.text3} fontSize="10" fontWeight="700" fontFamily="monospace">{svc.name}</text>
              </g>
            )
          })}
        </svg>

        <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <button onClick={startAll} disabled={starting} style={{
            background: starting ? s.bg3 : s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: starting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
            opacity: starting ? 0.5 : 1,
          }}>Start All</button>
          <button onClick={() => stopService(0)} disabled={services[0].status === 'stopped'} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 16px',
            color: services[0].status === 'stopped' ? s.text3 : s.text2, cursor: services[0].status === 'stopped' ? 'not-allowed' : 'pointer',
            fontSize: 12, opacity: services[0].status === 'stopped' ? 0.5 : 1,
          }}>Stop Web</button>
          <button onClick={() => stopService(1)} disabled={services[1].status === 'stopped'} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 16px',
            color: services[1].status === 'stopped' ? s.text3 : s.text2, cursor: services[1].status === 'stopped' ? 'not-allowed' : 'pointer',
            fontSize: 12, opacity: services[1].status === 'stopped' ? 0.5 : 1,
          }}>Stop DB</button>
          <button onClick={() => stopService(2)} disabled={services[2].status === 'stopped'} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 16px',
            color: services[2].status === 'stopped' ? s.text3 : s.text2, cursor: services[2].status === 'stopped' ? 'not-allowed' : 'pointer',
            fontSize: 12, opacity: services[2].status === 'stopped' ? 0.5 : 1,
          }}>Stop Cache</button>
          <button onClick={scaleWeb} disabled={services[0].status === 'stopped'} style={{
            background: s.purple, border: 'none', borderRadius: 8, padding: '10px 16px',
            color: '#fff', cursor: services[0].status === 'stopped' ? 'not-allowed' : 'pointer',
            fontSize: 12, fontWeight: 600, opacity: services[0].status === 'stopped' ? 0.5 : 1,
          }}>Scale Web +1</button>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {services.map((svc, i) => (
            <div key={svc.name} style={{ flex: 1, minWidth: 180 }}>
              <div style={{ color: svc.color, fontSize: 11, fontWeight: 600, marginBottom: 4, fontFamily: s.mono }}>{svc.name} logs</div>
              <div style={logContainer}>
                {svc.logs.length === 0 ? (
                  <span style={{ color: s.text3 }}>No logs yet...</span>
                ) : (
                  svc.logs.map((line, li) => (
                    <div key={li} style={{ color: line.includes('Error') || line.includes('exited') ? s.red : line.includes('connected') || line.includes('running') || line.includes('ready') ? s.green : s.text2, whiteSpace: 'nowrap' }}>{line}</div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
