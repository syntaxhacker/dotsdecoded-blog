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

const dockerfile = [
  'FROM python:3.11-slim',
  'RUN apt-get update && apt-get install -y curl',
  'COPY app.py /app/',
  'RUN pip install flask redis',
  'CMD ["python", "app.py"]',
]

interface LayerInfo {
  label: string
  size: string
  cum: string
  color: string
}

const layers: LayerInfo[] = [
  { label: 'Base: python:3.11-slim', size: '143 MB', cum: '143 MB', color: '#2c4a8c' },
  { label: 'apt-get install curl', size: '67 MB', cum: '210 MB', color: '#3d5fad' },
  { label: 'COPY app.py /app/', size: '2 KB', cum: '210 MB', color: '#4f75ce' },
  { label: 'pip install flask redis', size: '35 MB', cum: '245 MB', color: '#618bef' },
  { label: 'CMD instruction', size: '0 B', cum: '245 MB', color: '#73a1ff' },
]

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

export default function LayerBuilderDemo() {
  const [step, setStep] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [speed, setSpeed] = useState(1)

  const totalSteps = dockerfile.length

  const nextStep = useCallback(() => {
    setStep((prev) => {
      if (prev < totalSteps) return prev + 1
      return prev
    })
  }, [totalSteps])

  const reset = useCallback(() => {
    setStep(0)
    setAutoPlay(false)
  }, [])

  useEffect(() => {
    if (!autoPlay || step >= totalSteps) return
    const delay = getStepDelay(800, speed)
    const timer = setTimeout(() => {
      nextStep()
    }, delay)
    return () => clearTimeout(timer)
  }, [autoPlay, step, speed, nextStep, totalSteps])

  useEffect(() => {
    if (step >= totalSteps) setAutoPlay(false)
  }, [step, totalSteps])

  return (
    <DemoBoundary name="Layer Builder">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Layer Builder</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Each Dockerfile instruction creates a new read-only layer. Layers stack on top of each other.
          Only the top writable layer persists between container runs.
        </p>

        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Dockerfile</div>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
              fontFamily: s.mono, fontSize: 12, overflow: 'hidden',
            }}>
              {dockerfile.map((line, i) => {
                const built = i < step
                const active = i === step - 1
                return (
                  <div key={i} style={{
                    padding: '7px 12px',
                    borderBottom: i < dockerfile.length - 1 ? `1px solid ${s.border}` : 'none',
                    background: active ? `${s.accent}18` : built ? `${s.green}08` : 'transparent',
                    borderLeft: `3px solid ${active ? s.accent : built ? s.green : 'transparent'}`,
                    color: built ? s.text : s.text3,
                    transition: 'all 0.3s',
                  }}>
                    {line}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Layers Built
              <span style={{ color: s.text2, marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>
                ({step}/{totalSteps})
              </span>
            </div>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
              minHeight: 200, position: 'relative', overflow: 'hidden',
            }}>
              {step === 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: 200, color: s.text3, fontSize: 12,
                }}>
                  Press Build to start
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', padding: 12, gap: 4 }}>
                {layers.slice(0, step).map((l, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: l.color, borderRadius: 6,
                    padding: '8px 12px',
                    transition: 'all 0.4s ease',
                    opacity: 0,
                    animation: step > 0 ? 'none' : undefined,
                  }}>
                    <div style={{
                      background: 'rgba(0,0,0,0.25)', borderRadius: 4,
                      padding: '2px 6px', color: '#fff', fontSize: 10,
                      fontFamily: s.mono, whiteSpace: 'nowrap',
                    }}>
                      L{i + 1}
                    </div>
                    <div style={{ flex: 1, color: '#fff', fontSize: 12, fontWeight: 500 }}>{l.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontFamily: s.mono, fontSize: 11 }}>{l.size}</div>
                  </div>
                ))}
              </div>
            </div>
            {step > 0 && (
              <div style={{
                marginTop: 8, textAlign: 'right',
                color: s.text2, fontFamily: s.mono, fontSize: 11,
              }}>
                Cumulative: {layers[step - 1].cum}
              </div>
            )}
          </div>
        </div>

        <div style={{
          marginTop: 20, paddingTop: 16, borderTop: `1px solid ${s.border}`,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <button onClick={reset} disabled={step === 0} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: '8px 16px', color: step === 0 ? s.text3 : s.text2,
            cursor: step === 0 ? 'default' : 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={nextStep} disabled={step >= totalSteps} style={{
            background: s.accent, border: 'none', borderRadius: 8,
            padding: '8px 16px', color: '#fff', cursor: step >= totalSteps ? 'default' : 'pointer',
            fontSize: 13, fontWeight: 600, opacity: step >= totalSteps ? 0.4 : 1,
          }}>
            {step >= totalSteps ? 'Complete' : step === 0 ? 'Build' : 'Next Layer'}
          </button>
          <button onClick={() => {
            if (step >= totalSteps) { reset(); setTimeout(() => setAutoPlay(true), 100) }
            else setAutoPlay((p) => !p)
          }} style={{
            background: autoPlay ? s.red : s.bg3,
            border: `1px solid ${autoPlay ? s.red : s.border}`,
            borderRadius: 8, padding: '8px 16px',
            color: autoPlay ? '#fff' : s.text2, cursor: 'pointer',
            fontSize: 13,
          }}>
            {autoPlay ? 'Stop' : 'Auto-Play'}
          </button>
          <div style={{ marginLeft: 'auto' }}>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {layers.map((l, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: s.bg, borderRadius: 6, padding: '4px 10px',
              opacity: i < step ? 1 : 0.3,
              transition: 'opacity 0.3s',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
              <div style={{ color: s.text3, fontSize: 10 }}>
                L{i + 1}: {l.size}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>How Layers Work</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: 'Caching', desc: 'Docker caches each layer. Unchanged layers reuse cache on rebuild.', color: s.green },
              { label: 'Sharing', desc: 'Base layers (FROM) are shared across images. Pull once, use everywhere.', color: s.accent },
              { label: 'Size', desc: 'Total image size = sum of all layers. Remove files to shrink layers.', color: s.orange },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ color: s.text, fontSize: 12, fontWeight: 600, minWidth: 50 }}>{item.label}</span>
                <span style={{ color: s.text2, fontSize: 12 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
