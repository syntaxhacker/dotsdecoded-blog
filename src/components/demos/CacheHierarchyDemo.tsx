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

type CacheMode = 'read-through' | 'write-through' | 'write-behind'

const layerColors = [s.accent, s.green, s.orange]
const layerNames = ['L1 (On-heap)', 'L2 (Redis)', 'L3 (Database)']

export default function CacheHierarchyDemo() {
  const [mode, setMode] = useState<CacheMode>('read-through')
  const [step, setStep] = useState(-1)
  const [running, setRunning] = useState(false)
  const [l1Hit, setL1Hit] = useState(true)
  const [l2Hit, setL2Hit] = useState(true)
  const [l1Data, setL1Data] = useState('')
  const [l2Data, setL2Data] = useState('')
  const [l3Data, setL3Data] = useState('')
  const [highlight, setHighlight] = useState<number | null>(null)

  const getSteps = useCallback(() => {
    if (mode === 'read-through') {
      return [
        { label: 'Check L1', layer: 0, action: 'GET key_x from L1 cache' },
        { label: 'L1 Miss', layer: 0, action: 'Not found in L1 (on-heap)' },
        { label: 'Check L2', layer: 1, action: 'GET key_x from Redis' },
        { label: 'L2 Miss', layer: 1, action: 'Not found in Redis' },
        { label: 'Read from DB', layer: 2, action: 'SELECT * FROM data WHERE id = key_x' },
        { label: 'Populate L2', layer: 1, action: 'SET key_x = result (TTL: 3600)' },
        { label: 'Populate L1', layer: 0, action: 'Store in on-heap cache' },
        { label: 'Return', layer: -1, action: 'Return result to client' },
      ]
    } else if (mode === 'write-through') {
      return [
        { label: 'Write to L1', layer: 0, action: 'SET key_x = value in L1' },
        { label: 'Write to L2', layer: 1, action: 'SET key_x = value in Redis' },
        { label: 'Write to DB', layer: 2, action: 'INSERT/UPDATE data WHERE id = key_x' },
        { label: 'Confirm', layer: -1, action: 'Return OK to client (synchronous)' },
      ]
    } else {
      return [
        { label: 'Write to L1', layer: 0, action: 'SET key_x = value in L1 (instant)' },
        { label: 'Queue write', layer: -1, action: 'Enqueue write to background worker' },
        { label: 'Return OK', layer: -1, action: 'Return OK to client (async)' },
        { label: 'Batch flush', layer: 2, action: 'Batch INSERT/UPDATE (every 100ms)' },
      ]
    }
  }, [mode])

  const steps = getSteps()

  const runAnimation = useCallback(() => {
    if (running) return
    setRunning(true)
    setStep(0)
    setL1Data('')
    setL2Data('')
    setL3Data('')
  }, [running])

  useEffect(() => {
    if (!running || step < 0) return
    if (step >= steps.length) {
      setRunning(false)
      setStep(-1)
      setHighlight(null)
      return
    }
    const st = steps[step]
    setHighlight(st.layer)
    if (st.layer === 0) setL1Data('user:42 = { name: "Alice" }')
    if (st.layer === 1 && mode === 'read-through') {
      if (step === 2) setL2Data('cache miss')
      if (step === 5) setL2Data('user:42 = { name: "Alice" }')
    }
    if (st.layer === 2) setL3Data('user:42 = { name: "Alice" }')
    const timer = setTimeout(() => {
      setStep(prev => prev + 1)
    }, 700)
    return () => clearTimeout(timer)
  }, [running, step, steps, mode])

  const reset = () => {
    setRunning(false)
    setStep(-1)
    setHighlight(null)
    setL1Data('')
    setL2Data('')
    setL3Data('')
  }

  const currentStep = step >= 0 && step < steps.length ? steps[step] : null

  return (
    <DemoBoundary name="Cache Hierarchy">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>
        Cache Hierarchy: L1 / L2 / L3
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        A read traverses L1 (on-heap) to L2 (Redis) to L3 (DB). Writes can be synchronous or deferred.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['read-through', 'write-through', 'write-behind'] as CacheMode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); reset() }}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
              background: mode === m ? s.accent : s.bg3,
              border: `1px solid ${mode === m ? s.accent : s.border}`,
              color: mode === m ? '#fff' : s.text2, fontSize: 12, fontWeight: mode === m ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {m === 'read-through' ? 'Read-Through' : m === 'write-through' ? 'Write-Through' : 'Write-Behind'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            background: highlight === i ? `${layerColors[i]}20` : s.bg2,
            border: `1px solid ${highlight === i ? layerColors[i] : s.border}`,
            borderRadius: 12, padding: '14px 18px',
            transition: 'all 0.3s ease',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: highlight === i ? layerColors[i] : s.text3,
                  transition: 'background 0.3s',
                }} />
                <span style={{ color: highlight === i ? layerColors[i] : s.text, fontWeight: 600, fontSize: 13 }}>
                  {layerNames[i]}
                </span>
              </div>
              <div style={{
                color: s.text3, fontFamily: s.mono, fontSize: 11,
                background: s.bg, padding: '2px 8px', borderRadius: 4,
              }}>
                {i === 0 ? '~0.1ms' : i === 1 ? '~1ms' : '~10ms'}
              </div>
            </div>
            <div style={{
              marginTop: 8, minHeight: 24,
              color: i === 0 ? l1Data : i === 1 ? l2Data : l3Data ? s.text2 : s.text3,
              fontFamily: s.mono, fontSize: 12,
            }}>
              {i === 0 && (l1Data || '(empty)')}
              {i === 1 && (l2Data || '(empty)')}
              {i === 2 && (l3Data || '(empty)')}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`,
        borderRadius: 10, padding: '12px 16px', marginBottom: 16,
        minHeight: 40,
      }}>
        {currentStep ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: layerColors[currentStep.layer] || s.text,
              animation: currentStep.layer >= 0 ? 'pulse 0.5s ease-in-out infinite' : undefined,
            }} />
            <div>
              <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 11, marginRight: 8 }}>
                Step {step + 1}/{steps.length}
              </span>
              <span style={{ color: s.text, fontSize: 13 }}>{currentStep.action}</span>
            </div>
          </div>
        ) : (
          <div style={{ color: s.text3, fontSize: 13, textAlign: 'center' }}>
            Click "Run Request" to see the path through the hierarchy
          </div>
        )}
      </div>

      <button
        onClick={running ? reset : runAnimation}
        style={{
          width: '100%', padding: '10px 0', borderRadius: 8, cursor: 'pointer',
          background: running ? s.red : s.accent, border: 'none',
          color: '#fff', fontSize: 13, fontWeight: 600,
          transition: 'background 0.2s',
        }}
      >
        {running ? 'Reset' : 'Run Request'}
      </button>
    </div>
    </DemoBoundary>
  )
}
