import { useState, useCallback } from 'react'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Employee {
  id: number
  name: string
  department: string
  salary: number
  city: string
  join_date: string
}

interface Filter {
  column: string
  operator: string
  value: string
}

const employees: Employee[] = [
  { id: 1, name: 'Alice Chen', department: 'Engineering', salary: 120000, city: 'New York', join_date: '2023-03-15' },
  { id: 2, name: 'Bob Martinez', department: 'Marketing', salary: 78000, city: 'San Francisco', join_date: '2022-11-01' },
  { id: 3, name: 'Carol Kim', department: 'Engineering', salary: 105000, city: 'New York', join_date: '2024-01-10' },
  { id: 4, name: 'David Okafor', department: 'Sales', salary: 92000, city: 'Chicago', join_date: '2023-07-22' },
  { id: 5, name: 'Eva Petrov', department: 'Engineering', salary: 115000, city: 'San Francisco', join_date: '2024-06-01' },
  { id: 6, name: 'Frank Lin', department: 'HR', salary: 68000, city: 'New York', join_date: '2021-09-14' },
  { id: 7, name: 'Grace Singh', department: 'Sales', salary: 95000, city: 'Chicago', join_date: '2024-02-28' },
  { id: 8, name: 'Henry Tanaka', department: 'Marketing', salary: 82000, city: 'San Francisco', join_date: '2023-12-03' },
]

const columns = ['id', 'name', 'department', 'salary', 'city', 'join_date']
const operators = ['=', '!=', '>', '<', '>=', '<=', 'LIKE']

function formatSql(sql: string): React.ReactNode[] {
  const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'ORDER BY', 'ASC', 'DESC', 'OR']
  const parts = sql.split(/(\s+)/)
  return parts.map((part, i) => {
    const trimmed = part.trim()
    if (keywords.includes(trimmed)) {
      return <span key={i} style={{ color: s.purple, fontWeight: 700 }}>{part}</span>
    }
    if (trimmed === '*') {
      return <span key={i} style={{ color: s.yellow }}>{part}</span>
    }
    if (/^['"]/.test(trimmed)) {
      return <span key={i} style={{ color: s.green }}>{part}</span>
    }
    if (/^\d+$/.test(trimmed)) {
      return <span key={i} style={{ color: s.orange }}>{part}</span>
    }
    return <span key={i}>{part}</span>
  })
}

function matchesFilter(row: Employee, filter: Filter): boolean {
  const colVal = String(row[filter.column as keyof Employee]).toLowerCase()
  const inputVal = filter.value.toLowerCase()

  switch (filter.operator) {
    case '=': return colVal === inputVal
    case '!=': return colVal !== inputVal
    case '>': return Number(colVal) > Number(inputVal)
    case '<': return Number(colVal) < Number(inputVal)
    case '>=': return Number(colVal) >= Number(inputVal)
    case '<=': return Number(colVal) <= Number(inputVal)
    case 'LIKE': return colVal.includes(inputVal)
    default: return true
  }
}

function buildSql(selectedCols: string[], filters: Filter[], orderBy: string, orderDir: string): string {
  const selectClause = selectedCols.length === columns.length ? '*' : selectedCols.join(', ')
  let sql = `SELECT ${selectClause} FROM employees`

  const validFilters = filters.filter(f => f.value.trim() !== '')
  if (validFilters.length > 0) {
    const whereParts = validFilters.map(f => {
      const val = ['id', 'salary'].includes(f.column) ? f.value : `'${f.value}'`
      return `${f.column} ${f.operator} ${val}`
    })
    sql += ` WHERE ${whereParts.join(' AND ')}`
  }

  if (orderBy) {
    sql += ` ORDER BY ${orderBy} ${orderDir}`
  }

  return sql
}

function runQuery(selectedCols: string[], filters: Filter[], orderBy: string, orderDir: string): Employee[] {
  let results = [...employees]

  const validFilters = filters.filter(f => f.value.trim() !== '')
  for (const filter of validFilters) {
    results = results.filter(row => matchesFilter(row, filter))
  }

  if (orderBy) {
    results.sort((a, b) => {
      const aVal = a[orderBy as keyof Employee]
      const bVal = b[orderBy as keyof Employee]
      const cmp = typeof aVal === 'number' ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal))
      return orderDir === 'DESC' ? -cmp : cmp
    })
  }

  return results
}

function buildDisplayRows(selectedCols: string[], results: Employee[]) {
  return results.map(row => {
    const displayRow: Record<string, string | number> = {}
    for (const col of selectedCols) {
      displayRow[col] = row[col as keyof Employee]
    }
    return displayRow
  })
}

function HeaderRow({ selectedCols }: { selectedCols: string[] }) {
  return (
    <div style={{ display: 'flex', minWidth: 'fit-content' }}>
      {selectedCols.map(col => (
        <div key={col} style={{
          flex: col === 'name' ? 2 : 1,
          padding: '8px 12px',
          fontFamily: s.mono,
          fontSize: 12,
          fontWeight: 700,
          color: s.purple,
          borderBottom: `2px solid ${s.purple}`,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}>
          {col}
        </div>
      ))}
    </div>
  )
}

function DataRow({ row, selectedCols, index }: { row: Record<string, string | number>; selectedCols: string[]; index: number }) {
  return (
    <div style={{
      display: 'flex',
      minWidth: 'fit-content',
      background: index % 2 === 0 ? 'transparent' : s.bg2,
    }}>
      {selectedCols.map(col => (
        <div key={col} style={{
          flex: col === 'name' ? 2 : 1,
          padding: '6px 12px',
          fontFamily: s.mono,
          fontSize: 13,
          color: s.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {typeof row[col] === 'number' && ['salary'].includes(col)
            ? `$${row[col].toLocaleString()}`
            : String(row[col])}
        </div>
      ))}
    </div>
  )
}

export default function SqlQueryDemo() {
  const [selectedCols, setSelectedCols] = useState<string[]>([...columns])
  const [filters, setFilters] = useState<Filter[]>([{ column: 'department', operator: '=', value: '' }])
  const [orderBy, setOrderBy] = useState('')
  const [orderDir, setOrderDir] = useState('ASC')
  const [results, setResults] = useState<Employee[]>(employees)
  const [sqlString, setSqlString] = useState('SELECT * FROM employees')
  const [hasRun, setHasRun] = useState(false)

  const handleRun = useCallback(() => {
    const sql = buildSql(selectedCols, filters, orderBy, orderDir)
    const res = runQuery(selectedCols, filters, orderBy, orderDir)
    setSqlString(sql)
    setResults(res)
    setHasRun(true)
  }, [selectedCols, filters, orderBy, orderDir])

  const toggleColumn = (col: string) => {
    setSelectedCols(prev => {
      const next = prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
      return next.length === 0 ? prev : next
    })
  }

  const addFilter = () => {
    setFilters(prev => [...prev, { column: 'department', operator: '=', value: '' }])
  }

  const removeFilter = (index: number) => {
    setFilters(prev => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index))
  }

  const updateFilter = (index: number, field: keyof Filter, value: string) => {
    setFilters(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f))
  }

  const applyPreset = (preset: number) => {
    if (preset === 1) {
      setSelectedCols([...columns])
      setFilters([
        { column: 'department', operator: '=', value: 'Engineering' },
        { column: 'city', operator: '=', value: 'New York' },
      ])
      setOrderBy('')
      setOrderDir('ASC')
    } else if (preset === 2) {
      setSelectedCols(['name', 'salary'])
      setFilters([{ column: 'salary', operator: '>', value: '90000' }])
      setOrderBy('salary')
      setOrderDir('DESC')
    } else {
      setSelectedCols(['name', 'department', 'join_date'])
      setFilters([{ column: 'department', operator: '=', value: '' }])
      setOrderBy('join_date')
      setOrderDir('DESC')
    }
    setHasRun(false)
  }

  const selectStyle: React.CSSProperties = {
    background: s.bg,
    color: s.text,
    border: `1px solid ${s.border}`,
    borderRadius: 6,
    padding: '6px 10px',
    fontFamily: s.mono,
    fontSize: 13,
    outline: 'none',
    cursor: 'pointer',
  }

  const inputStyle: React.CSSProperties = {
    background: s.bg,
    color: s.text,
    border: `1px solid ${s.border}`,
    borderRadius: 6,
    padding: '6px 10px',
    fontFamily: s.mono,
    fontSize: 13,
    outline: 'none',
    width: 140,
  }

  const displayRows = buildDisplayRows(selectedCols, results)

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text }}>
      <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Table: employees
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: s.text2, marginBottom: 8 }}>SELECT columns:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {columns.map(col => {
              const active = selectedCols.includes(col)
              return (
                <button
                  key={col}
                  onClick={() => toggleColumn(col)}
                  style={{
                    background: active ? s.accent : s.bg3,
                    color: active ? '#fff' : s.text3,
                    border: `1px solid ${active ? s.accent : s.border}`,
                    borderRadius: 5,
                    padding: '4px 10px',
                    fontFamily: s.mono,
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {col}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: s.text2, marginBottom: 8 }}>WHERE:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filters.map((filter, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {i > 0 && (
                  <span style={{ fontFamily: s.mono, fontSize: 12, color: s.purple, fontWeight: 700, width: 32, textAlign: 'center' }}>AND</span>
                )}
                {i === 0 && <div style={{ width: 32 }} />}
                <select value={filter.column} onChange={e => updateFilter(i, 'column', e.target.value)} style={selectStyle}>
                  {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
                <select value={filter.operator} onChange={e => updateFilter(i, 'operator', e.target.value)} style={{ ...selectStyle, width: 70 }}>
                  {operators.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
                <input
                  type="text"
                  value={filter.value}
                  onChange={e => updateFilter(i, 'value', e.target.value)}
                  placeholder="value..."
                  style={inputStyle}
                />
                {filters.length > 1 && (
                  <button
                    onClick={() => removeFilter(i)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${s.border}`,
                      borderRadius: 5,
                      color: s.red,
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: 16,
                      fontFamily: s.mono,
                    }}
                  >
                    x
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addFilter}
              style={{
                background: 'transparent',
                border: `1px dashed ${s.border}`,
                borderRadius: 5,
                color: s.text3,
                padding: '4px 12px',
                fontFamily: s.mono,
                fontSize: 12,
                cursor: 'pointer',
                alignSelf: 'flex-start',
                marginLeft: 40,
                transition: 'all 0.15s',
              }}
            >
              + Add filter
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: s.text2 }}>ORDER BY:</span>
          <select value={orderBy} onChange={e => setOrderBy(e.target.value)} style={selectStyle}>
            <option value="">(none)</option>
            {columns.map(col => <option key={col} value={col}>{col}</option>)}
          </select>
          <button
            onClick={() => setOrderDir(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
            style={{
              background: s.bg3,
              border: `1px solid ${s.border}`,
              borderRadius: 5,
              padding: '4px 12px',
              fontFamily: s.mono,
              fontSize: 12,
              fontWeight: 700,
              color: orderDir === 'ASC' ? s.green : s.orange,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {orderDir}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={handleRun}
            style={{
              background: s.green,
              color: s.bg,
              border: 'none',
              borderRadius: 6,
              padding: '8px 20px',
              fontFamily: s.mono,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            Run Query
          </button>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: s.text3 }}>Presets:</span>
            {[1, 2, 3].map(n => (
              <button
                key={n}
                onClick={() => applyPreset(n)}
                style={{
                  background: s.bg3,
                  color: s.text2,
                  border: `1px solid ${s.border}`,
                  borderRadius: 5,
                  padding: '5px 10px',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {n === 1 ? 'Engineers in NYC' : n === 2 ? 'Top earners' : 'Recent hires'}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          padding: '12px 16px',
          fontFamily: s.mono,
          fontSize: 13,
          lineHeight: 1.6,
          overflowX: 'auto',
          marginBottom: 16,
        }}>
          {formatSql(sqlString)}
        </div>

        {hasRun && (
          <div>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 8 }}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'auto',
            }}>
              {results.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: s.text3, fontSize: 13 }}>
                  No matching rows
                </div>
              ) : (
                <>
                  <HeaderRow selectedCols={selectedCols} />
                  {displayRows.map((row, i) => (
                    <DataRow key={i} row={row} selectedCols={selectedCols} index={i} />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
