import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type NodeState = {
  data: string
  version: number
  highlight: 'none' | 'writing' | 'replicating' | 'reading' | 'stale'
}

function ReplicationFlowDemoInner() {
  const [sync, setSync] = useState(true)
  const [master, setMaster] = useState<NodeState>({ data: '-', version: 0, highlight: 'none' })
  const [replicas, setReplicas] = useState<NodeState[]>([
    { data: '-', version: 0, highlight: 'none' },
    { data: '-', version: 0, highlight: 'none' },
    { data: '-', version: 0, highlight: 'none' },
  ])
  const [log, setLog] = useState<string[]>([])
  const [animating, setAnimating] = useState(false)
  const [writeCount, setWriteCount] = useState(0)

  const addLog = useCallback((msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 8))
  }, [])

  const handleWrite = useCallback(() => {
    if (animating) return
    const value = `v${writeCount + 1}`
    const newVersion = master.version + 1
    setWriteCount(c => c + 1)
    setAnimating(true)
    setMaster(prev => ({ ...prev, highlight: 'writing', data: value, version: newVersion }))
    addLog(`Writing "${value}" to Master`)

    if (sync) {
      setReplicas(prev => prev.map(() => ({ ...prev[0], highlight: 'replicating', data: value, version: newVersion })))
      setTimeout(() => {
        setMaster(prev => ({ ...prev, highlight: 'none' }))
        setReplicas(prev => prev.map(r => ({ ...r, highlight: 'none' })))
        setAnimating(false)
        addLog(`Sync: all replicas confirmed "${value}"`)
      }, 1200)
    } else {
      setTimeout(() => {
        setMaster(prev => ({ ...prev, highlight: 'none' }))
        setAnimating(false)
        addLog(`Async: write acknowledged (replication in background)`)
      }, 600)
      replicas.forEach((_, i) => {
        const delay = 400 + i * 600 + Math.random() * 400
        setTimeout(() => {
          setReplicas(prev => {
            const next = [...prev]
            next[i] = { data: value, version: newVersion, highlight: 'replicating' }
            return next
          })
          setTimeout(() => {
            setReplicas(prev => {
              const next = [...prev]
              next[i] = { ...next[i], highlight: 'none' }
              return next
            })
          }, 600)
        }, delay)
      })
    }
  }, [animating, master.version, writeCount, sync, replicas, addLog])

  const handleRead = useCallback((idx: number) => {
    if (animating) return
    const node = idx === -1 ? master : replicas[idx]
    if (node.data === '-') {
      addLog(`Read from ${idx === -1 ? 'Master' : `Replica ${idx + 1}`}: no data yet`)
      return
    }
    const isStale = node.version < master.version
    if (idx === -1) {
      setMaster(prev => ({ ...prev, highlight: 'reading' }))
      setTimeout(() => setMaster(prev => ({ ...prev, highlight: 'none' })), 800)
      addLog(`Read from Master: "${node.data}" (latest)`)
    } else {
      setReplicas(prev => {
        const next = [...prev]
        next[idx] = { ...next[idx], highlight: isStale ? 'stale' : 'reading' }
        return next
      })
      setTimeout(() => {
        setReplicas(prev => {
          const next = [...prev]
          next[idx] = { ...next[idx], highlight: 'none' }
          return next
        })
      }, 800)
      if (isStale) {
        addLog(`Read from Replica ${idx + 1}: "${node.data}" (STALE - master has v${master.version})`)
      } else {
        addLog(`Read from Replica ${idx + 1}: "${node.data}" (up to date)`)
      }
    }
  }, [animating, master, replicas, addLog])

  const highlightColor = (hl: NodeState['highlight']) => {
    switch (hl) {
      case 'writing': return s.accent
      case 'replicating': return s.green
      case 'reading': return s.purple
      case 'stale': return s.yellow
      default: return s.border
    }
  }

  const highlightLabel = (hl: NodeState['highlight']) => {
    switch (hl) {
      case 'writing': return 'WRITING'
      case 'replicating': return 'SYNCING'
      case 'reading': return 'READING'
      case 'stale': return 'STALE READ'
      default: return null
    }
  }

  const nodeBox = (label: string, node: NodeState, isMaster: boolean, idx: number) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div
        onClick={() => handleRead(idx)}
        style={{
          width: 100,
          padding: '12px 8px',
          borderRadius: 8,
          background: s.bg2,
          border: `2px solid ${highlightColor(node.highlight)}`,
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'border-color 0.3s ease, transform 0.15s ease',
          transform: node.highlight !== 'none' ? 'scale(1.04)' : undefined,
        }}
      >
        <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, marginBottom: 4 }}>
          {label}
        </div>
        <div style={{
          fontFamily: s.mono,
          fontSize: 18,
          fontWeight: 700,
          color: node.data === '-' ? s.text3 : s.text,
        }}>
          {node.data}
        </div>
        {node.data !== '-' && (
          <div style={{ fontSize: 9, color: s.text3, fontFamily: s.mono, marginTop: 2 }}>
            ver {node.version}
          </div>
        )}
        {highlightLabel(node.highlight) && (
          <div style={{
            fontSize: 8,
            fontFamily: s.mono,
            color: highlightColor(node.highlight),
            marginTop: 4,
            fontWeight: 700,
          }}>
            {highlightLabel(node.highlight)}
          </div>
        )}
      </div>
      <button
        onClick={() => handleRead(idx)}
        style={{
          fontSize: 10,
          fontFamily: s.mono,
          color: s.text3,
          background: 'none',
          border: `1px solid ${s.border}`,
          borderRadius: 4,
          padding: '3px 10px',
          cursor: 'pointer',
        }}
      >
        Read
      </button>
    </div>
  )

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <button
          onClick={handleWrite}
          disabled={animating}
          style={{
            padding: '10px 20px',
            borderRadius: 6,
            border: `1px solid ${s.accent}`,
            background: `${s.accent}20`,
            color: s.accent,
            fontFamily: s.mono,
            fontSize: 13,
            cursor: animating ? 'wait' : 'pointer',
            fontWeight: 600,
          }}
        >
          Write Data
        </button>
        <div
          onClick={() => setSync(v => !v)}
          style={{
            padding: '10px 16px',
            borderRadius: 6,
            border: `1px solid ${sync ? s.green : s.orange}`,
            background: sync ? `${s.green}15` : `${s.orange}15`,
            color: sync ? s.green : s.orange,
            fontFamily: s.mono,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            userSelect: 'none',
          }}
        >
          <div style={{
            width: 32,
            height: 18,
            borderRadius: 9,
            background: sync ? s.green : s.bg3,
            position: 'relative',
            transition: 'background 0.2s ease',
          }}>
            <div style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: s.text,
              position: 'absolute',
              top: 2,
              left: sync ? 16 : 2,
              transition: 'left 0.2s ease',
            }} />
          </div>
          {sync ? 'Synchronous' : 'Asynchronous'}
        </div>
        {!sync && (
          <div style={{ fontSize: 11, color: s.yellow, display: 'flex', alignItems: 'center', gap: 4, fontFamily: s.mono }}>
            Replicas may lag behind master
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        marginBottom: 14,
      }}>
        {nodeBox('MASTER (R/W)', master, true, -1)}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ height: 20, width: 1, background: master.highlight !== 'none' || replicas[i].highlight !== 'none' ? s.green : s.border, transition: 'background 0.3s ease' }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          {replicas.map((r, i) => nodeBox(`REPLICA ${i + 1} (R)`, r, false, i))}
        </div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 8, padding: 12, border: `1px solid ${s.border}`, maxHeight: 140, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 6 }}>Event Log</div>
        {log.length === 0 ? (
          <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>Click "Write Data" or "Read" to begin</div>
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

export default function ReplicationFlowDemo() {
  return (
    <DemoBoundary name="Replication Flow">
      <ReplicationFlowDemoInner />
    </DemoBoundary>
  )
}
