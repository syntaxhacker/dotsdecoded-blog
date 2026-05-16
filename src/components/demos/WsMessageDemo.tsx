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

const FRAMES = [
  { fin: 0, opcode: 1, payload: 'Hello ', label: 'First Frame (FIN=0, opcode=1)' },
  { fin: 0, opcode: 0, payload: 'Wor', label: 'Continuation (FIN=0, opcode=0)' },
  { fin: 1, opcode: 0, payload: 'ld!', label: 'Final Frame (FIN=1, opcode=0)' },
]

export default function WsMessageDemo() {
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const run = useCallback(() => {
    setRunning(true)
    setStep(1)
  }, [])

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setRunning(false)
    setStep(0)
  }, [])

  useEffect(() => {
    if (!running) return
    if (step > FRAMES.length) {
      setRunning(false)
      return
    }
    timeoutRef.current = setTimeout(() => {
      setStep(prev => prev + 1)
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
    }, getStepDelay(800, speed))
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [running, step, speed])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const completed = step > FRAMES.length

  return (
    <DemoBoundary name="WebSocket Message Fragmentation">
      <div style={{
        background: s.bg, padding: '32px 24px', borderRadius: 16,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        maxWidth: 820, margin: '0 auto',
      }}>
        <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
            Message Fragmentation
          </div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
            Large messages are split into frames. The first frame has the opcode (e.g., 1 for text),
            continuation frames have opcode 0, and the final frame has FIN=1.
          </p>

          <div ref={containerRef} style={{
            maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
            marginBottom: 20,
          }}>
            {FRAMES.map((frame, idx) => {
              const visible = step > idx
              const isCurrent = step === idx + 1
              return (
                <div key={idx} style={{
                  background: s.bg, border: `1px solid ${isCurrent ? s.accent : s.border}`,
                  borderRadius: 10, padding: '14px 18px',
                  opacity: visible ? 1 : 0.3,
                  transform: visible ? 'translateX(0)' : 'translateX(-12px)',
                  transition: 'all 0.4s ease',
                  borderLeft: `3px solid ${frame.fin === 1 ? s.green : s.yellow}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>{frame.label}</span>
                    <span style={{
                      background: isCurrent ? s.accent : s.bg3, color: isCurrent ? '#fff' : s.text3,
                      fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                      fontFamily: s.mono,
                    }}>
                      {visible ? 'SENT' : isCurrent ? 'SENDING...' : 'WAITING'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontFamily: s.mono, fontSize: 12 }}>
                    <span style={{ color: s.text3 }}>
                      FIN: <span style={{ color: frame.fin ? s.green : s.yellow }}>{frame.fin}</span>
                    </span>
                    <span style={{ color: s.text3 }}>
                      Opcode: <span style={{ color: s.accent }}>{frame.opcode} {frame.opcode === 1 ? '(text)' : '(continuation)'}</span>
                    </span>
                    <span style={{ color: s.text3 }}>
                      Payload: <span style={{ color: s.text }}>"{frame.payload}"</span>
                    </span>
                    <span style={{ color: s.text3 }}>
                      Bytes: <span style={{ color: s.text }}>{new TextEncoder().encode(frame.payload).length}</span>
                    </span>
                  </div>
                  {visible && (
                    <div style={{
                      marginTop: 8, background: s.bg3, borderRadius: 4, padding: '6px 10px',
                      fontFamily: s.mono, fontSize: 11, color: s.text2,
                    }}>
                      HEX: {Array.from(new TextEncoder().encode(frame.payload))
                        .map(b => b.toString(16).padStart(2, '0')).join(' ')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{
            background: s.bg, border: `1px solid ${completed ? s.green : s.border}`,
            borderRadius: 10, padding: '14px 18px', marginBottom: 16,
            transition: 'all 0.4s ease',
          }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Reassembled Message
            </div>
            <div style={{
              color: completed ? s.green : s.text3, fontFamily: s.mono, fontSize: 18,
              fontWeight: 700,
            }}>
              {completed
                ? `"${FRAMES.map(f => f.payload).join('')}"`
                : 'Waiting for all frames...'}
            </div>
            {completed && (
              <div style={{ color: s.text2, fontSize: 12, marginTop: 6 }}>
                {FRAMES.reduce((sum, f) => sum + new TextEncoder().encode(f.payload).length, 0)} bytes reassembled from {FRAMES.length} frames
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!running && !completed ? (
              <button onClick={run} style={{
                background: s.accent, border: 'none', borderRadius: 8, padding: '10px 24px',
                color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>
                Send Frames
              </button>
            ) : (
              <button onClick={reset} style={{
                background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 24px',
                color: s.text2, cursor: 'pointer', fontSize: 13,
              }}>
                {completed ? 'Replay' : 'Reset'}
              </button>
            )}
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
