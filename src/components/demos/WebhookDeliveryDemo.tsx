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

type StepPhase = 'idle' | 'queued' | 'delivering' | 'success' | 'retrying' | 'dlq'

interface DeliveryStep {
  attempt: number
  status: 'pending' | 'sending' | 'success' | 'failed'
  label: string
}

const backoffSchedule = [1, 5, 15, 60, 360, 1440]

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }

export default function WebhookDeliveryDemo() {
  const [phase, setPhase] = useState<StepPhase>('idle')
  const [currentAttempt, setCurrentAttempt] = useState(0)
  const [steps, setSteps] = useState<DeliveryStep[]>([])
  const [inFlight, setInFlight] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [autoMode, setAutoMode] = useState(false)
  const [eventId, setEventId] = useState('evt_001')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepRef = useRef(0)
  const stepsRef = useRef<DeliveryStep[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [steps])

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase('idle')
    setCurrentAttempt(0)
    setSteps([])
    setInFlight(false)
    setAutoMode(false)
    stepRef.current = 0
    stepsRef.current = []
  }, [])

  const addStep = useCallback((st: DeliveryStep) => {
    stepsRef.current = [...stepsRef.current, st]
    setSteps(stepsRef.current)
  }, [])

  const simulateAttempt = useCallback((attemptNum: number) => {
    const attempt = attemptNum + 1
    addStep({ attempt, status: 'sending', label: `Attempt #${attempt}: POST to https://api.client.com/webhooks` })
    setPhase('delivering')
    setCurrentAttempt(attempt)

    const delay = getStepDelay(600, speed)
    timerRef.current = setTimeout(() => {
      const succeeds = attempt <= 3 ? false : true
      if (succeeds) {
        addStep({ attempt, status: 'success', label: `Attempt #${attempt}: 200 OK -- delivered` })
        setPhase('success')
        setInFlight(false)
        setAutoMode(false)
      } else {
        const backoffMin = backoffSchedule[attempt - 1] || 1440
        addStep({ attempt, status: 'failed', label: `Attempt #${attempt}: 503 Service Unavailable` })
        const nextAttempt = attemptNum + 1
        if (nextAttempt >= 6) {
          addStep({ attempt: nextAttempt, status: 'failed', label: `Max retries exceeded. Event moved to Dead Letter Queue.` })
          setPhase('dlq')
          setInFlight(false)
          setAutoMode(false)
        } else {
          const nextBackoff = backoffSchedule[nextAttempt - 1] || 1440
          addStep({ attempt: nextAttempt, status: 'pending', label: `Backoff ${backoffMin}min -> retry in ${nextBackoff}min (attempt #${nextAttempt + 1})` })
          setPhase('retrying')
          stepRef.current = nextAttempt
          if (autoMode) {
            const retryDelay = getStepDelay(800, speed)
            timerRef.current = setTimeout(() => simulateAttempt(nextAttempt), retryDelay)
          } else {
            setInFlight(false)
          }
        }
      }
    }, delay)
  }, [speed, autoMode, addStep])

  const startDelivery = () => {
    reset()
    setInFlight(true)
    setAutoMode(true)
    addStep({ attempt: 1, status: 'pending', label: 'Event received. Enqueued for delivery.' })
    setPhase('queued')
    timerRef.current = setTimeout(() => {
      simulateAttempt(0)
    }, getStepDelay(400, speed))
  }

  const retryNow = () => {
    if (phase === 'retrying' && !inFlight) {
      setInFlight(true)
      simulateAttempt(stepRef.current)
    }
  }

  const scheduleMinutes = backoffSchedule.map((m, i) => ({
    attempt: i + 1,
    minutes: m,
  }))

  const phaseColor = (p: StepPhase) => {
    switch (p) {
      case 'idle': return s.text3
      case 'queued': return s.yellow
      case 'delivering': return s.accent
      case 'success': return s.green
      case 'retrying': return s.orange
      case 'dlq': return s.red
    }
  }

  return (
    <DemoBoundary name="Webhook Delivery Flow">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>Webhook Delivery Flow</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>Event:</span>
          <span style={{ fontSize: 13, fontFamily: s.mono, color: s.accent }}>{eventId}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>Status:</span>
          <span style={{
            fontSize: 12, fontFamily: s.mono, fontWeight: 600, color: phaseColor(phase),
            background: `${phaseColor(phase)}12`, padding: '3px 10px', borderRadius: 4,
          }}>
            {phase.toUpperCase()}
          </span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button onClick={startDelivery} disabled={inFlight} style={{
            padding: '6px 16px', fontSize: 13, fontFamily: s.mono, cursor: inFlight ? 'default' : 'pointer',
            border: `1px solid ${s.accent}`, borderRadius: 6, transition: 'all 0.2s',
            background: inFlight ? s.bg3 : 'rgba(91,141,239,0.15)', color: inFlight ? s.text3 : s.accent, fontWeight: 600,
          }}>
            {inFlight ? 'Delivering...' : 'Start Delivery'}
          </button>
          {phase === 'retrying' && !inFlight && (
            <button onClick={retryNow} style={{
              padding: '6px 12px', fontSize: 12, fontFamily: s.mono, cursor: 'pointer',
              border: `1px solid ${s.orange}`, borderRadius: 6, background: 'rgba(232,148,90,0.15)', color: s.orange, fontWeight: 600,
            }}>
              Retry Now
            </button>
          )}
          <button onClick={reset} style={{
            padding: '6px 12px', fontSize: 12, fontFamily: s.mono, cursor: 'pointer',
            border: `1px solid ${s.border}`, borderRadius: 6, background: s.bg3, color: s.text3,
          }}>Reset</button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Retry Schedule</div>
          <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0 }}>
              {scheduleMinutes.map((sc, i) => (
                <div key={sc.attempt} style={{
                  textAlign: 'center', padding: '10px 4px',
                  background: i <= currentAttempt - 1 && phase !== 'idle' ? `${s.orange}15` : 'transparent',
                  borderRight: i < scheduleMinutes.length - 1 ? `1px solid ${s.border}` : 'none',
                  transition: 'background 0.3s',
                }}>
                  <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>#{sc.attempt}</div>
                  <div style={{
                    fontSize: 13, fontFamily: s.mono,
                    color: i <= currentAttempt - 1 && phase !== 'idle' ? s.orange : s.text2,
                    transition: 'color 0.3s',
                  }}>
                    {sc.minutes < 60 ? `${sc.minutes}m` : `${sc.minutes / 60}h`}
                  </div>
                  {i < scheduleMinutes.length - 1 && (
                    <div style={{ fontSize: 9, color: s.text3, marginTop: 2 }}>{'>'}</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding: '6px 10px', borderTop: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: s.mono, color: s.text3 }}>
              <span>Attempt</span>
              <span>Delay (cumulative)</span>
            </div>
            <div style={{ padding: '0 10px 6px', display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: s.mono, color: s.text3 }}>
              <span>Max = 6 retries</span>
              <span>~32.7 hours total</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 250, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: s.bg3, borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${s.accent}` }}>
            <div style={{ fontSize: 11, fontFamily: s.mono, color: s.accent, marginBottom: 4 }}>AT-LEAST-ONCE DELIVERY</div>
            <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.5 }}>
              Each event is retried until the endpoint returns 2xx or max retries are exhausted. Events never silently drop.
            </div>
          </div>
          <div style={{ background: s.bg3, borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${s.red}` }}>
            <div style={{ fontSize: 11, fontFamily: s.mono, color: s.red, marginBottom: 4 }}>DEAD LETTER QUEUE</div>
            <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.5 }}>
              After 6 failed attempts (~32.7 hours), the event is moved to a DLQ for manual inspection and replay.
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 8, marginBottom: 16,
        background: s.bg2, borderRadius: 10, padding: 16, border: `1px solid ${s.border}`,
        alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
      }}>
        {['Event Created', 'Queue', 'Delivery Worker', 'HTTP POST', '2xx?', 'Retry/Backoff', 'DLQ'].map((label, i, arr) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 11, fontFamily: s.mono, fontWeight: 600,
              whiteSpace: 'nowrap',
              background: phase === 'idle' ? s.bg3
                : label === 'Event Created' ? s.accent + '30'
                : label === 'Queue' ? s.yellow + '30'
                : label === 'Delivery Worker' ? (phase === 'delivering' ? s.accent + '50' : s.accent + '20')
                : label === 'HTTP POST' ? (phase === 'delivering' ? s.orange + '50' : s.orange + '20')
                : label === '2xx?' ? (phase === 'success' ? s.green + '50' : phase === 'retrying' ? s.red + '50' : s.purple + '20')
                : label === 'Retry/Backoff' ? (phase === 'retrying' ? s.orange + '50' : s.orange + '20')
                : label === 'DLQ' ? (phase === 'dlq' ? s.red + '50' : s.red + '20')
                : s.bg3,
              color: phase === 'idle' ? s.text3
                : label === 'Event Created' ? s.accent
                : label === 'Queue' ? s.yellow
                : label === 'Delivery Worker' ? s.accent
                : label === 'HTTP POST' ? s.orange
                : label === '2xx?' ? (phase === 'success' ? s.green : phase === 'retrying' ? s.red : s.purple)
                : label === 'Retry/Backoff' ? s.orange
                : label === 'DLQ' ? s.red
                : s.text3,
              border: `1px solid ${phase === 'idle' ? 'transparent' : 'currentColor'}`,
              transition: 'all 0.3s',
            }}>
              {label}
            </div>
            {i < arr.length - 1 && (
              <span style={{ color: s.text3, fontSize: 10 }}>{'>'}</span>
            )}
          </div>
        ))}
      </div>

      {steps.length > 0 && (
        <div ref={logRef} style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
          <div style={{ padding: '8px 14px', borderBottom: `1px solid ${s.border}`, fontSize: 12, fontFamily: s.mono, color: s.text3 }}>
            DELIVERY LOG ({steps.length})
          </div>
          {steps.map((st, i) => {
            const dotColor = st.status === 'success' ? s.green
              : st.status === 'failed' ? s.red
              : st.status === 'sending' ? s.orange
              : s.yellow
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px',
                borderBottom: i < steps.length - 1 ? `1px solid ${s.bg3}` : 'none',
                fontSize: 12, fontFamily: s.mono,
                opacity: st.status === 'pending' ? 0.6 : 1,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                <span style={{ color: st.status === 'success' ? s.green : st.status === 'failed' ? s.red : s.text2 }}>
                  {st.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
    </DemoBoundary>
  )
}
