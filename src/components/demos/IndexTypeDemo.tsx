import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Product {
  name: string
  category: string
  description: string
  price: number
}

const products: Product[] = [
  { name: 'Wireless Headphones', category: 'Electronics', description: 'Premium wireless bluetooth headphones with noise cancellation', price: 299 },
  { name: 'Running Shoes', category: 'Sports', description: 'Lightweight running shoes for marathon training', price: 149 },
  { name: 'Coffee Maker', category: 'Electronics', description: 'Programmable drip coffee maker with thermal carafe', price: 89 },
  { name: 'Yoga Mat', category: 'Sports', description: 'Extra thick non-slip yoga mat for home workouts', price: 35 },
  { name: 'Mechanical Keyboard', category: 'Electronics', description: 'Wireless bluetooth mechanical keyboard with RGB backlight', price: 179 },
  { name: 'Resistance Bands', category: 'Sports', description: 'Set of 5 resistance bands for strength training', price: 25 },
]

type PresetKey = null | 'exact' | 'range' | 'text'

interface Preset {
  key: PresetKey
  label: string
  query: string
}

const presets: Preset[] = [
  { key: 'exact', label: "Exact match: category = 'Electronics'", query: "SELECT * FROM products WHERE category = 'Electronics'" },
  { key: 'range', label: 'Range: price > 100 AND price < 500', query: 'SELECT * FROM products WHERE price > 100 AND price < 500' },
  { key: 'text', label: "Text search: 'wireless bluetooth'", query: "SELECT * FROM products WHERE description @@ 'wireless bluetooth'" },
]

interface IndexInfo {
  name: string
  operation: string
  complexity: string
  bestFor: string
  limitations: string
}

const indexInfo: IndexInfo[] = [
  { name: 'B-Tree', operation: 'Equality, Range, Sort', complexity: 'O(log n)', bestFor: 'Structured queries with comparisons', limitations: 'Slow for full-text search' },
  { name: 'Hash', operation: 'Equality only', complexity: 'O(1) avg', bestFor: 'Exact key lookups', limitations: 'No range or sort support' },
  { name: 'Full-Text', operation: 'Text search, Ranking', complexity: 'O(n log n) build', bestFor: 'Searching natural language text', limitations: 'Not for exact value matching' },
]

type ResultStatus = 'success' | 'fail' | 'warn'

interface ComparisonRow {
  operation: string
  btree: ResultStatus
  hash: ResultStatus
  fulltext: ResultStatus
}

const comparisonRows: ComparisonRow[] = [
  { operation: 'Equality (=)', btree: 'success', hash: 'success', fulltext: 'warn' },
  { operation: 'Range (>, <, BETWEEN)', btree: 'success', hash: 'fail', fulltext: 'fail' },
  { operation: 'ORDER BY / Sort', btree: 'success', hash: 'fail', fulltext: 'fail' },
  { operation: 'Full-text search', btree: 'fail', hash: 'fail', fulltext: 'success' },
  { operation: 'Prefix match (LIKE \'x%\')', btree: 'success', hash: 'fail', fulltext: 'success' },
]

function StatusIcon({ status }: { status: ResultStatus }) {
  if (status === 'success') {
    return (
      <span style={{ color: s.green, fontWeight: 700, fontSize: 15 }}>O(log n)</span>
    )
  }
  if (status === 'warn') {
    return (
      <span style={{ color: s.yellow, fontWeight: 700, fontSize: 15 }}>~scan</span>
    )
  }
  return (
    <span style={{ color: s.red, fontWeight: 700, fontSize: 15 }}>X</span>
  )
}

function BTreeColumn({ preset }: { preset: PresetKey }) {
  const isExact = preset === 'exact'
  const isRange = preset === 'range'
  const isText = preset === 'text'
  const isActive = preset !== null
  const isSuccess = isExact || isRange
  const isFail = isText

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        padding: '10px 14px',
        background: s.bg2,
        borderRadius: 8,
        border: `1px solid ${s.border}`,
        fontFamily: s.mono,
        fontSize: 12,
        color: s.text2,
        lineHeight: 1.6,
        minHeight: 200,
      }}>
        <div style={{ color: s.accent, fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
          {isActive ? 'B-Tree Traversal' : 'B-Tree Index'}
        </div>
        {!isActive && (
          <div style={{ color: s.text3 }}>
            Click a query preset above to see how a B-tree index processes it.
          </div>
        )}
        {isExact && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Step label="Root node" detail="Compare 'Electronics' >= 'Electronics'" active />
            <Step label="Left child" detail="'Electronics' found in leaf" active />
            <Step label="Leaf scan" detail="Pointers to rows 1, 3, 5" success />
            <div style={{ marginTop: 8, color: s.green, fontWeight: 600, fontSize: 11 }}>
              Result: 3 rows -- 3 page reads (O(log n))
            </div>
          </div>
        )}
        {isRange && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Step label="Root node" detail="Seek to price = 100 boundary" active />
            <Step label="Internal node" detail="Navigate to leaf containing 100-500 range" active />
            <Step label="Leaf scan" detail="Scan adjacent leaves: 149, 179, 299" success />
            <div style={{ marginTop: 8, color: s.green, fontWeight: 600, fontSize: 11 }}>
              Result: 3 rows -- O(log n) seek + k leaf reads
            </div>
          </div>
        )}
        {isText && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Step label="Root node" detail="No B-tree key for 'wireless bluetooth'" warn />
            <Step label="Fallback" detail="Full table scan required" warn />
            <div style={{ marginTop: 8, color: s.yellow, fontWeight: 600, fontSize: 11 }}>
              Not optimized for text search -- falls back to sequential scan
            </div>
          </div>
        )}
      </div>
      {isActive && (
        <div style={{
          padding: '8px 12px',
          borderRadius: 6,
          background: isSuccess ? `${s.green}11` : (isFail ? `${s.red}11` : `${s.yellow}11`),
          border: `1px solid ${isSuccess ? s.green : (isFail ? s.red : s.yellow)}`,
          fontSize: 12,
          color: isSuccess ? s.green : (isFail ? s.red : s.yellow),
          fontFamily: s.mono,
        }}>
          {isSuccess
            ? <span>Index used -- {isExact ? '3 page reads' : 'O(log n) + k'}</span>
            : null}
          {isFail && <span>Index NOT used -- full table scan</span>}
        </div>
      )}
    </div>
  )
}

function HashColumn({ preset }: { preset: PresetKey }) {
  const isExact = preset === 'exact'
  const isRange = preset === 'range'
  const isText = preset === 'text'
  const isActive = preset !== null
  const isSuccess = isExact
  const isFail = isRange || isText

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        padding: '10px 14px',
        background: s.bg2,
        borderRadius: 8,
        border: `1px solid ${s.border}`,
        fontFamily: s.mono,
        fontSize: 12,
        color: s.text2,
        lineHeight: 1.6,
        minHeight: 200,
      }}>
        <div style={{ color: s.purple, fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
          {isActive ? 'Hash Lookup' : 'Hash Index'}
        </div>
        {!isActive && (
          <div style={{ color: s.text3 }}>
            Click a query preset above to see how a hash index processes it.
          </div>
        )}
        {isExact && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Step label="Hash function" detail="hash('Electronics') = 0x7f3a" active />
            <Step label="Bucket lookup" detail="Direct jump to bucket 42" active />
            <Step label="Fetch rows" detail="Row pointers: 1, 3, 5" success />
            <div style={{ marginTop: 8, color: s.green, fontWeight: 600, fontSize: 11 }}>
              Result: 3 rows -- 1 page read (O(1))
            </div>
          </div>
        )}
        {isRange && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Step label="Hash function" detail="Cannot hash a range condition" fail />
            <Step label="Error" detail="Range queries not supported" fail />
            <div style={{ marginTop: 8, color: s.red, fontWeight: 600, fontSize: 11 }}>
              Range queries not supported -- hash provides no ordering
            </div>
          </div>
        )}
        {isText && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Step label="Hash function" detail="hash('wireless bluetooth') computed" warn />
            <Step label="Problem" detail="Hash is for exact values, not word matching" warn />
            <div style={{ marginTop: 8, color: s.yellow, fontWeight: 600, fontSize: 11 }}>
              Not optimized for text search -- hash matches exact strings only
            </div>
          </div>
        )}
      </div>
      {isActive && (
        <div style={{
          padding: '8px 12px',
          borderRadius: 6,
          background: isSuccess ? `${s.green}11` : (isFail ? `${s.red}11` : `${s.yellow}11`),
          border: `1px solid ${isSuccess ? s.green : (isFail ? s.red : s.yellow)}`,
          fontSize: 12,
          color: isSuccess ? s.green : (isFail ? s.red : s.yellow),
          fontFamily: s.mono,
        }}>
          {isSuccess && 'Index used -- 1 page read (O(1))'}
          {isRange && 'Index NOT used -- range queries unsupported'}
          {isText && 'Index NOT used -- no text search capability'}
        </div>
      )}
    </div>
  )
}

function FullTextColumn({ preset }: { preset: PresetKey }) {
  const isExact = preset === 'exact'
  const isRange = preset === 'range'
  const isText = preset === 'text'
  const isActive = preset !== null
  const isSuccess = isText
  const isWarn = isExact
  const isFail = isRange

  const matchResults: { name: string; score: number }[] = isText
    ? [
        { name: 'Wireless Headphones', score: 0.95 },
        { name: 'Mechanical Keyboard', score: 0.72 },
        { name: 'Running Shoes', score: 0.0 },
        { name: 'Coffee Maker', score: 0.0 },
        { name: 'Yoga Mat', score: 0.0 },
        { name: 'Resistance Bands', score: 0.0 },
      ]
    : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        padding: '10px 14px',
        background: s.bg2,
        borderRadius: 8,
        border: `1px solid ${s.border}`,
        fontFamily: s.mono,
        fontSize: 12,
        color: s.text2,
        lineHeight: 1.6,
        minHeight: 200,
      }}>
        <div style={{ color: s.orange, fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
          {isActive ? 'Full-Text Search' : 'Full-Text Index'}
        </div>
        {!isActive && (
          <div style={{ color: s.text3 }}>
            Click a query preset above to see how a full-text index processes it.
          </div>
        )}
        {isExact && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Step label="Tokenize" detail="'Electronics' -> single token" warn />
            <Step label="Inverted index" detail="Finds document IDs, but not as exact field match" warn />
            <Step label="Issue" detail="Full-text uses relevance, not equality" warn />
            <div style={{ marginTop: 8, color: s.yellow, fontWeight: 600, fontSize: 11 }}>
              Not optimized for exact match -- use B-tree or hash instead
            </div>
          </div>
        )}
        {isRange && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Step label="Tokenize" detail="'price > 100 AND price < 500'" fail />
            <Step label="Error" detail="Full-text cannot compare numeric ranges" fail />
            <div style={{ marginTop: 8, color: s.red, fontWeight: 600, fontSize: 11 }}>
              Not optimized for range queries -- use B-tree index instead
            </div>
          </div>
        )}
        {isText && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Step label="Tokenize" detail="'wireless', 'bluetooth' -- 2 tokens" active />
            <Step label="Inverted index" detail="Lookup postings for each token" active />
            <Step label="Intersect" detail="Merge posting lists, rank by TF-IDF" success />
            <div style={{ marginTop: 6, fontSize: 11, color: s.text3, marginBottom: 4 }}>Relevance scores:</div>
            {matchResults.map((mr) => (
              <div key={mr.name} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '2px 0',
              }}>
                <span style={{ color: mr.score > 0 ? s.text : s.text3, fontSize: 11 }}>{mr.name}</span>
                <span style={{
                  color: mr.score > 0 ? s.green : s.text3,
                  fontSize: 11,
                  fontWeight: mr.score > 0 ? 600 : 400,
                }}>
                  {mr.score > 0 ? mr.score.toFixed(2) : '--'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {isActive && (
        <div style={{
          padding: '8px 12px',
          borderRadius: 6,
          background: isSuccess ? `${s.green}11` : (isWarn ? `${s.yellow}11` : `${s.red}11`),
          border: `1px solid ${isSuccess ? s.green : (isWarn ? s.yellow : s.red)}`,
          fontSize: 12,
          color: isSuccess ? s.green : (isWarn ? s.yellow : s.red),
          fontFamily: s.mono,
        }}>
          {isSuccess && 'Index used -- 2 rows matched, ranked by relevance'}
          {isWarn && 'Index suboptimal -- full-text not for exact matches'}
          {isFail && 'Index NOT used -- no range comparison support'}
        </div>
      )}
    </div>
  )
}

function Step({ label, detail, success, warn, fail, active }: {
  label: string
  detail: string
  success?: boolean
  warn?: boolean
  fail?: boolean
  active?: boolean
}) {
  const color = success ? s.green : (warn ? s.yellow : (fail ? s.red : (active ? s.accent : s.text3)))
  const icon = success ? '\u2713' : (fail ? '\u2717' : '\u25B8')
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '2px 0' }}>
      <span style={{ color, fontSize: 11, flexShrink: 0, width: 14, textAlign: 'center', lineHeight: '18px' }}>{icon}</span>
      <div>
        <div style={{ color, fontWeight: 600, fontSize: 11 }}>{label}</div>
        <div style={{ color: s.text3, fontSize: 11 }}>{detail}</div>
      </div>
    </div>
  )
}

export default function IndexTypeDemo() {
  const [activePreset, setActivePreset] = useState<PresetKey>(null)

  const preset = presets.find((p) => p.key === activePreset)

  const headerColors = [s.accent, s.purple, s.orange]

  return (
    <div style={{
      maxWidth: 820,
      margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <DemoBoundary name="Index Types">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            padding: '10px 14px',
            background: s.bg,
            borderRadius: 8,
            border: `1px solid ${s.border}`,
            fontFamily: s.mono,
            fontSize: 12,
            color: s.text3,
          }}>
            {preset ? preset.query : '-- Select a query to compare index types --'}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => setActivePreset(activePreset === p.key ? null : p.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: `1px solid ${activePreset === p.key ? s.accent : s.border}`,
                  background: activePreset === p.key ? `${s.accent}18` : s.bg2,
                  color: activePreset === p.key ? s.accent : s.text2,
                  fontFamily: s.mono,
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {indexInfo.map((info, idx) => (
              <div key={info.name} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                <div style={{
                  padding: '10px 14px',
                  background: `${headerColors[idx]}11`,
                  borderRadius: 8,
                  border: `1px solid ${headerColors[idx]}33`,
                }}>
                  <div style={{ color: headerColors[idx], fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                    {info.name}
                  </div>
                  <InfoRow label="Operations" value={info.operation} />
                  <InfoRow label="Complexity" value={info.complexity} />
                  <InfoRow label="Best for" value={info.bestFor} />
                  <InfoRow label="Limitations" value={info.limitations} last />
                </div>
                {idx === 0 && <BTreeColumn preset={activePreset} />}
                {idx === 1 && <HashColumn preset={activePreset} />}
                {idx === 2 && <FullTextColumn preset={activePreset} />}
              </div>
            ))}
          </div>

          <div style={{
            padding: '14px',
            background: s.bg2,
            borderRadius: 8,
            border: `1px solid ${s.border}`,
            overflowX: 'auto',
          }}>
            <div style={{
              color: s.text,
              fontWeight: 600,
              fontSize: 13,
              marginBottom: 10,
            }}>
              Operation Support Matrix
            </div>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: s.mono,
              fontSize: 12,
            }}>
              <thead>
                <tr>
                  <th style={thStyle}>Operation</th>
                  <th style={{ ...thStyle, textAlign: 'center', color: s.accent }}>B-Tree</th>
                  <th style={{ ...thStyle, textAlign: 'center', color: s.purple }}>Hash</th>
                  <th style={{ ...thStyle, textAlign: 'center', color: s.orange }}>Full-Text</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.operation}>
                    <td style={tdStyle}>{row.operation}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><StatusIcon status={row.btree} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><StatusIcon status={row.hash} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><StatusIcon status={row.fulltext} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DemoBoundary>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  color: s.text2,
  fontWeight: 600,
  fontSize: 11,
  borderBottom: `1px solid ${s.border}`,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  color: s.text2,
  borderBottom: `1px solid ${s.bg}`,
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8,
      padding: '3px 0',
      borderBottom: last ? 'none' : `1px solid ${s.bg}`,
    }}>
      <span style={{ color: s.text3, fontSize: 11 }}>{label}</span>
      <span style={{ color: s.text, fontSize: 11, textAlign: 'right' }}>{value}</span>
    </div>
  )
}
