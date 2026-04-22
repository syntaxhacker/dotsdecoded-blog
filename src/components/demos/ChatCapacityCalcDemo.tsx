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

type PresetKey = 'whatsapp' | 'slack'

interface Preset {
  label: string
  users: number
  dau: number
  msgsPerUser: number
  avgSize: number
  retention: number
}

const presets: Record<PresetKey, Preset> = {
  whatsapp: { label: 'WhatsApp', users: 2_000_000_000, dau: 500_000_000, msgsPerUser: 40, avgSize: 100, retention: 5 },
  slack: { label: 'Slack', users: 20_000_000, dau: 10_000_000, msgsPerUser: 60, avgSize: 200, retention: 5 },
}

function formatNum(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.round(n).toString()
}

function formatBytes(n: number): string {
  if (n >= 1e15) return (n / 1e15).toFixed(1) + ' PB'
  if (n >= 1e12) return (n / 1e12).toFixed(1) + ' TB'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' GB'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' MB'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + ' KB'
  return Math.round(n).toString() + ' B'
}

function formatConn(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.round(n).toString()
}

function Slider({ label, value, min, max, step, onChange, format }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: s.text2 }}>{label}</span>
        <span style={{ fontFamily: s.mono, fontSize: 12, color: s.accent, fontWeight: 600 }}>{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: s.accent, height: 4 }}
      />
    </div>
  )
}

function ResultRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${s.border}20` }}>
      <span style={{ fontSize: 12, color: s.text2 }}>{label}</span>
      <span style={{ fontFamily: s.mono, fontSize: 13, fontWeight: 600, color: color || s.text }}>{value}</span>
    </div>
  )
}

export default function ChatCapacityCalcDemo() {
  const [users, setUsers] = useState(2_000_000_000)
  const [dau, setDau] = useState(500_000_000)
  const [msgsPerUser, setMsgsPerUser] = useState(40)
  const [avgSize, setAvgSize] = useState(100)
  const [retention, setRetention] = useState(5)
  const [activePreset, setActivePreset] = useState<PresetKey | null>('whatsapp')

  const calc = useMemo(() => {
    const msgsPerSec = dau * msgsPerUser / 86400
    const msgsPerDay = dau * msgsPerUser
    const textStoragePerDay = msgsPerDay * avgSize
    const mediaPerDay = msgsPerDay * 0.2
    const mediaStoragePerDay = mediaPerDay * 500_000
    const storagePerDay = textStoragePerDay + mediaStoragePerDay
    const storagePerYear = storagePerDay * 365
    const totalStorage = storagePerYear * retention
    const concurrentConns = Math.floor(dau * 0.7)
    return { msgsPerSec, msgsPerDay, textStoragePerDay, mediaPerDay, mediaStoragePerDay, storagePerDay, storagePerYear, totalStorage, concurrentConns }
  }, [users, dau, msgsPerUser, avgSize, retention])

  const applyPreset = (key: PresetKey) => {
    const p = presets[key]
    setUsers(p.users)
    setDau(p.dau)
    setMsgsPerUser(p.msgsPerUser)
    setAvgSize(p.avgSize)
    setRetention(p.retention)
    setActivePreset(key)
  }

  const handleSlider = (setter: (v: number) => void) => (v: number) => {
    setter(v)
    setActivePreset(null)
  }

  return (
    <DemoBoundary name="Chat Capacity Calculator">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '14px 16px',
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Presets</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(Object.keys(presets) as PresetKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    style={{
                      flex: 1,
                      padding: '7px 12px',
                      background: activePreset === key ? `${s.accent}20` : s.bg2,
                      border: `1px solid ${activePreset === key ? s.accent : s.border}`,
                      borderRadius: 6,
                      color: activePreset === key ? s.accent : s.text2,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: s.mono,
                      transition: 'all 0.2s',
                    }}
                  >
                    {presets[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Parameters</div>
              <Slider label="Total Users" value={users} min={1_000_000} max={3_000_000_000} step={10_000_000} onChange={handleSlider(setUsers)} format={formatNum} />
              <Slider label="Daily Active Users (DAU)" value={dau} min={100_000} max={2_000_000_000} step={10_000_000} onChange={handleSlider(setDau)} format={formatNum} />
              <Slider label="Messages / User / Day" value={msgsPerUser} min={5} max={200} step={5} onChange={handleSlider(setMsgsPerUser)} format={(v) => v.toString()} />
              <Slider label="Avg Message Size (bytes)" value={avgSize} min={50} max={500} step={10} onChange={handleSlider(setAvgSize)} format={(v) => v + ' B'} />
              <Slider label="Retention (years)" value={retention} min={1} max={10} step={1} onChange={handleSlider(setRetention)} format={(v) => v + ' yr'} />
            </div>
          </div>

          <div style={{ width: 340, flexShrink: 0 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '14px 16px',
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Results</div>
              <ResultRow label="Messages/sec" value={formatNum(Math.round(calc.msgsPerSec)) + '/s'} color={s.accent} />
              <ResultRow label="Messages/day" value={formatNum(calc.msgsPerDay)} />
              <ResultRow label="Text storage/day" value={formatBytes(calc.textStoragePerDay)} />
              <ResultRow label="Media messages/day" value={formatNum(calc.mediaPerDay)} color={s.orange} />
              <ResultRow label="Media storage/day" value={formatBytes(calc.mediaStoragePerDay)} color={s.orange} />
              <ResultRow label="Total storage/day" value={formatBytes(calc.storagePerDay)} color={s.green} />
              <ResultRow label="Total storage/year" value={formatBytes(calc.storagePerYear)} />
              <ResultRow label="Total storage ({retention}yr)" value={formatBytes(calc.totalStorage)} color={s.yellow} />
              <ResultRow label="Concurrent connections" value={formatConn(calc.concurrentConns)} color={s.purple} />
            </div>

            <div style={{
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Formulas</div>
              <div style={{ fontFamily: s.mono, fontSize: 10, lineHeight: 1.8, color: s.text3 }}>
                <div><span style={{ color: s.accent }}>msgs/sec</span> = DAU x msgs_per_user / 86400</div>
                <div><span style={{ color: s.accent }}>text/day</span> = msgs_per_day x avg_size</div>
                <div><span style={{ color: s.orange }}>media/day</span> = msgs_per_day x 20% x 500KB</div>
                <div><span style={{ color: s.green }}>total/day</span> = text + media</div>
                <div><span style={{ color: s.yellow }}>total</span> = total_per_day x 365 x retention</div>
                <div><span style={{ color: s.purple }}>connections</span> = DAU x 70%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
