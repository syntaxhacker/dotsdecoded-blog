import { useState, useEffect, useRef } from 'react'
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

const DAYS = 14
const CONTROL_BASE = 0.05
const TREATMENT_BASE = 0.058
const DAILY_USERS = [800, 1200, 1500, 1800, 2200, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 7000]

function simulateDay(day: number) {
  const n = DAILY_USERS.slice(0, day + 1).reduce((a, b) => a + b, 0)
  const controlP = CONTROL_BASE
  const treatmentP = TREATMENT_BASE
  const controlConv = Math.round(n / 2 * controlP)
  const treatmentConv = Math.round(n / 2 * treatmentP)
  const se = Math.sqrt((controlP * (1 - controlP) + treatmentP * (1 - treatmentP)) / (n / 2))
  const z = (treatmentP - controlP) / se
  const pValueRaw = 2 * (1 - normalCDF(Math.abs(z)))
  return { n, controlP, treatmentP, controlConv, treatmentConv, se, z, pValueRaw }
}

function normalCDF(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.sqrt(2)
  const t = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return 0.5 * (1 + sign * y)
}

export default function StatsSignificanceDemo() {
  const [day, setDay] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setDay(prev => {
          if (prev >= DAYS - 1) {
            setRunning(false)
            return prev
          }
          return prev + 1
        })
      }, getStepDelay(600, speed))
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, speed])

  const reset = () => {
    setRunning(false)
    setDay(0)
  }

  const stats = simulateDay(day)
  const lift = ((stats.treatmentP / stats.controlP) - 1) * 100
  const significant = stats.pValueRaw < 0.05
  const sigY = 100 - Math.min(Math.max((stats.pValueRaw / 0.1) * 100, 0), 100)

  const maxN = DAILY_USERS.reduce((a, b) => a + b, 0)

  const W = 500
  const H = 180
  const padL = 50
  const padR = 20
  const padT = 20
  const padB = 30
  const chartW = W - padL - padR
  const chartH = H - padT - padB

  const controlRates: number[] = []
  const treatmentRates: number[] = []
  for (let d = 0; d <= day; d++) {
    const st = simulateDay(d)
    controlRates.push(st.controlP * 100)
    treatmentRates.push(st.treatmentP * 100)
  }

  const xScale = (d: number) => padL + (d / Math.max(day, 1)) * chartW
  const yScale = (v: number) => padT + chartH - ((v - 4.5) / 2.0) * chartH

  const controlPath = controlRates.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(v)}`).join(' ')
  const treatmentPath = treatmentRates.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(v)}`).join(' ')

  return (
    <DemoBoundary name="Statistical Significance">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>
        Statistical Significance Over Time
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
        Control: 5.0% conversion, Treatment: 5.8% conversion. As sample size grows, the confidence interval narrows and significance emerges.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{
            background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 14px',
            color: s.text2, cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
          }}>
            Reset
          </button>
          <button onClick={() => setRunning(!running)} style={{
            background: running ? s.red : s.green, border: 'none', borderRadius: 6, padding: '6px 14px',
            color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: s.mono, fontWeight: 600,
          }}>
            {running ? 'Stop' : 'Run Experiment'}
          </button>
        </div>
        <SpeedController speed={speed} onSpeedChange={setSpeed} />
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1, padding: '12px 16px', background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}` }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Day</div>
          <div style={{ color: s.text, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>{day + 1}/{DAYS}</div>
          <div style={{ color: s.text3, fontSize: 11 }}>Users: {stats.n.toLocaleString()}</div>
        </div>
        <div style={{ flex: 1, padding: '12px 16px', background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}` }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>p-value</div>
          <div style={{
            color: significant ? s.green : s.yellow,
            fontFamily: s.mono,
            fontSize: 22,
            fontWeight: 700,
          }}>
            {stats.pValueRaw < 0.001 ? '< 0.001' : stats.pValueRaw.toFixed(4)}
          </div>
          <div style={{ color: s.text3, fontSize: 11 }}>
            {significant ? 'Significant (p < 0.05)' : 'Not significant'}
          </div>
        </div>
        <div style={{ flex: 1, padding: '12px 16px', background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}` }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Lift</div>
          <div style={{ color: s.green, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>
            +{lift.toFixed(1)}%
          </div>
          <div style={{ color: s.text3, fontSize: 11 }}>Treatment vs Control</div>
        </div>
      </div>

      <div style={{
        background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`,
        padding: 16, marginBottom: 20, overflow: 'hidden',
      }}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke={s.border2} strokeWidth={1} />
          <line x1={padL} y1={padT + chartH} x2={W - padR} y2={padT + chartH} stroke={s.border2} strokeWidth={1} />
          <text x={padL - 8} y={padT} textAnchor="end" fill={s.text3} fontSize={9}>6.0%</text>
          <text x={padL - 8} y={padT + chartH * 0.25} textAnchor="end" fill={s.text3} fontSize={9}>5.5%</text>
          <text x={padL - 8} y={padT + chartH * 0.5} textAnchor="end" fill={s.text3} fontSize={9}>5.0%</text>
          <text x={padL - 8} y={padT + chartH * 0.75} textAnchor="end" fill={s.text3} fontSize={9}>4.5%</text>
          <text x={padL - 8} y={padT + chartH} textAnchor="end" fill={s.text3} fontSize={9}>4.0%</text>
          {day > 0 && (
            <>
              <path d={controlPath} fill="none" stroke={s.green} strokeWidth={2.5} strokeLinejoin="round" />
              <path d={treatmentPath} fill="none" stroke={s.accent} strokeWidth={2.5} strokeLinejoin="round" />
            </>
          )}
          {day > 0 && (
            <>
              <circle cx={xScale(day)} cy={yScale(treatmentRates[day])} r={4} fill={s.accent} />
              <circle cx={xScale(day)} cy={yScale(controlRates[day])} r={4} fill={s.green} />
            </>
          )}
          <line x1={padL} y1={yScale(0.05)} x2={padL + chartW} y2={yScale(0.05)} stroke={s.border} strokeWidth={1} strokeDasharray="4 4" />
        </svg>
      </div>

      <div style={{
        background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`,
        padding: 16, marginBottom: 20,
      }}>
        <div style={{ color: s.text3, fontSize: 10, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          P-Value Threshold
        </div>
        <div style={{ height: 24, background: s.bg3, borderRadius: 12, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${sigY}%`,
            background: `linear-gradient(90deg, ${s.red}, ${s.yellow}, ${s.green})`,
            borderRadius: 12,
            transition: 'width 0.5s ease',
          }} />
          <div style={{
            position: 'absolute', left: '50%', top: 0, bottom: 0,
            width: 3, background: '#fff',
            transform: 'translateX(-50%)',
          }} />
          <div style={{
            position: 'absolute', left: '50%', top: '100%',
            transform: 'translateX(-50%)',
            color: s.text3, fontSize: 9, marginTop: 2,
          }}>
            p = 0.05
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, padding: '12px 16px', background: s.bg2, borderRadius: 10, border: `1px solid ${s.green}44` }}>
          <div style={{ color: s.green, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Control</div>
          <div style={{ color: s.text, fontFamily: s.mono, fontSize: 16 }}>{(stats.controlP * 100).toFixed(2)}%</div>
          <div style={{ color: s.text3, fontSize: 11 }}>{stats.controlConv} conversions</div>
        </div>
        <div style={{ flex: 1, padding: '12px 16px', background: s.bg2, borderRadius: 10, border: `1px solid ${s.accent}44` }}>
          <div style={{ color: s.accent, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Treatment</div>
          <div style={{ color: s.text, fontFamily: s.mono, fontSize: 16 }}>{(stats.treatmentP * 100).toFixed(2)}%</div>
          <div style={{ color: s.text3, fontSize: 11 }}>{stats.treatmentConv} conversions</div>
        </div>
        <div style={{ flex: 1, padding: '12px 16px', background: s.bg2, borderRadius: 10, border: `1px solid ${s.yellow}44` }}>
          <div style={{ color: s.yellow, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Z-Score</div>
          <div style={{ color: s.text, fontFamily: s.mono, fontSize: 16 }}>{stats.z.toFixed(2)}</div>
          <div style={{ color: s.text3, fontSize: 11 }}>standard deviations</div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
