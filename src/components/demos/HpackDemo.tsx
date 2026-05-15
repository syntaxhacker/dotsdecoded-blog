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

interface Header {
  name: string
  value: string
  rawBytes: number
  encodedBytes: number
  tableIdx: number | null
  dynamic: boolean
}

const requests: Header[][] = [
  [
    { name: ':method', value: 'GET', rawBytes: 14, encodedBytes: 2, tableIdx: 2, dynamic: false },
    { name: ':path', value: '/index.html', rawBytes: 22, encodedBytes: 6, tableIdx: null, dynamic: true },
    { name: ':scheme', value: 'https', rawBytes: 16, encodedBytes: 2, tableIdx: 6, dynamic: false },
    { name: ':authority', value: 'example.com', rawBytes: 26, encodedBytes: 14, tableIdx: null, dynamic: true },
    { name: 'accept', value: 'text/html', rawBytes: 22, encodedBytes: 12, tableIdx: null, dynamic: true },
    { name: 'user-agent', value: 'Mozilla/5.0', rawBytes: 30, encodedBytes: 20, tableIdx: null, dynamic: true },
    { name: 'cookie', value: 'session=abc123', rawBytes: 28, encodedBytes: 18, tableIdx: null, dynamic: true },
  ],
  [
    { name: ':method', value: 'GET', rawBytes: 14, encodedBytes: 1, tableIdx: 2, dynamic: false },
    { name: ':path', value: '/style.css', rawBytes: 22, encodedBytes: 6, tableIdx: null, dynamic: true },
    { name: ':scheme', value: 'https', rawBytes: 16, encodedBytes: 1, tableIdx: 6, dynamic: false },
    { name: ':authority', value: 'example.com', rawBytes: 26, encodedBytes: 1, tableIdx: 62, dynamic: true },
    { name: 'accept', value: 'text/html', rawBytes: 22, encodedBytes: 1, tableIdx: 63, dynamic: true },
    { name: 'user-agent', value: 'Mozilla/5.0', rawBytes: 30, encodedBytes: 1, tableIdx: 64, dynamic: true },
    { name: 'cookie', value: 'session=abc123', rawBytes: 28, encodedBytes: 1, tableIdx: 65, dynamic: true },
  ],
  [
    { name: ':method', value: 'GET', rawBytes: 14, encodedBytes: 1, tableIdx: 2, dynamic: false },
    { name: ':path', value: '/app.js', rawBytes: 20, encodedBytes: 6, tableIdx: null, dynamic: true },
    { name: ':scheme', value: 'https', rawBytes: 16, encodedBytes: 1, tableIdx: 6, dynamic: false },
    { name: ':authority', value: 'example.com', rawBytes: 26, encodedBytes: 1, tableIdx: 62, dynamic: true },
    { name: 'accept', value: 'text/html', rawBytes: 22, encodedBytes: 1, tableIdx: 63, dynamic: true },
    { name: 'user-agent', value: 'Mozilla/5.0', rawBytes: 30, encodedBytes: 1, tableIdx: 64, dynamic: true },
    { name: 'cookie', value: 'session=abc123', rawBytes: 28, encodedBytes: 1, tableIdx: 65, dynamic: true },
  ],
]

const staticTable: { idx: number; name: string; value: string }[] = [
  { idx: 2, name: ':method', value: 'GET' },
  { idx: 3, name: ':method', value: 'POST' },
  { idx: 6, name: ':scheme', value: 'https' },
  { idx: 7, name: ':scheme', value: 'http' },
  { idx: 16, name: 'accept-encoding', value: '' },
  { idx: 28, name: 'cookie', value: '' },
]

export default function HpackDemo() {
  const [compressed, setCompressed] = useState(false)
  const [reqIdx, setReqIdx] = useState(0)
  const [showTable, setShowTable] = useState(true)

  const headers = requests[reqIdx]
  const rawTotal = headers.reduce((sum, h) => sum + h.rawBytes, 0)
  const encodedTotal = headers.reduce((sum, h) => sum + h.encodedBytes, 0)

  return (
    <DemoBoundary name="HPACK Header Compression">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>HPACK Header Compression</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          HPACK compresses HTTP headers using a static table (predefined common headers) and dynamic table (learned from previous requests). Repeated headers are sent as tiny index references instead of full text.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {[0, 1, 2].map(idx => (
            <button key={idx} onClick={() => setReqIdx(idx)} style={{
              background: reqIdx === idx ? s.accent : s.bg3,
              border: `1px solid ${reqIdx === idx ? s.accent : s.border}`,
              borderRadius: 8, padding: '6px 14px',
              color: reqIdx === idx ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
              transition: 'all 0.2s',
            }}>Request {idx + 1}</button>
          ))}
          <div style={{ width: 1, height: 20, background: s.border, margin: '0 8px' }} />
          <button onClick={() => setCompressed(!compressed)} style={{
            background: compressed ? s.green : s.bg3,
            border: `1px solid ${compressed ? s.green : s.border}`,
            borderRadius: 8, padding: '6px 14px',
            color: compressed ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
            transition: 'all 0.2s',
          }}>{compressed ? 'Compressed' : 'Raw'}</button>
          <button onClick={() => setShowTable(!showTable)} style={{
            background: showTable ? s.purple : s.bg3,
            border: `1px solid ${showTable ? s.purple : s.border}`,
            borderRadius: 8, padding: '6px 14px',
            color: showTable ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
            transition: 'all 0.2s',
          }}>Tables</button>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1, background: s.bg3, borderRadius: 10, padding: 16 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Wire Format</div>
            {headers.map((header, idx) => (
              <div key={idx} style={{
                padding: '6px 8px', marginBottom: 4,
                background: header.tableIdx !== null && compressed ? `${s.green}15` : 'transparent',
                borderRadius: 4, border: header.tableIdx !== null && compressed ? `1px solid ${s.green}30` : 'none',
                fontFamily: s.mono, fontSize: 11, lineHeight: 1.5,
              }}>
                {compressed && header.tableIdx !== null ? (
                  <span>
                    <span style={{ color: s.green }}>[idx {header.tableIdx}]</span>
                    <span style={{ color: s.text3 }}> {header.name}</span>
                    {header.value && <span style={{ color: s.text2 }}>: {header.value}</span>}
                  </span>
                ) : (
                  <span style={{ color: s.accent }}>{header.name}</span>
                )}
                {(!compressed || header.tableIdx === null) && !header.name.startsWith(':') && (
                  <span style={{ color: s.text2 }}>: {header.value}</span>
                )}
                {(!compressed || header.tableIdx === null) && header.name.startsWith(':') && (
                  <span style={{ color: s.text2 }}>: {header.value}</span>
                )}
                {compressed && header.tableIdx === null && (
                  <span style={{ color: s.orange }}> (literal + indexed)</span>
                )}
              </div>
            ))}
          </div>

          <div style={{ width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ background: s.bg3, borderRadius: 10, padding: 14, flex: 1 }}>
              <div style={{ color: s.text3, fontSize: 10, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Bytes</div>
              <div style={{ color: compressed ? s.text3 : s.red, fontFamily: s.mono, fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                {compressed ? encodedTotal : rawTotal}
              </div>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 8 }}>
                {compressed ? 'Compressed' : 'Raw'}
              </div>
              {compressed && (
                <div style={{ background: `${s.green}20`, borderRadius: 6, padding: 8 }}>
                  <div style={{ color: s.green, fontFamily: s.mono, fontSize: 16, fontWeight: 700 }}>
                    -{Math.round((1 - encodedTotal / rawTotal) * 100)}%
                  </div>
                  <div style={{ color: s.text3, fontSize: 10 }}>saved</div>
                </div>
              )}
            </div>
            <div style={{ background: s.bg3, borderRadius: 10, padding: 14 }}>
              <div style={{ color: s.text3, fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Request</div>
              <div style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>#{reqIdx + 1}</div>
              <div style={{ color: s.text3, fontSize: 10, marginTop: 4 }}>Index refs: {headers.filter(h => h.tableIdx !== null && compressed).length}/{headers.length}</div>
            </div>
          </div>
        </div>

        {showTable && (
          <div style={{ background: s.bg3, borderRadius: 10, padding: 16 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Header Tables</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: s.accent, fontSize: 12, fontWeight: 600, marginBottom: 8, fontFamily: s.mono }}>Static Table</div>
                {staticTable.map((entry) => (
                  <div key={entry.idx} style={{
                    display: 'flex', gap: 8, padding: '4px 0',
                    borderBottom: `1px solid ${s.border}`, fontSize: 11,
                    fontFamily: s.mono,
                  }}>
                    <span style={{ color: s.text3, width: 24 }}>{entry.idx}</span>
                    <span style={{ color: s.accent }}>{entry.name}</span>
                    {entry.value && <span style={{ color: s.text2 }}>{entry.value}</span>}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: s.green, fontSize: 12, fontWeight: 600, marginBottom: 8, fontFamily: s.mono }}>Dynamic Table</div>
                {reqIdx > 0 ? (
                  requests.slice(0, reqIdx).flat().filter((h, i, arr) => arr.findIndex(x => x.name === h.name) === i).map((entry, idx) => (
                    <div key={idx} style={{
                      display: 'flex', gap: 8, padding: '4px 0',
                      borderBottom: `1px solid ${s.border}`, fontSize: 11,
                      fontFamily: s.mono,
                    }}>
                      <span style={{ color: s.text3, width: 24 }}>{62 + idx}</span>
                      <span style={{ color: s.green }}>{entry.name}</span>
                      <span style={{ color: s.text2 }}>{entry.value}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: s.text3, fontSize: 11, fontStyle: 'italic', padding: 8 }}>
                    Empty -- no prior requests
                  </div>
                )}
                <div style={{ marginTop: 12, padding: 8, background: `${s.green}10`, borderRadius: 6, fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
                  The dynamic table learns headers from request 1, so requests 2 and 3 can refer to them by index. This is how repeated :authority, cookie, and user-agent headers are compressed to just 1 byte each.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
