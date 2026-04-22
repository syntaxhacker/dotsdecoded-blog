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

type PosMode = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'

const modes: { key: PosMode; desc: string; coordSystem: string }[] = [
  { key: 'static', desc: 'Normal flow. top/left are ignored. Element stays where it would naturally be.', coordSystem: 'N/A' },
  { key: 'relative', desc: 'Offset from normal position. Element still occupies its original space in flow.', coordSystem: 'Offset from self' },
  { key: 'absolute', desc: 'Removed from flow. Positioned relative to nearest positioned ancestor.', coordSystem: 'From positioned ancestor' },
  { key: 'fixed', desc: 'Removed from flow. Positioned relative to the viewport. Stays put on scroll.', coordSystem: 'From viewport' },
  { key: 'sticky', desc: 'Normal flow until reaching threshold, then sticks within containing block.', coordSystem: 'Threshold in scroll parent' },
]

function PositioningDemo() {
  const [mode, setMode] = useState<PosMode>('static')
  const [top, setTop] = useState(0)
  const [left, setLeft] = useState(0)

  const getPosStyle = (): React.CSSProperties => {
    if (mode === 'static') return { position: 'static' }
    if (mode === 'relative') return { position: 'relative', top, left }
    if (mode === 'absolute') return { position: 'absolute', top, left }
    if (mode === 'fixed') return { position: 'absolute', top: top + 100, left: left + 20 }
    return { position: 'relative', top: Math.min(top, 0), left }
  }

  return (
    <DemoBoundary name="Positioning">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => { setMode(m.key); setTop(0); setLeft(0) }}
              style={{
                padding: '6px 12px',
                background: mode === m.key ? s.accent + '22' : s.bg2,
                border: `1px solid ${mode === m.key ? s.accent : s.border}`,
                borderRadius: 5,
                color: mode === m.key ? s.accent : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {m.key}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              {[
                { label: 'top', value: top, set: setTop, color: s.green },
                { label: 'left', value: left, set: setLeft, color: s.accent },
              ].map((item) => (
                <div key={item.label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, width: 28 }}>{item.label}</span>
                  <input
                    type="range"
                    min={mode === 'sticky' && item.label === 'top' ? -60 : 0}
                    max={80}
                    value={Math.abs(item.value)}
                    onChange={(e) => item.set(Number(e.target.value))}
                    style={{ flex: 1, accentColor: item.color, height: 4 }}
                  />
                  <span style={{ fontFamily: s.mono, fontSize: 11, color: item.color, width: 32, textAlign: 'right' }}>{item.value}px</span>
                </div>
              ))}
            </div>

            <div style={{
              padding: '10px 12px',
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
              marginBottom: 12,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.accent, fontWeight: 600, marginBottom: 4 }}>
                position: {mode}
              </div>
              <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.5 }}>{modes.find(m => m.key === mode)?.desc}</div>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginTop: 6 }}>
                Coordinate system: {modes.find(m => m.key === mode)?.coordSystem}
              </div>
            </div>

            <div style={{
              padding: '10px 12px',
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginBottom: 6 }}>CSS OUTPUT</div>
              <div style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 11, color: s.text2 }}>
{`.child {
  position: ${mode};${mode !== 'static' ? `\n  top: ${top}px;\n  left: ${left}px;` : ''}
}`}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
              padding: 4,
              position: 'relative',
              height: 240,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 9, color: s.text3, padding: '4px 8px' }}>
                .parent (position: relative)
              </div>

              <div style={{
                background: s.bg3 + '66',
                border: `1px dashed ${s.border}`,
                borderRadius: 4,
                height: 12,
                margin: '0 8px 8px',
              }}>
                <div style={{ fontFamily: s.mono, fontSize: 9, color: s.text3, position: 'absolute', top: -16, left: 0 }}>
                  sibling
                </div>
              </div>

              {mode === 'relative' && top === 0 && left === 0 && (
                <div style={{
                  position: 'absolute',
                  top: 60,
                  left: 8,
                  width: 100,
                  height: 40,
                  background: s.accent + '10',
                  border: `1px dashed ${s.accent}44`,
                  borderRadius: 4,
                }} />
              )}

              <div style={{
                ...getPosStyle(),
                background: s.accent + '22',
                border: `2px solid ${s.accent}`,
                borderRadius: 4,
                padding: '8px 12px',
                width: 100,
                fontFamily: s.mono,
                fontSize: 11,
                color: s.accent,
                marginTop: 8,
                marginLeft: 8,
                zIndex: 1,
              }}>
                .child
              </div>

              <div style={{
                background: s.bg3 + '66',
                border: `1px dashed ${s.border}`,
                borderRadius: 4,
                height: 12,
                margin: '8px 8px 0',
                position: mode === 'absolute' || mode === 'fixed' ? 'relative' : undefined,
                top: mode === 'absolute' || mode === 'fixed' ? -40 : undefined,
              }}>
                <div style={{ fontFamily: s.mono, fontSize: 9, color: s.text3, position: 'absolute', bottom: -16, left: 0 }}>
                  sibling
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

export default PositioningDemo
