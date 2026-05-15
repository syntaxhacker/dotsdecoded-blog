import { useState, useCallback } from 'react'
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

interface ObjState {
  id: string
  label: string
  type: string
  refCount: number
  freed: boolean
}

const initial: ObjState[] = [
  { id: 'A', label: 'session', type: 'dict', refCount: 2, freed: false },
  { id: 'B', label: 'config', type: 'dict', refCount: 1, freed: false },
  { id: 'C', label: 'user', type: 'object', refCount: 1, freed: false },
  { id: 'D', label: 'temp', type: 'buffer', refCount: 0, freed: false },
]

const initialRefs: [string, string][] = [
  ['Root', 'A'], ['Root', 'B'], ['A', 'C'],
]

export default function GcReferenceCountingDemo() {
  const [objs, setObjs] = useState<ObjState[]>(initial)
  const [refs, setRefs] = useState<[string, string][]>(initialRefs)
  const [message, setMessage] = useState('')
  const [showCycle, setShowCycle] = useState(false)
  const [cycleDetection, setCycleDetection] = useState(false)

  const addRef = useCallback((id: string) => {
    setObjs((prev) => prev.map((o) => o.id === id ? { ...o, refCount: o.refCount + 1 } : o))
    setRefs((prev) => [...prev, ['Root', id]])
    setMessage(`Root stores reference to ${id}. refCount increased.`)
  }, [])

  const removeRef = useCallback((id: string) => {
    setObjs((prev) => {
      const obj = prev.find((o) => o.id === id)
      if (!obj || obj.refCount <= 0) return prev
      const newCount = obj.refCount - 1
      if (newCount === 0) {
        setMessage(`${id} refCount = 0. Freed!`)
        return prev.map((o) => o.id === id ? { ...o, refCount: 0, freed: true } : o)
      }
      setMessage(`Root drops reference to ${id}. refCount = ${newCount}.`)
      return prev.map((o) => o.id === id ? { ...o, refCount: newCount } : o)
    })
    setRefs((prev) => {
      const idx = prev.findLastIndex((st) => st[1] === id)
      if (idx === -1) return prev
      return prev.filter((_, i) => i !== idx)
    })
  }, [])

  const undel = useCallback((id: string) => {
    setObjs((prev) => prev.map((o) => o.id === id ? { ...o, freed: false, refCount: 0 } : o))
    setMessage('')
  }, [])

  const createCycle = useCallback(() => {
    if (showCycle) return
    setShowCycle(true)
    setCycleDetection(false)
    setObjs((prev) => [
      ...prev,
      { id: 'X', label: 'orphan_a', type: 'cycle', refCount: 1, freed: false },
      { id: 'Y', label: 'orphan_b', type: 'cycle', refCount: 1, freed: false },
    ])
    setRefs((prev) => [...prev, ['X', 'Y'], ['Y', 'X']])
    setMessage('Created cycle: X -> Y -> X. Each has refCount = 1, but no root reaches them.')
  }, [showCycle])

  const detectCycles = useCallback(() => {
    setCycleDetection(true)
    setMessage('Cycle detected! X and Y reference each other. Reference counting alone cannot free them. A tracing GC (or cycle detector) is needed.')
  }, [])

  const reset = useCallback(() => {
    setObjs(initial.map((o) => ({ ...o })))
    setRefs([...initialRefs])
    setMessage('')
    setShowCycle(false)
    setCycleDetection(false)
  }, [])

  const rootRefs = refs.filter((st) => st[0] === 'Root').map((st) => st[1])
  const objRefs = refs.filter((st) => st[0] !== 'Root')

  return (
    <DemoBoundary name="Reference Counting GC">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Reference Counting</div>
        <p style={{ color: s.text2, fontSize: 13, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Each object tracks how many references point to it. When refCount hits 0, the object is freed immediately.
          Click [+ ref] to add a root reference. Click [- ref] to drop one.
        </p>

        <div style={{ padding: 12, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, marginBottom: 16 }}>
          <div style={{ color: s.yellow, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Root References</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {rootRefs.length === 0 && <span style={{ color: s.text3, fontSize: 12 }}>none</span>}
            {rootRefs.map((id) => (
              <span key={id} style={{
                background: s.bg3, padding: '2px 10px', borderRadius: 4,
                fontSize: 12, color: s.text, fontFamily: s.mono,
              }}>{id}</span>
            ))}
          </div>
          {objRefs.length > 0 && (
            <>
              <div style={{ color: s.text3, fontWeight: 600, fontSize: 12, marginTop: 10, marginBottom: 6 }}>Object References</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {objRefs.map((st, i) => (
                  <span key={i} style={{
                    background: s.bg3, padding: '2px 10px', borderRadius: 4,
                    fontSize: 12, color: s.text2, fontFamily: s.mono,
                  }}>{`${st[0]} -> ${st[1]}`}</span>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {objs.map((obj) => (
            <div key={obj.id} style={{
              background: obj.freed ? `${s.red}10` : s.bg,
              border: `1px solid ${obj.freed ? s.red : obj.refCount === 0 ? s.yellow : s.border}`,
              borderRadius: 10, padding: 16, opacity: obj.freed ? 0.4 : 1,
              transition: 'all 0.4s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: s.text, fontFamily: s.mono, fontSize: 14, fontWeight: 600 }}>{obj.id}</span>
                <span style={{
                  background: obj.type === 'cycle' ? `${s.orange}20` : s.bg3,
                  color: obj.type === 'cycle' ? s.orange : s.text3,
                  fontSize: 10, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
                }}>{obj.type}</span>
              </div>
              <div style={{ color: s.text2, fontSize: 12, marginBottom: 8 }}>{obj.label}</div>
              <div style={{
                fontSize: 28, fontWeight: 700, fontFamily: s.mono,
                color: obj.freed ? s.red : obj.refCount === 0 ? s.yellow : s.green,
                marginBottom: 10,
              }}>
                {obj.freed ? '--' : obj.refCount}
                <span style={{ color: s.text3, fontSize: 11, fontWeight: 400, marginLeft: 6 }}>refs</span>
              </div>
              {obj.freed ? (
                <button onClick={() => undel(obj.id)} style={{
                  background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '4px 12px',
                  color: s.text2, fontSize: 11, cursor: 'pointer', width: '100%',
                }}>Restore</button>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => addRef(obj.id)} style={{
                    flex: 1, background: s.accent, border: 'none', borderRadius: 6, padding: '6px 0',
                    color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>+ ref</button>
                  <button onClick={() => removeRef(obj.id)} style={{
                    flex: 1, background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 0',
                    color: s.text2, fontSize: 12, cursor: 'pointer',
                  }}>- ref</button>
                </div>
              )}
              {obj.type === 'cycle' && cycleDetection && (
                <div style={{
                  marginTop: 8, padding: 6, background: `${s.red}10`, borderRadius: 6,
                  color: s.red, fontSize: 11, lineHeight: 1.4,
                }}>
                  Cycle participant. refCount &gt; 0 but unreachable from root.
                </div>
              )}
            </div>
          ))}
        </div>

        {message && (
          <div style={{
            padding: '10px 14px', background: `${s.accent}10`, border: `1px solid ${s.accent}30`,
            borderRadius: 8, color: s.text, fontSize: 12, marginBottom: 12, lineHeight: 1.5,
          }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 16px',
            color: s.text2, cursor: 'pointer', fontSize: 12,
          }}>Reset</button>
          <button onClick={createCycle} disabled={showCycle} style={{
            background: showCycle ? s.bg3 : s.purple, border: 'none', borderRadius: 8, padding: '8px 16px',
            color: '#fff', cursor: showCycle ? 'default' : 'pointer', fontSize: 12, fontWeight: 600,
            opacity: showCycle ? 0.5 : 1,
          }}>Create Cycle</button>
          <button onClick={detectCycles} disabled={!showCycle || cycleDetection} style={{
            background: showCycle && !cycleDetection ? s.orange : s.bg3,
            border: 'none', borderRadius: 8, padding: '8px 16px',
            color: '#fff', cursor: showCycle && !cycleDetection ? 'pointer' : 'default',
            fontSize: 12, fontWeight: 600, opacity: showCycle && !cycleDetection ? 1 : 0.5,
          }}>Detect Cycle</button>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
