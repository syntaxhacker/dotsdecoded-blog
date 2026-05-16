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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface ShiftData {
  id: string
  label: string
  impactFrac: number
  distFrac: number
  shiftColor: string
}

const shifts: ShiftData[] = [
  { id: 'img1', label: 'Image loads', impactFrac: 0.45, distFrac: 0.3, shiftColor: s.red },
  { id: 'img2', label: 'Second image', impactFrac: 0.3, distFrac: 0.25, shiftColor: s.orange },
  { id: 'ad', label: 'Ad slot fills', impactFrac: 0.25, distFrac: 0.2, shiftColor: s.yellow },
  { id: 'font', label: 'Web font swaps', impactFrac: 0.15, distFrac: 0.1, shiftColor: s.purple },
]

interface FixToggle {
  id: string
  label: string
  active: boolean
}

export default function PerfClsDemo() {
  const [fixes, setFixes] = useState<FixToggle[]>([
    { id: 'dims', label: 'Set width/height', active: false },
    { id: 'adspace', label: 'Reserve ad space', active: false },
    { id: 'fontswap', label: 'font-display: swap', active: false },
  ])

  const [animate, setAnimate] = useState(false)
  const [shifted, setShifted] = useState(false)

  const toggleFix = (id: string) => {
    setFixes(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f))
  }

  const runShift = () => {
    setAnimate(true)
    setTimeout(() => setShifted(true), 100)
    setTimeout(() => { setAnimate(false); setShifted(false) }, 2000)
  }

  const activeFixes = fixes.filter(f => f.active).map(f => f.id)
  const mitigationFactor = activeFixes.length === 0 ? 0 : activeFixes.length === 1 ? 0.6 : activeFixes.length === 2 ? 0.85 : 0.95

  const calcCls = (sh: ShiftData) => {
    const factor = 1 - mitigationFactor
    return Math.round((sh.impactFrac * sh.distFrac * factor) * 10000) / 10000
  }

  const totalCls = shifts.reduce((sum, sh) => sum + calcCls(sh), 0)

  const adHeight = fixes.find(f => f.id === 'adspace')?.active ? 80 : 0

  return (
    <DemoBoundary name="Cumulative Layout Shift">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Cumulative Layout Shift</div>

        <div style={{ display: 'flex', gap: 24, marginBottom: 20, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 12, minHeight: 380, position: 'relative', overflow: 'hidden' }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Page Layout</div>

              <div style={{ background: s.bg3, borderRadius: 6, padding: '8px 12px', marginBottom: 8 }}>
                <div style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>Header</div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>Article content</div>
                  <div style={{ color: s.text2, fontSize: 11, lineHeight: 1.5 }}>
                    Lorem ipsum dolor sit amet consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  </div>
                </div>
              </div>

              <div style={{ position: 'relative', marginBottom: activeFixes.includes('dims') ? 100 : 0, transition: 'margin-bottom 0.5s ease' }}>
                {!activeFixes.includes('dims') || !shifted ? (
                  <div style={{
                    background: `${s.yellow}20`, border: `1px solid ${s.yellow}`,
                    borderRadius: 8, padding: '12px 16px', marginBottom: 8,
                    position: 'relative', overflow: 'hidden',
                    transform: shifted && animate ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'transform 1s ease',
                    height: shifted ? 'auto' : 0,
                    opacity: shifted ? 1 : 0,
                  }}>
                    <div style={{ color: s.text2, fontSize: 12 }}>Image placeholder</div>
                    <div style={{
                      background: `linear-gradient(135deg, ${s.bg3}, ${s.border})`,
                      height: 80, borderRadius: 6, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>[hero.jpg]</span>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: `${s.green}20`, border: `1px solid ${s.green}`,
                    borderRadius: 8, padding: '12px 16px', marginBottom: 8, height: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: s.green, fontSize: 12, fontFamily: s.mono }}>Image with width/height attributes (no shift)</span>
                  </div>
                )}
              </div>

              <div style={{ position: 'relative', minHeight: adHeight + 20, transition: 'min-height 0.5s ease' }}>
                <div style={{
                  background: `${s.purple}20`, border: `1px solid ${s.purple}`,
                  borderRadius: 8, padding: '8px 12px',
                  height: shifted && activeFixes.includes('adspace') ? adHeight : shifted ? 'auto' : 0,
                  transform: shifted ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 1s ease',
                  opacity: shifted ? 1 : 0,
                }}>
                  <span style={{ color: s.text3, fontSize: 11 }}>{activeFixes.includes('adspace') ? 'Ad (reserved space, no shift)' : 'Ad loaded dynamically'}</span>
                </div>
              </div>

              <div style={{ background: s.bg3, borderRadius: 6, padding: '8px 12px', marginTop: 8 }}>
                <div style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>Footer</div>
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button onClick={runShift} disabled={animate} style={{
                background: animate ? s.bg3 : s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
                color: '#fff', cursor: animate ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
              }}>{animate ? 'Shifting...' : shifted ? 'Run Again' : 'Load Images'}</button>
            </div>
          </div>

          <div style={{ width: 280 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: s.text2, fontSize: 12, marginBottom: 6 }}>Fixes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {fixes.map(fix => (
                  <label key={fix.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: s.bg, border: `1px solid ${fix.active ? s.green : s.border}`,
                    borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>
                    <input type="checkbox" checked={fix.active} onChange={() => toggleFix(fix.id)} style={{ accentColor: s.green }} />
                    <span style={{ color: fix.active ? s.green : s.text2, fontSize: 12 }}>{fix.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>CLS Score</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: s.mono, color: totalCls < 0.1 ? s.green : totalCls < 0.25 ? s.yellow : s.red, marginBottom: 12 }}>
                {totalCls.toFixed(4)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {shifts.map(sh => {
                  const score = calcCls(sh)
                  return (
                    <div key={sh.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: sh.shiftColor }} />
                        <span style={{ color: s.text3, fontSize: 10 }}>{sh.label}</span>
                      </div>
                      <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 11 }}>{score.toFixed(4)}</span>
                    </div>
                  )
                })}
              </div>

              <div style={{ borderTop: `1px solid ${s.border}`, marginTop: 10, paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: s.text3, fontSize: 10 }}>CLS = sum(impactFrac x distFrac)</span>
                  <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 11, fontWeight: 600 }}>{totalCls.toFixed(4)}</span>
                </div>
                <div style={{ color: s.text3, fontSize: 9, marginTop: 4 }}>
                  {activeFixes.length === 0 ? 'No fixes applied' : `${activeFixes.length} fix${activeFixes.length > 1 ? 'es' : ''} active`}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>CLS Formula</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Impact', desc: 'Stable region area + unstable region area = total affected space', color: s.accent },
              { label: 'Distance', desc: 'How far the unstable element moves relative to viewport', color: s.orange },
              { label: 'Score', desc: 'impactFraction x distanceFraction. Good: < 0.1, Poor: > 0.25', color: s.green },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 60 }}>{item.label}</span>
                <span style={{ color: s.text2, fontSize: 12 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
