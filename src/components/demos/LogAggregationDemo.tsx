import { useState, useEffect, useRef } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
type Service = 'API' | 'Auth' | 'Database'

interface LogEntry {
  id: number
  timestamp: string
  service: Service
  level: LogLevel
  correlationId: string
  message: string
  structured: boolean
}

const levelColors: Record<LogLevel, string> = {
  DEBUG: s.text3,
  INFO: s.accent,
  WARN: s.yellow,
  ERROR: s.red,
}

const serviceColors: Record<Service, string> = {
  API: s.accent,
  Auth: s.purple,
  Database: s.green,
}

const structuredMessages: Record<Service, Record<LogLevel, string[]>> = {
  API: {
    DEBUG: [
      '{"method":"GET","path":"/api/users","query":{},"headers":{"x-request-id":"REQ"}}',
      '{"method":"POST","path":"/api/orders","body":{"items":3}}',
    ],
    INFO: [
      '{"method":"GET","path":"/api/users","status":200,"duration_ms":42,"request_id":"REQ"}',
      '{"method":"POST","path":"/api/orders","status":201,"duration_ms":128,"request_id":"REQ"}',
      '{"method":"GET","path":"/api/products","status":200,"duration_ms":35,"request_id":"REQ"}',
    ],
    WARN: [
      '{"method":"GET","path":"/api/search","duration_ms":2300,"warning":"slow_query","request_id":"REQ"}',
      '{"path":"/api/uploads","body_size_mb":12,"warning":"large_payload","request_id":"REQ"}',
    ],
    ERROR: [
      '{"method":"POST","path":"/api/payments","status":500,"error":"gateway_timeout","request_id":"REQ"}',
      '{"method":"GET","path":"/api/users/999","status":404,"error":"not_found","request_id":"REQ"}',
    ],
  },
  Auth: {
    DEBUG: [
      '{"action":"token_validate","token_type":"jwt","claims":{"sub":"user-42"}}',
      '{"action":"refresh_check","token_expiry":"2026-04-22T10:00:00Z"}',
    ],
    INFO: [
      '{"action":"login","user_id":"usr_4821","method":"password","ip":"10.0.1.55"}',
      '{"action":"token_refresh","user_id":"usr_4821","new_ttl":3600}',
      '{"action":"logout","user_id":"usr_3309","session_revoked":true}',
    ],
    WARN: [
      '{"action":"login","user_id":"usr_9999","reason":"rate_limited","attempts":5}',
      '{"action":"token_validate","reason":"expiring_soon","ttl_remaining":120}',
    ],
    ERROR: [
      '{"action":"login","user_id":"usr_4821","reason":"invalid_password","attempts":3}',
      '{"action":"token_validate","reason":"token_expired","token_id":"tok_dead"}',
    ],
  },
  Database: {
    DEBUG: [
      '{"query":"SELECT * FROM users WHERE id = $1","params":[42],"plan":"index_scan"}',
      '{"query":"BEGIN","isolation":"read_committed"}',
    ],
    INFO: [
      '{"query":"SELECT * FROM users WHERE id = $1","duration_ms":3,"rows":1}',
      '{"query":"UPDATE orders SET status = $1 WHERE id = $2","duration_ms":8,"rows":1}',
      '{"query":"INSERT INTO audit_log VALUES (...)","duration_ms":5}',
    ],
    WARN: [
      '{"query":"SELECT * FROM products WHERE name LIKE $1","duration_ms":890,"warning":"seq_scan"}',
      '{"pool":"active":18,"max":20,"warning":"near_capacity"}',
    ],
    ERROR: [
      '{"query":"INSERT INTO users (email) VALUES ($1)","error":"unique_violation","detail":"duplicate key"}',
      '{"pool":"active":20,"max":20,"error":"connection_pool_exhausted"}',
    ],
  },
}

const unstructuredMessages: Record<Service, Record<LogLevel, string[]>> = {
  API: {
    DEBUG: ['Handling GET /api/users', 'POST /api/orders body parsed'],
    INFO: ['GET /api/users 200 OK 42ms', 'POST /api/orders 201 Created 128ms', 'GET /api/products 200 OK 35ms'],
    WARN: ['GET /api/search took 2300ms - slow query detected', 'Upload payload is 12MB - consider chunking'],
    ERROR: ['POST /api/payments failed: gateway timeout after 30s', 'GET /api/users/999 - user not found'],
  },
  Auth: {
    DEBUG: ['Validating JWT token for user-42', 'Checking token refresh eligibility'],
    INFO: ['User usr_4821 logged in via password from 10.0.1.55', 'Token refreshed for usr_4821, TTL: 3600s', 'User usr_3309 logged out, session revoked'],
    WARN: ['Login rate limited for usr_9999 after 5 attempts', 'Token expiring in 2 minutes for active session'],
    ERROR: ['Login failed for usr_4821: invalid password (attempt 3)', 'Token validation failed: token expired'],
  },
  Database: {
    DEBUG: ['Executing: SELECT * FROM users WHERE id = 42', 'Transaction started (read_committed)'],
    INFO: ['Query completed in 3ms, 1 row returned', 'UPDATE orders completed in 8ms', 'Audit log entry inserted in 5ms'],
    WARN: ['Sequential scan on products table took 890ms', 'Connection pool near capacity: 18/20 active'],
    ERROR: ['Duplicate key violation on users.email', 'Connection pool exhausted: 20/20 active'],
  },
}

const corrIds = ['req-a1b2c3', 'req-d4e5f6', 'req-g7h8i9', 'req-j0k1l2', 'req-m3n4o5']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateLog(id: number, structured: boolean): LogEntry {
  const services: Service[] = ['API', 'Auth', 'Database']
  const weights: Record<Service, number> = { API: 5, Auth: 3, Database: 2 }
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  let service: Service = 'API'
  for (const [svc, w] of Object.entries(weights)) {
    r -= w
    if (r <= 0) { service = svc as Service; break }
  }

  const levelRoll = Math.random()
  let level: LogLevel = 'INFO'
  if (levelRoll < 0.15) level = 'ERROR'
  else if (levelRoll < 0.3) level = 'WARN'
  else if (levelRoll < 0.5) level = 'DEBUG'

  const cid = pick(corrIds)
  const msgs = structured ? structuredMessages[service][level] : unstructuredMessages[service][level]
  let message = pick(msgs)
  message = message.replace(/REQ/g, cid)

  const now = new Date()
  const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`

  return { id, timestamp: ts, service, level, correlationId: cid, message, structured }
}

export default function LogAggregationDemo() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)
  const [structured, setStructured] = useState(true)
  const [filterService, setFilterService] = useState<Service | 'ALL'>('ALL')
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'ALL'>('ALL')
  const [searchText, setSearchText] = useState('')
  const [selectedCorrId, setSelectedCorrId] = useState<string | null>(null)
  const nextId = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      nextId.current++
      setLogs(prev => {
        const next = [...prev, generateLog(nextId.current, structured)]
        return next.slice(-80)
      })
    }, 700)
    return () => clearInterval(t)
  }, [running, structured])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  const filtered = logs.filter(log => {
    if (filterService !== 'ALL' && log.service !== filterService) return false
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false
    if (searchText && !log.message.toLowerCase().includes(searchText.toLowerCase()) && !log.correlationId.includes(searchText)) return false
    return true
  })

  const selectedLogs = selectedCorrId ? filtered.filter(l => l.correlationId === selectedCorrId) : null

  const levelCounts = { DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0 }
  logs.forEach(l => levelCounts[l.level]++)

  return (
    <DemoBoundary name="Log Aggregation">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Log Aggregation</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Logs stream from multiple services. Filter, search, and click a correlation ID to trace a request across services.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setRunning(!running)} style={{
            background: running ? s.orange : s.green, border: 'none', borderRadius: 8, padding: '6px 16px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>{running ? 'Pause' : 'Start Streaming'}</button>
          <button onClick={() => { setLogs([]); setSelectedCorrId(null); nextId.current = 0 }} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '6px 16px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Clear</button>
          <button onClick={() => setStructured(!structured)} style={{
            background: structured ? s.accent + '20' : s.bg3, border: `1px solid ${structured ? s.accent : s.border}`,
            borderRadius: 8, padding: '6px 16px', color: structured ? s.accent : s.text2, cursor: 'pointer', fontSize: 13,
          }}>{structured ? 'Structured' : 'Unstructured'}</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {(['ALL', 'API', 'Auth', 'Database'] as const).map(sv => (
            <button key={sv} onClick={() => setFilterService(sv)} style={{
              background: filterService === sv ? (sv === 'ALL' ? s.bg3 : serviceColors[sv as Service] + '20') : 'transparent',
              border: `1px solid ${filterService === sv ? (sv === 'ALL' ? s.border2 : serviceColors[sv as Service]) : 'transparent'}`,
              borderRadius: 6, padding: '4px 10px', color: filterService === sv ? s.text : s.text3,
              cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
            }}>{sv}</button>
          ))}
          <div style={{ width: 1, background: s.border, margin: '0 4px' }} />
          {(['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'] as const).map(lv => (
            <button key={lv} onClick={() => setFilterLevel(lv)} style={{
              background: filterLevel === lv ? (lv === 'ALL' ? s.bg3 : levelColors[lv as LogLevel] + '20') : 'transparent',
              border: `1px solid ${filterLevel === lv ? (lv === 'ALL' ? s.border2 : levelColors[lv as LogLevel]) : 'transparent'}`,
              borderRadius: 6, padding: '4px 10px', color: filterLevel === lv ? s.text : s.text3,
              cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
            }}>{lv}{lv !== 'ALL' && ` (${levelCounts[lv as LogLevel]})`}</button>
          ))}
        </div>

        <input
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="Search logs..."
          style={{
            width: '100%', background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: '8px 12px', color: s.text, fontFamily: s.mono, fontSize: 12, marginBottom: 12,
            outline: 'none', boxSizing: 'border-box',
          }}
        />

        {selectedCorrId && (
          <div style={{ background: s.accent + '10', border: `1px solid ${s.accent}40`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: s.accent, fontSize: 12, fontWeight: 600 }}>Tracing:</span>
            <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 12 }}>{selectedCorrId}</span>
            <span style={{ color: s.text3, fontSize: 12 }}>{selectedLogs?.length || 0} logs</span>
            <button onClick={() => setSelectedCorrId(null)} style={{
              marginLeft: 'auto', background: 'transparent', border: 'none', color: s.text3, cursor: 'pointer', fontSize: 12,
            }}>Clear trace</button>
          </div>
        )}

        <div ref={containerRef} style={{ background: s.bg, borderRadius: 8, padding: 12, maxHeight: 360, overflowY: 'auto', border: `1px solid ${s.border}` }}>
          {filtered.length === 0 && (
            <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: 30 }}>
              {logs.length === 0 ? 'Press Start Streaming to generate logs' : 'No logs match filters'}
            </div>
          )}
          {filtered.map(log => {
            const isHighlighted = selectedCorrId && log.correlationId === selectedCorrId
            return (
              <div
                key={log.id}
                onClick={() => setSelectedCorrId(selectedCorrId === log.correlationId ? null : log.correlationId)}
                style={{
                  display: 'flex', gap: 8, padding: '5px 8px', marginBottom: 2, borderRadius: 4,
                  cursor: 'pointer', transition: 'background 0.15s',
                  background: isHighlighted ? s.accent + '15' : 'transparent',
                  border: isHighlighted ? `1px solid ${s.accent}30` : '1px solid transparent',
                  fontFamily: s.mono, fontSize: 11, lineHeight: 1.5,
                }}
              >
                <span style={{ color: s.text3, whiteSpace: 'nowrap' }}>{log.timestamp}</span>
                <span style={{ color: serviceColors[log.service], fontWeight: 600, minWidth: 50, whiteSpace: 'nowrap' }}>{log.service}</span>
                <span style={{ color: levelColors[log.level], fontWeight: 700, minWidth: 42, whiteSpace: 'nowrap' }}>[{log.level}]</span>
                <span
                  onClick={e => { e.stopPropagation(); setSelectedCorrId(selectedCorrId === log.correlationId ? null : log.correlationId) }}
                  style={{
                    color: isHighlighted ? s.accent : s.purple, cursor: 'pointer', textDecoration: isHighlighted ? 'none' : 'underline dotted',
                    textDecorationColor: isHighlighted ? 'transparent' : s.purple + '60', minWidth: 90, whiteSpace: 'nowrap',
                  }}
                >{log.correlationId}</span>
                <span style={{ color: isHighlighted ? s.text : s.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.message}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
