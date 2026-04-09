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

const methods = [
  { method: 'GET', desc: 'Read a resource', path: '/api/users', status: '200 OK', body: '[{id:1, name:"Alice"}]', color: s.green, safe: true, idempotent: true },
  { method: 'POST', desc: 'Create a resource', path: '/api/users', status: '201 Created', body: '{id:42, name:"Bob"}', color: s.accent, safe: false, idempotent: false },
  { method: 'PUT', desc: 'Replace a resource', path: '/api/users/42', status: '200 OK', body: '{id:42, name:"Bob V2"}', color: s.yellow, safe: false, idempotent: true },
  { method: 'PATCH', desc: 'Partial update', path: '/api/users/42', status: '200 OK', body: '{name:"Charlie"}', color: s.orange, safe: false, idempotent: false },
  { method: 'DELETE', desc: 'Remove a resource', path: '/api/users/42', status: '204 No Content', body: '', color: s.red, safe: false, idempotent: true },
]

const statusGroups = [
  { range: '1xx', desc: 'Informational', examples: ['100 Continue', '101 Switching Protocols'], color: s.accent },
  { range: '2xx', desc: 'Success', examples: ['200 OK', '201 Created', '204 No Content'], color: s.green },
  { range: '3xx', desc: 'Redirection', examples: ['301 Moved Permanently', '302 Found', '304 Not Modified'], color: s.yellow },
  { range: '4xx', desc: 'Client Error', examples: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '404 Not Found', '429 Too Many Requests'], color: s.orange },
  { range: '5xx', desc: 'Server Error', examples: ['500 Internal Server Error', '502 Bad Gateway', '503 Service Unavailable', '504 Gateway Timeout'], color: s.red },
]

const headers = [
  { name: 'Content-Type', value: 'application/json', desc: 'Tells the client what format the body is in' },
  { name: 'Authorization', value: 'Bearer eyJhbGciOi...', desc: 'JWT token for authentication' },
  { name: 'Cache-Control', value: 'max-age=3600', desc: 'Browser can cache this response for 1 hour' },
  { name: 'X-Request-Id', value: 'req_a1b2c3d4', desc: 'Trace ID for debugging across services' },
]

export default function HttpLifecycleDemo() {
  const [selectedMethod, setSelectedMethod] = useState(0)
  const [showStatus, setShowStatus] = useState(false)
  const [showHeaders, setShowHeaders] = useState(false)

  const m = methods[selectedMethod]

  return (
    <DemoBoundary name="HTTP Lifecycle">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>HTTP Methods & Status Codes</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Every API call is an HTTP method. Every response has a status code. Understanding these is non-negotiable for backend work.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {methods.map((mt, idx) => (
            <button key={mt.method} onClick={() => { setSelectedMethod(idx); setShowStatus(false) }} style={{
              background: selectedMethod === idx ? mt.color : s.bg3,
              border: `1px solid ${selectedMethod === idx ? mt.color : s.border}`,
              borderRadius: 8, padding: '8px 16px',
              color: selectedMethod === idx ? s.bg : s.text2,
              cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: s.mono,
              transition: 'all 0.2s',
            }}>{mt.method}</button>
          ))}
        </div>

        <div style={{ background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ color: m.color, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{m.method}</span>
            <span style={{ color: s.text, fontFamily: s.mono, fontSize: 14 }}>{m.path}</span>
            <span style={{ color: s.text3, fontSize: 13 }}>HTTP/1.1</span>
          </div>
          <div style={{ color: s.text2, fontSize: 13, marginBottom: 8 }}>{m.desc}</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ color: m.safe ? s.green : s.orange, fontSize: 12, fontFamily: s.mono }}>
              {m.safe ? 'SAFE' : 'NOT SAFE'}
            </span>
            <span style={{ color: m.idempotent ? s.green : s.orange, fontSize: 12, fontFamily: s.mono }}>
              {m.idempotent ? 'IDEMPOTENT' : 'NOT IDEMPOTENT'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setShowStatus(!showStatus)} style={{
            background: showStatus ? s.green : s.bg3,
            border: `1px solid ${showStatus ? s.green : s.border}`,
            borderRadius: 8, padding: '8px 16px', color: showStatus ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
          }}>Response</button>
          <button onClick={() => setShowHeaders(!showHeaders)} style={{
            background: showHeaders ? s.accent : s.bg3,
            border: `1px solid ${showHeaders ? s.accent : s.border}`,
            borderRadius: 8, padding: '8px 16px', color: showHeaders ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
          }}>Headers</button>
        </div>

        {showStatus && (
          <div style={{ background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ color: m.color, fontFamily: s.mono, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{m.status}</div>
            {m.body && (
              <div style={{ background: s.bg, borderRadius: 6, padding: 12, fontFamily: s.mono, fontSize: 12, color: s.text2 }}>
                {m.body}
              </div>
            )}
            {!m.body && (
              <div style={{ color: s.text3, fontSize: 13, fontStyle: 'italic' }}>No response body</div>
            )}
          </div>
        )}

        {showHeaders && (
          <div style={{ background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Common Headers You Use Daily</div>
            {headers.map((h) => (
              <div key={h.name} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${s.border}` }}>
                <div style={{ minWidth: 140 }}>
                  <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 12 }}>{h.name}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: s.text2, fontFamily: s.mono, fontSize: 12 }}>{h.value}</div>
                  <div style={{ color: s.text3, fontSize: 11, marginTop: 2 }}>{h.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 20 }}>
          <div style={{ color: s.text3, fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Status Code Families</div>
          {statusGroups.map((g) => (
            <div key={g.range} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${s.border}` }}>
              <span style={{ color: g.color, fontFamily: s.mono, fontSize: 13, fontWeight: 700, minWidth: 30 }}>{g.range}</span>
              <span style={{ color: s.text2, fontSize: 13, minWidth: 100 }}>{g.desc}</span>
              <span style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>{g.examples.join(' | ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
