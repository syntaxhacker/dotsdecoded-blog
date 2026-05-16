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

interface Round {
  label: string
  steps: string[]
  description: string
  totalRtt: number
  color: string
  packets: { from: 'client' | 'server'; label: string; rttEnd?: boolean }[]
}

const protocols: Round[] = [
  {
    label: 'TCP + TLS 1.3',
    steps: ['TCP SYN', 'TCP SYN-ACK', 'TCP ACK + TLS ClientHello', 'TLS ServerHello + Finished', 'TLS Client Finished + HTTP GET'],
    description: 'TCP needs 1 RTT for the 3-way handshake. TLS 1.3 needs 2 RTT for the cryptographic handshake. Total: 3 round trips before data.',
    totalRtt: 3,
    color: s.red,
    packets: [
      { from: 'client', label: 'SYN' },
      { from: 'server', label: 'SYN-ACK', rttEnd: true },
      { from: 'client', label: 'ACK + ClientHello' },
      { from: 'server', label: 'ServerHello + Finished', rttEnd: true },
      { from: 'client', label: 'Finished + GET /', rttEnd: true },
    ],
  },
  {
    label: 'QUIC 1-RTT',
    steps: ['Initial ClientHello', 'ServerHello + Handshake', 'HTTP GET'],
    description: 'QUIC combines transport and TLS handshake into a single 1-RTT exchange. No separate TCP handshake needed.',
    totalRtt: 1,
    color: s.yellow,
    packets: [
      { from: 'client', label: 'ClientHello (Initial)' },
      { from: 'server', label: 'ServerHello + Handshake', rttEnd: true },
      { from: 'client', label: 'HTTP GET' },
    ],
  },
  {
    label: 'QUIC 0-RTT',
    steps: ['ClientHello + HTTP GET (in first flight!)', 'ServerHello + Response'],
    description: 'If the client has connected before, it sends HTTP data in the very first packet. Zero round trips of delay.',
    totalRtt: 0,
    color: s.green,
    packets: [
      { from: 'client', label: 'ClientHello + GET / (0-RTT data)' },
      { from: 'server', label: 'ServerHello + Response' },
    ],
  },
]

export default function QuicHandshakeDemo() {
  const [mode, setMode] = useState(0)
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [finished, setFinished] = useState(false)

  const protocol = protocols[mode]
  const maxStep = protocol.packets.length

  useEffect(() => {
    setStep(0); setRunning(false); setFinished(false)
  }, [mode])

  useEffect(() => {
    if (!running || step >= maxStep) {
      if (step >= maxStep) { setRunning(false); setFinished(true) }
      return
    }
    const t = setTimeout(() => setStep(p => p + 1), getStepDelay(1000, speed))
    return () => clearTimeout(t)
  }, [running, step, speed, maxStep])

  const start = () => { setStep(0); setRunning(true); setFinished(false) }
  const reset = () => { setStep(0); setRunning(false); setFinished(false) }

  const rttsCompleted = protocol.packets.slice(0, step).filter(p => p.rttEnd).length

  return (
    <DemoBoundary name="QUIC Handshake Comparison">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
          Handshake Comparison: TCP+TLS vs QUIC
        </div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          QUIC eliminates round trips by combining transport and TLS into a single handshake. With cached session state, it sends data immediately -- zero RTT.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {protocols.map((prot, idx) => (
            <button key={idx} onClick={() => setMode(idx)} style={{
              background: mode === idx ? prot.color : s.bg3,
              border: `1px solid ${mode === idx ? prot.color : s.border}`,
              borderRadius: 8, padding: '8px 16px',
              color: mode === idx ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: s.mono,
              transition: 'all 0.2s',
            }}>{prot.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: s.bg3, borderRadius: 10, padding: 16, flex: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Round Trip Time (RTT)</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                  {Array.from({ length: Math.max(1, protocol.totalRtt) }).map((_, idx) => (
                    <div key={idx} style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: idx < rttsCompleted ? protocol.color : s.bg,
                      border: `2px solid ${idx < rttsCompleted ? protocol.color : s.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: s.mono, fontSize: 11, fontWeight: 700,
                      color: idx < rttsCompleted ? '#fff' : s.text3,
                      transition: 'all 0.3s',
                    }}>{idx + 1}RTT</div>
                  ))}
                  {protocol.totalRtt === 0 && (
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: s.green, border: `2px solid ${s.green}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: s.mono, fontSize: 10, fontWeight: 700, color: '#fff',
                    }}>0-RTT</div>
                  )}
                </div>
              </div>
              <div style={{
                background: s.bg, borderRadius: 8, padding: 12, marginTop: 8,
                color: s.text2, fontSize: 12, lineHeight: 1.6,
              }}>
                {protocol.description}
              </div>
            </div>
          </div>

          <div style={{ flex: 2, minHeight: 200 }}>
            <div style={{ background: s.bg3, borderRadius: 10, padding: 16, height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, position: 'relative' }}>
                <div style={{ textAlign: 'center', flex: 1, padding: 8, background: s.bg, borderRadius: 8, border: `1px solid ${step > 0 ? s.accent : s.border}`, transition: 'all 0.3s' }}>
                  <div style={{ color: s.accent, fontWeight: 700, fontSize: 13 }}>Client</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1, padding: 8, background: s.bg, borderRadius: 8, border: `1px solid ${step > 0 ? s.green : s.border}`, transition: 'all 0.3s' }}>
                  <div style={{ color: s.green, fontWeight: 700, fontSize: 13 }}>Server</div>
                </div>
              </div>

              <div style={{ position: 'relative', minHeight: 120 }}>
                {protocol.packets.slice(0, step).map((pkt, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: pkt.from === 'client' ? 'flex-start' : 'flex-end',
                    marginBottom: 8,
                    animation: 'fadeIn 0.3s ease',
                  }}>
                    <div style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      background: pkt.from === 'client' ? `${s.accent}20` : `${s.green}20`,
                      border: `1px solid ${pkt.from === 'client' ? s.accent : s.green}`,
                      fontFamily: s.mono, fontSize: 11, color: s.text,
                      maxWidth: '70%',
                    }}>
                      <div style={{ color: pkt.from === 'client' ? s.accent : s.green, marginBottom: 2 }}>
                        {pkt.from === 'client' ? '-->' : '<--'} {pkt.label}
                      </div>
                      <div style={{ color: s.text3, fontSize: 10 }}>
                        Packet {idx + 1}
                      </div>
                    </div>
                  </div>
                ))}
                {step === 0 && (
                  <div style={{ textAlign: 'center', color: s.text3, fontSize: 12, padding: 40 }}>
                    Press Start to see the handshake
                  </div>
                )}
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
                <div style={{ padding: '4px 10px', background: s.bg, borderRadius: 6, border: `1px solid ${s.border}` }}>
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>RTT: {rttsCompleted}/{protocol.totalRtt}</span>
                </div>
                <div style={{ padding: '4px 10px', background: s.bg, borderRadius: 6, border: `1px solid ${s.border}` }}>
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>Packets: {step}/{maxStep}</span>
                </div>
              </div>
            </div>
          </div>
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
          }}>{finished ? 'Replay' : running ? 'Running...' : 'Start Handshake'}</button>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
    </DemoBoundary>
  )
}
