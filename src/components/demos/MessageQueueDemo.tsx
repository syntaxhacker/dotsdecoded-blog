import { useState, useEffect, useRef, useCallback } from 'react'
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

interface Message {
  id: number
  color: string
  retries: number
  failed: boolean
}

type DeliveryMode = 'at-least-once' | 'at-most-once'

const COLORS = ['#5b8def', '#3dd68c', '#e0b040', '#9b7bea', '#e8945a', '#e85d5d']

export default function MessageQueueDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [dlq, setDlq] = useState<Message[]>([])
  const [processed, setProcessed] = useState(0)
  const [lost, setLost] = useState(0)
  const [duplicates, setDuplicates] = useState(0)
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('at-least-once')
  const [consumerSpeed, setConsumerSpeed] = useState(3)
  const [running, setRunning] = useState(false)
  const [nextId, setNextId] = useState(1)
  const idRef = useRef(1)

  const addMessage = useCallback(() => {
    const id = idRef.current
    idRef.current += 1
    setNextId(idRef.current)
    const color = COLORS[(id - 1) % COLORS.length]
    setMessages((prev) => [...prev, { id, color, retries: 0, failed: false }])
  }, [])

  useEffect(() => {
    if (!running || messages.length === 0) return

    const delay = getStepDelay(600, consumerSpeed)
    const t = setTimeout(() => {
      setMessages((prev) => {
        if (prev.length === 0) return prev
        const [msg, ...rest] = prev
        const willFail = msg.id % 7 === 0

        if (willFail) {
          if (msg.retries >= 2) {
            setDlq((d) => [...d, { ...msg, failed: true }])
            return rest
          }
          return [{ ...msg, retries: msg.retries + 1 }, ...rest]
        }

        if (deliveryMode === 'at-least-once') {
          if (Math.random() < 0.2) {
            setDuplicates((d) => d + 1)
            const dup = { ...msg, id: msg.id }
            setTimeout(() => {
              setProcessed((p) => p + 1)
            }, getStepDelay(200, consumerSpeed))
          }
        } else {
          if (Math.random() < 0.15) {
            setLost((l) => l + 1)
            return rest
          }
        }

        setProcessed((p) => p + 1)
        return rest
      })
    }, delay)

    return () => clearTimeout(t)
  }, [running, messages, deliveryMode, consumerSpeed])

  useEffect(() => {
    if (!running) return
    const delay = getStepDelay(1200, consumerSpeed)
    const t = setInterval(() => {
      addMessage()
    }, delay)
    return () => clearInterval(t)
  }, [running, consumerSpeed, addMessage])

  return (
    <DemoBoundary name="Message Queue">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              padding: '6px 18px', background: running ? s.red : s.green, color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: s.mono,
            }}
          >
            {running ? 'Pause' : 'Start'}
          </button>
          <button onClick={addMessage} disabled={running} style={{
            padding: '6px 18px', background: s.accent, color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
            cursor: running ? 'not-allowed' : 'pointer', fontFamily: s.mono,
          }}>
            Add Message
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3 }}>Mode:</span>
            <select value={deliveryMode} onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)} style={{
              background: s.bg2, color: s.text, border: `1px solid ${s.border}`,
              borderRadius: 4, padding: '4px 8px', fontFamily: s.mono, fontSize: 11,
            }}>
              <option value="at-least-once">at-least-once</option>
              <option value="at-most-once">at-most-once</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3 }}>Consumer speed:</span>
            <input type="range" min="1" max="8" value={consumerSpeed} onChange={(e) => setConsumerSpeed(Number(e.target.value))} style={{ width: 80 }} />
            <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text2 }}>{consumerSpeed}x</span>
          </div>
          <SpeedController speed={1} onSpeedChange={() => {}} />
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden',
            }}>
              <div style={{
                padding: '6px 14px', borderBottom: `1px solid ${s.border}`,
                fontFamily: s.mono, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>Producers</span>
                <span style={{ color: s.accent }}>Sent: {nextId - 1}</span>
              </div>
              <div style={{ padding: 12, minHeight: 40, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[0, 1, 2].map((p) => (
                  <div key={p} style={{
                    padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    fontFamily: s.mono, color: COLORS[p], background: `${COLORS[p]}15`,
                    border: `1px solid ${COLORS[p]}30`,
                  }}>
                    P{p + 1}
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden', marginTop: 12,
            }}>
              <div style={{
                padding: '6px 14px', borderBottom: `1px solid ${s.border}`,
                fontFamily: s.mono, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>Queue ({messages.length})</span>
                <span style={{ color: s.yellow }}>Waiting</span>
              </div>
              <div style={{
                padding: 8, minHeight: 60, maxHeight: 120, overflowY: 'auto',
                display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-end',
              }}>
                {messages.length === 0 && (
                  <div style={{ color: s.text3, fontSize: 11, padding: '12px 0', width: '100%', textAlign: 'center' }}>
                    Empty
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={`${msg.id}-${msg.retries}`} style={{
                    width: 28, height: 28, borderRadius: 6, background: msg.color,
                    opacity: 0.85, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: s.mono, fontSize: 9, color: '#fff', fontWeight: 700,
                    position: 'relative',
                  }}>
                    {msg.id}
                    {msg.retries > 0 && (
                      <div style={{
                        position: 'absolute', top: -4, right: -4,
                        width: 10, height: 10, borderRadius: '50%', background: s.red,
                        fontSize: 7, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {msg.retries}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ width: 4, background: s.border, borderRadius: 2, alignSelf: 'stretch' }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden',
            }}>
              <div style={{
                padding: '6px 14px', borderBottom: `1px solid ${s.border}`,
                fontFamily: s.mono, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>Consumers</span>
                <span style={{ color: s.green }}>Processed: {processed}</span>
              </div>
              <div style={{ padding: 12, display: 'flex', gap: 6 }}>
                {[0, 1].map((c) => (
                  <div key={c} style={{
                    flex: 1, padding: '8px 10px', borderRadius: 4, textAlign: 'center',
                    background: s.bg2, border: `1px solid ${s.border}`,
                    fontFamily: s.mono, fontSize: 11, color: s.text2,
                  }}>
                    C{c + 1}
                    {running && <div style={{ color: s.green, fontSize: 9, marginTop: 2 }}>active</div>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden', marginTop: 12,
            }}>
              <div style={{
                padding: '6px 14px', borderBottom: `1px solid ${s.border}`,
                fontFamily: s.mono, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>Dead Letter Queue ({dlq.length})</span>
                <span style={{ color: s.red }}>Failed</span>
              </div>
              <div style={{
                padding: 8, minHeight: 40, display: 'flex', gap: 4, flexWrap: 'wrap',
              }}>
                {dlq.length === 0 && (
                  <div style={{ color: s.text3, fontSize: 11, padding: '8px 0', width: '100%', textAlign: 'center' }}>
                    No failed messages
                  </div>
                )}
                {dlq.map((msg) => (
                  <div key={`dlq-${msg.id}`} style={{
                    width: 28, height: 28, borderRadius: 6, background: s.red,
                    opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: s.mono, fontSize: 9, color: '#fff', fontWeight: 700,
                  }}>
                    {msg.id}
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              marginTop: 12, padding: '8px 12px', borderRadius: 6,
              background: s.bg2, border: `1px solid ${s.border}`,
              fontFamily: s.mono, fontSize: 10,
            }}>
              <div style={{ color: s.text3, marginBottom: 4 }}>{deliveryMode === 'at-least-once' ? 'AT-LEAST-ONCE' : 'AT-MOST-ONCE'}</div>
              {deliveryMode === 'at-least-once' ? (
                <div style={{ color: s.text2, lineHeight: 1.5 }}>
                  Messages may be delivered more than once. No data loss, but consumers must handle duplicates.
                  <span style={{ color: s.yellow }}> Duplicates: {duplicates}</span>
                </div>
              ) : (
                <div style={{ color: s.text2, lineHeight: 1.5 }}>
                  Messages delivered at most once. No duplicates, but some messages may be lost.
                  <span style={{ color: s.red }}> Lost: {lost}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
