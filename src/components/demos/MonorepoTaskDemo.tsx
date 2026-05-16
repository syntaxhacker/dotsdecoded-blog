import { useState, useCallback, useEffect, useRef } from 'react'
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

interface TaskItem {
  pkg: string
  task: string
}

interface TimelineSlot {
  tasks: TaskItem[]
}

const ALL_TASKS: TaskItem[] = [
  { pkg: 'pkg-a', task: 'lint' },
  { pkg: 'pkg-a', task: 'test' },
  { pkg: 'pkg-a', task: 'build' },
  { pkg: 'pkg-b', task: 'lint' },
  { pkg: 'pkg-b', task: 'test' },
  { pkg: 'pkg-b', task: 'build' },
  { pkg: 'pkg-c', task: 'lint' },
  { pkg: 'pkg-c', task: 'test' },
  { pkg: 'pkg-c', task: 'build' },
]

const SEQUENTIAL_SLOTS: TimelineSlot[] = ALL_TASKS.map(t => ({ tasks: [t] }))

const PARALLEL_SLOTS: TimelineSlot[] = [
  { tasks: [{ pkg: 'pkg-a', task: 'lint' }, { pkg: 'pkg-b', task: 'lint' }, { pkg: 'pkg-c', task: 'lint' }] },
  { tasks: [{ pkg: 'pkg-a', task: 'test' }, { pkg: 'pkg-b', task: 'test' }, { pkg: 'pkg-c', task: 'test' }] },
  { tasks: [{ pkg: 'pkg-a', task: 'build' }, { pkg: 'pkg-c', task: 'build' }] },
  { tasks: [{ pkg: 'pkg-b', task: 'build' }] },
]

const PKG_COLORS: Record<string, string> = {
  'pkg-a': s.accent,
  'pkg-b': s.green,
  'pkg-c': s.orange,
}

const TASK_ORDER = ['lint', 'test', 'build']

function computeRunning(idx: number, slots: TimelineSlot[]): Set<string> {
  const running = new Set<string>()
  for (let i = 0; i <= idx; i++) {
    for (const t of slots[i].tasks) {
      running.add(`${t.pkg}/${t.task}`)
    }
  }
  return running
}

export default function MonorepoTaskDemo() {
  const [mode, setMode] = useState<'sequential' | 'parallel'>('sequential')
  const [step, setStep] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const slots = mode === 'sequential' ? SEQUENTIAL_SLOTS : PARALLEL_SLOTS
  const totalSteps = slots.length

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const stopPlaying = useCallback(() => {
    clearTimer()
    setPlaying(false)
  }, [clearTimer])

  const startPlaying = useCallback(() => {
    setStep(-1)
    setPlaying(true)
  }, [])

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setStep(prev => {
          if (prev >= totalSteps - 1) {
            clearTimer()
            setPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 600)
    }
    return clearTimer
  }, [playing, mode, totalSteps, clearTimer])

  const resetTimeline = () => {
    stopPlaying()
    setStep(-1)
  }

  const running = computeRunning(step, slots)
  const completedCount = running.size

  const barWidth = (idx: number, mode_: string) => {
    if (step < idx) return 0
    if (step === idx) return 100
    return 100
  }

  const formatTaskName = (pkg: string, task: string) => `${pkg} ${task}`

  return (
    <DemoBoundary name="Task Orchestration">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={H}>Task Orchestration</div>
          <div style={{ display: 'flex', gap: 4, background: s.bg3, borderRadius: 8, padding: 3 }}>
            <button onClick={() => { setMode('sequential'); resetTimeline() }} style={{
              background: mode === 'sequential' ? s.bg : 'transparent',
              border: 'none', borderRadius: 6, padding: '6px 14px',
              color: mode === 'sequential' ? s.text : s.text3,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              transition: 'all 0.2s',
            }}>Sequential</button>
            <button onClick={() => { setMode('parallel'); resetTimeline() }} style={{
              background: mode === 'parallel' ? s.bg : 'transparent',
              border: 'none', borderRadius: 6, padding: '6px 14px',
              color: mode === 'parallel' ? s.text : s.text3,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              transition: 'all 0.2s',
            }}>Parallel</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Steps</div>
            <div style={{ color: s.text, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>
              {step >= 0 ? step + 1 : 0}/{totalSteps}
            </div>
          </div>
          <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Tasks Completed</div>
            <div style={{ color: s.text, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>
              {completedCount}/9
            </div>
          </div>
          <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Time Savings</div>
            <div style={{ color: mode === 'parallel' ? s.green : s.text3, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>
              {mode === 'parallel' ? '56%' : '0%'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          <button onClick={startPlaying} disabled={playing} style={{
            background: playing ? s.bg3 : s.accent,
            border: 'none', borderRadius: 8, padding: '8px 24px',
            color: playing ? s.text3 : '#fff',
            cursor: playing ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
          }}>{playing ? 'Running...' : 'Run Build'}</button>
          <button onClick={resetTimeline} style={{
            background: s.bg3, border: `1px solid ${s.border}`,
            borderRadius: 8, padding: '8px 18px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            {[s.accent, s.green, s.orange].map((color, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                <span style={{ color: s.text2, fontSize: 12 }}>{`pkg-${String.fromCharCode(97 + idx)}`}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: s.yellow }} />
              <span style={{ color: s.text2, fontSize: 12 }}>lint</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: `${s.text}44` }} />
              <span style={{ color: s.text2, fontSize: 12 }}>test</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: `${s.text}88` }} />
              <span style={{ color: s.text2, fontSize: 12 }}>build</span>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8, background: s.bg }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${s.border}` }}>
            <div style={{ width: 110, flexShrink: 0, padding: '8px 10px', color: s.text3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Task</div>
            <div style={{ flex: 1, padding: '8px 10px', color: s.text3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Timeline</div>
          </div>
          {ALL_TASKS.map((t, idx) => {
            const taskKey = `${t.pkg}/${t.task}`
            const isRunning = running.has(taskKey)
            const pkgColor = PKG_COLORS[t.pkg]
            const taskShade = t.task === 'lint' ? s.yellow : t.task === 'test' ? `${s.text}44` : `${s.text}88`

            const earliestSlot = mode === 'sequential'
              ? idx
              : slots.findIndex(slot => slot.tasks.some(st => st.pkg === t.pkg && st.task === t.task))

            const fillWidth = step >= 0 && step >= earliestSlot ? 100 : 0

            return (
              <div key={taskKey} style={{
                display: 'flex',
                background: isRunning ? `${pkgColor}08` : 'transparent',
                transition: 'background 0.3s',
              }}>
                <div style={{
                  width: 110, flexShrink: 0, padding: '8px 10px',
                  fontFamily: s.mono, fontSize: 12, color: s.text2,
                  borderBottom: `1px solid ${s.border}`,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: pkgColor, flexShrink: 0 }} />
                  <span style={{ color: pkgColor, fontWeight: 600 }}>{t.pkg}</span>
                  <span style={{ color: s.text3 }}>{t.task}</span>
                </div>
                <div style={{
                  flex: 1, padding: '8px 10px',
                  borderBottom: `1px solid ${s.border}`,
                  display: 'flex', alignItems: 'center',
                }}>
                  <div style={{
                    height: 20, borderRadius: 4,
                    width: `${fillWidth}%`,
                    background: `linear-gradient(90deg, ${pkgColor}, ${taskShade})`,
                    opacity: isRunning ? 1 : 0.3,
                    transition: 'width 0.4s ease, opacity 0.3s',
                    minWidth: fillWidth > 0 ? 8 : 0,
                    display: 'flex', alignItems: 'center', paddingLeft: fillWidth > 20 ? 8 : 0,
                  }}>
                    {fillWidth > 20 && (
                      <span style={{ color: '#fff', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {mode === 'sequential' ? `t=${earliestSlot + 1}` : `t=${earliestSlot + 1}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 20, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            How It Works
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.5 }}>
              {mode === 'sequential'
                ? 'Tasks run one at a time in topological order. pkg-b and pkg-c wait for pkg-a build to finish since they depend on it. Total: 9 time units.'
                : 'Independent tasks run concurrently. All lint tasks start together, then all tests, then pkg-a and pkg-c build in parallel while pkg-b waits for pkg-a. Total: 4 time units.'}
            </div>
            <div style={{ color: s.text3, fontSize: 12 }}>
              {mode === 'sequential'
                ? 'Sequential execution is simple but wasteful -- CPU cores sit idle while tasks block unnecessarily.'
                : 'Parallel execution maximizes resource utilization. Turborepo and Nx automatically compute the optimal task graph.'}
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
