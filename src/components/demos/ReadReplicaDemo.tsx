import { useState, useCallback, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type NodeType = 'master' | 'replica'
type NodeState = {
  role: NodeType
  label: string
  connections: number
  active: boolean
  replicating: boolean
  promoted: boolean
}

function ReadReplicaDemoInner() {
  const [nodes, setNodes] = useState<NodeState[]>([
    { role: 'master', label: 'Master', connections: 0, active: false, replicating: false, promoted: false },
    { role: 'replica', label: 'Replica 1', connections: 0, active: false, replicating: false, promoted: false },
    { role: 'replica', label: 'Replica 2', connections: 0, active: false, replicating: false, promoted: false },
    { role: 'replica', label: 'Replica 3', connections: 0, active: false, replicating: false, promoted: false },
  ])
  const [masterDown, setMasterDown] = useState(false)
  const [failoverInProgress, setFailoverInProgress] = useState(false)
  const [totalWrites, setTotalWrites] = useState(0)
  const [totalReads, setTotalReads] = useState(0)
  const [log, setLog] = useState<string[]>([])

  const addLog = useCallback((msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 10))
  }, [])

  const handleWrite = useCallback(() => {
    if (masterDown || failoverInProgress) {
      addLog('Write FAILED: master is down')
      return
    }
    setTotalWrites(w => w + 1)
    setNodes(prev => {
      const next = [...prev]
      next[0] = { ...next[0], connections: next[0].connections + 1, active: true }
      next.slice(1).forEach((nd, i) => {
        next[i + 1] = { ...nd, replicating: true }
      })
      return next
    })
    addLog('Write sent to Master -> replicating to all replicas')
    setTimeout(() => {
      setNodes(prev => prev.map((nd, i) => i === 0 ? { ...nd, active: false } : { ...nd, replicating: false, connections: nd.connections + 1 }))
    }, 800)
  }, [masterDown, failoverInProgress, addLog])

  const handleRead = useCallback(() => {
    if (failoverInProgress) return
    setTotalReads(r => r + 1)
    const replicaIdx = 1 + Math.floor(Math.random() * 3)
    setNodes(prev => {
      const next = [...prev]
      next[replicaIdx] = { ...next[replicaIdx], connections: next[replicaIdx].connections + 1, active: true }
      return next
    })
    addLog(`Read sent to ${nodes[replicaIdx].label}`)
    setTimeout(() => {
      setNodes(prev => {
        const next = [...prev]
        next[replicaIdx] = { ...next[replicaIdx], active: false }
        return next
      })
    }, 500)
  }, [failoverInProgress, nodes, addLog])

  const handlePromote = useCallback(() => {
    if (failoverInProgress) return
    if (!masterDown) {
      setMasterDown(true)
      setFailoverInProgress(true)
      addLog('Master FAILED! Starting failover...')
      setTimeout(() => {
        setNodes(prev => {
          const next = [...prev]
          next[1] = { ...next[1], role: 'master', label: 'Master (promoted)', promoted: true, connections: 0 }
          return next
        })
        addLog('Replica 1 promoted to Master')
        setFailoverInProgress(false)
      }, 2000)
    } else {
      setMasterDown(false)
      setFailoverInProgress(true)
      addLog('Restoring original master...')
      setTimeout(() => {
        setNodes(prev => {
          const next = [...prev]
          next[0] = { role: 'master', label: 'Master', connections: 0, active: false, replicating: false, promoted: false }
          next[1] = { role: 'replica', label: 'Replica 1', connections: 0, active: false, replicating: false, promoted: false }
          return next
        })
        addLog('Original master restored')
        setFailoverInProgress(false)
      }, 1500)
    }
  }, [masterDown, failoverInProgress, addLog])

  const masterConns = nodes[0].connections
  const replicaConns = nodes.slice(1).reduce((sum, nd) => sum + nd.connections, 0)
  const readDist = totalReads > 0 ? Math.round(replicaConns / (masterConns + replicaConns) * 100) : 0

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button
          onClick={handleWrite}
          disabled={masterDown || failoverInProgress}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 6,
            border: `1px solid ${masterDown ? s.border : s.accent}`,
            background: masterDown ? s.bg3 : `${s.accent}20`,
            color: masterDown ? s.text3 : s.accent,
            fontFamily: s.mono,
            fontSize: 13,
            fontWeight: 600,
            cursor: masterDown || failoverInProgress ? 'not-allowed' : 'pointer',
          }}
        >
          Write
        </button>
        <button
          onClick={handleRead}
          disabled={failoverInProgress}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 6,
            border: `1px solid ${s.purple}`,
            background: `${s.purple}20`,
            color: s.purple,
            fontFamily: s.mono,
            fontSize: 13,
            fontWeight: 600,
            cursor: failoverInProgress ? 'not-allowed' : 'pointer',
          }}
        >
          Read
        </button>
        <button
          onClick={handlePromote}
          disabled={failoverInProgress}
          style={{
            padding: '10px 16px',
            borderRadius: 6,
            border: `1px solid ${masterDown ? s.green : s.red}`,
            background: masterDown ? `${s.green}20` : `${s.red}20`,
            color: masterDown ? s.green : s.red,
            fontFamily: s.mono,
            fontSize: 12,
            cursor: failoverInProgress ? 'not-allowed' : 'pointer',
          }}
        >
          {masterDown ? 'Restore' : 'Failover'}
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
      }}>
        <div style={{
          width: 160,
          padding: '14px 12px',
          borderRadius: 8,
          background: masterDown ? `${s.red}15` : `${s.accent}15`,
          border: `2px solid ${masterDown ? s.red : nodes[0].active ? s.green : s.accent}`,
          textAlign: 'center',
          transition: 'all 0.3s ease',
          position: 'relative',
        }}>
          {masterDown && !failoverInProgress && (
            <div style={{
              position: 'absolute',
              top: -10,
              right: -10,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: s.red,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: s.bg,
            }}>
              X
            </div>
          )}
          <div style={{ fontFamily: s.mono, fontSize: 10, color: masterDown ? s.red : s.accent, fontWeight: 700, marginBottom: 4 }}>
            {nodes[0].label.toUpperCase()}
          </div>
          <div style={{ fontFamily: s.mono, fontSize: 9, color: s.text3 }}>
            Read / Write
          </div>
          <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, marginTop: 4 }}>
            {masterConns} connections
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              height: 24,
              width: 1,
              background: nodes[i + 1].replicating ? s.green : s.border,
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {nodes.slice(1).map((nd, i) => (
            <div key={i} style={{
              width: 130,
              padding: '12px 8px',
              borderRadius: 8,
              background: nd.promoted ? `${s.green}15` : `${s.purple}10`,
              border: `2px solid ${nd.active ? s.purple : nd.promoted ? s.green : s.border}`,
              textAlign: 'center',
              transition: 'all 0.3s ease',
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 9, color: nd.promoted ? s.green : s.purple, fontWeight: 700, marginBottom: 4 }}>
                {nd.label.toUpperCase()}
              </div>
              <div style={{ fontFamily: s.mono, fontSize: 9, color: s.text3 }}>
                {nd.promoted ? 'Read / Write' : 'Read Only'}
              </div>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, marginTop: 4 }}>
                {nd.connections} connections
              </div>
            </div>
          ))}
        </div>
      </div>

      {failoverInProgress && (
        <div style={{
          background: `${s.yellow}15`,
          border: `1px solid ${s.yellow}40`,
          borderRadius: 6,
          padding: '10px 14px',
          marginBottom: 14,
          fontSize: 12,
          color: s.yellow,
          fontFamily: s.mono,
          textAlign: 'center',
        }}>
          {masterDown ? 'Promoting Replica 1 to Master...' : 'Restoring original Master...'}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
        <div style={{ background: s.bg2, borderRadius: 6, padding: '8px 10px', border: `1px solid ${s.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>Writes</div>
          <div style={{ fontFamily: s.mono, fontSize: 16, color: s.accent, fontWeight: 700 }}>{totalWrites}</div>
        </div>
        <div style={{ background: s.bg2, borderRadius: 6, padding: '8px 10px', border: `1px solid ${s.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>Reads</div>
          <div style={{ fontFamily: s.mono, fontSize: 16, color: s.purple, fontWeight: 700 }}>{totalReads}</div>
        </div>
        <div style={{ background: s.bg2, borderRadius: 6, padding: '8px 10px', border: `1px solid ${s.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>Master Load</div>
          <div style={{ fontFamily: s.mono, fontSize: 16, color: s.accent, fontWeight: 700 }}>{masterConns}</div>
        </div>
        <div style={{ background: s.bg2, borderRadius: 6, padding: '8px 10px', border: `1px solid ${s.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>Replica Load</div>
          <div style={{ fontFamily: s.mono, fontSize: 16, color: s.purple, fontWeight: 700 }}>{replicaConns}</div>
        </div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 8, padding: 12, border: `1px solid ${s.border}`, maxHeight: 150, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 6 }}>Event Log</div>
        {log.length === 0 ? (
          <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>Send reads and writes to see load distribution</div>
        ) : (
          log.map((entry, i) => (
            <div key={i} style={{
              fontSize: 11,
              fontFamily: s.mono,
              color: i === 0 ? s.text : s.text3,
              padding: '2px 0',
              borderBottom: i < log.length - 1 ? `1px solid ${s.bg3}` : 'none',
            }}>
              {entry}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function ReadReplicaDemo() {
  return (
    <DemoBoundary name="Read Replica Architecture">
      <ReadReplicaDemoInner />
    </DemoBoundary>
  )
}
