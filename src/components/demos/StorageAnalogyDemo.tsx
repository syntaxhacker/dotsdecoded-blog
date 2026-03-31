import { useState } from 'react'

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

const sqlData = [
  { id: 1, name: 'Alice Chen', email: 'alice@dev.io', age: 28 },
  { id: 2, name: 'Bob Park', email: 'bob@dev.io', age: 34 },
  { id: 3, name: 'Cruz Vega', email: 'cruz@dev.io', age: 22 },
]

const nosqlCards = [
  {
    label: 'Document A',
    fields: [
      { key: 'name', value: 'Alice Chen' },
      { key: 'email', value: 'alice@dev.io' },
    ],
  },
  {
    label: 'Document B',
    fields: [
      { key: 'name', value: 'Bob Park' },
      { key: 'email', value: 'bob@dev.io' },
      { key: 'phone', value: '+1-555-0101' },
      { key: 'address', value: '42 Oak St, Portland' },
    ],
  },
  {
    label: 'Document C',
    fields: [
      { key: 'name', value: 'Cruz Vega' },
      { key: 'preferences', value: '{ theme: dark, lang: es }' },
      { key: 'favorites', value: '[rust, hiking, chess]' },
    ],
  },
]

const sqlColumns = ['id', 'name', 'email', 'age'] as const

const realSql = `| id | name        | email          | age |
|----|-------------|----------------|-----|
| 1  | Alice Chen  | alice@dev.io   | 28  |
| 2  | Bob Park    | bob@dev.io     | 34  |
| 3  | Cruz Vega   | cruz@dev.io    | 22  |`

const realNosql = `// Document A
{ "name": "Alice Chen", "email": "alice@dev.io" }

// Document B
{
  "name": "Bob Park",
  "email": "bob@dev.io",
  "phone": "+1-555-0101",
  "address": "42 Oak St, Portland"
}

// Document C
{
  "name": "Cruz Vega",
  "preferences": { "theme": "dark", "lang": "es" },
  "favorites": ["rust", "hiking", "chess"]
}`

export default function StorageAnalogyDemo() {
  const [view, setView] = useState<'analogy' | 'real'>('analogy')
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 20, backgroundColor: s.bg2, borderRadius: 8, padding: 4, border: `1px solid ${s.border}` }}>
        {(['analogy', 'real'] as const).map((v) => (
          <button
            key={v}
            onClick={() => { setView(v); setSelectedRow(null); setSelectedCard(null) }}
            style={{
              padding: '6px 18px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.2s',
              backgroundColor: view === v ? s.accent : 'transparent',
              color: view === v ? '#fff' : s.text3,
            }}
          >
            {v === 'analogy' ? 'Visual Analogy' : 'Real Data'}
          </button>
        ))}
      </div>

      {view === 'analogy' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.accent, marginBottom: 10, letterSpacing: 0.5 }}>
              SQL: Filing Cabinet
            </div>
            <div style={{ backgroundColor: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1.2fr 40px', backgroundColor: s.bg3 }}>
                {sqlColumns.map((col) => (
                  <div key={col} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 700, color: s.text3, textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `1px solid ${s.border}` }}>
                    {col}
                  </div>
                ))}
              </div>
              {sqlData.map((row, i) => {
                const isSelected = selectedRow === i
                return (
                  <div key={i}>
                    <div
                      onClick={() => setSelectedRow(isSelected ? null : i)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr 1.2fr 40px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? `${s.accent}15` : i % 2 === 0 ? s.bg2 : `${s.bg2}cc`,
                        borderLeft: isSelected ? `3px solid ${s.accent}` : '3px solid transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      {[row.id, row.name, row.email, row.age].map((val, ci) => (
                        <div
                          key={ci}
                          style={{
                            padding: '8px 10px',
                            color: typeof val === 'number' ? s.yellow : s.text,
                            fontFamily: ci >= 1 ? s.mono : 'inherit',
                            fontSize: ci === 0 ? 11 : 12,
                          }}
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                    {isSelected && (
                      <div style={{ padding: '8px 12px', backgroundColor: `${s.accent}0a`, borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: s.green, fontSize: 12 }}>{'->'}</span>
                        <span style={{ color: s.text2, fontSize: 11 }}>Every row has the same structure</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {selectedRow === null && (
              <div style={{ textAlign: 'center', color: s.text3, fontSize: 11, marginTop: 8 }}>
                Click a row to inspect
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.purple, marginBottom: 10, letterSpacing: 0.5 }}>
              NoSQL: Flexible Containers
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {nosqlCards.map((card, i) => {
                const isSelected = selectedCard === i
                const widths = ['100%', '100%', '100%']
                const heights = [isSelected ? 'auto' : 56, isSelected ? 'auto' : 56, isSelected ? 'auto' : 56]
                const borderColors = [s.accent, s.green, s.orange]
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedCard(isSelected ? null : i)}
                    style={{
                      width: widths[i],
                      minHeight: heights[i],
                      backgroundColor: s.bg2,
                      border: `1px solid ${isSelected ? borderColors[i] : s.border}`,
                      borderLeft: `3px solid ${borderColors[i]}`,
                      borderRadius: 8,
                      padding: isSelected ? '12px 14px' : '10px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isSelected ? 8 : 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: borderColors[i] }}>{card.label}</span>
                      <span style={{ fontSize: 10, color: s.text3, backgroundColor: s.bg3, padding: '2px 8px', borderRadius: 4 }}>
                        {card.fields.length} field{card.fields.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {isSelected ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {card.fields.map((f, fi) => (
                          <div key={fi} style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                            <span style={{ color: s.text3, minWidth: 80, fontFamily: s.mono, fontSize: 11 }}>{f.key}:</span>
                            <span style={{ color: s.text, fontFamily: s.mono, fontSize: 11, wordBreak: 'break-all' }}>{f.value}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${s.border}`, color: s.text2, fontSize: 10 }}>
                          <span style={{ color: s.green }}>{'->'}</span> Each document can be different
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: s.text3, fontSize: 11, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {card.fields.map(f => `${f.key}`).join(', ')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {selectedCard === null && (
              <div style={{ textAlign: 'center', color: s.text3, fontSize: 11, marginTop: 8 }}>
                Click a card to inspect
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.accent, marginBottom: 10, letterSpacing: 0.5 }}>
              SQL Table
            </div>
            <pre style={{ margin: 0, padding: 14, backgroundColor: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, fontFamily: s.mono, fontSize: 11, color: s.text2, whiteSpace: 'pre', overflowX: 'auto', lineHeight: 1.6 }}>
              {realSql}
            </pre>
            <div style={{ marginTop: 8, padding: '6px 10px', backgroundColor: `${s.accent}0a`, borderRadius: 6, borderLeft: `3px solid ${s.accent}` }}>
              <span style={{ fontSize: 11, color: s.text2 }}>Fixed schema: every row must have all columns</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.purple, marginBottom: 10, letterSpacing: 0.5 }}>
              NoSQL Documents
            </div>
            <pre style={{ margin: 0, padding: 14, backgroundColor: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, fontFamily: s.mono, fontSize: 11, color: s.text2, whiteSpace: 'pre', overflowX: 'auto', lineHeight: 1.6 }}>
              {realNosql}
            </pre>
            <div style={{ marginTop: 8, padding: '6px 10px', backgroundColor: `${s.purple}0a`, borderRadius: 6, borderLeft: `3px solid ${s.purple}` }}>
              <span style={{ fontSize: 11, color: s.text2 }}>Schema-free: each document has its own shape</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
