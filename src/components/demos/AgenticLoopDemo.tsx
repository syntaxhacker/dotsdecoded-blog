import { useState, useEffect, useCallback, useRef } from 'react'
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

type StepId = 'send' | 'stream' | 'collect' | 'check' | 'execute' | 'append' | 'loop'

interface StepDef {
  id: StepId
  label: string
  color: string
  num: number
}

const STEPS: StepDef[] = [
  { id: 'send', label: 'Send messages to API', color: s.accent, num: 1 },
  { id: 'stream', label: 'Stream response', color: s.purple, num: 2 },
  { id: 'collect', label: 'Collect tool_use blocks', color: s.orange, num: 3 },
  { id: 'check', label: 'Any tool calls?', color: s.yellow, num: 4 },
  { id: 'execute', label: 'Execute tools', color: s.orange, num: 5 },
  { id: 'append', label: 'Append results', color: s.green, num: 6 },
  { id: 'loop', label: 'Continue loop', color: s.accent, num: 7 },
]

interface TurnEvent {
  step: StepId
  detail: string
  tools?: string[]
  response?: string
  isDone?: boolean
}

interface IterationDef {
  events: TurnEvent[]
  label: string
}

function buildIterations(): IterationDef[] {
  return [
    {
      label: 'Simple question',
      events: [
        { step: 'send', detail: 'System prompt + user question sent' },
        { step: 'stream', detail: 'SSE: content_block_delta events streaming in...', response: 'Claude responds with text' },
        { step: 'collect', detail: 'No tool_use blocks found' },
        { step: 'check', detail: 'No tool calls -- loop ends', isDone: true },
      ],
    },
    {
      label: 'Multi-step task',
      events: [
        { step: 'send', detail: 'System prompt + conversation history sent' },
        { step: 'stream', detail: 'SSE: parsing tool_use block...', tools: ['FileRead(src/index.ts)'] },
        { step: 'collect', detail: 'Found 1 tool call: FileRead' },
        { step: 'check', detail: 'Yes -- proceeding to execute' },
        { step: 'execute', detail: 'Running 1 tool (serial batch)...', tools: ['FileRead'] },
        { step: 'append', detail: 'tool_result content blocks appended' },
        { step: 'loop', detail: 'Restarting loop with updated context...' },
        { step: 'send', detail: 'System prompt + conversation history (now includes tool results)' },
        { step: 'stream', detail: 'SSE: parsing tool_use block...', tools: ['FileEdit(src/index.ts)'] },
        { step: 'collect', detail: 'Found 1 tool call: FileEdit' },
        { step: 'check', detail: 'Yes -- proceeding to execute' },
        { step: 'execute', detail: 'Running 1 tool (serial batch)...', tools: ['FileEdit'] },
        { step: 'append', detail: 'tool_result content blocks appended' },
        { step: 'loop', detail: 'Restarting loop with updated context...' },
        { step: 'send', detail: 'System prompt + full conversation history' },
        { step: 'stream', detail: 'SSE: final text response...', response: 'Claude is done' },
        { step: 'collect', detail: 'No tool_use blocks found' },
        { step: 'check', detail: 'No tool calls -- loop ends', isDone: true },
      ],
    },
    {
      label: 'Parallel tool calls',
      events: [
        { step: 'send', detail: 'System prompt + user request sent' },
        { step: 'stream', detail: 'SSE: 3 tool_use blocks in single response', tools: ['FileRead(a.ts)', 'FileRead(b.ts)', 'FileRead(c.ts)'] },
        { step: 'collect', detail: 'Found 3 tool calls -- can run in parallel' },
        { step: 'check', detail: 'Yes -- partitioning into batches' },
        { step: 'execute', detail: 'Batch 1: running 3 tools in parallel...', tools: ['FileRead(a.ts)', 'FileRead(b.ts)', 'FileRead(c.ts)'] },
        { step: 'append', detail: '3 tool_result blocks appended' },
        { step: 'loop', detail: 'Restarting loop with updated context...' },
        { step: 'send', detail: 'System prompt + conversation history' },
        { step: 'stream', detail: 'SSE: final text response...', response: 'Claude is done' },
        { step: 'collect', detail: 'No tool_use blocks found' },
        { step: 'check', detail: 'No tool calls -- loop ends', isDone: true },
      ],
    },
  ]
}

const STEP_DELAY = 800

export default function AgenticLoopDemo() {
  const [iteration, setIteration] = useState(-1)
  const [eventIdx, setEventIdx] = useState(-1)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [turnCount, setTurnCount] = useState(0)
  const [toolCount, setToolCount] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const logEndRef = useRef<HTMLDivElement>(null)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const addLog = useCallback((msg: string) => {
    setLog(prev => [...prev, msg])
  }, [])

  const sleep = useCallback((ms: number) => {
    return new Promise<void>(resolve => {
      const t = setTimeout(resolve, ms)
      timersRef.current.push(t)
    })
  }, [])

  const activeEvent = iteration >= 0 && eventIdx >= 0
    ? buildIterations()[iteration]?.events[eventIdx] ?? null
    : null

  const currentStepId = activeEvent?.step ?? null

  useEffect(() => {
    if (logEndRef.current) {
      const container = logEndRef.current.closest('.agentic-loop-log')
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  }, [log])

  const handleRun = useCallback(async () => {
    clearTimers()
    setRunning(true)
    setFinished(false)
    setIteration(-1)
    setEventIdx(-1)
    setLog([])
    setTurnCount(0)
    setToolCount(0)

    const iterations = buildIterations()
    let tc = 0
    let tlc = 0

    for (let it = 0; it < iterations.length; it++) {
      setIteration(it)
      addLog(`--- Iteration ${it + 1}: ${iterations[it].label} ---`)
      await sleep(400)

      for (let ev = 0; ev < iterations[it].events.length; ev++) {
        const event = iterations[it].events[ev]
        setEventIdx(ev)
        addLog(`[${STEPS.find(st => st.id === event.step)?.num}] ${event.detail}`)

        if (event.step === 'send') tlc++
        if (event.step === 'execute' && event.tools) tc += event.tools.length
        if (event.step === 'loop') tlc++

        setTurnCount(tlc)
        setToolCount(tc)

        await sleep(STEP_DELAY)
      }

      await sleep(600)
    }

    setFinished(true)
    setRunning(false)
    addLog('All iterations complete.')
  }, [clearTimers, addLog, sleep])

  const handleReset = () => {
    clearTimers()
    setRunning(false)
    setFinished(false)
    setIteration(-1)
    setEventIdx(-1)
    setLog([])
    setTurnCount(0)
    setToolCount(0)
  }

  const getStepState = (stepId: StepId): 'active' | 'done' | 'idle' => {
    if (!activeEvent) return 'idle'
    if (activeEvent.step === stepId) return 'active'
    if (eventIdx < 0 || iteration < 0) return 'idle'
    const events = buildIterations()[iteration].events
    for (let i = 0; i < eventIdx; i++) {
      if (events[i].step === stepId) return 'done'
    }
    return 'idle'
  }

  return (
    <DemoBoundary name="Agentic Loop">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <style>{`
          @keyframes alPulse {
            0%, 100% { box-shadow: 0 0 0 0 var(--pc); }
            50% { box-shadow: 0 0 14px 3px var(--pc); }
          }
          @keyframes alFadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div style={{ background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>

          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${s.border}`, background: s.bg2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Turns</span>
                <span style={{ fontFamily: s.mono, fontSize: 18, fontWeight: 700, color: s.accent }}>{turnCount}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tool calls</span>
                <span style={{ fontFamily: s.mono, fontSize: 18, fontWeight: 700, color: s.orange }}>{toolCount}</span>
              </div>
            </div>
            {iteration >= 0 && (
              <div style={{
                fontFamily: s.mono, fontSize: 12, fontWeight: 700, color: s.text2,
                padding: '4px 10px', borderRadius: 6, background: s.bg, border: `1px solid ${s.border}`,
              }}>
                Iteration {iteration + 1} / {buildIterations().length}
              </div>
            )}
          </div>

          <div style={{ padding: '20px 20px 12px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {STEPS.map((step, idx) => {
                const state = getStepState(step.id)
                const isActive = state === 'active'
                const isDone = state === 'done'
                return (
                  <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 12px', borderRadius: 7,
                        border: `1px solid ${isActive ? step.color : isDone ? `${step.color}44` : s.border}`,
                        background: isActive ? `${step.color}14` : isDone ? `${step.color}08` : s.bg2,
                        transition: 'all 0.35s ease',
                        ...(isActive ? { ['--pc' as string]: `${step.color}44`, animation: 'alPulse 1.8s ease infinite' } : {}),
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: s.mono, fontSize: 11, fontWeight: 700,
                        background: isActive ? step.color : isDone ? `${step.color}33` : s.bg3,
                        color: isActive ? '#fff' : isDone ? step.color : s.text3,
                        transition: 'all 0.3s',
                        flexShrink: 0,
                      }}>
                        {isDone && !isActive ? '\u2713' : step.num}
                      </div>
                      <div style={{
                        fontSize: 12, fontWeight: 600, lineHeight: 1.2,
                        color: isActive ? step.color : isDone ? s.text2 : s.text3,
                        transition: 'color 0.3s',
                      }}>
                        {step.label}
                      </div>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div style={{
                        margin: '0 2px', color: isDone ? s.text3 : s.border, fontSize: 14, fontWeight: 700, flexShrink: 0,
                        transition: 'color 0.3s',
                      }}>
                        {step.id === 'check' && getStepState('check') !== 'idle' ? (
                          activeEvent?.step === 'check' && activeEvent.isDone ? '\u2198' : '\u2193'
                        ) : '\u2192'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {activeEvent && (
            <div style={{ padding: '0 20px 12px' }}>
              <div style={{
                background: s.bg2, borderRadius: 8, border: `1px solid ${s[STEPS.find(st => st.id === currentStepId)?.num === 4 ? 'yellow' : 'accent'] as string}33`,
                padding: 14, opacity: 0, animation: 'alFadeIn 0.35s ease forwards',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: STEPS.find(st => st.id === currentStepId)?.color ?? s.text3 }}>
                    Step {STEPS.find(st => st.id === currentStepId)?.num}: {STEPS.find(st => st.id === currentStepId)?.label}
                  </span>
                  {activeEvent.isDone && (
                    <span style={{ fontFamily: s.mono, fontSize: 11, color: s.green, fontWeight: 600 }}>
                      LOOP COMPLETE
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: s.mono, fontSize: 13, color: s.text2, lineHeight: 1.5 }}>
                  {activeEvent.detail}
                </div>
                {activeEvent.response && (
                  <div style={{
                    marginTop: 8, padding: '8px 12px', borderRadius: 6,
                    background: `${s.green}10`, border: `1px solid ${s.green}33`,
                    fontFamily: s.mono, fontSize: 13, color: s.green, fontWeight: 600,
                  }}>
                    {activeEvent.response}
                  </div>
                )}
                {activeEvent.tools && activeEvent.tools.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {activeEvent.tools.map((tool, i) => (
                      <span key={i} style={{
                        fontFamily: s.mono, fontSize: 11, padding: '3px 8px', borderRadius: 4,
                        background: `${s.orange}14`, border: `1px solid ${s.orange}33`, color: s.orange,
                      }}>
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

            <div style={{ padding: '0 20px 12px' }}>
            <div className="agentic-loop-log" style={{
              background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`,
              padding: '10px 14px', maxHeight: 160, overflowY: 'auto',
            }}>
              {log.length === 0 ? (
                <div style={{ fontFamily: s.mono, fontSize: 12, color: s.text3 }}>Press Run Loop to start the agentic loop simulation...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {log.map((line, i) => {
                    const isHeader = line.startsWith('---')
                    const isComplete = line === 'All iterations complete.'
                    return (
                      <div key={i} style={{
                        fontFamily: s.mono, fontSize: 12, lineHeight: 1.5,
                        color: isComplete ? s.green : isHeader ? s.accent : s.text2,
                        fontWeight: isHeader ? 700 : 400,
                        opacity: 0, animation: 'alFadeIn 0.25s ease forwards',
                      }}>
                        {line}
                      </div>
                    )
                  })}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '12px 20px 20px', display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={handleRun}
              disabled={running}
              style={{
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: 13, fontWeight: 600, padding: '8px 28px', borderRadius: 6,
                border: `1px solid ${running ? s.border : s.accent}`,
                background: running ? s.bg2 : s.accent,
                color: running ? s.text3 : '#fff',
                cursor: running ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {running ? 'Running...' : 'Run Loop'}
            </button>
            <button
              onClick={handleReset}
              disabled={running}
              style={{
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: 13, fontWeight: 600, padding: '8px 28px', borderRadius: 6,
                border: `1px solid ${s.border}`,
                background: s.bg2, color: running ? s.text3 : s.text2,
                cursor: running ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
