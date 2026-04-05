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

type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'retrying'
type JobType = 'email' | 'image' | 'report'

interface Job {
  id: number
  type: JobType
  label: string
  status: JobStatus
  retries: number
  workerId: number | null
  createdAt: number
}

const JOB_LABELS: Record<JobType, string> = {
  email: 'Send welcome email',
  image: 'Process avatar image',
  report: 'Generate analytics report',
}

const JOB_COLORS: Record<JobType, string> = {
  email: s.accent,
  image: s.purple,
  report: s.orange,
}

const JOB_PROCESS_TIME: Record<JobType, number> = {
  email: 800,
  image: 1500,
  report: 2000,
}

const JOB_FAIL_CHANCE: Record<JobType, number> = {
  email: 0.1,
  image: 0.3,
  report: 0.2,
}

let jobIdCounter = 0

export default function BackgroundJobDemo() {
  const [syncMode, setSyncMode] = useState(false)
  const [queue, setQueue] = useState<Job[]>([])
  const [completed, setCompleted] = useState<Job[]>([])
  const [logs, setLogs] = useState<{ text: string; color: string }[]>([])
  const [speed, setSpeed] = useState(1)
  const [autoProcessing, setAutoProcessing] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const addLog = useCallback((text: string, color: string) => {
    setLogs(prev => [...prev.slice(-30), { text, color }])
  }, [])

  const enqueueJob = useCallback((type: JobType) => {
    jobIdCounter++
    const job: Job = {
      id: jobIdCounter,
      type,
      label: JOB_LABELS[type],
      status: 'queued',
      retries: 0,
      workerId: null,
      createdAt: Date.now(),
    }
    setQueue(prev => [...prev, job])
    addLog(`Enqueued: ${job.label} (job #${job.id})`, s.text2)

    if (syncMode) {
      const fail = Math.random() < JOB_FAIL_CHANCE[type]
      if (fail) {
        addLog(`FAILED: ${job.label} — request blocked!`, s.red)
        setQueue(prev => prev.filter(j => j.id !== job.id))
      } else {
        addLog(`Completed: ${job.label} (sync)`, s.green)
        setQueue(prev => prev.filter(j => j.id !== job.id))
        setCompleted(prev => [...prev, { ...job, status: 'completed' }])
      }
    }
  }, [syncMode, addLog])

  const processNext = useCallback(() => {
    setQueue(prev => {
      const queuedJobs = prev.filter(j => j.status === 'queued')
      if (queuedJobs.length === 0) return prev

      const job = queuedJobs[0]
      const workerId = Math.floor(Math.random() * 3) + 1
      const fail = Math.random() < JOB_FAIL_CHANCE[job.type]

      addLog(`Worker ${workerId} picked up: ${job.label}`, s.accent)

      if (fail) {
        const newRetries = job.retries + 1
        if (newRetries >= 3) {
          addLog(`FAILED: ${job.label} after 3 retries — moved to dead queue`, s.red)
          return [...prev.filter(j => j.id !== job.id)]
        }
        addLog(`FAILED: ${job.label} — retry ${newRetries}/3`, s.yellow)
        return prev.map(j => j.id === job.id ? { ...j, status: 'retrying' as JobStatus, retries: newRetries, workerId } : j)
      }

      addLog(`Completed: ${job.label}`, s.green)
      setCompleted(prev => [...prev.slice(-10), { ...job, status: 'completed' as JobStatus, workerId }])
      return prev.filter(j => j.id !== job.id)
    })
  }, [addLog])

  useEffect(() => {
    if (autoProcessing && !syncMode) {
      intervalRef.current = setInterval(() => {
        processNext()
      }, getStepDelay(600, speed))
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoProcessing, syncMode, speed, processNext])

  const retryingJobs = queue.filter(j => j.status === 'retrying')
  useEffect(() => {
    if (retryingJobs.length > 0 && !syncMode) {
      const timer = setTimeout(() => {
        setQueue(prev => prev.map(j =>
          j.status === 'retrying' ? { ...j, status: 'queued' as JobStatus } : j
        ))
      }, getStepDelay(400, speed))
      return () => clearTimeout(timer)
    }
  }, [retryingJobs.length, syncMode, speed])

  return (
    <DemoBoundary name="Background Jobs">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: 'hidden' }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${s.border}`, flexWrap: 'wrap' }}>
            {(['email', 'image', 'report'] as JobType[]).map(jt => (
              <button
                key={jt}
                onClick={() => enqueueJob(jt)}
                style={{
                  padding: '6px 14px',
                  fontSize: 13,
                  fontFamily: s.mono,
                  border: `1px solid ${JOB_COLORS[jt]}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)',
                  color: JOB_COLORS[jt],
                  transition: 'all 0.2s',
                }}
              >
                + {JOB_LABELS[jt]}
              </button>
            ))}

            <div style={{ display: 'flex', background: s.bg, borderRadius: 6, border: `1px solid ${s.border}`, marginLeft: 8 }}>
              <button
                onClick={() => setSyncMode(false)}
                style={{
                  padding: '5px 12px', fontSize: 12, fontFamily: s.mono, border: 'none', borderRadius: 5,
                  cursor: 'pointer', background: !syncMode ? s.green : 'transparent',
                  color: !syncMode ? '#000' : s.text3, transition: 'all 0.2s',
                }}
              >
                Async
              </button>
              <button
                onClick={() => setSyncMode(true)}
                style={{
                  padding: '5px 12px', fontSize: 12, fontFamily: s.mono, border: 'none', borderRadius: 5,
                  cursor: 'pointer', background: syncMode ? s.red : 'transparent',
                  color: syncMode ? '#fff' : s.text3, transition: 'all 0.2s',
                }}
              >
                Sync
              </button>
            </div>

            {!syncMode && (
              <button
                onClick={() => setAutoProcessing(!autoProcessing)}
                style={{
                  padding: '5px 12px', fontSize: 12, fontFamily: s.mono,
                  border: `1px solid ${autoProcessing ? s.green : s.border}`, borderRadius: 5,
                  cursor: 'pointer',
                  background: autoProcessing ? 'rgba(61,214,140,0.15)' : 'transparent',
                  color: autoProcessing ? s.green : s.text3, transition: 'all 0.2s',
                }}
              >
                {autoProcessing ? 'Pause Workers' : 'Start Workers'}
              </button>
            )}

            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>

          <div style={{ padding: '8px 16px', borderBottom: `1px solid ${s.border}`, fontSize: 12, fontFamily: s.mono, color: s.text3 }}>
            {syncMode
              ? 'SYNC MODE: Each job blocks the request until it finishes (or fails)'
              : autoProcessing
              ? 'ASYNC MODE: Background workers are processing the queue'
              : 'ASYNC MODE: Jobs are queued. Click "Start Workers" to process them.'
            }
          </div>

          <div style={{ display: 'flex', minHeight: 220 }}>
            <div style={{ flex: 1, padding: 16, borderRight: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>
                QUEUE ({queue.length})
              </div>
              <div style={{ maxHeight: 190, overflowY: 'auto' }}>
                {queue.length === 0 && completed.length === 0 && (
                  <div style={{ fontSize: 13, color: s.text3, fontStyle: 'italic' }}>
                    Queue is empty. Click a job button above to enqueue.
                  </div>
                )}
                {queue.map(job => (
                  <div key={job.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                    marginBottom: 4, borderRadius: 6, background: s.bg,
                    border: `1px solid ${job.status === 'retrying' ? s.yellow : s.border}`,
                    transition: 'all 0.3s',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: job.status === 'queued' ? s.text3 : job.status === 'retrying' ? s.yellow : s.accent,
                    }} />
                    <span style={{ fontSize: 12, fontFamily: s.mono, color: JOB_COLORS[job.type], flex: 1 }}>
                      {job.label}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>
                      #{job.id}
                    </span>
                    {job.retries > 0 && (
                      <span style={{ fontSize: 11, fontFamily: s.mono, color: s.yellow }}>
                        retry {job.retries}/3
                      </span>
                    )}
                    <span style={{
                      fontSize: 11, fontFamily: s.mono, padding: '2px 6px', borderRadius: 3,
                      background: job.status === 'queued' ? 'rgba(91,141,239,0.15)' : 'rgba(224,176,64,0.15)',
                      color: job.status === 'queued' ? s.accent : s.yellow,
                    }}>
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, padding: 16 }}>
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>
                ACTIVITY LOG
              </div>
              <div style={{ maxHeight: 190, overflowY: 'auto' }}>
                {logs.length === 0 && (
                  <div style={{ fontSize: 13, color: s.text3, fontStyle: 'italic' }}>No activity yet</div>
                )}
                {logs.map((log, i) => (
                  <div key={i} style={{
                    fontSize: 12, fontFamily: s.mono, color: log.color, padding: '2px 0',
                    opacity: i === logs.length - 1 ? 1 : 0.5,
                  }}>
                    {log.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', gap: 16, padding: '10px 16px',
            borderTop: `1px solid ${s.border}`, fontSize: 12, fontFamily: s.mono, color: s.text3,
          }}>
            <span>Queued: <span style={{ color: s.accent }}>{queue.length}</span></span>
            <span>Completed: <span style={{ color: s.green }}>{completed.length}</span></span>
            <span>Total processed: <span style={{ color: s.text2 }}>{completed.length + queue.filter(j => j.retries > 0).length}</span></span>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
