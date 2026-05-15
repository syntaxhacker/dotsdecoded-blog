import { useState, useEffect, useRef } from 'react'
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

const counts = [1, 10, 100, 1000, 10000]

export default function GoGoroutineDemo() {
  const [count, setCount] = useState(100)
  const [running, setRunning] = useState<number[]>([])
  const [phase, setPhase] = useState<'idle' | 'scheduling' | 'done'>('idle')
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [coopStep, setCoopStep] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goroutineStackKb = 2
  const osThreadStackKb = 1024
  const totalGoroutineMem = count * goroutineStackKb
  const totalThreadMem = count * osThreadStackKb

  const maxForVisual = 40
  const displayCount = Math.min(count, maxForVisual)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const start = () => {
    setRunning([])
    setPhase('idle')
    setActiveIdx(null)
    setCoopStep(0)
    if (intervalRef.current) clearInterval(intervalRef.current)

    const ids = Array.from({ length: count }, (_, i) => i)
    setPhase('scheduling')

    let idx = 0
    intervalRef.current = setInterval(() => {
      if (idx >= ids.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setPhase('done')
        setActiveIdx(null)
        return
      }
      setRunning(prev => [...prev, ids[idx]])
      setActiveIdx(ids[idx])
      idx++
      setCoopStep(prev => prev + 1)
    }, 20)
  }

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning([])
    setPhase('idle')
    setActiveIdx(null)
    setCoopStep(0)
  }

  const pctGoroutine = totalGoroutineMem > 0
    ? Math.min(100, (totalGoroutineMem / 1024) * 10) : 0
  const pctThread = totalThreadMem > 0
    ? Math.min(100, (totalThreadMem / 1024) * 0.1) : 0

  return (
    <DemoBoundary name="Goroutines vs OS Threads">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Goroutines vs OS Threads</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Goroutines are lightweight "threads" multiplexed onto OS threads. Each goroutine starts at ~2 KB stack vs ~1 MB for an OS thread.
          They are scheduled cooperatively — goroutines yield at channel ops, syscalls, or function calls.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {counts.map(c => (
            <button key={c} onClick={() => { setCount(c); reset() }} style={{
              background: count === c ? s.accent : s.bg3,
              border: `1px solid ${count === c ? s.accent : s.border}`,
              borderRadius: 8, padding: '8px 16px',
              color: count === c ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
              transition: 'all 0.15s',
            }}>
              {c.toLocaleString()} goroutines
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Goroutine Stack Memory
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ height: 40, background: s.bg3, borderRadius: 6, overflow: 'hidden', position: 'relative', marginBottom: 8 }}>
                <div style={{
                  height: '100%', width: `${pctGoroutine}%`,
                  background: `linear-gradient(90deg, ${s.accent}, ${s.green})`,
                  borderRadius: 6, transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: s.text, fontFamily: s.mono, fontSize: 12 }}>{(totalGoroutineMem / 1024).toFixed(1)} MB total</span>
                <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 12 }}>{goroutineStackKb} KB per goroutine</span>
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              OS Thread Stack Memory (if 1:1)
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ height: 40, background: s.bg3, borderRadius: 6, overflow: 'hidden', position: 'relative', marginBottom: 8 }}>
                <div style={{
                  height: '100%', width: `${pctThread}%`,
                  background: `linear-gradient(90deg, ${s.red}, ${s.orange})`,
                  borderRadius: 6, transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: s.text, fontFamily: s.mono, fontSize: 12 }}>{totalThreadMem >= 1024 ? `${(totalThreadMem / 1024).toFixed(0)} MB total` : `${totalThreadMem} KB total`}</span>
                <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 12 }}>{osThreadStackKb} KB per thread</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
              Goroutine Pool ({Math.min(running.length, displayCount)} shown of {count.toLocaleString()})
            </span>
            <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 11 }}>
              {phase === 'idle' ? 'Ready' : phase === 'scheduling' ? `Scheduling step ${coopStep}` : 'All scheduled'}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 80 }}>
            {Array.from({ length: displayCount }).map((_, i) => {
              const isActive = activeIdx === i
              const isDone = running.includes(i)
              return (
                <div key={i} style={{
                  width: 14, height: 14, borderRadius: 3,
                  background: isActive ? s.yellow : isDone ? s.green : s.bg3,
                  border: `1px solid ${isActive ? s.yellow : isDone ? s.green : s.border}`,
                  transition: 'all 0.15s',
                  transform: isActive ? 'scale(1.3)' : 'scale(1)',
                }} />
              )
            })}
          </div>
        </div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Cooperative Scheduling</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{
              width: 60, height: 24, borderRadius: 4, background: s.bg3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: s.text2, fontFamily: s.mono,
              border: `1px solid ${s.border}`,
            }}>OS Thread</div>
            <div style={{
              display: 'flex', gap: 2, flex: 1, overflow: 'hidden',
            }}>
              {running.slice(running.length > 10 ? running.length - 10 : 0, running.length).map((id) => (
                <div key={id} style={{
                  padding: '2px 6px', borderRadius: 3, fontSize: 9, fontFamily: s.mono,
                  background: id === activeIdx ? s.yellow : s.green,
                  color: s.bg, fontWeight: 600,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}>
                  G{id}
                </div>
              ))}
              {phase === 'idle' && running.length === 0 && (
                <span style={{ color: s.text3, fontSize: 11 }}>Press "Schedule" to see goroutines being multiplexed onto a single OS thread</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {phase === 'idle' ? (
            <button onClick={start} style={{
              background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
            }}>Schedule Goroutines</button>
          ) : (
            <button onClick={reset} style={{
              background: s.red, border: 'none', borderRadius: 8, padding: '10px 20px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
            }}>Reset</button>
          )}
        </div>

        <div style={{ marginTop: 20, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Key Facts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Lightweight', desc: 'Goroutine stack starts at ~2 KB, grows/shrinks as needed. OS thread stack is fixed at ~1 MB.', color: s.green },
              { label: 'Multiplexing', desc: 'Thousands of goroutines run on a handful of OS threads (GOMAXPROCS, default = CPU cores).', color: s.accent },
              { label: 'Cooperative', desc: 'Goroutines yield at channel operations, syscalls, function calls, or GC. No preemptive time-slicing (pre-Go 1.14: purely cooperative; Go 1.14+: async preemption added).', color: s.yellow },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 100 }}>{item.label}</span>
                <span style={{ color: s.text2, fontSize: 12 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
