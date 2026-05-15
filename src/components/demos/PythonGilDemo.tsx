import { useState, useEffect, useCallback, useRef } from 'react'
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

const gilColors: Record<string, string> = {
  none: s.bg3,
  A: s.accent,
  B: s.orange,
}

export default function PythonGilDemo() {
  const [mode, setMode] = useState<'cpu' | 'io'>('cpu')
  const [running, setRunning] = useState(false)
  const [gilHolder, setGilHolder] = useState<'A' | 'B' | null>(null)
  const [progressA, setProgressA] = useState(0)
  const [progressB, setProgressB] = useState(0)
  const [tick, setTick] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const tickRef = useRef(0)
  const holderRef = useRef<'A' | 'B' | null>(null)
  const progressARef = useRef(0)
  const progressBRef = useRef(0)
  const runningRef = useRef(false)
  const modeRef = useRef(mode)

  useEffect(() => { modeRef.current = mode }, [mode])

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-19), msg])
  }, [])

  useEffect(() => {
    runningRef.current = running
  }, [running])

  useEffect(() => {
    if (!running) {
      setGilHolder(null)
      holderRef.current = null
      return
    }
    holderRef.current = 'A'
    setGilHolder('A')
    addLog('Thread A acquired GIL')
    tickRef.current = 0

    const interval = setInterval(() => {
      if (!runningRef.current) { clearInterval(interval); return }
      tickRef.current += 1
      setTick(tickRef.current)

      const holder = holderRef.current
      const isIo = modeRef.current === 'io'

      if (holder === 'A') {
        progressARef.current = Math.min(progressARef.current + 1, 100)
        setProgressA(progressARef.current)

        const shouldSwitch = isIo
          ? tickRef.current % 7 === 0
          : tickRef.current % 13 === 0

        if (shouldSwitch) {
          if (isIo) {
            addLog('Thread A I/O wait -- releasing GIL')
          } else {
            addLog('Thread A tick limit -- releasing GIL')
          }
          holderRef.current = 'B'
          setGilHolder('B')
          addLog('Thread B acquired GIL')
          tickRef.current = 0
        }
      } else {
        progressBRef.current = Math.min(progressBRef.current + 1, 100)
        setProgressB(progressBRef.current)

        const shouldSwitch = isIo
          ? tickRef.current % 5 === 0
          : tickRef.current % 13 === 0

        if (shouldSwitch) {
          if (isIo) {
            addLog('Thread B I/O wait -- releasing GIL')
          } else {
            addLog('Thread B tick limit -- releasing GIL')
          }
          holderRef.current = 'A'
          setGilHolder('A')
          addLog('Thread A acquired GIL')
          tickRef.current = 0
        }
      }

      if (progressARef.current >= 100 && progressBRef.current >= 100) {
        clearInterval(interval)
        setRunning(false)
        runningRef.current = false
      }
    }, 80)

    return () => clearInterval(interval)
  }, [running, addLog])

  const reset = () => {
    setRunning(false)
    setProgressA(0)
    setProgressB(0)
    setTick(0)
    setGilHolder(null)
    setLogs([])
    holderRef.current = null
    progressARef.current = 0
    progressBRef.current = 0
    tickRef.current = 0
  }

  const currentGilColor = gilHolder ? gilColors[gilHolder] : gilColors.none

  return (
    <DemoBoundary name="GIL Visualization">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>Global Interpreter Lock (GIL)</div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: s.bg2, borderRadius: 8, padding: 4 }}>
          <button onClick={() => setMode('cpu')} style={{
            background: mode === 'cpu' ? s.accent : 'transparent',
            border: 'none', borderRadius: 6, padding: '6px 14px',
            color: mode === 'cpu' ? '#fff' : s.text2, cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>CPU-bound</button>
          <button onClick={() => setMode('io')} style={{
            background: mode === 'io' ? s.orange : 'transparent',
            border: 'none', borderRadius: 6, padding: '6px 14px',
            color: mode === 'io' ? '#fff' : s.text2, cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>I/O-bound</button>
        </div>
        <button onClick={() => setRunning(!running)} style={{
          background: running ? s.red : s.green, border: 'none', borderRadius: 8, padding: '8px 20px',
          color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>{running ? 'Pause' : 'Start'}</button>
        <button onClick={reset} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 20px',
          color: s.text2, cursor: 'pointer', fontSize: 13,
        }}>Reset</button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1, background: s.bg2, borderRadius: 12, padding: 16, border: `1px solid ${gilHolder === 'A' ? s.accent : s.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: s.accent, fontWeight: 700, fontSize: 14 }}>Thread A</span>
            <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 12 }}>{progressA}%</span>
          </div>
          <div style={{ background: s.bg, borderRadius: 6, height: 16, overflow: 'hidden' }}>
            <div style={{ width: `${progressA}%`, height: '100%', background: `linear-gradient(90deg, ${s.accent}, ${s.accent}99)`, borderRadius: 6, transition: 'width 0.15s' }} />
          </div>
          <div style={{ marginTop: 10, color: s.text3, fontSize: 11, fontFamily: s.mono }}>
            {mode === 'cpu' ? 'Computing...' : 'Computing / I/O wait'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 80 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', background: currentGilColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', transition: 'all 0.3s', boxShadow: `0 0 20px ${currentGilColor}44`,
          }}>
            <div style={{ color: '#fff', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>GIL</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{gilHolder || '?'}</div>
          </div>
        </div>

        <div style={{ flex: 1, background: s.bg2, borderRadius: 12, padding: 16, border: `1px solid ${gilHolder === 'B' ? s.orange : s.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: s.orange, fontWeight: 700, fontSize: 14 }}>Thread B</span>
            <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 12 }}>{progressB}%</span>
          </div>
          <div style={{ background: s.bg, borderRadius: 6, height: 16, overflow: 'hidden' }}>
            <div style={{ width: `${progressB}%`, height: '100%', background: `linear-gradient(90deg, ${s.orange}, ${s.orange}99)`, borderRadius: 6, transition: 'width 0.15s' }} />
          </div>
          <div style={{ marginTop: 10, color: s.text3, fontSize: 11, fontFamily: s.mono }}>
            {mode === 'cpu' ? 'Computing...' : 'Computing / I/O wait'}
          </div>
        </div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: 12 }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Timeline</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>Tick: {tick}</div>
          <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>
            Mode: {mode === 'cpu' ? 'CPU-bound (switch every ~13 ticks)' : 'I/O-bound (release on I/O)'}
          </div>
          <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>
            {gilHolder ? `Thread ${gilHolder} holds GIL` : 'GIL idle'}
          </div>
        </div>
        <div style={{ marginTop: 8, maxHeight: 120, overflowY: 'auto', background: s.bg, borderRadius: 8, padding: 8 }}>
          {logs.map((msg, i) => (
            <div key={i} style={{ color: s.text3, fontFamily: s.mono, fontSize: 10, lineHeight: 1.6 }}>{msg}</div>
          ))}
          {logs.length === 0 && <div style={{ color: s.text3, fontSize: 11, fontStyle: 'italic' }}>Press Start to run simulation</div>}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
