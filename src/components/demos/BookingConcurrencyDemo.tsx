import { useState, useCallback, useRef } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Operation {
  system: string
  cmd: string
  result: 'success' | 'failure' | 'pending'
}

interface LogEntry {
  user: string
  ops: Operation[]
}

function buildOps(user: string, outcome: 'success' | 'failure'): Operation[] {
  if (outcome === 'success') {
    return [
      { system: 'App', cmd: `BEGIN TRANSACTION`, result: 'success' },
      { system: 'PostgreSQL', cmd: `SELECT * FROM seats WHERE id = 42 FOR UPDATE`, result: 'success' },
      { system: 'PostgreSQL', cmd: `UPDATE seats SET status = 'held', held_by = '${user}' WHERE id = 42 AND status = 'available'`, result: 'success' },
      { system: 'PostgreSQL', cmd: `INSERT INTO holds (seat_id, user_id, expires_at) VALUES (42, '${user}', NOW() + INTERVAL '5 min')`, result: 'success' },
      { system: 'Redis', cmd: `SET hold:seat:42 '${user}' EX 300 NX`, result: 'success' },
      { system: 'App', cmd: `COMMIT`, result: 'success' },
    ]
  }
  return [
    { system: 'App', cmd: `BEGIN TRANSACTION`, result: 'success' },
    { system: 'PostgreSQL', cmd: `SELECT * FROM seats WHERE id = 42 FOR UPDATE`, result: 'success' },
    { system: 'PostgreSQL', cmd: `UPDATE seats SET status = 'held', held_by = '${user}' WHERE id = 42 AND status = 'available'`, result: 'failure' },
    { system: 'PostgreSQL', cmd: `SELECT status, held_by FROM seats WHERE id = 42`, result: 'success' },
    { system: 'Redis', cmd: `GET hold:seat:42`, result: 'success' },
    { system: 'App', cmd: `ROLLBACK -- seat already held by user_a`, result: 'success' },
  ]
}

export default function BookingConcurrencyDemo() {
  const [seatState, setSeatState] = useState<'available' | 'held' | 'sold'>('available')
  const [winner, setWinner] = useState<string | null>(null)
  const [logs, setLogs] = useState<{ userA: LogEntry[]; userB: LogEntry[] }>({ userA: [], userB: [] })
  const [animating, setAnimating] = useState(false)
  const [expanded, setExpanded] = useState<'userA' | 'userB' | null>(null)
  const animRef = useRef(false)

  const reset = () => {
    setSeatState('available')
    setWinner(null)
    setLogs({ userA: [], userB: [] })
    setAnimating(false)
    setExpanded(null)
    animRef.current = false
  }

  const tryBook = useCallback((user: 'userA' | 'userB') => {
    if (animRef.current || seatState !== 'available') return
    animRef.current = true
    setAnimating(true)
    const outcome = user === 'userA' ? 'success' : 'failure'
    const ops = buildOps(user, outcome)
    const entry: LogEntry = { user, ops: [] }

    setLogs(prev => ({
      ...prev,
      [user]: [...prev[user], entry],
    }))

    const runOps = async () => {
      for (const op of ops) {
        await new Promise(r => setTimeout(r, 400))
        setLogs(prev => {
          const arr = [...prev[user]]
          const last = { ...arr[arr.length - 1] }
          last.ops = [...last.ops, op]
          arr[arr.length - 1] = last
          return { ...prev, [user]: arr }
        })
        if (op.result === 'failure') break
      }
      if (user === 'userA') {
        setSeatState('sold')
        setWinner('userA')
      } else {
        setSeatState('available')
        setWinner('userB')
      }
      setAnimating(false)
      animRef.current = false
      setExpanded(user)
    }
    runOps()
  }, [seatState])

  const seatColor = seatState === 'available' ? s.green : seatState === 'held' ? s.yellow : s.red

  return (
    <DemoBoundary name="Booking Concurrency">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
          Booking Concurrency
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 12,
              background: seatColor, opacity: 0.2,
              border: `2px solid ${seatColor}`,
              margin: '0 auto 8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: seatColor,
                transition: 'all 0.3s',
              }} />
            </div>
            <div style={{ color: s.text2, fontFamily: s.mono, fontSize: 13 }}>Seat 42</div>
            <div style={{
              color: seatColor, fontFamily: s.mono, fontSize: 11, marginTop: 4,
              textTransform: 'uppercase', letterSpacing: 1,
            }}>
              {seatState}
            </div>
            {winner && (
              <div style={{
                color: winner === 'userA' ? s.green : s.red,
                fontFamily: s.mono, fontSize: 11, marginTop: 8,
              }}>
                {winner === 'userA' ? 'User A booked successfully' : 'User B: seat taken'}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {(['userA', 'userB'] as const).map(user => {
            const label = user === 'userA' ? 'User A' : 'User B'
            return (
              <div key={user} style={{
                background: s.bg,
                border: `1px solid ${winner === user ? (user === 'userA' ? s.green : s.red) : s.border}`,
                borderRadius: 10, padding: 16,
                transition: 'border-color 0.3s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>{label}</div>
                  {winner === user && (
                    <div style={{
                      fontSize: 10, fontFamily: s.mono, padding: '2px 8px', borderRadius: 4,
                      background: user === 'userA' ? s.green : s.red,
                      color: '#000',
                    }}>
                      {user === 'userA' ? 'SUCCESS' : 'FAILED'}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => tryBook(user)}
                  disabled={animating || seatState !== 'available'}
                  style={{
                    width: '100%',
                    background: animating ? s.bg3 : s.accent,
                    border: 'none', borderRadius: 8, padding: '10px 0',
                    color: animating ? s.text3 : '#fff',
                    cursor: animating || seatState !== 'available' ? 'default' : 'pointer',
                    fontSize: 13, fontWeight: 600,
                    opacity: seatState !== 'available' && !winner ? 0.4 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {animating ? 'Booking...' : seatState !== 'available' && !winner ? 'Try Again' : 'Book Seat'}
                </button>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setExpanded(expanded === 'userA' ? null : 'userA')} style={{
            background: expanded === 'userA' ? s.bg3 : 'transparent',
            border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 14px',
            color: expanded === 'userA' ? s.text : s.text3, cursor: 'pointer', fontSize: 12,
          }}>
            User A Log {logs.userA.length > 0 ? `(${logs.userA.length})` : ''}
          </button>
          <button onClick={() => setExpanded(expanded === 'userB' ? null : 'userB')} style={{
            background: expanded === 'userB' ? s.bg3 : 'transparent',
            border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 14px',
            color: expanded === 'userB' ? s.text : s.text3, cursor: 'pointer', fontSize: 12,
          }}>
            User B Log {logs.userB.length > 0 ? `(${logs.userB.length})` : ''}
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={reset} style={{
            background: 'transparent', border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 14px',
            color: s.text3, cursor: 'pointer', fontSize: 12,
          }}>Reset</button>
        </div>

        {expanded && (
          <div style={{
            background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
            padding: 12, maxHeight: 260, overflowY: 'auto',
          }}>
            {logs[expanded].length === 0 ? (
              <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: 16 }}>
                No operations logged yet. Click "Book Seat" to start.
              </div>
            ) : (
              logs[expanded].map((entry, ei) => (
                <div key={ei}>
                  {entry.ops.map((op, oi) => (
                    <div key={oi} style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
                      padding: '4px 8px', borderRadius: 4,
                      background: op.result === 'failure' ? `${s.red}11` : 'transparent',
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: op.result === 'success' ? s.green : op.result === 'failure' ? s.red : s.yellow,
                      }} />
                      <div style={{
                        color: s.text3, fontSize: 9, fontFamily: s.mono,
                        background: s.bg2, padding: '1px 5px', borderRadius: 3, flexShrink: 0,
                      }}>{op.system}</div>
                      <div style={{ color: s.text2, fontFamily: s.mono, fontSize: 11, whiteSpace: 'nowrap' }}>
                        {op.cmd}
                      </div>
                      {op.result !== 'pending' && (
                        <div style={{
                          marginLeft: 'auto', fontSize: 10, fontFamily: s.mono, flexShrink: 0,
                          color: op.result === 'success' ? s.green : s.red,
                        }}>
                          {op.result === 'success' ? 'OK' : 'FAIL'}
                        </div>
                      )}
                    </div>
                  ))}
                  {ei < logs[expanded].length - 1 && (
                    <div style={{ borderTop: `1px solid ${s.bg3}`, margin: '8px 0' }} />
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
