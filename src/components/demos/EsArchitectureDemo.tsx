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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface NodeData {
  id: string
  roles: string[]
  x: number
  y: number
}

interface ShardData {
  id: string
  type: 'primary' | 'replica'
  nodeId: string
}

const nodes: NodeData[] = [
  { id: 'N1', roles: ['master', 'data'], x: 120, y: 60 },
  { id: 'N2', roles: ['data'], x: 360, y: 60 },
  { id: 'N3', roles: ['data'], x: 600, y: 60 },
]

const shards: ShardData[] = [
  { id: 'P0', type: 'primary', nodeId: 'N1' },
  { id: 'P1', type: 'primary', nodeId: 'N2' },
  { id: 'R0', type: 'replica', nodeId: 'N2' },
  { id: 'R1', type: 'replica', nodeId: 'N3' },
]

type FlowMode = 'idle' | 'indexing' | 'search' | 'refresh' | 'merge'

interface FlowStep {
  mode: FlowMode
  label: string
  description: string
  activeArrows?: { from: string; to: string }[]
  highlightShards?: string[]
  highlightNodes?: string[]
}

const flow: FlowStep[] = [
  { mode: 'idle', label: 'Cluster Ready', description: '3-node cluster with index "articles" (2 primary shards, 1 replica each)', highlightShards: [], highlightNodes: [] },
  { mode: 'indexing', label: 'Indexing: Document Arrives', description: 'Client sends doc to coordinating node N1. Hash routing selects shard.', activeArrows: [{ from: 'client', to: 'N1' }], highlightNodes: ['N1'] },
  { mode: 'indexing', label: 'Indexing: Route to Primary', description: 'N1 routes the doc to primary shard P0 (on N1).', activeArrows: [{ from: 'N1', to: 'N1' }], highlightShards: ['P0'], highlightNodes: ['N1'] },
  { mode: 'indexing', label: 'Indexing: Replicate', description: 'Primary P0 forwards to replica R0 (on N2).', activeArrows: [{ from: 'N1', to: 'N2' }], highlightShards: ['P0', 'R0'], highlightNodes: ['N1', 'N2'] },
  { mode: 'indexing', label: 'Indexing: Acknowledge', description: 'Replicas confirm. Client receives success response.', activeArrows: [{ from: 'N2', to: 'N1' }], highlightShards: ['P0', 'R0'] },
  { mode: 'refresh', label: 'Refresh (every 1s)', description: 'New segment opened for search. Document now visible in NRT.', highlightShards: ['P0', 'P1', 'R0', 'R1'] },
  { mode: 'search', label: 'Search: Broadcast', description: 'Coordinating node sends query to ALL shards (primaries + replicas).', activeArrows: [{ from: 'N1', to: 'N2' }, { from: 'N1', to: 'N3' }], highlightNodes: ['N1', 'N2', 'N3'] },
  { mode: 'search', label: 'Search: Query Phase', description: 'Each shard searches its segments locally, returns top N (doc IDs + scores).', activeArrows: [{ from: 'N2', to: 'N1' }, { from: 'N3', to: 'N1' }], highlightShards: ['P0', 'P1', 'R0', 'R1'] },
  { mode: 'search', label: 'Search: Fetch Phase', description: 'Coordinator retrieves full documents from shards and merges results.', activeArrows: [{ from: 'N1', to: 'N2' }, { from: 'N1', to: 'N3' }], highlightNodes: ['N1'] },
  { mode: 'search', label: 'Search: Return', description: 'Final merged result set returned to client.', activeArrows: [{ from: 'N1', to: 'client' }], highlightNodes: ['N1'] },
  { mode: 'merge', label: 'Segment Merge', description: 'Background merge: small segments combined into larger ones, deletes reclaimed.', highlightShards: ['P0', 'P1', 'R0', 'R1'] },
  { mode: 'idle', label: 'Merge Complete', description: 'Fewer segments = faster search. Old segments deleted.', highlightShards: [], highlightNodes: [] },
]

export default function EsArchitectureDemo() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentFlow = flow[step] || flow[0]

  const advance = useCallback(() => {
    setStep(prev => (prev < flow.length - 1 ? prev + 1 : 0))
  }, [])

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setStep(0)
    setPlaying(false)
  }, [])

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    const delay = getStepDelay(2500, speed)
    intervalRef.current = setInterval(advance, delay)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [playing, speed, advance])

  const handlePlay = () => {
    setStep(0)
    setPlaying(true)
  }

  return (
    <DemoBoundary name="Elasticsearch Cluster Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Cluster Architecture</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          3 nodes, 2 primary shards + 2 replicas. Watch indexing, search, and background operations flow through the cluster.
        </p>

        <div style={{
          position: 'relative', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12,
          padding: 24, marginBottom: 20, minHeight: 480, overflow: 'hidden',
        }}>
          {nodes.map(n => {
            const isHighlighted = currentFlow.highlightNodes?.includes(n.id)
            return (
              <div
                key={n.id}
                style={{
                  position: 'absolute', left: n.x, top: n.y, width: 140, padding: 12,
                  background: isHighlighted ? `${s.accent}18` : s.bg2,
                  border: `1px solid ${isHighlighted ? s.accent : s.border}`,
                  borderRadius: 10, transition: 'all 0.4s',
                }}
              >
                <div style={{ color: s.text, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{n.id}</div>
                <div style={{ color: s.text3, fontSize: 10 }}>{n.roles.join(' + ')}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {shards.filter(sh => sh.nodeId === n.id).map(sh => {
                    const isHighlightedShard = currentFlow.highlightShards?.includes(sh.id)
                    return (
                      <div
                        key={sh.id}
                        style={{
                          padding: '2px 6px', borderRadius: 4, fontSize: 10, fontFamily: s.mono,
                          background: isHighlightedShard
                            ? (sh.type === 'primary' ? `${s.accent}33` : `${s.green}33`)
                            : (sh.type === 'primary' ? s.bg3 : `${s.bg3}88`),
                          border: `1px solid ${
                            isHighlightedShard
                              ? (sh.type === 'primary' ? s.accent : s.green)
                              : s.border2
                          }`,
                          color: isHighlightedShard ? s.text : s.text3,
                          fontWeight: isHighlightedShard ? 600 : 400,
                          transition: 'all 0.4s',
                        }}
                      >
                        {sh.id}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div style={{
            position: 'absolute', bottom: 16, right: 16, left: 16,
            display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
          }}>
            {currentFlow.activeArrows?.map((a, i) => {
              const fromNode = nodes.find(n => n.id === a.from)
              const toNode = a.to !== 'client' ? nodes.find(n => n.id === a.to) : null
              if (!fromNode || (!toNode && a.to !== 'client')) return null
              if (a.to === 'client') {
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: `${s.accent}15`, borderRadius: 6, padding: '4px 10px',
                    border: `1px solid ${s.accent}44`,
                  }}>
                    <span style={{ color: s.accent, fontSize: 11, fontFamily: s.mono }}>
                      {a.from} &rarr; Client
                    </span>
                  </div>
                )
              }
              if (a.from === a.to) {
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: `${s.accent}15`, borderRadius: 6, padding: '4px 10px',
                    border: `1px solid ${s.accent}44`,
                  }}>
                    <span style={{ color: s.accent, fontSize: 11, fontFamily: s.mono }}>
                      {a.from} (local)
                    </span>
                  </div>
                )
              }
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: `${s.accent}15`, borderRadius: 6, padding: '4px 10px',
                  border: `1px solid ${s.accent}44`,
                }}>
                  <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>{a.from}</span>
                  <span style={{ color: s.accent, fontSize: 11 }}>&rarr;</span>
                  <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>{a.to}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: '12px 16px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: s.accent, flexShrink: 0,
            }} />
            <span style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>
              {currentFlow.label}
            </span>
          </div>
          <div style={{ color: s.text2, fontSize: 13, marginLeft: 18 }}>
            {currentFlow.description}
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 4, marginBottom: 16, justifyContent: 'center',
        }}>
          {flow.map((st, i) => (
            <div
              key={i}
              onClick={() => { setStep(i); setPlaying(false) }}
              style={{
                width: 10, height: 10, borderRadius: '50%', cursor: 'pointer',
                background: i === step ? s.accent : i < step ? s.green : s.bg3,
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>

        <SpeedController speed={speed} onSpeedChange={setSpeed} />

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={handlePlay} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
            opacity: playing ? 0.6 : 1,
          }}>
            {playing ? 'Playing...' : 'Auto-Play'}
          </button>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
