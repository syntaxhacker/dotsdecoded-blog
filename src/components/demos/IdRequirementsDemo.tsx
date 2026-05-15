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

interface Req {
  id: string
  title: string
  desc: string
  why: string
  icon: string
  color: string
}

const reqs: Req[] = [
  {
    id: 'unique', title: 'Globally Unique',
    desc: 'No two IDs across the entire system are ever the same',
    why: 'Duplicate IDs corrupt foreign keys, break database indexes, and make it impossible to reconcile data across shards or regions. Uniqueness must hold across every node, every datacenter, and all time — even after restarts and failovers.',
    icon: 'U', color: s.accent,
  },
  {
    id: 'sortable', title: 'Time-Sortable',
    desc: 'IDs can be roughly ordered by their creation time',
    why: 'B-tree indexes in databases like MySQL and Postgres perform best with monotonically increasing keys. Random keys cause page splits, index fragmentation, and 10-100x slower inserts. Sortable IDs also simplify debugging and range queries.',
    icon: 'S', color: s.green,
  },
  {
    id: 'compact', title: '64-Bit Compact',
    desc: 'Fits in a standard integer type across all languages',
    why: '128-bit UUIDs take 2x storage in indexes, 2x memory in caches, and 2x network bandwidth. A 64-bit long is native on all modern CPUs, fits in a single register, and is the standard integer in most databases.',
    icon: 'C', color: s.yellow,
  },
  {
    id: 'throughput', title: 'High Throughput',
    desc: 'Generate 10K+ IDs per second per node without blocking',
    why: 'At Twitter scale, each service node generates thousands of IDs per second. Any per-ID coordination like a database write or network RPC kills throughput. The ID generator must be purely local computation.',
    icon: 'T', color: s.orange,
  },
  {
    id: 'available', title: 'Highly Available',
    desc: 'ID generation never goes down, even during failures',
    why: 'If ID generation stops, writes stop everywhere. No new tweets, no new orders, no new user registrations. The service must keep generating IDs even if the database or coordination service is unreachable.',
    icon: 'A', color: s.purple,
  },
  {
    id: 'nospof', title: 'No Single Point of Failure',
    desc: 'No centralized coordinator on the critical path of generation',
    why: 'A centralized ID server becomes a bottleneck and a failure domain. If it goes down, the entire system stops. The design must let each node generate IDs independently, with coordination only during initialization.',
    icon: 'N', color: s.red,
  },
]

export default function IdRequirementsDemo() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <DemoBoundary name="Distributed ID Requirements">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
        ID Requirements
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        A distributed ID generator must satisfy all of these properties. Click each requirement to understand why it matters.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {reqs.map(r => {
          const isOpen = selected === r.id
          return (
            <div key={r.id} style={{
              background: s.bg2, border: `1px solid ${isOpen ? r.color : s.border}`,
              borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }} onClick={() => setSelected(isOpen ? null : r.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: `${r.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: s.mono, fontWeight: 700, fontSize: 14, color: r.color, flexShrink: 0,
                }}>{r.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: s.text, fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{r.title}</div>
                  <div style={{ color: s.text3, fontSize: 12 }}>{r.desc}</div>
                </div>
                <div style={{
                  color: s.text3, fontSize: 14, fontFamily: s.mono,
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}>
                  {'\u25BC'}
                </div>
              </div>
              {isOpen && (
                <div style={{
                  padding: '0 18px 14px 68px', color: s.text2, fontSize: 13,
                  lineHeight: 1.6, borderTop: `1px solid ${s.border}`,
                  paddingTop: 12,
                }}>
                  {r.why}
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
