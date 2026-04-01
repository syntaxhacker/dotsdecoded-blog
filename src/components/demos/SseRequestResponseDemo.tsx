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

const HTTP_BODY = [
  '{',
  '  "data": [',
  '    {"id": 1, "name": "Alice", "score": 92},',
  '    {"id": 2, "name": "Bob", "score": 85},',
  '    {"id": 3, "name": "Charlie", "score": 78},',
  '    {"id": 4, "name": "Diana", "score": 95},',
  '    {"id": 5, "name": "Eve", "score": 88}',
  '  ],',
  '  "total": 5',
  '}',
]

const SSE_EVENTS = [
  { event: 'user_update', data: '{"id": 1, "name": "Alice", "score": 92}' },
  { event: 'user_update', data: '{"id": 2, "name": "Bob", "score": 85}' },
  { event: 'score_change', data: '{"id": 1, "old": 92, "new": 94}' },
  { event: 'user_update', data: '{"id": 3, "name": "Charlie", "score": 78}' },
  { event: 'user_left', data: '{"id": 2, "reason": "disconnect"}' },
  { event: 'score_change', data: '{"id": 3, "old": 78, "new": 82}' },
]

const HTTP_WAIT_MS = 3000
const SSE_CHUNK_MS = 450
const SSE_FIRST_MS = 200

export default function SseRequestResponseDemo() {
  const [speed, setSpeed] = useState(1)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [httpDone, setHttpDone] = useState(false)
  const [sseDone, setSseDone] = useState(false)
  const [httpLines, setHttpLines] = useState<string[]>([])
  const [sseChunks, setSseChunks] = useState<{event: string; data: string}[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [httpArrival, setHttpArrival] = useState(0)
  const [firstChunkAt, setFirstChunkAt] = useState(0)
  const [btnHover, setBtnHover] = useState(false)
  const [typingChunks, setTypingChunks] = useState<Set<number>>(new Set())

  const speedRef = useRef(speed)
  speedRef.current = speed
  const sseScrollRef = useRef<HTMLDivElement>(null)
  const startTsRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const runRef = useRef(0)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const handleStart = useCallback(() => {
    clearTimers()
    runRef.current++
    const run = runRef.current
    startTsRef.current = Date.now()

    setPhase('running')
    setHttpDone(false)
    setSseDone(false)
    setHttpLines([])
    setSseChunks([])
    setElapsed(0)
    setHttpArrival(0)
    setFirstChunkAt(0)
    setTypingChunks(new Set())

    const httpTimer = setTimeout(() => {
      if (runRef.current !== run) return
      setHttpLines(HTTP_BODY)
      setHttpDone(true)
      setHttpArrival(Date.now() - startTsRef.current)
    }, getStepDelay(HTTP_WAIT_MS, speedRef.current))
    timersRef.current.push(httpTimer)

    let idx = 0
    const next = () => {
      if (runRef.current !== run) return
      const baseDelay = idx === 0 ? SSE_FIRST_MS : SSE_CHUNK_MS
      const timer = setTimeout(() => {
        if (runRef.current !== run) return
        if (idx < SSE_EVENTS.length) {
          setSseChunks(prev => [...prev, SSE_EVENTS[idx]])
          if (idx === 0) setFirstChunkAt(Date.now() - startTsRef.current)
          setTypingChunks(prev => new Set(prev).add(idx))
          const chunkIdx = idx
          const typeTimer = setTimeout(() => {
            setTypingChunks(prev => {
              const next = new Set(prev)
              next.delete(chunkIdx)
              return next
            })
          }, getStepDelay(300, speedRef.current))
          timersRef.current.push(typeTimer)
          idx++
          if (idx < SSE_EVENTS.length) {
            next()
          } else {
            setSseDone(true)
          }
        }
      }, getStepDelay(baseDelay, speedRef.current))
      timersRef.current.push(timer)
    }
    next()
  }, [clearTimers])

  useEffect(() => {
    if (httpDone && sseDone) setPhase('done')
  }, [httpDone, sseDone])

  useEffect(() => {
    if (phase !== 'running') return
    const iv = setInterval(() => setElapsed(Date.now() - startTsRef.current), 50)
    return () => clearInterval(iv)
  }, [phase])

  useEffect(() => {
    const el = sseScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [sseChunks])

  useEffect(() => clearTimers, [clearTimers])

  const running = phase === 'running'
  const httpProgress = running && !httpDone ? Math.min(elapsed / HTTP_WAIT_MS, 1) : 0
  const fmt = (ms: number) => ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`

  return (
    <DemoBoundary name="HTTP vs SSE">
      <style>{`
        @keyframes sseFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sseTyping {
          from { opacity: 0.4; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleStart}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              padding: '8px 20px',
              background: running
                ? s.bg3
                : btnHover
                  ? '#4a7de0'
                  : s.accent,
              color: running ? s.text3 : '#fff',
              border: `1px solid ${running ? s.border : s.accent}`,
              borderRadius: 6,
              cursor: running ? 'default' : 'pointer',
              fontFamily: s.mono,
              fontSize: 13,
              transition: 'all 0.2s',
              outline: 'none',
            }}
            disabled={running}
          >
            {running ? 'Running...' : phase === 'done' ? 'Run Again' : 'Send Request'}
          </button>
          {running && <SpeedController speed={speed} onSpeedChange={setSpeed} />}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}>
            <div style={{
              padding: '10px 14px',
              borderBottom: `1px solid ${s.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.orange }} />
              <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>Regular HTTP</span>
            </div>
            <div style={{ padding: 12, fontFamily: s.mono, fontSize: 12, minHeight: 220 }}>
              {phase === 'idle' && (
                <span style={{ color: s.text3 }}>Click "Send Request" to start</span>
              )}
              {(running || phase === 'done') && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: s.green }}>{'>'} GET /api/users</span>
                    <span style={{ color: s.text3 }}> HTTP/1.1</span>
                  </div>
                  {running && !httpDone && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ color: s.yellow, marginBottom: 8 }}>
                        <span style={{ animation: 'pulse 1.2s ease-in-out infinite' }}>Waiting for server...</span>
                        <span style={{ color: s.text3 }}> {fmt(elapsed)}</span>
                      </div>
                      <div style={{ height: 4, background: s.bg3, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${httpProgress * 100}%`,
                          background: s.orange,
                          transition: 'width 0.15s linear',
                          borderRadius: 2,
                        }} />
                      </div>
                      <div style={{ color: s.text3, fontSize: 11, marginTop: 6 }}>
                        0 bytes received
                      </div>
                    </div>
                  )}
                  {httpDone && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ color: s.green, fontSize: 11, marginBottom: 6 }}>
                        HTTP 200 OK — {fmt(httpArrival)}
                      </div>
                      <div style={{
                        color: s.text2,
                        margin: 0,
                        whiteSpace: 'pre',
                        lineHeight: 1.6,
                        animation: 'sseFadeIn 0.4s ease',
                      }}>
                        {httpLines.join('\n')}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div style={{
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}>
            <div style={{
              padding: '10px 14px',
              borderBottom: `1px solid ${s.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green }} />
              <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>SSE Stream</span>
            </div>
            <div
              ref={sseScrollRef}
              style={{
                padding: 12,
                fontFamily: s.mono,
                fontSize: 12,
                minHeight: 220,
                maxHeight: 280,
                overflowY: 'auto',
              }}
            >
              {phase === 'idle' && (
                <span style={{ color: s.text3 }}>Click "Send Request" to start</span>
              )}
              {(running || phase === 'done') && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: s.green }}>{'>'} GET /api/stream</span>
                    <span style={{ color: s.text3 }}> HTTP/1.1</span>
                    <span style={{ color: s.green, marginLeft: 8 }}>
                      connected
                      {(running && !sseDone) && (
                        <span style={{ animation: 'blink 1s step-end infinite' }}>|</span>
                      )}
                    </span>
                  </div>
                  {sseChunks.length === 0 && running && (
                    <div style={{ color: s.text3, marginTop: 8 }}>
                      Waiting for events... {fmt(elapsed)}
                    </div>
                  )}
                  {sseChunks.length > 0 && sseChunks.map((chunk, i) => chunk ? (
                    <div
                      key={i}
                      style={{
                        marginTop: i > 0 ? 6 : 8,
                        padding: '6px 8px',
                        background: s.bg,
                        borderRadius: 4,
                        border: `1px solid ${s.border}`,
                        animation: 'sseFadeIn 0.3s ease',
                      }}
                    >
                      <div style={{ color: s.purple, fontSize: 11 }}>event: {chunk.event}</div>
                      <div style={{
                        color: typingChunks.has(i) ? s.text3 : s.text2,
                        animation: typingChunks.has(i) ? 'sseTyping 0.3s ease forwards' : undefined,
                      }}>
                        data: {chunk.data}
                      </div>
                    </div>
                  ) : null)}
                  {running && !sseDone && sseChunks.length > 0 && (
                    <div style={{ color: s.yellow, marginTop: 8, fontSize: 11 }}>
                      listening... {fmt(elapsed)} — {sseChunks.length} event{sseChunks.length !== 1 ? 's' : ''} received
                    </div>
                  )}
                  {phase === 'done' && (
                    <div style={{ color: s.green, marginTop: 8, fontSize: 11 }}>
                      stream complete — {sseChunks.length} events in {fmt(elapsed)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {phase === 'done' && (
          <div style={{
            marginTop: 12,
            padding: '12px 16px',
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.orange }} />
              <span style={{ color: s.text2, fontSize: 12, fontFamily: s.mono }}>
                HTTP: waited {fmt(httpArrival)}, got everything at once
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green }} />
              <span style={{ color: s.text2, fontSize: 12, fontFamily: s.mono }}>
                SSE: first event at {fmt(firstChunkAt)}, {sseChunks.length} events total
              </span>
            </div>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
