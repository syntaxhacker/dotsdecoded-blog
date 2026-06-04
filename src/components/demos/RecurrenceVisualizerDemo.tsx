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

const MONTHS = [
  { y: 2026, m: 3, name: 'April' },
  { y: 2026, m: 4, name: 'May' },
  { y: 2026, m: 5, name: 'June' },
]

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function firstWeekday(y: number, m: number) { return new Date(y, m, 1).getDay() }

export default function RecurrenceVisualizerDemo() {
  const [baseWd, setBaseWd] = useState(2)
  const [exceptions, setExceptions] = useState<string[]>([])
  const [horizon, setHorizon] = useState(8)

  const allDays = useMemo(() => {
    const out: { key: string; y: number; m: number; d: number; wd: number }[] = []
    MONTHS.forEach(({ y, m }) => {
      const dim = daysInMonth(y, m)
      for (let d = 1; d <= dim; d++) {
        const wd = new Date(y, m, d).getDay()
        out.push({ key: `${y}-${m}-${d}`, y, m, d, wd })
      }
    })
    return out
  }, [])

  const generated = useMemo(() => {
    const end = new Date(2026, 5, 30)
    const start = new Date(2026, 3, 1)
    const res: string[] = []
    let cur = new Date(start)
    while (cur <= end) {
      if (cur.getDay() === baseWd) {
        const k = `${cur.getFullYear()}-${cur.getMonth()}-${cur.getDate()}`
        if (!exceptions.includes(k)) res.push(k)
      }
      cur.setDate(cur.getDate() + 1)
    }
    return res
  }, [baseWd, exceptions])

  const isGen = (k: string) => generated.includes(k)
  const isEx = (k: string) => exceptions.includes(k)

  const onDayClick = (k: string, wd: number) => {
    if (isGen(k)) {
      if (isEx(k)) setExceptions(exceptions.filter(x => x !== k))
      else setExceptions([...exceptions, k])
    } else {
      setBaseWd(wd)
      setExceptions([])
    }
  }

  const total = generated.length + exceptions.length
  const exCount = exceptions.length

  return (
    <DemoBoundary name="Recurrence Visualizer">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Click a day to set weekday pattern • Click blue dot to add exception</div>
          <div style={{ fontFamily: s.mono, fontSize: 12, color: s.text2 }}>Horizon: {horizon} weeks <input type="range" min={4} max={14} value={horizon} onChange={e => setHorizon(Number(e.target.value))} style={{ verticalAlign: 'middle', width: 90, accentColor: s.accent }} /></div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {MONTHS.map((mo, mi) => {
            const dim = daysInMonth(mo.y, mo.m)
            const first = firstWeekday(mo.y, mo.m)
            const cells: (number | null)[] = Array(first).fill(null).concat(Array.from({ length: dim }, (_, i) => i + 1))
            return (
              <div key={mi} style={{ flex: 1, background: s.bg, borderRadius: 6, padding: 6, border: `1px solid ${s.border}` }}>
                <div style={{ textAlign: 'center', fontSize: 11, color: s.text2, marginBottom: 4 }}>{mo.name} 2026</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', fontSize: 9, textAlign: 'center', gap: 1 }}>
                  {['S','M','T','W','T','F','S'].map(d => <div key={d} style={{ color: s.text3 }}>{d}</div>)}
                  {cells.map((d, i) => {
                    if (!d) return <div key={i} />
                    const k = `${mo.y}-${mo.m}-${d}`
                    const gen = isGen(k)
                    const ex = isEx(k)
                    const bg = gen ? (ex ? s.red : s.accent) : (d === 1 ? s.bg3 : 'transparent')
                    const fg = gen || ex ? '#fff' : s.text2
                    return (
                      <div key={i} onClick={() => onDayClick(k, new Date(mo.y, mo.m, d).getDay())} style={{ padding: '3px 0', background: bg, color: fg, borderRadius: 3, cursor: 'pointer', fontSize: 10, transition: 'all 0.1s' }}>{d}</div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12, marginBottom: 6 }}>
          <div><span style={{ color: s.accent }}>■</span> generated ({generated.length})</div>
          <div><span style={{ color: s.red }}>■</span> exception ({exCount})</div>
          <div><span style={{ color: s.green }}>■</span> modified in place</div>
          <div style={{ marginLeft: 'auto', fontFamily: s.mono, color: s.text2 }}>Total in range: {total} | Exceptions: {exCount}</div>
        </div>

        <div style={{ fontSize: 10, color: s.text3, lineHeight: 1.4 }}>Base weekday is {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][baseWd]}. Exceptions are stored as EXDATE or separate override rows. Horizon slider controls how far the visualizer materializes instances.</div>
      </div>
    </DemoBoundary>
  )
}
