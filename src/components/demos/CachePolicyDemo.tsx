import React, { useState } from 'react'
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

type Pattern = 'cache-aside' | 'write-through' | 'write-back' | 'write-around'

interface LogEntry {
  id: number
  text: string
  type: 'read' | 'write' | 'hit' | 'miss' | 'evict'
}

const patterns: { key: Pattern; name: string; desc: string }[] = [
  { key: 'cache-aside', name: 'Cache-Aside', desc: 'App checks cache first. On miss, reads from DB and populates cache.' },
  { key: 'write-through', name: 'Write-Through', desc: 'Write to cache and DB simultaneously. Always consistent.' },
  { key: 'write-back', name: 'Write-Back', desc: 'Write to cache only. DB updated later (async). Fast writes, risk of data loss.' },
  { key: 'write-around', name: 'Write-Around', desc: 'Write directly to DB (bypass cache). Cache populated on next read.' },
]

const BOX: React.CSSProperties = {
  borderRadius: 10, padding: '14px 18px', textAlign: 'center', minWidth: 100, flex: 1,
}

export default function CachePolicyDemo() {
  const [pattern, setPattern] = useState<Pattern>('cache-aside')
  const [cacheContent, setCacheContent] = useState<string | null>(null)
  const [dbContent, setDbContent] = useState<string | null>('user:42')
  const [log, setLog] = useState<LogEntry[]>([])
  const [activeFlow, setActiveFlow] = useState<string | null>(null)
  const [highlightCache, setHighlightCache] = useState<'hit' | 'miss' | 'write' | null>(null)
  const [highlightDb, setHighlightDb] = useState<'read' | 'write' | null>(null)
  const nextIdRef = React.useRef(0)

  const addLog = (text: string, type: LogEntry['type']) => {
    const id = nextIdRef.current++
    setLog(prev => [...prev.slice(-8), { id, text, type }])
  }

  const clearHighlights = () => {
    setHighlightCache(null)
    setHighlightDb(null)
    setActiveFlow(null)
  }

  const doRead = () => {
    clearHighlights()

    if (pattern === 'cache-aside' || pattern === 'write-around') {
      if (cacheContent) {
        setActiveFlow('cache-hit')
        setHighlightCache('hit')
        addLog(`CACHE HIT: key="user:42"`, 'hit')
      } else {
        setActiveFlow('cache-miss')
        setHighlightCache('miss')
        addLog(`CACHE MISS: key="user:42"`, 'miss')
        setTimeout(() => {
          setHighlightDb('read')
          addLog(`DB READ: SELECT * FROM users WHERE id=42`, 'read')
          setTimeout(() => {
            setCacheContent(dbContent)
            setHighlightCache('write')
            addLog(`CACHE POPULATE: stored DB result`, 'write')
          }, 600)
        }, 600)
      }
    } else if (pattern === 'write-through' || pattern === 'write-back') {
      if (cacheContent) {
        setActiveFlow('cache-hit')
        setHighlightCache('hit')
        addLog(`CACHE HIT: key="user:42"`, 'hit')
      } else {
        setActiveFlow('cache-miss')
        setHighlightCache('miss')
        addLog(`CACHE MISS: key="user:42"`, 'miss')
        setTimeout(() => {
          setHighlightDb('read')
          addLog(`DB READ: fetching from database`, 'read')
          setTimeout(() => {
            setCacheContent(dbContent)
            addLog(`CACHE POPULATE: stored result`, 'write')
          }, 600)
        }, 600)
      }
    }
  }

  const doWrite = () => {
    clearHighlights()
    const newval = `user:${Date.now() % 1000}`

    if (pattern === 'cache-aside') {
      setHighlightCache('write')
      setCacheContent(newval)
      addLog(`CACHE WRITE: key="user:42" (application managed)`, 'write')
      setTimeout(() => {
        setHighlightDb('write')
        setDbContent(newval)
        addLog(`DB WRITE: UPDATE users SET ... WHERE id=42`, 'write')
        addLog(`Note: app must invalidate/update cache on write`, 'miss')
      }, 600)
    } else if (pattern === 'write-through') {
      setActiveFlow('write-both')
      setHighlightCache('write')
      setHighlightDb('write')
      setCacheContent(newval)
      setDbContent(newval)
      addLog(`WRITE-THROUGH: cache + DB updated simultaneously`, 'write')
    } else if (pattern === 'write-back') {
      setHighlightCache('write')
      setCacheContent(newval)
      addLog(`WRITE-BACK: cache updated immediately`, 'write')
      addLog(`DB WRITE: deferred (queued for later)`, 'miss')
      setTimeout(() => {
        setHighlightDb('write')
        setDbContent(newval)
        addLog(`DB FLUSH: async write completed`, 'write')
      }, 1500)
    } else if (pattern === 'write-around') {
      setHighlightDb('write')
      setDbContent(newval)
      setCacheContent(null)
      addLog(`WRITE-AROUND: DB updated directly`, 'write')
      addLog(`CACHE: invalidated (next read will repopulate)`, 'evict')
    }
  }

  const reset = () => {
    setCacheContent(null)
    setDbContent('user:42')
    setLog([])
    clearHighlights()
    nextIdRef.current = 0
  }

  const current = patterns.find(p => p.key === pattern)!

  return (
    <DemoBoundary name="Cache Write/Read Patterns">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Cache Patterns</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Different strategies for how data flows between your application, cache, and database.
          Select a pattern, then trigger reads and writes to see the data flow.
        </p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {patterns.map(p => (
            <button key={p.key} onClick={() => { setPattern(p.key); reset() }} style={{
              background: pattern === p.key ? s.accent : s.bg3,
              border: `1px solid ${pattern === p.key ? s.accent : s.border}`,
              borderRadius: 8, padding: '7px 14px', color: pattern === p.key ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 12, fontWeight: pattern === p.key ? 600 : 400,
              transition: 'all 0.2s',
            }}>{p.name}</button>
          ))}
        </div>

        <div style={{ background: s.bg, borderRadius: 8, padding: 10, marginBottom: 16, border: `1px solid ${s.border}` }}>
          <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>{current.desc}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{
            ...BOX, background: s.bg,
            border: `2px solid ${highlightCache === 'hit' ? s.green : highlightCache === 'miss' ? s.yellow : highlightCache === 'write' ? s.accent : s.border}`,
            transition: 'border-color 0.3s',
          }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Cache (Redis)</div>
            <div style={{ color: cacheContent ? s.green : s.text3, fontFamily: s.mono, fontSize: 13, fontWeight: 600, minHeight: 20 }}>
              {cacheContent || 'EMPTY'}
            </div>
          </div>

          <svg width={80} height={40} style={{ flexShrink: 0 }}>
            {(activeFlow === 'cache-hit') ? (
              <>
                <line x1={0} y1={20} x2={80} y2={20} stroke={s.green} strokeWidth={2} />
                <polygon points="78,16 80,20 78,24" fill={s.green} />
                <text x={40} y={14} textAnchor="middle" fill={s.green} fontSize={9} fontFamily={s.mono}>HIT</text>
              </>
            ) : (activeFlow === 'cache-miss' || activeFlow === 'write-both') ? (
              <>
                <line x1={0} y1={20} x2={80} y2={20} stroke={s.yellow} strokeWidth={2} />
                <polygon points="78,16 80,20 78,24" fill={s.yellow} />
                <text x={40} y={14} textAnchor="middle" fill={s.yellow} fontSize={9} fontFamily={s.mono}>MISS</text>
              </>
            ) : (
              <>
                <line x1={10} y1={20} x2={70} y2={20} stroke={s.border} strokeWidth={1.5} strokeDasharray="4 3" />
                <polygon points="68,17 70,20 68,23" fill={s.border} />
              </>
            )}
          </svg>

          <div style={{
            ...BOX, background: s.bg,
            border: `2px solid ${highlightDb === 'read' ? s.accent : highlightDb === 'write' ? s.green : s.border}`,
            transition: 'border-color 0.3s',
          }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Database</div>
            <div style={{ color: dbContent ? s.accent : s.text3, fontFamily: s.mono, fontSize: 13, fontWeight: 600, minHeight: 20 }}>
              {dbContent || 'EMPTY'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={doRead} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
          }}>Read ("user:42")</button>
          <button onClick={doWrite} style={{
            background: s.green, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
          }}>Write (update)</button>
        </div>

        {log.length > 0 && (
          <div style={{ background: s.bg, borderRadius: 8, padding: 12, border: `1px solid ${s.border}` }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Event Log</div>
            {log.map(entry => (
              <div key={entry.id} style={{
                color: entry.type === 'hit' ? s.green : entry.type === 'miss' ? s.yellow : entry.type === 'evict' ? s.red : s.text2,
                fontFamily: s.mono, fontSize: 11, lineHeight: 1.8,
                paddingLeft: 10, borderLeft: `2px solid ${entry.type === 'hit' ? s.green : entry.type === 'miss' ? s.yellow : entry.type === 'evict' ? s.red : s.border}`,
              }}>
                {entry.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
