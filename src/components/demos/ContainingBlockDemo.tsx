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

function ContainingBlockDemo() {
  const [middlePosition, setMiddlePosition] = useState<string>('static')
  const positions = ['static', 'relative', 'absolute', 'fixed']

  const innerAnchorsTo = middlePosition !== 'static' ? 'middle' : 'outer'

  return (
    <DemoBoundary name="Containing Block">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 10 }}>
          Middle container position:
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {positions.map((pos) => (
            <button
              key={pos}
              onClick={() => setMiddlePosition(pos)}
              style={{
                padding: '6px 14px',
                background: middlePosition === pos ? s.accent + '22' : s.bg2,
                border: `1px solid ${middlePosition === pos ? s.accent : s.border}`,
                borderRadius: 5,
                color: middlePosition === pos ? s.accent : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {pos}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: s.purple + '10',
              border: `2px solid ${s.purple}`,
              borderRadius: 6,
              padding: 16,
              position: 'relative',
              minHeight: 240,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.purple, marginBottom: 4, fontWeight: 600 }}>
                .outer (position: relative)
              </div>

              <div style={{
                background: innerAnchorsTo === 'outer' ? s.accent + '15' : s.bg3 + '33',
                border: `2px solid ${innerAnchorsTo === 'outer' ? s.accent : s.border}`,
                borderRadius: 5,
                padding: 12,
                position: middlePosition !== 'static' ? middlePosition as React.CSSProperties['position'] : undefined,
                minHeight: 160,
                marginTop: 8,
              }}>
                <div style={{ fontFamily: s.mono, fontSize: 10, color: innerAnchorsTo === 'outer' ? s.accent : s.text3, marginBottom: 4, fontWeight: 600 }}>
                  .middle (position: {middlePosition})
                </div>

                <div style={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  background: s.green + '22',
                  border: `2px solid ${s.green}`,
                  borderRadius: 4,
                  padding: '6px 10px',
                  fontFamily: s.mono,
                  fontSize: 10,
                  color: s.green,
                }}>
                  .inner
                </div>

                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  fontFamily: s.mono,
                  fontSize: 9,
                  color: innerAnchorsTo === 'outer' ? s.accent : s.text3,
                  padding: '2px 6px',
                  background: innerAnchorsTo === 'outer' ? s.accent + '22' : 'transparent',
                  borderRadius: '0 3px 0 4px',
                }}>
                  {innerAnchorsTo === 'outer' ? 'CONTAINING BLOCK' : ''}
                </div>
              </div>

              {innerAnchorsTo === 'outer' && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  fontFamily: s.mono,
                  fontSize: 9,
                  color: s.accent,
                  padding: '2px 6px',
                  background: s.accent + '22',
                  borderRadius: '0 4px 0 6px',
                }}>
                  CONTAINING BLOCK
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              padding: 14,
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
              marginBottom: 12,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginBottom: 8 }}>HOW IT WORKS</div>
              <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.6 }}>
                <span style={{ fontFamily: s.mono, color: s.green }}>.inner</span> has{' '}
                <span style={{ fontFamily: s.mono, color: s.yellow }}>position: absolute</span>.
              </div>
              <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.6, marginTop: 6 }}>
                When <span style={{ fontFamily: s.mono, color: s.accent }}>.middle</span> is{' '}
                <span style={{ fontFamily: s.mono, color: s.red }}>static</span>, there is no
                positioned ancestor, so .inner anchors to .outer.
              </div>
              <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.6, marginTop: 6 }}>
                When .middle has any position other than static, it becomes
                the containing block for .inner.
              </div>
            </div>

            <div style={{
              padding: 14,
              background: innerAnchorsTo === 'middle' ? s.green + '10' : s.accent + '10',
              border: `1px solid ${innerAnchorsTo === 'middle' ? s.green : s.accent}`,
              borderRadius: 6,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 12, color: innerAnchorsTo === 'middle' ? s.green : s.accent, fontWeight: 600 }}>
                .inner anchors to: .{innerAnchorsTo}
              </div>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginTop: 4 }}>
                bottom: 16px; right: 16px (from containing block edges)
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { pos: 'static/relative', cb: 'nearest block-level ancestor content box' },
                { pos: 'absolute', cb: 'nearest positioned ancestor (not static)' },
                { pos: 'fixed', cb: 'viewport (unless ancestor has transform)' },
              ].map((item) => (
                <div key={item.pos} style={{
                  padding: '6px 10px',
                  background: s.bg2,
                  borderRadius: 4,
                  border: `1px solid ${s.border}`,
                  fontFamily: s.mono,
                  fontSize: 10,
                }}>
                  <span style={{ color: s.yellow }}>{item.pos}</span>
                  <span style={{ color: s.text3 }}> → {item.cb}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

export default ContainingBlockDemo
