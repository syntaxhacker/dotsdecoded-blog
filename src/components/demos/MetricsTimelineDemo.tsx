import { useState, useEffect, useRef } from 'react'
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

interface MetricSeries {
  name: string
  unit: string
  color: string
  threshold?: number
  thresholdLabel?: string
  generate: (t: number, incident: boolean) => number
}

const redMetrics: MetricSeries[] = [
  {
    name: 'Request Rate', unit: 'req/s', color: s.accent,
    generate: (t, inc) => inc ? 800 + Math.random() * 400 : 200 + Math.sin(t * 0.1) * 30 + Math.random() * 20,
  },
  {
    name: 'Error Rate', unit: '%', color: s.red, threshold: 5, thresholdLabel: 'Alert: 5%',
    generate: (t, inc) => inc ? 8 + Math.random() * 12 : 0.3 + Math.random() * 0.5,
  },
  {
    name: 'p99 Latency', unit: 'ms', color: s.orange, threshold: 500, thresholdLabel: 'Alert: 500ms',
    generate: (t, inc) => inc ? 400 + Math.random() * 600 : 80 + Math.sin(t * 0.15) * 20 + Math.random() * 30,
  },
]

const useMetrics: MetricSeries[] = [
  {
    name: 'CPU', unit: '%', color: s.accent, threshold: 85, thresholdLabel: 'Alert: 85%',
    generate: (t, inc) => inc ? 75 + Math.random() * 25 : 35 + Math.sin(t * 0.08) * 10 + Math.random() * 8,
  },
  {
    name: 'Memory', unit: '%', color: s.purple, threshold: 90, thresholdLabel: 'Alert: 90%',
    generate: (t, inc) => inc ? 82 + Math.random() * 15 : 55 + Math.sin(t * 0.05) * 5 + Math.random() * 5,
  },
  {
    name: 'Disk I/O', unit: 'MB/s', color: s.green, threshold: 100, thresholdLabel: 'Alert: 100 MB/s',
    generate: (t, inc) => inc ? 80 + Math.random() * 60 : 25 + Math.random() * 15,
  },
]

const MAX_POINTS = 40

function Chart({ series, data, alertFired }: { series: MetricSeries; data: number[]; alertFired: boolean }) {
  const w = 340
  const h = 80
  const pad = { top: 10, right: 10, bottom: 10, left: 10 }
  const maxVal = Math.max(...data, series.threshold || 0) * 1.15
  const minVal = 0

  const points = data.map((v, i) => {
    const x = pad.left + (i / Math.max(1, MAX_POINTS - 1)) * (w - pad.left - pad.right)
    const y = pad.top + (1 - (v - minVal) / (maxVal - minVal)) * (h - pad.top - pad.bottom)
    return `${x},${y}`
  }).join(' ')

  const threshY = series.threshold ? pad.top + (1 - (series.threshold - minVal) / (maxVal - minVal)) * (h - pad.top - pad.bottom) : null

  const lastVal = data[data.length - 1] || 0

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: series.color }} />
          <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>{series.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: series.color, fontFamily: s.mono, fontSize: 14, fontWeight: 700 }}>
            {lastVal.toFixed(series.unit === '%' || series.unit === 'req/s' ? 1 : 0)}{series.unit === '%' ? '%' : ` ${series.unit}`}
          </span>
          {alertFired && (
            <span style={{
              background: s.red + '20', color: s.red, fontSize: 11, fontFamily: s.mono,
              padding: '2px 8px', borderRadius: 4, fontWeight: 600,
            }}>ALERT</span>
          )}
        </div>
      </div>
      <div style={{ background: s.bg, borderRadius: 8, padding: 8, overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h, display: 'block' }}>
          {threshY !== null && (
            <line x1={pad.left} y1={threshY} x2={w - pad.right} y2={threshY} stroke={s.red} strokeWidth={1} strokeDasharray="4,3" opacity={0.7} />
          )}
          {threshY !== null && series.thresholdLabel && (
            <text x={w - pad.right - 2} y={threshY - 4} fill={s.red} fontSize={8} textAnchor="end" fontFamily={s.mono}>{series.thresholdLabel}</text>
          )}
          {data.length > 1 && (
            <polyline points={points} fill="none" stroke={series.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          )}
          {data.length > 0 && (() => {
            const lastX = pad.left + ((data.length - 1) / Math.max(1, MAX_POINTS - 1)) * (w - pad.left - pad.right)
            const lastY = pad.top + (1 - (lastVal - minVal) / (maxVal - minVal)) * (h - pad.top - pad.bottom)
            return <circle cx={lastX} cy={lastY} r={3} fill={series.color} />
          })()}
        </svg>
      </div>
    </div>
  )
}

export default function MetricsTimelineDemo() {
  const [view, setView] = useState<'RED' | 'USE'>('RED')
  const [incident, setIncident] = useState(false)
  const [tick, setTick] = useState(0)
  const [data, setData] = useState<Record<string, number[]>>({
    'Request Rate': [], 'Error Rate': [], 'p99 Latency': [],
    'CPU': [], 'Memory': [], 'Disk I/O': [],
  })
  const [alerts, setAlerts] = useState<Record<string, boolean>>({})
  const incidentStart = useRef(-1)

  const metrics = view === 'RED' ? redMetrics : useMetrics

  useEffect(() => {
    const t = setInterval(() => {
      setTick(prev => prev + 1)
    }, 500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setData(prev => {
      const next = { ...prev }
      metrics.forEach(m => {
        const arr = [...(next[m.name] || [])]
        const val = m.generate(tick, incident)
        arr.push(val)
        if (arr.length > MAX_POINTS) arr.shift()
        next[m.name] = arr
      })
      return next
    })
  }, [tick, incident, view])

  useEffect(() => {
    const newAlerts: Record<string, boolean> = {}
    metrics.forEach(m => {
      if (m.threshold !== undefined) {
        const arr = data[m.name] || []
        const last = arr[arr.length - 1] || 0
        newAlerts[m.name] = last > m.threshold
      }
    })
    setAlerts(newAlerts)
  }, [data, view])

  const hasAnyAlert = Object.values(alerts).some(Boolean)

  return (
    <DemoBoundary name="Metrics Timeline">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Metrics Dashboard</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Watch metrics in real-time. Toggle an incident to see how error rate, latency, and resource usage spike.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setView('RED')} style={{
            background: view === 'RED' ? s.accent : s.bg3, border: `1px solid ${view === 'RED' ? s.accent : s.border}`,
            borderRadius: 8, padding: '6px 16px', color: view === 'RED' ? '#fff' : s.text2, cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>RED (Rate, Errors, Duration)</button>
          <button onClick={() => setView('USE')} style={{
            background: view === 'USE' ? s.green : s.bg3, border: `1px solid ${view === 'USE' ? s.green : s.border}`,
            borderRadius: 8, padding: '6px 16px', color: view === 'USE' ? '#fff' : s.text2, cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>USE (Utilization, Saturation, Errors)</button>
          <div style={{ flex: 1 }} />
          <button onClick={() => {
            if (!incident) incidentStart.current = tick
            setIncident(!incident)
          }} style={{
            background: incident ? s.green : s.red, border: 'none', borderRadius: 8, padding: '6px 16px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>{incident ? 'Resolve Incident' : 'Simulate Incident'}</button>
        </div>

        {hasAnyAlert && (
          <div style={{
            background: s.red + '10', border: `1px solid ${s.red}40`, borderRadius: 8,
            padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.red, animation: 'pulse 1s infinite' }} />
            <span style={{ color: s.red, fontSize: 13, fontWeight: 600 }}>Active Alert</span>
            <span style={{ color: s.text2, fontSize: 12 }}>
              {metrics.filter(m => alerts[m.name]).map(m => m.name).join(', ')} exceeded threshold
            </span>
          </div>
        )}

        {incident && (
          <div style={{
            background: s.yellow + '10', border: `1px solid ${s.yellow}40`, borderRadius: 8,
            padding: '8px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: s.yellow, fontSize: 12, fontFamily: s.mono }}>INCIDENT ACTIVE</span>
            <span style={{ color: s.text3, fontSize: 12 }}>Error rate spiking, latency increasing, resources saturating</span>
          </div>
        )}

        {metrics.map(m => (
          <Chart key={m.name} series={m} data={data[m.name] || []} alertFired={!!alerts[m.name]} />
        ))}

        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 0, borderTop: `2px dashed ${s.red}` }} />
            <span style={{ color: s.text3, fontSize: 11 }}>Alert threshold</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.red }} />
            <span style={{ color: s.text3, fontSize: 11 }}>Alert fired</span>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
