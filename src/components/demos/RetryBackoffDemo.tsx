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

type EntryStatus = 'request' | 'fail' | 'backoff' | 'retry' | 'success' | 'exhausted'

interface TimelineEntry {
  id: number
  status: EntryStatus
  label: string
  delay: number
  attempt: number
}

export default function RetryBackoffDemo() {
  const [baseDelay, setBaseDelay] = useState(1000)
  const [maxRetries, setMaxRetries] = useState(5)
  const [mode, setMode] = useState<'backoff' | 'immediate'>('backoff')
  const [running, setRunning] = useState(false)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [serverOverloaded, setServerOverloaded] = useState(false)
  const [immediateCount, setImmediateCount] = useState(0)
  const [speed, setSpeed] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const entryIdRef = useRef(0)
  const logRef = useRef<HTMLDivElement>(null)

  const addEntry = useCallback((status: EntryStatus, label: string, delay: number, attempt: number) => {
    entryIdRef.current++
    setTimeline(prev => [...prev, { id: entryIdRef.current, status, label, delay, attempt }])
  }, [])

  const reset = useCallback(() => {
    setRunning(false)
    setTimeline([])
    setServerOverloaded(false)
    setImmediateCount(0)
    entryIdRef.current = 0
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const runWithBackoff = useCallback(() => {
    if (!running) return

    let attempt = 0
    const jitter = () => Math.floor(Math.random() * baseDelay * 0.3)

    const step = () => {
      if (attempt === 0) {
        addEntry('request', 'Request sent', 0, attempt)
        attempt++
        timerRef.current = setTimeout(step, getStepDelay(400, speed))
        return
      }

      const fails = attempt <= maxRetries
      if (fails) {
        addEntry('fail', `Failed (server error)`, 0, attempt)
        const delay = baseDelay * Math.pow(2, attempt - 1) + jitter()
        addEntry('backoff', `Wait ${Math.round(delay)}ms`, delay, attempt)
        addEntry('retry', `Retry #${attempt}`, 0, attempt)
        attempt++
        timerRef.current = setTimeout(step, getStepDelay(delay * 0.3, speed))
      } else {
        addEntry('success', `Success on attempt ${attempt}`, 0, attempt)
        setRunning(false)
      }
    }

    step()
  }, [running, baseDelay, maxRetries, speed, addEntry])

  const runImmediate = useCallback(() => {
    if (!running) return

    let attempt = 0
    const totalRetries = maxRetries

    const step = () => {
      if (attempt <= totalRetries) {
        addEntry('request', `Attempt #${attempt + 1}`, 0, attempt + 1)
        if (attempt < totalRetries) {
          addEntry('fail', 'Failed', 0, attempt + 1)
          setImmediateCount(prev => prev + 1)
          if (immediateCount + attempt >= 3) {
            setServerOverloaded(true)
          }
        } else {
          addEntry('exhausted', 'All retries exhausted', 0, attempt + 1)
        }
        attempt++
        timerRef.current = setTimeout(step, getStepDelay(200, speed))
      } else {
        setRunning(false)
      }
    }

    step()
  }, [running, maxRetries, speed, addEntry, immediateCount])

  useEffect(() => {
    if (!running) return
    if (mode === 'backoff') {
      runWithBackoff()
    } else {
      runImmediate()
    }
  }, [running, mode, runWithBackoff, runImmediate])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [timeline])

  const start = () => {
    reset()
    setRunning(true)
  }

  const statusColor = (st: EntryStatus) => {
    switch (st) {
      case 'request': return s.accent
      case 'fail': return s.red
      case 'backoff': return s.yellow
      case 'retry': return s.orange
      case 'success': return s.green
      case 'exhausted': return s.red
    }
  }

  return (
    <DemoBoundary name="Retry with Exponential Backoff">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 4 }}>MODE</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['backoff', 'immediate'] as const).map(m => (
              <button key={m} onClick={() => { if (!running) setMode(m) }} style={{
                padding: '6px 14px', fontSize: 12, fontFamily: s.mono, cursor: running ? 'default' : 'pointer',
                border: `1px solid ${mode === m ? (m === 'backoff' ? s.green : s.red) : s.border}`,
                borderRadius: 6, transition: 'all 0.2s',
                background: mode === m ? (m === 'backoff' ? 'rgba(61,214,140,0.12)' : 'rgba(232,93,93,0.12)') : s.bg3,
                color: mode === m ? (m === 'backoff' ? s.green : s.red) : s.text3,
              }}>
                {m === 'backoff' ? 'Exponential Backoff' : 'Immediate Retry'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 4 }}>BASE DELAY</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="range" min={500} max={3000} step={500} value={baseDelay}
              onChange={e => { if (!running) setBaseDelay(Number(e.target.value)) }}
              disabled={running} style={{ width: 80 }} />
            <span style={{ fontSize: 12, fontFamily: s.mono, color: s.accent, minWidth: 40 }}>{baseDelay}ms</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 4 }}>MAX RETRIES</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="range" min={1} max={8} value={maxRetries}
              onChange={e => { if (!running) setMaxRetries(Number(e.target.value)) }}
              disabled={running} style={{ width: 80 }} />
            <span style={{ fontSize: 12, fontFamily: s.mono, color: s.accent, minWidth: 16 }}>{maxRetries}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <button onClick={start} disabled={running} style={{
            padding: '6px 16px', fontSize: 13, fontFamily: s.mono, cursor: running ? 'default' : 'pointer',
            border: `1px solid ${s.accent}`, borderRadius: 6, transition: 'all 0.2s',
            background: running ? s.bg3 : 'rgba(91,141,239,0.15)', color: running ? s.text3 : s.accent,
          }}>
            {running ? 'Running...' : 'Send Request'}
          </button>
          <button onClick={reset} style={{
            padding: '6px 12px', fontSize: 12, fontFamily: s.mono, cursor: 'pointer',
            border: `1px solid ${s.border}`, borderRadius: 6, background: s.bg3, color: s.text3,
          }}>Reset</button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
      </div>

      {serverOverloaded && (
        <div style={{ background: 'rgba(232,93,93,0.1)', border: `1px solid ${s.red}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.red, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontFamily: s.mono, color: s.red }}>SERVER OVERLOADED: Too many immediate retries — thundering herd in effect</span>
        </div>
      )}

      <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text3 }}>TIMELINE</span>
          {mode === 'backoff' && timeline.length > 0 && (
            <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>
              delay = {baseDelay}ms * 2^(attempt-1) + jitter
            </span>
          )}
        </div>
        <div ref={logRef} style={{ padding: 12, maxHeight: 320, overflowY: 'auto', minHeight: 100 }}>
          {timeline.length === 0 && (
            <div style={{ fontSize: 13, color: s.text3, textAlign: 'center', padding: '20px 0' }}>
              Click "Send Request" to simulate a failing endpoint
            </div>
          )}
          {timeline.map(entry => (
            <div key={entry.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
              borderBottom: entry.id < timeline.length ? `1px solid ${s.bg3}` : 'none',
              opacity: entry.id === timeline.length ? 1 : 0.7,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(entry.status), flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontFamily: s.mono, color: statusColor(entry.status), fontWeight: 600 }}>
                  {entry.label}
                </span>
                {entry.delay > 0 && (
                  <span style={{ fontSize: 11, fontFamily: s.mono, color: s.yellow, marginLeft: 8 }}>
                    (+{Math.round(entry.delay)}ms backoff)
                  </span>
                )}
              </div>
              {entry.status === 'backoff' && (
                <div style={{
                  height: 4, borderRadius: 2, background: s.yellow,
                  width: Math.min(Math.max(entry.delay / 20, 8), 200),
                  transition: 'width 0.3s',
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ background: s.bg3, borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontFamily: s.mono, color: s.green, marginBottom: 4 }}>WITH BACKOFF</div>
          <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.5 }}>
            Retry 1 after {baseDelay}ms, retry 2 after {baseDelay * 2}ms, retry 3 after {baseDelay * 4}ms...
            Jitter prevents all clients from retrying simultaneously.
          </div>
        </div>
        <div style={{ background: s.bg3, borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontFamily: s.mono, color: s.red, marginBottom: 4 }}>WITHOUT BACKOFF</div>
          <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.5 }}>
            All retries fire instantly. If 1000 clients retry at once, the overloaded server gets 1000 more requests and falls harder.
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
