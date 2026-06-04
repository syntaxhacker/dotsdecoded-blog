import { useState, useEffect, useRef, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const W = 820
const H = 420
const ML = 60
const MR = 20
const MT = 30
const MB = 50
const CX = ML
const CY = MT
const CW = W - ML - MR
const CH = H - MT - MB

const STEPS = 5000

const milestones = [
  { step: 0, loss: 4.18 },
  { step: 500, loss: 2.24 },
  { step: 1000, loss: 1.99 },
  { step: 1500, loss: 1.82 },
  { step: 2000, loss: 1.74 },
  { step: 2500, loss: 1.70 },
  { step: 3000, loss: 1.66 },
  { step: 3500, loss: 1.64 },
  { step: 4000, loss: 1.62 },
  { step: 4500, loss: 1.61 },
  { step: 5000, loss: 1.60 },
]

function generateTrainData(): number[] {
  const data = new Array(STEPS + 1)
  let mi = 0
  for (let i = 0; i <= STEPS; i++) {
    while (mi < milestones.length - 1 && milestones[mi + 1].step <= i) mi++
    if (mi >= milestones.length - 1) {
      data[i] = milestones[milestones.length - 1].loss
      continue
    }
    const a = milestones[mi]
    const b = milestones[mi + 1]
    const t = (i - a.step) / (b.step - a.step)
    const smooth = t * t * (3 - 2 * t)
    const noise = Math.sin(i * 0.05) * 0.02 + Math.sin(i * 0.13) * 0.01
    data[i] = a.loss + (b.loss - a.loss) * smooth + noise
  }
  data[0] = milestones[0].loss
  data[STEPS] = milestones[milestones.length - 1].loss
  return data
}

function generateValData(train: number[]): number[] {
  const gap = 0.18
  return train.map((v, i) => {
    const noise = Math.sin(i * 0.07 + 1) * 0.015 + Math.cos(i * 0.11) * 0.01
    return v + gap + noise
  })
}

const trainData = generateTrainData()
const valData = generateValData(trainData)

const KEY_MILESTONES = [0, 1000, 2000, 3000, 4000, 5000]

function toSVGX(step: number): number {
  return CX + (step / STEPS) * CW
}

function toSVGY(loss: number): number {
  const yMin = 1.0
  const yMax = 4.5
  return CY + CH - ((loss - yMin) / (yMax - yMin)) * CH
}

function buildPath(data: number[], upto: number): string {
  const pts: string[] = []
  const end = Math.min(upto, data.length - 1)
  for (let i = 0; i <= end; i++) {
    const x = toSVGX(i)
    const y = toSVGY(data[i])
    if (i === 0) {
      pts.push(`M${x.toFixed(1)},${y.toFixed(1)}`)
    } else {
      pts.push(`L${x.toFixed(1)},${y.toFixed(1)}`)
    }
  }
  return pts.join(' ')
}

function buildAreaPath(data: number[], upto: number): string {
  const end = Math.min(upto, data.length - 1)
  let d = `M${toSVGX(0).toFixed(1)},${(CY + CH).toFixed(1)}`
  for (let i = 0; i <= end; i++) {
    d += `L${toSVGX(i).toFixed(1)},${toSVGY(data[i]).toFixed(1)}`
  }
  d += `L${toSVGX(end).toFixed(1)},${(CY + CH).toFixed(1)}Z`
  return d
}

const speedOptions = [
  { label: 'Slow', value: 16 },
  { label: 'Medium', value: 6 },
  { label: 'Fast', value: 2 },
]

const Y_TICKS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5]

export default function TrainingLossDemo() {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(6)
  const [hovered, setHovered] = useState<{ step: number; trainLoss: number; valLoss: number } | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const progressRef = useRef(0)
  const playingRef = useRef(false)
  const rafRef = useRef(0)
  const lastTimeRef = useRef(0)
  const chartRef = useRef<HTMLDivElement>(null)

  progressRef.current = progress
  playingRef.current = playing

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    if (progress >= STEPS) {
      setPlaying(false)
      return
    }
    let accum = 0
    const tick = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now
      const dt = now - lastTimeRef.current
      lastTimeRef.current = now
      accum += dt
      const stepInterval = speed * 16
      if (accum >= stepInterval) {
        const stepsToAdd = Math.floor(accum / stepInterval)
        accum -= stepsToAdd * stepInterval
        const next = Math.min(progressRef.current + stepsToAdd, STEPS)
        setProgress(next)
        if (next >= STEPS) {
          setPlaying(false)
          return
        }
      }
      if (playingRef.current) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    lastTimeRef.current = 0
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [playing, speed])

  const handlePlay = useCallback(() => {
    if (progress >= STEPS) {
      setProgress(0)
    }
    setPlaying(p => !p)
  }, [progress])

  const handleReset = useCallback(() => {
    setPlaying(false)
    setProgress(0)
  }, [])

  const handleSpeedChange = useCallback((v: number) => {
    setSpeed(v)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const svgX = (mx / rect.width) * W
    const step = Math.round(((svgX - CX) / CW) * STEPS)
    const clamped = Math.max(0, Math.min(STEPS, step))
    if (clamped <= progress) {
      setHovered({
        step: clamped,
        trainLoss: trainData[clamped],
        valLoss: valData[clamped],
      })
      setTooltipPos({ x: mx, y: e.clientY - rect.top })
    }
  }, [progress])

  const handleMouseLeave = useCallback(() => {
    setHovered(null)
  }, [])

  const curTrain = trainData[Math.min(progress, STEPS)]
  const curVal = valData[Math.min(progress, STEPS)]

  return (
    <DemoBoundary name="Training Loss">
      <div style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: s.bg, color: s.text, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: 24, overflow: 'visible',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handlePlay}
              style={{
                background: playing ? s.red + '22' : s.accent + '22',
                border: `1px solid ${playing ? s.red : s.accent}`,
                borderRadius: 8, padding: '7px 18px',
                color: playing ? s.red : s.accent,
                fontFamily: s.mono, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {playing ? 'Pause' : progress >= STEPS ? 'Replay' : 'Play'}
            </button>
            {progress > 0 && progress < STEPS && (
              <button
                onClick={handleReset}
                style={{
                  background: 'transparent',
                  border: `1px solid ${s.border}`,
                  borderRadius: 8, padding: '7px 14px',
                  color: s.text3, fontFamily: s.mono, fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: s.text3, fontFamily: s.mono, marginRight: 4 }}>Speed:</span>
            {speedOptions.map(opt => (
              <button
                key={opt.label}
                onClick={() => handleSpeedChange(opt.value)}
                style={{
                  background: speed === opt.value ? s.accent + '22' : 'transparent',
                  border: `1px solid ${speed === opt.value ? s.accent : s.border}`,
                  borderRadius: 6, padding: '4px 12px',
                  color: speed === opt.value ? s.accent : s.text3,
                  fontFamily: s.mono, fontSize: 11, fontWeight: speed === opt.value ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.1s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          position: 'relative', userSelect: 'none',
          borderRadius: 8, border: `1px solid ${s.border}`,
          background: s.bg2, padding: '4px 0',
        }} ref={chartRef}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="trainGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.accent} stopOpacity="0.15" />
                <stop offset="100%" stopColor={s.accent} stopOpacity="0" />
              </linearGradient>
              <linearGradient id="valGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.orange} stopOpacity="0.15" />
                <stop offset="100%" stopColor={s.orange} stopOpacity="0" />
              </linearGradient>
              <filter id="glow1">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <text x={CX + CW / 2} y={H - 8} textAnchor="middle" fill={s.text3} fontSize={13} fontFamily={s.mono} fontWeight={600}>
              Steps
            </text>
            <text x={14} y={CY + CH / 2} textAnchor="middle" fill={s.text3} fontSize={13} fontFamily={s.mono} fontWeight={600}
              transform={`rotate(-90, 14, ${CY + CH / 2})`}
            >
              Loss
            </text>

            {Y_TICKS.map(y => {
              const yy = toSVGY(y)
              return (
                <g key={y}>
                  <line x1={CX} y1={yy} x2={CX + CW} y2={yy} stroke={s.border + '44'} strokeWidth={1} />
                  <text x={CX - 8} y={yy + 4} textAnchor="end" fill={s.text3} fontSize={11} fontFamily={s.mono}>
                    {y.toFixed(1)}
                  </text>
                </g>
              )
            })}

            <line x1={CX} y1={CY} x2={CX} y2={CY + CH} stroke={s.border} strokeWidth={1} />
            <line x1={CX} y1={CY + CH} x2={CX + CW} y2={CY + CH} stroke={s.border} strokeWidth={1} />

            {KEY_MILESTONES.map(st => {
              const xx = toSVGX(st)
              return (
                <g key={st}>
                  <line x1={xx} y1={CY + CH + 4} x2={xx} y2={CY + CH + 10} stroke={s.border} strokeWidth={1} />
                  <text x={xx} y={CY + CH + 24} textAnchor="middle" fill={s.text3} fontSize={11} fontFamily={s.mono}>
                    {st === 0 ? '0' : st >= 1000 ? `${st / 1000}k` : String(st)}
                  </text>
                </g>
              )
            })}

            {progress > 0 && (
              <>
                <path
                  d={buildPath(trainData, progress)}
                  fill="none"
                  stroke={s.accent}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={buildAreaPath(trainData, progress)}
                  fill="url(#trainGlow)"
                  opacity={0.5}
                />
                <path
                  d={buildPath(valData, progress)}
                  fill="none"
                  stroke={s.orange}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="4 3"
                />
              </>
            )}

            {KEY_MILESTONES.filter(st => st <= progress).map(st => {
              const xx = toSVGX(st)
              const yy = toSVGY(trainData[st])
              return (
                <g key={`dot-${st}`}>
                  <circle cx={xx} cy={yy} r={4} fill={s.bg2} stroke={s.accent} strokeWidth={2} />
                  <text x={xx} y={yy - 12} textAnchor="middle" fill={s.accent} fontSize={10} fontFamily={s.mono} fontWeight={600}>
                    {trainData[st].toFixed(2)}
                  </text>
                </g>
              )
            })}

            {KEY_MILESTONES.filter(st => st <= progress).map(st => {
              const xx = toSVGX(st)
              const vy = toSVGY(valData[st])
              return (
                <g key={`vdot-${st}`}>
                  <circle cx={xx} cy={vy} r={3} fill={s.bg2} stroke={s.orange} strokeWidth={1.5} />
                </g>
              )
            })}

            {progress > 0 && progress < STEPS && (
              <line
                x1={toSVGX(progress)} y1={CY}
                x2={toSVGX(progress)} y2={CY + CH}
                stroke={s.text3 + '44'}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}
          </svg>

          {hovered && hovered.step <= progress && (
            <div style={{
              position: 'absolute',
              left: Math.min(tooltipPos.x + 16, 760),
              top: Math.max(tooltipPos.y - 60, 0),
              background: s.bg3,
              border: `1px solid ${s.border2}`,
              borderRadius: 8,
              padding: '8px 12px',
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, marginBottom: 4 }}>
                Step: <span style={{ color: s.text, fontWeight: 700 }}>{hovered.step.toLocaleString()}</span>
              </div>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.accent, marginBottom: 2 }}>
                Train: <span style={{ color: s.text, fontWeight: 700 }}>{hovered.trainLoss.toFixed(4)}</span>
              </div>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.orange }}>
                Val: <span style={{ color: s.text, fontWeight: 700 }}>{hovered.valLoss.toFixed(4)}</span>
              </div>
            </div>
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 12, padding: '10px 16px',
          background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>Step</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: s.mono, color: s.text }}>
                {Math.min(progress, STEPS).toLocaleString()}
                <span style={{ fontSize: 12, color: s.text3 }}> / {STEPS.toLocaleString()}</span>
              </div>
            </div>
            <div style={{ width: 1, height: 32, background: s.border }} />
            <div>
              <div style={{ fontSize: 11, color: s.accent, fontFamily: s.mono }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: s.accent, marginRight: 6, verticalAlign: 'middle' }} />
                Train Loss
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: s.mono, color: s.accent }}>
                {curTrain.toFixed(4)}
              </div>
            </div>
            <div style={{ width: 1, height: 32, background: s.border }} />
            <div>
              <div style={{ fontSize: 11, color: s.orange, fontFamily: s.mono }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: s.orange, marginRight: 6, verticalAlign: 'middle' }} />
                Val Loss
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: s.mono, color: s.orange }}>
                {curVal.toFixed(4)}
              </div>
            </div>
          </div>
          <div style={{
            fontSize: 11, fontFamily: s.mono, color: s.text3,
            padding: '4px 10px', background: s.bg3, borderRadius: 6,
          }}>
            Gap: {(curVal - curTrain).toFixed(4)}
          </div>
        </div>

        <div style={{
          marginTop: 16, padding: 16,
          background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`,
          fontSize: 13, lineHeight: 1.7, color: s.text2,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{
                background: s.accent + '22', color: s.accent, fontSize: 11, fontWeight: 700,
                fontFamily: s.mono, padding: '1px 8px', borderRadius: 4, whiteSpace: 'nowrap', marginTop: 2,
              }}>
                Initial: 4.18
              </span>
              <span>
                Random guessing among 65 possible characters. At this loss, the model assigns roughly uniform probability to every token.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{
                background: s.green + '22', color: s.green, fontSize: 11, fontWeight: 700,
                fontFamily: s.mono, padding: '1px 8px', borderRadius: 4, whiteSpace: 'nowrap', marginTop: 2,
              }}>
                Final: 1.60
              </span>
              <span>
                The model has learned patterns in the data. It now assigns higher probability to likely next characters, reducing surprise.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{
                background: s.orange + '22', color: s.orange, fontSize: 11, fontWeight: 700,
                fontFamily: s.mono, padding: '1px 8px', borderRadius: 4, whiteSpace: 'nowrap', marginTop: 2,
              }}>
                Train/Val gap
              </span>
              <span>
                The validation loss stays consistently above training (~0.18 gap), indicating slight overfitting. This is expected with only 1 transformer block and limited regularization.
              </span>
            </div>
            <div style={{
              marginTop: 4, padding: '8px 12px', background: s.bg3, borderRadius: 6,
              borderLeft: `3px solid ${s.yellow}`,
            }}>
              <span style={{ fontFamily: s.mono, fontSize: 12, color: s.yellow }}>
                Loss = how 'surprised' the model is. Lower = better.
              </span>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 12, display: 'flex', alignItems: 'center', gap: 12,
          justifyContent: 'center', fontSize: 12, color: s.text3, fontFamily: s.mono,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 16, height: 2, background: s.accent, borderRadius: 1 }} />
            Train
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 16, height: 2, background: s.orange, borderRadius: 1, backgroundImage: 'repeating-linear-gradient(90deg, ' + s.orange + ' 0, ' + s.orange + ' 4px, transparent 4px, transparent 7px)' }} />
            Validation
          </span>
        </div>
      </div>
    </DemoBoundary>
  )
}
