import { useState, useEffect, useRef } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

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

interface Phase {
  label: string
  color: string
  duration: number
}

const phases: Phase[] = [
  { label: 'TTFB', color: s.purple, duration: 800 },
  { label: 'FCP', color: s.yellow, duration: 600 },
  { label: 'LCP', color: s.green, duration: 1000 },
]

interface PageElement {
  id: string
  label: string
  delay: number
  size: number
  isLcpCandidate: boolean
}

const baseElements: PageElement[] = [
  { id: 'nav', label: 'Nav Bar', delay: 100, size: 60, isLcpCandidate: false },
  { id: 'text', label: 'Text Block', delay: 300, size: 120, isLcpCandidate: false },
  { id: 'sidebar', label: 'Sidebar', delay: 500, size: 200, isLcpCandidate: false },
  { id: 'hero', label: 'Hero Image', delay: 900, size: 280, isLcpCandidate: true },
  { id: 'footer', label: 'Footer', delay: 1100, size: 80, isLcpCandidate: false },
]

const optimizations = [
  { id: 'none', label: 'No Optimizations', heroDelay: 900, heroSize: 280, ttfb: 800 },
  { id: 'preload', label: 'Preload Hero', heroDelay: 400, heroSize: 280, ttfb: 700 },
  { id: 'responsive', label: 'Responsive Images', heroDelay: 600, heroSize: 180, ttfb: 650 },
  { id: 'cdn', label: 'CDN + Preload', heroDelay: 250, heroSize: 180, ttfb: 400 },
]

export default function PerfLcpDemo() {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [phaseIdx, setPhaseIdx] = useState(-1)
  const [visibleElements, setVisibleElements] = useState<string[]>([])
  const [currentLcp, setCurrentLcp] = useState<string | null>(null)
  const [finalLcp, setFinalLcp] = useState<string | null>(null)
  const [optimization, setOptimization] = useState(0)
  const [speed, setSpeed] = useState(1)
  const timerRef = useRef<number>(0)
  const startRef = useRef(0)

  const opt = optimizations[optimization]
  const elements = baseElements.map(el =>
    el.id === 'hero'
      ? { ...el, delay: opt.heroDelay, size: opt.heroSize }
      : el
  )

  const totalDuration = opt.ttfb + 1200

  useEffect(() => {
    if (!running) return
    startRef.current = Date.now()
    setProgress(0)
    setPhaseIdx(-1)
    setVisibleElements([])
    setCurrentLcp(null)
    setFinalLcp(null)

    const tick = () => {
      const elapsed = Date.now() - startRef.current
      const adjElapsed = elapsed / speed
      const pct = Math.min(adjElapsed / totalDuration, 1)
      setProgress(pct)

      let currentPhase = -1
      let cumTime = 0
      for (let i = 0; i < phases.length; i++) {
        cumTime += phases[i].duration / speed
        if (adjElapsed >= cumTime) currentPhase = i
        else break
      }
      setPhaseIdx(currentPhase)

      const visible: string[] = []
      let lcp: string | null = null
      for (const el of elements) {
        if (adjElapsed >= el.delay / speed) {
          visible.push(el.id)
          if (el.isLcpCandidate) lcp = el.id
        }
      }
      setVisibleElements(visible)
      if (lcp && lcp !== currentLcp) setCurrentLcp(lcp)

      if (pct >= 1) {
        setRunning(false)
        setFinalLcp(currentLcp || 'hero')
        return
      }
      timerRef.current = window.setTimeout(tick, 50)
    }

    timerRef.current = window.setTimeout(tick, 50)
    return () => clearTimeout(timerRef.current)
  }, [running, speed, opt])

  const reset = () => {
    clearTimeout(timerRef.current)
    setRunning(false)
    setProgress(0)
    setPhaseIdx(-1)
    setVisibleElements([])
    setCurrentLcp(null)
    setFinalLcp(null)
  }

  const timelineWidth = 600

  return (
    <DemoBoundary name="Largest Contentful Paint">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Largest Contentful Paint</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {optimizations.map((o, i) => (
            <button key={o.id} onClick={() => { reset(); setOptimization(i) }} style={{
              background: optimization === i ? s.accent : s.bg3,
              border: `1px solid ${optimization === i ? s.accent : s.border}`,
              borderRadius: 8, padding: '6px 14px',
              color: optimization === i ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 12, fontWeight: optimization === i ? 600 : 400,
            }}>{o.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 24, marginBottom: 20, alignItems: 'flex-start' }}>
          <div style={{
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12,
            width: 320, minHeight: 420, padding: 12, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Page Viewport</div>

            <div style={{
              transition: 'all 0.3s', opacity: '1',
            }}>
              {elements.map(el => (
                <div key={el.id} style={{
                  height: el.size * 0.6,
                  background: visibleElements.includes(el.id) ? (
                    el.isLcpCandidate && currentLcp === el.id ? `${s.green}25` : s.bg3
                  ) : s.bg3,
                  border: `1px solid ${
                    visibleElements.includes(el.id) && el.isLcpCandidate && currentLcp === el.id
                      ? s.green
                      : visibleElements.includes(el.id)
                        ? s.border
                        : 'transparent'
                  }`,
                  borderRadius: 8, marginBottom: 6, padding: '6px 10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                  opacity: visibleElements.includes(el.id) ? 1 : 0.15,
                }}>
                  <span style={{
                    color: el.isLcpCandidate && currentLcp === el.id ? s.green : s.text3,
                    fontSize: 11, fontFamily: s.mono,
                  }}>
                    {el.label}
                    {el.isLcpCandidate && currentLcp === el.id && ' [LCP]'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: s.text2, fontSize: 12, marginBottom: 6 }}>Page Load Timeline</div>

              <div style={{ position: 'relative', height: 40, marginBottom: 8 }}>
                <div style={{ position: 'absolute', top: 14, left: 0, right: 0, height: 12, background: s.bg3, borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress * 100}%`, background: `linear-gradient(90deg, ${s.purple}, ${s.yellow}, ${s.green})`, borderRadius: 6, transition: 'width 0.1s' }} />
                </div>

                {(() => {
                  let cum = 0
                  return phases.map((ph, i) => {
                    const startPct = cum / totalDuration
                    cum += ph.duration / speed
                    const endPct = cum / totalDuration
                    const isActive = phaseIdx >= i
                    return (
                      <div key={ph.label} style={{
                        position: 'absolute', top: 30,
                        left: `${startPct * 100}%`,
                        fontSize: 9, color: isActive ? ph.color : s.text3,
                        fontFamily: s.mono, whiteSpace: 'nowrap',
                        transform: i === 2 ? 'translateX(-100%)' : 'none',
                      }}>
                        {ph.label}
                      </div>
                    )
                  })
                })()}
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 12px', flex: 1, minWidth: 100 }}>
                  <div style={{ color: s.text3, fontSize: 10, marginBottom: 2 }}>TTFB</div>
                  <div style={{ color: phaseIdx >= 0 ? s.purple : s.text3, fontFamily: s.mono, fontSize: 16, fontWeight: 700 }}>
                    {progress > 0 ? Math.round((opt.ttfb) * (1 - Math.max(0, 1 - progress * 1.2))) : '-'}ms
                  </div>
                </div>
                <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 12px', flex: 1, minWidth: 100 }}>
                  <div style={{ color: s.text3, fontSize: 10, marginBottom: 2 }}>LCP</div>
                  <div style={{ color: finalLcp ? s.green : currentLcp ? s.yellow : s.text3, fontFamily: s.mono, fontSize: 16, fontWeight: 700 }}>
                    {finalLcp ? `${Math.round(opt.ttfb + opt.heroDelay)}ms` : currentLcp ? 'detecting...' : '-'}
                  </div>
                </div>
                <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 12px', flex: 1, minWidth: 100 }}>
                  <div style={{ color: s.text3, fontSize: 10, marginBottom: 2 }}>Status</div>
                  <div style={{ color: finalLcp ? s.green : running ? s.yellow : s.text3, fontFamily: s.mono, fontSize: 13, fontWeight: 600 }}>
                    {finalLcp ? `${Math.round(opt.ttfb + opt.heroDelay)}ms LCP` : running ? 'Loading...' : 'Ready'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {!running ? (
                <button onClick={() => setRunning(true)} style={{
                  background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
                  color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}>{progress > 0 ? 'Re-run' : 'Run Load'}</button>
              ) : null}
              <button onClick={reset} style={{
                background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
                color: s.text2, cursor: 'pointer', fontSize: 13,
              }}>Reset</button>
              <SpeedController speed={speed} onSpeedChange={setSpeed} />
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>LCP Optimization Guide</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Preload', desc: `Hero image loaded at ${opt.heroDelay}ms — ${optimization >= 1 ? 'preloaded' : 'discovered late'}`, color: s.accent },
              { label: 'Responsive', desc: `Image size ${opt.heroSize}px — ${optimization >= 2 ? 'responsive images serving smaller file' : 'full size image loaded'}`, color: s.green },
              { label: 'CDN', desc: `TTFB ${opt.ttfb}ms — ${optimization >= 3 ? 'CDN edge caching reduces latency' : 'origin server serves directly'}`, color: s.orange },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 70 }}>{item.label}</span>
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
