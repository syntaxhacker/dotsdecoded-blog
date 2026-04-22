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

type DisplayMode = 'block' | 'inline' | 'inline-block' | 'none'

const elements = [
  { id: 'a', label: 'Box A', color: s.accent },
  { id: 'b', label: 'Box B', color: s.green },
  { id: 'c', label: 'Box C', color: s.yellow },
  { id: 'd', label: 'Box D', color: s.purple },
]

function DisplayTypeDemo() {
  const [displays, setDisplays] = useState<Record<string, DisplayMode>>({
    a: 'block', b: 'block', c: 'inline', d: 'inline-block',
  })

  const toggle = (id: string) => {
    const order: DisplayMode[] = ['block', 'inline', 'inline-block', 'none']
    const cur = order.indexOf(displays[id])
    setDisplays({ ...displays, [id]: order[(cur + 1) % order.length] })
  }

  const getStyle = (el: typeof elements[0]): React.CSSProperties => {
    const d = displays[el.id]
    if (d === 'none') return { display: 'none' }
    const base: React.CSSProperties = {
      background: el.color + '18',
      border: `2px solid ${el.color}`,
      borderRadius: 5,
      padding: '8px 14px',
      fontFamily: s.mono,
      fontSize: 12,
      color: el.color,
      transition: 'all 0.3s ease',
    }
    if (d === 'block') {
      return { ...base, display: 'block', width: 200, marginBottom: 6 }
    }
    if (d === 'inline') {
      return { ...base, display: 'inline', width: 200 }
    }
    return { ...base, display: 'inline-block', width: 100, verticalAlign: 'top' }
  }

  return (
    <DemoBoundary name="Display Types">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {elements.map((el) => (
            <button
              key={el.id}
              onClick={() => toggle(el.id)}
              style={{
                padding: '6px 12px',
                background: el.color + '15',
                border: `1px solid ${el.color}`,
                borderRadius: 5,
                fontFamily: s.mono,
                fontSize: 11,
                color: el.color,
                cursor: 'pointer',
              }}
            >
              {el.label}: <span style={{ fontWeight: 600 }}>{displays[el.id]}</span>
            </button>
          ))}
        </div>

        <div style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 6,
          padding: 16,
          minHeight: 120,
          lineHeight: 2.2,
        }}>
          <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 8 }}>
            .container (click buttons to toggle display types)
          </div>
          <div>
            Some inline text before{' '}
            {elements.map((el) => (
              <span key={el.id} style={getStyle(el)}>
                {el.label}
              </span>
            ))}
            {' '}and inline text after.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16 }}>
          {[
            { mode: 'block' as DisplayMode, color: s.accent, newLine: 'Yes', respectsWH: 'Yes', marginPush: 'Yes' },
            { mode: 'inline' as DisplayMode, color: s.green, newLine: 'No', respectsWH: 'No', marginPush: 'No' },
            { mode: 'inline-block' as DisplayMode, color: s.yellow, newLine: 'No', respectsWH: 'Yes', marginPush: 'Yes' },
            { mode: 'none' as DisplayMode, color: s.red, newLine: 'N/A', respectsWH: 'N/A', marginPush: 'N/A' },
          ].map((item) => (
            <div key={item.mode} style={{ padding: 10, background: s.bg2, borderRadius: 5, border: `1px solid ${s.border}` }}>
              <div style={{ fontFamily: s.mono, fontSize: 12, color: item.color, fontWeight: 600, marginBottom: 6 }}>{item.mode}</div>
              <div style={{ fontSize: 10, color: s.text3, lineHeight: 1.6 }}>
                <div>New line: {item.newLine}</div>
                <div>Respects w/h: {item.respectsWH}</div>
                <div>Margin pushes: {item.marginPush}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DemoBoundary>
  )
}

export default DisplayTypeDemo
