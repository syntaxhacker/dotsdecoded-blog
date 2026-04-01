import { useState, useRef, useEffect, useMemo } from 'react'
import SpeedController, { getStepDelay } from './SpeedController'
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

const sqlUsers = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
]

const sqlOrders = [
  { id: 1, user_id: 1, product: 'Laptop', amount: '$999' },
  { id: 2, user_id: 1, product: 'Mouse', amount: '$25' },
  { id: 3, user_id: 2, product: 'Keyboard', amount: '$79' },
]

const nosqlDocs = [
  { _id: 'u1', name: 'Alice', email: 'alice@example.com', orders: [{ product: 'Laptop', amount: '$999' }, { product: 'Mouse', amount: '$25' }] },
  { _id: 'u2', name: 'Bob', email: 'bob@example.com', orders: [{ product: 'Keyboard', amount: '$79' }] },
]

const joinResult = [
  { name: 'Alice', email: 'alice@example.com', product: 'Laptop', amount: '$999' },
  { name: 'Alice', email: 'alice@example.com', product: 'Mouse', amount: '$25' },
  { name: 'Bob', email: 'bob@example.com', product: 'Keyboard', amount: '$79' },
]

export default function JoinVsEmbedDemo() {
  const [speed, setSpeed] = useState(1)
  const [joinPhase, setJoinPhase] = useState(0)
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null)
  const [svgLines, setSvgLines] = useState<{ x1: number; y1: number; x2: number; y2: number; color: string; len: number }[]>([])
  const [linesVisible, setLinesVisible] = useState(false)
  const sqlRef = useRef<HTMLDivElement>(null)

  const joinSql = 'SELECT * FROM users JOIN orders ON users.id = orders.user_id'
  const highlightedJoinSql = useMemo(() => Prism.highlight(joinSql, Prism.languages.sql, 'sql'), [])

  useEffect(() => {
    if (joinPhase !== 1 || !sqlRef.current) return
    const timer = setTimeout(() => {
      const el = sqlRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const lines: typeof svgLines = []
      for (const order of sqlOrders) {
        const uc = el.querySelector(`[data-uid="${order.user_id}"]`) as HTMLElement | null
        const oc = el.querySelector(`[data-ouid="${order.id}"]`) as HTMLElement | null
        if (uc && oc) {
          const ur = uc.getBoundingClientRect()
          const or_ = oc.getBoundingClientRect()
          const x1 = ur.left + ur.width / 2 - rect.left
          const y1 = ur.top + ur.height - rect.top
          const x2 = or_.left + or_.width / 2 - rect.left
          const y2 = or_.top - rect.top
          lines.push({
            x1, y1, x2, y2,
            color: order.user_id === 1 ? s.accent : s.green,
            len: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
          })
        }
      }
      setSvgLines(lines)
      requestAnimationFrame(() => setLinesVisible(true))
      setTimeout(() => setJoinPhase(2), getStepDelay(2500, speed))
    }, getStepDelay(150, speed))
    return () => clearTimeout(timer)
  }, [joinPhase, speed])

  const runJoin = () => {
    setJoinPhase(0)
    setSvgLines([])
    setLinesVisible(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setJoinPhase(1)))
  }

  const resetJoin = () => {
    setJoinPhase(0)
    setSvgLines([])
    setLinesVisible(false)
  }

  const thS: React.CSSProperties = {
    padding: '5px 8px', textAlign: 'left', fontSize: 10, fontWeight: 600,
    color: s.text3, borderBottom: `1px solid ${s.border}`, fontFamily: s.mono,
    textTransform: 'uppercase', letterSpacing: '0.5px',
  }

  const tdS: React.CSSProperties = {
    padding: '5px 8px', fontSize: 12, color: s.text2, fontFamily: s.mono,
    borderBottom: `1px solid ${s.border}`,
  }

  const hl = (uid: number): React.CSSProperties => {
    if (joinPhase < 1) return {}
    const c = uid === 1 ? s.accent : s.green
    return { background: `${c}12`, borderLeft: `3px solid ${c}` }
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 340px' }}>
          <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: s.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 11 }}>SQL</span>
              Separate Tables + JOIN
            </div>

            <div ref={sqlRef} style={{ position: 'relative' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: s.yellow, fontFamily: s.mono, marginBottom: 4 }}>TABLE users</div>
              <div style={{ border: `1px solid ${s.border}`, borderRadius: 4, overflow: 'hidden' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={thS}>id</th>
                      <th style={thS}>name</th>
                      <th style={thS}>email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sqlUsers.map(u => (
                      <tr key={u.id} style={hl(u.id)}>
                        <td data-uid={u.id} style={{ ...tdS, color: u.id === 1 ? s.accent : s.green, fontWeight: 600 }}>{u.id}</td>
                        <td style={tdS}>{u.name}</td>
                        <td style={tdS}>{u.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ fontSize: 10, fontWeight: 600, color: s.yellow, fontFamily: s.mono, margin: '12px 0 4px' }}>TABLE orders</div>
              <div style={{ border: `1px solid ${s.border}`, borderRadius: 4, overflow: 'hidden' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={thS}>id</th>
                      <th style={thS}>user_id</th>
                      <th style={thS}>product</th>
                      <th style={thS}>amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sqlOrders.map(o => (
                      <tr key={o.id} style={hl(o.user_id)}>
                        <td style={tdS}>{o.id}</td>
                        <td data-ouid={o.id} style={{ ...tdS, color: o.user_id === 1 ? s.accent : s.green, fontWeight: 600 }}>{o.user_id}</td>
                        <td style={tdS}>{o.product}</td>
                        <td style={{ ...tdS, color: s.green }}>{o.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {svgLines.length > 0 && (
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
                  {svgLines.map((ln, i) => (
                    <path
                      key={i}
                      d={`M ${ln.x1} ${ln.y1} C ${ln.x1} ${(ln.y1 + ln.y2) / 2} ${ln.x2} ${(ln.y1 + ln.y2) / 2} ${ln.x2} ${ln.y2}`}
                      stroke={ln.color}
                      strokeWidth={2}
                      fill="none"
                      strokeDasharray={ln.len}
                      strokeDashoffset={linesVisible ? 0 : ln.len}
                      style={{ transition: `stroke-dashoffset 0.6s ease ${i * 0.15}s` }}
                      opacity={0.8}
                    />
                  ))}
                </svg>
              )}
            </div>

            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={joinPhase === 0 ? runJoin : undefined}
                style={{
                  background: joinPhase === 0 ? s.accent : s.bg3,
                  color: joinPhase === 0 ? '#fff' : s.text3,
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: s.mono,
                  cursor: joinPhase === 0 ? 'pointer' : 'default',
                  opacity: joinPhase === 0 ? 1 : 0.6,
                }}
              >
                {joinPhase === 0 ? 'Run JOIN' : joinPhase === 1 ? 'Matching...' : 'Done'}
              </button>
              {joinPhase === 2 && (
                <button
                  onClick={resetJoin}
                  style={{
                    background: 'transparent',
                    color: s.text3,
                    border: `1px solid ${s.border}`,
                    borderRadius: 6,
                    padding: '7px 10px',
                    fontSize: 11,
                    fontFamily: s.mono,
                    cursor: 'pointer',
                  }}
                >
                  Reset
                </button>
              )}
              <SpeedController speed={speed} onSpeedChange={setSpeed} />
            </div>

            {joinPhase === 2 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: s.green, fontFamily: s.mono, marginBottom: 4, wordBreak: 'break-all' }}>
                  <style>{`
                    code .token.keyword { color: #f92672; }
                    code .token.string, code .token.char, code .token.builtin, code .token.inserted { color: #e6db74; }
                    code .token.number, code .token.constant, code .token.symbol, code .token.property, code .token.tag, code .token.boolean, code .token.deleted { color: #ae81ff; }
                    code .token.selector, code .token.attr-name { color: #f92672; }
                    code .token.attr-value, code .token.atrule { color: #e6db74; }
                    code .token.function, code .token.class-name { color: #a6e22e; }
                    code .token.operator, code .token.entity, code .token.url, code .token.punctuation { color: #f8f8f2; }
                    code .token.comment, code .token.prolog, code .token.doctype, code .token.cdata { color: #75715e; font-style: italic; }
                    code .token.parameter, code .token.variable, code .token.regex, code .token.important { color: #fd977f; }
                  `}</style>
                  <code dangerouslySetInnerHTML={{ __html: highlightedJoinSql }} />
                </div>
                <div style={{ border: `1px solid ${s.green}40`, borderRadius: 4, overflow: 'hidden' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={thS}>name</th>
                        <th style={thS}>email</th>
                        <th style={thS}>product</th>
                        <th style={thS}>amt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {joinResult.map((r, i) => (
                        <tr key={i}>
                          <td style={{ ...tdS, color: s.text, fontWeight: 500 }}>{r.name}</td>
                          <td style={tdS}>{r.email}</td>
                          <td style={tdS}>{r.product}</td>
                          <td style={{ ...tdS, color: s.green }}>{r.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: '1 1 340px' }}>
          <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: s.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: s.green, fontFamily: s.mono, fontSize: 11 }}>NoSQL</span>
              Embedded Document
            </div>

            <div style={{ fontSize: 10, fontWeight: 600, color: s.yellow, fontFamily: s.mono, marginBottom: 8 }}>COLLECTION users</div>

            {nosqlDocs.map((doc, i) => {
              const open = expandedDoc === i
              return (
                <div
                  key={doc._id}
                  onClick={() => setExpandedDoc(open ? null : i)}
                  style={{
                    border: `1px solid ${open ? s.accent : s.border}`,
                    borderRadius: 6,
                    marginBottom: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>{doc._id}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: s.text }}>{doc.name}</span>
                      </div>
                      <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>{doc.email}</span>
                    </div>
                    <span style={{
                      fontSize: 11,
                      color: s.text3,
                      fontFamily: s.mono,
                      transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}>
                      {'>'}
                    </span>
                  </div>
                  {open && (
                    <div style={{ borderTop: `1px solid ${s.border}`, padding: '10px 12px', background: s.bg }}>
                      <div style={{ fontSize: 10, color: s.accent, fontFamily: s.mono, marginBottom: 6 }}>orders [{doc.orders.length}]</div>
                      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                        <thead>
                          <tr>
                            <th style={thS}>product</th>
                            <th style={thS}>amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doc.orders.map((o, j) => (
                            <tr key={j}>
                              <td style={{ ...tdS, color: s.text }}>{o.product}</td>
                              <td style={{ ...tdS, color: s.green }}>{o.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ background: `${s.yellow}08`, border: `1px solid ${s.yellow}30`, borderRadius: 8, padding: 14, marginTop: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: s.yellow, marginBottom: 6, fontFamily: s.mono }}>TRADE-OFF</div>
        <div style={{ fontSize: 12, lineHeight: 1.7, color: s.text2 }}>
          <span style={{ color: s.accent, fontWeight: 600 }}>SQL:</span> 2 queries or 1 JOIN to get user + orders.{' '}
          <span style={{ color: s.green, fontWeight: 600 }}>NoSQL:</span> 1 query, all data in one document.{' '}
          But if you need to update a user's email, SQL updates 1 row. NoSQL might need to update every document that contains that user's data.
        </div>
      </div>
    </div>
  )
}
