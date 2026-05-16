import { useState, useEffect, useCallback } from 'react'
import SpeedController, { getStepDelay } from './SpeedController'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface StepData {
  pods: string[]
  desc: string
}

const steps: StepData[] = [
  { pods: ['v1', 'v1', 'v1', 'v1', 'v1'], desc: '5 replicas running version v1' },
  { pods: ['v1', 'v1', 'v1', 'v1', 'v1', 'v2+'], desc: 'Surge: +1 v2 pod created (maxSurge=1)' },
  { pods: ['v1', 'v1', 'v1', 'v1', 'v2'], desc: 'v1 pod replaced by v2 (maxUnavailable=1)' },
  { pods: ['v1', 'v1', 'v1', 'v1', 'v2', 'v2+'], desc: 'Surge: +1 v2 pod created' },
  { pods: ['v1', 'v1', 'v1', 'v2', 'v2'], desc: 'v1 pod replaced by v2' },
  { pods: ['v1', 'v1', 'v1', 'v2', 'v2', 'v2+'], desc: 'Surge: +1 v2 pod created' },
  { pods: ['v1', 'v1', 'v2', 'v2', 'v2'], desc: 'v1 pod replaced by v2' },
  { pods: ['v1', 'v1', 'v2', 'v2', 'v2', 'v2+'], desc: 'Surge: +1 v2 pod created' },
  { pods: ['v1', 'v2', 'v2', 'v2', 'v2'], desc: 'v1 pod replaced by v2' },
  { pods: ['v1', 'v2', 'v2', 'v2', 'v2', 'v2+'], desc: 'Surge: +1 v2 pod created' },
  { pods: ['v2', 'v2', 'v2', 'v2', 'v2'], desc: 'Rollout complete. All 5 replicas running v2.' },
]

export default function K8sDeploymentDemo() {
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'complete'>('idle')
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    if (phase !== 'rolling' || step >= steps.length - 1) return
    const delay = getStepDelay(800, speed)
    const t = setTimeout(() => {
      const next = step + 1
      setStep(next)
      if (next >= steps.length - 1) setPhase('complete')
    }, delay)
    return () => clearTimeout(t)
  }, [step, phase, speed])

  const startRollout = useCallback(() => {
    setStep(0)
    setPhase('rolling')
  }, [])

  const resetDemo = useCallback(() => {
    setStep(0)
    setPhase('idle')
  }, [])

  const current = steps[step]
  const v1Count = current ? current.pods.filter(p => p.startsWith('v1')).length : 5
  const v2Count = current ? current.pods.filter(p => p.startsWith('v2')).length : 0

  return (
    <DemoBoundary name="Deployment Rolling Update">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, letterSpacing: -0.3 }}>Rolling Update</div>
        {phase === 'rolling' && <SpeedController speed={speed} onSpeedChange={setSpeed} />}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ background: s.bg2, borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: s.text, fontFamily: s.mono }}>{steps.length - 1}</div>
          <div style={{ color: s.text3, fontSize: 10 }}>Desired</div>
        </div>
        <div style={{ background: s.bg2, borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: current.pods.length === 5 ? s.text : s.yellow, fontFamily: s.mono }}>{current.pods.length}</div>
          <div style={{ color: s.text3, fontSize: 10 }}>Current</div>
        </div>
        <div style={{ background: s.bg2, borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: s.green, fontFamily: s.mono }}>{v2Count}</div>
          <div style={{ color: s.text3, fontSize: 10 }}>Updated</div>
        </div>
        <div style={{ background: s.bg2, borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: v1Count === 0 ? s.green : s.text2, fontFamily: s.mono }}>{v1Count}</div>
          <div style={{ color: s.text3, fontSize: 10 }}>v1 Remaining</div>
        </div>
      </div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12,
        padding: 20, marginBottom: 16, minHeight: 120,
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
      }}>
        {current.pods.map((pod, i) => {
          const isV2 = pod.startsWith('v2')
          const isCreating = pod.endsWith('+')
          let bg = s.bg3
          let borderClr = s.border
          let label = pod
          let statusText = ''
          let statusClr = s.text3

          if (isV2 && !isCreating) {
            bg = `${s.green}12`
            borderClr = s.green
            label = 'v2'
            statusText = 'Ready'
            statusClr = s.green
          } else if (isV2 && isCreating) {
            bg = `${s.yellow}15`
            borderClr = s.yellow
            label = 'v2'
            statusText = 'Creating'
            statusClr = s.yellow
          } else {
            statusText = 'Running'
            statusClr = s.text3
          }

          return (
            <div key={i} style={{
              width: 80, height: 90, borderRadius: 10,
              background: bg, border: `2px solid ${borderClr}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.4s', gap: 4,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 13, fontWeight: 700, color: isV2 ? s.green : s.text }}>
                {label}
              </div>
              <div style={{ fontSize: 10, color: statusClr, fontFamily: s.mono }}>{statusText}</div>
            </div>
          )
        })}
      </div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border2}`, borderRadius: 8,
        padding: '10px 14px', marginBottom: 16,
      }}>
        <div style={{ color: phase === 'complete' ? s.green : s.accent, fontSize: 13, fontWeight: 600 }}>
          {current.desc}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {phase === 'idle' && (
          <button onClick={startRollout} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '10px 24px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>Start Rollout</button>
        )}
        {(phase === 'rolling' || phase === 'complete') && (
          <button onClick={resetDemo} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
        )}
      </div>

      <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Rollout Strategy</div>
        {[
          { label: 'maxSurge=1', desc: 'Allows 1 extra pod during update (6 total)', color: s.accent },
          { label: 'maxUnavailable=1', desc: 'Allows 1 pod to be unavailable during update', color: s.purple },
          { label: 'Rolling', desc: 'New pods created before old ones are deleted (zero downtime)', color: s.green },
        ].map((st) => (
          <div key={st.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
            <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 100 }}>{st.label}</span>
            <span style={{ color: s.text2, fontSize: 12 }}>{st.desc}</span>
          </div>
        ))}
      </div>
    </div>
    </DemoBoundary>
  )
}
