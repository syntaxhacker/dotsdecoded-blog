import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import { getStepDelay } from './SpeedController'
import SpeedController from './SpeedController'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Stage {
  label: string
  color: string
  icon: string
  details: string[]
  failures: string[]
}

const stages: Stage[] = [
  {
    label: 'Git Push',
    color: s.accent,
    icon: 'PU',
    details: [
      'Developer pushes to main branch',
      'Git hooks run (lint-staged, commitlint)',
      'CI platform detects the push event',
      'A new pipeline run is created',
    ],
    failures: [
      'Pre-push hooks fail (lint errors)',
      'Branch protection rules block push',
      'Large files exceed size limits',
    ],
  },
  {
    label: 'CI Tests',
    color: s.purple,
    icon: 'CI',
    details: [
      'Spin up test environment (Docker or VM)',
      'Install dependencies (bundle install)',
      'Run database migrations',
      'Execute RSpec test suite',
      'Run linters and security scanners',
    ],
    failures: [
      'Tests fail (regression, flaky tests)',
      'Database connection timeout',
      'Dependency resolution conflict',
      'Lint violations block merge',
    ],
  },
  {
    label: 'Build Assets',
    color: s.orange,
    icon: 'BL',
    details: [
      'Compile JavaScript/TypeScript',
      'Process CSS (Tailwind, PostCSS)',
      'Bundle and minify assets',
      'Generate asset manifest with digests',
      'Fingerprint for cache busting',
    ],
    failures: [
      'JavaScript build error (syntax, import)',
      'CSS compilation fails',
      'Missing asset file references',
      'Memory exceeded during build',
    ],
  },
  {
    label: 'Deploy',
    color: s.yellow,
    icon: 'DP',
    details: [
      'Upload new release to server',
      'Run database migrations',
      'Restart application server',
      'Clear caches (Redis, fragment cache)',
      'Update load balancer health targets',
    ],
    failures: [
      'Migration fails (data conflict)',
      'Server restart times out',
      'Disk space full on target server',
      'Secrets/env vars missing',
    ],
  },
  {
    label: 'Health Check',
    color: s.green,
    icon: 'HC',
    details: [
      'Hit /up endpoint for liveness check',
      'Verify database connectivity',
      'Check Redis/queue connections',
      'Validate asset serving',
      'Monitor error rate for 5 minutes',
    ],
    failures: [
      'App fails to boot (crash on startup)',
      'Database connection refused',
      'Assets return 404',
      'Error rate exceeds threshold',
    ],
  },
  {
    label: 'Live',
    color: '#56b6c2',
    icon: 'GO',
    details: [
      'Traffic routed to new release',
      'Monitoring dashboards update',
      'Error tracking begins for new version',
      'Auto-rollback if error spike detected',
      'Release notes tagged in changelog',
    ],
    failures: [
      'Runtime error discovered post-deploy',
      'Performance regression detected',
      'Third-party API integration broken',
    ],
  },
]

export default function DeployPipelineDemo() {
  const [step, setStep] = useState(-1)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [failed, setFailed] = useState(false)
  const [speed, setSpeed] = useState(1)
  const logRef = useRef<HTMLDivElement>(null)

  const start = useCallback(() => {
    if (running) return
    setStep(0)
    setRunning(true)
    setDone(false)
    setFailed(false)
  }, [running])

  useEffect(() => {
    if (step < 0 || step >= stages.length) return
    const delay = getStepDelay(800, speed)
    const t = setTimeout(() => {
      if (step === stages.length - 1) {
        setDone(true)
        setRunning(false)
      } else {
        setStep(step + 1)
      }
    }, delay)
    return () => clearTimeout(t)
  }, [step, speed])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [step])

  const logEntries = useMemo(() => {
    const entries: { text: string; color: string; time: string }[] = []
    for (let i = 0; i <= step; i++) {
      if (i < 0) break
      const st = stages[i]
      entries.push({ text: `[${st.icon}] ${st.label}`, color: st.color, time: `00:${String(i * 2).padStart(2, '0')}` })
      if (i === step && i < stages.length - 1) {
        entries.push({ text: `  Running ${st.details[i % st.details.length].toLowerCase()}...`, color: s.text3, time: '' })
      }
      if (i === step && i === stages.length - 1) {
        entries.push({ text: '  All checks passed. Release is live.', color: s.green, time: '' })
      }
      if (i < step) {
        entries.push({ text: `  Completed successfully`, color: s.green, time: '' })
      }
    }
    return entries
  }, [step])

  return (
    <DemoBoundary name="Deploy Pipeline">
      <div style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 16, flexWrap: 'wrap',
        }}>
          <button
            onClick={start}
            disabled={running}
            style={{
              padding: '8px 20px', borderRadius: 8,
              background: running ? s.bg3 : s.accent,
              border: 'none', color: '#fff',
              fontSize: 13, fontWeight: 600,
              cursor: running ? 'not-allowed' : 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              transition: 'all 0.15s',
            }}
          >
            {running ? 'Deploying...' : 'Start Deploy'}
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
          {done && (
            <div style={{ fontSize: 13, fontWeight: 600, color: s.green }}>
              Deploy successful
            </div>
          )}
        </div>

        <div style={{
          display: 'flex', gap: 3, marginBottom: 20,
          padding: '12px 8px',
          background: s.bg2,
          borderRadius: 10,
          border: `1px solid ${s.border}`,
          overflowX: 'auto',
        }}>
          {stages.map((st, i) => {
            const isDone = step > i
            const isActive = step === i
            const isPending = step < i
            return (
              <div key={st.label} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{
                  flex: 1, textAlign: 'center', padding: '10px 4px',
                  borderRadius: 8, transition: 'all 0.2s',
                  background: isActive ? st.color + '20' : 'transparent',
                  border: `1px solid ${isActive ? st.color + '50' : 'transparent'}`,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    margin: '0 auto 6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDone ? st.color + '30' : isActive ? st.color + '20' : s.bg3,
                    border: `1px solid ${isDone ? st.color + '60' : isActive ? st.color + '50' : s.border}`,
                    fontSize: 11, fontWeight: 700, fontFamily: s.mono,
                    color: isDone ? st.color : isActive ? st.color : s.text3,
                  }}>
                    {isDone ? '\u2713' : st.icon}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 600,
                    color: isDone ? st.color : isActive ? st.color : s.text3,
                  }}>
                    {st.label}
                  </div>
                </div>
                {i < stages.length - 1 && (
                  <div style={{
                    width: 12, height: 2, flexShrink: 0,
                    background: isDone ? s.green + '60' : s.border,
                    borderRadius: 1,
                  }} />
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px', minWidth: 260 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: s.text3, textTransform: 'uppercase',
              letterSpacing: 0.5, marginBottom: 8,
            }}>
              Deploy Log
            </div>
            <div ref={logRef} style={{
              background: s.bg, borderRadius: 8, padding: 12,
              border: `1px solid ${s.border}`,
              maxHeight: 260, overflowY: 'auto',
              fontFamily: s.mono, fontSize: 12, lineHeight: 1.8,
            }}>
              {logEntries.length === 0 ? (
                <div style={{ color: s.text3 }}>Waiting for deploy to start...</div>
              ) : (
                logEntries.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    {entry.time && <span style={{ color: s.text3, flexShrink: 0 }}>{entry.time}</span>}
                    <span style={{ color: entry.color }}>{entry.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ flex: '1 1 360px', minWidth: 280 }}>
            {step >= 0 && step < stages.length && (
              <div>
                <div style={{
                  padding: 16, borderRadius: 10,
                  background: s.bg2, border: `1px solid ${s.border}`,
                  marginBottom: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: stages[step].color + '20',
                      border: `1px solid ${stages[step].color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, fontFamily: s.mono,
                      color: stages[step].color,
                    }}>
                      {stages[step].icon}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: stages[step].color }}>
                      {stages[step].label}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                    What happens
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {stages[step].details.map((d, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        fontSize: 12, color: s.text2, lineHeight: 1.5,
                      }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: stages[step].color, flexShrink: 0,
                          marginTop: 6,
                        }} />
                        {d}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  padding: 16, borderRadius: 10,
                  background: s.bg2, border: `1px solid ${s.border}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: s.red, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                    What can go wrong
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {stages[step].failures.map((f, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        fontSize: 12, color: s.text3, lineHeight: 1.5,
                      }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: s.red, flexShrink: 0, marginTop: 6,
                        }} />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {done && (
              <div style={{
                padding: 24, borderRadius: 10, textAlign: 'center',
                background: s.green + '10', border: `1px solid ${s.green}40`,
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.green, marginBottom: 6 }}>
                  Deployment Complete
                </div>
                <div style={{ fontSize: 13, color: s.text2 }}>
                  All stages passed. Your Rails application is live and receiving traffic.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}


