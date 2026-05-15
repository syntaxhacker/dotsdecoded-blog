import { useState, useEffect, useCallback, useRef } from 'react'
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

interface Step {
  label: string
  from: string
  to: string
  desc: string
}

const STEPS: Step[] = [
  { label: '1 / 12', from: 'User', to: 'CDN', desc: 'User sends request to browse events. CDN serves cached event listings and assets.' },
  { label: '2 / 12', from: 'CDN', to: 'Load Balancer', desc: 'Cache miss on dynamic data. Request forwarded to load balancer for distribution.' },
  { label: '3 / 12', from: 'Load Balancer', to: 'API Gateway', desc: 'Load balancer picks the healthiest API gateway instance using round-robin.' },
  { label: '4 / 12', from: 'API Gateway', to: 'Event Catalog', desc: 'Gateway routes /events to Event Catalog service. Queries DB for upcoming events.' },
  { label: '5 / 12', from: 'API Gateway', to: 'Seat Inventory', desc: 'User selects an event. Gateway calls Seat Inventory to check availability.' },
  { label: '6 / 12', from: 'API Gateway', to: 'Booking Service', desc: 'User chooses seats. Gateway routes to Booking Service to create a pending order.' },
  { label: '7 / 12', from: 'Booking Service', to: 'Redis', desc: 'Booking Service holds the selected seats in Redis with a 5-minute TTL.' },
  { label: '8 / 12', from: 'Booking Service', to: 'Database', desc: 'Order is persisted in PostgreSQL with status "pending". Seat assignments recorded.' },
  { label: '9 / 12', from: 'Booking Service', to: 'Payment Service', desc: 'Booking invokes Payment Service to authorize and capture payment.' },
  { label: '10 / 12', from: 'Payment Service', to: 'Database', desc: 'Payment record stored. Order status updated to "confirmed" in the DB.' },
  { label: '11 / 12', from: 'Booking Service', to: 'Notification Service', desc: 'Booking queues notification: digital tickets ready for delivery.' },
  { label: '12 / 12', from: 'Notification Service', to: 'User', desc: 'Tickets delivered via email and in-app notification. Booking complete.' },
]

const BOXES = ['User', 'CDN', 'Load Balancer', 'API Gateway', 'Event Catalog', 'Seat Inventory', 'Booking Service', 'Payment Service', 'Notification Service', 'Waiting Room', 'Redis', 'Database']

function getBoxColor(box: string, activeFrom: string, activeTo: string): string {
  if (box === activeFrom) return s.accent
  if (box === activeTo) return s.green
  if (box === 'Redis') return s.orange
  if (box === 'Database') return s.purple
  if (['Event Catalog', 'Seat Inventory', 'Booking Service', 'Payment Service', 'Notification Service', 'Waiting Room'].includes(box)) return s.accent
  if (['CDN', 'Load Balancer', 'API Gateway'].includes(box)) return s.text2
  if (box === 'User') return s.green
  return s.text3
}

export default function BookingArchitectureDemo() {
  const [stepIdx, setStepIdx] = useState(-1)
  const [autoPlay, setAutoPlay] = useState(false)
  const [speed, setSpeed] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goTo = useCallback((idx: number) => {
    if (idx < -1 || idx >= STEPS.length) return
    setStepIdx(idx)
  }, [])

  const nextStep = useCallback(() => {
    setStepIdx(prev => {
      const next = prev + 1
      if (next >= STEPS.length) {
        setAutoPlay(false)
        return prev
      }
      return next
    })
  }, [])

  const prevStep = () => {
    setStepIdx(prev => Math.max(-1, prev - 1))
  }

  useEffect(() => {
    if (!autoPlay) return
    timerRef.current = setTimeout(() => {
      nextStep()
    }, getStepDelay(2200, speed))
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [autoPlay, stepIdx, nextStep, speed])

  const reset = () => {
    setStepIdx(-1)
    setAutoPlay(false)
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const currentStep = stepIdx >= 0 ? STEPS[stepIdx] : null
  const activeFrom = currentStep?.from ?? ''
  const activeTo = currentStep?.to ?? ''

  return (
    <DemoBoundary name="Booking Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, letterSpacing: -0.3 }}>Booking Architecture</div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{
          background: s.bg, borderRadius: 12, border: `1px solid ${s.border}`,
          padding: 20, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {['User', 'CDN', 'Load Balancer', 'API Gateway'].map(box => (
              <div key={box} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 12,
                background: box === activeFrom || box === activeTo ? `${getBoxColor(box, activeFrom, activeTo)}22` : s.bg2,
                border: `1px solid ${box === activeFrom || box === activeTo ? getBoxColor(box, activeFrom, activeTo) : s.border}`,
                color: box === activeFrom || box === activeTo ? getBoxColor(box, activeFrom, activeTo) : s.text3,
                fontWeight: box === activeFrom || box === activeTo ? 600 : 400,
                transition: 'all 0.3s',
                boxShadow: box === activeFrom || box === activeTo ? `0 0 12px ${getBoxColor(box, activeFrom, activeTo)}44` : 'none',
              }}>
                {box}
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex', justifyContent: 'center', gap: '2%', marginBottom: 16, flexWrap: 'wrap',
          }}>
            {['Event Catalog', 'Seat Inventory', 'Booking Service', 'Payment Service', 'Notification Service', 'Waiting Room'].map(box => (
              <div key={box} style={{
                padding: '10px 0', borderRadius: 8, fontSize: 11, textAlign: 'center',
                width: '15%', minWidth: 100,
                background: box === activeFrom || box === activeTo ? `${s.accent}22` : s.bg2,
                border: `1px solid ${box === activeFrom || box === activeTo ? s.accent : s.border}`,
                color: box === activeFrom || box === activeTo ? s.accent : s.text3,
                fontWeight: box === activeFrom || box === activeTo ? 600 : 400,
                transition: 'all 0.3s',
                boxShadow: box === activeFrom || box === activeTo ? `0 0 12px ${s.accent}44` : 'none',
              }}>
                {box}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            {['Redis', 'Database'].map(box => (
              <div key={box} style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 12,
                background: box === activeFrom || box === activeTo ? `${getBoxColor(box, activeFrom, activeTo)}22` : s.bg2,
                border: `1px solid ${box === activeFrom || box === activeTo ? getBoxColor(box, activeFrom, activeTo) : s.border}`,
                color: box === activeFrom || box === activeTo ? getBoxColor(box, activeFrom, activeTo) : s.text3,
                fontWeight: box === activeFrom || box === activeTo ? 600 : 400,
                transition: 'all 0.3s',
                boxShadow: box === activeFrom || box === activeTo ? `0 0 12px ${getBoxColor(box, activeFrom, activeTo)}44` : 'none',
              }}>
                {box}
              </div>
            ))}
          </div>
        </div>

        {currentStep ? (
          <div style={{
            background: `${s.accent}11`, border: `1px solid ${s.accent}`,
            borderRadius: 10, padding: '16px 20px', marginBottom: 16,
            animation: 'fadeSlide 0.4s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                background: s.accent, color: '#000', fontSize: 10,
                fontFamily: s.mono, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
              }}>{currentStep.label}</span>
              <span style={{
                color: s.accent, fontSize: 13, fontWeight: 600,
              }}>
                {currentStep.from} &rarr; {currentStep.to}
              </span>
            </div>
            <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.5 }}>{currentStep.desc}</div>
          </div>
        ) : (
          <div style={{
            color: s.text3, fontSize: 13, textAlign: 'center',
            padding: '20px 0', marginBottom: 16,
          }}>
            Click "Start Flow" to watch a booking request travel through the system
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={prevStep} disabled={stepIdx <= 0} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 16px',
            color: stepIdx <= 0 ? s.text3 : s.text2, cursor: stepIdx <= 0 ? 'default' : 'pointer',
            fontSize: 13, opacity: stepIdx <= 0 ? 0.4 : 1,
          }}>Prev</button>
          <button onClick={nextStep} disabled={stepIdx >= STEPS.length - 1} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '8px 20px',
            color: '#fff', cursor: stepIdx >= STEPS.length - 1 ? 'default' : 'pointer',
            fontSize: 13, fontWeight: 600,
            opacity: stepIdx >= STEPS.length - 1 ? 0.4 : 1,
          }}>Next</button>
          {stepIdx < 0 ? (
            <button onClick={() => goTo(0)} style={{
              background: s.green, border: 'none', borderRadius: 8, padding: '8px 20px',
              color: '#000', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>Start Flow</button>
          ) : (
            <button onClick={() => setAutoPlay(!autoPlay)} style={{
              background: autoPlay ? s.red : s.green,
              border: 'none', borderRadius: 8, padding: '8px 20px',
              color: '#000', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {autoPlay ? 'Stop' : 'Auto Play'}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={reset} style={{
            background: 'transparent', border: `1px solid ${s.border}`, borderRadius: 8, padding: '6px 14px',
            color: s.text3, cursor: 'pointer', fontSize: 12,
          }}>Reset</button>
        </div>
      </div>
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
    </DemoBoundary>
  )
}
