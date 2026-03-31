import { useState, useMemo } from 'react'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const products = [
  { _id: 1, name: "Wireless Headphones", price: 79.99, category: "Electronics", inStock: true, ratings: { average: 4.5, count: 234 }, tags: ["audio", "wireless", "bluetooth"] },
  { _id: 2, name: "Running Shoes", price: 129.99, category: "Sports", inStock: true, ratings: { average: 4.2, count: 89 }, tags: ["footwear", "running"] },
  { _id: 3, name: "Coffee Maker", price: 199.99, category: "Kitchen", inStock: false, ratings: { average: 3.8, count: 56 } },
  { _id: 4, name: "Mechanical Keyboard", price: 149.99, category: "Electronics", inStock: true, variants: [{ size: "Full", color: "Black", price: 149.99 }, { size: "TKL", color: "White", price: 139.99 }], description: "Cherry MX switches, RGB backlit" },
  { _id: 5, name: "Yoga Mat", price: 34.99, category: "Sports", inStock: true, tags: ["fitness", "yoga"] },
  { _id: 6, name: "Smart Watch", price: 299.99, category: "Electronics", inStock: true, ratings: { average: 4.7, count: 412 }, tags: ["wearable", "smart", "fitness"] },
]

const allFields = ['_id', 'name', 'price', 'category', 'inStock', 'ratings.average', 'ratings.count', 'tags', 'variants', 'description']

const operators = ['=', '>', '<', '!=', 'exists']

type Filter = { field: string; operator: string; value: string }

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

function documentMatches(doc: Record<string, unknown>, filters: Filter[]): boolean {
  return filters.every(f => {
    const val = getNestedValue(doc, f.field)
    if (f.operator === 'exists') {
      const shouldExist = f.value.toLowerCase() === 'true'
      return shouldExist ? val !== undefined : val === undefined
    }
    if (val === undefined) return false
    const numVal = Number(f.value)
    const parsedVal = !isNaN(numVal) ? numVal : f.value
    const boolVal = f.value.toLowerCase() === 'true' ? true : f.value.toLowerCase() === 'false' ? false : parsedVal
    switch (f.operator) {
      case '=': return val == boolVal
      case '!=': return val != boolVal
      case '>': return typeof val === 'number' && typeof boolVal === 'number' && val > boolVal
      case '<': return typeof val === 'number' && typeof boolVal === 'number' && val < boolVal
      default: return false
    }
  })
}

function buildQueryObject(filters: Filter[]): Record<string, unknown> {
  const query: Record<string, unknown> = {}
  filters.forEach(f => {
    if (f.operator === 'exists') {
      const shouldExist = f.value.toLowerCase() === 'true'
      query[f.field] = { $exists: shouldExist }
    } else if (f.operator === '=') {
      const numVal = Number(f.value)
      const boolVal = f.value.toLowerCase() === 'true' ? true : f.value.toLowerCase() === 'false' ? false : !isNaN(numVal) ? numVal : f.value
      query[f.field] = boolVal
    } else if (f.operator === '!=') {
      const numVal = Number(f.value)
      const boolVal = f.value.toLowerCase() === 'true' ? true : f.value.toLowerCase() === 'false' ? false : !isNaN(numVal) ? numVal : f.value
      query[f.field] = { $ne: boolVal }
    } else if (f.operator === '>') {
      query[f.field] = { $gt: Number(f.value) }
    } else if (f.operator === '<') {
      query[f.field] = { $lt: Number(f.value) }
    }
  })
  return query
}

function highlightQuery(query: Record<string, unknown>): string {
  const parts: string[] = []
  parts.push('{')
  const entries = Object.entries(query)
  entries.forEach(([key, val], i) => {
    const comma = i < entries.length - 1 ? ',' : ''
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      const inner = Object.entries(val as Record<string, unknown>)
        .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
        .join(', ')
      parts.push(`  ${key}: {`)
      parts.push(`    ${inner}`)
      parts.push(`  }${comma}`)
    } else {
      parts.push(`  ${key}: ${JSON.stringify(val)}${comma}`)
    }
  })
  parts.push('}')
  return parts.join('\n')
}

function QueryHighlight({ query }: { query: string }) {
  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 8,
      padding: '12px 16px',
      fontFamily: s.mono,
      fontSize: 13,
      lineHeight: 1.6,
      whiteSpace: 'pre',
      overflowX: 'auto',
    }}>
      <span style={{ color: s.text3 }}>db.products.find(</span>
      <span style={{ color: s.accent }}>{highlightQuery(buildQueryObject(queryToFilters(JSON.parse(JSON.stringify(query)))))}</span>
      <span style={{ color: s.text3 }}>)</span>
    </div>
  )
}

function queryToFilters(query: Record<string, unknown>): Filter[] {
  return Object.entries(query).map(([key, val]) => {
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      const opMap: Record<string, string> = { '$exists': 'exists', '$ne': '!=', '$gt': '>', '$lt': '<', '$gte': '>', '$lte': '<' }
      const entries = Object.entries(val as Record<string, unknown>)
      const [op, v] = entries[0]
      const mappedOp = opMap[op] || '='
      return { field: key, operator: mappedOp, value: String(v) }
    }
    return { field: key, operator: '=', value: String(val) }
  })
}

function DocumentCard({ doc, isExpanded, onToggle }: { doc: Record<string, unknown>; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 8,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
        color: s.text, fontFamily: s.mono, fontSize: 13, textAlign: 'left',
      }}>
        <span>
          <span style={{ color: s.purple }}>{'{ '}</span>
          <span style={{ color: s.green }}>_id</span>
          <span style={{ color: s.text2 }}>: </span>
          <span style={{ color: s.orange }}>{String(doc._id)}</span>
          <span style={{ color: s.text3 }}>, </span>
          <span style={{ color: s.green }}>name</span>
          <span style={{ color: s.text2 }}>: </span>
          <span style={{ color: s.orange }}>"{String(doc.name)}"</span>
          <span style={{ color: s.text3 }}> ...</span>
          <span style={{ color: s.purple }}>{' }'}</span>
        </span>
        <span style={{ color: s.text3, fontSize: 11, marginLeft: 8 }}>{isExpanded ? '▾' : '▸'}</span>
      </button>
      {isExpanded && (
        <pre style={{
          margin: 0, padding: '10px 14px', borderTop: `1px solid ${s.border}`,
          fontFamily: s.mono, fontSize: 12, lineHeight: 1.5,
          color: s.text2, overflowX: 'auto', background: s.bg2,
        }}>
          <SyntaxJson obj={doc} />
        </pre>
      )}
    </div>
  )
}

function SyntaxJson({ obj, indent = 0 }: { obj: unknown; indent?: number }) {
  const pad = '  '.repeat(indent)
  if (obj === null) return <span style={{ color: s.red }}>null</span>
  if (typeof obj === 'boolean') return <span style={{ color: s.orange }}>{String(obj)}</span>
  if (typeof obj === 'number') return <span style={{ color: s.orange }}>{String(obj)}</span>
  if (typeof obj === 'string') return <span style={{ color: s.yellow }}>"{obj}"</span>
  if (Array.isArray(obj)) {
    if (obj.length === 0) return <span>[]</span>
    return (
      <>
        [<span>{'\n'}</span>
        {obj.map((item, i) => (
          <span key={i}>
            {pad}  <SyntaxJson obj={item} indent={indent + 1} />
            {i < obj.length - 1 ? ',' : ''}
            {'\n'}
          </span>
        ))}
        {pad}]
      </>
    )
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>)
    if (entries.length === 0) return <span>{'{}'}</span>
    return (
      <>
        {'{'}{'\n'}
        {entries.map(([key, val], i) => (
          <span key={key}>
            {pad}  <span style={{ color: s.green }}>"{key}"</span>: <SyntaxJson obj={val} indent={indent + 1} />
            {i < entries.length - 1 ? ',' : ''}
            {'\n'}
          </span>
        ))}
        {pad}{'}'}
      </>
    )
  }
  return <span>{String(obj)}</span>
}

const presets = [
  { label: 'Electronics under $500', filters: [{ field: 'category', operator: '=', value: 'Electronics' }, { field: 'price', operator: '<', value: '500' }] },
  { label: 'Highly rated', filters: [{ field: 'ratings.average', operator: '>', value: '4' }] },
  { label: 'In stock with tags', filters: [{ field: 'inStock', operator: '=', value: 'true' }, { field: 'tags', operator: 'exists', value: 'true' }] },
]

export default function NoSqlQueryDemo() {
  const [filters, setFilters] = useState<Filter[]>([
    { field: 'category', operator: '=', value: 'Electronics' },
  ])
  const [results, setResults] = useState<Record<string, unknown>[]>([])
  const [hasRun, setHasRun] = useState(false)
  const [expandedDocs, setExpandedDocs] = useState<Set<number>>(new Set())
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null)
  const fieldSuggestions = useMemo(() => {
    const existingFields = filters.map(f => f.field)
    return allFields.filter(f => !existingFields.includes(f))
  }, [filters])

  function updateFilter(idx: number, patch: Partial<Filter>) {
    setFilters(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f))
  }

  function addFilter() {
    const available = allFields.find(f => !filters.some(ef => ef.field === f))
    setFilters(prev => [...prev, { field: available || 'name', operator: '=', value: '' }])
  }

  function removeFilter(idx: number) {
    if (filters.length <= 1) return
    setFilters(prev => prev.filter((_, i) => i !== idx))
  }

  function runQuery() {
    const matched = products.filter(doc => documentMatches(doc as unknown as Record<string, unknown>, filters))
    setResults(matched)
    setHasRun(true)
    setExpandedDocs(new Set())
  }

  function applyPreset(p: typeof presets[0]) {
    setFilters(p.filters)
    const matched = products.filter(doc => documentMatches(doc as unknown as Record<string, unknown>, p.filters))
    setResults(matched)
    setHasRun(true)
    setExpandedDocs(new Set())
  }

  function toggleDoc(id: number) {
    setExpandedDocs(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div style={{
      maxWidth: 820,
      margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ color: s.text3, fontSize: 13 }}>Presets:</span>
          {presets.map((p, i) => (
            <button key={i} onClick={() => applyPreset(p)} style={{
              padding: '5px 12px', borderRadius: 6, border: `1px solid ${s.border}`,
              background: s.bg2, color: s.accent, cursor: 'pointer', fontSize: 12,
              fontFamily: s.mono, transition: 'border-color 0.2s, background 0.2s',
            }} onMouseEnter={e => { e.currentTarget.style.borderColor = s.accent; e.currentTarget.style.background = s.bg3 }} onMouseLeave={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.background = s.bg2 }}>
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filters.map((f, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 2 }}>
                <input
                  value={f.field}
                  onChange={e => updateFilter(idx, { field: e.target.value })}
                  onFocus={() => setShowSuggestions(idx)}
                  onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
                  placeholder="field"
                  style={{
                    width: '100%', padding: '7px 10px', borderRadius: 6,
                    border: `1px solid ${s.border}`, background: s.bg,
                    color: s.text, fontFamily: s.mono, fontSize: 13,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {showSuggestions === idx && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                    background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 6,
                    marginTop: 4, maxHeight: 160, overflowY: 'auto',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}>
                    {[f.field, ...fieldSuggestions].filter((v, i, a) => a.indexOf(v) === i).map(field => (
                      <div
                        key={field}
                        onMouseDown={() => { updateFilter(idx, { field }); setShowSuggestions(null) }}
                        style={{
                          padding: '6px 10px', cursor: 'pointer', fontSize: 12,
                          fontFamily: s.mono, color: field === f.field ? s.accent : s.text2,
                          background: field === f.field ? s.bg3 : 'transparent',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = s.bg3 }}
                        onMouseLeave={e => { e.currentTarget.style.background = field === f.field ? s.bg3 : 'transparent' }}
                      >
                        {field}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <select
                value={f.operator}
                onChange={e => updateFilter(idx, { operator: e.target.value })}
                style={{
                  padding: '7px 8px', borderRadius: 6, border: `1px solid ${s.border}`,
                  background: s.bg, color: s.text, fontFamily: s.mono, fontSize: 13,
                  outline: 'none', cursor: 'pointer', flex: 'none', minWidth: 72,
                }}
              >
                {operators.map(op => (
                  <option key={op} value={op} style={{ background: s.bg2, color: s.text }}>{op}</option>
                ))}
              </select>

              <input
                value={f.value}
                onChange={e => updateFilter(idx, { value: e.target.value })}
                placeholder={f.operator === 'exists' ? 'true/false' : 'value'}
                style={{
                  flex: 2, padding: '7px 10px', borderRadius: 6,
                  border: `1px solid ${s.border}`, background: s.bg,
                  color: s.text, fontFamily: s.mono, fontSize: 13,
                  outline: 'none', boxSizing: 'border-box',
                }}
                onKeyDown={e => { if (e.key === 'Enter') runQuery() }}
              />

              <button onClick={() => removeFilter(idx)} style={{
                width: 28, height: 28, borderRadius: 6, border: `1px solid ${s.border}`,
                background: 'none', color: s.text3, cursor: 'pointer', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'color 0.2s, border-color 0.2s',
              }} onMouseEnter={e => { e.currentTarget.style.color = s.red; e.currentTarget.style.borderColor = s.red }} onMouseLeave={e => { e.currentTarget.style.color = s.text3; e.currentTarget.style.borderColor = s.border }}>
                ×
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={addFilter} style={{
            padding: '7px 14px', borderRadius: 6, border: `1px dashed ${s.border}`,
            background: 'none', color: s.text2, cursor: 'pointer', fontSize: 13,
            transition: 'border-color 0.2s, color 0.2s',
          }} onMouseEnter={e => { e.currentTarget.style.borderColor = s.accent; e.currentTarget.style.color = s.accent }} onMouseLeave={e => { e.currentTarget.style.borderColor = s.border; e.currentTarget.style.color = s.text2 }}>
            + Add filter
          </button>
          <button onClick={runQuery} style={{
            padding: '7px 20px', borderRadius: 6, border: 'none',
            background: s.accent, color: '#fff', cursor: 'pointer', fontSize: 13,
            fontWeight: 600, transition: 'opacity 0.2s',
          }} onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }} onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
            Run Query
          </button>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {hasRun && (
          <>
            <div>
              <div style={{ color: s.text3, fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Generated Query</div>
              <QueryHighlight query={buildQueryObject(filters)} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ color: s.text3, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Results ({results.length} of {products.length})
                </span>
              </div>
              {results.length === 0 ? (
                <div style={{
                  padding: '16px', background: s.bg, border: `1px solid ${s.border}`,
                  borderRadius: 8, color: s.text3, fontSize: 13, textAlign: 'center',
                }}>
                  No documents matched your query
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {results.map(doc => (
                    <DocumentCard
                      key={doc._id as number}
                      doc={doc}
                      isExpanded={expandedDocs.has(doc._id as number)}
                      onToggle={() => toggleDoc(doc._id as number)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
