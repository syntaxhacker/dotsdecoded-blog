import { useState } from 'react'
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

const scenarios = [
  { name: 'API Request', proto: 'TCP', msg: 'GET /api/users HTTP/1.1', result: '200 OK {"users":[...]}' },
  { name: 'Video Call', proto: 'UDP', msg: 'RTP audio frame #142', result: 'Frame dropped (no retry)' },
  { name: 'File Upload', proto: 'TCP', msg: 'POST /upload (2.4 MB)', result: '201 Created (verified)' },
  { name: 'Game Move', proto: 'UDP', msg: 'PLAYER_POS x:142 y:88', result: 'Next frame overwrites' },
  { name: 'Payment', proto: 'TCP', msg: 'POST /charge $49.99', result: '200 OK txn_id:abc' },
  { name: 'DNS Query', proto: 'UDP', msg: 'QUERY api.example.com', result: 'RESPONSE 104.21.76.8' },
]

const features = [
  { name: 'Connection', tcp: '3-way handshake required', udp: 'No connection needed' },
  { name: 'Ordering', tcp: 'Guaranteed order', udp: 'No ordering' },
  { name: 'Retransmit', tcp: 'Lost packets resent', udp: 'Lost = gone' },
  { name: 'Flow Control', tcp: 'Sliding window', udp: 'None' },
  { name: 'Speed', tcp: 'Slower (overhead)', udp: 'Faster (minimal)' },
  { name: 'Use Case', tcp: 'APIs, files, payments', udp: 'Streaming, gaming, DNS' },
]

export default function TcpUdpCompareDemo() {
  const [selected, setSelected] = useState(0)
  const [sending, setSending] = useState(false)
  const [phase, setPhase] = useState(0)

  const handleSend = () => {
    setSending(true)
    setPhase(0)
    setTimeout(() => setPhase(1), 500)
    setTimeout(() => setPhase(2), 1200)
    setTimeout(() => {
      setPhase(3)
      setSending(false)
    }, 2000)
  }

  const sc = scenarios[selected]
  const isTcp = sc.proto === 'TCP'

  return (
    <DemoBoundary name="TCP vs UDP">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>TCP vs UDP</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          TCP guarantees delivery. UDP guarantees speed. Pick a scenario and send a packet to see how each protocol handles it.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {scenarios.map((sc2, idx) => (
            <button key={sc2.name} onClick={() => { setSelected(idx); setPhase(0) }} style={{
              background: selected === idx ? (sc2.proto === 'TCP' ? s.accent : s.orange) : s.bg3,
              border: `1px solid ${selected === idx ? (sc2.proto === 'TCP' ? s.accent : s.orange) : s.border}`,
              borderRadius: 8, padding: '8px 16px', color: selected === idx ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
            }}>
              {sc2.name} <span style={{ fontFamily: s.mono, fontSize: 11, opacity: 0.7 }}>({sc2.proto})</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: s.bg3, borderRadius: 10, padding: 20, border: `1px solid ${s.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ color: s.accent, fontWeight: 700, fontSize: 15 }}>TCP</span>
              <span style={{ color: isTcp ? s.green : s.text3, fontFamily: s.mono, fontSize: 12 }}>{isTcp ? 'ACTIVE' : '---'}</span>
            </div>
            <div style={{ background: s.bg, borderRadius: 8, padding: 12, marginBottom: 12, minHeight: 60 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>SEND</div>
              <code style={{ color: isTcp ? s.accent : s.text3, fontFamily: s.mono, fontSize: 12, lineHeight: 1.5 }}>{isTcp ? sc.msg : 'N/A'}</code>
            </div>
            <div style={{ background: s.bg, borderRadius: 8, padding: 12, minHeight: 60 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>RECV</div>
              <code style={{ color: isTcp && phase >= 3 ? s.green : s.text3, fontFamily: s.mono, fontSize: 12, lineHeight: 1.5 }}>
                {isTcp ? (phase >= 3 ? sc.result : phase >= 1 ? 'ACK received...' : 'Waiting...') : '---'}
              </code>
            </div>
            {isTcp && phase >= 1 && phase < 3 && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: `${s.accent}15`, borderRadius: 6, color: s.accent, fontSize: 12, fontFamily: s.mono }}>
                {phase === 1 && 'SYN -> SYN-ACK -> ACK (handshake)'}
                {phase === 2 && 'Sending data with sequence numbers...'}
              </div>
            )}
          </div>

          <div style={{ background: s.bg3, borderRadius: 10, padding: 20, border: `1px solid ${s.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ color: s.orange, fontWeight: 700, fontSize: 15 }}>UDP</span>
              <span style={{ color: !isTcp ? s.green : s.text3, fontFamily: s.mono, fontSize: 12 }}>{!isTcp ? 'ACTIVE' : '---'}</span>
            </div>
            <div style={{ background: s.bg, borderRadius: 8, padding: 12, marginBottom: 12, minHeight: 60 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>SEND</div>
              <code style={{ color: !isTcp ? s.orange : s.text3, fontFamily: s.mono, fontSize: 12, lineHeight: 1.5 }}>{!isTcp ? sc.msg : 'N/A'}</code>
            </div>
            <div style={{ background: s.bg, borderRadius: 8, padding: 12, minHeight: 60 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>RECV</div>
              <code style={{ color: !isTcp && phase >= 1 ? s.green : s.text3, fontFamily: s.mono, fontSize: 12, lineHeight: 1.5 }}>
                {!isTcp ? (phase >= 1 ? sc.result : 'Waiting...') : '---'}
              </code>
            </div>
            {!isTcp && phase >= 1 && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: `${s.orange}15`, borderRadius: 6, color: s.orange, fontSize: 12, fontFamily: s.mono }}>
                Fire and forget -- no handshake, no ACK
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <button onClick={handleSend} disabled={sending} style={{
            background: sending ? s.bg3 : (isTcp ? s.accent : s.orange),
            border: 'none', borderRadius: 10, padding: '12px 32px', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: sending ? 'default' : 'pointer',
            opacity: sending ? 0.6 : 1, transition: 'all 0.2s',
          }}>
            {sending ? 'Sending...' : `Send via ${sc.proto}`}
          </button>
        </div>

        <div style={{ marginTop: 24, borderTop: `1px solid ${s.border}`, paddingTop: 20 }}>
          <div style={{ color: s.text3, fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Feature Comparison</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <div style={{ padding: '8px 12px', color: s.text3, fontSize: 12, fontWeight: 600 }}>Feature</div>
            <div style={{ padding: '8px 12px', color: s.accent, fontSize: 12, fontWeight: 600 }}>TCP</div>
            <div style={{ padding: '8px 12px', color: s.orange, fontSize: 12, fontWeight: 600 }}>UDP</div>
            {features.map((f, idx) => (
              <>
                <div key={`f${idx}`} style={{ padding: '8px 12px', color: s.text2, fontSize: 12, borderTop: idx % 2 === 0 ? `1px solid ${s.border}` : 'none', background: idx % 2 === 0 ? s.bg3 : 'transparent' }}>{f.name}</div>
                <div key={`t${idx}`} style={{ padding: '8px 12px', color: s.text2, fontSize: 12, borderTop: idx % 2 === 0 ? `1px solid ${s.border}` : 'none', background: idx % 2 === 0 ? s.bg3 : 'transparent' }}>{f.tcp}</div>
                <div key={`u${idx}`} style={{ padding: '8px 12px', color: s.text2, fontSize: 12, borderTop: idx % 2 === 0 ? `1px solid ${s.border}` : 'none', background: idx % 2 === 0 ? s.bg3 : 'transparent' }}>{f.udp}</div>
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
