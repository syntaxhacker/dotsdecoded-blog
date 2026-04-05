import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-sql'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface User {
  id: number
  name: string
  email: string
  role: string
  posts_count: number
  created_at: string
}

const users: User[] = [
  { id: 1, name: 'Alice Chen', email: 'alice@example.com', role: 'admin', posts_count: 42, created_at: '2023-01-15' },
  { id: 2, name: 'Bob Martinez', email: 'bob@example.com', role: 'author', posts_count: 18, created_at: '2023-03-22' },
  { id: 3, name: 'Carol Kim', email: 'carol@example.com', role: 'author', posts_count: 31, created_at: '2023-06-10' },
  { id: 4, name: 'David Okafor', email: 'david@example.com', role: 'member', posts_count: 5, created_at: '2024-01-05' },
  { id: 5, name: 'Eva Petrov', email: 'eva@example.com', role: 'admin', posts_count: 27, created_at: '2023-08-19' },
  { id: 6, name: 'Frank Lin', email: 'frank@example.com', role: 'member', posts_count: 0, created_at: '2024-06-01' },
  { id: 7, name: 'Grace Singh', email: 'grace@example.com', role: 'author', posts_count: 12, created_at: '2024-02-14' },
  { id: 8, name: 'Henry Tanaka', email: 'henry@example.com', role: 'member', posts_count: 3, created_at: '2024-04-30' },
]

type Clause = { type: string; value: string; active: boolean }

export default function ActiveRecordQueryDemo() {
  const [clauses, setClauses] = useState<Clause[]>([
    { type: 'all', value: '', active: true },
  ])
  const [whereField, setWhereField] = useState('role')
  const [whereOp, setWhereOp] = useState('=')
  const [whereVal, setWhereVal] = useState('author')
  const [orderField, setOrderField] = useState('posts_count')
  const [orderDir, setOrderDir] = useState('DESC')
  const [limitVal, setLimitVal] = useState('3')

  const chain = clauses.filter(c => c.active)

  const { rubyCode, sql, results, sqlHtml } = useMemo(() => {
    let ruby = 'User'
    let sqlParts: string[] = []
    let currentSql = 'SELECT users.* FROM users'
    let currentResults = [...users]

    for (const clause of chain) {
      switch (clause.type) {
        case 'all':
          ruby += '.all'
          break
        case 'where': {
          const field = clause.value.split('|')[0]
          const op = clause.value.split('|')[1]
          const val = clause.value.split('|')[2]
          ruby += `.where(${field}: "${val}")`
          const sqlVal = ['id', 'posts_count'].includes(field) ? val : `'${val}'`
          if (sqlParts.length === 0) {
            currentSql += ` WHERE ${field} ${op} ${sqlVal}`
          } else {
            currentSql += ` AND ${field} ${op} ${sqlVal}`
          }
          sqlParts.push(`WHERE ${field} ${op} ${sqlVal}`)
          currentResults = currentResults.filter(u => {
            const uv = String(u[field as keyof User]).toLowerCase()
            const iv = val.toLowerCase()
            if (op === '=') return uv === iv
            if (op === '!=') return uv !== iv
            if (op === '>') return Number(uv) > Number(iv)
            if (op === '<') return Number(uv) < Number(iv)
            return true
          })
          break
        }
        case 'order': {
          const [f, d] = clause.value.split('|')
          ruby += `.order("${f} ${d.toLowerCase()}")`
          currentSql += ` ORDER BY ${f} ${d}`
          sqlParts.push(`ORDER BY ${f} ${d}`)
          currentResults.sort((a, b) => {
            const av = a[f as keyof User] as number
            const bv = b[f as keyof User] as number
            return d === 'DESC' ? bv - av : av - bv
          })
          break
        }
        case 'limit': {
          const n = parseInt(clause.value)
          ruby += `.limit(${n})`
          currentSql += ` LIMIT ${n}`
          sqlParts.push(`LIMIT ${n}`)
          currentResults = currentResults.slice(0, n)
          break
        }
      }
    }

    return { rubyCode: ruby, sql: currentSql, results: currentResults, sqlHtml: Prism.highlight(currentSql, Prism.languages.sql, 'sql') }
  }, [chain])

  const addClause = (type: string, value: string) => {
    setClauses(prev => [...prev, { type, value, active: true }])
  }

  const removeClause = (idx: number) => {
    setClauses(prev => prev.map((c, i) => i === idx ? { ...c, active: false } : c))
  }

  const resetQuery = () => {
    setClauses([{ type: 'all', value: '', active: true }])
  }

  const clauseLabel = (c: Clause) => {
    switch (c.type) {
      case 'all': return '.all'
      case 'where': { const [f, , v] = c.value.split('|'); return `.where(${f}: "${v}")` }
      case 'order': { const [f, d] = c.value.split('|'); return `.order("${f} ${d.toLowerCase()}")` }
      case 'limit': return `.limit(${c.value})`
      default: return ''
    }
  }

  return (
    <DemoBoundary name="Active Record Query Builder">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Add Clauses</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <select value={whereField} onChange={e => setWhereField(e.target.value)} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 8px', color: s.text, fontFamily: s.mono, fontSize: 11 }}>
                <option value="role">role</option>
                <option value="name">name</option>
                <option value="posts_count">posts_count</option>
              </select>
              <select value={whereOp} onChange={e => setWhereOp(e.target.value)} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 8px', color: s.text, fontFamily: s.mono, fontSize: 11 }}>
                <option value="=">=</option>
                <option value="!=">!=</option>
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
              </select>
              <input value={whereVal} onChange={e => setWhereVal(e.target.value)} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 8px', color: s.text, fontFamily: s.mono, fontSize: 11, width: 80 }} placeholder="value" />
              <button onClick={() => addClause('where', `${whereField}|${whereOp}|${whereVal}`)} style={{ background: s.accent, border: 'none', borderRadius: 4, padding: '4px 10px', color: s.bg, fontFamily: s.mono, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                + where
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <select value={orderField} onChange={e => setOrderField(e.target.value)} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 8px', color: s.text, fontFamily: s.mono, fontSize: 11 }}>
                <option value="posts_count">posts_count</option>
                <option value="name">name</option>
                <option value="created_at">created_at</option>
              </select>
              <select value={orderDir} onChange={e => setOrderDir(e.target.value)} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 8px', color: s.text, fontFamily: s.mono, fontSize: 11 }}>
                <option value="DESC">DESC</option>
                <option value="ASC">ASC</option>
              </select>
              <button onClick={() => addClause('order', `${orderField}|${orderDir}`)} style={{ background: s.green, border: 'none', borderRadius: 4, padding: '4px 10px', color: s.bg, fontFamily: s.mono, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                + order
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <input value={limitVal} onChange={e => setLimitVal(e.target.value)} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 8px', color: s.text, fontFamily: s.mono, fontSize: 11, width: 50 }} type="number" min="1" />
              <button onClick={() => addClause('limit', limitVal)} style={{ background: s.purple, border: 'none', borderRadius: 4, padding: '4px 10px', color: s.bg, fontFamily: s.mono, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                + limit
              </button>
              <button onClick={resetQuery} style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 10px', color: s.text3, fontFamily: s.mono, fontSize: 11, cursor: 'pointer', marginLeft: 'auto' }}>
                Reset
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Query Chain</div>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: 12,
              fontFamily: s.mono,
              fontSize: 12,
              lineHeight: 1.6,
              minHeight: 80,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 4,
            }}>
              {chain.map((c, i) => (
                <span
                  key={i}
                  onClick={() => removeClause(clauses.indexOf(c))}
                  style={{
                    color: c.type === 'where' ? s.accent : c.type === 'order' ? s.green : c.type === 'limit' ? s.purple : s.text,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: 3,
                    background: `${c.type === 'where' ? s.accent : c.type === 'order' ? s.green : c.type === 'limit' ? s.purple : s.text3}15`,
                    textDecoration: c.type === 'all' ? 'none' : 'underline dotted',
                  }}
                >
                  {clauseLabel(c)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="arqc" style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          padding: 12,
          fontFamily: s.mono,
          fontSize: 11,
          lineHeight: 1.5,
          marginBottom: 12,
          whiteSpace: 'pre' as const,
          overflowX: 'auto',
        }}>
          <style>{`
.arqc code .token.keyword { color: #f92672; }
.arqc code .token.string, .arqc code .token.char, .arqc code .token.builtin, .arqc code .token.inserted { color: #e6db74; }
.arqc code .token.number, .arqc code .token.constant, .arqc code .token.symbol, .arqc code .token.property, .arqc code .token.tag, .arqc code .token.boolean, .arqc code .token.deleted { color: #ae81ff; }
.arqc code .token.selector, .arqc code .token.attr-name { color: #f92672; }
.arqc code .token.attr-value, .arqc code .token.atrule { color: #e6db74; }
.arqc code .token.function, .arqc code .token.class-name { color: #a6e22e; }
.arqc code .token.operator, .arqc code .token.entity, .arqc code .token.url, .arqc code .token.punctuation { color: #f8f8f2; }
.arqc code .token.comment, .arqc code .token.prolog, .arqc code .token.doctype, .arqc code .token.cdata { color: #75715e; font-style: italic; }
.arqc code .token.parameter, .arqc code .token.variable, .arqc code .token.regex, .arqc code .token.important { color: #fd971f; }
`}</style>
          <code dangerouslySetInnerHTML={{ __html: sqlHtml }} />
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          Results ({results.length} record{results.length !== 1 ? 's' : ''})
        </div>
        <div style={{ overflowX: 'auto' as const }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontFamily: s.mono, fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${s.border}` }}>
                {['id', 'name', 'role', 'posts_count', 'created_at'].map(col => (
                  <th key={col} style={{ padding: '6px 10px', color: s.text3, fontWeight: 600, textAlign: 'left' as const }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${s.bg3}` }}>
                  <td style={{ padding: '6px 10px', color: s.text3 }}>{u.id}</td>
                  <td style={{ padding: '6px 10px', color: s.text }}>{u.name}</td>
                  <td style={{ padding: '6px 10px', color: u.role === 'admin' ? s.red : u.role === 'author' ? s.green : s.text2 }}>{u.role}</td>
                  <td style={{ padding: '6px 10px', color: s.yellow }}>{u.posts_count}</td>
                  <td style={{ padding: '6px 10px', color: s.text3 }}>{u.created_at}</td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 16, color: s.text3, textAlign: 'center' as const }}>No matching records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DemoBoundary>
  )
}
