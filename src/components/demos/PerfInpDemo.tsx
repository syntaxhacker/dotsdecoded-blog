import { useState, useRef, useCallback } from 'react'
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

const longTask = () => {
  const start = performance.now()
  while (performance.now() - start < 180) {}
}

const shortTask = () => {
  const start = performance.now()
  while (performance.now() - start < 10) {}
}

export default function PerfInpDemo() {
  const [scenario, setScenario] = useState<'responsive' | 'unresponsive'>('responsive')
  const [result, setResult] = useState<{
    inputDelay: number
    processing: number
    presentation: number
    total: number
  } | null>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [longTasks, setLongTasks] = useState<number[]>([])
  const clickTimeRef = useRef(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const busyIntervalRef = useRef<number>(0)

  const startBusyLoop = () => {
    if (busyIntervalRef.current) return
    if (scenario === 'unresponsive') {
      let idx = 0
      const ival = window.setInterval(() => {
        setLongTasks(prev => [...prev.slice(-5), Date.now()])
        const end = Date.now() + 80
        while (Date.now() < end) {}
      }, 200)
      busyIntervalRef.current = ival
    }
  }

  const stopBusyLoop = () => {
    if (busyIntervalRef.current) {
      clearInterval(busyIntervalRef.current)
      busyIntervalRef.current = 0
    }
  }

  const handleClick = useCallback(async () => {
    clickTimeRef.current = performance.now()

    if (scenario === 'responsive') {
      const inputDelay = Math.random() * 10
      const processing = 8 + Math.random() * 15
      const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
      await sleep(processing)
      const presentation = 12 + Math.random() * 8
      const total = inputDelay + processing + presentation

      setResult({ inputDelay: Math.round(inputDelay), processing: Math.round(processing), presentation: Math.round(presentation), total: Math.round(total) })
      setShowBreakdown(true)
      setTimeout(() => setShowBreakdown(false), 3000)
    } else {
      const inputDelay = 30 + Math.random() * 80
      longTask()
      const processing = 120 + Math.random() * 80
      longTask()
      const presentation = 40 + Math.random() * 60
      const total = inputDelay + processing + presentation

      setResult({ inputDelay: Math.round(inputDelay), processing: Math.round(processing), presentation: Math.round(presentation), total: Math.round(total) })
      setShowBreakdown(true)
      setTimeout(() => setShowBreakdown(false), 4000)
    }
  }, [scenario])

  const switchScenario = (s: 'responsive' | 'unresponsive') => {
    setScenario(s)
    setResult(null)
    setShowBreakdown(false)
    setLongTasks([])
    if (s === 'responsive') stopBusyLoop()
    if (s === 'unresponsive') startBusyLoop()
  }

  const inpRange = result ? (
    result.total < 200 ? s.green : result.total < 500 ? s.yellow : s.red
  ) : s.text3

  const maxBar = 350

  return (
    <DemoBoundary name="Interaction to Next Paint">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Interaction to Next Paint</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['responsive', 'unresponsive'] as const).map(sc => (
            <button key={sc} onClick={() => switchScenario(sc)} style={{
              background: scenario === sc ? s.accent : s.bg3,
              border: `1px solid ${scenario === sc ? s.accent : s.border}`,
              borderRadius: 8, padding: '8px 16px',
              color: scenario === sc ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 13, fontWeight: scenario === sc ? 600 : 400,
              textTransform: 'capitalize',
            }}>{sc}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 24, marginBottom: 20, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: s.text3, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                {scenario === 'responsive' ? 'Responsive Page' : 'Unresponsive Page (Long Tasks)'}
              </div>

              <div style={{ position: 'relative', height: 200, background: s.bg3, borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                <div style={{ color: s.text2, fontSize: 13 }}>Interactive Demo</div>
                <div style={{ color: s.text3, fontSize: 11 }}>Click the button to measure INP</div>
                {scenario === 'unresponsive' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, width: '80%' }}>
                    <div style={{ background: s.bg2, borderRadius: 4, padding: '2px 8px', fontSize: 9, color: s.text3, fontFamily: s.mono, textAlign: 'left' }}>
                      [main thread] task: script execution
                    </div>
                    <div style={{ background: s.bg2, borderRadius: 4, padding: '2px 8px', fontSize: 9, color: s.text3, fontFamily: s.mono, textAlign: 'left' }}>
                      [main thread] task: layout computation
                    </div>
                    <div style={{ background: s.bg2, borderRadius: 4, padding: '2px 8px', fontSize: 9, color: s.text3, fontFamily: s.mono, textAlign: 'left' }}>
                      [main thread] task: garbage collection
                    </div>
                  </div>
                )}
              </div>

              <button ref={buttonRef} onClick={handleClick} disabled={showBreakdown} style={{
                background: showBreakdown ? s.bg3 : s.accent, border: 'none', borderRadius: 8, padding: '12px 32px',
                color: '#fff', cursor: showBreakdown ? 'default' : 'pointer', fontSize: 14, fontWeight: 600,
                minWidth: 160, transition: 'all 0.2s',
              }}>
                {showBreakdown ? 'Measuring...' : 'Click Me'}
              </button>
            </div>
          </div>

          <div style={{ width: 280 }}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>INP Breakdown</div>

              {result ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Input Delay', value: result.inputDelay, color: s.purple, pct: result.inputDelay / maxBar },
                    { label: 'Processing', value: result.processing, color: s.orange, pct: result.processing / maxBar },
                    { label: 'Presentation', value: result.presentation, color: s.yellow, pct: result.presentation / maxBar },
                  ].map(bar => (
                    <div key={bar.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ color: s.text3, fontSize: 10 }}>{bar.label}</span>
                        <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 11 }}>{bar.value}ms</span>
                      </div>
                      <div style={{ background: s.bg3, borderRadius: 3, height: 8, overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(bar.pct * 100, 100)}%`,
                          height: '100%', background: bar.color, borderRadius: 3,
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                  ))}

                  <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 8, marginTop: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: s.text2, fontSize: 12, fontWeight: 600 }}>Total INP</span>
                      <span style={{ color: inpRange, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{result.total}ms</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                  Click the button to see INP breakdown
                </div>
              )}
            </div>

            {scenario === 'unresponsive' && (
              <div style={{ background: `${s.red}10`, border: `1px solid ${s.red}30`, borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ color: s.red, fontSize: 11, fontFamily: s.mono, marginBottom: 4 }}>&gt; 200ms INP impact</div>
                <div style={{ color: s.text3, fontSize: 10, lineHeight: 1.4 }}>
                  Long tasks block the main thread, delaying input processing and paint. Browser cannot respond until tasks complete.
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>INP Thresholds</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Good', range: '< 200ms', color: s.green },
              { label: 'Needs Improvement', range: '200 - 500ms', color: s.yellow },
              { label: 'Poor', range: '> 500ms', color: s.red },
            ].map(item => (
              <div key={item.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ color: item.color, fontSize: 12, fontWeight: 600 }}>{item.label}</div>
                <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>{item.range}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
