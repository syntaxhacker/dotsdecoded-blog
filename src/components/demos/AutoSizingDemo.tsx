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

function AutoSizingDemo() {
  const [mode, setMode] = useState<'block-auto' | 'block-explicit' | 'block-constraints' | 'inline-ignored'>('block-auto')

  const modes = [
    { key: 'block-auto' as const, label: 'Block + auto' },
    { key: 'block-explicit' as const, label: 'Block + explicit' },
    { key: 'block-constraints' as const, label: 'min/max constraints' },
    { key: 'inline-ignored' as const, label: 'Inline ignores w/h' },
  ]

  return (
    <DemoBoundary name="Auto Sizing">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
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
              {m.label}
            </button>
          ))}
        </div>

        <div style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 6,
          padding: 4,
          marginBottom: 16,
        }}>
          <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, padding: '4px 8px' }}>
            .parent {'{'} width: 500px; {'}'}
          </div>
          <div style={{
            background: s.bg,
            border: `1px solid ${s.border2}`,
            borderRadius: 4,
            padding: 12,
            minHeight: 120,
            display: 'flex',
            alignItems: mode === 'inline-ignored' ? 'center' : undefined,
            flexWrap: 'wrap',
          }}>
            {mode === 'block-auto' && (
              <div style={{ width: '100%' }}>
                <div style={{
                  background: s.accent + '15',
                  border: `1px solid ${s.accent}`,
                  borderRadius: 4,
                  padding: 10,
                  fontFamily: s.mono,
                  fontSize: 11,
                  color: s.accent,
                  marginBottom: 4,
                }}>
                  width: auto (fills parent)
                </div>
                <div style={{
                  background: s.yellow + '15',
                  border: `1px solid ${s.yellow}`,
                  borderRadius: 4,
                  padding: 10,
                  fontFamily: s.mono,
                  fontSize: 11,
                  color: s.yellow,
                }}>
                  height: auto (fits content)
                </div>
                <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginTop: 8 }}>
                  Block element fills parent width. Height wraps content.
                </div>
              </div>
            )}

            {mode === 'block-explicit' && (
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  <div style={{
                    background: s.accent + '15',
                    border: `1px solid ${s.accent}`,
                    borderRadius: 4,
                    padding: 10,
                    width: 200,
                    fontFamily: s.mono,
                    fontSize: 11,
                    color: s.accent,
                  }}>
                    width: 200px
                  </div>
                  <div style={{
                    background: s.green + '15',
                    border: `1px solid ${s.green}`,
                    borderRadius: 4,
                    padding: 10,
                    width: '50%',
                    fontFamily: s.mono,
                    fontSize: 11,
                    color: s.green,
                  }}>
                    width: 50% (= 250px)
                  </div>
                </div>
                <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
                  Percentage resolves against containing block (500px). 50% = 250px.
                </div>
              </div>
            )}

            {mode === 'block-constraints' && (
              <div style={{ width: '100%' }}>
                <div style={{
                  background: s.accent + '15',
                  border: `1px solid ${s.accent}`,
                  borderRadius: 4,
                  padding: 10,
                  fontFamily: s.mono,
                  fontSize: 11,
                  color: s.accent,
                  marginBottom: 4,
                }}>
                  width: 100px
                </div>
                <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 8 }}>
                  But also: min-width: 250px
                </div>
                <div style={{
                  background: s.red + '15',
                  border: `1px solid ${s.red}`,
                  borderRadius: 4,
                  padding: 10,
                  fontFamily: s.mono,
                  fontSize: 11,
                  color: s.red,
                  width: 250,
                }}>
                  Rendered at 250px — min-width wins!
                </div>
                <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginTop: 8 }}>
                  min-width and max-width ALWAYS override width. This is the basis of responsive design.
                </div>
              </div>
            )}

            {mode === 'inline-ignored' && (
              <div style={{ width: '100%' }}>
                <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 8 }}>
                  span {'{'} display: inline; width: 200px; height: 80px; {'}'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    display: 'inline',
                    background: s.accent + '15',
                    border: `1px solid ${s.accent}`,
                    borderRadius: 4,
                    padding: 10,
                    width: 200,
                    height: 80,
                    fontFamily: s.mono,
                    fontSize: 11,
                    color: s.accent,
                  }}>
                    I am inline
                  </div>
                  <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text2 }}>next text</span>
                </div>
                <div style={{ fontFamily: s.mono, fontSize: 10, color: s.red, marginTop: 8 }}>
                  width: 200px and height: 80px are IGNORED. The span wraps its content.
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { prop: 'width: auto', desc: 'Block fills parent. Inline fits content.', color: s.accent },
            { prop: 'height: auto', desc: 'Always fits content (both block and inline).', color: s.green },
            { prop: 'width: 50%', desc: 'Resolves against containing block width.', color: s.yellow },
            { prop: 'min-width > width', desc: 'min-width ALWAYS wins over width.', color: s.red },
          ].map((item) => (
            <div key={item.prop} style={{ flex: '1 1 180px', padding: 8, background: s.bg2, borderRadius: 5, border: `1px solid ${s.border}` }}>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: item.color, fontWeight: 600 }}>{item.prop}</div>
              <div style={{ fontSize: 11, color: s.text3, marginTop: 4, lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </DemoBoundary>
  )
}

export default AutoSizingDemo
