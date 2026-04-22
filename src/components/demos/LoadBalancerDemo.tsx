import { useState, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

const algorithms = [
  { name: 'Round Robin', desc: 'Cycles through servers in order', color: s.accent },
  { name: 'Least Connections', desc: 'Sends to server with fewest active connections', color: s.green },
  { name: 'IP Hash', desc: 'Same client IP always goes to same server', color: s.orange },
  { name: 'Weighted', desc: 'Distributes based on server capacity weights', color: s.purple },
]

const serverNames = ['Server A', 'Server B', 'Server C', 'Server D']

function roundRobin(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i % serverNames.length)
}

function leastConnections(requests: number[][]): number[] {
  const conns = [0, 0, 0, 0]
  return requests.map(() => {
    const min = Math.min(...conns)
    const idx = conns.indexOf(min)
    conns[idx]++
    return idx
  })
}

function ipHash(ips: string[]): number[] {
  return ips.map(ip => {
    let hash = 0
    for (let i = 0; i < ip.length; i++) hash = ((hash << 5) - hash + ip.charCodeAt(i)) | 0
    return Math.abs(hash) % serverNames.length
  })
}

function weighted(weights: number[], count: number): number[] {
  const total = weights.reduce((a, b) => a + b, 0)
  const result: number[] = []
  for (let i = 0; i < count; i++) {
    let r = Math.random() * total
    for (let j = 0; j < weights.length; j++) {
      r -= weights[j]
      if (r <= 0) { result.push(j); break }
    }
    if (result.length <= i) result.push(weights.length - 1)
  }
  return result
}

const clientIps = [
  '192.168.1.10', '10.0.0.5', '172.16.0.22', '192.168.1.10',
  '10.0.0.5', '203.0.113.44', '192.168.1.10', '172.16.0.22',
  '10.0.0.5', '203.0.113.44', '192.168.1.10', '10.0.0.5',
]

export default function LoadBalancerDemo() {
  const [selectedAlgo, setSelectedAlgo] = useState(0)
  const [running, setRunning] = useState(false)
  const [reqIdx, setReqIdx] = useState(-1)
  const [speed, setSpeed] = useState(1)
  const [assignments, setAssignments] = useState<number[]>([])
  const [serverLoad, setServerLoad] = useState([0, 0, 0, 0])

  useEffect(() => {
    if (!running || reqIdx >= clientIps.length - 1) {
      if (reqIdx >= clientIps.length - 1) setRunning(false)
      return
    }
    const t = setTimeout(() => {
      const next = reqIdx + 1
      setReqIdx(next)
      let dist: number[]
      switch (selectedAlgo) {
        case 0: dist = roundRobin(next + 1); break
        case 1: dist = leastConnections([[]]); break
        case 2: dist = ipHash(clientIps.slice(0, next + 1)); break
        case 3: dist = weighted([4, 3, 2, 1], next + 1); break
        default: dist = roundRobin(next + 1)
      }
      setAssignments(dist.slice(0, next + 1))
      const load = [0, 0, 0, 0]
      dist.slice(0, next + 1).forEach(d => load[d]++)
      setServerLoad(load)
    }, getStepDelay(600, speed))
    return () => clearTimeout(t)
  }, [running, reqIdx, speed, selectedAlgo])

  const reset = () => {
    setReqIdx(-1)
    setRunning(false)
    setAssignments([])
    setServerLoad([0, 0, 0, 0])
  }

  const serverColors = [s.accent, s.green, s.orange, s.purple]
  const weights = [4, 3, 2, 1]

  return (
    <DemoBoundary name="Load Balancer">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Load Balancer</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          A load balancer distributes traffic across servers. Different algorithms make different trade-offs. Watch how 12 requests get distributed.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {algorithms.map((algo, idx) => (
            <button key={algo.name} onClick={() => { setSelectedAlgo(idx); reset() }} style={{
              background: selectedAlgo === idx ? algo.color : s.bg3,
              border: `1px solid ${selectedAlgo === idx ? algo.color : s.border}`,
              borderRadius: 8, padding: '8px 16px', color: selectedAlgo === idx ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
            }}>{algo.name}</button>
          ))}
          <div style={{ flex: 1 }} />
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ color: s.text3, fontSize: 12, marginBottom: 12 }}>{algorithms[selectedAlgo].desc}</div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Servers</div>
            {serverNames.map((name, idx) => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
                background: assignments[reqIdx] === idx ? `${serverColors[idx]}15` : s.bg3,
                border: `1px solid ${assignments[reqIdx] === idx ? serverColors[idx] : s.border}`,
                borderRadius: 8, padding: '10px 14px', transition: 'all 0.3s',
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: serverLoad[idx] > 0 ? serverColors[idx] : s.text3,
                  transition: 'all 0.3s',
                }} />
                <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 70 }}>{name}</span>
                {selectedAlgo === 3 && (
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>w:{weights[idx]}</span>
                )}
                <div style={{ flex: 1, height: 4, background: s.bg, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${(serverLoad[idx] / Math.max(1, clientIps.length)) * 100}%`,
                    height: '100%', background: serverColors[idx],
                    borderRadius: 2, transition: 'all 0.3s',
                  }} />
                </div>
                <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 12, minWidth: 24, textAlign: 'right' }}>
                  {serverLoad[idx]}
                </span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Request Log</div>
            <div style={{ background: s.bg3, borderRadius: 8, padding: 12, maxHeight: 240, overflowY: 'auto' }}>
              {assignments.length === 0 && (
                <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: 20 }}>Press Play to send requests</div>
              )}
              {assignments.map((srv, idx) => (
                <div key={idx} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '4px 0',
                  borderBottom: idx < assignments.length - 1 ? `1px solid ${s.border}` : 'none',
                  opacity: idx === reqIdx ? 1 : 0.6,
                }}>
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>{clientIps[idx]}</span>
                  <span style={{ color: s.text3, fontSize: 11 }}>&rarr;</span>
                  <span style={{ color: serverColors[srv], fontFamily: s.mono, fontSize: 11 }}>{serverNames[srv]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={() => setRunning(!running)} disabled={reqIdx >= clientIps.length - 1} style={{
            background: running ? s.orange : algorithms[selectedAlgo].color, border: 'none', borderRadius: 8, padding: '8px 20px',
            color: '#fff', cursor: reqIdx >= clientIps.length - 1 ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
            opacity: reqIdx >= clientIps.length - 1 ? 0.6 : 1,
          }}>
            {reqIdx >= clientIps.length - 1 ? 'Done' : running ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
