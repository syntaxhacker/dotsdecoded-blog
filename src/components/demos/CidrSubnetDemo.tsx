import { useState } from 'react'

const s = {
  bg: '#12121a', bg2: '#1a1a25', bg3: '#22222e',
  text: '#e4e4e7', text2: '#a1a1aa', text3: '#71717a',
  border: '#27272a', border2: '#3f3f46',
  accent: '#3b82f6', green: '#22c55e', red: '#ef4444',
  yellow: '#eab308', purple: '#a78bfa', orange: '#fb923c',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
}

function longToIp(long: number): string {
  return [(long >>> 24) & 255, (long >>> 16) & 255, (long >>> 8) & 255, long & 255].join('.')
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const M: React.CSSProperties = { fontFamily: s.mono }

export default function CidrSubnetDemo() {
  const [cidr, setCidr] = useState(24)

  const baseIp = '10.0.0.0'
  const baseLong = ipToLong(baseIp)
  const maskLong = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0
  const networkLong = (baseLong & maskLong) >>> 0
  const broadcastLong = (baseLong | (~maskLong >>> 0)) >>> 0
  const subnetMask = longToIp(maskLong)
  const networkAddr = longToIp(networkLong)
  const broadcastAddr = longToIp(broadcastLong)
  const firstUsable = cidr >= 31 ? networkAddr : longToIp((networkLong + 1) >>> 0)
  const lastUsable = cidr === 32 ? networkAddr : cidr === 31 ? broadcastAddr : longToIp((broadcastLong - 1) >>> 0)
  const hostCount = cidr >= 31 ? (cidr === 32 ? 1 : 2) : Math.pow(2, 32 - cidr) - 2

  return (
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>CIDR and Subnetting</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          CIDR notation specifies how many bits define the network portion of an address.
          The remaining bits identify individual hosts. Drag the slider to explore different subnet sizes.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <span style={{ ...M, fontSize: 16, color: s.text, whiteSpace: 'nowrap' }}>{baseIp}/</span>
          <input
            type="range" min={0} max={32} value={cidr}
            onChange={e => setCidr(Number(e.target.value))}
            style={{ flex: 1, accentColor: s.accent, cursor: 'pointer' }}
          />
          <span style={{ ...M, fontSize: 24, fontWeight: 700, color: s.accent, minWidth: 36, textAlign: 'right' }}>{cidr}</span>
        </div>
        <div style={{ background: s.bg3, borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: s.text3, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>32-bit address split</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            {Array.from({ length: 4 }, (_, gi) => (
              <div key={gi} style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: 8 }, (_, bi) => {
                  const idx = gi * 8 + bi
                  const isNet = idx < cidr
                  return (
                    <div key={bi} style={{
                      width: 20, height: 20, borderRadius: 3,
                      background: isNet ? s.accent : s.bg,
                      border: `1px solid ${isNet ? s.accent : s.border}`,
                      transition: 'all 0.15s ease',
                    }} />
                  )
                })}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Array.from({ length: 4 }, (_, gi) => (
              <div key={gi} style={{ width: 174, textAlign: 'center', fontSize: 10, color: s.text3 }}>Octet {gi + 1}</div>
            ))}
          </div>
          <div style={{ display: 'flex', marginTop: 12, gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: s.accent }} />
              <span style={{ fontSize: 12, color: s.text2 }}>Network ({cidr} bits)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: s.bg, border: `1px solid ${s.border}` }} />
              <span style={{ fontSize: 12, color: s.text2 }}>Host ({32 - cidr} bits)</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { label: 'Subnet Mask', value: subnetMask },
            { label: 'Usable Hosts', value: hostCount.toLocaleString() },
            { label: 'Network Address', value: networkAddr },
            { label: 'Broadcast Address', value: broadcastAddr },
            { label: 'First Usable IP', value: firstUsable },
            { label: 'Last Usable IP', value: lastUsable },
          ].map(item => (
            <div key={item.label} style={{ background: s.bg3, borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 4 }}>{item.label}</div>
              <div style={{ ...M, fontSize: 14, fontWeight: 600, color: s.text }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
