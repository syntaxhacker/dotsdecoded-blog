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
const M: React.CSSProperties = { fontFamily: s.mono }

const connections = [
  { name: 'Web Browsing', srcPort: '52341', dstPort: '443', protocol: 'TCP', srcDesc: 'Ephemeral (random)', dstDesc: 'HTTPS server' },
  { name: 'Secure Shell', srcPort: '53892', dstPort: '22', protocol: 'TCP', srcDesc: 'Ephemeral (random)', dstDesc: 'SSH server' },
  { name: 'Sending Email', srcPort: '50123', dstPort: '587', protocol: 'TCP', srcDesc: 'Ephemeral (random)', dstDesc: 'SMTP submission' },
  { name: 'DNS Lookup', srcPort: '54102', dstPort: '53', protocol: 'UDP', srcDesc: 'Ephemeral (random)', dstDesc: 'DNS resolver' },
  { name: 'Database', srcPort: '55100', dstPort: '5432', protocol: 'TCP', srcDesc: 'Ephemeral (random)', dstDesc: 'PostgreSQL server' },
]

export default function PortExplorerDemo() {
  const [selectedConnection, setSelectedConnection] = useState(0)

  return (
    <DemoBoundary name="Port Explorer">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Port Explorer</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Ports identify which application should receive data on a device. An IP address is the building,
          a port is the apartment number. Select a connection type below to see which ports are used.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {connections.map((conn, idx) => (
            <button key={conn.name} onClick={() => setSelectedConnection(idx)} style={{
              background: selectedConnection === idx ? s.accent : s.bg3,
              border: `1px solid ${selectedConnection === idx ? s.accent : s.border}`,
              borderRadius: 8, padding: '8px 16px', color: selectedConnection === idx ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
            }}>
              {conn.name}
            </button>
          ))}
        </div>
        <div style={{ background: s.bg3, borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Your Device</div>
              <div style={{ background: s.bg2, border: `1px solid ${s.border2}`, borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ ...M, fontSize: 12, color: s.text3, marginBottom: 4 }}>IP: 192.168.1.42</div>
                <div style={{ ...M, fontSize: 14, fontWeight: 600, color: s.accent }}>Port: {connections[selectedConnection].srcPort}</div>
                <div style={{ fontSize: 11, color: s.text3, marginTop: 4 }}>{connections[selectedConnection].srcDesc}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px' }}>
              <div style={{ ...M, fontSize: 18, color: s.green, marginBottom: 4 }}>&#8594;</div>
              <div style={{ fontSize: 10, color: s.text3 }}>{connections[selectedConnection].protocol}</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Remote Server</div>
              <div style={{ background: s.bg2, border: `1px solid ${s.border2}`, borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ ...M, fontSize: 12, color: s.text3, marginBottom: 4 }}>IP: 93.184.216.34</div>
                <div style={{ ...M, fontSize: 14, fontWeight: 600, color: s.green }}>Port: {connections[selectedConnection].dstPort}</div>
                <div style={{ fontSize: 11, color: s.text3, marginTop: 4 }}>{connections[selectedConnection].dstDesc}</div>
              </div>
            </div>
          </div>
          <div style={{ background: s.bg, borderRadius: 8, padding: '12px 16px', border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 6 }}>Connection Summary</div>
            <div style={{ ...M, fontSize: 13, color: s.text2, lineHeight: 1.6 }}>
              <span style={{ color: s.accent }}>192.168.1.42:{connections[selectedConnection].srcPort}</span>
              <span style={{ color: s.text3, margin: '0 6px' }}>{'->'}</span>
              <span style={{ color: s.green }}>93.184.216.34:{connections[selectedConnection].dstPort}</span>
              <span style={{ color: s.text3, margin: '0 8px' }}>via</span>
              <span style={{ color: s.yellow }}>{connections[selectedConnection].protocol}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Well-known', range: '0-1023', desc: 'System services (HTTP, SSH, DNS)' },
            { label: 'Registered', range: '1024-49151', desc: 'Application services (MySQL, Redis)' },
            { label: 'Ephemeral', range: '49152-65535', desc: 'Temporary client ports' },
          ].map(item => (
            <div key={item.label} style={{ background: s.bg3, borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: s.text, marginBottom: 2 }}>{item.label}</div>
              <div style={{ ...M, fontSize: 12, color: s.accent }}>{item.range}</div>
              <div style={{ fontSize: 10, color: s.text3, marginTop: 2 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
