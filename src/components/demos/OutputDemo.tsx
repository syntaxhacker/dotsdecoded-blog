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

const words = ['I', 'love', 'AI'] as const

const attentionWeights: Record<string, number[]> = {
  'I': [0.070, 0.707, 0.223],
  'love': [0.333, 0.333, 0.333],
  'AI': [0.168, 0.533, 0.299],
}

const valueMatrix: Record<string, number[]> = {
  'I': [1, 0, 1],
  'love': [1, 2, 0],
  'AI': [1, 1, 0],
}

const outputVectors: Record<string, number[]> = {
  'I': [1.000, 1.637, 0.070],
  'love': [1.000, 1.000, 0.333],
  'AI': [1.000, 1.365, 0.168],
}

const segColors = [s.accent, s.green, s.purple]

const dimLabels = ['d1', 'd2', 'd3']

function computeSegments(word: string) {
  const weights = attentionWeights[word]
  const output = outputVectors[word]
  const maxTotal = Math.max(...output)

  return dimLabels.map((_, di) => {
    const total = output[di]
    const segments = words.map((srcWord, si) => {
      const contribution = weights[si] * valueMatrix[srcWord][di]
      return {
        word: srcWord,
        weight: weights[si],
        value: valueMatrix[srcWord][di],
        contribution,
        color: segColors[si],
      }
    })
    return { dim: di, total, segments, maxTotal }
  })
}

export default function OutputDemo() {
  const [selected, setSelected] = useState<string>('I')
  const dimData = computeSegments(selected)
  const maxTotal = dimData[0].maxTotal

  return (
    <DemoBoundary name="Output Computation">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {words.map((w) => (
            <button
              key={w}
              onClick={() => setSelected(w)}
              style={{
                padding: '8px 24px',
                border: `1px solid ${selected === w ? s.accent : s.border}`,
                borderRadius: 6,
                background: selected === w ? `${s.accent}18` : s.bg2,
                color: selected === w ? s.accent : s.text2,
                cursor: 'pointer',
                fontFamily: s.mono,
                fontSize: 15,
                fontWeight: selected === w ? 600 : 400,
                transition: 'all 0.25s ease',
                outline: 'none',
              }}
            >
              {w}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {dimData.map(({ dim, total, segments }) => (
            <div key={dim}>
              <div style={{ fontSize: 12, color: s.text3, fontFamily: s.mono, marginBottom: 4, fontWeight: 600 }}>
                {dimLabels[dim]}
              </div>
              <div style={{
                display: 'flex',
                height: 32,
                borderRadius: 4,
                overflow: 'hidden',
                background: s.bg2,
                border: `1px solid ${s.border}`,
              }}>
                {segments.map((seg) => {
                  const pct = maxTotal > 0 ? (seg.contribution / maxTotal) * 100 : 0
                  const shareOfTotal = total > 0 ? (seg.contribution / total) * 100 : 0
                  const showLabel = shareOfTotal >= 5 && pct > 3
                  return (
                    <div
                      key={seg.word}
                      style={{
                        width: `${Math.max(pct, 0.5)}%`,
                        background: seg.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        minWidth: 0,
                        position: 'relative',
                        borderRight: seg.contribution > 0.001 && seg.word !== 'AI' ? `1px solid ${s.bg}` : 'none',
                      }}
                      title={`${seg.word}: ${(seg.weight * 100).toFixed(1)}% * ${seg.value} = ${seg.contribution.toFixed(3)}`}
                    >
                      {showLabel && (
                        <span style={{
                          fontSize: 11,
                          fontFamily: s.mono,
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          opacity: 0.95,
                          fontWeight: 600,
                          textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                          padding: '0 4px',
                        }}>
                          {shareOfTotal.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 4,
                padding: '0 2px',
              }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  {segments.map((seg) => (
                    <div key={seg.word} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color }} />
                      <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>{seg.word}</span>
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text, fontWeight: 600 }}>
                  = {total.toFixed(3)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 24,
          padding: '12px 16px',
          background: s.bg2,
          borderRadius: 6,
          border: `1px solid ${s.border}`,
          overflowX: 'auto',
        }}>
          <div style={{
            fontFamily: s.mono,
            fontSize: 12,
            color: s.text2,
            whiteSpace: 'nowrap',
            lineHeight: 1.8,
          }}>
            {(() => {
              const weights = attentionWeights[selected]
              const parts = words.map((w, i) => {
                const v = valueMatrix[w]
                return (
                  <span key={w}>
                    <span style={{ color: segColors[i], fontWeight: 600 }}>{weights[i].toFixed(3)}</span>
                    {' * ['}
                    <span style={{ color: s.text }}>{v.join(',')}</span>
                    {']'}
                    {i < words.length - 1 && <span style={{ color: s.text3 }}> + </span>}
                  </span>
                )
              })
              const out = outputVectors[selected]
              return (
                <>
                  {parts}
                  <span style={{ color: s.text3 }}> = </span>
                  {'['}
                  <span style={{ color: s.yellow, fontWeight: 600 }}>{out.join(', ')}</span>
                  {']'}
                </>
              )
            })()}
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
          {words.map((w, i) => (
            <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: segColors[i] }} />
              <span style={{ fontSize: 12, color: s.text2, fontFamily: s.mono }}>
                {w} contribution
              </span>
            </div>
          ))}
        </div>
      </div>
    </DemoBoundary>
  )
}
