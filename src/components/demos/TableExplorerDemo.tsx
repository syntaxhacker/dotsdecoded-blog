import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-sql'
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

type ColKey = 'id' | 'name' | 'email' | 'age' | 'created_at'

const columns: { key: ColKey; label: string; type: string; description: string }[] = [
  { key: 'id', label: 'id', type: 'INT', description: 'Whole number. Auto-incremented for each new row.' },
  { key: 'name', label: 'name', type: 'VARCHAR(255)', description: 'Variable-length text up to 255 characters.' },
  { key: 'email', label: 'email', type: 'VARCHAR(255)', description: 'Variable-length text up to 255 characters. Unique constraint.' },
  { key: 'age', label: 'age', type: 'INT', description: 'Whole number. No constraints on range.' },
  { key: 'created_at', label: 'created_at', type: 'TIMESTAMP', description: 'Date and time. Auto-set to current time on insert.' },
]

const rows: Record<ColKey, string>[] = [
  { id: '1', name: 'Alice Chen', email: 'alice@example.com', age: '28', created_at: '2025-01-15 09:32:00' },
  { id: '2', name: 'Bob Martinez', email: 'bob@example.com', age: '34', created_at: '2025-02-20 14:15:00' },
  { id: '3', name: 'Carol Nguyen', email: 'carol@example.com', age: '25', created_at: '2025-03-10 11:48:00' },
  { id: '4', name: 'Dave Kim', email: 'dave@example.com', age: '31', created_at: '2025-04-05 16:22:00' },
]

const createTableSql = `CREATE TABLE users (
  id          INT           PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(255)   NOT NULL,
  email       VARCHAR(255)   NOT NULL UNIQUE,
  age         INT,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);`

export default function TableExplorerDemo() {
  const [activeCol, setActiveCol] = useState<ColKey | null>(null)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const highlightedSql = useMemo(() => Prism.highlight(createTableSql, Prism.languages.sql, 'sql'), [])

  const colInfo = activeCol ? columns.find(c => c.key === activeCol) : null

  return (
    <DemoBoundary name="Table Explorer">
      <div style={{
        background: s.bg, padding: '32px 24px', borderRadius: 16,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        maxWidth: 820, margin: '0 auto',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>
          SQL Table Explorer
        </div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Click a column header to see its data type. Click a row to inspect values with their types.
        </p>

        <div style={{ overflowX: 'auto', marginBottom: colInfo ? 8 : 24, borderRadius: 10, border: `1px solid ${s.border}` }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: s.mono, fontSize: 13 }}>
            <thead>
              <tr style={{ background: s.bg2 }}>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => setActiveCol(activeCol === col.key ? null : col.key)}
                    style={{
                      padding: '12px 16px', textAlign: 'left', color: activeCol === col.key ? s.accent : s.text2,
                      borderBottom: `2px solid ${activeCol === col.key ? s.accent : s.border}`,
                      cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', userSelect: 'none',
                      transition: 'color 0.2s, border-color 0.2s',
                    }}
                  >
                    {col.label}
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 400, color: s.text3, marginTop: 2 }}>
                      {col.type}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => setSelectedRow(selectedRow === idx ? null : idx)}
                  style={{
                    background: selectedRow === idx ? `${s.accent}10` : idx % 2 === 0 ? s.bg : s.bg2,
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      style={{
                        padding: '10px 16px', color: s.text, borderBottom: `1px solid ${s.border}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span>{row[col.key]}</span>
                        {selectedRow === idx && (
                          <span style={{ fontSize: 11, color: s.accent, fontWeight: 600 }}>
                            {columns.find(c => c.key === col.key)?.type}
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {colInfo && (
          <div style={{
            background: s.bg2, border: `1px solid ${s.accent}`, borderRadius: 10,
            padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{
              background: s.accent, color: '#fff', fontFamily: s.mono, fontSize: 12, fontWeight: 600,
              padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap',
            }}>
              {colInfo.type}
            </span>
            <span style={{ color: s.text2, fontSize: 13, lineHeight: 1.5 }}>
              {colInfo.description}
            </span>
          </div>
        )}

        <div style={{ fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 10 }}>
          CREATE TABLE Statement
        </div>
        <div style={{
          background: s.bg2, borderRadius: 10, padding: '18px 20px',
          border: `1px solid ${s.border}`, overflowX: 'auto',
        }}>
          <div style={{ margin: 0, fontFamily: s.mono, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre' }}>
            <style>{`
              code .token.keyword { color: #f92672; }
              code .token.string, code .token.char, code .token.builtin, code .token.inserted { color: #e6db74; }
              code .token.number, code .token.constant, code .token.symbol, code .token.property, code .token.tag, code .token.boolean, code .token.deleted { color: #ae81ff; }
              code .token.selector, code .token.attr-name { color: #f92672; }
              code .token.attr-value, code .token.atrule { color: #e6db74; }
              code .token.function, code .token.class-name { color: #a6e22e; }
              code .token.operator, code .token.entity, code .token.url, code .token.punctuation { color: #f8f8f2; }
              code .token.comment, code .token.prolog, code .token.doctype, code .token.cdata { color: #75715e; font-style: italic; }
              code .token.parameter, code .token.variable, code .token.regex, code .token.important { color: #fd971f; }
            `}</style>
            <code dangerouslySetInnerHTML={{ __html: highlightedSql }} />
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
