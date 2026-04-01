import { useState, useCallback, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const CONTEXT_SIZE = 200000
const COMPACT_THRESHOLD = 187000
const SYSTEM_TOKENS = 5000
const SUMMARY_TOKENS = 2000
const BUDGET_LIMIT = 2000
const BUDGET_TRUNC = 500

type MsgType = 'system' | 'user' | 'assistant' | 'tool_call' | 'tool_result'

interface Message {
  id: number
  type: MsgType
  tokens: number
  truncated: boolean
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function genMessages(count: number, startId: number): Message[] {
  return Array.from({ length: count }, (_, i) => {
    const r = Math.random()
    let type: MsgType
    let tokens: number
    if (r < 0.15) { type = 'user'; tokens = rand(100, 500) }
    else if (r < 0.30) { type = 'assistant'; tokens = rand(100, 800) }
    else if (r < 0.50) { type = 'tool_call'; tokens = rand(200, 1500) }
    else { type = 'tool_result'; tokens = rand(1000, 5000) }
    return { id: startId + i, type, tokens, truncated: false }
  })
}

function computeDisplayTokens(msgs: Message[], budget: boolean): Message[] {
  if (!budget) return msgs.map(m => ({ ...m, truncated: false }))
  return msgs.map(m => {
    if (m.type === 'tool_result' && m.tokens > BUDGET_LIMIT) {
      return { ...m, tokens: BUDGET_TRUNC, truncated: true }
    }
    return { ...m, truncated: false }
  })
}

function computeTotal(msgs: Message[], budget: boolean): number {
  return msgs.reduce((sum, m) => {
    if (budget && m.type === 'tool_result' && m.tokens > BUDGET_LIMIT) return sum + BUDGET_TRUNC
    return sum + m.tokens
  }, 0)
}

const typeColor: Record<MsgType, string> = {
  system: s.purple, user: s.green, assistant: s.accent,
  tool_call: s.orange, tool_result: s.yellow,
}

const typeLabel: Record<MsgType, string> = {
  system: 'System Prompt', user: 'User', assistant: 'Assistant',
  tool_call: 'Tool Call', tool_result: 'Tool Result',
}

export default function ContextWindowDemo() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, type: 'system', tokens: SYSTEM_TOKENS, truncated: false },
  ])
  const [toSend, setToSend] = useState(5)
  const [phase, setPhase] = useState<'idle' | 'flash' | 'compacted'>('idle')
  const [notice, setNotice] = useState<string | null>(null)
  const [showBudget, setShowBudget] = useState(false)
  const [compactNum, setCompactNum] = useState(0)
  const [nextId, setNextId] = useState(1)

  const displayMessages = useMemo(
    () => computeDisplayTokens(messages, showBudget),
    [messages, showBudget],
  )

  const totalTokens = displayMessages.reduce((sum, m) => sum + m.tokens, 0)
  const msgCount = displayMessages.filter(m => m.type !== 'system').length
  const available = CONTEXT_SIZE - totalTokens
  const usedPct = (totalTokens / CONTEXT_SIZE) * 100
  const thresholdPct = (COMPACT_THRESHOLD / CONTEXT_SIZE) * 100

  const handleSend = useCallback(() => {
    if (toSend <= 0 || phase !== 'idle') return

    const newMsgs = genMessages(toSend, nextId)
    const combined = [...messages, ...newMsgs]
    const newNextId = nextId + toSend

    if (computeTotal(combined, showBudget) > COMPACT_THRESHOLD) {
      setMessages(combined)
      setNextId(newNextId)
      setPhase('flash')

      setTimeout(() => {
        const nonSystem = combined.filter(m => m.type !== 'system')
        const compactedCount = nonSystem.length
        const recent = nonSystem.slice(-5)
        const summary: Message = {
          id: -1 - compactNum,
          type: 'assistant',
          tokens: SUMMARY_TOKENS,
          truncated: false,
        }
        setCompactNum(compactNum + 1)
        setMessages([combined[0], summary, ...recent])
        setPhase('compacted')
        setNotice(
          `${compactedCount} messages -> summary (${SUMMARY_TOKENS} tokens)`,
        )

        setTimeout(() => {
          setNotice(null)
          setPhase('idle')
        }, 3500)
      }, 900)
    } else {
      setMessages(combined)
      setNextId(newNextId)
    }
  }, [toSend, nextId, messages, showBudget, phase, compactNum])

  const handleReset = useCallback(() => {
    setMessages([{ id: 0, type: 'system', tokens: SYSTEM_TOKENS, truncated: false }])
    setNextId(1)
    setPhase('idle')
    setNotice(null)
    setCompactNum(0)
  }, [])

  let cumPct = 0
  const segments = displayMessages.map(m => {
    const rawPct = (m.tokens / CONTEXT_SIZE) * 100
    const pct = m.tokens > 0 ? Math.max(rawPct, 0.15) : 0
    const seg = { ...m, pct, left: cumPct }
    cumPct += rawPct
    return seg
  })

  return (
    <DemoBoundary name="Context Window">
      <div style={{
        maxWidth: 820,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: s.text,
        background: s.bg,
        borderRadius: 8,
        padding: 24,
      }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: s.text2,
          marginBottom: 16,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Claude Code Context Window (200K tokens)
        </div>

        <div style={{
          position: 'relative',
          height: 48,
          background: s.bg2,
          borderRadius: 6,
          border: `1px solid ${s.border}`,
          overflow: 'hidden',
          marginBottom: 8,
        }}>
          {segments.map(seg => (
            <div
              key={seg.id}
              title={`${typeLabel[seg.type]}: ${seg.tokens.toLocaleString()} tokens${seg.truncated ? ' (truncated)' : ''}`}
              style={{
                position: 'absolute',
                left: `${seg.left}%`,
                top: 0,
                width: `${seg.pct}%`,
                height: '100%',
                background: phase === 'flash' ? s.red : typeColor[seg.type],
                opacity: seg.id < 0 ? 0.55 : 1,
                transition: 'background 0.3s ease',
              }}
            />
          ))}

          <div style={{
            position: 'absolute',
            left: `${thresholdPct}%`,
            top: -2,
            width: 2,
            height: 'calc(100% + 4px)',
            background: s.red,
            opacity: 0.8,
          }} />

          <div style={{
            position: 'absolute',
            left: `${thresholdPct + 0.5}%`,
            top: 2,
            fontSize: 9,
            color: s.red,
            whiteSpace: 'nowrap',
            fontFamily: s.mono,
          }}>
            auto-compact (187K)
          </div>

          {phase === 'flash' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(232, 93, 93, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: s.red,
              textShadow: `0 0 10px ${s.red}`,
              fontFamily: s.mono,
              letterSpacing: '0.06em',
            }}>
              AUTO-COMPACT TRIGGERED
            </div>
          )}
        </div>

        {notice && (
          <div style={{
            fontSize: 12,
            color: s.green,
            fontFamily: s.mono,
            marginBottom: 8,
            padding: '6px 10px',
            background: `${s.green}10`,
            borderRadius: 4,
            borderLeft: `3px solid ${s.green}`,
          }}>
            Conversation compacted: {notice} | Compactions: {compactNum}
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            minWidth: 200,
          }}>
            <label style={{ fontSize: 12, color: s.text2, whiteSpace: 'nowrap' }}>
              Send messages:
            </label>
            <input
              type="range"
              min={1}
              max={50}
              value={toSend}
              onChange={e => setToSend(Number(e.target.value))}
              style={{ flex: 1, accentColor: s.accent, cursor: 'pointer' }}
            />
            <span style={{
              fontSize: 13,
              color: s.accent,
              fontFamily: s.mono,
              fontWeight: 600,
              minWidth: 24,
              textAlign: 'right',
            }}>
              {toSend}
            </span>
          </div>

          <button
            onClick={handleSend}
            disabled={phase !== 'idle'}
            style={{
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 600,
              color: s.text,
              background: phase === 'idle' ? s.accent : s.bg3,
              border: 'none',
              borderRadius: 4,
              cursor: phase === 'idle' ? 'pointer' : 'not-allowed',
              opacity: phase === 'idle' ? 1 : 0.5,
            }}
          >
            Send
          </button>

          <button
            onClick={handleReset}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              color: s.text3,
              background: 'transparent',
              border: `1px solid ${s.border}`,
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}>
          <button
            onClick={() => setShowBudget(p => !p)}
            style={{
              padding: '4px 12px',
              fontSize: 11,
              color: showBudget ? s.green : s.text3,
              background: showBudget ? `${s.green}15` : 'transparent',
              border: `1px solid ${showBudget ? s.green : s.border}`,
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: s.mono,
            }}
          >
            {showBudget ? '[ON]' : '[OFF]'} Show tool result budget
          </button>
          {showBudget && (
            <span style={{ fontSize: 11, color: s.text3 }}>
              Large tool results truncated to {BUDGET_TRUNC} tokens
            </span>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: 16,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}>
          {(['system', 'user', 'assistant', 'tool_call', 'tool_result'] as MsgType[]).map(type => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: typeColor[type],
              }} />
              <span style={{ fontSize: 11, color: s.text2 }}>{typeLabel[type]}</span>
            </div>
          ))}
          {showBudget && displayMessages.some(m => m.truncated) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: s.yellow,
                opacity: 0.4,
                border: `1px dashed ${s.yellow}`,
              }} />
              <span style={{ fontSize: 11, color: s.text3 }}>truncated</span>
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: 24,
          padding: '10px 14px',
          background: s.bg2,
          borderRadius: 6,
          border: `1px solid ${s.border}`,
          fontFamily: s.mono,
          fontSize: 12,
          flexWrap: 'wrap',
        }}>
          <div>
            <span style={{ color: s.text3 }}>Used: </span>
            <span style={{
              color: usedPct > 90 ? s.red : usedPct > 70 ? s.yellow : s.green,
              fontWeight: 600,
            }}>
              {totalTokens.toLocaleString()}
            </span>
          </div>
          <div>
            <span style={{ color: s.text3 }}>Available: </span>
            <span style={{
              color: available < 13000 ? s.red : s.green,
              fontWeight: 600,
            }}>
              {available.toLocaleString()}
            </span>
          </div>
          <div>
            <span style={{ color: s.text3 }}>Messages: </span>
            <span style={{ color: s.accent, fontWeight: 600 }}>{msgCount}</span>
          </div>
          <div>
            <span style={{ color: s.text3 }}>Fill: </span>
            <span style={{
              color: usedPct > 90 ? s.red : s.text,
              fontWeight: 600,
            }}>
              {usedPct.toFixed(1)}%
            </span>
          </div>
        </div>

        {displayMessages.some(m => m.truncated) && (
          <div style={{ marginTop: 8, fontSize: 11, color: s.text3 }}>
            {displayMessages.filter(m => m.truncated).length} tool result(s) truncated
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
