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

interface Member {
  id: string
  name: string
  color: string
  online: boolean
}

const initialMembers: Member[] = [
  { id: 'alice', name: 'Alice', color: s.accent, online: true },
  { id: 'bob', name: 'Bob', color: s.green, online: true },
  { id: 'carol', name: 'Carol', color: s.orange, online: true },
  { id: 'dave', name: 'Dave', color: s.purple, online: true },
  { id: 'eve', name: 'Eve', color: s.yellow, online: false },
]

type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'queued'

interface GroupMsg {
  id: string
  sender: string
  text: string
  deliveries: Record<string, DeliveryStatus>
}

const sampleMessages = [
  'Hey team, standup in 5 minutes',
  'I just pushed the fix to staging',
  'Can someone review my PR?',
  'The deploy succeeded!',
  'Great work everyone!',
]

export default function GroupMessageDemo() {
  const [members, setMembers] = useState(initialMembers)
  const [messages, setMessages] = useState<GroupMsg[]>([])
  const [animating, setAnimating] = useState(false)
  const [msgIdx, setMsgIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [speed, setSpeed] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentDeliveries = useRef<Record<string, DeliveryStatus>>({})
  const currentMsg = useRef<GroupMsg | null>(null)

  const start = () => {
    setMessages([])
    setMembers(initialMembers)
    setMsgIdx(0)
    setStepIdx(0)
    setAnimating(true)
    currentDeliveries.current = {}
    currentMsg.current = null
  }

  useEffect(() => {
    if (!animating) return

    if (msgIdx >= sampleMessages.length) {
      setAnimating(false)
      return
    }

    const senderIdx = msgIdx % members.filter((m) => m.online).length
    const onlineMembers = members.filter((m) => m.online)
    const sender = onlineMembers[senderIdx] || onlineMembers[0]

    if (!sender) {
      setAnimating(false)
      return
    }

    if (stepIdx === 0) {
      const deliveries: Record<string, DeliveryStatus> = {}
      members.forEach((m) => {
        deliveries[m.id] = m.online ? 'pending' : 'queued'
      })
      deliveries[sender.id] = 'delivered'

      const msg: GroupMsg = {
        id: `msg_${msgIdx}`,
        sender: sender.id,
        text: sampleMessages[msgIdx],
        deliveries,
      }
      currentMsg.current = msg
      currentDeliveries.current = { ...deliveries }

      setMessages((prev) => [...prev, msg])
      setStepIdx(1)
    } else if (stepIdx <= members.filter((m) => m.online).length) {
      const onlineIds = members.filter((m) => m.online && m.id !== sender.id).map((m) => m.id)
      const targetIdx = stepIdx - 1
      if (targetIdx < onlineIds.length) {
        const targetId = onlineIds[targetIdx]
        currentDeliveries.current[targetId] = 'delivered'
        if (currentMsg.current) {
          currentMsg.current = { ...currentMsg.current, deliveries: { ...currentDeliveries.current } }
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...currentMsg.current! }
            return updated
          })
        }
      }
      setStepIdx((v) => v + 1)
    } else {
      const msg = currentMsg.current
      if (msg) {
        const finalDeliveries = { ...msg.deliveries }
        Object.keys(finalDeliveries).forEach((id) => {
          if (finalDeliveries[id] === 'delivered') {
            finalDeliveries[id] = 'read'
          }
        })
        currentMsg.current = { ...msg, deliveries: finalDeliveries }
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...currentMsg.current! }
          return updated
        })
      }
      setStepIdx(0)
      setMsgIdx((v) => v + 1)
    }
  }, [animating, msgIdx, stepIdx, speed, members])

  useEffect(() => {
    if (!animating) return
    const delay = getStepDelay(350, speed)
    const t = setTimeout(() => {}, delay)
    return () => clearTimeout(t)
  }, [animating, msgIdx, stepIdx, speed])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const toggleOnline = (id: string) => {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, online: !m.online } : m))
  }

  return (
    <DemoBoundary name="Group Chat Fan-Out">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 12,
        }}>
          <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Members (click to toggle online/offline)
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleOnline(m.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  background: m.online ? `${m.color}10` : s.bg2,
                  border: `1px solid ${m.online ? m.color : s.border}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: m.online ? m.color : s.text3,
                }} />
                <span style={{ fontFamily: s.mono, fontSize: 11, color: m.online ? m.color : s.text3 }}>
                  {m.name}
                </span>
              </button>
            ))}
          </div>
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
                fontFamily: s.mono,
                fontSize: 10,
                color: s.text3,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Group Chat
              </div>
              <div ref={scrollRef} style={{ maxHeight: 300, overflowY: 'auto', padding: '8px 10px' }}>
                {messages.length === 0 && (
                  <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: '60px 0' }}>
                    Press Send to simulate fan-out
                  </div>
                )}
                {messages.map((msg, i) => {
                  const sender = members.find((m) => m.id === msg.sender)
                  return (
                    <div key={msg.id + i} style={{ marginBottom: 10 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4,
                      }}>
                        <span style={{
                          fontFamily: s.mono,
                          fontSize: 10,
                          fontWeight: 700,
                          color: sender?.color || s.text3,
                        }}>
                          {sender?.name}
                        </span>
                        <span style={{ fontSize: 12, color: s.text }}>{msg.text}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {Object.entries(msg.deliveries).map(([memberId, status]) => {
                          const member = members.find((m) => m.id === memberId)
                          if (!member) return null
                          const statusColors: Record<DeliveryStatus, string> = {
                            pending: s.text3,
                            sent: s.accent,
                            delivered: s.green,
                            read: s.purple,
                            queued: s.yellow,
                          }
                          return (
                            <span
                              key={memberId}
                              style={{
                                fontFamily: s.mono,
                                fontSize: 9,
                                color: statusColors[status],
                                background: `${statusColors[status]}15`,
                                padding: '2px 6px',
                                borderRadius: 3,
                                border: `1px solid ${statusColors[status]}30`,
                              }}
                            >
                              {member.name}: {status.toUpperCase()}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div style={{ width: 220, flexShrink: 0 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '14px',
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Fan-Out Process
              </div>
              <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.6 }}>
                <div style={{ marginBottom: 6 }}>1. Sender writes message to DB</div>
                <div style={{ marginBottom: 6 }}>2. Server fans out to each member&apos;s queue</div>
                <div style={{ marginBottom: 6 }}>3. Online members: push via WebSocket</div>
                <div style={{ marginBottom: 6 }}>4. Offline members: queue for later</div>
                <div>5. Read receipts collected</div>
              </div>
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
