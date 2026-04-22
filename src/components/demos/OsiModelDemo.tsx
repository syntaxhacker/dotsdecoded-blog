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

const layers = [
  { num: 7, name: 'Application', proto: 'HTTP, DNS, SSH, FTP', color: s.accent, example: 'curl https://api.example.com/users' },
  { num: 6, name: 'Presentation', proto: 'SSL/TLS, JPEG, ASCII', color: s.green, example: 'Encrypts payload with TLS 1.3' },
  { num: 5, name: 'Session', proto: 'NetBIOS, RPC, PPTP', color: s.yellow, example: 'Opens/keeps connection alive' },
  { num: 4, name: 'Transport', proto: 'TCP, UDP', color: s.orange, example: 'Segments data, adds port 443' },
  { num: 3, name: 'Network', proto: 'IP, ICMP, OSPF', color: s.red, example: 'Adds src/dst IP addresses' },
  { num: 2, name: 'Data Link', proto: 'Ethernet, MAC, ARP', color: s.purple, example: 'Adds MAC addresses, frames' },
  { num: 1, name: 'Physical', proto: 'Cables, Wi-Fi, Fiber', color: s.text3, example: 'Converts to electrical signals' },
]

const tcpIpLayers = [
  { num: 4, name: 'Application', proto: 'HTTP, DNS, SSH', covers: [7, 6, 5], color: s.accent },
  { num: 3, name: 'Transport', proto: 'TCP, UDP', covers: [4], color: s.orange },
  { num: 2, name: 'Internet', proto: 'IP, ICMP', covers: [3], color: s.red },
  { num: 1, name: 'Link', proto: 'Ethernet, Wi-Fi', covers: [2, 1], color: s.purple },
]

export default function OsiModelDemo() {
  const [selected, setSelected] = useState<number | null>(null)
  const [view, setView] = useState<'osi' | 'tcp'>('osi')

  return (
    <DemoBoundary name="OSI Model Explorer">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>OSI Model Explorer</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Click any layer to see how your request travels through it. Toggle between the 7-layer OSI model and the simplified TCP/IP model used in practice.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => { setView('osi'); setSelected(null) }} style={{
            background: view === 'osi' ? s.accent : s.bg3,
            border: `1px solid ${view === 'osi' ? s.accent : s.border}`,
            borderRadius: 8, padding: '8px 16px', color: view === 'osi' ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
          }}>OSI (7 layers)</button>
          <button onClick={() => { setView('tcp'); setSelected(null) }} style={{
            background: view === 'tcp' ? s.accent : s.bg3,
            border: `1px solid ${view === 'tcp' ? s.accent : s.border}`,
            borderRadius: 8, padding: '8px 16px', color: view === 'tcp' ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
          }}>TCP/IP (4 layers)</button>
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            {view === 'osi' ? layers.map((layer) => (
              <div
                key={layer.num}
                onClick={() => setSelected(selected === layer.num ? null : layer.num)}
                style={{
                  background: selected === layer.num ? `${layer.color}15` : s.bg3,
                  border: `1px solid ${selected === layer.num ? layer.color : s.border}`,
                  borderLeft: `4px solid ${layer.color}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 6,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: layer.color, fontFamily: s.mono, fontSize: 12, fontWeight: 600 }}>L{layer.num}</span>
                  <span style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>{layer.name}</span>
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>{layer.proto}</span>
                </div>
              </div>
            )) : tcpIpLayers.map((layer) => (
              <div
                key={layer.num}
                onClick={() => setSelected(selected === layer.num ? null : layer.num)}
                style={{
                  background: selected === layer.num ? `${layer.color}15` : s.bg3,
                  border: `1px solid ${selected === layer.num ? layer.color : s.border}`,
                  borderLeft: `4px solid ${layer.color}`,
                  borderRadius: 8,
                  padding: selected === layer.num ? '10px 14px' : `${Math.max(10, layer.covers.length * 32)}px 14px`,
                  marginBottom: 6,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minHeight: 42,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: layer.color, fontFamily: s.mono, fontSize: 12, fontWeight: 600 }}>L{layer.num}</span>
                  <span style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>{layer.name}</span>
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>{layer.proto}</span>
                </div>
                {selected === layer.num && (
                  <div style={{ marginTop: 8, fontSize: 12, color: s.text3 }}>
                    Maps to OSI layers: {layer.covers.map(l => `L${l}`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {selected !== null && view === 'osi' && (
            <div style={{ flex: 1, background: s.bg3, borderRadius: 10, padding: 20 }}>
              {(() => {
                const layer = layers.find(l => l.num === selected)
                if (!layer) return null
                return (
                  <>
                    <div style={{ color: layer.color, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Layer {layer.num}: {layer.name}</div>
                    <div style={{ color: s.text2, fontSize: 13, marginBottom: 12 }}>
                      <span style={{ color: s.text3 }}>Protocols:</span> {layer.proto}
                    </div>
                    <div style={{ background: s.bg, borderRadius: 8, padding: 14, marginBottom: 12 }}>
                      <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Real example</div>
                      <code style={{ color: layer.color, fontFamily: s.mono, fontSize: 12, lineHeight: 1.6 }}>{layer.example}</code>
                    </div>
                    <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6 }}>
                      {layer.num === 7 && 'This is where your code lives. When you write fetch("/api/users"), the browser handles layers 1-6 for you. You only control this layer.'}
                      {layer.num === 6 && 'Data encryption (TLS) and format conversion happen here. Your HTTPS response body is encrypted at this layer before being sent.'}
                      {layer.num === 5 && 'Manages session state between applications. Websockets maintain a session here. HTTP is technically stateless at this layer.'}
                      {layer.num === 4 && 'TCP adds reliability (sequencing, retransmission). UDP skips all of that for speed. This layer adds port numbers.'}
                      {layer.num === 3 && 'Routers operate at this layer. IP addresses are added here. This is where packet routing decisions are made across networks.'}
                      {layer.num === 2 && 'Switches operate here. MAC addresses identify devices on the same local network. ARP maps IP to MAC at this layer.'}
                      {layer.num === 1 && 'The physical hardware. Cables, radio waves, fiber optics. Converts bits to electrical/optical signals on the wire.'}
                    </div>
                  </>
                )
              })()}
            </div>
          )}

          {selected !== null && view === 'tcp' && (
            <div style={{ flex: 1, background: s.bg3, borderRadius: 10, padding: 20 }}>
              {(() => {
                const layer = tcpIpLayers.find(l => l.num === selected)
                if (!layer) return null
                const descriptions: Record<number, string> = {
                  4: 'Combines OSI Application, Presentation, and Session. Your app code (HTTP handlers, API routes, middleware) all lives here. This is the only layer you write code for.',
                  3: 'Maps to OSI Transport. TCP gives you reliable streams, UDP gives you fast fire-and-forget. Your choice of protocol here affects everything above.',
                  2: 'Maps to OSI Network. IP routing happens here. Your load balancer, reverse proxy, and firewall all work at this layer.',
                  1: 'Combines OSI Data Link and Physical. Ethernet frames, MAC addresses, Wi-Fi, cables. You rarely touch this layer directly.',
                }
                return (
                  <>
                    <div style={{ color: layer.color, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Layer {layer.num}: {layer.name}</div>
                    <div style={{ color: s.text2, fontSize: 13, marginBottom: 12 }}>
                      <span style={{ color: s.text3 }}>Protocols:</span> {layer.proto}
                    </div>
                    <div style={{ background: s.bg, borderRadius: 8, padding: 14 }}>
                      <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Maps to OSI</div>
                      <code style={{ color: layer.color, fontFamily: s.mono, fontSize: 12 }}>{layer.covers.map(l => layers.find(osi => osi.num === l)?.name).join(' + ')}</code>
                    </div>
                    <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
                      {descriptions[layer.num]}
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
