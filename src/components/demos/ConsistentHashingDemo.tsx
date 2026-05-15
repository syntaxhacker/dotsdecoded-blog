import { useState, useMemo } from 'react'
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

const NODE_COLORS = [s.accent, s.green, s.purple, s.orange, s.yellow, s.red]
const INITIAL_ANGLES = [12, 78, 138, 204, 264, 324]

interface RingNode {
  id: number
  angle: number
  color: string
  label: string
}

interface KeyItem {
  id: number
  angle: number
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, radius: number, start: number, end: number) {
  let adjEnd = end
  if (adjEnd < start) adjEnd += 360
  const sweep = adjEnd - start
  if (sweep >= 360) return ''
  const large = sweep > 180 ? 1 : 0
  const p1 = polarToCartesian(cx, cy, radius, start)
  const p2 = polarToCartesian(cx, cy, radius, adjEnd)
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${radius} ${radius} 0 ${large} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
}

function generateKeys(count: number): KeyItem[] {
  const k: KeyItem[] = []
  for (let i = 0; i < count; i++) {
    k.push({ id: i, angle: Math.random() * 360 })
  }
  return k
}

const SHARED_KEYS = generateKeys(25)

export default function ConsistentHashingDemo() {
  const cx = 400
  const cy = 210
  const ringR = 160

  const [nodes, setNodes] = useState<RingNode[]>(() =>
    INITIAL_ANGLES.map((angle, i) => ({
      id: i, angle, color: NODE_COLORS[i], label: `N${i}`,
    }))
  )
  const [virtualCount, setVirtualCount] = useState(0)
  const [adding, setAdding] = useState(false)
  const [newNodeId, setNewNodeId] = useState<number | null>(null)
  const [movedKeyIds, setMovedKeyIds] = useState<Set<number>>(new Set())

  const sortedNodes = useMemo(() =>
    [...nodes].sort((a, b) => a.angle - b.angle),
    [nodes]
  )

  const allPositions = useMemo(() => {
    const positions: { angle: number; nodeId: number; color: string }[] =
      nodes.map((nd) => ({ angle: nd.angle, nodeId: nd.id, color: nd.color }))

    if (virtualCount > 0) {
      for (const node of nodes) {
        for (let v = 1; v <= virtualCount; v++) {
          const offset = (v * 360) / (nodes.length * (virtualCount + 1))
          const angle = (node.angle + offset + v * 7.3) % 360
          positions.push({ angle, nodeId: node.id, color: node.color })
        }
      }
    }

    positions.sort((a, b) => a.angle - b.angle)
    return positions
  }, [nodes, virtualCount])

  const keyOwnership = useMemo(() => {
    return SHARED_KEYS.map((key) => {
      let owner = allPositions[0]
      for (const pos of allPositions) {
        if (key.angle < pos.angle) {
          owner = pos
          break
        }
      }
      return { key, ownerId: owner.nodeId, color: owner.color }
    })
  }, [allPositions])

  const tokenRanges = useMemo(() => {
    const ranges: { nodeId: number; start: number; end: number; color: string }[] = []
    for (let i = 0; i < sortedNodes.length; i++) {
      const prev = i === 0 ? sortedNodes[sortedNodes.length - 1].angle - 360 : sortedNodes[i - 1].angle
      ranges.push({
        nodeId: sortedNodes[i].id,
        start: prev,
        end: sortedNodes[i].angle,
        color: sortedNodes[i].color,
      })
    }
    return ranges
  }, [sortedNodes])

  const addNode = () => {
    if (adding) return
    setAdding(true)

    const newAngle = Math.random() * 360
    const newId = nodes.length

    const prevNode = sortedNodes.find((nd) => newAngle < nd.angle) || sortedNodes[0]
    const prevKeys = keyOwnership.filter((k) => k.ownerId === prevNode.id)
    const affected = new Set(prevKeys
      .filter((k) => {
        const gap = newAngle < prevNode.angle ? prevNode.angle - 360 : prevNode.angle
        const kAngle = k.key.angle < prevNode.angle ? k.key.angle + 360 : k.key.angle
        return kAngle >= newAngle + (newAngle > prevNode.angle ? -360 : 0) && kAngle < gap
      })
      .map((k) => k.key.id)
    )

    setMovedKeyIds(affected)
    setNewNodeId(newId)

    setNodes((prev) => [
      ...prev,
      { id: newId, angle: newAngle, color: NODE_COLORS[newId % NODE_COLORS.length], label: `N${newId}` },
    ])

    setTimeout(() => {
      setMovedKeyIds(new Set())
      setNewNodeId(null)
      setAdding(false)
    }, 2500)
  }

  const resetNodes = () => {
    setNodes(INITIAL_ANGLES.map((angle, i) => ({
      id: i, angle, color: NODE_COLORS[i], label: `N${i}`,
    })))
    setVirtualCount(0)
    setNewNodeId(null)
    setMovedKeyIds(new Set())
    setAdding(false)
  }

  return (
    <DemoBoundary name="Consistent Hashing">
      <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
        <div style={SEC}>
          <div style={H}>Consistent Hashing Ring</div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
            Each node owns a contiguous range of the hash space. Adding a node redistributes only neighbor keys. Virtual nodes spread each node's ownership across the ring.
          </p>

          <svg viewBox="0 0 800 420" style={{ width: '100%', height: 320, overflow: 'hidden' }}>
            <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={s.border} strokeWidth={2} opacity={0.6} />

            {tokenRanges.map((range) => (
              <path
                key={range.nodeId}
                d={arcPath(cx, cy, ringR + 6, range.start, range.end)}
                stroke={range.color}
                strokeWidth={8} fill="none" opacity={0.35}
              />
            ))}

            {virtualCount > 0 && allPositions.filter((p) => {
              const isReal = nodes.some((nd) => nd.id === p.nodeId && nd.angle === p.angle)
              return !isReal
            }).map((vp, i) => {
              const p = polarToCartesian(cx, cy, ringR, vp.angle)
              const p2 = polarToCartesian(cx, cy, ringR - 8, vp.angle)
              return (
                <line key={`vp-${i}`} x1={p.x} y1={p.y} x2={p2.x} y2={p2.y}
                  stroke={vp.color} strokeWidth={2} opacity={0.5}
                />
              )
            })}

            {keyOwnership.map(({ key, ownerId, color }) => {
              const p = polarToCartesian(cx, cy, ringR - 22, key.angle)
              const moved = movedKeyIds.has(key.id)
              return (
                <circle
                  key={key.id}
                  cx={p.x} cy={p.y} r={moved ? 6 : 4}
                  fill={color}
                  opacity={moved ? 1 : 0.7}
                  stroke={moved ? '#fff' : 'none'}
                  strokeWidth={moved ? 2 : 0}
                  style={{ transition: 'all 0.3s' }}
                >
                  <title>{`Key ${key.id} maps to N${ownerId}`}</title>
                </circle>
              )
            })}

            {nodes.map((node, i) => {
              const p = polarToCartesian(cx, cy, ringR, node.angle)
              const isNew = node.id === newNodeId
              return (
                <g key={node.id}>
                  <circle
                    cx={p.x} cy={p.y}
                    r={isNew ? 20 : 15}
                    fill={node.color}
                    stroke={isNew ? '#fff' : s.bg}
                    strokeWidth={isNew ? 3 : 2}
                    style={{ transition: 'all 0.3s' }}
                  />
                  <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle"
                    fill="#fff" fontSize={isNew ? 10 : 9} fontWeight={700}
                  >
                    {node.label}
                  </text>
                </g>
              )
            })}
          </svg>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <button onClick={addNode} disabled={adding} style={{
              background: s.accent, border: 'none', borderRadius: 8,
              padding: '10px 20px', color: '#fff', cursor: adding ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600, opacity: adding ? 0.6 : 1,
            }}>
              Add Node
            </button>
            <button onClick={resetNodes} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 20px', color: s.text2, cursor: 'pointer', fontSize: 13,
            }}>
              Reset
            </button>
            <div style={{ flex: 1, marginLeft: 16 }}>
              <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>
                Virtual Nodes: {virtualCount}
              </label>
              <input
                type="range" min={0} max={12} value={virtualCount}
                onChange={e => setVirtualCount(Number(e.target.value))}
                style={{ width: '100%', accentColor: s.purple }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {nodes.map((node) => (
              <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: node.color }} />
                <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 11 }}>{node.label}</span>
              </div>
            ))}
          </div>

          {newNodeId !== null && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 8,
              background: `${s.yellow}15`, border: `1px solid ${s.yellow}`,
              color: s.yellow, fontSize: 12, fontFamily: s.mono,
            }}>
              Node N{newNodeId} added. {movedKeyIds.size} keys redistributed from neighbor.
            </div>
          )}
        </div>
      </div>
    </DemoBoundary>
  )
}
