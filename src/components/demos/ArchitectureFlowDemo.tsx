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

const stages = [
  { label: 'User Input', color: s.yellow, detail: 'Commander.js parses CLI args, React/Ink renders TUI' },
  { label: 'CLI Parser', color: s.green, detail: 'Input classified: text, /command, or special mode' },
  { label: 'QueryEngine', color: s.accent, detail: 'One instance per session, manages message history' },
  { label: 'LLM API', color: s.purple, detail: 'Streaming API call with system prompt + tool schemas' },
  { label: 'Tool Execution', color: s.orange, detail: 'Partition into read-only (parallel) and write (serial) batches' },
  { label: 'Terminal UI', color: s.green, detail: 'React/Ink components render streaming output' },
]

const delays = [600, 500, 600, 1200, 800, 800]

const statusText: Record<number, string> = {
  3: 'Thinking...',
  4: 'Executing tools...',
  5: 'Response displayed',
}

export default function ArchitectureFlowDemo() {
  const [step, setStep] = useState(-1)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const start = useCallback(() => {
    if (running) return
    setStep(0)
    setRunning(true)
    setDone(false)
  }, [running])

  useEffect(() => {
    if (step < 0 || step > 5) return
    const t = setTimeout(() => {
      if (step === 5) {
        setDone(true)
        setRunning(false)
      } else {
        setStep(step + 1)
      }
    }, delays[step])
    return () => clearTimeout(t)
  }, [step])

  return (
    <DemoBoundary name="Architecture Pipeline">
      <div style={{
        maxWidth: 820,
        margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 0 20px',
          overflowX: 'auto',
          gap: 4,
        }}>
          {stages.map((st, i) => {
            const active = step === i
            const visited = step > i || done
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  position: 'relative',
                  minWidth: 100,
                  padding: '14px 8px 12px',
                  background: active ? `${st.color}14` : visited ? `${st.color}08` : s.bg2,
                  border: `1.5px solid ${active ? st.color : visited ? `${st.color}50` : s.border}`,
                  borderRadius: 8,
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: active ? `0 0 20px ${st.color}25` : 'none',
                }}>
                  {active && (
                    <div style={{
                      position: 'absolute',
                      top: -7,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: st.color,
                      boxShadow: `0 0 10px ${st.color}`,
                    }} />
                  )}
                  {i === 0 && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'block', margin: '0 auto 4px' }}>
                      <rect x="2" y="3" width="20" height="18" rx="2" stroke={s.yellow} strokeWidth="1.5" />
                      <path d="M7 10l3 3-3 3" stroke={s.yellow} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="13" y1="16" x2="17" y2="16" stroke={s.yellow} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: active ? st.color : visited ? `${st.color}bb` : s.text2,
                    fontFamily: s.mono,
                    transition: 'color 0.3s',
                    whiteSpace: 'nowrap',
                  }}>
                    {st.label}
                  </div>
                  {active && statusText[i] && (
                    <div style={{
                      fontSize: 9,
                      color: st.color,
                      marginTop: 5,
                      fontFamily: s.mono,
                    }}>
                      {statusText[i]}
                    </div>
                  )}
                </div>
                {i < stages.length - 1 && (
                  <svg width="24" height="14" viewBox="0 0 24 14" style={{ flexShrink: 0 }}>
                    <line x1="1" y1="7" x2="17" y2="7"
                      stroke={visited || step > i ? s.accent : s.border}
                      strokeWidth="1.5"
                    />
                    <path d="M15 3l5 4-5 4"
                      stroke={visited || step > i ? s.accent : s.border}
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <button
            onClick={start}
            disabled={running}
            style={{
              padding: '8px 28px',
              background: running ? s.bg3 : s.accent,
              color: running ? s.text3 : '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: running ? 'not-allowed' : 'pointer',
              fontFamily: s.mono,
              transition: 'all 0.2s',
            }}
          >
            {done ? 'Send Again' : running ? 'Processing...' : 'Send Message'}
          </button>
        </div>

        <div style={{
          background: s.bg2,
          border: `1px solid ${step >= 0 ? stages[step].color + '40' : s.border}`,
          borderRadius: 8,
          padding: '14px 18px',
          transition: 'all 0.3s',
          minHeight: 48,
        }}>
          <div style={{
            fontSize: 10,
            color: step >= 0 ? stages[step].color : s.text3,
            fontFamily: s.mono,
            marginBottom: step >= 0 ? 5 : 0,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            transition: 'color 0.3s',
          }}>
            {step >= 0 ? stages[step].label : 'Pipeline Status'}
          </div>
          <div style={{
            fontSize: 13,
            color: step >= 0 ? s.text : s.text3,
            transition: 'color 0.3s',
            lineHeight: 1.5,
          }}>
            {step >= 0
              ? stages[step].detail
              : 'Click "Send Message" to trace a request through the Claude Code pipeline'}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
