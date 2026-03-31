import { useState, useCallback, useEffect, useRef } from 'react'
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

type OpType = 'timer' | 'io' | 'immediate' | 'pool' | 'close'

interface Task {
  id: number
  label: string
  type: OpType
  duration: number
  state: 'waiting' | 'running' | 'done'
  startMs: number
}

const typeColors: Record<OpType, string> = {
  timer: s.accent,
  io: s.green,
  immediate: s.purple,
  pool: s.orange,
  close: s.red,
}

const typeLabels: Record<OpType, string> = {
  timer: 'Timer',
  io: 'I/O',
  immediate: 'Immediate',
  pool: 'Thread Pool',
  close: 'Close',
}

const typeDescriptions: Record<OpType, string> = {
  timer: 'setTimeout / setInterval callbacks',
  io: 'Network sockets (non-blocking, no thread)',
  immediate: 'setImmediate callbacks (check phase)',
  pool: 'fs.readFile, dns.lookup, crypto (thread pool)',
  close: 'Event handler cleanup callbacks',
}

const phaseNames = ['timers', 'pending callbacks', 'poll', 'check', 'close']
const phaseColors = [s.accent, s.purple, s.green, s.yellow, s.red]

const sampleTasks: Array<{ label: string; type: OpType; duration: number }> = [
  { label: 'fs.readFile()', type: 'pool', duration: 2500 },
  { label: 'http.request()', type: 'io', duration: 1800 },
  { label: 'setTimeout 0ms', type: 'timer', duration: 800 },
  { label: 'setImmediate()', type: 'immediate', duration: 300 },
  { label: 'crypto.pbkdf2()', type: 'pool', duration: 3000 },
  { label: 'dns.lookup()', type: 'pool', duration: 1500 },
  { label: 'server.listen()', type: 'io', duration: 2200 },
  { label: 'setTimeout 100ms', type: 'timer', duration: 500 },
]

function LogPanel({ entries }: { entries: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [entries.length])

  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 8,
      overflow: 'hidden',
      marginTop: 16,
    }}>
      <div style={{
        background: s.bg2,
        padding: '8px 12px',
        borderBottom: `1px solid ${s.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.red }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.yellow }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.green }} />
        </div>
        <span style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>event loop</span>
      </div>
      <div ref={ref} style={{
        padding: 12,
        height: 160,
        overflowY: 'auto',
        fontFamily: s.mono,
        fontSize: 12,
        lineHeight: 1.7,
        color: s.text2,
      }}>
        {entries.length === 0 && (
          <div style={{ color: s.text3 }}>click "run" to start the event loop</div>
        )}
        {entries.map((e, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: e }} />
        ))}
      </div>
    </div>
  )
}

function ThreadPool({ activeSlots, total }: { activeSlots: number; total: number }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: s.text }}>Thread Pool</span>
        <span style={{ fontSize: 11, color: s.text3 }}>{activeSlots}/{total} active</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            flex: 1,
            height: 24,
            borderRadius: 4,
            background: i < activeSlots
              ? `linear-gradient(135deg, ${s.orange}, #b06830)`
              : s.bg2,
            border: `1px solid ${i < activeSlots ? s.orange : s.border}`,
            transition: 'all 0.3s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: s.text3, marginTop: 6 }}>
        default pool size: {total} (UV_THREADPOOL_SIZE)
      </div>
    </div>
  )
}

function EventLoopViz({ currentPhase, tick }: { currentPhase: number; tick: number }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: s.text, marginBottom: 8 }}>Event Loop Phases</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {phaseNames.map((name, i) => (
          <div key={name} style={{
            flex: 1,
            padding: '8px 4px',
            borderRadius: 6,
            textAlign: 'center',
            fontSize: 10,
            fontFamily: s.mono,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
            background: i === currentPhase
              ? `linear-gradient(135deg, ${phaseColors[i]}33, ${phaseColors[i]}11)`
              : s.bg2,
            border: `1px solid ${i === currentPhase ? phaseColors[i] : s.border}`,
            color: i === currentPhase ? phaseColors[i] : s.text3,
            transition: 'all 0.3s',
          }}>
            {name}
            {i === currentPhase && tick > 0 && (
              <div style={{
                marginTop: 4,
                height: 3,
                borderRadius: 2,
                background: phaseColors[i],
                animation: 'none',
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskCard({ task, onRemove }: { task: Task; onRemove: (id: number) => void }) {
  const color = typeColors[task.type]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 12px',
      borderRadius: 6,
      background: task.state === 'running'
        ? `${color}11`
        : task.state === 'done'
          ? `${s.green}08`
          : s.bg2,
      border: `1px solid ${task.state === 'running' ? color : task.state === 'done' ? s.green + '44' : s.border}`,
      transition: 'all 0.3s',
      opacity: task.state === 'done' ? 0.5 : 1,
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: task.state === 'running'
          ? color
          : task.state === 'done'
            ? s.green
            : s.text3,
        boxShadow: task.state === 'running' ? `0 0 8px ${color}66` : 'none',
        transition: 'all 0.3s',
      }} />
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 13,
          fontFamily: s.mono,
          color: task.state === 'done' ? s.green : s.text,
          textDecoration: task.state === 'done' ? 'line-through' : 'none',
        }}>
          {task.label}
        </div>
        <div style={{
          fontSize: 10,
          color: s.text3,
          marginTop: 2,
          display: 'flex',
          gap: 8,
        }}>
          <span style={{ color }}>{typeLabels[task.type]}</span>
          <span>{task.duration}ms</span>
          {task.state === 'running' && <span style={{ color }}>running...</span>}
          {task.state === 'done' && <span style={{ color: s.green }}>done</span>}
        </div>
      </div>
      {task.state === 'waiting' && (
        <button
          onClick={() => onRemove(task.id)}
          style={{
            background: 'none',
            border: `1px solid ${s.border}`,
            color: s.text3,
            fontSize: 14,
            cursor: 'pointer',
            width: 24,
            height: 24,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          x
        </button>
      )}
    </div>
  )
}

export default function LibuvDemo() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [poolSize] = useState(4)
  const [running, setRunning] = useState(false)
  const [currentPhase, setCurrentPhase] = useState(-1)
  const [logs, setLogs] = useState<string[]>([])
  const [tick, setTick] = useState(0)
  const nextId = useRef(0)
  const animRef = useRef<number>(0)

  const addSample = useCallback((sample: typeof sampleTasks[number]) => {
    if (running) return
    setTasks(prev => [...prev, {
      id: nextId.current++,
      label: sample.label,
      type: sample.type,
      duration: sample.duration,
      state: 'waiting',
      startMs: 0,
    }])
  }, [running])

  const removeTask = useCallback((id: number) => {
    if (running) return
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [running])

  const reset = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    setTasks([])
    setRunning(false)
    setCurrentPhase(-1)
    setLogs([])
    setTick(0)
  }, [])

  const log = useCallback((msg: string, color?: string) => {
    const ts = `<span style="color:${s.text3}">[${new Date().toISOString().slice(11, 23)}]</span>`
    setLogs(prev => [...prev, `${ts} ${color ? `<span style="color:${color}">${msg}</span>` : msg}`])
  }, [])

  const run = useCallback(() => {
    if (tasks.length === 0) return
    if (running) return

    const runnable = tasks.filter(t => t.state === 'waiting')
    if (runnable.length === 0) {
      setTasks(prev => prev.map(t => t.state === 'done' ? { ...t, state: 'waiting' } : t))
      return
    }

    setRunning(true)
    setLogs([])
    setTick(0)
    const startTime = performance.now()

    const taskStates = new Map<number, 'waiting' | 'running' | 'done'>()
    runnable.forEach(t => taskStates.set(t.id, 'waiting'))

    log('event loop started', s.accent)
    log(`${runnable.length} tasks queued`, s.text2)

    const poolTasks = runnable.filter(t => t.type === 'pool')
    const otherTasks = runnable.filter(t => t.type !== 'pool')

    function frame() {
      const elapsed = performance.now() - startTime

      let activePool = 0
      let allDone = true

      runnable.forEach(task => {
        const state = taskStates.get(task.id)!

        if (state === 'waiting') {
          if (task.type === 'pool' && activePool < poolSize) {
            taskStates.set(task.id, 'running')
            task.startMs = elapsed
            activePool++
            log(`${task.label} dispatched to thread pool`, s.orange)
          } else if (task.type !== 'pool') {
            taskStates.set(task.id, 'running')
            task.startMs = elapsed
            log(`${task.label} started (${typeLabels[task.type]} phase)`, typeColors[task.type])
          } else {
            allDone = false
          }
        }

        if (taskStates.get(task.id) === 'running') {
          const runTime = elapsed - task.startMs
          if (runTime >= task.duration) {
            taskStates.set(task.id, 'done')
            log(`${task.label} completed in ${task.duration}ms`, s.green)
          } else {
            allDone = false
            if (task.type === 'pool') activePool++
          }
        }
      })

      if (otherTasks.some(t => taskStates.get(t.id) === 'running')) {
        activePool = poolTasks.filter(t => {
          const st = taskStates.get(t.id)
          return st === 'running'
        }).length
      }

      const phase = elapsed < 800 ? 0
        : elapsed < 1500 ? 1
          : elapsed < 3000 ? 2
            : elapsed < 3800 ? 3
              : 4
      setCurrentPhase(phase)
      setTick(prev => prev + 1)

      setTasks(prev => prev.map(t => {
        const st = taskStates.get(t.id)
        return st ? { ...t, state: st } : t
      }))

      if (!allDone) {
        animRef.current = requestAnimationFrame(frame)
      } else {
        log('event loop idle - all tasks complete', s.accent)
        setRunning(false)
        setCurrentPhase(-1)
      }
    }

    animRef.current = requestAnimationFrame(frame)
  }, [tasks, running, poolSize, log])

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  const activePool = tasks.filter(t => t.type === 'pool' && t.state === 'running').length

  return (
    <DemoBoundary name="Libuv Event Loop">
    <div style={{
      maxWidth: 820,
      margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: s.text }}>Event Loop Playground</div>
          <div style={{ fontSize: 12, color: s.text3, marginTop: 2 }}>
            Add tasks, run the loop, watch how libuv schedules them
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={reset}
            disabled={running}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: `1px solid ${s.border}`,
              background: s.bg2,
              color: s.text3,
              fontSize: 12,
              fontWeight: 600,
              cursor: running ? 'not-allowed' : 'pointer',
              opacity: running ? 0.5 : 1,
            }}
          >
            reset
          </button>
          <button
            onClick={run}
            disabled={running || tasks.length === 0}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: running
                ? s.text3
                : `linear-gradient(135deg, ${s.accent}, #3a6ab5)`,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: running || tasks.length === 0 ? 'not-allowed' : 'pointer',
              opacity: running || tasks.length === 0 ? 0.6 : 1,
            }}
          >
            {running ? 'running...' : 'run'}
          </button>
        </div>
      </div>

      <EventLoopViz currentPhase={currentPhase} tick={tick} />
      <ThreadPool activeSlots={activePool} total={poolSize} />

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: s.text, marginBottom: 8 }}>Add Tasks</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {sampleTasks.map((sample) => {
            const color = typeColors[sample.type]
            return (
              <button
                key={sample.label}
                onClick={() => addSample(sample)}
                disabled={running}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: `1px solid ${color}33`,
                  background: `${color}0a`,
                  color,
                  fontSize: 11,
                  fontFamily: s.mono,
                  cursor: running ? 'not-allowed' : 'pointer',
                  opacity: running ? 0.4 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {sample.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {(Object.entries(typeLabels) as [OpType, string][]).map(([type, label]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: typeColors[type] }} />
              <span style={{ fontSize: 10, color: s.text3 }}>{label}</span>
              <span style={{ fontSize: 10, color: s.text3 }}>- {typeDescriptions[type]}</span>
            </div>
          ))}
        </div>
      </div>

      {tasks.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: s.text, marginBottom: 8 }}>
            Task Queue ({tasks.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onRemove={removeTask} />
            ))}
          </div>
        </div>
      )}

      <LogPanel entries={logs} />

      <div style={{
        marginTop: 16,
        padding: 16,
        background: s.bg2,
        borderRadius: 8,
        border: `1px solid ${s.border}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: s.text, marginBottom: 8 }}>How to Read This</div>
        <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.8 }}>
          <strong style={{ color: s.orange }}>Thread pool tasks</strong> (fs, dns, crypto) are limited to 4 concurrent workers.
          If you queue more than 4, they wait in a backlog.{' '}
          <strong style={{ color: s.green }}>I/O tasks</strong> (network) use non-blocking OS sockets and never touch the thread pool.{' '}
          <strong style={{ color: s.accent }}>Timers</strong> fire in the first event loop phase.{' '}
          <strong style={{ color: s.purple }}>setImmediate</strong> fires in the check phase, after I/O polling.
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
