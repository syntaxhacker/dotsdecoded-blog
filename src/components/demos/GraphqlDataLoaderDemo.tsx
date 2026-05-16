import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const users = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Charlie' },
  { id: '4', name: 'Diana' },
  { id: '5', name: 'Eve' },
]

const postsByUser: Record<string, string[]> = {
  '1': ['Post A', 'Post B'],
  '2': ['Post C'],
  '3': ['Post D', 'Post E', 'Post F'],
  '4': ['Post G'],
  '5': ['Post H', 'Post I'],
}

interface QueryLog {
  type: 'users' | 'posts' | 'batched'
  users?: string[]
  delay: number
  color: string
}

function buildLogs(useDataLoader: boolean): QueryLog[] {
  const logs: QueryLog[] = []
  logs.push({ type: 'users', delay: 50, color: s.accent })
  if (useDataLoader) {
    const allUserIds = users.map((u) => u.id)
    logs.push({
      type: 'batched',
      users: allUserIds,
      delay: 80,
      color: s.green,
    })
  } else {
    for (const user of users) {
      logs.push({
        type: 'posts',
        users: [user.id],
        delay: 40,
        color: s.red,
      })
    }
  }
  return logs
}

export default function GraphqlDataLoaderDemo() {
  const [useDL, setUseDL] = useState(false)
  const [visible, setVisible] = useState<number>(0)
  const [running, setRunning] = useState(false)

  const logs = buildLogs(useDL)
  const totalQueries = logs.length
  const totalMs = logs.reduce((acc, l) => acc + l.delay, 0)
  const msPerQuery = useDL ? 130 : 250

  const run = () => {
    setRunning(true)
    setVisible(0)
    let i = 0
    const iv = setInterval(() => {
      i++
      setVisible(i)
      if (i >= totalQueries) {
        clearInterval(iv)
        setRunning(false)
      }
    }, logs[i]?.delay || 50)
  }

  const reset = () => {
    setRunning(false)
    setVisible(0)
  }

  return (
    <DemoBoundary name="DataLoader N+1 Problem">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <div style={{
            width: 40, height: 22, borderRadius: 11, background: useDL ? s.green : s.bg3,
            position: 'relative', transition: 'background 0.3s',
          }}
            onClick={() => { if (!running) { setUseDL(!useDL); reset() } }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 2, left: useDL ? 20 : 2,
              transition: 'left 0.3s',
            }} />
          </div>
          <span style={{ color: s.text2, fontSize: 13 }}>Use DataLoader</span>
        </label>
        <button onClick={run} disabled={running} style={{
          background: running ? s.bg3 : s.accent, border: 'none', borderRadius: 8,
          padding: '8px 20px', color: running ? s.text3 : '#fff',
          cursor: running ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
        }}>{running ? 'Running...' : 'Run Query'}</button>
        <button onClick={reset} style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: '8px 16px', color: s.text2, cursor: 'pointer', fontSize: 13,
        }}>Reset</button>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ background: s.bg2, borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Query Plan
            </div>
            <div style={{ fontFamily: s.mono, fontSize: 12, marginBottom: 12, color: s.text, lineHeight: 1.8 }}>
              <div style={{ color: s.text2 }}>query {`{`}</div>
              <div style={{ paddingLeft: 16, color: s.accent }}>users {`{`}</div>
              <div style={{ paddingLeft: 32, color: s.text2 }}>name</div>
              {useDL ? (
                <div style={{ paddingLeft: 32, color: s.green }}>posts (batched!) {`{`}</div>
              ) : (
                <div style={{ paddingLeft: 32, color: s.red }}>posts (N+1!) {`{`}</div>
              )}
              <div style={{ paddingLeft: 48, color: s.text2 }}>title</div>
              <div style={{ paddingLeft: 32 }}>{`}`}</div>
              <div style={{ paddingLeft: 16 }}>{`}`}</div>
              <div>{`}`}</div>
            </div>
          </div>

          <div style={{ background: s.bg2, borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Total: {totalQueries} queries (est. {totalMs}ms)
            </div>
            {logs.slice(0, visible).map((log, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 0', borderBottom: i < Math.min(visible, totalQueries) - 1 ? `1px solid ${s.border}` : 'none',
                animation: 'fadeSlideIn 0.25s ease',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: log.color, flexShrink: 0,
                }} />
                <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 11, minWidth: 60 }}>
                  Query {i + 1}
                </span>
                <span style={{ color: log.color, fontSize: 12 }}>
                  {log.type === 'users'
                    ? 'SELECT * FROM users'
                    : log.type === 'batched'
                      ? `SELECT * FROM posts WHERE author_id IN (${log.users?.map(() => '?').join(', ')})`
                      : `SELECT * FROM posts WHERE author_id = ?`}
                </span>
              </div>
            ))}
            <style>{`
              @keyframes fadeSlideIn {
                from { opacity: 0; transform: translateY(-6px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </div>
        </div>

        <div style={{ width: 240 }}>
          <div style={{ background: s.bg2, borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Data
            </div>
            <div style={{ fontFamily: s.mono, fontSize: 12, lineHeight: 1.7 }}>
              <div style={{ color: s.text2, marginBottom: 4 }}>Users:</div>
              {users.map((u) => (
                <div key={u.id} style={{ paddingLeft: 8, color: s.text }}>{u.name}</div>
              ))}
              <div style={{ color: s.text2, marginTop: 8, marginBottom: 4 }}>Posts:</div>
              {Object.entries(postsByUser).map(([userId, posts]) => (
                <div key={userId} style={{ paddingLeft: 8 }}>
                  <span style={{ color: s.text3 }}>User {userId}: </span>
                  <span style={{ color: s.text }}>{posts.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: s.bg2, borderRadius: 12, padding: '12px 16px', marginTop: 12,
            border: `1px solid ${useDL ? s.green : s.red}`,
          }}>
            <div style={{ color: useDL ? s.green : s.red, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              {useDL ? 'Optimized' : 'N+1 Problem'}
            </div>
            <div style={{ color: s.text3, fontSize: 11 }}>
              {useDL
                ? `1 user query + 1 batched post query = ${totalQueries} queries total`
                : `1 user query + ${users.length} post queries = ${totalQueries} queries total`}
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
