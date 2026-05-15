import { useState, useRef, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const COLS = 8
const ROWS = 6
const CELL = 50
const NODE_R = 5

interface Node {
  id: string
  x: number
  y: number
  edges: string[]
  weights: Record<string, number>
}

function makeGraph(): Record<string, Node> {
  const g: Record<string, Node> = {}
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const id = `${r}-${c}`
      const edges: string[] = []
      const weights: Record<string, number> = {}
      if (c > 0) { edges.push(`${r}-${c - 1}`); weights[`${r}-${c - 1}`] = 10 }
      if (c < COLS - 1) { edges.push(`${r}-${c + 1}`); weights[`${r}-${c + 1}`] = 10 }
      if (r > 0) { edges.push(`${r - 1}-${c}`); weights[`${r - 1}-${c}`] = 10 }
      if (r < ROWS - 1) { edges.push(`${r + 1}-${c}`); weights[`${r + 1}-${c}`] = 10 }
      g[id] = { id, x: c * CELL + CELL / 2, y: r * CELL + CELL / 2, edges, weights }
    }
  }
  return g
}

function astar(
  graph: Record<string, Node>,
  start: string,
  end: string,
  traffic: Record<string, number>,
): { path: string[]; explored: string[] } {
  const openSet = new Set<string>([start])
  const cameFrom: Record<string, string> = {}
  const gScore: Record<string, number> = { [start]: 0 }
  const fScore: Record<string, number> = {
    [start]: Math.abs(graph[start].x - graph[end].x) + Math.abs(graph[start].y - graph[end].y),
  }
  const explored: string[] = []

  while (openSet.size > 0) {
    let current = ''
    let minF = Infinity
    for (const n of openSet) {
      if (fScore[n] !== undefined && fScore[n] < minF) {
        minF = fScore[n]
        current = n
      }
    }

    if (current === end) {
      const path: string[] = []
      let c = current
      while (c) {
        path.unshift(c)
        c = cameFrom[c]
      }
      return { path, explored }
    }

    openSet.delete(current)
    explored.push(current)

    for (const neighbor of graph[current].edges) {
      const edgeWeight = graph[current].weights[neighbor] || 10
      const trafficMult = traffic[`${current}-${neighbor}`] || traffic[`${neighbor}-${current}`] || 1.0
      const tentativeG = (gScore[current] || 0) + edgeWeight * trafficMult

      if (tentativeG < (gScore[neighbor] ?? Infinity)) {
        cameFrom[neighbor] = current
        gScore[neighbor] = tentativeG
        fScore[neighbor] = tentativeG + (
          Math.abs(graph[neighbor].x - graph[end].x) + Math.abs(graph[neighbor].y - graph[end].y)
        ) * 0.1
        openSet.add(neighbor)
      }
    }
  }

  return { path: [], explored }
}

const TRAFFIC_EDGES: Record<string, number> = {
  '1-2-1-3': 4,
  '1-3-1-4': 4,
  '2-4-2-5': 3.5,
  '2-5-2-6': 3.5,
  '3-2-3-3': 5,
  '3-3-3-4': 5,
}

export default function RoutingDemo() {
  const graph = makeGraph()
  const [origin, setOrigin] = useState<string>('0-0')
  const [dest, setDest] = useState<string>('5-7')
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<{ path: string[]; explored: string[] } | null>(null)
  const [trafficOn, setTrafficOn] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [visibleExplored, setVisibleExplored] = useState<string[]>([])
  const [animDone, setAnimDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const traffic = trafficOn ? TRAFFIC_EDGES : {}

  const computeRoute = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setAnimating(true)
    setAnimDone(false)
    setVisibleExplored([])
    setResult(null)

    const res = astar(graph, origin, dest, traffic)
    setResult(res)

    let i = 0
    const interval = 30
    const tick = () => {
      if (i < res.explored.length) {
        setVisibleExplored(res.explored.slice(0, i + 1))
        i++
        timerRef.current = setTimeout(tick, interval)
      } else {
        setAnimDone(true)
        setAnimating(false)
      }
    }
    timerRef.current = setTimeout(tick, interval)
  }, [origin, dest, traffic, graph])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleNodeClick = (id: string) => {
    if (animating) return
    if (!selected) {
      setOrigin(id)
      setSelected(id)
    } else if (selected !== id) {
      setDest(id)
      setOrigin(origin)
      setSelected(null)
      setResult(null)
      setAnimDone(false)
      setVisibleExplored([])
    } else {
      setSelected(null)
    }
  }

  const VW = COLS * CELL
  const VH = ROWS * CELL

  const isOrigin = (id: string) => id === origin
  const isDest = (id: string) => id === dest
  const isExplored = (id: string) => visibleExplored.includes(id)
  const isPath = (id: string) => result && animDone && result.path.includes(id)
  const isFrontier = (id: string) => {
    if (!result || !animDone) return false
    return result.explored.includes(id) && !result.path.includes(id)
  }

  return (
    <DemoBoundary name="A* Routing with Traffic">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.text, letterSpacing: -0.3 }}>A* Routing</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => { setTrafficOn(!trafficOn); setResult(null); setAnimDone(false); setVisibleExplored([]) }}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: `1px solid ${trafficOn ? s.red : s.border}`,
                  background: trafficOn ? `${s.red}15` : s.bg3, color: trafficOn ? s.red : s.text2,
                  fontSize: 11, cursor: 'pointer', fontFamily: s.mono,
                }}>
                {trafficOn ? 'Traffic ON' : 'Traffic OFF'}
              </button>
              <button onClick={computeRoute} disabled={animating} style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: animating ? s.bg3 : s.accent, color: animating ? s.text3 : '#fff',
                fontSize: 12, fontWeight: 600, cursor: animating ? 'not-allowed' : 'pointer',
              }}>
                {animating ? 'Exploring...' : 'Find Route'}
              </button>
              <button onClick={() => { setOrigin('0-0'); setDest('5-7'); setResult(null); setAnimDone(false); setVisibleExplored([]); setSelected(null); setTrafficOn(false) }}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: `1px solid ${s.border}`,
                  background: s.bg3, color: s.text2, fontSize: 11, cursor: 'pointer',
                }}>Reset</button>
            </div>
          </div>

          <p style={{ color: s.text2, fontSize: 13, margin: '0 0 14px', lineHeight: 1.5 }}>
            Click a node to set origin (green), click another to set destination (red). Then click "Find Route" to run A*. Toggle traffic to see rerouting around congestion.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16 }}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 8, overflow: 'hidden' }}>
              <svg width={VW} height={VH} viewBox={`0 0 ${VW} ${VH}`} style={{ display: 'block' }}>
                {Object.values(graph).map(node =>
                  node.edges.map(neighborId => {
                    const neighbor = graph[neighborId]
                    const edgeKey = `${node.id}-${neighborId}`
                    const hasTraffic = traffic[edgeKey] !== undefined || traffic[`${neighborId}-${node.id}`] !== undefined
                    const mult = traffic[edgeKey] || traffic[`${neighborId}-${node.id}`] || 1
                    const congested = hasTraffic && mult > 2
                    return (
                      <line key={edgeKey}
                        x1={node.x} y1={node.y} x2={neighbor.x} y2={neighbor.y}
                        stroke={congested ? s.red : s.border}
                        strokeWidth={congested ? 3 : 1}
                        opacity={congested ? 0.8 : 0.4}
                      />
                    )
                  })
                )}
                {Object.values(graph).map(node => {
                  const explored = isExplored(node.id)
                  const onPath = isPath(node.id)
                  const frontier = isFrontier(node.id)
                  let fill = s.bg3
                  if (isOrigin(node.id)) fill = s.green
                  else if (isDest(node.id)) fill = s.red
                  else if (onPath) fill = s.accent
                  else if (explored) fill = `${s.accent}40`
                  else if (frontier) fill = `${s.yellow}30`

                  return (
                    <g key={node.id} onClick={() => handleNodeClick(node.id)} style={{ cursor: 'pointer' }}>
                      <circle cx={node.x} cy={node.y} r={NODE_R + 3}
                        fill={fill} stroke={
                          isOrigin(node.id) ? s.green :
                          isDest(node.id) ? s.red :
                          onPath ? s.accent : s.border2
                        }
                        strokeWidth={isOrigin(node.id) || isDest(node.id) || onPath ? 2.5 : 1.2}
                        style={{ transition: 'all 0.2s' }}
                      />
                      {(isOrigin(node.id) || isDest(node.id)) && (
                        <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
                          fill="#fff" fontSize={7} fontWeight={700} fontFamily={s.mono}>
                          {isOrigin(node.id) ? 'S' : 'E'}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
              <div style={{ fontSize: 10, color: s.text3, marginTop: 6, textAlign: 'center', fontFamily: s.mono }}>
                Click start (S) then end (E) | {animDone ? `Path: ${result?.path.length || 0} nodes | Explored: ${result?.explored.length || 0} nodes` : 'Ready'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, fontFamily: s.mono, textTransform: 'uppercase', letterSpacing: 1 }}>Route Info</div>
                <div style={{ fontSize: 11, fontFamily: s.mono, marginBottom: 4, color: s.text2 }}>
                  Start: <span style={{ color: s.green }}>{origin}</span>
                </div>
                <div style={{ fontSize: 11, fontFamily: s.mono, marginBottom: 4, color: s.text2 }}>
                  End: <span style={{ color: s.red }}>{dest}</span>
                </div>
                {result && animDone && (
                  <>
                    <div style={{ fontSize: 11, fontFamily: s.mono, color: s.accent, marginBottom: 4 }}>
                      Path: {result.path.join(' -> ')}
                    </div>
                    <div style={{ fontSize: 11, fontFamily: s.mono, color: s.green }}>
                      Cost: {result.path.reduce((sum, id, i) => {
                        if (i === 0) return sum
                        const prev = result.path[i - 1]
                        const mult = traffic[`${prev}-${id}`] || traffic[`${id}-${prev}`] || 1.0
                        return sum + (graph[prev].weights[id] || 10) * mult
                      }, 0).toFixed(0)} units
                    </div>
                  </>
                )}
              </div>

              <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, fontFamily: s.mono, textTransform: 'uppercase', letterSpacing: 1 }}>Legend</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.green, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: s.text3 }}>Start</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.red, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: s.text3 }}>Destination</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.accent, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: s.text3 }}>Path found</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: `${s.accent}40`, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: s.text3 }}>Explored</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 14, height: 4, borderRadius: 1, background: s.red, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: s.text3 }}>Traffic (heavy)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {trafficOn && (
            <div style={{ marginTop: 12, background: `${s.red}10`, border: `1px solid ${s.red}30`, borderRadius: 6, padding: '8px 14px', fontSize: 11, color: s.red, lineHeight: 1.5 }}>
              Traffic simulation active. Edges between rows 1-3 have 3.5-5x multipliers. Route will avoid or detour around heavy congestion.
            </div>
          )}
        </div>
      </div>
    </DemoBoundary>
  )
}
