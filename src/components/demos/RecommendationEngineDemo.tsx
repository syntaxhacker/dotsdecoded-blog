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

interface Movie {
  id: string
  title: string
  genres: string[]
}

const movies: Movie[] = [
  { id: 'm1', title: 'Stranger Things', genres: ['Sci-Fi', 'Horror'] },
  { id: 'm2', title: 'The Witcher', genres: ['Fantasy', 'Action'] },
  { id: 'm3', title: 'Bridgerton', genres: ['Romance', 'Drama'] },
  { id: 'm4', title: 'Squid Game', genres: ['Thriller', 'Drama'] },
  { id: 'm5', title: 'Money Heist', genres: ['Crime', 'Thriller'] },
  { id: 'm6', title: 'The Crown', genres: ['Drama', 'History'] },
  { id: 'm7', title: 'Black Mirror', genres: ['Sci-Fi', 'Thriller'] },
  { id: 'm8', title: 'Wednesday', genres: ['Comedy', 'Fantasy'] },
]

interface User {
  id: string
  name: string
}

type Rating = 0 | 1 | 2 | 3 | 4 | 5

const users: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
  { id: 'u3', name: 'Carol' },
  { id: 'u4', name: 'Diana' },
  { id: 'u5', name: 'You' },
]

const initRatings: Record<string, Record<string, Rating>> = {
  u1: { m1: 5, m2: 4, m3: 1, m4: 3, m5: 4, m6: 2, m7: 5, m8: 3 },
  u2: { m1: 4, m2: 5, m3: 2, m4: 4, m5: 5, m6: 1, m7: 4, m8: 2 },
  u3: { m1: 1, m2: 2, m3: 5, m4: 2, m5: 1, m6: 5, m7: 2, m8: 4 },
  u4: { m1: 3, m2: 3, m3: 4, m4: 5, m5: 3, m6: 4, m7: 3, m8: 5 },
  u5: { m1: 4, m2: 5, m3: 0, m4: 0, m5: 5, m6: 0, m7: 4, m8: 0 },
}

type RecMethod = 'collaborative' | 'content-based'

const movieColors: Record<string, string> = {
  'Sci-Fi': s.purple, Horror: s.red, Fantasy: s.accent, Action: s.orange,
  Romance: s.red, Drama: s.yellow, Thriller: s.green, Crime: s.purple,
  History: s.orange, Comedy: s.green,
}

function cosineSimilarity(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0, normA = 0, normB = 0
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const va = a[key] || 0
    const vb = b[key] || 0
    dot += va * vb
    normA += va * va
    normB += vb * vb
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export default function RecommendationEngineDemo() {
  const [method, setMethod] = useState<RecMethod>('collaborative')
  const [ratings, setRatings] = useState(initRatings)
  const [selectedUserId, setSelectedUserId] = useState('u5')

  const currentUser = ratings[selectedUserId]

  const getCollaborativeRecs = () => {
    const similarities = users
      .filter(u => u.id !== selectedUserId)
      .map(u => ({ userId: u.id, similarity: cosineSimilarity(currentUser || {}, ratings[u.id] || {}) }))
      .sort((a, b) => b.similarity - a.similarity)

    const similarUsers = similarities.filter(s => s.similarity > 0.3).slice(0, 2)
    const scores: Record<string, { score: number; count: number }> = {}
    for (const similar of similarUsers) {
      const userRatings = ratings[similar.userId] || {}
      for (const [movieId, rating] of Object.entries(userRatings)) {
        if (rating > 0 && (!currentUser || !currentUser[movieId] || currentUser[movieId] === 0)) {
          if (!scores[movieId]) scores[movieId] = { score: 0, count: 0 }
          scores[movieId].score += rating * similar.similarity
          scores[movieId].count++
        }
      }
    }
    return Object.entries(scores)
      .map(([movieId, data]) => ({ movieId, score: data.score / data.count }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }

  const getContentBasedRecs = () => {
    const likedMovies = Object.entries(currentUser || {})
      .filter(([, rating]) => rating! >= 4)
      .map(([movieId]) => movies.find(m => m.id === movieId))
      .filter(Boolean) as Movie[]

    const likedGenres = new Set<string>()
    likedMovies.forEach(m => m.genres.forEach(g => likedGenres.add(g)))

    const scores: { movieId: string; score: number }[] = []
    for (const movie of movies) {
      if (currentUser && currentUser[movie.id] && currentUser[movie.id]! > 0) continue
      const overlap = movie.genres.filter(g => likedGenres.has(g)).length
      if (overlap > 0) scores.push({ movieId: movie.id, score: overlap / movie.genres.length })
    }
    return scores.sort((a, b) => b.score - a.score).slice(0, 3)
  }

  const setRating = (userId: string, movieId: string, rating: Rating) => {
    setRatings(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [movieId]: rating },
    }))
  }

  const recs = method === 'collaborative' ? getCollaborativeRecs() : getContentBasedRecs()

  const simUsers = method === 'collaborative'
    ? users.filter(u => u.id !== selectedUserId).map(u => ({
        ...u,
        sim: cosineSimilarity(ratings[selectedUserId] || {}, ratings[u.id] || {}),
      })).filter(u => u.sim > 0).sort((a, b) => b.sim - a.sim).slice(0, 2)
    : []

  const likedGenres = method === 'content-based'
    ? Object.entries(currentUser || {}).filter(([, r]) => r! >= 4).map(([id]) => movies.find(m => m.id === id)).filter(Boolean).flatMap(m => (m as Movie).genres)
    : []

  return (
    <DemoBoundary name="Recommendation Engine">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, padding: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 6, letterSpacing: -0.3 }}>Recommendation Engine</div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
            Rate movies to see personalized recommendations using collaborative filtering or content-based filtering.
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {(['collaborative', 'content-based'] as RecMethod[]).map(m => (
              <button key={m} onClick={() => setMethod(m)} style={{
                padding: '6px 16px', borderRadius: 6, border: `1px solid ${method === m ? s.accent : s.border}`,
                background: method === m ? `${s.accent}20` : s.bg, color: method === m ? s.accent : s.text3,
                fontFamily: s.mono, fontSize: 12, cursor: 'pointer',
              }}>
                {m === 'collaborative' ? 'Collaborative Filtering' : 'Content-Based Filtering'}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 8, fontFamily: s.mono }}>USER-MOVIE RATINGS (click to rate)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(8, 1fr)', gap: 3, fontSize: 11, fontFamily: s.mono }}>
              <div style={{ color: s.text3 }}></div>
              {movies.map(m => (
                <div key={m.id} style={{ color: s.text3, textAlign: 'center', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title.split(' ')[0]}</div>
              ))}
              {users.map(u => (
                <div key={u.id} style={{ display: 'contents' }}>
                  <div style={{ color: u.id === selectedUserId ? s.accent : s.text2, display: 'flex', alignItems: 'center', fontSize: 10 }}>
                    {u.name}
                  </div>
                  {movies.map(m => {
                    const r = ratings[u.id]?.[m.id] || 0
                    const isCurrent = u.id === selectedUserId
                    return (
                      <div key={m.id} style={{
                        textAlign: 'center', padding: '2px 0',
                        background: r > 0 ? `${r >= 4 ? s.green : r >= 3 ? s.yellow : s.orange}15` : 'transparent',
                        borderRadius: 3, cursor: isCurrent ? 'pointer' : 'default',
                      }} onClick={() => {
                        if (!isCurrent) return
                        const nextRating = ((r + 1) % 6) as Rating
                        setRating(u.id, m.id, nextRating)
                      }}>
                        <span style={{
                          color: r > 0 ? (r >= 4 ? s.green : r >= 3 ? s.yellow : s.orange) : s.text3,
                          fontWeight: r > 0 ? 600 : 400,
                        }}>{r > 0 ? r : '-'}</span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9, color: s.text3, marginTop: 4 }}>Click "You" row cells to set/cycle ratings (0-5)</div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: 16, border: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 11, color: s.accent, marginBottom: 8, fontFamily: s.mono }}>RECOMMENDATIONS</div>
              {recs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recs.map((rec, i) => {
                    const movie = movies.find(m => m.id === rec.movieId)
                    if (!movie) return null
                    return (
                      <div key={rec.movieId} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                        background: s.bg2, borderRadius: 6, border: `1px solid ${s.border}`,
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', background: s.accent + '20',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: s.mono, fontSize: 11, color: s.accent, fontWeight: 700,
                        }}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>{movie.title}</div>
                          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                            {movie.genres.map(g => (
                              <span key={g} style={{
                                fontSize: 9, padding: '1px 6px', borderRadius: 3,
                                background: `${movieColors[g] || s.text3}20`,
                                color: movieColors[g] || s.text3,
                                fontFamily: s.mono,
                              }}>{g}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ fontFamily: s.mono, fontSize: 12, color: s.accent }}>
                          {(rec.score * 100).toFixed(0)}%
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ color: s.text3, fontSize: 12 }}>Rate more movies to get recommendations.</div>
              )}
            </div>

            <div style={{ flex: 1, background: s.bg, borderRadius: 8, padding: 16, border: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 8, fontFamily: s.mono }}>
                {method === 'collaborative' ? 'SIMILAR USERS' : 'YOUR LIKED GENRES'}
              </div>
              {method === 'collaborative' ? (
                simUsers.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {simUsers.map(u => (
                      <div key={u.id} style={{
                        padding: '8px 12px', background: s.bg2, borderRadius: 6, border: `1px solid ${s.border}`,
                      }}>
                        <div style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontFamily: s.mono, fontSize: 10, color: s.accent, marginTop: 2 }}>
                          Similarity: {(u.sim * 100).toFixed(1)}%
                        </div>
                        <div style={{ fontSize: 10, color: s.text3, marginTop: 2 }}>
                          Liked: {Object.entries(ratings[u.id] || {}).filter(([, r]) => r! >= 4).map(([id]) => movies.find(m => m.id === id)?.title).filter(Boolean).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: s.text3, fontSize: 12 }}>Not enough data to find similar users.</div>
                )
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[...new Set(likedGenres)].length > 0 ? (
                    [...new Set(likedGenres)].map(g => (
                      <span key={g} style={{
                        padding: '4px 10px', borderRadius: 4, fontSize: 11, fontFamily: s.mono,
                        background: `${movieColors[g] || s.text3}20`, color: movieColors[g] || s.text3,
                      }}>{g}</span>
                    ))
                  ) : (
                    <div style={{ color: s.text3, fontSize: 12 }}>Rate movies 4+ to see your genre preferences.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono, marginBottom: 6 }}>
              {method === 'collaborative' ? 'HOW IT WORKS' : 'HOW IT WORKS'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(method === 'collaborative' ? [
                'Find users with similar rating patterns using cosine similarity',
                'Identify movies those similar users rated highly that you have not seen',
                'Rank candidates by weighted score based on similarity and rating',
              ] : [
                'Extract genre tags from movies you rated 4 or 5 stars',
                'Build a profile of your preferred genres',
                'Find unwatched movies whose genre tags match your profile',
              ]).map((line, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: s.text3 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: s.accent, flexShrink: 0 }} />
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
