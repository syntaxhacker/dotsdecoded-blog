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

type StepStatus = 'pending' | 'active' | 'success' | 'failed' | 'compensating' | 'compensated' | 'rolled-back'

interface Step {
  id: string
  label: string
  compensate: string
  status: StepStatus
}

interface LogEntry {
  text: string
  color: string
}

const initialSteps: Step[] = [
  { id: 'order', label: 'Create Order', compensate: 'Cancel Order', status: 'pending' },
  { id: 'inventory', label: 'Reserve Inventory', compensate: 'Release Inventory', status: 'pending' },
  { id: 'payment', label: 'Process Payment', compensate: 'Refund Payment', status: 'pending' },
  { id: 'ship', label: 'Ship Order', compensate: 'Cancel Shipment', status: 'pending' },
]

export default function SagaDemo() {
  const [mode, setMode] = useState<'saga' | 'twopc'>('saga')
  const [steps, setSteps] = useState<Step[]>(initialSteps.map(st => ({ ...st })))
  const [failAt, setFailAt] = useState<number | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addLog = useCallback((text: string, color: string) => {
    setLogs(prev => [...prev.slice(-30), { text, color }])
  }, [])

  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  const reset = useCallback(() => {
    setRunning(false)
    setSteps(initialSteps.map(st => ({ ...st })))
    setLogs([])
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const runSaga = useCallback(() => {
    let currentStep = 0
    const total = steps.length

    const advance = () => {
      if (currentStep >= total) {
        addLog('Order completed successfully!', s.green)
        setRunning(false)
        return
      }

      const stepIdx = currentStep
      const shouldFail = failAt === stepIdx

      setSteps(prev => prev.map((st, i) =>
        i === stepIdx ? { ...st, status: 'active' } : st
      ))

      timerRef.current = setTimeout(() => {
        if (shouldFail) {
          setSteps(prev => prev.map((st, i) =>
            i === stepIdx ? { ...st, status: 'failed' } : st
          ))
          addLog(`FAILED at: ${steps[stepIdx].label}`, s.red)

          let compIdx = stepIdx - 1
          const compensateNext = () => {
            if (compIdx < 0) {
              addLog('Saga complete — all previous steps compensated', s.yellow)
              setRunning(false)
              return
            }
            const ci = compIdx
            setSteps(prev => prev.map((st, i) =>
              i === ci ? { ...st, status: 'compensating' } : st
            ))
            addLog(`Compensating: ${steps[ci].compensate}`, s.orange)

            timerRef.current = setTimeout(() => {
              setSteps(prev => prev.map((st, i) =>
                i === ci ? { ...st, status: 'compensated' } : st
              ))
              compIdx--
              timerRef.current = setTimeout(compensateNext, getStepDelay(300, speed))
            }, getStepDelay(500, speed))
          }
          compensateNext()
        } else {
          setSteps(prev => prev.map((st, i) =>
            i === stepIdx ? { ...st, status: 'success' } : st
          ))
          addLog(`Success: ${steps[stepIdx].label}`, s.green)
          currentStep++
          timerRef.current = setTimeout(advance, getStepDelay(400, speed))
        }
      }, getStepDelay(700, speed))
    }

    advance()
  }, [steps, failAt, speed, addLog])

  const run2PC = useCallback(() => {
    let currentStep = 0
    const total = steps.length
    const preparedSteps: number[] = []

    const preparePhase = () => {
      if (currentStep >= total) {
        addLog('All participants prepared — committing...', s.accent)

        let commitIdx = 0
        const commitPhase = () => {
          if (commitIdx >= total) {
            addLog('Transaction committed successfully!', s.green)
            setRunning(false)
            return
          }
          const ci = commitIdx
          setSteps(prev => prev.map((st, i) =>
            i === ci ? { ...st, status: 'success' } : st
          ))
          addLog(`Committed: ${steps[ci].label}`, s.green)
          commitIdx++
          timerRef.current = setTimeout(commitPhase, getStepDelay(400, speed))
        }
        commitPhase()
        return
      }

      const stepIdx = currentStep
      const shouldFail = failAt === stepIdx

      setSteps(prev => prev.map((st, i) =>
        i === stepIdx ? { ...st, status: 'active' } : st
      ))

      timerRef.current = setTimeout(() => {
        if (shouldFail) {
          setSteps(prev => prev.map((st, i) =>
            i === stepIdx ? { ...st, status: 'failed' } : st
          ))
          addLog(`ABORT: ${steps[stepIdx].label} voted NO`, s.red)

          let rollIdx = preparedSteps.length - 1
          const rollbackPhase = () => {
            if (rollIdx < 0) {
              addLog('Transaction aborted — all prepared participants rolled back', s.red)
              setRunning(false)
              return
            }
            const ri = preparedSteps[rollIdx]
            setSteps(prev => prev.map((st, i) =>
              i === ri ? { ...st, status: 'rolled-back' } : st
            ))
            addLog(`Rolled back: ${steps[ri].label}`, s.orange)
            rollIdx--
            timerRef.current = setTimeout(rollbackPhase, getStepDelay(400, speed))
          }
          rollbackPhase()
        } else {
          setSteps(prev => prev.map((st, i) =>
            i === stepIdx ? { ...st, status: 'success' } : st
          ))
          preparedSteps.push(stepIdx)
          addLog(`Prepared: ${steps[stepIdx].label}`, s.accent)
          currentStep++
          timerRef.current = setTimeout(preparePhase, getStepDelay(500, speed))
        }
      }, getStepDelay(600, speed))
    }

    preparePhase()
  }, [steps, failAt, speed, addLog])

  const start = () => {
    reset()
    setTimeout(() => {
      setRunning(true)
      setTimeout(() => {
        if (mode === 'saga') runSaga()
        else run2PC()
      }, 50)
    }, 50)
  }

  const statusStyle = (st: StepStatus) => {
    switch (st) {
      case 'pending': return { bg: s.bg3, border: s.border, color: s.text3, dot: s.text3 }
      case 'active': return { bg: 'rgba(91,141,239,0.12)', border: s.accent, color: s.accent, dot: s.accent }
      case 'success': return { bg: 'rgba(61,214,140,0.08)', border: s.green, color: s.green, dot: s.green }
      case 'failed': return { bg: 'rgba(232,93,93,0.08)', border: s.red, color: s.red, dot: s.red }
      case 'compensating': return { bg: 'rgba(232,148,90,0.12)', border: s.orange, color: s.orange, dot: s.orange }
      case 'compensated': return { bg: 'rgba(232,148,90,0.06)', border: s.border, color: s.orange, dot: s.orange }
      case 'rolled-back': return { bg: 'rgba(232,93,93,0.06)', border: s.border, color: s.red, dot: s.red }
    }
  }

  return (
    <DemoBoundary name="Saga Pattern">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['saga', 'twopc'] as const).map(m => (
          <button key={m} onClick={() => { if (!running) { setMode(m); reset() } }} style={{
            padding: '6px 14px', fontSize: 12, fontFamily: s.mono, cursor: running ? 'default' : 'pointer',
            border: `1px solid ${mode === m ? s.accent : s.border}`, borderRadius: 6,
            background: mode === m ? 'rgba(91,141,239,0.12)' : 'transparent',
            color: mode === m ? s.accent : s.text3, fontWeight: mode === m ? 600 : 400,
          }}>
            {m === 'saga' ? 'Saga Pattern' : 'Two-Phase Commit'}
          </button>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>Fail at:</span>
          <select value={failAt === null ? '' : failAt} onChange={e => { if (!running) setFailAt(e.target.value === '' ? null : Number(e.target.value)) }} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '5px 8px',
            color: s.text2, fontFamily: s.mono, fontSize: 12,
          }}>
            <option value="">None (success)</option>
            {initialSteps.map((st, i) => (
              <option key={i} value={i}>{st.label}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }} />

        <button onClick={start} disabled={running} style={{
          padding: '6px 16px', fontSize: 13, fontFamily: s.mono, cursor: running ? 'default' : 'pointer',
          border: `1px solid ${s.accent}`, borderRadius: 6,
          background: running ? s.bg3 : 'rgba(91,141,239,0.15)', color: running ? s.text3 : s.accent,
          fontWeight: 600,
        }}>
          {running ? 'Running...' : 'Start Order'}
        </button>
        <button onClick={reset} style={{
          padding: '6px 10px', fontSize: 12, fontFamily: s.mono, cursor: 'pointer',
          border: `1px solid ${s.border}`, borderRadius: 6, background: s.bg3, color: s.text3,
        }}>Reset</button>
        <SpeedController speed={speed} onSpeedChange={setSpeed} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 20 }}>
        {steps.map((step, idx) => {
          const ss = statusStyle(step.status)
          const isLast = idx === steps.length - 1
          return (
            <div key={step.id}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                background: ss.bg, border: `1px solid ${ss.border}`,
                borderRadius: isLast ? 8 : 0,
                borderTopLeftRadius: idx === 0 ? 8 : 0,
                borderTopRightRadius: idx === 0 ? 8 : 0,
                transition: 'all 0.3s',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: `${ss.dot}20`, border: `2px solid ${ss.dot}`,
                  fontSize: 11, fontFamily: s.mono, fontWeight: 700, color: ss.dot,
                }}>
                  {step.status === 'success' ? '+' : step.status === 'failed' ? '!' : step.status === 'compensated' ? '<' : step.status === 'rolled-back' ? '<' : step.status === 'compensating' ? '~' : idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: ss.color }}>{step.label}</div>
                  {(step.status === 'compensating' || step.status === 'compensated') && (
                    <div style={{ fontSize: 11, fontFamily: s.mono, color: s.orange, marginTop: 2 }}>
                      Running: {step.compensate}
                    </div>
                  )}
                  {(step.status === 'rolled-back') && (
                    <div style={{ fontSize: 11, fontFamily: s.mono, color: s.red, marginTop: 2 }}>
                      Rolled back
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: 10, fontFamily: s.mono, color: s.text3,
                  padding: '3px 8px', borderRadius: 4, background: s.bg,
                }}>
                  Step {idx + 1}
                </div>
              </div>
              {!isLast && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                  <div style={{ width: 2, height: 12, background: s.border }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {logs.length > 0 && (
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: `1px solid ${s.border}`, fontSize: 12, fontFamily: s.mono, color: s.text3 }}>
            {mode === 'saga' ? 'SAGA' : '2PC'} LOG
          </div>
          <div ref={logRef} style={{ padding: 10, maxHeight: 160, overflowY: 'auto' }}>
            {logs.map((log, i) => (
              <div key={i} style={{
                fontSize: 11, fontFamily: s.mono, color: log.color, padding: '3px 0',
                opacity: i === logs.length - 1 ? 1 : 0.5,
              }}>
                {log.text}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: s.bg3, borderRadius: 8, padding: '10px 14px', borderLeft: `3px solid ${s.accent}` }}>
          <div style={{ fontSize: 11, fontFamily: s.mono, color: s.accent, marginBottom: 4 }}>SAGA PATTERN</div>
          <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
            Each step runs a local transaction. On failure, compensating actions undo previous steps in reverse order. No global lock — each service is independent.
          </div>
        </div>
        <div style={{ background: s.bg3, borderRadius: 8, padding: '10px 14px', borderLeft: `3px solid ${s.purple}` }}>
          <div style={{ fontSize: 11, fontFamily: s.mono, color: s.purple, marginBottom: 4 }}>TWO-PHASE COMMIT</div>
          <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
            Phase 1: all participants vote "prepare." Phase 2: coordinator commits or aborts. If any participant votes no, all roll back. Requires a locking coordinator.
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
