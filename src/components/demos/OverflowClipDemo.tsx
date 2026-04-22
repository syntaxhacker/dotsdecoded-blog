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

type OverflowMode = 'visible' | 'hidden' | 'scroll' | 'auto'

const longText = 'This is a long text that overflows the container width. When text is too wide for its box, the overflow property determines what happens to the excess content.'

function OverflowClipDemo() {
  const [overflow, setOverflow] = useState<OverflowMode>('visible')
  const [whiteSpace, setWhiteSpace] = useState(true)
  const [textOverflow, setTextOverflow] = useState(false)

  const overflowModes: OverflowMode[] = ['visible', 'hidden', 'scroll', 'auto']

  return (
    <DemoBoundary name="Overflow & Clipping">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8 }}>OVERFLOW</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {overflowModes.map((mode) => (
              <button
                key={mode}
                onClick={() => setOverflow(mode)}
                style={{
                  padding: '6px 14px',
                  background: overflow === mode ? s.accent + '22' : s.bg2,
                  border: `1px solid ${overflow === mode ? s.accent : s.border}`,
                  borderRadius: 5,
                  color: overflow === mode ? s.accent : s.text2,
                  fontFamily: s.mono,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 6,
          padding: 4,
          marginBottom: 20,
        }}>
          <div style={{
            background: s.bg,
            border: `1px solid ${s.border2}`,
            borderRadius: 4,
            padding: 12,
            maxWidth: 300,
            overflow,
            height: 60,
          }}>
            <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.5 }}>
              {longText}
            </div>
          </div>
          <div style={{ fontFamily: s.mono, fontSize: 9, color: s.text3, padding: '4px 8px', marginTop: 4 }}>
            .box {'{'} max-width: 300px; height: 60px; overflow: {overflow}; {'}'}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8 }}>TEXT-TRUNCATION (ELLIPSIS)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button
              onClick={() => setWhiteSpace(!whiteSpace)}
              style={{
                padding: '6px 12px',
                background: whiteSpace ? s.green + '22' : s.bg2,
                border: `1px solid ${whiteSpace ? s.green : s.border}`,
                borderRadius: 5,
                color: whiteSpace ? s.green : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              white-space: {whiteSpace ? 'nowrap' : 'normal'}
            </button>
            <button
              onClick={() => setTextOverflow(!textOverflow)}
              style={{
                padding: '6px 12px',
                background: textOverflow ? s.accent + '22' : s.bg2,
                border: `1px solid ${textOverflow ? s.accent : s.border}`,
                borderRadius: 5,
                color: textOverflow ? s.accent : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              text-overflow: {textOverflow ? 'ellipsis' : 'clip'}
            </button>
          </div>

          <div style={{
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 6,
            padding: 4,
          }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border2}`,
              borderRadius: 4,
              padding: '10px 12px',
              maxWidth: 300,
              overflow: 'hidden',
              whiteSpace: whiteSpace ? 'nowrap' : undefined,
              textOverflow: textOverflow ? 'ellipsis' : undefined,
              fontFamily: s.mono,
              fontSize: 12,
              color: s.text2,
            }}>
              This is a long text that will be truncated with an ellipsis when all three properties are set correctly.
            </div>
            <div style={{ fontFamily: s.mono, fontSize: 9, color: s.text3, padding: '4px 8px', marginTop: 4 }}>
              {'{'} overflow: hidden; white-space: {whiteSpace ? 'nowrap' : 'normal'}; text-overflow: {textOverflow ? 'ellipsis' : 'clip'}; {'}'}
            </div>
          </div>
        </div>

        <div style={{
          padding: 12,
          background: (whiteSpace && textOverflow) ? s.green + '10' : s.yellow + '10',
          border: `1px solid ${(whiteSpace && textOverflow) ? s.green : s.yellow}`,
          borderRadius: 6,
          fontFamily: s.mono,
          fontSize: 11,
          lineHeight: 1.6,
          color: (whiteSpace && textOverflow) ? s.green : s.yellow,
        }}>
          {(whiteSpace && textOverflow)
            ? 'All three properties active — ellipsis works correctly.'
            : `Missing: ${!whiteSpace ? 'white-space: nowrap ' : ''}${!textOverflow ? 'text-overflow: ellipsis ' : ''}— ellipsis will not appear.`}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { prop: 'overflow: visible', desc: 'Default. Content spills out.', color: s.text3 },
            { prop: 'overflow: hidden', desc: 'Clips content at boundary.', color: s.red },
            { prop: 'overflow: scroll', desc: 'Always shows scrollbars.', color: s.accent },
            { prop: 'overflow: auto', desc: 'Scrollbars only when needed.', color: s.green },
          ].map((item) => (
            <div key={item.prop} style={{
              flex: '1 1 160px',
              padding: 8,
              background: s.bg2,
              borderRadius: 5,
              border: `1px solid ${s.border}`,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: item.color, fontWeight: 600 }}>{item.prop}</div>
              <div style={{ fontSize: 10, color: s.text3, marginTop: 4, lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </DemoBoundary>
  )
}

export default OverflowClipDemo
