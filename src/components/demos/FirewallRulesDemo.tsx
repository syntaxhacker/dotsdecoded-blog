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

interface Rule {
  id: number
  action: 'allow' | 'deny'
  direction: 'inbound' | 'outbound'
  port: string
  protocol: string
  desc: string
  enabled: boolean
}

const defaultRules: Rule[] = [
  { id: 1, action: 'allow', direction: 'inbound', port: '443', protocol: 'TCP', desc: 'HTTPS web traffic', enabled: true },
  { id: 2, action: 'allow', direction: 'inbound', port: '80', protocol: 'TCP', desc: 'HTTP web traffic', enabled: true },
  { id: 3, action: 'deny', direction: 'inbound', port: '22', protocol: 'TCP', desc: 'SSH (block external access)', enabled: true },
  { id: 4, action: 'allow', direction: 'inbound', port: '5432', protocol: 'TCP', desc: 'PostgreSQL (internal only)', enabled: true },
  { id: 5, action: 'allow', direction: 'outbound', port: '443', protocol: 'TCP', desc: 'API calls to external services', enabled: true },
  { id: 6, action: 'allow', direction: 'outbound', port: '6379', protocol: 'TCP', desc: 'Redis cache (internal only)', enabled: true },
]

const testPackets = [
  { src: '203.0.113.50', dst: '10.0.1.5', port: '443', protocol: 'TCP', desc: 'HTTPS request from internet' },
  { src: '198.51.100.12', dst: '10.0.1.5', port: '22', protocol: 'TCP', desc: 'SSH attempt from unknown IP' },
  { src: '10.0.1.5', dst: 'api.stripe.com', port: '443', protocol: 'TCP', desc: 'Outbound API call to Stripe' },
  { src: '203.0.113.99', dst: '10.0.1.5', port: '3306', protocol: 'TCP', desc: 'MySQL connection attempt from internet' },
  { src: '10.0.1.5', dst: '10.0.1.10', port: '5432', protocol: 'TCP', desc: 'Internal database query' },
  { src: '192.168.1.100', dst: '10.0.1.5', port: '80', protocol: 'TCP', desc: 'HTTP request from VPN client' },
]

export default function FirewallRulesDemo() {
  const [rules, setRules] = useState(defaultRules)
  const [selectedPacket, setSelectedPacket] = useState<number | null>(null)
  const [packetResult, setPacketResult] = useState<{ allowed: boolean; matchedRule: number | null } | null>(null)

  const toggleRule = (id: number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const testPacket = (idx: number) => {
    setSelectedPacket(idx)
    const pkt = testPackets[idx]
    const direction = pkt.dst === '10.0.1.5' ? 'inbound' : 'outbound'
    const matched = rules.find(r => r.enabled && r.direction === direction && r.port === pkt.port && r.protocol === pkt.protocol)
    setPacketResult({
      allowed: matched ? matched.action === 'allow' : false,
      matchedRule: matched ? matched.id : null,
    })
  }

  const addRule = () => {
    const newId = Math.max(...rules.map(r => r.id)) + 1
    setRules(prev => [...prev, {
      id: newId, action: 'deny', direction: 'inbound', port: '0',
      protocol: 'TCP', desc: 'New rule', enabled: true,
    }])
  }

  return (
    <DemoBoundary name="Firewall Rules">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Firewall Rules</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          A firewall controls which traffic can enter and leave your network. Toggle rules and test packets to see what gets through.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Rules (evaluated top to bottom)</span>
          <button onClick={addRule} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6,
            padding: '4px 12px', color: s.text2, cursor: 'pointer', fontSize: 12,
          }}>+ Add Rule</button>
        </div>

        <div style={{ marginBottom: 20 }}>
          {rules.map((rule) => (
            <div key={rule.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              background: rule.enabled ? s.bg3 : `${s.bg3}80`,
              borderBottom: `1px solid ${s.border}`,
              opacity: rule.enabled ? 1 : 0.5, transition: 'all 0.2s',
            }}>
              <button onClick={() => toggleRule(rule.id)} style={{
                width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                background: rule.enabled ? (rule.action === 'allow' ? s.green : s.red) : s.border,
                position: 'relative', transition: 'all 0.2s', flexShrink: 0,
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 2,
                  left: rule.enabled ? 18 : 2,
                  transition: 'left 0.2s',
                }} />
              </button>
              <span style={{
                color: rule.action === 'allow' ? s.green : s.red,
                fontFamily: s.mono, fontSize: 11, fontWeight: 700, minWidth: 50,
              }}>{rule.action.toUpperCase()}</span>
              <span style={{ color: s.text3, fontSize: 11, minWidth: 65 }}>{rule.direction}</span>
              <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 12, minWidth: 30 }}>{rule.port}</span>
              <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11, minWidth: 30 }}>{rule.protocol}</span>
              <span style={{ color: s.text2, fontSize: 12, flex: 1 }}>{rule.desc}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Test a Packet</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {testPackets.map((pkt, idx) => (
              <button key={idx} onClick={() => testPacket(idx)} style={{
                background: selectedPacket === idx
                  ? (packetResult?.allowed ? `${s.green}20` : `${s.red}20`)
                  : s.bg3,
                border: `1px solid ${selectedPacket === idx
                  ? (packetResult?.allowed ? s.green : s.red)
                  : s.border}`,
                borderRadius: 8, padding: '8px 12px',
                color: selectedPacket === idx
                  ? (packetResult?.allowed ? s.green : s.red)
                  : s.text2,
                cursor: 'pointer', fontSize: 11, transition: 'all 0.2s',
                fontFamily: s.mono, textAlign: 'left',
              }}>
                :{pkt.port} {pkt.desc.split(' ').slice(0, 3).join(' ')}
              </button>
            ))}
          </div>
          {packetResult && selectedPacket !== null && (
            <div style={{
              background: packetResult.allowed ? `${s.green}10` : `${s.red}10`,
              border: `1px solid ${packetResult.allowed ? s.green : s.red}`,
              borderRadius: 10, padding: 16,
            }}>
              <div style={{
                color: packetResult.allowed ? s.green : s.red,
                fontWeight: 700, fontSize: 14, marginBottom: 6,
                fontFamily: s.mono,
              }}>
                {packetResult.allowed ? 'ALLOWED' : 'BLOCKED'}
              </div>
              <div style={{ color: s.text2, fontSize: 12 }}>
                {packetResult.allowed
                  ? `Matched rule #${packetResult.matchedRule} (allow)`
                  : packetResult.matchedRule === null
                    ? 'No matching rule -- default deny'
                    : `Matched rule #${packetResult.matchedRule} (deny)`
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
