import { useState, useEffect, useCallback, useRef } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Connection {
  id: number
  status: 'idle' | 'busy' | 'waiting'
  threadId: number | null
  requestId: number | null
}

interface Request {
  id: number
  status: 'waiting' | 'active' | 'completed' | 'timeout'
  connectionId: number | null
  waitTime: number
}

let reqIdCounter = 0

export default function ConnectionPoolDemo() {
  const [poolSize, setPoolSize] = useState(5)
  const [connections, setConnections] = useState<Connection[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [logs, setLogs] = useState<{ text: string; color: string }[]>([])
  const [speed, setSpeed] = useState(1)
  const [autoGenerate, setAutoGenerate] = useState(false)
  const [stats, setStats] = useState({ total: 0, completed: 0, timeouts: 0, avgWait: 0 })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const processRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const addLog = useCallback((text: string, color: string) => {
    setLogs(prev => [...prev.slice(-40), { text, color }])
  }, [])

  const initConnections = useCallback((size: number) => {
    const conns: Connection[] = []
    for (let i = 0; i < size; i++) {
      conns.push({ id: i + 1, status: 'idle', threadId: null, requestId: null })
    }
    setConnections(conns)
  }, [])

  useEffect(() => {
    initConnections(poolSize)
  }, [poolSize, initConnections])

  const assignConnections = useCallback(() => {
    setConnections(prev => {
      const updated = [...prev]
      setRequests(prevReqs => {
        const waitingReqs = prevReqs.filter(r => r.status === 'waiting')
        let updatedReqs = [...prevReqs]
        let connChanged = false

        for (const req of waitingReqs) {
          const freeConnIdx = updated.findIndex(c => c.status === 'idle')
          if (freeConnIdx !== -1) {
            updated[freeConnIdx] = {
              ...updated[freeConnIdx],
              status: 'busy',
              threadId: req.id,
              requestId: req.id,
            }
            updatedReqs = updatedReqs.map(r =>
              r.id === req.id ? { ...r, status: 'active' as const, connectionId: updated[freeConnIdx].id } : r
            )
            connChanged = true
          }
        }

        return connChanged ? updatedReqs : prevReqs
      })
      return updated
    })
  }, [])

  const addRequest = useCallback(() => {
    reqIdCounter++
    const idleCount = connections.filter(c => c.status === 'idle').length
    const hasIdle = idleCount > 0

    setRequests(prev => [...prev, {
      id: reqIdCounter,
      status: hasIdle ? 'active' : 'waiting',
      connectionId: hasIdle ? null : null,
      waitTime: 0,
    }])
    setStats(prev => ({ ...prev, total: prev.total + 1 }))

    if (hasIdle) {
      addLog(`Request #${reqIdCounter} assigned to idle connection`, s.green)
    } else {
      addLog(`Request #${reqIdCounter} waiting — all ${poolSize} connections busy`, s.yellow)
    }

    assignConnections()
  }, [connections, poolSize, addLog, assignConnections])

  useEffect(() => {
    assignConnections()
  }, [connections.length, assignConnections])

  useEffect(() => {
    if (autoGenerate) {
      intervalRef.current = setInterval(() => {
        addRequest()
      }, getStepDelay(400, speed))
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoGenerate, speed, addRequest])

  useEffect(() => {
    processRef.current = setInterval(() => {
      setConnections(prev => {
        const updated = prev.map(c => {
          if (c.status === 'busy') {
            if (Math.random() < 0.08) {
              setRequests(prevReqs => {
                const req = prevReqs.find(r => r.connectionId === c.id)
                if (req) {
                  setStats(prev => ({
                    ...prev,
                    completed: prev.completed + 1,
                    avgWait: Math.round((prev.avgWait * (prev.completed) + req.waitTime) / (prev.completed + 1)),
                  }))
                  addLog(`Request #${req.id} completed on connection ${c.id}`, s.green)
                }
                return prevReqs.map(r => r.connectionId === c.id
                  ? { ...r, status: 'completed' as const, connectionId: null }
                  : r
                ).filter(r => r.status !== 'completed' || Math.random() > 0.5)
              })
              return { ...c, status: 'idle' as const, threadId: null, requestId: null }
            }
          }
          return c
        })

        const hasIdle = updated.some(c => c.status === 'idle')
        if (hasIdle) {
          setTimeout(() => assignConnections(), 0)
        }

        return updated
      })

      setRequests(prev => {
        let changed = false
        const updated = prev.map(r => {
          if (r.status === 'waiting') {
            changed = true
            return { ...r, waitTime: r.waitTime + 100 }
          }
          return r
        })
        return changed ? updated : prev
      })
    }, getStepDelay(100, speed))

    return () => {
      if (processRef.current) clearInterval(processRef.current)
    }
  }, [speed, assignConnections, addLog])

  const activeConns = connections.filter(c => c.status === 'busy').length
  const waitingReqs = requests.filter(r => r.status === 'waiting').length

  return (
    <DemoBoundary name="Connection Pooling">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: 'hidden' }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${s.border}`, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text3 }}>Pool size:</span>
              <input
                type="range"
                min={1}
                max={10}
                value={poolSize}
                onChange={e => setPoolSize(Number(e.target.value))}
                style={{ width: 80 }}
              />
              <span style={{ fontSize: 13, fontFamily: s.mono, color: s.accent, minWidth: 20 }}>{poolSize}</span>
            </div>

            <button
              onClick={addRequest}
              style={{
                padding: '6px 14px', fontSize: 13, fontFamily: s.mono,
                border: `1px solid ${s.accent}`, borderRadius: 6, cursor: 'pointer',
                background: 'rgba(91,141,239,0.15)', color: s.accent, transition: 'all 0.2s',
              }}
            >
              + Request
            </button>

            <button
              onClick={() => setAutoGenerate(!autoGenerate)}
              style={{
                padding: '5px 12px', fontSize: 12, fontFamily: s.mono,
                border: `1px solid ${autoGenerate ? s.orange : s.border}`, borderRadius: 5,
                cursor: 'pointer',
                background: autoGenerate ? 'rgba(232,148,90,0.15)' : 'transparent',
                color: autoGenerate ? s.orange : s.text3, transition: 'all 0.2s',
              }}
            >
              {autoGenerate ? 'Stop Traffic' : 'Simulate Traffic'}
            </button>

            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>

          <div style={{ padding: 16, borderBottom: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 10 }}>CONNECTION POOL</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {connections.map(conn => (
                <div key={conn.id} style={{
                  width: 60, padding: '10px 6px', borderRadius: 8, textAlign: 'center',
                  background: conn.status === 'idle' ? 'rgba(61,214,140,0.08)'
                    : conn.status === 'busy' ? 'rgba(91,141,239,0.12)'
                    : s.bg3,
                  border: `1px solid ${conn.status === 'idle' ? s.green : conn.status === 'busy' ? s.accent : s.border}`,
                  transition: 'all 0.3s',
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', margin: '0 auto 6px',
                    background: conn.status === 'idle' ? s.green : conn.status === 'busy' ? s.accent : s.text3,
                    transition: 'background 0.3s',
                  }} />
                  <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>
                    conn {conn.id}
                  </div>
                  <div style={{
                    fontSize: 10, fontFamily: s.mono, marginTop: 2,
                    color: conn.status === 'idle' ? s.green : conn.status === 'busy' ? s.accent : s.text3,
                  }}>
                    {conn.status}
                  </div>
                  {conn.requestId && (
                    <div style={{ fontSize: 9, fontFamily: s.mono, color: s.text3, marginTop: 2 }}>
                      req #{conn.requestId}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', minHeight: 160 }}>
            <div style={{ flex: 1, padding: 16, borderRight: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>
                WAITING REQUESTS ({waitingReqs})
              </div>
              <div style={{ maxHeight: 130, overflowY: 'auto' }}>
                {waitingReqs === 0 && requests.filter(r => r.status === 'active').length === 0 && (
                  <div style={{ fontSize: 13, color: s.text3, fontStyle: 'italic' }}>No requests</div>
                )}
                {requests.filter(r => r.status === 'waiting').map(req => (
                  <div key={req.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', marginBottom: 3,
                    borderRadius: 4, background: 'rgba(224,176,64,0.08)', border: `1px solid ${s.yellow}`,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.yellow }} />
                    <span style={{ fontSize: 11, fontFamily: s.mono, color: s.yellow, flex: 1 }}>
                      Request #{req.id}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>
                      waiting {(req.waitTime / 1000).toFixed(1)}s
                    </span>
                  </div>
                ))}
                {requests.filter(r => r.status === 'active').map(req => (
                  <div key={req.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', marginBottom: 3,
                    borderRadius: 4, background: 'rgba(91,141,239,0.08)', border: `1px solid ${s.accent}`,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.accent }} />
                    <span style={{ fontSize: 11, fontFamily: s.mono, color: s.accent, flex: 1 }}>
                      Request #{req.id}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>
                      conn {req.connectionId}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ width: 240, padding: 16 }}>
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>LOG</div>
              <div style={{ maxHeight: 130, overflowY: 'auto' }}>
                {logs.slice(-15).map((log, i) => (
                  <div key={i} style={{
                    fontSize: 11, fontFamily: s.mono, color: log.color, padding: '2px 0',
                    opacity: i === logs.length - 1 ? 1 : 0.4,
                  }}>
                    {log.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', gap: 16, padding: '10px 16px',
            borderTop: `1px solid ${s.border}`, fontSize: 12, fontFamily: s.mono, color: s.text3,
          }}>
            <span>Pool: <span style={{ color: s.accent }}>{activeConns}/{poolSize} busy</span></span>
            <span>Waiting: <span style={{ color: waitingReqs > 0 ? s.yellow : s.green }}>{waitingReqs}</span></span>
            <span>Completed: <span style={{ color: s.green }}>{stats.completed}</span></span>
            <span>Avg wait: <span style={{ color: s.text2 }}>{stats.avgWait}ms</span></span>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
