import { useState, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface ServerState {
  id: string
  rangeStart: number
  rangeEnd: number
  current: number
  color: string
  alive: boolean
  failAfterNext: boolean
}

interface LogEntry {
  text: string
  color: string
}

const RANGE_SIZE = 15

export default function DbSequenceDemo() {
  const [globalCounter, setGlobalCounter] = useState(1)
  const [nextFree, setNextFree] = useState(1)
  const [servers, setServers] = useState<ServerState[]>([
    { id: 'A', rangeStart: 1, rangeEnd: 15, current: 1, color: s.accent, alive: true, failAfterNext: false },
    { id: 'B', rangeStart: 16, rangeEnd: 30, current: 16, color: s.green, alive: true, failAfterNext: false },
  ])
  const [logs, setLogs] = useState<LogEntry[]>([
    { text: 'Server A allocated range [1-15]', color: s.accent },
    { text: 'Server B allocated range [16-30]', color: s.green },
  ])
  const [usedIds, setUsedIds] = useState<number[]>([])
  const exhaustedA = servers[0].alive && servers[0].current > servers[0].rangeEnd
  const exhaustedB = servers[1].alive && servers[1].current > servers[1].rangeEnd

  const addLog = useCallback((text: string, color: string) => {
    setLogs(prev => [{ text, color }, ...prev].slice(0, 30))
  }, [])

  const allocateRange = useCallback((serverId: string) => {
    const start = nextFree
    const end = nextFree + RANGE_SIZE - 1
    setNextFree(end + 1)
    setGlobalCounter(end + 1)
    setServers(prev => prev.map(srv => {
      if (srv.id !== serverId) return srv
      return { ...srv, rangeStart: start, rangeEnd: end, current: start, failAfterNext: false }
    }))
    addLog(`Server ${serverId} allocated range [${start}-${end}] from DB`, serverId === 'A' ? s.accent : s.green)
  }, [nextFree, addLog])

  const generateId = useCallback((serverId: string) => {
    setServers(prev => prev.map(srv => {
      if (srv.id !== serverId || !srv.alive) return srv
      if (srv.current > srv.rangeEnd) return srv
      const id = srv.current
      setUsedIds(u => [...u, id])
      addLog(`Server ${serverId} generated ID ${id}`, srv.color)
      const shouldFail = srv.failAfterNext
      return { ...srv, current: srv.current + 1, alive: shouldFail ? false : srv.alive }
    }))
  }, [addLog])

  const toggleAlive = useCallback((serverId: string) => {
    setServers(prev => prev.map(srv => {
      if (srv.id !== serverId) return srv
      if (srv.alive) {
        addLog(`Server ${serverId} CRASHED`, s.red)
        return { ...srv, alive: false }
      } else {
        const start = nextFree
        const end = nextFree + RANGE_SIZE - 1
        setNextFree(end + 1)
        setGlobalCounter(end + 1)
        addLog(`Server ${serverId} restarted, allocated range [${start}-${end}]`, s.green)
        return { ...srv, alive: true, rangeStart: start, rangeEnd: end, current: start, failAfterNext: false }
      }
    }))
  }, [nextFree, addLog])

  const setFailAfter = useCallback((serverId: string) => {
    setServers(prev => prev.map(srv => {
      if (srv.id !== serverId) return srv
      addLog(`Server ${serverId} will crash after next ID`, s.yellow)
      return { ...srv, failAfterNext: true }
    }))
  }, [addLog])

  const reset = () => {
    setGlobalCounter(1)
    setNextFree(1)
    setServers([
      { id: 'A', rangeStart: 1, rangeEnd: 15, current: 1, color: s.accent, alive: true, failAfterNext: false },
      { id: 'B', rangeStart: 16, rangeEnd: 30, current: 16, color: s.green, alive: true, failAfterNext: false },
    ])
    setUsedIds([])
    setLogs([
      { text: 'Server A allocated range [1-15]', color: s.accent },
      { text: 'Server B allocated range [16-30]', color: s.green },
    ])
  }

  const renderServer = (srv: ServerState, idx: number) => {
    const remaining = srv.alive ? Math.max(0, srv.rangeEnd - srv.current + 1) : 0
    const total = srv.rangeEnd - srv.rangeStart + 1
    const pct = total > 0 ? (remaining / total) * 100 : 0
    const isExhausted = srv.alive && srv.current > srv.rangeEnd

    return (
      <div key={srv.id} style={{
        flex: 1, background: s.bg2, borderRadius: 12, border: `1px solid ${srv.alive ? srv.color : s.red}`,
        padding: 16, opacity: srv.alive ? 1 : 0.5, minWidth: 240,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: srv.alive ? s.green : s.red,
            }} />
            <span style={{ color: s.text, fontWeight: 700, fontSize: 14 }}>Server {srv.id}</span>
          </div>
          {!srv.alive && <span style={{ color: s.red, fontSize: 11, fontFamily: s.mono }}>DOWN</span>}
          {srv.failAfterNext && srv.alive && (
            <span style={{ color: s.yellow, fontSize: 11, fontFamily: s.mono }}>CRASH QUEUED</span>
          )}
        </div>

        {srv.alive && (
          <div>
            <div style={{ color: s.text2, fontSize: 12, marginBottom: 4 }}>
              Range: [{srv.rangeStart}-{srv.rangeEnd}]
              <span style={{ color: s.text3, marginLeft: 8 }}>
                Next: {isExhausted ? 'OUT OF RANGE' : srv.current}
              </span>
            </div>
            <div style={{ height: 12, borderRadius: 6, background: s.bg3, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{
                height: '100%', borderRadius: 6,
                background: isExhausted ? s.red : srv.color,
                width: `${pct}%`, transition: 'width 0.3s, background 0.3s',
              }} />
            </div>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 12 }}>
              {isExhausted ? 'Range exhausted. Click "Request Range" to get more.' : `${remaining} of ${total} IDs remaining`}
            </div>
          </div>
        )}

        {!srv.alive && (
          <div style={{ color: s.text3, fontSize: 12, marginBottom: 12, fontStyle: 'italic' }}>
            Server is down. Other servers continue generating IDs uninterrupted.
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => generateId(srv.id)}
            disabled={!srv.alive || isExhausted}
            style={{
              background: srv.alive && !isExhausted ? srv.color : s.bg3,
              border: 'none', borderRadius: 6, padding: '7px 14px',
              color: srv.alive && !isExhausted ? '#fff' : s.text3,
              cursor: srv.alive && !isExhausted ? 'pointer' : 'not-allowed',
              fontSize: 12, fontWeight: 600, flex: 1,
            }}>Generate ID</button>
          {srv.alive && !isExhausted && (
            <button onClick={() => setFailAfter(srv.id)}
              style={{
                background: s.bg3, border: `1px solid ${s.yellow}`, borderRadius: 6, padding: '7px 10px',
                color: s.yellow, cursor: 'pointer', fontSize: 11,
              }}>Crash After</button>
          )}
          {isExhausted && srv.alive && (
            <button onClick={() => allocateRange(srv.id)}
              style={{
                background: s.orange, border: 'none', borderRadius: 6, padding: '7px 14px',
                color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>Request Range</button>
          )}
          {!srv.alive && (
            <button onClick={() => toggleAlive(srv.id)}
              style={{
                background: s.green, border: 'none', borderRadius: 6, padding: '7px 14px',
                color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>Restart</button>
          )}
          {srv.alive && (
            <button onClick={() => toggleAlive(srv.id)}
              style={{
                background: `${s.red}20`, border: `1px solid ${s.red}`, borderRadius: 6, padding: '7px 10px',
                color: s.red, cursor: 'pointer', fontSize: 11,
              }}>Kill</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <DemoBoundary name="DB Sequence Range Batching">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
        Database Sequence with Range Batching
      </div>

      {/* DB */}
      <div style={{
        background: `${s.accent}10`, border: `1px solid ${s.accent}`, borderRadius: 12,
        padding: '14px 20px', marginBottom: 20, textAlign: 'center',
      }}>
        <div style={{ color: s.text, fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Database Sequence</div>
        <div style={{ color: s.accent, fontFamily: s.mono, fontSize: 24, fontWeight: 700 }}>{globalCounter}</div>
        <div style={{ color: s.text3, fontSize: 11, marginTop: 2 }}>Next free ID in DB</div>
      </div>

      {/* Servers */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {servers.map((srv, idx) => renderServer(srv, idx))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={reset} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 20px',
          color: s.text2, cursor: 'pointer', fontSize: 12,
        }}>Reset All</button>
        <div style={{ color: s.text3, fontSize: 11, alignSelf: 'center', marginLeft: 'auto' }}>
          Used IDs: {usedIds.length}
        </div>
      </div>

      {/* Used IDs */}
      <div style={{ background: s.bg2, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Generated IDs ({usedIds.length})
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {usedIds.slice(-30).map(id => (
            <div key={id} style={{
              background: s.bg3, borderRadius: 4, padding: '3px 8px',
              fontFamily: s.mono, fontSize: 11, color: s.text2,
            }}>{id}</div>
          ))}
          {usedIds.length === 0 && (
            <span style={{ color: s.text3, fontSize: 11 }}>No IDs generated yet. Click "Generate ID" on any server.</span>
          )}
        </div>
      </div>

      {/* Logs */}
      <div style={{ background: s.bg2, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Event Log
        </div>
        <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {logs.map((log, i) => (
            <div key={i} style={{ fontFamily: s.mono, fontSize: 11, color: log.color, lineHeight: 1.5 }}>
              {'>'} {log.text}
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
