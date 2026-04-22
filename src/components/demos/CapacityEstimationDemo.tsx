import { useState, useMemo } from 'react'
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

const presets = [
  { name: 'Twitter', users: 500000000, dau: 100000000, rpu: 30, avgSize: 280 },
  { name: 'Instagram', users: 2000000000, dau: 500000000, rpu: 5, avgSize: 1500 },
  { name: 'YouTube', users: 2500000000, dau: 122000000, rpu: 10, avgSize: 50000000 },
  { name: 'Custom', users: 1000000, dau: 100000, rpu: 10, avgSize: 1000 },
]

function fmt(n: number): string {
  if (n >= 1e15) return (n / 1e15).toFixed(1) + ' PB'
  if (n >= 1e12) return (n / 1e12).toFixed(1) + ' TB'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' GB'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' MB'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + ' KB'
  return n.toFixed(0) + ' B'
}

function fmtShort(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(0)
}

export default function CapacityEstimationDemo() {
  const [presetIdx, setPresetIdx] = useState(0)
  const preset = presets[presetIdx]
  const [totalUsers, setTotalUsers] = useState(preset.users)
  const [dau, setDau] = useState(preset.dau)
  const [rpu, setRpu] = useState(preset.rpu)
  const [avgSize, setAvgSize] = useState(preset.avgSize)

  const selectPreset = (idx: number) => {
    setPresetIdx(idx)
    const p = presets[idx]
    setTotalUsers(p.users)
    setDau(p.dau)
    setRpu(p.rpu)
    setAvgSize(p.avgSize)
  }

  const peakMultiplier = 2
  const qps = useMemo(() => Math.ceil((dau * rpu) / 86400), [dau, rpu])
  const peakQps = useMemo(() => Math.ceil(qps * peakMultiplier), [qps])
  const storagePerDay = useMemo(() => dau * rpu * avgSize, [dau, rpu, avgSize])
  const storagePerYear = useMemo(() => storagePerDay * 365, [storagePerDay])
  const bandwidth = useMemo(() => (qps * avgSize * 8) / (1024 * 1024), [qps, avgSize])

  const steps = useMemo(() => [
    { label: 'Requests per second', calc: `${fmtShort(dau)} DAU x ${rpu} req/day / 86400s`, result: `${fmtShort(qps)} req/s` },
    { label: 'Peak QPS (2x)', calc: `${fmtShort(qps)} x ${peakMultiplier}`, result: `${fmtShort(peakQps)} req/s` },
    { label: 'Storage per day', calc: `${fmtShort(dau)} DAU x ${rpu} req x ${fmt(avgSize)}/req`, result: fmt(storagePerDay) },
    { label: 'Storage per year', calc: `${fmt(storagePerDay)} x 365 days`, result: fmt(storagePerYear) },
    { label: 'Bandwidth (ingress)', calc: `${fmtShort(qps)} req/s x ${fmt(avgSize)} x 8 bits`, result: `${bandwidth.toFixed(1)} Mbps` },
  ], [dau, rpu, avgSize, qps, peakQps, storagePerDay, storagePerYear, bandwidth])

  return (
    <DemoBoundary name="Capacity Estimation">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Capacity Estimation</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Adjust inputs or pick a preset. Watch the math compute step by step.
        </p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {presets.map((p, idx) => (
            <button key={p.name} onClick={() => selectPreset(idx)} style={{
              background: presetIdx === idx ? s.accent : s.bg3,
              border: `1px solid ${presetIdx === idx ? s.accent : s.border}`,
              borderRadius: 8, padding: '6px 14px', color: presetIdx === idx ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 12, fontWeight: presetIdx === idx ? 600 : 400, transition: 'all 0.2s',
            }}>{p.name}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total Users', value: totalUsers, set: setTotalUsers, fmt: (v: number) => fmtShort(v) },
            { label: 'Daily Active Users', value: dau, set: setDau, fmt: (v: number) => fmtShort(v) },
            { label: 'Requests per User/Day', value: rpu, set: setRpu, fmt: (v: number) => v.toString() },
            { label: 'Avg Response Size (bytes)', value: avgSize, set: setAvgSize, fmt: (v: number) => fmt(v) },
          ].map(inp => (
            <div key={inp.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: s.text2 }}>{inp.label}</span>
                <span style={{ fontSize: 11, fontFamily: s.mono, color: s.accent }}>{inp.fmt(inp.value)}</span>
              </div>
              <input type="range" min={inp.label.includes('Size') ? 100 : inp.label.includes('Requests') ? 1 : 1000} max={inp.label.includes('Size') ? 100000000 : inp.label.includes('Requests') ? 100 : 5000000000} value={inp.value} onChange={e => inp.set(+e.target.value)} style={{ width: '100%', accentColor: s.accent }} />
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Calculation Steps</div>
        {steps.map((st, idx) => (
          <div key={st.label} style={{
            background: s.bg, borderRadius: 8, padding: '12px 16px', marginBottom: 6,
            borderLeft: `3px solid ${[s.accent, s.green, s.orange, s.purple, s.yellow][idx]}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: s.text2, marginBottom: 2 }}>{st.label}</div>
                <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>{st.calc}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: s.mono, color: [s.accent, s.green, s.orange, s.purple, s.yellow][idx] }}>
                {st.result}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </DemoBoundary>
  )
}
