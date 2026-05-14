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

interface TweetDoc {
  id: number
  author: string
  content: string
  followers: number
  likes: number
  retweets: number
  hoursAgo: number
}

const tweetDocs: TweetDoc[] = [
  { id: 1, author: 'alice', content: 'System design interview prep: understand distributed caching patterns and their trade-offs', followers: 12000, likes: 342, retweets: 89, hoursAgo: 1 },
  { id: 2, author: 'bob', content: 'Just published a deep dive on Twitter-scale timeline fanout with push and pull strategies', followers: 4500, likes: 234, retweets: 56, hoursAgo: 2 },
  { id: 3, author: 'charlie', content: 'Kafka vs Redis for pub-sub: when to use each for event-driven architectures', followers: 8900, likes: 567, retweets: 134, hoursAgo: 3 },
  { id: 4, author: 'diana', content: 'Designing a trending topics system with Count-Min Sketch approximate counting', followers: 2300, likes: 123, retweets: 45, hoursAgo: 5 },
  { id: 5, author: 'alice', content: 'Database sharding strategies for social feeds: by user_id vs by tweet_id', followers: 12000, likes: 456, retweets: 98, hoursAgo: 6 },
  { id: 6, author: 'eve', content: 'Elasticsearch inverted index explained with real tweet search examples', followers: 6700, likes: 321, retweets: 76, hoursAgo: 8 },
  { id: 7, author: 'bob', content: 'Microservices for social platforms: tweet service, timeline service, search service', followers: 4500, likes: 198, retweets: 43, hoursAgo: 10 },
  { id: 8, author: 'frank', content: 'Handling 500M tweets per day: the complete infrastructure breakdown', followers: 34000, likes: 1023, retweets: 289, hoursAgo: 12 },
  { id: 9, author: 'charlie', content: 'Redis sorted sets for precomputed timelines: implementation guide', followers: 8900, likes: 432, retweets: 102, hoursAgo: 14 },
  { id: 10, author: 'diana', content: 'When to use eventual consistency in social feed systems', followers: 2300, likes: 156, retweets: 34, hoursAgo: 18 },
  { id: 11, author: 'eve', content: 'Cache invalidation strategies for timeline caches at scale', followers: 6700, likes: 278, retweets: 65, hoursAgo: 22 },
  { id: 12, author: 'frank', content: 'Capacity planning for a Twitter-like social network: storage, bandwidth, compute', followers: 34000, likes: 876, retweets: 234, hoursAgo: 28 },
]

const stopWords = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'each', 'every',
  'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if',
  'when', 'where', 'how', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'it', 'its', 'your', 'their', 'they', 'them',
])

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w))
}

function buildIndex(docs: TweetDoc[]): Record<string, Map<number, number>> {
  const idx: Record<string, Map<number, number>> = {}
  docs.forEach(doc => {
    const tokens = tokenize(doc.content)
    tokens.forEach(t => {
      if (!idx[t]) idx[t] = new Map()
      idx[t].set(doc.id, (idx[t].get(doc.id) || 0) + 1)
    })
  })
  return idx
}

function rankTweets(queryTokens: string[], docs: TweetDoc[], idx: Record<string, Map<number, number>>) {
  const scored: { doc: TweetDoc; score: number; breakdown: { term: string; score: number }[] }[] = []
  docs.forEach(doc => {
    let totalScore = 0
    const breakdown: { term: string; score: number }[] = []
    queryTokens.forEach(term => {
      const posting = idx[term]
      const tf = posting?.get(doc.id) || 0
      const df = posting?.size || 0
      const textRel = tf * Math.log((docs.length + 1) / (df + 1))
      const recency = Math.exp(-0.1 * doc.hoursAgo)
      const followerBoost = Math.log10(doc.followers + 1) / 5
      const engagement = (doc.likes + doc.retweets * 3) / 1000
      const termScore = 0.4 * textRel + 0.3 * recency + 0.2 * followerBoost + 0.1 * engagement
      totalScore += termScore
      breakdown.push({ term, score: termScore })
    })
    if (totalScore > 0) scored.push({ doc, score: totalScore, breakdown })
  })
  return scored.sort((a, b) => b.score - a.score)
}

export default function TwitterSearchDemo() {
  const [query, setQuery] = useState('')
  const [showIndex, setShowIndex] = useState(false)

  const index = useMemo(() => buildIndex(tweetDocs), [])
  const queryTokens = useMemo(() => tokenize(query), [query])

  const results = useMemo(() => {
    if (queryTokens.length === 0) return []
    return rankTweets(queryTokens, tweetDocs, index)
  }, [queryTokens, index])

  const relevantTerms = queryTokens.length > 0
    ? queryTokens.filter(t => index[t]).slice(0, 10)
    : []

  return (
    <DemoBoundary name="Tweet Search Engine">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tweets (e.g. 'cache', 'timeline', 'database sharding')"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 6, border: `1px solid ${s.border}`,
              background: s.bg2, color: s.text, fontFamily: s.mono, fontSize: 13, outline: 'none',
            }}
          />
          <button onClick={() => setShowIndex(!showIndex)} style={{
            padding: '10px 14px', borderRadius: 6, border: `1px solid ${showIndex ? s.accent : s.border}`,
            background: showIndex ? `${s.accent}20` : s.bg2, color: showIndex ? s.accent : s.text3,
            fontFamily: s.mono, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {showIndex ? 'Hide Index' : 'Show Index'}
          </button>
        </div>

        {queryTokens.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, lineHeight: '22px' }}>Tokens:</span>
            {queryTokens.map(t => (
              <span key={t} style={{
                padding: '2px 8px', borderRadius: 4, background: `${s.accent}18`, color: s.accent,
                fontFamily: s.mono, fontSize: 10, border: `1px solid ${s.accent}35`,
              }}>
                {t}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: showIndex ? '1fr 1fr' : '1fr', gap: 12 }}>
          <div style={{ background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}`, fontSize: 11, fontFamily: s.mono, color: s.text3 }}>
              RESULTS ({results.length} matches)
            </div>
            <div style={{ padding: 10, maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.length === 0 && queryTokens.length > 0 && (
                <div style={{ fontSize: 11, color: s.text3, textAlign: 'center', padding: 30 }}>No matching tweets</div>
              )}
              {results.length === 0 && queryTokens.length === 0 && (
                <div style={{ fontSize: 11, color: s.text3, textAlign: 'center', padding: 30 }}>Type a query to search tweets</div>
              )}
              {results.map(({ doc, score, breakdown }) => (
                <div key={doc.id} style={{
                  padding: '10px 12px', borderRadius: 6, background: s.bg, border: `1px solid ${s.border}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: `hsl(${(doc.author.charCodeAt(0) * 37) % 360}, 50%, 40%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {doc.author[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: s.text }}>{doc.author}</span>
                      <span style={{ fontSize: 9, color: s.text3 }}>{doc.hoursAgo}h ago</span>
                    </div>
                    <span style={{ fontFamily: s.mono, fontSize: 10, color: s.green }}>{score.toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.4, marginBottom: 6 }}>{doc.content}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 9, color: s.text3, fontFamily: s.mono }}>
                    <span>{doc.likes} likes</span>
                    <span>{doc.retweets} retweets</span>
                    <span>{doc.followers.toLocaleString()} followers</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                    {breakdown.map(b => (
                      <span key={b.term} style={{
                        fontSize: 8, fontFamily: s.mono, padding: '1px 5px', borderRadius: 3,
                        background: `${s.yellow}12`, color: s.yellow, border: `1px solid ${s.yellow}25`,
                      }}>
                        {b.term}: {b.score.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showIndex && (
            <div style={{ background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}`, fontSize: 11, fontFamily: s.mono, color: s.text3 }}>
                INVERTED INDEX ({Object.keys(index).length} terms)
              </div>
              <div style={{ padding: 10, maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(relevantTerms.length > 0 ? relevantTerms : Object.keys(index).slice(0, 30)).map(term => {
                  const posting = index[term]
                  if (!posting) return null
                  return (
                    <div key={term} style={{
                      padding: '6px 9px', background: s.bg, borderRadius: 5, border: `1px solid ${s.accent}25`,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: s.accent, fontFamily: s.mono, marginBottom: 3 }}>{term}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {Array.from(posting.entries()).map(([docId, count]) => {
                          const doc = tweetDocs.find(d => d.id === docId)
                          return (
                            <span key={docId} style={{
                              fontSize: 8, fontFamily: s.mono, padding: '1px 5px', borderRadius: 3,
                              background: `${s.purple}12`, color: s.purple, border: `1px solid ${s.purple}25`,
                            }}>
                              {doc?.author}({docId}):{count}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {Object.keys(index).length > 30 && relevantTerms.length === 0 && (
                  <div style={{ fontSize: 9, color: s.text3, textAlign: 'center', padding: 8 }}>
                    ...and {Object.keys(index).length - 30} more terms
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: `${s.green}08`, borderRadius: 6, border: `1px solid ${s.green}20`, fontSize: 10, color: s.text3, lineHeight: 1.5 }}>
            Ranking formula: <span style={{ fontFamily: s.mono, color: s.text2 }}>0.4 * text_relevance + 0.3 * recency + 0.2 * follower_boost + 0.1 * engagement</span>. Text relevance uses TF-IDF (term frequency x inverse document frequency). Recency decays exponentially with tweet age.
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
