import { useState, Fragment } from 'react'
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

export default function IpV4V6Demo() {
  const [ipvView, setIpvView] = useState<'v4' | 'v6' | 'binary'>('v4')

  return (
    <DemoBoundary name="IPv4 vs IPv6">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
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
    </div>
    </DemoBoundary>
  )
}
