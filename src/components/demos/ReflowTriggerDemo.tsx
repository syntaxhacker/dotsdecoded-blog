import { useState, useCallback, useRef } from 'react'
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

interface TriggerOp {
  id: string
  label: string
  category: 'read' | 'write'
  color: string
}

const operations: TriggerOp[] = [
  { id: 'offsetHeight', label: 'Read offsetHeight', category: 'read', color: s.accent },
  { id: 'offsetTop', label: 'Read offsetTop', category: 'read', color: s.accent },
  { id: 'getBoundingClientRect', label: 'Read getBoundingClientRect()', category: 'read', color: s.accent },
  { id: 'width', label: 'Change width', category: 'write', color: s.yellow },
  { id: 'height', label: 'Change height', category: 'write', color: s.yellow },
  { id: 'margin', label: 'Change margin', category: 'write', color: s.yellow },
  { id: 'padding', label: 'Change padding', category: 'write', color: s.yellow },
  { id: 'fontSize', label: 'Change font-size', category: 'write', color: s.yellow },
  { id: 'addClass', label: 'Add/remove class', category: 'write', color: s.yellow },
  { id: 'resize', label: 'Resize window', category: 'write', color: s.orange },
]

export default function ReflowTriggerDemo() {
  const [reflowCount, setReflowCount] = useState(0)
  const [timeline, setTimeline] = useState<{ id: string; batch: boolean; time: number }[]>([])
  const [batched, setBatched] = useState(true)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [pendingWrites, setPendingWrites] = useState(0)
  const pendingRef = useRef(0)

  const triggerReflow = useCallback((op: TriggerOp) => {
    const now = Date.now()
    const isRead = op.category === 'read'

    if (batched) {
      if (isRead) {
        if (pendingRef.current > 0) {
          pendingRef.current = 0
          setPendingWrites(0)
        }
        setReflowCount(prev => prev + 1)
        setTimeline(prev => [...prev, { id: op.id, batch: true, time: now }])
      } else {
        pendingRef.current += 1
        setPendingWrites(pendingRef.current)
      }
      if (!isRead) return
    } else {
      if (isRead && pendingRef.current > 0) {
        pendingRef.current = 0
        setPendingWrites(0)
        setReflowCount(prev => prev + 1)
        setTimeline(prev => [...prev, { id: op.id, batch: true, time: now }])
        setFlashId(op.id)
        setTimeout(() => setFlashId(null), 300)
        return
      }
      setReflowCount(prev => prev + 1)
      setTimeline(prev => [...prev, { id: op.id, batch: false, time: now }])
    }

    setFlashId(op.id)
    setTimeout(() => setFlashId(null), 300)
  }, [batched])

  const flushWrites = useCallback(() => {
    if (pendingRef.current > 0) {
      setReflowCount(prev => prev + 1)
      setTimeline(prev => [...prev, { id: 'batch-flush', batch: true, time: Date.now() }])
      pendingRef.current = 0
      setPendingWrites(0)
    }
  }, [])

  const clearAll = useCallback(() => {
    setReflowCount(0)
    setTimeline([])
    setFlashId(null)
    setPendingWrites(0)
    pendingRef.current = 0
  }, [])

  return (
    <DemoBoundary name="Reflow Triggers">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={H}>Reflow Triggers</div>
          <div style={{
            display: 'flex', gap: 6, alignItems: 'center',
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 4,
          }}>
            <button onClick={() => setBatched(true)} style={{
              background: batched ? s.accent : 'transparent', border: 'none', borderRadius: 5,
              padding: '5px 12px', color: batched ? '#fff' : s.text3, fontSize: 11, cursor: 'pointer',
              fontWeight: batched ? 600 : 400, transition: 'all 0.15s',
            }}>Batched</button>
            <button onClick={() => setBatched(false)} style={{
              background: !batched ? s.accent : 'transparent', border: 'none', borderRadius: 5,
              padding: '5px 12px', color: !batched ? '#fff' : s.text3, fontSize: 11, cursor: 'pointer',
              fontWeight: !batched ? 600 : 400, transition: 'all 0.15s',
            }}>Unbatched</button>
          </div>
        </div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          {batched
            ? 'Writes are deferred. Only reads and the final flush trigger reflow.'
            : 'Every read after a write forces an immediate (synchronous) reflow.'
          }
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {operations.map(op => (
            <button
              key={op.id}
              onClick={() => {
                if (batched && op.category === 'write') {
                  triggerReflow(op)
                  setTimeout(flushWrites, 200)
                } else {
                  triggerReflow(op)
                }
              }}
              style={{
                padding: '8px 14px', borderRadius: 8, border: `1px solid ${flashId === op.id ? op.color : s.border}`,
                background: flashId === op.id ? `${op.color}20` : s.bg,
                color: flashId === op.id ? op.color : s.text2,
                cursor: 'pointer', fontSize: 11, transition: 'all 0.15s',
                fontWeight: 500,
              }}
            >
              {op.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '12px 20px', flex: 1,
          }}>
            <div style={{ color: s.red, fontFamily: s.mono, fontSize: 28, fontWeight: 700 }}>{reflowCount}</div>
            <div style={{ color: s.text3, fontSize: 11, marginTop: 2 }}>Total Reflows</div>
          </div>
          {batched && (
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '12px 20px', flex: 1,
            }}>
              <div style={{ color: s.yellow, fontFamily: s.mono, fontSize: 28, fontWeight: 700 }}>{pendingWrites}</div>
              <div style={{ color: s.text3, fontSize: 11, marginTop: 2 }}>Pending Writes</div>
            </div>
          )}
          <div style={{
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '12px 20px', flex: 1,
          }}>
            <div style={{ color: s.text, fontFamily: s.mono, fontSize: 14, fontWeight: 700 }}>{batched ? 'Batched' : 'Unbatched'}</div>
            <div style={{ color: s.text3, fontSize: 11, marginTop: 2 }}>Mode</div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Timeline</div>
          <div style={{
            background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
            padding: '12px 16px', minHeight: 60, maxHeight: 100, overflowY: 'auto',
          }}>
            {timeline.length === 0 ? (
              <div style={{ color: s.text3, fontSize: 12 }}>No reflows yet. Click an operation above.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {timeline.slice(-20).map((entry, idx) => {
                  const op = operations.find(o => o.id === entry.id)
                  const c = op?.color || s.accent
                  return (
                    <div key={`${entry.time}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: c, flexShrink: 0,
                      }} />
                      <span style={{ color: s.text2 }}>{op?.label || 'Flush'}</span>
                      {entry.batch && <span style={{ color: s.green, fontSize: 10 }}>(batched)</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <button onClick={clearAll} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 18px',
          color: s.text2, cursor: 'pointer', fontSize: 12,
        }}>Clear</button>
      </div>

      <div style={SEC}>
        <div style={H}>How Batching Works</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{
            background: s.bg, borderRadius: 8, border: `1px solid ${!batched ? s.red : s.border}`,
            padding: 14,
          }}>
            <div style={{ color: !batched ? s.red : s.text3, fontSize: 11, marginBottom: 8, fontWeight: 600 }}>Unbatched Pattern</div>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, lineHeight: 2 }}>
              <div>div.style.width = '100px'</div>
              <div style={{ color: s.red }}>console.log(div.offsetWidth) {'// FORCED REFLOW'}</div>
              <div>div.style.height = '50px'</div>
              <div style={{ color: s.red }}>console.log(div.offsetHeight) {'// FORCED REFLOW'}</div>
            </div>
          </div>
          <div style={{
            background: s.bg, borderRadius: 8, border: `1px solid ${batched ? s.green : s.border}`,
            padding: 14,
          }}>
            <div style={{ color: batched ? s.green : s.text3, fontSize: 11, marginBottom: 8, fontWeight: 600 }}>Batched Pattern</div>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, lineHeight: 2 }}>
              <div>div.style.width = '100px'</div>
              <div>div.style.height = '50px'</div>
              <div style={{ color: s.green }}>console.log(div.offsetHeight) {'// ONE reflow total'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
