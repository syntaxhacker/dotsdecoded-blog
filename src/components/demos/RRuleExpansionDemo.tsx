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

const BASE = '2026-05-04T09:00:00Z'
const EXAMPLES = [
  'FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20260901T000000Z',
  'FREQ=MONTHLY;BYMONTHDAY=15;COUNT=24',
  'FREQ=DAILY;INTERVAL=2;BYHOUR=9;UNTIL=20260815T000000Z',
]

function parseRrule(rrule: string) {
  const parts: Record<string, string> = {}
  rrule.split(';').forEach(p => { const [k, v] = p.split('='); if (k && v) parts[k] = v })
  return parts
}

function expand(rrule: string, exdates: string[], count: number): string[] {
  const p = parseRrule(rrule)
  const freq = p.FREQ || 'WEEKLY'
  const byday = (p.BYDAY || 'MO').split(',')
  const until = p.UNTIL ? new Date(p.UNTIL) : new Date('2027-01-01')
  const start = new Date(BASE)
  const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }
  const res: string[] = []
  let d = new Date(start)
  while (res.length < count && d < until) {
    const wd = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][d.getUTCDay()]
    const k = d.toISOString().slice(0,10)
    if (byday.includes(wd) && !exdates.includes(k)) res.push(d.toISOString().slice(0,16).replace('T', ' '))
    d = new Date(d.getTime() + 86400000)
  }
  return res
}

export default function RRuleExpansionDemo() {
  const [rrule, setRrule] = useState('FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20260901T000000Z')
  const [exdates, setExdates] = useState<string[]>([])
  const [count, setCount] = useState(15)
  const [showStats, setShowStats] = useState(false)

  const instances = useMemo(() => expand(rrule, exdates, count), [rrule, exdates, count])

  const effective = rrule + (exdates.length ? ';EXDATE=' + exdates.map(e => e.replace(/ /g, 'T') + 'Z').join(',') : '')

  const parts = parseRrule(rrule)

  const toggleEx = (inst: string) => {
    const d = inst.split(' ')[0]
    if (exdates.includes(d)) setExdates(exdates.filter(x => x !== d))
    else setExdates([...exdates, d])
  }

  const changeUntil = (months: number) => {
    const base = new Date('2026-09-01')
    base.setMonth(base.getMonth() + months)
    const y = base.getUTCFullYear()
    const m = String(base.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(base.getUTCDate()).padStart(2, '0')
    setRrule(rrule.replace(/UNTIL=[^;]+/, `UNTIL=${y}${m}${dd}T000000Z`))
  }

  const loadExample = (ex: string) => { setRrule(ex); setExdates([]) }

  const totalGen = instances.length + exdates.length

  return (
    <DemoBoundary name="RRULE Expansion">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {EXAMPLES.map((ex, i) => <button key={i} onClick={() => loadExample(ex)} style={{ background: s.bg3, border: `1px solid ${s.border}`, color: s.text2, borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer' }}>Ex {i + 1}</button>)}
        </div>
        <textarea value={rrule} onChange={e => setRrule(e.target.value)} style={{ width: '100%', height: 52, background: s.bg, color: s.text, border: `1px solid ${s.border}`, borderRadius: 6, fontFamily: s.mono, fontSize: 12, padding: 8, resize: 'none' }} />

        <div style={{ display: 'flex', gap: 8, margin: '10px 0', flexWrap: 'wrap' }}>
          <button onClick={() => setCount(15)} style={{ background: s.bg3, border: `1px solid ${s.border}`, color: s.text2, borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Next 15</button>
          <button onClick={() => setCount(30)} style={{ background: s.bg3, border: `1px solid ${s.border}`, color: s.text2, borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Next 30</button>
          <button onClick={() => changeUntil(-2)} style={{ background: s.bg3, border: `1px solid ${s.border}`, color: s.text2, borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Until -2mo</button>
          <button onClick={() => changeUntil(2)} style={{ background: s.bg3, border: `1px solid ${s.border}`, color: s.text2, borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Until +2mo</button>
          <button onClick={() => setExdates([])} style={{ background: s.red, border: 'none', color: '#fff', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Clear EXDATEs</button>
          <button onClick={() => setShowStats(!showStats)} style={{ background: s.bg3, border: `1px solid ${s.border}`, color: s.text2, borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>{showStats ? 'Hide' : 'Show'} stats</button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {Object.entries(parts).map(([k, v]) => <div key={k} style={{ background: s.bg3, color: s.accent, fontFamily: s.mono, fontSize: 10, padding: '2px 7px', borderRadius: 3 }}>{k}={v}</div>)}
          {exdates.length > 0 && <div style={{ background: s.red, color: '#fff', fontFamily: s.mono, fontSize: 10, padding: '2px 7px', borderRadius: 3 }}>EXDATE ({exdates.length})</div>}
        </div>

        <div style={{ background: s.bg, borderRadius: 6, border: `1px solid ${s.border}`, maxHeight: 168, overflow: 'auto', padding: 6, marginBottom: 8 }}>
          {instances.length === 0 && <div style={{ color: s.text3, fontSize: 12, padding: 8 }}>No instances (check UNTIL or EXDATEs)</div>}
          {instances.map((inst, i) => {
            const d = inst.split(' ')[0]
            const ex = exdates.includes(d)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', background: ex ? `${s.red}20` : 'transparent', borderRadius: 4, marginBottom: 2 }}>
                <input type="checkbox" checked={ex} onChange={() => toggleEx(inst)} style={{ marginRight: 8 }} />
                <span style={{ fontFamily: s.mono, fontSize: 12, color: ex ? s.red : s.text }}>{inst}</span>
                {ex && <span style={{ marginLeft: 8, fontSize: 10, color: s.red }}>EXCLUDED</span>}
              </div>
            )
          })}
        </div>

        <div style={{ fontFamily: s.mono, fontSize: 11, background: s.bg3, padding: 8, borderRadius: 4, color: s.green, wordBreak: 'break-all', marginBottom: 8 }}>{effective}</div>

        {showStats && <div style={{ background: s.bg, padding: 8, borderRadius: 4, fontSize: 11, marginBottom: 8, color: s.text2 }}>Expanded {instances.length} of {totalGen} possible. {exdates.length} exceptions stored separately. Real engine materializes 5-10y ahead or uses cursor expansion on query.</div>}

        <div style={{ fontSize: 10, color: s.text3, lineHeight: 1.4 }}>EXDATE removes specific instances without breaking the rule. Changing UNTIL prunes the tail. Real systems expand 5-10 years ahead into a materialized table or use bitmap for fast free/busy.</div>
      </div>
    </DemoBoundary>
  )
}
