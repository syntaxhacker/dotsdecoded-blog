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

const STATES = [
  {
    name: 'Requested',
    color: s.yellow,
    desc: 'Rider opens app and requests a ride with pickup location and destination.',
    detail: 'System creates a trip record. Matching service searches for nearby drivers.',
  },
  {
    name: 'Matched',
    color: s.accent,
    desc: 'A driver accepts the ride request.',
    detail: 'Driver receives trip details. Rider sees driver info, car model, ETA, and rating.',
  },
  {
    name: 'En Route',
    color: s.purple,
    desc: 'Driver is heading toward the pickup location.',
    detail: 'Real-time GPS updates streamed to rider. ETA recalculated continuously.',
  },
  {
    name: 'Arrived',
    color: s.orange,
    desc: 'Driver reaches the pickup location.',
    detail: 'Rider gets notified. Timer starts for pickup wait time.',
  },
  {
    name: 'In Progress',
    color: s.green,
    desc: 'Rider is in the car. Trip is underway.',
    detail: 'GPS tracking active. Route optimized. Fare meter running.',
  },
  {
    name: 'Completed',
    color: s.green,
    desc: 'Driver drops off the rider at the destination.',
    detail: 'Fare calculated. Payment processed. Rating requested from both sides.',
  },
]

export default function TripLifecycleDemo() {
  const [step, setStep] = useState(-1)
  const [autoPlay, setAutoPlay] = useState(false)

  const advance = () => {
    if (step < STATES.length - 1) {
      setStep((prev) => prev + 1)
    }
  }

  const reset = () => {
    setStep(-1)
    setAutoPlay(false)
  }

  return (
    <DemoBoundary name="Trip Lifecycle State Machine">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => { if (step < 0) { setStep(0) } else { advance() } }}
            disabled={step >= STATES.length - 1}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
              background: step >= STATES.length - 1 ? s.bg3 : s.accent, color: step >= STATES.length - 1 ? s.text3 : '#fff',
              fontSize: 14, fontWeight: 600, cursor: step >= STATES.length - 1 ? 'not-allowed' : 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            {step < 0 ? 'Start Trip' : step >= STATES.length - 1 ? 'Trip Complete' : 'Next State'}
          </button>
          <button onClick={reset}
            style={{
              padding: '10px 18px', borderRadius: 8, border: `1px solid ${s.border}`,
              background: s.bg2, color: s.text2, fontSize: 14, cursor: 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            Reset
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {STATES.map((st, i) => {
            const isActive = i === step
            const isPast = i < step
            return (
              <div key={st.name} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  padding: '6px 12px', borderRadius: 6,
                  background: isActive ? `${st.color}22` : isPast ? `${st.color}11` : s.bg3,
                  border: `1.5px solid ${isActive ? st.color : isPast ? `${st.color}66` : s.border}`,
                  transition: 'all 0.3s',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? st.color : isPast ? s.text2 : s.text3 }}>
                    {st.name}
                  </span>
                </div>
                {i < STATES.length - 1 && (
                  <svg width={24} height={12} style={{ flexShrink: 0 }}>
                    <line x1={0} y1={6} x2={18} y2={6} stroke={i < step ? s.green : s.border} strokeWidth={1.5} />
                    <polygon points="16,2 24,6 16,10" fill={i < step ? s.green : s.border} />
                  </svg>
                )}
              </div>
            )
          })}
        </div>

        {step >= 0 && (
          <div style={{
            background: s.bg2, border: `1px solid ${STATES[step].color}44`,
            borderRadius: 10, padding: 20, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: `${STATES[step].color}22`,
                border: `1px solid ${STATES[step].color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: STATES[step].color }}>{step + 1}</span>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: STATES[step].color }}>{STATES[step].name}</div>
                <div style={{ fontSize: 13, color: s.text2, marginTop: 2 }}>{STATES[step].desc}</div>
              </div>
            </div>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '12px 16px', fontSize: 13, color: s.text2, lineHeight: 1.6,
            }}>
              {STATES[step].detail}
            </div>
          </div>
        )}

        {step < 0 && (
          <div style={{
            background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10,
            padding: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, color: s.text3 }}>Click "Start Trip" to walk through the state machine</div>
          </div>
        )}

        {step >= 0 && (
          <div style={{
            background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: s.text2, marginBottom: 10 }}>State Transitions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {STATES.map((st, i) => (
                <div key={st.name} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8',
                  borderRadius: 4, background: i === step ? `${st.color}11` : 'transparent',
                  opacity: i <= step ? 1 : 0.3,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: i < step ? s.green : i === step ? st.color : s.text3,
                  }} />
                  <span style={{ fontSize: 12, fontFamily: s.mono, color: i <= step ? s.text : s.text3 }}>
                    {st.name}
                  </span>
                  {i < STATES.length - 1 && (
                    <svg width={16} height={8}>
                      <line x1={0} y1={4} x2={12} y2={4} stroke={i < step ? s.green : s.border} strokeWidth={1} />
                      <polygon points="10,1 16,4 10,7" fill={i < step ? s.green : s.border} />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
