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

const rows = [
  { word: 'I', scores: [0.577, 2.887, 1.732], exps: [1.781, 17.94, 5.651], weights: [0.070, 0.707, 0.223] },
  { word: 'love', scores: [1.732, 1.732, 1.732], exps: [5.651, 5.651, 5.651], weights: [0.333, 0.333, 0.333] },
  { word: 'AI', scores: [1.155, 2.309, 1.732], exps: [3.174, 10.06, 5.651], weights: [0.168, 0.533, 0.299] },
]

const cols = ['I', 'love', 'AI']
const colColors = [s.accent, s.green, s.purple]
const maxScore = 2.887
const maxExp = 17.94

export default function SoftmaxDemo() {
  const [phase, setPhase] = useState<'scores' | 'exp' | 'probabilities'>('scores')
  const [animating, setAnimating] = useState(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (!animating) return
    if (phase === 'scores') {
      const t = setTimeout(() => {
        setPhase('exp')
        setPulse(true)
        setTimeout(() => setPulse(false), 300)
      }, 800)
      return () => clearTimeout(t)
    }
    if (phase === 'exp') {
      const t = setTimeout(() => {
        setPhase('probabilities')
        setAnimating(false)
      }, 1200)
      return () => clearTimeout(t)
    }
  }, [phase, animating])

  const handlePlay = () => {
    setPhase('scores')
    setAnimating(true)
    setPulse(false)
  }

  const getBarWidth = (ri: number, ci: number) => {
    const row = rows[ri]
    if (phase === 'scores') return (row.scores[ci] / maxScore) * 100
    if (phase === 'exp') return (row.exps[ci] / maxExp) * 100
    return row.weights[ci] * 100
  }

  const getLabel = (ri: number, ci: number) => {
    const row = rows[ri]
    if (phase === 'scores') return row.scores[ci].toFixed(3)
    if (phase === 'exp') return row.exps[ci].toFixed(1)
    return `${(row.weights[ci] * 100).toFixed(1)}%`
  }

  const phaseLabel = phase === 'scores'
    ? 'Scaled Scores (QK^T / sqrt(d_k))'
    : phase === 'exp'
      ? 'e^x (Exponentiation)'
      : 'Attention Weights (Probabilities)'

  const stepText = phase === 'scores'
    ? 'Step 1: Raw scaled scores from dot-product similarity'
    : phase === 'exp'
      ? 'Step 2: Exponentiate each score (amplifies differences)'
      : 'Step 3: Divide each by row sum to get probabilities'

  return (
    <DemoBoundary name="Softmax Transformation">
      <div style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16, flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ fontSize: 14, color: s.text2, fontFamily: s.mono }}>
            Phase: <span style={{ color: s.accent }}>{phaseLabel}</span>
          </div>
          <button
            onClick={handlePlay}
            disabled={animating}
            style={{
              background: animating ? s.bg3 : s.accent,
              color: animating ? s.text3 : '#fff',
              border: 'none', borderRadius: 6, padding: '6px 16px',
              fontSize: 13, fontFamily: s.mono,
              cursor: animating ? 'not-allowed' : 'pointer',
              fontWeight: 600, transition: 'background 0.2s, color 0.2s',
            }}
          >
            {animating ? 'Animating...' : 'Play Animation'}
          </button>
        </div>

        <div style={{ paddingLeft: 56, display: 'flex', gap: 8, marginBottom: 6 }}>
          {cols.map((col, i) => (
            <div key={col} style={{
              flex: 1, textAlign: 'center', fontSize: 13,
              fontWeight: 600, color: colColors[i], fontFamily: s.mono,
            }}>
              {col}
            </div>
          ))}
        </div>

        {rows.map((row, ri) => (
          <div key={row.word} style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <div style={{
              width: 48, textAlign: 'right', fontSize: 13,
              fontWeight: 600, color: s.text, fontFamily: s.mono,
              flexShrink: 0, paddingRight: 8,
            }}>
              {row.word}
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 8 }}>
              {row.scores.map((_, ci) => {
                const w = getBarWidth(ri, ci)
                return (
                  <div key={`${ri}-${ci}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{
                      height: 26, background: s.bg2, borderRadius: 4,
                      overflow: 'hidden', position: 'relative',
                    }}>
                      <div style={{
                        width: `${w}%`, height: '100%',
                        background: `linear-gradient(90deg, ${colColors[ci]}, ${colColors[ci]}99)`,
                        borderRadius: 4,
                        transition: 'width 0.6s ease, transform 0.15s ease',
                        transform: pulse ? 'scaleY(1.2)' : 'scaleY(1)',
                        transformOrigin: 'center',
                        opacity: 0.9,
                      }} />
                    </div>
                    <div style={{
                      textAlign: 'center', fontSize: 11,
                      fontFamily: s.mono, color: s.text2,
                    }}>
                      {getLabel(ri, ci)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {phase === 'probabilities' && (
          <div style={{
            marginTop: 16, padding: '10px 16px',
            background: s.bg2, borderRadius: 6,
            border: `1px solid ${s.border}`,
            fontSize: 13, fontFamily: s.mono, color: s.text2,
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 8,
          }}>
            <span>
              Each row sums to{' '}
              <span style={{ color: s.green, fontWeight: 600 }}>1.0</span>
            </span>
            <div style={{ display: 'flex', gap: 20 }}>
              {rows.map((row) => (
                <span key={row.word}>
                  <span style={{ color: s.text3 }}>{row.word}:</span>{' '}
                  <span style={{ color: s.green }}>
                    {row.weights.reduce((a, b) => a + b, 0).toFixed(3)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{
          marginTop: 12, fontSize: 12, color: s.text3,
          fontFamily: s.mono, lineHeight: 1.6,
        }}>
          {stepText}
        </div>
      </div>
    </DemoBoundary>
  )
}
