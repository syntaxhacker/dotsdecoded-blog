import { useState, useEffect, useRef, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

type SyncMode = 'none' | 'channel' | 'mutex'

interface TimelineEvent {
  time: number
  goroutine: 'G1' | 'G2'
  action: string
  detail: string
}

export default function GoMemoryModelDemo() {
  const [mode, setMode] = useState<SyncMode>('none')
  const [phase, setPhase] = useState<'idle' | 'animating' | 'done'>('idle')
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [dataRace, setDataRace] = useState(false)
  const [happensBefore, setHappensBefore] = useState<{ from: number; to: number } | null>(null)
  const [sharedValue, setSharedValue] = useState<{ g1: number | null; g2: number | null }>({ g1: null, g2: null })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const runSimulation = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPhase('animating')
    setEvents([])
    setDataRace(false)
    setHappensBefore(null)
    setSharedValue({ g1: null, g2: null })

    const timeline: TimelineEvent[] = []
    let time = 0
    let step = 0

    if (mode === 'none') {
      timeline.push(
        { time: time++, goroutine: 'G1', action: 'Write x = 42', detail: 'G1 stores 42 to variable x' },
        { time: time++, goroutine: 'G2', action: 'Read x', detail: 'G2 reads variable x (no synchronization)' },
        { time: time++, goroutine: 'G2', action: 'Result: unknown', detail: 'Without sync, G2 might see 0, 42, or garbage (DATA RACE)' },
      )
    } else if (mode === 'channel') {
      timeline.push(
        { time: time++, goroutine: 'G1', action: 'Write x = 42', detail: 'G1 stores 42 to variable x' },
        { time: time++, goroutine: 'G1', action: 'ch <- 1 (send)', detail: 'G1 sends on channel — happens-before point' },
        { time: time++, goroutine: 'G2', action: '<-ch (recv)', detail: 'G2 receives from channel — synchronizes with G1' },
        { time: time++, goroutine: 'G2', action: 'Read x = 42', detail: 'G2 reads x, guaranteed to see 42 (happens-before)' },
      )
    } else {
      timeline.push(
        { time: time++, goroutine: 'G1', action: 'mu.Lock()', detail: 'G1 acquires mutex — enters critical section' },
        { time: time++, goroutine: 'G1', action: 'Write x = 42', detail: 'G1 stores 42 to variable x inside critical section' },
        { time: time++, goroutine: 'G1', action: 'mu.Unlock()', detail: 'G1 releases mutex — happens-before point' },
        { time: time++, goroutine: 'G2', action: 'mu.Lock()', detail: 'G2 acquires mutex — synchronizes with G1 unlock' },
        { time: time++, goroutine: 'G2', action: 'Read x = 42', detail: 'G2 reads x inside critical section, sees 42' },
        { time: time++, goroutine: 'G2', action: 'mu.Unlock()', detail: 'G2 releases mutex' },
      )
    }

    intervalRef.current = setInterval(() => {
      if (step >= timeline.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (mode === 'none') {
          setDataRace(true)
        }
        setPhase('done')
        return
      }

      const evt = timeline[step]
      setEvents(prev => [...prev, evt])

      if (evt.action.includes('Write')) {
        setSharedValue(prev => ({ ...prev, g1: 42 }))
      } else if (evt.action.includes('Read x = 42')) {
        setSharedValue(prev => ({ ...prev, g2: 42 }))
      } else if (evt.action.includes('Read x')) {
        setSharedValue(prev => ({ ...prev, g2: 0 }))
      }

      if (evt.detail.includes('happens-before') && mode === 'channel') {
        setHappensBefore({ from: step - 1, to: step })
      }
      if (evt.detail.includes('synchronizes') && mode === 'mutex') {
        setHappensBefore({ from: step - 2, to: step })
      }

      step++
    }, 800)
  }, [mode])

  const resetAll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPhase('idle')
    setEvents([])
    setDataRace(false)
    setHappensBefore(null)
    setSharedValue({ g1: null, g2: null })
  }, [])

  return (
    <DemoBoundary name="Memory Model">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Happens-Before & Memory Model</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Go's memory model defines when a write in one goroutine is guaranteed to be visible to a read in another.
          Without synchronization you have a data race. Channels, mutexes, and other sync primitives establish happens-before edges.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {([
            { id: 'none' as SyncMode, label: 'Data Race (no sync)' },
            { id: 'channel' as SyncMode, label: 'Channel Sync' },
            { id: 'mutex' as SyncMode, label: 'Mutex Sync' },
          ]).map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); resetAll() }} style={{
              background: mode === m.id ? s.accent : s.bg3,
              border: `1px solid ${mode === m.id ? s.accent : s.border}`,
              borderRadius: 8, padding: '8px 16px',
              color: mode === m.id ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
              flex: 1,
            }}>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ background: s.bg, border: `1px solid ${dataRace ? s.red : s.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Shared Variable x</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.orange }} />
                <span style={{ color: s.text2, fontSize: 11 }}>G1 write: {sharedValue.g1 !== null ? sharedValue.g1 : '-'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.accent }} />
                <span style={{ color: s.text2, fontSize: 11 }}>G2 read: {sharedValue.g2 !== null ? sharedValue.g2 : '-'}</span>
              </div>
            </div>
          </div>
          {dataRace && (
            <div style={{
              background: `${s.red}22`, border: `1px solid ${s.red}`, borderRadius: 6,
              padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.red }} />
              <span style={{ color: s.red, fontSize: 12, fontWeight: 600 }}>
                DATA RACE DETECTED: G1 writes and G2 read without synchronization
              </span>
            </div>
          )}
          {happensBefore && (
            <div style={{
              background: `${s.green}22`, border: `1px solid ${s.green}`, borderRadius: 6,
              padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, marginTop: 8,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green }} />
              <span style={{ color: s.green, fontSize: 12, fontWeight: 600 }}>
                Happens-Before edge: G1's write is visible to G2's read
              </span>
            </div>
          )}
        </div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Timeline
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 40, top: 0, bottom: 0,
              width: 2, background: s.border,
            }} />
            {events.length === 0 && (
              <span style={{ color: s.text3, fontSize: 11 }}>No events. Press "Run Simulation" to start.</span>
            )}
            {events.map((evt, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8, position: 'relative', alignItems: 'flex-start' }}>
                <div style={{
                  width: 24, textAlign: 'right', fontSize: 10, color: s.text3,
                  fontFamily: s.mono, paddingTop: 2, flexShrink: 0,
                }}>
                  t{evt.time}
                </div>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: evt.goroutine === 'G1' ? s.orange : s.accent,
                  border: `2px solid ${s.bg}`,
                  zIndex: 1, flexShrink: 0, marginTop: 4,
                }} />
                <div style={{
                  background: s.bg2, borderRadius: 6, padding: '6px 10px',
                  flex: 1, border: `1px solid ${s.border}`,
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 10, fontFamily: s.mono, fontWeight: 600,
                      color: evt.goroutine === 'G1' ? s.orange : s.accent,
                    }}>
                      {evt.goroutine}
                    </span>
                    <span style={{ fontSize: 12, color: s.text, fontFamily: s.mono }}>
                      {evt.action}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: s.text2, marginTop: 2 }}>
                    {evt.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {phase === 'idle' ? (
            <button onClick={runSimulation} style={{
              background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
            }}>Run Simulation</button>
          ) : (
            <button onClick={resetAll} style={{
              background: s.red, border: 'none', borderRadius: 8, padding: '10px 20px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
            }}>Reset</button>
          )}
        </div>

        <div style={{ marginTop: 12, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Memory Model Rules</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Channel', desc: 'A send on a channel happens-before the corresponding receive from that channel completes', color: s.accent },
              { label: 'Mutex', desc: 'An Unlock() on a mutex happens-before any subsequent Lock() on the same mutex', color: s.purple },
              { label: 'Once', desc: 'A call to Once.Do(f) returns before any other call to Once.Do(f) returns', color: s.green },
              { label: 'Goroutine', desc: 'The go statement that starts a goroutine happens-before the goroutine begins executing', color: s.yellow },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 70 }}>{item.label}</span>
                <span style={{ color: s.text2, fontSize: 12 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
