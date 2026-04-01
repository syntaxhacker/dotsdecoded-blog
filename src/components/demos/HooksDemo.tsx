import { useState, useEffect, useRef, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

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

const catColor: Record<string, string> = {
  'Agent Lifecycle': s.accent,
  'Per-Turn': s.green,
  'Tool Execution': s.orange,
  'Sub-agents': s.purple,
  Context: s.yellow,
  Permissions: s.red,
}

interface Step {
  name: string
  category: string
  detail: string
  extra?: string
}

const session: Step[] = [
  { name: 'SessionStart', category: 'Agent Lifecycle', detail: 'Claude Code session initialized' },
  { name: 'InstructionsLoaded', category: 'Context', detail: 'CLAUDE.md files loaded', extra: 'project/.claude/CLAUDE.md + ~/.claude/CLAUDE.md' },
  { name: 'UserPromptSubmit', category: 'Per-Turn', detail: 'User message received', extra: '"fix the bug in auth.ts"' },
  { name: 'PreToolUse', category: 'Tool Execution', detail: 'FileRead(auth.ts) — awaiting approval', extra: 'can approve / deny / modify' },
  { name: 'PostToolUse', category: 'Tool Execution', detail: 'FileRead returned 142 lines', extra: 'auth.ts — status: 200' },
  { name: 'PreToolUse', category: 'Tool Execution', detail: 'FileEdit(auth.ts) — awaiting approval', extra: 'can approve / deny / modify' },
  { name: 'PermissionRequest', category: 'Permissions', detail: 'File write access requested', extra: 'auth.ts — awaiting user decision' },
  { name: 'PostToolUse', category: 'Tool Execution', detail: 'FileEdit applied: line 47 patched', extra: 'null guard added to userId' },
  { name: 'SubagentStart', category: 'Sub-agents', detail: 'Explore agent spawned', extra: 'dependency analysis on auth module' },
  { name: 'SubagentStop', category: 'Sub-agents', detail: 'Explore agent returned 3 findings', extra: '2 stale imports, 1 unused variable' },
  { name: 'Stop', category: 'Per-Turn', detail: 'Claude finished responding', extra: '"Fixed the null check on line 47. Also cleaned up 2 stale imports."' },
  { name: 'SessionEnd', category: 'Agent Lifecycle', detail: 'Session complete', extra: '4 tools used, 1 sub-agent, 0 errors' },
]

export default function HooksDemo() {
  const [events, setEvents] = useState<Step[]>([])
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [pulseIdx, setPulseIdx] = useState(-1)
  const logRef = useRef<HTMLDivElement>(null)

  const reset = useCallback(() => {
    setEvents([])
    setStep(0)
    setRunning(false)
    setDone(false)
    setPulseIdx(-1)
  }, [])

  useEffect(() => {
    if (!running || step >= session.length) return

    const timer = setTimeout(() => {
      const next = session[step]
      setEvents((prev) => [...prev, next])
      setPulseIdx(step)
      setTimeout(() => setPulseIdx(-1), 400)
      if (step + 1 >= session.length) {
        setRunning(false)
        setDone(true)
      }
      setStep((prev) => prev + 1)
    }, getStepDelay(700, speed))

    return () => clearTimeout(timer)
  }, [running, step, speed])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [events])

  return (
    <DemoBoundary name="Hooks Lifecycle">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              if (done) reset()
              else if (running) setRunning(false)
              else setRunning(true)
            }}
            style={{
              background: running ? s.bg3 : done ? s.bg3 : s.accent,
              border: `1px solid ${running ? s.border2 : done ? s.border : s.accent}`,
              borderRadius: 8,
              padding: '8px 20px',
              color: running ? s.text2 : done ? s.text2 : '#fff',
              fontFamily: s.mono,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              letterSpacing: 0.3,
            }}
          >
            {done ? 'Reset' : running ? 'Pause' : events.length > 0 ? 'Resume' : 'Run Session'}
          </button>

          <SpeedController speed={speed} onSpeedChange={setSpeed} />

          <div style={{ marginLeft: 'auto', fontFamily: s.mono, fontSize: 12, color: s.text3 }}>
            {events.length}/{session.length} hooks fired
          </div>
        </div>

        <div
          ref={logRef}
          style={{
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 10,
            padding: '2px 0',
            maxHeight: 480,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {events.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: s.text3, fontSize: 13 }}>
              Click "Run Session" to watch Claude Code hooks fire in real time
            </div>
          )}

          {events.map((evt, idx) => {
            const cc = catColor[evt.category] || s.text2
            const isPulse = idx === pulseIdx
            const isFirst = idx === 0
            const ts = `00:${String(idx + 1).padStart(2, '0')}`

            return (
              <div
                key={idx}
                style={{
                  padding: '10px 20px',
                  borderTop: isFirst ? 'none' : `1px solid ${s.border}`,
                  background: isPulse ? `${cc}11` : 'transparent',
                  transition: 'background 0.3s',
                  opacity: isPulse ? 1 : 0.95,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                  <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, minWidth: 40 }}>{ts}</span>
                  <span
                    style={{
                      fontFamily: s.mono,
                      fontSize: 11,
                      fontWeight: 600,
                      color: cc,
                      background: `${cc}18`,
                      border: `1px solid ${cc}30`,
                      borderRadius: 4,
                      padding: '1px 7px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {evt.name}
                  </span>
                  <span style={{ fontSize: 11, color: s.text3 }}>{evt.category}</span>
                </div>
                <div style={{ paddingLeft: 50, marginBottom: evt.extra ? 2 : 0 }}>
                  <span style={{ fontSize: 13, color: s.text }}>{evt.detail}</span>
                </div>
                {evt.extra && (
                  <div style={{ paddingLeft: 50 }}>
                    <span style={{ fontSize: 12, color: s.text2, fontFamily: s.mono }}>{evt.extra}</span>
                  </div>
                )}
                {(evt.name === 'PreToolUse') && (
                  <div style={{ paddingLeft: 50, marginTop: 4, display: 'flex', gap: 6 }}>
                    {['approve', 'deny', 'modify'].map((action) => (
                      <span
                        key={action}
                        style={{
                          fontFamily: s.mono,
                          fontSize: 10,
                          color: action === 'approve' ? s.green : action === 'deny' ? s.red : s.yellow,
                          background: action === 'approve' ? `${s.green}15` : action === 'deny' ? `${s.red}15` : `${s.yellow}15`,
                          border: `1px solid ${action === 'approve' ? `${s.green}30` : action === 'deny' ? `${s.red}30` : `${s.yellow}30`}`,
                          borderRadius: 4,
                          padding: '1px 6px',
                        }}
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {Object.entries(catColor).map(([cat, col]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: col }} />
              <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </DemoBoundary>
  )
}
