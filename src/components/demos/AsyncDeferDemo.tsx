import { useState, useEffect, useRef, useCallback } from 'react'
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

const W = 620
const T_MAX = 520

interface Segment {
  label: string
  start: number
  end: number
  color: string
}

interface Marker {
  label: string
  time: number
  color: string
}

interface Scenario {
  name: string
  color: string
  segments: Segment[]
  markers: Marker[]
  dclTime: number
  loadTime: number
}

function buildScenarios(): Scenario[] {
  const normal: Scenario = {
    name: 'Normal <script>',
    color: s.red,
    segments: [
      { label: 'HTML Parsing', start: 0, end: 60, color: s.accent },
      { label: 'Paused', start: 60, end: 360, color: s.text3 },
      { label: 'Script Load', start: 60, end: 310, color: s.orange },
      { label: 'Script Exec', start: 310, end: 360, color: s.red },
      { label: 'HTML Resume', start: 360, end: 420, color: s.accent },
    ],
    markers: [
      { label: 'DOMContentLoaded', time: 420, color: s.green },
      { label: 'Load', time: 500, color: s.yellow },
    ],
    dclTime: 420,
    loadTime: 500,
  }

  const asyncScript: Scenario = {
    name: '<script async>',
    color: s.green,
    segments: [
      { label: 'HTML Parsing', start: 0, end: 100, color: s.accent },
      { label: 'Script Load', start: 60, end: 250, color: s.green },
      { label: 'Script Exec', start: 250, end: 280, color: s.yellow },
    ],
    markers: [
      { label: 'DOMContentLoaded', time: 280, color: s.green },
      { label: 'Load', time: 500, color: s.yellow },
    ],
    dclTime: 280,
    loadTime: 500,
  }

  const defer: Scenario = {
    name: '<script defer>',
    color: s.green,
    segments: [
      { label: 'HTML Parsing', start: 0, end: 100, color: s.accent },
      { label: 'Script Load', start: 60, end: 250, color: s.green },
      { label: 'Script Exec', start: 100, end: 130, color: s.yellow },
    ],
    markers: [
      { label: 'DOMContentLoaded', time: 130, color: s.green },
      { label: 'Load', time: 500, color: s.yellow },
    ],
    dclTime: 130,
    loadTime: 500,
  }

  return [normal, asyncScript, defer]
}

const SCENARIOS = buildScenarios()

function fastestIdx(): number {
  let min = Infinity
  let idx = 0
  for (let i = 0; i < SCENARIOS.length; i++) {
    if (SCENARIOS[i].dclTime < min) {
      min = SCENARIOS[i].dclTime
      idx = i
    }
  }
  return idx
}

const FASTEST = fastestIdx()

const LBLS = [0, 100, 200, 300, 400, 500]

export default function AsyncDeferDemo() {
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const progRef = useRef(0)

  useEffect(() => {
    if (!playing) return
    if (progRef.current >= T_MAX) {
      setPlaying(false)
      return
    }
    const interval = setInterval(() => {
      progRef.current = Math.min(progRef.current + 5, T_MAX)
      setProgress(progRef.current)
      if (progRef.current >= T_MAX) {
        setPlaying(false)
      }
    }, getStepDelay(30, speed))
    return () => clearInterval(interval)
  }, [playing, speed])

  const togglePlay = useCallback(() => {
    if (progress >= T_MAX) {
      progRef.current = 0
      setProgress(0)
    }
    setPlaying(prev => !prev)
  }, [progress])

  const handleReset = useCallback(() => {
    setPlaying(false)
    progRef.current = 0
    setProgress(0)
  }, [])

  const x = (ms: number) => (ms / T_MAX) * W

  return (
    <DemoBoundary name="Async vs Defer">
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, letterSpacing: -0.3 }}>
            Async vs Defer
          </div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button onClick={togglePlay} style={{
            padding: '8px 20px', borderRadius: 6, border: 'none',
            background: playing ? s.red : s.green, color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background .2s',
          }}>{playing ? 'Stop' : progress >= T_MAX ? 'Replay' : 'Play'}</button>
          <button onClick={handleReset} style={{
            padding: '8px 20px', borderRadius: 6, border: `1px solid ${s.border}`,
            background: s.bg, color: s.text2, fontSize: 13, cursor: 'pointer',
          }}>Reset</button>
        </div>

        <div style={{ overflow: 'hidden' }}>
          {SCENARIOS.map((scenario, si) => {
            const isFastest = si === FASTEST
            return (
              <div key={scenario.name} style={{ marginBottom: si < SCENARIOS.length - 1 ? 28 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.text }}>{scenario.name}</span>
                  {isFastest && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#fff', background: s.green,
                      padding: '2px 8px', borderRadius: 4, fontFamily: s.mono,
                    }}>FASTEST</span>
                  )}
                  <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono, marginLeft: 'auto' }}>
                    DCL: {scenario.dclTime}ms | Load: {scenario.loadTime}ms
                  </span>
                </div>

                <div style={{ position: 'relative', width: W, height: 40, overflow: 'hidden' }}>
                  {LBLS.map(t => (
                    <div key={t} style={{
                      position: 'absolute', left: x(t), top: 0, bottom: 0,
                      borderLeft: `1px solid ${s.border}`,
                      opacity: 0.3,
                    }} />
                  ))}

                  {LBLS.filter(t => t % 200 === 0).map(t => (
                    <div key={`lb-${t}`} style={{
                      position: 'absolute', left: x(t) - 12, top: -2,
                      color: s.text3, fontSize: 9, fontFamily: s.mono, width: 24, textAlign: 'center',
                    }}>{t}ms</div>
                  ))}

                  {scenario.segments.map(seg => {
                    const left = x(seg.start)
                    const segW = x(seg.end) - x(seg.start)
                    const visiblePct = progress < seg.start ? 0 : progress >= seg.end ? 1 : (progress - seg.start) / (seg.end - seg.start)
                    if (visiblePct === 0) return null
                    return (
                      <div key={seg.label} style={{
                        position: 'absolute', left, top: 12, width: segW * visiblePct,
                        height: 22, background: seg.color, borderRadius: 4,
                        transition: 'width 0.05s linear', opacity: 0.9,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 600, color: '#fff',
                        overflow: 'hidden', whiteSpace: 'nowrap',
                      }}>
                        {segW * visiblePct > 50 ? seg.label : ''}
                      </div>
                    )
                  })}

                  {scenario.markers.map(marker => {
                    if (progress < marker.time) return null
                    return (
                      <div key={marker.label} style={{
                        position: 'absolute', left: x(marker.time) - 1, top: 0, bottom: 0,
                        width: 2, background: marker.color, zIndex: 3,
                      }}>
                        <div style={{
                          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                          background: marker.color, color: '#000', fontSize: 8, fontWeight: 700,
                          padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap', fontFamily: s.mono,
                        }}>{marker.label}</div>
                      </div>
                    )
                  })}

                  {progress > 0 && (
                    <div style={{
                      position: 'absolute', left: x(progress) - 1, top: 0, bottom: 0,
                      width: 2, background: s.yellow, zIndex: 4, opacity: 0.7,
                    }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 18, padding: '12px 16px', background: s.bg, borderRadius: 8, border: `1px solid ${s.border2}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: s.text2, marginBottom: 6 }}>How It Works</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 11, color: s.text3, lineHeight: 1.6 }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <span style={{ color: s.accent, fontWeight: 600 }}>Normal</span>: HTML parsing pauses. Script loads and executes synchronously. DOMContentLoaded waits for all scripts.
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <span style={{ color: s.green, fontWeight: 600 }}>Async</span>: Script loads in parallel. Executes as soon as ready. May interrupt parsing. DCL waits for async scripts.
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <span style={{ color: s.yellow, fontWeight: 600 }}>Defer</span>: Script loads in parallel. Executes after parsing. Guarantees order. DCL fires after deferred scripts.
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
