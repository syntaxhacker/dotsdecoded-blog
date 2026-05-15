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

interface LogEntry {
  text: string
  ts: number
  type: 'write' | 'read' | 'replicate' | 'failover' | 'info'
}

export default function CacheReplicationDemo() {
  const [masterData, setMasterData] = useState('user:42 = { name: "Alice" }')
  const [replica1Data, setReplica1Data] = useState('user:42 = { name: "Alice" }')
  const [replica2Data, setReplica2Data] = useState('user:42 = { name: "Alice" }')
  const [masterAlive, setMasterAlive] = useState(true)
  const [leaderIdx, setLeaderIdx] = useState(0)
  const [replicationLag, setReplicationLag] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([
    { text: 'System initialized. Master node-0 active.', ts: Date.now(), type: 'info' },
  ])
  const [writeCount, setWriteCount] = useState(0)
  const [readCount, setReadCount] = useState(0)

  const addLog = useCallback((text: string, type: LogEntry['type']) => {
    setLogs(prev => [...prev.slice(-19), { text, ts: Date.now(), type }])
  }, [])

  const writeToMaster = useCallback(() => {
    if (!masterAlive && leaderIdx !== 0) {
      addLog('Master is down! Writes are handled by promoted replica.', 'info')
      return
    }
    const newValue = `user:42 = { name: "Alice", visits: ${writeCount + 1} }`
    setMasterData(newValue)
    setWriteCount(prev => prev + 1)
    addLog(`WRITE master node-${leaderIdx}: SET ${newValue}`, 'write')

    const lagMs = replicationLag * 100
    setTimeout(() => {
      setReplica1Data(newValue)
      addLog(`REPLICATE node-0 -> node-1: ${newValue}`, 'replicate')
    }, lagMs + 100)

    setTimeout(() => {
      setReplica2Data(newValue)
      addLog(`REPLICATE node-0 -> node-2: ${newValue}`, 'replicate')
    }, lagMs + 250)
  }, [masterAlive, leaderIdx, writeCount, addLog, replicationLag])

  const readFromReplica = useCallback(() => {
    setReadCount(prev => prev + 1)
    const replicaIdx = leaderIdx === 0 ? (Math.random() < 0.5 ? 1 : 2) : (leaderIdx === 1 ? 2 : 1)
    const data = replicaIdx === 1 ? replica1Data : replica2Data
    addLog(`READ replica node-${replicaIdx}: GET user:42 -> ${data}`, 'read')
  }, [leaderIdx, replica1Data, replica2Data, addLog])

  const failMaster = useCallback(() => {
    if (!masterAlive) return
    setMasterAlive(false)
    addLog('FAILURE Master node-0 is down!', 'failover')
    setTimeout(() => {
      setLeaderIdx(1)
      setMasterAlive(true)
      setMasterData(replica1Data)
      addLog('FAILOVER Replica node-1 promoted to master', 'failover')
    }, 800)
  }, [masterAlive, replica1Data, addLog])

  const reset = useCallback(() => {
    setMasterAlive(true)
    setLeaderIdx(0)
    setMasterData('user:42 = { name: "Alice" }')
    setReplica1Data('user:42 = { name: "Alice" }')
    setReplica2Data('user:42 = { name: "Alice" }')
    setWriteCount(0)
    setReadCount(0)
    setLogs([{ text: 'System reset. All nodes healthy.', ts: Date.now(), type: 'info' }])
  }, [])

  const logContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      requestAnimationFrame(() => { node.scrollTop = node.scrollHeight })
    }
  }, [])

  return (
    <DemoBoundary name="Cache Replication">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>
        Redis-Style Replication
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Master handles writes; replicas serve reads. If the master fails, a replica is promoted.
      </p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>
          Replication Lag: {replicationLag}s
        </label>
        <input
          type="range" min={0} max={5} step={1}
          value={replicationLag}
          onChange={e => setReplicationLag(Number(e.target.value))}
          style={{ width: '100%', accentColor: s.accent }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', color: s.text3, fontSize: 10 }}>
          <span>0s (sync)</span>
          <span>5s (stale)</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'stretch' }}>
        <NodeBox
          label="Master"
          idx={leaderIdx}
          alive={masterAlive}
          color={s.accent}
          data={masterData}
          isLeader
          leaderIdx={leaderIdx}
        />
        <NodeBox
          label="Replica 1"
          idx={1}
          alive
          color={s.green}
          data={replica1Data}
          isLeader={leaderIdx === 1}
          leaderIdx={leaderIdx}
        />
        <NodeBox
          label="Replica 2"
          idx={2}
          alive
          color={s.orange}
          data={replica2Data}
          isLeader={leaderIdx === 2}
          leaderIdx={leaderIdx}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={writeToMaster} style={{
          flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
          background: s.accent, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
        }}>
          Write to Master
        </button>
        <button onClick={readFromReplica} style={{
          flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
          background: s.green, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
        }}>
          Read from Replica
        </button>
        <button onClick={failMaster} disabled={!masterAlive} style={{
          flex: 1, padding: '10px 0', borderRadius: 8, cursor: masterAlive ? 'pointer' : 'not-allowed',
          background: masterAlive ? s.red : s.bg3, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
          opacity: masterAlive ? 1 : 0.4,
        }}>
          Fail Master
        </button>
        <button onClick={reset} style={{
          padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
          background: s.bg3, border: `1px solid ${s.border}`, color: s.text2, fontSize: 13,
        }}>
          Reset
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center', flex: 1 }}>
          <div style={{ color: s.accent, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>{writeCount}</div>
          <div style={{ color: s.text3, fontSize: 11 }}>Writes</div>
        </div>
        <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center', flex: 1 }}>
          <div style={{ color: s.green, fontFamily: s.mono, fontSize: 20, fontWeight: 700 }}>{readCount}</div>
          <div style={{ color: s.text3, fontSize: 11 }}>Reads</div>
        </div>
      </div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10,
        padding: 12, maxHeight: 120, overflowY: 'auto',
      }} ref={logContainerRef}>
        <div style={{ color: s.text3, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          Event Log
        </div>
        {logs.map((log, i) => (
          <div key={i} style={{
            color: log.type === 'write' ? s.accent : log.type === 'read' ? s.green : log.type === 'replicate' ? s.yellow : log.type === 'failover' ? s.red : s.text3,
            fontFamily: s.mono, fontSize: 11, padding: '1px 0', lineHeight: 1.6,
          }}>
            [{new Date(log.ts).toLocaleTimeString()}] {log.text}
          </div>
        ))}
      </div>
    </div>
    </DemoBoundary>
  )
}

function NodeBox({ label, idx, alive, color, data, isLeader, leaderIdx }: {
  label: string
  idx: number
  alive: boolean
  color: string
  data: string
  isLeader: boolean
  leaderIdx: number
}) {
  const isActiveLeader = isLeader && alive
  return (
    <div style={{
      flex: 1, padding: '12px 10px', borderRadius: 10,
      background: isActiveLeader ? `${color}15` : s.bg2,
      border: `1px solid ${isActiveLeader ? color : s.border}`,
      transition: 'all 0.3s ease',
      opacity: idx === 0 && leaderIdx !== 0 ? 0.5 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: alive ? color : s.red,
        }} />
        <span style={{
          color: alive ? (isActiveLeader ? color : s.text) : s.red,
          fontSize: 12, fontWeight: 600,
        }}>
          {label}
          {isActiveLeader ? ' (leader)' : idx <= leaderIdx ? '' : ''}
        </span>
        {isActiveLeader && (
          <span style={{
            background: `${color}25`, color, fontSize: 9, fontWeight: 700,
            padding: '1px 4px', borderRadius: 3, fontFamily: s.mono,
          }}>
            RW
          </span>
        )}
        {!isActiveLeader && alive && (
          <span style={{
            background: `${s.green}15`, color: s.green, fontSize: 9, fontWeight: 700,
            padding: '1px 4px', borderRadius: 3, fontFamily: s.mono,
          }}>
            RO
          </span>
        )}
      </div>
      <div style={{
        color: alive ? s.text2 : s.text3, fontFamily: s.mono, fontSize: 11,
        lineHeight: 1.4, wordBreak: 'break-all',
      }}>
        {alive ? data : 'OFFLINE'}
      </div>
    </div>
  )
}
