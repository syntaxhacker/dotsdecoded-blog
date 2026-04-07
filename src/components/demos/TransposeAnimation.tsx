import { useState, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const K = [
  [0, 1, 1],
  [2, 1, 1],
  [1, 1, 1],
]
const words = ['I', 'love', 'AI']
const n = 3
const cellSz = 60
const gap = 6
const mL = 50
const mT = 30
const gridPx = n * cellSz + (n - 1) * gap

export default function TransposeAnimation() {
  const [transposed, setTransposed] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [labelsFlipped, setLabelsFlipped] = useState(false)

  useEffect(() => {
    setAnimating(true)
    const t = setTimeout(() => {
      setAnimating(false)
      setLabelsFlipped(transposed)
    }, 800)
    return () => clearTimeout(t)
  }, [transposed])

  const items = []
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      items.push({
        v: K[i][j],
        r: transposed ? j : i,
        c: transposed ? i : j,
        d: i === j,
      })
    }
  }

  return (
    <DemoBoundary name="Matrix Transpose">
      <div style={{
        maxWidth: 820,
        margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: 'visible',
        padding: '24px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <button
            onClick={() => setTransposed((p) => !p)}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              border: `1px solid ${s.border2}`,
              background: s.bg3,
              color: s.text,
              fontSize: 14,
              fontFamily: s.mono,
              cursor: 'pointer',
            }}
          >
            {transposed ? 'Reset' : 'Transpose'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{
            fontFamily: s.mono,
            fontSize: 26,
            fontWeight: 700,
            color: s.accent,
          }}>
            K
            {transposed && <sup style={{ fontSize: 16, fontWeight: 600 }}>T</sup>}
          </span>
        </div>

        <div style={{
          position: 'relative',
          width: mL + gridPx + 20,
          height: mT + gridPx + 20,
          margin: '0 auto',
        }}>
          {words.map((label, i) => (
            <div
              key={`col-${i}`}
              style={{
                position: 'absolute',
                left: mL + i * (cellSz + gap) + cellSz / 2,
                top: 0,
                transform: 'translateX(-50%)',
                fontSize: labelsFlipped ? 13 : 11,
                color: labelsFlipped ? s.accent : s.text3,
                fontFamily: s.mono,
                fontWeight: labelsFlipped ? 600 : 400,
                height: mT - 4,
                display: 'flex',
                alignItems: 'flex-end',
                transition: 'all 0.4s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {labelsFlipped ? label : i}
            </div>
          ))}

          {words.map((label, i) => (
            <div
              key={`row-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                top: mT + i * (cellSz + gap),
                width: mL - 8,
                height: cellSz,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                fontSize: !labelsFlipped ? 13 : 11,
                color: !labelsFlipped ? s.accent : s.text3,
                fontFamily: s.mono,
                fontWeight: !labelsFlipped ? 600 : 400,
                transition: 'all 0.4s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {!labelsFlipped ? label : i}
            </div>
          ))}

          {items.map((it, idx) => {
            const moving = !it.d && animating
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: mL + it.c * (cellSz + gap),
                  top: mT + it.r * (cellSz + gap),
                  width: cellSz,
                  height: cellSz,
                  borderRadius: 8,
                  background: moving ? s.bg3 : s.bg2,
                  border: moving
                    ? `2px solid ${s.accent}`
                    : `1px solid ${s.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: s.mono,
                  fontSize: 22,
                  fontWeight: 600,
                  color: it.v === 0 ? s.text3 : s.text,
                  transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: moving ? 10 : 1,
                }}
              >
                {it.v}
              </div>
            )
          })}
        </div>

        <p style={{
          marginTop: 20,
          color: s.text2,
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          Rows become columns. The element at position (i,j) moves to (j,i).
        </p>
      </div>
    </DemoBoundary>
  )
}
