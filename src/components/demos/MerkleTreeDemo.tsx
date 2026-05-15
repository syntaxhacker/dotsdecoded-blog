import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController from './SpeedController'
import { getStepDelay } from './SpeedController'

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

interface TreeNode {
  id: string
  x: number
  y: number
  hashA: string
  hashB: string
  label: string
}

interface TreeEdge {
  from: string
  to: string
}

const TREE_NODES_A: TreeNode[] = [
  { id: 'root', x: 170, y: 24, hashA: 'b509e1', hashB: 'e72f4a', label: 'root' },
  { id: 'h12', x: 90, y: 82, hashA: '4d8ec2', hashB: 'f02b7d', label: 'h12' },
  { id: 'h34', x: 250, y: 82, hashA: '1c7d3f', hashB: '9a34e8', label: 'h34' },
  { id: 'h1', x: 35, y: 140, hashA: 'a3f2c1', hashB: 'a3f2c1', label: 'h1' },
  { id: 'h2', x: 145, y: 140, hashA: '7be19d', hashB: '9d4c8a', label: 'h2' },
  { id: 'h3', x: 205, y: 140, hashA: '2f6a53', hashB: '2f6a53', label: 'h3' },
  { id: 'h4', x: 315, y: 140, hashA: 'e8b37c', hashB: 'c15a92', label: 'h4' },
]

const TREE_NODES_B: TreeNode[] = TREE_NODES_A.map((nd) => ({
  ...nd,
  x: nd.x + 340,
}))

const KEY_LABELS = [
  { x: 35, y: 175, text: 'apple:red' },
  { x: 145, y: 175, text: 'berry:purple' },
  { x: 205, y: 175, text: 'citrus:orange' },
  { x: 315, y: 175, text: 'date:brown' },
]

const KEY_LABELS_B = KEY_LABELS.map((kl) => ({
  ...kl,
  x: kl.x + 340,
  text: kl.text === 'berry:purple' ? 'berry:green' : kl.text === 'date:brown' ? 'date:gold' : kl.text,
}))

const ALL_IDS = TREE_NODES_A.map((nd) => nd.id)

const STEPS = [
  { compare: null, msg: 'Two Merkle trees built from key-value pairs. Check if replicas are in sync.', done: [] as string[] },
  { compare: 'root', msg: 'Compare root hashes: b509e1 vs e72f4a -- different! Anti-entropy triggered.', done: [] as string[] },
  { compare: 'h12', msg: 'Walk down left subtree. h12 hashes differ: 4d8ec2 vs f02b7d.', done: ['root'] },
  { compare: 'h1', msg: 'Leaf h1 matches: a3f2c1 == a3f2c1. Range [apple] is in sync.', done: ['root', 'h12'] },
  { compare: 'h2', msg: 'Leaf h2 differs: 7be19d vs 9d4c8a. Found mismatch: berry changed from purple to green!', done: ['root', 'h12', 'h1'] },
  { compare: 'h34', msg: 'Walk down right subtree. h34 hashes differ: 1c7d3f vs 9a34e8.', done: ['root', 'h12', 'h1', 'h2'] },
  { compare: 'h3', msg: 'Leaf h3 matches: 2f6a53 == 2f6a53. Range [citrus] is in sync.', done: ['root', 'h12', 'h1', 'h2', 'h34'] },
  { compare: 'h4', msg: 'Leaf h4 differs: e8b37c vs c15a92. Found mismatch: date changed from brown to gold!', done: ['root', 'h12', 'h1', 'h2', 'h34', 'h3'] },
  { compare: null, msg: 'Comparison complete. 2 mismatches found (berry, date). Only 4 of 7 node pairs were compared.', done: ALL_IDS },
]

const EDGES: TreeEdge[] = [
  { from: 'root', to: 'h12' },
  { from: 'root', to: 'h34' },
  { from: 'h12', to: 'h1' },
  { from: 'h12', to: 'h2' },
  { from: 'h34', to: 'h3' },
  { from: 'h34', to: 'h4' },
]

function getHashStatus(nodeId: string, stepIdx: number, treeNodes: TreeNode[]): 'same' | 'different' | 'pending' | 'comparing' {
  const step = STEPS[stepIdx]
  if (!step) return 'pending'
  if (step.compare === nodeId) return 'comparing'
  if (step.done.includes(nodeId)) {
    const nd = treeNodes.find((n) => n.id === nodeId)
    if (nd && nd.hashA === nd.hashB) return 'same'
    return 'different'
  }
  return 'pending'
}

const TOTAL = STEPS.length

export default function MerkleTreeDemo() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  const goNext = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, TOTAL - 1))
  }, [])

  const goPrev = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const reset = useCallback(() => {
    setStep(0)
    setPlaying(false)
  }, [])

  useEffect(() => {
    if (!playing || step >= TOTAL - 1) return
    const delay = getStepDelay(1800, speed)
    const timer = setTimeout(() => goNext(), delay)
    return () => clearTimeout(timer)
  }, [playing, step, speed, goNext])

  const renderTree = (nodes: TreeNode[], keyLabels: typeof KEY_LABELS, offsetX: number) => {
    return (
      <g>
        {EDGES.map((edge) => {
          const from = nodes.find((n) => n.id === edge.from)
          const to = nodes.find((n) => n.id === edge.to)
          if (!from || !to) return null
          return (
            <line key={`${edge.from}-${edge.to}`}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke={s.border} strokeWidth={1.5}
            />
          )
        })}
        {nodes.map((node) => {
          const status = getHashStatus(node.id, step, TREE_NODES_A)
          let bg = s.bg3
          let border = s.border
          let borderW = 1
          if (status === 'comparing') {
            bg = `${s.yellow}20`
            border = s.yellow
            borderW = 2
          } else if (status === 'same') {
            bg = `${s.green}20`
            border = s.green
            borderW = 2
          } else if (status === 'different') {
            bg = `${s.red}20`
            border = s.red
            borderW = 2
          } else if (status === 'pending') {
            bg = s.bg3
            border = s.border
            borderW = 1
          }
          return (
            <g key={node.id}>
              <rect x={node.x - 32} y={node.y - 12} width={64} height={24} rx={5}
                fill={bg} stroke={border} strokeWidth={borderW}
                style={{ transition: 'all 0.3s' }}
              />
              <text x={node.x} y={node.y + 5} textAnchor="middle" fill={s.text2}
                fontFamily={s.mono} fontSize={10}
              >
                {node.id === 'root' || node.id.startsWith('h') ? node.label + ':' + node.hashA : node.hashA}
              </text>
            </g>
          )
        })}
        {keyLabels.map((kl) => (
          <text key={kl.text} x={kl.x} y={kl.y} textAnchor="middle"
            fill={s.text3} fontSize={9} fontFamily={s.mono}
          >
            {kl.text}
          </text>
        ))}
      </g>
    )
  }

  return (
    <DemoBoundary name="Merkle Tree Comparison">
      <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
        <div style={SEC}>
          <div style={H}>Merkle Tree Anti-Entropy</div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
            Each node builds a Merkle tree over its key-value pairs. Comparing root hashes quickly identifies divergent ranges.
          </p>

          <svg viewBox="0 0 720 210" style={{ width: '100%', height: 190, overflow: 'hidden', marginBottom: 16 }}>
            <text x={170} y={12} textAnchor="middle" fill={s.text3} fontSize={11} fontWeight={600}>Node A</text>
            <text x={510} y={12} textAnchor="middle" fill={s.text3} fontSize={11} fontWeight={600}>Node B</text>

            {renderTree(TREE_NODES_A, KEY_LABELS, 0)}
            {renderTree(TREE_NODES_B, KEY_LABELS_B, 340)}
          </svg>

          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: s.bg, border: `1px solid ${s.border}`,
            color: s.text, fontSize: 12, marginBottom: 16, minHeight: 20,
            fontFamily: s.mono, lineHeight: 1.5,
          }}>
            Step {step + 1}/{TOTAL}: {STEPS[step]?.msg}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={goPrev} disabled={step === 0} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 16px', color: step === 0 ? s.text3 : s.text2,
              cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: 13,
            }}>
              Prev
            </button>
            <button onClick={goNext} disabled={step >= TOTAL - 1} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 16px', color: step >= TOTAL - 1 ? s.text3 : s.text2,
              cursor: step >= TOTAL - 1 ? 'not-allowed' : 'pointer', fontSize: 13,
            }}>
              Next
            </button>
            <button onClick={() => setPlaying(!playing)} style={{
              background: playing ? s.red : s.green, border: 'none', borderRadius: 8,
              padding: '10px 20px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {playing ? 'Stop' : 'Auto Play'}
            </button>
            <button onClick={reset} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 16px', color: s.text2, cursor: 'pointer', fontSize: 13,
            }}>
              Reset
            </button>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
