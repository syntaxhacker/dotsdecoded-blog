import { useState, useEffect } from 'react'
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

type Algo = 'round-robin' | 'weighted' | 'least-connections' | 'ip-hash'

const algos: { key: Algo; name: string; desc: string; color: string }[] = [
  { key: 'round-robin', name: 'Round Robin', desc: 'Cycles through servers in order. Simple and fair when servers are identical.', color: s.accent },
  { key: 'weighted', name: 'Weighted', desc: 'Stronger servers get more traffic. Weight 4:3:2:1 means Server A gets ~40% of requests.', color: s.purple },
  { key: 'least-connections', name: 'Least Connections', desc: 'Sends to the server with the fewest active connections. Good when requests take variable time.', color: s.green },
  { key: 'ip-hash', name: 'IP Hash', desc: 'Same client IP always hits the same server. Provides session stickiness.', color: s.orange },
]

const serverNames = ['Server A', 'Server B', 'Server C', 'Server D']
const serverColors = [s.accent, s.green, s.orange, s.purple]
const weights = [4, 3, 2, 1]
const clientIps = ['10.0.1.5', '10.0.1.5', '10.0.2.10', '10.0.1.5', '10.0.2.10', '10.0.3.20', '10.0.1.5', '10.0.3.20']

function hashIp(ip: string): number {
  let h = 0
  for (let i = 0; i < ip.length; i++) h = ((h << 5) - h + ip.charCodeAt(i)) | 0
  return Math.abs(h) % 4
}

function pickServer(algo: Algo, idx: number, conns: number[], ip: string): number {
  switch (algo) {
    case 'round-robin': return idx % 4
    case 'weighted': {
      const total = weights.reduce((a, b) => a + b, 0)
      let r = Math.random() * total
      for (let j = 0; j < weights.length; j++) {
        r -= weights[j]
        if (r <= 0) return j
      }
      return 3
    }
    case 'least-connections': {
      const min = Math.min(...conns)
      return conns.indexOf(min)
    }
    case 'ip-hash': return hashIp(ip)
  }
}

interface LogEntry {
  idx: number
  ip: string
  serverIdx: number
  reason: string
}

export default function LoadBalanceAlgoDemo() {
  const [algo, setAlgo] = useState<Algo>('round-robin')
  const [conns, setConns] = useState([0, 0, 0, 0])
  const [log, setLog] = useState<LogEntry[]>([])
  const [reqCount, setReqCount] = useState(0)
  const [highlight, setHighlight] = useState(-1)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || reqCount >= clientIps.length) {
      if (reqCount >= clientIps.length) setRunning(false)
      return
    }
    const t = setTimeout(() => {
      sendRequest()
    }, 700)
    return () => clearTimeout(t)
  }, [running, reqCount])

  const sendRequest = () => {
    if (reqCount >= clientIps.length) return
    const ip = clientIps[reqCount]
    const serverIdx = pickServer(algo, reqCount, conns, ip)
    let reason = ''
    switch (algo) {
      case 'round-robin': reason = `Request #${reqCount + 1} -> index ${reqCount % 4} in cycle`; break
      case 'weighted': reason = `Weighted random: Server A (w:4), B (w:3), C (w:2), D (w:1)`; break
      case 'least-connections': reason = `Server ${serverNames[serverIdx]} has ${conns[serverIdx]} connections (fewest)`; break
      case 'ip-hash': reason = `hash("${ip}") % 4 = ${serverIdx}`; break
    }
    setConns(prev => {
      const c = [...prev]
      c[serverIdx]++
      return c
    })
    setLog(prev => [...prev, { idx: reqCount, ip, serverIdx, reason }])
    setHighlight(serverIdx)
    setReqCount(prev => prev + 1)
    setTimeout(() => setHighlight(-1), 400)
  }

  const reset = () => {
    setConns([0, 0, 0, 0])
    setLog([])
    setReqCount(0)
    setHighlight(-1)
    setRunning(false)
  }

  const algoInfo = algos.find(a => a.key === algo)!

  return (
    <DemoBoundary name="Load Balancing Algorithms">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Load Balancing Algorithms</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Different algorithms distribute traffic differently. Send requests and watch how each algorithm decides which server handles them.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {algos.map(a => (
            <button key={a.key} onClick={() => { setAlgo(a.key); reset() }} style={{
              background: algo === a.key ? a.color : s.bg3,
              border: `1px solid ${algo === a.key ? a.color : s.border}`,
              borderRadius: 8, padding: '8px 14px', color: algo === a.key ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
            }}>{a.name}</button>
          ))}
        </div>
        <div style={{ color: s.text3, fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>{algoInfo.desc}</div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Servers</div>
            {serverNames.map((name, i) => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
                background: highlight === i ? `${serverColors[i]}20` : s.bg3,
                border: `1px solid ${highlight === i ? serverColors[i] : s.border}`,
                borderRadius: 8, padding: '10px 14px', transition: 'all 0.3s',
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: conns[i] > 0 ? serverColors[i] : s.text3, transition: 'all 0.3s',
                }} />
                <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 64 }}>{name}</span>
                {algo === 'weighted' && (
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>w:{weights[i]}</span>
                )}
                <div style={{ flex: 1, height: 4, background: s.bg, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (conns[i] / Math.max(1, clientIps.length)) * 100)}%`,
                    height: '100%', background: serverColors[i], borderRadius: 2, transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 12, minWidth: 20, textAlign: 'right' }}>{conns[i]}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Request Log</div>
            <div style={{ background: s.bg3, borderRadius: 8, padding: 10, maxHeight: 280, overflowY: 'auto' }}>
              {log.length === 0 && (
                <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: 20 }}>Press Send or Auto to start</div>
              )}
              {log.map((entry, i) => (
                <div key={i} style={{
                  padding: '6px 0', borderBottom: i < log.length - 1 ? `1px solid ${s.border}` : 'none',
                  opacity: i === log.length - 1 ? 1 : 0.7,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>{entry.ip}</span>
                    <span style={{ color: serverColors[entry.serverIdx], fontFamily: s.mono, fontSize: 11 }}>
                      {serverNames[entry.serverIdx]}
                    </span>
                  </div>
                  <div style={{ color: s.text3, fontSize: 10 }}>{entry.reason}</div>
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
          <button onClick={() => setRunning(!running)} disabled={reqCount >= clientIps.length} style={{
            background: running ? s.orange : algoInfo.color, border: 'none', borderRadius: 8, padding: '8px 20px',
            color: '#fff', cursor: reqCount >= clientIps.length ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
            opacity: reqCount >= clientIps.length ? 0.6 : 1,
          }}>
            {reqCount >= clientIps.length ? 'Done' : running ? 'Pause' : 'Auto Send'}
          </button>
          <button onClick={sendRequest} disabled={reqCount >= clientIps.length} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '8px 20px',
            color: '#fff', cursor: reqCount >= clientIps.length ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
            opacity: reqCount >= clientIps.length ? 0.6 : 1,
          }}>Send</button>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
