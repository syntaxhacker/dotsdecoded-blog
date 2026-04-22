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

function BoxSizingDemo() {
  const [width, setWidth] = useState(300)
  const [padding, setPadding] = useState(20)
  const [border, setBorder] = useState(5)

  const contentBoxTotal = width + padding * 2 + border * 2
  const contentBoxContent = width
  const borderBoxContent = width - padding * 2 - border * 2

  return (
    <DemoBoundary name="Box Sizing">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'width', value: width, set: setWidth, min: 100, max: 500, color: s.yellow },
            { label: 'padding', value: padding, set: setPadding, color: s.green },
            { label: 'border', value: border, set: setBorder, max: 20, color: s.accent },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 160px', minWidth: 140 }}>
              <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, width: 55 }}>{item.label}</span>
              <input
                type="range"
                min={item.min || 0}
                max={item.max || 60}
                value={item.value}
                onChange={(e) => item.set(Number(e.target.value))}
                style={{ flex: 1, accentColor: item.color, height: 4 }}
              />
              <span style={{ fontFamily: s.mono, fontSize: 11, color: item.color, width: 36, textAlign: 'right' }}>{item.value}px</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: s.mono, fontSize: 12, color: s.red, marginBottom: 8, fontWeight: 600 }}>
              content-box
            </div>
            <div style={{
              position: 'relative',
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 4,
              padding: 4,
            }}>
              <div style={{ position: 'absolute', top: 6, right: 8, fontFamily: s.mono, fontSize: 9, color: s.text3 }}>
                width: {width}px (content only)
              </div>
              <div style={{
                background: s.accent + '15',
                border: `${border}px solid ${s.accent}`,
                padding: padding,
                width: contentBoxContent,
                minHeight: 60,
                boxSizing: 'content-box',
              }}>
                <div style={{
                  background: s.yellow + '22',
                  border: `1px dashed ${s.yellow}`,
                  padding: 8,
                  fontFamily: s.mono,
                  fontSize: 10,
                  color: s.yellow,
                  textAlign: 'center',
                }}>
                  Content: {width}px
                </div>
              </div>
            </div>
            <div style={{
              fontFamily: s.mono,
              fontSize: 11,
              color: s.red,
              marginTop: 8,
              textAlign: 'center',
            }}>
              Actual size: {contentBoxTotal}px (overflows!)
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: s.mono, fontSize: 12, color: s.green, marginBottom: 8, fontWeight: 600 }}>
              border-box
            </div>
            <div style={{
              position: 'relative',
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 4,
              padding: 4,
            }}>
              <div style={{ position: 'absolute', top: 6, right: 8, fontFamily: s.mono, fontSize: 9, color: s.text3 }}>
                width: {width}px (total)
              </div>
              <div style={{
                background: s.green + '15',
                border: `${border}px solid ${s.green}`,
                padding: padding,
                width: width,
                minHeight: 60,
                boxSizing: 'border-box',
              }}>
                <div style={{
                  background: s.yellow + '22',
                  border: `1px dashed ${s.yellow}`,
                  padding: 8,
                  fontFamily: s.mono,
                  fontSize: 10,
                  color: s.yellow,
                  textAlign: 'center',
                }}>
                  Content: {Math.max(0, borderBoxContent)}px
                </div>
              </div>
            </div>
            <div style={{
              fontFamily: s.mono,
              fontSize: 11,
              color: s.green,
              marginTop: 8,
              textAlign: 'center',
            }}>
              Actual size: {width}px (stays at {width}px)
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 20,
          padding: '12px 14px',
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 6,
          fontFamily: s.mono,
          fontSize: 12,
          color: s.text2,
          lineHeight: 1.6,
        }}>
          <span style={{ color: s.text3 }}>content-box:</span> width = content. Adding padding/border = element grows.<br />
          <span style={{ color: s.text3 }}>border-box:</span> width = content + padding + border. Content shrinks to fit.
        </div>
      </div>
    </DemoBoundary>
  )
}

export default BoxSizingDemo
