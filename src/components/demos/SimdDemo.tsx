import { useState, useEffect, useCallback } from 'react'
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

const data = [2, 4, 6, 8, 10, 12, 14, 16]
const SCALAR_TOTAL = 8
const SIMD_TOTAL = 2

export default function SimdDemo() {
  const [mode, setMode] = useState<'idle' | 'scalar' | 'simd' | 'both'>('idle')
  const [scalarStep, setScalarStep] = useState(0)
  const [simdStep, setSimdStep] = useState(0)
  const [speed, setSpeed] = useState(1)

  const reset = useCallback(() => {
    setMode('idle')
    setScalarStep(0)
    setSimdStep(0)
  }, [])

  const runScalar = useCallback(() => {
    setMode('scalar')
    setScalarStep(1)
    setSimdStep(0)
  }, [])

  const runSimd = useCallback(() => {
    setMode('simd')
    setSimdStep(1)
    setScalarStep(0)
  }, [])

  const runBoth = useCallback(() => {
    setMode('both')
    setScalarStep(1)
    setSimdStep(1)
  }, [])

  useEffect(() => {
    if (mode === 'idle') return
    const advanceScalar = (mode === 'scalar' || mode === 'both') && scalarStep <= SCALAR_TOTAL
    const advanceSimd = (mode === 'simd' || mode === 'both') && simdStep <= SIMD_TOTAL
    if (!advanceScalar && !advanceSimd) return
    const timer = setTimeout(() => {
      if (advanceScalar) setScalarStep(prev => prev + 1)
      if (advanceSimd) setSimdStep(prev => prev + 1)
    }, getStepDelay(400, speed))
    return () => clearTimeout(timer)
  }, [mode, scalarStep, simdStep, speed])

  const scalarActive = scalarStep >= 1 && scalarStep <= SCALAR_TOTAL ? [scalarStep - 1] : []
  const simdActive = (() => {
    if (simdStep < 1 || simdStep > SIMD_TOTAL) return []
    if (simdStep === 1) return [0, 1, 2, 3]
    return [4, 5, 6, 7]
  })()

  const scalarProcessed: number[] = []
  for (let i = 1; i < scalarStep && i <= SCALAR_TOTAL; i++) {
    scalarProcessed.push(i - 1)
  }

  const simdProcessed: number[] = []
  if (simdStep === 3) {
    for (let i = 0; i < 8; i++) simdProcessed.push(i)
  } else if (simdStep === 2) {
    for (let i = 0; i < 4; i++) simdProcessed.push(i)
  }

  const scalarLabel = scalarStep === 0 ? 'Idle' : scalarStep > SCALAR_TOTAL ? `Complete (${SCALAR_TOTAL}/${SCALAR_TOTAL})` : `Cycle ${scalarStep}/${SCALAR_TOTAL}`
  const simdLabel = simdStep === 0 ? 'Idle' : simdStep > SIMD_TOTAL ? `Complete (${SIMD_TOTAL}/${SIMD_TOTAL})` : `Cycle ${simdStep}/${SIMD_TOTAL}`

  const scalarRunning = scalarStep >= 1 && scalarStep <= SCALAR_TOTAL
  const simdRunning = simdStep >= 1 && simdStep <= SIMD_TOTAL
  const isRunning = mode !== 'idle'
  const bothDone = scalarStep > SCALAR_TOTAL && simdStep > SIMD_TOTAL

  const renderBox = (val: number, i: number, processed: number[], active: number[]) => {
    const isActive = active.includes(i)
    const isProcessed = processed.includes(i)
    let displayVal: string
    let bgColor: string
    let borderColor: string
    let textColor: string
    if (isActive) {
      displayVal = String(val)
      bgColor = `${s.accent}25`
      borderColor = s.accent
      textColor = s.text
    } else if (isProcessed) {
      displayVal = String(val + 1)
      bgColor = `${s.green}15`
      borderColor = s.green
      textColor = s.green
    } else {
      displayVal = String(val)
      bgColor = s.bg2
      borderColor = s.border
      textColor = s.text3
    }
    return (
      <div key={i} style={{
        width: 68, height: 56, borderRadius: 8,
        background: bgColor, border: `2px solid ${borderColor}`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.25s ease', position: 'relative',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: textColor, fontFamily: s.mono, lineHeight: 1 }}>
          {displayVal}
        </div>
        {isActive && <div style={{
          position: 'absolute', bottom: -1, left: -1, right: -1, height: 4,
          background: s.accent, borderRadius: '0 0 7px 7px',
          boxShadow: `0 0 10px ${s.accent}`,
        }} />}
      </div>
    )
  }

  return (
    <DemoBoundary name="SIMD Processing">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>
          SIMD vs Scalar Processing
        </div>
        <div style={{ color: s.text2, fontSize: 14, lineHeight: 1.5 }}>
          Add 1 to all elements:{' '}
          <span style={{ fontFamily: s.mono, color: s.text3 }}>[{data.join(', ')}]</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={runScalar} disabled={isRunning} style={{
          background: isRunning ? s.bg3 : `${s.accent}15`,
          border: `1px solid ${isRunning ? s.border : s.accent}`,
          borderRadius: 8, padding: '10px 18px',
          color: isRunning ? s.text3 : s.accent,
          cursor: isRunning ? 'not-allowed' : 'pointer',
          fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
        }}>Run Scalar</button>
        <button onClick={runSimd} disabled={isRunning} style={{
          background: isRunning ? s.bg3 : `${s.green}15`,
          border: `1px solid ${isRunning ? s.border : s.green}`,
          borderRadius: 8, padding: '10px 18px',
          color: isRunning ? s.text3 : s.green,
          cursor: isRunning ? 'not-allowed' : 'pointer',
          fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
        }}>Run SIMD</button>
        <button onClick={runBoth} disabled={isRunning} style={{
          background: isRunning ? s.bg3 : `${s.purple}15`,
          border: `1px solid ${isRunning ? s.border : s.purple}`,
          borderRadius: 8, padding: '10px 18px',
          color: isRunning ? s.text3 : s.purple,
          cursor: isRunning ? 'not-allowed' : 'pointer',
          fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
        }}>Run Both</button>
        <button onClick={reset} disabled={mode === 'idle'} style={{
          background: s.bg3, border: `1px solid ${s.border}`,
          borderRadius: 8, padding: '10px 18px',
          color: mode === 'idle' ? s.text3 : s.text2,
          cursor: mode === 'idle' ? 'not-allowed' : 'pointer',
          fontSize: 13, transition: 'all 0.15s',
        }}>Reset</button>
        <div style={{ marginLeft: 'auto' }}>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: s.text }}>Scalar (SISD)</span>
            <span style={{ marginLeft: 10, fontSize: 12, color: s.text3, background: s.bg3, padding: '2px 8px', borderRadius: 4, fontFamily: s.mono }}>1 element/cycle</span>
          </div>
          <div style={{ fontFamily: s.mono, fontSize: 13, color: scalarRunning ? s.accent : s.text3 }}>{scalarLabel}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
          {data.map((val, i) => renderBox(val, i, scalarProcessed, scalarActive))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {Array.from({ length: SCALAR_TOTAL }).map((_, i) => {
            const isDone = scalarStep > (i + 1)
            return <div key={i} style={{
              width: 28, height: 6, borderRadius: 3,
              background: isDone ? s.accent : s.bg3,
              transition: 'all 0.3s ease',
            }} />
          })}
        </div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: s.text }}>Vector (SIMD)</span>
            <span style={{ marginLeft: 10, fontSize: 12, color: s.text3, background: s.bg3, padding: '2px 8px', borderRadius: 4, fontFamily: s.mono }}>4 elements/cycle</span>
          </div>
          <div style={{ fontFamily: s.mono, fontSize: 13, color: simdRunning ? s.green : s.text3 }}>{simdLabel}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
          {data.map((val, i) => renderBox(val, i, simdProcessed, simdActive))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {Array.from({ length: SIMD_TOTAL }).map((_, i) => {
            const isDone = simdStep > (i + 1)
            return <div key={i} style={{
              width: 120, height: 6, borderRadius: 3,
              background: isDone ? s.green : s.bg3,
              transition: 'all 0.3s ease',
            }} />
          })}
        </div>
      </div>

      <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: '16px 24px' }}>
        <div style={{ fontSize: 12, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Performance Comparison
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>Scalar Cycles</div>
            <div style={{ color: scalarStep > 0 ? s.accent : s.text3, fontFamily: s.mono, fontSize: 24, fontWeight: 700 }}>
              {scalarStep === 0 ? '-' : Math.min(scalarStep, SCALAR_TOTAL)}
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: s.border }} />
          <div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>SIMD Cycles</div>
            <div style={{ color: simdStep > 0 ? s.green : s.text3, fontFamily: s.mono, fontSize: 24, fontWeight: 700 }}>
              {simdStep === 0 ? '-' : Math.min(simdStep, SIMD_TOTAL)}
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: s.border }} />
          <div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>Speedup</div>
            <div style={{ color: bothDone ? s.yellow : s.text3, fontFamily: s.mono, fontSize: 24, fontWeight: 700 }}>
              {bothDone ? `${(SCALAR_TOTAL / SIMD_TOTAL).toFixed(1)}x` : (scalarStep > 0 && simdStep > 0 ? '...' : '-')}
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
