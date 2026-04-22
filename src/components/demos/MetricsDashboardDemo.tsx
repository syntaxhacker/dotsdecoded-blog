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

function generateLatencies(healthy: boolean, count: number = 200): number[] {
  const latencies: number[] = []
  for (let i = 0; i < count; i++) {
    if (healthy) {
      const base = 45 + Math.random() * 30
      latencies.push(base + (Math.random() > 0.95 ? Math.random() * 100 : 0))
    } else {
      const base = 45 + Math.random() * 30
      if (Math.random() > 0.8) {
        latencies.push(base + 200 + Math.random() * 800)
      } else {
        latencies.push(base)
      }
    }
  }
  return latencies.sort((a, b) => a - b)
}

function percentile(arr: number[], p: number): number {
  const idx = Math.ceil((p / 100) * arr.length) - 1
  return arr[Math.max(0, idx)]
}

function buildHistogram(latencies: number[], bucketSize: number): { range: string; count: number; max: number }[] {
  const maxVal = Math.max(...latencies)
  const buckets: { range: string; count: number; max: number }[] = []
  for (let lo = 0; lo < maxVal + bucketSize; lo += bucketSize) {
    const hi = lo + bucketSize
    const count = latencies.filter(l => l >= lo && l < hi).length
    buckets.push({ range: `${lo}-${hi}`, count, max: Math.max(...latencies.filter(l => l >= lo && l < hi), 0) })
  }
  return buckets
}

export default function MetricsDashboardDemo() {
  const [healthy, setHealthy] = useState(true)
  const [showAvg, setShowAvg] = useState(false)

  const latencies = useMemo(() => generateLatencies(healthy), [healthy])
  const p50 = useMemo(() => percentile(latencies, 50), [latencies])
  const p90 = useMemo(() => percentile(latencies, 90), [latencies])
  const p99 = useMemo(() => percentile(latencies, 99), [latencies])
  const p999 = useMemo(() => percentile(latencies, 99.9), [latencies])
  const avg = useMemo(() => latencies.reduce((a, b) => a + b, 0) / latencies.length, [latencies])
  const maxVal = useMemo(() => Math.max(...latencies), [latencies])
  const qps = healthy ? 1247 : 892

  const histogram = useMemo(() => buildHistogram(latencies, healthy ? 20 : 50), [latencies, healthy])
  const maxBucketCount = useMemo(() => Math.max(...histogram.map(b => b.count)), [histogram])

  const buckets = histogram.filter(b => b.count > 0)

  return (
    <DemoBoundary name="Metrics Dashboard">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Performance Metrics</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Toggle between a healthy and degraded system. Notice how averages hide outliers that percentiles reveal.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setHealthy(true)} style={{ background: healthy ? s.green : s.bg3, border: `1px solid ${healthy ? s.green : s.border}`, borderRadius: 8, padding: '8px 16px', color: healthy ? '#000' : s.text2, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Healthy System
          </button>
          <button onClick={() => setHealthy(false)} style={{ background: !healthy ? s.red : s.bg3, border: `1px solid ${!healthy ? s.red : s.border}`, borderRadius: 8, padding: '8px 16px', color: !healthy ? '#fff' : s.text2, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Degraded System
          </button>
          <button onClick={() => setShowAvg(!showAvg)} style={{ background: showAvg ? s.yellow : s.bg3, border: `1px solid ${showAvg ? s.yellow : s.border}`, borderRadius: 8, padding: '8px 16px', color: showAvg ? '#000' : s.text2, cursor: 'pointer', fontSize: 13 }}>
            {showAvg ? 'Show Percentiles' : 'Show Average'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
          <div style={{ background: s.bg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>QPS</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: s.mono, color: s.accent }}>{qps.toLocaleString()}</div>
          </div>
          {showAvg ? (
            <>
              <div style={{ background: s.bg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Average</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: s.mono, color: s.yellow }}>{avg.toFixed(1)}ms</div>
              </div>
              <div style={{ background: s.bg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Max</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: s.mono, color: s.red }}>{maxVal.toFixed(0)}ms</div>
              </div>
              <div style={{ background: s.bg, borderRadius: 8, padding: 12, textAlign: 'center', gridColumn: 'span 2' }}>
                <div style={{ fontSize: 9, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Problem</div>
                <div style={{ fontSize: 11, color: s.orange, lineHeight: 1.4 }}>
                  Average looks fine at {avg.toFixed(0)}ms, but {healthy ? '5%' : '20%'} of users see {healthy ? '>100ms' : '>300ms'}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ background: s.bg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>p50</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: s.mono, color: s.green }}>{p50.toFixed(1)}ms</div>
              </div>
              <div style={{ background: s.bg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>p90</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: s.mono, color: s.accent }}>{p90.toFixed(1)}ms</div>
              </div>
              <div style={{ background: s.bg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>p99</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: s.mono, color: s.orange }}>{p99.toFixed(1)}ms</div>
              </div>
              <div style={{ background: s.bg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>p999</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: s.mono, color: s.red }}>{p999.toFixed(1)}ms</div>
              </div>
            </>
          )}
        </div>

        <div style={{ background: s.bg, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Latency Distribution ({latencies.length} requests)
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
            {buckets.map((b, idx) => {
              const h = (b.count / maxBucketCount) * 100
              const barColor = b.max > p99 ? s.red : b.max > p90 ? s.orange : b.max > p50 ? s.accent : s.green
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{
                    width: '100%', height: `${h}%`, background: barColor, borderRadius: '2px 2px 0 0',
                    minHeight: 2, transition: 'all 0.3s',
                  }} />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 9, fontFamily: s.mono, color: s.text3 }}>0ms</span>
            <span style={{ fontSize: 9, fontFamily: s.mono, color: s.text3 }}>{maxVal.toFixed(0)}ms</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.green }} />
              <span style={{ fontSize: 10, color: s.text3 }}>p50 and below</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.accent }} />
              <span style={{ fontSize: 10, color: s.text3 }}>p50-p90</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.orange }} />
              <span style={{ fontSize: 10, color: s.text3 }}>p90-p99</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.red }} />
              <span style={{ fontSize: 10, color: s.text3 }}>p99+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
