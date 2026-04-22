import { useState, useEffect } from 'react'
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

interface Service {
  id: string
  label: string
  color: string
  healthy: boolean
  instances: string[]
}

const initialServices: Service[] = [
  { id: 'payment', label: 'Payment Service', color: s.green, healthy: true, instances: ['10.0.1.1:8080', '10.0.1.2:8080'] },
  { id: 'order', label: 'Order Service', color: s.accent, healthy: true, instances: ['10.0.2.1:8080', '10.0.2.2:8080', '10.0.2.3:8080'] },
  { id: 'user', label: 'User Service', color: s.orange, healthy: true, instances: ['10.0.3.1:8080'] },
  { id: 'inventory', label: 'Inventory Service', color: s.purple, healthy: true, instances: ['10.0.4.1:8080', '10.0.4.2:8080'] },
]

export default function ServiceDiscoveryDemo() {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [discoveryMode, setDiscoveryMode] = useState<'client' | 'server'>('client')
  const [lookupTarget, setLookupTarget] = useState('payment')
  const [lookupResult, setLookupResult] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [heartbeatActive, setHeartbeatActive] = useState(true)

  useEffect(() => {
    if (!heartbeatActive) return
    const interval = setInterval(() => {
      const t = new Date().toLocaleTimeString('en-US', { hour12: false })
      setLog(prev => [...prev.slice(-8), `${t} heartbeat from all healthy services`])
    }, 3000)
    return () => clearInterval(interval)
  }, [heartbeatActive])

  const lookupService = () => {
    const target = services.find(sv => sv.id === lookupTarget)
    if (!target) return

    const t = new Date().toLocaleTimeString('en-US', { hour12: false })
    const modeLabel = discoveryMode === 'client' ? 'Client' : 'Load Balancer'

    setLog(prev => [...prev.slice(-8), `${t} ${modeLabel} queries registry for "${target.label}"`])

    setTimeout(() => {
      if (target.healthy) {
        const result = discoveryMode === 'client'
          ? `Client receives instance list: [${target.instances.join(', ')}] and picks one`
          : `LB receives instance list: [${target.instances.join(', ')}] and routes to ${target.instances[0]}`
        setLookupResult(result)
        setLog(prev => [...prev.slice(-8), `${t} Registry returns: ${target.instances.join(', ')}`])
        setLog(prev => [...prev.slice(-8), `${t} ${result}`])
      } else {
        setLookupResult(`No healthy instances available for ${target.label}`)
        setLog(prev => [...prev.slice(-8), `${t} Registry returns: EMPTY (service unhealthy)`])
      }
    }, 500)
  }

  const toggleServiceHealth = (id: string) => {
    setServices(prev => prev.map(sv => {
      if (sv.id !== id) return sv
      const t = new Date().toLocaleTimeString('en-US', { hour12: false })
      setLog(prev => [...prev.slice(-8), `${t} ${sv.label} marked as ${sv.healthy ? 'UNHEALTHY' : 'HEALTHY'} — registry updated`])
      return { ...sv, healthy: !sv.healthy }
    }))
    setLookupResult(null)
  }

  return (
    <DemoBoundary name="Service Discovery">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Service Discovery</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Services register with a central registry. Clients query it to find healthy instances. Toggle service health and watch the registry update.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setDiscoveryMode('client')} style={modeBtn(discoveryMode === 'client', s.accent)}>Client-Side Discovery</button>
          <button onClick={() => setDiscoveryMode('server')} style={modeBtn(discoveryMode === 'server', s.purple)}>Server-Side Discovery</button>
          <button onClick={() => setHeartbeatActive(prev => !prev)} style={modeBtn(heartbeatActive, s.green)}>
            Heartbeats: {heartbeatActive ? 'ON' : 'OFF'}
          </button>
        </div>

        <div style={{ background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Service Registry</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {services.map(sv => (
              <div key={sv.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: s.bg, borderRadius: 8,
                border: `1px solid ${sv.healthy ? `${sv.color}30` : s.red}`,
                transition: 'all 0.3s',
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: sv.healthy ? sv.color : s.red }} />
                <span style={{ color: sv.healthy ? s.text : s.red, fontSize: 12, fontWeight: 600, flex: 1 }}>{sv.label}</span>
                <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>
                  {sv.healthy ? sv.instances.length : 0} instance{sv.instances.length !== 1 ? 's' : ''}
                </span>
                <button onClick={() => toggleServiceHealth(sv.id)} style={{
                  background: sv.healthy ? `${s.red}15` : `${s.green}15`,
                  border: `1px solid ${sv.healthy ? s.red : s.green}`,
                  borderRadius: 6, padding: '4px 10px', color: sv.healthy ? s.red : s.green,
                  cursor: 'pointer', fontSize: 11, fontWeight: 600,
                }}>
                  {sv.healthy ? 'Take Down' : 'Restore'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <span style={{ color: s.text3, fontSize: 12 }}>Lookup:</span>
          <select value={lookupTarget} onChange={e => setLookupTarget(e.target.value)} style={selectStyle()}>
            {services.map(sv => <option key={sv.id} value={sv.id}>{sv.label}</option>)}
          </select>
          <button onClick={lookupService} style={{
            background: `${s.accent}18`, border: `1px solid ${s.accent}`, borderRadius: 8,
            padding: '8px 16px', color: s.accent, cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            Query Registry
          </button>
        </div>

        {lookupResult && (
          <div style={{ background: s.bg, borderRadius: 8, padding: 12, marginBottom: 16, fontFamily: s.mono, fontSize: 11, color: s.text2, lineHeight: 1.6, border: `1px solid ${s.border}` }}>
            {lookupResult}
          </div>
        )}

        <div style={{ background: s.bg, borderRadius: 8, padding: 12, maxHeight: 140, overflowY: 'auto' }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Event Log</div>
          {log.length === 0 && <div style={{ color: s.text3, fontSize: 11 }}>No events yet. Query the registry or toggle a service.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {log.map((entry, idx) => (
              <div key={idx} style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, lineHeight: 1.5 }}>
                {entry}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )

  function modeBtn(active: boolean, color: string): React.CSSProperties {
    return { background: active ? `${color}18` : s.bg3, border: `1px solid ${active ? color : s.border}`, borderRadius: 8, padding: '8px 14px', color: active ? color : s.text3, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }
  }

  function selectStyle(): React.CSSProperties {
    return { background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 10px', color: s.text2, fontFamily: s.mono, fontSize: 12, cursor: 'pointer' }
  }
}
