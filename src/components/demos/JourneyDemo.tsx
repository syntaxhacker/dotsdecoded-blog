import { useState, useEffect, Fragment } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const M: React.CSSProperties = { fontFamily: s.mono }

const STEPS = ['DNS', 'TCP SYN', 'TCP SYN+ACK', 'TCP ACK', 'TLS', 'HTTP Req', 'Response']
const DETAILS = [
  'Query: dotsdecoded.com → Resolver 1.1.1.1',
  'SYN packet to 104.21.76.8:443',
  'SYN+ACK received from server (RTT: 28ms)',
  'Connection established',
  'TLS 1.3 cipher: TLS_AES_256_GCM_SHA384',
  'GET / HTTP/1.1 Host: dotsdecoded.com',
  '200 OK - 14.2 KB in 156ms',
]
const TIMES = [23, 84, 67, 156]
const STEP_TIMES = [23, 28, 28, 28, 67, 8, 148]
const NODES = ['Your Device', 'Router', 'ISP', 'IXP', 'Transit', 'Data Center', 'Server']

function cumulativeTime(step: number): number {
  let total = 0
  for (let i = 0; i < step && i < STEP_TIMES.length; i++) total += STEP_TIMES[i]
  return total
}

export default function JourneyDemo() {
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || step >= 7) {
      if (step >= 7) setRunning(false)
      return
    }
    const timer = setInterval(() => setStep(prev => prev + 1), 600)
    return () => clearInterval(timer)
  }, [running, step])

  const handleGo = () => {
    if (step >= 7) setStep(0)
    setRunning(true)
  }

  const activeNodeIndex = step === 0 ? 0 : step === 1 ? 1 : step === 2 ? 2 : step === 3 ? 3 : step === 4 ? 5 : step === 5 ? 6 : 6

  return (
    <DemoBoundary name="Request Journey">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Web Request Journey</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={handleGo} style={{
            background: running ? s.bg3 : s.accent, border: `1px solid ${running ? s.border : s.accent}`,
            borderRadius: 8, padding: '10px 28px', color: running ? s.text3 : '#fff',
            cursor: running ? 'default' : 'pointer', fontSize: 14, fontWeight: 600, fontFamily: s.mono,
            transition: 'all 0.2s',
          }}>
            {running ? 'Running...' : step >= 7 ? 'Replay' : 'Go'}
          </button>
          {step > 0 && (
            <div style={{ ...M, fontSize: 14, color: s.text2 }}>
              Time: <span style={{ color: s.yellow }}>{cumulativeTime(step)}ms</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto' }}>
          {STEPS.map((label, i) => {
            const isDone = i < step
            const isActive = i === step - 1
            const isPending = i >= step
            return (
              <Fragment key={label}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: isActive ? s.accent : isDone ? s.green : s.bg3,
                    border: `2px solid ${isActive ? s.accent : isDone ? s.green : s.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    ...M, fontSize: 9, color: isActive || isDone ? '#fff' : s.text3,
                    transition: 'all 0.3s', boxShadow: isActive ? `0 0 16px ${s.accent}44` : isDone ? `0 0 8px ${s.green}22` : 'none',
                  }}>
                    {isDone ? String.fromCharCode(10003) : label.length > 5 ? label.slice(0, 4) : label}
                  </div>
                  <div style={{ ...M, fontSize: 8, color: isActive ? s.accent : isDone ? s.green : s.text3, marginTop: 6, textAlign: 'center', maxWidth: 56, lineHeight: 1.3 }}>
                    {label}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 8, height: 2, background: i < step ? s.green : s.border, alignSelf: 'center', flexShrink: 0, marginTop: -14, transition: 'background 0.3s' }} />
                )}
              </Fragment>
            )
          })}
        </div>
        {step > 0 && step <= 7 && (
          <div style={{
            background: s.bg, borderRadius: 8, padding: '14px 18px', marginBottom: 20,
            border: `1px solid ${step < 7 ? s.accent + '44' : s.green + '44'}`,
            borderLeft: `3px solid ${step < 7 ? s.accent : s.green}`,
          }}>
            <div style={{ ...M, fontSize: 12, color: s.text3, marginBottom: 4 }}>
              Step {step}/{STEPS.length} — {STEPS[step - 1]}
            </div>
            <div style={{ ...M, fontSize: 13, color: s.text }}>
              {DETAILS[step - 1]}
            </div>
          </div>
        )}
      </div>

      <div style={SEC}>
        <div style={{ fontSize: 14, fontWeight: 600, color: s.text2, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, ...M }}>
          Routing Path
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
          {NODES.map((node, i) => {
            const nodeStep = i <= 2 ? i + 1 : i === 3 ? 3 : i === 4 ? 4 : i === 5 ? 5 : 6
            const isLit = step > 0 && i <= activeNodeIndex
            const isActive = step > 0 && i === activeNodeIndex
            return (
              <Fragment key={node}>
                <div style={{
                  flex: '0 0 auto', padding: '10px 12px', borderRadius: 8,
                  background: isActive ? s.accent + '22' : isLit ? s.green + '15' : s.bg3,
                  border: `1px solid ${isActive ? s.accent : isLit ? s.green : s.border}`,
                  ...M, fontSize: 10, color: isActive ? s.accent : isLit ? s.green : s.text3,
                  transition: 'all 0.3s', textAlign: 'center', minWidth: 70,
                  boxShadow: isActive ? `0 0 12px ${s.accent}33` : 'none',
                }}>
                  {node}
                </div>
                {i < NODES.length - 1 && (
                  <div style={{ width: 16, height: 1, background: isLit ? s.green : s.border, flexShrink: 0, transition: 'background 0.3s' }} />
                )}
              </Fragment>
            )
          })}
        </div>
      </div>

      {step >= 7 && (
        <div style={{
          background: s.green + '11', border: `1px solid ${s.green}44`, borderRadius: 12,
          padding: '20px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: s.green, marginBottom: 6 }}>
            Request Complete
          </div>
          <div style={{ ...M, fontSize: 14, color: s.text }}>
            Total time: ~330ms
          </div>
          <div style={{ ...M, fontSize: 11, color: s.text3, marginTop: 8 }}>
            DNS: 23ms | TCP: 84ms | TLS: 67ms | HTTP: 156ms
          </div>
        </div>
      )}
    </div>
    </DemoBoundary>
  )
}
