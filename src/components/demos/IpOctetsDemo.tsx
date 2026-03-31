import { useState, useEffect, Fragment } from 'react'
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

function ipToBinary(octet: number): string {
  return octet.toString(2).padStart(8, '0')
}

const ip = '192.168.1.42'
const octets = ip.split('.').map(Number)

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const M: React.CSSProperties = { fontFamily: s.mono }

export default function IpOctetsDemo() {
  const [selectedOctet, setSelectedOctet] = useState<number | null>(null)
  const [visibleBits, setVisibleBits] = useState(0)

  useEffect(() => {
    if (selectedOctet === null) { setVisibleBits(0); return }
    setVisibleBits(0)
    const t = setInterval(() => {
      setVisibleBits(p => { if (p >= 8) { clearInterval(t); return 8 } return p + 1 })
    }, 80)
    return () => clearInterval(t)
  }, [selectedOctet])

  return (
    <DemoBoundary name="IP Octets">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
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
    </div>
    </DemoBoundary>
  )
}
