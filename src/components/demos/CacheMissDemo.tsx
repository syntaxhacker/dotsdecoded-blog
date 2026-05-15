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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

const GRID_SIZE = 64
const ROWS = 8
const COLS = 8
const LINE_SIZE = 4
const CACHE_LINES = GRID_SIZE / LINE_SIZE
const CACHE_CAPACITY = 8

const strideOpts = [1, 2, 4, 8, 16, 32, 64]
const sizeLabels = ['Small', 'Medium', 'Large'] as const
const sizeAccesses = [24, 40, 64]

interface CellState {
  accessed: boolean
  cached: boolean
  flashMiss: boolean
  flashHit: boolean
}

export default function CacheMissDemo() {
  const [strideIdx, setStrideIdx] = useState(0)
  const [sizeIdx, setSizeIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [cells, setCells] = useState<CellState[]>(() =>
    Array.from({ length: GRID_SIZE }, () => ({ accessed: false, cached: false, flashMiss: false, flashHit: false }))
  )
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [done, setDone] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [currentCell, setCurrentCell] = useState<number | null>(null)

  const stride = strideOpts[strideIdx]
  const totalAccesses = sizeAccesses[sizeIdx]

  const cacheRef = useRef<number[]>([])
  const stepRef = useRef(0)
  const hitsRef = useRef(0)
  const missesRef = useRef(0)
  const cellsRef = useRef<CellState[]>(cells)
  const runningRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const initState = useCallback(() => {
    const fresh: CellState[] = Array.from({ length: GRID_SIZE }, () => ({ accessed: false, cached: false, flashMiss: false, flashHit: false }))
    setCells(fresh)
    cellsRef.current = fresh
    cacheRef.current = []
    stepRef.current = 0
    hitsRef.current = 0
    missesRef.current = 0
    setStep(0)
    setHits(0)
    setMisses(0)
    setDone(false)
    setCurrentCell(null)
  }, [])

  const stopRun = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRunning(false)
    runningRef.current = false
  }, [])

  const stepOnce = useCallback(() => {
    const st = stepRef.current
    if (st >= totalAccesses) {
      stopRun()
      setDone(true)
      return
    }

    const addr = st * stride
    const lineIdx = Math.floor(addr / LINE_SIZE) % CACHE_LINES
    const cellIdx = addr % GRID_SIZE

    const isHit = cacheRef.current.includes(lineIdx)
    const newCells = [...cellsRef.current]

    newCells[cellIdx] = { ...newCells[cellIdx], accessed: true, flashMiss: false, flashHit: false }

    if (isHit) {
      hitsRef.current += 1
      setHits(hitsRef.current)
      newCells[cellIdx] = { ...newCells[cellIdx], flashHit: true }
      const idx = cacheRef.current.indexOf(lineIdx)
      if (idx !== -1) {
        cacheRef.current.splice(idx, 1)
        cacheRef.current.push(lineIdx)
      }
    } else {
      missesRef.current += 1
      setMisses(missesRef.current)
      newCells[cellIdx] = { ...newCells[cellIdx], flashMiss: true }

      if (cacheRef.current.length >= CACHE_CAPACITY) {
        const evictedLine = cacheRef.current.shift()!
        for (let ci = 0; ci < GRID_SIZE; ci++) {
          if (Math.floor(ci / LINE_SIZE) === evictedLine) {
            newCells[ci] = { ...newCells[ci], cached: false }
          }
        }
      }
      cacheRef.current.push(lineIdx)
    }

    for (let ci = 0; ci < GRID_SIZE; ci++) {
      if (cacheRef.current.includes(Math.floor(ci / LINE_SIZE))) {
        newCells[ci] = { ...newCells[ci], cached: true }
      }
    }

    cellsRef.current = newCells
    setCells(newCells)
    setCurrentCell(cellIdx)
    stepRef.current = st + 1
    setStep(stepRef.current)

    if (stepRef.current >= totalAccesses) {
      stopRun()
      setDone(true)
    }
  }, [totalAccesses, stride, stopRun])

  const startRun = useCallback(() => {
    initState()
    setRunning(true)
    runningRef.current = true
  }, [initState])

  useEffect(() => {
    if (!running) {
      setCells(prev => prev.map(c => ({ ...c, flashMiss: false, flashHit: false })))
      return
    }
    const timer = setTimeout(() => {
      setCells(prev => prev.map(c => ({ ...c, flashMiss: false, flashHit: false })))
    }, 250)
    return () => clearTimeout(timer)
  }, [step, running])

  useEffect(() => {
    if (!running) return
    const delay = getStepDelay(300, speed)
    intervalRef.current = setInterval(stepOnce, delay)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running, speed, stepOnce])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const hitRate = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) : '0.0'

  const strideLabel = stride === 1 ? '1 (sequential)' : String(stride)

  return (
    <DemoBoundary name="Cache Miss Pattern">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Cache Miss Patterns</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Accessing memory with different strides changes how often the cache can serve data.
        </p>

        <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>Stride (elements between accesses)</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {strideOpts.map((v, i) => (
                <button
                  key={v}
                  onClick={() => { if (!running) setStrideIdx(i) }}
                  style={{
                    background: strideIdx === i ? s.accent : s.bg3,
                    border: `1px solid ${strideIdx === i ? s.accent : s.border}`,
                    borderRadius: 6,
                    padding: '5px 10px',
                    color: strideIdx === i ? '#fff' : s.text2,
                    cursor: running ? 'default' : 'pointer',
                    fontSize: 12,
                    fontFamily: s.mono,
                    opacity: running ? 0.5 : 1,
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div style={{ minWidth: 120 }}>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>Array Size</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {sizeLabels.map((lbl, i) => (
                <button
                  key={lbl}
                  onClick={() => { if (!running) setSizeIdx(i) }}
                  style={{
                    background: sizeIdx === i ? s.accent : s.bg3,
                    border: `1px solid ${sizeIdx === i ? s.accent : s.border}`,
                    borderRadius: 6,
                    padding: '5px 12px',
                    color: sizeIdx === i ? '#fff' : s.text2,
                    cursor: running ? 'default' : 'pointer',
                    fontSize: 12,
                    opacity: running ? 0.5 : 1,
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: 3,
          marginBottom: 20,
          background: s.bg,
          borderRadius: 10,
          padding: 6,
          border: `1px solid ${s.border}`,
        }}>
          {Array.from({ length: GRID_SIZE }).map((_, i) => {
            const c = cells[i]
            let bg = s.bg3
            if (c.flashMiss) {
              bg = s.red
            } else if (c.cached) {
              bg = s.accent + '55'
            } else if (c.accessed) {
              bg = s.accent + '22'
            }
            const isCurrent = currentCell === i
            return (
              <div
                key={i}
                style={{
                  aspectRatio: '1',
                  borderRadius: 4,
                  background: bg,
                  border: isCurrent ? `2px solid ${s.accent}` : `1px solid ${s.border}`,
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  color: s.text3,
                  fontFamily: s.mono,
                  position: 'relative',
                }}
              />
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 80 }}>
            <div style={{ color: s.green, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{hits}</div>
            <div style={{ color: s.text3, fontSize: 11 }}>Hits</div>
          </div>
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 80 }}>
            <div style={{ color: s.red, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{misses}</div>
            <div style={{ color: s.text3, fontSize: 11 }}>Misses</div>
          </div>
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 80 }}>
            <div style={{ color: s.text, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{hitRate}%</div>
            <div style={{ color: s.text3, fontSize: 11 }}>Hit Rate</div>
          </div>
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 60 }}>
            <div style={{ color: s.text2, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{done ? totalAccesses : Math.min(step, totalAccesses)}</div>
            <div style={{ color: s.text3, fontSize: 11 }}>Accesses</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          {!running && !done ? (
            <button onClick={startRun} style={{
              background: s.accent, border: 'none', borderRadius: 8, padding: '10px 24px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              Run
            </button>
          ) : running ? (
            <button onClick={stopRun} style={{
              background: s.red, border: 'none', borderRadius: 8, padding: '10px 24px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              Stop
            </button>
          ) : (
            <button onClick={startRun} style={{
              background: s.accent, border: 'none', borderRadius: 8, padding: '10px 24px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              Re-run
            </button>
          )}
          <button onClick={() => { stopRun(); initState() }} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>
            Reset
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
          <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>
            stride={strideLabel} accesses={totalAccesses}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Spatial Locality</div>
          <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6 }}>
            {stride === 1
              ? 'Sequential access (stride=1) means consecutive elements fall within the same cache line. After the first element loads the line, subsequent hits are nearly free.'
              : stride >= LINE_SIZE
                ? `Stride=${stride} skips ${stride} elements per access, landing in a new cache line almost every time. The cache cannot keep up, causing near-100% miss rates.`
                : `Stride=${stride} partially reuses cache lines. Some elements land in the same loaded line (hits), others force new line fetches (misses).`
            }
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
