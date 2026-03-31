import { useState, useEffect, Fragment } from 'react'

const s = {
  bg: '#12121a', bg2: '#1a1a25', bg3: '#22222e',
  text: '#e4e4e7', text2: '#a1a1aa', text3: '#71717a',
  border: '#27272a', border2: '#3f3f46',
  accent: '#3b82f6', green: '#22c55e', red: '#ef4444',
  yellow: '#eab308', purple: '#a78bfa', orange: '#fb923c',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

function ipToBinary(octet: number): string {
  return octet.toString(2).padStart(8, '0')
}

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
}

function longToIp(long: number): string {
  return [(long >>> 24) & 255, (long >>> 16) & 255, (long >>> 8) & 255, long & 255].join('.')
}

function getSubnetMask(prefix: number): string {
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0
  return longToIp(mask)
}

function isPrivateIp(ip: string): boolean {
  const long = ipToLong(ip)
  if ((long >>> 24) === 10) return true
  if ((long >>> 20) === 0xAC1) return true
  if ((long >>> 16) === 0xC0A8) return true
  return false
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

function isValidIp(v: string): boolean {
  const parts = v.split('.')
  if (parts.length !== 4) return false
  return parts.every(p => { const n = parseInt(p); return !isNaN(n) && n >= 0 && n <= 255 && p === String(n) })
}

const ip = '192.168.1.42'
const octets = ip.split('.').map(Number)

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const M: React.CSSProperties = { fontFamily: s.mono }

export default function IpAddressDemo() {
  const [selectedOctet, setSelectedOctet] = useState<number | null>(null)
  const [visibleBits, setVisibleBits] = useState(0)
  const [ipvView, setIpvView] = useState<'v4' | 'v6' | 'binary'>('v4')
  const [cidr, setCidr] = useState(24)
  const [ipInput, setIpInput] = useState('')
  const [dnsStep, setDnsStep] = useState(-1)
  const [sending, setSending] = useState(false)
  const [packetStep, setPacketStep] = useState(0)
  const [selectedConnection, setSelectedConnection] = useState(0)
  const [selectedPacketLayer, setSelectedPacketLayer] = useState(-1)

  useEffect(() => {
    if (selectedOctet === null) { setVisibleBits(0); return }
    setVisibleBits(0)
    const t = setInterval(() => {
      setVisibleBits(p => { if (p >= 8) { clearInterval(t); return 8 } return p + 1 })
    }, 80)
    return () => clearInterval(t)
  }, [selectedOctet])

  useEffect(() => {
    if (!sending) return
    setPacketStep(1)
    const t = setInterval(() => {
      setPacketStep(p => { if (p >= 4) { clearInterval(t); setSending(false); return 4 } return p + 1 })
    }, 900)
    return () => clearInterval(t)
  }, [sending])

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

  const inputValid = isValidIp(ipInput)
  const inputPrivate = inputValid ? getPrivateRange(ipInput) : null

  const dnsSteps = [
    { label: 'Browser', desc: 'User types dotsdecoded.com in the address bar', msg: 'GET https://dotsdecoded.com', color: s.accent },
    { label: 'Local Cache', desc: 'Browser checks local DNS cache', msg: 'CACHE MISS -- no entry for dotsdecoded.com', color: s.red },
    { label: 'Resolver', desc: 'Query sent to recursive resolver', msg: 'QUERY dotsdecoded.com IN A -> 1.1.1.1:53', color: s.accent },
    { label: 'Root NS', desc: 'Root nameserver queried for dotsdecoded.com', msg: 'REFERRAL: "Ask .com TLD server"', color: s.yellow },
    { label: 'TLD NS', desc: '.com TLD server queried', msg: 'REFERRAL: "Ask ns1.dotsdecoded.com"', color: s.orange },
    { label: 'Auth NS', desc: 'Authoritative nameserver responds', msg: 'RESPONSE: dotsdecoded.com A 104.21.76.8 TTL=300', color: s.green },
    { label: 'Cached', desc: 'Resolver caches and returns result to browser', msg: 'ANSWER: dotsdecoded.com -> 104.21.76.8', color: s.green },
    { label: 'Connected', desc: 'Browser establishes TCP/TLS connection', msg: 'CONNECTED to 104.21.76.8:443 (TLS 1.3)', color: s.green },
  ]

  const netNodes = [
    { label: 'Your Device', sub: '192.168.1.42', icon: 'D' },
    { label: 'Router', sub: '192.168.1.1', icon: 'R' },
    { label: 'ISP', sub: '203.0.113.1', icon: 'I' },
    { label: 'Internet', sub: '', icon: '*' },
  ]

  const connections = [
    { name: 'Web Browsing', srcPort: '52341', dstPort: '443', protocol: 'TCP', srcDesc: 'Ephemeral (random)', dstDesc: 'HTTPS server' },
    { name: 'Secure Shell', srcPort: '53892', dstPort: '22', protocol: 'TCP', srcDesc: 'Ephemeral (random)', dstDesc: 'SSH server' },
    { name: 'Sending Email', srcPort: '50123', dstPort: '587', protocol: 'TCP', srcDesc: 'Ephemeral (random)', dstDesc: 'SMTP submission' },
    { name: 'DNS Lookup', srcPort: '54102', dstPort: '53', protocol: 'UDP', srcDesc: 'Ephemeral (random)', dstDesc: 'DNS resolver' },
    { name: 'Database', srcPort: '55100', dstPort: '5432', protocol: 'TCP', srcDesc: 'Ephemeral (random)', dstDesc: 'PostgreSQL server' },
  ]

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

  return (
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 820, margin: '0 auto' }}>

      <div style={SEC}>
        <div style={H}>What is an IP Address?</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.7 }}>
          An IP address is a unique identifier assigned to each device on a network.
          IPv4 addresses are 32-bit numbers written as four octets (0-255) separated by dots.
          Each octet represents 8 bits of the full address.
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          {octets.map((octet, i) => (
            <Fragment key={i}>
              {i > 0 && <span style={{ ...M, fontSize: 28, color: s.text3, alignSelf: 'center', margin: '0 6px' }}>.</span>}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div
                  onClick={() => setSelectedOctet(selectedOctet === i ? null : i)}
                  style={{
                    background: selectedOctet === i ? s.accent : s.bg3,
                    border: `2px solid ${selectedOctet === i ? s.accent : s.border2}`,
                    borderRadius: 10, padding: '14px 22px', cursor: 'pointer',
                    ...M, fontSize: 28, fontWeight: 700,
                    color: selectedOctet === i ? '#fff' : s.text,
                    transition: 'all 0.25s ease', userSelect: 'none', minWidth: 82, textAlign: 'center',
                  }}
                >
                  {octet}
                </div>
                {selectedOctet === i && (
                  <div style={{
                    background: s.bg, border: `1px solid ${s.border2}`, borderRadius: 8,
                    padding: '10px 14px', ...M, fontSize: 15,
                    display: 'flex', gap: 4, alignItems: 'center',
                  }}>
                    {ipToBinary(octet).split('').map((bit, j) => (
                      <span key={j} style={{
                        color: j < visibleBits ? (bit === '1' ? s.green : s.text3) : 'transparent',
                        transition: 'color 0.12s ease', fontWeight: 700, fontSize: 16,
                      }}>
                        {bit}
                      </span>
                    ))}
                  </div>
                )}
                <span style={{ fontSize: 11, color: s.text3 }}>Octet {i + 1}</span>
              </div>
            </Fragment>
          ))}
        </div>
        <div style={{ textAlign: 'center', color: s.text3, fontSize: 13, marginBottom: 16 }}>
          Click any octet to see its 8-bit binary representation
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { l: '32 bits', v: 'total address length' },
            { l: '4 octets', v: 'x 8 bits each' },
            { l: '0 - 255', v: 'range per octet' },
            { l: '~4.3 billion', v: 'total unique addresses' },
          ].map(item => (
            <div key={item.l} style={{ background: s.bg3, borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ ...M, fontSize: 13, fontWeight: 600, color: s.accent }}>{item.l}</div>
              <div style={{ fontSize: 11, color: s.text3, marginTop: 2 }}>{item.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={SEC}>
        <div style={H}>IPv4 vs IPv6</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {(['v4', 'v6', 'binary'] as const).map(v => (
            <button key={v} onClick={() => setIpvView(v)} style={{
              background: ipvView === v ? s.accent : s.bg3,
              border: `1px solid ${ipvView === v ? s.accent : s.border}`,
              borderRadius: 8, padding: '8px 18px', color: ipvView === v ? '#fff' : s.text2,
              cursor: 'pointer', ...M, fontSize: 13, transition: 'all 0.2s',
            }}>
              {v === 'v4' ? 'IPv4' : v === 'v6' ? 'IPv6' : 'Binary'}
            </button>
          ))}
        </div>
        <div style={{ background: s.bg3, borderRadius: 10, padding: 20, marginBottom: 20 }}>
          {ipvView === 'v4' && (
            <div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                {['192', '168', '1', '1'].map((o, i) => (
                  <Fragment key={i}>
                    {i > 0 && <span style={{ color: s.text3, fontSize: 20, margin: '0 2px' }}>.</span>}
                    <div style={{ ...M, background: s.bg2, border: `1px solid ${s.border2}`, borderRadius: 6, padding: '10px 16px', fontSize: 18, fontWeight: 600, color: s.green }}>{o}</div>
                  </Fragment>
                ))}
              </div>
              <div style={{ textAlign: 'center', color: s.text2, fontSize: 13 }}>32-bit address in dotted decimal notation</div>
            </div>
          )}
          {ipvView === 'v6' && (
            <div>
              <div style={{ ...M, textAlign: 'center', fontSize: 15, color: s.purple, wordBreak: 'break-all', lineHeight: 2, marginBottom: 14 }}>
                2001:0db8:85a3:0000:0000:8a2e:0370:7334
              </div>
              <div style={{ textAlign: 'center', color: s.text2, fontSize: 13 }}>128-bit address in hexadecimal colon-separated notation</div>
            </div>
          )}
          {ipvView === 'binary' && (
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', flex: 1, minWidth: 200 }}>
                <div style={{ ...M, fontSize: 12, color: s.green, lineHeight: 2, letterSpacing: 1.5 }}>
                  11000000.10101000.00000001.00000001
                </div>
                <div style={{ color: s.text2, fontSize: 12, marginTop: 8 }}>IPv4: 32 bits</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1, minWidth: 250 }}>
                <div style={{ ...M, fontSize: 8, color: s.purple, lineHeight: 2, letterSpacing: 0.5, wordBreak: 'break-all' }}>
                  00100000 00000001 00001101 10111000 00001000 01011010 00110000 00000000 00000000 00000000 00000000 00000000 10001010 00101110 00000011 01110000 01110011 01000100
                </div>
                <div style={{ color: s.text2, fontSize: 12, marginTop: 8 }}>IPv6: 128 bits (4x larger)</div>
              </div>
            </div>
          )}
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: s.text2, marginBottom: 8 }}>Address Space Comparison</div>
          <div style={{ position: 'relative', height: 36, background: s.bg3, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: 3, minWidth: 3, background: s.green, borderRadius: '6px 0 0 6px' }} />
            <div style={{ position: 'absolute', left: 3, top: 0, height: '100%', right: 0, background: `${s.purple}22` }} />
            <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: s.green, fontWeight: 700, ...M }}>IPv4</div>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: s.purple, fontWeight: 700, ...M }}>IPv6 (340 undecillion)</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: s.text3, marginTop: 6 }}>
            All IPv4 addresses combined are a tiny fraction of the IPv6 address space
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'IPv4', bits: '32 bits', addr: '4,294,967,296', c: s.green },
            { label: 'IPv6', bits: '128 bits', addr: '340,282,366,920,938,463,374,607,431,768,211,456', c: s.purple },
          ].map(item => (
            <div key={item.label} style={{ background: s.bg3, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 200, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: item.c, marginBottom: 6 }}>{item.label}</div>
              <div style={{ ...M, fontSize: 13, color: s.text }}>{item.bits}</div>
              <div style={{ fontSize: 11, color: s.text3, marginTop: 4 }}>{item.addr} addresses</div>
            </div>
          ))}
        </div>
      </div>

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

      <div style={SEC}>
        <div style={H}>How DNS Resolution Works</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          DNS translates human-readable domain names into IP addresses. Click "Resolve" to step through the lookup process for dotsdecoded.com.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { if (dnsStep >= dnsSteps.length - 1) setDnsStep(-1); else setDnsStep(p => p + 1) }}
            style={{
              background: dnsStep >= dnsSteps.length - 1 ? s.border2 : s.accent, border: 'none',
              borderRadius: 8, padding: '8px 20px', color: dnsStep >= dnsSteps.length - 1 ? s.text2 : '#fff',
              cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
            }}
          >
            {dnsStep >= dnsSteps.length - 1 ? 'Reset' : 'Resolve'}
          </button>
          <button
            onClick={() => {
              if (dnsStep >= dnsSteps.length - 1) return
              setDnsStep(-1)
              let step = -1
              const t = setInterval(() => {
                step++
                setDnsStep(step)
                if (step >= dnsSteps.length - 1) clearInterval(t)
              }, 1200)
            }}
            disabled={dnsStep >= 0}
            style={{
              background: 'transparent', border: `1px solid ${s.border}`,
              borderRadius: 8, padding: '8px 16px', color: dnsStep >= 0 ? s.text3 : s.text2,
              cursor: dnsStep >= 0 ? 'not-allowed' : 'pointer', fontSize: 13, transition: 'all 0.2s',
            }}
          >
            Auto-play
          </button>
          {dnsStep >= 0 && (
            <span style={{ ...M, fontSize: 12, color: s.text3 }}>Step {Math.min(dnsStep + 1, dnsSteps.length)} / {dnsSteps.length}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {dnsSteps.map((step, i) => {
            const active = i === dnsStep
            const done = i < dnsStep
            const pending = i > dnsStep
            return (
              <div key={i} style={{ display: 'flex', gap: 14, opacity: pending ? 0.3 : 1, transition: 'opacity 0.3s' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: done ? s.green : active ? step.color : s.bg3,
                    border: `2px solid ${done ? s.green : active ? step.color : s.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: (done || active) ? '#fff' : s.text3,
                    transition: 'all 0.3s', flexShrink: 0,
                  }}>
                    {done ? String.fromCharCode(10003) : String(i + 1)}
                  </div>
                  {i < dnsSteps.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 16, background: done ? s.green : s.border, transition: 'background 0.3s' }} />
                  )}
                </div>
                <div style={{ paddingBottom: 14, flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: done ? s.green : active ? step.color : s.text2, transition: 'color 0.3s', marginBottom: 2 }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: 12, color: s.text2, marginBottom: active ? 6 : 0, lineHeight: 1.5 }}>{step.desc}</div>
                  {active && (
                    <div style={{
                      background: s.bg, border: `1px solid ${s.border2}`, borderRadius: 6,
                      padding: '8px 12px', ...M, fontSize: 12, color: step.color,
                      transition: 'all 0.25s', wordBreak: 'break-all',
                    }}>
                      {step.msg}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={SEC}>
        <div style={H}>Your Network (Simulated)</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          When your device sends data to the internet, it passes through your router which performs NAT,
          replacing your private IP with a public one so the response can find its way back.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => { if (sending) return; setPacketStep(0); setSending(true) }} disabled={sending} style={{
            background: sending ? s.border2 : s.accent, border: 'none', borderRadius: 8,
            padding: '8px 20px', color: sending ? s.text3 : '#fff', cursor: sending ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
          }}>
            {sending ? 'Transmitting...' : packetStep === 4 ? 'Send Again' : 'Send Packet'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 0 }}>
          {netNodes.map((node, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                  <div style={{
                    width: 48, height: 3, borderRadius: 2,
                    background: packetStep > i ? s.green : s.border2,
                    transition: 'background 0.3s', position: 'relative',
                  }}>
                    {packetStep === i + 1 && (
                      <div style={{
                        position: 'absolute', top: -5, right: -6,
                        width: 12, height: 12, borderRadius: '50%',
                        background: s.green, boxShadow: `0 0 10px ${s.green}`,
                        transition: 'all 0.3s',
                      }} />
                    )}
                  </div>
                </div>
              )}
              <div style={{
                background: packetStep >= i + 1 ? `${s.green}12` : s.bg3,
                border: `2px solid ${packetStep >= i + 1 ? s.green : s.border2}`,
                borderRadius: 12, padding: '16px 20px', textAlign: 'center',
                minWidth: 110, transition: 'all 0.3s',
                boxShadow: packetStep === i + 1 ? `0 0 24px ${s.green}22` : 'none',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', margin: '0 auto 8px',
                  background: packetStep >= i + 1 ? s.green : s.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: '#fff',
                  transition: 'background 0.3s',
                }}>
                  {node.icon}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: packetStep >= i + 1 ? s.green : s.text, transition: 'color 0.3s', marginBottom: 2 }}>
                  {node.label}
                </div>
                {node.sub && (
                  <div style={{ ...M, fontSize: 11, color: packetStep >= i + 1 ? s.green : s.text3, transition: 'color 0.3s' }}>
                    {node.sub}
                  </div>
                )}
              </div>
            </Fragment>
          ))}
        </div>
        {packetStep >= 2 && packetStep <= 3 && (
          <div style={{
            background: s.bg3, borderRadius: 8, padding: '12px 16px', textAlign: 'center',
            border: `1px solid ${s.orange}44`, transition: 'all 0.3s',
          }}>
            <div style={{ fontSize: 12, color: s.orange, fontWeight: 600, marginBottom: 4 }}>NAT Translation at Router</div>
            <div style={{ ...M, fontSize: 13 }}>
              <span style={{ color: s.red, textDecoration: 'line-through', opacity: 0.7 }}>192.168.1.42</span>
              <span style={{ color: s.text3, margin: '0 8px' }}>{'->'}</span>
              <span style={{ color: s.green, fontWeight: 600 }}>203.0.113.5</span>
            </div>
            <div style={{ fontSize: 11, color: s.text3, marginTop: 4 }}>Source IP rewritten so the remote server can reply</div>
          </div>
        )}
        {packetStep === 4 && !sending && (
          <div style={{
            background: `${s.green}0a`, borderRadius: 8, padding: '12px 16px', textAlign: 'center',
            border: `1px solid ${s.green}33`, transition: 'all 0.3s',
          }}>
            <div style={{ fontSize: 13, color: s.green, fontWeight: 600 }}>Packet delivered successfully</div>
            <div style={{ fontSize: 12, color: s.text3, marginTop: 2 }}>{'Response routes back: Internet → ISP → Router (NAT reverse) → Your Device'}</div>
          </div>
        )}
      </div>

      <div style={SEC}>
        <div style={H}>Port Explorer</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Ports identify which application should receive data on a device. An IP address is the building,
          a port is the apartment number. Select a connection type below to see which ports are used.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['Web Browsing', 'Secure Shell', 'Sending Email', 'DNS Lookup', 'Database'].map((name, idx) => (
            <button key={name} onClick={() => setSelectedConnection(idx)} style={{
              background: selectedConnection === idx ? s.accent : s.bg3,
              border: `1px solid ${selectedConnection === idx ? s.accent : s.border}`,
              borderRadius: 8, padding: '8px 16px', color: selectedConnection === idx ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
            }}>
              {name}
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
            When you visit a website, your browser sends hundreds of these packets. The TCP header ensures reliable delivery (lost packets are retransmitted). The IP header ensures routing. The Ethernet frame handles the last hop on your local network. Each layer wraps the next — this is called <strong style={{ color: s.accent }}>encapsulation</strong>.
          </div>
        </div>
      </div>
    </div>
  )
}
