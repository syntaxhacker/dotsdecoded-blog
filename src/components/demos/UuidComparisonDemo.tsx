import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

function uuidV4(): string {
  const hex = '0123456789abcdef'
  let s = ''
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) { s += '-'; continue }
    if (i === 14) { s += '4'; continue }
    if (i === 19) { s += hex[(Math.random() * 4 | 0) + 8]; continue }
    s += hex[Math.random() * 16 | 0]
  }
  return s
}

function uuidV7(): string {
  const now = Date.now()
  const tsHex = now.toString(16).padStart(12, '0')
  const rand = () => Math.random() * 16 | 0
  const hex = '0123456789abcdef'
  let s = ''
  for (let i = 0; i < 36; i++) {
    if (i === 8) { s += '-'; continue }
    if (i === 13) { s += '-'; continue }
    if (i === 14) { s += '7'; continue }
    if (i === 18) { s += '-'; continue }
    if (i === 19) { s += hex[rand() & 0x0f | 0x80 >> 4]; continue }
    if (i === 23) { s += '-'; continue }
    if (i < 8) { s += tsHex[i]; continue }
    if (i < 12) { s += tsHex[i - 1]; continue }
    s += hex[rand()]
  }
  return s
}

function snowflakeId(): string {
  const now = Date.now() - 1288834974657
  const worker = Math.floor(Math.random() * 1024)
  const seq = Math.floor(Math.random() * 4096)
  const id = (BigInt(now) << 22n) | (BigInt(worker) << 12n) | BigInt(seq)
  return id.toString()
}

const colHeader: React.CSSProperties = {
  padding: '10px 12px', color: s.text, fontSize: 12, fontWeight: 600,
  borderBottom: `1px solid ${s.border}`, textTransform: 'uppercase', letterSpacing: 0.5,
}
const colCell: React.CSSProperties = {
  padding: '10px 12px', color: s.text2, fontSize: 12, borderBottom: `1px solid ${s.border2}`,
}

const ROW_H = { display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px' }
const LABEL = { color: s.text3, fontSize: 12, minWidth: 90, flexShrink: 0 }

export default function UuidComparisonDemo() {
  const [key, setKey] = useState(0)
  const examples = useMemo(() => ({
    v4: uuidV4(),
    v7: uuidV7(),
    sf: snowflakeId(),
    ts: Date.now(),
  }), [key])

  const refresh = () => setKey(prev => prev + 1)

  return (
    <DemoBoundary name="UUID vs Snowflake Comparison">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
        UUID vs Snowflake Comparison
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Three approaches to generating unique IDs at scale. Click refresh to see new examples.
      </p>

      <button onClick={refresh} style={{
        background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
        color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 20,
      }}>Refresh All IDs</button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {/* UUID v4 */}
        <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ ...ROW_H, background: `${s.purple}15`, borderBottom: `1px solid ${s.border}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.purple, flexShrink: 0 }} />
            <span style={{ color: s.text, fontWeight: 700, fontSize: 15, letterSpacing: -0.2 }}>UUID v4</span>
            <span style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>RFC 4122</span>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontFamily: s.mono, fontSize: 12, color: s.text, marginBottom: 8, wordBreak: 'break-all' }}>{examples.v4}</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ color: s.text3, fontSize: 11 }}>Size: 128 bits (16 bytes)</span>
              <span style={{ color: s.text3, fontSize: 11 }}>Random: 122 bits</span>
              <span style={{ color: s.red, fontSize: 11 }}>Not time-sortable</span>
            </div>
          </div>
        </div>

        {/* UUID v7 */}
        <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ ...ROW_H, background: `${s.yellow}15`, borderBottom: `1px solid ${s.border}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.yellow, flexShrink: 0 }} />
            <span style={{ color: s.text, fontWeight: 700, fontSize: 15, letterSpacing: -0.2 }}>UUID v7</span>
            <span style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>RFC 9562</span>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontFamily: s.mono, fontSize: 12, color: s.text, marginBottom: 8, wordBreak: 'break-all' }}>{examples.v7}</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ color: s.text3, fontSize: 11 }}>Size: 128 bits (16 bytes)</span>
              <span style={{ color: s.text3, fontSize: 11 }}>Timestamp: 48 bits</span>
              <span style={{ color: s.green, fontSize: 11 }}>Time-sortable prefix</span>
            </div>
          </div>
        </div>

        {/* Snowflake */}
        <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.accent}`, overflow: 'hidden' }}>
          <div style={{ ...ROW_H, background: `${s.accent}15`, borderBottom: `1px solid ${s.border}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.accent, flexShrink: 0 }} />
            <span style={{ color: s.text, fontWeight: 700, fontSize: 15, letterSpacing: -0.2 }}>Snowflake</span>
            <span style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>Twitter algorithm</span>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontFamily: s.mono, fontSize: 12, color: s.text, marginBottom: 8, wordBreak: 'break-all' }}>{examples.sf}</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ color: s.text3, fontSize: 11 }}>Size: 64 bits (8 bytes)</span>
              <span style={{ color: s.text3, fontSize: 11 }}>Timestamp: 41 bits</span>
              <span style={{ color: s.green, fontSize: 11 }}>Time-sortable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
        <div style={{ ...colHeader, borderBottom: `2px solid ${s.accent}`, fontSize: 14 }}>
          Side-by-Side Comparison
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={colHeader}>Property</th>
              <th style={colHeader}>UUID v4</th>
              <th style={colHeader}>UUID v7</th>
              <th style={colHeader}>Snowflake</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Bit Size', '128 bits', '128 bits', '64 bits'],
              ['Byte Size', '16 bytes', '16 bytes', '8 bytes'],
              ['Time-Sortable', 'No', 'Yes (prefix)', 'Yes (inherent)'],
              ['Uniqueness', 'Probabilistic', 'Probabilistic', 'Deterministic'],
              ['Collision Risk', '1 in 2^122', '1 in 2^74', 'Zero (with config)'],
              ['Throughput', 'Unlimited*', 'Unlimited*', '~4M/sec cluster'],
              ['Coordinated', 'No', 'No', 'Worker ID assignment'],
              ['DB Index Impact', 'Poor (random)', 'Good (monotonic)', 'Excellent'],
            ].map((row, i) => (
              <tr key={i}>
                <td style={{ ...colCell, color: s.text3, fontWeight: 600 }}>{row[0]}</td>
                <td style={colCell}>{row[1]}</td>
                <td style={colCell}>{row[2]}</td>
                <td style={{ ...colCell, borderRight: 'none' }}>{row[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '10px 12px', color: s.text3, fontSize: 10, lineHeight: 1.5, borderTop: `1px solid ${s.border}` }}>
          UUID v4 throughput is technically unlimited since each ID is generated locally with no coordination.
          Collision probability is negligible at scale but non-zero. Snowflake requires worker ID coordination at startup but guarantees zero collisions.
        </div>
      </div>

      {/* Visual comparison */}
      <div style={{ marginTop: 20, background: s.bg2, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 12 }}>Storage Impact</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'UUID v4/v7 (128 bit)', pct: 100, color: s.purple },
            { label: 'Snowflake (64 bit)', pct: 50, color: s.accent },
          ].map(item => (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: s.text, fontSize: 12 }}>{item.label}</span>
                <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>{item.pct}%</span>
              </div>
              <div style={{ height: 16, borderRadius: 8, background: s.bg3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 8, background: item.color,
                  width: `${item.pct}%`, transition: 'width 0.3s',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
