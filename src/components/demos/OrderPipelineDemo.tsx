import { useState, useEffect, useCallback } from 'react'
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

type Step = {
  id: string
  label: string
  service: string
  color: string
}

const STEPS: Step[] = [
  { id: 'cart', label: 'Cart', service: 'Cart Service', color: s.accent },
  { id: 'checkout', label: 'Checkout', service: 'Order Service', color: s.purple },
  { id: 'payment', label: 'Payment', service: 'Payment Service', color: s.yellow },
  { id: 'inventory', label: 'Inventory', service: 'Inventory Service', color: s.orange },
  { id: 'shipping', label: 'Shipping', service: 'Shipping Service', color: s.green },
  { id: 'delivered', label: 'Delivered', service: 'Notification Service', color: s.green },
]

type SimType = 'normal' | 'payment_fail' | 'out_of_stock'

const SIM_EVENTS: Record<SimType, { step: number; event: string; detail: string; status: 'ok' | 'error' }[]> = {
  normal: [
    { step: 0, event: 'Cart validated', detail: '3 items, total $156.97', status: 'ok' },
    { step: 1, event: 'Order created', detail: 'Order #ORD-78291', status: 'ok' },
    { step: 2, event: 'Payment processed', detail: 'Charged $156.97 to Visa ****4242', status: 'ok' },
    { step: 3, event: 'Inventory reserved', detail: 'Items deducted from warehouse WH-03', status: 'ok' },
    { step: 4, event: 'Shipped', detail: 'Tracking: 1Z999AA10123456784', status: 'ok' },
    { step: 5, event: 'Delivered', detail: 'Left at front door. Confirmation sent.', status: 'ok' },
  ],
  payment_fail: [
    { step: 0, event: 'Cart validated', detail: '3 items, total $156.97', status: 'ok' },
    { step: 1, event: 'Order created', detail: 'Order #ORD-78291', status: 'ok' },
    { step: 2, event: 'Payment declined', detail: 'Card expired. Retry failed.', status: 'error' },
    { step: 2, event: 'Order cancelled', detail: 'Payment failed. Inventory released.', status: 'error' },
  ],
  out_of_stock: [
    { step: 0, event: 'Cart validated', detail: '3 items, total $156.97', status: 'ok' },
    { step: 1, event: 'Order created', detail: 'Order #ORD-78291', status: 'ok' },
    { step: 2, event: 'Payment processed', detail: 'Charged $156.97 to Visa ****4242', status: 'ok' },
    { step: 3, event: 'Out of stock', detail: 'Mechanical Keyboard unavailable in WH-03', status: 'error' },
    { step: 3, event: 'Backorder created', detail: 'Partial order shipped, 1 item backordered', status: 'error' },
    { step: 4, event: 'Partial shipment', detail: '2 items shipped via FedEx', status: 'ok' },
  ],
}

export default function OrderPipelineDemo() {
  const [simType, setSimType] = useState<SimType>('normal')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(-1)
  const [events, setEvents] = useState<{ event: string; detail: string; status: 'ok' | 'error'; stepIdx: number }[]>([])
  const [speed, setSpeed] = useState(1)

  const simEvents = SIM_EVENTS[simType]

  const reset = () => {
    setRunning(false)
    setProgress(-1)
    setEvents([])
  }

  const start = () => {
    reset()
    setRunning(true)
    setProgress(0)
  }

  const addEvent = useCallback((stepIdx: number, ev: { event: string; detail: string; status: 'ok' | 'error' }) => {
    setEvents((prev) => [...prev, { ...ev, stepIdx }])
  }, [])

  useEffect(() => {
    if (!running || progress < 0) return
    const stepEvents = simEvents.filter((e) => e.step === progress)
    let delay = getStepDelay(400, speed)
    stepEvents.forEach((ev, i) => {
      setTimeout(() => addEvent(progress, ev), i * getStepDelay(600, speed))
      delay += getStepDelay(600, speed)
    })

    const allDone = progress >= simEvents[simEvents.length - 1].step
    const isError = stepEvents.some((e) => e.status === 'error')

    if (allDone || isError) {
      const t = setTimeout(() => setRunning(false), delay + getStepDelay(300, speed))
      return () => clearTimeout(t)
    }

    const t = setTimeout(() => {
      setProgress((prev) => prev + 1)
    }, delay)
    return () => clearTimeout(t)
  }, [running, progress, simEvents, speed, addEvent])

  const getStepStatus = (stepIdx: number) => {
    if (progress < stepIdx) return 'pending'
    const stepEvents = events.filter((e) => e.stepIdx === stepIdx)
    if (stepEvents.some((e) => e.status === 'error')) return 'error'
    if (stepEvents.length > 0) return 'done'
    return 'active'
  }

  return (
    <DemoBoundary name="Order Pipeline">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {([
            { type: 'normal' as SimType, label: 'Normal Flow' },
            { type: 'payment_fail' as SimType, label: 'Payment Failure' },
            { type: 'out_of_stock' as SimType, label: 'Out of Stock' },
          ]).map((opt) => (
            <button key={opt.type} onClick={() => { setSimType(opt.type); reset() }}
              disabled={running}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 6, border: 'none',
                background: simType === opt.type ? s.accent : s.bg3,
                color: simType === opt.type ? '#fff' : s.text2,
                fontSize: 12, fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                opacity: running ? 0.6 : 1,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 16 }}>
          {STEPS.map((st, i) => {
            const status = getStepStatus(i)
            return (
              <div key={st.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: status === 'done' ? `${st.color}22` : status === 'error' ? `${s.red}22` : status === 'active' ? `${s.accent}22` : s.bg3,
                    border: `2px solid ${status === 'done' ? st.color : status === 'error' ? s.red : status === 'active' ? s.accent : s.border}`,
                    margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}>
                    {status === 'done' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={st.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : status === 'error' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.red} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    ) : (
                      <span style={{ fontSize: 12, fontFamily: s.mono, color: status === 'active' ? s.accent : s.text3 }}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: status === 'pending' ? s.text3 : s.text, marginBottom: 2 }}>
                    {st.label}
                  </div>
                  <div style={{ fontSize: 9, color: s.text3 }}>{st.service}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    width: 24, height: 2, flexShrink: 0,
                    background: status === 'done' ? st.color : s.border,
                    transition: 'background 0.3s',
                  }} />
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={start} disabled={running}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: 'none',
              background: running ? s.bg3 : s.accent, color: running ? s.text3 : '#fff',
              fontSize: 13, fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            Place Order
          </button>
          <button onClick={reset}
            style={{
              padding: '8px 16px', borderRadius: 6, border: `1px solid ${s.border}`,
              background: s.bg2, color: s.text2, fontSize: 13, cursor: 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            Reset
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 14, maxHeight: 200, overflowY: 'auto' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 8 }}>Event Log</div>
          {events.length === 0 && <div style={{ fontSize: 12, color: s.text3 }}>Select a scenario and click "Place Order"</div>}
          {events.map((ev, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
              borderBottom: `1px solid ${s.bg3}`,
              opacity: i === events.length - 1 ? 1 : 0.6,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: ev.status === 'error' ? s.red : s.green,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: ev.status === 'error' ? s.red : s.text, fontFamily: s.mono, width: 120 }}>
                {STEPS[ev.stepIdx]?.service}
              </span>
              <span style={{ fontSize: 12, color: s.text2 }}>{ev.event}</span>
              <span style={{ fontSize: 11, color: s.text3, marginLeft: 'auto' }}>{ev.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </DemoBoundary>
  )
}
