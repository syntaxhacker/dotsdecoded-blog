import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const MAGIC_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

function generateKey(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

async function computeAccept(key: string): Promise<{ accept: string; hex: string }> {
  const data = new TextEncoder().encode(key + MAGIC_GUID)
  const hash = await crypto.subtle.digest('SHA-1', data)
  const hashBytes = new Uint8Array(hash)
  const hex = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const accept = btoa(String.fromCharCode(...hashBytes))
  return { accept, hex }
}

export default function WsHandshakeDemo() {
  const [key, setKey] = useState(generateKey)
  const [accept, setAccept] = useState('')
  const [hex, setHex] = useState('')
  const [showHex, setShowHex] = useState(false)

  useEffect(() => {
    let cancelled = false
    computeAccept(key).then((result) => {
      if (!cancelled) {
        setAccept(result.accept)
        setHex(result.hex)
      }
    })
    return () => { cancelled = true }
  }, [key])

  const newKey = useCallback(() => {
    setKey(generateKey())
  }, [])

  return (
    <DemoBoundary name="WebSocket Handshake">
      <div style={{
        background: s.bg, padding: '32px 24px', borderRadius: 16,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        maxWidth: 820, margin: '0 auto',
      }}>
        <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
            WebSocket Opening Handshake
          </div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
            The client sends an HTTP Upgrade request. The server computes the accept value by
            concatenating the key with a magic GUID, taking SHA-1, and base64-encoding the result.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ flex: '1 1 280px', background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.accent, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                Client Request
              </div>
              <div style={{ fontFamily: s.mono, fontSize: 12, lineHeight: 1.8, color: s.text }}>
                <div>GET /ws HTTP/1.1</div>
                <div style={{ color: s.text3 }}>Host: example.com</div>
                <div style={{ color: s.yellow }}>Upgrade: websocket</div>
                <div style={{ color: s.yellow }}>Connection: Upgrade</div>
                <div style={{ color: s.green, wordBreak: 'break-all' }}>
                  Sec-WebSocket-Key: {key}
                </div>
                <div style={{ color: s.text3 }}>Sec-WebSocket-Version: 13</div>
              </div>
            </div>
            <div style={{ flex: '1 1 280px', background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.green, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                Server Response
              </div>
              <div style={{ fontFamily: s.mono, fontSize: 12, lineHeight: 1.8, color: s.text }}>
                <div style={{ color: s.green }}>HTTP/1.1 101 Switching Protocols</div>
                <div style={{ color: s.yellow }}>Upgrade: websocket</div>
                <div style={{ color: s.yellow }}>Connection: Upgrade</div>
                <div style={{ color: s.accent, wordBreak: 'break-all' }}>
                  Sec-WebSocket-Accept: {accept}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.purple, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Accept Computation
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: s.mono, fontSize: 12 }}>
              <div style={{ color: s.text3 }}>Step 1: Concatenate key with magic GUID</div>
              <div style={{ color: s.text, wordBreak: 'break-all', background: s.bg3, borderRadius: 4, padding: '6px 10px' }}>
                {key}
              </div>
              <div style={{ color: s.text, textAlign: 'center' }}>+</div>
              <div style={{ color: s.yellow, wordBreak: 'break-all', background: s.bg3, borderRadius: 4, padding: '6px 10px' }}>
                {MAGIC_GUID}
              </div>
              <div style={{ color: s.text3 }}>Step 2: Compute SHA-1 hash</div>
              <div style={{ color: showHex ? s.green : s.text2, wordBreak: 'break-all', background: s.bg3, borderRadius: 4, padding: '6px 10px' }}>
                {showHex ? hex : 'Click "Show Hex" to reveal'}
              </div>
              <div style={{ color: s.text3 }}>Step 3: Base64 encode the hash</div>
              <div style={{ color: s.accent, wordBreak: 'break-all', background: s.bg3, borderRadius: 4, padding: '6px 10px', fontWeight: 600 }}>
                {accept}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={newKey} style={{
              background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              New Key
            </button>
            <button onClick={() => setShowHex(!showHex)} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
              color: s.text2, cursor: 'pointer', fontSize: 13,
            }}>
              {showHex ? 'Hide Hex' : 'Show Hex'}
            </button>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
