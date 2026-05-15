import { useState } from 'react'
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

interface NodeState {
  ts: number
  inWrite: boolean
  inRead: boolean
}

export default function QuorumNodesDemo() {
  const [n, setN] = useState(3)
  const [w, setW] = useState(2)
  const [r, setR] = useState(2)
  const [writeTs, setWriteTs] = useState(0)
  const [nodes, setNodes] = useState<NodeState[]>(() =>
    Array.from({ length: 3 }, () => ({ ts: 0, inWrite: false, inRead: false }))
  )
  const [lastResult, setLastResult] = useState<string>('')
  const [readTs, setReadTs] = useState<number | null>(null)
  const [consistent, setConsistent] = useState<boolean | null>(null)
  const [latestWriteTs, setLatestWriteTs] = useState(0)

  const guaranteed = r + w > n

  const updateN = (val: number) => {
    setN(val)
    setNodes(Array.from({ length: val }, () => ({ ts: 0, inWrite: false, inRead: false })))
    setWriteTs(0)
    setLatestWriteTs(0)
    setLastResult('')
    setReadTs(null)
    setConsistent(null)
  }

  const doWrite = () => {
    const newTs = writeTs + 1
    setWriteTs(newTs)
    setLatestWriteTs(newTs)
    setReadTs(null)
    setConsistent(null)

    const active = nodes.map((nd, i) => i).sort(() => Math.random() - 0.5).slice(0, w)
    setNodes(prev => prev.map((nd, i) => ({
      ...nd,
      ts: active.includes(i) ? newTs : nd.ts,
      inWrite: active.includes(i),
    })))
    setLastResult(`Write (ts=${newTs}) sent to ${w} of ${n} nodes`)

    setTimeout(() => {
      setNodes(prev => prev.map(nd => ({ ...nd, inWrite: false })))
    }, 800)
  }

  const doRead = () => {
    const active = nodes.map((nd, i) => i).sort(() => Math.random() - 0.5).slice(0, r)
    let maxTs = 0
    for (const i of active) {
      if (nodes[i].ts > maxTs) maxTs = nodes[i].ts
    }
    const isConsistent = maxTs >= latestWriteTs
    setReadTs(maxTs)
    setConsistent(isConsistent)

    setNodes(prev => prev.map((nd, i) => ({
      ...nd,
      inRead: active.includes(i),
    })))

    const detail = isConsistent
      ? `Read from ${r} nodes: found ts=${maxTs} (latest is ts=${latestWriteTs}) - CONSISTENT`
      : `Read from ${r} nodes: found ts=${maxTs} (latest is ts=${latestWriteTs}) - STALE`
    setLastResult(detail)

    setTimeout(() => {
      setNodes(prev => prev.map(nd => ({ ...nd, inRead: false })))
    }, 800)
  }

  const resetAll = () => {
    setWriteTs(0)
    setLatestWriteTs(0)
    setReadTs(null)
    setConsistent(null)
    setLastResult('')
    setNodes(Array.from({ length: n }, () => ({ ts: 0, inWrite: false, inRead: false })))
  }

  const nodeWidth = Math.min(80, Math.floor(680 / n))

  return (
    <DemoBoundary name="Quorum Nodes">
      <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
        <div style={SEC}>
          <div style={H}>Quorum Consistency</div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
            Configure N replicas, W write quorum, and R read quorum. See if reads return consistent or stale data.
          </p>

          <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>N (total replicas)</label>
              <input type="range" min={1} max={7} value={n} onChange={e => updateN(Number(e.target.value))} style={{ width: '100%', accentColor: s.accent }} />
              <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{n}</span>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>W (write quorum)</label>
              <input type="range" min={1} max={n} value={Math.min(w, n)} onChange={e => setW(Number(e.target.value))} style={{ width: '100%', accentColor: s.green }} />
              <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{Math.min(w, n)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 4 }}>R (read quorum)</label>
              <input type="range" min={1} max={n} value={Math.min(r, n)} onChange={e => setR(Number(e.target.value))} style={{ width: '100%', accentColor: s.yellow }} />
              <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{Math.min(r, n)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {nodes.map((nd, i) => {
              const borderColor = nd.inWrite ? s.green : nd.inRead ? s.yellow : s.border
              const borderW = (nd.inWrite || nd.inRead) ? 3 : 1
              return (
                <div
                  key={i}
                  style={{
                    width: nodeWidth, height: nodeWidth,
                    borderRadius: '50%',
                    background: nd.ts >= latestWriteTs && latestWriteTs > 0
                      ? `${s.green}20`
                      : s.bg,
                    border: `${borderW}px solid ${borderColor}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                    position: 'relative',
                  }}
                >
                  <div style={{ color: s.text, fontFamily: s.mono, fontSize: 11, fontWeight: 700 }}>
                    N{i + 1}
                  </div>
                  <div style={{ color: nd.ts >= latestWriteTs && latestWriteTs > 0 ? s.green : s.text3, fontFamily: s.mono, fontSize: 9 }}>
                    ts={nd.ts}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={doWrite} style={{
              flex: 1, background: s.green, border: 'none', borderRadius: 8,
              padding: '10px 20px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              Write (W={Math.min(w, n)})
            </button>
            <button onClick={doRead} style={{
              flex: 1, background: s.yellow, border: 'none', borderRadius: 8,
              padding: '10px 20px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              Read (R={Math.min(r, n)})
            </button>
            <button onClick={resetAll} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 20px', color: s.text2, cursor: 'pointer', fontSize: 13,
            }}>
              Reset
            </button>
          </div>

          <div style={{
            background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
            padding: '12px 16px', marginBottom: 12,
          }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontFamily: s.mono, fontSize: 14, color: s.text }}>
                R + W = {Math.min(r, n)} + {Math.min(w, n)} = {Math.min(r, n) + Math.min(w, n)}
                <span style={{ color: s.text3, margin: '0 8px' }}>vs</span>
                N = {n}
              </div>
              <div style={{
                padding: '4px 12px', borderRadius: 6,
                background: guaranteed ? `${s.green}20` : `${s.red}20`,
                border: `1px solid ${guaranteed ? s.green : s.red}`,
                color: guaranteed ? s.green : s.red,
                fontSize: 12, fontWeight: 600,
              }}>
                {guaranteed ? 'Consistency Guaranteed' : 'No Consistency Guarantee'}
              </div>
            </div>
          </div>

          {lastResult && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: consistent === true ? `${s.green}10` :
                consistent === false ? `${s.red}10` : s.bg,
              border: `1px solid ${consistent === true ? s.green :
                consistent === false ? s.red : s.border}`,
              color: consistent === true ? s.green :
                consistent === false ? s.red : s.text2,
              fontSize: 13, fontFamily: s.mono,
            }}>
              {lastResult}
            </div>
          )}
        </div>
      </div>
    </DemoBoundary>
  )
}
