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

const ATTENDEES = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SLOTS = 16
const START_H = 9

type BusyMap = Record<string, boolean[][]>

const makeEmpty = (): BusyMap => {
  const m: BusyMap = {}
  ATTENDEES.forEach(a => { m[a] = Array.from({ length: 7 }, () => Array(SLOTS).fill(false)) })
  return m
}

export default function FindTimeDemo() {
  const [busy, setBusy] = useState<BusyMap>(makeEmpty)
  const [day, setDay] = useState(2)
  const [painting, setPainting] = useState<{ att: string; val: boolean } | null>(null)
  const [results, setResults] = useState<{ start: number; score: number; label: string }[]>([])
  const [highlight, setHighlight] = useState<{ start: number; len: number } | null>(null)

  const toggleSlot = (att: string, d: number, slot: number, force?: boolean) => {
    setBusy(prev => {
      const next = { ...prev, [att]: prev[att].map((row, i) => i === d ? [...row] : row) }
      const v = force !== undefined ? force : !next[att][d][slot]
      next[att][d][slot] = v
      return next
    })
  }

  const startPaint = (att: string, d: number, slot: number) => {
    const v = !busy[att][d][slot]
    setPainting({ att, val: v })
    toggleSlot(att, d, slot, v)
  }
  const doPaint = (att: string, d: number, slot: number) => { if (painting && painting.att === att) toggleSlot(att, d, slot, painting.val) }
  const endPaint = () => setPainting(null)

  const applyPreset = (type: string) => {
    const next = makeEmpty()
    if (type === 'pst') {
      ATTENDEES.forEach((a, ai) => {
        for (let d = 0; d < 5; d++) for (let sl = 0; sl < SLOTS; sl++) next[a][d][sl] = (ai + d + sl) % 3 === 0
      })
    } else if (type === 'random') {
      ATTENDEES.forEach(a => { for (let d = 0; d < 7; d++) for (let sl = 0; sl < SLOTS; sl++) next[a][d][sl] = Math.random() > 0.65 })
    } else if (type === 'free') {
      next['Eve'] = Array.from({ length: 7 }, () => Array(SLOTS).fill(false))
    }
    setBusy(next)
    setResults([])
    setHighlight(null)
  }

  const findWindows = () => {
    const wins: { start: number; len: number; score: number; label: string }[] = []
    for (let st = 0; st < SLOTS; st++) {
      for (let len = 8; len >= 2; len--) {
        if (st + len > SLOTS) continue
        let allFree = true
        ATTENDEES.forEach(a => {
          for (let k = 0; k < len; k++) if (busy[a][day][st + k]) allFree = false
        })
        if (allFree) {
          const freeCount = ATTENDEES.length
          const bizBonus = (st >= 2 && st + len <= 12) ? 3 : 0
          const score = freeCount * 10 + len * 2 + bizBonus
          const h1 = START_H + Math.floor(st / 2)
          const m1 = (st % 2) * 30
          const h2 = START_H + Math.floor((st + len) / 2)
          const m2 = ((st + len) % 2) * 30
          wins.push({ start: st, len, score, label: `${h1}:${m1.toString().padStart(2,'0')} - ${h2}:${m2.toString().padStart(2,'0')} (${len * 30}m)` })
        }
      }
    }
    const top = wins.sort((a, b) => b.score - a.score).slice(0, 5)
    setResults(top.map(w => ({ start: w.start, score: w.score, label: w.label })))
    setHighlight(null)
  }

  const book = (st: number) => {
    const len = 4
    setHighlight({ start: st, len })
    setTimeout(() => setHighlight(null), 1800)
  }

  const densities = useMemo(() => {
    const d: Record<string, number> = {}
    ATTENDEES.forEach(a => {
      let cnt = 0
      for (let dd = 0; dd < 7; dd++) for (let sl = 0; sl < SLOTS; sl++) if (busy[a][dd][sl]) cnt++
      d[a] = Math.round(cnt / (7 * SLOTS) * 100)
    })
    const hardest = Object.entries(d).sort((x, y) => y[1] - x[1])[0]
    return { dens: d, hardest: hardest[0], hardPct: hardest[1] }
  }, [busy])

  const reset = () => { setBusy(makeEmpty()); setResults([]); setHighlight(null); setDay(2) }

  return (
    <DemoBoundary name="Find a Time Engine">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 14 }} onMouseLeave={endPaint}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: s.text2 }}>Click or drag cells to toggle busy (30-min slots, 9am-5pm)</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => applyPreset('pst')} style={{ fontSize: 10, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>PST business</button>
            <button onClick={() => applyPreset('random')} style={{ fontSize: 10, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>Random busy</button>
            <button onClick={() => applyPreset('free')} style={{ fontSize: 10, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>One fully free</button>
            <button onClick={findWindows} style={{ fontSize: 10, background: s.green, color: '#000', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}>Find Top 5 Windows</button>
            <button onClick={reset} style={{ fontSize: 10, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>Reset</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {DAYS.map((d, di) => <button key={di} onClick={() => setDay(di)} style={{ flex: 1, fontSize: 10, background: di === day ? s.accent : s.bg3, color: di === day ? '#fff' : s.text2, border: 'none', borderRadius: 3, padding: '3px 0', cursor: 'pointer' }}>{d}</button>)}
        </div>

        {ATTENDEES.map(att => (
          <div key={att} style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: s.text2, marginBottom: 1, display: 'flex', justifyContent: 'space-between' }}>
              <span>{att}</span>
              <span style={{ color: s.text3 }}>{densities.dens[att]}% busy this week</span>
            </div>
            <div style={{ display: 'flex', gap: 1, background: s.bg, padding: 2, borderRadius: 3 }} onMouseUp={endPaint}>
              {Array.from({ length: 7 }).map((_, d) => (
                <div key={d} style={{ display: 'flex', gap: 0.5, flex: 1, opacity: d === day ? 1 : 0.35 }}>
                  {Array.from({ length: SLOTS }).map((_, sl) => {
                    const isB = busy[att][d][sl]
                    const hi = highlight && sl >= highlight.start && sl < highlight.start + highlight.len
                    return <div key={sl} onMouseDown={() => startPaint(att, d, sl)} onMouseEnter={() => doPaint(att, d, sl)} style={{ flex: 1, height: 14, background: isB ? s.red : (hi ? s.green : s.bg3), borderRadius: 1, cursor: 'pointer', transition: 'background 0.08s' }} />
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}

        {results.length > 0 && (
          <div style={{ marginTop: 10, background: s.bg, borderRadius: 6, padding: 10, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 11, color: s.text2, marginBottom: 4 }}>Top meeting windows for {DAYS[day]} (scored by attendees + length + business hours)</div>
            {results.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderTop: i > 0 ? `1px solid ${s.border}` : 'none' }}>
                <span style={{ color: s.green, fontFamily: s.mono }}>{r.label}</span>
                <button onClick={() => book(r.start)} style={{ fontSize: 10, background: s.accent, color: '#fff', border: 'none', borderRadius: 3, padding: '1px 6px', cursor: 'pointer' }}>Book this</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 8, fontSize: 10, color: s.text3 }}>Hardest to schedule: <span style={{ color: s.orange }}>{densities.hardest}</span> ({densities.hardPct}% density). Real solver uses backtracking + genetic for 20+ people, 800ms budget, returns top 5 scored by soft prefs (room proximity, Friday penalty).</div>
      </div>
    </DemoBoundary>
  )
}
