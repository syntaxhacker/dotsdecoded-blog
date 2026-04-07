import { useState, useMemo, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const labels = ['I', 'love', 'AI']
const colors = [s.accent, s.green, s.purple]

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores)
  const exps = scores.map(x => Math.exp(x - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map(x => x / sum)
}

export default function SoftmaxCurveDemo() {
  const [scores, setScores] = useState([0.577, 2.887, 1.732])
  const probs = useMemo(() => softmax(scores), [scores])

  const handleSlider = useCallback((index: number, value: number) => {
    setScores(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }, [])

  return (
    <DemoBoundary name="Softmax Curve">
      <div style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: s.bg, color: s.text, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: 24, overflow: 'visible',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {labels.map((label, i) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', background: s.bg2, borderRadius: 8,
              border: `1px solid ${s.border}`,
            }}>
              <div style={{
                width: 50, fontWeight: 700, fontSize: 15, fontFamily: s.mono,
                color: colors[i],
              }}>
                {label}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="range"
                  min={-2}
                  max={5}
                  step={0.1}
                  value={scores[i]}
                  onChange={e => handleSlider(i, parseFloat(e.target.value))}
                  style={{
                    width: '100%', appearance: 'none', background: 'transparent',
                    cursor: 'pointer', outline: 'none',
                  }}
                />
                <style>{`
                  input[type="range"]::-webkit-slider-runnable-track {
                    height: 6px;
                    border-radius: 3px;
                    background: ${s.bg3};
                  }
                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: ${colors[i]};
                    margin-top: -6px;
                    border: 2px solid ${s.bg};
                    box-shadow: 0 0 6px ${colors[i]}44;
                    transition: box-shadow 0.15s ease;
                  }
                  input[type="range"]::-webkit-slider-thumb:hover {
                    box-shadow: 0 0 12px ${colors[i]}88;
                  }
                  input[type="range"]::-moz-range-track {
                    height: 6px;
                    border-radius: 3px;
                    background: ${s.bg3};
                    border: none;
                  }
                  input[type="range"]::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: ${colors[i]};
                    border: 2px solid ${s.bg};
                    box-shadow: 0 0 6px ${colors[i]}44;
                  }
                `}</style>
              </div>
              <div style={{
                width: 60, textAlign: 'right', fontFamily: s.mono, fontSize: 13,
                color: s.text3,
              }}>
                {scores[i].toFixed(1)}
              </div>
              <div style={{
                width: 80, textAlign: 'right', fontFamily: s.mono, fontSize: 14,
                fontWeight: 600, color: colors[i],
              }}>
                {(probs[i] * 100).toFixed(1)}%
              </div>
            </div>
          ))}

          <div style={{ marginTop: 8 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: s.text3,
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10,
            }}>
              Probability Bars
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {labels.map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 50, fontSize: 13, fontFamily: s.mono,
                    fontWeight: 600, color: colors[i],
                  }}>
                    {label}
                  </div>
                  <div style={{ flex: 1, height: 28, background: s.bg3, borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      width: `${probs[i] * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${colors[i]}cc, ${colors[i]})`,
                      borderRadius: 6,
                      transition: 'width 0.3s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                      paddingRight: 8, minWidth: probs[i] > 0.08 ? undefined : 0,
                    }}>
                      {probs[i] > 0.08 && (
                        <span style={{
                          fontSize: 12, fontFamily: s.mono, fontWeight: 600,
                          color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        }}>
                          {(probs[i] * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: s.text3,
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10,
            }}>
              Distribution
            </div>
            <div style={{
              display: 'flex', height: 36, borderRadius: 8, overflow: 'hidden',
              border: `1px solid ${s.border}`,
            }}>
              {labels.map((label, i) => (
                <div
                  key={label}
                  style={{
                    width: `${probs[i] * 100}%`,
                    background: `${colors[i]}22`,
                    borderRight: i < labels.length - 1 ? `2px solid ${s.bg}` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'width 0.3s ease',
                    overflow: 'hidden', position: 'relative',
                  }}
                >
                  {probs[i] > 0.1 && (
                    <span style={{
                      fontSize: 12, fontFamily: s.mono, fontWeight: 600,
                      color: colors[i], whiteSpace: 'nowrap',
                    }}>
                      {label} {(probs[i] * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex', gap: 16, justifyContent: 'center', marginTop: 4,
            padding: '10px 14px', background: s.bg2, borderRadius: 8,
            border: `1px solid ${s.border}`,
          }}>
            <div style={{ fontSize: 12, color: s.text3, fontFamily: s.mono }}>
              e^z = [
              {scores.map((sc, i) => (
                <span key={i}>
                  {i > 0 && ', '}
                  <span style={{ color: colors[i] }}>
                    {Math.exp(sc - Math.max(...scores)).toFixed(2)}
                  </span>
                </span>
              ))}
              ]
            </div>
            <div style={{ width: 1, background: s.border }} />
            <div style={{ fontSize: 12, color: s.text3, fontFamily: s.mono }}>
              sum = {scores.reduce((a, b) => a + Math.exp(b - Math.max(...scores)), 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
