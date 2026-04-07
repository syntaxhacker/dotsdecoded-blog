import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const rawScores = [1, 5, 3]
const scaledScores = [0.577, 2.887, 1.732]
const labels = ['I', 'love', 'AI']
const barColors = [s.accent, s.green, s.purple]
const maxRaw = 5
const maxBarWidth = 656

export default function AttentionScalingDemo() {
  const [scaled, setScaled] = useState(false)

  const scores = scaled ? scaledScores : rawScores
  const maxScore = scaled ? scaledScores[1] : maxRaw

  return (
    <DemoBoundary name="Score Scaling">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button
            onClick={() => setScaled(!scaled)}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              border: `1px solid ${s.border}`,
              background: scaled ? s.bg3 : s.bg2,
              color: s.text,
              cursor: 'pointer',
              fontFamily: s.mono,
              fontSize: 14,
              transition: 'background 0.2s',
            }}
          >
            {scaled ? 'Scaled Scores' : 'Raw Scores'}
          </button>
          <span style={{ color: s.text3, fontSize: 13 }}>
            Click to toggle scaling
          </span>
        </div>

        <div style={{ background: s.bg2, borderRadius: 10, padding: '28px 32px', border: `1px solid ${s.border}` }}>
          <div style={{ marginBottom: 20, fontSize: 13, color: s.text3 }}>
            Attention scores for the word "I" attending to each token
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {labels.map((label, i) => {
              const barWidth = (scores[i] / maxScore) * maxBarWidth
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 50, textAlign: 'right', fontFamily: s.mono, fontSize: 15, color: s.text, flexShrink: 0 }}>
                    {label}
                  </div>
                  <div style={{ flex: 1, height: 36, background: s.bg, borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: barWidth,
                        height: '100%',
                        background: barColors[i],
                        borderRadius: '0 6px 6px 0',
                        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        minWidth: 2,
                      }}
                    />
                  </div>
                  <div style={{ width: 60, textAlign: 'left', fontFamily: s.mono, fontSize: 15, color: s.text, flexShrink: 0 }}>
                    {scores[i].toFixed(3)}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{
            marginTop: 28,
            padding: '16px 20px',
            background: s.bg,
            borderRadius: 8,
            border: `1px solid ${s.border}`,
            fontFamily: s.mono,
            fontSize: 14,
            color: s.text2,
            lineHeight: 1.8,
          }}>
            <div style={{ marginBottom: 8, color: s.text, fontWeight: 600, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontSize: 13 }}>
              Formula
            </div>
            <div>
              scaled_score = score / sqrt(d_k)
            </div>
            <div>
              d_k = 3, sqrt(3) = <span style={{ color: s.accent }}>1.732</span>
            </div>
          </div>

          <div style={{
            marginTop: 16,
            padding: '14px 20px',
            background: s.bg,
            borderRadius: 8,
            border: `1px solid ${s.border}`,
            fontSize: 13,
            color: s.text3,
            lineHeight: 1.7,
          }}>
            Raw scores can be too large for softmax. Scaling keeps values stable.
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
