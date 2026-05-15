import { useState, useEffect, useCallback, useRef } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController from './SpeedController'
import { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Stage {
  id: number
  label: string
  desc: string
  status: 'pending' | 'active' | 'done' | 'error'
}

const initialStages: Stage[] = [
  { id: 0, label: 'Checkout', desc: 'Customer submits payment details', status: 'pending' },
  { id: 1, label: 'API Request', desc: 'Payment service receives request with idempotency key "txn-abc-123"', status: 'pending' },
  { id: 2, label: 'Validation', desc: 'Validating card number, amount, currency, and required fields', status: 'pending' },
  { id: 3, label: 'Fraud Check', desc: 'Running fraud detection rules: velocity, amount, geography', status: 'pending' },
  { id: 4, label: 'Processor Call', desc: 'Sending charge request to Stripe / Adyen gateway', status: 'pending' },
  { id: 5, label: 'Result', desc: 'Payment succeeded - authorization ID: auth_8fkLm2', status: 'pending' },
  { id: 6, label: 'Webhook', desc: 'Async webhook sent: payment_intent.succeeded', status: 'pending' },
  { id: 7, label: 'Ledger Update', desc: 'Double-entry recorded: Debit Customer, Credit Merchant', status: 'pending' },
]

const failedStages: Stage[] = [
  { id: 0, label: 'Checkout', desc: 'Customer submits payment details', status: 'done' },
  { id: 1, label: 'API Request', desc: 'Payment service receives request with idempotency key "txn-abc-123"', status: 'done' },
  { id: 2, label: 'Validation', desc: 'Invalid card number - Luhn check failed', status: 'error' },
  { id: 3, label: 'Fraud Check', desc: 'Skipped due to validation error', status: 'pending' },
  { id: 4, label: 'Processor Call', desc: 'Skipped due to validation error', status: 'pending' },
  { id: 5, label: 'Result', desc: 'Payment failed - validation error', status: 'error' },
  { id: 6, label: 'Webhook', desc: 'Async webhook sent: payment_intent.failed', status: 'pending' },
  { id: 7, label: 'Ledger Update', desc: 'No ledger update - transaction did not succeed', status: 'pending' },
]

const idempotentStages: Stage[] = [
  { id: 0, label: 'Checkout', desc: 'Retry with same idempotency key "txn-abc-123"', status: 'done' },
  { id: 1, label: 'API Request', desc: 'Idempotency key "txn-abc-123" detected in cache', status: 'active' },
  { id: 2, label: 'Idempotency Check', desc: 'Key found! Returning cached result: SUCCESS', status: 'active' },
  { id: 3, label: 'Result', desc: 'Returned same authorization ID: auth_8fkLm2 (duplicate prevented)', status: 'done' },
]

export default function PaymentFlowDemo() {
  const [mode, setMode] = useState<'idle' | 'running' | 'success' | 'failed' | 'idempotent'>('idle')
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [step, setStep] = useState(-1)
  const [speed, setSpeed] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [idempotencyKey] = useState('txn-abc-123')
  const [cacheHit, setCacheHit] = useState(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resetAll = useCallback(() => {
    clearTimer()
    setStep(-1)
    setMode('idle')
    setCacheHit(false)
    setStages(initialStages.map(st => ({ ...st, status: 'pending' as const })))
  }, [clearTimer])

  const advanceStep = useCallback(() => {
    setStep(prev => {
      const next = prev + 1
      return next
    })
  }, [])

  const runFlow = useCallback((flowStages: Stage[], flowMode: 'running' | 'idempotent') => {
    resetAll()
    setMode('running')
    setCacheHit(false)
    const st = flowStages.map(stage => ({
      ...stage,
      status: stage.id === 0 ? ('active' as const) : ('pending' as const),
    }))
    setStages(st)
    setStep(0)
  }, [resetAll])

  useEffect(() => {
    if (mode !== 'running' && mode !== 'idempotent') return
    if (step < 0) return

    const currentStage = stages[step]
    if (!currentStage) return

    if (currentStage.status === 'active' || currentStage.status === 'done') {
      const nextIdx = step + 1
      if (nextIdx >= stages.length) {
        clearTimer()
        if (mode === 'idempotent') {
          setMode('idempotent')
        } else {
          setMode('success')
        }
        return
      }

      const nextStage = stages[nextIdx]
      if (nextStage.status === 'done' || nextStage.status === 'error') {
        const delay = getStepDelay(600, speed)
        timerRef.current = setTimeout(() => advanceStep(), delay)
        return
      }

      const delay = getStepDelay(600, speed)
      timerRef.current = setTimeout(() => {
        setStages(prev => prev.map((st, i) => {
          if (i === nextIdx) return { ...st, status: 'active' as const }
          if (i === step) {
            const current = prev[step]
            const newStatus = current?.status === 'error' ? 'error' as const : 'done' as const
            return { ...st, status: newStatus }
          }
          return st
        }))
        advanceStep()
        if (mode === 'idempotent' && nextIdx === stages.length - 1) {
          setCacheHit(true)
          setTimeout(() => setMode('idempotent'), getStepDelay(400, speed))
        }
      }, delay)
    }

    return clearTimer
  }, [step, mode, stages, speed, clearTimer, advanceStep])

  const startSuccessFlow = () => runFlow(initialStages, 'running')
  const startFailFlow = () => {
    resetAll()
    setMode('running')
    const st = failedStages.map((stage, i) => ({
      ...stage,
      status: i === 0 ? ('active' as const) : ('pending' as const),
    }))
    setStages(st)
    setStep(0)
  }

  const retryIdempotent = () => {
    runFlow(idempotentStages, 'idempotent')
    setCacheHit(true)
  }

  const retryNew = () => {
    resetAll()
    startSuccessFlow()
  }

  const statusColor = (status: string, stageId: number, stagesList: Stage[]) => {
    if (status === 'active') return s.accent
    if (status === 'error') return s.red
    if (status === 'done') return s.green
    if (stageId > 0 && stagesList[stageId - 1]?.status === 'error') return s.text3
    return s.text3
  }

  const statusBg = (status: string) => {
    if (status === 'active') return `${s.accent}15`
    if (status === 'error') return `${s.red}15`
    if (status === 'done') return `${s.green}15`
    return 'transparent'
  }

  return (
    <DemoBoundary name="Payment Flow with Idempotency">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, letterSpacing: -0.3 }}>Payment Flow</div>
          <div style={{ color: s.text2, fontSize: 13, marginTop: 4 }}>
            Idempotency key: <span style={{ fontFamily: s.mono, color: s.yellow }}>{idempotencyKey}</span>
          </div>
        </div>
        <SpeedController speed={speed} onSpeedChange={setSpeed} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        {stages.map((stage) => {
          const isActive = stage.status === 'active'
          const isDone = stage.status === 'done'
          const isError = stage.status === 'error'
          const isSkipped = stage.status === 'pending' && step >= 0 && stages.find(st => st.status === 'error') && stage.id > (stages.findIndex(st => st.status === 'error') ?? 99)
          const color = isError ? s.red : isActive ? s.accent : isDone ? s.green : s.text3
          const bg = isActive ? `${s.accent}12` : isError ? `${s.red}12` : isDone ? `${s.green}10` : 'transparent'

          return (
            <div key={stage.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '8px 14px', borderRadius: 8,
              background: bg, border: `1px solid ${isActive ? color : 'transparent'}`,
              transition: 'all 0.3s ease',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: isDone ? s.green : isError ? s.red : isActive ? s.accent : s.bg3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.3s',
              }}>
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3 3 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : isError ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4l6 6M10 4l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                ) : isActive ? (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                ) : (
                  <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>{stage.id}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color, fontSize: 13, fontWeight: 600, transition: 'color 0.3s' }}>{stage.label}</div>
                <div style={{ color: isActive ? s.text2 : s.text3, fontSize: 11, marginTop: 1 }}>{stage.desc}</div>
              </div>
              <div style={{
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
                color, background: bg, padding: '2px 8px', borderRadius: 4,
              }}>
                {isError ? 'Error' : isActive ? 'Running' : isDone ? 'Done' : ''}
              </div>
            </div>
          )
        })}
      </div>

      {cacheHit && (
        <div style={{
          background: `${s.yellow}15`, border: `1px solid ${s.yellow}`, borderRadius: 10,
          padding: '12px 16px', marginBottom: 20,
        }}>
          <div style={{ color: s.yellow, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Idempotency Cache Hit
          </div>
          <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
            Idempotency key "{idempotencyKey}" was found in the cache. Returning the original
            result (auth_8fkLm2) without processing a new payment. The customer was not charged twice.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={startSuccessFlow} disabled={mode === 'running'} style={{
          background: mode === 'running' ? s.bg3 : s.green,
          border: 'none', borderRadius: 8, padding: '10px 18px',
          color: mode === 'running' ? s.text3 : '#fff',
          cursor: mode === 'running' ? 'not-allowed' : 'pointer',
          fontSize: 13, fontWeight: 600,
        }}>
          Run Success Flow
        </button>
        <button onClick={startFailFlow} disabled={mode === 'running'} style={{
          background: mode === 'running' ? s.bg3 : s.red,
          border: 'none', borderRadius: 8, padding: '10px 18px',
          color: mode === 'running' ? s.text3 : '#fff',
          cursor: mode === 'running' ? 'not-allowed' : 'pointer',
          fontSize: 13, fontWeight: 600,
        }}>
          Run Failure Flow
        </button>
        {mode === 'success' && (
          <>
            <button onClick={retryIdempotent} style={{
              background: s.yellow, border: 'none', borderRadius: 8, padding: '10px 18px',
              color: '#000', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              Retry (Same Key - Idempotent)
            </button>
            <button onClick={retryNew} style={{
              background: s.accent, border: 'none', borderRadius: 8, padding: '10px 18px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              Retry (New Key)
            </button>
          </>
        )}
        {mode !== 'idle' && mode !== 'running' && (
          <button onClick={resetAll} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 18px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>
            Reset
          </button>
        )}
      </div>

      <div style={{ marginTop: 20, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Key Concept: Idempotency</div>
        <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.6 }}>
          An idempotency key ensures that retrying a request produces the same result as the first attempt.
          After a successful payment, click "Retry (Same Key)" to see how the system returns the cached
          authorization instead of charging the card again. This prevents double charges on network retries.
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
