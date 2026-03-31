import { useState, Fragment } from 'react'

const s = {
  bg: '#12121a', bg2: '#1a1a25', bg3: '#22222e',
  text: '#e4e4e7', text2: '#a1a1aa', text3: '#71717a',
  border: '#27272a', border2: '#3f3f46',
  accent: '#3b82f6', green: '#22c55e', red: '#ef4444',
  yellow: '#eab308', purple: '#a78bfa', orange: '#fb923c',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const M: React.CSSProperties = { fontFamily: s.mono }

const packetLayers = [
  {
    name: 'Ethernet Frame', size: '14 bytes', protocol: 'Layer 2', color: s.orange,
    fields: [
      { key: 'Destination MAC', value: 'aa:bb:cc:dd:ee:01', highlight: undefined },
      { key: 'Source MAC', value: 'f0:de:f1:23:45:67', highlight: undefined },
      { key: 'EtherType', value: '0x0800 (IPv4)', highlight: s.orange },
    ],
  },
  {
    name: 'IPv4 Header', size: '20 bytes', protocol: 'Layer 3', color: s.accent,
    fields: [
      { key: 'Version', value: '4', highlight: undefined },
      { key: 'IHL', value: '5 (20 bytes)', highlight: undefined },
      { key: 'Total Length', value: '1,460 bytes', highlight: undefined },
      { key: 'Time To Live', value: '64', highlight: s.yellow },
      { key: 'Protocol', value: '6 (TCP)', highlight: s.green },
      { key: 'Source IP', value: '192.168.1.42', highlight: s.accent },
      { key: 'Destination IP', value: '93.184.216.34', highlight: s.green },
    ],
  },
  {
    name: 'TCP Header', size: '20 bytes', protocol: 'Layer 4', color: s.green,
    fields: [
      { key: 'Source Port', value: '52341', highlight: s.accent },
      { key: 'Destination Port', value: '443 (HTTPS)', highlight: s.green },
      { key: 'Sequence Number', value: '1,234,567', highlight: undefined },
      { key: 'Acknowledgment', value: '5,678,901', highlight: undefined },
      { key: 'Flags', value: 'ACK, PSH', highlight: s.yellow },
      { key: 'Window Size', value: '65,535', highlight: undefined },
    ],
  },
  {
    name: 'HTTP Payload', size: '~1,420 bytes', protocol: 'Layer 7', color: s.purple,
    fields: [
      { key: 'Method', value: 'GET / HTTP/1.1', highlight: s.purple },
      { key: 'Host', value: 'dotsdecoded.com', highlight: undefined },
      { key: 'User-Agent', value: 'Mozilla/5.0 ...', highlight: undefined },
      { key: 'Accept', value: 'text/html, */*', highlight: undefined },
    ],
  },
]

export default function PacketStructureDemo() {
  const [selectedPacketLayer, setSelectedPacketLayer] = useState(-1)

  return (
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Packet Structure</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Every packet that crosses the internet carries headers that tell routers and servers where it came from,
          where it is going, and how to reassemble it. Click each layer to see what is inside.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {packetLayers.map((layer, i) => (
            <div key={i}>
              <div
                onClick={() => setSelectedPacketLayer(selectedPacketLayer === i ? -1 : i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: selectedPacketLayer === i ? `${layer.color}15` : s.bg3,
                  border: `1px solid ${selectedPacketLayer === i ? layer.color : s.border}`,
                  borderRadius: 8, padding: '12px 16px', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 8, height: 36, borderRadius: 4,
                  background: layer.color, flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: selectedPacketLayer === i ? layer.color : s.text, transition: 'color 0.2s' }}>
                    {layer.name}
                  </div>
                  <div style={{ fontSize: 11, color: s.text3 }}>{layer.size}</div>
                </div>
                <span style={{ fontSize: 12, color: s.text3, ...M }}>{layer.protocol}</span>
                <span style={{ color: selectedPacketLayer === i ? layer.color : s.text3, transition: 'color 0.2s' }}>
                  {selectedPacketLayer === i ? String.fromCharCode(9660) : String.fromCharCode(9654)}
                </span>
              </div>
              {selectedPacketLayer === i && (
                <div style={{
                  background: s.bg, border: `1px solid ${s.border}`,
                  borderRadius: '0 0 8px 8px', padding: '14px 16px',
                  marginTop: -2, borderTop: 'none',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px 12px' }}>
                    {layer.fields.map((field, j) => (
                      <Fragment key={j}>
                        <div style={{ ...M, fontSize: 12, color: s.text3 }}>{field.key}</div>
                        <div style={{ ...M, fontSize: 12, color: field.highlight ? field.highlight : s.text }}>{field.value}</div>
                      </Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, background: s.bg3, borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.7 }}>
            When you visit a website, your browser sends hundreds of these packets. The TCP header ensures reliable delivery (lost packets are retransmitted). The IP header ensures routing. The Ethernet frame handles the last hop on your local network. Each layer wraps the next -- this is called <strong style={{ color: s.accent }}>encapsulation</strong>.
          </div>
        </div>
      </div>
    </div>
  )
}
