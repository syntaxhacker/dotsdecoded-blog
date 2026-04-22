import { useState, useEffect, useRef, useCallback } from 'react'
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

interface DataPoint {
  id: number
  arrivedAt: number
  processedAt: number | null
  value: number
}

const W = 360
const H = 160

export default function BatchVsStreamDemo() {
  const [batchData, setBatchData] = useState<DataPoint[]>([])
  const [streamData, setStreamData] = useState<DataPoint[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [nextId, setNextId] = useState(1)
  const [batchInterval, setBatchInterval] = useState(5)
  const [batchAccumulated, setBatchAccumulated] = useState<DataPoint[]>([])
  const [batchProcessing, setBatchProcessing] = useState(false)
  const timeRef = useRef(0)
  const batchAccumRef = useRef<DataPoint[]>([])
  const nextIdRef = useRef(1)

  const reset = useCallback(() => {
    setBatchData([])
    setStreamData([])
    setRunning(false)
    setDone(false)
    setNextId(1)
    setBatchAccumulated([])
    setBatchProcessing(false)
    timeRef.current = 0
    batchAccumRef.current = []
    nextIdRef.current = 1
  }, [])

  const start = useCallback(() => {
    reset()
    setRunning(true)
  }, [reset])

  useEffect(() => {
    if (!running) return

    const baseDelay = getStepDelay(300, speed)
    const t = setInterval(() => {
      timeRef.current += 1
      const id = nextIdRef.current
      nextIdRef.current += 1
      setNextId(nextIdRef.current)
      const value = Math.floor(Math.random() * 80) + 10
      const now = timeRef.current

      setStreamData((prev) => [...prev, { id, arrivedAt: now, processedAt: now, value }])

      batchAccumRef.current = [...batchAccumRef.current, { id, arrivedAt: now, processedAt: null, value }]
      setBatchAccumulated(batchAccumRef.current)

      if (timeRef.current % batchInterval === 0) {
        setBatchProcessing(true)
        setTimeout(() => {
          setBatchData((prev) => [...prev, ...batchAccumRef.current.map((d) => ({ ...d, processedAt: timeRef.current }))])
          batchAccumRef.current = []
          setBatchAccumulated([])
          setBatchProcessing(false)
        }, baseDelay * 2)
      }

      if (id >= 25) {
        setRunning(false)
        setDone(true)
        if (batchAccumRef.current.length > 0) {
          setBatchData((prev) => [...prev, ...batchAccumRef.current.map((d) => ({ ...d, processedAt: timeRef.current }))])
          batchAccumRef.current = []
          setBatchAccumulated([])
        }
      }
    }, baseDelay)

    return () => clearInterval(t)
  }, [running, speed, batchInterval])

  const renderPanel = (
    title: string,
    color: string,
    data: DataPoint[],
    accumulated: DataPoint[],
    processing: boolean,
  ) => {
    const maxTime = Math.max(25, ...data.map((d) => Math.max(d.arrivedAt, d.processedAt || 0)), ...accumulated.map((d) => d.arrivedAt))
    const scaleX = (t: number) => (t / maxTime) * (W - 20) + 10
    const scaleY = (v: number) => H - (v / 100) * (H - 20) - 10

    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden',
        }}>
          <div style={{
            padding: '6px 14px', borderBottom: `1px solid ${s.border}`,
            fontFamily: s.mono, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>{title}</span>
            <span style={{ color }}>
              {data.length} processed{accumulated.length > 0 ? ` + ${accumulated.length} waiting` : ''}
            </span>
          </div>
          <div style={{ padding: 8 }}>
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
              {[0, 1, 2, 3, 4].map((i) => {
                const x = (i / 4) * (W - 20) + 10
                return (
                  <g key={i}>
                    <line x1={x} y1={10} x2={x} y2={H - 10} stroke={s.border} strokeWidth={0.5} strokeDasharray="2 2" />
                    <text x={x} y={H - 2} textAnchor="middle" fill={s.text3} fontSize={7} fontFamily={s.mono}>
                      {Math.round((i / 4) * maxTime)}s
                    </text>
                  </g>
                )
              })}

              {accumulated.map((dp) => (
                <circle
                  key={`acc-${dp.id}`}
                  cx={scaleX(dp.arrivedAt)}
                  cy={scaleY(dp.value)}
                  r={3}
                  fill="none"
                  stroke={s.yellow}
                  strokeWidth={1}
                  strokeDasharray="2 1"
                  opacity={processing ? 0.8 : 0.3}
                />
              ))}

              {data.map((dp) => (
                <g key={dp.id}>
                  {dp.processedAt !== null && dp.processedAt !== dp.arrivedAt && (
                    <line
                      x1={scaleX(dp.arrivedAt)}
                      y1={scaleY(dp.value)}
                      x2={scaleX(dp.processedAt)}
                      y2={scaleY(dp.value)}
                      stroke={s.red}
                      strokeWidth={1}
                      opacity={0.3}
                    />
                  )}
                  <circle
                    cx={scaleX(dp.arrivedAt)}
                    cy={scaleY(dp.value)}
                    r={3}
                    fill={s.text3}
                    opacity={0.4}
                  />
                  {dp.processedAt !== null && (
                    <circle
                      cx={scaleX(dp.processedAt)}
                      cy={scaleY(dp.value)}
                      r={4}
                      fill={color}
                    />
                  )}
                </g>
              ))}
            </svg>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', fontFamily: s.mono, fontSize: 9, color: s.text3, marginTop: 4 }}>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: s.text3, opacity: 0.4, verticalAlign: 'middle', marginRight: 4 }} />Arrived</span>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, verticalAlign: 'middle', marginRight: 4 }} />Processed</span>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', border: `1px solid ${s.yellow}`, verticalAlign: 'middle', marginRight: 4 }} />Waiting</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const avgLatency = (data: DataPoint[]) => {
    if (data.length === 0) return 0
    const total = data.reduce((sum, d) => sum + ((d.processedAt || 0) - d.arrivedAt), 0)
    return (total / data.length).toFixed(1)
  }

  return (
    <DemoBoundary name="Batch vs Stream">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3 }}>Batch interval:</span>
            <input
              type="range" min="3" max="10" value={batchInterval}
              onChange={(e) => setBatchInterval(Number(e.target.value))}
              style={{ width: 80 }}
            />
            <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text2 }}>{batchInterval}s</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          {renderPanel('Batch Processing', s.yellow, batchData, batchAccumulated, batchProcessing)}
          {renderPanel('Stream Processing', s.accent, streamData, [], false)}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div style={{
            flex: 1, padding: '8px 12px', borderRadius: 6, background: `${s.yellow}08`,
            border: `1px solid ${s.yellow}20`, fontFamily: s.mono, fontSize: 10,
          }}>
            <div style={{ color: s.yellow, fontWeight: 600, marginBottom: 4 }}>BATCH</div>
            <div style={{ color: s.text3, lineHeight: 1.5 }}>
              Avg latency: <span style={{ color: s.yellow }}>{avgLatency(batchData)}s</span> |
              Data accumulates, then processes in bulk. High throughput, high latency.
            </div>
          </div>
          <div style={{
            flex: 1, padding: '8px 12px', borderRadius: 6, background: `${s.accent}08`,
            border: `1px solid ${s.accent}20`, fontFamily: s.mono, fontSize: 10,
          }}>
            <div style={{ color: s.accent, fontWeight: 600, marginBottom: 4 }}>STREAM</div>
            <div style={{ color: s.text3, lineHeight: 1.5 }}>
              Avg latency: <span style={{ color: s.accent }}>{avgLatency(streamData)}s</span> |
              Each point processed immediately. Low latency, more complex infrastructure.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={start}
            disabled={running}
            style={{
              padding: '8px 28px', background: running ? s.bg3 : s.accent,
              color: running ? s.text3 : '#fff', border: 'none', borderRadius: 6,
              fontSize: 13, fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer',
              fontFamily: s.mono, transition: 'all 0.2s',
            }}
          >
            {done ? 'Replay' : running ? 'Running...' : 'Start'}
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
      </div>
    </DemoBoundary>
  )
}
