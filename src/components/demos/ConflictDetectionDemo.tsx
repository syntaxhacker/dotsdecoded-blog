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

interface CalEvent {
  id: number
  title: string
  start: number
  duration: number
}

const DAY_START = 7 * 60
const DAY_END = 20 * 60
const DAY_SPAN = DAY_END - DAY_START
const SLOT = 15

const initialEvents: CalEvent[] = [
  { id: 1, title: 'Team standup', start: 9 * 60, duration: 30 },
  { id: 2, title: 'Design review', start: 11 * 60 + 30, duration: 60 },
  { id: 3, title: '1:1 with manager', start: 14 * 60, duration: 45 },
  { id: 4, title: 'Project sync', start: 16 * 60, duration: 30 },
]

export default function ConflictDetectionDemo() {
  const [events, setEvents] = useState<CalEvent[]>(initialEvents)
  const [draft, setDraft] = useState<CalEvent>({ id: -1, title: 'New meeting', start: 10 * 60, duration: 45 })
  const [showSuggestions, setShowSuggestions] = useState(false)

  const allEvents = useMemo(() => [...events, draft], [events, draft])

  const overlaps = useMemo(() => {
    const res: { ev: CalEvent; overlapMin: number }[] = []
    const ds = draft.start
    const de = ds + draft.duration
    events.forEach(ev => {
      const es = ev.start
      const ee = es + ev.duration
      const oStart = Math.max(ds, es)
      const oEnd = Math.min(de, ee)
      if (oStart < oEnd) res.push({ ev, overlapMin: oEnd - oStart })
    })
    return res
  }, [events, draft])

  const hasConflict = overlaps.length > 0

  const suggestions = useMemo(() => {
    const sug: { start: number; label: string }[] = []
    let t = DAY_START
    while (t <= DAY_END - draft.duration && sug.length < 3) {
      const candEnd = t + draft.duration
      let free = true
      for (const ev of events) {
        const es = ev.start
        const ee = es + ev.duration
        if (Math.max(t, es) < Math.min(candEnd, ee)) { free = false; break }
      }
      if (free) {
        const h1 = Math.floor(t / 60)
        const m1 = t % 60
        const h2 = Math.floor(candEnd / 60)
        const m2 = candEnd % 60
        sug.push({ start: t, label: `${h1.toString().padStart(2,'0')}:${m1.toString().padStart(2,'0')} - ${h2.toString().padStart(2,'0')}:${m2.toString().padStart(2,'0')}` })
      }
      t += SLOT
    }
    return sug
  }, [events, draft.duration])

  const timelineEvents = useMemo(() => {
    return allEvents.map(ev => {
      const top = ((ev.start - DAY_START) / DAY_SPAN) * 100
      const h = (ev.duration / DAY_SPAN) * 100
      const isDraft = ev.id === -1
      const conflictsWith = isDraft && hasConflict
      return { ...ev, top: Math.max(0, Math.min(100, top)), h: Math.max(1, h), isDraft, conflictsWith }
    })
  }, [allEvents, hasConflict])

  const addToCalendar = () => {
    if (!draft.title.trim()) return
    const newEv = { ...draft, id: Date.now() }
    setEvents(prev => [...prev, newEv])
    setDraft({ id: -1, title: 'New meeting', start: Math.min(DAY_END - 60, draft.start + 60), duration: 45 })
    setShowSuggestions(false)
  }

  const applySuggestion = (st: number) => {
    setDraft(d => ({ ...d, start: st }))
    setShowSuggestions(false)
  }

  const autoResolve = () => {
    if (suggestions.length === 0) return
    setDraft(d => ({ ...d, start: suggestions[0].start }))
  }

  const reset = () => {
    setEvents(initialEvents)
    setDraft({ id: -1, title: 'New meeting', start: 10 * 60, duration: 45 })
    setShowSuggestions(false)
  }

  const updateDraft = (patch: Partial<CalEvent>) => {
    setDraft(d => ({ ...d, ...patch }))
    setShowSuggestions(false)
  }

  const formatTime = (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`
  }

  return (
    <DemoBoundary name="Conflict Detection">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: s.text2, marginBottom: 4 }}>Draft event</div>
            <input value={draft.title} onChange={e => updateDraft({ title: e.target.value })} style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 10px', color: s.text, fontSize: 13 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: s.text3, marginBottom: 2 }}>Start</div>
                <input type="time" value={formatTime(draft.start)} onChange={e => {
                  const [h,m] = e.target.value.split(':').map(Number)
                  const mins = h*60 + m
                  if (mins >= DAY_START && mins <= DAY_END - draft.duration) updateDraft({ start: mins })
                }} style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '4px 8px', color: s.text, fontSize: 13, fontFamily: s.mono }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: s.text3, marginBottom: 2 }}>Duration</div>
                <select value={draft.duration} onChange={e => updateDraft({ duration: Number(e.target.value) })} style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '4px 8px', color: s.text, fontSize: 13 }}>
                  {[15,30,45,60].map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={addToCalendar} style={{ flex: 1, background: s.green, color: '#000', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add to calendar</button>
              <button onClick={autoResolve} disabled={!hasConflict || suggestions.length === 0} style={{ background: hasConflict ? s.yellow : s.bg3, color: hasConflict ? '#000' : s.text3, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: hasConflict ? 'pointer' : 'default' }}>Auto resolve</button>
              <button onClick={reset} style={{ background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>Reset</button>
            </div>
          </div>

          <div style={{ width: 260, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 11, color: s.text2, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>Day timeline (7am-8pm)</span>
              <span style={{ color: hasConflict ? s.red : s.green, fontSize: 10 }}>{hasConflict ? `${overlaps.length} conflict${overlaps.length>1?'s':''}` : 'No overlaps'}</span>
            </div>
            <div style={{ position: 'relative', height: 280, background: s.bg3, borderRadius: 4, overflow: 'hidden', border: `1px solid ${s.border2}` }}>
              {Array.from({ length: 14 }).map((_, i) => {
                const hr = 7 + i
                const y = ((hr * 60 - DAY_START) / DAY_SPAN) * 100
                return (
                  <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${y}%`, height: 1, background: s.border, display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', left: 4, top: -6, fontSize: 9, color: s.text3, fontFamily: s.mono }}>{hr.toString().padStart(2,'0')}:00</div>
                  </div>
                )
              })}
              {timelineEvents.map((ev, idx) => (
                <div key={idx} style={{
                  position: 'absolute', left: '18%', right: '8%', top: `${ev.top}%`, height: `${ev.h}%`,
                  background: ev.isDraft ? (ev.conflictsWith ? s.red : s.accent) : s.purple,
                  borderRadius: 3, opacity: ev.isDraft ? 0.95 : 0.75, border: ev.isDraft ? `1px solid ${ev.conflictsWith ? s.red : s.accent}` : `1px solid ${s.border2}`,
                  display: 'flex', alignItems: 'center', paddingLeft: 6, fontSize: 9, color: '#fff', overflow: 'hidden', transition: 'all 0.2s'
                }}>
                  {ev.title.length > 18 ? ev.title.slice(0,17) : ev.title}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9, color: s.text3, marginTop: 4 }}>Red = draft overlaps existing</div>
          </div>
        </div>

        {overlaps.length > 0 && (
          <div style={{ background: s.bg, border: `1px solid ${s.red}`, borderRadius: 8, padding: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: s.red, marginBottom: 6 }}>CONFLICTS ({overlaps.length})</div>
            {overlaps.map((o, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderTop: i>0 ? `1px solid ${s.border}` : 'none' }}>
                <span style={{ color: s.text }}>{o.ev.title} <span style={{ color: s.text3, fontSize: 10 }}>({formatTime(o.ev.start)} +{o.ev.duration}m)</span></span>
                <span style={{ color: s.red, fontFamily: s.mono }}>{o.overlapMin} min overlap</span>
              </div>
            ))}
            {suggestions.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <button onClick={() => setShowSuggestions(!showSuggestions)} style={{ fontSize: 11, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>{showSuggestions ? 'Hide' : 'Show'} 3 alternative slots</button>
                {showSuggestions && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {suggestions.map((sg, i) => (
                      <button key={i} onClick={() => applySuggestion(sg.start)} style={{ fontSize: 11, background: s.bg2, color: s.green, border: `1px solid ${s.green}`, borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>{sg.label}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: 11, color: s.text2, marginBottom: 4 }}>Existing events ({events.length})</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {events.map(ev => (
            <div key={ev.id} style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>
              {ev.title} <span style={{ color: s.text3 }}>{formatTime(ev.start)} {ev.duration}m</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 10, fontSize: 10, color: s.text3 }}>Overlap rule: max(start) &lt; min(end). Suggestion engine scans 15-min slots from 7am, picks first N that fit without overlap. Real systems use interval trees + roaring bitmaps for 100k events.</div>
      </div>
    </DemoBoundary>
  )
}
