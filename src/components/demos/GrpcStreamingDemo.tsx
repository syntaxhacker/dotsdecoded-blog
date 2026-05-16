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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface Msg {
  id: string
  dir: 'c2s' | 's2c'
  label: string
  color: string
}

const rpcTypes = [
  {
    key: 'unary',
    label: 'Unary',
    desc: 'Single request, single response. Classic request-reply.',
    steps: [
      { msgs: [{ id: 'req', dir: 'c2s' as const, label: 'GetUser(id=42)', color: s.accent }] },
      { msgs: [{ id: 'res', dir: 's2c' as const, label: 'User{name: "Alice"}', color: s.green }] },
    ],
  },
  {
    key: 'server-stream',
    label: 'Server Streaming',
    desc: 'Single request, multiple responses. Server pushes data.',
    steps: [
      { msgs: [{ id: 'req', dir: 'c2s' as const, label: 'ListUsers(role="admin")', color: s.accent }] },
      { msgs: [{ id: 'r1', dir: 's2c' as const, label: 'DATA: User{Alice}', color: s.green }] },
      { msgs: [{ id: 'r2', dir: 's2c' as const, label: 'DATA: User{Bob}', color: s.green }] },
      { msgs: [{ id: 'r3', dir: 's2c' as const, label: 'DATA: User{Carol}', color: s.green }] },
    ],
  },
  {
    key: 'client-stream',
    label: 'Client Streaming',
    desc: 'Multiple requests, single response. Client uploads data.',
    steps: [
      { msgs: [{ id: 'r1', dir: 'c2s' as const, label: 'DATA: Chunk 1/3', color: s.accent }] },
      { msgs: [{ id: 'r2', dir: 'c2s' as const, label: 'DATA: Chunk 2/3', color: s.accent }] },
      { msgs: [{ id: 'r3', dir: 'c2s' as const, label: 'DATA: Chunk 3/3', color: s.accent }] },
      { msgs: [{ id: 'res', dir: 's2c' as const, label: 'UploadStatus{ok: true}', color: s.green }] },
    ],
  },
  {
    key: 'bidi',
    label: 'Bidirectional',
    desc: 'Multiple requests and responses, independent stream. Full duplex.',
    steps: [
      { msgs: [
        { id: 'c1', dir: 'c2s' as const, label: 'Chat: "hello"', color: s.accent },
        { id: 's1', dir: 's2c' as const, label: 'Chat: "hi there!"', color: s.green },
      ]},
      { msgs: [
        { id: 'c2', dir: 'c2s' as const, label: 'Chat: "how are you?"', color: s.accent },
        { id: 's2', dir: 's2c' as const, label: 'Chat: "doing great!"', color: s.green },
      ]},
      { msgs: [
        { id: 'c3', dir: 'c2s' as const, label: 'Chat: "bye"', color: s.accent },
        { id: 's3', dir: 's2c' as const, label: 'Chat: "see you!"', color: s.green },
      ]},
    ],
  },
]

export default function GrpcStreamingDemo() {
  const [active, setActive] = useState(0)
  const [step, setStep] = useState(-1)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const rpc = rpcTypes[active]

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const advance = useCallback(() => {
    setStep(prev => {
      if (prev >= rpc.steps.length - 1) {
        setRunning(false)
        return prev
      }
      return prev + 1
    })
  }, [rpc.steps.length])

  useEffect(() => {
    if (!running) return
    clearTimer()
    timerRef.current = setTimeout(() => {
      advance()
    }, getStepDelay(600, speed))
    return clearTimer
  }, [running, step, speed, advance, clearTimer])

  const start = () => {
    setStep(0)
    setRunning(true)
  }

  const reset = () => {
    clearTimer()
    setStep(-1)
    setRunning(false)
  }

  const switchTab = (idx: number) => {
    clearTimer()
    setActive(idx)
    setStep(-1)
    setRunning(false)
  }

  const currentStepMsgs = step >= 0 && step < rpc.steps.length ? rpc.steps[step].msgs : []

  return (
    <DemoBoundary name="gRPC Streaming Types">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={H}>Four RPC Types</div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: s.bg, borderRadius: 8, padding: 3, border: `1px solid ${s.border}` }}>
          {rpcTypes.map((rt, i) => (
            <button key={rt.key} onClick={() => switchTab(i)} style={{
              flex: 1, padding: '8px 12px', borderRadius: 6, border: 'none',
              background: active === i ? s.bg3 : 'transparent',
              color: active === i ? s.text : s.text3,
              cursor: 'pointer', fontSize: 12, fontWeight: active === i ? 600 : 400,
              transition: 'all 0.15s',
            }}>{rt.label}</button>
          ))}
        </div>

        <div style={{ color: s.text2, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>{rpc.desc}</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 24, position: 'relative', minHeight: 90 }}>
          <div style={{
            flex: 1, textAlign: 'center',
            background: s.bg3, borderRadius: 12, padding: '14px 16px',
            border: `2px solid ${running ? s.accent : s.border}`,
            transition: 'border-color 0.3s',
          }}>
            <div style={{ color: s.text, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Client</div>
            <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>stub</div>
          </div>

          <div style={{ flex: '0 0 140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {currentStepMsgs.length > 0 ? currentStepMsgs.map((msg, mi) => (
              <div key={msg.id} style={{
                animation: 'grpcFrameIn 0.25s ease',
                background: s.bg, border: `1.5px solid ${msg.color}`,
                borderRadius: 6, padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: msg.color, flexShrink: 0,
                }} />
                <span style={{ color: msg.color, fontFamily: s.mono, fontSize: 10 }}>{msg.label}</span>
                <span style={{ color: s.text3, fontSize: 9 }}>
                  {msg.dir === 'c2s' ? '>>>' : '<<<'}
                </span>
              </div>
            )) : (
              <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>HTTP/2 stream</span>
            )}
          </div>

          <div style={{
            flex: 1, textAlign: 'center',
            background: s.bg3, borderRadius: 12, padding: '14px 16px',
            border: `2px solid ${running ? s.green : s.border}`,
            transition: 'border-color 0.3s',
          }}>
            <div style={{ color: s.text, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Server</div>
            <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>handler</div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Stream Details</div>
          {step >= 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rpc.steps.slice(0, step + 1).map((st, si) => (
                <div key={si} style={{
                  display: 'flex', gap: 8, alignItems: 'center',
                  background: s.bg, borderRadius: 6, padding: '6px 12px',
                  border: `1px solid ${s.border}`,
                }}>
                  <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 10, minWidth: 20 }}>#{si + 1}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {st.msgs.map((msg, mi) => (
                      <span key={mi} style={{
                        fontFamily: s.mono, fontSize: 10, color: msg.color,
                        background: `${msg.color}12`, borderRadius: 4, padding: '2px 6px',
                      }}>
                        {msg.dir === 'c2s' ? '[C->S]' : '[S->C]'} {msg.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: 12 }}>
              Press "Run" to animate the {rpc.label.toLowerCase()} flow
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={start} disabled={running} style={{
            background: running ? s.bg3 : s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: running ? s.text3 : '#fff', cursor: running ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600, flex: 1,
          }}>{running ? 'Streaming...' : 'Run'}</button>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
