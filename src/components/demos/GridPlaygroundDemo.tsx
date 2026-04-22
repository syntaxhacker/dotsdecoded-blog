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

const presets = [
  { name: '3 Equal', cols: 'repeat(3, 1fr)', rows: 'auto' },
  { name: 'Sidebar', cols: '200px 1fr', rows: 'auto' },
  { name: 'Holy Grail', cols: '200px 1fr 200px', rows: '60px 1fr 40px' },
  { name: 'Responsive', cols: 'repeat(auto-fit, minmax(120px, 1fr))', rows: 'auto' },
  { name: 'Masonry-ish', cols: 'repeat(4, 1fr)', rows: '100px 150px 80px' },
]

const cellColors = [
  s.accent, s.green, s.yellow, s.purple, s.orange, s.red, '#8be9fd', '#ffb86c',
  s.accent, s.green, s.yellow, s.purple, s.orange, s.red, '#8be9fd', '#ffb86c',
]

export default function GridPlaygroundDemo() {
  const [cols, setCols] = useState('repeat(3, 1fr)')
  const [rows, setRows] = useState('auto')
  const [gap, setGap] = useState(8)

  const cellCount = 8

  return (
    <DemoBoundary name="Grid Playground">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {presets.map(p => (
            <button
              key={p.name}
              onClick={() => { setCols(p.cols); setRows(p.rows) }}
              style={{
                background: cols === p.cols && rows === p.rows ? s.accent : s.bg3,
                color: cols === p.cols && rows === p.rows ? s.bg : s.text2,
                border: `1px solid ${cols === p.cols && rows === p.rows ? s.accent : s.border}`,
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11,
                fontFamily: s.mono,
                cursor: 'pointer',
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          <Ctrl label="grid-template-columns">
            <input
              type="text"
              value={cols}
              onChange={e => setCols(e.target.value)}
              style={inputStyle}
            />
          </Ctrl>
          <Ctrl label="grid-template-rows">
            <input
              type="text"
              value={rows}
              onChange={e => setRows(e.target.value)}
              style={inputStyle}
            />
          </Ctrl>
          <Ctrl label={`gap: ${gap}px`}>
            <input type="range" min={0} max={24} value={gap} onChange={e => setGap(+e.target.value)} style={{ width: 100, accentColor: s.accent }} />
          </Ctrl>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: cols,
          gridTemplateRows: rows,
          gap,
          background: s.bg2,
          borderRadius: 10,
          border: `1px solid ${s.border}`,
          padding: 12,
          minHeight: 180,
        }}>
          {Array.from({ length: cellCount }, (_, i) => (
            <div key={i} style={{
              background: cellColors[i],
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: s.bg,
              fontWeight: 700,
              fontSize: 14,
              fontFamily: s.mono,
              minHeight: 50,
            }}>
              {i + 1}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 10, fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
          {`grid-template-columns: ${cols};`} {`grid-template-rows: ${rows};`} {`gap: ${gap}px;`}
        </div>
      </div>
    </DemoBoundary>
  )
}

function Ctrl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text2, whiteSpace: 'nowrap' }}>{label}</span>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: s.bg3,
  color: s.text,
  border: `1px solid ${s.border}`,
  borderRadius: 4,
  padding: '3px 8px',
  fontSize: 11,
  fontFamily: s.mono,
  width: 200,
}
