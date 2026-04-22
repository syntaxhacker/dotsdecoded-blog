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

const itemColors = [s.accent, s.green, s.yellow, s.purple, s.orange]
const itemLabels = ['A', 'B', 'C', 'D', 'E']

const directions = ['row', 'row-reverse', 'column', 'column-reverse'] as const
const justifies = ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'] as const
const aligns = ['start', 'center', 'end', 'stretch', 'baseline'] as const
const wraps = ['nowrap', 'wrap'] as const

type Dir = typeof directions[number]
type Jus = typeof justifies[number]
type Ali = typeof aligns[number]
type Wrp = typeof wraps[number]

export default function FlexboxPlaygroundDemo() {
  const [dir, setDir] = useState<Dir>('row')
  const [jus, setJus] = useState<Jus>('start')
  const [ali, setAli] = useState<Ali>('stretch')
  const [wrp, setWrp] = useState<Wrp>('nowrap')
  const [gap, setGap] = useState(8)

  const isRow = dir === 'row' || dir === 'row-reverse'

  return (
    <DemoBoundary name="Flexbox Playground">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <Ctrl label="flex-direction">
              <select value={dir} onChange={e => setDir(e.target.value as Dir)} style={selStyle}>
                {directions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Ctrl>
            <Ctrl label="justify-content">
              <select value={jus} onChange={e => setJus(e.target.value as Jus)} style={selStyle}>
                {justifies.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </Ctrl>
            <Ctrl label="align-items">
              <select value={ali} onChange={e => setAli(e.target.value as Ali)} style={selStyle}>
                {aligns.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Ctrl>
            <Ctrl label="flex-wrap">
              <select value={wrp} onChange={e => setWrp(e.target.value as Wrp)} style={selStyle}>
                {wraps.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </Ctrl>
          </div>
          <Ctrl label={`gap: ${gap}px`}>
            <input type="range" min={0} max={32} value={gap} onChange={e => setGap(+e.target.value)} style={{ width: 160, accentColor: s.accent }} />
          </Ctrl>
        </div>

        <div style={{ position: 'relative', background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, padding: 24, minHeight: 200 }}>
          <div style={{
            display: 'flex',
            flexDirection: dir,
            justifyContent: jus,
            alignItems: ali,
            flexWrap: wrp,
            gap,
            minHeight: 150,
          }}>
            {itemLabels.map((label, i) => (
              <div key={label} style={{
                width: ali === 'stretch' ? undefined : 60,
                height: isRow && ali === 'stretch' ? undefined : (ali === 'baseline' ? [40, 60, 30, 50, 35][i] : 60),
                minHeight: 30,
                background: itemColors[i],
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: s.bg,
                fontWeight: 700,
                fontSize: 18,
                fontFamily: s.mono,
                flexShrink: 0,
              }}>
                {label}
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', top: 6, left: 10, color: s.text3, fontSize: 10, fontFamily: s.mono }}>
            {isRow ? 'MAIN AXIS →' : 'MAIN AXIS ↓'}
          </div>
          <div style={{ position: 'absolute', top: 6, right: 10, color: s.text3, fontSize: 10, fontFamily: s.mono }}>
            {!isRow ? 'CROSS AXIS →' : 'CROSS AXIS ↓'}
          </div>
        </div>

        <div style={{ marginTop: 12, fontFamily: s.mono, fontSize: 11, color: s.text3, lineHeight: 1.6 }}>
          <span style={{ color: s.text2 }}>display: flex;</span>{' '}
          <span style={{ color: s.text2 }}>{`flex-direction: ${dir};`}</span>{' '}
          <span style={{ color: s.text2 }}>{`justify-content: ${jus};`}</span>{' '}
          <span style={{ color: s.text2 }}>{`align-items: ${ali};`}</span>{' '}
          <span style={{ color: s.text2 }}>{`flex-wrap: ${wrp};`}</span>{' '}
          <span style={{ color: s.text2 }}>{`gap: ${gap}px;`}</span>
        </div>
      </div>
    </DemoBoundary>
  )
}

function Ctrl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text2, whiteSpace: 'nowrap' }}>{label}</span>
      {children}
    </div>
  )
}

const selStyle: React.CSSProperties = {
  background: s.bg3,
  color: s.text,
  border: `1px solid ${s.border}`,
  borderRadius: 4,
  padding: '3px 8px',
  fontSize: 11,
  fontFamily: s.mono,
  cursor: 'pointer',
}
