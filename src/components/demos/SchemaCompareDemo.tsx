import { useState, useRef, useCallback, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-json'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const initialSqlRows = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 },
  { id: 2, name: 'Bob', email: 'bob@example.com', age: 25 },
]

const initialNosqlDocs = [
  { _id: 'a1', name: 'Alice', email: 'alice@example.com', age: 30 },
  { _id: 'b2', name: 'Bob', email: 'bob@example.com', age: 25, role: 'admin' },
]

const presets = [
  {
    label: 'Valid data',
    fields: { name: 'Charlie', email: 'charlie@example.com', age: '28' },
  },
  {
    label: 'Extra field',
    fields: { name: 'Diana', email: 'diana@example.com', age: '32', phone: '555-0199' },
  },
  {
    label: 'Missing field',
    fields: { name: 'Eve', email: '', age: '' },
  },
]

let nextId = 3
let nextDocId = 3

function getInsertResult(preset: typeof presets[number]) {
  const hasExtra = 'phone' in preset.fields && preset.fields.phone !== ''
  const hasEmail = preset.fields.email !== ''
  const hasAge = preset.fields.age !== ''

  const sqlOk = !hasExtra && hasEmail && hasAge
  const nosqlOk = true

  let sqlError = ''
  if (hasExtra) sqlError = "ERROR: column 'phone' does not exist"
  else if (!hasEmail) sqlError = "ERROR: column 'email' cannot be null"
  else if (!hasAge) sqlError = "ERROR: column 'age' cannot be null"

  return { sqlOk, nosqlOk, sqlError }
}

export default function SchemaCompareDemo() {
  const [sqlRows, setSqlRows] = useState(initialSqlRows)
  const [nosqlDocs, setNosqlDocs] = useState(initialNosqlDocs)
  const [logs, setLogs] = useState<{ preset: string; sql: boolean; nosql: boolean; sqlError: string }[]>([])
  const [sqlError, setSqlError] = useState('')
  const [nosqlSuccess, setNosqlSuccess] = useState('')
  const [sqlShake, setSqlShake] = useState(false)
  const [activePreset, setActivePreset] = useState<number | null>(null)
  const sqlRef = useRef<HTMLDivElement>(null)

  const insertSql = 'INSERT INTO users VALUES (...)'
  const highlightedInsertSql = useMemo(() => Prism.highlight(insertSql, Prism.languages.sql, 'sql'), [])
  const insertNosql = 'db.users.insertOne({...})'
  const highlightedInsertNosql = useMemo(() => Prism.highlight(insertNosql, Prism.languages.sql, 'sql'), [])

  const handleInsert = useCallback((idx: number) => {
    const preset = presets[idx]
    const result = getInsertResult(preset)
    setActivePreset(idx)

    setSqlError(result.sqlOk ? '' : result.sqlError)
    setNosqlSuccess(result.nosqlOk ? 'Document inserted successfully' : '')

    if (!result.sqlOk) {
      setSqlShake(true)
      setTimeout(() => setSqlShake(false), 500)
    }

    if (result.sqlOk) {
      const newRow = { id: nextId++, name: preset.fields.name, email: preset.fields.email, age: Number(preset.fields.age) }
      setSqlRows(prev => [...prev, newRow])
    }

    if (result.nosqlOk) {
      const cleanFields: Record<string, string | number> = { name: preset.fields.name }
      if (preset.fields.email) cleanFields.email = preset.fields.email
      if (preset.fields.age) cleanFields.age = Number(preset.fields.age)
      if (preset.fields.phone) cleanFields.phone = preset.fields.phone
      const newDoc = { _id: `d${nextDocId++}`, ...cleanFields }
      setNosqlDocs(prev => [...prev, newDoc])
    }

    setLogs(prev => [...prev, { preset: preset.label, sql: result.sqlOk, nosql: result.nosqlOk, sqlError: result.sqlError }])
  }, [])

  const panelStyle: React.CSSProperties = {
    background: s.bg2,
    border: `1px solid ${s.border}`,
    borderRadius: 10,
    padding: 20,
    flex: 1,
    minWidth: 0,
    transition: 'border-color 0.3s',
  }

  const headerStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const sqlShakeStyle = sqlShake
    ? {
        animation: 'schemaShake 0.5s ease-in-out',
        borderColor: s.red,
      }
    : {}

  const presetFields = activePreset !== null ? presets[activePreset].fields : null

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style>{`
        @keyframes schemaShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
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

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div ref={sqlRef} style={{ ...panelStyle, ...sqlShakeStyle }}>
          <div style={headerStyle}>
            <span style={{ color: s.accent }}>&#9670;</span>
            <span style={{ color: s.text }}>SQL Database</span>
            <span style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, marginLeft: 'auto' }}>users TABLE</span>
          </div>

          <div style={{ background: s.bg, borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ display: 'flex', fontSize: 11, fontFamily: s.mono, color: s.text3, background: s.bg3 }}>
              <span style={{ flex: 0.5, padding: '8px 10px' }}>id</span>
              <span style={{ flex: 1, padding: '8px 10px' }}>name</span>
              <span style={{ flex: 1.4, padding: '8px 10px' }}>email</span>
              <span style={{ flex: 0.6, padding: '8px 10px' }}>age</span>
            </div>
            {sqlRows.map((row, i) => (
              <div
                key={row.id}
                style={{
                  display: 'flex',
                  fontSize: 12,
                  fontFamily: s.mono,
                  color: s.text2,
                  borderTop: `1px solid ${s.border}`,
                  background: i % 2 === 0 ? 'transparent' : `${s.bg3}22`,
                }}
              >
                <span style={{ flex: 0.5, padding: '7px 10px', color: s.text3 }}>{row.id}</span>
                <span style={{ flex: 1, padding: '7px 10px' }}>{row.name}</span>
                <span style={{ flex: 1.4, padding: '7px 10px', color: s.green }}>{row.email}</span>
                <span style={{ flex: 0.6, padding: '7px 10px', color: s.yellow }}>{row.age}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 8 }}><code dangerouslySetInnerHTML={{ __html: highlightedInsertSql }} /></div>
          <div style={{ background: s.bg, borderRadius: 6, padding: 10, fontFamily: s.mono, fontSize: 12, color: s.text2, minHeight: 56, marginBottom: 10 }}>
            {presetFields ? (
              <span>
                (<span style={{ color: s.yellow }}>{presetFields.name}</span>,{' '}
                <span style={{ color: presetFields.email ? s.green : s.red }}>{presetFields.email || 'NULL'}</span>,{' '}
                <span style={{ color: presetFields.age ? s.yellow : s.red }}>{presetFields.age || 'NULL'}</span>
                {presetFields.phone ? <span style={{ color: s.red }}>, {presetFields.phone}</span> : null})
              </span>
            ) : (
              <span style={{ color: s.text3 }}>Select a preset below...</span>
            )}
          </div>

          {sqlError && (
            <div style={{ background: `${s.red}11`, border: `1px solid ${s.red}44`, borderRadius: 6, padding: '8px 12px', fontSize: 12, fontFamily: s.mono, color: s.red, marginBottom: 10 }}>
              {sqlError}
            </div>
          )}
        </div>

        <div style={panelStyle}>
          <div style={headerStyle}>
            <span style={{ color: s.green }}>&#9670;</span>
            <span style={{ color: s.text }}>NoSQL Database</span>
            <span style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, marginLeft: 'auto' }}>users COLLECTION</span>
          </div>

          <div style={{ background: s.bg, borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
            {nosqlDocs.map((doc, i) => (
              <div
                key={doc._id}
                style={{
                  padding: '10px 12px',
                  fontSize: 12,
                  fontFamily: s.mono,
                  color: s.text2,
                  borderTop: i > 0 ? `1px solid ${s.border}` : 'none',
                  background: i % 2 === 0 ? 'transparent' : `${s.bg3}22`,
                  lineHeight: 1.7,
                }}
              >
                <span style={{ color: s.text3 }}>{'{ '}</span>
                <span style={{ color: s.text3 }}>_id:</span>{' '}
                <span style={{ color: s.purple }}>"{doc._id}"</span>,{' '}
                <span style={{ color: s.text3 }}>name:</span>{' '}
                <span style={{ color: s.yellow }}>"{doc.name}"</span>,{' '}
                <span style={{ color: s.text3 }}>email:</span>{' '}
                <span style={{ color: s.green }}>"{doc.email}"</span>,{' '}
                <span style={{ color: s.text3 }}>age:</span>{' '}
                <span style={{ color: s.yellow }}>{doc.age}</span>
                {doc.role ? (
                  <>, <span style={{ color: s.text3 }}>role:</span> <span style={{ color: s.orange }}>"{doc.role}"</span></>
                ) : null}
                {doc.phone ? (
                  <>, <span style={{ color: s.text3 }}>phone:</span> <span style={{ color: s.accent }}>"{doc.phone}"</span></>
                ) : null}
                <span style={{ color: s.text3 }}>{' }'}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 8 }}><code dangerouslySetInnerHTML={{ __html: highlightedInsertNosql }} /></div>
          <div style={{ background: s.bg, borderRadius: 6, padding: 10, fontFamily: s.mono, fontSize: 12, color: s.text2, minHeight: 56, marginBottom: 10 }}>
            {presetFields ? (
              <span>
                <span style={{ color: s.text3 }}>{'{ '}</span>
                <span style={{ color: s.text3 }}>name:</span>{' '}
                <span style={{ color: s.yellow }}>"{presetFields.name}"</span>
                {presetFields.email ? (
                  <>, <span style={{ color: s.text3 }}>email:</span> <span style={{ color: s.green }}>"{presetFields.email}"</span></>
                ) : null}
                {presetFields.age ? (
                  <>, <span style={{ color: s.text3 }}>age:</span> <span style={{ color: s.yellow }}>{presetFields.age}</span></>
                ) : null}
                {presetFields.phone ? (
                  <>, <span style={{ color: s.text3 }}>phone:</span> <span style={{ color: s.accent }}>"{presetFields.phone}"</span></>
                ) : null}
                <span style={{ color: s.text3 }}>{' }'}</span>
              </span>
            ) : (
              <span style={{ color: s.text3 }}>Select a preset below...</span>
            )}
          </div>

          {nosqlSuccess && (
            <div style={{ background: `${s.green}11`, border: `1px solid ${s.green}44`, borderRadius: 6, padding: '8px 12px', fontSize: 12, fontFamily: s.mono, color: s.green, marginBottom: 10 }}>
              {nosqlSuccess}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: s.text3, alignSelf: 'center', marginRight: 4 }}>Try inserting:</span>
        {presets.map((p, i) => (
          <button
            key={i}
            onClick={() => handleInsert(i)}
            style={{
              background: activePreset === i ? s.bg3 : s.bg2,
              border: `1px solid ${activePreset === i ? s.border2 : s.border}`,
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 13,
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              color: activePreset === i ? s.text : s.text2,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = s.border2
              e.currentTarget.style.color = s.text
            }}
            onMouseLeave={e => {
              if (activePreset !== i) {
                e.currentTarget.style.borderColor = s.border
                e.currentTarget.style.color = s.text2
              }
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {logs.length > 0 && (
        <div style={{ marginTop: 16, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: s.text3, marginBottom: 10 }}>
            Insert Log
          </div>
          <div style={{ maxHeight: 160, overflowY: 'auto' }}>
            {logs.map((log, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 0',
                  borderTop: i > 0 ? `1px solid ${s.border}` : 'none',
                  fontSize: 12,
                  fontFamily: s.mono,
                }}
              >
                <span style={{ color: s.text3, flex: 1.2 }}>{log.preset}</span>
                <span style={{ flex: 1.2 }}>
                  {log.sql ? (
                    <span style={{ color: s.green }}>&#10003; Accepted</span>
                  ) : (
                    <span style={{ color: s.red }}>&#10007; {log.sqlError}</span>
                  )}
                </span>
                <span style={{ flex: 1.2 }}>
                  <span style={{ color: s.green }}>&#10003; Accepted</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
