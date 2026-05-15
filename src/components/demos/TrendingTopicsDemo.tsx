import { useState, useEffect, useRef, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const hashtagPool = [
  '#SystemDesign', '#Scalability', '#Kafka', '#Redis', '#Cassandra',
  '#DistributedSystems', '#Microservices', '#DevOps', '#CloudComputing',
  '#DataEngineering', '#Backend', '#TechTwitter', '#Coding', '#Algorithms',
  '#Database', '#Caching', '#LoadBalancing', '#Monitoring', '#Docker',
]

const tweetTemplates = [
  'Love exploring {h} patterns in large-scale systems',
  'Just published a deep dive into {h} best practices',
  '{h} is the key to building resilient architectures',
  'Learning {h} has completely changed how I think about performance',
  'Thread: everything you need to know about {h}',
  'Conference talk on {h} was incredible today',
  'Hot take: {h} is underrated in modern architectures',
  'Migrating our stack to use {h} -- so far so good',
  'The {h} community keeps producing amazing tools',
  'RFC: how does your team approach {h}?',
]

interface Tweet {
  id: number
  text: string
  hashtags: string[]
  time: number
}

interface HashtagCount {
  hashtag: string
  exact: number
  approx: number
  velocity: number
}

const windowOptions = [
  { label: '1m', ms: 60000 },
  { label: '5m', ms: 300000 },
  { label: '1h', ms: 3600000 },
  { label: '24h', ms: 86400000 },
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

let gNextId = 2000

function generateTweet(now: number): Tweet {
  const htCount = 1 + Math.floor(Math.random() * 2)
  const hashtags: string[] = []
  for (let i = 0; i < htCount; i++) {
    const h = pick(hashtagPool)
    if (!hashtags.includes(h)) hashtags.push(h)
  }
  const template = pick(tweetTemplates)
  const text = template.replace('{h}', hashtags[0])
  return { id: gNextId++, text, hashtags, time: now }
}

function simulateApprox(exact: number): number {
  const noise = Math.floor(exact * (Math.random() * 0.06 - 0.03))
  return Math.max(exact + noise, 0)
}

export default function TrendingTopicsDemo() {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [running, setRunning] = useState(false)
  const [windowIdx, setWindowIdx] = useState(1)
  const [topN, setTopN] = useState(10)
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const now = Date.now()

  const trending = useMemo(() => {
    const windowMs = windowOptions[windowIdx].ms
    const cutoff = now - windowMs * 2
    const windowed = tweets.filter(t => t.time >= cutoff)
    const counts = new Map<string, number>()
    windowed.forEach(t => {
      t.hashtags.forEach(h => {
        counts.set(h, (counts.get(h) || 0) + 1)
      })
    })
    const result: HashtagCount[] = Array.from(counts.entries())
      .map(([hashtag, exact]) => ({
        hashtag, exact,
        approx: simulateApprox(exact),
        velocity: exact / (windowMs / 60000),
      }))
      .sort((a, b) => b.exact - a.exact)
      .slice(0, topN)
    return result
  }, [tweets, windowIdx, topN, now])

  const totalHashtags = tweets.reduce((sum, t) => sum + t.hashtags.length, 0)

  useEffect(() => {
    if (!running && streamRef.current) {
      clearInterval(streamRef.current)
      streamRef.current = null
      return
    }
    if (!running) return

    streamRef.current = setInterval(() => {
      const batchSize = 1 + Math.floor(Math.random() * 3)
      const newTweets: Tweet[] = []
      for (let i = 0; i < batchSize; i++) {
        newTweets.push(generateTweet(Date.now()))
      }
      setTweets(prev => {
        const combined = [...prev, ...newTweets]
        const cutoff = Date.now() - 86400000 * 2
        return combined.filter(t => t.time >= cutoff)
      })
    }, 400)

    return () => {
      if (streamRef.current) clearInterval(streamRef.current)
    }
  }, [running])

  const clearStream = () => {
    setRunning(false)
    setTweets([])
  }

  return (
    <DemoBoundary name="Trending Topics Engine">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
        <div style={{ background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => setRunning(!running)} style={{
              padding: '7px 16px', borderRadius: 6, border: `1px solid ${running ? s.red : s.green}`,
              background: running ? `${s.red}15` : `${s.green}15`,
              color: running ? s.red : s.green, fontFamily: s.mono, fontSize: 11, cursor: 'pointer',
            }}>
              {running ? 'Stop Stream' : 'Start Tweet Stream'}
            </button>
            <button onClick={clearStream} style={{
              padding: '7px 12px', borderRadius: 6, border: `1px solid ${s.border}`,
              background: s.bg2, color: s.text3, fontFamily: s.mono, fontSize: 11, cursor: 'pointer',
            }}>
              Clear
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>Window:</span>
              {windowOptions.map((wo, i) => (
                <button key={wo.label} onClick={() => setWindowIdx(i)} style={{
                  padding: '3px 8px', borderRadius: 4, border: `1px solid ${windowIdx === i ? s.accent : s.border}`,
                  background: windowIdx === i ? `${s.accent}18` : 'transparent', color: windowIdx === i ? s.accent : s.text3,
                  fontFamily: s.mono, fontSize: 10, cursor: 'pointer',
                }}>
                  {wo.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>Top:</span>
              <select value={topN} onChange={e => setTopN(Number(e.target.value))} style={{
                background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 6px',
                color: s.text, fontFamily: s.mono, fontSize: 10, cursor: 'pointer',
              }}>
                {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <div style={{ padding: 14, borderRight: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>
                TWEET STREAM ({tweets.length} tweets, {totalHashtags} hashtags)
              </div>
              <div ref={containerRef} style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {tweets.slice(-30).reverse().map(t => (
                  <div key={t.id} style={{
                    padding: '7px 9px', background: s.bg, borderRadius: 5, border: `1px solid ${s.border}`,
                    fontSize: 10, color: s.text2, lineHeight: 1.4,
                  }}>
                    <div>{t.text}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                      {t.hashtags.map(h => (
                        <span key={h} style={{
                          fontSize: 8, fontFamily: s.mono, padding: '1px 5px', borderRadius: 3,
                          background: `${s.accent}15`, color: s.accent, border: `1px solid ${s.accent}30`,
                        }}>
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {tweets.length === 0 && (
                  <div style={{ fontSize: 10, color: s.text3, textAlign: 'center', padding: 40 }}>
                    Click "Start Tweet Stream" to simulate tweets flowing in
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>
                TRENDING TOPICS (window: {windowOptions[windowIdx].label})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {trending.map((item, i) => {
                  const maxExact = Math.max(...trending.map(t => t.exact), 1)
                  const barPct = (item.exact / maxExact) * 100
                  const approxErr = Math.abs(item.exact - item.approx)
                  return (
                    <div key={item.hashtag} style={{
                      padding: '6px 9px', background: s.bg, borderRadius: 5, border: `1px solid ${s.border}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            width: 16, height: 16, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: i < 3 ? s.accent : 'transparent', fontSize: 8, fontWeight: 700, color: i < 3 ? '#fff' : s.text3,
                            fontFamily: s.mono,
                          }}>
                            {i + 1}
                          </span>
                          <span style={{ fontSize: 10, fontFamily: s.mono, color: s.accent, fontWeight: 600 }}>{item.hashtag}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 9, fontFamily: s.mono, color: s.green }}>{item.exact}</span>
                          <span style={{ fontSize: 8, color: s.text3 }}>(approx: {item.approx})</span>
                        </div>
                      </div>
                      <div style={{ height: 4, background: s.bg3, borderRadius: 2, marginBottom: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${barPct}%`, height: '100%', background: s.accent, borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: s.text3 }}>
                        <span>velocity: {item.velocity.toFixed(1)} tweets/min</span>
                        {approxErr > 0 && <span>error: +/-{approxErr}</span>}
                      </div>
                    </div>
                  )
                })}
                {trending.length === 0 && (
                  <div style={{ fontSize: 10, color: s.text3, textAlign: 'center', padding: 40 }}>
                    No trending topics yet. Start the stream.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ padding: '10px 14px', borderTop: `1px solid ${s.border}`, background: s.bg, fontSize: 10, color: s.text3, lineHeight: 1.5, fontFamily: s.mono }}>
            <span style={{ color: s.accent }}>Exact</span> count uses full hashtag frequency. <span style={{ color: s.orange }}>Approx</span> simulates Count-Min Sketch with +/-3% error. The time window determines which hashtags trend: shorter windows surface breaking news, longer windows show sustained popularity. At 15K tweets/sec, exact counting is infeasible -- approximation is essential.
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
