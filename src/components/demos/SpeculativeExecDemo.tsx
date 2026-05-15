import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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

interface Instr {
  text: string
}

interface Scenario {
  name: string
  desc: string
  program: Instr[]
  branchIdx: number
  takenTarget: number
  notTakenTarget: number
  actualTaken: boolean
}

const SCENARIOS: Scenario[] = [
  {
    name: 'Correctly Predicted',
    desc: 'Prediction matches actual branch direction. Zero wasted cycles.',
    program: [
      { text: 'load r1, [x]' },
      { text: 'cmp r1, 0' },
      { text: 'jg 0x18' },
      { text: 'sub r2, 1' },
      { text: 'store [z], r2' },
      { text: 'jmp 0x24' },
      { text: 'add r2, 5' },
      { text: 'store [y], r2' },
      { text: 'ret' },
    ],
    branchIdx: 2,
    takenTarget: 6,
    notTakenTarget: 3,
    actualTaken: true,
  },
  {
    name: 'Mispredicted',
    desc: 'Prediction was wrong. Pipeline flushes, wasted cycles.',
    program: [
      { text: 'load r1, [x]' },
      { text: 'cmp r1, 0' },
      { text: 'jg 0x1C' },
      { text: 'sub r2, 1' },
      { text: 'store [z], r2' },
      { text: 'jmp 0x28' },
      { text: 'add r2, 5' },
      { text: 'store [y], r2' },
      { text: 'add r3, r2, 1' },
      { text: 'ret' },
    ],
    branchIdx: 2,
    takenTarget: 6,
    notTakenTarget: 3,
    actualTaken: false,
  },
  {
    name: 'Correctly Predicted (Complex)',
    desc: 'Nested branches, all correctly predicted. Deep speculation.',
    program: [
      { text: 'load r1, [x]' },
      { text: 'cmp r1, 0' },
      { text: 'jg 0x1C' },
      { text: 'sub r2, 1' },
      { text: 'store [z], r2' },
      { text: 'jmp 0x38' },
      { text: 'load r3, [flag]' },
      { text: 'cmp r3, 1' },
      { text: 'jg 0x34' },
      { text: 'call cleanup' },
      { text: 'jmp 0x38' },
      { text: 'call process' },
      { text: 'mul r4, r3, 2' },
      { text: 'ret' },
    ],
    branchIdx: 2,
    takenTarget: 6,
    notTakenTarget: 3,
    actualTaken: true,
  },
]

const STAGE_LABELS = ['Fetch', 'Decode', 'Execute', 'Writeback']

interface PipeSlot {
  idx: number
  spec: boolean
}

interface SimStep {
  cycle: number
  pipe: (PipeSlot | null)[]
  completed: number[]
  fetchTarget: number
  branchJustResolved: boolean
  mispredictNow: boolean
  flushNow: boolean
  flushIndices: number[]
  correctNow: boolean
  done: boolean
}

function simulate(scenario: Scenario, predictTaken: boolean): SimStep[] {
  const { program, branchIdx, takenTarget, notTakenTarget, actualTaken } = scenario
  const steps: SimStep[] = []
  let pipe: (PipeSlot | null)[] = [null, null, null, null]
  let fetchPtr = 0
  let completed: number[] = []
  let cyclesSinceBranch = -1
  let branchResolved = false
  let flushPending = false
  let afterFlushTarget = -1

  for (let cycle = 0; cycle < 40; cycle++) {
    steps.push({
      cycle,
      pipe: pipe.map(p => p ? { ...p } : null),
      completed: [...completed],
      fetchTarget: fetchPtr < program.length ? fetchPtr : -1,
      branchJustResolved: false,
      mispredictNow: false,
      flushNow: false,
      flushIndices: [],
      correctNow: false,
      done: false,
    })

    if (fetchPtr >= program.length && pipe.every(p => p === null)) {
      steps[steps.length - 1].done = true
      break
    }

    if (pipe[3] !== null) {
      completed.push(pipe[3].idx)
    }

    pipe = [null, pipe[0], pipe[1], pipe[2]]

    if (cyclesSinceBranch >= 0) cyclesSinceBranch++

    if (cyclesSinceBranch === 2 && !branchResolved) {
      branchResolved = true
      steps[steps.length - 1].branchJustResolved = true
      const correctPrediction = predictTaken === actualTaken

      if (correctPrediction) {
        steps[steps.length - 1].correctNow = true
        for (let i = 0; i < pipe.length; i++) {
          if (pipe[i] !== null) pipe[i] = { ...pipe[i], spec: false }
        }
      } else {
        steps[steps.length - 1].mispredictNow = true
        steps[steps.length - 1].flushNow = true
        const flushed: number[] = []
        for (let i = 0; i < pipe.length; i++) {
          if (pipe[i] !== null && pipe[i].spec) {
            flushed.push(pipe[i].idx)
            pipe[i] = null
          }
        }
        steps[steps.length - 1].flushIndices = flushed
        flushPending = true
        afterFlushTarget = actualTaken ? takenTarget : notTakenTarget
      }
    }

    if (flushPending) {
      flushPending = false
      const target = afterFlushTarget
      if (target < program.length) {
        pipe[0] = { idx: target, spec: false }
        fetchPtr = target + 1
      }
    } else if (fetchPtr < program.length) {
      const target = fetchPtr
      pipe[0] = { idx: target, spec: cyclesSinceBranch >= 0 && !branchResolved }

      if (target === branchIdx && cyclesSinceBranch < 0) {
        cyclesSinceBranch = 0
        fetchPtr = predictTaken ? takenTarget : notTakenTarget
      } else {
        fetchPtr++
      }
    }
  }

  return steps
}

export default function SpeculativeExecDemo() {
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [predictTaken, setPredictTaken] = useState(true)
  const [stepIdx, setStepIdx] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [autoScenario, setAutoScenario] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scenario = SCENARIOS[scenarioIdx]

  const steps = useMemo(() => simulate(scenario, predictTaken), [scenario, predictTaken])

  const totalCycles = steps.length > 0 ? steps[steps.length - 1].cycle + 1 : 0
  const mispredictStep = steps.find(st => st.mispredictNow)
  const wastedCycles = mispredictStep ? totalCycles - mispredictStep.cycle : 0
  const usefulCycles = totalCycles - wastedCycles

  const current = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null

  const advance = useCallback(() => {
    setStepIdx(prev => {
      const next = prev + 1
      if (next >= steps.length) {
        setFinished(true)
        setPlaying(false)
        return prev
      }
      return next
    })
  }, [steps.length])

  const startExec = useCallback(() => {
    setStepIdx(0)
    setFinished(false)
    setPlaying(false)
  }, [])

  const reset = useCallback(() => {
    setStepIdx(-1)
    setFinished(false)
    setPlaying(false)
    setAutoScenario(false)
  }, [])

  const togglePlay = useCallback(() => {
    if (stepIdx < 0) {
      setStepIdx(0)
      setFinished(false)
    }
    setPlaying(prev => !prev)
  }, [stepIdx])

  useEffect(() => {
    if (!playing || stepIdx < 0 || finished) return
    intervalRef.current = setTimeout(() => {
      advance()
    }, getStepDelay(400, speed))
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current)
    }
  }, [playing, stepIdx, finished, speed, advance])

  useEffect(() => {
    if (autoScenario && finished) {
      const t = setTimeout(() => {
        setScenarioIdx(prev => (prev + 1) % SCENARIOS.length)
        setStepIdx(0)
        setFinished(false)
      }, 1200)
      return () => clearTimeout(t)
    }
  }, [autoScenario, finished])

  const pipeBoxStyle = (stageIdx: number): React.CSSProperties => ({
    background: s.bg,
    border: `1px solid ${s.border}`,
    borderRadius: 8,
    padding: '8px 6px',
    textAlign: 'center',
    flex: 1,
    minWidth: 0,
    transition: 'all 0.25s',
    position: 'relative',
  })

  const instrStyle = (idx: number | null, spec: boolean, flushing: boolean): React.CSSProperties => {
    if (idx === null) {
      return { color: s.text3, fontSize: 11, fontFamily: s.mono }
    }
    let bg = 'transparent'
    let brd = 'transparent'
    let tx = s.text
    if (flushing) {
      bg = `${s.red}25`
      brd = s.red
      tx = s.red
    } else if (spec) {
      bg = `${s.yellow}20`
      brd = s.yellow
      tx = s.yellow
    } else {
      bg = `${s.green}15`
      brd = s.green
      tx = s.green
    }
    return {
      background: bg,
      border: `1px solid ${brd}`,
      borderRadius: 4,
      padding: '4px 6px',
      color: tx,
      fontFamily: s.mono,
      fontSize: 11,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      transition: 'all 0.3s',
    }
  }

  return (
    <DemoBoundary name="Speculative Execution">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Speculative Execution Explorer</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          A CPU guesses branch directions and executes speculatively. If wrong, the pipeline flushes and execution restarts on the correct path.
        </p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {SCENARIOS.map((sc, i) => (
            <button key={sc.name} onClick={() => { setScenarioIdx(i); reset() }} style={{
              background: scenarioIdx === i ? s.accent : s.bg3,
              border: `1px solid ${scenarioIdx === i ? s.accent : s.border}`,
              borderRadius: 8, padding: '7px 14px',
              color: scenarioIdx === i ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 12, fontWeight: scenarioIdx === i ? 600 : 400,
              transition: 'all 0.2s',
            }}>{sc.name}</button>
          ))}
        </div>

        <div style={{ background: s.bg, borderRadius: 8, padding: '10px 14px', marginBottom: 16, border: `1px solid ${s.border}`, color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
          {scenario.desc}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Actual Program Flow</div>
          <div style={{ background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
            {scenario.program.map((instr, i) => {
              const isBranch = i === scenario.branchIdx
              const completed = current ? current.completed.includes(i) : false
              const inPipe = current ? current.pipe.some(p => p !== null && p.idx === i) : false
              const isSpec = current ? current.pipe.some(p => p !== null && p.idx === i && p.spec) : false
              const isFetched = current ? current.fetchTarget === i : false
              const isFlushing = current ? current.flushIndices.includes(i) : false
              const onActualPath = (i <= scenario.branchIdx) ||
                (scenario.actualTaken && i >= scenario.takenTarget && (scenario.notTakenTarget < 0 || i < scenario.notTakenTarget)) ||
                (!scenario.actualTaken && i >= scenario.notTakenTarget && (scenario.takenTarget < 0 || i < scenario.takenTarget))
              let bgColor = 'transparent'
              let leftAccent = 'transparent'
              if (completed) {
                bgColor = `${s.green}10`
                leftAccent = s.green
              } else if (isFlushing) {
                bgColor = `${s.red}15`
                leftAccent = s.red
              } else if (isSpec) {
                bgColor = `${s.yellow}12`
                leftAccent = s.yellow
              } else if (inPipe || isFetched) {
                bgColor = `${s.accent}10`
                leftAccent = s.accent
              }
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '5px 12px', background: bgColor,
                  borderLeft: `3px solid ${leftAccent}`,
                  transition: 'all 0.3s',
                  opacity: (!onActualPath && !isSpec && !completed && !inPipe && !isFlushing) ? 0.35 : 1,
                }}>
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 10, minWidth: 40 }}>
                    {`0x${(i * 4).toString(16).padStart(2, '0')}`}
                  </span>
                  <span style={{ color: s.text, fontFamily: s.mono, fontSize: 12, flex: 1 }}>
                    {instr.text}
                  </span>
                  {isBranch && <span style={{ color: s.orange, fontSize: 10, fontFamily: s.mono, fontWeight: 600 }}>BRANCH</span>}
                  {isSpec && <span style={{ color: s.yellow, fontSize: 10, fontFamily: s.mono, fontWeight: 600 }}>SPEC</span>}
                  {isFlushing && <span style={{ color: s.red, fontSize: 10, fontFamily: s.mono, fontWeight: 600 }}>FLUSHED</span>}
                  {completed && <span style={{ color: s.green, fontSize: 10, fontFamily: s.mono, fontWeight: 600 }}>DONE</span>}
                  {isFetched && stepIdx >= 0 && !inPipe && <span style={{ color: s.accent, fontSize: 10, fontFamily: s.mono, fontWeight: 600 }}>FETCH</span>}
                  {!onActualPath && !isSpec && !isFlushing && !completed && i > scenario.branchIdx && (
                    <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>alt</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {current && !current.done && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Pipeline State (Cycle {current.cycle})
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {current.pipe.map((slot, stageIdx) => (
                  <div key={stageIdx} style={pipeBoxStyle(stageIdx)}>
                    <div style={{ color: s.text3, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                      {STAGE_LABELS[stageIdx]}
                    </div>
                    {slot !== null ? (
                      <div style={instrStyle(slot.idx, slot.spec, false)}>
                        {scenario.program[slot.idx].text}
                      </div>
                    ) : (
                      <div style={instrStyle(null, false, false)}>—</div>
                    )}
                    {slot !== null && slot.spec && (
                      <div style={{ color: s.yellow, fontSize: 9, fontFamily: s.mono, marginTop: 3, fontWeight: 600 }}>speculative</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {current.flushNow && (
              <div style={{
                background: `${s.red}15`,
                border: `1px solid ${s.red}`,
                borderRadius: 8, padding: '10px 16px',
                marginBottom: 16, textAlign: 'center',
                animation: 'none',
              }}>
                <div style={{ color: s.red, fontSize: 18, fontWeight: 700, fontFamily: s.mono, letterSpacing: 1 }}>
                  MISPREDICT!
                </div>
                <div style={{ color: s.text2, fontSize: 12, marginTop: 4 }}>
                  Pipeline flushed — {current.flushIndices.length} instruction{current.flushIndices.length > 1 ? 's' : ''} discarded. Restarting on correct path...
                </div>
              </div>
            )}

            {current.branchJustResolved && current.correctNow && (
              <div style={{
                background: `${s.green}15`,
                border: `1px solid ${s.green}`,
                borderRadius: 8, padding: '8px 16px',
                marginBottom: 16, textAlign: 'center',
              }}>
                <div style={{ color: s.green, fontSize: 14, fontWeight: 700, fontFamily: s.mono }}>
                  Prediction Correct
                </div>
              </div>
            )}
          </>
        )}

        {current && current.done && (
          <div style={{
            background: `${s.green}10`,
            border: `1px solid ${s.green}`,
            borderRadius: 8, padding: '12px 16px',
            marginBottom: 16, textAlign: 'center',
          }}>
            <div style={{ color: s.green, fontSize: 14, fontWeight: 700, fontFamily: s.mono }}>
              Execution Complete
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: '10px 14px', textAlign: 'center', border: `1px solid ${s.border}` }}>
            <div style={{ color: s.text, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{totalCycles}</div>
            <div style={{ color: s.text3, fontSize: 11, marginTop: 2 }}>Total Cycles</div>
          </div>
          <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: '10px 14px', textAlign: 'center', border: `1px solid ${s.border}` }}>
            <div style={{ color: s.green, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{usefulCycles}</div>
            <div style={{ color: s.text3, fontSize: 11, marginTop: 2 }}>Useful Cycles</div>
          </div>
          <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: '10px 14px', textAlign: 'center', border: `1px solid ${s.border}` }}>
            <div style={{ color: wastedCycles > 0 ? s.red : s.text, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{wastedCycles}</div>
            <div style={{ color: s.text3, fontSize: 11, marginTop: 2 }}>Wasted Cycles</div>
          </div>
          <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: '10px 14px', textAlign: 'center', border: `1px solid ${s.border}` }}>
            <div style={{ color: s.accent, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{(usefulCycles / Math.max(totalCycles, 1) * 100).toFixed(0)}%</div>
            <div style={{ color: s.text3, fontSize: 11, marginTop: 2 }}>Efficiency</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setPredictTaken(true); reset() }} style={{
            background: predictTaken ? s.accent : s.bg3,
            border: `1px solid ${predictTaken ? s.accent : s.border}`,
            borderRadius: 8, padding: '8px 16px',
            color: predictTaken ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 12, fontWeight: predictTaken ? 600 : 400,
            transition: 'all 0.2s',
          }}>Predict Taken</button>
          <button onClick={() => { setPredictTaken(false); reset() }} style={{
            background: !predictTaken ? s.accent : s.bg3,
            border: `1px solid ${!predictTaken ? s.accent : s.border}`,
            borderRadius: 8, padding: '8px 16px',
            color: !predictTaken ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 12, fontWeight: !predictTaken ? 600 : 400,
            transition: 'all 0.2s',
          }}>Predict Not Taken</button>
          <div style={{ width: 1, height: 24, background: s.border }} />
          <button onClick={startExec} disabled={stepIdx >= 0 && !finished} style={{
            background: s.green, border: 'none', borderRadius: 8, padding: '8px 20px',
            color: '#fff', cursor: stepIdx >= 0 && !finished ? 'not-allowed' : 'pointer',
            fontSize: 12, fontWeight: 600, opacity: stepIdx >= 0 && !finished ? 0.5 : 1,
            transition: 'all 0.2s',
          }}>Execute</button>
          <button onClick={togglePlay} disabled={stepIdx < 0} style={{
            background: playing ? s.yellow : s.accent, border: 'none', borderRadius: 8,
            padding: '8px 16px', color: '#fff', cursor: stepIdx < 0 ? 'not-allowed' : 'pointer',
            fontSize: 12, fontWeight: 600, opacity: stepIdx < 0 ? 0.5 : 1,
            transition: 'all 0.2s',
          }}>{playing ? 'Pause' : finished ? 'Replay' : 'Step'}</button>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: '8px 14px', color: s.text2, cursor: 'pointer', fontSize: 12,
            transition: 'all 0.2s',
          }}>Reset</button>
          <div style={{ width: 1, height: 24, background: s.border }} />
          <button onClick={() => setAutoScenario(!autoScenario)} style={{
            background: autoScenario ? s.purple : s.bg3,
            border: `1px solid ${autoScenario ? s.purple : s.border}`,
            borderRadius: 8, padding: '8px 14px',
            color: autoScenario ? '#fff' : s.text2, cursor: 'pointer', fontSize: 12,
            fontWeight: autoScenario ? 600 : 400, transition: 'all 0.2s',
          }}>Auto-Play</button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: `${s.green}30`, border: `1px solid ${s.green}` }} />
            <span style={{ color: s.text3, fontSize: 11 }}>Actual Path</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: `${s.yellow}30`, border: `1px solid ${s.yellow}` }} />
            <span style={{ color: s.text3, fontSize: 11 }}>Speculative</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: `${s.red}30`, border: `1px solid ${s.red}` }} />
            <span style={{ color: s.text3, fontSize: 11 }}>Flushed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: `${s.accent}30`, border: `1px solid ${s.accent}` }} />
            <span style={{ color: s.text3, fontSize: 11 }}>In Pipeline</span>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
