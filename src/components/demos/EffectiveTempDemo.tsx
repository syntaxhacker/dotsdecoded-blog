import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const TRAIN_VALUES = [0.5, 0.7, 1.0, 1.2, 1.5, 2.0]
const EVAL_VALUES = [0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.5]
const BASELINE = 42.4
const PEAK_TEFF = 1.2

function perf(tEff: number) {
  return BASELINE + 7 * Math.exp(-Math.pow(tEff - PEAK_TEFF, 2) / 0.3)
}

function perfColor(p: number) {
  if (p > 50) return s.green
  if (p < 45) return s.red
  return s.accent
}

const CHART_W = 520
const CHART_H = 340
const PAD = { top: 20, right: 30, bottom: 50, left: 60 }
const PLOT_W = CHART_W - PAD.left - PAD.right
const PLOT_H = CHART_H - PAD.top - PAD.bottom

const T_TRAIN_MIN = 0.4
const T_TRAIN_MAX = 2.2
const T_EVAL_MIN = 0.5
const T_EVAL_MAX = 1.7

function toX(tTrain: number) {
  return PAD.left + ((tTrain - T_TRAIN_MIN) / (T_TRAIN_MAX - T_TRAIN_MIN)) * PLOT_W
}

function toY(tEval: number) {
  return PAD.top + PLOT_H - ((tEval - T_EVAL_MIN) / (T_EVAL_MAX - T_EVAL_MIN)) * PLOT_H
}

export default function EffectiveTempDemo() {
  const [tTrain, setTTrain] = useState(1.6)
  const [tEval, setTEval] = useState(0.9)

  const tEff = tTrain * tEval
  const currentPerf = perf(tEff)

  const dataPoints = useMemo(() => {
    return TRAIN_VALUES.flatMap(tr =>
      EVAL_VALUES.map(ev => {
        const te = tr * ev
        const p = perf(te)
        return { tTrain: tr, tEval: ev, tEff: te, perf: p }
      })
    )
  }, [])

  const contourPoints = useMemo(() => {
    const pts: string[] = []
    for (let tr = T_TRAIN_MIN; tr <= T_TRAIN_MAX; tr += 0.02) {
      const ev = PEAK_TEFF / tr
      if (ev >= T_EVAL_MIN && ev <= T_EVAL_MAX) {
        pts.push(`${toX(tr)},${toY(ev)}`)
      }
    }
    return pts.join(' ')
  }, [])

  const gridLines = useMemo(() => {
    const lines: { x: number; label: string }[] = []
    for (let v = 0.5; v <= 2.0; v += 0.5) {
      lines.push({ x: toX(v), label: v.toFixed(1) })
    }
    return lines
  }, [])

  const gridLinesY = useMemo(() => {
    const lines: { y: number; label: string }[] = []
    for (let v = 0.5; v <= 1.5; v += 0.25) {
      lines.push({ y: toY(v), label: v.toFixed(2) })
    }
    return lines
  }, [])

  return (
    <div style={{
      maxWidth: 820,
      margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        display: 'flex',
        gap: 24,
        alignItems: 'stretch',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 240px', minWidth: 240 }}>
          <div style={{
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 10,
            padding: '20px 20px 16px',
          }}>
            <div style={{
              fontSize: 12,
              color: s.text3,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 16,
            }}>
              Temperature Controls
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
              }}>
                <span style={{ fontSize: 13, color: s.text2 }}>T_train</span>
                <span style={{ fontSize: 14, fontFamily: s.mono, color: s.text, fontWeight: 600 }}>
                  {tTrain.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={3.0}
                step={0.1}
                value={tTrain}
                onChange={e => setTTrain(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: 4,
                  appearance: 'none',
                  background: `linear-gradient(to right, ${s.accent} 0%, ${s.accent} ${((tTrain - 0.5) / 2.5) * 100}%, ${s.bg3} ${((tTrain - 0.5) / 2.5) * 100}%, ${s.bg3} 100%)`,
                  borderRadius: 2,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: s.text3,
                fontFamily: s.mono,
                marginTop: 2,
              }}>
                <span>0.5</span>
                <span>3.0</span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
              }}>
                <span style={{ fontSize: 13, color: s.text2 }}>T_eval</span>
                <span style={{ fontSize: 14, fontFamily: s.mono, color: s.text, fontWeight: 600 }}>
                  {tEval.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={0.3}
                max={2.0}
                step={0.1}
                value={tEval}
                onChange={e => setTEval(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: 4,
                  appearance: 'none',
                  background: `linear-gradient(to right, ${s.green} 0%, ${s.green} ${((tEval - 0.3) / 1.7) * 100}%, ${s.bg3} ${((tEval - 0.3) / 1.7) * 100}%, ${s.bg3} 100%)`,
                  borderRadius: 2,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: s.text3,
                fontFamily: s.mono,
                marginTop: 2,
              }}>
                <span>0.3</span>
                <span>2.0</span>
              </div>
            </div>

            <div style={{
              background: s.bg,
              borderRadius: 8,
              padding: '14px 16px',
              border: `1px solid ${s.border}`,
            }}>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 4 }}>T_eff = T_train x T_eval</div>
              <div style={{
                fontSize: 28,
                fontFamily: s.mono,
                fontWeight: 700,
                color: perfColor(currentPerf),
                transition: 'color 0.3s ease',
                lineHeight: 1.2,
              }}>
                {tEff.toFixed(2)}
              </div>
              <div style={{
                fontSize: 12,
                color: s.text2,
                marginTop: 6,
                fontFamily: s.mono,
              }}>
                Perf: {currentPerf.toFixed(1)}%
              </div>
            </div>

            <div style={{
              marginTop: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: s.text3,
              }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: s.green,
                  flexShrink: 0,
                }} />
                <span>High perf (&gt;50%)</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: s.text3,
              }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: s.accent,
                  flexShrink: 0,
                }} />
                <span>Medium perf (45-50%)</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: s.text3,
              }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: s.red,
                  flexShrink: 0,
                }} />
                <span>Low perf (&lt;45%)</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: s.text3,
              }}>
                <div style={{
                  width: 10,
                  height: 2,
                  border: `1px dashed ${s.yellow}`,
                  flexShrink: 0,
                }} />
                <span>T_eff = {PEAK_TEFF} contour</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: s.text3,
              }}>
                <div style={{
                  width: 10,
                  height: 2,
                  border: `1px dashed ${s.border2}`,
                  flexShrink: 0,
                }} />
                <span>Baseline ({BASELINE}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 420px', minWidth: 380 }}>
          <div style={{
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 10,
            padding: 16,
          }}>
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            >
              <rect
                x={PAD.left}
                y={PAD.top}
                width={PLOT_W}
                height={PLOT_H}
                fill={s.bg}
                rx={4}
              />

              {gridLines.map(l => (
                <g key={`gx-${l.label}`}>
                  <line
                    x1={l.x}
                    y1={PAD.top}
                    x2={l.x}
                    y2={PAD.top + PLOT_H}
                    stroke={s.border}
                    strokeWidth={0.5}
                    strokeOpacity={0.5}
                  />
                  <text
                    x={l.x}
                    y={PAD.top + PLOT_H + 18}
                    textAnchor="middle"
                    fill={s.text3}
                    fontSize={10}
                    fontFamily={s.mono}
                  >
                    {l.label}
                  </text>
                </g>
              ))}

              {gridLinesY.map(l => (
                <g key={`gy-${l.label}`}>
                  <line
                    x1={PAD.left}
                    y1={l.y}
                    x2={PAD.left + PLOT_W}
                    y2={l.y}
                    stroke={s.border}
                    strokeWidth={0.5}
                    strokeOpacity={0.5}
                  />
                  <text
                    x={PAD.left - 8}
                    y={l.y + 3}
                    textAnchor="end"
                    fill={s.text3}
                    fontSize={9}
                    fontFamily={s.mono}
                  >
                    {l.label}
                  </text>
                </g>
              ))}

              <text
                x={PAD.left + PLOT_W / 2}
                y={CHART_H - 4}
                textAnchor="middle"
                fill={s.text2}
                fontSize={11}
              >
                T_train
              </text>
              <text
                x={14}
                y={PAD.top + PLOT_H / 2}
                textAnchor="middle"
                fill={s.text2}
                fontSize={11}
                transform={`rotate(-90, 14, ${PAD.top + PLOT_H / 2})`}
              >
                T_eval
              </text>

              {contourPoints && (
                <polyline
                  points={contourPoints}
                  fill="none"
                  stroke={s.yellow}
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  opacity={0.7}
                />
              )}

              {dataPoints.map((pt, i) => {
                const cx = toX(pt.tTrain)
                const cy = toY(pt.tEval)
                const isCurrent =
                  Math.abs(pt.tTrain - tTrain) < 0.01 &&
                  Math.abs(pt.tEval - tEval) < 0.01
                const r = isCurrent ? 8 : 4 + ((pt.perf - BASELINE) / 7) * 3

                return (
                  <g key={i}>
                    {isCurrent && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r + 6}
                        fill="none"
                        stroke={s.accent}
                        strokeWidth={2}
                        opacity={0.6}
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={perfColor(pt.perf)}
                      opacity={isCurrent ? 1 : 0.75}
                      style={{
                        transition: 'r 0.3s ease, opacity 0.3s ease',
                      }}
                    />
                  </g>
                )
              })}

              {(() => {
                const cx = toX(tTrain)
                const cy = toY(tEval)
                const inBounds =
                  tTrain >= T_TRAIN_MIN && tTrain <= T_TRAIN_MAX &&
                  tEval >= T_EVAL_MIN && tEval <= T_EVAL_MAX
                if (!inBounds) return null

                return (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={14}
                      fill="none"
                      stroke={s.accent}
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      opacity={0.8}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill={perfColor(currentPerf)}
                      stroke={s.text}
                      strokeWidth={1.5}
                      style={{
                        transition: 'fill 0.3s ease',
                      }}
                    />
                  </g>
                )
              })()}
            </svg>

            <div style={{
              marginTop: 10,
              padding: '8px 12px',
              background: s.bg,
              borderRadius: 6,
              border: `1px solid ${s.border}`,
              fontSize: 11,
              color: s.text2,
              fontFamily: s.mono,
              textAlign: 'center',
            }}>
              Each point is a (T_train, T_eval) pair. Point size and color
              indicate simulated accuracy. The dashed curve shows the T_eff = {PEAK_TEFF}
              optimal contour.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
