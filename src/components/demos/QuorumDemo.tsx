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

type NodeData = { status: 'idle' | 'write-ok' | 'write-fail' | 'read-ok' | 'read-fail' | 'read-stale'; value: string; version: number }

function QuorumDemoInner() {
  const N = 5
  const [wQuorum, setWQuorum] = useState(3)
  const [rQuorum, setRQuorum] = useState(3)
  const [nodeStates, setNodeStates] = useState<NodeData[]>([
    { status: 'idle', value: '-', version: 0 },
    { status: 'idle', value: '-', version: 0 },
    { status: 'idle', value: '-', version: 0 },
    { status: 'idle', value: '-', version: 0 },
    { status: 'idle', value: '-', version: 0 },
  ])
  const [log, setLog] = useState<string[]>([])
  const [writeVersion, setWriteVersion] = useState(0)
  const [animating, setAnimating] = useState(false)

  const addLog = useCallback((msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 8))
  }, [])

  const validQuorum = wQuorum + rQuorum > N
  const guaranteedConsistent = wQuorum + rQuorum > N

  const handleWrite = useCallback(() => {
    if (animating) return
    setAnimating(true)
    const newVersion = writeVersion + 1
    const newValue = `v${newVersion}`
    setWriteVersion(newVersion)

    const writeTargets = new Set<number>()
    const failTargets = new Set<number>()
    const nodes = [...nodeStates]
    const shuffled = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5)
    let written = 0
    for (const idx of shuffled) {
      if (written < wQuorum) {
        writeTargets.add(idx)
        written++
      } else {
        failTargets.add(idx)
      }
    }

    addLog(`Writing "${newValue}" to ${wQuorum} of ${N} nodes (W=${wQuorum})`)

    const newStates = nodes.map((nd, i) => {
      if (writeTargets.has(i)) {
        return { ...nd, status: 'write-ok' as NodeData['status'], value: newValue, version: newVersion }
      }
      return { ...nd, status: 'write-fail' as NodeData['status'] }
    })
    setNodeStates(newStates)

    setTimeout(() => {
      const restored = newStates.map(nd => ({ ...nd, status: 'idle' as NodeData['status'] }))
      if (failTargets.size > 0) {
        const toPropagate = Array.from(failTargets).slice(0, Math.ceil(failTargets.size / 2))
        toPropagate.forEach(idx => {
          restored[idx] = { ...restored[idx], value: newValue, version: newVersion }
        })
      }
      setNodeStates(restored)
      setAnimating(false)
      addLog(`Write acknowledged. ${writeTargets.size} nodes updated immediately.`)
    }, 1500)
  }, [animating, writeVersion, wQuorum, N, nodeStates, addLog])

  const handleRead = useCallback(() => {
    if (animating) return
    setAnimating(true)

    const readTargets = new Set<number>()
    const shuffled = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5)
    let readCount = 0
    for (const idx of shuffled) {
      if (readCount < rQuorum) {
        readTargets.add(idx)
        readCount++
      }
    }

    addLog(`Reading from ${rQuorum} of ${N} nodes (R=${rQuorum})`)

    const newStates = nodeStates.map((nd, i) => {
      if (readTargets.has(i)) {
        return { ...nd, status: nd.version < writeVersion ? 'read-stale' as NodeData['status'] : 'read-ok' as NodeData['status'] }
      }
      return nd
    })
    setNodeStates(newStates)

    setTimeout(() => {
      const readNodes = readTargets.size > 0 ? Array.from(readTargets) : [0]
      const latestVersion = Math.max(...readNodes.map(i => nodeStates[i].version))
      const staleNodes = readNodes.filter(i => nodeStates[i].version < latestVersion)

      if (staleNodes.length > 0) {
        addLog(`Read: found stale data on ${staleNodes.length} node(s)! Version mismatch detected.`)
        if (guaranteedConsistent) {
          addLog(`But W+R=${wQuorum + rQuorum} > N=${N}, so overlap guarantees consistency.`)
        } else {
          addLog(`WARNING: W+R=${wQuorum + rQuorum} <= N=${N}, stale reads are possible!`)
        }
      } else {
        addLog(`Read: all ${rQuorum} nodes returned consistent data.`)
      }

      setNodeStates(prev => prev.map(nd => ({ ...nd, status: 'idle' })))
      setAnimating(false)
    }, 1200)
  }, [animating, rQuorum, N, nodeStates, writeVersion, wQuorum, guaranteedConsistent, addLog])

  const statusColor = (status: NodeData['status']) => {
    switch (status) {
      case 'write-ok': return s.green
      case 'write-fail': return s.text3
      case 'read-ok': return s.purple
      case 'read-stale': return s.yellow
      default: return s.border
    }
  }

  const statusLabel = (status: NodeData['status']) => {
    switch (status) {
      case 'write-ok': return 'WRITTEN'
      case 'write-fail': return 'SKIPPED'
      case 'read-ok': return 'READ'
      case 'read-stale': return 'STALE'
      default: return null
    }
  }

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div style={{ background: s.bg2, borderRadius: 8, padding: 14, border: `1px solid ${s.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3 }}>Write Quorum (W)</span>
            <span style={{ fontFamily: s.mono, fontSize: 18, fontWeight: 700, color: s.green }}>{wQuorum}</span>
          </div>
          <input
            type="range"
            min={1}
            max={N}
            value={wQuorum}
            onChange={e => setWQuorum(Number(e.target.value))}
            style={{ width: '100%', accentColor: s.green, height: 6 }}
          />
          <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, marginTop: 4 }}>
            Higher W = slower writes, more durable
          </div>
        </div>
        <div style={{ background: s.bg2, borderRadius: 8, padding: 14, border: `1px solid ${s.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3 }}>Read Quorum (R)</span>
            <span style={{ fontFamily: s.mono, fontSize: 18, fontWeight: 700, color: s.purple }}>{rQuorum}</span>
          </div>
          <input
            type="range"
            min={1}
            max={N}
            value={rQuorum}
            onChange={e => setRQuorum(Number(e.target.value))}
            style={{ width: '100%', accentColor: s.purple, height: 6 }}
          />
          <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, marginTop: 4 }}>
            Higher R = slower reads, more consistent
          </div>
        </div>
      </div>

      <div style={{
        background: validQuorum ? `${s.green}10` : `${s.red}10`,
        border: `1px solid ${validQuorum ? s.green + '30' : s.red + '30'}`,
        borderRadius: 6,
        padding: '8px 12px',
        marginBottom: 14,
        fontSize: 12,
        fontFamily: s.mono,
        color: validQuorum ? s.green : s.red,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>W + R = {wQuorum} + {rQuorum} = {wQuorum + rQuorum} {validQuorum ? '>' : '<='} N = {N}</span>
        <span>{validQuorum ? 'Consistency guaranteed' : 'Stale reads possible'}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button
          onClick={handleWrite}
          disabled={animating}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 6,
            border: `1px solid ${s.green}`,
            background: `${s.green}20`,
            color: s.green,
            fontFamily: s.mono,
            fontSize: 13,
            fontWeight: 600,
            cursor: animating ? 'wait' : 'pointer',
          }}
        >
          Write
        </button>
        <button
          onClick={handleRead}
          disabled={animating}
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
            cursor: animating ? 'wait' : 'pointer',
          }}
        >
          Read
        </button>
        <button
          onClick={() => { setNodeStates(Array.from({ length: N }, () => ({ status: 'idle' as NodeData['status'], value: '-', version: 0 }))); setLog([]); setWriteVersion(0) }}
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            border: `1px solid ${s.border}`,
            background: s.bg2,
            color: s.text3,
            fontFamily: s.mono,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {nodeStates.map((nd, i) => (
          <div key={i} style={{
            flex: 1,
            background: s.bg2,
            borderRadius: 8,
            padding: '12px 8px',
            border: `2px solid ${statusColor(nd.status)}`,
            textAlign: 'center',
            transition: 'border-color 0.3s ease',
          }}>
            <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 6 }}>Node {i + 1}</div>
            <div style={{
              fontFamily: s.mono,
              fontSize: 20,
              fontWeight: 700,
              color: nd.value === '-' ? s.text3 : s.text,
              marginBottom: 2,
            }}>
              {nd.value}
            </div>
            <div style={{ fontFamily: s.mono, fontSize: 9, color: s.text3 }}>
              ver {nd.version}
            </div>
            {statusLabel(nd.status) && (
              <div style={{
                fontFamily: s.mono,
                fontSize: 8,
                fontWeight: 700,
                color: statusColor(nd.status),
                marginTop: 6,
              }}>
                {statusLabel(nd.status)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: s.bg2, borderRadius: 8, padding: 12, border: `1px solid ${s.border}`, maxHeight: 130, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 6 }}>Event Log</div>
        {log.length === 0 ? (
          <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>Write data, then read to see quorum in action</div>
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

export default function QuorumDemo() {
  return (
    <DemoBoundary name="Quorum">
      <QuorumDemoInner />
    </DemoBoundary>
  )
}
