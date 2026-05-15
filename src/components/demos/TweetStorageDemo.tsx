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

type ViewMode = 'schema' | 'sharding' | 'cache'

const users = [
  { id: 1, name: 'alice', tweets: 12, color: s.accent },
  { id: 2, name: 'bob', tweets: 8, color: s.green },
  { id: 3, name: 'charlie', tweets: 45, color: s.yellow },
  { id: 4, name: 'diana', tweets: 3, color: s.purple },
  { id: 5, name: 'eve', tweets: 1200, color: s.orange },
]

interface Tweet {
  id: number
  userId: number
  content: string
  time: string
}

const recentTweets: Tweet[] = [
  { id: 1001, userId: 1, content: 'Working on system design...', time: '1m ago' },
  { id: 1002, userId: 2, content: 'Just shipped a new feature', time: '3m ago' },
  { id: 1003, userId: 1, content: 'Distributed systems are fun', time: '5m ago' },
  { id: 1004, userId: 3, content: 'Exploring Redis internals', time: '7m ago' },
  { id: 1005, userId: 4, content: 'Morning coffee coding', time: '10m ago' },
  { id: 1006, userId: 5, content: 'New blog post on scalability', time: '12m ago' },
  { id: 1007, userId: 2, content: 'Refactoring the cache layer', time: '15m ago' },
  { id: 1008, userId: 3, content: 'Kafka topic design patterns', time: '18m ago' },
]

const shardCount = 3

function getShard(tweetId: number): number {
  return (tweetId % shardCount) + 1
}

function getUserShard(userId: number): number {
  return (userId % shardCount) + 1
}

export default function TweetStorageDemo() {
  const [view, setView] = useState<ViewMode>('schema')
  const [highlightShard, setHighlightShard] = useState<number | null>(null)

  return (
    <DemoBoundary name="Tweet Storage Strategy">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {([
            { key: 'schema' as const, label: 'Schema' },
            { key: 'sharding' as const, label: 'Sharding' },
            { key: 'cache' as const, label: 'Cache Layer' },
          ]).map(v => (
            <button key={v.key} onClick={() => setView(v.key)} style={{
              flex: 1, padding: '9px 0', borderRadius: 6, border: `1px solid ${view === v.key ? s.accent : s.border}`,
              background: view === v.key ? `${s.accent}18` : s.bg2, color: view === v.key ? s.accent : s.text3,
              fontFamily: s.mono, fontSize: 12, cursor: 'pointer',
            }}>
              {v.label}
            </button>
          ))}
        </div>

        <div style={{ background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          {view === 'schema' && (
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.accent, marginBottom: 12 }}>TWEET TABLE SCHEMA (Cassandra)</div>

              <div style={{ fontFamily: s.mono, fontSize: 11, lineHeight: 1.8, color: s.text2 }}>
                <div style={{ padding: '6px 10px', background: s.bg, borderRadius: 4, marginBottom: 4 }}>
                  <span style={{ color: s.purple }}>tweet_id</span> <span style={{ color: s.text3 }}>BIGINT PRIMARY KEY</span>
                </div>
                <div style={{ padding: '6px 10px', background: s.bg, borderRadius: 4, marginBottom: 4 }}>
                  <span style={{ color: s.green }}>user_id</span> <span style={{ color: s.text3 }}>BIGINT</span>
                </div>
                <div style={{ padding: '6px 10px', background: s.bg, borderRadius: 4, marginBottom: 4 }}>
                  <span style={{ color: s.yellow }}>content</span> <span style={{ color: s.text3 }}>VARCHAR(280)</span>
                </div>
                <div style={{ padding: '6px 10px', background: s.bg, borderRadius: 4, marginBottom: 4 }}>
                  <span style={{ color: s.orange }}>media_urls</span> <span style={{ color: s.text3 }}>LIST&lt;TEXT&gt;</span>
                </div>
                <div style={{ padding: '6px 10px', background: s.bg, borderRadius: 4, marginBottom: 4 }}>
                  <span style={{ color: s.accent }}>created_at</span> <span style={{ color: s.text3 }}>TIMESTAMP</span>
                </div>
                <div style={{ padding: '6px 10px', background: s.bg, borderRadius: 4 }}>
                  <span style={{ color: s.text3 }}>PRIMARY KEY (</span><span style={{ color: s.purple }}>tweet_id</span><span style={{ color: s.text3 }}>)</span>
                </div>
              </div>

              <div style={{ marginTop: 12, padding: '10px 12px', background: s.bg, borderRadius: 6, border: `1px solid ${s.border}` }}>
                <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, marginBottom: 6 }}>SHARDING STRATEGY COMPARISON</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ padding: '8px 10px', borderRadius: 4, border: `1px solid ${s.accent}30`, background: `${s.accent}08` }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: s.accent, marginBottom: 3 }}>Shard by tweet_id</div>
                    <div style={{ fontSize: 9, color: s.text3, lineHeight: 1.5 }}>
                      Even write distribution. Scatter-gather on reads for user timeline. Better for write-heavy workloads.
                    </div>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 4, border: `1px solid ${s.orange}30`, background: `${s.orange}08` }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: s.orange, marginBottom: 3 }}>Shard by user_id</div>
                    <div style={{ fontSize: 9, color: s.text3, lineHeight: 1.5 }}>
                      Fast reads for user timeline (single shard). Hot partition risk for celebrity users. Better for read-heavy workloads.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'sharding' && (
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.accent, marginBottom: 8 }}>TWEETS DISTRIBUTED ACROSS {shardCount} SHARDS</div>
              <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, marginBottom: 12 }}>
                Click a user to highlight their shard. Users = same colored border.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${shardCount}, 1fr)`, gap: 8, marginBottom: 14 }}>
                {Array.from({ length: shardCount }).map((_, si) => {
                  const shardTweets = recentTweets.filter(t => getShard(t.id) === si + 1)
                  const shardUsers = Array.from(new Set(shardTweets.map(t => t.userId)))
                  return (
                    <div key={si} style={{
                      background: s.bg, borderRadius: 6, padding: 10, border: `1px solid ${highlightShard === si + 1 ? s.accent : s.border}`,
                    }}>
                      <div style={{ fontSize: 10, fontFamily: s.mono, color: s.accent, fontWeight: 600, marginBottom: 6 }}>Shard {si + 1}</div>
                      {shardTweets.map(t => {
                        const user = users.find(u => u.id === t.userId)
                        const highlighted = highlightShard === null || getUserShard(t.userId) === highlightShard
                        return (
                          <div key={t.id} style={{
                            padding: '5px 7px', marginBottom: 3, borderRadius: 4,
                            background: getUserShard(t.userId) === si + 1 ? `${user?.color}12` : 'transparent',
                            border: `1px solid ${getUserShard(t.userId) === si + 1 ? `${user?.color}30` : 'transparent'}`,
                            opacity: highlighted ? 1 : 0.4,
                            cursor: 'pointer',
                          }}
                            onClick={() => setHighlightShard(highlightShard === getUserShard(t.userId) ? null : getUserShard(t.userId))}
                          >
                            <div style={{ fontSize: 9, fontFamily: s.mono, color: user?.color }}>{user?.name}</div>
                            <div style={{ fontSize: 9, color: s.text3 }}>{t.content.slice(0, 30)}...</div>
                          </div>
                        )
                      })}
                      {shardUsers.length > 0 && (
                        <div style={{ fontSize: 8, color: s.text3, fontFamily: s.mono, marginTop: 4 }}>
                          Users: {shardUsers.map(id => users.find(u => u.id === id)?.name).join(', ')}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div style={{ padding: '10px 12px', background: s.bg, borderRadius: 6, border: `1px solid ${s.border}`, fontSize: 10, color: s.text3, lineHeight: 1.5 }}>
                When sharded by <span style={{ color: s.accent, fontFamily: s.mono }}>tweet_id</span>, tweets are evenly distributed but reading all tweets from a single user requires querying every shard. The secondary index on <span style={{ color: s.green, fontFamily: s.mono }}>(user_id, created_at)</span> is stored in a separate table sharded by user_id for fast user-specific queries.
              </div>
            </div>
          )}

          {view === 'cache' && (
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.accent, marginBottom: 12 }}>TIMELINE CACHE LAYER</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {users.slice(0, 4).map(u => (
                  <div key={u.id} style={{
                    background: s.bg, borderRadius: 6, padding: 10, border: `1px solid ${s.border}`,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: u.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {u.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: s.text }}>{u.name}</div>
                      <div style={{ fontSize: 10, color: s.text3 }}>{u.tweets} tweets cached</div>
                    </div>
                    <div style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: 9, fontFamily: s.mono,
                      background: `${s.green}15`, color: s.green, border: `1px solid ${s.green}30`,
                    }}>
                      CACHED
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ background: s.bg, borderRadius: 6, padding: 10, border: `1px solid ${s.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: s.green, marginBottom: 3 }}>L1: Redis</div>
                  <div style={{ fontSize: 9, color: s.text3, lineHeight: 1.4 }}>
                    Precomputed timeline entries. Key: timeline:{user_id}. Sorted set by timestamp. TTL: 24h.
                  </div>
                </div>
                <div style={{ background: s.bg, borderRadius: 6, padding: 10, border: `1px solid ${s.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: s.accent, marginBottom: 3 }}>L2: Memcached</div>
                  <div style={{ fontSize: 9, color: s.text3, lineHeight: 1.4 }}>
                    Tweet content objects. Key: tweet:{tweet_id}. Cache-aside pattern. Populated on miss.
                  </div>
                </div>
                <div style={{ background: s.bg, borderRadius: 6, padding: 10, border: `1px solid ${s.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: s.orange, marginBottom: 3 }}>L3: DB</div>
                  <div style={{ fontSize: 9, color: s.text3, lineHeight: 1.4 }}>
                    Cassandra persistent store. Fallback on cache miss. Replicated for durability.
                  </div>
                </div>
              </div>

              <div style={{ padding: '10px 12px', background: `${s.green}08`, borderRadius: 6, border: `1px solid ${s.green}20`, fontSize: 10, color: s.text3, lineHeight: 1.5 }}>
                Timeline read path: Redis (L1 hit, 95%+) -- Memcached (batch fetch tweet objects) -- assemble response. On L1 miss: query Cassandra for push entries + pull remaining from followed users, then warm L1 cache.
              </div>
            </div>
          )}
        </div>
      </div>
    </DemoBoundary>
  )
}
