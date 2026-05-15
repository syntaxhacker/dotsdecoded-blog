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

interface StepDef {
  id: string
  title: string
  desc: string
  detail: string
  ops: string[]
}

const STEPS: StepDef[] = [
  {
    id: 'book',
    title: 'Book Initiated',
    desc: 'Reserving seats and creating the order',
    detail: 'The booking service creates a pending order and holds the selected seats. An idempotency key is generated to prevent duplicate bookings.',
    ops: [
      "INSERT INTO orders (user_id, status, total) VALUES (?, 'pending', 150.00)",
      "UPDATE seats SET status = 'held' WHERE id IN (12, 13, 14) AND status = 'available'",
      'INSERT INTO order_items (order_id, seat_id) VALUES (?, 12), (?, 13), (?, 14)',
      'Redis: SET idempotency:booking:KEY STATUS pending NX EX 86400',
    ],
  },
  {
    id: 'hold',
    title: 'Payment Hold',
    desc: 'Authorizing the payment amount',
    detail: 'A hold is placed on the payment source for the order total. The idempotency key prevents charging the user twice if the request is retried.',
    ops: [
      'Redis: SET idempotency:pay:KEY STATUS pending NX EX 86400',
      'Redis: SET hold:order:42 amount 150.00 EX 600',
      'Gateway: authorize(amount=150.00, source=card_xxx, idempotency=KEY)',
      'Redis: SET idempotency:pay:KEY STATUS authorized',
    ],
  },
  {
    id: 'process',
    title: 'Processing',
    desc: 'Capturing the payment from the provider',
    detail: 'The payment is captured through the payment gateway. The idempotency key guarantees this capture only happens once, even on network retries.',
    ops: [
      'Gateway: capture(authorization=auth_xxx, idempotency=KEY)',
      'Redis: SET idempotency:pay:KEY STATUS completed',
    ],
  },
  {
    id: 'success',
    title: 'Success',
    desc: 'Payment confirmed, tickets issued',
    detail: 'The order is confirmed, seats are marked as sold, and a notification is queued to deliver the digital tickets.',
    ops: [
      "UPDATE orders SET status = 'confirmed', paid_at = NOW() WHERE id = 42",
      "UPDATE seats SET status = 'sold' WHERE id IN (12, 13, 14)",
      'Queue: send_tickets(order_id=42, user_id=1)',
      'Redis: DEL hold:order:42',
      'Redis: DEL idempotency:booking:KEY',
    ],
  },
  {
    id: 'failure',
    title: 'Failure',
    desc: 'Payment failed, releasing resources',
    detail: 'The payment was declined or an error occurred. The authorization is voided, seats are released back to inventory, and the user is notified.',
    ops: [
      'Gateway: void(authorization=auth_xxx)',
      "UPDATE seats SET status = 'available' WHERE id IN (12, 13, 14)",
      "UPDATE orders SET status = 'failed' WHERE id = 42",
      'Queue: notify_failure(user_id=1, order_id=42)',
      'Redis: DEL hold:order:42',
      'Redis: DEL idempotency:pay:KEY',
    ],
  },
]

export default function PaymentFlowDemo() {
  const [stepIdx, setStepIdx] = useState(0)
  const [idempotencyKey, setIdempotencyKey] = useState('')
  const [autoPlay, setAutoPlay] = useState(false)
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [visibleOps, setVisibleOps] = useState<string[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const generateKey = () => {
    const chars = 'abcdef0123456789'
    let k = ''
    for (let i = 0; i < 16; i++) k += chars[Math.floor(Math.random() * chars.length)]
    setIdempotencyKey(k)
  }

  useEffect(() => {
    generateKey()
  }, [])

  const reset = () => {
    setStepIdx(0)
    setAutoPlay(false)
    setVisibleOps([])
    generateKey()
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= STEPS.length) return
    setStepIdx(idx)
    setVisibleOps([])
    const st = STEPS[idx]
    st.ops.forEach((_, i) => {
      setTimeout(() => {
        setVisibleOps(prev => [...prev, st.ops[i]])
      }, i * 300)
    })
  }, [])

  const nextStep = useCallback(() => {
    const next = stepIdx + 1
    if (simulateFailure && next === 3) {
      goTo(4)
      return
    }
    if (next >= STEPS.length) {
      setAutoPlay(false)
      return
    }
    goTo(next)
  }, [stepIdx, simulateFailure, goTo])

  const prevStep = () => {
    if (stepIdx > 0) goTo(stepIdx - 1)
  }

  useEffect(() => {
    if (!autoPlay) return
    const baseDelay = 2500
    timerRef.current = setTimeout(() => {
      nextStep()
    }, getStepDelay(baseDelay, speed))
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [autoPlay, stepIdx, nextStep, speed])

  useEffect(() => {
    goTo(0)
  }, [goTo])

  const st = STEPS[stepIdx]
  const isLast = stepIdx >= STEPS.length - 1
  const isFirst = stepIdx === 0
  const isFailure = stepIdx === 4

  return (
    <DemoBoundary name="Payment Flow">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, letterSpacing: -0.3 }}>Payment Flow</div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 8, overflow: 'hidden', border: `1px solid ${s.border}` }}>
          {STEPS.filter(st => st.id !== 'failure').map((step, i) => {
            const actualIdx = i
            const active = actualIdx === stepIdx && !isFailure
            const done = actualIdx < stepIdx && !(isFailure && actualIdx === 2)
            return (
              <div key={step.id} style={{
                flex: 1, textAlign: 'center', padding: '10px 4px',
                background: active ? s.accent : done ? s.green : s.bg,
                borderRight: i < STEPS.length - 2 ? `1px solid ${s.border}` : 'none',
                transition: 'all 0.3s',
              }}>
                <div style={{
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: 1,
                  color: active ? '#fff' : done ? '#000' : s.text3,
                  fontWeight: active ? 700 : 400,
                }}>{step.title}</div>
              </div>
            )
          })}
          {isFailure && (
            <div style={{
              flex: 1, textAlign: 'center', padding: '10px 4px',
              background: s.red, transition: 'all 0.3s',
            }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#fff', fontWeight: 700 }}>
                Failure
              </div>
            </div>
          )}
        </div>

        <div style={{
          background: isFailure ? `${s.red}11` : s.bg3,
          border: `1px solid ${isFailure ? s.red : s.accent}`,
          borderRadius: 10, padding: '16px 20px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isFailure ? s.red : s.accent,
            }} />
            <div style={{ color: s.text, fontSize: 15, fontWeight: 600 }}>{st.title}</div>
          </div>
          <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>{st.detail}</div>

          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Idempotency Key
          </div>
          <div style={{
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
            padding: '8px 12px', fontFamily: s.mono, fontSize: 12, color: s.yellow,
            wordBreak: 'break-all', marginBottom: 12,
          }}>
            {idempotencyKey}
          </div>

          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Operations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: s.mono, fontSize: 11 }}>
            {visibleOps.map((op, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 8px', borderRadius: 4,
                background: op.startsWith('Queue') ? `${s.yellow}11` : `${s.accent}11`,
                animation: 'fadeIn 0.3s ease',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: op.startsWith('Gateway') ? s.purple
                    : op.startsWith('Redis') ? s.orange
                    : op.startsWith('Queue') ? s.yellow
                    : s.accent,
                }} />
                <span style={{ color: s.text2 }}>{op}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={prevStep} disabled={isFirst} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 16px',
            color: isFirst ? s.text3 : s.text2, cursor: isFirst ? 'default' : 'pointer',
            fontSize: 13, opacity: isFirst ? 0.4 : 1,
          }}>Prev</button>
          <button onClick={nextStep} disabled={isLast && !simulateFailure} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '8px 20px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            opacity: isLast && !simulateFailure ? 0.4 : 1,
          }}>Next</button>
          <button onClick={() => setAutoPlay(!autoPlay)} style={{
            background: autoPlay ? s.red : s.green,
            border: 'none', borderRadius: 8, padding: '8px 20px',
            color: '#000', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            {autoPlay ? 'Stop' : 'Auto Play'}
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginLeft: 8 }}>
            <input type="checkbox" checked={simulateFailure} onChange={e => setSimulateFailure(e.target.checked)} style={{ accentColor: s.red }} />
            <span style={{ color: s.text3, fontSize: 12 }}>Simulate Failure</span>
          </label>
          <div style={{ flex: 1 }} />
          <button onClick={reset} style={{
            background: 'transparent', border: `1px solid ${s.border}`, borderRadius: 8, padding: '6px 14px',
            color: s.text3, cursor: 'pointer', fontSize: 12,
          }}>Reset</button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
    </DemoBoundary>
  )
}
