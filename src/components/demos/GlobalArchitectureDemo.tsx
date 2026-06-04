import { useState, useEffect, useRef } from 'react'
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

const REGIONS = [
  { id: 'us', name: 'us-central1', x: 180, y: 160, qps: 12400, p99: 38, replicas: 5, status: 'primary' },
  { id: 'eu', name: 'europe-west1', x: 380, y: 130, qps: 8900, p99: 41, replicas: 4, status: 'replica' },
  { id: 'asia', name: 'asia-northeast1', x: 620, y: 150, qps: 6700, p99: 47, replicas: 3, status: 'replica' },
]

const SERVICES = [
  { id: 'spanner', name: 'Global Spanner', x: 400, y: 240, desc: 'Metadata + event PKs', qps: 3200 },
  { id: 'pubsub', name: 'Pub/Sub Fanout', x: 260, y: 240, desc: 'Invite + notify', qps: 9800 },
  { id: 'redis', name: 'Memorystore Freebusy', x: 540, y: 240, desc: 'Per-user cache', qps: 41000 },
]

interface Particle {
  from: { x: number; y: number }
  to: { x: number; y: number }
  progress: number
  speed: number
  color: string
}

export default function GlobalArchitectureDemo() {
  const [selected, setSelected] = useState<any>(null)
  const [speed, setSpeed] = useState(1)
  const [paused, setPaused] = useState(false)
  const [failInjected, setFailInjected] = useState(false)
  const [traffic, setTraffic] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const partsRef = useRef<Particle[]>([])
  const rafRef = useRef<number | null>(null)
  const stepRef = useRef(0)

  const addLog = (m: string) => setLog(l => [...l.slice(-5), m])

  const reset = () => {
    setFailInjected(false)
    setSelected(null)
    setPaused(false)
    setTraffic(0)
    setLog([])
    partsRef.current = []
    REGIONS.forEach(r => { r.status = r.id === 'us' ? 'primary' : 'replica' })
  }

  const injectFail = () => {
    setFailInjected(true)
    addLog('FAIL: us-central1 primary down')
    REGIONS[0].status = 'down'
    REGIONS[1].status = 'primary'
    setTimeout(() => {
      addLog('FAILOVER: europe-west1 promoted')
      addLog('Traffic rerouted — eventual consistency 180ms')
      setTraffic(1)
      setTimeout(() => { setTraffic(0); setFailInjected(false) }, 2400)
    }, 900)
  }

  const draw = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d', { alpha: true })!
    ctx.clearRect(0, 0, 820, 280)

    ctx.strokeStyle = s.border
    ctx.lineWidth = 1
    REGIONS.forEach((r, i) => {
      if (i < REGIONS.length - 1) {
        ctx.beginPath()
        ctx.moveTo(r.x + 30, r.y)
        ctx.lineTo(REGIONS[i + 1].x - 30, REGIONS[i + 1].y)
        ctx.stroke()
      }
    })
    ctx.beginPath()
    ctx.moveTo(180, 160); ctx.lineTo(400, 240); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(380, 130); ctx.lineTo(400, 240); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(620, 150); ctx.lineTo(540, 240); ctx.stroke()

    const t = Date.now() / 1000
    REGIONS.forEach(r => {
      const col = r.status === 'down' ? s.red : r.status === 'primary' ? s.green : s.accent
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.arc(r.x, r.y, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = s.text
      ctx.font = '10px ' + s.mono
      ctx.fillText(r.name, r.x - 42, r.y + 32)
      ctx.fillStyle = r.status === 'down' ? s.red : s.text3
      ctx.fillText(r.status, r.x - 20, r.y + 44)
    })

    SERVICES.forEach(svc => {
      ctx.fillStyle = s.bg3
      ctx.fillRect(svc.x - 42, svc.y - 14, 84, 28)
      ctx.strokeStyle = s.border2
      ctx.strokeRect(svc.x - 42, svc.y - 14, 84, 28)
      ctx.fillStyle = s.text2
      ctx.font = '9px ' + s.mono
      ctx.fillText(svc.name, svc.x - 38, svc.y + 3)
    })

    partsRef.current = partsRef.current.filter(p => p.progress < 1)
    partsRef.current.forEach(p => {
      p.progress += p.speed * (paused ? 0 : 0.018 * (speed < 1 ? speed * 1.6 : 1 / speed))
      const x = p.from.x + (p.to.x - p.from.x) * p.progress
      const y = p.from.y + (p.to.y - p.from.y) * p.progress
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(x, y, 2.5, 0, Math.PI * 2)
      ctx.fill()
    })

    if (!paused && Math.random() < 0.6) {
      const from = REGIONS[Math.floor(Math.random() * 3)]
      const to = SERVICES[Math.floor(Math.random() * 3)]
      partsRef.current.push({
        from: { x: from.x, y: from.y },
        to: { x: to.x, y: to.y },
        progress: 0,
        speed: 0.6 + Math.random() * 0.8,
        color: Math.random() > 0.7 ? s.green : s.accent,
      })
    }

    rafRef.current = requestAnimationFrame(draw)
  }

  useEffect(() => {
    const c = canvasRef.current
    if (c) { c.width = 820; c.height = 280 }
    rafRef.current = requestAnimationFrame(draw)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [paused, speed])

  const clickRegion = (r: any) => setSelected({ ...r, kind: 'region' })
  const clickService = (svc: any) => setSelected({ ...svc, kind: 'service' })

  return (
    <DemoBoundary name="Global Architecture">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <button onClick={injectFail} disabled={failInjected} style={{ background: s.red, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>Inject us-central1 Failure</button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
          <button onClick={() => setPaused(!paused)} style={{ background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>{paused ? 'Resume' : 'Pause'} Traffic</button>
          <button onClick={reset} style={{ background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>Reset</button>
          <div style={{ flex: 1, fontSize: 10, color: s.text3, textAlign: 'right' }}>Live traffic: {traffic ? 'rerouting' : 'normal'} • {partsRef.current.length} flows</div>
        </div>

        <div style={{ position: 'relative', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, height: 280, overflow: 'hidden' }}>
          <canvas ref={canvasRef} style={{ position: 'absolute', left: 0, top: 0, width: 820, height: 280 }} />
          {REGIONS.map((r, i) => (
            <div key={i} onClick={() => clickRegion(r)} style={{ position: 'absolute', left: r.x - 18, top: r.y - 18, width: 36, height: 36, cursor: 'pointer' }} />
          ))}
          {SERVICES.map((svc, i) => (
            <div key={i} onClick={() => clickService(svc)} style={{ position: 'absolute', left: svc.x - 42, top: svc.y - 14, width: 84, height: 28, cursor: 'pointer' }} />
          ))}
        </div>

        {selected && (
          <div style={{ marginTop: 8, background: s.bg, border: `1px solid ${s.accent}`, borderRadius: 6, padding: 10, fontSize: 12 }}>
            <div style={{ color: s.accent, marginBottom: 4 }}>{selected.kind.toUpperCase()}: {selected.name || selected.id}</div>
            {selected.kind === 'region' && <>QPS: {selected.qps} • p99: {selected.p99}ms • replicas: {selected.replicas} • status: {selected.status}</>}
            {selected.kind === 'service' && <>QPS: {selected.qps} • {selected.desc}</>}
            <button onClick={() => setSelected(null)} style={{ float: 'right', background: 'transparent', color: s.text3, border: 'none', fontSize: 11, cursor: 'pointer' }}>close</button>
          </div>
        )}

        <div ref={el => { if (el) el.scrollTop = el.scrollHeight }} style={{ marginTop: 8, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: 8, height: 68, overflowY: 'auto', fontFamily: s.mono, fontSize: 10, color: s.text2 }}>
          {log.length === 0 && <div style={{ color: s.text3 }}>Event log will show failover + traffic reroute here.</div>}
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>

        <div style={{ marginTop: 8, fontSize: 10, color: s.text3 }}>Planet-scale calendar: writes always go to nearest primary (strong consistency inside region). Reads hit regional cache or Memorystore. Spanner holds global metadata. Pub/Sub fans out invites. Failover promotes a replica; clients see 100-300ms eventual window while cross-region replication catches up.</div>
      </div>
    </DemoBoundary>
  )
}
