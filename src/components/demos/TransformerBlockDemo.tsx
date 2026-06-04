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

const STEP_H = 56
const ARROW_H = 28
const STEPS = [
  { label: 'LayerNorm', color: s.accent, desc: 'Normalizes values to prevent them from growing too large or too small.' },
  { label: 'Multi-Head Self-Attention', color: s.purple, desc: 'Each position blends information from all previous positions using Q, K, V.' },
  { label: '+ Residual', color: s.orange, desc: 'Adds the original input back \u2014 like a safety net so information is never lost.' },
  { label: 'LayerNorm', color: s.accent, desc: 'Normalizes again before the thinking step.' },
  { label: 'Feed-Forward', color: s.green, desc: 'A 2-layer neural network: expand 128\u2192512, ReLU, contract 512\u2192128.' },
  { label: '+ Residual', color: s.orange, desc: 'Adds the pre-FFN value back \u2014 the second residual connection.' },
]
const SHAPE = '[64, 256, 128]'

function cy(i: number) {
  return i * (STEP_H + ARROW_H) + STEP_H / 2
}

export default function TransformerBlockDemo() {
  const [step, setStep] = useState(1)

  const cur = STEPS[step - 1]

  return (
    <DemoBoundary>
      <div style={{
        maxWidth: 820,
        margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '24px 0',
      }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <div style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>
              Step {step} of 6
            </div>
            <div style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>
              {cur.label}
            </div>
          </div>
          <div style={{
            height: 6,
            background: s.bg3,
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(step / 6) * 100}%`,
              background: `linear-gradient(90deg, ${s.accent}, ${cur.color})`,
              borderRadius: 3,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <div style={{
            flex: '0 0 auto',
            width: 340,
            position: 'relative',
          }}>
            <div style={{ padding: '0 20px' }}>
              {STEPS.map((d, i) => (
                <div key={i}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    height: STEP_H - 20,
                    borderRadius: 8,
                    border: `1px solid ${step === i + 1 ? d.color : s.border}`,
                    background: step === i + 1
                      ? `linear-gradient(135deg, ${d.color}18, ${s.bg2})`
                      : s.bg2,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    boxSizing: 'border-box',
                  }}>
                    {step === i + 1 && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        background: d.color,
                        borderRadius: '3px 0 0 3px',
                      }} />
                    )}
                    <div style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: d.color,
                      flexShrink: 0,
                      opacity: step === i + 1 ? 1 : 0.5,
                    }} />
                    <div style={{
                      flex: 1,
                      color: step === i + 1 ? s.text : s.text2,
                      fontSize: 13,
                      fontWeight: step === i + 1 ? 600 : 400,
                      lineHeight: 1.3,
                    }}>
                      {d.label}
                    </div>
                    <div style={{
                      color: s.text3,
                      fontSize: 10,
                      fontFamily: s.mono,
                      whiteSpace: 'nowrap',
                      background: s.bg3,
                      padding: '2px 6px',
                      borderRadius: 4,
                      lineHeight: 1.4,
                    }}>
                      {SHAPE}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: ARROW_H,
                    }}>
                      <svg width={14} height={ARROW_H} viewBox={`0 0 14 ${ARROW_H}`}>
                        <line
                          x1={7} y1={0} x2={7} y2={ARROW_H - 6}
                          stroke={step > i ? d.color : s.border2}
                          strokeWidth={2}
                          strokeDasharray={step > i ? 'none' : '3 3'}
                        />
                        <polygon
                          points={`2,${ARROW_H - 6} 7,${ARROW_H} 12,${ARROW_H - 6}`}
                          fill={step > i ? d.color : s.border2}
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: STEPS.length * STEP_H + (STEPS.length - 1) * ARROW_H,
                pointerEvents: 'none',
              }}
            >
              <defs>
                <marker id="ra" markerWidth={7} markerHeight={5} refX={7} refY={2.5} orient="auto">
                  <polygon points="0,0 7,2.5 0,5" fill={s.orange} />
                </marker>
              </defs>
              <path
                d={`M 300,${cy(0)} C 330,${cy(0)} 330,${cy(2)} 300,${cy(2)}`}
                fill="none"
                stroke={s.orange}
                strokeWidth={2}
                strokeDasharray="5 3"
                opacity={step >= 3 ? 0.7 : 0.2}
                markerEnd="url(#ra)"
              />
              <path
                d={`M 300,${cy(3)} C 330,${cy(3)} 330,${cy(5)} 300,${cy(5)}`}
                fill="none"
                stroke={s.orange}
                strokeWidth={2}
                strokeDasharray="5 3"
                opacity={step >= 6 ? 0.7 : 0.2}
                markerEnd="url(#ra)"
              />
            </svg>
          </div>

          <div style={{ flex: 1, paddingTop: 4 }}>
            <div style={{
              background: s.bg2,
              border: `1px solid ${cur.color}30`,
              borderRadius: 10,
              padding: 20,
              minHeight: 130,
              boxSizing: 'border-box',
            }}>
              <div style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: 4,
                background: cur.color + '18',
                color: cur.color,
                fontSize: 12,
                fontFamily: s.mono,
                fontWeight: 600,
                marginBottom: 12,
              }}>
                Step {step}
              </div>
              <div style={{
                color: s.text,
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 16,
              }}>
                {cur.desc}
              </div>
              {step === 5 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 14px',
                  background: s.bg3,
                  borderRadius: 8,
                  flexWrap: 'wrap',
                }}>
                  <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text2 }}>128</div>
                  <svg width={34} height={18} viewBox="0 0 34 18">
                    <rect x={0} y={1} width={14} height={16} rx={3} fill={s.green} opacity={0.25} />
                    <text x={7} y={13} textAnchor="middle" fill={s.green} fontSize={9} fontFamily="monospace">W1</text>
                    <polygon points="16,9 21,4 21,14" fill={s.text3} />
                    <rect x={23} y={1} width={14} height={16} rx={3} fill={s.green} opacity={0.25} />
                    <text x={30} y={13} textAnchor="middle" fill={s.green} fontSize={9} fontFamily="monospace">W2</text>
                  </svg>
                  <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text2 }}>512</div>
                  <svg width={10} height={8}><polygon points="0,4 8,0 8,8" fill={s.text3} /></svg>
                  <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text2 }}>128</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setStep(p => Math.max(1, p - 1))}
                disabled={step === 1}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 6,
                  border: `1px solid ${step === 1 ? s.border : s.border2}`,
                  background: step === 1 ? s.bg3 : s.bg2,
                  color: step === 1 ? s.text3 : s.text2,
                  fontSize: 13,
                  fontFamily: s.mono,
                  cursor: step === 1 ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                &larr; Prev Step
              </button>
              <button
                onClick={() => setStep(p => Math.min(6, p + 1))}
                disabled={step === 6}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 6,
                  border: `1px solid ${step === 6 ? s.border : cur.color}`,
                  background: step === 6 ? s.bg3 : `${cur.color}18`,
                  color: step === 6 ? s.text3 : cur.color,
                  fontSize: 13,
                  fontFamily: s.mono,
                  cursor: step === 6 ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: 600,
                }}
              >
                Next Step &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
