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

const TASK_COLORS = ['#5b8def', '#3dd68c', '#e0b040', '#e85d5d', '#9b7bea', '#e8945a', '#f92672', '#a6e22e']
const PROCESS_TICKS = 4

interface TaskItem {
  id: number
  color: string
}

export default function CoreThreadDemo() {
  const [numCores, setNumCores] = useState(2)
  const [threadsPerCore, setThreadsPerCore] = useState(1)
  const [speed, setSpeed] = useState(1)
  const totalLP = numCores * threadsPerCore

  const queueRef = useRef<TaskItem[]>([])
  const procRef = useRef<(TaskItem | null)[]>(Array(totalLP).fill(null))
  const progressRef = useRef<number[]>(Array(totalLP).fill(0))
  const nextIdRef = useRef(0)
  const runningRef = useRef(0)
  const completedRef = useRef(0)

  const [queueLen, setQueueLen] = useState(0)
  const [processors, setProcessors] = useState<(TaskItem | null)[]>(Array(totalLP).fill(null))
  const [completed, setCompleted] = useState(0)
  const [running, setRunning] = useState(0)
  const [tickCounter, setTickCounter] = useState(0)

  useEffect(() => {
    const len = numCores * threadsPerCore
    queueRef.current = []
    procRef.current = Array(len).fill(null)
    progressRef.current = Array(len).fill(0)
    runningRef.current = 0
    completedRef.current = 0
    setQueueLen(0)
    setProcessors(Array(len).fill(null))
    setCompleted(0)
    setRunning(0)
    nextIdRef.current = 0
  }, [numCores, threadsPerCore])

  const tick = () => {
    const len = numCores * threadsPerCore
    let newRunning = 0
    let newCompleted = completedRef.current

    for (let i = 0; i < len; i++) {
      if (procRef.current[i] !== null) {
        progressRef.current[i]--
        if (progressRef.current[i] <= 0) {
          procRef.current[i] = null
          newCompleted++
        } else {
          newRunning++
        }
      }
    }

    for (let i = 0; i < len; i++) {
      if (procRef.current[i] === null && queueRef.current.length > 0) {
        const task = queueRef.current.shift()!
        procRef.current[i] = task
        progressRef.current[i] = PROCESS_TICKS
        newRunning++
      }
    }

    runningRef.current = newRunning
    completedRef.current = newCompleted

    setQueueLen(queueRef.current.length)
    setProcessors([...procRef.current])
    setCompleted(newCompleted)
    setRunning(newRunning)
  }

  const tickRef = useRef(tick)
  tickRef.current = tick

  useEffect(() => {
    if (queueLen === 0 && running === 0) return
    const delay = getStepDelay(800, speed)
    const timer = setTimeout(() => {
      tickRef.current()
      setTickCounter(prev => prev + 1)
    }, delay)
    return () => clearTimeout(timer)
  }, [speed, tickCounter, queueLen, running])

  const generateTasks = () => {
    for (let i = 0; i < 3; i++) {
      const id = nextIdRef.current++
      const color = TASK_COLORS[id % TASK_COLORS.length]
      queueRef.current.push({ id, color })
    }
    tickRef.current()
    setTickCounter(prev => prev + 1)
  }

  const busyCount = processors.filter(p => p !== null).length
  const utilPct = totalLP > 0 ? (busyCount / totalLP) * 100 : 0

  return (
    <DemoBoundary name="Cores vs Threads">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 24, letterSpacing: -0.3 }}>Cores vs Threads</div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>Physical Cores</label>
          <input type="range" min={1} max={8} value={numCores} onChange={e => setNumCores(Number(e.target.value))} style={{ width: '100%', accentColor: s.accent }} />
          <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{numCores}</span>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>Threads per Core</label>
          <input type="range" min={1} max={2} value={threadsPerCore} onChange={e => setThreadsPerCore(Number(e.target.value))} style={{ width: '100%', accentColor: s.green }} />
          <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{threadsPerCore}x</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: 1 }}>
          <div style={{ color: s.green, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>{running}</div>
          <div style={{ color: s.text3, fontSize: 11 }}>Running</div>
        </div>
        <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: 1 }}>
          <div style={{ color: s.yellow, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>{queueLen}</div>
          <div style={{ color: s.text3, fontSize: 11 }}>Queued</div>
        </div>
        <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center', flex: 1 }}>
          <div style={{ color: s.accent, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>{completed}</div>
          <div style={{ color: s.text3, fontSize: 11 }}>Completed</div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: s.text3, fontSize: 11 }}>Utilization</span>
          <span style={{ color: s.text, fontFamily: s.mono, fontSize: 11 }}>{Math.round(utilPct)}%</span>
        </div>
        <div style={{ background: s.bg3, borderRadius: 6, height: 12, overflow: 'hidden' }}>
          <div style={{
            width: `${utilPct}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${s.accent}, ${s.green})`,
            borderRadius: 6,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {Array.from({ length: numCores }).map((_, coreIdx) => (
          <div key={coreIdx} style={{
            flex: `1 1 ${numCores <= 4 ? '180px' : '140px'}`,
            minWidth: numCores <= 4 ? 160 : 120,
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 10,
            padding: 10,
          }}>
            <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 10, marginBottom: 8 }}>Core {coreIdx + 1}</div>
            {Array.from({ length: threadsPerCore }).map((_, threadIdx) => {
              const lpIdx = coreIdx * threadsPerCore + threadIdx
              const task = processors[lpIdx]
              return (
                <div key={threadIdx} style={{
                  background: task ? `${task.color}22` : s.bg3,
                  border: `1px solid ${task ? task.color : s.border}`,
                  borderRadius: 6,
                  padding: '8px 10px',
                  marginBottom: threadIdx < threadsPerCore - 1 ? 6 : 0,
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 36,
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: task ? task.color : s.text3,
                    flexShrink: 0,
                  }} />
                  <span style={{ color: task ? s.text : s.text3, fontSize: 11, fontFamily: s.mono }}>
                    {threadsPerCore > 1 ? `T${threadIdx} ` : ''}{task ? `T${task.id}` : 'idle'}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {queueLen > 0 && (
        <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
          <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 10, marginBottom: 8 }}>QUEUE ({queueLen})</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {queueRef.current.map(task => (
              <div key={task.id} style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: task.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#fff',
                fontWeight: 700,
                fontFamily: s.mono,
              }}>
                {task.id}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={generateTasks}
          style={{
            background: s.accent,
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.15s',
          }}
        >
          Generate Tasks
        </button>
        <SpeedController speed={speed} onSpeedChange={setSpeed} />
        <div style={{ marginLeft: 'auto', color: s.text3, fontFamily: s.mono, fontSize: 11 }}>
          {totalLP} logical processor{totalLP !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ marginTop: 20, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>How It Works</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'Cores', desc: `${numCores} physical core${numCores > 1 ? 's' : ''}`, color: s.accent },
            { label: 'SMT', desc: threadsPerCore > 1 ? 'Hyper-Threading splits each core into 2 logical processors' : 'Hyper-Threading disabled -- 1 thread per core', color: s.green },
            { label: 'Tasks', desc: 'Colored blocks are queued and dispatched to idle logical processors', color: s.yellow },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 40 }}>{item.label}</span>
              <span style={{ color: s.text2, fontSize: 12 }}>{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
