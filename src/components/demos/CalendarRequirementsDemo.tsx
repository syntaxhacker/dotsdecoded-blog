import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

export default function CalendarRequirementsDemo() {
  const [usersM, setUsersM] = useState(1200)
  const [eventsPerUser, setEventsPerUser] = useState(4.2)
  const [regions, setRegions] = useState(5)
  const [isPeaking, setIsPeaking] = useState(false)
  const [peakT, setPeakT] = useState(0)
  const [showTable, setShowTable] = useState(false)

  const metrics = useMemo(() => {
    const uMul = isPeaking ? 1 + Math.sin(peakT * Math.PI) * 1.8 : 1
    const eMul = isPeaking ? 3.2 : 1
    const u = usersM * uMul
    const e = eventsPerUser * eMul
    const dau = Math.floor(u * 1e6 * 0.62)
    const eps = Math.floor((u * 1e6 * e) / 86400)
    const storageTB = Number(((eps * 86400 * 1650) / 1e12).toFixed(1))
    const p99 = Math.max(45, Math.floor(78 + regions * 11 + (eps / 42000) * 18))
    const writeQps = eps
    const readQps = Math.floor(eps * 17.4 + regions * 1200)
    const hotPct = Math.min(92, 68 + Math.floor(e * 2.1))
    const coldPct = 100 - hotPct
    const viewQps = Math.floor(eps * 4.1)
    const remindQps = Math.floor(eps * 2.8)
    return { dau, eps, storageTB, p99, writeQps, readQps, hotPct, coldPct, uMul, eMul, viewQps, remindQps }
  }, [usersM, eventsPerUser, regions, isPeaking, peakT])

  const startPeak = () => {
    if (isPeaking) return
    setIsPeaking(true)
    setPeakT(0)
    const start = performance.now()
    const dur = 2100
    const step = (now: number) => {
      const t = Math.min((now - start) / dur, 1)
      setPeakT(t)
      if (t < 1) requestAnimationFrame(step)
      else {
        setIsPeaking(false)
        setPeakT(0)
      }
    }
    requestAnimationFrame(step)
  }

  const slider = (label: string, val: number, min: number, max: number, step: number, fmt: (n: number) => string, on: (v: number) => void) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: s.text2, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontFamily: s.mono, color: s.accent }}>{fmt(val)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={e => on(Number(e.target.value))} style={{ width: '100%', accentColor: s.accent }} />
    </div>
  )

  const fmtM = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1) + 'B' : n.toFixed(0) + 'M')
  const fmtK = (n: number) => n.toLocaleString()
  const fmtTB = (n: number) => n.toFixed(1) + ' TB'
  const fmtMs = (n: number) => n + ' ms'

  const presets = [
    { label: 'Typical', u: 1200, e: 4.2, r: 5 },
    { label: 'Peak', u: 1800, e: 7.1, r: 8 },
    { label: 'Holiday', u: 950, e: 2.8, r: 4 },
    { label: 'Launch', u: 2100, e: 9.4, r: 9 },
  ]

  return (
    <DemoBoundary name="Calendar Requirements">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: s.text }}>Live workload at planetary scale</div>
          <button onClick={startPeak} disabled={isPeaking} style={{ background: isPeaking ? s.bg3 : s.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: isPeaking ? 'default' : 'pointer', transition: 'all 0.2s' }}>
            {isPeaking ? 'SPIKING 3.2x...' : 'Simulate Peak Day'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
          <div style={{ background: s.bg, borderRadius: 8, padding: '12px 14px', border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 10, color: s.text3, letterSpacing: 0.5 }}>DAILY ACTIVE USERS</div>
            <div style={{ fontFamily: s.mono, fontSize: 22, fontWeight: 700, color: s.accent, marginTop: 2 }}>{(metrics.dau / 1e6).toFixed(1)}M</div>
            <div style={{ fontSize: 10, color: s.text3 }}>from {fmtM(usersM)} users</div>
          </div>
          <div style={{ background: s.bg, borderRadius: 8, padding: '12px 14px', border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 10, color: s.text3, letterSpacing: 0.5 }}>EVENTS CREATED / SEC</div>
            <div style={{ fontFamily: s.mono, fontSize: 22, fontWeight: 700, color: s.green, marginTop: 2 }}>{fmtK(metrics.eps)}</div>
            <div style={{ fontSize: 10, color: s.text3 }}>x{metrics.eMul.toFixed(1)} during peak</div>
          </div>
          <div style={{ background: s.bg, borderRadius: 8, padding: '12px 14px', border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 10, color: s.text3, letterSpacing: 0.5 }}>STORAGE TB / DAY</div>
            <div style={{ fontFamily: s.mono, fontSize: 22, fontWeight: 700, color: s.orange, marginTop: 2 }}>{metrics.storageTB}</div>
            <div style={{ fontSize: 10, color: s.text3 }}>1.65 KB avg event</div>
          </div>
          <div style={{ background: s.bg, borderRadius: 8, padding: '12px 14px', border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 10, color: s.text3, letterSpacing: 0.5 }}>P99 LATENCY</div>
            <div style={{ fontFamily: s.mono, fontSize: 22, fontWeight: 700, color: metrics.p99 > 140 ? s.red : s.yellow, marginTop: 2 }}>{metrics.p99} ms</div>
            <div style={{ fontSize: 10, color: s.text3 }}>{regions} regions active</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: s.bg, borderRadius: 8, padding: 14, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 12, color: s.text2, marginBottom: 8, fontWeight: 600 }}>QPS MIX (READ VS WRITE)</div>
            <svg width="100%" height="92" viewBox="0 0 320 92" style={{ display: 'block' }}>
              <rect x="0" y="12" width={Math.min(260, (metrics.readQps / 520000) * 260)} height="26" rx="3" fill={s.accent} />
              <text x="270" y="30" fill={s.text} fontSize="12" fontFamily={s.mono}>{fmtK(metrics.readQps)}</text>
              <text x="8" y="30" fill={s.bg2} fontSize="11" fontFamily={s.mono}>READ</text>
              <rect x="0" y="52" width={Math.min(260, (metrics.writeQps / 520000) * 260)} height="26" rx="3" fill={s.green} />
              <text x="270" y="70" fill={s.text} fontSize="12" fontFamily={s.mono}>{fmtK(metrics.writeQps)}</text>
              <text x="8" y="70" fill={s.bg2} fontSize="11" fontFamily={s.mono}>WRITE</text>
            </svg>
          </div>
          <div style={{ background: s.bg, borderRadius: 8, padding: 14, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 12, color: s.text2, marginBottom: 8, fontWeight: 600 }}>STORAGE: HOT VS COLD</div>
            <svg width="100%" height="92" viewBox="0 0 320 92" style={{ display: 'block' }}>
              <rect x="0" y="18" width={(metrics.hotPct / 100) * 280} height="28" rx="3" fill={s.orange} />
              <text x="8" y="37" fill={s.bg} fontSize="11" fontFamily={s.mono}>HOT {metrics.hotPct}%</text>
              <rect x="0" y="54" width={(metrics.coldPct / 100) * 280} height="28" rx="3" fill={s.purple} />
              <text x="8" y="73" fill={s.text} fontSize="11" fontFamily={s.mono}>COLD {metrics.coldPct}%</text>
            </svg>
          </div>
        </div>

        <div style={{ background: s.bg, borderRadius: 8, padding: 14, border: `1px solid ${s.border}`, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: s.text2, marginBottom: 10, fontWeight: 600 }}>ADJUST PARAMETERS</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {presets.map((p, i) => (
              <button key={i} onClick={() => { setUsersM(p.u); setEventsPerUser(p.e); setRegions(p.r) }} style={{ background: s.bg3, border: `1px solid ${s.border}`, color: s.text2, borderRadius: 4, padding: '4px 9px', fontSize: 11, cursor: 'pointer' }}>{p.label}</button>
            ))}
            <button onClick={() => setShowTable(!showTable)} style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${s.border2}`, color: s.text3, borderRadius: 4, padding: '4px 9px', fontSize: 11, cursor: 'pointer' }}>{showTable ? 'Hide' : 'Show'} QPS table</button>
          </div>
          {slider('Users (millions)', usersM, 200, 2200, 50, fmtM, setUsersM)}
          {slider('Events per user per day', eventsPerUser, 0.8, 11, 0.2, n => n.toFixed(1), setEventsPerUser)}
          {slider('Active regions', regions, 1, 12, 1, n => n.toFixed(0), setRegions)}
        </div>

        {showTable && (
          <div style={{ background: s.bg, borderRadius: 6, padding: 10, border: `1px solid ${s.border}`, marginBottom: 10, fontSize: 11 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, fontFamily: s.mono }}>
              <div style={{ color: s.text3 }}>READ QPS</div><div>{fmtK(metrics.readQps)}</div>
              <div style={{ color: s.text3 }}>WRITE QPS</div><div>{fmtK(metrics.writeQps)}</div>
              <div style={{ color: s.text3 }}>VIEW RENDERS</div><div>{fmtK(metrics.viewQps)}</div>
              <div style={{ color: s.text3 }}>REMINDERS</div><div>{fmtK(metrics.remindQps)}</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: s.text3, lineHeight: 1.45 }}>
          DAU drives read QPS. Events/sec drives write + storage. More regions lower p99 but increase cross-region replication. Peak Day multiplies load 3x for 2 seconds to show headroom needed for 99.99% SLA.
        </div>
      </div>
    </DemoBoundary>
  )
}
