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

function fmt(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(0)
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1e12) return (bytes / 1e12).toFixed(1) + ' TB'
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB'
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB'
  return bytes.toFixed(0) + ' B'
}

interface Preset {
  name: string
  newUrls: number
  readWrite: number
  urlSize: number
  retention: number
}

const presets: Preset[] = [
  { name: 'Startup', newUrls: 1_000_000, readWrite: 50, urlSize: 500, retention: 2 },
  { name: 'bit.ly scale', newUrls: 500_000_000, readWrite: 100, urlSize: 500, retention: 5 },
  { name: 'Hypergrowth', newUrls: 5_000_000_000, readWrite: 200, urlSize: 500, retention: 10 },
]

export default function CapacityCalcDemo() {
  const [newUrls, setNewUrls] = useState(500_000_000)
  const [readWrite, setReadWrite] = useState(100)
  const [urlSize, setUrlSize] = useState(500)
  const [retention, setRetention] = useState(5)

  const calc = useMemo(() => {
    const secondsPerMonth = 2.592e6
    const writeQps = newUrls / secondsPerMonth
    const readQps = writeQps * readWrite
    const storagePerYear = newUrls * urlSize
    const totalStorage = storagePerYear * retention
    const responseSize = 300
    const bandwidth = readQps * responseSize * 86400
    const totalUrls = newUrls * retention
    return { writeQps, readQps, storagePerYear, totalStorage, bandwidth, totalUrls }
  }, [newUrls, readWrite, urlSize, retention])

  const applyPreset = (p: Preset) => {
    setNewUrls(p.newUrls)
    setReadWrite(p.readWrite)
    setUrlSize(p.urlSize)
    setRetention(p.retention)
  }

  const rows = [
    { label: 'Write QPS', value: calc.writeQps.toFixed(1) + ' /s', color: s.orange },
    { label: 'Read QPS', value: calc.readQps.toFixed(0) + ' /s', color: s.accent },
    { label: 'Storage / year', value: fmtBytes(calc.storagePerYear), color: s.yellow },
    { label: 'Total storage', value: fmtBytes(calc.totalStorage), color: s.yellow },
    { label: 'Bandwidth / day', value: fmtBytes(calc.bandwidth), color: s.green },
    { label: 'Total URLs', value: fmt(calc.totalUrls), color: s.purple },
  ]

  return (
    <DemoBoundary name="Capacity Estimation">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${s.border}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, lineHeight: '32px' }}>Presets:</span>
            {presets.map(p => (
              <button key={p.name} onClick={() => applyPreset(p)} style={{
                padding: '5px 12px', fontSize: 12, fontFamily: s.mono, borderRadius: 5,
                border: `1px solid ${s.border}`, background: 'transparent', color: s.text2, cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                {p.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 380px', minWidth: 320, padding: 16, borderRight: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.accent, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Inputs</div>
              {[
                { label: 'New URLs / month', value: newUrls, set: setNewUrls, min: 10000, max: 10000000000, step: 10000000 },
                { label: 'Read : Write ratio', value: readWrite, set: setReadWrite, min: 10, max: 500, step: 10 },
                { label: 'Avg URL size (bytes)', value: urlSize, set: setUrlSize, min: 100, max: 2000, step: 50 },
                { label: 'Retention (years)', value: retention, set: setRetention, min: 1, max: 20, step: 1 },
              ].map(param => (
                <div key={param.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: s.text2 }}>{param.label}</span>
                    <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text }}>{fmt(param.value)}</span>
                  </div>
                  <input
                    type="range" min={param.min} max={param.max} step={param.step}
                    value={param.value} onChange={e => param.set(Number(e.target.value))}
                    style={{ width: '100%', accentColor: s.accent }}
                  />
                </div>
              ))}
            </div>

            <div style={{ flex: '1 1 380px', minWidth: 320, padding: 16 }}>
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.green, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Calculated</div>
              {rows.map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', marginBottom: 6, borderRadius: 6, background: s.bg,
                  border: `1px solid ${s.border}`,
                }}>
                  <span style={{ fontSize: 13, color: s.text2 }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontFamily: s.mono, color: row.color, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '14px 16px', borderTop: `1px solid ${s.border}`, background: s.bg }}>
            <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>MATH</div>
            <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, lineHeight: 1.8 }}>
              <div>writes/sec = {fmt(newUrls)} / 2,592,000 = {calc.writeQps.toFixed(1)}</div>
              <div>reads/sec  = {calc.writeQps.toFixed(1)} x {readWrite} = {calc.readQps.toFixed(0)}</div>
              <div>storage/yr = {fmt(newUrls)} x {urlSize}B = {fmtBytes(calc.storagePerYear)}</div>
              <div>total      = {fmtBytes(calc.storagePerYear)} x {retention}yr = {fmtBytes(calc.totalStorage)}</div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
