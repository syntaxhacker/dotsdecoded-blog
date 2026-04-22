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

const tlsSteps = [
  { label: 'Client Hello', desc: 'Client sends supported cipher suites and a random number', from: 'client', color: s.accent, detail: 'Cipher suites: TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256' },
  { label: 'Server Hello', desc: 'Server picks a cipher suite and sends its certificate', from: 'server', color: s.green, detail: 'Selected: TLS_AES_256_GCM_SHA384. Certificate: *.example.com (Let\'s Encrypt)' },
  { label: 'Key Exchange', desc: 'Both sides generate a shared secret using Diffie-Hellman', from: 'both', color: s.yellow, detail: 'ECDHE key exchange -- server\'s private key never sent over the wire' },
  { label: 'Finished', desc: 'Both sides verify the handshake and switch to encrypted mode', from: 'both', color: s.green, detail: 'All subsequent data encrypted with AES-256-GCM using the shared secret' },
  { label: 'Encrypted Data', desc: 'Application data flows over the encrypted tunnel', from: 'client', color: s.purple, detail: 'GET /api/users -- encrypted, MITM cannot read or modify' },
]

const attacks = [
  { name: 'Man-in-the-Middle', desc: 'Attacker intercepts traffic between client and server', blocked: 'TLS certificate verification -- browser checks the cert is valid and matches the domain' },
  { name: 'Eavesdropping', desc: 'Attacker reads network traffic (Wi-Fi sniffing)', blocked: 'AES-256 encryption -- even if captured, packets are unreadable without the session key' },
  { name: 'Tampering', desc: 'Attacker modifies data in transit', blocked: 'GCM authentication tag -- any modification is detected and the connection is dropped' },
  { name: 'Replay Attack', desc: 'Attacker resends a captured request', blocked: 'Nonces and timestamps in the TLS handshake prevent replaying old sessions' },
]

export default function SslTlsDemo() {
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [tab, setTab] = useState<'handshake' | 'attacks'>('handshake')

  useEffect(() => {
    if (!running || step >= tlsSteps.length) {
      if (step >= tlsSteps.length) setRunning(false)
      return
    }
    const t = setTimeout(() => setStep(p => p + 1), getStepDelay(1200, speed))
    return () => clearTimeout(t)
  }, [running, step, speed])

  const reset = () => { setStep(0); setRunning(false) }

  return (
    <DemoBoundary name="SSL/TLS Handshake">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>SSL/TLS Handshake</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          TLS 1.3 encrypts your data in 1 round trip. Click through to see how the handshake works and what attacks it prevents.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setTab('handshake')} style={{
            background: tab === 'handshake' ? s.accent : s.bg3,
            border: `1px solid ${tab === 'handshake' ? s.accent : s.border}`,
            borderRadius: 8, padding: '8px 16px', color: tab === 'handshake' ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
          }}>Handshake</button>
          <button onClick={() => setTab('attacks')} style={{
            background: tab === 'attacks' ? s.red : s.bg3,
            border: `1px solid ${tab === 'attacks' ? s.red : s.border}`,
            borderRadius: 8, padding: '8px 16px', color: tab === 'attacks' ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
          }}>Attacks Blocked</button>
        </div>

        {tab === 'handshake' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'flex-end' }}>
              <SpeedController speed={speed} onSpeedChange={setSpeed} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1, textAlign: 'center', padding: 16, background: s.bg3, borderRadius: 10, border: `1px solid ${step > 0 ? s.accent : s.border}` }}>
                <div style={{ color: s.accent, fontWeight: 700, fontSize: 14 }}>Client</div>
                <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>Browser</div>
              </div>
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 120 }}>
                <div style={{ width: '100%', height: 1, background: s.border, position: 'absolute', top: '50%' }} />
                {step > 0 && step <= tlsSteps.length && (
                  <div style={{
                    background: `${tlsSteps[Math.min(step - 1, tlsSteps.length - 1)].color}20`,
                    border: `1px solid ${tlsSteps[Math.min(step - 1, tlsSteps.length - 1)].color}`,
                    borderRadius: 8, padding: '8px 16px', textAlign: 'center',
                    position: 'relative', zIndex: 1, maxWidth: '90%',
                  }}>
                    <div style={{ color: tlsSteps[Math.min(step - 1, tlsSteps.length - 1)].color, fontFamily: s.mono, fontSize: 12, fontWeight: 600 }}>
                      {tlsSteps[Math.min(step - 1, tlsSteps.length - 1)].label}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: 16, background: s.bg3, borderRadius: 10, border: `1px solid ${step > 1 ? s.green : s.border}` }}>
                <div style={{ color: s.green, fontWeight: 700, fontSize: 14 }}>Server</div>
                <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>api.example.com</div>
              </div>
            </div>

            {step > 0 && (
              <div style={{ background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ color: tlsSteps[Math.min(step - 1, tlsSteps.length - 1)].color, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                  Step {step}: {tlsSteps[Math.min(step - 1, tlsSteps.length - 1)].label}
                </div>
                <div style={{ color: s.text2, fontSize: 13, marginBottom: 8 }}>{tlsSteps[Math.min(step - 1, tlsSteps.length - 1)].desc}</div>
                <div style={{ background: s.bg, borderRadius: 6, padding: 10, fontFamily: s.mono, fontSize: 11, color: s.text3 }}>
                  {tlsSteps[Math.min(step - 1, tlsSteps.length - 1)].detail}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={reset} style={{
                background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 20px',
                color: s.text2, cursor: 'pointer', fontSize: 13,
              }}>Reset</button>
              <button onClick={() => setRunning(!running)} style={{
                background: running ? s.orange : s.accent, border: 'none', borderRadius: 8, padding: '8px 20px',
                color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>{running ? 'Pause' : step >= tlsSteps.length ? 'Replay' : 'Play'}</button>
            </div>
          </>
        )}

        {tab === 'attacks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {attacks.map((atk) => (
              <div key={atk.name} style={{ background: s.bg3, borderRadius: 10, padding: 16, border: `1px solid ${s.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: s.red, fontWeight: 700, fontSize: 14 }}>{atk.name}</span>
                  <span style={{ background: `${s.green}20`, color: s.green, fontSize: 11, fontFamily: s.mono, padding: '2px 8px', borderRadius: 4 }}>BLOCKED</span>
                </div>
                <div style={{ color: s.text2, fontSize: 13, marginBottom: 8 }}>{atk.desc}</div>
                <div style={{ background: s.bg, borderRadius: 6, padding: 10, color: s.green, fontSize: 12, fontFamily: s.mono, lineHeight: 1.5 }}>
                  {atk.blocked}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
