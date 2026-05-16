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

interface Frame {
  id: string
  dir: 'c2s' | 's2c'
  label: string
  type: string
  payload: string
  color: string
}

const frames: Frame[] = [
  { id: 'headers-req', dir: 'c2s', label: 'HEADERS', type: 'CONTENT-TYPE: application/grpc', payload: 'path: /UserService/GetUser\nte: identity\nauthority: api.example.com', color: s.accent },
  { id: 'data-req', dir: 'c2s', label: 'DATA', type: 'Length: 5 bytes | Flag: 0', payload: '0x08 0x2a (field 1, varint 42)', color: s.accent },
  { id: 'processing', dir: 's2c', label: 'Processing', type: 'Server handler executes', payload: 'SELECT * FROM users WHERE id = 42', color: s.yellow },
  { id: 'headers-res', dir: 's2c', label: 'HEADERS', type: 'HTTP/2 200 OK', payload: 'content-type: application/grpc\ngrpc-status: 0', color: s.green },
  { id: 'data-res', dir: 's2c', label: 'DATA', type: 'Length: 18 bytes | Flag: 1', payload: '0x0a 0x10... (name="Alice", email="alice@example.com")', color: s.green },
]

export default function GrpcUnaryDemo() {
  const [step, setStep] = useState(-1)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const nextStep = useCallback(() => {
    setStep(prev => {
      if (prev >= frames.length - 1) {
        setRunning(false)
        return prev
      }
      return prev + 1
    })
  }, [])

  useEffect(() => {
    if (!running) return
    clearTimer()
    timerRef.current = setTimeout(() => {
      nextStep()
    }, getStepDelay(700, speed))
    return clearTimer
  }, [running, step, speed, nextStep, clearTimer])

  const start = () => {
    setStep(0)
    setRunning(true)
  }

  const reset = () => {
    clearTimer()
    setStep(-1)
    setRunning(false)
  }

  const currentFrame = step >= 0 && step < frames.length ? frames[step] : null
  const clientColor = running && currentFrame?.dir === 'c2s' ? (currentFrame?.color || s.accent) : s.text2
  const serverColor = running && currentFrame?.dir === 's2c' ? (currentFrame?.color || s.green) : s.text2

  return (
    <DemoBoundary name="Unary RPC Frame Exchange">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={H}>Unary RPC: HTTP/2 Frame Exchange</div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, marginBottom: 24, position: 'relative', minHeight: 80 }}>
          <div style={{
            flex: 1, textAlign: 'center',
            background: s.bg3, borderRadius: 12, padding: '16px 20px',
            border: `2px solid ${clientColor}`,
            transition: 'border-color 0.3s',
          }}>
            <div style={{ color: s.text, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>gRPC Client</div>
            <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>UserService</div>
          </div>

          <div style={{ flex: '0 0 120px', textAlign: 'center', position: 'relative' }}>
            {currentFrame && (
              <div style={{ animation: 'grpcFrameIn 0.3s ease' }}>
                <div style={{
                  background: s.bg, border: `2px solid ${currentFrame.color}`,
                  borderRadius: 8, padding: '6px 10px', marginBottom: 4,
                }}>
                  <div style={{ color: currentFrame.color, fontFamily: s.mono, fontSize: 11, fontWeight: 700 }}>{currentFrame.label}</div>
                  <div style={{ color: s.text2, fontSize: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentFrame.type.length > 20 ? currentFrame.type.slice(0, 20) + '...' : currentFrame.type}
                  </div>
                </div>
                <div style={{
                  color: s.text3, fontFamily: s.mono, fontSize: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
                }}>
                  <span>{currentFrame.dir === 'c2s' ? '---' : '<--'}</span>
                  <span>stream 1</span>
                  <span>{currentFrame.dir === 'c2s' ? '-->' : '---'}</span>
                </div>
              </div>
            )}
            {!currentFrame && (
              <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>HTTP/2</div>
            )}
            <div style={{
              position: 'absolute', top: '50%', left: '-20%', right: '-20%',
              height: 2, background: s.border, zIndex: -1,
            }} />
          </div>

          <div style={{
            flex: 1, textAlign: 'center',
            background: s.bg3, borderRadius: 12, padding: '16px 20px',
            border: `2px solid ${serverColor}`,
            transition: 'border-color 0.3s',
          }}>
            <div style={{ color: s.text, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>gRPC Server</div>
            <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>UserService</div>
          </div>
        </div>

        {currentFrame && (
          <div style={{
            background: s.bg, border: `1px solid ${currentFrame.color}`,
            borderRadius: 10, padding: '14px 18px', marginBottom: 20,
            transition: 'all 0.3s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: currentFrame.color, fontFamily: s.mono, fontSize: 13, fontWeight: 700 }}>
                {currentFrame.dir === 'c2s' ? 'Client -> Server' : currentFrame.dir === 's2c' && currentFrame.id === 'processing' ? 'Server Processing' : 'Server -> Client'}
              </span>
              <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>frame {step + 1}/{frames.length}</span>
            </div>
            <div style={{ color: s.text2, fontSize: 12, marginBottom: 4 }}>{currentFrame.type}</div>
            <code style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, whiteSpace: 'pre', lineHeight: 1.6 }}>
              {currentFrame.payload}
            </code>
          </div>
        )}

        {!currentFrame && (
          <div style={{ background: s.bg, border: `1px dashed ${s.border}`, borderRadius: 10, padding: '14px 18px', marginBottom: 20, textAlign: 'center' }}>
            <span style={{ color: s.text3, fontSize: 12 }}>Press "Send Request" to watch the HTTP/2 frame exchange</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={start} disabled={running} style={{
            background: running ? s.bg3 : s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: running ? s.text3 : '#fff', cursor: running ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600, flex: 1,
          }}>{running ? 'Sending...' : 'Send Request'}</button>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 20, flexWrap: 'wrap', borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
          {frames.map((f, i) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: step >= i ? 1 : 0.35, transition: 'opacity 0.3s' }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: step >= i ? f.color : s.text3,
                transition: 'background 0.3s',
              }} />
              <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
