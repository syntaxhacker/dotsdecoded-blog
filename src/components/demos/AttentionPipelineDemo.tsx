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

const steps = [
  'Input Embeddings',
  'Create Q, K, V',
  'Compute Scores',
  'Scale Scores',
  'Apply Softmax',
  'Multiply by V',
  'Output',
]

const labels = ['I', 'love', 'AI']

const X = [[1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0]]
const Q = [[2, 0, 1], [0, 2, 1], [1, 1, 1]]
const K = [[0, 1, 1], [2, 1, 1], [1, 1, 1]]
const V = [[1, 0, 1], [1, 2, 0], [1, 1, 0]]
const scores = [[1, 5, 3], [3, 3, 3], [2, 4, 3]]
const scaled = [[0.577, 2.887, 1.732], [1.732, 1.732, 1.732], [1.155, 2.309, 1.732]]
const weights = [[0.070, 0.707, 0.223], [0.333, 0.333, 0.333], [0.168, 0.533, 0.299]]
const output = [[1.000, 1.637, 0.070], [1.000, 1.000, 0.333], [1.000, 1.365, 0.168]]

function Matrix({ data, labels: rowLabels, color, highlightCol }: { data: number[][], labels?: string[], color?: string, highlightCol?: number }) {
  return (
    <div style={{ display: 'inline-block' }}>
      <div style={{ fontFamily: s.mono, fontSize: 12, color: s.text2, lineHeight: 1.8 }}>
        {data.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {rowLabels && <span style={{ color: s.yellow, width: 36, textAlign: 'right', display: 'inline-block' }}>{rowLabels[ri]}</span>}
            {rowLabels && <span style={{ color: s.text3 }}>|</span>}
            {row.map((v, ci) => (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  width: 52,
                  textAlign: 'right',
                  padding: '2px 4px',
                  borderRadius: 3,
                  backgroundColor: highlightCol === ci ? (color || s.accent) + '22' : 'transparent',
                  color: highlightCol === ci ? (color || s.accent) : s.text,
                  fontWeight: highlightCol === ci ? 600 : 400,
                  transition: 'all 0.3s ease',
                }}
              >
                {v.toFixed(3)}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function Grid({ data, rowLabels, colLabels, color, highlightCell }: { data: number[][], rowLabels?: string[], colLabels?: string[], color?: string, highlightCell?: [number, number] }) {
  return (
    <div style={{ display: 'inline-block' }}>
      {colLabels && (
        <div style={{ display: 'flex', gap: 4, paddingLeft: rowLabels ? 40 : 0, marginBottom: 2 }}>
          {colLabels.map((l, i) => (
            <span key={i} style={{ width: 52, textAlign: 'right', fontSize: 10, color: s.text3, fontFamily: s.mono }}>{l}</span>
          ))}
        </div>
      )}
      <div style={{ fontFamily: s.mono, fontSize: 12, lineHeight: 1.8 }}>
        {data.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {rowLabels && <span style={{ color: s.yellow, width: 36, textAlign: 'right', display: 'inline-block', fontSize: 11 }}>{rowLabels[ri]}</span>}
            {rowLabels && <span style={{ color: s.text3 }}>|</span>}
            {row.map((v, ci) => {
              const isHl = highlightCell && highlightCell[0] === ri && highlightCell[1] === ci
              return (
                <span
                  key={ci}
                  style={{
                    display: 'inline-block',
                    width: 52,
                    textAlign: 'right',
                    padding: '2px 4px',
                    borderRadius: 3,
                    backgroundColor: isHl ? (color || s.accent) + '33' : s.bg2,
                    color: isHl ? (color || s.accent) : s.text,
                    fontWeight: isHl ? 700 : 400,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {typeof v === 'number' && v % 1 !== 0 ? v.toFixed(3) : v}
                </span>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function StepContent({ step, fading }: { step: number; fading: boolean }) {
  const opacity = fading ? 0 : 1

  if (step === 0) {
    return (
      <div style={{ opacity, transition: 'opacity 0.4s ease' }}>
        <div style={{ color: s.text2, marginBottom: 12, fontSize: 13 }}>
          Each word is converted into a fixed-size vector by looking up an embedding table.
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, justifyContent: 'center' }}>
          {labels.map((word, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                backgroundColor: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
                padding: '12px 16px', marginBottom: 6,
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.accent, marginBottom: 6 }}>{word}</div>
                <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  {X[i].map((v, j) => (
                    <span key={j} style={{
                      display: 'inline-block', width: 22, textAlign: 'center',
                      padding: '2px 0', borderRadius: 2, backgroundColor: s.bg3,
                    }}>
                      {v}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>x{sub1(i + 1)}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontFamily: s.mono, fontSize: 12, color: s.text2 }}>
          <span style={{ color: s.yellow }}>X</span> = {'[['}{X.map(r => r.join(',')).join('],[')}{']]'}
          <div style={{ fontSize: 10, color: s.text3, marginTop: 4 }}>shape: (3, 4) -- 3 tokens, 4 dimensions each</div>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div style={{ opacity, transition: 'opacity 0.4s ease' }}>
        <div style={{ color: s.text2, marginBottom: 12, fontSize: 13 }}>
          X is multiplied by three learned weight matrices Wq, Wk, Wv to produce Query, Key, and Value projections.
        </div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'flex-start' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.accent, marginBottom: 6, fontFamily: s.mono }}>Query (Q)</div>
            <div style={{ border: `1px solid ${s.accent}44`, borderRadius: 6, padding: 8, backgroundColor: s.bg2 }}>
              <Matrix data={Q} labels={labels} color={s.accent} />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.green, marginBottom: 6, fontFamily: s.mono }}>Key (K)</div>
            <div style={{ border: `1px solid ${s.green}44`, borderRadius: 6, padding: 8, backgroundColor: s.bg2 }}>
              <Matrix data={K} labels={labels} color={s.green} />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.purple, marginBottom: 6, fontFamily: s.mono }}>Value (V)</div>
            <div style={{ border: `1px solid ${s.purple}44`, borderRadius: 6, padding: 8, backgroundColor: s.bg2 }}>
              <Matrix data={V} labels={labels} color={s.purple} />
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12, fontFamily: s.mono, fontSize: 11, color: s.text3 }}>
          Q = XWq, K = XWk, V = XWv -- each reduces 4 dims to 3 dims
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div style={{ opacity, transition: 'opacity 0.4s ease' }}>
        <div style={{ color: s.text2, marginBottom: 12, fontSize: 13 }}>
          Compute raw attention scores by taking the dot product of every query with every key. A high score means "pay attention to this token."
        </div>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: s.mono, fontSize: 13, color: s.text2, marginBottom: 12 }}>
            <span style={{ color: s.accent }}>Q</span> x <span style={{ color: s.green }}>K</span>
            <span style={{ color: s.text3, verticalAlign: 'super', fontSize: 10 }}>T</span>
            {' = '}
            <span style={{ color: s.yellow }}>Scores</span>
          </div>
          <Grid data={scores} rowLabels={labels} colLabels={labels} color={s.yellow} />
        </div>
        <div style={{ textAlign: 'center', fontFamily: s.mono, fontSize: 11, color: s.text3 }}>
          Cell (i, j) = how much token i should attend to token j
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div style={{ opacity, transition: 'opacity 0.4s ease' }}>
        <div style={{ color: s.text2, marginBottom: 12, fontSize: 13 }}>
          Divide each score by sqrt(d_k) = sqrt(3) ~ 1.732. This prevents dot products from growing too large for high-dimensional keys.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginBottom: 6 }}>Before</div>
            <Grid data={scores} rowLabels={labels} colLabels={labels} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="40" height="20" viewBox="0 0 40 20">
              <line x1="4" y1="10" x2="32" y2="10" stroke={s.accent} strokeWidth="1.5" />
              <polygon points="30,6 36,10 30,14" fill={s.accent} />
            </svg>
            <div style={{
              fontFamily: s.mono, fontSize: 10, color: s.orange,
              backgroundColor: s.orange + '15', padding: '2px 6px', borderRadius: 4,
              border: `1px solid ${s.orange}33`,
            }}>
              / sqrt(3)
            </div>
            <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>~ 1.732</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.accent, marginBottom: 6 }}>After</div>
            <Grid data={scaled} rowLabels={labels} colLabels={labels} color={s.accent} />
          </div>
        </div>
      </div>
    )
  }

  if (step === 4) {
    return (
      <div style={{ opacity, transition: 'opacity 0.4s ease' }}>
        <div style={{ color: s.text2, marginBottom: 12, fontSize: 13 }}>
          Apply softmax to each row to convert scores into probabilities that sum to 1. Each row now shows how a token distributes its attention.
        </div>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: s.mono, fontSize: 13, color: s.text2, marginBottom: 12 }}>
            softmax(<span style={{ color: s.yellow }}>Scores</span>) = <span style={{ color: s.green }}>Weights</span>
          </div>
          <Grid data={weights} rowLabels={labels} colLabels={labels} color={s.green} />
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12 }}>
          {weights.map((row, i) => (
            <div key={i} style={{
              fontFamily: s.mono, fontSize: 10, color: s.text3,
              backgroundColor: s.bg2, padding: '4px 10px', borderRadius: 4,
              border: `1px solid ${s.border}`,
            }}>
              <span style={{ color: s.yellow }}>{labels[i]}</span>{' '}
              attends most to{' '}
              <span style={{ color: s.green }}>{labels[row.indexOf(Math.max(...row))]}</span>
              {' ('}{Math.max(...row).toFixed(3)}{')'}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (step === 5) {
    return (
      <div style={{ opacity, transition: 'opacity 0.4s ease' }}>
        <div style={{ color: s.text2, marginBottom: 12, fontSize: 13 }}>
          Multiply the attention weights by the Value matrix. Each output vector is a weighted sum of all value vectors.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.green, marginBottom: 6 }}>Weights</div>
            <Matrix data={weights} labels={labels} color={s.green} />
          </div>
          <div style={{ fontSize: 18, color: s.text3, fontFamily: s.mono }}>x</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.purple, marginBottom: 6 }}>Value (V)</div>
            <Matrix data={V} labels={labels} color={s.purple} />
          </div>
          <div style={{ fontSize: 18, color: s.text3, fontFamily: s.mono }}>=</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.orange, marginBottom: 6 }}>Output</div>
            <Matrix data={output} labels={labels} color={s.orange} />
          </div>
        </div>
      </div>
    )
  }

  if (step === 6) {
    return (
      <div style={{ opacity, transition: 'opacity 0.4s ease' }}>
        <div style={{ color: s.text2, marginBottom: 12, fontSize: 13 }}>
          The final output contains context-aware representations. Compare "AI" below with its original embedding -- it now carries information from all tokens.
        </div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          {labels.map((word, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                backgroundColor: s.bg2, border: `1px solid ${s.orange}44`, borderRadius: 8,
                padding: '12px 16px', marginBottom: 6,
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.orange, marginBottom: 8 }}>{word}</div>
                <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, display: 'flex', gap: 2, justifyContent: 'center', flexDirection: 'column' }}>
                  {output[i].map((v, j) => (
                    <div key={j} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{ color: s.text3, fontSize: 9, width: 14 }}>d{j + 1}</span>
                      <span style={{
                        display: 'inline-block', width: 48, textAlign: 'right',
                        padding: '1px 4px', borderRadius: 2, backgroundColor: s.bg3,
                        color: v > 1.3 ? s.orange : v > 1 ? s.text : s.text3,
                      }}>
                        {v.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
                attended to <span style={{ color: s.green }}>{labels[weights[i].indexOf(Math.max(...weights[i]))]}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 12, fontFamily: s.mono, fontSize: 11, color: s.text3 }}>
          Each output vector blends information from all positions based on learned relevance
        </div>
      </div>
    )
  }

  return null
}

function sub1(n: number): string {
  const subs = '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089'
  return String(n).split('').map(c => subs[parseInt(c)]).join('')
}

export default function AttentionPipelineDemo() {
  const [activeStep, setActiveStep] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!autoPlay) return
    const timer = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setActiveStep(prev => {
          if (prev >= 6) {
            setAutoPlay(false)
            return prev
          }
          return prev + 1
        })
        setFading(false)
      }, 200)
    }, 1500)
    return () => clearInterval(timer)
  }, [autoPlay])

  const goTo = (dir: number) => {
    const next = activeStep + dir
    if (next < 0 || next > 6) return
    setFading(true)
    setTimeout(() => {
      setActiveStep(next)
      setFading(false)
    }, 200)
    setAutoPlay(false)
  }

  const goToStep = (i: number) => {
    if (i === activeStep) return
    setFading(true)
    setTimeout(() => {
      setActiveStep(i)
      setFading(false)
    }, 200)
    setAutoPlay(false)
  }

  return (
    <DemoBoundary name="Attention Pipeline">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, padding: '12px 8px',
        }}>
          {steps.map((name, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && (
                <svg width="16" height="10" viewBox="0 0 16 10" style={{ flexShrink: 0 }}>
                  <line x1="0" y1="5" x2="12" y2="5" stroke={i <= activeStep ? s.accent : s.border} strokeWidth="1" />
                  <polygon
                    points="10,2 14,5 10,8"
                    fill={i <= activeStep ? s.accent : s.border}
                  />
                </svg>
              )}
              <button
                onClick={() => goToStep(i)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: `1px solid ${i === activeStep ? s.accent : s.border}`,
                  backgroundColor: i === activeStep ? s.accent + '15' : s.bg2,
                  color: i === activeStep ? s.accent : s.text3,
                  fontSize: 11,
                  fontFamily: s.mono,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  outline: 'none',
                }}
              >
                <div style={{ fontSize: 9, color: i === activeStep ? s.accent + '99' : s.text3 + '66', marginBottom: 1 }}>Step {i}</div>
                {name}
              </button>
            </div>
          ))}
        </div>

        <div style={{
          backgroundColor: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10,
          padding: 24, minHeight: 220,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                backgroundColor: s.accent + '20', border: `1px solid ${s.accent}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: s.mono, fontSize: 13, fontWeight: 700, color: s.accent,
              }}>
                {activeStep}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: s.text }}>{steps[activeStep]}</div>
                <div style={{ fontSize: 11, color: s.text3 }}>{activeStep + 1} of {steps.length}</div>
              </div>
            </div>
          </div>

          <StepContent step={activeStep} fading={fading} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16 }}>
          <button
            onClick={() => goTo(-1)}
            disabled={activeStep === 0}
            style={{
              padding: '6px 16px', borderRadius: 6,
              border: `1px solid ${s.border}`, backgroundColor: s.bg2,
              color: activeStep === 0 ? s.text3 : s.text, fontSize: 12,
              cursor: activeStep === 0 ? 'not-allowed' : 'pointer',
              fontFamily: s.mono, transition: 'all 0.2s ease', outline: 'none',
            }}
          >
            Previous
          </button>
          <button
            onClick={() => { setAutoPlay(!autoPlay); setFading(false) }}
            style={{
              padding: '6px 16px', borderRadius: 6,
              border: `1px solid ${autoPlay ? s.red : s.accent}`,
              backgroundColor: autoPlay ? s.red + '20' : s.accent + '15',
              color: autoPlay ? s.red : s.accent, fontSize: 12,
              cursor: 'pointer', fontFamily: s.mono, transition: 'all 0.2s ease', outline: 'none',
            }}
          >
            {autoPlay ? 'Pause' : 'Auto Play'}
          </button>
          <button
            onClick={() => goTo(1)}
            disabled={activeStep === 6}
            style={{
              padding: '6px 16px', borderRadius: 6,
              border: `1px solid ${s.border}`, backgroundColor: s.bg2,
              color: activeStep === 6 ? s.text3 : s.text, fontSize: 12,
              cursor: activeStep === 6 ? 'not-allowed' : 'pointer',
              fontFamily: s.mono, transition: 'all 0.2s ease', outline: 'none',
            }}
          >
            Next
          </button>
        </div>
      </div>
    </DemoBoundary>
  )
}
