import { useState, useEffect, useCallback, useRef } from 'react'
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

const TABLE_ROWS = [
  1, 5, 10, 25, 50, 100, 250, 500, 1000
]

function generateData(size: number) {
  const items = []
  for (let i = 0; i < Math.min(size, 30); i++) {
    items.push({ id: i + 1, value: Math.floor(Math.random() * 1000), highlight: false })
  }
  return items
}

export default function DatabaseIndexDemo() {
  const [tableSize, setTableSize] = useState(100)
  const [useIndex, setUseIndex] = useState(false)
  const [searchValue, setSearchValue] = useState(500)
  const [running, setRunning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [found, setFound] = useState(false)
  const [totalTime, setTotalTime] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [data, setData] = useState(() => generateData(100))
  const [queryPlan, setQueryPlan] = useState<string[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const runQuery = useCallback(() => {
    if (running) return
    setRunning(true)
    setScanProgress(0)
    setFound(false)
    setTotalTime(0)
    setData(generateData(tableSize))

    if (useIndex) {
      setQueryPlan([
        'Index Scan using idx_users_email',
        `B-tree lookup: O(log n)`,
        `Heap fetch: 1 row`,
      ])
      const steps = Math.ceil(Math.log2(tableSize))
      let step = 0
      const startTime = Date.now()
      intervalRef.current = setInterval(() => {
        step++
        setScanProgress(Math.min((step / steps) * 100, 100))
        setTotalTime(Date.now() - startTime)
        if (step >= steps) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setFound(true)
          setRunning(false)
        }
      }, getStepDelay(50, speed))
    } else {
      setQueryPlan([
        'Seq Scan on users',
        `Filter: (email = $1)`,
        `Rows examined: ${tableSize.toLocaleString()}`,
      ])
      const totalSteps = Math.min(tableSize, 100)
      let step = 0
      const startTime = Date.now()
      intervalRef.current = setInterval(() => {
        step++
        setScanProgress(Math.min((step / totalSteps) * 100, 100))
        setTotalTime(Date.now() - startTime)
        setData(prev => {
          const targetIdx = Math.floor((searchValue / 1000) * prev.length)
          if (step === targetIdx) {
            return prev.map((item, i) => i === targetIdx ? { ...item, highlight: true } : item)
          }
          return prev
        })
        if (step >= totalSteps) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          const targetIdx = Math.floor((searchValue / 1000) * Math.min(tableSize, 30))
          setData(prev => prev.map((item, i) => i === targetIdx ? { ...item, highlight: true } : item))
          setFound(true)
          setRunning(false)
        }
      }, getStepDelay(20, speed))
    }
  }, [running, useIndex, tableSize, searchValue, speed])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const estimatedTime = useIndex
    ? `~${Math.ceil(Math.log2(tableSize) * 0.1).toFixed(1)}ms`
    : `~${(tableSize * 0.01).toFixed(0)}ms`

  return (
    <DemoBoundary name="Database Indexing">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: 'hidden' }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${s.border}`, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: s.bg, borderRadius: 6, border: `1px solid ${s.border}` }}>
              <button
                onClick={() => { setUseIndex(false); setScanProgress(0); setFound(false); setTotalTime(0); }}
                disabled={running}
                style={{
                  padding: '6px 14px', fontSize: 13, fontFamily: s.mono, border: 'none', borderRadius: 5,
                  cursor: running ? 'not-allowed' : 'pointer',
                  background: !useIndex ? s.red : 'transparent',
                  color: !useIndex ? '#fff' : s.text3, transition: 'all 0.2s',
                }}
              >
                No Index
              </button>
              <button
                onClick={() => { setUseIndex(true); setScanProgress(0); setFound(false); setTotalTime(0); }}
                disabled={running}
                style={{
                  padding: '6px 14px', fontSize: 13, fontFamily: s.mono, border: 'none', borderRadius: 5,
                  cursor: running ? 'not-allowed' : 'pointer',
                  background: useIndex ? s.green : 'transparent',
                  color: useIndex ? '#000' : s.text3, transition: 'all 0.2s',
                }}
              >
                B-Tree Index
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text3 }}>Rows:</span>
              <select
                value={tableSize}
                onChange={e => { setTableSize(Number(e.target.value)); setScanProgress(0); setFound(false); setTotalTime(0); }}
                disabled={running}
                style={{
                  padding: '4px 8px', fontSize: 12, fontFamily: s.mono,
                  background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4,
                  color: s.text, outline: 'none',
                }}
              >
                {TABLE_ROWS.map(n => (
                  <option key={n} value={n}>{n.toLocaleString()}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text3 }}>WHERE id =</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={searchValue}
                onChange={e => setSearchValue(Number(e.target.value))}
                disabled={running}
                style={{
                  width: 60, padding: '4px 8px', fontSize: 12, fontFamily: s.mono,
                  background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4,
                  color: s.text, outline: 'none',
                }}
              />
            </div>

            <button
              onClick={runQuery}
              disabled={running}
              style={{
                marginLeft: 'auto', padding: '6px 14px', fontSize: 13, fontFamily: s.mono,
                border: `1px solid ${s.accent}`, borderRadius: 6,
                cursor: running ? 'not-allowed' : 'pointer',
                background: running ? s.bg3 : 'rgba(91,141,239,0.15)',
                color: running ? s.text3 : s.accent, transition: 'all 0.2s',
              }}
            >
              EXPLAIN ANALYZE
            </button>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>

          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 6 }}>QUERY PLAN</div>
            {queryPlan.length > 0 && queryPlan.map((line, i) => (
              <div key={i} style={{
                fontSize: 12, fontFamily: s.mono, padding: '3px 0',
                color: i === 0 ? (useIndex ? s.green : s.red) : s.text2,
              }}>
                {line}
              </div>
            ))}
            {queryPlan.length === 0 && (
              <div style={{ fontSize: 13, color: s.text3, fontStyle: 'italic' }}>Click "EXPLAIN ANALYZE" to run the query</div>
            )}
          </div>

          <div style={{ padding: 16, overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>
              TABLE SCAN ({useIndex ? 'B-Tree lookup' : 'Sequential scan'})
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(data.length, 15)}, 1fr)`,
              gap: 2,
              marginBottom: 12,
            }}>
              {data.map((row, i) => (
                <div key={i} style={{
                  height: 20, borderRadius: 2,
                  background: row.highlight
                    ? s.green
                    : useIndex
                    ? 'rgba(61,214,140,0.1)'
                    : scanProgress > 0 && (i / data.length) * 100 <= scanProgress
                    ? 'rgba(232,93,93,0.3)'
                    : s.bg3,
                  border: `1px solid ${row.highlight ? s.green : 'transparent'}`,
                  transition: 'background 0.15s',
                }} />
              ))}
            </div>

            {data.length < tableSize && (
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>
                Showing 30 of {tableSize.toLocaleString()} rows...
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 6, background: s.bg, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: `${scanProgress}%`, height: '100%',
                  background: useIndex ? s.green : s.red,
                  borderRadius: 3, transition: 'width 0.1s linear',
                }} />
              </div>
              <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, minWidth: 50, textAlign: 'right' }}>
                {Math.round(scanProgress)}%
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex', gap: 16, padding: '10px 16px',
            borderTop: `1px solid ${s.border}`, fontSize: 12, fontFamily: s.mono, color: s.text3,
          }}>
            <span>Rows: <span style={{ color: s.text2 }}>{tableSize.toLocaleString()}</span></span>
            <span>Strategy: <span style={{ color: useIndex ? s.green : s.red }}>{useIndex ? 'Index Scan' : 'Seq Scan'}</span></span>
            <span>Est. time: <span style={{ color: s.yellow }}>{estimatedTime}</span></span>
            <span>Actual: <span style={{ color: found ? s.green : s.accent }}>{totalTime}ms</span></span>
            {found && (
              <span style={{ color: s.green }}>
                Found in {useIndex ? `log2(${tableSize}) = ${Math.ceil(Math.log2(tableSize))} steps` : `${tableSize} steps`}
              </span>
            )}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
