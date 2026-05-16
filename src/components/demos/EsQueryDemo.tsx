import { useState, useEffect, useCallback } from 'react'
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

type QueryType = 'match' | 'term' | 'bool'

interface Step {
  label: string
  desc: string
  detail: string
}

const queryDefs: Record<QueryType, { label: string; example: string; steps: Step[] }> = {
  match: {
    label: 'Match Query',
    example: JSON.stringify({ query: { match: { body: 'quick fox' } } }, null, 2),
    steps: [
      { label: 'Parse', desc: 'JSON parsed into Lucene Query object', detail: 'QueryParser creates MatchQuery for field "body" with value "quick fox"' },
      { label: 'Analyze', desc: 'Query text goes through field analyzer', detail: 'Standard analyzer splits "quick fox" into tokens: ["quick", "fox"]' },
      { label: 'Rewrite (per token)', desc: 'Each token becomes a TermQuery', detail: 'MatchQuery rewritten as BooleanQuery: (body:quick) OR (body:fox)' },
      { label: 'Term Dictionary Lookup', desc: 'Look up each term in segment term dict', detail: 'quick -> segment _a0, offset 0x1f2; fox -> segment _a0, offset 0x2a4' },
      { label: 'Posting List Scan', desc: 'Read doc IDs and positions from posting list', detail: 'quick -> doc2[pos:0], doc1[pos:1]; fox -> doc2[pos:2], doc1[pos:2]' },
      { label: 'Score & Collect', desc: 'Score matching docs, collect top N', detail: 'Doc1: TF=1, IDF=0.47 => 0.56; Doc2: TF=1, IDF=0.47 => 0.56' },
      { label: 'Merge Segments', desc: 'Merge results across all segments', detail: '2 segments searched, top 10 per segment merged into global top 10' },
      { label: 'Return', desc: 'Return top N results to coordinating node', detail: 'Hits: [doc2: 0.56, doc1: 0.56], total: 2' },
    ],
  },
  term: {
    label: 'Term Query',
    example: JSON.stringify({ query: { term: { status: 'published' } } }, null, 2),
    steps: [
      { label: 'Parse', desc: 'JSON parsed into Lucene TermQuery', detail: 'TermQuery for field "status" with value "published" (not analyzed)' },
      { label: 'Skip Analysis', desc: 'Term queries skip text analysis', detail: '"published" used as-is — no lowercasing, no stemming' },
      { label: 'Term Dictionary Lookup', desc: 'Look up exact term in segment', detail: 'published -> segment _b1, offset 0x4e8, doc freq: 1254' },
      { label: 'Posting List Scan', desc: 'Read doc IDs from posting list', detail: 'published -> [doc4, doc17, doc42, ..., doc9851] (1254 docs)' },
      { label: 'Score & Collect', desc: 'Constant score for all matching docs', detail: 'score = boost (default 1.0) for each matching doc' },
      { label: 'Merge Segments', desc: 'Union of results across segments', detail: '2 segments: 1254 docs total, merged and deduplicated' },
      { label: 'Return', desc: 'Return top N results', detail: 'Hits: 1254 matching documents' },
    ],
  },
  bool: {
    label: 'Bool Query',
    example: JSON.stringify({
      query: {
        bool: {
          must: { match: { title: 'fox' } },
          filter: { term: { status: 'published' } },
          should: { match: { body: 'quick' } },
        },
      },
    }, null, 2),
    steps: [
      { label: 'Parse', desc: 'JSON parsed into Lucene BooleanQuery', detail: 'BooleanQuery with 3 clauses: must (title:fox), filter (status:published), should (body:quick)' },
      { label: 'Analyze Clauses', desc: 'Each text clause analyzed independently', detail: 'title:fox -> ["fox"]; body:quick -> ["quick"]; status:published (keyword, no analysis)' },
      { label: 'Rewrite Boolean Tree', desc: 'Query rewritten with TermQueries', detail: 'BooleanQuery(must: TermQuery(fox), filter: TermQuery(published), should: TermQuery(quick))' },
      { label: 'Execute Filter First', desc: 'Filter clause evaluated, result cached as bitset', detail: 'status:published bitset loaded from filter cache (1254 docs)' },
      { label: 'Score Must Clauses', desc: 'Score matching docs from must clause', detail: 'fox found in 2 docs within filtered set' },
      { label: 'Add Should Bonus', desc: 'Should clause adds bonus score', detail: 'Doc2 has body:quick => +0.45 bonus' },
      { label: 'Merge & Sort', desc: 'Merge segment results, sort by score', detail: 'Doc2: 0.89, Doc1: 0.44' },
      { label: 'Return', desc: 'Return top N filtered + scored results', detail: 'Hits: 2 matching documents, top: doc2' },
    ],
  },
}

export default function EsQueryDemo() {
  const [queryType, setQueryType] = useState<QueryType>('match')
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)

  const qd = queryDefs[queryType]

  const nextStep = useCallback(() => {
    setStepIdx(prev => (prev < qd.steps.length - 1 ? prev + 1 : 0))
  }, [qd.steps.length])

  useEffect(() => {
    if (!playing) return
    const interval = setInterval(nextStep, 2000)
    return () => clearInterval(interval)
  }, [playing, nextStep])

  const reset = () => {
    setPlaying(false)
    setStepIdx(0)
  }

  return (
    <DemoBoundary name="Elasticsearch Query Execution">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Query Execution Pipeline</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          See how a query travels from JSON through Lucene execution. Each step transforms or executes against the inverted index.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {(Object.entries(queryDefs) as [QueryType, typeof qd][]).map(([key, def]) => (
            <button
              key={key}
              onClick={() => { setQueryType(key); setStepIdx(0); setPlaying(false) }}
              style={{
                background: queryType === key ? s.accent : s.bg3,
                border: `1px solid ${queryType === key ? s.accent : s.border}`, borderRadius: 6,
                padding: '6px 14px', cursor: 'pointer',
                color: queryType === key ? '#fff' : s.text2, fontSize: 12,
                fontWeight: queryType === key ? 600 : 400,
              }}
            >
              {def.label}
            </button>
          ))}
        </div>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: 12, marginBottom: 20, fontFamily: s.mono, fontSize: 12, whiteSpace: 'pre',
          color: s.text2, overflowX: 'auto',
        }}>
          {qd.example}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {qd.steps.map((step, i) => {
            const isActive = i === stepIdx
            const isDone = i < stepIdx
            return (
              <div
                key={i}
                onClick={() => setStepIdx(i)}
                style={{
                  background: isActive ? `${s.accent}15` : isDone ? `${s.green}0a` : s.bg,
                  border: `1px solid ${isActive ? s.accent : isDone ? s.green + '44' : s.border}`,
                  borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
                  transition: 'all 0.3s', opacity: isActive || isDone ? 1 : 0.6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isActive ? 6 : 0 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: isActive ? s.accent : isDone ? s.green : s.bg3,
                    color: '#fff', fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{
                      color: isActive || isDone ? s.text : s.text2,
                      fontSize: 13, fontWeight: isActive ? 700 : 500,
                    }}>
                      {step.label}
                    </div>
                    {!isActive && (
                      <div style={{ color: s.text3, fontSize: 12, marginTop: 2 }}>{step.desc}</div>
                    )}
                  </div>
                  {isActive && (
                    <div style={{ marginLeft: 'auto' }}>
                      <span style={{ color: s.accent, fontSize: 11, fontFamily: s.mono }}>ACTIVE</span>
                    </div>
                  )}
                </div>
                {isActive && (
                  <div style={{
                    marginTop: 4, marginLeft: 32, color: s.text2, fontSize: 12, lineHeight: 1.5,
                    padding: '6px 10px', background: `${s.accent}0d`, borderRadius: 6,
                  }}>
                    {step.detail}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={() => { reset(); setPlaying(true); }} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
            opacity: playing ? 0.6 : 1,
          }}>
            {playing ? 'Playing...' : 'Auto-Play'}
          </button>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
