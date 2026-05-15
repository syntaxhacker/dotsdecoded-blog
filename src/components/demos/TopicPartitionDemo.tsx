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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }

const KEYS = ['user:1', 'user:2', 'order:42', 'order:99', 'system:health', 'page:view', 'page:click', 'user:3', 'order:7', 'system:alert']
const PARTITION_COLORS = [s.accent, s.green, s.yellow]

function simpleHash(key: string, partitions: number): number {
  let h = 0
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) - h) + key.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h) % partitions
}

interface Message {
  id: number
  key: string
  partition: number
  content: string
}

export default function TopicPartitionDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [partitionMsgs, setPartitionMsgs] = useState<Message[][]>([[], [], []])
  const [consumers, setConsumers] = useState(2)
  const [nextId, setNextId] = useState(0)
  const [keyIdx, setKeyIdx] = useState(0)
  const [highlightPartition, setHighlightPartition] = useState<number | null>(null)
  const [isRebalancing, setIsRebalancing] = useState(false)

  const assignConsumer = (partition: number, totalConsumers: number) => {
    return partition % totalConsumers
  }

  const sendMessage = useCallback(() => {
    const key = KEYS[keyIdx % KEYS.length]
    const partition = simpleHash(key, 3)
    const msg: Message = { id: nextId, key, partition, content: `msg:${key}` }
    setNextId(n => n + 1)
    setKeyIdx(i => i + 1)
    setMessages(prev => [...prev, msg])
    setPartitionMsgs(prev => {
      const next = prev.map(p => [...p])
      next[partition].push(msg)
      return next
    })
    setHighlightPartition(partition)
    setTimeout(() => setHighlightPartition(null), 600)
  }, [keyIdx, nextId])

  const changeConsumers = (delta: number) => {
    const next = Math.max(1, Math.min(4, consumers + delta))
    if (next === consumers) return
    setIsRebalancing(true)
    setTimeout(() => {
      setConsumers(next)
      setIsRebalancing(false)
    }, 600)
    setConsumers(next)
  }

  const clearMessages = () => {
    setMessages([])
    setPartitionMsgs([[], [], []])
    setNextId(0)
    setKeyIdx(0)
  }

  return (
    <DemoBoundary name="Topic and Partitions">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>Topics and Partitions</div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={sendMessage} style={{
          background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
          color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>Send Message (keyed)</button>
        <button onClick={clearMessages} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
          color: s.text2, cursor: 'pointer', fontSize: 13,
        }}>Clear</button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: s.text3, fontSize: 12 }}>Consumers: {consumers}</span>
          <button onClick={() => changeConsumers(-1)} disabled={consumers <= 1} style={{
            background: s.bg3, border: `1px solid ${consumers <= 1 ? s.bg3 : s.border}`, borderRadius: 6,
            padding: '4px 10px', color: consumers <= 1 ? s.text3 : s.text, cursor: consumers <= 1 ? 'default' : 'pointer', fontSize: 13,
          }}>-</button>
          <button onClick={() => changeConsumers(1)} disabled={consumers >= 4} style={{
            background: s.bg3, border: `1px solid ${consumers >= 4 ? s.bg3 : s.border}`, borderRadius: 6,
            padding: '4px 10px', color: consumers >= 4 ? s.text3 : s.text, cursor: consumers >= 4 ? 'default' : 'pointer', fontSize: 13,
          }}>+</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr', gap: 12, minHeight: 260 }}>
        <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, padding: 14 }}>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Producer</div>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              background: `${s.accent}20`, border: `2px solid ${s.accent}`, borderRadius: 12,
              padding: '16px', margin: '0 auto', maxWidth: 160,
            }}>
              <div style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>Producer</div>
              <div style={{ color: s.text2, fontSize: 11, marginTop: 4 }}>key={KEYS[keyIdx % KEYS.length]}</div>
              <div style={{
                marginTop: 8, background: s.bg, borderRadius: 6, padding: '4px 8px',
                fontFamily: s.mono, fontSize: 11, color: s.text3,
              }}>
                hash(key) % 3 = {highlightPartition !== null ? highlightPartition : '-'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, padding: 14 }}>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Topic: orders (3 partitions)</div>
          <div style={{ display: 'flex', gap: 8, height: 180 }}>
            {[0, 1, 2].map(p => (
              <div key={p} style={{
                flex: 1, background: s.bg, borderRadius: 8, border: `2px solid ${highlightPartition === p ? PARTITION_COLORS[p] : s.border}`,
                display: 'flex', flexDirection: 'column', transition: 'border-color 0.3s', overflow: 'hidden',
              }}>
                <div style={{
                  background: `${PARTITION_COLORS[p]}20`, padding: '4px 8px', textAlign: 'center',
                  borderBottom: `1px solid ${s.border}`,
                }}>
                  <span style={{ color: PARTITION_COLORS[p], fontSize: 11, fontFamily: s.mono, fontWeight: 600 }}>P{p}</span>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '4px' }}>
                  {partitionMsgs[p].length === 0 && (
                    <div style={{ color: s.text3, fontSize: 10, textAlign: 'center', paddingTop: 20, fontStyle: 'italic' }}>
                      empty partition
                    </div>
                  )}
                  {partitionMsgs[p].slice(-8).reverse().map((msg, mi) => (
                    <div key={msg.id} style={{
                      padding: '3px 6px', marginBottom: 2, borderRadius: 4,
                      background: highlightPartition === p && mi === 0 ? `${PARTITION_COLORS[p]}20` : s.bg2,
                      fontFamily: s.mono, fontSize: 10, color: s.text2,
                      transition: 'background 0.3s', border: `1px solid ${s.bg3}`,
                    }}>
                      <span style={{ color: s.text3 }}>{msg.id}</span> {msg.content}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, padding: 14, position: 'relative' }}>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Consumer Group {isRebalancing ? '(rebalancing...)' : ''}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {Array.from({ length: consumers }).map((_, c) => {
              const assigned = [0, 1, 2].filter(p => assignConsumer(p, consumers) === c)
              return (
                <div key={c} style={{
                  background: s.bg, border: `1px solid ${assigned.length > 0 ? s.accent : s.border}`,
                  borderRadius: 8, padding: '10px 14px', minWidth: 90,
                  transition: 'all 0.4s',
                }}>
                  <div style={{ color: s.text, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>C{c}</div>
                  {assigned.length > 0 ? (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {assigned.map(p => (
                        <span key={p} style={{
                          background: `${PARTITION_COLORS[p]}20`, color: PARTITION_COLORS[p],
                          padding: '2px 6px', borderRadius: 4, fontFamily: s.mono, fontSize: 10, fontWeight: 600,
                        }}>P{p}</span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: s.text3, fontSize: 10 }}>idle</div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 12, borderTop: `1px solid ${s.border}`, paddingTop: 10 }}>
            <div style={{ color: s.text3, fontSize: 10, lineHeight: 1.6 }}>
              Assigning partitions to consumers: P{0}-C{assignConsumer(0, consumers)}, P{1}-C{assignConsumer(1, consumers)}, P{2}-C{assignConsumer(2, consumers)}
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
