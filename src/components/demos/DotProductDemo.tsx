import { useState, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const words = ['"I"', '"love"', '"AI"']
const Q = [[2, 0, 1], [0, 2, 1], [1, 1, 1]]
const KT = [[0, 2, 1], [1, 1, 1], [1, 1, 1]]
const scores = [
  [1, 5, 3],
  [3, 3, 3],
  [2, 4, 3],
]

export default function DotProductDemo() {
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (selected === null || step >= 5) return
    const t = setTimeout(() => setStep(prev => prev + 1), 300)
    return () => clearTimeout(t)
  }, [step, selected])

  const handleCellClick = (r: number, c: number) => {
    if (selected && selected[0] === r && selected[1] === c) return
    setSelected([r, c])
    setStep(1)
  }

  const handleReplay = () => {
    setStep(1)
  }

  const qr = selected ? Q[selected[0]] : [0, 0, 0]
  const kc = selected ? KT[selected[1]] : [0, 0, 0]
  const finalScore = selected ? scores[selected[0]][selected[1]] : 0

  return (
    <DemoBoundary name="Dot Product Explorer">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span style={{ color: s.text, fontWeight: 600, fontSize: 15 }}>Attention Scores: Q × K</span>
            <span style={{ color: s.text3, fontSize: 13, marginLeft: 10 }}>Click any cell to see the dot product</span>
          </div>
          {selected !== null && step >= 5 && (
            <button
              onClick={handleReplay}
              style={{
                background: s.bg3, color: s.text2, border: `1px solid ${s.border}`,
                borderRadius: 6, padding: '5px 14px', fontSize: 13, cursor: 'pointer',
                fontFamily: s.mono, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.accent; e.currentTarget.style.color = s.text }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.color = s.text2 }}
            >
              Replay
            </button>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'inline-grid', gridTemplateColumns: `80px repeat(3, 72px)`, gap: 0 }}>
            <div />
            {words.map(w => (
              <div key={w} style={{
                textAlign: 'center', padding: '8px 0', fontSize: 13,
                color: s.purple, fontWeight: 600, fontFamily: s.mono,
              }}>
                {w}
              </div>
            ))}

            {words.map((rw, r) => (
              <>
                <div key={`rh-${r}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  paddingRight: 12, fontSize: 13, color: s.accent, fontWeight: 600, fontFamily: s.mono,
                }}>
                  {rw}
                </div>
                {words.map((_, c) => {
                  const isSelected = selected !== null && selected[0] === r && selected[1] === c
                  const isDimmed = selected !== null && !isSelected
                  return (
                    <div
                      key={`cell-${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        height: 48, fontSize: 18, fontFamily: s.mono, fontWeight: 700,
                        cursor: 'pointer',
                        border: `1px solid ${isSelected ? s.accent : s.border}`,
                        backgroundColor: isSelected ? 'rgba(91, 141, 239, 0.12)' : s.bg2,
                        color: isDimmed ? s.text3 : s.text,
                        transition: 'all 0.25s ease',
                        borderRadius: isSelected ? 6 : 4,
                        margin: 2,
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = s.border2
                          e.currentTarget.style.backgroundColor = s.bg3
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = isDimmed ? s.border : s.border
                          e.currentTarget.style.backgroundColor = s.bg2
                        }
                      }}
                    >
                      {scores[r][c]}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>

        {selected !== null && step >= 1 && (
          <div style={{
            marginTop: 24, padding: 20, borderRadius: 8,
            background: s.bg2, border: `1px solid ${s.border}`,
            overflow: 'hidden',
          }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: s.text }}>
                <span style={{ color: s.accent }}>{words[selected[0]]}</span>
                {' '} × {' '}
                <span style={{ color: s.purple }}>{words[selected[1]]}</span>
                {' '} = dot product
              </span>
              {step < 5 && (
                <span style={{ fontSize: 12, color: s.text3, fontFamily: s.mono }}>
                  step {step}/5
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 24, alignItems: 'stretch', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: s.accent, marginBottom: 6, fontWeight: 600 }}>Q row</div>
                <div style={{
                  background: s.bg3, borderRadius: 6, padding: '10px 16px',
                  border: `1px solid ${s.border}`, display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  {qr.map((v, i) => {
                    const pairStep = i + 2
                    const isHighlighted = step >= pairStep
                    return (
                      <div key={`q-${i}`} style={{
                        width: 48, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 4, fontFamily: s.mono, fontSize: 16, fontWeight: 700,
                        color: s.text,
                        backgroundColor: isHighlighted ? 'rgba(91, 141, 239, 0.18)' : 'transparent',
                        border: `1px solid ${isHighlighted ? s.accent : 'transparent'}`,
                        transition: 'all 0.25s ease',
                      }}>
                        {v}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, paddingTop: 26 }}>
                {[0, 1, 2].map(i => {
                  const pairStep = i + 2
                  const isHighlighted = step >= pairStep
                  return (
                    <div key={`op-${i}`} style={{
                      width: 24, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: s.mono, fontSize: 16,
                      color: isHighlighted ? s.yellow : s.text3,
                      transition: 'color 0.25s ease',
                    }}>
                      ×
                    </div>
                  )
                })}
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: s.purple, marginBottom: 6, fontWeight: 600 }}>K col</div>
                <div style={{
                  background: s.bg3, borderRadius: 6, padding: '10px 16px',
                  border: `1px solid ${s.border}`, display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  {kc.map((v, i) => {
                    const pairStep = i + 2
                    const isHighlighted = step >= pairStep
                    return (
                      <div key={`k-${i}`} style={{
                        width: 48, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 4, fontFamily: s.mono, fontSize: 16, fontWeight: 700,
                        color: s.text,
                        backgroundColor: isHighlighted ? 'rgba(155, 123, 234, 0.18)' : 'transparent',
                        border: `1px solid ${isHighlighted ? s.purple : 'transparent'}`,
                        transition: 'all 0.25s ease',
                      }}>
                        {v}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, paddingTop: 26 }}>
                {[0, 1, 2].map(i => {
                  const pairStep = i + 2
                  const isActive = step === pairStep
                  const isHighlighted = step > pairStep
                  return (
                    <div key={`eq-${i}`} style={{
                      width: 24, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: s.mono, fontSize: 16,
                      color: isActive || isHighlighted ? s.yellow : s.text3,
                      transition: 'color 0.25s ease',
                    }}>
                      =
                    </div>
                  )
                })}
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: s.yellow, marginBottom: 6, fontWeight: 600 }}>product</div>
                <div style={{
                  background: s.bg3, borderRadius: 6, padding: '10px 16px',
                  border: `1px solid ${s.border}`, display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  {qr.map((_, i) => {
                    const pairStep = i + 2
                    const isActive = step === pairStep
                    const isRevealed = step >= pairStep
                    const product = qr[i] * kc[i]
                    return (
                      <div key={`p-${i}`} style={{
                        width: 48, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 4, fontFamily: s.mono, fontSize: 16, fontWeight: 700,
                        color: isRevealed ? (product === 0 ? s.text3 : s.yellow) : s.text3,
                        backgroundColor: isActive ? 'rgba(224, 176, 64, 0.15)' : 'transparent',
                        border: `1px solid ${isActive ? s.yellow : 'transparent'}`,
                        transition: 'all 0.25s ease',
                        opacity: isRevealed ? 1 : 0.3,
                      }}>
                        {isRevealed ? product : '?'}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 16, display: 'flex', justifyContent: 'center',
              opacity: step >= 5 ? 1 : 0, transition: 'opacity 0.3s ease',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(61, 214, 140, 0.08)', borderRadius: 8,
                padding: '10px 20px', border: `1px solid ${s.green}`,
              }}>
                <span style={{ fontFamily: s.mono, fontSize: 14, color: s.text2 }}>
                  {qr[0]}×{kc[0]} + {qr[1]}×{kc[1]} + {qr[2]}×{kc[2]}
                </span>
                <span style={{ fontFamily: s.mono, fontSize: 14, color: s.text3 }}>=</span>
                <span style={{ fontFamily: s.mono, fontSize: 18, fontWeight: 700, color: s.green }}>
                  {finalScore}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </DemoBoundary>
  )
}
