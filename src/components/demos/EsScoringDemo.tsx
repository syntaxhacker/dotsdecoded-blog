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
  { id: 1, text: 'brown fox runs fast', len: 4 },
  { id: 2, text: 'quick brown fox jumps', len: 4 },
  { id: 3, text: 'lazy dog sleeps', len: 3 },
]

interface TermScore {
  term: string
  tf: number
  idf: number
  raw: number
  docId: number
  docLen: number
}

function computeBM25(
  queryTerms: string[],
  k1: number,
  b: number,
): {
  scores: Record<number, { total: number; terms: TermScore[] }>
  avgdl: number
  idfMap: Record<string, number>
} {
  const N = docs.length
  const avgdl = docs.reduce((sum, d) => sum + d.len, 0) / N

  const df: Record<string, number> = {}
  for (const term of queryTerms) {
    df[term] = 0
    for (const d of docs) {
      const tf = (d.text.match(new RegExp(term, 'g')) || []).length
      if (tf > 0) df[term]++
    }
  }

  const idfMap: Record<string, number> = {}
  for (const term of queryTerms) {
    const n = df[term] || 0
    idfMap[term] = Math.log(1 + (N - n + 0.5) / (n + 0.5))
  }

  const scores: Record<number, { total: number; terms: TermScore[] }> = {}
  for (const d of docs) {
    const terms: TermScore[] = []
    for (const term of queryTerms) {
      const tf = (d.text.match(new RegExp(term, 'g')) || []).length
      if (tf === 0) continue
      const idf = idfMap[term]
      const tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (d.len / avgdl)))
      const raw = idf * tfNorm
      terms.push({ term, tf, idf, raw, docId: d.id, docLen: d.len })
    }
    const total = terms.reduce((sum, t) => sum + t.raw, 0)
    scores[d.id] = { total, terms }
  }

  return { scores, avgdl, idfMap }
}

function computeTFIDF(queryTerms: string[]): {
  scores: Record<number, { total: number; terms: TermScore[] }>
  idfMap: Record<string, number>
} {
  const N = docs.length
  const df: Record<string, number> = {}
  for (const term of queryTerms) {
    df[term] = 0
    for (const d of docs) {
      const tf = (d.text.match(new RegExp(term, 'g')) || []).length
      if (tf > 0) df[term]++
    }
  }
  const idfMap: Record<string, number> = {}
  for (const term of queryTerms) {
    const n = df[term] || 0
    idfMap[term] = Math.log(1 + (N - n + 0.5) / (n + 0.5))
  }
  const scores: Record<number, { total: number; terms: TermScore[] }> = {}
  for (const d of docs) {
    const terms: TermScore[] = []
    for (const term of queryTerms) {
      const tf = (d.text.match(new RegExp(term, 'g')) || []).length
      if (tf === 0) continue
      const idf = idfMap[term]
      const raw = tf * idf
      terms.push({ term, tf, idf, raw, docId: d.id, docLen: d.len })
    }
    const total = terms.reduce((sum, t) => sum + t.raw, 0)
    scores[d.id] = { total, terms }
  }
  return { scores, idfMap }
}

const defaultQueryTerms = ['brown', 'fox']

export default function EsScoringDemo() {
  const [k1, setK1] = useState(1.2)
  const [b, setB] = useState(0.75)
  const [algo, setAlgo] = useState<'bm25' | 'tfidf'>('bm25')

  const result = useMemo(() => {
    if (algo === 'bm25') {
      return computeBM25(defaultQueryTerms, k1, b)
    }
    const r = computeTFIDF(defaultQueryTerms)
    return { ...r, avgdl: docs.reduce((sum, d) => sum + d.len, 0) / docs.length }
  }, [k1, b, algo])

  const topDoc = [...docs].sort((a, b_) => (result.scores[b_.id]?.total || 0) - (result.scores[a.id]?.total || 0))[0]

  return (
    <DemoBoundary name="Elasticsearch BM25 Scoring">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>BM25 Scorer</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Query: <span style={{ color: s.accent, fontFamily: s.mono, fontWeight: 600 }}>brown fox</span>. Each document is scored by summing BM25 contributions per term.
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setAlgo('bm25')} style={{
              background: algo === 'bm25' ? s.accent : s.bg3,
              border: `1px solid ${algo === 'bm25' ? s.accent : s.border}`, borderRadius: 6,
              padding: '6px 14px', cursor: 'pointer', color: algo === 'bm25' ? '#fff' : s.text2,
              fontSize: 12, fontWeight: algo === 'bm25' ? 600 : 400,
            }}>BM25</button>
            <button onClick={() => setAlgo('tfidf')} style={{
              background: algo === 'tfidf' ? s.accent : s.bg3,
              border: `1px solid ${algo === 'tfidf' ? s.accent : s.border}`, borderRadius: 6,
              padding: '6px 14px', cursor: 'pointer', color: algo === 'tfidf' ? '#fff' : s.text2,
              fontSize: 12, fontWeight: algo === 'tfidf' ? 600 : 400,
            }}>TF-IDF</button>
          </div>
        </div>

        {algo === 'bm25' && (
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>
                k1 (saturation): {k1.toFixed(1)}
              </label>
              <input type="range" min={0} max={3} step={0.1} value={k1} onChange={e => setK1(Number(e.target.value))} style={{ width: '100%', accentColor: s.accent }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>
                b (length norm): {b.toFixed(2)}
              </label>
              <input type="range" min={0} max={1} step={0.05} value={b} onChange={e => setB(Number(e.target.value))} style={{ width: '100%', accentColor: s.green }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {docs.map(d => {
            const scoreData = result.scores[d.id]
            const isTop = d.id === topDoc.id
            return (
              <div key={d.id} style={{
                background: s.bg, border: `1px solid ${isTop ? s.green : s.border}`,
                borderRadius: 10, padding: 14, transition: 'border-color 0.3s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>Doc {d.id} ({d.len} words)</span>
                  <span style={{
                    color: s.text, fontFamily: s.mono, fontSize: 16, fontWeight: 700,
                  }}>
                    {scoreData ? scoreData.total.toFixed(4) : '0.0000'}
                  </span>
                </div>
                <div style={{ color: s.text2, fontSize: 13, marginBottom: 8 }}>
                  &ldquo;{d.text}&rdquo;
                </div>
                {scoreData && scoreData.terms.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {scoreData.terms.map((t, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px', background: `${s.accent}0d`, borderRadius: 6,
                        border: `1px solid ${s.accent}22`,
                      }}>
                        <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 13, fontWeight: 600, minWidth: 50 }}>
                          {t.term}
                        </span>
                        <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>
                          TF={t.tf}
                        </span>
                        <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>
                          IDF={t.idf.toFixed(4)}
                        </span>
                        <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>
                          |D|={t.docLen}
                        </span>
                        <div style={{ flex: 1, textAlign: 'right' }}>
                          <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 13, fontWeight: 600 }}>
                            {t.raw.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {(!scoreData || scoreData.terms.length === 0) && (
                  <div style={{ color: s.text3, fontSize: 12, fontStyle: 'italic' }}>No matching terms</div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 14,
        }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            Global Stats
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: s.text3, fontSize: 12 }}>N (docs): </span>
              <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{docs.length}</span>
            </div>
            <div>
              <span style={{ color: s.text3, fontSize: 12 }}>avgdl: </span>
              <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{result.avgdl.toFixed(2)}</span>
            </div>
            {algo === 'bm25' && (
              <>
                <div>
                  <span style={{ color: s.text3, fontSize: 12 }}>k1: </span>
                  <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{k1.toFixed(1)}</span>
                </div>
                <div>
                  <span style={{ color: s.text3, fontSize: 12 }}>b: </span>
                  <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{b.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{ color: s.text3, fontSize: 12 }}>IDF values: </span>
            {defaultQueryTerms.map(t => (
              <span key={t} style={{ color: s.text2, fontFamily: s.mono, fontSize: 12, marginRight: 12 }}>
                IDF({t}) = {(result.idfMap[t] || 0).toFixed(4)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
