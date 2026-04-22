import { useState, useEffect } from 'react'
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

type Strategy = 'rolling' | 'blue-green' | 'canary'
type ServerState = 'v1' | 'v2' | 'updating' | 'standby' | 'draining'

interface Server {
  name: string
  version: ServerState
  traffic: number
  health: 'healthy' | 'unhealthy' | 'unknown'
}

const strategies = [
  { id: 'rolling' as Strategy, name: 'Rolling', desc: 'Replace servers one by one. Zero downtime but mixed versions during rollout.' },
  { id: 'blue-green' as Strategy, name: 'Blue-Green', desc: 'Spin up full v2 environment, then switch all traffic at once.' },
  { id: 'canary' as Strategy, name: 'Canary', desc: 'Send small % of traffic to v2, gradually increase.' },
]

function initServers(): Server[] {
  return [
    { name: 'Server 1', version: 'v1', traffic: 25, health: 'healthy' },
    { name: 'Server 2', version: 'v1', traffic: 25, health: 'healthy' },
    { name: 'Server 3', version: 'v1', traffic: 25, health: 'healthy' },
    { name: 'Server 4', version: 'v1', traffic: 25, health: 'healthy' },
  ]
}

export default function DeployStrategyDemo() {
  const [strategy, setStrategy] = useState<Strategy>('rolling')
  const [servers, setServers] = useState<Server[]>(initServers())
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [log, setLog] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [rolledBack, setRolledBack] = useState(false)
  const [simulateFail, setSimulateFail] = useState(false)

  const totalSteps = strategy === 'rolling' ? 8 : strategy === 'blue-green' ? 6 : 7

  useEffect(() => {
    if (!running || step >= totalSteps) {
      if (step >= totalSteps && !rolledBack) {
        setRunning(false)
        setDone(true)
      }
      return
    }

    const t = setTimeout(() => {
      setStep(prev => prev + 1)
    }, getStepDelay(800, speed))

    return () => clearTimeout(t)
  }, [running, step, speed, totalSteps, rolledBack])

  useEffect(() => {
    if (!running && step === 0) return

    const fail = simulateFail

    if (strategy === 'rolling') {
      setServers(prev => {
        const next = prev.map(s => ({ ...s }))
        const serverIdx = Math.floor(step / 2)
        const phase = step % 2

        if (fail && step === 4 && serverIdx === 2) {
          next[serverIdx] = { ...next[serverIdx], version: 'v2', health: 'unhealthy' }
          setLog(l => [...l, `ERROR: ${next[serverIdx].name} health check failed!`])
          setRunning(false)
          setDone(true)
          return next
        }

        if (serverIdx < 4) {
          if (phase === 0) {
            next[serverIdx] = { ...next[serverIdx], version: 'updating', traffic: 0 }
            setLog(l => [...l, `Updating ${next[serverIdx].name} to v2...`])
          } else {
            next[serverIdx] = { ...next[serverIdx], version: 'v2', traffic: 25, health: 'healthy' }
            setLog(l => [...l, `${next[serverIdx].name} now running v2, receiving traffic`])
          }
        }
        return next
      })
    } else if (strategy === 'blue-green') {
      setServers(prev => {
        const next = prev.map(s => ({ ...s }))

        if (fail && step === 4) {
          setLog(l => [...l, 'ERROR: v2 health checks failing on green environment!'])
          setRunning(false)
          setDone(true)
          return next
        }

        if (step < 4) {
          next.forEach((srv, i) => {
            if (i === 0) {
              srv.version = 'v2'
              srv.health = 'healthy'
            } else if (step >= i) {
              srv.version = 'v2'
              srv.health = 'healthy'
            }
          })
          if (step === 0) setLog(l => [...l, 'Spinning up green environment (v2)...'])
          if (step === 1) setLog(l => [...l, 'Green: Server 1, 2 ready'])
          if (step === 2) setLog(l => [...l, 'Green: Server 3, 4 ready'])
          if (step === 3) setLog(l => [...l, 'Running smoke tests on green environment...'])
        } else if (step === 4) {
          next.forEach(srv => {
            if (srv.version === 'v1') srv.traffic = 0
            else srv.traffic = 25
          })
          setLog(l => [...l, 'Switching traffic: blue (v1) -> green (v2)'])
        } else {
          next.forEach(srv => {
            if (srv.version === 'v1') srv.version = 'standby'
            srv.traffic = srv.version === 'v2' ? 25 : 0
          })
          setLog(l => [...l, 'Blue environment on standby. All traffic on green (v2).'])
        }
        return next
      })
    } else {
      setServers(prev => {
        const next = prev.map(s => ({ ...s }))

        if (fail && step === 4) {
          next[0] = { ...next[0], health: 'unhealthy' }
          setLog(l => [...l, 'ERROR: Canary (Server 1) error rate spike detected!'])
          setRunning(false)
          setDone(true)
          return next
        }

        if (step === 0) {
          next[0] = { ...next[0], version: 'v2', traffic: 10, health: 'healthy' }
          next[1] = { ...next[1], traffic: 30 }
          next[2] = { ...next[2], traffic: 30 }
          next[3] = { ...next[3], traffic: 30 }
          setLog(l => [...l, 'Canary: Server 1 updated to v2, receiving 10% traffic'])
        } else if (step === 1) {
          setLog(l => [...l, 'Monitoring canary metrics... (error rate: 0.2%, latency: 85ms)'])
        } else if (step === 2) {
          next[0] = { ...next[0], traffic: 25 }
          next[1] = { ...next[1], version: 'v2', traffic: 25, health: 'healthy' }
          next[2] = { ...next[2], traffic: 25 }
          next[3] = { ...next[3], traffic: 25 }
          setLog(l => [...l, 'Canary stable. Server 2 updated to v2. Each at 25%'])
        } else if (step === 3) {
          next[2] = { ...next[2], version: 'v2', traffic: 25, health: 'healthy' }
          setLog(l => [...l, 'Server 3 updated to v2. 75% on v2.'])
        } else if (step === 4) {
          next[3] = { ...next[3], version: 'v2', traffic: 25, health: 'healthy' }
          setLog(l => [...l, 'Server 4 updated to v2. Full rollout complete.'])
        } else if (step === 5) {
          setLog(l => [...l, 'All servers on v2. Canary release successful.'])
        } else {
          setLog(l => [...l, 'Cleaning up old v2 images...'])
        }
        return next
      })
    }
  }, [step, strategy, simulateFail, running])

  const startDeploy = (fail = false) => {
    setServers(initServers())
    setStep(0)
    setRunning(true)
    setDone(false)
    setRolledBack(false)
    setLog([`Starting ${strategy === 'blue-green' ? 'blue-green' : strategy} deployment${fail ? ' (will simulate failure)' : ''}`])
    setSimulateFail(fail)
  }

  const rollback = () => {
    setServers(initServers())
    setRunning(false)
    setDone(false)
    setRolledBack(true)
    setLog(l => [...l, 'ROLLBACK: All servers reverted to v1'])
  }

  const versionColor = (v: ServerState) => {
    switch (v) {
      case 'v1': return s.accent
      case 'v2': return s.green
      case 'updating': return s.yellow
      case 'standby': return s.text3
      case 'draining': return s.orange
    }
  }

  const versionLabel = (v: ServerState) => {
    switch (v) {
      case 'v1': return 'v1.4.2'
      case 'v2': return 'v2.0.0'
      case 'updating': return 'updating...'
      case 'standby': return 'standby'
      case 'draining': return 'draining'
    }
  }

  return (
    <DemoBoundary name="Deployment Strategies">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Deployment Strategies</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Four servers, three strategies. Watch how traffic shifts during each deployment approach.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {strategies.map(str => (
            <button key={str.id} onClick={() => { setStrategy(str.id); setServers(initServers()); setStep(0); setRunning(false); setDone(false); setLog([]); setRolledBack(false) }} style={{
              background: strategy === str.id ? s.accent : s.bg3,
              border: `1px solid ${strategy === str.id ? s.accent : s.border}`,
              borderRadius: 8, padding: '8px 16px', color: strategy === str.id ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
            }}>{str.name}</button>
          ))}
          <div style={{ flex: 1 }} />
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ color: s.text3, fontSize: 12, marginBottom: 16 }}>{strategies.find(st => st.id === strategy)?.desc}</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {!running && !done && (
            <>
              <button onClick={() => startDeploy(false)} style={{
                background: s.green, border: 'none', borderRadius: 8, padding: '8px 20px',
                color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Deploy v2.0.0</button>
              <button onClick={() => startDeploy(true)} style={{
                background: s.red + '20', border: `1px solid ${s.red}`, borderRadius: 8, padding: '8px 20px',
                color: s.red, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Deploy (simulate failure)</button>
            </>
          )}
          {done && (
            <>
              <button onClick={rollback} style={{
                background: s.orange, border: 'none', borderRadius: 8, padding: '8px 20px',
                color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Rollback to v1</button>
              <button onClick={() => { setServers(initServers()); setStep(0); setRunning(false); setDone(false); setLog([]); setRolledBack(false) }} style={{
                background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 20px',
                color: s.text2, cursor: 'pointer', fontSize: 13,
              }}>Reset</button>
            </>
          )}
          {rolledBack && (
            <div style={{ background: s.orange + '10', border: `1px solid ${s.orange}40`, borderRadius: 8, padding: '6px 14px', color: s.orange, fontSize: 12 }}>
              Rolled back successfully
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {servers.map(srv => (
            <div key={srv.name} style={{
              background: s.bg3, borderRadius: 10, padding: 14, textAlign: 'center',
              border: `1px solid ${srv.health === 'unhealthy' ? s.red : srv.version === 'v2' ? s.green + '40' : s.border}`,
              transition: 'all 0.3s',
            }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 6 }}>{srv.name}</div>
              <div style={{
                color: versionColor(srv.version), fontSize: 14, fontWeight: 700, fontFamily: s.mono, marginBottom: 8,
              }}>{versionLabel(srv.version)}</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ width: '100%', height: 6, background: s.bg, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${srv.traffic}%`, height: '100%',
                    background: srv.version === 'v2' ? s.green : srv.version === 'updating' ? s.yellow : s.accent,
                    borderRadius: 3, transition: 'all 0.3s',
                  }} />
                </div>
              </div>
              <div style={{ color: s.text2, fontSize: 12, fontFamily: s.mono }}>{srv.traffic}% traffic</div>
              <div style={{
                marginTop: 6, fontSize: 10, fontWeight: 600,
                color: srv.health === 'healthy' ? s.green : srv.health === 'unhealthy' ? s.red : s.text3,
              }}>
                {srv.health === 'healthy' ? 'Healthy' : srv.health === 'unhealthy' ? 'Unhealthy' : 'Unknown'}
              </div>
            </div>
          ))}
        </div>

        {strategy === 'blue-green' && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.accent }} />
              <span style={{ color: s.text2, fontSize: 12 }}>Blue (v1)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.green }} />
              <span style={{ color: s.text2, fontSize: 12 }}>Green (v2)</span>
            </div>
          </div>
        )}

        {log.length > 0 && (
          <div style={{ background: s.bg, borderRadius: 8, padding: 12, maxHeight: 130, overflowY: 'auto', border: `1px solid ${s.border}` }}>
            {log.map((entry, i) => (
              <div key={i} style={{
                fontFamily: s.mono, fontSize: 11, lineHeight: 1.6, color: entry.includes('ERROR') ? s.red : entry.includes('ROLLBACK') ? s.orange : s.text3,
              }}>{entry}</div>
            ))}
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
