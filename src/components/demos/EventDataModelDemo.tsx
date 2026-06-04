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

const ATTENDEE_POOL = ['alice@google.com', 'bob@google.com', 'carol@acme.com', 'dave@acme.com', 'eve@google.com', 'frank@partner.io']
const SAMPLE_EVENTS = [
  { t: 'Q3 Planning Sync', s: '2026-06-12T10:00', e: '2026-06-12T11:00', l: 'Building 42, Floor 3' },
  { t: '1:1 with manager', s: '2026-06-13T09:30', e: '2026-06-13T09:45', l: 'Zoom' },
  { t: 'All hands', s: '2026-06-15T14:00', e: '2026-06-15T15:00', l: 'Auditorium' },
]

export default function EventDataModelDemo() {
  const [title, setTitle] = useState('Q3 Planning Sync')
  const [start, setStart] = useState('2026-06-12T10:00')
  const [end, setEnd] = useState('2026-06-12T11:00')
  const [location, setLocation] = useState('Building 42, Floor 3')
  const [recurrence, setRecurrence] = useState('')
  const [attendees, setAttendees] = useState<string[]>(['alice@google.com', 'bob@google.com'])
  const [showNorm, setShowNorm] = useState(false)
  const [selectedSample, setSelectedSample] = useState(0)

  const eventDoc = useMemo(() => ({
    id: 'evt_9f8a2c1b',
    calendarId: 'cal_u_7e3b9d',
    summary: title,
    start: { dateTime: start + ':00-04:00', timeZone: 'America/New_York' },
    end: { dateTime: end + ':00-04:00', timeZone: 'America/New_York' },
    location,
    attendees: attendees.map(e => ({ email: e, responseStatus: 'needsAction' })),
    recurrence: recurrence ? [recurrence] : undefined,
    transparency: 'opaque',
    visibility: 'default',
    created: '2026-05-20T14:22:00Z',
    updated: '2026-05-23T09:41:00Z',
  }), [title, start, end, location, attendees, recurrence])

  const addAttendee = () => {
    const next = ATTENDEE_POOL.find(e => !attendees.includes(e))
    if (next) setAttendees([...attendees, next])
  }

  const toggleAttendee = (email: string) => {
    if (attendees.includes(email)) setAttendees(attendees.filter(e => e !== email))
    else if (attendees.length < 5) setAttendees([...attendees, email])
  }

  const makeRecurring = () => setRecurrence('FREQ=WEEKLY;BYDAY=FR;COUNT=12')

  const doNormalize = () => setShowNorm(true)

  const loadSample = (i: number) => {
    const sm = SAMPLE_EVENTS[i]
    setTitle(sm.t); setStart(sm.s); setEnd(sm.e); setLocation(sm.l); setRecurrence(''); setAttendees(['alice@google.com']); setShowNorm(false); setSelectedSample(i)
  }

  const json = JSON.stringify(eventDoc, null, 2)

  return (
    <DemoBoundary name="Event Data Model">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Document model vs normalized rows</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {SAMPLE_EVENTS.map((_, i) => <button key={i} onClick={() => loadSample(i)} style={{ background: selectedSample === i ? s.accent : s.bg3, color: selectedSample === i ? '#fff' : s.text2, border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer' }}>Sample {i + 1}</button>)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 1fr', gap: 12 }}>
          <div style={{ background: s.bg, borderRadius: 8, padding: 12, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 8, fontWeight: 600 }}>EVENT FORM (DOCUMENT)</div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" style={{ width: '100%', background: s.bg2, border: `1px solid ${s.border}`, color: s.text, borderRadius: 4, padding: '6px 8px', fontSize: 12, marginBottom: 6 }} />
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} style={{ flex: 1, background: s.bg2, border: `1px solid ${s.border}`, color: s.text, borderRadius: 4, padding: '4px 6px', fontSize: 11 }} />
              <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} style={{ flex: 1, background: s.bg2, border: `1px solid ${s.border}`, color: s.text, borderRadius: 4, padding: '4px 6px', fontSize: 11 }} />
            </div>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" style={{ width: '100%', background: s.bg2, border: `1px solid ${s.border}`, color: s.text, borderRadius: 4, padding: '6px 8px', fontSize: 12, marginBottom: 6 }} />
            <div style={{ fontSize: 10, color: s.text3, marginBottom: 4 }}>RECURRENCE</div>
            <input value={recurrence} onChange={e => setRecurrence(e.target.value)} placeholder="RRULE or empty" style={{ width: '100%', background: s.bg2, border: `1px solid ${s.border}`, color: s.text, borderRadius: 4, padding: '4px 6px', fontSize: 11, fontFamily: s.mono, marginBottom: 8 }} />

            <div style={{ fontSize: 10, color: s.text3, marginBottom: 4 }}>ATTENDEES ({attendees.length}/5)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
              {ATTENDEE_POOL.map(e => (
                <div key={e} onClick={() => toggleAttendee(e)} style={{ background: attendees.includes(e) ? s.accent : s.bg3, color: attendees.includes(e) ? '#fff' : s.text2, fontSize: 10, padding: '2px 7px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${attendees.includes(e) ? s.accent : s.border}` }}>{e.split('@')[0]}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={addAttendee} style={{ flex: 1, background: s.bg3, border: `1px solid ${s.border}`, color: s.text2, borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Add random</button>
              <button onClick={makeRecurring} style={{ flex: 1, background: s.bg3, border: `1px solid ${s.border}`, color: s.text2, borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Make weekly</button>
              <button onClick={doNormalize} style={{ flex: 1, background: s.green, border: 'none', color: '#000', borderRadius: 4, padding: '4px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Normalize</button>
            </div>
          </div>

          <div style={{ background: s.bg, borderRadius: 8, padding: 10, border: `1px solid ${s.border}`, fontSize: 10, overflow: 'auto', maxHeight: 240 }}>
            <div style={{ fontSize: 10, color: s.text3, marginBottom: 4, fontWeight: 600 }}>LIVE DOCUMENT (JSON)</div>
            <pre style={{ margin: 0, fontFamily: s.mono, color: s.text2, fontSize: 9, lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>{json}</pre>
          </div>

          <div style={{ background: s.bg, borderRadius: 8, padding: 10, border: `1px solid ${s.border}`, fontSize: 10 }}>
            <div style={{ fontSize: 10, color: s.text3, marginBottom: 4, fontWeight: 600 }}>NORMALIZED RELATIONAL</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: s.accent, fontWeight: 600, fontSize: 9 }}>CALENDARS</div>
              <div style={{ fontFamily: s.mono, fontSize: 9, color: s.text2, background: s.bg2, padding: '3px 6px', borderRadius: 3 }}>cal_u_7e3b9d | owner: u_42 | tz: America/New_York</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: s.green, fontWeight: 600, fontSize: 9 }}>EVENTS (FK → calendars.id)</div>
              <div style={{ fontFamily: s.mono, fontSize: 9, color: s.text2, background: s.bg2, padding: '3px 6px', borderRadius: 3 }}>evt_9f8a2c1b | cal_u_7e3b9d | {title.slice(0,18)} | {start}</div>
            </div>
            <div>
              <div style={{ color: s.orange, fontWeight: 600, fontSize: 9 }}>EVENT_ATTENDEES (join)</div>
              {attendees.map((e, i) => (
                <div key={i} style={{ fontFamily: s.mono, fontSize: 9, color: s.text2, background: s.bg2, padding: '2px 5px', borderRadius: 2, marginTop: 2 }}>evt_9f8a2c1b | {e} | needsAction</div>
              ))}
            </div>
            {showNorm && <div style={{ marginTop: 8, fontSize: 9, color: s.yellow }}>FKs (calendar_id, event_id) enable joins but we denormalize attendee list into event doc for single-read queries at 500k QPS.</div>}
          </div>
        </div>

        <div style={{ fontSize: 10, color: s.text3, marginTop: 10, lineHeight: 1.4 }}>
          One JSON write fans out to 3+ tables. Reads hit the document store (Spanner/Firestore) with embedded attendees. Denormalization trades write cost for read latency. 5B events/day means 95%+ of reads must be single-shard.
        </div>
      </div>
    </DemoBoundary>
  )
}
