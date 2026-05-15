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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface ChanOp {
  goroutine: string
  action: 'send' | 'recv'
  value?: number
  step: number
}

export default function GoChannelDemo() {
  const [speed, setSpeed] = useState(1)
  const [mode, setMode] = useState<'unbuffered' | 'buffered'>('buffered')
  const [bufferSize, setBufferSize] = useState(3)
  const [buffer, setBuffer] = useState<(number | null)[]>([null, null, null])
  const [sendq, setSendq] = useState<string[]>([])
  const [recvq, setRecvq] = useState<string[]>([])
  const [phase, setPhase] = useState<'idle' | 'running' | 'blocked' | 'done'>('idle')
  const [log, setLog] = useState<string[]>([])
  const [sendBlocked, setSendBlocked] = useState(false)
  const [recvBlocked, setRecvBlocked] = useState(false)
  const [activeSend, setActiveSend] = useState<string | null>(null)
  const [activeRecv, setActiveRecv] = useState<string | null>(null)
  const [matchFlash, setMatchFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const addLog = useCallback((msg: string) => {
    setLog(prev => [...prev.slice(-14), msg])
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const runScenario = useCallback(() => {
    stop()
    setPhase('running')
    setLog([])
    setSendq([])
    setRecvq([])
    setSendBlocked(false)
    setRecvBlocked(false)
    setActiveSend(null)
    setActiveRecv(null)
    setMatchFlash(false)
    setBuffer(Array(bufferSize).fill(null))

    const ops: ChanOp[] = mode === 'unbuffered'
      ? [
          { goroutine: 'G1', action: 'send', value: 42, step: 0 },
          { goroutine: 'G2', action: 'recv', step: 1 },
        ]
      : [
          { goroutine: 'G1', action: 'send', value: 10, step: 0 },
          { goroutine: 'G2', action: 'send', value: 20, step: 1 },
          { goroutine: 'G3', action: 'send', value: 30, step: 2 },
          { goroutine: 'G4', action: 'recv', step: 3 },
          { goroutine: 'G4', action: 'recv', step: 4 },
          { goroutine: 'G5', action: 'send', value: 40, step: 5 },
          { goroutine: 'G5', action: 'send', value: 50, step: 6 },
          { goroutine: 'G5', action: 'send', value: 60, step: 7 },
          { goroutine: 'G5', action: 'send', value: 70, step: 8 },
        ]

    let step = 0
    let currentBuffer: (number | null)[] = Array(bufferSize).fill(null)
    let currentSendq: string[] = []
    let currentRecvq: string[] = []

    intervalRef.current = setInterval(() => {
      if (step >= ops.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setPhase('done')
        return
      }

      const op = ops[step]
      setActiveSend(op.action === 'send' ? op.goroutine : null)
      setActiveRecv(op.action === 'recv' ? op.goroutine : null)

      if (op.action === 'send') {
        if (currentRecvq.length > 0) {
          const receiver = currentRecvq.shift()!
          setRecvq([...currentRecvq])
          setMatchFlash(true)
          setTimeout(() => setMatchFlash(false), 300)
          addLog(`${op.goroutine} sends value ${op.value} → matched with ${receiver} (direct handoff)`)
        } else {
          const emptyIdx = currentBuffer.indexOf(null)
          if (emptyIdx !== -1) {
            currentBuffer[emptyIdx] = op.value!
            setBuffer([...currentBuffer])
            addLog(`${op.goroutine} sends value ${op.value} → buffered at slot ${emptyIdx + 1}`)
          } else {
            currentSendq.push(op.goroutine)
            setSendq([...currentSendq])
            setSendBlocked(true)
            setTimeout(() => setSendBlocked(false), 500)
            addLog(`${op.goroutine} tries to send ${op.value} → buffer full, goroutine blocks`)
          }
        }
      } else {
        const emptyIdx = currentBuffer.findIndex(v => v !== null)
        if (emptyIdx !== -1) {
          const val = currentBuffer[emptyIdx]
          currentBuffer[emptyIdx] = null
          setBuffer([...currentBuffer])
          addLog(`${op.goroutine} receives value ${val} from buffer slot ${emptyIdx + 1}`)

          if (currentSendq.length > 0) {
            const sender = currentSendq.shift()!
            setSendq([...currentSendq])
            addLog(`Buffered sender ${sender} now unblocked`)
          }
        } else {
          currentRecvq.push(op.goroutine)
          setRecvq([...currentRecvq])
          setRecvBlocked(true)
          setTimeout(() => setRecvBlocked(false), 500)
          addLog(`${op.goroutine} tries to receive → buffer empty, goroutine blocks`)
        }
      }

      step++
    }, getStepDelay(1200, speed))
  }, [speed, mode, bufferSize, addLog, stop])

  const resetAll = useCallback(() => {
    stop()
    setPhase('idle')
    setLog([])
    setSendq([])
    setRecvq([])
    setSendBlocked(false)
    setRecvBlocked(false)
    setActiveSend(null)
    setActiveRecv(null)
    setMatchFlash(false)
    setBuffer(Array(bufferSize).fill(null))
  }, [bufferSize, stop])

  return (
    <DemoBoundary name="Channel Internals">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={H}>Channel Internals</div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Channels are Go's built-in communication primitive. The runtime `hchan` struct holds a buffer, send/recv queue, and mutex.
          Unbuffered channels block until both sides are ready. Buffered channels block only when the buffer is full (send) or empty (recv).
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => { setMode('unbuffered'); resetAll() }} style={{
            background: mode === 'unbuffered' ? s.accent : s.bg3,
            border: `1px solid ${mode === 'unbuffered' ? s.accent : s.border}`,
            borderRadius: 8, padding: '8px 16px',
            color: mode === 'unbuffered' ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
          }}>Unbuffered</button>
          <button onClick={() => { setMode('buffered'); resetAll() }} style={{
            background: mode === 'buffered' ? s.accent : s.bg3,
            border: `1px solid ${mode === 'buffered' ? s.accent : s.border}`,
            borderRadius: 8, padding: '8px 16px',
            color: mode === 'buffered' ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
          }}>Buffered (size {bufferSize})</button>
          {mode === 'buffered' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: s.text3, fontSize: 12 }}>Buffer:</span>
              {[1, 2, 3].map(sz => (
                <button key={sz} onClick={() => { setBufferSize(sz); resetAll() }} style={{
                  background: bufferSize === sz ? s.accent : s.bg3,
                  border: `1px solid ${bufferSize === sz ? s.accent : s.border}`,
                  borderRadius: 6, padding: '4px 12px',
                  color: bufferSize === sz ? '#fff' : s.text2,
                  cursor: 'pointer', fontSize: 11, fontFamily: s.mono,
                }}>{sz}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>hchan Struct</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text2, padding: '2px 0' }}>
                <span style={{ color: s.purple }}>buf</span>: [{buffer.map((v, i) => (
                  <span key={i} style={{ color: v !== null ? s.green : s.text3 }}>
                    {v !== null ? v : '_'}{i < buffer.length - 1 ? ', ' : ''}
                  </span>
                ))}]
              </div>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text2, padding: '2px 0' }}>
                <span style={{ color: s.yellow }}>sendq</span>: [{sendq.map((g, i) => (
                  <span key={i} style={{ color: s.orange }}>{g}{i < sendq.length - 1 ? ', ' : ''}</span>
                ))}]
              </div>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text2, padding: '2px 0' }}>
                <span style={{ color: s.accent }}>recvq</span>: [{recvq.map((g, i) => (
                  <span key={i} style={{ color: s.accent }}>{g}{i < recvq.length - 1 ? ', ' : ''}</span>
                ))}]
              </div>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, padding: '2px 0' }}>
                <span style={{ color: s.text3 }}>mutex</span>: {sendBlocked || recvBlocked ? (
                  <span style={{ color: s.red }}>LOCKED</span>
                ) : (
                  <span style={{ color: s.green }}>unlocked</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Channel Buffer</span>
            <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 11 }}>
              {buffer.filter(v => v !== null).length}/{bufferSize} used
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {buffer.map((v, i) => (
              <div key={i} style={{
                flex: 1, height: 60, borderRadius: 8,
                background: v !== null ? s.green : s.bg3,
                border: `2px solid ${v !== null ? s.green : s.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontFamily: s.mono, color: v !== null ? '#fff' : s.text3,
                fontWeight: 700,
                transition: 'all 0.3s ease',
                transform: matchFlash && v !== null ? 'scale(1.1)' : 'scale(1)',
              }}>
                {v !== null ? v : '-'}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${sendBlocked ? s.red : s.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: s.text3, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Send Queue (sendq)</div>
            {sendq.length === 0 ? (
              <span style={{ color: s.text3, fontSize: 11 }}>empty</span>
            ) : (
              sendq.map((g, i) => (
                <div key={i} style={{
                  padding: '4px 8px', borderRadius: 4, fontSize: 11, fontFamily: s.mono,
                  background: s.bg3, border: `1px solid ${s.border}`,
                  color: s.orange, marginBottom: 3,
                }}>
                  {g} (blocked on send)
                </div>
              ))
            )}
          </div>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${recvBlocked ? s.accent : s.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: s.text3, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Receive Queue (recvq)</div>
            {recvq.length === 0 ? (
              <span style={{ color: s.text3, fontSize: 11 }}>empty</span>
            ) : (
              recvq.map((g, i) => (
                <div key={i} style={{
                  padding: '4px 8px', borderRadius: 4, fontSize: 11, fontFamily: s.mono,
                  background: s.bg3, border: `1px solid ${s.border}`,
                  color: s.accent, marginBottom: 3,
                }}>
                  {g} (blocked on recv)
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {phase === 'idle' ? (
            <button onClick={runScenario} style={{
              background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
            }}>Run Scenario</button>
          ) : (
            <button onClick={resetAll} style={{
              background: s.red, border: 'none', borderRadius: 8, padding: '10px 20px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
            }}>Reset</button>
          )}
        </div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Channel Event Log</div>
          <div style={{ maxHeight: 120, overflowY: 'auto', fontSize: 11, fontFamily: s.mono }}>
            {log.length === 0 && (
              <span style={{ color: s.text3 }}>No events yet. Press "Run Scenario" to start.</span>
            )}
            {log.map((entry, i) => (
              <div key={i} style={{ color: i === log.length - 1 ? s.text : s.text3, padding: '2px 0' }}>
                {entry}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
