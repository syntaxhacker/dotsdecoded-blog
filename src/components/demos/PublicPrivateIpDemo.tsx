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
  accent: '#3c6bc3',
  green: '#5a9e8e',
  red: '#c46060',
  yellow: '#bfa03a',
  purple: '#4a6eb5',
  orange: '#c48a4a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
}

function isValidIp(v: string): boolean {
  const parts = v.split('.')
  if (parts.length !== 4) return false
  return parts.every(p => { const n = parseInt(p); return !isNaN(n) && n >= 0 && n <= 255 && p === String(n) })
}

function getPrivateRange(ip: string): string | null {
  const long = ipToLong(ip)
  const a = (long >>> 24) & 255
  const b = (long >>> 16) & 255
  if (a === 10) return '10.0.0.0/8 (Class A)'
  if (a === 172 && b >= 16 && b <= 31) return '172.16.0.0/12 (Class B)'
  if (a === 192 && b === 168) return '192.168.0.0/16 (Class C)'
  return null
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const M: React.CSSProperties = { fontFamily: s.mono }

export default function PublicPrivateIpDemo() {
  const [ipInput, setIpInput] = useState('')

  const inputValid = isValidIp(ipInput)
  const inputPrivate = inputValid ? getPrivateRange(ipInput) : null

  return (
    <DemoBoundary name="Public vs Private IP">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Public vs Private Addresses</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Private IP ranges are reserved for internal networks and not routable on the public internet.
          NAT (Network Address Translation) allows private devices to communicate externally using a shared public IP.
        </p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { range: '10.0.0.0/8', cls: 'Class A', hosts: '16,777,216' },
            { range: '172.16.0.0/12', cls: 'Class B', hosts: '1,048,576' },
            { range: '192.168.0.0/16', cls: 'Class C', hosts: '65,536' },
          ].map(item => (
            <div key={item.range} style={{ background: s.bg3, borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 170, borderLeft: `3px solid ${s.green}` }}>
              <div style={{ ...M, fontSize: 13, fontWeight: 600, color: s.green }}>{item.range}</div>
              <div style={{ fontSize: 12, color: s.text2, marginTop: 3 }}>{item.cls}</div>
              <div style={{ fontSize: 11, color: s.text3, marginTop: 1 }}>{item.hosts} addresses</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: s.text2, marginBottom: 8 }}>Test an IP Address</div>
          <input
            type="text" value={ipInput} onChange={e => setIpInput(e.target.value)}
            placeholder="e.g. 192.168.1.42 or 8.8.8.8"
            style={{
              width: '100%', boxSizing: 'border-box', background: s.bg3,
              border: `1px solid ${inputValid ? (inputPrivate ? s.green : s.accent) : ipInput.length > 0 ? s.red : s.border}`,
              borderRadius: 8, padding: '10px 14px', color: s.text, ...M, fontSize: 14,
              outline: 'none', transition: 'border-color 0.2s',
            }}
          />
        </div>
        {ipInput.length > 0 && (
          <div style={{
            background: s.bg3, borderRadius: 8, padding: '14px 18px',
            borderLeft: `3px solid ${!inputValid ? s.red : inputPrivate ? s.green : s.accent}`,
            transition: 'all 0.3s',
          }}>
            {!inputValid ? (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: s.red }}>Invalid IP Address</div>
                <div style={{ fontSize: 12, color: s.text3, marginTop: 4 }}>Enter four octets (0-255) separated by dots</div>
              </div>
            ) : inputPrivate ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.green }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: s.green }}>Private Address</span>
                </div>
                <div style={{ fontSize: 12, color: s.text2, marginTop: 6 }}>Range: {inputPrivate}</div>
                <div style={{ fontSize: 12, color: s.text3, marginTop: 2 }}>Not directly routable on the public internet. Requires NAT for external access.</div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.accent }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: s.accent }}>Public Address</span>
                </div>
                <div style={{ fontSize: 12, color: s.text2, marginTop: 6 }}>Routable on the public internet</div>
                <div style={{ fontSize: 12, color: s.text3, marginTop: 2 }}>Does not belong to any RFC 1918 private range.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
