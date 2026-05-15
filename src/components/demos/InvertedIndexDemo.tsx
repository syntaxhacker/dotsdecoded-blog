import React, { useState } from 'react'
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

const docs = [
  { id: 'Doc 1', text: 'Alice bakes sourdough bread with organic flour' },
  { id: 'Doc 2', text: 'Sourdough starter made with organic grapes' },
  { id: 'Doc 3', text: 'Bread recipe with simple ingredients' },
  { id: 'Doc 4', text: 'Alice shares a sourdough starter recipe' },
]

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
}

function buildIndex() {
  const index: Record<string, { doc: string; positions: number[] }[]> = {}
  const stopWords = new Set(['with', 'a', 'the', 'is', 'at', 'in', 'on', 'of', 'and', 'to'])
  docs.forEach(doc => {
    const tokens = tokenize(doc.text)
    tokens.forEach((token, pos) => {
      if (stopWords.has(token)) return
      if (!index[token]) index[token] = []
      let entry = index[token].find(e => e.doc === doc.id)
      if (!entry) {
        entry = { doc: doc.id, positions: [] }
        index[token].push(entry)
      }
      entry.positions.push(pos)
    })
  })
  return index
}

const invertedIndex = buildIndex()
const terms = Object.keys(invertedIndex).sort()

export default function InvertedIndexDemo() {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const filteredTerms = query ? terms.filter(t => t.includes(query.toLowerCase())) : terms
  const posting = selectedTerm ? invertedIndex[selectedTerm] : null

  return (
    <DemoBoundary name="Inverted Index">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>Inverted Index</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: s.bg2, borderRadius: 10, padding: 14, border: `1px solid ${s.border}`, overflow: 'auto', maxHeight: 240 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Terms</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {terms.map(t => (
              <button key={t} onClick={() => setSelectedTerm(t)} style={{
                background: selectedTerm === t ? s.accent : s.bg3,
                border: `1px solid ${selectedTerm === t ? s.accent : s.border}`,
                borderRadius: 4, padding: '3px 8px', color: selectedTerm === t ? '#fff' : s.text2,
                cursor: 'pointer', fontSize: 11, fontFamily: s.mono,
              }}>{t}</button>
            ))}
          </div>
          <input
            placeholder="Filter terms..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedTerm(null) }}
            style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 10px', color: s.text, fontSize: 12, outline: 'none' }}
          />
        </div>

        <div style={{ background: s.bg2, borderRadius: 10, padding: 14, border: `1px solid ${s.border}`, overflow: 'auto', maxHeight: 240 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            Posting List {selectedTerm ? `for "${selectedTerm}"` : ''}
          </div>
          {posting ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {posting.map((entry, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: 6, padding: '8px 12px', border: `1px solid ${s.border}` }}>
                  <div style={{ color: s.accent, fontFamily: s.mono, fontSize: 12, fontWeight: 600 }}>{entry.doc}</div>
                  <div style={{ color: s.text2, fontFamily: s.mono, fontSize: 11, marginTop: 4 }}>
                    positions: [{entry.positions.join(', ')}]
                  </div>
                  <div style={{ color: s.text3, fontSize: 11, marginTop: 2 }}>
                    {docs.find(d => d.id === entry.doc)?.text}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: s.text3, fontSize: 12 }}>Click a term to see its posting list</div>
          )}
        </div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 10, padding: 14, border: `1px solid ${s.border}` }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Documents</div>
        {docs.map(d => (
          <div key={d.id} style={{ marginBottom: 6, padding: '6px 10px', background: s.bg, borderRadius: 6 }}>
            <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 11, fontWeight: 600 }}>{d.id}: </span>
            <span style={{ color: s.text2, fontSize: 12 }}>{d.text}</span>
          </div>
        ))}
      </div>
    </div>
    </DemoBoundary>
  )
}
