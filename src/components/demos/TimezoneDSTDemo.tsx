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

const ZONES = [
  { label: 'America/New_York', name: 'New York' },
  { label: 'Europe/London', name: 'London' },
  { label: 'Asia/Tokyo', name: 'Tokyo' },
  { label: 'America/Los_Angeles', name: 'Los Angeles' },
  { label: 'Europe/Paris', name: 'Paris' },
  { label: 'Australia/Sydney', name: 'Sydney' },
  { label: 'Asia/Kolkata', name: 'Kolkata' },
  { label: 'Pacific/Auckland', name: 'Auckland' },
]

export default function TimezoneDSTDemo() {
  const [dateStr, setDateStr] = useState('2026-03-08')
  const [timeStr, setTimeStr] = useState('14:30')
  const [zoneA, setZoneA] = useState(0)
  const [zoneB, setZoneB] = useState(1)

  const za = ZONES[zoneA]
  const zb = ZONES[zoneB]

  const parsed = useMemo(() => {
    const dt = new Date(`${dateStr}T${timeStr}:00`)
    return dt
  }, [dateStr, timeStr])

  const fmt = (z: string) => {
    try {
      const d = new Intl.DateTimeFormat('en-US', { timeZone: z, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(parsed)
      return d
    } catch { return 'Invalid' }
  }

  const utcStr = parsed.toISOString().slice(0,16).replace('T', ' ')

  const localA = fmt(za.label)
  const localB = fmt(zb.label)

  const isDstTransition = ['2026-03-08', '2026-11-01', '2026-03-29', '2026-10-25'].includes(dateStr)

  const dstMsg = dateStr === '2026-03-08' || dateStr === '2026-03-29' ? 'Spring forward: 1 hour lost (02:00 → 03:00)' : 'Fall back: 1 hour repeated (02:00 → 01:00)'

  const Clock = ({ label, tz }: { label: string; tz: string }) => {
    const h = parseInt(timeStr.slice(0,2), 10)
    const m = parseInt(timeStr.slice(3,5), 10)
    const ha = ((h % 12) + m / 60) * 30 - 90
    const ma = m * 6 - 90
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: s.text3, marginBottom: 4 }}>{label}</div>
        <svg width="78" height="78" viewBox="0 0 78 78">
          <circle cx="39" cy="39" r="34" fill="none" stroke={s.border2} strokeWidth="2" />
          <circle cx="39" cy="39" r="3" fill={s.accent} />
          <line x1="39" y1="39" x2={39 + 18 * Math.cos(ha * Math.PI / 180)} y2={39 + 18 * Math.sin(ha * Math.PI / 180)} stroke={s.accent} strokeWidth="3" strokeLinecap="round" />
          <line x1="39" y1="39" x2={39 + 26 * Math.cos(ma * Math.PI / 180)} y2={39 + 26 * Math.sin(ma * Math.PI / 180)} stroke={s.green} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  return (
    <DemoBoundary name="Timezone and DST">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 18 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 4 }}>DATE</div>
            <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 13 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 4 }}>TIME (24h)</div>
            <input type="time" value={timeStr} onChange={e => setTimeStr(e.target.value)} style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 13 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 4 }}>EXAMPLE ZONES</div>
            <select value={zoneA} onChange={e => setZoneA(Number(e.target.value))} style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 8px', fontSize: 12, width: '100%', marginBottom: 4 }}>
              {ZONES.map((z, i) => <option key={i} value={i}>{z.name}</option>)}
            </select>
            <select value={zoneB} onChange={e => setZoneB(Number(e.target.value))} style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 8px', fontSize: 12, width: '100%' }}>
              {ZONES.map((z, i) => <option key={i} value={i}>{z.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 12 }}>
          <div style={{ background: s.bg, borderRadius: 8, padding: 12, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.accent, marginBottom: 6 }}>{za.name} ({za.label})</div>
            <Clock label="Local" tz={za.label} />
            <div style={{ fontFamily: s.mono, fontSize: 13, marginTop: 6 }}>{localA}</div>
          </div>
          <div style={{ background: s.bg, borderRadius: 8, padding: 12, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.green, marginBottom: 6 }}>{zb.name} ({zb.label})</div>
            <Clock label="Local" tz={zb.label} />
            <div style={{ fontFamily: s.mono, fontSize: 13, marginTop: 6 }}>{localB}</div>
          </div>
        </div>

        <div style={{ background: s.bg, borderRadius: 8, padding: 10, border: `1px solid ${s.border}`, marginBottom: 10, fontFamily: s.mono, fontSize: 12 }}>
          UTC: {utcStr}Z
        </div>

        {isDstTransition && (
          <div style={{ background: `${s.yellow}15`, border: `1px solid ${s.yellow}`, borderRadius: 6, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: s.yellow }}>
            {dstMsg} — clocks in {za.name} and {zb.name} jump. Recurring events at 02:30 may fire twice or skip.
          </div>
        )}

        <div style={{ fontSize: 10, color: s.text3, lineHeight: 1.4 }}>
          All day events and RRULE expansions must store the original TZ + rule, never a fixed UTC instant. A 09:00 meeting in NY on DST day is still 09:00 local after spring forward.
        </div>
      </div>
    </DemoBoundary>
  )
}
