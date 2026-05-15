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

const GRID = 16
const CELL = 28
const CAPACITY = 4

interface Point { id: number; x: number; y: number }

interface QuadNode {
  x: number; y: number; w: number; h: number
  points: Point[]
  children: QuadNode[] | null
  depth: number
}

function buildQuadTree(points: Point[], capacity: number): QuadNode {
  function subdivide(node: QuadNode): QuadNode {
    if (node.points.length <= capacity || node.w < 2 || node.h < 2) {
      return node
    }
    const hw = node.w / 2
    const hh = node.h / 2
    node.children = [
      { x: node.x, y: node.y, w: hw, h: hh, points: [], children: null, depth: node.depth + 1 },
      { x: node.x + hw, y: node.y, w: hw, h: hh, points: [], children: null, depth: node.depth + 1 },
      { x: node.x, y: node.y + hh, w: hw, h: hh, points: [], children: null, depth: node.depth + 1 },
      { x: node.x + hw, y: node.y + hh, w: hw, h: hh, points: [], children: null, depth: node.depth + 1 },
    ]
    for (const pt of node.points) {
      for (const child of node.children) {
        if (pt.x >= child.x && pt.x < child.x + child.w && pt.y >= child.y && pt.y < child.y + child.h) {
          child.points.push(pt)
          break
        }
      }
    }
    node.points = []
    node.children = node.children.map(c => subdivide(c))
    return node
  }

  const root: QuadNode = { x: 0, y: 0, w: GRID, h: GRID, points: [...points], children: null, depth: 0 }
  return subdivide(root)
}

function flatNodes(node: QuadNode): QuadNode[] {
  const result: QuadNode[] = [node]
  if (node.children) {
    for (const c of node.children) {
      result.push(...flatNodes(c))
    }
  }
  return result
}

const SVGW = GRID * CELL
const SVGH = GRID * CELL

function TreeNode({ node, highlighted }: { node: QuadNode; highlighted: boolean }) {
  const pad = 8
  const lineH = 20
  const hasChildren = node.children !== null

  const nodeColor = highlighted ? s.accent : s.text3

  return (
    <div style={{ marginLeft: node.depth > 0 ? 14 : 0 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 8px', borderRadius: 4, marginBottom: 2,
        background: highlighted ? `${s.accent}15` : 'transparent',
        border: `1px solid ${highlighted ? s.accent + '40' : 'transparent'}`,
        fontSize: 10, fontFamily: s.mono, color: nodeColor,
        cursor: 'default',
      }}>
        <span style={{ opacity: 0.6 }}>d{node.depth}</span>
        <span>{node.points.length} pts</span>
        {hasChildren && <span style={{ opacity: 0.5 }}>4 children</span>}
      </div>
      {hasChildren && node.children && (
        <div style={{ borderLeft: `1px solid ${s.border}`, marginLeft: 8, paddingLeft: 4 }}>
          {node.children.map((child, i) => (
            <TreeNode key={`${child.x}-${child.y}-${i}`} node={child} highlighted={highlighted && child.points.length > 0} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function QuadTreeDemo() {
  const [points, setPoints] = useState<Point[]>([])
  const [selectedNode, setSelectedNode] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  const tree = buildQuadTree(points, CAPACITY)
  const allNodes = flatNodes(tree)

  const handleClick = useCallback((gx: number, gy: number) => {
    const newPt: Point = { id: points.length + 1, x: gx, y: gy }
    setPoints(prev => [...prev, newPt])
    setSelectedNode(null)
  }, [points])

  const handleReset = () => {
    setPoints([])
    setSelectedNode(null)
  }

  const handleNodeClick = useCallback((node: QuadNode) => {
    setSelectedNode({ x: node.x, y: node.y, w: node.w, h: node.h })
  }, [])

  const addRandom = () => {
    const newPts: Point[] = []
    for (let i = 0; i < 5; i++) {
      newPts.push({
        id: points.length + i + 1,
        x: Math.floor(Math.random() * GRID),
        y: Math.floor(Math.random() * GRID),
      })
    }
    setPoints(prev => [...prev, ...newPts])
  }

  return (
    <DemoBoundary name="QuadTree Spatial Index">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.text, letterSpacing: -0.3 }}>QuadTree Spatial Index</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={addRandom} style={{
                padding: '6px 14px', borderRadius: 6, border: `1px solid ${s.border}`,
                background: s.bg3, color: s.text2, fontSize: 12, cursor: 'pointer', fontFamily: s.mono,
              }}>Add 5 Random</button>
              <button onClick={handleReset} style={{
                padding: '6px 14px', borderRadius: 6, border: `1px solid ${s.red}40`,
                background: `${s.red}10`, color: s.red, fontSize: 12, cursor: 'pointer', fontFamily: s.mono,
              }}>Reset</button>
            </div>
          </div>

          <p style={{ color: s.text2, fontSize: 13, margin: '0 0 14px', lineHeight: 1.5 }}>
            Click the grid to add points. Each quadrant splits into 4 when it exceeds {CAPACITY} points.
            The tree structure is shown alongside.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 8, overflow: 'hidden' }}>
              <svg width={SVGW} height={SVGH} style={{ display: 'block' }}>
                {allNodes.map((node, i) => {
                  const isSelected = selectedNode &&
                    node.x === selectedNode.x && node.y === selectedNode.y &&
                    node.w === selectedNode.w && node.h === selectedNode.h
                  return (
                    <rect key={i}
                      x={node.x * CELL} y={node.y * CELL}
                      width={node.w * CELL} height={node.h * CELL}
                      fill={isSelected ? `${s.accent}12` : 'none'}
                      stroke={isSelected ? s.accent : node.children ? s.border2 : s.border}
                      strokeWidth={isSelected ? 2 : node.children ? 1 : 0.5}
                      strokeDasharray={node.children ? 'none' : '2 2'}
                      onClick={() => handleNodeClick(node)}
                      style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                    />
                  )
                })}
                {points.map(pt => (
                  <g key={pt.id}>
                    <circle cx={pt.x * CELL + CELL / 2} cy={pt.y * CELL + CELL / 2} r={5}
                      fill={s.green} stroke={s.bg2} strokeWidth={2} />
                    <text x={pt.x * CELL + CELL / 2} y={pt.y * CELL + CELL / 2 + 1}
                      textAnchor="middle" dominantBaseline="middle"
                      fill="#fff" fontSize={7} fontWeight={700} fontFamily={s.mono}>
                      {pt.id}
                    </text>
                  </g>
                ))}
              </svg>
              <div style={{ fontSize: 10, color: s.text3, marginTop: 6, textAlign: 'center', fontFamily: s.mono }}>
                {points.length} points | Click to add points
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12,
                maxHeight: 360, overflowY: 'auto', fontFamily: s.mono, fontSize: 10,
              }}>
                <div style={{ fontSize: 11, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Tree Structure
                </div>
                {tree && <TreeNode node={tree} highlighted={false} />}
                {points.length === 0 && (
                  <div style={{ color: s.text3, fontSize: 11, padding: 20, textAlign: 'center' }}>
                    Add points to see the tree
                  </div>
                )}
              </div>

              {selectedNode && (
                <div style={{ background: s.bg, border: `1px solid ${s.accent}40`, borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 10, color: s.text3, marginBottom: 4, fontFamily: s.mono, textTransform: 'uppercase', letterSpacing: 1 }}>Selected Node</div>
                  <div style={{ fontSize: 11, color: s.text2, fontFamily: s.mono }}>
                    box: ({selectedNode.x},{selectedNode.y}) to ({selectedNode.x + selectedNode.w},{selectedNode.y + selectedNode.h})
                  </div>
                  <div style={{ fontSize: 11, color: s.text2, fontFamily: s.mono }}>
                    size: {selectedNode.w}x{selectedNode.h} cells
                  </div>
                </div>
              )}

              <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 10, color: s.text3, marginBottom: 6, fontFamily: s.mono, textTransform: 'uppercase', letterSpacing: 1 }}>Stats</div>
                <div style={{ fontSize: 11, color: s.text2, fontFamily: s.mono }}>Nodes: {allNodes.length}</div>
                <div style={{ fontSize: 11, color: s.text2, fontFamily: s.mono }}>Leaf nodes: {allNodes.filter(n => !n.children).length}</div>
                <div style={{ fontSize: 11, color: s.text2, fontFamily: s.mono }}>Capacity: {CAPACITY} pts/node</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
