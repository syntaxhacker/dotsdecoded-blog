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

const STAGES = [
  { id: 'submit', label: 'Client Submit', sub: 'POST /events', acid: 'Atomic' },
  { id: 'authz', label: 'AuthZ + Quota', sub: 'RBAC + rate limit', acid: 'Consistent' },
  { id: 'validate', label: 'Validate', sub: 'Schema + conflicts', acid: 'Consistent' },
  { id: 'primary', label: 'Write Primary', sub: 'Event shard + WAL', acid: 'Durable' },
  { id: 'indexes', label: 'Update Indexes', sub: 'Freebusy + search', acid: 'Consistent' },
  { id: 'notify', label: 'Fanout Notify', sub: 'Attendees + ics', acid: 'Atomic' },
  { id: 'views', label: 'Materialize + Purge', sub: 'Cache + views', acid: 'Consistent' },
]

interface StageState {
  status: 'pending' | 'active' | 'success' | 'failed' | 'compensating' | 'compensated' | 'aborted'
  latency: number
}

export default function WritePathTransactionDemo() {
  const [steps, setSteps] = useState<Record<string, StageState>>({})
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [log, setLog] = useState<string[]>([])
  const [failAt, setFailAt] = useState<Record<string, boolean>>({})
  const [acidChecks, setAcidChecks] = useState<Record<string, boolean>>({})
  const [mode, setMode] = useState<'saga' | '2pc'>('saga')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const reset = useCallback(() => {
    const init: Record<string, StageState> = {}
    STAGES.forEach(st => { init[st.id] = { status: 'pending', latency: 0 } })
    setSteps(init)
    setLog([])
    setAcidChecks({})
    setIsPlaying(false)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current) } }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  const addLog = (msg: string, ok: boolean) => {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLog(l => [...l.slice(-8), `${ts} ${ok ? '+' : '!'} ${msg}`])
  }

  const start = () => {
    if (isPlaying) { reset(); return }
    reset()
    setIsPlaying(true)
    const init: Record<string, StageState> = {}
    STAGES.forEach(st => { init[st.id] = { status: 'pending', latency: 0 } })
    setSteps(init)
    setLog([])
    setAcidChecks({})
    setTimeout(() => runTransaction(0), 80)
  }

  const runTransaction = (idx: number) => {
    if (idx >= STAGES.length) {
      setIsPlaying(false)
      addLog('Commit + ACK to client', true)
      setAcidChecks({ a: true, c: true, i: true, d: true })
      return
    }

    const stage = STAGES[idx]
    const willFail = failAt[stage.id] || false

    setSteps(prev => ({ ...prev, [stage.id]: { status: 'active', latency: 0 } }))
    addLog(`${stage.label} (${stage.sub})`, true)

    const base = [80, 60, 110, 45, 95, 130, 70][idx]
    const delay = getStepDelay(base, speed)

    timerRef.current = setTimeout(() => {
      const lat = Math.floor(base * (0.7 + Math.random() * 0.6))

      if (willFail) {
        setSteps(prev => ({ ...prev, [stage.id]: { status: 'failed', latency: lat } }))
        addLog(`FAILED at ${stage.label}`, false)

        if (mode === 'saga') {
          let c = idx - 1
          const compensate = () => {
            if (c < 0) {
              addLog('Saga compensation complete — partial rollback', false)
              setIsPlaying(false)
              return
            }
            const prevStage = STAGES[c]
            setSteps(p => ({ ...p, [prevStage.id]: { status: 'compensating', latency: 0 } }))
            addLog(`Compensate: undo ${prevStage.label}`, false)
            timerRef.current = setTimeout(() => {
              setSteps(p => ({ ...p, [prevStage.id]: { status: 'compensated', latency: 0 } }))
              c--
              timerRef.current = setTimeout(compensate, getStepDelay(220, speed))
            }, getStepDelay(380, speed))
          }
          compensate()
        } else {
          let r = idx - 1
          const rollback = () => {
            if (r < 0) {
              addLog('2PC abort — all prepared rolled back', false)
              setIsPlaying(false)
              return
            }
            const prevStage = STAGES[r]
            setSteps(p => ({ ...p, [prevStage.id]: { status: 'aborted', latency: 0 } }))
            addLog(`Rollback: ${prevStage.label}`, false)
            r--
            timerRef.current = setTimeout(rollback, getStepDelay(260, speed))
          }
          rollback()
        }
      } else {
        setSteps(prev => ({ ...prev, [stage.id]: { status: 'success', latency: lat } }))
        addLog(`OK ${stage.label} ${lat}ms`, true)
        const acidKey = ['a', 'c', 'i', 'd'][Math.min(3, Math.floor(idx / 2))]
        if (acidKey) setAcidChecks(p => ({ ...p, [acidKey]: true }))
        runTransaction(idx + 1)
      }
    }, delay)
  }

  const toggleFail = (id: string) => {
    setFailAt(f => ({ ...f, [id]: !f[id] }))
  }

  const statusStyle = (st: string) => {
    if (st === 'active') return { bg: 'rgba(91,141,239,0.12)', bd: s.accent, col: s.accent }
    if (st === 'success') return { bg: 'rgba(61,214,140,0.08)', bd: s.green, col: s.green }
    if (st === 'failed') return { bg: 'rgba(232,93,93,0.1)', bd: s.red, col: s.red }
    if (st === 'compensating' || st === 'compensated') return { bg: 'rgba(232,148,90,0.08)', bd: s.orange, col: s.orange }
    if (st === 'aborted') return { bg: 'rgba(232,93,93,0.06)', bd: s.red, col: s.red }
    return { bg: s.bg3, bd: s.border, col: s.text3 }
  }

  const acidLabels: Record<string, string> = { a: 'Atomic', c: 'Consistent', i: 'Isolated', d: 'Durable' }

  return (
    <DemoBoundary name="Write Path Transactions">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button onClick={start} style={{ background: isPlaying ? s.red : s.green, color: isPlaying ? '#fff' : '#000', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{isPlaying ? 'Abort' : 'Execute Write Transaction'}</button>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setMode('saga')} style={{ background: mode === 'saga' ? s.accent : s.bg3, color: s.text, border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Saga</button>
            <button onClick={() => setMode('2pc')} style={{ background: mode === '2pc' ? s.accent : s.bg3, color: s.text, border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>2PC</button>
          </div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
          <button onClick={reset} style={{ background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Reset</button>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
          {STAGES.map((st, i) => {
            const stt = steps[st.id] || { status: 'pending', latency: 0 }
            const sty = statusStyle(stt.status)
            const isFail = failAt[st.id]
            return (
              <div key={i} style={{ flex: '1 1 96px', background: sty.bg, border: `1px solid ${sty.bd}`, borderRadius: 6, padding: '6px 6px', fontSize: 10, textAlign: 'center', position: 'relative' }}>
                <div style={{ color: sty.col, fontWeight: 600 }}>{st.label}</div>
                <div style={{ color: s.text3, fontSize: 9 }}>{st.sub}</div>
                <div style={{ color: s.green, fontFamily: s.mono, fontSize: 9, marginTop: 2 }}>{stt.latency ? `${stt.latency}ms` : ''}</div>
                <label style={{ position: 'absolute', top: -1, right: 2, fontSize: 9, cursor: 'pointer', color: isFail ? s.red : s.text3 }}>
                  <input type="checkbox" checked={!!isFail} onChange={() => toggleFail(st.id)} style={{ marginRight: 2 }} /> fail
                </label>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {Object.keys(acidLabels).map(k => (
            <div key={k} style={{ flex: 1, background: acidChecks[k] ? 'rgba(61,214,140,0.1)' : s.bg, border: `1px solid ${acidChecks[k] ? s.green : s.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 10, textAlign: 'center', color: acidChecks[k] ? s.green : s.text3 }}>
              {acidLabels[k]} {acidChecks[k] ? '✓' : ''}
            </div>
          ))}
        </div>

        <div ref={logRef} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: 8, height: 96, overflowY: 'auto', fontFamily: s.mono, fontSize: 10, color: s.text2 }}>
          {log.length === 0 && <div style={{ color: s.text3 }}>Transaction log appears here. Toggle "fail" checkboxes then click Execute to see saga compensation or 2PC abort.</div>}
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>

        <div style={{ marginTop: 10, fontSize: 10, color: s.text3 }}>Calendar write path is a distributed saga (or 2PC for strong consistency). Each stage can fail independently; compensation undoes prior work in reverse. ACID checklist lights up as stages succeed. Toggle any "fail" to simulate partial failure and watch rollback.</div>
      </div>
    </DemoBoundary>
  )
}
