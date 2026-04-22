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

type SortMode = 'time' | 'relevance'

interface FeedPost {
  id: string
  username: string
  caption: string
  likes: number
  comments: number
  hoursAgo: number
  relevanceScore: number
  cacheHit: boolean
}

const followedUsers = ['alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace']

const postTemplates = [
  { caption: 'Golden hour at the coast', likes: 234, comments: 18 },
  { caption: 'New recipe: homemade pasta', likes: 567, comments: 45 },
  { caption: 'City skyline from the rooftop', likes: 1203, comments: 89 },
  { caption: 'Morning coffee ritual', likes: 89, comments: 7 },
  { caption: 'Hiking trail through the mountains', likes: 445, comments: 32 },
  { caption: 'Studio session behind the scenes', likes: 312, comments: 24 },
  { caption: 'Street art in the neighborhood', likes: 678, comments: 51 },
  { caption: 'Farmers market finds', likes: 156, comments: 12 },
  { caption: 'Sunset from the balcony', likes: 890, comments: 67 },
  { caption: 'Workspace setup tour', likes: 1023, comments: 78 },
  { caption: 'Weekend brunch spread', likes: 234, comments: 19 },
  { caption: 'Vintage bookshop discovery', likes: 456, comments: 34 },
]

function generatePosts(): FeedPost[] {
  return postTemplates.map((tmpl, i) => ({
    id: `post_${i}`,
    username: followedUsers[i % followedUsers.length],
    caption: tmpl.caption,
    likes: tmpl.likes + Math.floor(Math.random() * 100),
    comments: tmpl.comments + Math.floor(Math.random() * 10),
    hoursAgo: i * 0.8 + Math.random() * 0.5,
    relevanceScore: (tmpl.likes * 0.3 + tmpl.comments * 2 + (12 - i) * 50 + Math.random() * 100),
    cacheHit: i < 8,
  }))
}

export default function NewsFeedDemo() {
  const [sortMode, setSortMode] = useState<SortMode>('time')
  const [visibleCount, setVisibleCount] = useState(5)
  const [posts] = useState<FeedPost[]>(generatePosts)
  const [loading, setLoading] = useState(false)

  const sortedPosts = useMemo(() => {
    if (sortMode === 'time') {
      return [...posts].sort((a, b) => a.hoursAgo - b.hoursAgo)
    }
    return [...posts].sort((a, b) => b.relevanceScore - a.relevanceScore)
  }, [posts, sortMode])

  const visiblePosts = sortedPosts.slice(0, visibleCount)
  const hasMore = visibleCount < sortedPosts.length

  const loadMore = () => {
    setLoading(true)
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + 4, sortedPosts.length))
      setLoading(false)
    }, 400)
  }

  const timeAgo = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`
    if (hours < 24) return `${Math.round(hours)}h`
    return `${Math.round(hours / 24)}d`
  }

  return (
    <DemoBoundary name="News Feed Simulation">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['time', 'relevance'] as SortMode[]).map(mode => (
              <button key={mode} onClick={() => { setSortMode(mode); setVisibleCount(5) }} style={{
                padding: '6px 16px', borderRadius: 6, border: `1px solid ${sortMode === mode ? s.accent : s.border}`,
                background: sortMode === mode ? `${s.accent}20` : s.bg2, color: sortMode === mode ? s.accent : s.text3,
                fontFamily: s.mono, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
              }}>
                {mode === 'time' ? 'Chronological' : 'Relevance'}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>
            {visiblePosts.filter(p => p.cacheHit).length}/{visiblePosts.length} cache hits
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {visiblePosts.map((post, i) => (
            <div key={post.id} style={{
              background: s.bg2, borderRadius: 8, padding: 14, border: `1px solid ${post.cacheHit ? s.green + '30' : s.yellow + '30'}`,
              opacity: 0, animation: `fadeSlideIn 0.3s ease ${i * 0.05}s forwards`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: `hsl(${(post.username.charCodeAt(0) * 37) % 360}, 50%, 40%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: s.text,
                  }}>
                    {post.username[0].toUpperCase()}
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: s.text }}>{post.username}</span>
                    <span style={{ fontSize: 11, color: s.text3, marginLeft: 8 }}>{timeAgo(post.hoursAgo)} ago</span>
                  </div>
                </div>
                <div style={{
                  fontSize: 9, fontFamily: s.mono, padding: '2px 8px', borderRadius: 10,
                  background: post.cacheHit ? `${s.green}15` : `${s.yellow}15`,
                  color: post.cacheHit ? s.green : s.yellow,
                  border: `1px solid ${post.cacheHit ? s.green + '30' : s.yellow + '30'}`,
                }}>
                  {post.cacheHit ? 'CACHE HIT' : 'CACHE MISS'}
                </div>
              </div>
              <div style={{ fontSize: 13, color: s.text2, marginBottom: 10, lineHeight: 1.4 }}>{post.caption}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: s.text3 }}>
                <span>{post.likes.toLocaleString()} likes</span>
                <span>{post.comments} comments</span>
                {sortMode === 'relevance' && (
                  <span style={{ color: s.accent, fontFamily: s.mono }}>score: {post.relevanceScore.toFixed(0)}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <button onClick={loadMore} disabled={loading} style={{
            width: '100%', padding: '10px 0', borderRadius: 6, border: `1px solid ${s.border}`,
            background: loading ? s.bg3 : s.bg2, color: loading ? s.text3 : s.text2,
            fontFamily: s.mono, fontSize: 12, cursor: loading ? 'wait' : 'pointer',
          }}>
            {loading ? 'Loading...' : `Load more (${sortedPosts.length - visibleCount} remaining)`}
          </button>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <div style={{ background: s.bg2, borderRadius: 6, padding: 12, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.text, marginBottom: 6 }}>How it works</div>
            <div style={{ fontSize: 11, color: s.text3, lineHeight: 1.6 }}>
              {sortMode === 'time'
                ? 'Posts sorted by created_at DESC. Pre-computed feed (fan-out on write) means most posts are served from cache. Cache misses trigger a real-time query to following users\' recent posts.'
                : 'Posts ranked by a relevance score: likes, comments, recency, and user engagement signals. Requires ML model scoring. More compute per feed load but better user engagement.'
              }
            </div>
          </div>
          <div style={{ background: s.bg2, borderRadius: 6, padding: 12, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.text, marginBottom: 6 }}>Performance</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: s.text3 }}>Cache hit rate</span>
                <span style={{ fontFamily: s.mono, color: s.green }}>{Math.round((visiblePosts.filter(p => p.cacheHit).length / Math.max(visiblePosts.length, 1)) * 100)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: s.text3 }}>Avg latency</span>
                <span style={{ fontFamily: s.mono, color: s.accent }}>{sortMode === 'time' ? '~15ms' : '~85ms'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: s.text3 }}>DB queries / page</span>
                <span style={{ fontFamily: s.mono, color: s.text2 }}>{visiblePosts.filter(p => !p.cacheHit).length || 1}</span>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </DemoBoundary>
  )
}
