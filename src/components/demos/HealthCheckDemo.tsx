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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

type ServerState = 'healthy' | 'unhealthy' | 'unknown'
type CheckState = 'idle' | 'checking' | 'passed' | 'failed'

const serverNames = ['Server A', 'Server B', 'Server C', 'Server D']
const serverColors = [s.accent, s.green, s.orange, s.purple]

interface Server {
  name: string
  state: ServerState
  checkState: CheckState
  consecutiveFails: number
  requests: number
}

interface LogEntry {
  time: number
  msg: string
  color: string
}

export default function HealthCheckDemo() {
  const [servers, setServers] = useState<Server[]>(() =>
    serverNames.map(name => ({ name, state: 'healthy', checkState: 'idle', consecutiveFails: 0, requests: 0 }))
  )
  const [log, setLog] = useState<LogEntry[]>([])
  const [autoSend, setAutoSend] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [tick, setTick] = useState(0)

  const addLog = useCallback((msg: string, color: string) => {
    setLog(prev => [...prev.slice(-30), { time: Date.now(), msg, color }])
  }, [])

  useEffect(() => {
    if (!autoSend) return
    const healthyServers = servers.filter(sv => sv.state === 'healthy')
    if (healthyServers.length === 0) {
      addLog('No healthy servers available! All requests dropped.', s.red)
      return
    }
    const target = healthyServers[Math.floor(Math.random() * healthyServers.length)]
    const idx = servers.findIndex(sv => sv.name === target.name)
    setServers(prev => prev.map((sv, i) => i === idx ? { ...sv, requests: sv.requests + 1 } : sv))
  }, [autoSend, tick])

  useEffect(() => {
    if (!autoSend) return
    const t = setInterval(() => setTick(prev => prev + 1), getStepDelay(600, speed))
    return () => clearInterval(t)
  }, [autoSend, speed])

  useEffect(() => {
    const interval = setInterval(() => {
      setServers(prev => prev.map((sv, i) => {
        if (sv.state === 'unhealthy') {
          setServers(p => p.map((ss, j) => j === i ? { ...ss, checkState: 'checking' } : ss))
          setTimeout(() => {
            setServers(p => p.map((ss, j) => {
              if (j !== i) return ss
              return { ...ss, checkState: 'failed', consecutiveFails: ss.consecutiveFails + 1 }
            }))
            addLog(`Health check FAILED for ${sv.name} (consecutive: ${sv.consecutiveFails + 1})`, s.red)
          }, 500)
          return sv
        }
        setServers(p => p.map((ss, j) => j === i ? { ...ss, checkState: 'checking' } : ss))
        setTimeout(() => {
          setServers(p => p.map((ss, j) => {
            if (j !== i) return ss
            return { ...ss, checkState: 'passed', consecutiveFails: 0 }
          }))
        }, 300)
        return sv
      }))
    }, getStepDelay(3000, speed))
    return () => clearInterval(interval)
  }, [speed])

  const killServer = (idx: number) => {
    setServers(prev => prev.map((sv, i) => i === idx ? { ...sv, state: 'unhealthy', checkState: 'idle', consecutiveFails: 0 } : sv))
    addLog(`${servers[idx].name} went DOWN -- removed from pool`, s.red)
  }

  const reviveServer = (idx: number) => {
    setServers(prev => prev.map((sv, i) => i === idx ? { ...sv, state: 'healthy', checkState: 'idle', consecutiveFails: 0, requests: 0 } : sv))
    addLog(`${servers[idx].name} revived -- added back to pool`, s.green)
  }

  const reset = () => {
    setServers(serverNames.map(name => ({ name, state: 'healthy', checkState: 'idle', consecutiveFails: 0, requests: 0 })))
    setLog([])
    setAutoSend(false)
    setTick(0)
  }

  const statusColor = (state: ServerState, check: CheckState) => {
    if (check === 'checking') return s.yellow
    if (check === 'failed') return s.red
    if (check === 'passed') return s.green
    return state === 'healthy' ? s.green : s.red
  }

  const statusLabel = (state: ServerState, check: CheckState) => {
    if (check === 'checking') return 'CHECKING'
    if (check === 'failed') return 'FAILED'
    if (check === 'passed') return 'PASSED'
    return state === 'healthy' ? 'HEALTHY' : 'DOWN'
  }

  return (
    <DemoBoundary name="Health Checks & Failover">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Health Checks & Failover</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Click "Kill" to take a server offline. Watch the health checker detect the failure and stop sending traffic there. Click "Revive" to bring it back.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setAutoSend(!autoSend)} style={{
            background: autoSend ? s.orange : s.accent, border: 'none', borderRadius: 8, padding: '8px 18px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>{autoSend ? 'Stop Traffic' : 'Start Traffic'}</button>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 18px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <div style={{ flex: 1 }} />
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {servers.map((sv, i) => (
            <div key={sv.name} style={{
              flex: 1, background: s.bg3, borderRadius: 10, padding: 14, border: `1px solid ${sv.state === 'unhealthy' ? s.red : s.border}`,
              transition: 'all 0.3s', opacity: sv.state === 'unhealthy' ? 0.7 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: serverColors[i], fontSize: 13, fontWeight: 600 }}>{sv.name}</span>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: statusColor(sv.state, sv.checkState), fontSize: 10, fontWeight: 700,
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', background: statusColor(sv.state, sv.checkState),
                    animation: sv.checkState === 'checking' ? 'pulse 0.5s infinite' : 'none',
                  }} />
                  {statusLabel(sv.state, sv.checkState)}
                </div>
              </div>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>
                Requests handled: <span style={{ color: s.text2, fontFamily: s.mono }}>{sv.requests}</span>
              </div>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 10 }}>
                Pool: <span style={{ color: sv.state === 'healthy' ? s.green : s.red, fontWeight: 600 }}>
                  {sv.state === 'healthy' ? 'ACTIVE' : 'REMOVED'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => killServer(i)} disabled={sv.state === 'unhealthy'} style={{
                  flex: 1, background: sv.state === 'unhealthy' ? s.bg : s.red + '20', border: `1px solid ${sv.state === 'unhealthy' ? s.border : s.red}`,
                  borderRadius: 6, padding: '4px 8px', color: sv.state === 'unhealthy' ? s.text3 : s.red,
                  cursor: sv.state === 'unhealthy' ? 'default' : 'pointer', fontSize: 10, fontWeight: 600,
                }}>Kill</button>
                <button onClick={() => reviveServer(i)} disabled={sv.state === 'healthy'} style={{
                  flex: 1, background: sv.state === 'healthy' ? s.bg : s.green + '20', border: `1px solid ${sv.state === 'healthy' ? s.border : s.green}`,
                  borderRadius: 6, padding: '4px 8px', color: sv.state === 'healthy' ? s.text3 : s.green,
                  cursor: sv.state === 'healthy' ? 'default' : 'pointer', fontSize: 10, fontWeight: 600,
                }}>Revive</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: s.bg3, borderRadius: 8, padding: 12, maxHeight: 160, overflowY: 'auto' }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Event Log</div>
          {log.length === 0 && <div style={{ color: s.text3, fontSize: 12, textAlign: 'center' }}>Start traffic and kill a server to see events</div>}
          {log.slice().reverse().map((entry, i) => (
            <div key={i} style={{ color: entry.color, fontSize: 11, fontFamily: s.mono, padding: '2px 0' }}>
              {entry.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
