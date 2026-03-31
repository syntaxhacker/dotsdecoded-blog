import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const MAX_KEYS = 3

interface BTreeNode {
  keys: number[]
  children: BTreeNode[]
}

function createNode(keys: number[], children: BTreeNode[] = []): BTreeNode {
  return { keys: [...keys], children: children.map(c => createNode([...c.keys], c.children.map(cc => createNode([...cc.keys], cc.children)))) }
}

function height(node: BTreeNode | null): number {
  if (!node) return 0
  if (node.children.length === 0) return 1
  return 1 + Math.max(...node.children.map(height))
}

function countKeys(node: BTreeNode | null): number {
  if (!node) return 0
  return node.keys.length + node.children.reduce((sum, c) => sum + countKeys(c), 0)
}

function insertIntoNode(root: BTreeNode, key: number): BTreeNode {
  const newRoot = createNode(root.keys, root.children)
  doInsert(newRoot, key)
  return newRoot
}

function doInsert(node: BTreeNode, key: number) {
  let i = 0
  while (i < node.keys.length && key > node.keys[i]) i++

  if (i < node.keys.length && node.keys[i] === key) return

  if (node.children.length === 0) {
    node.keys.splice(i, 0, key)
  } else {
    doInsert(node.children[i], key)
    if (node.children[i].keys.length > MAX_KEYS) {
      splitChild(node, i)
    }
  }
}

function splitChild(parent: BTreeNode, idx: number) {
  const child = parent.children[idx]
  const mid = Math.floor(child.keys.length / 2)
  const midKey = child.keys[mid]

  const leftKeys = child.keys.slice(0, mid)
  const rightKeys = child.keys.slice(mid + 1)
  const leftChildren = child.children.length > 0 ? child.children.slice(0, mid + 1) : []
  const rightChildren = child.children.length > 0 ? child.children.slice(mid + 1) : []

  parent.keys.splice(idx, 0, midKey)
  parent.children.splice(idx, 1,
    { keys: leftKeys, children: leftChildren },
    { keys: rightKeys, children: rightChildren }
  )
}

function buildInitialTree(): BTreeNode {
  const root: BTreeNode = { keys: [50], children: [] }
  root.children.push({ keys: [20, 35], children: [] })
  root.children.push({ keys: [65, 80], children: [] })
  return root
}

function searchPath(root: BTreeNode, key: number): { node: BTreeNode; direction: string; depth: number }[] {
  const path: { node: BTreeNode; direction: string; depth: number }[] = []
  function search(node: BTreeNode, depth: number) {
    path.push({ node, direction: 'checking root', depth })
    let i = 0
    while (i < node.keys.length && key > node.keys[i]) i++
    if (i < node.keys.length && node.keys[i] === key) {
      path[path.length - 1].direction = `found ${key} here`
      return
    }
    const dir = i === 0 ? 'go left' : `go right of ${node.keys[i - 1]}`
    path[path.length - 1].direction = `${key} ${key < node.keys[i] ? '<' : '>='} ${node.keys[i]}? ${dir}`
    if (node.children.length > 0) {
      search(node.children[i], depth + 1)
    }
  }
  search(root, 0)
  return path
}

function insertPath(root: BTreeNode, key: number): { node: BTreeNode; direction: string; depth: number }[] {
  const path: { node: BTreeNode; direction: string; depth: number }[] = []
  function trace(node: BTreeNode, depth: number) {
    path.push({ node, direction: 'checking root', depth })
    let i = 0
    while (i < node.keys.length && key > node.keys[i]) i++
    if (i < node.keys.length && node.keys[i] === key) {
      path[path.length - 1].direction = `${key} already exists`
      return
    }
    const dir = i === 0 ? 'go left' : `go right of ${node.keys[i - 1]}`
    path[path.length - 1].direction = `${key} ${key < node.keys[i] ? '<' : '>='} ${node.keys[i]}? ${dir}`
    if (node.children.length > 0) {
      trace(node.children[i], depth + 1)
    }
  }
  trace(root, 0)
  return path
}

interface LayoutNode {
  key: string
  x: number
  y: number
  keys: number[]
  highlight: 'none' | 'accent' | 'green' | 'red' | 'yellow'
  parentId: string | null
}

let nodeIdCounter = 0

function layoutTree(root: BTreeNode, highlights: Set<string> = new Set(), highlightType: 'none' | 'accent' | 'green' | 'red' | 'yellow' = 'none'): { nodes: LayoutNode[]; edges: [string, string][] } {
  nodeIdCounter = 0
  const nodes: LayoutNode[] = []
  const edges: [string, string][] = []

  function computeWidth(node: BTreeNode): number {
    if (node.children.length === 0) return 80
    const childWidths = node.children.map(computeWidth)
    return childWidths.reduce((a, b) => a + b, 0) + (node.children.length - 1) * 16
  }

  function layout(node: BTreeNode, x: number, y: number, parentId: string | null) {
    const id = `n${nodeIdCounter++}`
    const w = computeWidth(node)
    const isHighlighted = highlights.has(id)
    nodes.push({
      key: id,
      x: x + w / 2,
      y,
      keys: node.keys,
      highlight: isHighlighted ? highlightType : 'none',
      parentId,
    })
    if (node.children.length > 0) {
      const childWidths = node.children.map(computeWidth)
      const totalW = childWidths.reduce((a, b) => a + b, 0) + (node.children.length - 1) * 16
      let cx = x + w / 2 - totalW / 2
      for (let i = 0; i < node.children.length; i++) {
        layout(node.children[i], cx, y + 90, id)
        edges.push([id, `n${nodeIdCounter}`])
        cx += childWidths[i] + 16
      }
    }
  }

  const totalWidth = computeWidth(root)
  layout(root, 0, 0, null)
  return { nodes, edges }
}

const KEY_WIDTH = 32
const KEY_HEIGHT = 28
const NODE_PAD = 6

export default function BTreeDemo() {
  const [tree, setTree] = useState<BTreeNode>(buildInitialTree)
  const [mode, setMode] = useState<'insert' | 'search'>('insert')
  const [input, setInput] = useState('')
  const [animPath, setAnimPath] = useState<{ node: BTreeNode; direction: string; depth: number }[]>([])
  const [animStep, setAnimStep] = useState(-1)
  const [animating, setAnimating] = useState(false)
  const [foundResult, setFoundResult] = useState<'found' | 'notfound' | null>(null)
  const [splitFlash, setSplitFlash] = useState(false)
  const [lastSearchReads, setLastSearchReads] = useState(0)

  const handleInsert = useCallback(() => {
    const val = parseInt(input)
    if (isNaN(val) || val < 1 || val > 99 || animating) return

    const existing = countKeys(tree)
    let exists = false
    function checkExists(n: BTreeNode) {
      if (n.keys.includes(val)) exists = true
      n.children.forEach(checkExists)
    }
    checkExists(tree)
    if (exists) {
      setInput('')
      return
    }

    const path = insertPath(tree, val)
    setAnimPath(path)
    setAnimStep(0)
    setAnimating(true)
    setFoundResult(null)
  }, [input, tree, animating])

  const handleSearch = useCallback(() => {
    const val = parseInt(input)
    if (isNaN(val) || val < 1 || val > 99 || animating) return

    const path = searchPath(tree, val)
    setAnimPath(path)
    setAnimStep(0)
    setAnimating(true)
    setFoundResult(null)
  }, [input, tree, animating])

  useEffect(() => {
    if (animStep < 0 || animPath.length === 0) return

    if (animStep >= animPath.length) {
      if (mode === 'insert') {
        const val = parseInt(input)
        if (!isNaN(val)) {
          const newTree = insertIntoNode(tree, val)
          const newCount = countKeys(newTree)
          if (newCount > existingKeysRef.current) {
            setSplitFlash(true)
            setTimeout(() => setSplitFlash(false), 600)
          }
          setTree(newTree)
        }
      } else {
        const last = animPath[animPath.length - 1]
        setFoundResult(last.direction.startsWith('found') ? 'found' : 'notfound')
        setLastSearchReads(animPath.length)
      }
      setAnimating(false)
      setInput('')
      return
    }

    const timer = setTimeout(() => {
      setAnimStep(prev => prev + 1)
    }, 700)
    return () => clearTimeout(timer)
  }, [animStep, animPath, mode, input, tree])

  const existingKeysRef = { current: countKeys(tree) }

  useEffect(() => {
    existingKeysRef.current = countKeys(tree)
  }, [tree])

  const highlightedIds = new Set<string>()
  if (animStep >= 0 && animStep < animPath.length) {
    highlightedIds.add(`n${animStep}`)
  } else if (animStep >= animPath.length && animPath.length > 0) {
    highlightedIds.add(`n${animPath.length - 1}`)
  }

  const hlType = foundResult === 'found' ? 'green' as const
    : foundResult === 'notfound' ? 'red' as const
    : 'accent' as const

  const { nodes: layoutNodes, edges } = layoutTree(tree, highlightedIds, hlType)

  const treeHeight = height(tree)
  const totalKeys = countKeys(tree)

  const nodeMap = new Map(layoutNodes.map(n => [n.key, n]))

  const svgWidth = Math.max(400, layoutNodes.length > 0 ? Math.max(...layoutNodes.map(n => n.x)) + 60 : 400)
  const svgHeight = treeHeight * 90 + 40

  const currentDirection = animStep >= 0 && animStep < animPath.length
    ? animPath[animStep].direction
    : foundResult === 'found' ? 'Key found!'
    : foundResult === 'notfound' ? 'Key not found'
    : ''

  return (
    <DemoBoundary name="B-Tree Index">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${s.border}`, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: s.bg, borderRadius: 6, border: `1px solid ${s.border}` }}>
              <button
                onClick={() => { setMode('insert'); setAnimPath([]); setAnimStep(-1); setFoundResult(null); }}
                style={{
                  padding: '6px 14px',
                  fontSize: 13,
                  fontFamily: s.mono,
                  border: 'none',
                  borderRadius: 5,
                  cursor: 'pointer',
                  background: mode === 'insert' ? s.accent : 'transparent',
                  color: mode === 'insert' ? '#fff' : s.text3,
                  transition: 'all 0.2s',
                }}
              >
                Insert
              </button>
              <button
                onClick={() => { setMode('search'); setAnimPath([]); setAnimStep(-1); setFoundResult(null); }}
                style={{
                  padding: '6px 14px',
                  fontSize: 13,
                  fontFamily: s.mono,
                  border: 'none',
                  borderRadius: 5,
                  cursor: 'pointer',
                  background: mode === 'search' ? s.accent : 'transparent',
                  color: mode === 'search' ? '#fff' : s.text3,
                  transition: 'all 0.2s',
                }}
              >
                Search
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 180 }}>
              <input
                type="number"
                min={1}
                max={99}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') mode === 'insert' ? handleInsert() : handleSearch() }}
                placeholder="1-99"
                disabled={animating}
                style={{
                  width: 72,
                  padding: '6px 10px',
                  fontSize: 13,
                  fontFamily: s.mono,
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: 6,
                  color: s.text,
                  outline: 'none',
                }}
              />
              <button
                onClick={mode === 'insert' ? handleInsert : handleSearch}
                disabled={animating || input === ''}
                style={{
                  padding: '6px 14px',
                  fontSize: 13,
                  fontFamily: s.mono,
                  border: `1px solid ${mode === 'insert' ? s.green : s.accent}`,
                  borderRadius: 6,
                  cursor: animating || input === '' ? 'not-allowed' : 'pointer',
                  background: animating || input === '' ? s.bg3 : mode === 'insert' ? 'rgba(61,214,140,0.15)' : 'rgba(91,141,239,0.15)',
                  color: animating || input === '' ? s.text3 : mode === 'insert' ? s.green : s.accent,
                  transition: 'all 0.2s',
                }}
              >
                {mode === 'insert' ? 'Insert' : 'Search'}
              </button>
              <button
                onClick={() => {
                  setTree(buildInitialTree())
                  setAnimPath([])
                  setAnimStep(-1)
                  setAnimating(false)
                  setFoundResult(null)
                  setLastSearchReads(0)
                  setInput('')
                }}
                style={{
                  padding: '6px 14px',
                  fontSize: 13,
                  fontFamily: s.mono,
                  border: `1px solid ${s.border}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: s.text3,
                  transition: 'all 0.2s',
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {currentDirection && (
            <div style={{
              padding: '10px 16px',
              background: foundResult === 'found' ? 'rgba(61,214,140,0.08)' : foundResult === 'notfound' ? 'rgba(232,93,93,0.08)' : 'rgba(91,141,239,0.08)',
              borderBottom: `1px solid ${s.border}`,
              fontSize: 13,
              fontFamily: s.mono,
              color: foundResult === 'found' ? s.green : foundResult === 'notfound' ? s.red : s.accent,
            }}>
              Step {Math.min(animStep + 1, animPath.length)}/{animPath.length}: {currentDirection}
            </div>
          )}

          <div style={{ padding: '20px 16px', background: splitFlash ? 'rgba(224,176,64,0.06)' : 'transparent', transition: 'background 0.3s' }}>
            <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ display: 'block', overflow: 'visible' }}>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {edges.map(([fromId, toId]) => {
                const from = nodeMap.get(fromId)
                const to = nodeMap.get(toId)
                if (!from || !to) return null
                const fromHighlighted = highlightedIds.has(fromId)
                const toHighlighted = highlightedIds.has(toId)
                return (
                  <line
                    key={`${fromId}-${toId}`}
                    x1={from.x}
                    y1={from.y + KEY_HEIGHT / 2 + NODE_PAD}
                    x2={to.x}
                    y2={to.y - KEY_HEIGHT / 2 - NODE_PAD}
                    stroke={toHighlighted ? s.accent : s.border}
                    strokeWidth={toHighlighted ? 2 : 1}
                    opacity={toHighlighted ? 1 : 0.6}
                    style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                  />
                )
              })}
              {layoutNodes.map(ln => {
                const nodeW = ln.keys.length * (KEY_WIDTH + 4) - 4 + NODE_PAD * 2
                const borderColor = ln.highlight === 'green' ? s.green
                  : ln.highlight === 'red' ? s.red
                  : ln.highlight === 'yellow' ? s.yellow
                  : ln.highlight === 'accent' ? s.accent
                  : s.border2
                const bgColor = ln.highlight === 'green' ? 'rgba(61,214,140,0.12)'
                  : ln.highlight === 'red' ? 'rgba(232,93,93,0.12)'
                  : ln.highlight === 'yellow' ? 'rgba(224,176,64,0.12)'
                  : ln.highlight === 'accent' ? 'rgba(91,141,239,0.12)'
                  : s.bg3
                const filterVal = ln.highlight !== 'none' ? 'url(#glow)' : undefined

                return (
                  <g key={ln.key}>
                    <rect
                      x={ln.x - nodeW / 2}
                      y={ln.y - KEY_HEIGHT / 2 - NODE_PAD}
                      width={nodeW}
                      height={KEY_HEIGHT + NODE_PAD * 2}
                      rx={8}
                      fill={bgColor}
                      stroke={borderColor}
                      strokeWidth={ln.highlight !== 'none' ? 2 : 1}
                      filter={filterVal}
                      style={{ transition: 'fill 0.3s, stroke 0.3s' }}
                    />
                    {ln.keys.map((k, ki) => {
                      const kx = ln.x - nodeW / 2 + NODE_PAD + ki * (KEY_WIDTH + 4)
                      return (
                        <text
                          key={ki}
                          x={kx + KEY_WIDTH / 2}
                          y={ln.y + 1}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={ln.highlight !== 'none' ? '#fff' : s.text}
                          fontSize={14}
                          fontFamily={s.mono}
                          fontWeight={600}
                          style={{ transition: 'fill 0.3s' }}
                        >
                          {k}
                        </text>
                      )
                    })}
                  </g>
                )
              })}
            </svg>
          </div>

          <div style={{
            display: 'flex',
            gap: 20,
            padding: '10px 16px',
            borderTop: `1px solid ${s.border}`,
            fontSize: 12,
            fontFamily: s.mono,
            color: s.text3,
            flexWrap: 'wrap',
          }}>
            <span>Tree height: <span style={{ color: s.text2 }}>{treeHeight}</span></span>
            <span>Total keys: <span style={{ color: s.text2 }}>{totalKeys}</span></span>
            {lastSearchReads > 0 && (
              <span>Last search reads: <span style={{ color: s.accent }}>{lastSearchReads}</span></span>
            )}
            <span style={{ marginLeft: 'auto', color: s.text3, fontSize: 11 }}>Order 4 (max 3 keys/node)</span>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
