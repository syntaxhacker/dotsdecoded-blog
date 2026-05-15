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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

const items = [
  { id: 'putget', label: 'Put / Get API', desc: 'Simple key-value interface for insert and lookup operations' },
  { id: 'ha', label: 'High Availability', desc: 'System stays operational when nodes fail or the network partitions' },
  { id: 'pt', label: 'Partition Tolerance', desc: 'Continues functioning despite network splits between nodes' },
  { id: 'tunable', label: 'Tunable Consistency (N/R/W)', desc: 'Per-operation control over consistency vs latency trade-off' },
  { id: 'scale', label: 'Horizontal Scalability', desc: 'Add nodes to increase capacity without downtime or reconfiguration' },
  { id: 'dur', label: 'Durability', desc: 'Data persists through machine failures by replicating to N nodes' },
]

export default function KvRequirementsDemo() {
  const [checked, setChecked] = useState<Set<string>>(new Set(items.map((r) => r.id)))

  const toggle = (id: string) => {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setChecked(next)
  }

  const pct = Math.round((checked.size / items.length) * 100)

  return (
    <DemoBoundary name="KV Store Requirements">
      <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
        <div style={SEC}>
          <div style={H}>System Requirements</div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
            A Dynamo-style distributed key-value store makes deliberate design choices. Toggle each requirement below to understand the priority.
          </p>
          {items.map((item) => {
            const on = checked.has(item.id)
            return (
              <div
                key={item.id}
                onClick={() => toggle(item.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 14px',
                  background: on ? `${s.accent}08` : 'transparent',
                  borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                  marginBottom: 6, border: `1px solid ${on ? `${s.accent}30` : 'transparent'}`,
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  background: on ? s.accent : 'transparent',
                  border: `2px solid ${on ? s.accent : s.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {on && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: on ? s.text : s.text2, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                    {item.label}
                  </div>
                  <div style={{ color: s.text3, fontSize: 12, lineHeight: 1.5 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            )
          })}
          <div style={{ marginTop: 16, padding: '12px 14px', background: s.bg, borderRadius: 8, border: `1px solid ${s.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: s.text2, fontSize: 13 }}>Requirements defined</span>
              <span style={{ color: checked.size === items.length ? s.green : s.accent, fontFamily: s.mono, fontSize: 14, fontWeight: 700 }}>
                {checked.size}/{items.length} ({pct}%)
              </span>
            </div>
            <div style={{ marginTop: 8, height: 6, background: s.bg3, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: `linear-gradient(90deg, ${s.accent}, ${s.green})`,
                borderRadius: 3, transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
