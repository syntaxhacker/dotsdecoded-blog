import { useState, useEffect, useRef, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

const STATE_NAMES = ['SNT', 'WNT', 'WT', 'ST'] as const
const STATE_LABELS = ['Strongly NT', 'Weakly NT', 'Weakly T', 'Strongly T'] as const
const STATE_COLORS = [s.red, s.orange, s.yellow, s.green]

function genPattern(idx: number): boolean[] {
  switch (idx) {
    case 0:
      return Array(24).fill(true)
    case 1:
      return Array.from({ length: 24 }, (_, i) => i % 2 === 0)
    case 2: {
      const a = Array(24).fill(true)
      for (let i = 3; i < 24; i += 7) a[i] = false
      return a
    }
    case 3:
      return Array.from({ length: 24 }, () => Math.random() > 0.5)
    case 4:
    default: {
      const a = Array(24).fill(true)
      for (let i = 3; i < 24; i += 7) a[i] = false
      return a
    }
  }
}

const PATTERN_NAMES = ['Always Taken', 'Alternating', 'Mostly Taken', 'Random', '2-bit Saturating']

interface StepResult {
  outcome: boolean
  predicted: boolean
  correct: boolean
  stateBefore: number
  stateAfter: number
}

export default function BranchPredictorDemo() {
  const [patternIdx, setPatternIdx] = useState(0)
  const [outcomes, setOutcomes] = useState<boolean[]>(() => genPattern(0))
  const [stepIdx, setStepIdx] = useState(0)
  const [results, setResults] = useState<StepResult[]>([])
  const [predictorState, setPredictorState] = useState(0)
  const [autoPlaying, setAutoPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [lastTransition, setLastTransition] = useState<'T' | 'NT' | null>(null)

  const resultsRef = useRef<StepResult[]>([])
  const stepRef = useRef(0)
  const stateRef = useRef(0)
  const autoRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const is2Bit = patternIdx === 4

  useEffect(() => {
    const p = genPattern(patternIdx)
    setOutcomes(p)
    setStepIdx(0)
    setResults([])
    setPredictorState(0)
    setLastTransition(null)
    resultsRef.current = []
    stepRef.current = 0
    stateRef.current = 0
    if (autoPlaying) {
      setAutoPlaying(false)
      autoRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [patternIdx])

  const stopAuto = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setAutoPlaying(false)
    autoRef.current = false
  }, [])

  const processStep = useCallback(() => {
    const currentStep = stepRef.current
    if (currentStep >= outcomes.length) {
      stopAuto()
      return
    }

    const outcome = outcomes[currentStep]

    let predicted: boolean
    let newState: number

    if (is2Bit) {
      predicted = stateRef.current >= 2
      const st = stateRef.current
      newState = outcome ? Math.min(st + 1, 3) : Math.max(st - 1, 0)
      setPredictorState(newState)
      stateRef.current = newState
    } else {
      predicted = true
      newState = stateRef.current
    }

    const correct = predicted === outcome
    const result: StepResult = {
      outcome,
      predicted,
      correct,
      stateBefore: stateRef.current,
      stateAfter: is2Bit ? newState : stateRef.current,
    }

    const newResults = [...resultsRef.current, result]
    resultsRef.current = newResults
    setResults(newResults)
    setStepIdx(currentStep + 1)
    stepRef.current = currentStep + 1
    setLastTransition(outcome ? 'T' : 'NT')
  }, [outcomes, is2Bit, stopAuto])

  const stepOnce = useCallback(() => {
    processStep()
  }, [processStep])

  const reset = useCallback(() => {
    stopAuto()
    setStepIdx(0)
    setResults([])
    setPredictorState(0)
    setLastTransition(null)
    resultsRef.current = []
    stepRef.current = 0
    stateRef.current = 0
  }, [stopAuto])

  useEffect(() => {
    if (!autoPlaying) return
    const delay = getStepDelay(400, speed)
    intervalRef.current = setInterval(() => {
      processStep()
    }, delay)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [autoPlaying, speed, processStep])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const totalBranches = results.length
  const correctCount = results.filter(r => r.correct).length
  const mispredictionCount = totalBranches - correctCount
  const accuracy = totalBranches > 0 ? ((correctCount / totalBranches) * 100).toFixed(1) : '0.0'

  const allDone = stepIdx >= outcomes.length

  return (
    <DemoBoundary name="Branch Predictor">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Branch Predictor</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          A branch predictor guesses whether a conditional jump will be taken. Different patterns are easier or harder to predict.
        </p>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {PATTERN_NAMES.map((name, i) => (
            <button
              key={name}
              onClick={() => { if (!autoPlaying) setPatternIdx(i) }}
              style={{
                background: patternIdx === i ? s.accent : s.bg3,
                border: `1px solid ${patternIdx === i ? s.accent : s.border}`,
                borderRadius: 6,
                padding: '5px 12px',
                color: patternIdx === i ? '#fff' : s.text2,
                cursor: autoPlaying ? 'default' : 'pointer',
                fontSize: 12,
                opacity: autoPlaying && patternIdx !== i ? 0.5 : 1,
              }}
            >
              {name}
            </button>
          ))}
        </div>

        <div style={{
          display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16,
          justifyContent: 'center',
        }}>
          {outcomes.map((outcome, i) => {
            const result = results[i]
            let bg = 'transparent'
            let borderColor = s.border
            let borderWidth = 1

            if (result) {
              if (result.correct) {
                borderColor = s.green
                bg = result.outcome ? s.green + '55' : 'transparent'
              } else {
                borderColor = s.red
                bg = result.outcome ? s.red + '55' : 'transparent'
              }
            } else if (i < stepIdx) {
              borderColor = s.text3
            }

            if (i === stepIdx && !allDone) {
              borderWidth = 2
              borderColor = s.accent
            }

            return (
              <div
                key={i}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: bg,
                  border: `${borderWidth}px solid ${borderColor}`,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontFamily: s.mono,
                  color: result
                    ? (result.correct ? s.green : s.red)
                    : s.text3,
                  fontWeight: 700,
                }}
                title={`Branch ${i + 1}: ${outcome ? 'Taken' : 'Not Taken'} ${result ? (result.correct ? '(correct)' : '(mispredicted)') : '(pending)'}`}
              />
            )
          })}
        </div>

        {is2Bit && (
          <div style={{
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: 16,
          }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              2-bit Saturating Counter
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {STATE_NAMES.map((name, i) => {
                const isCurrent = predictorState === i
                const isTransition = lastTransition && (
                  (lastTransition === 'T' && (i === predictorState || (predictorState > 0 && i === predictorState - 1))) ||
                  (lastTransition === 'NT' && (i === predictorState || (predictorState < 3 && i === predictorState + 1)))
                )
                return (
                  <div
                    key={name}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: 6,
                      textAlign: 'center',
                      background: isCurrent ? STATE_COLORS[i] + '33' : s.bg3,
                      border: isCurrent
                        ? `2px solid ${STATE_COLORS[i]}`
                        : i === predictorState + 1 || i === predictorState - 1
                          ? `1px solid ${s.border2}`
                          : `1px solid transparent`,
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <div style={{
                      color: isCurrent ? STATE_COLORS[i] : s.text3,
                      fontSize: 14,
                      fontWeight: isCurrent ? 700 : 400,
                      fontFamily: s.mono,
                    }}>
                      {name}
                    </div>
                    <div style={{ color: s.text3, fontSize: 9, marginTop: 2 }}>
                      {STATE_LABELS[i]}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {STATE_NAMES.slice(0, -1).map((_, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <span style={{
                    color: lastTransition === 'T' && predictorState > 0
                      ? (predictorState - 1 === i ? s.green : s.text3)
                      : s.text3,
                    fontSize: 11,
                    fontFamily: s.mono,
                    transition: 'color 0.2s',
                  }}>
                    T →
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {STATE_NAMES.slice(0, -1).map((_, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <span style={{
                    color: lastTransition === 'NT' && predictorState < 3
                      ? (predictorState + 1 === i ? s.orange : s.text3)
                      : s.text3,
                    fontSize: 11,
                    fontFamily: s.mono,
                    transition: 'color 0.2s',
                  }}>
                    ← NT
                  </span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 10,
              padding: '8px 12px',
              background: s.bg2,
              borderRadius: 6,
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <span style={{ color: s.text2, fontSize: 12 }}>
                State: <span style={{ color: STATE_COLORS[predictorState], fontFamily: s.mono, fontWeight: 700 }}>{STATE_NAMES[predictorState]}</span>
                ({predictorState.toString(2).padStart(2, '0')})
                → Predicts: <span style={{ color: predictorState >= 2 ? s.green : s.red, fontFamily: s.mono, fontWeight: 700 }}>
                  {predictorState >= 2 ? 'Taken' : 'Not Taken'}
                </span>
              </span>
            </div>
          </div>
        )}

        {!is2Bit && results.length > 0 && (
          <div style={{
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            textAlign: 'center',
          }}>
            <span style={{ color: s.text2, fontSize: 13 }}>
              Predictor always guesses <span style={{ color: s.green, fontWeight: 700 }}>Taken</span>
              {' '}— branches not taken are mispredictions
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          {!allDone ? (
            <button
              onClick={stepOnce}
              disabled={autoPlaying}
              style={{
                background: s.accent,
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                color: '#fff',
                cursor: autoPlaying ? 'default' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
                opacity: autoPlaying ? 0.5 : 1,
              }}
            >
              Step
            </button>
          ) : null}
          {!allDone && !autoPlaying ? (
            <button
              onClick={() => {
                setAutoPlaying(true)
                autoRef.current = true
              }}
              style={{
                background: s.green,
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Auto-Play
            </button>
          ) : null}
          {autoPlaying ? (
            <button
              onClick={stopAuto}
              style={{
                background: s.red,
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Stop
            </button>
          ) : null}
          <button
            onClick={reset}
            style={{
              background: s.bg3,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '10px 20px',
              color: s.text2,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Reset
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 70 }}>
              <div style={{ color: s.text, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{totalBranches}</div>
              <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</div>
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 70 }}>
              <div style={{ color: s.green, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{correctCount}</div>
              <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Correct</div>
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 70 }}>
              <div style={{ color: s.red, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{mispredictionCount}</div>
              <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mispred</div>
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 70 }}>
              <div style={{ color: correctCount > mispredictionCount ? s.green : s.red, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{accuracy}%</div>
              <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Accuracy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
