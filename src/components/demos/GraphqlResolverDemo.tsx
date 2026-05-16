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

interface TreeNode {
  label: string
  children: TreeNode[]
}

const queryTree: TreeNode = {
  label: 'Query',
  children: [
    {
      label: 'user(id: "1")',
      children: [
        { label: 'name', children: [] },
        { label: 'email', children: [] },
        {
          label: 'posts',
          children: [
            {
              label: 'post: 0',
              children: [
                { label: 'title', children: [] },
                { label: 'body', children: [] },
              ],
            },
            {
              label: 'post: 1',
              children: [
                { label: 'title', children: [] },
                { label: 'body', children: [] },
              ],
            },
          ],
        },
      ],
    },
  ],
}

interface ResolvedNode {
  label: string
  resolved: boolean
  data: string
}

function flattenTree(node: TreeNode, parentLabel: string = ''): ResolvedNode[] {
  const result: ResolvedNode[] = []
  const isLeaf = node.children.length === 0
  const label = parentLabel ? `${parentLabel}.${node.label}` : node.label
  result.push({
    label: isLeaf ? `${node.label}` : node.label,
    resolved: false,
    data: '',
  })
  for (const child of node.children) {
    result.push(...flattenTree(child, node.label))
  }
  return result
}

const nodes = flattenTree(queryTree)

const resolvedData: Record<string, string> = {
  'Query': '{',
  'Query.user(id: "1")': 'User: {',
  'Query.user(id: "1").name': '"Alice Wonderland"',
  'Query.user(id: "1").email': '"alice@example.com"',
  'Query.user(id: "1").posts': 'posts: [',
  'Query.user(id: "1").posts.post: 0': '{',
  'Query.user(id: "1").posts.post: 0.title': '"Hello World"',
  'Query.user(id: "1").posts.post: 0.body': '"First post content"',
  'Query.user(id: "1").posts.post: 1': '{',
  'Query.user(id: "1").posts.post: 1.title': '"GraphQL is great"',
  'Query.user(id: "1").posts.post: 1.body': '"Second post content"',
}

const nodeDepths: Record<string, number> = {}
let d = 0
nodes.forEach((n, i) => {
  if (n.label === 'name' || n.label === 'email' || n.label === 'title' || n.label === 'body') {
    nodeDepths[n.label + i] = 3
  } else if (n.label === 'User:' || n.label === 'post: 0' || n.label === 'post: 1' || n.label === '{' || n.label === 'posts: [') {
    nodeDepths[n.label + i] = 2
  } else if (n.label.startsWith('post:') || n.label.startsWith('{') || n.label.startsWith('posts') || n.label.startsWith('User')) {
    nodeDepths[n.label + i] = 2
  } else if (n.label.startsWith('Query.user') || n.label.startsWith('user')) {
    nodeDepths[n.label + i] = 1
  } else {
    nodeDepths[n.label + i] = 0
  }
})

function getDepth(label: string, idx: number): number {
  if (label.startsWith('Query')) return 0
  if (label.includes('user(') || label.includes('User:')) return 1
  if (label.includes('posts') || label.includes('{') || label.includes('[') || label.startsWith('post:')) return 2
  return 3
}

function getIndent(level: number): string {
  return '  '.repeat(level)
}

export default function GraphqlResolverDemo() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [resolved, setResolved] = useState<Set<number>>(new Set())

  const totalSteps = nodes.length

  const reset = useCallback(() => {
    setStep(0)
    setResolved(new Set())
    setPlaying(false)
  }, [])

  const nextStep = useCallback(() => {
    setStep((prev) => {
      const next = prev + 1
      if (next <= totalSteps) {
        setResolved((r) => new Set(r).add(next - 1))
      }
      return Math.min(next, totalSteps)
    })
  }, [totalSteps])

  useEffect(() => {
    if (!playing) return
    if (step >= totalSteps) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(nextStep, 600)
    return () => clearTimeout(timer)
  }, [playing, step, totalSteps, nextStep])

  return (
    <DemoBoundary name="GraphQL Resolver Execution">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
        <button onClick={nextStep} disabled={step >= totalSteps} style={{
          background: step >= totalSteps ? s.bg3 : s.accent, border: 'none', borderRadius: 8,
          padding: '10px 24px', color: step >= totalSteps ? s.text3 : '#fff',
          cursor: step >= totalSteps ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
        }}>Next Step</button>
        <button onClick={() => setPlaying(!playing)} style={{
          background: playing ? s.red : s.green, border: 'none', borderRadius: 8,
          padding: '10px 24px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>{playing ? 'Pause' : 'Auto Play'}</button>
        <button onClick={reset} style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: '10px 20px', color: s.text2, cursor: 'pointer', fontSize: 13,
        }}>Reset</button>
        <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 12, alignSelf: 'center', marginLeft: 'auto' }}>
          Step {step}/{totalSteps}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: s.bg2, borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Query Tree
          </div>
          <div style={{ fontFamily: s.mono, fontSize: 13, lineHeight: 1.8 }}>
            {nodes.map((n, i) => {
              const dep = getDepth(n.label, i)
              const isResolved = resolved.has(i)
              const isCurrent = i === step && step < totalSteps
              return (
                <div key={i} style={{
                  paddingLeft: dep * 16,
                  background: isCurrent ? `${s.accent}22` : isResolved ? `${s.green}11` : 'transparent',
                  borderRadius: 4,
                  transition: 'all 0.3s',
                  borderLeft: isCurrent ? `2px solid ${s.accent}` : isResolved ? `2px solid ${s.green}` : '2px solid transparent',
                  color: isCurrent ? s.accent : isResolved ? s.green : s.text3,
                }}>
                  <span>{n.label}</span>
                  {isResolved && resolvedData[n.label] && (
                    <span style={{ color: s.text2, marginLeft: 8 }}>
                      = {resolvedData[n.label]}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ flex: 1, background: s.bg2, borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Resolved Data
          </div>
          <div style={{ fontFamily: s.mono, fontSize: 13, lineHeight: 1.8, color: s.text, whiteSpace: 'pre-wrap' }}>
            {(() => {
              let output = ''
              for (let i = 0; i < Math.min(step, totalSteps); i++) {
                const n = nodes[i]
                const dep = getDepth(n.label, i)
                const data = resolvedData[n.label]
                if (data === '{' || data === '[') {
                  output += `${getIndent(dep)}${n.label} ${data}\n`
                } else if (data?.startsWith('{') || data?.startsWith('[') || data === 'User: {' || data === 'posts: [') {
                  output += `${getIndent(dep)}${n.label}: ${data}\n`
                } else if (data) {
                  output += `${getIndent(dep)}${n.label}: ${data}\n`
                } else {
                  const d = getDepth(n.label, i)
                  output += `${getIndent(d)}${n.label}\n`
                }
              }
              if (step === totalSteps) {
                output += '}'
              }
              return output
            })()}
            {(step > 0 && step < totalSteps) && (
              <span style={{ color: s.text3, animation: 'pulse 0.8s infinite' }}>|</span>
            )}
          </div>
          <style>{`
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
          `}</style>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
