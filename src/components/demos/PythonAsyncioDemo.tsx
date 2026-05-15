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

interface Task {
  id: number
  name: string
  color: string
  type: 'io' | 'cpu'
  totalSteps: number
}

const tasks: Task[] = [
  { id: 0, name: 'fetch(url_a)', color: s.accent, type: 'io', totalSteps: 100 },
  { id: 1, name: 'fetch(url_b)', color: s.green, type: 'io', totalSteps: 80 },
  { id: 2, name: 'compute()', color: s.purple, type: 'cpu', totalSteps: 60 },
  { id: 3, name: 'read_file()', color: s.orange, type: 'io', totalSteps: 90 },
]

export default function PythonAsyncioDemo() {
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [progress, setProgress] = useState<number[]>([0, 0, 0, 0])
  const [status, setStatus] = useState<string[]>(['pending', 'pending', 'pending', 'pending'])
  const [currentTask, setCurrentTask] = useState(-1)
  const [log, setLog] = useState<string[]>([])
  const [loopTick, setLoopTick] = useState(0)
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([])

  const progressRef = useRef([0, 0, 0, 0])
  const statusRef = useRef(['pending', 'pending', 'pending', 'pending'])
  const currentRef = useRef(-1)
  const runningRef = useRef(false)
  const tickRef = useRef(0)

  const addLog = useCallback((msg: string) => {
    setLog(prev => [...prev.slice(-14), msg])
  }, [])

  const resetState = () => {
    intervalsRef.current.forEach(clearInterval)
    intervalsRef.current = []
    setRunning(false)
    runningRef.current = false
    setProgress([0, 0, 0, 0])
    setStatus(['pending', 'pending', 'pending', 'pending'])
    setCurrentTask(-1)
    setLog([])
    setLoopTick(0)
    progressRef.current = [0, 0, 0, 0]
    statusRef.current = ['pending', 'pending', 'pending', 'pending']
    currentRef.current = -1
    tickRef.current = 0
  }

  useEffect(() => {
    if (!running) {
      intervalsRef.current.forEach(clearInterval)
      intervalsRef.current = []
      return
    }

    runningRef.current = true
    const ti = tickRef.current
    addLog('Event loop started')
    addLog('Scheduling 4 tasks')

    const baseDelay = 100

    const interval = setInterval(() => {
      if (!runningRef.current) { clearInterval(interval); return }

      tickRef.current += 1
      setLoopTick(tickRef.current)

      const taskIndex = (tickRef.current - 1) % tasks.length
      const task = tasks[taskIndex]

      if (progressRef.current[taskIndex] >= tasks[taskIndex].totalSteps) {
        if (statusRef.current[taskIndex] !== 'done') {
          statusRef.current[taskIndex] = 'done'
          setStatus([...statusRef.current])
          addLog(`Task ${task.name} completed`)
        }
        currentRef.current = -1
        setCurrentTask(-1)
        return
      }

      currentRef.current = taskIndex
      setCurrentTask(taskIndex)

      const isIo = task.type === 'io'
      const stepSize = isIo ? 3 : 2

      if (isIo && Math.random() < 0.35) {
        addLog(`Task ${task.name} awaiting I/O -- yielding control`)
        statusRef.current[taskIndex] = 'awaiting'
        setStatus([...statusRef.current])
        currentRef.current = -1
        setCurrentTask(-1)
        setProgress(prev => [...prev])
        return
      }

      statusRef.current[taskIndex] = 'running'
      setStatus([...statusRef.current])
      addLog(`Task ${task.name} running`)

      const newProgress = Math.min(progressRef.current[taskIndex] + stepSize, tasks[taskIndex].totalSteps)
      progressRef.current[taskIndex] = newProgress
      setProgress([...progressRef.current])

      if (newProgress >= tasks[taskIndex].totalSteps) {
        statusRef.current[taskIndex] = 'done'
        setStatus([...statusRef.current])
        addLog(`Task ${task.name} completed`)
        const allDone = tasks.every((t, i) => progressRef.current[i] >= t.totalSteps)
        if (allDone) {
          addLog('All tasks completed -- event loop exiting')
          setRunning(false)
          runningRef.current = false
          clearInterval(interval)
        }
      }

      currentRef.current = -1
      setCurrentTask(-1)
    }, getStepDelay(baseDelay, speed))

    intervalsRef.current = [interval]

    return () => {
      clearInterval(interval)
    }
  }, [running, speed, addLog])

  useEffect(() => {
    if (running) {
      const baseDelay = 100
      intervalsRef.current.forEach(clearInterval)
      intervalsRef.current = []

      const interval = setInterval(() => {
        if (!runningRef.current) { clearInterval(interval); return }
        tickRef.current += 1
        setLoopTick(tickRef.current)
        const taskIndex = (tickRef.current - 1) % tasks.length
        const task = tasks[taskIndex]

        if (progressRef.current[taskIndex] >= tasks[taskIndex].totalSteps) {
          if (statusRef.current[taskIndex] !== 'done') {
            statusRef.current[taskIndex] = 'done'
            setStatus([...statusRef.current])
            addLog(`Task ${task.name} completed`)
          }
          currentRef.current = -1
          setCurrentTask(-1)
          return
        }

        currentRef.current = taskIndex
        setCurrentTask(taskIndex)

        const isIo = task.type === 'io'
        const stepSize = isIo ? 3 : 2

        if (isIo && Math.random() < 0.35) {
          addLog(`Task ${task.name} awaiting I/O -- yielding control`)
          statusRef.current[taskIndex] = 'awaiting'
          setStatus([...statusRef.current])
          currentRef.current = -1
          setCurrentTask(-1)
          return
        }

        statusRef.current[taskIndex] = 'running'
        setStatus([...statusRef.current])
        addLog(`Task ${task.name} running`)
        const newProgress = Math.min(progressRef.current[taskIndex] + stepSize, tasks[taskIndex].totalSteps)
        progressRef.current[taskIndex] = newProgress
        setProgress([...progressRef.current])

        if (newProgress >= tasks[taskIndex].totalSteps) {
          statusRef.current[taskIndex] = 'done'
          setStatus([...statusRef.current])
          addLog(`Task ${task.name} completed`)
          const allDone = tasks.every((t, i) => progressRef.current[i] >= t.totalSteps)
          if (allDone) {
            addLog('All tasks completed -- event loop exiting')
            setRunning(false)
            runningRef.current = false
            clearInterval(interval)
          }
        }
        currentRef.current = -1
        setCurrentTask(-1)
      }, getStepDelay(baseDelay, speed))
      intervalsRef.current = [interval]
    }
  }, [speed, running, addLog])

  const toggleRun = () => {
    if (!running) {
      const anyIncomplete = tasks.some((t, i) => progressRef.current[i] < t.totalSteps)
      if (!anyIncomplete) {
        progressRef.current = [0, 0, 0, 0]
        setProgress([0, 0, 0, 0])
        statusRef.current = ['pending', 'pending', 'pending', 'pending']
        setStatus(['pending', 'pending', 'pending', 'pending'])
        tickRef.current = 0
        setLoopTick(0)
        setLog([])
      }
      setRunning(true)
    } else {
      setRunning(false)
      addLog('Event loop paused')
    }
  }

  const runningTextColor: React.CSSProperties = { color: s.green }
  const awaitingTextColor: React.CSSProperties = { color: s.yellow }
  const doneTextColor: React.CSSProperties = { color: s.text3 }
  const pendingTextColor: React.CSSProperties = { color: s.text3 }

  return (
    <DemoBoundary name="Asyncio Event Loop">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>Asyncio Event Loop</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <button onClick={toggleRun} style={{
          background: running ? s.red : s.green, border: 'none', borderRadius: 8, padding: '8px 20px',
          color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>{running ? 'Pause' : 'Start'}</button>
        <button onClick={resetState} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 20px',
          color: s.text2, cursor: 'pointer', fontSize: 13,
        }}>Reset</button>
        <SpeedController speed={speed} onSpeedChange={setSpeed} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {tasks.map((task, i) => {
          const pct = Math.min(100, Math.round((progress[i] / task.totalSteps) * 100))
          const st = status[i]

          let statusColor = s.text3
          if (st === 'running' && currentTask === i) statusColor = task.color
          else if (st === 'awaiting') statusColor = s.yellow
          else if (st === 'done') statusColor = s.green

          let statusLabel = st
          if (st === 'running' && currentTask === i) statusLabel = 'RUNNING'
          if (st === 'running' && currentTask !== i) statusLabel = 'runnable'

          return (
            <div key={task.id} style={{
              background: s.bg2, borderRadius: 12, padding: 16,
              border: `1px solid ${currentTask === i ? task.color : s.border}`,
              transition: 'all 0.2s', opacity: st === 'done' ? 0.6 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: task.color, fontFamily: s.mono, fontSize: 13, fontWeight: 700 }}>{task.name}</span>
                <span style={{ color: statusColor, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{statusLabel}</span>
              </div>
              <div style={{ background: s.bg, borderRadius: 6, height: 10, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: task.color, borderRadius: 6, transition: 'width 0.15s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ color: s.text3, fontSize: 10 }}>{task.type === 'io' ? 'I/O-bound' : 'CPU-bound'}</span>
                <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 20, marginBottom: 8 }}>
          <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>Loop tick: {loopTick}</div>
          <div style={{ color: s.text3, fontSize: 11 }}>Tasks cooperate by yielding at <span style={{ fontFamily: s.mono, color: s.yellow }}>await</span> points</div>
        </div>
        <div style={{ height: 16, background: s.bg, borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
          {tasks.map((task, i) => {
            const pct = Math.min(100, Math.round((progress[i] / task.totalSteps) * 100))
            return (
              <div key={i} style={{
                position: 'absolute', left: `${pct}%`, top: 0, width: 12, height: 16,
                background: task.color, borderRadius: 3, transition: 'left 0.15s', opacity: 0.7,
              }} title={task.name} />
            )
          })}
        </div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: 12 }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Event Loop Log</div>
        <div style={{ maxHeight: 140, overflowY: 'auto', background: s.bg, borderRadius: 8, padding: 8 }}>
          {log.map((msg, i) => (
            <div key={i} style={{ color: s.text3, fontFamily: s.mono, fontSize: 10, lineHeight: 1.6 }}>{msg}</div>
          ))}
          {log.length === 0 && <div style={{ color: s.text3, fontSize: 11, fontStyle: 'italic' }}>Press Start to run event loop</div>}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
