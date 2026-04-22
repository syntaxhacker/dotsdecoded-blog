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

type ConsistencyLevel = 'strong' | 'eventual'

type TimelineEvent = {
  time: number
  type: 'write' | 'read' | 'propagate'
  node: number
  value: string
  isStale?: boolean
}

type NodeState = {
  value: string
  lastUpdate: number
}

function ConsistencySpectrumDemoInner() {
  const [level, setLevel] = useState<ConsistencyLevel>('strong')
  const [nodes, setNodes] = useState<NodeState[]>([
    { value: '-', lastUpdate: 0 },
    { value: '-', lastUpdate: 0 },
    { value: '-', lastUpdate: 0 },
  ])
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [writeCount, setWriteCount] = useState(0)
  const [readTarget, setReadTarget] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrentTime(t => t + 1)
    }, 200)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  useEffect(() => {
    if (level === 'eventual') return
    nodes.forEach((nd, i) => {
      if (i === 0) return
      if (nd.value !== nodes[0].value && nd.lastUpdate < nodes[0].lastUpdate) {
        const delay = 400 + i * 100
        setTimeout(() => {
          setNodes(prev => {
            const next = [...prev]
            if (next[i].value !== next[0].value) {
              next[i] = { value: next[0].value, lastUpdate: currentTime + 2 }
              setEvents(prevEv => [...prevEv, { time: currentTime + 2, type: 'propagate', node: i, value: next[0].value }])
            }
            return next
          })
        }, delay)
      }
    })
  }, [nodes[0].value])

  const handleWrite = () => {
    const val = `v${writeCount + 1}`
    setWriteCount(c => c + 1)
    const t = currentTime + 2
    setNodes(prev => {
      const next = [...prev]
      next[0] = { value: val, lastUpdate: t }
      return next
    })
    setEvents(prev => [...prev, { time: t, type: 'write', node: 0, value: val }])

    if (level === 'eventual') {
      nodes.forEach((nd, i) => {
        if (i === 0) return
        const delay = 1000 + i * 800 + Math.random() * 600
        setTimeout(() => {
          setNodes(prev => {
            const next = [...prev]
            next[i] = { value: val, lastUpdate: currentTime + 8 }
            setEvents(prevEv => [...prevEv, { time: currentTime + 8, type: 'propagate', node: i, value: val }])
            return next
          })
        }, delay)
      })
    }
  }

  const handleRead = () => {
    const t = currentTime + 2
    const nd = nodes[readTarget]
    const isStale = readTarget !== 0 && nd.value !== nodes[0].value
    setEvents(prev => [...prev, { time: t, type: 'read', node: readTarget, value: nd.value, isStale }])
  }

  const isStale = (idx: number) => idx !== 0 && nodes[idx].value !== nodes[0].value && nodes[0].value !== '-'

  const recentEvents = events.slice(-12)

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }} ref={containerRef}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['strong', 'eventual'] as ConsistencyLevel[]).map(lv => (
          <button
            key={lv}
            onClick={() => { setLevel(lv); setNodes([{ value: '-', lastUpdate: 0 }, { value: '-', lastUpdate: 0 }, { value: '-', lastUpdate: 0 }]); setEvents([]); setWriteCount(0) }}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: 6,
              border: `1px solid ${level === lv ? s.accent : s.border}`,
              background: level === lv ? `${s.accent}20` : s.bg2,
              color: level === lv ? s.accent : s.text3,
              fontFamily: s.mono,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {lv === 'strong' ? 'Strong Consistency' : 'Eventual Consistency'}
          </button>
        ))}
      </div>

      <div style={{
        background: level === 'strong' ? `${s.accent}10` : `${s.yellow}10`,
        border: `1px solid ${level === 'strong' ? s.accent + '30' : s.yellow + '30'}`,
        borderRadius: 6,
        padding: '8px 12px',
        marginBottom: 14,
        fontSize: 11,
        color: level === 'strong' ? s.accent : s.yellow,
        fontFamily: s.mono,
        lineHeight: 1.5,
      }}>
        {level === 'strong'
          ? 'Every read returns the latest write. Replicas sync before acknowledging the write.'
          : 'Replicas update in the background. Reads may return stale data for a short window.'}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button
          onClick={handleWrite}
          style={{
            padding: '10px 20px',
            borderRadius: 6,
            border: `1px solid ${s.accent}`,
            background: `${s.accent}20`,
            color: s.accent,
            fontFamily: s.mono,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Write to Node 1
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>Read from</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map(i => (
              <button
                key={i}
                onClick={() => setReadTarget(i)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 4,
                  border: `1px solid ${readTarget === i ? s.purple : s.border}`,
                  background: readTarget === i ? `${s.purple}20` : s.bg2,
                  color: readTarget === i ? s.purple : s.text3,
                  fontFamily: s.mono,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                N{i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={handleRead}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: `1px solid ${s.purple}`,
              background: `${s.purple}20`,
              color: s.purple,
              fontFamily: s.mono,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Read
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        {nodes.map((nd, i) => (
          <div key={i} style={{
            background: s.bg2,
            borderRadius: 8,
            padding: 14,
            border: `1px solid ${isStale(i) ? s.yellow : i === 0 ? s.accent : s.border}`,
            textAlign: 'center',
            transition: 'border-color 0.3s ease',
          }}>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: i === 0 ? s.accent : s.text3, marginBottom: 8 }}>
              Node {i + 1} {i === 0 ? '(Primary)' : '(Replica)'}
            </div>
            <div style={{
              fontFamily: s.mono,
              fontSize: 24,
              fontWeight: 700,
              color: nd.value === '-' ? s.text3 : s.text,
              marginBottom: 4,
            }}>
              {nd.value}
            </div>
            {isStale(i) && (
              <div style={{ fontSize: 10, fontFamily: s.mono, color: s.yellow, fontWeight: 600 }}>
                STALE (expected: {nodes[0].value})
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: s.bg2, borderRadius: 8, padding: 12, border: `1px solid ${s.border}`, maxHeight: 160, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 6 }}>Event Timeline</div>
        {recentEvents.length === 0 ? (
          <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>Write to Node 1, then read from different nodes</div>
        ) : (
          recentEvents.map((ev, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '3px 0',
              borderBottom: i < recentEvents.length - 1 ? `1px solid ${s.bg3}` : 'none',
            }}>
              <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, minWidth: 24 }}>
                t{ev.time}
              </span>
              <span style={{
                fontFamily: s.mono,
                fontSize: 10,
                fontWeight: 700,
                color: ev.type === 'write' ? s.accent : ev.type === 'read' ? s.purple : s.green,
                minWidth: 64,
              }}>
                {ev.type === 'write' ? 'WRITE' : ev.type === 'read' ? 'READ' : 'PROPAGATE'}
              </span>
              <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, minWidth: 48 }}>
                Node {ev.node + 1}
              </span>
              <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text2 }}>
                {ev.type === 'read' ? `"${ev.value}"${ev.isStale ? ' (stale!)' : ''}` : `"${ev.value}"`}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function ConsistencySpectrumDemo() {
  return (
    <DemoBoundary name="Consistency Spectrum">
      <ConsistencySpectrumDemoInner />
    </DemoBoundary>
  )
}
