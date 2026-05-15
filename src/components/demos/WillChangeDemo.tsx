import { useState, useEffect, useRef, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const ANIM_DURATION = 2000
const TRAVEL = 300

const FRAME_SIM: Record<string, { avg: number; desc: string }> = {
  'none-left': { avg: 24, desc: 'Triggers layout + paint + composite. No layer isolation means every frame recalculates geometry.' },
  'will-left': { avg: 18, desc: 'Separate layer helps composite but left still triggers layout. Partial improvement.' },
  'none-transform': { avg: 10, desc: 'Transform avoids layout but no dedicated layer means paint still happens on the main thread.' },
  'will-transform': { avg: 3, desc: 'Dedicated compositor layer. Transform only composites. No layout, no paint. Smooth 60fps.' },
}

function simulateAvg(willChange: boolean, useTransform: boolean): number {
  const key = `${willChange ? 'will' : 'none'}-${useTransform ? 'transform' : 'left'}`
  return FRAME_SIM[key].avg
}

function simulateDesc(willChange: boolean, useTransform: boolean): string {
  const key = `${willChange ? 'will' : 'none'}-${useTransform ? 'transform' : 'left'}`
  return FRAME_SIM[key].desc
}

export default function WillChangeDemo() {
  const [willChange, setWillChange] = useState(false)
  const [useTransform, setUseTransform] = useState(true)
  const [animating, setAnimating] = useState(false)
  const [avgFrameTime, setAvgFrameTime] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const frameTimesRef = useRef<number[]>([])
  const rafRef = useRef<number>(0)
  const startRef = useRef(0)
  const runningRef = useRef(false)

  const startAnimation = useCallback(() => {
    if (!boxRef.current) return
    runningRef.current = true
    frameTimesRef.current = []
    setAvgFrameTime(0)
    const box = boxRef.current
    let lastTime = 0
    startRef.current = performance.now()

    const tick = (now: number) => {
      if (!runningRef.current) return
      const elapsed = now - startRef.current
      const cycle = (elapsed % ANIM_DURATION) / ANIM_DURATION
      const pos = Math.sin(cycle * Math.PI * 2) * 0.5 + 0.5

      if (useTransform) {
        box.style.transform = `translateX(${pos * TRAVEL}px)`
      } else {
        box.style.left = `${pos * TRAVEL}px`
      }

      if (lastTime > 0) {
        const dt = now - lastTime
        frameTimesRef.current.push(dt)
        if (frameTimesRef.current.length > 60) {
          frameTimesRef.current.shift()
        }
        if (frameTimesRef.current.length % 10 === 0) {
          const sum = frameTimesRef.current.reduce((a, b) => a + b, 0)
          setAvgFrameTime(sum / frameTimesRef.current.length)
        }
      }
      lastTime = now
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [useTransform])

  const stopAnimation = useCallback(() => {
    runningRef.current = false
    cancelAnimationFrame(rafRef.current)
    if (boxRef.current) {
      boxRef.current.style.transform = 'translateX(0px)'
      boxRef.current.style.left = '0px'
    }
  }, [])

  useEffect(() => {
    return () => {
      runningRef.current = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    if (animating) {
      startAnimation()
    } else {
      stopAnimation()
    }
  }, [animating, startAnimation, stopAnimation])

  const toggleAnimating = useCallback(() => {
    if (animating) {
      setAnimating(false)
    } else {
      setAvgFrameTime(0)
      frameTimesRef.current = []
      setAnimating(true)
    }
  }, [animating])

  const simAvg = avgFrameTime > 0 ? avgFrameTime : simulateAvg(willChange, useTransform)
  const fps = simAvg > 0 ? Math.round(1000 / simAvg) : 0
  const isJanky = fps < 50
  const desc = simulateDesc(willChange, useTransform)

  return (
    <DemoBoundary name="Will Change">
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
          Will Change & Compositor Layers
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>will-change</div>
            <button onClick={() => setWillChange(!willChange)} style={{
              padding: '6px 14px', borderRadius: 6, border: `1px solid ${willChange ? s.accent : s.border}`,
              background: willChange ? `${s.accent}18` : s.bg, color: willChange ? s.accent : s.text2,
              fontSize: 12, cursor: 'pointer', fontWeight: 600, transition: 'all .15s',
            }}>{willChange ? 'will-change: transform' : 'none'}</button>
          </div>

          <div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Animation Property</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['transform', 'left'] as const).map(prop => (
                <button key={prop} onClick={() => setUseTransform(prop === 'transform')} style={{
                  padding: '6px 12px', borderRadius: 6, border: `1px solid ${useTransform === (prop === 'transform') ? s.accent : s.border}`,
                  background: useTransform === (prop === 'transform') ? `${s.accent}18` : s.bg,
                  color: useTransform === (prop === 'transform') ? s.accent : s.text2,
                  fontSize: 12, cursor: 'pointer', fontWeight: useTransform === (prop === 'transform') ? 600 : 400,
                  transition: 'all .15s',
                }}>animating {prop}</button>
              ))}
            </div>
          </div>

          <button onClick={toggleAnimating} style={{
            padding: '8px 20px', borderRadius: 6, border: 'none',
            background: animating ? s.red : s.green, color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background .2s',
          }}>{animating ? 'Stop' : 'Animate'}</button>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: 12, padding: 16, height: 160, position: 'relative',
              overflow: 'hidden',
            }}>
              {willChange && (
                <div style={{
                  position: 'absolute', inset: 0, border: `2px dashed ${s.accent}`,
                  borderRadius: 12, opacity: 0.3, pointerEvents: 'none', zIndex: 0,
                }} />
              )}
              <div ref={boxRef} style={{
                width: 60, height: 60, borderRadius: 8,
                background: `linear-gradient(135deg, ${s.accent}, ${s.purple})`,
                position: useTransform ? 'relative' : 'absolute',
                left: 0, top: 50,
                willChange: willChange ? 'transform' : 'auto',
                transition: animating ? 'none' : 'all 0.3s',
                zIndex: 1,
                boxShadow: willChange ? `0 4px 20px ${s.accent}44` : 'none',
              }} />
              <div style={{
                position: 'absolute', bottom: 6, left: 12, right: 12,
                display: 'flex', justifyContent: 'space-between',
                color: s.text3, fontSize: 9, fontFamily: s.mono,
              }}>
                <span>0px</span>
                <span>{TRAVEL}px</span>
              </div>
            </div>
          </div>

          <div style={{ minWidth: 180 }}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Frame Timing</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: s.mono, fontSize: 24, fontWeight: 700, color: isJanky ? s.red : s.green }}>
                  {Math.round(simAvg)}
                </span>
                <span style={{ color: s.text3, fontSize: 11 }}>ms / frame</span>
              </div>
              <div style={{
                fontFamily: s.mono, fontSize: 14, fontWeight: 700, color: fps >= 60 ? s.green : s.red, marginTop: 4,
              }}>
                {fps} FPS
              </div>
              {isJanky && (
                <div style={{ color: s.red, fontSize: 11, marginTop: 4 }}>Jank detected</div>
              )}
            </div>

            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: willChange ? s.accent : s.text3 }} />
                <span style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Layer</span>
              </div>
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                position: 'relative',
              }}>
                {!willChange && (
                  <>
                    <div style={{
                      padding: '8px 10px', background: s.bg2, borderRadius: 6,
                      border: `1px solid ${s.border}`, fontSize: 11, color: s.text2,
                    }}>
                      Normal Flow Layer
                    </div>
                    <div style={{
                      padding: '8px 10px', background: s.bg2, borderRadius: 6,
                      border: `1px solid ${s.accent}44`, fontSize: 11, color: s.accent,
                      marginLeft: 20, position: 'relative',
                    }}>
                      <span style={{ fontSize: 10 }}>Animated Box (in flow)</span>
                    </div>
                  </>
                )}
                {willChange && (
                  <>
                    <div style={{
                      padding: '8px 10px', background: s.bg2, borderRadius: 6,
                      border: `1px solid ${s.border}`, fontSize: 11, color: s.text3,
                    }}>
                      Normal Flow Layer
                    </div>
                    <div style={{
                      padding: '8px 10px', background: s.bg2, borderRadius: 6,
                      border: `2px solid ${s.accent}66`, fontSize: 11, color: s.accent,
                      marginLeft: 20,
                    }}>
                      Compositor Layer
                    </div>
                    <div style={{
                      padding: '8px 10px', background: `${s.accent}12`, borderRadius: 6,
                      border: `1px solid ${s.accent}44`, fontSize: 11, color: s.accent,
                      marginLeft: 40, fontWeight: 600,
                    }}>
                      Animated Box (isolated)
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          padding: '12px 16px', background: s.bg, borderRadius: 8,
          border: `1px solid ${s.border2}`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: s.text2, marginBottom: 6 }}>Diagnosis</div>
          <div style={{ fontSize: 12, color: s.text3, lineHeight: 1.6 }}>{desc}</div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
