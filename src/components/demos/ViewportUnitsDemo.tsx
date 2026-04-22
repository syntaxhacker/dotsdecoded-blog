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

export default function ViewportUnitsDemo() {
  const [vpW, setVpW] = useState(960)
  const [vpH, setVpH] = useState(640)
  const [fontSize, setFontSize] = useState(3)

  const vmin = Math.min(vpW, vpH)
  const vmax = Math.max(vpW, vpH)

  const units = [
    { name: 'vw', label: '1vw', value: vpW / 100, color: s.accent, desc: '1% of viewport width' },
    { name: 'vh', label: '1vh', value: vpH / 100, color: s.green, desc: '1% of viewport height' },
    { name: 'vmin', label: '1vmin', value: vmin / 100, color: s.yellow, desc: '1% of smaller dimension' },
    { name: 'vmax', label: '1vmax', value: vmax / 100, color: s.purple, desc: '1% of larger dimension' },
  ]

  const clampMin = 16
  const clampMax = 48
  const clampPreferred = (fontSize / 100) * vpW
  const clamped = Math.max(clampMin, Math.min(clampMax, clampPreferred))

  return (
    <DemoBoundary name="Viewport Units">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text2, marginBottom: 8 }}>Simulated Viewport</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>W:</span>
              <input type="range" min={320} max={1920} value={vpW} onChange={e => setVpW(+e.target.value)} style={{ width: 120, accentColor: s.accent }} />
              <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text2, width: 50 }}>{vpW}px</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>H:</span>
              <input type="range" min={320} max={1080} value={vpH} onChange={e => setVpH(+e.target.value)} style={{ width: 120, accentColor: s.green }} />
              <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text2, width: 50 }}>{vpH}px</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {units.map(u => (
            <div key={u.name} style={{ background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`, padding: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: s.mono, color: u.color, marginBottom: 4 }}>{u.label}</div>
              <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 10 }}>{u.desc}</div>
              <div style={{
                height: Math.max(8, u.value * 2),
                background: u.color,
                borderRadius: 4,
                marginBottom: 6,
                transition: 'height 0.3s',
              }} />
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text }}>{u.value.toFixed(2)}px</div>
            </div>
          ))}
        </div>

        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: s.text2, marginBottom: 12 }}>clamp() Demo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>vw multiplier:</span>
            <input type="range" min={1} max={8} step={0.5} value={fontSize} onChange={e => setFontSize(+e.target.value)} style={{ width: 160, accentColor: s.orange }} />
            <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text2 }}>{fontSize}vw</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, width: 80 }}>min (16px)</div>
            <div style={{ flex: 1, position: 'relative', height: 32, background: s.bg3, borderRadius: 6 }}>
              <div style={{
                position: 'absolute',
                left: `${(clampMin / 48) * 100}%`,
                width: 2,
                height: '100%',
                background: s.green,
              }} />
              <div style={{
                position: 'absolute',
                left: `${(clampMax / 48) * 100}%`,
                width: 2,
                height: '100%',
                background: s.red,
              }} />
              <div style={{
                position: 'absolute',
                left: `${(Math.min(clamped, 48) / 48) * 100}%`,
                width: 4,
                height: '100%',
                background: s.orange,
                borderRadius: 2,
                transition: 'left 0.2s',
              }} />
            </div>
            <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, width: 80, textAlign: 'right' }}>max (48px)</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: clamped,
              fontFamily: s.mono,
              color: s.text,
              lineHeight: 1.3,
              transition: 'font-size 0.2s',
            }}>
              Hello World
            </div>
            <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginTop: 8 }}>
              clamp(1rem, {fontSize}vw, 3rem) = {clamped.toFixed(1)}px
            </div>
            {clamped <= clampMin && (
              <div style={{ fontSize: 10, fontFamily: s.mono, color: s.green, marginTop: 4 }}>clamped to minimum</div>
            )}
            {clamped >= clampMax && (
              <div style={{ fontSize: 10, fontFamily: s.mono, color: s.red, marginTop: 4 }}>clamped to maximum</div>
            )}
            {clamped > clampMin && clamped < clampMax && (
              <div style={{ fontSize: 10, fontFamily: s.mono, color: s.orange, marginTop: 4 }}>using preferred value ({(fontSize * vpW / 100).toFixed(1)}px)</div>
            )}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
