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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

const docs = [
  { id: 1, text: 'A quick brown fox jumps over the lazy dog' },
  { id: 2, text: 'The quick brown fox eats the chicken' },
  { id: 3, text: 'A lazy dog sleeps under the brown fox' },
]

const stopWords = new Set(['a', 'an', 'the', 'is', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'over', 'under'])
const tokenize = (t: string) => t.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)

function buildIndex() {
  const index: Record<string, { docId: number; positions: number[] }[]> = {}
  for (const doc of docs) {
    const tokens = tokenize(doc.text)
    for (let i = 0; i < tokens.length; i++) {
      const term = tokens[i]
      if (!index[term]) index[term] = []
      let entry = index[term].find(p => p.docId === doc.id)
      if (!entry) {
        entry = { docId: doc.id, positions: [] }
        index[term].push(entry)
      }
      entry.positions.push(i)
    }
  }
  return index
}

const invertedIndex = buildIndex()
const sortedTerms = Object.keys(invertedIndex).sort()

export default function EsInvertedIndexDemo() {
  const [query, setQuery] = useState('')
  const [highlightedTerm, setHighlightedTerm] = useState<string | null>(null)

  const matchedTerms = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase().trim()
    return sortedTerms.filter(t => t.includes(q))
  }, [query])

  const matchingDocIds = useMemo(() => {
    if (matchedTerms.length === 0) return new Set<number>()
    const ids = new Set<number>()
    for (const term of matchedTerms) {
      for (const p of invertedIndex[term]) {
        ids.add(p.docId)
      }
    }
    return ids
  }, [matchedTerms])

  return (
    <DemoBoundary name="Elasticsearch Inverted Index">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Inverted Index Explorer</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Type a word to search the inverted index. The index maps each unique term to the documents and positions where it appears.
        </p>

        <div style={{ marginBottom: 20 }}>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setHighlightedTerm(null) }}
            placeholder="Type a word to search..."
            style={{
              width: '100%', padding: '10px 14px', background: s.bg, border: `1px solid ${s.border2}`,
              borderRadius: 8, color: s.text, fontFamily: s.mono, fontSize: 14, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          {docs.map(doc => {
            const tokens = tokenize(doc.text)
            const isMatch = matchingDocIds.has(doc.id)
            return (
              <div key={doc.id} style={{
                flex: 1, background: s.bg, border: `1px solid ${isMatch ? s.accent : s.border}`,
                borderRadius: 8, padding: 12, transition: 'border-color 0.3s',
              }}>
                <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, fontFamily: s.mono }}>
                  Doc {doc.id}
                </div>
                <div style={{ color: s.text, fontSize: 13, lineHeight: 1.7 }}>
                  {tokens.map((token, i) => {
                    const isHighlighted = matchedTerms.includes(token)
                    return (
                      <span
                        key={i}
                        onClick={() => setHighlightedTerm(token)}
                        style={{
                          background: isHighlighted ? `${s.accent}33` : 'transparent',
                          borderBottom: isHighlighted ? `2px solid ${s.accent}` : '2px solid transparent',
                          borderRadius: 2, cursor: isHighlighted ? 'pointer' : 'default',
                          transition: 'all 0.2s', padding: '0 1px',
                        }}
                      >
                        {token}{i < tokens.length - 1 ? ' ' : ''}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '100px 1fr 1fr',
            background: s.bg3, padding: '10px 14px',
            color: s.text3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1,
          }}>
            <div>Term</div>
            <div>Posting List (docId: positions)</div>
            <div>TF per Doc</div>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {sortedTerms.map((term, i) => {
              const postings = invertedIndex[term]
              const isHighlighted = matchedTerms.includes(term) || highlightedTerm === term
              return (
                <div
                  key={term}
                  onClick={() => setHighlightedTerm(term)}
                  style={{
                    display: 'grid', gridTemplateColumns: '100px 1fr 1fr',
                    padding: '8px 14px', borderBottom: i < sortedTerms.length - 1 ? `1px solid ${s.border}` : 'none',
                    background: isHighlighted ? `${s.accent}15` : 'transparent',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    color: s.accent, fontFamily: s.mono, fontSize: 13, fontWeight: 600,
                  }}>
                    {term}
                  </div>
                  <div style={{ color: s.text2, fontSize: 13, fontFamily: s.mono }}>
                    {postings.map((p, j) => (
                      <span key={p.docId}>
                        doc{p.docId}: [{p.positions.join(', ')}]{j < postings.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  <div style={{ color: s.text2, fontSize: 13, fontFamily: s.mono }}>
                    {postings.map((p, j) => (
                      <span key={p.docId}>
                        TF={p.positions.length}{j < postings.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {matchedTerms.length > 0 && (
          <div style={{
            marginTop: 16, padding: '10px 14px', background: `${s.green}15`,
            border: `1px solid ${s.green}`, borderRadius: 8, color: s.green, fontSize: 13, fontFamily: s.mono,
          }}>
            Query "{query}" matched {matchedTerms.length} term{matchedTerms.length > 1 ? 's' : ''} across {matchingDocIds.size} document{matchingDocIds.size !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
