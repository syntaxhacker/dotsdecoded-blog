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

interface Layer {
  name: string
  protocol: 'http2' | 'http3'
  description: string
  detail: string
  color: string
  height: number
}

const layers: Layer[] = [
  { name: 'HTTP/2 Semantics', protocol: 'http2', description: 'Same HTTP methods, status codes, headers as HTTP/1.1', detail: 'Requests and responses use the same semantics. Methods (GET, POST), status codes (200, 404), and headers remain identical. The wire format changes to frames.', color: s.accent, height: 40 },
  { name: 'HPACK', protocol: 'http2', description: 'Header compression for HTTP/2 using static/dynamic tables', detail: 'HPACK compresses headers using Huffman coding and indexed tables. But it is vulnerable to head-of-line blocking because it depends on ordered TCP delivery.', color: s.yellow, height: 36 },
  { name: 'TLS 1.3', protocol: 'http2', description: 'Transport Layer Security -- encryption and authentication', detail: 'TLS 1.3 provides a 1-RTT handshake (or 0-RTT with session resumption). Encrypts all HTTP/2 frames. Mandatory for HTTP/2 in browsers.', color: s.orange, height: 36 },
  { name: 'TCP', protocol: 'http2', description: 'Reliable, ordered byte stream transport', detail: 'TCP guarantees in-order delivery. But a lost packet blocks all subsequent data -- the head-of-line blocking problem. HTTP/2 multiplexing helps but does not eliminate it at the transport layer.', color: s.red, height: 36 },
  { name: 'IP', protocol: 'http2', description: 'Internet Protocol -- packet routing', detail: 'IP handles addressing and routing between networks. Common to both HTTP/2 and HTTP/3.', color: s.text3, height: 32 },

  { name: 'HTTP/3 Semantics', protocol: 'http3', description: 'Same HTTP semantics adapted for QUIC streams', detail: 'HTTP/3 preserves the same request/response model. It maps each request to a QUIC stream, enabling true multiplexing without transport-level head-of-line blocking.', color: s.accent, height: 40 },
  { name: 'QPACK', protocol: 'http3', description: 'Single-pass header compression for HTTP/3', detail: 'QPACK is like HPACK but designed for QUIC. It uses separate encoder/decoder streams so header compression does not block other streams. No head-of-line blocking.', color: s.green, height: 36 },
  { name: 'QUIC Transport', protocol: 'http3', description: 'Custom reliable transport over UDP with built-in TLS', detail: 'QUIC is a full transport protocol built on UDP. It provides reliability, flow control, multiplexed streams, connection migration, and 0-RTT handshakes. TLS 1.3 is baked in.', color: s.purple, height: 40 },
  { name: 'UDP', protocol: 'http3', description: 'Connectionless datagram transport', detail: 'UDP is a minimal transport layer that provides no ordering or reliability guarantees. QUIC builds all of its features on top of UDP, avoiding kernel-level TCP dependencies.', color: s.orange, height: 32 },
  { name: 'IP', protocol: 'http3', description: 'Internet Protocol -- packet routing', detail: 'Same IP layer. HTTP/3 packets are just UDP datagrams inside IP packets, traversing the same routers and networks.', color: s.text3, height: 32 },
]

const http2Layers = layers.filter(l => l.protocol === 'http2')
const http3Layers = layers.filter(l => l.protocol === 'http3')

export default function Http3ArchitectureDemo() {
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null)
  const [infoTab, setInfoTab] = useState<'layers' | 'discovery'>('layers')

  const totalH2 = http2Layers.reduce((sum, l) => sum + l.height + 6, 0)
  const totalH3 = http3Layers.reduce((sum, l) => sum + l.height + 6, 0)

  return (
    <DemoBoundary name="HTTP/3 Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>HTTP/2 vs HTTP/3 Protocol Stack</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          HTTP/3 replaces TLS+TCP with QUIC+UDP, eliminating transport-level head-of-line blocking and adding connection migration. Click on any layer for details.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setInfoTab('layers')} style={{
            background: infoTab === 'layers' ? s.accent : s.bg3,
            border: `1px solid ${infoTab === 'layers' ? s.accent : s.border}`,
            borderRadius: 8, padding: '8px 16px',
            color: infoTab === 'layers' ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13,
            transition: 'all 0.2s',
          }}>Layer Comparison</button>
          <button onClick={() => setInfoTab('discovery')} style={{
            background: infoTab === 'discovery' ? s.green : s.bg3,
            border: `1px solid ${infoTab === 'discovery' ? s.green : s.border}`,
            borderRadius: 8, padding: '8px 16px',
            color: infoTab === 'discovery' ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13,
            transition: 'all 0.2s',
          }}>Protocol Negotiation</button>
        </div>

        {infoTab === 'layers' && (
          <>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ textAlign: 'center', color: s.red, fontWeight: 700, fontSize: 13, marginBottom: 8, fontFamily: s.mono }}>HTTP/2</div>
                <div style={{ background: s.bg3, borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'stretch' }}>
                  {http2Layers.map((layer, idx) => {
                    const isSelected = selectedLayer?.name === layer.name
                    return (
                      <div key={layer.name}
                        onClick={() => setSelectedLayer(isSelected ? null : layer)}
                        style={{
                          height: layer.height,
                          background: isSelected ? `${layer.color}30` : layer.color,
                          borderRadius: 6,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.2s',
                          border: isSelected ? `2px solid ${layer.color}` : '2px solid transparent',
                          filter: selectedLayer && !isSelected ? 'brightness(0.5)' : 'none',
                        }}
                      >
                        <span style={{
                          color: isSelected ? layer.color : '#fff',
                          fontSize: 11, fontWeight: 600, fontFamily: s.mono,
                          textAlign: 'center', padding: '0 4px',
                        }}>
                          {layer.name}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ textAlign: 'center', color: s.green, fontWeight: 700, fontSize: 13, marginBottom: 8, fontFamily: s.mono }}>HTTP/3</div>
                <div style={{ background: s.bg3, borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'stretch' }}>
                  {http3Layers.map((layer, idx) => {
                    const isSelected = selectedLayer?.name === layer.name
                    return (
                      <div key={layer.name}
                        onClick={() => setSelectedLayer(isSelected ? null : layer)}
                        style={{
                          height: layer.height,
                          background: isSelected ? `${layer.color}30` : layer.color,
                          borderRadius: 6,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.2s',
                          border: isSelected ? `2px solid ${layer.color}` : '2px solid transparent',
                          filter: selectedLayer && !isSelected ? 'brightness(0.5)' : 'none',
                        }}
                      >
                        <span style={{
                          color: isSelected ? layer.color : '#fff',
                          fontSize: 11, fontWeight: 600, fontFamily: s.mono,
                          textAlign: 'center', padding: '0 4px',
                        }}>
                          {layer.name}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {selectedLayer && (
              <div style={{ background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 16, border: `1px solid ${selectedLayer.color}40` }}>
                <div style={{ color: selectedLayer.color, fontSize: 14, fontWeight: 700, fontFamily: s.mono, marginBottom: 6 }}>
                  {selectedLayer.name}
                </div>
                <div style={{ color: s.text2, fontSize: 13, marginBottom: 4 }}>{selectedLayer.description}</div>
                <div style={{ color: s.text3, fontSize: 12, lineHeight: 1.5 }}>{selectedLayer.detail}</div>
              </div>
            )}

            {!selectedLayer && (
              <div style={{ background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 16, textAlign: 'center' }}>
                <div style={{ color: s.text3, fontSize: 13 }}>Click on any layer to see its description</div>
              </div>
            )}
          </>
        )}

        {infoTab === 'discovery' && (
          <div style={{ background: s.bg3, borderRadius: 10, padding: 16 }}>
            <div style={{ color: s.text, fontSize: 14, fontWeight: 700, marginBottom: 12, fontFamily: s.mono }}>
              Protocol Negotiation (Alt-Svc / DNS HTTPS)
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: s.orange, fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: s.mono }}>Method 1: Alt-Svc Header</div>
              <div style={{ background: s.bg, borderRadius: 6, padding: 12, fontFamily: s.mono, fontSize: 11, lineHeight: 1.6, color: s.text2 }}>
                Server sends in initial HTTP/1.1 or HTTP/2 response:
                <br />
                <span style={{ color: s.green }}>Alt-Svc: h3=":443"; ma=86400</span>
                <br />
                <span style={{ color: s.text3 }}>// "This server speaks HTTP/3 on port 443"</span>
                <br /><br />
                Client caches this for <span style={{ color: s.yellow }}>86400 seconds</span> (1 day).
                <br />
                Next request goes directly to HTTP/3 over QUIC.
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: s.purple, fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: s.mono }}>Method 2: DNS HTTPS Record</div>
              <div style={{ background: s.bg, borderRadius: 6, padding: 12, fontFamily: s.mono, fontSize: 11, lineHeight: 1.6, color: s.text2 }}>
                DNS lookup returns:
                <br />
                <span style={{ color: s.purple }}>example.com  HTTPS 1 . alpn="h3,h2"</span>
                <br />
                <span style={{ color: s.text3 }}>// "Supported protocols: HTTP/3 and HTTP/2"</span>
                <br /><br />
                Client connects directly with the best protocol.
                <br />
                No upgrade needed -- works on the very first connection.
              </div>
            </div>

            <div style={{ background: `${s.green}10`, borderRadius: 6, padding: 12 }}>
              <div style={{ color: s.green, fontSize: 12, fontWeight: 600, marginBottom: 4, fontFamily: s.mono }}>
                ALPN (Application-Layer Protocol Negotiation)
              </div>
              <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
                During the TLS handshake, both sides advertise which protocols they support via the ALPN extension.
                The server picks the best mutually supported protocol. This is how h2 (HTTP/2) and h3 (HTTP/3) are negotiated
                without extra round trips. ALPN strings: h2=http/2, h3=http/3.
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, padding: 12, background: `${s.accent}10`, borderRadius: 8, border: `1px solid ${s.accent}30` }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.red }} />
              <span style={{ color: s.text3, fontSize: 11 }}>TCP transport -- HoL blocking risk</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.purple }} />
              <span style={{ color: s.text3, fontSize: 11 }}>QUIC transport -- no HoL blocking</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.orange }} />
              <span style={{ color: s.text3, fontSize: 11 }}>UDP -- connectionless, QUIC builds on it</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
