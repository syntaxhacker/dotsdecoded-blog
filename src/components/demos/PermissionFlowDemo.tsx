import { useState, useEffect, useCallback } from 'react'
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

type ScenarioId = 'git-status' | 'rm-rf' | 'npm-install' | 'cat-env'

interface StepDef {
  id: string
  label: string
  check?: string
  result?: string
  resultColor?: string
}

const scenarios: Record<ScenarioId, {
  label: string
  command: string
  steps: StepDef[]
  finalOutcome: string
  finalColor: string
}> = {
  'git-status': {
    label: 'git status',
    command: 'git status',
    steps: [
      { id: 'tool-call', label: 'Tool Call Received' },
      { id: 'deny', label: 'Check Deny Rules', check: 'No match', result: 'PASS', resultColor: s.green },
      { id: 'allow', label: 'Check Allow Rules', check: 'Match: default allow read commands', result: 'ALLOWED', resultColor: s.green },
    ],
    finalOutcome: 'ALLOWED',
    finalColor: s.green,
  },
  'rm-rf': {
    label: 'rm -rf /',
    command: 'rm -rf /',
    steps: [
      { id: 'tool-call', label: 'Tool Call Received' },
      { id: 'deny', label: 'Check Deny Rules', check: 'Match: destructive shell commands', result: 'DENIED', resultColor: s.red },
    ],
    finalOutcome: 'DENIED',
    finalColor: s.red,
  },
  'npm-install': {
    label: 'npm install lodash',
    command: 'npm install lodash',
    steps: [
      { id: 'tool-call', label: 'Tool Call Received' },
      { id: 'deny', label: 'Check Deny Rules', check: 'No match', result: 'PASS', resultColor: s.green },
      { id: 'allow', label: 'Check Allow Rules', check: 'No match', result: 'PASS', resultColor: s.green },
      { id: 'ask', label: 'Check Ask Rules', check: 'Match: package install requires approval', result: 'ASK USER', resultColor: s.yellow },
    ],
    finalOutcome: 'ASK USER',
    finalColor: s.yellow,
  },
  'cat-env': {
    label: 'cat .env',
    command: 'cat .env',
    steps: [
      { id: 'tool-call', label: 'Tool Call Received' },
      { id: 'deny', label: 'Check Deny Rules', check: 'No match', result: 'PASS', resultColor: s.green },
      { id: 'allow', label: 'Check Allow Rules', check: 'No match', result: 'PASS', resultColor: s.green },
      { id: 'ask', label: 'Check Ask Rules', check: 'No match', result: 'PASS', resultColor: s.green },
      { id: 'classifier', label: 'Run ML Classifier', check: 'Low risk: reading existing file', result: '98% confidence', resultColor: s.green },
      { id: 'default-mode', label: 'Default Permission Mode', check: 'auto mode', result: 'ALLOWED (98% confidence)', resultColor: s.green },
    ],
    finalOutcome: 'ALLOWED (98% confidence)',
    finalColor: s.green,
  },
}

const allSteps: StepDef[] = [
  { id: 'tool-call', label: 'Tool Call Received' },
  { id: 'deny', label: 'Check Deny Rules' },
  { id: 'allow', label: 'Check Allow Rules' },
  { id: 'ask', label: 'Check Ask Rules' },
  { id: 'classifier', label: 'Run ML Classifier' },
  { id: 'default-mode', label: 'Default Permission Mode' },
]

const modes = ['default', 'plan', 'bypassPermissions'] as const
type Mode = typeof modes[number]

const modeLabels: Record<Mode, string> = {
  default: 'default',
  plan: 'plan',
  bypassPermissions: 'bypass',
}

export default function PermissionFlowDemo() {
  const [selected, setSelected] = useState<ScenarioId | ''>('')
  const [activeStep, setActiveStep] = useState<number>(-1)
  const [animating, setAnimating] = useState(false)
  const [done, setDone] = useState(false)
  const [classifierProgress, setClassifierProgress] = useState(0)
  const [mode, setMode] = useState<Mode>('default')
  const [showAskDialog, setShowAskDialog] = useState(false)
  const [askResponse, setAskResponse] = useState<'allow' | 'deny' | null>(null)

  const reset = useCallback(() => {
    setActiveStep(-1)
    setDone(false)
    setClassifierProgress(0)
    setShowAskDialog(false)
    setAskResponse(null)
    setAnimating(false)
  }, [])

  const simulate = useCallback((id: ScenarioId) => {
    reset()
    setSelected(id)
    setAnimating(true)
  }, [reset])

  useEffect(() => {
    if (!animating || !selected) return
    const sc = scenarios[selected]
    if (!sc) return

    let stepIdx = -1
    const advance = () => {
      stepIdx++
      if (stepIdx >= sc.steps.length) {
        setDone(true)
        setAnimating(false)
        if (selected === 'npm-install') {
          setShowAskDialog(true)
        }
        return
      }

      setActiveStep(stepIdx)
      const step = sc.steps[stepIdx]

      if (step.id === 'classifier') {
        setClassifierProgress(0)
        const start = performance.now()
        const dur = 1800
        const animateBar = (now: number) => {
          const elapsed = now - start
          const t = Math.min(elapsed / dur, 1)
          setClassifierProgress(t * 98)
          if (t < 1) {
            requestAnimationFrame(animateBar)
          } else {
            setTimeout(advance, 500)
          }
        }
        requestAnimationFrame(animateBar)
        return
      }

      const delay = step.id === 'tool-call' ? 600 : step.result === 'DENIED' || step.result === 'ALLOWED' || step.result === 'ASK USER' ? 900 : 800
      setTimeout(advance, delay)
    }

    const timer = setTimeout(advance, 300)
    return () => clearTimeout(timer)
  }, [animating, selected])

  const currentScenario = selected ? scenarios[selected] : null
  const visibleSteps = currentScenario
    ? allSteps.filter((st) => currentScenario.steps.some((cs) => cs.id === st.id))
    : allSteps

  return (
    <DemoBoundary name="Permission Flow">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: s.text2, fontFamily: s.mono }}>Simulate</div>
              <select
                value={selected}
                onChange={(e) => {
                  const v = e.target.value as ScenarioId | ''
                  if (v) simulate(v)
                  else reset()
                }}
                disabled={animating}
                style={{
                  background: s.bg2,
                  border: `1px solid ${s.border}`,
                  borderRadius: 6,
                  color: s.text,
                  fontFamily: s.mono,
                  fontSize: 13,
                  padding: '6px 12px',
                  cursor: animating ? 'not-allowed' : 'pointer',
                  opacity: animating ? 0.6 : 1,
                  outline: 'none',
                }}
              >
                <option value="">Select a scenario...</option>
                {(Object.keys(scenarios) as ScenarioId[]).map((id) => (
                  <option key={id} value={id}>{scenarios[id].label}</option>
                ))}
              </select>
            </div>
            {selected && !animating && (
              <button
                onClick={reset}
                style={{
                  background: s.bg2,
                  border: `1px solid ${s.border}`,
                  borderRadius: 6,
                  color: s.text2,
                  fontFamily: s.mono,
                  fontSize: 12,
                  padding: '5px 12px',
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            )}
          </div>

          <div style={{ padding: '24px 20px 16px' }}>
            {selected && currentScenario && (
              <div style={{
                background: s.bg2,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                padding: '10px 16px',
                marginBottom: 24,
                fontFamily: s.mono,
                fontSize: 14,
                color: s.accent,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <span style={{ color: s.text3, fontSize: 11 }}>$</span>
                {currentScenario.command}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              {visibleSteps.map((step, idx) => {
                const scStep = currentScenario?.steps[idx]
                const isActive = activeStep === idx
                const isComplete = done || activeStep > idx
                const isPending = !animating && !done && activeStep < idx && activeStep !== -1
                const isIdle = activeStep === -1 && !done

                const showResult = isComplete || isActive

                return (
                  <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    {idx > 0 && (
                      <div style={{
                        width: 2,
                        height: 32,
                        background: isComplete ? s.border2 : isActive ? s.accent : s.border,
                        transition: 'background 0.3s ease',
                      }} />
                    )}
                    <div style={{
                      width: '100%',
                      maxWidth: 440,
                      background: isActive ? `${s.accent}15` : isComplete ? `${s.bg2}` : s.bg2,
                      border: `1px solid ${isActive ? s.accent : isComplete ? (scStep?.resultColor || s.border) : s.border}`,
                      borderRadius: 10,
                      padding: '14px 18px',
                      transition: 'all 0.3s ease',
                      opacity: isIdle ? 0.5 : isPending ? 0.4 : 1,
                      position: 'relative',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: isActive ? s.accent : isComplete ? (scStep?.resultColor || s.green) : s.border,
                            transition: 'background 0.3s ease',
                            boxShadow: isActive ? `0 0 8px ${s.accent}60` : 'none',
                          }} />
                          <span style={{
                            fontSize: 14,
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? s.text : isComplete ? s.text : s.text3,
                            fontFamily: s.mono,
                            transition: 'color 0.3s ease',
                          }}>
                            {step.label}
                          </span>
                        </div>
                        {showResult && scStep?.result && (
                          <span style={{
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: s.mono,
                            color: scStep.resultColor || s.text2,
                            background: `${scStep.resultColor || s.text2}18`,
                            padding: '3px 10px',
                            borderRadius: 4,
                            whiteSpace: 'nowrap',
                          }}>
                            {scStep.result}
                          </span>
                        )}
                      </div>
                      {showResult && scStep?.check && step.id !== 'tool-call' && (
                        <div style={{
                          marginTop: 8,
                          fontSize: 12,
                          color: s.text3,
                          fontFamily: s.mono,
                          paddingLeft: 18,
                          lineHeight: 1.4,
                        }}>
                          {scStep.check}
                        </div>
                      )}
                      {isActive && step.id === 'classifier' && (
                        <div style={{ marginTop: 10, paddingLeft: 18 }}>
                          <div style={{
                            height: 6,
                            background: s.bg,
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${classifierProgress}%`,
                              background: `linear-gradient(90deg, ${s.accent}, ${s.green})`,
                              borderRadius: 3,
                              transition: 'width 0.05s linear',
                            }} />
                          </div>
                          <div style={{
                            marginTop: 4,
                            fontSize: 11,
                            color: s.text3,
                            fontFamily: s.mono,
                          }}>
                            {Math.round(classifierProgress)}% confidence
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {done && (
                <div style={{
                  width: 2,
                  height: 24,
                  background: currentScenario?.finalColor || s.border,
                  marginTop: 4,
                }} />
              )}
            </div>

            {done && currentScenario && (
              <div style={{
                marginTop: 20,
                textAlign: 'center',
                animation: 'none',
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: `${currentScenario.finalColor}12`,
                  border: `1px solid ${currentScenario.finalColor}40`,
                  borderRadius: 8,
                  padding: '10px 20px',
                }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: currentScenario.finalColor,
                    boxShadow: `0 0 10px ${currentScenario.finalColor}60`,
                  }} />
                  <span style={{
                    fontFamily: s.mono,
                    fontSize: 14,
                    fontWeight: 700,
                    color: currentScenario.finalColor,
                  }}>
                    {currentScenario.finalOutcome}
                  </span>
                </div>
              </div>
            )}

            {showAskDialog && !askResponse && (
              <div style={{
                marginTop: 20,
                background: s.bg2,
                border: `1px solid ${s.yellow}`,
                borderRadius: 10,
                padding: '16px 18px',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: -10,
                  left: 16,
                  background: s.bg2,
                  border: `1px solid ${s.yellow}`,
                  padding: '0 8px',
                  fontSize: 11,
                  fontFamily: s.mono,
                  color: s.yellow,
                  fontWeight: 600,
                }}>
                  PROMPT
                </div>
                <div style={{
                  fontSize: 13,
                  color: s.text,
                  marginBottom: 14,
                  marginTop: 4,
                  lineHeight: 1.5,
                }}>
                  Claude Code wants to run:
                  <div style={{
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: 6,
                    padding: '8px 12px',
                    marginTop: 8,
                    fontFamily: s.mono,
                    fontSize: 13,
                    color: s.accent,
                  }}>
                    $ npm install lodash
                  </div>
                  <div style={{ marginTop: 10, color: s.text2, fontSize: 12 }}>
                    This will modify your project dependencies.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setAskResponse('deny'); setDone(false) }}
                    style={{
                      background: `${s.red}15`,
                      border: `1px solid ${s.red}50`,
                      borderRadius: 6,
                      color: s.red,
                      fontFamily: s.mono,
                      fontSize: 12,
                      padding: '6px 16px',
                      cursor: 'pointer',
                    }}
                  >
                    Deny
                  </button>
                  <button
                    onClick={() => { setAskResponse('allow'); setDone(false) }}
                    style={{
                      background: `${s.green}15`,
                      border: `1px solid ${s.green}50`,
                      borderRadius: 6,
                      color: s.green,
                      fontFamily: s.mono,
                      fontSize: 12,
                      padding: '6px 16px',
                      cursor: 'pointer',
                    }}
                  >
                    Allow
                  </button>
                </div>
              </div>
            )}

            {askResponse && (
              <div style={{
                marginTop: 20,
                textAlign: 'center',
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: `${askResponse === 'allow' ? s.green : s.red}12`,
                  border: `1px solid ${askResponse === 'allow' ? s.green : s.red}40`,
                  borderRadius: 8,
                  padding: '10px 20px',
                }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: askResponse === 'allow' ? s.green : s.red,
                    boxShadow: `0 0 10px ${askResponse === 'allow' ? s.green : s.red}60`,
                  }} />
                  <span style={{
                    fontFamily: s.mono,
                    fontSize: 14,
                    fontWeight: 700,
                    color: askResponse === 'allow' ? s.green : s.red,
                  }}>
                    {askResponse === 'allow' ? 'ALLOWED' : 'DENIED'} by user
                  </span>
                </div>
              </div>
            )}

            {!selected && (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: s.text3,
                fontSize: 13,
              }}>
                Select a scenario above to visualize the permission flow
              </div>
            )}
          </div>

          <div style={{
            padding: '14px 20px',
            borderTop: `1px solid ${s.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <div style={{ fontSize: 12, color: s.text3, fontFamily: s.mono }}>
              Permission Mode
            </div>
            <div style={{ display: 'flex', gap: 4, background: s.bg, borderRadius: 8, padding: 3, border: `1px solid ${s.border}` }}>
              {modes.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    background: mode === m ? s.accent + '25' : 'transparent',
                    border: mode === m ? `1px solid ${s.accent}50` : '1px solid transparent',
                    borderRadius: 6,
                    color: mode === m ? s.accent : s.text3,
                    fontFamily: s.mono,
                    fontSize: 11,
                    fontWeight: mode === m ? 600 : 400,
                    padding: '4px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {modeLabels[m]}
                </button>
              ))}
            </div>
            <div style={{
              fontSize: 11,
              color: s.text3,
              fontFamily: s.mono,
              maxWidth: 240,
              textAlign: 'right',
              lineHeight: 1.4,
            }}>
              {mode === 'default' && 'Read-only ops auto-approved, writes may prompt'}
              {mode === 'plan' && 'No tool execution, read-only analysis only'}
              {mode === 'bypassPermissions' && 'All operations approved without prompting'}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
