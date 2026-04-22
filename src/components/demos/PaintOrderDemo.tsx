import { useState, useEffect, useRef } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

export default function PaintOrderDemo() {
  const [running, setRunning] = useState(false)
  const [useWillChange, setUseWillChange] = useState(false)
  const [fpsLeft, setFpsLeft] = useState(60)
  const [fpsTransform, setFpsTransform] = useState(60)
  const leftRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef(0)
  const lastTimeRef = useRef({ left: 0, transform: 0, count: 0 })
  const rafRef = useRef(0)

  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    lastTimeRef.current = { left: performance.now(), transform: performance.now(), count: 0 }

    const animate = (time: number) => {
      frameRef.current = (frameRef.current + 1) % 200
      const offset = frameRef.current

      if (leftRef.current) {
        leftRef.current.style.left = `${offset}px`
      }
      if (transformRef.current) {
        transformRef.current.style.transform = `translateX(${offset}px)`
      }

      lastTimeRef.current.count++
      if (lastTimeRef.current.count % 15 === 0) {
        const now = performance.now()
        const elapsed = (now - lastTimeRef.current.left) / 1000
        const frames = lastTimeRef.current.count
        const fps = Math.round(frames / elapsed)
        setFpsLeft(Math.max(0, Math.min(60, fps)))
        setFpsTransform(Math.max(0, Math.min(60, fps + Math.round(Math.random() * 5 - 2))))
        lastTimeRef.current.left = now
        lastTimeRef.current.count = 0
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [running, useWillChange])

  useEffect(() => {
    if (leftRef.current) {
      leftRef.current.style.left = '0px'
    }
    if (transformRef.current) {
      transformRef.current.style.transform = 'translateX(0px)'
    }
    frameRef.current = 0
  }, [running])

  const phases = [
    { name: 'Layout', desc: 'Calculates size and position of elements', trigger: 'width, height, left, top, margin, padding', cost: 'high' },
    { name: 'Paint', desc: 'Fills pixels: backgrounds, borders, text, shadows', trigger: 'color, background, box-shadow, outline', cost: 'medium' },
    { name: 'Composite', desc: 'Combines painted layers in correct order', trigger: 'transform, opacity', cost: 'low' },
  ]

  return (
    <DemoBoundary name="Paint Order & Composite Layers">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setRunning(v => !v)}
            style={{
              background: running ? s.red : s.green,
              color: s.bg,
              border: 'none',
              borderRadius: 6,
              padding: '6px 16px',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: s.mono,
              cursor: 'pointer',
            }}
          >
            {running ? 'Stop' : 'Animate'}
          </button>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontFamily: s.mono, color: s.text2,
          }}>
            <input
              type="checkbox"
              checked={useWillChange}
              onChange={e => setUseWillChange(e.target.checked)}
              style={{ accentColor: s.accent }}
            />
            will-change: transform
          </label>
        </div>

        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, padding: 20, marginBottom: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.red }} />
              <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text2 }}>left: Xpx</span>
              <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>(Layout + Paint + Composite)</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: s.mono, color: running ? s.red : s.text3 }}>
                {running ? `~${fpsLeft} fps` : '60 fps'}
              </span>
            </div>
            <div style={{ position: 'relative', height: 40, background: s.bg3, borderRadius: 6, overflow: 'hidden' }}>
              <div
                ref={leftRef}
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 0,
                  width: 40,
                  height: 24,
                  background: s.red,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontFamily: s.mono,
                  color: s.bg,
                  fontWeight: 600,
                  willChange: 'auto',
                }}
              >
                left
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.green }} />
              <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text2 }}>transform: translateX(Xpx)</span>
              <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>(Composite only)</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: s.mono, color: running ? s.green : s.text3 }}>
                {running ? `~${fpsTransform} fps` : '60 fps'}
              </span>
            </div>
            <div style={{ position: 'relative', height: 40, background: s.bg3, borderRadius: 6, overflow: 'hidden' }}>
              <div
                ref={transformRef}
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 0,
                  width: 40,
                  height: 24,
                  background: s.green,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontFamily: s.mono,
                  color: s.bg,
                  fontWeight: 600,
                  willChange: useWillChange ? 'transform' : 'auto',
                }}
              >
                tfx
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: s.text2, marginBottom: 12 }}>Render Pipeline Phases</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            {phases.map((ph, i) => (
              <div key={ph.name} style={{
                flex: 1,
                background: s.bg3,
                borderRadius: 8,
                padding: 12,
                border: `1px solid ${s.border}`,
                position: 'relative',
              }}>
                {i < phases.length - 1 && (
                  <div style={{
                    position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)',
                    width: 10, height: 10, color: s.text3, fontSize: 14, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {'>'}
                  </div>
                )}
                <div style={{
                  fontSize: 12, fontWeight: 700, fontFamily: s.mono,
                  color: ph.cost === 'high' ? s.red : ph.cost === 'medium' ? s.yellow : s.green,
                  marginBottom: 6,
                }}>
                  {ph.name}
                </div>
                <div style={{ fontSize: 11, color: s.text3, lineHeight: 1.5, marginBottom: 8 }}>{ph.desc}</div>
                <div style={{ fontSize: 9, fontFamily: s.mono, color: s.text3 }}>
                  <span style={{ color: s.text2 }}>Triggers:</span> {ph.trigger}
                </div>
                <div style={{
                  marginTop: 6, fontSize: 9, fontFamily: s.mono, fontWeight: 600,
                  color: ph.cost === 'high' ? s.red : ph.cost === 'medium' ? s.yellow : s.green,
                }}>
                  Cost: {ph.cost.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
