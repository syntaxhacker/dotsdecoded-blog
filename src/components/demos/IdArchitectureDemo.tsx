import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Svc {
  id: string
  dc: string
  workerId: number
  generating: boolean
  recentId: string
  color: string
}

export default function IdArchitectureDemo() {
  const [services, setServices] = useState<Svc[]>([
    { id: 'S1', dc: 'US-East', workerId: 0, generating: false, recentId: '', color: s.accent },
    { id: 'S2', dc: 'US-East', workerId: 1, generating: false, recentId: '', color: '#4d9fff' },
    { id: 'S3', dc: 'EU-West', workerId: 512, generating: false, recentId: '', color: s.green },
    { id: 'S4', dc: 'EU-West', workerId: 513, generating: false, recentId: '', color: '#3dd6a0' },
  ])

  const [zooLeader, setZooLeader] = useState('zk1')
  const [log, setLog] = useState<string[]>(['System initialized. 4 ID services registered with ZooKeeper.'])

  const genId = (svcIdx: number) => {
    setServices(prev => prev.map((svc, i) => {
      if (i !== svcIdx) return svc
      const now = Date.now() - 1288834974657
      const ts = BigInt(now) & ((1n << 41n) - 1n)
      const seq = Math.floor(Math.random() * 4096)
      const id = (ts << 22n) | (BigInt(svc.workerId) << 12n) | BigInt(seq)
      const idStr = id.toString()
      addLog(`Service ${svc.id} (DC:${svc.dc}, worker:${svc.workerId}) generated ID ${idStr}`)
      return { ...svc, generating: true, recentId: idStr }
    }))
    setTimeout(() => {
      setServices(prev => prev.map((svc, i) => i === svcIdx ? { ...svc, generating: false } : svc))
    }, 500)
  }

  const addLog = (msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 20))
  }

  const triggerZkFailover = () => {
    const old = zooLeader
    const next = zooLeader === 'zk1' ? 'zk2' : 'zk1'
    setZooLeader(next)
    addLog(`ZooKeeper leader failed over: ${old} -> ${next}`)
  }

  const registerNewService = () => {
    setServices(prev => {
      const usedWorkers = new Set(prev.map(s => s.workerId))
      let newWorker = -1
      for (let w = 0; w < 1024; w++) {
        if (!usedWorkers.has(w) && !usedWorkers.has(w + 512)) {
          newWorker = w
          break
        }
      }
      if (newWorker < 0) {
        addLog('ERROR: No available worker IDs!')
        return prev
      }
      const dc = newWorker < 512 ? 'US-East' : 'EU-West'
      const colorPool = [s.orange, s.purple, s.yellow, '#e8945a']
      const c = colorPool[prev.length % colorPool.length]
      addLog(`New service registered: worker ID ${newWorker} in ${dc}`)
      return [...prev, {
        id: `S${prev.length + 1}`, dc, workerId: newWorker,
        generating: false, recentId: '', color: c,
      }]
    })
  }

  return (
    <DemoBoundary name="ID Generation Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
        ID Generation Architecture
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Services generate IDs locally using Snowflake. ZooKeeper assigns worker IDs at startup. No single point of failure.
      </p>

      {/* ZooKeeper cluster */}
      <div style={{ background: s.bg2, borderRadius: 12, padding: 16, marginBottom: 20, border: `1px solid ${s.border}` }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={{ color: s.text, fontWeight: 700, fontSize: 14 }}>Coordination Service</span>
          <span style={{ color: s.text3, fontSize: 11, marginLeft: 8 }}>ZooKeeper / etcd</span>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[
            { id: 'zk1', label: 'ZK Leader', color: zooLeader === 'zk1' ? s.green : s.bg3 },
            { id: 'zk2', label: 'ZK Follower', color: zooLeader === 'zk2' ? s.green : s.bg3 },
            { id: 'zk3', label: 'ZK Follower', color: s.bg3 },
          ].map(zk => (
            <div key={zk.id} style={{
              background: zk.color === s.green ? `${s.green}15` : s.bg3,
              borderRadius: 8, padding: '10px 16px', textAlign: 'center',
              border: `1px solid ${zk.color === s.green ? s.green : s.border}`,
              minWidth: 90,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: zk.color, margin: '0 auto 4px',
              }} />
              <div style={{ color: s.text2, fontSize: 11, fontFamily: s.mono }}>{zk.id}</div>
              <div style={{ color: s.text3, fontSize: 9 }}>{zk.label}</div>
            </div>
          ))}
        </div>
        <button onClick={triggerZkFailover} style={{
          display: 'block', margin: '10px auto 0', background: s.yellow, border: 'none',
          borderRadius: 6, padding: '6px 14px', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600,
        }}>Trigger Leader Failover</button>
      </div>

      {/* DCs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* US-East */}
        <div style={{ flex: 1, minWidth: 280, background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, padding: 16 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: s.text, marginBottom: 12,
            paddingBottom: 8, borderBottom: `1px solid ${s.border}`,
          }}>
            US-East Datacenter
            <span style={{ color: s.text3, fontWeight: 400, marginLeft: 8, fontSize: 11 }}>
              Workers 0-511
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {services.filter(s => s.dc === 'US-East').map((svc, i) => renderService(svc, services.indexOf(svc), genId))}
          </div>
        </div>

        {/* EU-West */}
        <div style={{ flex: 1, minWidth: 280, background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, padding: 16 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: s.text, marginBottom: 12,
            paddingBottom: 8, borderBottom: `1px solid ${s.border}`,
          }}>
            EU-West Datacenter
            <span style={{ color: s.text3, fontWeight: 400, marginLeft: 8, fontSize: 11 }}>
              Workers 512-1023
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {services.filter(s => s.dc === 'EU-West').map((svc, i) => renderService(svc, services.indexOf(svc), genId))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={registerNewService} style={{
          background: s.accent, border: 'none', borderRadius: 8, padding: '8px 20px',
          color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
        }}>Register New Service</button>
        <button onClick={() => {
          services.forEach((_, i) => genId(i))
          addLog('Bulk: generated IDs on all services')
        }} style={{
          background: s.green, border: 'none', borderRadius: 8, padding: '8px 20px',
          color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
        }}>Generate All</button>
      </div>

      {/* Event log */}
      <div style={{ background: s.bg2, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Event Log
        </div>
        <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {log.map((entry, i) => (
            <div key={i} style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
              {'>'} {entry}
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}

function renderService(svc: Svc, idx: number, genId: (idx: number) => void) {
  return (
    <div key={svc.id} style={{
      background: svc.generating ? `${svc.color}15` : s.bg3,
      borderRadius: 8, padding: '10px 14px',
      border: `1px solid ${svc.generating ? svc.color : s.border}`,
      transition: 'all 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 10, height: 10, borderRadius: 4, background: svc.color,
            transition: 'opacity 0.3s', opacity: svc.generating ? 0.5 : 1,
          }} />
          <span style={{ color: s.text, fontSize: 12, fontWeight: 600 }}>{svc.id}</span>
          <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>W{svc.workerId}</span>
        </div>
        <button onClick={() => genId(idx)} style={{
          background: svc.color, border: 'none', borderRadius: 5, padding: '4px 10px',
          color: '#fff', cursor: 'pointer', fontSize: 10, fontWeight: 600,
        }}>Generate</button>
      </div>
      {svc.recentId && (
        <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono, marginTop: 4, wordBreak: 'break-all' }}>
          Last: {svc.recentId}
        </div>
      )}
    </div>
  )
}
