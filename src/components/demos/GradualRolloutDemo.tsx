import { useState, useEffect, useCallback, useRef } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController from './SpeedController'
import { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const USERS = Array.from({ length: 100 }, (_, i) => ({
  id: `user_${String(i + 1).padStart(3, '0')}`,
  name: `User ${i + 1}`,
}))

function hashUserId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash) % 100
}

const userHashes = USERS.map(u => hashUserId(u.id))
const sortedHashes = [...userHashes].sort((a, b) => a - b)

export default function GradualRolloutDemo() {
  const [pct, setPct] = useState(0)
  const [day, setDay] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [targetPct, setTargetPct] = useState(50)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setPlaying(false)
  }, [])

  const start = useCallback(() => {
    if (playing) return
    setDay(1)
    setPct(0)
    setPlaying(true)
  }, [playing])

  useEffect(() => {
    if (!playing) return
    const delay = getStepDelay(800, speed)
    intervalRef.current = setInterval(() => {
      setDay(prev => prev + 1)
      setPct(prev => {
        const next = Math.min(prev + 5, targetPct)
        if (next >= targetPct) {
          stop()
        }
        return next
      })
    }, delay)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [playing, speed, targetPct, stop])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleSlider = (val: number) => {
    if (!playing) {
      setPct(val)
    }
    setTargetPct(val)
  }

  const enabled = pct > 0

  const enabledCount = userHashes.filter(h => h < pct).length

  return (
    <DemoBoundary name="Gradual Rollout">
      <div style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{
          background: s.bg2, borderRadius: 12, padding: '20px 24px',
          border: `1px solid ${s.border}`,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <div>
              <div style={{
                fontSize: 18, fontWeight: 700, color: s.text,
                letterSpacing: -0.3,
              }}>
                Gradual Rollout
              </div>
              <div style={{ color: s.text3, fontSize: 13, marginTop: 2 }}>
                {enabled ? `${pct}% rollout — ${enabledCount} of 100 users see the feature` : 'Drag slider or press play'}
              </div>
            </div>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
          }}>
            <input
              type="range" min={0} max={100} value={pct}
              onChange={e => handleSlider(Number(e.target.value))}
              style={{ flex: 1, accentColor: s.accent }}
            />
            <span style={{
              color: s.text, fontFamily: s.mono, fontSize: 16, fontWeight: 700,
              minWidth: 40, textAlign: 'right',
            }}>
              {pct}%
            </span>
          </div>

          <div style={{
            display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16,
            flexWrap: 'wrap',
          }}>
            <button
              onClick={playing ? stop : start}
              style={{
                background: playing ? s.red : s.accent,
                border: 'none', borderRadius: 8, padding: '8px 20px',
                color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              {playing ? 'Stop' : 'Animate Rollout'}
            </button>

            {playing && (
              <div style={{
                background: s.bg, borderRadius: 6, padding: '6px 14px',
                border: `1px solid ${s.border}`,
                fontFamily: s.mono, fontSize: 13, color: s.text2,
              }}>
                Day {day}
              </div>
            )}

            <div style={{
              background: s.bg3, borderRadius: 6, padding: '4px 10px',
              fontSize: 11, color: s.text3, fontFamily: s.mono,
            }}>
              target: {targetPct}%
            </div>
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column', gap: 4,
            background: s.bg, borderRadius: 8, padding: 12,
            border: `1px solid ${s.border}`,
            maxHeight: 300, overflowY: 'auto',
          }}>
            {USERS.map((u, i) => {
              const h = userHashes[i]
              const seesFeature = h < pct
              return (
                <div
                  key={u.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '3px 8px', borderRadius: 4,
                    background: seesFeature ? `${s.accent}12` : 'transparent',
                    transition: 'all 0.3s',
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: seesFeature ? s.green : s.bg3,
                    border: `1px solid ${seesFeature ? s.green : s.border}`,
                    transition: 'all 0.3s',
                  }} />
                  <span style={{
                    color: s.text3, fontFamily: s.mono, fontSize: 11,
                    minWidth: 60,
                  }}>
                    {u.id}
                  </span>
                  <div style={{
                    flex: 1, height: 3, background: s.bg3, borderRadius: 2,
                    position: 'relative', maxWidth: 80,
                  }}>
                    <div style={{
                      position: 'absolute', left: `${h}%`, top: -4,
                      width: 2, height: 11, background: s.border2, borderRadius: 1,
                    }} />
                  </div>
                  <span style={{
                    color: s.text3, fontFamily: s.mono, fontSize: 10,
                    minWidth: 30, textAlign: 'right',
                  }}>
                    {h}%
                  </span>
                  <span style={{
                    color: seesFeature ? s.green : s.red,
                    fontFamily: s.mono, fontSize: 11, fontWeight: 600,
                    minWidth: 40, textAlign: 'right',
                  }}>
                    {seesFeature ? 'ON' : 'OFF'}
                  </span>
                </div>
              )
            })}
          </div>

          <div style={{
            marginTop: 16, display: 'flex', gap: 16,
            flexWrap: 'wrap',
          }}>
            <div style={{
              background: s.bg, borderRadius: 8, padding: '8px 14px',
              border: `1px solid ${s.border}`, flex: 1, textAlign: 'center',
            }}>
              <div style={{ color: s.green, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>
                {enabledCount}
              </div>
              <div style={{ color: s.text3, fontSize: 11 }}>Enabled</div>
            </div>
            <div style={{
              background: s.bg, borderRadius: 8, padding: '8px 14px',
              border: `1px solid ${s.border}`, flex: 1, textAlign: 'center',
            }}>
              <div style={{ color: s.red, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>
                {100 - enabledCount}
              </div>
              <div style={{ color: s.text3, fontSize: 11 }}>Disabled</div>
            </div>
            <div style={{
              background: s.bg, borderRadius: 8, padding: '8px 14px',
              border: `1px solid ${s.border}`, flex: 1, textAlign: 'center',
            }}>
              <div style={{ color: s.yellow, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>
                {pct}%
              </div>
              <div style={{ color: s.text3, fontSize: 11 }}>Threshold</div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
