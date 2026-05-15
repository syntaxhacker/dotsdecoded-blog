import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface FollowedUser {
  id: number
  name: string
  followers: number
  isCelebrity: boolean
  color: string
  recentTweet: string
}

const allUsers: FollowedUser[] = [
  { id: 1, name: 'alice', followers: 12000, isCelebrity: false, color: s.accent, recentTweet: 'Working on distributed caching patterns' },
  { id: 2, name: 'bob', followers: 4500, isCelebrity: false, color: s.green, recentTweet: 'Deep dive on fanout strategies' },
  { id: 3, name: 'charlie', followers: 8900, isCelebrity: false, color: s.yellow, recentTweet: 'Redis vs Kafka for pub-sub' },
  { id: 4, name: 'diana', followers: 2300, isCelebrity: false, color: s.purple, recentTweet: 'Count-Min Sketch deep dive' },
  { id: 5, name: 'eve', followers: 6700, isCelebrity: false, color: s.orange, recentTweet: 'Elasticsearch inverted index' },
  { id: 6, name: 'frank', followers: 34000, isCelebrity: false, color: s.accent, recentTweet: 'Infrastructure for 500M tweets' },
  { id: 7, name: 'grace', followers: 1500, isCelebrity: false, color: s.green, recentTweet: 'Just joined the platform' },
  { id: 8, name: 'henry', followers: 82000, isCelebrity: true, color: s.red, recentTweet: 'New album dropping next month' },
  { id: 9, name: 'iris', followers: 250000, isCelebrity: true, color: s.red, recentTweet: 'World tour announced' },
  { id: 10, name: 'jack', followers: 1200, isCelebrity: false, color: s.purple, recentTweet: 'Learning system design' },
  { id: 11, name: 'kate', followers: 56000, isCelebrity: true, color: s.red, recentTweet: 'Tech conference keynote today' },
  { id: 12, name: 'leo', followers: 800, isCelebrity: false, color: s.orange, recentTweet: 'Building my first microservice' },
]

interface TimelineTweet {
  id: number
  authorName: string
  authorColor: string
  isCelebrity: boolean
  content: string
  source: 'push' | 'pull' | 'cache'
  sourceLabel: string
  time: number
}

export default function TwitterTimelineDemo() {
  const [followCount, setFollowCount] = useState(6)
  const [highlightSource, setHighlightSource] = useState<'all' | 'push' | 'pull' | 'cache'>('all')

  const followedUsers = useMemo(() => allUsers.slice(0, followCount), [followCount])

  const timelineTweets: TimelineTweet[] = useMemo(() => {
    return followedUsers.map((u, i) => ({
      id: i + 1,
      authorName: u.name,
      authorColor: u.color,
      isCelebrity: u.isCelebrity,
      content: u.recentTweet,
      source: u.isCelebrity ? 'pull' as const : i < 3 ? 'cache' as const : 'push' as const,
      sourceLabel: u.isCelebrity ? 'Pull (celebrity)' : i < 3 ? 'Cache (precomputed)' : 'Push (fanout)',
      time: Date.now() - i * 60000 * 2,
    }))
  }, [followedUsers])

  const filteredTweets = useMemo(() => {
    if (highlightSource === 'all') return timelineTweets
    return timelineTweets.filter(t => t.source === highlightSource)
  }, [timelineTweets, highlightSource])

  const pushCount = timelineTweets.filter(t => t.source === 'push').length
  const pullCount = timelineTweets.filter(t => t.source === 'pull').length
  const cacheCount = timelineTweets.filter(t => t.source === 'cache').length

  return (
    <DemoBoundary name="Timeline Generation">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: s.text3 }}>
              <span>Followed users ({followCount})</span>
              <span style={{ fontFamily: s.mono, color: s.accent }}>{followCount}</span>
            </div>
            <input type="range" min={2} max={12} value={followCount} onChange={e => setFollowCount(Number(e.target.value))} style={{ width: '100%', accentColor: s.accent, height: 4 }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}`, fontSize: 11, fontFamily: s.mono, color: s.text3 }}>
              FOLLOWING ({followedUsers.length})
            </div>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {followedUsers.map(u => (
                <div key={u.id} style={{
                  padding: '7px 10px', borderRadius: 5, background: s.bg, border: `1px solid ${s.border}`,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: u.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {u.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: s.text }}>{u.name}</div>
                    <div style={{ fontSize: 9, color: s.text3 }}>{u.followers.toLocaleString()} followers</div>
                  </div>
                  <div style={{
                    fontSize: 8, fontFamily: s.mono, padding: '2px 7px', borderRadius: 8,
                    background: u.isCelebrity ? `${s.red}15` : `${s.green}15`,
                    color: u.isCelebrity ? s.red : s.green,
                    border: `1px solid ${u.isCelebrity ? `${s.red}30` : `${s.green}30`}`,
                  }}>
                    {u.isCelebrity ? 'PULL' : 'PUSH'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>TIMELINE ({filteredTweets.length} tweets)</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {(['all', 'push', 'pull', 'cache'] as const).map(src => (
                  <button key={src} onClick={() => setHighlightSource(src)} style={{
                    padding: '2px 6px', fontSize: 8, fontFamily: s.mono, borderRadius: 3,
                    border: `1px solid ${highlightSource === src ? s.accent : s.border}`,
                    background: highlightSource === src ? `${s.accent}20` : 'transparent',
                    color: highlightSource === src ? s.accent : s.text3, cursor: 'pointer',
                  }}>
                    {src}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: 10, maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {filteredTweets.map(t => {
                const sourceColors = {
                  push: { bg: `${s.green}12`, border: `${s.green}30`, color: s.green, label: 'Push' },
                  pull: { bg: `${s.red}12`, border: `${s.red}30`, color: s.red, label: 'Pull' },
                  cache: { bg: `${s.accent}12`, border: `${s.accent}30`, color: s.accent, label: 'Cache' },
                }
                const sc = sourceColors[t.source]
                return (
                  <div key={t.id} style={{
                    padding: '8px 10px', borderRadius: 5, background: s.bg, border: `1px solid ${sc.border}`,
                    borderLeft: `3px solid ${sc.color}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%', background: t.authorColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 8, fontWeight: 700, color: '#fff',
                        }}>
                          {t.authorName[0].toUpperCase()}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: s.text }}>{t.authorName}</span>
                      </div>
                      <span style={{
                        fontSize: 8, fontFamily: s.mono, padding: '1px 6px', borderRadius: 6,
                        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                      }}>
                        {sc.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: s.text2, lineHeight: 1.4 }}>{t.content}</div>
                  </div>
                )
              })}
              {filteredTweets.length === 0 && (
                <div style={{ fontSize: 10, color: s.text3, textAlign: 'center', padding: 30 }}>
                  No tweets from {highlightSource} sources
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
          <div style={{ background: s.bg2, borderRadius: 6, padding: 10, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: s.green, marginBottom: 2 }}>Push ({pushCount})</div>
            <div style={{ fontSize: 9, color: s.text3, lineHeight: 1.4 }}>
              Pre-fanned into Redis cache at tweet time. O(1) read. Zero query cost at timeline load.
            </div>
          </div>
          <div style={{ background: s.bg2, borderRadius: 6, padding: 10, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: s.red, marginBottom: 2 }}>Pull ({pullCount})</div>
            <div style={{ fontSize: 9, color: s.text3, lineHeight: 1.4 }}>
              Fetched on demand from celebrity accounts. Queried at timeline load time and cached for 5 min.
            </div>
          </div>
          <div style={{ background: s.bg2, borderRadius: 6, padding: 10, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: s.accent, marginBottom: 2 }}>Cache ({cacheCount})</div>
            <div style={{ fontSize: 9, color: s.text3, lineHeight: 1.4 }}>
              Recent tweets served from Redis L1 cache. TTL reset on read. Warmed by fanout service.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10, padding: '8px 12px', background: `${s.accent}08`, borderRadius: 6, border: `1px solid ${s.accent}20`, fontSize: 10, color: s.text3, lineHeight: 1.5 }}>
          The timeline service merges three sources: precomputed cache (push), celebrity queries (pull), and recently arrived tweets. It deduplicates by tweet_id and sorts by created_at. The merge is a O(N) operation where N is the total number of tweets to display (typically 20-50).
        </div>
      </div>
    </DemoBoundary>
  )
}
