import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

type RequestType = {
  label: string
  ip: string
  port: number
  method: string
  path: string
  host: string
  header: string
}

const requestTypes: RequestType[] = [
  { label: 'GET /api/users', ip: '203.0.113.42', port: 443, method: 'GET', path: '/api/users', host: 'api.example.com', header: 'Authorization: Bearer abc123' },
  { label: 'POST /api/orders', ip: '203.0.113.42', port: 443, method: 'POST', path: '/api/orders', host: 'api.example.com', header: 'Content-Type: application/json' },
  { label: 'GET /api/products', ip: '198.51.100.17', port: 443, method: 'GET', path: '/api/products', host: 'api.example.com', header: 'Accept: application/json' },
  { label: 'GET /static/logo.png', ip: '203.0.113.42', port: 443, method: 'GET', path: '/static/logo.png', host: 'cdn.example.com', header: 'Cache-Control: max-age=3600' },
  { label: 'WebSocket /ws', ip: '198.51.100.17', port: 443, method: 'GET', path: '/ws/chat', host: 'ws.example.com', header: 'Upgrade: websocket' },
]

const l4Servers = [
  { name: 'Backend Pool A', desc: 'Handles all traffic on port 443', color: s.accent },
  { name: 'Backend Pool B', desc: 'Handles all traffic on port 443', color: s.green },
]

const l7Servers = [
  { name: 'User Service', desc: '/api/users, /api/auth', color: s.accent },
  { name: 'Order Service', desc: '/api/orders, /api/cart', color: s.green },
  { name: 'Product Service', desc: '/api/products, /static/*', color: s.orange },
  { name: 'WebSocket Service', desc: '/ws/*', color: s.purple },
]

function getL4Target(_req: RequestType, _idx: number): number {
  return _idx % 2
}

function getL7Target(req: RequestType): number {
  if (req.path.startsWith('/api/users') || req.path.startsWith('/api/auth')) return 0
  if (req.path.startsWith('/api/orders') || req.path.startsWith('/api/cart')) return 1
  if (req.path.startsWith('/ws')) return 3
  return 2
}

export default function L4L7Demo() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [sent, setSent] = useState<number[]>([])

  const req = requestTypes[selectedIdx]
  const l4Target = getL4Target(req, sent.length)
  const l7Target = getL7Target(req)

  const handleSend = () => {
    setSent(prev => [...prev, selectedIdx])
  }

  const card = (title: string, color: string, children: React.ReactNode) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        background: s.bg3, borderRadius: 10, padding: '14px 16px', marginBottom: 12,
        borderTop: `2px solid ${color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color, fontSize: 15, fontWeight: 700 }}>{title}</span>
        <span style={{ color: s.text3, fontSize: 11 }}>{sent.length} requests</span>
      </div>
      {children}
    </div>
  )

  return (
    <DemoBoundary name="L4 vs L7 Load Balancing">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>L4 vs L7 Load Balancing</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          L4 routes by IP and port (fast, no content inspection). L7 routes by HTTP path, headers, and cookies (smart, content-aware). Send requests and watch where they go.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: s.text3, fontSize: 12 }}>Request:</span>
          <select value={selectedIdx} onChange={e => setSelectedIdx(Number(e.target.value))} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 12px',
            color: s.text, fontSize: 12, fontFamily: s.mono, cursor: 'pointer', outline: 'none',
          }}>
            {requestTypes.map((r, i) => (
              <option key={i} value={i}>{r.label}</option>
            ))}
          </select>
          <button onClick={handleSend} style={{
            background: s.accent, border: 'none', borderRadius: 6, padding: '6px 16px',
            color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>Send</button>
          <button onClick={() => setSent([])} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 12px',
            color: s.text2, cursor: 'pointer', fontSize: 12,
          }}>Reset</button>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {card('Layer 4 (Transport)', s.yellow, (
            <>
              <div style={{ background: s.bg, borderRadius: 8, padding: 12, marginBottom: 10, border: `1px solid ${s.border}` }}>
                <div style={{ color: s.text3, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Packet inspected</div>
                <div style={{ color: s.yellow, fontFamily: s.mono, fontSize: 12 }}>
                  <div>IP: {req.ip}</div>
                  <div>Port: {req.port}</div>
                </div>
                <div style={{ color: s.text3, fontSize: 10, marginTop: 6 }}>Route decision: IP + port only</div>
              </div>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 6 }}>Target servers:</div>
              {l4Servers.map((srv, i) => (
                <div key={srv.name} style={{
                  background: sent.length > 0 && i === l4Target ? `${srv.color}15` : s.bg3,
                  border: `1px solid ${sent.length > 0 && i === l4Target ? srv.color : s.border}`,
                  borderRadius: 8, padding: '8px 12', marginBottom: 4, transition: 'all 0.3s',
                }}>
                  <div style={{ color: srv.color, fontSize: 12, fontWeight: 600 }}>{srv.name}</div>
                  <div style={{ color: s.text3, fontSize: 10 }}>{srv.desc}</div>
                </div>
              ))}
              <div style={{ marginTop: 8, color: s.yellow, fontSize: 11, fontStyle: 'italic' }}>
                L4 cannot distinguish between /api/users and /api/orders -- same port, same pool.
              </div>
            </>
          ))}

          {card('Layer 7 (Application)', s.purple, (
            <>
              <div style={{ background: s.bg, borderRadius: 8, padding: 12, marginBottom: 10, border: `1px solid ${s.border}` }}>
                <div style={{ color: s.text3, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Full HTTP request inspected</div>
                <div style={{ color: s.purple, fontFamily: s.mono, fontSize: 11 }}>
                  <div>{req.method} {req.path}</div>
                  <div>Host: {req.host}</div>
                  <div style={{ color: s.text3 }}>{req.header}</div>
                </div>
                <div style={{ color: s.text3, fontSize: 10, marginTop: 6 }}>Route decision: path + headers</div>
              </div>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 6 }}>Target services:</div>
              {l7Servers.map((srv, i) => (
                <div key={srv.name} style={{
                  background: sent.length > 0 && i === l7Target ? `${srv.color}15` : s.bg3,
                  border: `1px solid ${sent.length > 0 && i === l7Target ? srv.color : s.border}`,
                  borderRadius: 8, padding: '8px 12', marginBottom: 4, transition: 'all 0.3s',
                }}>
                  <div style={{ color: srv.color, fontSize: 12, fontWeight: 600 }}>{srv.name}</div>
                  <div style={{ color: s.text3, fontSize: 10 }}>{srv.desc}</div>
                </div>
              ))}
              <div style={{ marginTop: 8, color: s.purple, fontSize: 11, fontStyle: 'italic' }}>
                L7 reads the URL path and routes /api/users to User Service, /api/orders to Order Service.
              </div>
            </>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
