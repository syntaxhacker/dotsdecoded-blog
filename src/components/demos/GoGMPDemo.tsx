import { useState, useEffect, useRef, useCallback } from 'react'
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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface GState {
  id: number
  state: 'running' | 'runnable' | 'blocked'
  pId: number | null
  stealing?: boolean
}

interface PState {
  id: number
  localQueue: number[]
}

interface MState {
  id: number
  pId: number | null
  gId: number | null
  state: 'idle' | 'running' | 'stealing'
}

const G_COLORS = [s.green, s.accent, s.yellow, s.purple, s.orange, s.red]

export default function GoGMPDemo() {
  const [speed, setSpeed] = useState(1)
  const [gs, setGs] = useState<GState[]>([])
  const [ps, setPs] = useState<PState[]>([
    { id: 0, localQueue: [0, 1, 2] },
    { id: 1, localQueue: [3, 4, 5] },
    { id: 2, localQueue: [6, 7, 8] },
  ])
  const [ms, setMs] = useState<MState[]>([
    { id: 0, pId: 0, gId: null, state: 'idle' },
    { id: 1, pId: 1, gId: null, state: 'idle' },
    { id: 2, pId: null, gId: null, state: 'idle' },
  ])
  const [globalQueue, setGlobalQueue] = useState<number[]>([])
  const [phase, setPhase] = useState<'idle' | 'running' | 'stealing' | 'done'>('idle')
  const [log, setLog] = useState<string[]>([])
  const [nextGId, setNextGId] = useState(9)
  const [stealTarget, setStealTarget] = useState<{fromP: number, toM: number, gId: number} | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const addLog = useCallback((msg: string) => {
    setLog(prev => [...prev.slice(-19), msg])
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startScheduling = useCallback(() => {
    stop()
    setPhase('running')
    setLog([])
    setGs([])
    setStealTarget(null)

    const initGs: GState[] = Array.from({ length: 9 }, (_, i) => ({
      id: i, state: 'runnable', pId: i < 3 ? 0 : i < 6 ? 1 : 2,
    }))
    const initPs: PState[] = [
      { id: 0, localQueue: [0, 1, 2] },
      { id: 1, localQueue: [3, 4, 5] },
      { id: 2, localQueue: [6, 7, 8] },
    ]
    const initMs: MState[] = [
      { id: 0, pId: 0, gId: null, state: 'idle' },
      { id: 1, pId: 1, gId: null, state: 'idle' },
      { id: 2, pId: null, gId: null, state: 'idle' },
    ]
    setGs(initGs)
    setPs(initPs)
    setMs(initMs)
    setGlobalQueue([])
    setNextGId(9)

    let step = 0
    let currentMs = [...initMs]
    let currentPs = [...initPs]
    let currentGs = [...initGs]
    let currentGlobal = [...globalQueue]
    let nextId = 9

    intervalRef.current = setInterval(() => {
      if (step >= 8) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setPhase('done')
        return
      }

      const newMs = currentMs.map(m => ({ ...m }))
      const newPs = currentPs.map(p => ({ ...p, localQueue: [...p.localQueue] }))
      const newGs = currentGs.map(g => ({ ...g }))
      const newGlobal = [...currentGlobal]

      if (step === 0) {
        newMs[0].gId = 0
        newMs[0].state = 'running'
        newGs[0].state = 'running'
        addLog('M0 picks G0 from P0 local queue')
      } else if (step === 1) {
        newMs[0].gId = 1
        newGs[0].state = 'runnable'
        newGs[1].state = 'running'
        newMs[0].state = 'running'
        addLog('G0 yields. M0 picks G1 from P0 queue')
      } else if (step === 2) {
        newGs[1].state = 'blocked'
        newMs[0].state = 'running'
        newMs[0].gId = 2
        newGs[2].state = 'running'
        addLog('G1 blocks on channel. M0 picks G2 from P0 queue')
      } else if (step === 3) {
        newMs[0].gId = 0
        newGs[2].state = 'runnable'
        newGs[0].state = 'running'
        newMs[0].state = 'running'
        addLog('G2 yields. M0 picks G0 from P0 queue')
      } else if (step === 4) {
        newMs[1].gId = 3
        newMs[1].state = 'running'
        newGs[3].state = 'running'
        addLog('M1 picks G3 from P1 queue')
      } else if (step === 5) {
        newMs[1].gId = 4
        newGs[3].state = 'runnable'
        newGs[4].state = 'running'
        addLog('M1 picks G4 from P1 queue')
      } else if (step === 6) {
        newMs[2].pId = 0
        newMs[2].state = 'stealing'
        setPhase('stealing')
        const stolenG = newPs[0].localQueue.shift()
        setStealTarget({ fromP: 0, toM: 2, gId: stolenG! })
        addLog(`M2 is idle. Steals G${stolenG} from P0 local queue`)
      } else if (step === 7) {
        newMs[2].state = 'running'
        newMs[2].gId = newGs[0].id
        newGs[0].state = 'running'
        setStealTarget(null)
        addLog('M2 runs stolen goroutine G0')
      }

      currentMs = newMs
      currentPs = newPs
      currentGs = newGs
      currentGlobal = newGlobal

      setMs(newMs)
      setPs(newPs)
      setGs(newGs)
      setGlobalQueue(newGlobal)
      setNextGId(nextId)

      step++
    }, getStepDelay(1000, speed))
  }, [speed, addLog, stop])

  const resetAll = useCallback(() => {
    stop()
    setGs([])
    setPs([
      { id: 0, localQueue: [0, 1, 2] },
      { id: 1, localQueue: [3, 4, 5] },
      { id: 2, localQueue: [6, 7, 8] },
    ])
    setMs([
      { id: 0, pId: 0, gId: null, state: 'idle' },
      { id: 1, pId: 1, gId: null, state: 'idle' },
      { id: 2, pId: null, gId: null, state: 'idle' },
    ])
    setGlobalQueue([])
    setPhase('idle')
    setLog([])
    setStealTarget(null)
  }, [stop])

  const gById = (id: number) => gs.find(g => g.id === id)

  return (
    <DemoBoundary name="GMP Scheduler">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={H}>GMP Scheduler</div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          The GMP model: Goroutines (G) are scheduled onto Machines (M, OS threads) by Processors (P, scheduling context).
          Each P has a local run queue. Idle M's steal work from other P's local queues.
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[0, 1, 2].map(pId => {
            const p = ps.find(p => p.id === pId)
            const m = ms.find(m => m.pId === pId)
            const runningG = m?.gId != null ? gById(m.gId) : null
            return (
              <div key={pId} style={{
                flex: 1, background: s.bg, border: `1px solid ${ps[pId]?.localQueue.length === 0 ? s.border2 : s.border}`,
                borderRadius: 12, padding: 14, minHeight: 200,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: s.purple, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#fff', fontWeight: 700,
                  }}>P{pId}</div>
                  <div style={{
                    padding: '3px 8px', borderRadius: 4,
                    background: m ? (m.state === 'stealing' ? s.orange : m.state === 'running' ? s.green : s.bg3) : s.bg3,
                    border: `1px solid ${m ? (m.state === 'stealing' ? s.orange : m.state === 'running' ? s.green : s.border) : s.border}`,
                    fontSize: 10, color: s.text, fontFamily: s.mono,
                  }}>
                    {m ? `M${m.id}${m.state === 'stealing' ? ' (stealing)' : ''}` : 'No M'}
                  </div>
                </div>

                {runningG && (
                  <div style={{
                    background: s.bg2, borderRadius: 6, padding: '6px 10px',
                    marginBottom: 10, border: `1px solid ${s.green}`,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green }} />
                    <span style={{ fontSize: 12, fontFamily: s.mono, color: s.green }}>G{runningG.id}</span>
                    <span style={{ fontSize: 10, color: s.text3 }}>RUNNING</span>
                  </div>
                )}

                <div style={{ color: s.text3, fontSize: 10, marginBottom: 6 }}>Local Run Queue:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minHeight: 40 }}>
                  {p && p.localQueue.map((gId) => {
                    const isStolen = stealTarget?.fromP === p.id && stealTarget?.gId === gId
                    return (
                      <div key={gId} style={{
                        padding: '4px 8px', borderRadius: 4, fontSize: 11, fontFamily: s.mono,
                        background: isStolen ? s.orange : s.bg3,
                        border: `1px solid ${isStolen ? s.orange : s.border}`,
                        color: isStolen ? '#fff' : s.text2,
                        display: 'flex', alignItems: 'center', gap: 4,
                        transition: 'all 0.3s',
                        opacity: isStolen ? 0.5 : 1,
                      }}>
                        G{gId}
                      </div>
                    )
                  })}
                  {p && p.localQueue.length === 0 && (
                    <span style={{ color: s.text3, fontSize: 10, fontStyle: 'italic' }}>empty</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {stealTarget && (
          <div style={{
            background: s.bg, border: `1px solid ${s.orange}`, borderRadius: 8, padding: '10px 16px',
            marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.orange }} />
            <span style={{ color: s.text, fontSize: 13, fontFamily: s.mono }}>
              Work Stealing: M{stealTarget.toM} steals G{stealTarget.gId} from P{stealTarget.fromP}'s local queue
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {phase === 'idle' ? (
            <button onClick={startScheduling} style={{
              background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
            }}>Run Schedule</button>
          ) : (
            <button onClick={resetAll} style={{
              background: s.red, border: 'none', borderRadius: 8, padding: '10px 20px',
              color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
            }}>Reset</button>
          )}
        </div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Schedule Event Log</div>
          <div style={{ maxHeight: 120, overflowY: 'auto', fontSize: 11, fontFamily: s.mono }}>
            {log.length === 0 && (
              <span style={{ color: s.text3 }}>No events yet. Press "Run Schedule" to start.</span>
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
