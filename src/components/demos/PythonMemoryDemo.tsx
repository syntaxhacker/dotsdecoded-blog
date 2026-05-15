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

interface HeapObj {
  id: number
  label: string
  size: string
  type: 'list' | 'dict' | 'str' | 'node'
  refcount: number
  references: number[]
  hasCycle: boolean
}

const initialObjects: HeapObj[] = [
  { id: 1, label: 'list', size: '56 B', type: 'list', refcount: 0, references: [], hasCycle: false },
  { id: 2, label: 'str "hello"', size: '32 B', type: 'str', refcount: 0, references: [], hasCycle: false },
  { id: 3, label: 'dict', size: '72 B', type: 'dict', refcount: 0, references: [], hasCycle: false },
  { id: 4, label: 'Node', size: '48 B', type: 'node', refcount: 0, references: [], hasCycle: false },
  { id: 5, label: 'Node', size: '48 B', type: 'node', refcount: 0, references: [], hasCycle: false },
]

const arrowLabels: Record<string, string> = {
  '1->3': 'container',
  '3->2': 'key: "msg"',
  '4->5': 'next',
  '5->4': 'prev',
}

export default function PythonMemoryDemo() {
  const [objects, setObjects] = useState<HeapObj[]>(JSON.parse(JSON.stringify(initialObjects)))
  const [refs, setRefs] = useState<{ from: number; to: number; label: string }[]>([])
  const [gcResult, setGcResult] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-14), msg])
  }, [])

  const createRef = (fromId: number, toId: number) => {
    setObjects(prev => prev.map(obj => {
      if (obj.id === toId) {
        const newRef = obj.refcount + 1
        addLog(`Assign ref: obj_${toId} refcount ${obj.refcount} -> ${newRef}`)
        return { ...obj, refcount: newRef }
      }
      if (obj.id === fromId) {
        return { ...obj, references: [...obj.references, toId] }
      }
      return obj
    }))
    const labelKey = `${fromId}->${toId}`
    setRefs(prev => [...prev, { from: fromId, to: toId, label: arrowLabels[labelKey] || 'ref' }])
  }

  const removeRef = (fromId: number, toId: number) => {
    setObjects(prev => prev.map(obj => {
      if (obj.id === toId) {
        const newRef = Math.max(0, obj.refcount - 1)
        if (newRef === 0) {
          addLog(`obj_${toId} refcount 0 -- deallocated`)
        } else {
          addLog(`Del ref: obj_${toId} refcount ${obj.refcount} -> ${newRef}`)
        }
        return { ...obj, refcount: newRef }
      }
      if (obj.id === fromId) {
        return { ...obj, references: obj.references.filter(r => r !== toId) }
      }
      return obj
    }))
    setRefs(prev => prev.filter(r => !(r.from === fromId && r.to === toId)))
  }

  const createCycle = () => {
    createRef(4, 5)
    setTimeout(() => createRef(5, 4), 100)
    addLog('Created cycle: Node A -> Node B -> Node A')
    setObjects(prev => prev.map(obj => {
      if (obj.id === 4 || obj.id === 5) return { ...obj, hasCycle: true }
      return obj
    }))
  }

  const forceGC = () => {
    let freed = 0
    const cycleNodeIds = [4, 5]
    const cycleNodes = objects.filter(o => cycleNodeIds.includes(o.id))

    const hasCycle = cycleNodes.every(o => o.refcount > 0) && refs.some(r => r.from === 4 && r.to === 5) && refs.some(r => r.from === 5 && r.to === 4)
    const externalRefs = refs.filter(r => cycleNodeIds.includes(r.to) && !cycleNodeIds.includes(r.from))

    if (hasCycle && externalRefs.length === 0) {
      const toFree = cycleNodes.filter(o => o.refcount > 0)
      toFree.forEach(o => {
        addLog(`GC detected cycle: obj_${o.id} is unreachable cyclic garbage`)
        freed++
      })
      setObjects(prev => prev.map(obj => {
        if (cycleNodeIds.includes(obj.id)) {
          return { ...obj, refcount: 0, hasCycle: false }
        }
        return obj
      }))
      setRefs(prev => prev.filter(r => !(cycleNodeIds.includes(r.from) && cycleNodeIds.includes(r.to))))
      setGcResult(`GC freed ${freed} cyclic object${freed > 1 ? 's' : ''}`)
      if (freed > 0) {
        addLog(`GC collected ${freed} cyclic garbage object${freed > 1 ? 's' : ''}`)
      }
    } else if (externalRefs.length > 0) {
      setGcResult('Cycle exists but objects still have external references -- not freed')
      addLog('GC: cycle found but external refs exist -- cannot collect')
    } else {
      setGcResult('No cyclic garbage detected')
      addLog('GC ran: no unreachable cycles found')
    }

    setTimeout(() => setGcResult(null), 2500)
  }

  const reset = () => {
    setObjects(JSON.parse(JSON.stringify(initialObjects)))
    setRefs([])
    setGcResult(null)
    setLogs([])
  }

  const getObjColor = (obj: HeapObj) => {
    if (obj.refcount === 0 && obj.hasCycle) return s.yellow
    if (obj.refcount === 0) return s.bg3
    if (obj.type === 'list') return s.accent
    if (obj.type === 'str') return s.green
    if (obj.type === 'dict') return s.orange
    if (obj.type === 'node') return s.purple
    return s.text
  }

  const objCol = (obj: HeapObj) => {
    if (obj.type === 'list') return s.accent
    if (obj.type === 'str') return s.green
    if (obj.type === 'dict') return s.orange
    if (obj.type === 'node') return s.purple
    return s.text3
  }

  return (
    <DemoBoundary name="Memory Manager">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>CPython Memory Management</div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => createRef(1, 3)} style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '7px 14px', color: s.text2, cursor: 'pointer', fontSize: 12 }}>{'list --> dict'}</button>
        <button onClick={() => createRef(3, 2)} style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '7px 14px', color: s.text2, cursor: 'pointer', fontSize: 12 }}>{'dict --> str'}</button>
        <button onClick={createCycle} style={{ background: s.yellow, border: 'none', borderRadius: 8, padding: '7px 14px', color: '#000', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Create Reference Cycle</button>
        <button onClick={forceGC} style={{ background: s.purple, border: 'none', borderRadius: 8, padding: '7px 14px', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Force GC</button>
        <button onClick={reset} style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '7px 14px', color: s.text2, cursor: 'pointer', fontSize: 12 }}>Reset</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {objects.map(obj => {
          const outgoingRefs = refs.filter(r => r.from === obj.id)
          const color = objCol(obj)
          return (
            <div key={obj.id} style={{
              background: s.bg2, borderRadius: 12, padding: 12, minWidth: 120,
              border: `1px solid ${obj.refcount > 0 ? color : s.border}`,
              opacity: obj.refcount === 0 && !obj.hasCycle ? 0.5 : 1,
              transition: 'all 0.3s',
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginBottom: 4 }}>obj_{obj.id}</div>
              <div style={{ color, fontFamily: s.mono, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{obj.label}</div>
              <div style={{ color: s.text3, fontSize: 10, marginBottom: 6 }}>{obj.size} | {obj.type}</div>
              <div style={{
                background: obj.refcount > 0 ? `${color}22` : s.bg, borderRadius: 6, padding: '4px 8px',
                textAlign: 'center',
                border: `1px solid ${obj.refcount > 0 ? color : s.border}`,
              }}>
                <span style={{ color: s.text3, fontSize: 9 }}>refcount: </span>
                <span style={{ color: obj.refcount > 0 ? color : s.text3, fontFamily: s.mono, fontSize: 16, fontWeight: 700 }}>
                  {obj.refcount}
                </span>
              </div>
              {obj.hasCycle && obj.refcount > 0 && (
                <div style={{ color: s.yellow, fontSize: 9, marginTop: 4, textAlign: 'center' }}>cycle suspect</div>
              )}
              {outgoingRefs.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {outgoingRefs.map(r => (
                    <div key={`${r.from}->${r.to}`} style={{
                      fontSize: 9, color: s.text3, fontFamily: s.mono,
                      background: s.bg, borderRadius: 4, padding: '2px 6px',
                    }}>
                      {'-->'} obj_{r.to} {r.label !== 'ref' ? `(${r.label})` : ''}
                    </div>
                  ))}
                </div>
              )}
              {outgoingRefs.length === 0 && (
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => {
                    const target = prompt('Target object ID (1-5):')
                    if (target) {
                      const tid = parseInt(target)
                      if (tid >= 1 && tid <= 5 && tid !== obj.id) {
                        createRef(obj.id, tid)
                      }
                    }
                  }} style={{
                    background: 'transparent', border: `1px dashed ${s.border}`, borderRadius: 4, padding: '2px 8px',
                    color: s.text3, cursor: 'pointer', fontSize: 9, width: '100%',
                  }}>+ ref</button>
                </div>
              )}
              {outgoingRefs.map(r => (
                <button key={`del-${r.from}->${r.to}`} onClick={() => removeRef(r.from, r.to)} style={{
                  background: `${s.red}22`, border: `1px solid ${s.red}44`, borderRadius: 4, padding: '2px 8px',
                  color: s.red, cursor: 'pointer', fontSize: 9, width: '100%', marginTop: 2,
                }}>del ref</button>
              ))}
            </div>
          )
        })}
      </div>

      {gcResult && (
        <div style={{
          background: `${s.purple}22`, border: `1px solid ${s.purple}44`, borderRadius: 8,
          padding: '10px 16px', marginBottom: 16, color: s.purple, fontSize: 13, fontWeight: 600,
        }}>
          {gcResult}
        </div>
      )}

      <div style={{ background: s.bg2, borderRadius: 12, padding: 12 }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Memory Log</div>
        <div style={{ maxHeight: 120, overflowY: 'auto', background: s.bg, borderRadius: 8, padding: 8 }}>
          {logs.map((msg, i) => {
            const isGC = msg.includes('GC')
            const isDealloc = msg.includes('deallocated')
            return (
              <div key={i} style={{
                color: isGC ? s.purple : isDealloc ? s.red : s.text3,
                fontFamily: s.mono, fontSize: 10, lineHeight: 1.6,
              }}>{msg}</div>
            )
          })}
          {logs.length === 0 && <div style={{ color: s.text3, fontSize: 11, fontStyle: 'italic' }}>Create refs to see reference counting in action</div>}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
