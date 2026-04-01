import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-sql'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface QueryPreset {
  label: string
  sql: string
  selectivity: number
  plan: string
  costWithout: number
  recommendedIndex: string
  costWith: number
  writePenalty: number
  verdict: 'add' | 'skip' | 'exists'
}

const presets: QueryPreset[] = [
  {
    label: 'WHERE user_id = ?',
    sql: 'SELECT * FROM orders WHERE user_id = 42',
    selectivity: 0.001,
    plan: 'Seq Scan on orders (cost=0.00..15420.00)',
    costWithout: 15420,
    recommendedIndex: 'CREATE INDEX idx_orders_user_id ON orders(user_id)',
    costWith: 4,
    writePenalty: 5,
    verdict: 'add',
  },
  {
    label: 'WHERE status = ?',
    sql: "SELECT * FROM orders WHERE status = 'pending'",
    selectivity: 50,
    plan: 'Seq Scan on orders (cost=0.00..15420.00)',
    costWithout: 15420,
    recommendedIndex: 'No index needed',
    costWith: 0,
    writePenalty: 5,
    verdict: 'skip',
  },
  {
    label: 'WHERE user_id = ? ORDER BY created_at DESC',
    sql: 'SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20',
    selectivity: 0.001,
    plan: 'Seq Scan on orders -> Sort (cost=0.00..17890.00)',
    costWithout: 17890,
    recommendedIndex: 'CREATE INDEX idx_orders_user_id_created ON orders(user_id, created_at DESC)',
    costWith: 4,
    writePenalty: 8,
    verdict: 'add',
  },
  {
    label: "WHERE name LIKE '%john%'",
    sql: "SELECT * FROM orders WHERE name LIKE '%john%'",
    selectivity: 2.5,
    plan: 'Seq Scan on orders (cost=0.00..15420.00)',
    costWithout: 15420,
    recommendedIndex: 'No index needed — use full-text search (pg_trgm or GIN index)',
    costWith: 0,
    writePenalty: 0,
    verdict: 'skip',
  },
  {
    label: 'WHERE created_at > ? AND created_at < ?',
    sql: "SELECT * FROM orders WHERE created_at > '2025-01-01' AND created_at < '2025-02-01'",
    selectivity: 8.3,
    plan: 'Seq Scan on orders (cost=0.00..15420.00)',
    costWithout: 15420,
    recommendedIndex: 'CREATE INDEX idx_orders_created_at ON orders(created_at)',
    costWith: 1280,
    writePenalty: 5,
    verdict: 'add',
  },
  {
    label: 'UPDATE ... WHERE id = ?',
    sql: 'UPDATE orders SET status = \'shipped\' WHERE id = 1001',
    selectivity: 0.0001,
    plan: 'Index Scan using orders_pkey on orders (cost=0.42..8.44)',
    costWithout: 8,
    recommendedIndex: 'No index needed — primary key covers this query',
    costWith: 8,
    writePenalty: 0,
    verdict: 'exists',
  },
]

const existingIndexes = [
  'PRIMARY KEY (id)',
]

const maxBarWidth = 380

export default function IndexAdvisorDemo() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [showWriteImpact, setShowWriteImpact] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null)

  const p = presets[selectedIdx]
  const speedup = p.costWith > 0 ? (p.costWithout / p.costWith).toFixed(1) : '1.0'
  const numSpeedup = parseFloat(speedup)

  const highlightedSql = useMemo(() => Prism.highlight(p.sql, Prism.languages.sql, 'sql'), [p.sql])
  const highlightedIndex = useMemo(() => {
    if (!p.recommendedIndex.startsWith('CREATE INDEX')) return null
    return Prism.highlight(p.recommendedIndex, Prism.languages.sql, 'sql')
  }, [p.recommendedIndex])

  const barMax = Math.max(p.costWithout, p.costWith, 1)
  const withoutBarW = (p.costWithout / barMax) * maxBarWidth
  const withBarW = p.costWith > 0 ? (p.costWith / barMax) * maxBarWidth : 0

  const allIndexes = selectedIndex
    ? [...existingIndexes, selectedIndex]
    : existingIndexes
  const totalWritePenalty = allIndexes.length * 5

  function handleSelect(idx: number) {
    setSelectedIdx(idx)
    setSelectedIndex(null)
  }

  function handleAddIndex() {
    if (p.verdict === 'add' && p.recommendedIndex.startsWith('CREATE INDEX')) {
      setSelectedIndex(p.recommendedIndex)
    }
  }

  return (
    <DemoBoundary name="Index Advisor">
      <style>{`
        code .token.keyword { color: #f92672; }
        code .token.string, code .token.char, code .token.builtin, code .token.inserted { color: #e6db74; }
        code .token.number, code .token.constant, code .token.symbol, code .token.property, code .token.tag, code .token.boolean, code .token.deleted { color: #ae81ff; }
        code .token.selector, code .token.attr-name { color: #f92672; }
        code .token.attr-value, code .token.atrule { color: #e6db74; }
        code .token.function, code .token.class-name { color: #a6e22e; }
        code .token.operator, code .token.entity, code .token.url, code .token.punctuation { color: #f8f8f2; }
        code .token.comment, code .token.prolog, code .token.doctype, code .token.cdata { color: #75715e; font-style: italic; }
        code .token.parameter, code .token.variable, code .token.regex, code .token.important { color: #fd972f; }
      `}</style>
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text }}>

        <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: s.text }}>Table: orders</span>
            <span style={{ fontSize: 12, color: s.text3, fontFamily: s.mono }}>1,000,000 rows</span>
          </div>
          <div style={{ fontSize: 12, color: s.text2, fontFamily: s.mono, marginBottom: 4 }}>Current indexes:</div>
          <div style={{ fontSize: 12, fontFamily: s.mono, color: s.accent }}>
            {allIndexes.map((idx, i) => (
              <div key={i} style={{ padding: '2px 0' }}>
                {idx.startsWith('PRIMARY') ? idx : idx}
                {!idx.startsWith('PRIMARY') && <span style={{ color: s.green, marginLeft: 8 }}>NEW</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: s.text2, marginBottom: 8 }}>Select a query pattern:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {presets.map((preset, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                style={{
                  background: selectedIdx === i ? s.accent : s.bg2,
                  color: selectedIdx === i ? '#fff' : s.text2,
                  border: `1px solid ${selectedIdx === i ? s.accent : s.border}`,
                  borderRadius: 6,
                  padding: '7px 12px',
                  fontSize: 12,
                  fontFamily: s.mono,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 16, fontFamily: s.mono, fontSize: 13, color: s.green }}>
          <span style={{ color: s.text3, marginRight: 6 }}>SQL:</span>
          <code dangerouslySetInnerHTML={{ __html: highlightedSql }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Selectivity</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: p.selectivity < 1 ? s.green : p.selectivity < 10 ? s.yellow : s.red }}>
              {p.selectivity < 0.01 ? p.selectivity.toFixed(4) : p.selectivity.toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: s.text3, marginTop: 4 }}>
              {p.selectivity < 0.01 ? 'Very high — few rows match' : p.selectivity < 10 ? 'Moderate — some rows match' : 'Low — many rows match'}
            </div>
          </div>
          <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cost Without Index</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.red }}>{p.costWithout.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: s.text3, marginTop: 4 }}>page reads</div>
          </div>
          <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cost With Index</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: p.costWith > 0 ? s.green : s.text3 }}>
              {p.costWith > 0 ? p.costWith.toLocaleString() : 'N/A'}
            </div>
            <div style={{ fontSize: 11, color: s.text3, marginTop: 4 }}>
              {p.costWith > 0 ? 'page reads' : 'no B-tree index helps'}
            </div>
          </div>
        </div>

        <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: s.text3, marginBottom: 6 }}>Execution plan (without suggested index):</div>
          <div style={{ fontSize: 12, fontFamily: s.mono, color: s.orange, padding: '6px 10px', background: s.bg, borderRadius: 4 }}>
            {p.plan}
          </div>
          {p.costWith > 0 && numSpeedup > 1 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: s.text3, marginBottom: 8 }}>Cost comparison:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: s.text3, width: 120, flexShrink: 0 }}>Without Index</span>
                  <div style={{ flex: 1, height: 20, background: s.bg, borderRadius: 4, overflow: 'hidden', maxWidth: maxBarWidth }}>
                    <div style={{ width: `${withoutBarW}px`, height: '100%', background: s.red, borderRadius: 4, transition: 'width 0.4s ease', minWidth: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: s.mono, color: s.red, width: 70, textAlign: 'right', flexShrink: 0 }}>{p.costWithout.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: s.text3, width: 120, flexShrink: 0 }}>With Index</span>
                  <div style={{ flex: 1, height: 20, background: s.bg, borderRadius: 4, overflow: 'hidden', maxWidth: maxBarWidth }}>
                    <div style={{ width: `${withBarW}px`, height: '100%', background: s.green, borderRadius: 4, transition: 'width 0.4s ease', minWidth: withBarW > 0 ? 2 : 0 }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: s.mono, color: s.green, width: 70, textAlign: 'right', flexShrink: 0 }}>{p.costWith > 0 ? p.costWith.toLocaleString() : '--'}</span>
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: s.accent, fontWeight: 600 }}>
                {numSpeedup}x faster
              </div>
            </div>
          )}
        </div>

        <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: s.text3, marginBottom: 6 }}>Recommended index:</div>
          <div style={{
            fontSize: 13, fontFamily: s.mono,
            color: p.verdict === 'add' ? s.green : p.verdict === 'exists' ? s.accent : s.yellow,
            padding: '8px 12px',
            background: s.bg,
            borderRadius: 4,
          }}>
            {highlightedIndex
              ? <code dangerouslySetInnerHTML={{ __html: highlightedIndex }} />
              : p.recommendedIndex}
          </div>
          {p.verdict === 'add' && (
            <div style={{ marginTop: 8, fontSize: 12, color: s.text3 }}>
              Write penalty per INSERT: <span style={{ color: s.orange, fontWeight: 600 }}>+{p.writePenalty}%</span>
            </div>
          )}
        </div>

        <div style={{
          borderRadius: 8, padding: '14px 18px', marginBottom: 16, textAlign: 'center',
          background: p.verdict === 'add'
            ? `linear-gradient(135deg, ${s.bg2}, ${s.green}11)`
            : p.verdict === 'exists'
              ? `linear-gradient(135deg, ${s.bg2}, ${s.accent}11)`
              : `linear-gradient(135deg, ${s.bg2}, ${s.yellow}11)`,
          border: `1px solid ${p.verdict === 'add' ? s.green : p.verdict === 'exists' ? s.accent : s.yellow}33`,
        }}>
          <div style={{
            fontSize: 16, fontWeight: 700,
            color: p.verdict === 'add' ? s.green : p.verdict === 'exists' ? s.accent : s.yellow,
          }}>
            {p.verdict === 'add' && 'ADD INDEX'}
            {p.verdict === 'skip' && 'SKIP — full scan is faster'}
            {p.verdict === 'exists' && 'INDEX EXISTS — primary key covers this'}
          </div>
          {p.verdict === 'add' && (
            <button
              onClick={handleAddIndex}
              disabled={!!selectedIndex && selectedIndex === p.recommendedIndex}
              style={{
                marginTop: 10,
                background: selectedIndex === p.recommendedIndex ? s.green : 'transparent',
                color: selectedIndex === p.recommendedIndex ? s.bg : s.green,
                border: `1px solid ${s.green}`,
                borderRadius: 6,
                padding: '6px 18px',
                fontSize: 12,
                fontWeight: 600,
                cursor: selectedIndex === p.recommendedIndex ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {selectedIndex === p.recommendedIndex ? 'INDEX ADDED' : 'APPLY RECOMMENDATION'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <button
            onClick={() => setShowWriteImpact(!showWriteImpact)}
            style={{
              background: showWriteImpact ? s.bg3 : 'transparent',
              color: s.text2,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {showWriteImpact ? 'Hide' : 'Show'} write impact
          </button>
        </div>

        {showWriteImpact && (
          <div style={{
            background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '14px 18px',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 10 }}>Write Impact Analysis</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: s.text3, marginBottom: 4 }}>Total indexes on table</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.accent }}>{allIndexes.length}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: s.text3, marginBottom: 4 }}>Cumulative write penalty</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: totalWritePenalty > 20 ? s.red : totalWritePenalty > 10 ? s.orange : s.green }}>
                  +{totalWritePenalty}%
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: s.text3, lineHeight: 1.6 }}>
              Each index adds overhead to INSERT, UPDATE, and DELETE operations. With {allIndexes.length} indexes, every write must update all index structures. At high write throughput, this penalty compounds.
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: s.text3 }}>Write penalty bar:</span>
              <div style={{ flex: 1, height: 12, background: s.bg, borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(totalWritePenalty * 2, 100)}%`,
                  height: '100%',
                  background: totalWritePenalty > 20 ? s.red : totalWritePenalty > 10 ? s.orange : s.green,
                  borderRadius: 6,
                  transition: 'width 0.3s ease, background 0.3s ease',
                }} />
              </div>
              <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>+{totalWritePenalty}%</span>
            </div>
          </div>
        )}

      </div>
    </DemoBoundary>
  )
}
