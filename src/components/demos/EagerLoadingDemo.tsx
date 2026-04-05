import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface PostRecord {
  id: number
  title: string
  authorId: number
}

interface AuthorRecord {
  id: number
  name: string
}

const authors: AuthorRecord[] = [
  { id: 1, name: 'Alice Johnson' },
  { id: 2, name: 'Bob Smith' },
  { id: 3, name: 'Carol White' },
  { id: 4, name: 'Dave Brown' },
  { id: 5, name: 'Eve Davis' },
]

const posts: PostRecord[] = [
  { id: 1, title: 'Getting Started with Rails', authorId: 1 },
  { id: 2, title: 'Advanced Caching Strategies', authorId: 2 },
  { id: 3, title: 'Database Optimization Tips', authorId: 1 },
  { id: 4, title: 'Background Jobs in Production', authorId: 3 },
  { id: 5, title: 'Testing Rails Applications', authorId: 4 },
  { id: 6, title: 'Deploying to Heroku', authorId: 2 },
  { id: 7, title: 'ActiveRecord Best Practices', authorId: 5 },
  { id: 8, title: 'API Design with Rails', authorId: 3 },
]

interface QueryEvent {
  sql: string
  time: number
  type: 'post' | 'author' | 'batch_author'
  authorId?: number
  authorName?: string
}

export default function EagerLoadingDemo() {
  const [mode, setMode] = useState<'lazy' | 'eager'>('lazy')
  const [running, setRunning] = useState(false)
  const [queries, setQueries] = useState<QueryEvent[]>([])
  const [renderedPosts, setRenderedPosts] = useState<{ post: PostRecord; authorName: string }[]>([])
  const [currentQueryIdx, setCurrentQueryIdx] = useState(-1)
  const [totalTime, setTotalTime] = useState(0)
  const [speed, setSpeed] = useState(1)

  const reset = useCallback(() => {
    setQueries([])
    setRenderedPosts([])
    setCurrentQueryIdx(-1)
    setTotalTime(0)
    setRunning(false)
  }, [])

  const run = useCallback(() => {
    if (running) return
    reset()
    setRunning(true)

    const allQueries: QueryEvent[] = []

    if (mode === 'lazy') {
      allQueries.push({
        sql: `SELECT * FROM posts LIMIT ${posts.length}`,
        time: 30,
        type: 'post',
      })
      posts.forEach(p => {
        allQueries.push({
          sql: `SELECT * FROM authors WHERE id = ${p.authorId}`,
          time: 15 + Math.floor(Math.random() * 10),
          type: 'author',
          authorId: p.authorId,
          authorName: authors.find(a => a.id === p.authorId)!.name,
        })
      })
    } else {
      allQueries.push({
        sql: `SELECT * FROM posts LIMIT ${posts.length}`,
        time: 30,
        type: 'post',
      })
      const uniqueAuthorIds = [...new Set(posts.map(p => p.authorId))]
      allQueries.push({
        sql: `SELECT * FROM authors WHERE id IN (${uniqueAuthorIds.join(', ')})`,
        time: 25,
        type: 'batch_author',
      })
    }
    setQueries(allQueries)
    setCurrentQueryIdx(0)
  }, [running, mode, reset])

  useEffect(() => {
    if (currentQueryIdx < 0 || currentQueryIdx >= queries.length) {
      if (currentQueryIdx >= queries.length && queries.length > 0) {
        setRunning(false)
      }
      return
    }

    const q = queries[currentQueryIdx]
    const timer = setTimeout(() => {
      setTotalTime(prev => prev + q.time)

      if (q.type === 'post') {
        setRenderedPosts([])
      } else if (q.type === 'author') {
        const post = posts.find(p => p.authorId === q.authorId)
        if (post && q.authorName) {
          setRenderedPosts(prev => [...prev, { post, authorName: q.authorName! }])
        }
      } else if (q.type === 'batch_author') {
        const allRendered = posts.map(p => ({
          post: p,
          authorName: authors.find(a => a.id === p.authorId)!.name,
        }))
        setRenderedPosts(allRendered)
      }

      setCurrentQueryIdx(prev => prev + 1)
    }, getStepDelay(300, speed))

    return () => clearTimeout(timer)
  }, [currentQueryIdx, queries, speed])

  const totalExpectedQueries = mode === 'lazy' ? 1 + posts.length : 2
  const allRendered = renderedPosts.length === posts.length

  return (
    <DemoBoundary name="Eager Loading">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: 'hidden' }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${s.border}`, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: s.bg, borderRadius: 6, border: `1px solid ${s.border}` }}>
              <button
                onClick={() => { setMode('lazy'); reset() }}
                disabled={running}
                style={{
                  padding: '6px 14px', fontSize: 13, fontFamily: s.mono, border: 'none', borderRadius: 5,
                  cursor: running ? 'not-allowed' : 'pointer',
                  background: mode === 'lazy' ? s.red : 'transparent',
                  color: mode === 'lazy' ? '#fff' : s.text3, transition: 'all 0.2s',
                }}
              >
                Lazy (N+1)
              </button>
              <button
                onClick={() => { setMode('eager'); reset() }}
                disabled={running}
                style={{
                  padding: '6px 14px', fontSize: 13, fontFamily: s.mono, border: 'none', borderRadius: 5,
                  cursor: running ? 'not-allowed' : 'pointer',
                  background: mode === 'eager' ? s.green : 'transparent',
                  color: mode === 'eager' ? '#000' : s.text3, transition: 'all 0.2s',
                }}
              >
                Eager (includes)
              </button>
            </div>

            <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text3 }}>
              {mode === 'lazy' ? 'posts.each { |p| p.author.name }' : 'Post.includes(:author).each { |p| p.author.name }'}
            </span>

            <button
              onClick={run}
              disabled={running}
              style={{
                marginLeft: 'auto', padding: '6px 14px', fontSize: 13, fontFamily: s.mono,
                border: `1px solid ${s.accent}`, borderRadius: 6,
                cursor: running ? 'not-allowed' : 'pointer',
                background: running ? s.bg3 : 'rgba(91,141,239,0.15)',
                color: running ? s.text3 : s.accent, transition: 'all 0.2s',
              }}
            >
              Run Query
            </button>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>

          <div style={{ display: 'flex', minHeight: 260 }}>
            <div style={{ width: 320, padding: 16, borderRight: `1px solid ${s.border}`, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>
                SQL QUERIES ({Math.min(currentQueryIdx + 1, queries.length)}/{totalExpectedQueries})
              </div>
              <div style={{ maxHeight: 230, overflowY: 'auto' }}>
                {queries.map((q, i) => (
                  <div key={i} style={{
                    padding: '6px 8px', marginBottom: 3, borderRadius: 4,
                    background: i === currentQueryIdx ? 'rgba(91,141,239,0.1)' : i < currentQueryIdx ? 'rgba(61,214,140,0.06)' : 'transparent',
                    border: `1px solid ${i === currentQueryIdx ? s.accent : i < currentQueryIdx ? s.green : 'transparent'}`,
                    transition: 'all 0.3s',
                  }}>
                    <div style={{
                      fontSize: 11, fontFamily: s.mono,
                      color: i === currentQueryIdx ? s.accent : i < currentQueryIdx ? s.green : s.text3,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {q.sql}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginTop: 2 }}>
                      {q.time}ms
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, padding: 16 }}>
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>
                RENDERED POSTS ({renderedPosts.length}/{posts.length})
              </div>
              <div style={{ maxHeight: 230, overflowY: 'auto' }}>
                {posts.map((post, i) => {
                  const rendered = renderedPosts.find(rp => rp.post.id === post.id)
                  return (
                    <div key={post.id} style={{
                      padding: '6px 8px', marginBottom: 3, borderRadius: 4,
                      background: rendered ? s.bg : 'transparent',
                      border: `1px solid ${rendered ? s.border : 'transparent'}`,
                      transition: 'all 0.3s',
                      opacity: rendered ? 1 : 0.3,
                    }}>
                      <div style={{ fontSize: 12, color: rendered ? s.text : s.text3, fontFamily: s.mono }}>
                        {post.title}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: s.mono, color: rendered ? s.text2 : s.text3, marginTop: 2 }}>
                        by {rendered ? rendered.authorName : '...'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', gap: 16, padding: '10px 16px',
            borderTop: `1px solid ${s.border}`, fontSize: 12, fontFamily: s.mono, color: s.text3,
          }}>
            <span>Mode: <span style={{ color: mode === 'lazy' ? s.red : s.green }}>{mode === 'lazy' ? 'Lazy' : 'Eager'}</span></span>
            <span>Queries: <span style={{ color: s.accent }}>{Math.min(currentQueryIdx + 1, queries.length)}/{totalExpectedQueries}</span></span>
            <span>Total time: <span style={{ color: totalTime > 200 ? s.red : s.green }}>{totalTime}ms</span></span>
            {allRendered && (
              <span style={{ color: s.green }}>
                {mode === 'lazy'
                  ? `${totalExpectedQueries} queries for ${posts.length} posts`
                  : `${totalExpectedQueries} queries for ${posts.length} posts`
                }
              </span>
            )}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
