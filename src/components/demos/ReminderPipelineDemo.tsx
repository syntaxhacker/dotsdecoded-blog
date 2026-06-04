import { useState, useEffect, useCallback, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const STAGES = [
  { id: 'saved', label: 'Event Saved', sub: 'Trigger' },
  { id: 'validate', label: 'Validate', sub: 'Schema + Opt-in' },
  { id: 'fanout', label: 'Fanout', sub: 'Email | Push | In-App' },
  { id: 'dedup', label: 'Dedup Check', sub: 'Key: (uid,evt,time)' },
  { id: 'deliver', label: 'Deliver', sub: 'Provider + Retry' },
]

export default function ReminderPipelineDemo() {
  const [step, setStep] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [log, setLog] = useState<string[]>([])
  const [enableDedup, setEnableDedup] = useState(true)
  const [emailFail, setEmailFail] = useState(false)
  const [metrics, setMetrics] = useState<Record<string, { q: number; lat: number; ok: number }>>({})
  const [channelStats, setChannelStats] = useState({ email: 1, push: 1, inapp: 1, retries: 0 })
  const [totalDelivered, setTotalDelivered] = useState(0)
  const rate = useMemo(() => Math.round((totalDelivered / Math.max(1, channelStats.retries + 1)) * 100) / 100, [totalDelivered, channelStats])

  const stop = useCallback(() => {
    setIsPlaying(false)
    setStep(-1)
    setMetrics({})
  }, [])

  const start = useCallback(() => {
    if (isPlaying) { stop(); return }
    const now = new Date()
    const t0 = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`
    setLog([`${t0} Create event with 3 reminders`])
    setStep(0)
    setIsPlaying(true)
    setChannelStats({ email: 1, push: 1, inapp: 1, retries: 0 })
    setTotalDelivered(0)
    setMetrics({ saved: { q: 3, lat: 4, ok: 1 }, validate: { q: 3, lat: 12, ok: 1 }, fanout: { q: 9, lat: 28, ok: 3 }, dedup: { q: 2, lat: 3, ok: 3 }, deliver: { q: 1, lat: 67, ok: 3 } })
  }, [isPlaying, stop])

  useEffect(() => {
    if (!isPlaying || step < 0) return
    if (step >= STAGES.length) { setIsPlaying(false); return }
    const delay = getStepDelay(step === 2 ? 420 : 680, speed)
    const t = setTimeout(() => {
      const st = STAGES[step]
      const now = new Date()
      const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`
      let msg = `${ts} ${st.label}`
      if (step === 2) msg += ` → 3 channels`
      if (step === 3 && enableDedup) msg += ` (deduped 1)`
      if (step === 4 && emailFail) msg += ` email fail → retry 200ms`
      setLog(l => [...l.slice(-7), msg])
      if (step === 2) setChannelStats(c => ({ ...c, email: 1, push: 1, inapp: 1 }))
      if (step === 3 && enableDedup) setChannelStats(c => ({ ...c, push: 0 }))
      if (step === 4) {
        const okc = emailFail ? 2 : 3
        setMetrics(m => ({ ...m, deliver: { q: 0, lat: emailFail ? 210 : 67, ok: okc } }))
        setChannelStats(c => ({ ...c, email: emailFail ? 0 : 1, retries: emailFail ? 1 : 0 }))
        setTotalDelivered(okc)
        setTimeout(() => { setIsPlaying(false); setStep(-1) }, 300)
      } else {
        setStep(s => s + 1)
        if (step === 3) setMetrics(m => ({ ...m, dedup: { q: enableDedup ? 0 : 1, lat: 3, ok: 3 } }))
      }
    }, delay)
    return () => clearTimeout(t)
  }, [isPlaying, step, speed, enableDedup, emailFail])

  const replay = () => { stop(); setTimeout(start, 80) }

  const snooze = () => {
    const now = new Date()
    const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`
    setLog(l => [...l.slice(-7), `${ts} User snoozed 10min → new delayed tuple enqueued`])
    setTotalDelivered(d => Math.max(0, d - 1))
    setChannelStats(c => ({ ...c, retries: c.retries + 1 }))
  }

  return (
    <DemoBoundary name="Reminder Pipeline">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <button onClick={start} style={{ background: isPlaying ? s.red : s.green, color: isPlaying ? '#fff' : '#000', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{isPlaying ? 'Stop' : 'Create Event with 3 Reminders'}</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          <button onClick={replay} disabled={!log.length} style={{ fontSize: 11, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>Replay at 2x</button>
          <button onClick={snooze} disabled={!log.length} style={{ fontSize: 11, background: s.yellow, color: '#000', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>Snooze +10m</button>
        </div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {STAGES.map((st, i) => {
            const active = i === step
            const done = i < step
            return (
              <div key={i} style={{ flex: 1, background: active ? s.accent : (done ? s.bg3 : s.bg), border: `1px solid ${active ? s.accent : s.border}`, borderRadius: 6, padding: 8, textAlign: 'center', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 11, color: active || done ? s.text : s.text3 }}>{st.label}</div>
                <div style={{ fontSize: 9, color: s.text3 }}>{st.sub}</div>
                {metrics[st.id] && <div style={{ fontSize: 9, color: s.green, marginTop: 2 }}>q={metrics[st.id].q} {metrics[st.id].lat}ms ok={metrics[st.id].ok}</div>}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
            <input type="checkbox" checked={enableDedup} onChange={() => setEnableDedup(!enableDedup)} /> Enable dedup across channels
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
            <input type="checkbox" checked={emailFail} onChange={() => setEmailFail(!emailFail)} /> Simulate email failure → retry
          </label>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 10, color: s.text3, alignSelf: 'center' }}>Delivered: <span style={{ color: s.green, fontFamily: s.mono }}>{totalDelivered}</span> rate {rate}</div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {['email', 'push', 'inapp'].map(ch => (
            <div key={ch} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 10 }}>
              <span style={{ color: s.text3 }}>{ch}</span> <span style={{ color: s.green, fontFamily: s.mono }}>{(channelStats as any)[ch]}</span>
            </div>
          ))}
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 10 }}>
            retries <span style={{ color: s.orange, fontFamily: s.mono }}>{channelStats.retries}</span>
          </div>
        </div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: 8, height: 92, overflowY: 'auto', fontFamily: s.mono, fontSize: 11, color: s.text2 }}>
          {log.length === 0 && <div style={{ color: s.text3 }}>Log will appear here during playback...</div>}
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>

        <div style={{ marginTop: 10, fontSize: 10, color: s.text3 }}>Pipeline uses exactly-once Kafka fanout + (user,event,fire) dedup key. Failures go to retry queue with exp backoff 1s/5s/30s. 3 channels still count as 1 delivery for the user. Snooze creates new delayed tuple in the same topic. Regional outage just delays; nothing is lost because the sweep + queue is durable.</div>
      </div>
    </DemoBoundary>
  )
}
