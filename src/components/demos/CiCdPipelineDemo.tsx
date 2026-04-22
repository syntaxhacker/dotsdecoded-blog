import { useState, useEffect } from 'react'
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
  name: string
  status: StageStatus
  duration: number
  progress: number
  substeps: string[]
  activeSubstep: number
}

const initialStages: Stage[] = [
  { name: 'Build', status: 'pending', duration: 2000, progress: 0, substeps: ['Install dependencies', 'Compile TypeScript', 'Bundle assets'], activeSubstep: -1 },
  { name: 'Lint', status: 'pending', duration: 1200, progress: 0, substeps: ['ESLint check', 'Prettier format check'], activeSubstep: -1 },
  { name: 'Test', status: 'pending', duration: 3500, progress: 0, substeps: ['Unit tests (42)', 'Integration tests (18)', 'E2E tests (7)'], activeSubstep: -1 },
  { name: 'Stage', status: 'pending', duration: 1500, progress: 0, substeps: ['Deploy to staging', 'Run smoke tests', 'Health check'], activeSubstep: -1 },
  { name: 'Deploy', status: 'pending', duration: 2000, progress: 0, substeps: ['Push to production', 'Wait for health check', 'Verify rollout'], activeSubstep: -1 },
]

const failOnTest = false

export default function CiCdPipelineDemo() {
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [running, setRunning] = useState(false)
  const [currentStage, setCurrentStage] = useState(-1)
  const [speed, setSpeed] = useState(1)
  const [triggerFail, setTriggerFail] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle')

  useEffect(() => {
    if (!running || currentStage < 0 || currentStage >= stages.length) return
    const stage = stages[currentStage]
    const stepDur = stage.duration / stage.substeps.length

    const t = setInterval(() => {
      setStages(prev => {
        const next = [...prev]
        const st = { ...next[currentStage] }
        st.progress += (100 / stage.substeps.length) * (getStepDelay(200, speed) / stepDur)

        if (st.progress >= 100) {
          st.progress = 100
          const isFailure = triggerFail && currentStage === 2
          st.status = isFailure ? 'failed' : 'passed'
          st.activeSubstep = -1

          if (isFailure) {
            return next
          }

          const nextIdx = currentStage + 1
          if (nextIdx < next.length) {
            next[nextIdx] = { ...next[nextIdx], status: 'running', activeSubstep: 0 }
            setCurrentStage(nextIdx)
          }
        } else {
          st.activeSubstep = Math.min(Math.floor(st.progress / (100 / stage.substeps.length)), stage.substeps.length - 1)
        }

        next[currentStage] = st
        return next
      })
    }, getStepDelay(200, speed))

    return () => clearInterval(t)
  }, [running, currentStage, speed, triggerFail])

  useEffect(() => {
    if (currentStage < 0) return
    const stage = stages[currentStage]
    if (stage.status === 'failed') {
      setRunning(false)
      setOverallStatus('failed')
      setLogs(prev => [...prev, `FAILED: ${stage.name} - test_payment_with_expired_card failed`])
      setDone(true)
    }
  }, [stages, currentStage])

  useEffect(() => {
    if (stages.every(st => st.status === 'passed') && stages[stages.length - 1].status === 'passed') {
      setRunning(false)
      setOverallStatus('success')
      setLogs(prev => [...prev, 'Pipeline completed successfully'])
      setDone(true)
    }
  }, [stages])

  const startPipeline = (fail = false) => {
    setStages(initialStages.map((st, i) => i === 0 ? { ...st, status: 'running', activeSubstep: 0 } : { ...st }))
    setCurrentStage(0)
    setRunning(true)
    setTriggerFail(fail)
    setLogs(['Pipeline triggered', 'Commit: a3f8b21 - feat: add payment retry logic'])
    setDone(false)
    setOverallStatus('running')
  }

  const resetPipeline = () => {
    setStages(initialStages)
    setCurrentStage(-1)
    setRunning(false)
    setLogs([])
    setDone(false)
    setOverallStatus('idle')
  }

  const statusColor = (status: StageStatus) => {
    switch (status) {
      case 'pending': return s.text3
      case 'running': return s.accent
      case 'passed': return s.green
      case 'failed': return s.red
      case 'skipped': return s.text3
    }
  }

  const statusIcon = (status: StageStatus) => {
    switch (status) {
      case 'pending': return '\u25CB'
      case 'running': return '\u25CF'
      case 'passed': return '\u2713'
      case 'failed': return '\u2717'
      case 'skipped': return '\u2014'
    }
  }

  return (
    <DemoBoundary name="CI/CD Pipeline">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>CI/CD Pipeline</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Push code and watch it flow through the pipeline. Each stage must pass before the next starts.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {!running && !done && (
            <>
              <button onClick={() => startPipeline(false)} style={{
                background: s.green, border: 'none', borderRadius: 8, padding: '8px 20px',
                color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Push Code</button>
              <button onClick={() => startPipeline(true)} style={{
                background: s.yellow + '20', border: `1px solid ${s.yellow}`, borderRadius: 8, padding: '8px 20px',
                color: s.yellow, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Push Code (with test failure)</button>
            </>
          )}
          {done && overallStatus === 'failed' && (
            <button onClick={() => startPipeline(false)} style={{
              background: s.green, border: 'none', borderRadius: 8, padding: '8px 20px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>Fix and Retry</button>
          )}
          {(done || !running) && done && (
            <button onClick={resetPipeline} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 20px',
              color: s.text2, cursor: 'pointer', fontSize: 13,
            }}>Reset</button>
          )}
          <div style={{ flex: 1 }} />
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        {overallStatus === 'success' && (
          <div style={{ background: s.green + '10', border: `1px solid ${s.green}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <span style={{ color: s.green, fontSize: 13, fontWeight: 600 }}>Deployed to production successfully</span>
          </div>
        )}
        {overallStatus === 'failed' && (
          <div style={{ background: s.red + '10', border: `1px solid ${s.red}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <span style={{ color: s.red, fontSize: 13, fontWeight: 600 }}>Pipeline failed at Test stage</span>
            <span style={{ color: s.text3, fontSize: 12, marginLeft: 8 }}>Fix the test and retry</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 4, marginBottom: 16, alignItems: 'stretch' }}>
          {stages.map((stage, idx) => (
            <div key={stage.name} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                background: stage.status === 'running' ? s.accent + '15' : stage.status === 'passed' ? s.green + '10' : stage.status === 'failed' ? s.red + '10' : s.bg3,
                border: `1px solid ${stage.status === 'running' ? s.accent : stage.status === 'passed' ? s.green : stage.status === 'failed' ? s.red : s.border}`,
                borderRadius: '10px 10px 4px 4px', padding: '12px 10px', textAlign: 'center', minHeight: 110,
                transition: 'all 0.3s',
              }}>
                <div style={{ color: statusColor(stage.status), fontSize: 18, marginBottom: 6 }}>{statusIcon(stage.status)}</div>
                <div style={{ color: s.text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{stage.name}</div>
                {stage.status === 'running' && (
                  <div style={{ width: '100%', height: 3, background: s.bg, borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, stage.progress)}%`, height: '100%',
                      background: s.accent, borderRadius: 2, transition: 'width 0.2s',
                    }} />
                  </div>
                )}
                {stage.activeSubstep >= 0 && stage.activeSubstep < stage.substeps.length && (
                  <div style={{ color: s.accent, fontSize: 10, fontFamily: s.mono, lineHeight: 1.4 }}>
                    {stage.substeps[stage.activeSubstep]}
                  </div>
                )}
                {stage.status === 'passed' && (
                  <div style={{ color: s.green, fontSize: 11 }}>
                    {stage.substeps.map(sub => (
                      <div key={sub} style={{ fontSize: 10, fontFamily: s.mono, lineHeight: 1.5 }}>
                        {'\u2713'} {sub}
                      </div>
                    ))}
                  </div>
                )}
                {stage.status === 'failed' && (
                  <div>
                    <div style={{ color: s.green, fontSize: 10, fontFamily: s.mono }}>{'\u2713'} {stage.substeps[0]}</div>
                    <div style={{ color: s.red, fontSize: 10, fontFamily: s.mono }}>{'\u2717'} {stage.substeps[1]}</div>
                  </div>
                )}
              </div>
              {idx < stages.length - 1 && (
                <div style={{ textAlign: 'center', color: s.text3, fontSize: 16, marginTop: -2 }}>
                  {stages[idx].status === 'passed' ? '\u2192' : '...'}
                </div>
              )}
            </div>
          ))}
        </div>

        {logs.length > 0 && (
          <div style={{ background: s.bg, borderRadius: 8, padding: 12, maxHeight: 120, overflowY: 'auto', border: `1px solid ${s.border}` }}>
            {logs.map((log, i) => (
              <div key={i} style={{
                fontFamily: s.mono, fontSize: 11, lineHeight: 1.6,
                color: log.includes('FAILED') ? s.red : log.includes('successfully') ? s.green : s.text3,
              }}>
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
