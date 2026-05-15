import { useState, useMemo, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const STATUS_CODES: { code: number; label: string; desc: string }[] = [
  { code: 1000, label: 'Normal Closure', desc: 'The connection successfully completed its purpose' },
  { code: 1001, label: 'Going Away', desc: 'Server is shutting down or client navigated away' },
  { code: 1008, label: 'Policy Violation', desc: 'Message violates server policy' },
  { code: 1011, label: 'Internal Error', desc: 'Server encountered an unexpected condition' },
]

function buildCloseFrame(statusCode: number, reason: string): number[] {
  const bytes: number[] = [0x88]
  const reasonBytes = new TextEncoder().encode(reason)
  const totalLen = 2 + reasonBytes.length

  if (totalLen < 126) {
    bytes.push(totalLen)
  } else if (totalLen < 65536) {
    bytes.push(126, (totalLen >> 8) & 0xff, totalLen & 0xff)
  }

  bytes.push((statusCode >> 8) & 0xff, statusCode & 0xff)
  bytes.push(...reasonBytes)

  return bytes
}

export default function WsCloseDemo() {
  const [statusIdx, setStatusIdx] = useState(0)
  const [reason, setReason] = useState('')
  const [clientSent, setClientSent] = useState(false)
  const [serverEchoed, setServerEchoed] = useState(false)
  const [abnormal, setAbnormal] = useState(false)

  const status = STATUS_CODES[statusIdx]

  const frameBytes = useMemo(
    () => buildCloseFrame(status.code, reason),
    [status.code, reason],
  )

  const initiateClose = useCallback(() => {
    setClientSent(true)
    setServerEchoed(false)
    setAbnormal(false)
    setTimeout(() => setServerEchoed(true), 600)
  }, [])

  const reset = useCallback(() => {
    setClientSent(false)
    setServerEchoed(false)
    setAbnormal(false)
  }, [])

  const triggerAbnormal = useCallback(() => {
    setClientSent(true)
    setAbnormal(true)
    setServerEchoed(false)
  }, [])

  return (
    <DemoBoundary name="WebSocket Close Handshake">
      <div style={{
        background: s.bg, padding: '32px 24px', borderRadius: 16,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        maxWidth: 820, margin: '0 auto',
      }}>
        <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
            Close Handshake
          </div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
            A close frame (opcode 8) contains a 2-byte status code and an optional reason string.
            The server echoes the close frame to confirm. If no close is received, the connection is abnormally closed.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>
                Status Code
              </label>
              <select
                value={statusIdx}
                onChange={e => { setStatusIdx(Number(e.target.value)); reset() }}
                style={{
                  width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
                  padding: '8px 12px', color: s.text, fontFamily: s.mono, fontSize: 13,
                  outline: 'none', cursor: 'pointer',
                }}
              >
                {STATUS_CODES.map((st, i) => (
                  <option key={st.code} value={i}>{st.code} - {st.label}</option>
                ))}
              </select>
              <div style={{ color: s.text3, fontSize: 11, marginTop: 4 }}>{status.desc}</div>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>
                Reason (optional)
              </label>
              <input
                value={reason}
                onChange={e => { setReason(e.target.value); reset() }}
                placeholder="Server shutting down..."
                maxLength={123}
                style={{
                  width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
                  padding: '8px 12px', color: s.text, fontFamily: s.mono, fontSize: 13,
                  outline: 'none',
                }}
              />
              <div style={{ color: s.text3, fontSize: 11, marginTop: 4, textAlign: 'right' }}>
                {reason.length}/123 bytes
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Close Frame Hex ({frameBytes.length} bytes)
            </div>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '12px 16px', fontFamily: s.mono, fontSize: 13,
              display: 'flex', flexWrap: 'wrap', gap: 4,
            }}>
              {frameBytes.map((b, i) => {
                let color = s.accent
                if (i === 0) color = s.accent
                else if (i === 1) color = s.yellow
                else if (i < 4) color = s.purple
                else color = s.green
                return (
                  <span key={i} style={{
                    background: `${color}22`,
                    border: `1px solid ${color}44`,
                    borderRadius: 4, padding: '1px 5px', color,
                  }}>
                    {b.toString(16).padStart(2, '0')}
                  </span>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{
              flex: 1, background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
              padding: 14, minWidth: 200,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Client
              </div>
              <div style={{
                padding: '8px 12px', borderRadius: 6, fontFamily: s.mono, fontSize: 12, lineHeight: 1.6,
                background: clientSent ? `${s.accent}15` : 'transparent',
                color: clientSent ? s.text : s.text3,
                transition: 'all 0.3s',
              }}>
                {clientSent
                  ? `Close frame sent: status=${status.code}${reason ? `, reason="${reason}"` : ''}`
                  : 'Waiting to send close...'}
              </div>
            </div>
            <div style={{
              flex: 1, background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
              padding: 14, minWidth: 200,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.green, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Server
              </div>
              <div style={{
                padding: '8px 12px', borderRadius: 6, fontFamily: s.mono, fontSize: 12, lineHeight: 1.6,
                background: serverEchoed ? `${s.green}15` : abnormal ? `${s.red}15` : 'transparent',
                color: serverEchoed ? s.green : abnormal ? s.red : s.text3,
                transition: 'all 0.3s',
              }}>
                {serverEchoed
                  ? `Close echoed: status=${status.code}`
                  : abnormal
                    ? 'No close received - connection terminated abnormally'
                    : 'Waiting...'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={initiateClose} disabled={clientSent && !serverEchoed} style={{
              background: (clientSent && !serverEchoed) ? s.bg3 : s.accent,
              border: 'none', borderRadius: 8, padding: '10px 20px',
              color: (clientSent && !serverEchoed) ? s.text3 : '#fff',
              cursor: (clientSent && !serverEchoed) ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600,
            }}>
              Send Close
            </button>
            <button onClick={triggerAbnormal} disabled={clientSent && !serverEchoed} style={{
              background: clientSent && !serverEchoed ? s.bg3 : s.red,
              border: 'none', borderRadius: 8, padding: '10px 20px',
              color: clientSent && !serverEchoed ? s.text3 : '#fff',
              cursor: clientSent && !serverEchoed ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600,
            }}>
              Simulate Abnormal Close
            </button>
            <button onClick={reset} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
              color: s.text2, cursor: 'pointer', fontSize: 13,
            }}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
