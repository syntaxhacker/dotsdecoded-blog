import { useState, useEffect, useRef } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const files = [
  { id: 0, name: 'index.html', size: 12, color: s.accent },
  { id: 1, name: 'style.css', size: 18, color: s.green },
  { id: 2, name: 'app.js', size: 32, color: s.orange },
  { id: 3, name: 'logo.png', size: 55, color: s.purple },
  { id: 4, name: 'font.woff2', size: 40, color: s.yellow },
  { id: 5, name: 'data.json', size: 8, color: s.red },
]

export default function Http2MultiplexDemo() {
  const [mode, setMode] = useState<'http1' | 'http2'>('http1')
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [progress, setProgress] = useState<number[]>(files.map(() => 0))
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef(0)

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  useEffect(() => {
    if (!running) return
    setProgress(files.map(() => 0))
    setElapsed(0)
    tickRef.current = 0
    startRef.current = Date.now()

    const interval = setInterval(() => {
      tickRef.current++
      setElapsed(Date.now() - startRef.current)
      setProgress(prev => {
        const next = [...prev]
        let allDone = true
        if (mode === 'http1') {
          for (let i = 0; i < files.length; i++) {
            if (next[i] < 100) {
              allDone = false
              const rate = 1.8 / (files[i].size / 20)
              next[i] = Math.min(100, next[i] + rate)
            }
          }
        } else {
          const active = next.map((p, idx) => ({ idx, p })).filter(x => x.p < 100)
          if (active.length === 0) { allDone = true }
          else {
            allDone = false
            for (const a of active) {
              const rate = 1.5 / (files[a.idx].size / 20)
              next[a.idx] = Math.min(100, next[a.idx] + rate)
            }
          }
        }
        if (allDone) setRunning(false)
        return next
      })
    }, getStepDelay(60, speed))

    intervalRef.current = interval
    return () => clearInterval(interval)
  }, [running, mode, speed])

  const handlePlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(true)
  }

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
    setProgress(files.map(() => 0))
    setElapsed(0)
  }

  const switchMode = (m: 'http1' | 'http2') => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setMode(m)
    setRunning(false)
    setProgress(files.map(() => 0))
    setElapsed(0)
  }

  const allDone = progress.every(p => p >= 100)

  return (
    <DemoBoundary name="HTTP/2 Multiplexing">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
          HTTP/1.1 vs HTTP/2 Multiplexing
        </div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          HTTP/1.1 opens up to 6 separate TCP connections. HTTP/2 multiplexes unlimited streams over a single connection, avoiding head-of-line blocking.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => switchMode('http1')} style={{
            background: mode === 'http1' ? s.red : s.bg3,
            border: `1px solid ${mode === 'http1' ? s.red : s.border}`,
            borderRadius: 8, padding: '8px 16px',
            color: mode === 'http1' ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: s.mono,
            transition: 'all 0.2s',
          }}>HTTP/1.1</button>
          <button onClick={() => switchMode('http2')} style={{
            background: mode === 'http2' ? s.accent : s.bg3,
            border: `1px solid ${mode === 'http2' ? s.accent : s.border}`,
            borderRadius: 8, padding: '8px 16px',
            color: mode === 'http2' ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: s.mono,
            transition: 'all 0.2s',
          }}>HTTP/2</button>
          <div style={{ flex: 1 }} />
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ marginBottom: 12 }}>
          {files.map((f, idx) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 100, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                <span style={{ color: s.text, fontFamily: s.mono, fontSize: 11 }}>{f.name}</span>
              </div>
              {mode === 'http1' ? (
                <>
                  <div style={{ flex: 1, position: 'relative', height: 22 }}>
                    <div style={{ position: 'absolute', inset: 0, background: s.bg3, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${progress[idx]}%`,
                        background: f.color, borderRadius: 4,
                        transition: 'width 0.05s linear',
                        opacity: 0.8,
                      }} />
                    </div>
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 8px',
                      color: progress[idx] > 50 ? '#fff' : s.text2, fontFamily: s.mono, fontSize: 10,
                    }}>
                      Conn {idx + 1}: {Math.round(progress[idx])}%
                    </div>
                  </div>
                  <div style={{ width: 40, textAlign: 'right' }}>
                    {progress[idx] >= 100 && <span style={{ color: s.green, fontFamily: s.mono, fontSize: 11 }}>Done</span>}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, position: 'relative', height: 22 }}>
                    <div style={{ position: 'absolute', inset: 0, background: s.bg3, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${progress[idx]}%`,
                        background: f.color, borderRadius: 4,
                        transition: 'width 0.05s linear',
                        opacity: 0.8,
                      }} />
                    </div>
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 8px',
                      color: progress[idx] > 50 ? '#fff' : s.text2, fontFamily: s.mono, fontSize: 10,
                    }}>
                      Stream {idx + 1}: {Math.round(progress[idx])}%
                    </div>
                  </div>
                  <div style={{ width: 40, textAlign: 'right' }}>
                    {progress[idx] >= 100 && <span style={{ color: s.green, fontFamily: s.mono, fontSize: 11 }}>Done</span>}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, padding: 12, background: s.bg3, borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: s.text3, fontSize: 12 }}>Connections:</span>
            <span style={{ color: s.text, fontFamily: s.mono, fontSize: 14, fontWeight: 700 }}>
              {mode === 'http1' ? '6' : '1'}
            </span>
          </div>
          <div style={{ width: 1, height: 20, background: s.border }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: s.text3, fontSize: 12 }}>Streams:</span>
            <span style={{ color: s.text, fontFamily: s.mono, fontSize: 14, fontWeight: 700 }}>
              {mode === 'http1' ? '1 per conn' : '6'}
            </span>
          </div>
          <div style={{ width: 1, height: 20, background: s.border }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: s.text3, fontSize: 12 }}>Elapsed:</span>
            <span style={{ color: s.text, fontFamily: s.mono, fontSize: 14, fontWeight: 700 }}>{(elapsed / 1000).toFixed(1)}s</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleReset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={handlePlay} disabled={running && !allDone} style={{
            background: running && !allDone ? s.bg3 : s.accent,
            border: 'none', borderRadius: 8, padding: '10px 20px',
            color: running && !allDone ? s.text3 : '#fff', cursor: running && !allDone ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600, flex: 1,
          }}>{allDone ? 'Replay' : running ? 'Running...' : 'Start Transfer'}</button>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
