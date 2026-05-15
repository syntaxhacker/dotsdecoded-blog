import { useState, useEffect, useCallback, useRef } from 'react'
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

interface InstDef {
  id: string; text: string; unit: string; lat: number; deps: string[]
}

const insts: InstDef[] = [
  { id: 'I1', text: 'LOAD R1, [addr1]', unit: 'Ld/St', lat: 3, deps: [] },
  { id: 'I2', text: 'ADD R2, R1, R5', unit: 'ALU0', lat: 1, deps: ['I1'] },
  { id: 'I3', text: 'SUB R3, R6, R7', unit: 'ALU1', lat: 1, deps: [] },
  { id: 'I4', text: 'MUL R4, R3, R8', unit: 'ALU0', lat: 1, deps: ['I3'] },
  { id: 'I5', text: 'ADD R9, R10, R11', unit: 'ALU1', lat: 1, deps: [] },
  { id: 'I6', text: 'STORE [addr2], R2', unit: 'Ld/St', lat: 1, deps: ['I2'] },
]

const units = ['ALU0', 'ALU1', 'Ld/St']

const instColors: Record<string, string> = {
  I1: s.accent, I2: s.green, I3: s.yellow, I4: s.orange, I5: s.purple, I6: s.red,
}

interface SlotState {
  instId: string; progress: number; total: number
}

interface CycleEntry {
  ALU0: SlotState | null; ALU1: SlotState | null; 'Ld/St': SlotState | null
  stall: boolean
}

function buildSchedule(mode: 'in-order' | 'out-of-order'): CycleEntry[] {
  const issued = new Set<string>()
  const completed = new Set<string>()
  const active: Record<string, { instId: string; elapsed: number; total: number } | null> = {}
  for (const u of units) active[u] = null
  const states: CycleEntry[] = []
  let nextIdx = 0

  while (issued.size < insts.length || Object.values(active).some(a => a !== null)) {
    let issuedSomething = false

    if (mode === 'in-order') {
      if (nextIdx < insts.length) {
        const inst = insts[nextIdx]
        const depsReady = inst.deps.every(d => completed.has(d))
        const unitFree = active[inst.unit] === null
        if (depsReady && unitFree) {
          active[inst.unit] = { instId: inst.id, elapsed: 0, total: inst.lat }
          issued.add(inst.id)
          nextIdx++
          issuedSomething = true
        }
      }
    } else {
      for (const inst of insts) {
        if (issued.has(inst.id)) continue
        const depsReady = inst.deps.every(d => completed.has(d))
        const unitFree = active[inst.unit] === null
        if (depsReady && unitFree) {
          active[inst.unit] = { instId: inst.id, elapsed: 0, total: inst.lat }
          issued.add(inst.id)
          issuedSomething = true
        }
      }
    }

    const unissuedCount = insts.length - issued.size
    const anyActive = Object.values(active).some(a => a !== null)

    const entry: CycleEntry = {
      ALU0: null, ALU1: null, 'Ld/St': null,
      stall: !issuedSomething && unissuedCount > 0 && anyActive,
    }

    for (const u of units) {
      const a = active[u]
      if (a) {
        entry[u as keyof CycleEntry] = { instId: a.instId, progress: a.elapsed + 1, total: a.total }
      }
    }
    states.push(entry)

    for (const u of units) {
      if (active[u]) {
        active[u]!.elapsed++
        if (active[u]!.elapsed >= active[u]!.total) {
          completed.add(active[u]!.instId)
          active[u] = null
        }
      }
    }

    if (states.length > 30) break
  }

  return states
}

const inOrderSchedule = buildSchedule('in-order')
const oooSchedule = buildSchedule('out-of-order')
const inOrderCycles = inOrderSchedule.length
const oooCycles = oooSchedule.length

export default function OutOfOrderDemo() {
  const [mode, setMode] = useState<'in-order' | 'out-of-order'>('out-of-order')
  const [cycle, setCycle] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cycleRef = useRef(cycle)
  cycleRef.current = cycle

  const schedule = mode === 'in-order' ? inOrderSchedule : oooSchedule
  const maxCycle = schedule.length
  const speedup = (inOrderCycles / oooCycles).toFixed(2)

  const stopPlaying = useCallback(() => {
    setPlaying(false)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const step = useCallback(() => {
    setCycle(prev => Math.min(prev + 1, maxCycle))
  }, [maxCycle])

  const reset = useCallback(() => {
    stopPlaying()
    setCycle(1)
  }, [stopPlaying])

  const toggleMode = useCallback((m: 'in-order' | 'out-of-order') => {
    reset()
    setMode(m)
  }, [reset])

  useEffect(() => {
    if (playing && cycle < maxCycle) {
      timerRef.current = setTimeout(() => {
        if (cycleRef.current < maxCycle) {
          setCycle(prev => prev + 1)
        } else {
          setPlaying(false)
        }
      }, getStepDelay(500, speed))
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    } else if (cycle >= maxCycle) {
      setPlaying(false)
    }
  }, [playing, cycle, maxCycle, speed])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const instCompleted: Record<string, number | null> = {}
  for (const inst of insts) {
    instCompleted[inst.id] = null
  }
  for (let c = 0; c < cycle && c < schedule.length; c++) {
    const entry = schedule[c]
    for (const u of units) {
      const slot = entry[u as keyof CycleEntry] as SlotState | null
      if (slot && slot.progress >= slot.total) {
        if (instCompleted[slot.instId] === null) {
          instCompleted[slot.instId] = c + 1
        }
      }
    }
  }

  const cols = Math.max(Math.min(cycle, schedule.length), 1)

  const btnBase: React.CSSProperties = {
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, fontFamily: s.mono, transition: 'all 0.15s',
  }

  return (
    <DemoBoundary name="Out-of-Order Execution">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
        Out-of-Order Execution
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginBottom: 20 }}>
        {insts.map(inst => {
          const done = instCompleted[inst.id] !== null
          return (
            <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: done ? 0.5 : 1 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: instColors[inst.id], flexShrink: 0 }} />
              <span style={{ color: done ? s.text3 : s.text, fontFamily: s.mono, fontSize: 11 }}>
                {inst.id}: {inst.text}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['in-order', 'out-of-order'] as const).map(m => (
          <button key={m} onClick={() => toggleMode(m)} style={{
            ...btnBase,
            background: mode === m ? s.accent : s.bg3,
            color: mode === m ? '#fff' : s.text2,
          }}>{m === 'in-order' ? 'In-Order' : 'Out-of-Order'}</button>
        ))}
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: 8, overflowY: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${cols}, 64px)`, gap: 2, minWidth: 0 }}>
          <div style={{ color: s.text3, fontSize: 11, padding: '6px 8px', fontWeight: 600 }}>Unit</div>
          {Array.from({ length: cols }).map((_, i) => {
            const isStall = schedule[i]?.stall
            return (
              <div key={i} style={{
                textAlign: 'center', color: isStall ? s.red : s.text2, fontSize: 11, fontFamily: s.mono,
                padding: '6px 0', background: isStall ? `${s.red}15` : s.bg2,
                borderRadius: '4px 4px 0 0',
                fontWeight: isStall ? 700 : 400,
              }}>
                {isStall ? 'STALL' : `C${i + 1}`}
              </div>
            )
          })}

          {units.map(unit => (
            <>
              <div style={{
                color: s.text2, fontSize: 11, fontFamily: s.mono, padding: '8px 8px',
                display: 'flex', alignItems: 'center', fontWeight: 600,
              }}>
                {unit}
              </div>
              {Array.from({ length: cols }).map((_, i) => {
                const entry = schedule[i]
                if (!entry) return null
                const slot = entry[unit as keyof CycleEntry] as SlotState | null
                const isStall = entry.stall && !slot

                let bg = 'transparent'
                let fg = s.text3
                let content = ''
                let fontWeight = 400 as React.CSSProperties['fontWeight']

                if (slot) {
                  const pct = slot.progress / slot.total
                  bg = `linear-gradient(135deg, ${instColors[slot.instId]}33, ${instColors[slot.instId]}18)`
                  fg = instColors[slot.instId]
                  content = slot.instId
                  fontWeight = 600
                  if (slot.total > 1) {
                    content += ` (${slot.progress}/${slot.total})`
                  }
                } else if (isStall) {
                  bg = `${s.red}08`
                  fg = s.red
                  content = 'bubble'
                  fontWeight = 400
                }

                const isCompleting = slot && slot.progress >= slot.total
                return (
                  <div style={{
                    background: bg, borderRadius: 4,
                    padding: '8px 4px', textAlign: 'center',
                    fontSize: 11, fontFamily: s.mono, color: fg,
                    fontWeight,
                    border: isCompleting ? `1px solid ${instColors[slot!.instId]}44` : '1px solid transparent',
                    transition: 'all 0.15s',
                    minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {content}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ background: s.bg2, borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 100 }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Total Cycles
          </div>
          <div style={{ color: s.text, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>
            {mode === 'in-order' ? inOrderCycles : oooCycles}
          </div>
        </div>
        <div style={{ background: s.bg2, borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 100 }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            In-Order
          </div>
          <div style={{ color: s.text, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>
            {inOrderCycles}
          </div>
        </div>
        <div style={{ background: s.bg2, borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 100 }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Out-of-Order
          </div>
          <div style={{ color: s.text, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>
            {oooCycles}
          </div>
        </div>
        {mode === 'out-of-order' && (
          <div style={{ background: `${s.green}12`, borderRadius: 8, padding: '10px 16px', textAlign: 'center', border: `1px solid ${s.green}44`, minWidth: 100 }}>
            <div style={{ color: s.green, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Speedup
            </div>
            <div style={{ color: s.green, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>
              {speedup}x
            </div>
          </div>
        )}
        {mode === 'in-order' && (
          <div style={{ background: `${s.red}10`, borderRadius: 8, padding: '10px 16px', textAlign: 'center', border: `1px solid ${s.red}33`, minWidth: 100 }}>
            <div style={{ color: s.red, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Slowdown
            </div>
            <div style={{ color: s.red, fontFamily: s.mono, fontSize: 18, fontWeight: 600 }}>
              {speedup}x
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 20, alignItems: 'center' }}>
        <button onClick={step} disabled={cycle >= maxCycle} style={{
          ...btnBase,
          background: s.bg3, color: cycle >= maxCycle ? s.text3 : s.text2,
          border: `1px solid ${cycle >= maxCycle ? s.border : s.border}`,
          cursor: cycle >= maxCycle ? 'not-allowed' : 'pointer',
        }}>Step</button>
        <button onClick={() => setPlaying(!playing)} disabled={cycle >= maxCycle} style={{
          ...btnBase,
          background: playing ? s.red : s.accent,
          color: '#fff',
          cursor: cycle >= maxCycle ? 'not-allowed' : 'pointer',
        }}>
          {playing ? 'Stop' : 'Auto-Play'}
        </button>
        <button onClick={reset} style={{
          ...btnBase,
          background: s.bg3, color: s.text2,
          border: `1px solid ${s.border}`,
        }}>Reset</button>
        <div style={{ marginLeft: 'auto' }}>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
      </div>

      <div style={{ marginTop: 20, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          Completion Log
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 120 }}>
          {insts.map(inst => {
            const done = instCompleted[inst.id] !== null
            const doneCycle = instCompleted[inst.id]
            return (
              <div key={inst.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 10px', borderRadius: 6,
                background: done ? `${instColors[inst.id]}18` : 'transparent',
                opacity: done ? 1 : 0.35,
                transition: 'all 0.3s',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: instColors[inst.id], flexShrink: 0 }} />
                <span style={{ fontFamily: s.mono, fontSize: 12, color: s.text, minWidth: 28 }}>{inst.id}</span>
                <span style={{ fontSize: 12, color: s.text2, flex: 1 }}>{inst.text}</span>
                {done ? (
                  <span style={{ fontFamily: s.mono, fontSize: 11, color: s.green, fontWeight: 600 }}>
                    done at C{doneCycle}
                  </span>
                ) : (
                  <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3 }}>pending</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
