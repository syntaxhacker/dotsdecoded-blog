import { useState, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

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

const paintSteps = [
  { id: 'shadow', label: '1. Draw box-shadow', color: s.purple, desc: 'The shadow is rendered first, offset behind the element.' },
  { id: 'background', label: '2. Draw background', color: s.accent, desc: 'The background color fills the element bounding box.' },
  { id: 'border', label: '3. Draw border', color: s.yellow, desc: 'The border is painted on top of the background.' },
  { id: 'content', label: '4. Draw content', color: s.green, desc: 'Text and child elements are painted last on top.' },
]

export default function PaintDemo() {
  const [step, setStep] = useState(-1)
  const [autoPlay, setAutoPlay] = useState(false)
  const [stackDemo, setStackDemo] = useState(false)

  const next = useCallback(() => {
    setStep(prev => prev < paintSteps.length - 1 ? prev + 1 : prev)
  }, [])

  const prev = useCallback(() => {
    setStep(prev => prev > -1 ? prev - 1 : prev)
  }, [])

  const reset = useCallback(() => {
    setStep(-1)
    setAutoPlay(false)
  }, [])

  const toggleAutoPlay = useCallback(() => {
    if (step >= paintSteps.length - 1) setStep(-1)
    setAutoPlay(prev => !prev)
  }, [step])

  const currentStep = paintSteps[step] || null

  return (
    <DemoBoundary name="Paint">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Paint Step Visualization</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          The paint step fills in pixels for each visual property of an element.
          Properties are painted in a specific order. Step through to see each layer.
        </p>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, minHeight: 200, background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{
              width: 240, height: 120, borderRadius: 8,
              position: 'relative',
              boxShadow: step < 0 || (currentStep && paintSteps.indexOf(currentStep) >= 0 && paintSteps[0].id === 'shadow')
                ? '8px 8px 16px rgba(0,0,0,0.5)'
                : 'none',
              background: step < 0 || (currentStep && paintSteps.indexOf(currentStep) >= 1)
                ? `linear-gradient(135deg, ${s.accent}, ${s.purple})`
                : 'transparent',
              border: step < 0 || (currentStep && paintSteps.indexOf(currentStep) >= 2)
                ? `3px solid ${s.yellow}`
                : '3px solid transparent',
              transition: 'all 0.4s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: step < 0 || (currentStep && paintSteps.indexOf(currentStep) >= 3) ? '#fff' : 'transparent',
              fontSize: 16, fontWeight: 600,
            }}>
              Hello Browser
            </div>
            {step >= 2 && (
              <div style={{
                position: 'absolute', top: -8, left: -8, right: -8, bottom: -8,
                border: `2px dashed ${currentStep?.color || s.accent}`,
                borderRadius: 12, pointerEvents: 'none',
                transition: 'all 0.3s',
              }} />
            )}
          </div>

          <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {paintSteps.map(st => (
              <div key={st.id} onClick={() => setStep(paintSteps.indexOf(st))} style={{
                padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                background: currentStep?.id === st.id ? `${st.color}15` : 'transparent',
                border: `1px solid ${currentStep?.id === st.id ? st.color : 'transparent'}`,
                transition: 'all 0.2s',
                fontSize: 12, color: currentStep?.id === st.id ? st.color : s.text3,
                fontWeight: currentStep?.id === st.id ? 600 : 400,
              }}>
                {st.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ minHeight: 48, marginBottom: 16, display: 'flex', alignItems: 'center' }}>
          {currentStep ? (
            <div style={{ color: currentStep.color, fontSize: 13, lineHeight: 1.5 }}>
              {currentStep.desc}
            </div>
          ) : (
            <div style={{ color: s.text3, fontSize: 13 }}>Click a paint step above or use the buttons below.</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={prev} disabled={step <= -1} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 16px',
            color: step <= -1 ? s.text3 : s.text2, cursor: step <= -1 ? 'not-allowed' : 'pointer',
            fontSize: 12, opacity: step <= -1 ? 0.5 : 1,
          }}>Prev</button>
          <button onClick={next} disabled={step >= paintSteps.length - 1} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '8px 16px',
            color: '#fff', cursor: step >= paintSteps.length - 1 ? 'not-allowed' : 'pointer',
            fontSize: 12, fontWeight: 600, opacity: step >= paintSteps.length - 1 ? 0.5 : 1,
          }}>Next</button>
          <button onClick={toggleAutoPlay} style={{
            background: autoPlay ? s.red : s.bg3, border: `1px solid ${autoPlay ? s.red : s.border}`, borderRadius: 8, padding: '8px 16px',
            color: autoPlay ? '#fff' : s.text2, cursor: 'pointer', fontSize: 12,
          }}>{autoPlay ? 'Stop' : 'Auto Play'}</button>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 16px',
            color: s.text2, cursor: 'pointer', fontSize: 12,
          }}>Reset</button>
        </div>
      </div>

      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={H}>Stacking Context</div>
          <button onClick={() => setStackDemo(!stackDemo)} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '6px 14px',
            color: s.text2, cursor: 'pointer', fontSize: 11,
          }}>{stackDemo ? 'Hide' : 'Show'} Layers</button>
        </div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Elements with different position values or z-index create stacking contexts.
          Paint order follows this stacking hierarchy.
        </p>

        <div style={{ position: 'relative', height: 200, background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 20, left: 40, width: 160, height: 100,
            background: `${s.accent}30`, border: `2px solid ${s.accent}`, borderRadius: 8,
            zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: s.accent, fontSize: 11, fontWeight: 600,
            transition: stackDemo ? 'all 0.4s' : 'none',
            transform: stackDemo ? 'translateZ(20px)' : 'none',
          }}>
            z-index: 1
          </div>
          <div style={{
            position: 'absolute', top: 50, left: 80, width: 160, height: 100,
            background: `${s.green}30`, border: `2px solid ${s.green}`, borderRadius: 8,
            zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: s.green, fontSize: 11, fontWeight: 600,
            transition: stackDemo ? 'all 0.4s' : 'none',
            transform: stackDemo ? 'translateZ(40px)' : 'none',
          }}>
            z-index: 2
          </div>
          <div style={{
            position: 'absolute', top: 80, left: 120, width: 160, height: 100,
            background: `${s.red}30`, border: `2px solid ${s.red}`, borderRadius: 8,
            zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: s.red, fontSize: 11, fontWeight: 600,
            transition: stackDemo ? 'all 0.4s' : 'none',
            transform: stackDemo ? 'translateZ(60px)' : 'none',
          }}>
            z-index: 3
          </div>
          <div style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            padding: '6px 16px', background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 6,
            color: s.text3, fontSize: 10, lineHeight: 1.4, textAlign: 'center',
          }}>
            Stacking order determines<br />which element paints on top
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
