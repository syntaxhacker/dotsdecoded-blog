import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const ORIGINAL = `function compute(x, y) {
  let result = x
  if (y > 0) {
    result = x + y
  } else {
    result = x - y
  }
  return result * 2
}`

const SSA_CODE = `function compute(x$0, y$1) {
  let result$0 = x$0
  // --- if (y > 0) ---
  if (y$1 > 0) {
    result$1 = x$0 + y$1
  } else {
    result$2 = x$0 - y$1
  }
  result$3 = phi(result$1, result$2)
  return result$3 * 2
}`

const STEPS = [
  { orig: 1, ssa: 1, color: s.accent, label: 'Step 1/5', desc: 'Version the initial assignment: result = x becomes result$0 = x$0' },
  { orig: 3, ssa: 4, color: s.green, label: 'Step 2/5', desc: 'Version the if-branch: result = x + y becomes result$1 = x$0 + y$1' },
  { orig: 5, ssa: 6, color: s.green, label: 'Step 3/5', desc: 'Version the else-branch: result = x - y becomes result$2 = x$0 - y$1' },
  { orig: -1, ssa: 8, color: s.yellow, label: 'Step 4/5', desc: 'Insert phi node at the join point: result$3 = phi(result$1, result$2)' },
  { orig: 7, ssa: 9, color: s.purple, label: 'Step 5/5', desc: 'Update the return: result * 2 becomes result$3 * 2' },
]

const INSIGHTS = [
  { text: 'In SSA form, each variable is assigned exactly once', minStep: 0, color: s.accent },
  { text: 'result was assigned 3 times, becoming result$0, result$1, result$2', minStep: 1, color: s.green },
  { text: 'The phi node merges values: result$3 = phi(result$1, result$2)', minStep: 3, color: s.yellow },
  { text: 'The compiler now tracks data flow precisely through unique names', minStep: 4, color: s.purple },
]

export default function SSAVisualDemo() {
  const [activeStep, setActiveStep] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => {
    timersRef.current.forEach(t => clearTimeout(t))
  }, [])

  const origHtml = useMemo(() => Prism.highlight(ORIGINAL, Prism.languages.javascript, 'javascript'), [])
  const ssaHtml = useMemo(() => Prism.highlight(SSA_CODE, Prism.languages.javascript, 'javascript'), [])
  const origLines = origHtml.split('\n')
  const ssaLines = ssaHtml.split('\n')

  const highlightOrig = (lineIdx: number) => {
    if (lineIdx < 0) return null
    for (let i = 0; i < STEPS.length; i++) {
      if (STEPS[i].orig === lineIdx) {
        if (activeStep === i) return STEPS[i].color
        if (completedSteps.has(i)) return s.green
      }
    }
    return null
  }

  const highlightSsa = (lineIdx: number) => {
    if (lineIdx < 0) return null
    for (let i = 0; i < STEPS.length; i++) {
      if (STEPS[i].ssa === lineIdx) {
        if (activeStep === i) return STEPS[i].color
        if (completedSteps.has(i)) return s.green
      }
    }
    return null
  }

  const play = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    setActiveStep(-1)
    setCompletedSteps(new Set())
    setIsPlaying(true)

    let current = 0
    const advance = () => {
      setActiveStep(current)
      setCompletedSteps(prev => new Set([...prev, current]))
      current++
      if (current < STEPS.length) {
        timersRef.current.push(setTimeout(advance, 900))
      } else {
        timersRef.current.push(setTimeout(() => {
          setActiveStep(-1)
          setIsPlaying(false)
        }, 400))
      }
    }
    timersRef.current.push(setTimeout(advance, 200))
  }, [])

  const reset = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    setActiveStep(-1)
    setCompletedSteps(new Set())
    setIsPlaying(false)
  }, [])

  const stepInfo = activeStep >= 0 ? STEPS[activeStep] : null
  const isDone = completedSteps.size === STEPS.length && !isPlaying

  const lineStyle = (highlightColor: string | null): React.CSSProperties => ({
    fontFamily: s.mono,
    fontSize: 13,
    lineHeight: '22px',
    padding: '0 12px',
    borderLeft: `2px solid ${highlightColor || 'transparent'}`,
    background: highlightColor ? `${highlightColor}14` : 'transparent',
    whiteSpace: 'pre',
    transition: 'all 0.4s ease',
  })

  return (
    <DemoBoundary name="SSA Visual Demo">
      <div style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: s.bg, color: s.text, padding: 24,
        borderRadius: 12, border: `1px solid ${s.border}`,
      }}>
        <style>{`
          .ssa-code .token.keyword { color: #f92672; }
          .ssa-code .token.string, .ssa-code .token.char, .ssa-code .token.builtin { color: #e6db74; }
          .ssa-code .token.number, .ssa-code .token.constant, .ssa-code .token.symbol, .ssa-code .token.property { color: #ae81ff; }
          .ssa-code .token.function, .ssa-code .token.class-name { color: #a6e22e; }
          .ssa-code .token.operator, .ssa-code .token.punctuation { color: #f8f8f2; }
          .ssa-code .token.comment { color: #75715e; font-style: italic; }
        `}</style>

        {(activeStep >= 0 || isDone) && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {STEPS.map((st, i) => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: completedSteps.has(i) || activeStep === i ? st.color : s.bg3,
                  opacity: completedSteps.has(i) || activeStep >= i ? 1 : 0.3,
                  transition: 'all 0.4s ease',
                }} />
              ))}
            </div>
            {stepInfo && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 6,
                background: `${stepInfo.color}14`,
                border: `1px solid ${stepInfo.color}33`,
              }}>
                <span style={{
                  fontFamily: s.mono, fontSize: 11, fontWeight: 700,
                  color: stepInfo.color, whiteSpace: 'nowrap',
                }}>{stepInfo.label}</span>
                <span style={{ fontSize: 12, color: s.text2 }}>{stepInfo.desc}</span>
              </div>
            )}
            {isDone && (
              <div style={{
                padding: '8px 12px', borderRadius: 6,
                background: `${s.accent}0c`,
                border: `1px solid ${s.accent}20`,
                fontSize: 12, color: s.accent, fontWeight: 600, textAlign: 'center',
              }}>
                SSA conversion complete -- every variable now has a single assignment point
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', color: s.text3, marginBottom: 6, fontFamily: s.mono,
            }}>Original Code</div>
            <div style={{
              background: s.bg2, borderRadius: 8,
              border: `1px solid ${s.border}`, overflow: 'hidden',
            }}>
              <div className="ssa-code" style={{ padding: '10px 0', overflowX: 'auto' }}>
                {origLines.map((html, i) => (
                  <div key={i} style={{ display: 'flex' }}>
                    <div style={{
                      fontFamily: s.mono, fontSize: 11, lineHeight: '22px',
                      color: s.text3, width: 28, textAlign: 'right',
                      paddingRight: 10, userSelect: 'none', flexShrink: 0,
                    }}>{i + 1}</div>
                    <div
                      dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }}
                      style={lineStyle(highlightOrig(i))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', flexShrink: 0, padding: '0 2px',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', color: s.text3, marginBottom: 6, fontFamily: s.mono,
            }}>SSA Form</div>
            <div style={{
              background: s.bg2, borderRadius: 8,
              border: `1px solid ${s.border}`, overflow: 'hidden',
            }}>
              <div className="ssa-code" style={{ padding: '10px 0', overflowX: 'auto' }}>
                {ssaLines.map((html, i) => (
                  <div key={i} style={{ display: 'flex' }}>
                    <div style={{
                      fontFamily: s.mono, fontSize: 11, lineHeight: '22px',
                      color: s.text3, width: 28, textAlign: 'right',
                      paddingRight: 10, userSelect: 'none', flexShrink: 0,
                    }}>{i + 1}</div>
                    <div
                      dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }}
                      style={lineStyle(highlightSsa(i))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
          <button onClick={play} disabled={isPlaying} style={{
            padding: '7px 18px', fontSize: 12, fontWeight: 600,
            fontFamily: s.mono, border: 'none', borderRadius: 6,
            cursor: isPlaying ? 'wait' : 'pointer',
            background: isPlaying ? s.bg3 : s.accent,
            color: isPlaying ? s.text3 : s.bg,
            transition: 'background 0.2s, color 0.2s',
          }}>
            {isPlaying ? 'Converting...' : 'Show SSA Conversion Step by Step'}
          </button>
          <button onClick={reset} style={{
            padding: '7px 18px', fontSize: 12, fontWeight: 600,
            fontFamily: s.mono, border: `1px solid ${s.border}`, borderRadius: 6,
            cursor: 'pointer', background: s.bg2, color: s.text2,
          }}>
            Reset
          </button>
        </div>

        <div style={{
          marginTop: 18, padding: '14px 16px',
          background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`,
        }}>
          <div style={{
            fontSize: 10, color: s.text2, marginBottom: 10,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>Key Insights</div>
          {INSIGHTS.map((ex, i) => {
            const active = activeStep >= ex.minStep || isDone
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                marginBottom: i < INSIGHTS.length - 1 ? 8 : 0,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0,
                  background: active ? ex.color : s.border,
                  transition: 'background 0.4s',
                }} />
                <div style={{
                  fontSize: 12, lineHeight: 1.6,
                  color: active ? s.text2 : s.text3,
                  transition: 'color 0.4s',
                }}>{ex.text}</div>
              </div>
            )
          })}
        </div>
      </div>
    </DemoBoundary>
  )
}
