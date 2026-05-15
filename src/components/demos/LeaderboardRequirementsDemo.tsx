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

interface ReqItem {
  id: string
  label: string
  category: 'functional' | 'non-functional' | 'future'
  desc: string
  enabled: boolean
}

const initialReqs: ReqItem[] = [
  { id: 'r1', label: 'Real-time score updates', category: 'functional', desc: 'Scores reflect in the leaderboard within 1 second of submission. Players compete live and need instant rank feedback.', enabled: true },
  { id: 'r2', label: 'Global ranking', category: 'functional', desc: 'All players ranked globally by score. The main leaderboard millions of players see. Single sorted set with all entries.', enabled: true },
  { id: 'r3', label: 'Friend-only leaderboard', category: 'functional', desc: 'Players see ranks among their friends. Requires a social graph. Subset ranking using intersection of sorted sets.', enabled: true },
  { id: 'r4', label: 'Top-N + rank-around-me pagination', category: 'functional', desc: 'Top 100 for leaders. Rank-around-me (e.g., 45,000 +/- 10) for every other player. Both must be O(log N).', enabled: true },
  { id: 'r5', label: 'Percentile distribution', category: 'functional', desc: 'What percentile a player falls in. "Top 5%!" Requires ZCARD for total count and ZREVRANK for position.', enabled: true },
  { id: 'r6', label: 'Reset periods', category: 'functional', desc: 'Daily, weekly, seasonal leaderboards that reset independently. Key naming: leaderboard:daily:2026-05-17.', enabled: true },
  { id: 'r7', label: '<50ms p99 read latency', category: 'non-functional', desc: 'Leaderboard queries must complete in under 50ms at p99. Redis provides ~1ms reads; caching top-N ensures it.', enabled: true },
  { id: 'r8', label: '100K+ writes/sec throughput', category: 'non-functional', desc: 'Peak hours can see millions of concurrent score submissions. Redis handles 100K+ ops/sec on a single node.', enabled: true },
  { id: 'r9', label: 'Strong consistency on reads', category: 'non-functional', desc: 'A player who just scored 100 must see themselves at the correct rank immediately. Eventually consistent leaderboards confuse players.', enabled: true },
  { id: 'r10', label: 'Historical data & trends', category: 'future', desc: 'Store score histories so players see rank progression over time. Data warehouse for analytics dashboards.', enabled: false },
  { id: 'r11', label: 'Multi-region active-active', category: 'future', desc: 'Players in EU and US both see low latency. Redis CRDTs or active-passive replication.', enabled: false },
]

const catConfig = {
  functional: { label: 'Functional', color: s.accent },
  'non-functional': { label: 'Non-Functional', color: s.purple },
  future: { label: 'Future', color: s.text3 },
}

export default function LeaderboardRequirementsDemo() {
  const [reqs, setReqs] = useState<ReqItem[]>(initialReqs)
  const [selected, setSelected] = useState<string | null>(null)

  const toggleReq = (id: string) => {
    setReqs(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const enabled = reqs.filter(r => r.enabled)
  const counts = {
    functional: enabled.filter(r => r.category === 'functional').length,
    'non-functional': enabled.filter(r => r.category === 'non-functional').length,
    future: enabled.filter(r => r.category === 'future').length,
  }

  return (
    <DemoBoundary name="Leaderboard Requirements">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontFamily: s.mono, color: s.text2 }}>Toggle requirements to define scope</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 11, fontFamily: s.mono }}>
            <span style={{ color: s.accent }}>{counts.functional} functional</span>
            <span style={{ color: s.purple }}>{counts['non-functional']} non-functional</span>
            <span style={{ color: s.text3 }}>{counts.future} future</span>
          </div>
        </div>

        <div style={{ padding: 12 }}>
          {(['functional', 'non-functional', 'future'] as const).map(cat => {
            const cc = catConfig[cat]
            const items = reqs.filter(r => r.category === cat)
            if (items.length === 0) return null
            return (
              <div key={cat} style={{ marginBottom: cat === 'future' ? 0 : 16 }}>
                <div style={{ fontSize: 11, fontFamily: s.mono, color: cc.color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, padding: '0 4px' }}>
                  {cc.label}
                </div>
                {items.map(r => (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', marginBottom: 3,
                    borderRadius: 8, background: selected === r.id ? `${cc.color}0a` : 'transparent',
                    opacity: r.enabled ? 1 : 0.4, transition: 'all 0.15s', cursor: 'pointer',
                  }}
                    onClick={() => setSelected(selected === r.id ? null : r.id)}
                  >
                    <button onClick={(e) => { e.stopPropagation(); toggleReq(r.id) }} style={{
                      width: 18, height: 18, borderRadius: 4, border: `2px solid ${r.enabled ? cc.color : s.border}`,
                      background: r.enabled ? cc.color : 'transparent', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                    }}>
                      {r.enabled && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>x</span>}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: s.text, fontWeight: r.enabled ? 500 : 400 }}>{r.label}</div>
                      {selected === r.id && (
                        <div style={{ fontSize: 12, color: s.text2, marginTop: 6, lineHeight: 1.5, paddingLeft: 10, borderLeft: `2px solid ${cc.color}44` }}>
                          {r.desc}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        <div style={{ padding: '12px 16px', borderTop: `1px solid ${s.border}`, background: s.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text3 }}>
            {enabled.length} of {reqs.length} requirements active
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['functional', 'non-functional', 'future'].map(cat => {
              const activeCount = reqs.filter(r => r.category === cat && r.enabled).length
              const totalCount = reqs.filter(r => r.category === cat).length
              return (
                <div key={cat} style={{
                  height: 6, width: 40, borderRadius: 3, background: s.bg3,
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(activeCount / totalCount) * 100}%`, height: '100%',
                    background: catConfig[cat as keyof typeof catConfig].color,
                    borderRadius: 3, transition: 'width 0.3s',
                  }} />
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ padding: '10px 16px', borderTop: `1px solid ${s.border}`, fontSize: 11, fontFamily: s.mono, color: s.text3, display: 'flex', gap: 16 }}>
          <span>Click a row to see details</span>
          <span>Toggle checkboxes to enable/disable</span>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
