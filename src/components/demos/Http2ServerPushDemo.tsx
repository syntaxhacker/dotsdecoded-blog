import { useState, useEffect, useRef } from 'react'
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

interface Step {
  label: string
  detail: string
  from?: 'client' | 'server'
  type: 'request' | 'response' | 'push-promise' | 'push-data' | 'info'
  color: string
}

const makeSteps = (cacheEnabled: boolean): Step[] => [
  { label: 'Client requests index.html', detail: 'GET /index.html HTTP/2', from: 'client', type: 'request', color: s.accent },
  { label: 'Server receives request', detail: 'Stream 1: GET /index.html', from: 'server', type: 'info', color: s.text2 },
  { label: 'Server sends index.html', detail: 'Stream 1: 200 OK (12 KB)', from: 'server', type: 'response', color: s.green },
  ...(cacheEnabled ? [] : [
    { label: 'Server pushes style.css', detail: 'Stream 2: PUSH_PROMISE (style.css)', from: 'server', type: 'push-promise', color: s.orange },
    { label: 'Server pushes app.js', detail: 'Stream 4: PUSH_PROMISE (app.js)', from: 'server', type: 'push-promise', color: s.orange },
    { label: 'Server sends style.css data', detail: 'Stream 2: 200 OK (18 KB)', from: 'server', type: 'push-data', color: s.yellow },
    { label: 'Server sends app.js data', detail: 'Stream 4: 200 OK (32 KB)', from: 'server', type: 'push-data', color: s.yellow },
    { label: 'All resources received', detail: 'Client got index.html + style.css + app.js in one round trip', from: undefined, type: 'info', color: s.green },
  ]),
  ...(cacheEnabled ? [
    { label: 'No push needed', detail: 'style.css and app.js are already in browser cache. Server skips push.', from: undefined, type: 'info', color: s.green },
  ] : []),
]

export default function Http2ServerPushDemo() {
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [cacheEnabled, setCacheEnabled] = useState(false)
  const [finished, setFinished] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const steps = makeSteps(cacheEnabled)

  useEffect(() => {
    setStep(0); setRunning(false); setFinished(false)
  }, [cacheEnabled])

  useEffect(() => {
    if (!running || step >= steps.length - 1) {
      if (step >= steps.length - 1) { setRunning(false); setFinished(true) }
      return
    }
    const t = setTimeout(() => {
      setStep(p => p + 1)
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
    }, getStepDelay(900, speed))
    return () => clearTimeout(t)
  }, [running, step, speed, steps.length])

  const start = () => { setStep(0); setRunning(true); setFinished(false) }
  const reset = () => { setStep(0); setRunning(false); setFinished(false) }

  const st = steps[step]

  return (
    <DemoBoundary name="HTTP/2 Server Push">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
          HTTP/2 Server Push
        </div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Server push lets the server send resources the client hasnt yet requested. Instead of waiting for the client to parse HTML and discover
          stylesheets, the server proactively pushes them.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <button onClick={() => setCacheEnabled(false)} style={{
            background: !cacheEnabled ? s.accent : s.bg3,
            border: `1px solid ${!cacheEnabled ? s.accent : s.border}`,
            borderRadius: 8, padding: '8px 16px',
            color: !cacheEnabled ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, fontFamily: s.mono,
            transition: 'all 0.2s',
          }} disabled={running}>No Cache</button>
          <button onClick={() => setCacheEnabled(true)} style={{
            background: cacheEnabled ? s.green : s.bg3,
            border: `1px solid ${cacheEnabled ? s.green : s.border}`,
            borderRadius: 8, padding: '8px 16px',
            color: cacheEnabled ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, fontFamily: s.mono,
            transition: 'all 0.2s',
          }} disabled={running}>Cache Aware</button>
          <div style={{ flex: 1 }} />
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16, minHeight: 120 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: 16, background: s.bg3, borderRadius: 10, border: `1px solid ${s.border}` }}>
            <div style={{ color: s.text, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Browser</div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 12, fontFamily: s.mono }}>Client</div>
            <div style={{ color: s.text2, fontSize: 12, fontFamily: s.mono }}>
              {['index.html', 'style.css', 'app.js'].map((f, i) => (
                <div key={f} style={{
                  padding: '4px 8px', marginBottom: 4,
                  background: finished ? `${s.green}20` : s.bg,
                  borderRadius: 4, fontSize: 11,
                  color: finished ? s.green : s.text3,
                }}>
                  {f}
                  {finished && <span style={{ color: s.green, marginLeft: 6 }}>Received</span>}
                </div>
              ))}
            </div>
          </div>

          <div style={{
            width: 60, display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', gap: 4,
          }}>
            <div style={{ width: 1, flex: 1, background: `linear-gradient(180deg, ${s.border}, ${s.border2})` }} />
            {st && st.from === 'client' && (
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: s.accent, animation: 'pulse 0.6s ease infinite',
              }} />
            )}
            {st && st.from === 'server' && (
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: s.orange, animation: 'pulse 0.6s ease infinite',
              }} />
            )}
            {(!st || !st.from) && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.text3 }} />
            )}
            <div style={{ width: 1, flex: 1, background: `linear-gradient(0deg, ${s.border}, ${s.border2})` }} />
          </div>

          <div style={{ flex: 1, textAlign: 'center', padding: 16, background: s.bg3, borderRadius: 10, border: `1px solid ${s.border}` }}>
            <div style={{ color: s.text, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Server</div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 12, fontFamily: s.mono }}>HTTP/2 enabled</div>
            <div style={{ color: s.text2, fontSize: 12, fontFamily: s.mono }}>
              {['index.html', 'style.css', 'app.js'].map((f, i) => (
                <div key={f} style={{
                  padding: '4px 8px', marginBottom: 4,
                  background: step > i * 2 ? `${s.green}20` : s.bg,
                  borderRadius: 4, fontSize: 11,
                  color: step > i * 2 ? s.green : s.text3,
                }}>
                  {f}
                  {step > i * 2 && <span style={{ color: s.green, marginLeft: 6 }}>Sent</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div ref={containerRef} style={{
          background: s.bg3, borderRadius: 10, padding: 16,
          maxHeight: 200, overflowY: 'auto', marginBottom: 16,
        }}>
          {steps.slice(0, step + 1).map((stItem, idx) => (
            <div key={idx} style={{
              display: 'flex', gap: 10, padding: '8px 0',
              borderBottom: idx < step ? `1px solid ${s.border}` : 'none',
              alignItems: 'flex-start',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: stItem.color, marginTop: 4, flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  color: stItem.color, fontSize: 13, fontWeight: 600,
                  fontFamily: stItem.type === 'push-promise' ? s.mono : undefined,
                }}>
                  {stItem.label}
                </div>
                <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginTop: 2 }}>
                  {stItem.detail}
                </div>
              </div>
              <div style={{
                padding: '2px 8px', borderRadius: 4,
                background: stItem.type === 'push-promise' ? `${s.orange}20` : `${stItem.color}20`,
                fontSize: 10, fontFamily: s.mono, color: stItem.color,
                flexShrink: 0,
              }}>
                {stItem.type === 'push-promise' ? 'PUSH_PROMISE' :
                 stItem.type === 'request' ? 'REQUEST' :
                 stItem.type === 'response' ? 'RESPONSE' :
                 stItem.type === 'push-data' ? 'PUSH_DATA' : 'INFO'}
              </div>
            </div>
          ))}
          {step === 0 && !running && (
            <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: 12 }}>
              Press Start to begin
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={start} disabled={running} style={{
            background: running ? s.bg3 : s.accent,
            border: 'none', borderRadius: 8, padding: '10px 20px',
            color: running ? s.text3 : '#fff', cursor: running ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600, flex: 1,
          }}>{finished ? 'Replay' : running ? 'Running...' : 'Start'}</button>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
          }
        `}</style>
      </div>
    </div>
    </DemoBoundary>
  )
}
