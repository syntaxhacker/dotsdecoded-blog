import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const STAGES = [
  { id: 'gmail', label: 'Gmail Smart Chip', sub: 'Schedule?', detail: 'Email body parsed by ML → "Schedule meeting?" chip. Click opens Calendar composer with attendees + time pre-filled from email context.' },
  { id: 'calendar', label: 'Calendar Service', sub: 'Create + ETag', detail: 'POST /calendars/primary/events with {attendees, start, summary}. Returns 201 + eventId + ETag for optimistic locking on future edits.' },
  { id: 'freebusy', label: 'FreeBusy Lookup', sub: 'Parallel query', detail: 'Fan-out to every attendee\'s free/busy (internal + external iCal subs). 3 attendees = 3 parallel sub-queries aggregated in <60ms.' },
  { id: 'meet', label: 'Auto Meet Room', sub: 'ConferenceData', detail: 'If >2 attendees or external domain → auto-create Meet space via conferenceData API. Link injected into description + Hangouts link field.' },
  { id: 'ics', label: 'ICS + Drive + Reply', sub: 'Attachment', detail: 'Generate .ics, upload to Drive "Meetings" folder, post reply in Gmail thread with interactive event card (RSVP buttons, time, Meet link).' },
]

const EXTERNAL = [
  { id: 'poll', label: 'Poll every 15m', desc: 'Calendar server polls external iCal feed. On 304 nothing changes. On 200 diff is merged into per-user free/busy bitmap.' },
  { id: 'webhook', label: 'Push Webhook', desc: 'External posts {"changed": ["uid"]} to /webhooks/ical/{secret}. Immediate invalidate + recompute for that user only.' },
]

const PAYLOADS: Record<string, string> = {
  gmail: 'POST /calendar/createFromEmail\n{ emailId: "18c4f...", attendees: ["bob@ext.com"], suggested: "2026-06-12 14:00" }',
  calendar: 'POST /events\n{ "summary": "Q4 sync", "start": "2026-06-12T14:00:00Z", "attendees": [{"email":"alice@co"}, {"email":"bob@ext.com"}] }',
  freebusy: 'GET /freeBusy?users=alice,bob,carol\n→ 200 { "alice": {"busy": [...]}, "bob": {"busy": [...] } }',
  meet: 'PATCH /events/evt_9x3k\n{ "conferenceData": { "createRequest": { "conferenceSolutionKey": { "type": "hangoutsMeet" } } } }',
  ics: 'PUT /drive/v3/files/ics_77\nContent-Type: text/calendar\n...BEGIN:VCALENDAR...',
}

export default function GoogleIntegrationDemo() {
  const [step, setStep] = useState(-1)
  const [showExternal, setShowExternal] = useState(false)
  const [extMode, setExtMode] = useState<'poll' | 'webhook'>('poll')
  const [finalState, setFinalState] = useState('')
  const [showPayload, setShowPayload] = useState(false)

  const run = () => {
    setStep(0)
    setFinalState('')
    setShowPayload(false)
    const advance = (i: number) => {
      if (i >= STAGES.length) {
        setFinalState('Event now visible in Gmail thread, Calendar, and Meet. .ics stored in Drive. All 3 calendars (primary + 2 external) show the block.')
        return
      }
      setStep(i)
      setTimeout(() => advance(i + 1), 580)
    }
    advance(0)
  }

  const clickStage = (i: number) => {
    setStep(i)
    setShowPayload(true)
  }

  return (
    <DemoBoundary name="Google Ecosystem Integration">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button onClick={run} style={{ background: s.green, color: '#000', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>Simulate Gmail Smart Chip → Full Sync</button>
          <button onClick={() => setShowExternal(!showExternal)} style={{ background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>{showExternal ? 'Hide' : 'Show'} External iCal Sync</button>
          <button onClick={() => setShowPayload(!showPayload)} style={{ background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Toggle Payloads</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: s.text2, cursor: 'pointer' }}><input type="checkbox" onChange={e => { if (e.target.checked) { setStep(2); setShowPayload(true) } }} /> External attendee</label>
        </div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12 }}>
          <div style={{ color: s.text3, fontSize: 10, marginBottom: 4 }}>From: carol@partner.com — To: alice@co, bob@ext.com</div>
          <div style={{ color: s.text2 }}>Can we sync on Q4 planning next week? I have budget numbers ready.</div>
          <div onClick={run} style={{ display: 'inline-block', marginTop: 8, background: 'rgba(91,141,239,0.2)', border: `1px solid ${s.accent}`, borderRadius: 4, padding: '3px 8px', fontSize: 11, color: s.accent, cursor: 'pointer' }}>📅 Schedule meeting?</div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {STAGES.map((st, i) => (
            <div key={i} onClick={() => clickStage(i)} style={{ flex: 1, background: step === i ? 'rgba(91,141,239,0.15)' : s.bg, border: `1px solid ${step === i ? s.accent : s.border}`, borderRadius: 6, padding: 7, cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ fontSize: 11, color: step === i ? s.accent : s.text, fontWeight: 600 }}>{st.label}</div>
              <div style={{ fontSize: 9, color: s.text3 }}>{st.sub}</div>
            </div>
          ))}
        </div>

        {step >= 0 && STAGES[step] && (
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: 10, marginBottom: 10, fontSize: 12, color: s.text2 }}>
            <div style={{ color: s.accent, marginBottom: 4, fontWeight: 600 }}>{STAGES[step].label} — {STAGES[step].sub}</div>
            {STAGES[step].detail}
            {showPayload && PAYLOADS[STAGES[step].id] && <pre style={{ marginTop: 8, background: s.bg2, padding: 8, fontSize: 10, fontFamily: s.mono, color: s.yellow, overflowX: 'auto' }}>{PAYLOADS[STAGES[step].id]}</pre>}
          </div>
        )}

        {showExternal && (
          <div style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: 10, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              {EXTERNAL.map(m => (
                <button key={m.id} onClick={() => setExtMode(m.id as any)} style={{ background: extMode === m.id ? s.accent : s.bg, color: s.text, border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>{m.label}</button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: s.text2 }}>{EXTERNAL.find(m => m.id === extMode)?.desc}</div>
            <div style={{ fontSize: 10, color: s.text3, marginTop: 4 }}>Webhook path is used by corporate Exchange/Office 365 tenants. Poll path is fallback for consumer iCloud / Outlook.com. Both feed the same free/busy aggregator that Calendar uses for scheduling suggestions.</div>
            <div style={{ marginTop: 6, fontSize: 10, color: s.yellow }}>Live: {extMode === 'webhook' ? 'Push received 40ms ago — free/busy refreshed' : 'Next poll in 11m 40s'}</div>
          </div>
        )}

        {finalState && <div style={{ fontSize: 12, color: s.green, background: 'rgba(61,214,140,0.08)', border: `1px solid ${s.green}`, borderRadius: 6, padding: 8, marginBottom: 8 }}>{finalState}</div>}

        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 10 }}>Gmail thread: <span style={{ color: s.green }}>event card + RSVP</span></div>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 10 }}>Calendar: <span style={{ color: s.accent }}>primary + 2 shared</span></div>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 10 }}>Meet: <span style={{ color: s.purple }}>auto room link</span></div>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 10 }}>Drive: <span style={{ color: s.orange }}>.ics + notes</span></div>
        </div>

        <button onClick={() => { setStep(2); setShowExternal(true); setExtMode('webhook') }} style={{ marginTop: 6, background: s.orange, color: '#000', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 10, cursor: 'pointer' }}>Simulate external iCal webhook arrival (live update)</button>

        <div style={{ marginTop: 10, fontSize: 10, color: s.text3 }}>All five systems (Gmail, Calendar, Meet, Drive, external iCal) converge on the same event object via pub/sub + webhooks. The smart chip is a client-side suggestion that re-uses the exact same backend path as a manual create, guaranteeing consistency. Free/busy is the single source of truth that makes cross-product scheduling possible. External iCal changes (poll or webhook) immediately affect availability for the next scheduling suggestion. Click any stage header to see the exact RPC payload that service receives.</div>
      </div>
    </DemoBoundary>
  )
}
