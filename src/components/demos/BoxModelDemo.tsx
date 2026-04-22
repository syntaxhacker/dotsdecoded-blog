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

function Slider({ label, value, onChange, min = 0, max = 60, color = s.accent }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; color?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, width: 70, flexShrink: 0 }}>{label}</div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: color, height: 4 }}
      />
      <div style={{ fontFamily: s.mono, fontSize: 12, color: color, width: 44, textAlign: 'right', flexShrink: 0 }}>{value}px</div>
    </div>
  )
}

function BoxModelDemo() {
  const [width, setWidth] = useState(120)
  const [height, setHeight] = useState(80)
  const [padding, setPadding] = useState(15)
  const [border, setBorder] = useState(5)
  const [margin, setMargin] = useState(20)

  const totalW = width + padding * 2 + border * 2 + margin * 2
  const totalH = height + padding * 2 + border * 2 + margin * 2
  const marginBoxW = width + padding * 2 + border * 2

  return (
    <DemoBoundary name="Box Model">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Slider label="width" value={width} onChange={setWidth} min={40} max={200} color={s.yellow} />
            <Slider label="height" value={height} onChange={setHeight} min={30} max={150} color={s.yellow} />
            <Slider label="padding" value={padding} onChange={setPadding} color={s.green} />
            <Slider label="border" value={border} onChange={setBorder} max={20} color={s.accent} />
            <Slider label="margin" value={margin} onChange={setMargin} color={s.purple} />

            <div style={{ marginTop: 16, padding: 10, background: s.bg2, borderRadius: 6, border: `1px solid ${s.border}` }}>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginBottom: 6 }}>COMPUTED SIZES</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <div style={{ fontFamily: s.mono, fontSize: 11 }}>
                  <span style={{ color: s.text3 }}>Content: </span>
                  <span style={{ color: s.yellow }}>{width} x {height}</span>
                </div>
                <div style={{ fontFamily: s.mono, fontSize: 11 }}>
                  <span style={{ color: s.text3 }}>+Padding: </span>
                  <span style={{ color: s.green }}>+{padding * 2}</span>
                </div>
                <div style={{ fontFamily: s.mono, fontSize: 11 }}>
                  <span style={{ color: s.text3 }}>+Border: </span>
                  <span style={{ color: s.accent }}>+{border * 2}</span>
                </div>
                <div style={{ fontFamily: s.mono, fontSize: 11 }}>
                  <span style={{ color: s.text3 }}>+Margin: </span>
                  <span style={{ color: s.purple }}>+{margin * 2}</span>
                </div>
              </div>
              <div style={{ fontFamily: s.mono, fontSize: 12, color: s.text, marginTop: 8, fontWeight: 600 }}>
                Total: {totalW} x {totalH}px
              </div>
            </div>

            <div style={{ marginTop: 16, padding: 10, background: s.bg2, borderRadius: 6, border: `1px solid ${s.border}` }}>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginBottom: 6 }}>MARGIN COLLAPSE</div>
              <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.5 }}>
                When two block elements stack, vertical margins collapse to the <span style={{ color: s.yellow }}>larger</span> value instead of adding.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 10 }}>
                <div style={{
                  background: s.accent + '22',
                  border: `1px solid ${s.accent}`,
                  borderRadius: 4,
                  padding: '8px 12px',
                  marginBottom: 20,
                  textAlign: 'center',
                  fontFamily: s.mono,
                  fontSize: 11,
                  color: s.accent,
                }}>
                  Box A — margin-bottom: 20px
                </div>
                <div style={{
                  background: s.green + '22',
                  border: `1px solid ${s.green}`,
                  borderRadius: 4,
                  padding: '8px 12px',
                  marginTop: 20,
                  textAlign: 'center',
                  fontFamily: s.mono,
                  fontSize: 11,
                  color: s.green,
                }}>
                  Box B — margin-top: 20px
                </div>
              </div>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginTop: 8, textAlign: 'center' }}>
                Gap = max(20, 20) = 20px (not 40px)
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              background: s.purple + '18',
              borderRadius: 4,
              padding: margin,
              position: 'relative',
              minWidth: totalW,
              minHeight: totalH,
            }}>
              <div style={{
                position: 'absolute',
                top: 4,
                left: 4,
                fontFamily: s.mono,
                fontSize: 9,
                color: s.purple,
              }}>
                margin: {margin}px
              </div>
              <div style={{
                background: s.accent + '25',
                borderRadius: 3,
                padding: padding,
                position: 'relative',
                minWidth: marginBoxW,
                minHeight: height + padding * 2,
              }}>
                <div style={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  fontFamily: s.mono,
                  fontSize: 9,
                  color: s.accent,
                }}>
                  border: {border}px
                </div>
                <div style={{
                  background: s.green + '20',
                  borderRadius: 2,
                  padding: padding,
                  position: 'relative',
                  minWidth: width,
                  minHeight: height,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 2,
                    left: 4,
                    fontFamily: s.mono,
                    fontSize: 9,
                    color: s.green,
                  }}>
                    padding: {padding}px
                  </div>
                  <div style={{
                    background: s.yellow + '22',
                    border: `1px dashed ${s.yellow}`,
                    width: width,
                    height: height,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: s.mono,
                    fontSize: 10,
                    color: s.yellow,
                  }}>
                    {width} x {height}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

export default BoxModelDemo
