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

const libraries = [
  { name: 'lodash-es', full: 72, shaken: 3, note: 'Using 2 utilities' },
  { name: 'date-fns', full: 58, shaken: 5, note: 'Using 3 formatters' },
  { name: 'RxJS', full: 34, shaken: 8, note: 'Using 3 operators' },
  { name: '@mui/material', full: 85, shaken: 42, note: 'Using 5 components' },
  { name: 'three.js', full: 160, shaken: 65, note: 'Using Scene + WebGLRenderer' },
  { name: 'd3', full: 95, shaken: 12, note: 'Using 2 scales + axis' },
]

const maxVal = Math.max(...libraries.map(l => l.full))

function AnimatedNumber({ target, duration = 600 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(target)
  const prevTarget = useRef(target)

  useEffect(() => {
    const start = prevTarget.current
    const diff = target - start
    if (diff === 0) return

    const startTime = performance.now()
    let raf: number

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(start + diff * eased))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        prevTarget.current = target
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  useEffect(() => {
    prevTarget.current = target
  }, [target])

  return <span>{current}</span>
}

export default function BundleImpactDemo() {
  const [showShaking, setShowShaking] = useState(false)

  const totalFull = libraries.reduce((sum, l) => sum + l.full, 0)
  const totalShaken = libraries.reduce((sum, l) => sum + l.shaken, 0)
  const totalSaved = totalFull - totalShaken
  const totalPct = Math.round((totalSaved / totalFull) * 100)

  return (
    <DemoBoundary name="Bundle Size Impact">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: s.bg, borderRadius: 12, border: `1px solid ${s.border}`, padding: '28px 32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 4 }}>
              Real-World Bundle Size Impact
            </div>
            <div style={{ fontSize: 13, color: s.text3 }}>
              Gzipped sizes (KB) for common import patterns
            </div>
          </div>
          <button
            onClick={() => setShowShaking(v => !v)}
            style={{
              background: showShaking ? s.green : s.bg3,
              color: showShaking ? '#0a0c0f' : s.text2,
              border: `1px solid ${showShaking ? s.green : s.border}`,
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              transition: 'all 0.25s ease',
              letterSpacing: 0.2,
            }}
          >
            {showShaking ? 'Hide tree shaking' : 'Show tree shaking'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 8, paddingLeft: 160 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: s.text3 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.red, opacity: 0.7 }} />
            Full bundle
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: s.text3, opacity: showShaking ? 1 : 0.3, transition: 'opacity 0.3s' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.green }} />
            Tree-shaken
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          {libraries.map((lib, i) => {
            const fullPct = (lib.full / maxVal) * 100
            const shakenPct = (lib.shaken / maxVal) * 100
            const savedPct = Math.round(((lib.full - lib.shaken) / lib.full) * 100)

            return (
              <div key={lib.name} style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: i < libraries.length - 1 ? 12 : 0,
                position: 'relative',
              }}>
                <div style={{
                  width: 148,
                  flexShrink: 0,
                  fontFamily: s.mono,
                  fontSize: 13,
                  color: s.text,
                  textAlign: 'right',
                  paddingRight: 16,
                  lineHeight: 1.2,
                }}>
                  {lib.name}
                </div>

                <div style={{
                  flex: 1,
                  position: 'relative',
                  height: 38,
                  background: `repeating-linear-gradient(0deg, transparent, transparent 18px, ${s.bg2} 18px, ${s.bg2} 19px)`,
                  borderRadius: 6,
                  overflow: 'hidden',
                  display: 'flex',
                  gap: 3,
                  alignItems: 'center',
                  padding: '0 4px',
                }}>
                  <div style={{
                    height: 22,
                    width: showShaking ? `${Math.max(fullPct, 8)}%` : `${fullPct}%`,
                    minWidth: showShaking ? 36 : 0,
                    maxWidth: '100%',
                    background: showShaking
                      ? `rgba(232, 93, 93, 0.25)`
                      : `rgba(232, 93, 93, 0.85)`,
                    borderRadius: 4,
                    transition: 'width 0.6s cubic-bezier(0.25, 1, 0.5, 1), background 0.4s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: showShaking ? 'rgba(232, 93, 93, 0.7)' : '#fff',
                      fontFamily: s.mono,
                      whiteSpace: 'nowrap',
                      transition: 'color 0.3s',
                    }}>
                      {lib.full} KB
                    </span>
                  </div>

                  <div style={{
                    height: 22,
                    width: showShaking ? `${Math.max(shakenPct, 8)}%` : '0%',
                    minWidth: 0,
                    maxWidth: '100%',
                    background: s.green,
                    borderRadius: 4,
                    transition: 'width 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.1s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    opacity: showShaking ? 1 : 0,
                  }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#0a0c0f',
                      fontFamily: s.mono,
                      whiteSpace: 'nowrap',
                    }}>
                      {lib.shaken} KB
                    </span>
                  </div>
                </div>

                <div style={{
                  width: 56,
                  flexShrink: 0,
                  textAlign: 'center',
                  opacity: showShaking ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: s.green,
                    fontFamily: s.mono,
                  }}>
                    -{savedPct}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{
          marginTop: 20,
          borderTop: `1px solid ${s.border}`,
          paddingTop: 16,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div style={{
            fontSize: 11,
            color: s.text3,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            fontWeight: 600,
            marginRight: 4,
          }}>
            Total
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: s.bg2,
            borderRadius: 6,
            padding: '6px 12px',
            border: `1px solid ${s.border}`,
          }}>
            <span style={{ fontSize: 12, color: s.text3 }}>Without:</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: s.red, fontFamily: s.mono }}>
              <AnimatedNumber target={totalFull} /> KB
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: showShaking ? 'rgba(61, 214, 140, 0.08)' : s.bg2,
            borderRadius: 6,
            padding: '6px 12px',
            border: `1px solid ${showShaking ? 'rgba(61, 214, 140, 0.3)' : s.border}`,
            transition: 'all 0.3s ease',
          }}>
            <span style={{ fontSize: 12, color: s.text3 }}>With:</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: showShaking ? s.green : s.text2, fontFamily: s.mono, transition: 'color 0.3s' }}>
              <AnimatedNumber target={showShaking ? totalShaken : totalFull} duration={700} /> KB
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: showShaking ? 'rgba(61, 214, 140, 0.12)' : 'transparent',
            borderRadius: 6,
            padding: showShaking ? '6px 12px' : '6px 0',
            border: `1px solid ${showShaking ? 'rgba(61, 214, 140, 0.25)' : 'transparent'}`,
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            maxWidth: showShaking ? 200 : 0,
            opacity: showShaking ? 1 : 0,
          }}>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: s.green,
              fontFamily: s.mono,
              whiteSpace: 'nowrap',
            }}>
              -<AnimatedNumber target={totalSaved} duration={700} /> KB
              <span style={{ marginLeft: 4, opacity: 0.8 }}>(-{totalPct}%)</span>
            </span>
          </div>
        </div>

        <div style={{
          marginTop: 14,
          fontSize: 11,
          color: s.text3,
          lineHeight: 1.5,
        }}>
          Sizes shown are gzipped. Actual savings depend on which functions you import.
        </div>
      </div>
    </DemoBoundary>
  )
}
