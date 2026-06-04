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

interface Ev { id: number; title: string; date: string; start: number }

const SEED: Ev[] = [
  { id: 1, title: 'Q4 planning standup', date: '2026-05-12', start: 540 },
  { id: 2, title: 'Sync with design on sync', date: '2026-05-13', start: 600 },
  { id: 3, title: 'Weekly standup', date: '2026-05-14', start: 540 },
  { id: 4, title: 'Q4 roadmap review', date: '2026-05-15', start: 660 },
  { id: 5, title: 'Sync sync sync planning', date: '2026-05-16', start: 720 },
  { id: 6, title: 'Standup + Q3 retro', date: '2026-05-19', start: 540 },
  { id: 7, title: 'All-hands Q4 goals', date: '2026-05-20', start: 600 },
  { id: 8, title: 'Sync with eng leads', date: '2026-05-21', start: 660 },
]

function tokenize(t: string): string[] { return t.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean) }

export default function EventSearchDemo() {
  const [events, setEvents] = useState<Ev[]>(SEED)
  const [query, setQuery] = useState('q4 standup')
  const [from, setFrom] = useState('2026-05-12')
  const [to, setTo] = useState('2026-05-21')
  const [explainId, setExplainId] = useState<number | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [queryHistory, setQueryHistory] = useState<string[]>([])

  const index = useMemo(() => {
    const inv: Record<string, number[]> = {}
    const df: Record<string, number> = {}
    events.forEach((ev, i) => {
      const toks = tokenize(ev.title)
      const seen = new Set<string>()
      toks.forEach(t => {
        if (!inv[t]) inv[t] = []
        if (!seen.has(t)) { inv[t].push(i); seen.add(t); df[t] = (df[t] || 0) + 1 }
      })
    })
    return { inv, df, N: events.length }
  }, [events])

  const results = useMemo(() => {
    if (!query.trim()) return events.map((e, i) => ({ ev: e, score: 1, terms: [] as string[] }))
    const qterms = tokenize(query).filter(t => index.inv[t])
    if (qterms.length === 0) return []
    const scored = events.map((ev, i) => {
      if (ev.date < from || ev.date > to) return null
      let score = 0
      const matched: string[] = []
      qterms.forEach(t => {
        const tf = tokenize(ev.title).filter(x => x === t).length
        const idf = Math.log((index.N + 1) / (index.df[t] + 1))
        const contrib = tf * idf
        if (contrib > 0) { score += contrib; matched.push(t) }
      })
      return score > 0 ? { ev, score: Math.round(score * 100) / 100, terms: matched } : null
    }).filter(Boolean) as any[]
    return scored.sort((a, b) => b.score - a.score).slice(0, 8)
  }, [query, from, to, events, index])

  const addEvent = () => {
    if (!newTitle.trim()) return
    const d = new Date(from)
    d.setDate(d.getDate() + Math.floor(Math.random() * 3))
    const ev: Ev = { id: Date.now(), title: newTitle, date: d.toISOString().slice(0,10), start: 540 + Math.random() * 180 }
    setEvents(prev => [...prev, ev])
    setNewTitle('')
  }

  const termChips = useMemo(() => Object.keys(index.inv).slice(0, 8), [index])

  const plan = useMemo(() => {
    const terms = tokenize(query)
    return `term lookup(${terms.join('|')}) → date filter [${from}..${to}] → tf*idf rank → top ${Math.min(8, results.length)}`
  }, [query, from, to, results.length])

  const explain = (id: number) => setExplainId(explainId === id ? null : id)

  return (
    <DemoBoundary name="Event Search">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={query} onChange={e => { setQuery(e.target.value); if (e.target.value.length > 2 && !queryHistory.includes(e.target.value)) setQueryHistory(h => [e.target.value, ...h].slice(0,4)) }} placeholder="Search events..." style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 10px', color: s.text, fontSize: 13 }} />
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '4px', color: s.text, fontSize: 12 }} />
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '4px', color: s.text, fontSize: 12 }} />
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Add event title" style={{ width: 160, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 8px', color: s.text, fontSize: 12 }} />
          <button onClick={addEvent} style={{ background: s.green, color: '#000', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>Add</button>
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {termChips.map(t => (
            <button key={t} onClick={() => setQuery(q => q ? q + ' ' + t : t)} style={{ fontSize: 10, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 3, padding: '2px 6px', cursor: 'pointer' }}>{t} <span style={{ color: s.text3 }}>({index.inv[t]?.length || 0})</span></button>
          ))}
          {queryHistory.map((q, i) => <button key={i} onClick={() => setQuery(q)} style={{ fontSize: 9, background: s.bg, color: s.text3, border: `1px solid ${s.border2}`, borderRadius: 3, padding: '1px 5px', cursor: 'pointer' }}>{q}</button>)}
        </div>

        <div style={{ fontSize: 10, color: s.text3, background: s.bg, padding: '4px 8px', borderRadius: 4, marginBottom: 8, fontFamily: s.mono }}>{plan}</div>
        <div style={{ fontSize: 9, color: s.text3, marginBottom: 4 }}>Index size: {Object.keys(index.inv).length} terms • {events.length} events • avg posting {(Object.values(index.df).reduce((a,b)=>a+b,0)/Math.max(1,Object.keys(index.df).length)).toFixed(1)}</div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: 6, maxHeight: 220, overflowY: 'auto' }}>
          {results.length === 0 && <div style={{ color: s.text3, fontSize: 12, padding: 8 }}>No matches in range. Try different terms or dates.</div>}
          {results.map((r, i) => (
            <div key={i} onClick={() => explain(r.ev.id)} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', cursor: 'pointer', background: explainId === r.ev.id ? s.bg3 : 'transparent', borderRadius: 3 }}>
              <div style={{ fontSize: 12 }}>{r.ev.title} <span style={{ color: s.text3, fontSize: 10 }}>{r.ev.date}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 80, height: 6, background: s.bg3, borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${Math.min(100, r.score * 8)}%`, height: '100%', background: s.green }} /></div>
                <span style={{ fontFamily: s.mono, fontSize: 11, color: s.green }}>{r.score}</span>
              </div>
            </div>
          ))}
        </div>

        {explainId !== null && (
          <div style={{ marginTop: 8, fontSize: 11, color: s.text2, background: s.bg3, padding: 8, borderRadius: 4 }}>
            tf*idf for #{explainId}: {results.find(r => r.ev.id === explainId)?.terms.map(t => `${t} tf=${tokenize(results.find(r => r.ev.id === explainId)!.ev.title).filter(x => x === t).length} idf=${(Math.log((index.N + 1) / (index.df[t] + 1))).toFixed(2)}`).join(' ')} (N={index.N})
          </div>
        )}

        <div style={{ marginTop: 10, fontSize: 10, color: s.text3 }}>Inverted index: term → [doc ids]. Covering index (cal_id, start, end, id) serves 99% of month queries without heap access. Full-text goes to separate ES shard, hydrated by id. History keeps last 4 queries for quick re-run.</div>
      </div>
    </DemoBoundary>
  )
}
