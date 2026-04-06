import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const MODULES = [
  { id: 'app', name: 'app.js', path: 'src/app.js', exports: [] as string[], isEntry: true },
  { id: 'format', name: 'format.js', path: 'utils/format.js', exports: ['formatDate', 'parseDate', 'formatCurrency', 'formatNumber', 'formatBytes'] },
  { id: 'validate', name: 'validate.js', path: 'utils/validate.js', exports: ['validateEmail', 'validatePhone', 'validateURL', 'validateAge'] },
  { id: 'math', name: 'math.js', path: 'utils/math.js', exports: ['add', 'subtract', 'multiply', 'divide', 'round', 'clamp'] },
]

const SIZES: Record<string, number> = {
  formatDate: 120, parseDate: 95, formatCurrency: 180, formatNumber: 110, formatBytes: 75,
  validateEmail: 150, validatePhone: 90, validateURL: 130, validateAge: 60,
  add: 30, subtract: 30, multiply: 45, divide: 50, round: 35, clamp: 55,
}

const TOTAL = MODULES.flatMap(m => m.exports).reduce((a, e) => a + (SIZES[e] || 0), 0)

export default function TreeShakeVisualDemo() {
  const [used, setUsed] = useState<Set<string>>(() => new Set(['formatDate', 'validateEmail']))
  const [phase, setPhase] = useState<'idle' | 'shaking' | 'done'>('idle')
  const [fallen, setFallen] = useState<Set<string>>(new Set())
  const treeRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => {
    timersRef.current.forEach(t => clearTimeout(t))
  }, [])

  const toggle = useCallback((name: string) => {
    if (phase === 'shaking') return
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    setUsed(prev => {
      const n = new Set(prev)
      if (n.has(name)) { n.delete(name) } else { n.add(name) }
      return n
    })
    setFallen(new Set())
    setPhase('idle')
  }, [phase])

  const doShake = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    setFallen(new Set())
    setPhase('shaking')

    if (treeRef.current) {
      treeRef.current.animate([
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-3deg)' },
        { transform: 'rotate(3.5deg)' },
        { transform: 'rotate(-3deg)' },
        { transform: 'rotate(2.5deg)' },
        { transform: 'rotate(-2deg)' },
        { transform: 'rotate(1.5deg)' },
        { transform: 'rotate(-1deg)' },
        { transform: 'rotate(0.5deg)' },
        { transform: 'rotate(0deg)' },
      ], { duration: 800, easing: 'ease-in-out' })
    }

    const t1 = setTimeout(() => {
      const dead = new Set<string>()
      MODULES.forEach(m => m.exports.forEach(e => { if (!used.has(e)) dead.add(e) }))
      setFallen(dead)
      setPhase('done')
    }, 900)
    timersRef.current.push(t1)
  }, [used])

  const doReset = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    setUsed(new Set(['formatDate', 'validateEmail']))
    setFallen(new Set())
    setPhase('idle')
  }, [])

  const usedSize = useMemo(() =>
    MODULES.flatMap(m => m.exports).filter(e => used.has(e)).reduce((a, e) => a + (SIZES[e] || 0), 0),
    [used]
  )

  const saved = TOTAL - usedSize
  const isShaking = phase === 'shaking'
  const showResult = phase === 'done'

  return (
    <DemoBoundary name="Tree Shaking Visualizer">
      <div style={{
        maxWidth: 820,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: s.bg,
        color: s.text,
        padding: 24,
        borderRadius: 12,
        border: `1px solid ${s.border}`,
      }}>
        <div style={{ textAlign: 'center', fontSize: 12, color: s.text3, marginBottom: 16 }}>
          Click exports to toggle used / unused, then shake the tree
        </div>

        <div ref={treeRef} style={{ transformOrigin: 'top center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: s.bg2,
              border: `1.5px solid ${s.accent}`,
              borderRadius: 8,
              padding: '10px 28px',
              textAlign: 'center',
              minWidth: 200,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                color: s.bg, background: s.accent,
                padding: '2px 8px', borderRadius: 4,
                display: 'inline-block', marginBottom: 4,
              }}>ENTRY POINT</div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: s.mono }}>app.js</div>
              <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>src/app.js</div>
            </div>
          </div>

          <div style={{ position: 'relative', height: 36 }}>
            <div style={{
              position: 'absolute', top: 0, left: '50%',
              width: 1, height: 18, background: s.border2, transform: 'translateX(-50%)',
            }} />
            <div style={{
              position: 'absolute', top: 18, left: '16.67%', right: '16.67%',
              height: 1, background: s.border2,
            }} />
            {[16.67, 50, 83.33].map(p => (
              <div key={p} style={{
                position: 'absolute', top: 18, left: `${p}%`,
                width: 1, height: 18, background: s.border2, transform: 'translateX(-50%)',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {MODULES.filter(m => !m.isEntry).map(mod => (
              <div key={mod.id} style={{
                flex: 1, background: s.bg2,
                border: `1px solid ${s.border}`,
                borderRadius: 8, padding: '10px 12px',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, fontFamily: s.mono, marginBottom: 1 }}>
                  {mod.name}
                </div>
                <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, marginBottom: 8 }}>
                  {mod.path}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {mod.exports.map(exp => {
                    const u = used.has(exp)
                    const f = fallen.has(exp)
                    return (
                      <div
                        key={exp}
                        onClick={() => toggle(exp)}
                        style={{
                          fontSize: 10, fontFamily: s.mono,
                          padding: f ? '0 0' : '3px 7px',
                          borderRadius: 4,
                          cursor: isShaking ? 'default' : 'pointer',
                          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          opacity: f ? 0 : 1,
                          transform: f ? 'translateY(12px) scale(0.6)' : 'translateY(0) scale(1)',
                          maxHeight: f ? 0 : 40,
                          overflow: 'hidden',
                          background: u ? s.accent : s.bg3,
                          color: u ? s.bg : s.text3,
                          border: u ? 'none' : `1px solid ${s.border}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {exp}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <button onClick={doShake} disabled={isShaking} style={{
            padding: '8px 22px', fontSize: 13, fontWeight: 600,
            fontFamily: s.mono, border: 'none', borderRadius: 6,
            cursor: isShaking ? 'wait' : 'pointer',
            background: isShaking ? s.bg3 : s.accent,
            color: isShaking ? s.text3 : s.bg,
            transition: 'background 0.2s, color 0.2s',
          }}>Shake Tree</button>
          <button onClick={doReset} style={{
            padding: '8px 22px', fontSize: 13, fontWeight: 600,
            fontFamily: s.mono, border: `1px solid ${s.border}`, borderRadius: 6,
            cursor: 'pointer', background: s.bg2, color: s.text2,
          }}>Reset</button>
        </div>

        <div style={{
          marginTop: 20, padding: '14px 16px',
          background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`,
        }}>
          <div style={{
            fontSize: 11, color: s.text2, marginBottom: 12,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>Bundle Size</div>

          <div style={{ marginBottom: 10 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 11, fontFamily: s.mono, marginBottom: 4,
            }}>
              <span style={{ color: s.text3 }}>Without tree shaking</span>
              <span style={{ color: s.red }}>{TOTAL} B</span>
            </div>
            <div style={{ height: 10, background: s.bg3, borderRadius: 5, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: '100%',
                background: `linear-gradient(90deg, ${s.red}, ${s.orange})`,
                borderRadius: 5, opacity: 0.6,
              }} />
            </div>
          </div>

          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 11, fontFamily: s.mono, marginBottom: 4,
            }}>
              <span style={{ color: showResult ? s.green : s.text3 }}>With tree shaking</span>
              <span style={{ color: showResult ? s.green : s.text2 }}>
                {showResult ? usedSize : TOTAL} B
              </span>
            </div>
            <div style={{ height: 10, background: s.bg3, borderRadius: 5, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: showResult ? `${Math.max((usedSize / TOTAL) * 100, 2)}%` : '100%',
                background: showResult
                  ? `linear-gradient(90deg, ${s.green}, ${s.accent})`
                  : s.text3,
                borderRadius: 5,
                transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s ease',
              }} />
            </div>
          </div>

          {showResult && saved > 0 && (
            <div style={{
              marginTop: 12, fontSize: 12, color: s.green, fontFamily: s.mono,
              textAlign: 'center', padding: '8px 14px',
              background: 'rgba(61, 214, 140, 0.08)',
              borderRadius: 6, border: '1px solid rgba(61, 214, 140, 0.2)',
            }}>
              Removed {saved} B ({Math.round((saved / TOTAL) * 100)}% reduction)
            </div>
          )}
          {showResult && saved === 0 && (
            <div style={{
              marginTop: 12, fontSize: 12, color: s.accent, fontFamily: s.mono,
              textAlign: 'center', padding: '8px 14px',
              background: 'rgba(91, 141, 239, 0.08)',
              borderRadius: 6, border: '1px solid rgba(91, 141, 239, 0.2)',
            }}>
              All exports are used -- nothing to remove
            </div>
          )}
        </div>
      </div>
    </DemoBoundary>
  )
}
