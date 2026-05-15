import React, { useState, useMemo } from 'react'
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
const STEP: React.CSSProperties = { background: s.bg2, borderRadius: 10, padding: '14px 18px', border: `1px solid ${s.border}`, marginBottom: 8 }

interface Doc {
  id: string
  title: string
  body: string
  pageRank: number
}

const docs: Doc[] = [
  { id: 'doc-1', title: 'Sourdough Bread Recipe', body: 'A simple sourdough bread recipe with organic flour', pageRank: 0.85 },
  { id: 'doc-2', title: 'Making Sourdough Starter', body: 'How to make a sourdough starter from organic grapes', pageRank: 0.72 },
  { id: 'doc-3', title: 'Bread Baking Basics', body: 'Simple bread recipe for beginners with basic ingredients', pageRank: 0.65 },
  { id: 'doc-4', title: 'Alice Kitchen Blog', body: 'Alice bakes sourdough and shares recipe tips', pageRank: 0.45 },
]

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
}

function scoreDoc(doc: Doc, queryTerms: string[]): number {
  const bodyTerms = tokenize(doc.body)
  const titleTerms = tokenize(doc.title)
  let score = 0
  queryTerms.forEach(term => {
    const tf = bodyTerms.filter(t => t === term).length
    score += tf * 0.2
    const titleTf = titleTerms.filter(t => t === term).length
    score += titleTf * 1.0
  })
  score += doc.pageRank * 0.5
  return score
}

const pipelineSteps = ['Parse Query', 'Lookup Index', 'Score Documents', 'Rank & Return']

export default function QueryServingDemo() {
  const [query, setQuery] = useState('sourdough bread')
  const [currentStep, setCurrentStep] = useState(0)
  const [results, setResults] = useState<{ doc: Doc; score: number }[]>([])

  const queryTerms = useMemo(() => tokenize(query), [query])

  const runQuery = () => {
    setCurrentStep(0)
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
    const run = async () => {
      setCurrentStep(1); await delay(400)
      setCurrentStep(2); await delay(400)
      const scored = docs.map(d => ({ doc: d, score: scoreDoc(d, queryTerms) }))
      scored.sort((a, b) => b.score - a.score)
      setCurrentStep(3)
      setResults(scored)
    }
    run()
  }

  return (
    <DemoBoundary name="Query Serving Pipeline">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>Query Serving Pipeline</div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {pipelineSteps.map((step, i) => (
          <div key={step} style={{
            flex: 1, padding: '8px 10px', borderRadius: 8, textAlign: 'center', fontSize: 11,
            background: i < currentStep ? s.accent : i === currentStep ? s.accent + '44' : s.bg3,
            color: i <= currentStep ? '#fff' : s.text3,
            border: `1px solid ${i <= currentStep ? s.accent : s.border}`,
            transition: 'all 0.3s',
          }}>
            {i + 1}. {step}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runQuery()}
          placeholder="Enter search query..."
          style={{
            flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: '10px 14px', color: s.text, fontSize: 14, outline: 'none', fontFamily: s.mono,
          }}
        />
        <button onClick={runQuery} style={{ background: s.accent, border: 'none', borderRadius: 8, padding: '10px 24px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          Search
        </button>
      </div>

      {currentStep >= 1 && (
        <div style={STEP}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Parsed Query Terms</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {queryTerms.map((t, i) => (
              <span key={i} style={{ background: s.bg, color: s.accent, fontFamily: s.mono, fontSize: 12, padding: '2px 8px', borderRadius: 4 }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {currentStep >= 2 && (
        <div style={STEP}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Scoring (BM25 + PageRank)</div>
          {docs.map(d => {
            const bodyTerms = tokenize(d.body)
            const titleTerms = tokenize(d.title)
            const matchTerms = queryTerms.filter(t => bodyTerms.includes(t) || titleTerms.includes(t))
            return (
              <div key={d.id} style={{ color: s.text2, fontFamily: s.mono, fontSize: 11, lineHeight: 1.8, padding: '2px 0' }}>
                {d.title}: {matchTerms.length > 0 ? `${matchTerms.length} terms match, PR=${d.pageRank.toFixed(2)}` : 'no match'}
              </div>
            )
          })}
        </div>
      )}

      {currentStep >= 3 && results.length > 0 && (
        <div style={STEP}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Ranked Results</div>
          {results.map((r, i) => (
            <div key={r.doc.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 12px', marginBottom: 4,
              background: i === 0 ? s.bg3 : 'transparent',
              borderRadius: 6,
            }}>
              <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11, width: 16 }}>{i + 1}.</span>
              <span style={{ color: s.text, fontSize: 13, fontWeight: i < 3 ? 600 : 400, flex: 1 }}>{r.doc.title}</span>
              <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 11 }}>{r.score.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
    </DemoBoundary>
  )
}
