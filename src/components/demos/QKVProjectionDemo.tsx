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

const X = [[1,0,1,0],[0,1,0,1],[1,1,0,0]]
const rowLabels = ['I', 'love', 'AI']

const projections = [
  { label: 'W_Q', resultLabel: 'Q', color: s.accent, weight: [[1,0,1],[0,1,0],[1,0,0],[0,1,1]], result: [[2,0,1],[0,2,1],[1,1,1]] },
  { label: 'W_K', resultLabel: 'K', color: s.green, weight: [[0,1,0],[1,0,1],[0,0,1],[1,1,0]], result: [[0,1,1],[2,1,1],[1,1,1]] },
  { label: 'W_V', resultLabel: 'V', color: s.purple, weight: [[1,0,0],[0,1,0],[0,0,1],[1,1,0]], result: [[1,0,1],[1,2,0],[1,1,0]] },
]

const descriptions = [
  'Each token embedding is multiplied by W_Q to produce Query vectors. Queries represent "what am I looking for?"',
  'Each token embedding is multiplied by W_K to produce Key vectors. Keys represent "what do I contain?"',
  'Each token embedding is multiplied by W_V to produce Value vectors. Values represent "what information do I provide?"',
]

function MatrixGrid({ matrix, labels, color, show, size = 34 }: {
  matrix: number[][]
  labels?: string[]
  color?: string
  show: boolean
  size?: number
}) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
      {matrix.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap: 2 }}>
          {labels && (
            <div style={{
              width: 36, display: 'flex', alignItems: 'center',
              justifyContent: 'flex-end', paddingRight: 6,
              fontSize: 11, fontFamily: s.mono, color: s.text3,
            }}>
              {labels[ri]}
            </div>
          )}
          {row.map((val, ci) => {
            const idx = ri * row.length + ci
            return (
              <div key={ci} style={{
                width: size, height: size,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: color ? `${color}14` : s.bg2,
                border: `1px solid ${color ? `${color}50` : s.border}`,
                borderRadius: 4,
                fontSize: 14, fontFamily: s.mono,
                color: color || s.text,
                fontWeight: color ? 600 : 400,
                opacity: show ? 1 : 0,
                transform: show ? 'translateY(0)' : 'translateY(6px)',
                transition: `opacity 0.4s ease ${idx * 70}ms, transform 0.4s ease ${idx * 70}ms`,
              }}>
                {val}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function QKVProjectionDemo() {
  const [step, setStep] = useState(0)
  const [showResult, setShowResult] = useState(false)

  const p = step > 0 ? projections[step - 1] : null
  const nextColor = step < 3 ? projections[step].color : s.accent

  const goTo = (n: number) => {
    setShowResult(false)
    setStep(n)
    if (n > 0) {
      setTimeout(() => setShowResult(true), 80)
    }
  }

  return (
    <DemoBoundary name="QKV Projection">
      <div style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: 'visible', padding: '12px 0',
      }}>

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: s.text, marginBottom: 4 }}>
            {step === 0 ? 'Input Embedding Matrix' : `Projecting into ${p?.resultLabel} Space`}
          </div>
          {step > 0 && p && (
            <div style={{ fontSize: 14, fontFamily: s.mono, color: p.color, fontWeight: 600, letterSpacing: 0.5 }}>
              X &times; {p.label} = {p.resultLabel}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 18 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i === step
                ? (i === 0 ? s.accent : projections[i - 1].color)
                : i < step
                  ? (i === 0 ? s.border2 : `${projections[i - 1].color}40`)
                  : s.bg3,
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 14, flexWrap: 'wrap', minHeight: 180,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.text2, letterSpacing: 0.3 }}>Input X</div>
            <MatrixGrid matrix={X} labels={rowLabels} show={true} size={step === 0 ? 40 : 32} />
          </div>

          {step > 0 && p && (
            <>
              <div style={{
                fontSize: 24, color: s.text3, fontWeight: 300,
                marginTop: 20, userSelect: 'none',
              }}>
                &times;
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: p.color, letterSpacing: 0.3 }}>Weight {p.label}</div>
                <MatrixGrid matrix={p.weight} show={true} size={32} />
              </div>
              <div style={{
                fontSize: 24, color: s.text3, fontWeight: 300,
                marginTop: 20, userSelect: 'none',
              }}>
                =
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: p.color, letterSpacing: 0.3 }}>Result {p.resultLabel}</div>
                <MatrixGrid matrix={p.result} labels={rowLabels} color={p.color} show={showResult} size={32} />
              </div>
            </>
          )}
        </div>

        <div style={{
          textAlign: 'center', marginTop: 16, fontSize: 12,
          color: s.text3, lineHeight: 1.6, maxWidth: 440, margin: '16px auto 0',
        }}>
          {step === 0
            ? 'Each row is a token embedding. We project these into Query, Key, and Value spaces using learned weight matrices.'
            : descriptions[step - 1]}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
          <button
            onClick={() => goTo(step - 1)}
            disabled={step === 0}
            style={{
              padding: '8px 24px', borderRadius: 6,
              border: `1px solid ${step === 0 ? s.bg3 : s.border}`,
              background: step === 0 ? 'transparent' : s.bg2,
              color: step === 0 ? s.text3 : s.text2,
              fontSize: 13, fontWeight: 500, cursor: step === 0 ? 'default' : 'pointer',
              transition: 'all 0.2s ease', fontFamily: 'inherit',
            }}
          >
            Previous
          </button>
          <button
            onClick={() => goTo(step + 1)}
            disabled={step === 3}
            style={{
              padding: '8px 24px', borderRadius: 6,
              border: `1px solid ${step === 3 ? s.bg3 : nextColor}`,
              background: step === 3 ? 'transparent' : `${nextColor}18`,
              color: step === 3 ? s.text3 : nextColor,
              fontSize: 13, fontWeight: 500, cursor: step === 3 ? 'default' : 'pointer',
              transition: 'all 0.2s ease', fontFamily: 'inherit',
            }}
          >
            Next
          </button>
        </div>
      </div>
    </DemoBoundary>
  )
}
