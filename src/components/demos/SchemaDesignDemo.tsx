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

interface Column {
  name: string
  type: string
  constraint: string
  explanation: string
}

interface Table {
  name: string
  columns: Column[]
  indexes: string[]
}

const sqlTables: Table[] = [
  {
    name: 'urls',
    columns: [
      { name: 'id', type: 'BIGINT', constraint: 'PK, AUTO_INCREMENT', explanation: 'Internal unique identifier. Used for Base62 encoding to generate short codes.' },
      { name: 'short_code', type: 'VARCHAR(10)', constraint: 'UNIQUE, NOT NULL', explanation: 'The short code used in the URL (e.g., "aB3x9Q"). Unique index for O(1) lookup on redirects.' },
      { name: 'original_url', type: 'TEXT', constraint: 'NOT NULL', explanation: 'The full original URL to redirect to. TEXT type because URLs can exceed VARCHAR limits.' },
      { name: 'created_at', type: 'TIMESTAMP', constraint: 'DEFAULT NOW()', explanation: 'When the short link was created. Used for sorting, cleanup jobs, and analytics time ranges.' },
      { name: 'expires_at', type: 'TIMESTAMP', constraint: 'NULLABLE', explanation: 'When the link expires. NULL means never expires. Checked on every redirect request.' },
      { name: 'user_id', type: 'BIGINT', constraint: 'INDEX, NULLABLE', explanation: 'Owner of the link. NULL for anonymous links. Enables per-user link management queries.' },
    ],
    indexes: ['PRIMARY KEY (id)', 'UNIQUE INDEX (short_code)', 'INDEX (user_id, created_at)'],
  },
  {
    name: 'analytics',
    columns: [
      { name: 'id', type: 'BIGINT', constraint: 'PK, AUTO_INCREMENT', explanation: 'Unique click event identifier for deduplication.' },
      { name: 'short_code', type: 'VARCHAR(10)', constraint: 'INDEX, NOT NULL', explanation: 'Which short link was clicked. Indexed for fast aggregation queries per link.' },
      { name: 'clicked_at', type: 'TIMESTAMP', constraint: 'INDEX, DEFAULT NOW()', explanation: 'When the click happened. Composite index with short_code for time-range queries.' },
      { name: 'ip_address', type: 'VARCHAR(45)', constraint: 'NULLABLE', explanation: 'Clicker IP address. 45 chars supports both IPv4 and IPv6. Used for geo-lookup.' },
      { name: 'country', type: 'VARCHAR(3)', constraint: 'NULLABLE', explanation: 'Country code from IP geo-lookup (ISO 3166-1 alpha-3). Denormalized for fast queries.' },
      { name: 'referrer', type: 'VARCHAR(512)', constraint: 'NULLABLE', explanation: 'HTTP Referer header value. Where the user came from before clicking.' },
      { name: 'browser', type: 'VARCHAR(64)', constraint: 'NULLABLE', explanation: 'Parsed User-Agent string. Browser name for analytics breakdowns.' },
    ],
    indexes: ['PRIMARY KEY (id)', 'INDEX (short_code, clicked_at)', 'INDEX (clicked_at)'],
  },
]

const nosqlSchema = `{
  "pk": "URL#aB3x9Q",
  "short_code": "aB3x9Q",
  "original_url": "https://docs.google.com/...",
  "created_at": "2026-04-22T10:30:00Z",
  "expires_at": null,
  "user_id": "usr_28f9a1",
  "click_count": 12847,
  "ttl": 1734917400
}

// Analytics as time-series items:
{
  "pk": "ANALYTICS#aB3x9Q",
  "sk": "2026-04-22#10:30:00#1a2b3c",
  "country": "USA",
  "referrer": "twitter.com",
  "browser": "Chrome"
}

// Redis cache for redirect path:
SET short:aB3x9Q "https://docs.google.com/..." EX 3600`

export default function SchemaDesignDemo() {
  const [view, setView] = useState<'sql' | 'nosql'>('sql')
  const [selectedCol, setSelectedCol] = useState<{ table: string; col: string } | null>(null)

  const colExplanation = selectedCol
    ? sqlTables.find(t => t.name === selectedCol.table)?.columns.find(c => c.name === selectedCol.col)?.explanation
    : null

  return (
    <DemoBoundary name="Database Schema">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${s.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginRight: 8 }}>Schema:</span>
            <div style={{ display: 'flex', background: s.bg, borderRadius: 6, border: `1px solid ${s.border}` }}>
              <button onClick={() => { setView('sql'); setSelectedCol(null) }} style={{
                padding: '5px 14px', fontSize: 12, fontFamily: s.mono, borderRadius: 5, border: 'none',
                cursor: 'pointer', background: view === 'sql' ? s.accent : 'transparent',
                color: view === 'sql' ? '#fff' : s.text3, transition: 'all 0.2s',
              }}>
                SQL
              </button>
              <button onClick={() => { setView('nosql'); setSelectedCol(null) }} style={{
                padding: '5px 14px', fontSize: 12, fontFamily: s.mono, borderRadius: 5, border: 'none',
                cursor: 'pointer', background: view === 'nosql' ? s.purple : 'transparent',
                color: view === 'nosql' ? '#fff' : s.text3, transition: 'all 0.2s',
              }}>
                NoSQL (DynamoDB)
              </button>
            </div>
          </div>

          {view === 'sql' ? (
            <div>
              {sqlTables.map(table => (
                <div key={table.name} style={{ padding: 16, borderBottom: `1px solid ${s.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontFamily: s.mono, color: s.accent, fontWeight: 700 }}>{table.name}</div>
                    <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, background: s.bg, padding: '2px 8px', borderRadius: 4 }}>TABLE</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', marginBottom: 4, fontSize: 10, fontFamily: s.mono, color: s.text3, padding: '0 8px' }}>
                      <span style={{ flex: 1 }}>COLUMN</span>
                      <span style={{ width: 100 }}>TYPE</span>
                      <span style={{ width: 140 }}>CONSTRAINT</span>
                    </div>
                    {table.columns.map(col => (
                      <div
                        key={col.name}
                        onClick={() => setSelectedCol({ table: table.name, col: col.name })}
                        style={{
                          display: 'flex', padding: '6px 8px', borderRadius: 4, cursor: 'pointer',
                          background: selectedCol?.table === table.name && selectedCol?.col === col.name ? 'rgba(91,141,239,0.1)' : 'transparent',
                          borderLeft: selectedCol?.table === table.name && selectedCol?.col === col.name ? `2px solid ${s.accent}` : '2px solid transparent',
                          transition: 'all 0.15s', marginBottom: 1,
                        }}
                      >
                        <span style={{ flex: 1, fontSize: 12, fontFamily: s.mono, color: col.constraint.includes('PK') ? s.yellow : s.text }}>{col.name}</span>
                        <span style={{ width: 100, fontSize: 11, fontFamily: s.mono, color: s.purple }}>{col.type}</span>
                        <span style={{ width: 140, fontSize: 11, fontFamily: s.mono, color: s.text3 }}>{col.constraint}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 10, fontFamily: s.mono, color: s.green }}>
                    {table.indexes.map((idx, i) => (
                      <div key={i}>{idx}</div>
                    ))}
                  </div>
                </div>
              ))}
              {colExplanation && (
                <div style={{ padding: '12px 16px', background: s.bg, borderTop: `1px solid ${s.border}`, fontSize: 13, color: s.text2, lineHeight: 1.5 }}>
                  <span style={{ fontFamily: s.mono, color: s.accent, fontSize: 11 }}>WHY THIS COLUMN: </span>{colExplanation}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 16 }}>
              <div style={{ background: s.bg, borderRadius: 6, padding: 14, border: `1px solid ${s.border}` }}>
                <div style={{ whiteSpace: 'pre', fontSize: 12, fontFamily: s.mono, color: s.text2, lineHeight: 1.7 }}>{nosqlSchema}</div>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: s.text3, lineHeight: 1.6 }}>
                <div><span style={{ color: s.purple, fontFamily: s.mono }}>Partition key:</span> short_code for fast single-item reads</div>
                <div><span style={{ color: s.purple, fontFamily: s.mono }}>Sort key:</span> timestamp + hash for analytics time-series ordering</div>
                <div><span style={{ color: s.purple, fontFamily: s.mono }}>Hot cache:</span> Redis SET with TTL for the redirect hot path</div>
                <div><span style={{ color: s.purple, fontFamily: s.mono }}>TTL:</span> DynamoDB TTL attribute for automatic expiration of links</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DemoBoundary>
  )
}
