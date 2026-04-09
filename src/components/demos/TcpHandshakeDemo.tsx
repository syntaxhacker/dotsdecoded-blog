import { useState, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

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

const steps = [
  { label: 'CLOSED', desc: 'No connection exists', side: null, color: s.text3 },
  { label: 'SYN', desc: 'Client sends SYN (seq=0) to server', side: 'client', color: s.accent, packet: 'SYN seq=0' },
  { label: 'SYN-SENT', desc: 'Client waits for server response', side: 'client', color: s.accent },
  { label: 'SYN-ACK', desc: 'Server replies with SYN-ACK (seq=0, ack=1)', side: 'server', color: s.green, packet: 'SYN-ACK seq=0 ack=1' },
  { label: 'SYN-RECEIVED', desc: 'Server waits for client confirmation', side: 'server', color: s.green },
  { label: 'ACK', desc: 'Client sends ACK (ack=1)', side: 'client', color: s.accent, packet: 'ACK ack=1' },
  { label: 'ESTABLISHED', desc: 'Connection is open -- data can flow', side: null, color: s.green },
  { label: 'DATA', desc: 'HTTP request/response exchanged', side: null, color: s.green, packet: 'GET /api/users' },
  { label: 'FIN', desc: 'Client initiates close with FIN', side: 'client', color: s.orange, packet: 'FIN' },
  { label: 'FIN-ACK', desc: 'Server acknowledges and sends its FIN', side: 'server', color: s.orange, packet: 'FIN-ACK + FIN' },
  { label: 'LAST-ACK', desc: 'Client sends final ACK', side: 'client', color: s.orange, packet: 'ACK' },
  { label: 'CLOSED', desc: 'Connection fully closed', side: null, color: s.text3 },
]

export default function TcpHandshakeDemo() {
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [mode, setMode] = useState<'handshake' | 'full'>('handshake')

  const maxStep = mode === 'handshake' ? 7 : steps.length

  useEffect(() => {
    if (!running || step >= maxStep) {
      if (step >= maxStep) setRunning(false)
      return
    }
    const t = setTimeout(() => setStep(p => p + 1), getStepDelay(800, speed))
    return () => clearTimeout(t)
  }, [running, step, speed, maxStep])

  const reset = () => { setStep(0); setRunning(false) }

  const currentStep = steps[step]
  const hasPacket = currentStep.packet !== undefined

  return (
    <DemoBoundary name="TCP Handshake">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>TCP Handshake & Teardown</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Watch the 3-way handshake open a connection and the 4-way teardown close it. Every TCP connection you use starts and ends like this.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => { setMode('handshake'); reset() }} style={{
            background: mode === 'handshake' ? s.accent : s.bg3,
            border: `1px solid ${mode === 'handshake' ? s.accent : s.border}`,
            borderRadius: 8, padding: '8px 16px', color: mode === 'handshake' ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
          }}>3-Way Handshake</button>
          <button onClick={() => { setMode('full'); reset() }} style={{
            background: mode === 'full' ? s.orange : s.bg3,
            border: `1px solid ${mode === 'full' ? s.orange : s.border}`,
            borderRadius: 8, padding: '8px 16px', color: mode === 'full' ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
          }}>Full Lifecycle</button>
          <div style={{ flex: 1 }} />
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: 16, background: step >= 2 && step <= 7 ? `${s.accent}15` : s.bg3, borderRadius: 10, border: `1px solid ${step >= 1 && step <= 8 ? s.accent : s.border}`, transition: 'all 0.3s' }}>
            <div style={{ color: s.accent, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Client</div>
            <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>192.168.1.42</div>
          </div>
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', minHeight: 80 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: s.border }} />
            {hasPacket && (
              <div style={{
                position: 'absolute',
                top: 20,
                left: currentStep.side === 'client' ? '10%' : '55%',
                width: '35%',
                height: 2,
                background: currentStep.color,
                transition: 'all 0.3s',
              }} />
            )}
            {hasPacket && (
              <div style={{
                position: 'absolute',
                top: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                background: s.bg3,
                border: `1px solid ${currentStep.color}`,
                borderRadius: 6,
                padding: '4px 12px',
                color: currentStep.color,
                fontFamily: s.mono,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}>
                {currentStep.packet}
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: s.border }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: 16, background: step >= 4 && step <= 6 ? `${s.green}15` : s.bg3, borderRadius: 10, border: `1px solid ${step >= 3 && step <= 9 ? s.green : s.border}`, transition: 'all 0.3s' }}>
            <div style={{ color: s.green, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Server</div>
            <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>104.21.76.8</div>
          </div>
        </div>

        <div style={{ background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: currentStep.color, fontFamily: s.mono, fontSize: 14, fontWeight: 700 }}>{currentStep.label}</span>
            <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>Step {step + 1}/{maxStep}</span>
          </div>
          <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.5 }}>{currentStep.desc}</div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setStep(p => Math.max(0, p - 1))} disabled={step === 0} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: step === 0 ? s.text3 : s.text2, cursor: step === 0 ? 'default' : 'pointer', fontSize: 13, transition: 'all 0.2s',
          }}>Prev</button>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
          }}>Reset</button>
          <button onClick={() => setRunning(!running)} style={{
            background: running ? s.orange : s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
          }}>{running ? 'Pause' : 'Play'}</button>
          <button onClick={() => setStep(p => Math.min(maxStep - 1, p + 1))} disabled={step >= maxStep - 1} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: step >= maxStep - 1 ? s.text3 : s.text2, cursor: step >= maxStep - 1 ? 'default' : 'pointer', fontSize: 13, transition: 'all 0.2s',
          }}>Next</button>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
