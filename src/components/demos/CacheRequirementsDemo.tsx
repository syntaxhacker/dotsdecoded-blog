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

const requirements = [
  {
    id: 'fast',
    title: 'Sub-millisecond Latency',
    icon: '⚡',
    detail: 'A cache must serve reads and writes in under 1ms. This means in-memory storage (RAM), not disk. Redis achieves ~0.5ms P99 for simple GET/SET. Every microsecond matters — at 100k req/s, an extra 1ms adds 100 seconds of cumulative latency per second.',
    metric: 'P99 < 1ms',
    color: s.accent,
  },
  {
    id: 'ttl',
    title: 'TTL Expiry',
    icon: '⏱',
    detail: 'Every cached entry must support a time-to-live (TTL). After the TTL expires, the entry is automatically deleted. This prevents stale data from living forever. Redis uses lazy + periodic expiry: checks on access and a background timer that samples keys every 100ms.',
    metric: 'Auto-cleanup',
    color: s.green,
  },
  {
    id: 'eviction',
    title: 'Eviction Policies',
    icon: '🗑',
    detail: 'When memory is full, the cache must decide what to remove. LRU (Least Recently Used) drops items not accessed the longest. LFU (Least Frequently Used) drops items accessed the fewest times. FIFO drops oldest first. TTL drops items closest to expiry. Redis supports all of these plus noeviction (return errors on writes).',
    metric: 'LRU / LFU / FIFO / TTL',
    color: s.yellow,
  },
  {
    id: 'sharding',
    title: 'Sharding / Partitioning',
    icon: '🔀',
    detail: 'A single machine has limited RAM (a few hundred GB). To cache terabytes, data must be split across many machines. Consistent hashing distributes keys so adding/removing a node only moves 1/N of keys. Redis Cluster uses 16384 hash slots with automatic resharding.',
    metric: '16384 hash slots',
    color: s.purple,
  },
  {
    id: 'replication',
    title: 'Replication & HA',
    icon: '🔁',
    detail: 'If the cache node goes down, all cached data is lost and the database takes the full traffic hit. Replication maintains copies on other nodes. Redis Sentinel provides automatic failover: if the master dies, a replica is promoted in seconds. Typical setup: 1 master, 2-3 replicas.',
    metric: '99.99% uptime',
    color: s.orange,
  },
  {
    id: 'consistency',
    title: 'Consistency Model',
    icon: '🎯',
    detail: 'Should all cache nodes return the same value at the same time? Strong consistency = slow. Eventual consistency = fast but stale reads. Redis trades strong consistency for speed: asynchronous replication means replicas may lag. For most caching use cases, eventual consistency with a short TTL is acceptable.',
    metric: 'Eventually consistent',
    color: s.red,
  },
]

export default function CacheRequirementsDemo() {
  const [selected, setSelected] = useState<string | null>(null)

  const req = requirements.find(r => r.id === selected)

  return (
    <DemoBoundary name="Cache Requirements">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>
        Cache System Requirements
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Click any requirement to learn why it matters. A production cache must satisfy all of these.
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 0,
      }}>
        {requirements.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(selected === r.id ? null : r.id)}
            style={{
              background: selected === r.id ? `${r.color}18` : s.bg2,
              border: `1px solid ${selected === r.id ? r.color : s.border}`,
              borderRadius: 10, padding: '14px 12px', cursor: 'pointer',
              textAlign: 'left', transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 18, lineHeight: 1 }}>{r.icon}</div>
              <div style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>{r.title}</div>
            </div>
            <div style={{
              color: r.color, fontFamily: s.mono, fontSize: 11,
              background: `${r.color}15`, borderRadius: 4,
              padding: '2px 6px', display: 'inline-block',
            }}>
              {r.metric}
            </div>
          </button>
        ))}
      </div>

      <div style={{
        marginTop: 16, minHeight: 100,
        background: s.bg2, borderRadius: 12, padding: 20,
        border: `1px solid ${req ? req.color : s.border}`,
        transition: 'border-color 0.3s',
      }}>
        {req ? (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: req.color, flexShrink: 0,
              }} />
              <div style={{ color: req.color, fontSize: 14, fontWeight: 600 }}>
                {req.title}
              </div>
            </div>
            <p style={{ color: s.text2, fontSize: 13, lineHeight: 1.7, margin: 0 }}>
              {req.detail}
            </p>
          </>
        ) : (
          <div style={{
            color: s.text3, fontSize: 13, textAlign: 'center', paddingTop: 20,
          }}>
            Select a requirement above to see the details
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
