import { useState, useEffect, useRef, useCallback } from 'react'
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

type Phase = 'idle' | 'processing' | 'acknowledged' | 'complete'

interface TimelineEntry {
  time: number
  label: string
  color: string
}

export default function SyncAsyncDemo() {
  const [syncPhase, setSyncPhase] = useState<Phase>('idle')
  const [asyncPhase, setAsyncPhase] = useState<Phase>('idle')
  const [syncProgress, setSyncProgress] = useState(0)
  const [syncTimeline, setSyncTimeline] = useState<TimelineEntry[]>([])
  const [asyncTimeline, setAsyncTimeline] = useState<TimelineEntry[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [speed, setSpeed] = useState(1)
  const startTimeRef = useRef(0)
  const rafRef = useRef(0)

  const reset = useCallback(() => {
    setSyncPhase('idle')
    setAsyncPhase('idle')
    setSyncProgress(0)
    setSyncTimeline([])
    setAsyncTimeline([])
    setRunning(false)
    setDone(false)
    cancelAnimationFrame(rafRef.current)
  }, [])

  const start = useCallback(() => {
    reset()
    setRunning(true)
    startTimeRef.current = performance.now()
    setSyncPhase('processing')
    setAsyncPhase('acknowledged')

    const now = performance.now() - startTimeRef.current
    setAsyncTimeline([{ time: 0, label: 'Request sent', color: s.accent }])
    setSyncTimeline([{ time: 0, label: 'Request sent', color: s.accent }])
  }, [reset])

  useEffect(() => {
    if (!running) return

    const tick = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000
      const syncDuration = 5
      const ackTime = 0.1
      const asyncCompleteTime = 5.2

      setSyncProgress(Math.min(elapsed / syncDuration, 1))

      if (elapsed >= syncDuration && syncPhase !== 'complete') {
        setSyncPhase('complete')
        setSyncTimeline((prev) => [...prev, { time: syncDuration, label: 'Response received (5.0s)', color: s.green }])
      }

      if (elapsed >= ackTime && asyncPhase === 'acknowledged') {
        setAsyncPhase('processing')
        setAsyncTimeline((prev) => [...prev, { time: ackTime, label: 'Acknowledged (0.1s)', color: s.green }])
      }

      if (elapsed >= asyncCompleteTime && asyncPhase !== 'complete') {
        setAsyncPhase('complete')
        setAsyncTimeline((prev) => [...prev, { time: asyncCompleteTime, label: 'Result delivered (5.2s)', color: s.green }])
        setDone(true)
        setRunning(false)
      }

      if (running) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running, syncPhase, asyncPhase])

  const renderPanel = (
    title: string,
    phase: Phase,
    progress: number,
    timeline: TimelineEntry[],
    color: string,
  ) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '8px 14px',
          borderBottom: `1px solid ${s.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: phase === 'processing' ? color : phase === 'complete' ? s.green : s.text3,
          }} />
          <span style={{ fontFamily: s.mono, fontSize: 12, fontWeight: 600, color: s.text }}>{title}</span>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{
              height: 6, borderRadius: 3, background: s.bg3, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: phase === 'processing' ? color : phase === 'complete' ? s.green : s.bg3,
                width: `${progress * 100}%`,
                transition: phase === 'processing' ? 'width 0.1s linear' : 'none',
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginTop: 6,
              fontFamily: s.mono, fontSize: 10, color: s.text3,
            }}>
              <span>{phase === 'idle' ? 'Ready' : phase === 'processing' ? `Processing... ${Math.round(progress * 100)}%` : phase === 'acknowledged' ? 'Acknowledged — free to do other work' : 'Done'}</span>
              <span>{phase === 'complete' || phase === 'acknowledged' ? 'Caller free' : 'Caller blocked'}</span>
            </div>
          </div>

          {phase === 'acknowledged' && (
            <div style={{
              padding: '10px 12px', borderRadius: 6, background: `${s.green}10`,
              border: `1px solid ${s.green}30`, marginBottom: 12,
            }}>
              <div style={{ fontSize: 12, color: s.green, fontWeight: 600, marginBottom: 4 }}>Acknowledged</div>
              <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.4 }}>
                The caller got a confirmation and can move on. The result will arrive later via a callback or notification.
              </div>
            </div>
          )}

          {phase === 'processing' && (
            <div style={{
              padding: '10px 12px', borderRadius: 6, background: `${color}10`,
              border: `1px solid ${color}30`, marginBottom: 12,
            }}>
              <div style={{ fontSize: 12, color, fontWeight: 600, marginBottom: 4 }}>Blocked</div>
              <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.4 }}>
                The caller is waiting. No other work can happen until the response comes back.
              </div>
            </div>
          )}

          {timeline.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 2 }}>TIMELINE</div>
              {timeline.map((entry, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 8, alignItems: 'center',
                  fontFamily: s.mono, fontSize: 10,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', background: entry.color, flexShrink: 0,
                  }} />
                  <span style={{ color: s.text3, width: 42, flexShrink: 0 }}>{entry.time.toFixed(1)}s</span>
                  <span style={{ color: s.text2 }}>{entry.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <DemoBoundary name="Sync vs Async">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {renderPanel('Synchronous', syncPhase, syncProgress, syncTimeline, s.red)}
          {renderPanel('Asynchronous', asyncPhase, syncProgress, asyncTimeline, s.accent)}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center',
        }}>
          <button
            onClick={done || running ? start : start}
            disabled={running}
            style={{
              padding: '8px 28px',
              background: running ? s.bg3 : s.accent,
              color: running ? s.text3 : '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: running ? 'not-allowed' : 'pointer',
              fontFamily: s.mono,
              transition: 'all 0.2s',
            }}
          >
            {done ? 'Replay' : running ? 'Running...' : 'Process'}
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
      </div>
    </DemoBoundary>
  )
}
