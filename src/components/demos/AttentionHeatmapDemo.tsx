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

const words = ["I", "love", "AI"]
const scores = [[1, 5, 3], [3, 3, 3], [2, 4, 3]]
const maxScore = 5

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function interpolateColor(t: number) {
  const from = hexToRgb(s.bg2)
  const to = hexToRgb(s.accent)
  const r = Math.round(from.r + (to.r - from.r) * t)
  const g = Math.round(from.g + (to.g - from.g) * t)
  const b = Math.round(from.b + (to.b - from.b) * t)
  return `rgb(${r},${g},${b})`
}

export default function AttentionHeatmapDemo() {
  const [mounted, setMounted] = useState(false)
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const scoreLabel = (val: number) => {
    if (val === maxScore) return ' (highest)'
    if (val === 1) return ' (lowest)'
    return ''
  }

  return (
    <DemoBoundary name="Attention Heatmap">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '24px 28px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.accent, display: 'inline-block' }} />
              <span style={{ color: s.text2, fontSize: 13 }}>Query (attending from)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.purple, display: 'inline-block' }} />
              <span style={{ color: s.text2, fontSize: 13 }}>Key (attending to)</span>
            </div>
          </div>

          <div style={{ display: 'inline-block' }}>
            <div style={{ display: 'flex', marginBottom: 4, paddingLeft: 90 }}>
              {words.map((word, col) => (
                <div
                  key={`col-${col}`}
                  style={{
                    width: 100,
                    textAlign: 'center',
                    color: s.purple,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: s.mono,
                    opacity: mounted ? 1 : 0,
                    transition: `all 0.5s ease ${(col + 1) * 0.1}s`,
                  }}
                >
                  Key: {word}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {words.map((word, row) => (
                <div key={`row-${row}`} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <div
                    style={{
                      width: 90,
                      textAlign: 'right',
                      paddingRight: 12,
                      color: s.accent,
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: s.mono,
                      opacity: mounted ? 1 : 0,
                      transition: `all 0.5s ease ${(row + 1) * 0.1}s`,
                      flexShrink: 0,
                    }}
                  >
                    Query: {word}
                  </div>
                  {scores[row].map((score, col) => {
                    const delay = (row * 3 + col) * 0.08
                    const t = score / maxScore
                    const bgColor = interpolateColor(t)
                    const isHovered = hovered?.row === row && hovered?.col === col
                    return (
                      <div
                        key={`cell-${row}-${col}`}
                        onMouseEnter={() => setHovered({ row, col })}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          width: 100,
                          height: 60,
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: s.mono,
                          fontSize: 18,
                          fontWeight: 700,
                          color: t > 0.3 ? '#ffffff' : s.text3,
                          background: mounted ? bgColor : s.bg2,
                          opacity: mounted ? 1 : 0,
                          transform: mounted ? 'scale(1)' : 'scale(0.85)',
                          border: isHovered ? `2px solid ${s.accent}` : '2px solid transparent',
                          transition: `all 0.5s ease ${delay}s`,
                          cursor: 'default',
                          marginLeft: 4,
                        }}
                      >
                        {score}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              minHeight: 28,
              textAlign: 'center',
              color: s.text2,
              fontSize: 13,
              fontFamily: s.mono,
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          >
            {hovered && (
              <>
                "{words[hovered.row]}" attending to "{words[hovered.col]}": score {scores[hovered.row][hovered.col]}
                {scoreLabel(scores[hovered.row][hovered.col])}
              </>
            )}
          </div>

          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: `1px solid ${s.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <span style={{ color: s.text3, fontSize: 12 }}>Low attention</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <div
                  key={t}
                  style={{
                    width: 28,
                    height: 14,
                    borderRadius: 3,
                    background: interpolateColor(t),
                  }}
                />
              ))}
            </div>
            <span style={{ color: s.text3, fontSize: 12 }}>High attention</span>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
