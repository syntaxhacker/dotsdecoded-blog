import { useState, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const SUBSCRIBER_COLORS = ['#5b8def', '#3dd68c', '#e0b040', '#9b7bea', '#e8945a', '#e85d5d']
const TOPICS = ['orders', 'payments', 'shipments']

interface Subscriber {
  id: number
  topic: string
  color: string
  messages: string[]
}

export default function PubSubDemo() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([
    { id: 1, topic: 'orders', color: SUBSCRIBER_COLORS[0], messages: [] },
    { id: 2, topic: 'orders', color: SUBSCRIBER_COLORS[1], messages: [] },
    { id: 3, topic: 'payments', color: SUBSCRIBER_COLORS[2], messages: [] },
  ])
  const [selectedTopic, setSelectedTopic] = useState('orders')
  const [publishCount, setPublishCount] = useState(0)
  const [totalDelivered, setTotalDelivered] = useState(0)
  const [mode, setMode] = useState<'pubsub' | 'queue'>('pubsub')
  const nextIdRef = useState(() => 4)

  const addSubscriber = useCallback(() => {
    const id = nextIdRef[0]
    nextIdRef[1](id + 1)
    const color = SUBSCRIBER_COLORS[(id - 1) % SUBSCRIBER_COLORS.length]
    setSubscribers((prev) => [...prev, { id, topic: selectedTopic, color, messages: [] }])
  }, [selectedTopic, nextIdRef])

  const removeSubscriber = useCallback((id: number) => {
    setSubscribers((prev) => prev.filter((sub) => sub.id !== id))
  }, [])

  const publish = useCallback(() => {
    const msg = `MSG-${publishCount + 1}`
    setPublishCount((c) => c + 1)

    if (mode === 'pubsub') {
      const subsForTopic = subscribers.filter((sub) => sub.topic === selectedTopic)
      setTotalDelivered((d) => d + subsForTopic.length)
      setSubscribers((prev) =>
        prev.map((sub) =>
          sub.topic === selectedTopic
            ? { ...sub, messages: [...sub.messages, msg] }
            : sub
        )
      )
    } else {
      const subsForTopic = subscribers.filter((sub) => sub.topic === selectedTopic)
      if (subsForTopic.length > 0) {
        setTotalDelivered((d) => d + 1)
        const target = subsForTopic[0]
        setSubscribers((prev) =>
          prev.map((sub) =>
            sub.id === target.id
              ? { ...sub, messages: [...sub.messages, msg] }
              : sub
          )
        )
      }
    }
  }, [selectedTopic, subscribers, publishCount, mode])

  const reset = useCallback(() => {
    setSubscribers((prev) => prev.map((sub) => ({ ...sub, messages: [] })))
    setPublishCount(0)
    setTotalDelivered(0)
  }, [])

  const subsForSelectedTopic = subscribers.filter((sub) => sub.topic === selectedTopic)

  return (
    <DemoBoundary name="Pub/Sub vs Queue">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{
            display: 'flex', borderRadius: 6, overflow: 'hidden', border: `1px solid ${s.border}`,
          }}>
            {(['pubsub', 'queue'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: '6px 16px', border: 'none', cursor: 'pointer',
                background: mode === m ? s.accent : s.bg2, color: mode === m ? '#fff' : s.text3,
                fontFamily: s.mono, fontSize: 11, fontWeight: 600,
              }}>
                {m === 'pubsub' ? 'Pub/Sub (fan-out)' : 'Queue (point-to-point)'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3 }}>Topic:</span>
            {TOPICS.map((t) => (
              <button key={t} onClick={() => setSelectedTopic(t)} style={{
                padding: '4px 12px', border: `1px solid ${selectedTopic === t ? s.accent : s.border}`,
                borderRadius: 4, cursor: 'pointer', fontFamily: s.mono, fontSize: 11,
                background: selectedTopic === t ? `${s.accent}20` : s.bg2,
                color: selectedTopic === t ? s.accent : s.text3,
              }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px', borderBottom: `1px solid ${s.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3 }}>
              {mode === 'pubsub' ? 'PUB/SUB' : 'QUEUE'} &mdash; Topic: <span style={{ color: s.accent }}>{selectedTopic}</span>
              {' '}({subsForSelectedTopic.length} subscriber{subsForSelectedTopic.length !== 1 ? 's' : ''})
            </div>
            <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
              Published: {publishCount} | Delivered: {totalDelivered}
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
            }}>
              <div style={{
                padding: '6px 14px', borderRadius: 6, background: `${s.accent}20`,
                border: `1px solid ${s.accent}40`, fontFamily: s.mono, fontSize: 12, color: s.accent, fontWeight: 600,
              }}>
                Publisher
              </div>
              <div style={{ flex: 1, height: 2, background: s.border, position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '50%', top: -8, transform: 'translateX(-50%)',
                  padding: '2px 8px', borderRadius: 4, background: s.bg, border: `1px solid ${s.border}`,
                  fontFamily: s.mono, fontSize: 9, color: s.text3,
                }}>
                  {mode === 'pubsub' ? 'FAN-OUT' : 'ROUND-ROBIN'}
                </div>
              </div>
              <div style={{
                padding: '6px 14px', borderRadius: 6, background: `${s.green}20`,
                border: `1px solid ${s.green}40`, fontFamily: s.mono, fontSize: 12, color: s.green, fontWeight: 600,
              }}>
                Subscribers
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {subscribers.map((sub) => (
                <div key={sub.id} style={{
                  flex: '1 1 140px', background: s.bg2, borderRadius: 6,
                  border: `1px solid ${sub.topic === selectedTopic ? `${sub.color}40` : s.border}`,
                  overflow: 'hidden', opacity: sub.topic === selectedTopic ? 1 : 0.4,
                  transition: 'opacity 0.2s',
                }}>
                  <div style={{
                    padding: '6px 10px', borderBottom: `1px solid ${s.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: sub.color }} />
                      <span style={{ fontFamily: s.mono, fontSize: 10, color: sub.color, fontWeight: 600 }}>
                        S{sub.id}
                      </span>
                      <span style={{ fontFamily: s.mono, fontSize: 9, color: s.text3 }}>{sub.topic}</span>
                    </div>
                    <button onClick={() => removeSubscriber(sub.id)} style={{
                      background: 'none', border: 'none', color: s.text3, cursor: 'pointer',
                      fontFamily: s.mono, fontSize: 12, padding: '0 2px', lineHeight: 1,
                    }}>
                      x
                    </button>
                  </div>
                  <div style={{ padding: 6, maxHeight: 60, overflowY: 'auto', fontFamily: s.mono, fontSize: 9 }}>
                    {sub.messages.length === 0 ? (
                      <div style={{ color: s.text3, textAlign: 'center', padding: '4px 0' }}>No messages</div>
                    ) : (
                      sub.messages.map((msg, i) => (
                        <div key={i} style={{ color: sub.color, padding: '1px 0' }}>{msg}</div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              padding: '8px 12px', borderRadius: 6, background: `${mode === 'pubsub' ? s.accent : s.yellow}08`,
              border: `1px solid ${mode === 'pubsub' ? `${s.accent}20` : `${s.yellow}20`}`,
              fontSize: 11, color: s.text2, lineHeight: 1.5, marginBottom: 12,
            }}>
              {mode === 'pubsub'
                ? 'Every message published to this topic is delivered to ALL subscribers. Great for event notifications, log aggregation, and real-time updates.'
                : 'Each message is delivered to exactly ONE subscriber. Great for work distribution, task queues, and load balancing.'}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={publish} style={{
                padding: '6px 20px', background: s.accent, color: '#fff', border: 'none',
                borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: s.mono,
              }}>
                Publish to {selectedTopic}
              </button>
              <button onClick={addSubscriber} style={{
                padding: '6px 14px', background: s.bg3, color: s.text2, border: `1px solid ${s.border}`,
                borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: s.mono,
              }}>
                + Subscriber
              </button>
              <button onClick={reset} style={{
                padding: '6px 14px', background: s.bg3, color: s.text3, border: `1px solid ${s.border}`,
                borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: s.mono,
              }}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
