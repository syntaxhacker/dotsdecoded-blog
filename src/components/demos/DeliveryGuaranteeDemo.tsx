import { useState, useEffect, useRef } from 'react'
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

type Guarantee = 'at-most-once' | 'at-least-once' | 'exactly-once'

interface Msg {
  id: string
  text: string
  status: 'sent' | 'delivered' | 'lost' | 'duplicate'
  deduped?: boolean
}

const messageTexts = [
  'Hey, how are you?',
  'The meeting is at 3pm',
  'Can you send the report?',
  'I just landed!',
  'Dinner tonight?',
  'Check this link out',
  'Running late, sorry',
  'Got it, thanks!',
]

const guaranteeInfo: Record<Guarantee, { label: string; desc: string; color: string; detail: string }> = {
  'at-most-once': {
    label: 'At-Most-Once',
    desc: 'Message might be lost',
    color: s.red,
    detail: 'Fire and forget. No retry. If the server crashes or network drops, the message is gone. Simple but unreliable.',
  },
  'at-least-once': {
    label: 'At-Least-Once',
    desc: 'Message might be duplicated',
    color: s.yellow,
    detail: 'Retry until acknowledged. The receiver might see the same message twice. Requires deduplication on the client.',
  },
  'exactly-once': {
    label: 'Exactly-Once',
    desc: 'Every message delivered once',
    color: s.green,
    detail: 'Server assigns a unique message ID. Receiver tracks seen IDs and ignores duplicates. Near-perfect delivery.',
  },
}

function simulateDelivery(guarantee: Guarantee): Msg[] {
  const msgs: Msg[] = []
  const seenIds = new Set<string>()
  const deliveredIds = new Set<string>()

  for (let i = 0; i < 8; i++) {
    const id = `msg_${String(i + 1).padStart(3, '0')}`
    const text = messageTexts[i]

    if (guarantee === 'at-most-once') {
      const lost = Math.random() < 0.3
      if (lost) {
        msgs.push({ id, text, status: 'lost' })
      } else {
        msgs.push({ id, text, status: 'delivered' })
      }
    } else if (guarantee === 'at-least-once') {
      const delivered = Math.random() < 0.6
      if (delivered) {
        msgs.push({ id, text, status: 'delivered' })
      } else {
        msgs.push({ id, text, status: 'delivered' })
        if (Math.random() < 0.5) {
          msgs.push({ id: `${id}_retry`, text, status: 'duplicate' })
        }
      }
    } else {
      msgs.push({ id, text, status: 'delivered' })
      if (Math.random() < 0.25) {
        const dup = { id: `${id}_dup`, text, status: 'duplicate' as const, deduped: true }
        msgs.push(dup)
      }
    }
  }

  return msgs
}

export default function DeliveryGuaranteeDemo() {
  const [guarantee, setGuarantee] = useState<Guarantee>('at-most-once')
  const [messages, setMessages] = useState<Msg[]>([])
  const [animIdx, setAnimIdx] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [speed, setSpeed] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const allMsgs = useRef<Msg[]>([])

  const info = guaranteeInfo[guarantee]

  const start = () => {
    allMsgs.current = simulateDelivery(guarantee)
    setMessages([])
    setAnimIdx(0)
    setAnimating(true)
  }

  useEffect(() => {
    if (!animating) return
    if (animIdx >= allMsgs.current.length) {
      setAnimating(false)
      return
    }
    const delay = getStepDelay(350, speed)
    const t = setTimeout(() => {
      setMessages((prev) => [...prev, allMsgs.current[animIdx]])
      setAnimIdx((v) => v + 1)
    }, delay)
    return () => clearTimeout(t)
  }, [animating, animating, speed])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const lostCount = messages.filter((m) => m.status === 'lost').length
  const dupCount = messages.filter((m) => m.status === 'duplicate').length
  const deliveredCount = messages.filter((m) => m.status === 'delivered').length

  return (
    <DemoBoundary name="Delivery Guarantees">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['at-most-once', 'at-least-once', 'exactly-once'] as Guarantee[]).map((g) => {
            const gi = guaranteeInfo[g]
            return (
              <button
                key={g}
                onClick={() => { setGuarantee(g); setMessages([]); setAnimIdx(0); setAnimating(false) }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: guarantee === g ? `${gi.color}10` : s.bg2,
                  border: `1px solid ${guarantee === g ? gi.color : s.border}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontFamily: s.mono, fontSize: 11, fontWeight: 600, color: guarantee === g ? gi.color : s.text3, marginBottom: 2 }}>
                  {gi.label}
                </div>
                <div style={{ fontSize: 10, color: s.text3 }}>
                  {gi.desc}
                </div>
              </button>
            )
          })}
        </div>

        <div style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.5 }}>{info.detail}</div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '8px 14px',
                borderBottom: `1px solid ${s.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Sender (Alice)
                </span>
                <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
                  {messages.length} messages
                </span>
              </div>
              <div ref={scrollRef} style={{ maxHeight: 280, overflowY: 'auto', padding: '6px 10px' }}>
                {messages.length === 0 && (
                  <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: '40px 0' }}>
                    Press Send to simulate
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={msg.id + i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      marginBottom: 4,
                      borderRadius: 6,
                      background: msg.status === 'lost' ? `${s.red}10`
                        : msg.status === 'duplicate' && msg.deduped ? `${s.purple}10`
                        : msg.status === 'duplicate' ? `${s.yellow}10`
                        : `${s.green}10`,
                      border: `1px solid ${msg.status === 'lost' ? s.red
                        : msg.status === 'duplicate' && msg.deduped ? s.purple
                        : msg.status === 'duplicate' ? s.yellow
                        : s.green}30`,
                    }}
                  >
                    <span style={{
                      fontFamily: s.mono,
                      fontSize: 9,
                      fontWeight: 700,
                      width: 18,
                      flexShrink: 0,
                      color: msg.status === 'lost' ? s.red
                        : msg.status === 'duplicate' && msg.deduped ? s.purple
                        : msg.status === 'duplicate' ? s.yellow
                        : s.green,
                    }}>
                      {msg.status === 'lost' ? 'X' : msg.status === 'duplicate' ? '!!' : 'OK'}
                    </span>
                    <span style={{ fontSize: 12, color: s.text2, flex: 1 }}>
                      {msg.text}
                    </span>
                    {msg.deduped && (
                      <span style={{
                        fontFamily: s.mono,
                        fontSize: 9,
                        color: s.purple,
                        background: `${s.purple}20`,
                        padding: '1px 6px',
                        borderRadius: 3,
                      }}>
                        DEDUPED
                      </span>
                    )}
                    {!msg.deduped && msg.status === 'duplicate' && (
                      <span style={{
                        fontFamily: s.mono,
                        fontSize: 9,
                        color: s.yellow,
                        background: `${s.yellow}20`,
                        padding: '1px 6px',
                        borderRadius: 3,
                      }}>
                        DUPLICATE
                      </span>
                    )}
                    {msg.status === 'lost' && (
                      <span style={{
                        fontFamily: s.mono,
                        fontSize: 9,
                        color: s.red,
                        background: `${s.red}20`,
                        padding: '1px 6px',
                        borderRadius: 3,
                      }}>
                        LOST
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ width: 200, flexShrink: 0 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '14px',
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Stats
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: s.text3 }}>Delivered</span>
                  <span style={{ fontFamily: s.mono, fontSize: 13, color: s.green, fontWeight: 600 }}>{deliveredCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: s.text3 }}>Lost</span>
                  <span style={{ fontFamily: s.mono, fontSize: 13, color: s.red, fontWeight: 600 }}>{lostCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: s.text3 }}>Duplicates</span>
                  <span style={{ fontFamily: s.mono, fontSize: 13, color: s.yellow, fontWeight: 600 }}>{dupCount}</span>
                </div>
              </div>

              {guarantee === 'exactly-once' && messages.length > 0 && (
                <div style={{
                  marginTop: 14,
                  padding: '8px 10px',
                  background: `${s.purple}10`,
                  border: `1px solid ${s.purple}30`,
                  borderRadius: 6,
                  fontFamily: s.mono,
                  fontSize: 10,
                  color: s.purple,
                  lineHeight: 1.5,
                }}>
                  Client dedup: track seen msg IDs in a Bloom filter or set. Drop incoming duplicates.
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginTop: 12 }}>
          <button
            onClick={start}
            disabled={animating}
            style={{
              padding: '8px 28px',
              background: animating ? s.bg3 : s.accent,
              color: animating ? s.text3 : '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: animating ? 'not-allowed' : 'pointer',
              fontFamily: s.mono,
              transition: 'all 0.2s',
            }}
          >
            {animating ? 'Sending...' : 'Send Messages'}
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
      </div>
    </DemoBoundary>
  )
}
