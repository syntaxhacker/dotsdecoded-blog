import { useState, useEffect, useRef, useCallback } from 'react'
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

interface SelectCase {
  id: string
  label: string
  ready: boolean
  isNil: boolean
  isDefault: boolean
}

const allCases: SelectCase[] = [
  { id: 'ch1', label: 'case <-ch1:', ready: false, isNil: false, isDefault: false },
  { id: 'ch2', label: 'case x := <-ch2:', ready: false, isNil: false, isDefault: false },
  { id: 'ch3', label: 'case <-ch3:', ready: false, isNil: false, isDefault: false },
  { id: 'nilch', label: 'case <-nilCh:', ready: false, isNil: true, isDefault: false },
  { id: 'default', label: 'default:', ready: true, isNil: false, isDefault: true },
]

export default function GoSelectDemo() {
  const [cases, setCases] = useState<SelectCase[]>(() => allCases.map(c => ({ ...c })))
  const [selectedCase, setSelectedCase] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'animating' | 'done'>('idle')
  const [log, setLog] = useState<string[]>([])
  const [readyCount, setReadyCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const addLog = useCallback((msg: string) => {
    setLog(prev => [...prev.slice(-14), msg])
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const toggleReady = (id: string) => {
    if (phase !== 'idle') return
    setCases(prev => prev.map(c => c.id === id ? { ...c, ready: !c.ready } : c))
  }

  const runSelect = useCallback(() => {
    setPhase('animating')
    setSelectedCase(null)
    setLog([])

    const readyCases = cases.filter(c => c.ready && !c.isNil)

    if (readyCases.length === 0) {
      const def = cases.find(c => c.isDefault)
      if (def) {
        addLog('No channel ready. Default case selected.')
        setSelectedCase(def.id)
        setPhase('done')
        return
      }
      addLog('No channel ready, no default. select blocks forever.')
      setPhase('done')
      return
    }

    setReadyCount(readyCases.length)

    let idx = 0
    const pickIdx = Math.floor(Math.random() * readyCases.length)

    intervalRef.current = setInterval(() => {
      if (idx >= readyCases.length + 2) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        return
      }

      if (idx < readyCases.length) {
        const c = readyCases[idx]
        addLog(`Checking: ${c.label} (ready)`)
      } else if (idx === readyCases.length) {
        const picked = readyCases[pickIdx]
        setSelectedCase(picked.id)
        addLog(`Randomly selected: ${picked.label}`)
        setPhase('done')
      }

      idx++
    }, 400)
  }, [cases, addLog])

  const resetAll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setSelectedCase(null)
    setPhase('idle')
    setLog([])
    setReadyCount(0)
  }, [])

  return (
    <DemoBoundary name="Select Statement">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>select Statement</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          The `select` statement lets a goroutine wait on multiple channel operations. When multiple cases are ready,
          Go's runtime picks one uniformly at random. Nil channels are never selected. The `default` case fires immediately if no channel is ready.
        </p>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Click cases to toggle ready/unready
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cases.map(c => {
              const isSelected = selectedCase === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => toggleReady(c.id)}
                  disabled={phase !== 'idle'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px', borderRadius: 8, textAlign: 'left',
                    background: isSelected
                      ? s.green
                      : c.isNil
                        ? s.bg3
                        : c.ready
                          ? `${s.accent}22`
                          : s.bg2,
                    border: `2px solid ${
                      isSelected ? s.green
                        : c.isNil ? s.border2
                          : c.ready ? s.accent
                            : s.border
                    }`,
                    cursor: phase === 'idle' ? 'pointer' : 'default',
                    opacity: c.isNil ? 0.5 : 1,
                    width: '100%',
                    transition: 'all 0.2s',
                    fontFamily: s.mono,
                  }}
                >
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: c.isNil ? s.text3 : c.ready ? s.green : s.border,
                    flexShrink: 0,
                    transition: 'background 0.2s',
                  }} />
                  <div style={{ flex: 1 }}>
                    <span style={{
                      color: isSelected ? '#000' : c.isNil ? s.text3 : c.ready ? s.text : s.text3,
                      fontSize: 13, fontWeight: isSelected ? 700 : 400,
                    }}>
                      {c.label}
                    </span>
                  </div>
                  {c.isNil && (
                    <span style={{ color: s.text3, fontSize: 10, padding: '2px 6px', borderRadius: 4, background: s.bg3 }}>
                      nil (never selected)
                    </span>
                  )}
                  {c.isDefault && !isSelected && (
                    <span style={{ color: s.yellow, fontSize: 10 }}>always ready</span>
                  )}
                  {isSelected && (
                    <span style={{ color: '#000', fontSize: 11, fontWeight: 600 }}>SELECTED</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Selection Algorithm</span>
            <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 11 }}>
              {cases.filter(c => c.ready && !c.isNil).length} ready case{cases.filter(c => c.ready && !c.isNil).length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ color: s.text2, fontSize: 12, marginTop: 6 }}>
            Go's runtime scans all cases, collects ready ones, and calls `runtime.fastrand` to pick one uniformly.
            If no channel is ready and there is no default, the goroutine parks.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {phase === 'idle' ? (
            <button onClick={runSelect} style={{
              background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
            }}>Run Select</button>
          ) : (
            <button onClick={resetAll} style={{
              background: s.red, border: 'none', borderRadius: 8, padding: '10px 20px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
            }}>Reset</button>
          )}
        </div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Select Event Log</div>
          <div style={{ maxHeight: 120, overflowY: 'auto', fontSize: 11, fontFamily: s.mono }}>
            {log.length === 0 && (
              <span style={{ color: s.text3 }}>No events yet. Toggle cases and press "Run Select".</span>
            )}
            {log.map((entry, i) => (
              <div key={i} style={{ color: i === log.length - 1 ? s.text : s.text3, padding: '2px 0' }}>
                {entry}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
