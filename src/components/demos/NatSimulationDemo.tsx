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

const netNodes = [
  { label: 'Your Device', sub: '192.168.1.42', icon: 'D' },
  { label: 'Router', sub: '192.168.1.1', icon: 'R' },
  { label: 'ISP', sub: '203.0.113.1', icon: 'I' },
  { label: 'Internet', sub: '', icon: '*' },
]

export default function NatSimulationDemo() {
  const [sending, setSending] = useState(false)
  const [packetStep, setPacketStep] = useState(0)

  useEffect(() => {
    if (!sending) return
    setPacketStep(1)
    const t = setInterval(() => {
      setPacketStep(p => { if (p >= 4) { clearInterval(t); setSending(false); return 4 } return p + 1 })
    }, 900)
    return () => clearInterval(t)
  }, [sending])

  return (
    <DemoBoundary name="NAT Simulation">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Your Network (Simulated)</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          When your device sends data to the internet, it passes through your router which performs NAT,
          replacing your private IP with a public one so the response can find its way back.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => { if (sending) return; setPacketStep(0); setSending(true) }} disabled={sending} style={{
            background: sending ? s.border2 : s.accent, border: 'none', borderRadius: 8,
            padding: '8px 20px', color: sending ? s.text3 : '#fff', cursor: sending ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
          }}>
            {sending ? 'Transmitting...' : packetStep === 4 ? 'Send Again' : 'Send Packet'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 0 }}>
          {netNodes.map((node, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                  <div style={{
                    width: 48, height: 3, borderRadius: 2,
                    background: packetStep > i ? s.green : s.border2,
                    transition: 'background 0.3s', position: 'relative',
                  }}>
                    {packetStep === i + 1 && (
                      <div style={{
                        position: 'absolute', top: -5, right: -6,
                        width: 12, height: 12, borderRadius: '50%',
                        background: s.green, boxShadow: `0 0 10px ${s.green}`,
                        transition: 'all 0.3s',
                      }} />
                    )}
                  </div>
                </div>
              )}
              <div style={{
                background: packetStep >= i + 1 ? `${s.green}12` : s.bg3,
                border: `2px solid ${packetStep >= i + 1 ? s.green : s.border2}`,
                borderRadius: 12, padding: '16px 20px', textAlign: 'center',
                minWidth: 110, transition: 'all 0.3s',
                boxShadow: packetStep === i + 1 ? `0 0 24px ${s.green}22` : 'none',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', margin: '0 auto 8px',
                  background: packetStep >= i + 1 ? s.green : s.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: '#fff',
                  transition: 'background 0.3s',
                }}>
                  {node.icon}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: packetStep >= i + 1 ? s.green : s.text, transition: 'color 0.3s', marginBottom: 2 }}>
                  {node.label}
                </div>
                {node.sub && (
                  <div style={{ ...M, fontSize: 11, color: packetStep >= i + 1 ? s.green : s.text3, transition: 'color 0.3s' }}>
                    {node.sub}
                  </div>
                )}
              </div>
            </Fragment>
          ))}
        </div>
        {packetStep >= 2 && packetStep <= 3 && (
          <div style={{
            background: s.bg3, borderRadius: 8, padding: '12px 16px', textAlign: 'center',
            border: `1px solid ${s.orange}44`, transition: 'all 0.3s',
          }}>
            <div style={{ fontSize: 12, color: s.orange, fontWeight: 600, marginBottom: 4 }}>NAT Translation at Router</div>
            <div style={{ ...M, fontSize: 13 }}>
              <span style={{ color: s.red, textDecoration: 'line-through', opacity: 0.7 }}>192.168.1.42</span>
              <span style={{ color: s.text3, margin: '0 8px' }}>{'->'}</span>
              <span style={{ color: s.green, fontWeight: 600 }}>203.0.113.5</span>
            </div>
            <div style={{ fontSize: 11, color: s.text3, marginTop: 4 }}>Source IP rewritten so the remote server can reply</div>
          </div>
        )}
        {packetStep === 4 && !sending && (
          <div style={{
            background: `${s.green}0a`, borderRadius: 8, padding: '12px 16px', textAlign: 'center',
            border: `1px solid ${s.green}33`, transition: 'all 0.3s',
          }}>
            <div style={{ fontSize: 13, color: s.green, fontWeight: 600 }}>Packet delivered successfully</div>
            <div style={{ fontSize: 12, color: s.text3, marginTop: 2 }}>{'Response routes back: Internet -> ISP -> Router (NAT reverse) -> Your Device'}</div>
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
