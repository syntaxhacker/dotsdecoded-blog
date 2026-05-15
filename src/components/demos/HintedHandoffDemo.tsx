import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController from './SpeedController'
import { getStepDelay } from './SpeedController'

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

const LABELS = [
  'All 3 replicas available. Writes replicate to all nodes.',
  'Node N2 goes DOWN. Coordinator N1 detects the failure.',
  'Coordinator writes to N3. Stores a hint for N2 with the missed write.',
  'Node N2 comes back ONLINE. Coordinator detects recovery.',
  'Coordinator replays the hint to N2. N2 catches up.',
  'All 3 replicas consistent again. Hinted handoff complete.',
]

const TOTAL_STEPS = 6

export default function HintedHandoffDemo() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [flashHint, setFlashHint] = useState(false)
  const [flashReplay, setFlashReplay] = useState(false)

  const goNext = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1))
  }, [])

  const goPrev = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const reset = useCallback(() => {
    setStep(0)
    setPlaying(false)
    setFlashHint(false)
    setFlashReplay(false)
  }, [])

  useEffect(() => {
    if (!playing || step >= TOTAL_STEPS - 1) return
    const delay = getStepDelay(1400, speed)
    const timer = setTimeout(() => {
      goNext()
    }, delay)
    return () => clearTimeout(timer)
  }, [playing, step, speed, goNext])

  useEffect(() => {
    if (step === 2) {
      setFlashHint(true)
      const t = setTimeout(() => setFlashHint(false), 800)
      return () => clearTimeout(t)
    }
    if (step === 4) {
      setFlashReplay(true)
      const t = setTimeout(() => setFlashReplay(false), 1000)
      return () => clearTimeout(t)
    }
  }, [step])

  const n1Up = step >= 0
  const n2Up = step < 1 || step >= 3
  const n3Up = step >= 0
  const showHint = step >= 2 && step < 5
  const showArrowN1toN3 = step >= 2 && step < 4
  const showArrowHintReplay = step >= 4

  return (
    <DemoBoundary name="Hinted Handoff">
      <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
        <div style={SEC}>
          <div style={H}>Hinted Handoff</div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
            When a replica is down, the coordinator temporarily stores the write as a hint. When the replica recovers, the hint is replayed.
          </p>

          <svg viewBox="0 0 760 260" style={{ width: '100%', height: 220, overflow: 'hidden', marginBottom: 16 }}>
            <defs>
              <marker id="arrowGreen" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 Z" fill={s.green} />
              </marker>
              <marker id="arrowYellow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 Z" fill={s.yellow} />
              </marker>
              <marker id="arrowAccent" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 Z" fill={s.accent} />
              </marker>
            </defs>

            <rect x={50} y={100} width={120} height={60} rx={10}
              fill={n1Up ? `${s.accent}25` : s.bg3}
              stroke={step === 2 || step === 4 ? s.yellow : s.accent}
              strokeWidth={step === 2 || step === 4 ? 3 : 2}
            />
            <text x={110} y={136} textAnchor="middle" fill={s.text} fontSize={16} fontWeight={700}>
              N1
            </text>
            <text x={110} y={152} textAnchor="middle" fill={s.text3} fontSize={10}>
              Coordinator
            </text>

            <rect x={320} y={100} width={120} height={60} rx={10}
              fill={n2Up ? `${s.green}25` : `${s.red}20`}
              stroke={n2Up ? s.green : s.red}
              strokeWidth={2}
            />
            <text x={380} y={136} textAnchor="middle" fill={s.text} fontSize={16} fontWeight={700}>
              N2
            </text>
            <text x={380} y={152} textAnchor="middle" fill={n2Up ? s.text3 : s.red} fontSize={10}>
              {n2Up ? 'Replica' : 'DOWN'}
            </text>

            <rect x={590} y={100} width={120} height={60} rx={10}
              fill={n3Up ? `${s.purple}25` : s.bg3}
              stroke={s.purple}
              strokeWidth={2}
            />
            <text x={650} y={136} textAnchor="middle" fill={s.text} fontSize={16} fontWeight={700}>
              N3
            </text>
            <text x={650} y={152} textAnchor="middle" fill={s.text3} fontSize={10}>
              Replica
            </text>

            <rect x={30} y={195} width={180} height={36} rx={6}
              fill={showHint ? s.bg3 : 'transparent'}
              stroke={showHint ? (flashHint ? s.yellow : s.border) : 'transparent'}
              strokeWidth={flashHint ? 2 : 1}
              style={{ transition: 'all 0.3s' }}
            />
            {showHint && (
              <text x={120} y={218} textAnchor="middle" fill={flashHint ? s.yellow : s.text2} fontSize={11} fontFamily={s.mono}>
                Hint: {flashHint ? 'write(key, val, ts=3)' : 'stored for N2'}
              </text>
            )}

            {showArrowN1toN3 && (
              <line x1={170} y1={120} x2={590} y2={120}
                stroke={s.green} strokeWidth={2} strokeDasharray="6 3"
                markerEnd="url(#arrowGreen)"
              />
            )}
            {showArrowN1toN3 && (
              <text x={380} y={90} textAnchor="middle" fill={s.green} fontSize={11} fontFamily={s.mono}>
                write(key, val, ts=3)
              </text>
            )}

            {showHint && (
              <line x1={110} y1={160} x2={110} y2={195}
                stroke={s.yellow} strokeWidth={2}
                markerEnd="url(#arrowYellow)"
              />
            )}

            {showArrowHintReplay && (
              <>
                <line x1={120} y1={213} x2={340} y2={140}
                  stroke={s.accent} strokeWidth={2} strokeDasharray="6 3"
                  markerEnd="url(#arrowAccent)"
                />
                <text x={210} y={190} textAnchor="middle" fill={s.accent} fontSize={11} fontFamily={s.mono}>
                  replay hint
                </text>
              </>
            )}
          </svg>

          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: s.bg, border: `1px solid ${s.border}`,
            color: s.text, fontSize: 13, marginBottom: 16, minHeight: 20,
            fontFamily: s.mono,
          }}>
            Step {step + 1}/{TOTAL_STEPS}: {LABELS[step]}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={goPrev} disabled={step === 0} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 16px', color: step === 0 ? s.text3 : s.text2,
              cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: 13,
            }}>
              Prev
            </button>
            <button onClick={goNext} disabled={step >= TOTAL_STEPS - 1} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 16px', color: step >= TOTAL_STEPS - 1 ? s.text3 : s.text2,
              cursor: step >= TOTAL_STEPS - 1 ? 'not-allowed' : 'pointer', fontSize: 13,
            }}>
              Next
            </button>
            <button onClick={() => setPlaying(!playing)} style={{
              background: playing ? s.red : s.green, border: 'none', borderRadius: 8,
              padding: '10px 20px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {playing ? 'Stop' : 'Auto Play'}
            </button>
            <button onClick={reset} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 16px', color: s.text2, cursor: 'pointer', fontSize: 13,
            }}>
              Reset
            </button>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
