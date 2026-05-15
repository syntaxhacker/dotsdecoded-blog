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

const stages = [
  { sub: 'IF', name: 'Fetch', desc: 'Read instruction from memory at PC address' },
  { sub: 'ID', name: 'Decode', desc: 'Decode opcode and identify operands' },
  { sub: 'EX', name: 'Execute', desc: 'ALU performs the operation' },
  { sub: 'WB', name: 'Writeback', desc: 'Store result back to register' },
]

export default function CpuCycleDemo() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  const advance = useCallback(() => {
    setStep(prev => (prev + 1) % 4)
  }, [])

  useEffect(() => {
    if (!playing) return
    const delay = getStepDelay(1200, speed)
    const timer = setTimeout(() => advance(), delay)
    return () => clearTimeout(timer)
  }, [playing, speed, step, advance])

  const togglePlay = () => {
    if (playing) {
      setPlaying(false)
    } else {
      if (step === 3) setStep(0)
      setPlaying(true)
    }
  }

  return (
    <DemoBoundary name="CPU Instruction Cycle">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 24, letterSpacing: -0.3 }}>CPU Instruction Cycle</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
        {stages.map((stage, i) => (
          <div key={stage.name} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{
              flex: 1,
              background: step === i ? s.accent : s.bg3,
              borderRadius: 10,
              padding: '16px 8px',
              textAlign: 'center',
              transition: 'all 0.4s ease',
              border: step === i ? `1px solid ${s.accent}` : `1px solid ${s.border}`,
              boxShadow: step === i ? `0 0 24px ${s.accent}33` : 'none',
              cursor: 'default',
            }}>
              <div style={{
                color: step === i ? '#fff' : s.text3,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 4,
                fontFamily: s.mono,
              }}>
                {stage.sub}
              </div>
              <div style={{ color: step === i ? '#fff' : s.text3, fontSize: 11 }}>{stage.name}</div>
            </div>
            {i < stages.length - 1 && (
              <div style={{
                color: step === i ? s.accent : s.border2,
                fontSize: 20,
                margin: '0 6px',
                transition: 'color 0.4s',
                fontWeight: 700,
                fontFamily: s.mono,
              }}>
                {'>'}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11, marginBottom: 8 }}>STAGE {step + 1} / 4</div>
        <div style={{ color: s.text, fontSize: 14, lineHeight: 1.6 }}>{stages[step].desc}</div>
      </div>

      <div style={{
        background: s.bg3,
        border: `1px solid ${s.border2}`,
        borderRadius: 8,
        padding: '14px 20px',
        marginBottom: 24,
        textAlign: 'center',
      }}>
        <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11, marginRight: 10 }}>INST</span>
        <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>ADD</span>
        <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 14 }}> R1, R2, R3</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => { setPlaying(false); advance() }}
          disabled={playing}
          style={{
            background: s.accent,
            border: 'none',
            borderRadius: 8,
            padding: '10px 22px',
            color: '#fff',
            cursor: playing ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            opacity: playing ? 0.4 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          Step
        </button>
        <button
          onClick={togglePlay}
          style={{
            background: playing ? s.red : s.green,
            border: 'none',
            borderRadius: 8,
            padding: '10px 22px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            transition: 'background 0.15s',
          }}
        >
          {playing ? 'Stop' : 'Auto-Play'}
        </button>
        <SpeedController speed={speed} onSpeedChange={setSpeed} />
        <div style={{ marginLeft: 'auto', color: s.text3, fontFamily: s.mono, fontSize: 12 }}>
          {step + 1} / 4
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
