import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const REQS = [
  { title: 'Publish / Subscribe', tag: 'Producer sends once, many consumers read independently', detail: 'Producers write messages without knowing which consumers will read them. Multiple consumer groups can each read the full stream independently. This is the core difference between a queue (point-to-point) and a pub/sub system.' },
  { title: 'Durable Storage', tag: 'Messages persist on disk, survive broker restarts', detail: 'Messages are written to disk using a commit log (similar to a database WAL). Even if all consumers are down, messages remain available when they reconnect. Kafka keeps messages for a configurable retention period (default 7 days).' },
  { title: 'Ordering Within a Partition', tag: 'Messages in the same partition are read in write order', detail: 'A partition is an ordered, immutable sequence of messages — like an append-only log. Messages within a partition have a strict total order. If you need ordered processing for a specific entity (e.g., all events for user ID 42), route them to the same partition.' },
  { title: 'Rewind and Replay', tag: 'Consumers can reset to any earlier offset', detail: 'Unlike a queue where messages are deleted on consume, Kafka consumers track their position as an offset (a number). A consumer can rewind to any previous offset and re-read messages. This is critical for error recovery and reprocessing.' },
  { title: 'Horizontal Scaling', tag: 'Add brokers and partitions to handle more throughput', detail: 'A topic is split into partitions that can live on different brokers. Adding brokers lets you move partitions around to distribute load. More partitions mean more parallelism for both producers and consumers.' },
  { title: 'Fault Tolerance', tag: 'Replicated partitions survive broker failures', detail: 'Each partition is replicated across N brokers (configured with replication.factor). One replica is the leader, the rest are followers. If the leader fails, a follower is elected. The system continues operating with no data loss.' },
  { title: 'Exactly-Once Delivery', tag: 'No duplicates, no gaps, even under failures', detail: 'The hardest guarantee. Kafka achieves it through a combination of idempotent producers (retries don\'t create duplicates), transactional writes (atomic produce + commit), and consumer offset management stored in the same transaction.' },
]

export default function MqRequirementsDemo() {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [satisfied, setSatisfied] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5]))

  const toggle = (i: number) => {
    setSatisfied(prev => {
      const next = new Set(prev)
      if (next.has(i)) { next.delete(i) } else { next.add(i) }
      return next
    })
  }

  const count = satisfied.size

  return (
    <DemoBoundary name="Message Queue Requirements">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>System Design Requirements</div>
        <p style={{ color: s.text2, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          A distributed message queue must satisfy these requirements. Click each requirement to expand its detail.
          Toggle the checkbox to track which requirements your design satisfies.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: s.bg2, borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ color: s.green, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{count}</div>
          <div style={{ color: s.text3, fontSize: 12 }}>/ {REQS.length} satisfied</div>
        </div>
        <div style={{ flex: 1, height: 6, background: s.bg3, borderRadius: 3, alignSelf: 'center', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(count / REQS.length) * 100}%`, background: s.green, borderRadius: 3, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {REQS.map((req, i) => {
          const isExpanded = expanded === i
          const isSatisfied = satisfied.has(i)
          return (
            <div key={i} style={{
              background: s.bg2, border: `1px solid ${isExpanded ? s.accent : s.border}`,
              borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
                onClick={() => setExpanded(isExpanded ? null : i)}>
                <div onClick={(e) => { e.stopPropagation(); toggle(i) }} style={{
                  width: 22, height: 22, borderRadius: 4, border: `2px solid ${isSatisfied ? s.green : s.border}`,
                  background: isSatisfied ? s.green : 'transparent', cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                }}>
                  {isSatisfied && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: s.text, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{req.title}</div>
                  <div style={{ color: s.text3, fontSize: 12 }}>{req.tag}</div>
                </div>
                <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>{'\u25BC'}</div>
              </div>
              {isExpanded && (
                <div style={{
                  padding: '0 16px 14px 52px', color: s.text2, fontSize: 13, lineHeight: 1.7,
                  borderTop: `1px solid ${s.border}`, marginTop: 0, paddingTop: 12,
                }}>
                  {req.detail}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
    </DemoBoundary>
  )
}
