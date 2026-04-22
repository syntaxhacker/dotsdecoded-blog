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

export default function CustomPropertiesDemo() {
  const [accent, setAccent] = useState('#5b8def')
  const [radius, setRadius] = useState(8)
  const [spacing, setSpacing] = useState(12)

  const themes = [
    { name: 'Blue', accent: '#5b8def' },
    { name: 'Green', accent: '#3dd68c' },
    { name: 'Purple', accent: '#9b7bea' },
    { name: 'Orange', accent: '#e8945a' },
    { name: 'Red', accent: '#e85d5d' },
    { name: 'Yellow', accent: '#e0b040' },
  ]

  return (
    <DemoBoundary name="Custom Properties">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Theme Presets</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {themes.map(t => (
                <button
                  key={t.name}
                  onClick={() => setAccent(t.accent)}
                  style={{
                    background: accent === t.accent ? t.accent : s.bg3,
                    color: accent === t.accent ? s.bg : s.text2,
                    border: `1px solid ${accent === t.accent ? t.accent : s.border}`,
                    borderRadius: 4,
                    padding: '4px 10px',
                    fontSize: 10,
                    fontFamily: s.mono,
                    cursor: 'pointer',
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Custom Values</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text2 }}>--radius</span>
                <input type="range" min={0} max={24} value={radius} onChange={e => setRadius(+e.target.value)} style={{ width: 80, accentColor: accent }} />
                <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>{radius}px</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text2 }}>--spacing</span>
                <input type="range" min={4} max={24} value={spacing} onChange={e => setSpacing(+e.target.value)} style={{ width: 80, accentColor: accent }} />
                <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>{spacing}px</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing }}>
            <div style={{
              background: accent,
              borderRadius: radius,
              padding: spacing,
              color: s.bg,
              transition: 'all 0.3s',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Card Component</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Uses var(--accent) for background and var(--radius) for border-radius.</div>
            </div>
            <div style={{
              background: s.bg3,
              borderRadius: radius,
              border: `2px solid ${accent}`,
              padding: spacing,
              transition: 'all 0.3s',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: accent, marginBottom: 4 }}>Outlined Card</div>
              <div style={{ fontSize: 11, color: s.text3 }}>Uses var(--accent) for border-color.</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: spacing, marginTop: spacing }}>
            <button style={{
              background: accent,
              color: s.bg,
              border: 'none',
              borderRadius: radius,
              padding: `${spacing}px ${spacing * 2}px`,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: s.mono,
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}>
              Primary Button
            </button>
            <button style={{
              background: 'transparent',
              color: accent,
              border: `2px solid ${accent}`,
              borderRadius: radius,
              padding: `${spacing - 2}px ${spacing * 2 - 2}px`,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: s.mono,
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}>
              Secondary Button
            </button>
            <div style={{
              background: s.bg3,
              borderRadius: radius,
              padding: `${spacing}px ${spacing * 2}px`,
              fontSize: 12,
              fontFamily: s.mono,
              color: s.text2,
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: radius,
                background: accent,
                transition: 'all 0.3s',
              }} />
              Badge
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, background: s.bg, borderRadius: 6, border: `1px solid ${s.border}`, padding: 12 }}>
          <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Generated CSS</div>
          <div style={{ fontFamily: s.mono, fontSize: 11, lineHeight: 1.7, color: s.text2 }}>
            <div><span style={{ color: s.purple }}>:root</span> {'{'}</div>
            <div style={{ paddingLeft: 16 }}>
              <span style={{ color: s.accent }}>--accent</span><span style={{ color: s.text3 }}>: </span><span style={{ color: s.yellow }}>{accent}</span><span style={{ color: s.text3 }}>;</span>
            </div>
            <div style={{ paddingLeft: 16 }}>
              <span style={{ color: s.accent }}>--radius</span><span style={{ color: s.text3 }}>: </span><span style={{ color: s.yellow }}>{radius}px</span><span style={{ color: s.text3 }}>;</span>
            </div>
            <div style={{ paddingLeft: 16 }}>
              <span style={{ color: s.accent }}>--spacing</span><span style={{ color: s.text3 }}>: </span><span style={{ color: s.yellow }}>{spacing}px</span><span style={{ color: s.text3 }}>;</span>
            </div>
            <div>{'}'}</div>
            <div style={{ marginTop: 6 }}><span style={{ color: s.green }}>.button</span> {'{'}</div>
            <div style={{ paddingLeft: 16 }}>
              <span style={{ color: s.text2 }}>background</span><span style={{ color: s.text3 }}>: </span><span style={{ color: s.yellow }}>var(--accent)</span><span style={{ color: s.text3 }}>;</span>
            </div>
            <div style={{ paddingLeft: 16 }}>
              <span style={{ color: s.text2 }}>border-radius</span><span style={{ color: s.text3 }}>: </span><span style={{ color: s.yellow }}>var(--radius)</span><span style={{ color: s.text3 }}>;</span>
            </div>
            <div style={{ paddingLeft: 16 }}>
              <span style={{ color: s.text2 }}>padding</span><span style={{ color: s.text3 }}>: </span><span style={{ color: s.yellow }}>var(--spacing)</span><span style={{ color: s.text3 }}>;</span>
            </div>
            <div>{'}'}</div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
