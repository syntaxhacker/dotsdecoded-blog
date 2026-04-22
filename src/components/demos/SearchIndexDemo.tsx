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

interface Document {
  id: number
  title: string
  text: string
}

const documents: Document[] = [
  { id: 1, title: 'Beach Photography Tips', text: 'Capture stunning sunset photos at the beach. Use a tripod for long exposure shots of waves crashing against the shore. Golden hour lighting creates warm tones in landscape photography.' },
  { id: 2, title: 'Mountain Hiking Guide', text: 'Essential hiking tips for mountain trails. Pack enough water and snacks for your mountain adventure. Always check weather conditions before hiking in the mountains.' },
  { id: 3, title: 'Cooking Pasta Recipes', text: 'Learn to cook authentic Italian pasta recipes. Fresh pasta dough is simple to make with flour and eggs. The secret to great pasta is salting the cooking water generously.' },
  { id: 4, title: 'Web Development Basics', text: 'Start learning web development with HTML and CSS. Modern web frameworks make building interactive websites faster. Responsive design ensures your site works on mobile devices.' },
  { id: 5, title: 'Fitness Workout Plans', text: 'Effective workout plans for building muscle strength. Combine cardio exercises with weight training for best results. Consistency in your fitness routine is more important than intensity.' },
  { id: 6, title: 'Travel Photography Gear', text: 'Best camera lenses for travel photography. A wide-angle lens captures expansive landscapes and city skylines. Travel light with a versatile mirrorless camera setup.' },
]

const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'it', 'its', 'your', 'you', 'best', 'ensure'])

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w))
}

function buildIndex(docs: Document[]): Map<string, Map<number, number>> {
  const index = new Map<string, Map<number, number>>()
  docs.forEach(doc => {
    const tokens = tokenize(doc.text)
    const freq = new Map<string, number>()
    tokens.forEach(t => { freq.set(t, (freq.get(t) || 0) + 1) })
    freq.forEach((count, term) => {
      if (!index.has(term)) index.set(term, new Map())
      index.get(term)!.set(doc.id, count)
    })
  })
  return index
}

function tfIdf(term: string, docId: number, index: Map<string, Map<number, number>>, totalDocs: number): number {
  const posting = index.get(term)
  if (!posting) return 0
  const tf = posting.get(docId) || 0
  const df = posting.size
  const idf = Math.log((totalDocs + 1) / (df + 1)) + 1
  return tf * idf
}

export default function SearchIndexDemo() {
  const [query, setQuery] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null)
  const [showIndex, setShowIndex] = useState(false)

  const index = useMemo(() => buildIndex(documents), [])
  const queryTerms = useMemo(() => tokenize(query), [query])

  const results = useMemo(() => {
    if (queryTerms.length === 0) return []
    const scores = new Map<number, number>()
    documents.forEach(doc => {
      let score = 0
      queryTerms.forEach(term => {
        score += tfIdf(term, doc.id, index, documents.length)
      })
      if (score > 0) scores.set(doc.id, score)
    })
    return Array.from(scores.entries()).sort((a, b) => b[1] - a[1])
  }, [queryTerms, index])

  const activeDoc = documents.find(d => d.id === selectedDoc)
  const relevantPostings = queryTerms.length > 0
    ? Array.from(index.entries()).filter(([term]) => queryTerms.includes(term)).slice(0, 15)
    : []

  return (
    <DemoBoundary name="Search Index Explorer">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a search query (e.g. 'photography', 'mountain hiking')"
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
            Index
          </button>
        </div>

        {queryTerms.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono, lineHeight: '24px' }}>Tokens:</span>
            {queryTerms.map(term => (
              <span key={term} style={{
                padding: '2px 8px', borderRadius: 4, background: `${s.accent}20`, color: s.accent,
                fontFamily: s.mono, fontSize: 11, border: `1px solid ${s.accent}40`,
              }}>
                {term}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: showIndex ? '1fr 1fr' : '1fr', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: s.bg2, borderRadius: 8, padding: 16, border: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 10, fontFamily: s.mono }}>
                SEARCH RESULTS ({results.length} matches)
              </div>
              {results.length === 0 && queryTerms.length > 0 && (
                <div style={{ fontSize: 12, color: s.text3, textAlign: 'center', padding: 20 }}>No matching documents</div>
              )}
              {results.length === 0 && queryTerms.length === 0 && (
                <div style={{ fontSize: 12, color: s.text3, textAlign: 'center', padding: 20 }}>Type a query to search</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.map(([docId, score]) => {
                  const doc = documents.find(d => d.id === docId)!
                  const termHighlights = queryTerms.filter(t => doc.text.toLowerCase().includes(t))
                  return (
                    <div
                      key={docId}
                      onClick={() => setSelectedDoc(selectedDoc === docId ? null : docId)}
                      style={{
                        padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                        background: selectedDoc === docId ? `${s.accent}10` : s.bg,
                        border: `1px solid ${selectedDoc === docId ? s.accent + '40' : s.border}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: selectedDoc === docId ? s.accent : s.text }}>{doc.title}</span>
                        <span style={{ fontFamily: s.mono, fontSize: 11, color: s.green }}>{score.toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: s.text3, lineHeight: 1.4, marginBottom: 4 }}>
                        {doc.text.slice(0, 100)}...
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {termHighlights.map(t => (
                          <span key={t} style={{
                            fontSize: 9, fontFamily: s.mono, padding: '1px 5px', borderRadius: 3,
                            background: `${s.yellow}15`, color: s.yellow, border: `1px solid ${s.yellow}30`,
                          }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {activeDoc && (
              <div style={{ background: s.bg2, borderRadius: 8, padding: 16, border: `1px solid ${s.accent}30` }}>
                <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, fontFamily: s.mono }}>DOCUMENT DETAIL</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: s.accent, marginBottom: 8 }}>{activeDoc.title}</div>
                <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.6, marginBottom: 10 }}>{activeDoc.text}</div>
                <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono, marginBottom: 6 }}>TF-IDF BREAKDOWN</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {queryTerms.map(term => {
                    const score = tfIdf(term, activeDoc.id, index, documents.length)
                    const posting = index.get(term)
                    const tf = posting?.get(activeDoc.id) || 0
                    const df = posting?.size || 0
                    return (
                      <div key={term} style={{
                        display: 'grid', gridTemplateColumns: '80px 50px 50px 80px', gap: 6,
                        padding: '4px 8px', borderRadius: 4, background: s.bg, fontSize: 10, fontFamily: s.mono, alignItems: 'center',
                      }}>
                        <span style={{ color: s.accent }}>{term}</span>
                        <span style={{ color: s.text3 }}>tf:{tf}</span>
                        <span style={{ color: s.text3 }}>df:{df}</span>
                        <span style={{ color: s.green, textAlign: 'right' }}>score: {score.toFixed(2)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {showIndex && (
            <div style={{ background: s.bg2, borderRadius: 8, padding: 16, border: `1px solid ${s.border}`, maxHeight: 500, overflowY: 'auto' }}>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 10, fontFamily: s.mono }}>
                INVERTED INDEX ({index.size} terms)
              </div>
              {relevantPostings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {relevantPostings.map(([term, posting]) => (
                    <div key={term} style={{
                      background: s.bg, borderRadius: 6, padding: '8px 10px',
                      border: `1px solid ${s.accent}30`,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: s.accent, fontFamily: s.mono, marginBottom: 4 }}>"{term}"</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {Array.from(posting.entries()).map(([docId, count]) => (
                          <span key={docId} style={{
                            fontSize: 10, fontFamily: s.mono, padding: '2px 6px', borderRadius: 3,
                            background: `${s.purple}15`, color: s.purple, border: `1px solid ${s.purple}30`,
                          }}>
                            doc{docId}:{count}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {Array.from(index.entries()).slice(0, 20).map(([term, posting]) => (
                    <div key={term} style={{
                      padding: '4px 8px', borderRadius: 4, background: s.bg,
                      fontSize: 10, fontFamily: s.mono, color: s.text3,
                    }}>
                      <span style={{ color: s.accent }}>"{term}"</span>
                      {' -> '}
                      {Array.from(posting.keys()).map(d => `doc${d}`).join(', ')}
                    </div>
                  ))}
                  {index.size > 20 && (
                    <div style={{ fontSize: 10, color: s.text3, textAlign: 'center', padding: 8 }}>
                      ...and {index.size - 20} more terms
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div style={{ marginTop: 14, background: `${s.green}10`, border: `1px solid ${s.green}30`, borderRadius: 6, padding: '10px 14px', fontSize: 11, color: s.green, lineHeight: 1.5 }}>
            Results ranked by TF-IDF score. TF (term frequency) measures how often the term appears in the document. IDF (inverse document frequency) boosts rare terms that distinguish documents. This is the core algorithm behind Elasticsearch and Lucene.
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
