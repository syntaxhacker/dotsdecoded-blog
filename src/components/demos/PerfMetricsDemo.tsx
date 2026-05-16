import { useState, useEffect } from 'react'
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

interface Metric {
  id: string
  label: string
  good: number
  poor: number
  unit: string
  description: string
}

const metrics: Metric[] = [
  { id: 'lcp', label: 'LCP', good: 2500, poor: 4000, unit: 'ms', description: 'Largest Contentful Paint' },
  { id: 'cls', label: 'CLS', good: 0.1, poor: 0.25, unit: '', description: 'Cumulative Layout Shift' },
  { id: 'inp', label: 'INP', good: 200, poor: 500, unit: 'ms', description: 'Interaction to Next Paint' },
  { id: 'fcp', label: 'FCP', good: 1800, poor: 3000, unit: 'ms', description: 'First Contentful Paint' },
  { id: 'ttfb', label: 'TTFB', good: 800, poor: 1800, unit: 'ms', description: 'Time to First Byte' },
]

type Throttle = 'none' | 'slow3g' | 'cpu4x'

const multipliers: Record<Throttle, Record<string, { value: number }>> = {
  none: {
    lcp: { value: 1800 }, cls: { value: 0.08 }, inp: { value: 150 },
    fcp: { value: 1200 }, ttfb: { value: 400 },
  },
  slow3g: {
    lcp: { value: 4800 }, cls: { value: 0.12 }, inp: { value: 250 },
    fcp: { value: 3800 }, ttfb: { value: 1800 },
  },
  cpu4x: {
    lcp: { value: 3500 }, cls: { value: 0.18 }, inp: { value: 420 },
    fcp: { value: 2400 }, ttfb: { value: 500 },
  },
}

function getColor(metric: Metric, value: number): string {
  if (metric.id === 'cls') {
    if (value <= metric.good) return s.green
    if (value <= metric.poor) return s.yellow
    return s.red
  }
  if (value <= metric.good) return s.green
  if (value <= metric.poor) return s.yellow
  return s.red
}

function getGaugeRotation(metric: Metric, value: number): number {
  if (metric.id === 'cls') {
    const maxDisplay = 0.4
    const pct = Math.min(value / maxDisplay, 1)
    return pct * 180
  }
  const maxDisplay = metric.poor * 1.5
  const pct = Math.min(value / maxDisplay, 1)
  return pct * 180
}

function flattenValues(m: Record<string, { value: number }>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(m)) out[k] = v.value
  return out
}

export default function PerfMetricsDemo() {
  const [throttle, setThrottle] = useState<Throttle>('none')
  const [values, setValues] = useState<Record<string, number>>(flattenValues(multipliers.none))
  const [prevValues, setPrevValues] = useState<Record<string, number>>(multipliers.none)

  useEffect(() => {
    setPrevValues(values)
    const target = multipliers[throttle]
    const start = values
    let startTime: number | null = null
    const duration = 800

    const animate = (time: number) => {
      if (!startTime) startTime = time
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)

      const newValues: Record<string, number> = {}
      for (const m of metrics) {
        const from = start[m.id] ?? target[m.id].value
        const to = target[m.id].value
        newValues[m.id] = from + (to - from) * ease
      }
      const rounded: Record<string, number> = {}
      for (const [k, v] of Object.entries(newValues)) {
        rounded[k] = metrics.find(m => m.id === k)?.id === 'cls' ? Math.round(v * 1000) / 1000 : Math.round(v)
      }
      setValues(rounded)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [throttle])

  const formatValue = (metric: Metric, value: number) => {
    if (metric.id === 'cls') return value.toFixed(3)
    return `${value}`
  }

  return (
    <DemoBoundary name="Performance Metrics Dashboard">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Performance Metrics Dashboard</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {([['none', 'No Throttle'], ['slow3g', 'Slow 3G'], ['cpu4x', '4x CPU Slowdown']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setThrottle(key)} style={{
              background: throttle === key ? s.accent : s.bg3,
              border: `1px solid ${throttle === key ? s.accent : s.border}`,
              borderRadius: 8, padding: '8px 16px',
              color: throttle === key ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 12, fontWeight: throttle === key ? 600 : 400,
            }}>{label}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          {metrics.map(metric => {
            const value = values[metric.id] ?? 0
            const color = getColor(metric, value)
            const rotation = getGaugeRotation(metric, value)

            return (
              <div key={metric.id} style={{
                background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12,
                padding: 14, textAlign: 'center',
              }}>
                <div style={{ color: s.text3, fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{metric.label}</div>

                <div style={{ position: 'relative', width: 80, height: 44, margin: '4px auto 8px', overflow: 'hidden' }}>
                  <svg width="80" height="44" viewBox="0 0 80 44">
                    <path d="M 6 40 A 34 34 0 0 1 74 40" fill="none" stroke={s.bg3} strokeWidth="6" strokeLinecap="round" />
                    <path
                      d="M 6 40 A 34 34 0 0 1 74 40"
                      fill="none"
                      stroke={color}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(rotation / 180) * 106.8} 106.8`}
                      style={{ transition: 'stroke-dasharray 0.6s ease' }}
                    />
                  </svg>
                </div>

                <div style={{ color, fontFamily: s.mono, fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
                  {formatValue(metric, value)}
                  {metric.unit && <span style={{ fontSize: 11, color: s.text3, marginLeft: 2 }}>{metric.unit}</span>}
                </div>
                <div style={{ color: s.text3, fontSize: 9 }}>{metric.description}</div>
              </div>
            )
          })}
        </div>

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Threshold Legend</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Good', color: s.green },
              { label: 'Needs Improvement', color: s.yellow },
              { label: 'Poor', color: s.red },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                <span style={{ color: s.text2, fontSize: 11 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
