import { useState, useCallback, useRef, useEffect } from 'react'
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

interface LogEntry {
  type: 'read' | 'write'
  index: number
  time: number
}

const unbatchedCode = `// Unbatched: read-write-read-write thrashing
for (let i = 0; i < 5; i++) {
  const w = el.offsetWidth;  // READ
  el.style.width = w + 10 + 'px'; // WRITE
}
// Result: 5 forced reflows`

const batchedCode = `// Batched: reads then writes
const widths = [];
for (let i = 0; i < 5; i++) {
  widths.push(el.offsetWidth); // READS
}
for (let i = 0; i < 5; i++) {
  el.style.width =
    widths[i] + 10 + 'px'; // WRITES
}
// Result: 1 reflow total`

export default function LayoutThrashDemo() {
  const [running, setRunning] = useState<'unbatched' | 'batched' | null>(null)
  const [unbatchedCount, setUnbatchedCount] = useState(0)
  const [batchedCount, setBatchedCount] = useState(0)
  const [unbatchedTime, setUnbatchedTime] = useState(0)
  const [batchedTime, setBatchedTime] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [activeOp, setActiveOp] = useState<'read' | 'write' | null>(null)
  const animRef = useRef<number>(0)
  const idxRef = useRef(0)
  const startRef = useRef(0)

  const clearAll = useCallback(() => {
    setRunning(null)
    setUnbatchedCount(0)
    setBatchedCount(0)
    setUnbatchedTime(0)
    setBatchedTime(0)
    setLogs([])
    setActiveOp(null)
    cancelAnimationFrame(animRef.current)
  }, [])

  const simulateUnbatched = useCallback(() => {
    setRunning('unbatched')
    setLogs([])
    setActiveOp(null)
    idxRef.current = 0
    startRef.current = performance.now()

    const step = () => {
      const idx = idxRef.current
      if (idx >= 10) {
        const elapsed = performance.now() - startRef.current
        setUnbatchedCount(10)
        setUnbatchedTime(Math.round(elapsed))
        setRunning(null)
        setActiveOp(null)
        return
      }
      const isRead = idx % 2 === 0
      setActiveOp(isRead ? 'read' : 'write')
      setLogs(prev => [...prev, { type: isRead ? 'read' : 'write', index: Math.floor(idx / 2), time: Date.now() }])
      idxRef.current = idx + 1
      animRef.current = window.setTimeout(step, 300)
    }
    animRef.current = window.setTimeout(step, 200)
  }, [])

  const simulateBatched = useCallback(() => {
    setRunning('batched')
    setLogs([])
    setActiveOp(null)
    idxRef.current = 0
    startRef.current = performance.now()

    const stepReads = () => {
      const idx = idxRef.current
      if (idx >= 5) {
        idxRef.current = 0
        animRef.current = window.setTimeout(stepWrites, 200)
        return
      }
      setActiveOp('read')
      setLogs(prev => [...prev, { type: 'read', index: idx, time: Date.now() }])
      idxRef.current = idx + 1
      animRef.current = window.setTimeout(stepReads, 200)
    }

    const stepWrites = () => {
      const idx = idxRef.current
      if (idx >= 5) {
        const elapsed = performance.now() - startRef.current
        setBatchedCount(1)
        setBatchedTime(Math.round(elapsed))
        setRunning(null)
        setActiveOp(null)
        return
      }
      setActiveOp('write')
      setLogs(prev => [...prev, { type: 'write', index: idx, time: Date.now() }])
      idxRef.current = idx + 1
      animRef.current = window.setTimeout(stepWrites, 200)
    }

    animRef.current = window.setTimeout(stepReads, 200)
  }, [])

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const maxCount = Math.max(unbatchedCount, batchedCount, 1)
  const maxTime = Math.max(unbatchedTime, batchedTime, 1)

  return (
    <DemoBoundary name="Layout Thrashing">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Layout Thrashing Demo</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Interleaving DOM reads and writes forces the browser to recalculate layout after every write.
          Batching avoids this.
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button onClick={simulateUnbatched} disabled={running !== null} style={{
            flex: 1, background: running === 'unbatched' ? s.bg3 : s.red, border: 'none', borderRadius: 8,
            padding: '12px 20px', color: '#fff', cursor: running !== null ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600, opacity: running !== null && running !== 'unbatched' ? 0.5 : 1,
          }}>Run Unbatched</button>
          <button onClick={simulateBatched} disabled={running !== null} style={{
            flex: 1, background: running === 'batched' ? s.bg3 : s.green, border: 'none', borderRadius: 8,
            padding: '12px 20px', color: '#fff', cursor: running !== null ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600, opacity: running !== null && running !== 'batched' ? 0.5 : 1,
          }}>Run Batched</button>
          <button onClick={clearAll} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '12px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 12,
          }}>Clear</button>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, padding: 16 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Reflow Count</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: s.text2, fontSize: 11, marginBottom: 4 }}>Unbatched</div>
                <div style={{ height: 80, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%', height: `${(unbatchedCount / maxCount) * 100}%`,
                    background: s.red, borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s', minHeight: unbatchedCount > 0 ? 4 : 0,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: 4,
                  }}>
                    <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: s.mono }}>{unbatchedCount}</span>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: s.text2, fontSize: 11, marginBottom: 4 }}>Batched</div>
                <div style={{ height: 80, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%', height: `${(batchedCount / maxCount) * 100}%`,
                    background: s.green, borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s', minHeight: batchedCount > 0 ? 4 : 0,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: 4,
                  }}>
                    <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: s.mono }}>{batchedCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, padding: 16 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Frame Time (simulated)</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: s.text2, fontSize: 11, marginBottom: 4 }}>Unbatched</div>
                <div style={{ height: 80, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%', height: `${(unbatchedTime / maxTime) * 100}%`,
                    background: `${s.red}88`, borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s', minHeight: unbatchedTime > 0 ? 4 : 0,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: 4,
                  }}>
                    <span style={{ color: '#fff', fontSize: 11, fontFamily: s.mono }}>{unbatchedTime}ms</span>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: s.text2, fontSize: 11, marginBottom: 4 }}>Batched</div>
                <div style={{ height: 80, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%', height: `${(batchedTime / maxTime) * 100}%`,
                    background: `${s.green}88`, borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s', minHeight: batchedTime > 0 ? 4 : 0,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: 4,
                  }}>
                    <span style={{ color: '#fff', fontSize: 11, fontFamily: s.mono }}>{batchedTime}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, padding: 12, minHeight: 40 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Operation Log</div>
          {logs.length === 0 ? (
            <div style={{ color: s.text3, fontSize: 12 }}>Click a run button to start.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, fontSize: 11 }}>
              {logs.map((log, i) => (
                <div key={i} style={{
                  padding: '3px 8px', borderRadius: 4,
                  background: log.type === 'read' ? `${s.accent}20` : `${s.yellow}20`,
                  border: `1px solid ${activeOp && logs.length - 1 === i ? (log.type === 'read' ? s.accent : s.yellow) : s.border}`,
                  color: activeOp && logs.length - 1 === i ? (log.type === 'read' ? s.accent : s.yellow) : s.text2,
                  fontFamily: s.mono, fontSize: 10,
                  transition: 'all 0.15s',
                }}>
                  {log.type === 'read' ? 'READ' : 'WRITE'}[{log.index}]
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ ...SEC, padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.red }} />
              <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>Unbatched</span>
            </div>
            <pre style={{
              background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
              padding: 12, margin: 0, overflow: 'auto',
              fontFamily: s.mono, fontSize: 11, color: s.text2, lineHeight: 1.6, whiteSpace: 'pre',
            }}>
              {unbatchedCode}
            </pre>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.green }} />
              <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>Batched</span>
            </div>
            <pre style={{
              background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
              padding: 12, margin: 0, overflow: 'auto',
              fontFamily: s.mono, fontSize: 11, color: s.text2, lineHeight: 1.6, whiteSpace: 'pre',
            }}>
              {batchedCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
