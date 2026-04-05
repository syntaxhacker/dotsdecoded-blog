import { useState, useEffect, useCallback, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type JobStatus = 'queued' | 'waiting' | 'executing' | 'completed' | 'failed' | 'retried'
type Adapter = 'Sidekiq' | 'Resque' | 'DelayedJob'

interface Job {
  id: number
  name: string
  type: string
  status: JobStatus
  retryCount: number
  maxRetries: number
  queue: string
  createdAt: number
}

const jobTemplates = [
  { name: 'SendWelcomeEmail', type: 'mail', queue: 'mailers' },
  { name: 'ProcessPayment', type: 'critical', queue: 'critical' },
  { name: 'GenerateReport', type: 'reports', queue: 'default' },
  { name: 'CleanupUploads', type: 'maintenance', queue: 'low' },
  { name: 'SyncAnalytics', type: 'analytics', queue: 'default' },
]

const adapterColors: Record<Adapter, string> = {
  Sidekiq: s.red,
  Resque: s.green,
  DelayedJob: s.yellow,
}

const statusColors: Record<JobStatus, string> = {
  queued: s.accent,
  waiting: s.yellow,
  executing: s.purple,
  completed: s.green,
  failed: s.red,
  retried: s.orange,
}

export default function ActiveJobDemo() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [adapter, setAdapter] = useState<Adapter>('Sidekiq')
  const [selectedJob, setSelectedJob] = useState<number | null>(null)
  const [speed, setSpeed] = useState(1)
  const [nextId, setNextId] = useState(1)

  const enqueueJob = useCallback((template: typeof jobTemplates[number]) => {
    const job: Job = {
      id: nextId,
      name: template.name,
      type: template.type,
      status: 'queued',
      retryCount: 0,
      maxRetries: template.type === 'critical' ? 5 : 3,
      queue: template.queue,
      createdAt: Date.now(),
    }
    setJobs((prev) => [job, ...prev])
    setNextId((n) => n + 1)
    setSelectedJob(job.id)

    const waitDelay = getStepDelay(800, speed)
    const execDelay = getStepDelay(1200, speed)

    setTimeout(() => {
      setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: 'waiting' } : j))
    }, waitDelay)

    setTimeout(() => {
      setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: 'executing' } : j))
    }, waitDelay + execDelay * 0.3)

    const shouldFail = template.type === 'critical' && Math.random() > 0.6
    setTimeout(() => {
      if (shouldFail) {
        setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: 'failed', retryCount: 1 } : j))
        setTimeout(() => {
          setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: 'retried' } : j))
          setTimeout(() => {
            setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: 'executing' } : j))
            setTimeout(() => {
              setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: 'completed' } : j))
            }, execDelay)
          }, getStepDelay(500, speed))
        }, getStepDelay(600, speed))
      } else {
        setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: 'completed' } : j))
      }
    }, waitDelay + execDelay)
  }, [nextId, speed])

  const clearJobs = () => {
    setJobs([])
    setSelectedJob(null)
  }

  const selected = jobs.find((j) => j.id === selectedJob)

  const jobHtml = useMemo(() => {
    if (!selected) return ''
    const statusMsg = selected.status === 'executing' ? '>>> Currently executing...' : selected.status === 'completed' ? '>>> Completed successfully' : selected.status === 'failed' ? '>>> Failed! Retrying...' : 'Waiting in queue'
    const code = `class ${selected.name} < ApplicationJob
  queue_as :${selected.queue}
  retry_on StandardError,
    wait: :exponentially_longer,
    attempts: ${selected.maxRetries}

  def perform(*args)
    # Job logic here
    # ${statusMsg}
  end
end`
    return Prism.highlight(code, Prism.languages.ruby, 'ruby')
  }, [selected])

  return (
    <DemoBoundary name="Active Job Demo">
      <div className="ajc" style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{`
.ajc code .token.keyword { color: #f92672; }
.ajc code .token.string, .ajc code .token.char, .ajc code .token.builtin, .ajc code .token.inserted { color: #e6db74; }
.ajc code .token.number, .ajc code .token.constant, .ajc code .token.symbol, .ajc code .token.property, .ajc code .token.tag, .ajc code .token.boolean, .ajc code .token.deleted { color: #ae81ff; }
.ajc code .token.selector, .ajc code .token.attr-name { color: #f92672; }
.ajc code .token.attr-value, .ajc code .token.atrule { color: #e6db74; }
.ajc code .token.function, .ajc code .token.class-name { color: #a6e22e; }
.ajc code .token.operator, .ajc code .token.entity, .ajc code .token.url, .ajc code .token.punctuation { color: #f8f8f2; }
.ajc code .token.comment, .ajc code .token.prolog, .ajc code .token.doctype, .ajc code .token.cdata { color: #75715e; font-style: italic; }
.ajc code .token.parameter, .ajc code .token.variable, .ajc code .token.regex, .ajc code .token.important { color: #fd971f; }
        `}</style>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>ADAPTER:</span>
          {(['Sidekiq', 'Resque', 'DelayedJob'] as Adapter[]).map((a) => (
            <button
              key={a}
              onClick={() => setAdapter(a)}
              style={{
                background: adapter === a ? adapterColors[a] : s.bg2,
                border: `1px solid ${adapter === a ? adapterColors[a] : s.border}`,
                borderRadius: 6,
                padding: '4px 10px',
                color: adapter === a ? '#fff' : s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {a}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {jobTemplates.map((t) => (
            <button
              key={t.name}
              onClick={() => enqueueJob(t)}
              style={{
                background: s.bg2,
                border: `1px solid ${s.border}`,
                borderRadius: 6,
                padding: '5px 10px',
                color: s.text2,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.name}
            </button>
          ))}
          {jobs.length > 0 && (
            <button
              onClick={clearJobs}
              style={{
                background: s.bg2,
                border: `1px solid ${s.red}`,
                borderRadius: 6,
                padding: '5px 10px',
                color: s.red,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Job Queue ({adapter})
            </div>
            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden' }}>
              {jobs.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: s.text3, fontSize: 12, fontFamily: s.mono }}>
                  No jobs queued. Click a job above to enqueue.
                </div>
              ) : (
                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job.id)}
                      style={{
                        padding: '10px 14px',
                        borderBottom: `1px solid ${s.border}`,
                        background: selectedJob === job.id ? s.bg3 : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ color: s.text, fontSize: 12, fontFamily: s.mono }}>{job.name}</div>
                        <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono, marginTop: 2 }}>
                          {job.queue} | retry: {job.retryCount}/{job.maxRetries}
                        </div>
                      </div>
                      <div style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: `${statusColors[job.status]}22`,
                        color: statusColors[job.status],
                        fontSize: 10,
                        fontFamily: s.mono,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}>
                        {job.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Job Details
            </div>
            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: 14 }}>
              {selected ? (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: s.text, fontSize: 14, fontFamily: s.mono, fontWeight: 600 }}>{selected.name}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: `${statusColors[selected.status]}22`, color: statusColors[selected.status], fontSize: 10, fontFamily: s.mono, fontWeight: 600, textTransform: 'uppercase' }}>{selected.status}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: `${adapterColors[adapter]}22`, color: adapterColors[adapter], fontSize: 10, fontFamily: s.mono }}>{adapter}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: s.mono, lineHeight: 1.7, whiteSpace: 'pre' }}>
                    <code dangerouslySetInnerHTML={{ __html: jobHtml }} />
                  </div>
                  {selected.retryCount > 0 && (
                    <div style={{ marginTop: 12, padding: '8px 12px', background: s.bg3, borderRadius: 6 }}>
                      <div style={{ color: s.orange, fontSize: 10, fontFamily: s.mono, marginBottom: 4 }}>RETRY BACKOFF</div>
                      <div style={{ color: s.text2, fontSize: 11, fontFamily: s.mono }}>
                        Attempt {selected.retryCount} of {selected.maxRetries} -- delay: {Math.pow(2, selected.retryCount) * 2}s
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, textAlign: 'center', padding: '30px 0' }}>
                  Select a job to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
