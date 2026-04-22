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

function fmtBytes(bytes: number): string {
  if (bytes >= 1e15) return (bytes / 1e15).toFixed(1) + ' PB'
  if (bytes >= 1e12) return (bytes / 1e12).toFixed(1) + ' TB'
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB'
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB'
  if (bytes >= 1e3) return (bytes / 1e3).toFixed(1) + ' KB'
  return bytes.toFixed(0) + ' B'
}

function fmtNum(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(0)
}

function fmtQps(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

type Mode = 'instagram' | 'youtube'

function InstaCapacityCalcDemo() {
  const [mode, setMode] = useState<Mode>('instagram')

  const [insta, setInsta] = useState({
    totalUsers: 1000,
    dau: 500,
    photosPerDay: 100,
    avgPhotoSizeMB: 2,
    videosPerDay: 10,
    avgVideoSizeMB: 50,
  })

  const [yt, setYt] = useState({
    totalUsers: 2000,
    dau: 1000,
    hoursPerMin: 500,
    avgVideoSizeGB: 1,
  })

  const calc = useMemo(() => {
    if (mode === 'instagram') {
      const dailyStorageBytes = (insta.photosPerDay * 1e6 * insta.avgPhotoSizeMB) + (insta.videosPerDay * 1e6 * insta.avgVideoSizeMB)
      const yearlyStorageBytes = dailyStorageBytes * 365
      const dailyBandwidthBytes = insta.dau * 1e6 * 10 * insta.avgPhotoSizeMB * 1e6
      const readQps = (insta.dau * 1e6) / 86400 * 3
      const writeQps = ((insta.photosPerDay + insta.videosPerDay) * 1e6) / 86400
      return {
        steps: [
          { label: 'Daily storage', math: `${fmtNum(insta.photosPerDay * 1e6)} photos x ${insta.avgPhotoSizeMB} MB + ${fmtNum(insta.videosPerDay * 1e6)} videos x ${insta.avgVideoSizeMB} MB`, result: fmtBytes(dailyStorageBytes) },
          { label: 'Yearly storage', math: `${fmtBytes(dailyStorageBytes)} x 365 days`, result: fmtBytes(yearlyStorageBytes) },
          { label: 'Read QPS (avg)', math: `${fmtNum(insta.dau * 1e6)} DAU / 86,400s x 3 peak`, result: fmtQps(readQps) + ' QPS' },
          { label: 'Write QPS', math: `${fmtNum((insta.photosPerDay + insta.videosPerDay) * 1e6)} uploads / 86,400s`, result: fmtQps(writeQps) + ' QPS' },
          { label: 'Daily bandwidth (origin)', math: `${fmtNum(insta.dau * 1e6)} DAU x 10 views x ${insta.avgPhotoSizeMB} MB (10% after CDN)`, result: fmtBytes(dailyBandwidthBytes) },
        ],
        dailyStorageBytes,
        yearlyStorageBytes,
      }
    } else {
      const hoursPerDay = yt.hoursPerMin * 60 * 24
      const dailyStorageBytes = hoursPerDay * yt.avgVideoSizeGB * 1e9
      const yearlyStorageBytes = dailyStorageBytes * 365
      const dailyBandwidthBytes = yt.dau * 1e6 * 5 * 50e6
      const readQps = (yt.dau * 1e6) / 86400 * 3
      const writeQps = hoursPerDay / 86400
      return {
        steps: [
          { label: 'Daily storage', math: `${yt.hoursPerMin} hrs/min x 60 x 24 = ${fmtNum(hoursPerDay)} hrs/day x ${yt.avgVideoSizeGB} GB/hr`, result: fmtBytes(dailyStorageBytes) },
          { label: 'Yearly storage', math: `${fmtBytes(dailyStorageBytes)} x 365 days`, result: fmtBytes(yearlyStorageBytes) },
          { label: 'Read QPS (avg)', math: `${fmtNum(yt.dau * 1e6)} DAU / 86,400s x 3 peak`, result: fmtQps(readQps) + ' QPS' },
          { label: 'Write QPS', math: `${fmtNum(hoursPerDay)} hrs/day / 86,400s (each triggers transcode)`, result: fmtQps(writeQps) + ' QPS' },
          { label: 'Daily bandwidth', math: `${fmtNum(yt.dau * 1e6)} DAU x 5 views x 50 MB avg`, result: fmtBytes(dailyBandwidthBytes) },
        ],
        dailyStorageBytes,
        yearlyStorageBytes,
      }
    }
  }, [mode, insta, yt])

  const tabStyle = (active: boolean) => ({
    flex: 1,
    padding: '10px 0',
    borderRadius: 6,
    border: `1px solid ${active ? s.accent : s.border}`,
    background: active ? `${s.accent}20` : s.bg,
    color: active ? s.accent : s.text3,
    fontFamily: s.mono,
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer' as const,
    transition: 'all 0.2s ease',
  })

  const slider = (label: string, value: number, min: number, max: number, step: number, unit: string, onChange: (v: number) => void) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
      <span style={{ fontSize: 12, color: s.text2, whiteSpace: 'nowrap', minWidth: 130 }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: s.accent, height: 5 }}
      />
      <span style={{ fontFamily: s.mono, fontSize: 13, color: s.accent, minWidth: 80, textAlign: 'right' }}>
        {fmtNum(value * (unit === 'M' ? 1e6 : unit === 'B' ? 1e9 : 1))}{unit}
      </span>
    </div>
  )

  const presets = (
    mode: Mode,
    setInsta: (v: typeof insta) => void,
    setYt: (v: typeof yt) => void,
  ) => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
      {mode === 'instagram' ? (
        <>
          <button onClick={() => setInsta({ totalUsers: 1000, dau: 500, photosPerDay: 100, avgPhotoSizeMB: 2, videosPerDay: 10, avgVideoSizeMB: 50 })} style={{ ...tabStyle(false), flex: 'none', padding: '5px 12px', fontSize: 11 }}>
            Instagram scale (1B users)
          </button>
          <button onClick={() => setInsta({ totalUsers: 100, dau: 50, photosPerDay: 10, avgPhotoSizeMB: 2, videosPerDay: 1, avgVideoSizeMB: 50 })} style={{ ...tabStyle(false), flex: 'none', padding: '5px 12px', fontSize: 11 }}>
            Startup (100M users)
          </button>
        </>
      ) : (
        <>
          <button onClick={() => setYt({ totalUsers: 2000, dau: 1000, hoursPerMin: 500, avgVideoSizeGB: 1 })} style={{ ...tabStyle(false), flex: 'none', padding: '5px 12px', fontSize: 11 }}>
            YouTube scale (2B users)
          </button>
          <button onClick={() => setYt({ totalUsers: 100, dau: 50, hoursPerMin: 50, avgVideoSizeGB: 1 })} style={{ ...tabStyle(false), flex: 'none', padding: '5px 12px', fontSize: 11 }}>
            Startup (100M users)
          </button>
        </>
      )}
    </div>
  )

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setMode('instagram')} style={tabStyle(mode === 'instagram')}>Instagram</button>
        <button onClick={() => setMode('youtube')} style={tabStyle(mode === 'youtube')}>YouTube</button>
      </div>

      {presets(mode, setInsta, setYt)}

      {mode === 'instagram' ? (
        <div style={{ background: s.bg2, borderRadius: 8, padding: '12px 16px', border: `1px solid ${s.border}`, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 6 }}>Parameters</div>
          {slider('Total users', insta.totalUsers, 1, 5000, 50, 'M', v => setInsta(p => ({ ...p, totalUsers: v })))}
          {slider('Daily active users', insta.dau, 1, 3000, 10, 'M', v => setInsta(p => ({ ...p, dau: v })))}
          {slider('Photos per day', insta.photosPerDay, 1, 500, 5, 'M', v => setInsta(p => ({ ...p, photosPerDay: v })))}
          {slider('Avg photo size', insta.avgPhotoSizeMB, 0.5, 10, 0.5, ' MB', v => setInsta(p => ({ ...p, avgPhotoSizeMB: v })))}
          {slider('Videos per day', insta.videosPerDay, 0.5, 100, 0.5, 'M', v => setInsta(p => ({ ...p, videosPerDay: v })))}
          {slider('Avg video size', insta.avgVideoSizeMB, 10, 200, 5, ' MB', v => setInsta(p => ({ ...p, avgVideoSizeMB: v })))}
        </div>
      ) : (
        <div style={{ background: s.bg2, borderRadius: 8, padding: '12px 16px', border: `1px solid ${s.border}`, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 6 }}>Parameters</div>
          {slider('Total users', yt.totalUsers, 1, 5000, 50, 'M', v => setYt(p => ({ ...p, totalUsers: v })))}
          {slider('Daily active users', yt.dau, 1, 3000, 10, 'M', v => setYt(p => ({ ...p, dau: v })))}
          {slider('Hours uploaded/min', yt.hoursPerMin, 1, 1000, 10, '', v => setYt(p => ({ ...p, hoursPerMin: v })))}
          {slider('Avg video size', yt.avgVideoSizeGB, 0.1, 5, 0.1, ' GB/hr', v => setYt(p => ({ ...p, avgVideoSizeGB: v })))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{ background: s.bg2, borderRadius: 8, padding: '14px 16px', border: `1px solid ${s.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: s.text3, marginBottom: 4 }}>Daily Storage</div>
          <div style={{ fontFamily: s.mono, fontSize: 20, color: s.accent, fontWeight: 700 }}>{fmtBytes(calc.dailyStorageBytes)}</div>
        </div>
        <div style={{ background: s.bg2, borderRadius: 8, padding: '14px 16px', border: `1px solid ${s.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: s.text3, marginBottom: 4 }}>Yearly Storage</div>
          <div style={{ fontFamily: s.mono, fontSize: 20, color: s.orange, fontWeight: 700 }}>{fmtBytes(calc.yearlyStorageBytes)}</div>
        </div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 8, padding: '14px 16px', border: `1px solid ${s.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 10 }}>Step-by-step calculation</div>
        {calc.steps.map((step, i) => (
          <div key={i} style={{
            padding: '10px 12px',
            borderRadius: 6,
            background: i % 2 === 0 ? s.bg : 'transparent',
            marginBottom: 6,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: s.text2, fontWeight: 600 }}>{step.label}</span>
              <span style={{ fontFamily: s.mono, fontSize: 14, color: s.green, fontWeight: 700 }}>{step.result}</span>
            </div>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, lineHeight: 1.4 }}>{step.math}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InstaCapacityCalcDemoWrapped() {
  return (
    <DemoBoundary name="Capacity Estimation Calculator">
      <InstaCapacityCalcDemo />
    </DemoBoundary>
  )
}
