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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

type Region = 'eden' | 's0' | 's1' | 'old'

interface HeapObj {
  id: string
  region: Region
  age: number
  color: string
  survivedMinor: number
}

const COLORS = ['#5b8def', '#3dd68c', '#e0b040', '#e85d5d', '#9b7bea', '#e8945a', '#f1f2f3', '#acb0b9']

let objCounter = 0

const TOTAL_PHASES = 7

const PHASE_LABELS = [
  'Initial empty heap',
  'Phase 1: Objects allocated in Eden',
  'Minor GC 1: Survivors move to S0. Unreachable objects freed.',
  'Phase 2: New objects allocated in Eden',
  'Minor GC 2: Survivors from Eden go to S0. Previous S0 goes to S1.',
  'Phase 3: More allocations + aging',
  'Minor GC 3: S1 survivors (age threshold) promoted to Old gen.',
]

const PHASE_ACTIONS: ((objs: HeapObj[]) => HeapObj[])[] = [
  (objs) => objs,
  (objs) => {
    const n = [
      { id: `o${++objCounter}`, region: 'eden' as Region, age: 0, color: COLORS[objCounter % COLORS.length], survivedMinor: 0 },
      { id: `o${++objCounter}`, region: 'eden' as Region, age: 0, color: COLORS[objCounter % COLORS.length], survivedMinor: 0 },
      { id: `o${++objCounter}`, region: 'eden' as Region, age: 0, color: COLORS[objCounter % COLORS.length], survivedMinor: 0 },
      { id: `o${++objCounter}`, region: 'eden' as Region, age: 0, color: COLORS[objCounter % COLORS.length], survivedMinor: 0 },
    ]
    return [...objs, ...n]
  },
  (objs) => {
    return objs.map((o) => {
      if (o.region === 'eden') {
        if (Math.random() < 0.6 || o.survivedMinor >= 1) {
          return { ...o, region: 's0' as Region, age: o.age + 1, survivedMinor: o.survivedMinor + 1 }
        }
        return { ...o, region: 'eden' as Region, age: -1 }
      }
      return o
    }).filter((o) => o.age >= 0 && o.region !== 'eden')
  },
  (objs) => {
    const n = [
      { id: `o${++objCounter}`, region: 'eden' as Region, age: 0, color: COLORS[objCounter % COLORS.length], survivedMinor: 0 },
      { id: `o${++objCounter}`, region: 'eden' as Region, age: 0, color: COLORS[objCounter % COLORS.length], survivedMinor: 0 },
    ]
    return [...objs, ...n]
  },
  (objs) => {
    return objs.map((o) => {
      if (o.region === 's1') {
        return { ...o }
      }
      if (o.region === 'eden') {
        if (Math.random() < 0.5) {
          return { ...o, region: 's0' as Region, age: o.age + 1, survivedMinor: o.survivedMinor + 1 }
        }
        return { ...o, region: 'eden' as Region, age: -1 }
      }
      if (o.region === 's0') {
        return { ...o, region: 's1' as Region, age: o.age + 1 }
      }
      return o
    }).filter((o) => o.age >= 0)
  },
  (objs) => {
    const n = [
      { id: `o${++objCounter}`, region: 'eden' as Region, age: 0, color: COLORS[objCounter % COLORS.length], survivedMinor: 0 },
      { id: `o${++objCounter}`, region: 'eden' as Region, age: 0, color: COLORS[objCounter % COLORS.length], survivedMinor: 0 },
      { id: `o${++objCounter}`, region: 'eden' as Region, age: 0, color: COLORS[objCounter % COLORS.length], survivedMinor: 0 },
    ]
    return [...objs, ...n]
  },
  (objs) => {
    return objs.map((o) => {
      if (o.region === 'eden') {
        if (Math.random() < 0.4) {
          return { ...o, region: 's0' as Region, age: o.age + 1, survivedMinor: o.survivedMinor + 1 }
        }
        return { ...o, region: 'eden' as Region, age: -1 }
      }
      if (o.region === 's0') {
        return o.survivedMinor >= 1
          ? { ...o, region: 'old' as Region, age: o.age + 1 }
          : { ...o, region: 's1' as Region, age: o.age + 1, survivedMinor: o.survivedMinor + 1 }
      }
      if (o.region === 's1') {
        return o.survivedMinor >= 2
          ? { ...o, region: 'old' as Region, age: o.age + 1 }
          : { ...o, region: 's0' as Region, age: o.age + 1 }
      }
      return o
    }).filter((o) => o.age >= 0).slice(0, 20)
  },
]

export default function GcGenerationalDemo() {
  const [phase, setPhase] = useState(0)
  const [objects, setObjects] = useState<HeapObj[]>([])
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    objCounter = 0
  }, [])

  const advance = useCallback(() => {
    setPhase((p) => {
      if (p >= TOTAL_PHASES - 1) return p
      const next = p + 1
      setObjects((prev) => {
        if (next < PHASE_ACTIONS.length) {
          return PHASE_ACTIONS[next](prev)
        }
        return prev
      })
      return next
    })
  }, [])

  useEffect(() => {
    if (!playing || phase >= TOTAL_PHASES - 1) return
    const delay = getStepDelay(1800, speed)
    const t = setTimeout(() => advance(), delay)
    return () => clearTimeout(t)
  }, [playing, phase, speed, advance])

  const reset = useCallback(() => {
    setPhase(0)
    setPlaying(false)
    objCounter = 0
    setObjects([])
  }, [])

  const edenObjs = objects.filter((o) => o.region === 'eden' || (o.region === 'eden' && o.age >= 0))
  const s0Objs = objects.filter((o) => o.region === 's0')
  const s1Objs = objects.filter((o) => o.region === 's1')
  const oldObjs = objects.filter((o) => o.region === 'old')

  const edenObjsLive = objects.filter((o) => o.region === 'eden' && o.age >= 0)
  const s0ObjsLive = objects.filter((o) => o.region === 's0' && o.age >= 0)
  const s1ObjsLive = objects.filter((o) => o.region === 's1' && o.age >= 0)
  const oldObjsLive = objects.filter((o) => o.region === 'old' && o.age >= 0)

  const renderObj = (o: HeapObj, i: number) => (
    <div key={o.id} style={{
      width: 22, height: 22, borderRadius: 4,
      background: o.color + '80',
      border: `2px solid ${o.color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 7, color: '#fff', fontWeight: 600, fontFamily: s.mono,
      flexShrink: 0,
    }} title={`age=${o.age}`}>
      {o.age}
    </div>
  )

  return (
    <DemoBoundary name="Generational GC">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Generational GC</div>
        <p style={{ color: s.text2, fontSize: 13, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          The generational hypothesis: most objects die young. Eden is the nursery. Survivor spaces hold aging objects.
          Old generation stores long-lived objects. Minor GCs are fast; major GCs are rare but expensive.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={advance} disabled={phase >= TOTAL_PHASES - 1} style={{
              background: s.accent, border: 'none', borderRadius: 6, padding: '6px 14px',
              color: '#fff', fontSize: 12, cursor: phase >= TOTAL_PHASES - 1 ? 'default' : 'pointer', fontWeight: 600,
              opacity: phase >= TOTAL_PHASES - 1 ? 0.5 : 1,
            }}>Step</button>
            <button onClick={() => setPlaying(!playing)} style={{
              background: playing ? s.red : s.green, border: 'none', borderRadius: 6, padding: '6px 14px',
              color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600,
            }}>{playing ? 'Stop' : 'Play'}</button>
            <button onClick={reset} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 14px',
              color: s.text2, fontSize: 12, cursor: 'pointer',
            }}>Reset</button>
          </div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            padding: '8px 14px', background: `${s.accent}15`,
            borderBottom: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: s.accent, fontSize: 12, fontWeight: 600 }}>Phase {phase}/{TOTAL_PHASES - 1}</span>
            <span style={{ color: s.text2, fontSize: 11 }}>{PHASE_LABELS[phase]}</span>
          </div>

          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
              }}>
                <span style={{ color: s.yellow, fontSize: 12, fontWeight: 600 }}>Young Generation</span>
                <span style={{ color: s.text3, fontSize: 10 }}>{edenObjsLive.length + s0ObjsLive.length + s1ObjsLive.length} objects</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 2, background: s.bg3, borderRadius: 8, padding: 8, minHeight: 50 }}>
                  <div style={{ color: s.text3, fontSize: 9, marginBottom: 4 }}>Eden</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {edenObjsLive.map((o, i) => renderObj(o, i))}
                    {edenObjsLive.length === 0 && <span style={{ color: s.text3, fontSize: 10 }}>empty</span>}
                  </div>
                </div>
                <div style={{ flex: 1, background: s.bg3, borderRadius: 8, padding: 8, minHeight: 50 }}>
                  <div style={{ color: s.text3, fontSize: 9, marginBottom: 4 }}>S0</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {s0ObjsLive.map((o, i) => renderObj(o, i))}
                    {s0ObjsLive.length === 0 && <span style={{ color: s.text3, fontSize: 10 }}>empty</span>}
                  </div>
                </div>
                <div style={{ flex: 1, background: s.bg3, borderRadius: 8, padding: 8, minHeight: 50 }}>
                  <div style={{ color: s.text3, fontSize: 9, marginBottom: 4 }}>S1</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {s1ObjsLive.map((o, i) => renderObj(o, i))}
                    {s1ObjsLive.length === 0 && <span style={{ color: s.text3, fontSize: 10 }}>empty</span>}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
              }}>
                <span style={{ color: s.green, fontSize: 12, fontWeight: 600 }}>Old Generation</span>
                <span style={{ color: s.text3, fontSize: 10 }}>{oldObjsLive.length} objects</span>
              </div>
              <div style={{ background: s.bg3, borderRadius: 8, padding: 8, minHeight: 50 }}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {oldObjsLive.map((o, i) => renderObj(o, i))}
                  {oldObjsLive.length === 0 && <span style={{ color: s.text3, fontSize: 10 }}>empty</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 16, display: 'flex', gap: 10, fontSize: 11, color: s.text3, flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.yellow }} /> Young gen
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.green }} /> Old gen
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.text3 }} /> Age = survive count
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.red }} /> Freed (unreachable)
          </span>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
