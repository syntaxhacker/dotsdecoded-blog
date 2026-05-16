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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

type StageStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped'

interface Stage {
  id: string
  name: string
  status: StageStatus
  duration: number
  substeps: string[]
  activeSubstep: number
  parallel?: boolean
}

const initStages = (): Stage[] => [
  { id: 'lint', name: 'Lint', status: 'pending', duration: 1500, substeps: ['ESLint --max-warnings 0'], activeSubstep: -1 },
  { id: 'typecheck', name: 'Type Check', status: 'pending', duration: 2000, substeps: ['tsc --noEmit'], activeSubstep: -1 },
  { id: 'unit', name: 'Unit Tests', status: 'pending', duration: 3000, substeps: ['vitest run (142 tests)'], activeSubstep: -1, parallel: true },
  { id: 'integration', name: 'Integration Tests', status: 'pending', duration: 4000, substeps: ['supertest (38 tests)'], activeSubstep: -1, parallel: true },
  { id: 'e2e', name: 'E2E Tests', status: 'pending', duration: 5000, substeps: ['Playwright (12 specs)'], activeSubstep: -1 },
  { id: 'build', name: 'Build', status: 'pending', duration: 2000, substeps: ['bun run build'], activeSubstep: -1 },
  { id: 'deploy', name: 'Deploy', status: 'pending', duration: 1500, substeps: ['bunx wrangler pages deploy'], activeSubstep: -1 },
]

interface Log {
  text: string
  color: string
}

export default function TestCiDemo() {
  const [stages, setStages] = useState<Stage[]>(initStages)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [logs, setLogs] = useState<Log[]>([])
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle')
  const [failOnStage, setFailOnStage] = useState<string | null>(null)
  const progressRef = useRef<Record<string, number>>({})
  const doneRef = useRef(false)

  const statusIcon = (st: StageStatus): string => {
    switch (st) {
      case 'pending': return '\u25CB'
      case 'running': return '\u25CF'
      case 'passed': return '\u2713'
      case 'failed': return '\u2717'
      case 'skipped': return '\u2014'
    }
  }

  const start = useCallback((failOn?: string) => {
    setStages(prev => prev.map((st, i) => ({
      ...st,
      status: i === 0 ? 'running' as StageStatus : 'pending' as StageStatus,
      activeSubstep: i === 0 ? 0 : -1,
    })))
    setRunning(true)
    setOverallStatus('running')
    setFailOnStage(failOn || null)
    setLogs([{ text: `PR #142: feat: add discount calculator`, color: s.text }, { text: 'Pipeline triggered by push to feat/discount', color: s.text3 }])
    progressRef.current = {}
    doneRef.current = false
  }, [])

  const reset = useCallback(() => {
    setStages(initStages())
    setRunning(false)
    setLogs([])
    setOverallStatus('idle')
    setFailOnStage(null)
    progressRef.current = {}
    doneRef.current = false
  }, [])

  useEffect(() => {
    if (!running || doneRef.current) return

    const interval = setInterval(() => {
      setStages(prev => {
        if (doneRef.current) return prev

        const next = prev.map(st => ({ ...st }))
        const runningAny = next.some(st => st.status === 'running')

        if (!runningAny) return next

        for (let idx = 0; idx < next.length; idx++) {
          const stage = next[idx]
          if (stage.status !== 'running') continue

          const key = stage.id
          progressRef.current[key] = (progressRef.current[key] || 0) + getStepDelay(50, speed)
          const pct = progressRef.current[key]

          const subStepIdx = Math.floor((pct / stage.duration) * stage.substeps.length)
          stage.activeSubstep = Math.min(subStepIdx, stage.substeps.length - 1)

          if (pct >= stage.duration) {
            const isFail = failOnStage === stage.id
            stage.status = isFail ? 'failed' : 'passed'
            stage.activeSubstep = -1
            delete progressRef.current[key]

            if (isFail) {
              doneRef.current = true
              setOverallStatus('failed')
              setLogs(l => [...l, { text: `FAILED: ${stage.name} - test failed`, color: s.red }])
              return next
            }

            setLogs(l => [...l, { text: `  ${stage.name}: ${Math.floor(stage.duration)}ms`, color: s.green }])

            const nextIdx = idx + 1
            if (nextIdx < next.length) {
              next[nextIdx].status = 'running'
              next[nextIdx].activeSubstep = 0

              if (stage.parallel && nextIdx + 1 < next.length) {
                next[nextIdx + 1].status = 'running'
                next[nextIdx + 1].activeSubstep = 0
                setLogs(l => [...l, { text: `  Starting ${next[nextIdx + 1].name} in parallel`, color: s.text3 }])
              }
            } else {
              doneRef.current = true
              setOverallStatus('success')
              setLogs(l => [...l, { text: 'All checks passed. Deployed to production.', color: s.green }])
            }
          }
        }

        return next
      })
    }, getStepDelay(50, speed))

    return () => clearInterval(interval)
  }, [running, speed, failOnStage])

  const getStageColor = (st: Stage) => {
    switch (st.status) {
      case 'passed': return s.green
      case 'failed': return s.red
      case 'running': return s.accent
      default: return s.text3
    }
  }

  const getProgressPct = (stage: Stage) => {
    const p = progressRef.current[stage.id]
    if (!p) return 0
    return Math.min(100, (p / stage.duration) * 100)
  }

  return (
    <DemoBoundary name="CI Test Pipeline">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>CI Test Pipeline</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          A pull request triggers the pipeline. Independent test suites run in parallel.
          A failure at any stage stops the pipeline and prevents deployment.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {overallStatus === 'idle' && (
            <>
              <button onClick={() => start()} style={{
                background: s.green, border: 'none', borderRadius: 8, padding: '8px 20px',
                color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Open PR (all passing)</button>
              <button onClick={() => start('unit')} style={{
                background: s.yellow + '20', border: `1px solid ${s.yellow}`, borderRadius: 8, padding: '8px 20px',
                color: s.yellow, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Open PR (unit fails)</button>
              <button onClick={() => start('e2e')} style={{
                background: s.red + '20', border: `1px solid ${s.red}`, borderRadius: 8, padding: '8px 20px',
                color: s.red, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Open PR (E2E fails)</button>
            </>
          )}
          {overallStatus !== 'idle' && (
            <button onClick={reset} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 20px',
              color: s.text2, cursor: 'pointer', fontSize: 13,
            }}>Reset</button>
          )}
          <div style={{ flex: 1 }} />
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
          {stages.map((stage) => {
            const isParallel = !!stage.parallel
            return (
              <div key={stage.id} style={{
                flex: isParallel ? '1 1 45%' : '1 1 30%',
                minWidth: isParallel ? 140 : 100,
              }}>
                <div style={{
                  background: stage.status === 'running' ? `${s.accent}15` : stage.status === 'passed' ? `${s.green}10` : stage.status === 'failed' ? `${s.red}10` : s.bg3,
                  border: `1px solid ${getStageColor(stage)}`,
                  borderRadius: 8, padding: '10px 8px', textAlign: 'center',
                  transition: 'all 0.3s', minHeight: 80,
                  position: 'relative',
                }}>
                  {isParallel && stage.status === 'running' && (
                    <div style={{
                      position: 'absolute', top: -6, right: 8,
                      fontSize: 8, color: s.accent, fontFamily: s.mono,
                      background: s.bg, padding: '0 4px',
                    }}>
                      parallel
                    </div>
                  )}
                  <div style={{ color: getStageColor(stage), fontSize: 16, marginBottom: 4 }}>
                    {statusIcon(stage.status)}
                  </div>
                  <div style={{ color: stage.status === 'pending' ? s.text3 : s.text, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    {stage.name}
                  </div>
                  {stage.status === 'running' && (
                    <div style={{ width: '80%', margin: '4px auto 0', height: 2, background: s.bg, borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{
                        width: `${getProgressPct(stage)}%`,
                        height: '100%', background: s.accent, borderRadius: 1,
                        transition: 'width 0.2s',
                      }} />
                    </div>
                  )}
                  {stage.status === 'running' && (
                    <div style={{ color: s.accent, fontSize: 9, fontFamily: s.mono, marginTop: 4, lineHeight: 1.3 }}>
                      {stage.substeps[stage.activeSubstep >= 0 ? stage.activeSubstep : 0]}
                    </div>
                  )}
                  {(stage.status === 'passed' || stage.status === 'failed') && (
                    <div style={{ color: getStageColor(stage), fontSize: 9, fontFamily: s.mono, marginTop: 4 }}>
                      {stage.status === 'passed' ? 'passed' : 'failed'}
                    </div>
                  )}
                  {stage.status === 'pending' && (
                    <div style={{ color: s.text3, fontSize: 9, marginTop: 4 }}>
                      waiting...
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {overallStatus === 'success' && (
          <div style={{ background: s.green + '10', border: `1px solid ${s.green}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <span style={{ color: s.green, fontSize: 13, fontWeight: 600 }}>All checks passed. Deployed to production.</span>
          </div>
        )}
        {overallStatus === 'failed' && (
          <div style={{ background: s.red + '10', border: `1px solid ${s.red}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <span style={{ color: s.red, fontSize: 13, fontWeight: 600 }}>
              Pipeline failed at {failOnStage ? stages.find(st => st.id === failOnStage)?.name : 'a stage'}.
            </span>
            <span style={{ color: s.text3, fontSize: 12, marginLeft: 8 }}>Fix and re-push to trigger a new run.</span>
          </div>
        )}

        {logs.length > 0 && (
          <div style={{ background: s.bg, borderRadius: 8, padding: 12, maxHeight: 140, overflowY: 'auto', border: `1px solid ${s.border}` }}>
            {logs.map((log, i) => (
              <div key={i} style={{
                fontFamily: s.mono, fontSize: 11, lineHeight: 1.6,
                color: log.color,
              }}>
                {log.text}
              </div>
            ))}
            {running && (
              <div style={{ color: s.yellow, fontFamily: s.mono, fontSize: 11 }}>{'>'} Running...</div>
            )}
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
