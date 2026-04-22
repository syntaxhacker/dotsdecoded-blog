import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const rowData = [2, 0, 1]
const colData = [2, 1, 1]
const products = [4, 0, 1]
const pairColors = [s.accent, s.green, s.purple]

const CS = 52
const CG = 10
const RX = 80
const RY = 50
const CX = 440
const CY = 50
const VW = 560
const VH = 220

function MatrixMultiplyDemo() {
  const [step, setStep] = useState(0)
  const [pulse, setPulse] = useState(false)

  const start = useCallback(() => {
    setStep(0)
    setPulse(false)
    setTimeout(() => setStep(1), 50)
  }, [])

  useEffect(() => {
    if (step < 1 || step > 3) return
    const t = setTimeout(() => setStep(p => p + 1), 700)
    return () => clearTimeout(t)
  }, [step])

  useEffect(() => {
    if (step === 4) {
      const t1 = setTimeout(() => setPulse(true), 50)
      const t2 = setTimeout(() => setPulse(false), 1500)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [step])

  const isActive = (i: number) => step === i + 1
  const isDone = (i: number) => step >= 4 || step > i + 1

  const sum =
    step >= 1 ? products.slice(0, Math.min(step, 3)).reduce((a, b) => a + b, 0) : 0

  const lines = [0, 1, 2].map(i => ({
    x1: RX + i * (CS + CG) + CS,
    y1: RY + CS / 2,
    x2: CX,
    y2: CY + i * (CS + CG) + CS / 2,
  }))

  const cellStyle = (i: number, isRow: boolean) => {
    const active = isActive(i)
    const done = isDone(i)
    const color = pairColors[i]
    return {
      position: 'absolute' as const,
      width: CS,
      height: CS,
      left: isRow ? RX + i * (CS + CG) : CX,
      top: isRow ? RY : CY + i * (CS + CG),
      display: 'flex',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: 8,
      border: `2px solid ${active ? color : done ? color + '55' : s.border}`,
      background: active ? color + '20' : done ? color + '0d' : s.bg2,
      color: active ? color : done ? color + 'aa' : s.text,
      fontSize: 20,
      fontWeight: 700 as const,
      fontFamily: s.mono,
      transition: 'all 0.3s ease',
      boxShadow: active
        ? `0 0 20px ${color}44, 0 0 40px ${color}22`
        : 'none',
    }
  }

  return (
    <DemoBoundary name="Matrix Multiplication">
      <div
        style={{
          maxWidth: 820,
          margin: '0 auto',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: s.bg,
          borderRadius: 12,
          border: `1px solid ${s.border}`,
          padding: 24,
          overflow: 'visible',
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `@keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`,
          }}
        />

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              fontSize: 12,
              color: s.text3,
              marginBottom: 4,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
            }}
          >
            Dot Product
          </div>
          <div style={{ fontSize: 15, color: s.text2 }}>
            Q row{' '}
            <span style={{ color: s.accent, fontFamily: s.mono }}>&quot;I&quot;</span>{' '}
            dot K^T column{' '}
            <span style={{ color: s.green, fontFamily: s.mono }}>&quot;love&quot;</span>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            width: VW,
            height: VH,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: RX,
              top: 12,
              fontSize: 13,
              fontWeight: 600,
              color: s.accent,
              fontFamily: s.mono,
            }}
          >
            Q: &apos;I&apos;
          </div>
          <div
            style={{
              position: 'absolute',
              left: CX,
              top: 12,
              fontSize: 13,
              fontWeight: 600,
              color: s.green,
              fontFamily: s.mono,
            }}
          >
            K^T: &apos;love&apos;
          </div>

          {rowData.map((v, i) => (
            <div key={`r${i}`} style={cellStyle(i, true)}>
              {v}
            </div>
          ))}
          {colData.map((v, i) => (
            <div key={`c${i}`} style={cellStyle(i, false)}>
              {v}
            </div>
          ))}

          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: VW,
              height: VH,
              pointerEvents: 'none',
            }}
          >
            {lines.map((l, i) => {
              const active = isActive(i)
              const done = isDone(i)
              const color = pairColors[i]
              return (
                <g key={i}>
                  <line
                    x1={l.x1}
                    y1={l.y1}
                    x2={l.x2}
                    y2={l.y2}
                    stroke={
                      active
                        ? color
                        : done
                          ? color + '44'
                          : s.border
                    }
                    strokeWidth={active ? 2.5 : 1.5}
                    strokeDasharray={active || done ? 'none' : '6 4'}
                    strokeLinecap="round"
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  {active && (
                    <>
                      <circle
                        cx={l.x1}
                        cy={l.y1}
                        r={4}
                        fill={color}
                        style={{ transition: 'all 0.3s ease' }}
                      />
                      <circle
                        cx={l.x2}
                        cy={l.y2}
                        r={4}
                        fill={color}
                        style={{ transition: 'all 0.3s ease' }}
                      />
                    </>
                  )}
                </g>
              )
            })}
          </svg>

          {step >= 1 && step <= 3 && (
            <div
              key={`step-${step}`}
              style={{
                position: 'absolute',
                left: (RX + CX + CS) / 2,
                top: VH / 2 - 10,
                transform: 'translate(-50%, -50%)',
                background: s.bg,
                padding: '6px 14px',
                borderRadius: 6,
                border: `1px solid ${pairColors[step - 1]}44`,
                fontSize: 16,
                fontFamily: s.mono,
                color: pairColors[step - 1],
                fontWeight: 700,
                animation: 'fadeSlideIn 0.25s ease',
                whiteSpace: 'nowrap' as const,
              }}
            >
              {rowData[step - 1]} &times; {colData[step - 1]} ={' '}
              {products[step - 1]}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, minHeight: 100 }}>
          {step >= 1 && step <= 3 && (
            <div
              key={`sum-${step}`}
              style={{
                textAlign: 'center',
                padding: '10px 20px',
                background: s.bg2,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                fontSize: 14,
                fontFamily: s.mono,
                color: s.text2,
                animation: 'fadeSlideIn 0.25s ease',
              }}
            >
              <span
                style={{
                  color: s.text3,
                  fontSize: 12,
                  marginRight: 8,
                }}
              >
                Running total:
              </span>
              {products.slice(0, step).map((p, idx) => (
                <span key={idx}>
                  {idx > 0 && (
                    <span style={{ color: s.text3, margin: '0 4px' }}>
                      +
                    </span>
                  )}
                  <span style={{ color: pairColors[idx] }}>{p}</span>
                </span>
              ))}
              <span style={{ color: s.text3, margin: '0 8px' }}>=</span>
              <span style={{ color: s.text, fontWeight: 700 }}>{sum}</span>
            </div>
          )}

          {step === 4 && (
            <div
              key="final"
              style={{
                textAlign: 'center',
                padding: '14px 24px',
                background: s.green + '0d',
                border: `1px solid ${s.green}33`,
                borderRadius: 8,
                animation: 'fadeSlideIn 0.3s ease',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: s.text3,
                  marginBottom: 8,
                }}
              >
                Final Result
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontFamily: s.mono,
                  color: s.text2,
                  marginBottom: 10,
                }}
              >
                {products.map((p, i) => (
                  <span key={i}>
                    {i > 0 && (
                      <span style={{ color: s.text3, margin: '0 4px' }}>
                        +
                      </span>
                    )}
                    <span style={{ color: pairColors[i] }}>{p}</span>
                  </span>
                ))}
                <span style={{ color: s.text3, margin: '0 8px' }}>=</span>
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  fontFamily: s.mono,
                  color: s.green,
                  transform: pulse ? 'scale(1.15)' : 'scale(1)',
                  transition:
                    'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {sum}
              </div>
            </div>
          )}

          {step === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 20px',
                color: s.text3,
                fontSize: 14,
              }}
            >
              Click Multiply to see the dot product step by step
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            onClick={start}
            onMouseEnter={e => {
              e.currentTarget.style.background = s.border
              e.currentTarget.style.borderColor = s.border2
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = s.bg3
              e.currentTarget.style.borderColor = s.border
            }}
            style={{
              padding: '10px 32px',
              borderRadius: 8,
              border: `1px solid ${s.border}`,
              background: s.bg3,
              color: s.text,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
          >
            {step === 0 ? 'Multiply' : 'Replay'}
          </button>
        </div>
      </div>
    </DemoBoundary>
  )
}

export default MatrixMultiplyDemo
