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

interface ChatMsg {
  id: string
  sender: 'alice' | 'bob'
  text: string
  seqNum: number
  arrivalOrder: number
  outOfOrder: boolean
}

const aliceMessages = [
  { text: 'Hey Bob!' },
  { text: 'Did you see the game?' },
  { text: 'That last play was insane' },
  { text: 'We should watch next week' },
  { text: 'I will bring snacks' },
]

const bobMessages = [
  { text: 'Hey Alice!' },
  { text: 'Yes! Amazing finish' },
  { text: 'The QB was on fire' },
  { text: 'Count me in' },
  { text: 'I will get the drinks' },
]

function generateMessages(useSeqNums: boolean): ChatMsg[] {
  const all: ChatMsg[] = []
  let seqNum = 1
  let arrivalOrder = 0

  const shuffledAlice = useSeqNums ? [...aliceMessages] : shuffleWithReorder(aliceMessages)
  const shuffledBob = useSeqNums ? [...bobMessages] : shuffleWithReorder(bobMessages)

  for (let i = 0; i < 5; i++) {
    all.push({
      id: `a${i}`,
      sender: 'alice',
      text: shuffledAlice[i].text,
      seqNum,
      arrivalOrder: arrivalOrder++,
      outOfOrder: false,
    })
    seqNum++
    all.push({
      id: `b${i}`,
      sender: 'bob',
      text: shuffledBob[i].text,
      seqNum,
      arrivalOrder: arrivalOrder++,
      outOfOrder: false,
    })
    seqNum++
  }

  if (!useSeqNums) {
    const reordered = [...all]
    const swap1 = Math.floor(Math.random() * 4) * 2
    const swap2 = swap1 + 2
    if (swap2 < reordered.length) {
      const temp = reordered[swap1]
      reordered[swap1] = reordered[swap2]
      reordered[swap2] = temp
      reordered[swap1].outOfOrder = true
      reordered[swap2].outOfOrder = true
    }
    reordered.forEach((m, idx) => { m.arrivalOrder = idx })
    return reordered
  }

  return all
}

function shuffleWithReorder(msgs: typeof aliceMessages) {
  const result = [...msgs]
  if (result.length >= 3) {
    const a = 1
    const b = 2
    const tmp = result[a]
    result[a] = result[b]
    result[b] = tmp
  }
  return result
}

export default function MessageOrderingDemo() {
  const [mode, setMode] = useState<'unordered' | 'ordered'>('unordered')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [animIdx, setAnimIdx] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [speed, setSpeed] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const allMsgs = useRef<ChatMsg[]>([])

  const start = () => {
    allMsgs.current = generateMessages(mode === 'ordered')
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
    const delay = getStepDelay(400, speed)
    const t = setTimeout(() => {
      setMessages((prev) => [...prev, allMsgs.current[animIdx]])
      setAnimIdx((v) => v + 1)
    }, delay)
    return () => clearTimeout(t)
  }, [animating, animating, speed])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  return (
    <DemoBoundary name="Message Ordering">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => { setMode('unordered'); setMessages([]); setAnimIdx(0); setAnimating(false) }}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: mode === 'unordered' ? `${s.red}10` : s.bg2,
              border: `1px solid ${mode === 'unordered' ? s.red : s.border}`,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontFamily: s.mono, fontSize: 11, fontWeight: 600, color: mode === 'unordered' ? s.red : s.text3, marginBottom: 2 }}>
              Without Ordering
            </div>
            <div style={{ fontSize: 10, color: s.text3 }}>
              Messages arrive out of order
            </div>
          </button>
          <button
            onClick={() => { setMode('ordered'); setMessages([]); setAnimIdx(0); setAnimating(false) }}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: mode === 'ordered' ? `${s.green}10` : s.bg2,
              border: `1px solid ${mode === 'ordered' ? s.green : s.border}`,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontFamily: s.mono, fontSize: 11, fontWeight: 600, color: mode === 'ordered' ? s.green : s.text3, marginBottom: 2 }}>
              With Sequence Numbers
            </div>
            <div style={{ fontSize: 10, color: s.text3 }}>
              Per-conversation ordering
            </div>
          </button>
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
                  Chat Window
                </span>
                <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
                  {messages.length} messages
                </span>
              </div>
              <div ref={scrollRef} style={{ maxHeight: 300, overflowY: 'auto', padding: '8px 10px' }}>
                {messages.length === 0 && (
                  <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: '60px 0' }}>
                    Press Start to simulate chat
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={msg.id + i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      marginBottom: 6,
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: msg.sender === 'alice' ? `${s.accent}08` : `${s.green}08`,
                      border: msg.outOfOrder ? `1px solid ${s.red}40` : '1px solid transparent',
                    }}
                  >
                    <div style={{
                      fontFamily: s.mono,
                      fontSize: 9,
                      fontWeight: 700,
                      color: msg.sender === 'alice' ? s.accent : s.green,
                      width: 50,
                      flexShrink: 0,
                      paddingTop: 2,
                    }}>
                      {msg.sender === 'alice' ? 'ALICE' : 'BOB'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: s.text }}>{msg.text}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                        <span style={{ fontFamily: s.mono, fontSize: 9, color: s.text3 }}>
                          seq:{msg.seqNum}
                        </span>
                        <span style={{ fontFamily: s.mono, fontSize: 9, color: s.text3 }}>
                          arr:{msg.arrivalOrder}
                        </span>
                        {msg.outOfOrder && (
                          <span style={{ fontFamily: s.mono, fontSize: 9, color: s.red }}>
                            OUT OF ORDER
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ width: 260, flexShrink: 0 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '14px',
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                How It Works
              </div>
              <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.6 }}>
                {mode === 'unordered' ? (
                  <>
                    <div style={{ marginBottom: 8 }}>Without ordering, messages travel through different network paths and arrive in random order.</div>
                    <div style={{ marginBottom: 8 }}>Bob&apos;s reply might appear before Alice&apos;s question. The conversation becomes confusing.</div>
                    <div style={{ color: s.red }}>Red border = out of order</div>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 8 }}>Each conversation has a monotonically increasing sequence number on the server.</div>
                    <div style={{ marginBottom: 8 }}>Messages are buffered and sorted by sequence number before display. This guarantees correct order regardless of network delays.</div>
                    <div style={{ color: s.green }}>All messages arrive in order</div>
                  </>
                )}
              </div>

              {mode === 'ordered' && (
                <div style={{
                  marginTop: 12,
                  padding: '8px 10px',
                  background: `${s.accent}10`,
                  border: `1px solid ${s.accent}30`,
                  borderRadius: 6,
                  fontFamily: s.mono,
                  fontSize: 10,
                  color: s.accent,
                  lineHeight: 1.5,
                }}>
                  Server-side sequence counter per conversation. Clients buffer and reorder. Lamport clocks for cross-server ordering.
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
            {animating ? 'Running...' : 'Start Chat'}
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
      </div>
    </DemoBoundary>
  )
}
