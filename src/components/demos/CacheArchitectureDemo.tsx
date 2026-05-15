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

interface Step {
  label: string
  node: number
  desc: string
}

const getSteps = (op: 'get' | 'set'): Step[] => {
  if (op === 'get') {
    return [
      { label: 'Client sends GET', node: 0, desc: 'GET user:profile:42' },
      { label: 'Cache client library', node: 1, desc: 'Hash key -> slot 1234, route to shard 2' },
      { label: 'Redis Cluster proxy', node: 2, desc: 'Forward to master of shard 2' },
      { label: 'Master (shard 2)', node: 3, desc: 'HGET user:profile:42 -> found! Return value' },
      { label: 'Cluster bus sync', node: 4, desc: 'Gossip protocol: update access metadata' },
      { label: 'Sentinel health check', node: 5, desc: 'All nodes healthy, no failover needed' },
      { label: 'Response to client', node: 0, desc: 'Return { name: "Alice", avatar: "..." }' },
    ]
  }
  return [
    { label: 'Client sends SET', node: 0, desc: 'SET user:profile:42 { name: "Alice" }' },
    { label: 'Cache client library', node: 1, desc: 'Hash key -> slot 1234, route to shard 2' },
    { label: 'Redis Cluster proxy', node: 2, desc: 'Forward write to master of shard 2' },
    { label: 'Master (shard 2)', node: 3, desc: 'HSET user:profile:42 value, update in-memory' },
    { label: 'Replicate to replicas', node: 4, desc: 'Async replication to replica-1, replica-2' },
    { label: 'RDB snapshot', node: 6, desc: 'Background save to disk (every 5 min)' },
    { label: 'AOF log append', node: 6, desc: 'Append-only log write (every 1 sec)' },
  ]
}

const nodeLabels = [
  'Client / App',
  'Cache Client Library',
  'Redis Cluster Proxy',
  'Shard Master',
  'Replicas',
  'Sentinel',
  'Persistence',
]

const nodeColors = [
  s.accent, s.green, s.purple, s.accent, s.orange, s.red, s.yellow,
]

const nodeIcons = [
  'C', 'L', 'P', 'M', 'R', 'S', 'D',
]

const nodeDescriptions = [
  'Your application server making cache requests',
  'Smart client that hashes keys and routes to the right shard',
  'Cluster management layer for request routing and failover',
  'Primary node for a shard — handles all writes',
  'Read-only copies of shard data for read scaling and HA',
  'Monitors masters, auto-promotes replicas on failure',
  'RDB snapshots + AOF append-only log for durability',
]

export default function CacheArchitectureDemo() {
  const [operation, setOperation] = useState<'get' | 'set'>('get')
  const [step, setStep] = useState(-1)
  const [running, setRunning] = useState(false)
  const [highlight, setHighlight] = useState<number | null>(null)
  const [activeDesc, setActiveDesc] = useState('')

  const steps = getSteps(operation)

  const run = useCallback(() => {
    if (running) return
    setRunning(true)
    setStep(0)
    setActiveDesc('')
  }, [running])

  const reset = useCallback(() => {
    setRunning(false)
    setStep(-1)
    setHighlight(null)
    setActiveDesc('')
  }, [])

  useEffect(() => {
    if (!running || step < 0) return
    if (step >= steps.length) {
      setRunning(false)
      setStep(-1)
      setHighlight(null)
      setActiveDesc('')
      return
    }
    const st = steps[step]
    setHighlight(st.node)
    setActiveDesc(st.desc)
    const timer = setTimeout(() => {
      setStep(prev => prev + 1)
    }, 700)
    return () => clearTimeout(timer)
  }, [running, step, steps])

  const currentStep = step >= 0 && step < steps.length ? steps[step] : null

  return (
    <DemoBoundary name="Cache Architecture">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>
        Full Redis Cluster Architecture
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Trace a {operation.toUpperCase()} request through every layer of the system.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => { setOperation('get'); reset() }}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
            background: operation === 'get' ? s.accent : s.bg3,
            border: `1px solid ${operation === 'get' ? s.accent : s.border}`,
            color: '#fff', fontSize: 13, fontWeight: operation === 'get' ? 600 : 400,
          }}
        >
          GET Request
        </button>
        <button
          onClick={() => { setOperation('set'); reset() }}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
            background: operation === 'set' ? s.green : s.bg3,
            border: `1px solid ${operation === 'set' ? s.green : s.border}`,
            color: '#fff', fontSize: 13, fontWeight: operation === 'set' ? 600 : 400,
          }}
        >
          SET Request
        </button>
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16,
      }}>
        {nodeLabels.map((label, i) => {
          const isHighlighted = highlight === i
          const isInPath = steps.some(st => st.node === i)
          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8,
                background: isHighlighted
                  ? `${nodeColors[i]}25`
                  : 'transparent',
                border: `1px solid ${
                  isHighlighted ? nodeColors[i]
                  : isInPath ? s.border2
                  : 'transparent'
                }`,
                transition: 'all 0.3s ease',
                cursor: 'default',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: isHighlighted ? nodeColors[i] : s.bg3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isHighlighted ? '#fff' : s.text3,
                fontSize: 12, fontWeight: 700, fontFamily: s.mono,
                flexShrink: 0, transition: 'all 0.3s',
              }}>
                {nodeIcons[i]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: isHighlighted ? nodeColors[i] : s.text,
                  fontSize: 13, fontWeight: isHighlighted ? 600 : 400,
                  transition: 'color 0.3s',
                }}>
                  {label}
                </div>
                <div style={{
                  color: s.text3, fontSize: 10, marginTop: 1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {nodeDescriptions[i]}
                </div>
              </div>
              {isHighlighted && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: nodeColors[i], flexShrink: 0,
                  animation: 'pulse 0.5s ease-in-out infinite',
                }} />
              )}
            </div>
          )
        })}
      </div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`,
        borderRadius: 10, padding: '12px 16px', marginBottom: 16,
        minHeight: 48,
      }}>
        {currentStep ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: nodeColors[currentStep.node],
            }} />
            <div>
              <span style={{
                color: nodeColors[currentStep.node],
                fontFamily: s.mono, fontSize: 10, fontWeight: 600,
                marginRight: 8,
              }}>
                {currentStep.label}
              </span>
              <span style={{ color: s.text2, fontSize: 12 }}>{currentStep.desc}</span>
            </div>
          </div>
        ) : (
          <div style={{ color: s.text3, fontSize: 13, textAlign: 'center', paddingTop: 6 }}>
            Click "Run Trace" to see the request flow
          </div>
        )}
      </div>

      <button
        onClick={running ? reset : run}
        style={{
          width: '100%', padding: '10px 0', borderRadius: 8, cursor: 'pointer',
          background: running ? s.red : s.accent, border: 'none',
          color: '#fff', fontSize: 13, fontWeight: 600,
          transition: 'background 0.2s',
        }}
      >
        {running ? 'Reset' : 'Run Trace'}
      </button>
    </div>
    </DemoBoundary>
  )
}
