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

interface ReqGroup {
  id: string
  label: string
  items: ReqItem[]
}

interface ReqItem {
  id: string
  text: string
  impact: string
  enabled: boolean
  color: string
}

const initialGroups: ReqGroup[] = [
  {
    id: 'func', label: 'Functional Requirements', color: s.accent,
    items: [
      { id: 'f1', text: 'Post tweet with text and media', impact: 'Tweet storage, fanout, media pipeline', enabled: true, color: s.accent },
      { id: 'f2', text: 'View home timeline', impact: 'Timeline cache, fanout strategy, Redis', enabled: true, color: s.accent },
      { id: 'f3', text: 'Follow / unfollow users', impact: 'Follow graph, user service, fanout triggers', enabled: true, color: s.accent },
      { id: 'f4', text: 'Search tweets by content', impact: 'Inverted index, Elasticsearch, tokenizer', enabled: true, color: s.accent },
      { id: 'f5', text: 'View trending topics', impact: 'Count-Min Sketch, sliding windows, Kafka', enabled: true, color: s.accent },
      { id: 'f6', text: 'Like and retweet', impact: 'Like counters, Redis hot storage, sharding', enabled: true, color: s.accent },
      { id: 'f7', text: 'View user profile tweets', impact: 'Tweet store sharded by user_id, cache', enabled: true, color: s.accent },
    ],
  },
  {
    id: 'nfunc', label: 'Non-Functional Requirements', color: s.purple,
    items: [
      { id: 'nf1', text: 'Timeline load P99 < 500ms', impact: 'Push fanout, Redis cache, CDN edge', enabled: true, color: s.purple },
      { id: 'nf2', text: '99.9% uptime SLA', impact: 'Replication, multi-AZ, circuit breakers', enabled: true, color: s.purple },
      { id: 'nf3', text: '500M+ tweets/day throughput', impact: 'Kafka async, sharded DB, batch writes', enabled: true, color: s.purple },
      { id: 'nf4', text: '20B+ timeline views/day', impact: 'Read replicas, cache hierarchy, CDN', enabled: true, color: s.purple },
      { id: 'nf5', text: 'Tweets visible within 5 seconds', impact: 'Eventual consistency, Kafka lag < 5s', enabled: true, color: s.purple },
      { id: 'nf6', text: 'Global multi-region deployment', impact: 'Cross-region Kafka, geo-DNS, CDN', enabled: true, color: s.purple },
      { id: 'nf7', text: 'Scalable to 500M+ users', impact: 'Horizontal scaling, Hashing, consistent hashing', enabled: true, color: s.purple },
    ],
  },
]

export default function TwitterRequirementsDemo() {
  const [groups, setGroups] = useState<ReqGroup[]>(initialGroups)

  const toggleItem = (groupId: string, itemId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      return { ...g, items: g.items.map(it => it.id === itemId ? { ...it, enabled: !it.enabled } : it) }
    }))
  }

  const allItems = groups.flatMap(g => g.items)
  const enabled = allItems.filter(it => it.enabled)
  const disabled = allItems.filter(it => !it.enabled)

  return (
    <DemoBoundary name="Twitter Requirements Checklist">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: s.text3, fontFamily: s.mono }}>Toggle requirements to see how each affects architecture</span>
            <div style={{ display: 'flex', gap: 10, fontSize: 11, fontFamily: s.mono }}>
              <span style={{ color: s.green }}>{enabled.length} enabled</span>
              <span style={{ color: s.red }}>{disabled.length} disabled</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {groups.map(g => (
              <div key={g.id} style={{ padding: 16, borderRight: g.id === 'func' ? `1px solid ${s.border}` : 'none' }}>
                <div style={{ fontSize: 11, fontFamily: s.mono, color: g.color, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {g.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {g.items.map(it => (
                    <div
                      key={it.id}
                      onClick={() => toggleItem(g.id, it.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px',
                        borderRadius: 6, cursor: 'pointer', opacity: it.enabled ? 1 : 0.35,
                        background: it.enabled ? `${g.color}08` : 'transparent',
                        border: `1px solid ${it.enabled ? `${g.color}25` : 'transparent'}`,
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                        border: `2px solid ${it.enabled ? g.color : s.border}`,
                        background: it.enabled ? g.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {it.enabled && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>x</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: s.text, lineHeight: 1.4 }}>{it.text}</div>
                        {it.enabled && (
                          <div style={{ fontSize: 9, fontFamily: s.mono, color: s.text3, marginTop: 3, lineHeight: 1.3 }}>
                            Affects: {it.impact}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 16px', borderTop: `1px solid ${s.border}`, background: s.bg, fontSize: 11, color: s.text2, fontFamily: s.mono, lineHeight: 1.5 }}>
            {enabled.length === allItems.length
              ? 'All requirements enabled. The system needs push + pull fanout, Redis cache, Elasticsearch, Count-Min Sketch, and multi-region Kafka.'
              : `Architecture impact: ${enabled.length}/${allItems.length} requirements active. Disabling requirements removes the need for their associated infrastructure.`
            }
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
