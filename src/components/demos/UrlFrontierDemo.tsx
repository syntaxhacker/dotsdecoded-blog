import { useState, useCallback, useRef, useEffect } from 'react'
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

interface UrlItem {
  id: number; url: string; domain: string; priority: 'high' | 'medium' | 'low'
  status: 'queued' | 'processing' | 'done'; workerId: number | null
}

const domains = ['google.com', 'wikipedia.org', 'github.com', 'stackoverflow.com']
const paths = ['/page1', '/article/2', '/blog/post', '/api/docs', '/tutorial', '/about', '/faq', '/search']

function randUrl(id: number): UrlItem {
  const domain = domains[Math.floor(Math.random() * domains.length)]
  const path = paths[Math.floor(Math.random() * paths.length)]
  const r = Math.random()
  const priority: 'high' | 'medium' | 'low' = r < 0.2 ? 'high' : r < 0.6 ? 'medium' : 'low'
  return { id, url: `https://${domain}${path}`, domain, priority, status: 'queued', workerId: null }
}

function makeInitial(): UrlItem[] {
  return Array.from({ length: 12 }, (_, i) => randUrl(i))
}

const priorityOrder = { high: 0, medium: 1, low: 2 }
const priorityColor = (p: string) => p === 'high' ? s.red : p === 'medium' ? s.yellow : s.green
const domainColor: Record<string, string> = {
  'google.com': s.accent, 'wikipedia.org': s.green, 'github.com': s.purple, 'stackoverflow.com': s.orange,
}

function UrlFrontierInner() {
  const [urls, setUrls] = useState<UrlItem[]>(makeInitial)
  const [nextId, setNextId] = useState(12)
  const [completed, setCompleted] = useState(0)
  const [workerBusy, setWorkerBusy] = useState([false, false, false])
  const [processing, setProcessing] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout)
  }, [])

  const queued = urls.filter(u => u.status === 'queued')
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  const processingUrls = urls.filter(u => u.status === 'processing')

  const processNext = useCallback(() => {
    if (processing) return
    const freeIdx = workerBusy.findIndex(b => !b)
    if (freeIdx === -1) return
    const next = queued[0]
    if (!next) return

    setProcessing(true)
    setWorkerBusy(prev => { const n = [...prev]; n[freeIdx] = true; return n })
    setUrls(prev => prev.map(u => u.id === next.id ? { ...u, status: 'processing', workerId: freeIdx } : u))

    const t = setTimeout(() => {
      setUrls(prev => prev.map(u => u.id === next.id ? { ...u, status: 'done' } : u))
      setCompleted(prev => prev + 1)
      setWorkerBusy(prev => { const n = [...prev]; n[freeIdx] = false; return n })
      setProcessing(false)
    }, 1200)
    timers.current.push(t)
  }, [processing, workerBusy, queued])

  const addUrl = () => {
    setUrls(prev => [...prev, { ...randUrl(nextId), id: nextId }])
    setNextId(prev => prev + 1)
  }

  const reset = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setUrls(makeInitial())
    setNextId(12)
    setCompleted(0)
    setWorkerBusy([false, false, false])
    setProcessing(false)
  }

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: '16px 0' }}>
      <div style={SEC}>
        <div style={H}>URL Frontier</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          URLs organized by priority and domain. The scheduler pops the highest-priority URL and dispatches it to an available worker.
        </p>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Queue ({queued.length})
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 8, height: 260, overflowY: 'auto' }}>
              {queued.length === 0 ? (
                <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', paddingTop: 100 }}>Queue empty</div>
              ) : queued.map(u => (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 4,
                  background: `${priorityColor(u.priority)}11`,
                  border: `1px solid ${priorityColor(u.priority)}33`, borderRadius: 6, fontSize: 12,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColor(u.priority), flexShrink: 0 }} />
                  <div style={{
                    background: domainColor[u.domain] || s.border2, color: '#fff',
                    borderRadius: 4, padding: '1px 6px', fontSize: 10, flexShrink: 0,
                  }}>{u.domain.split('.')[0]}</div>
                  <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.url}</div>
                  <span style={{
                    fontSize: 9, color: priorityColor(u.priority), fontFamily: s.mono, flexShrink: 0, marginLeft: 'auto',
                  }}>{u.priority.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ width: 200 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Workers</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1, 2].map(i => {
                const u = urls.find(x => x.status === 'processing' && x.workerId === i)
                return (
                  <div key={i} style={{
                    background: s.bg, border: `1px solid ${workerBusy[i] ? s.accent : s.border}`,
                    borderRadius: 10, padding: '10px 12px', transition: 'border-color 0.3s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>Worker #{i + 1}</span>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: workerBusy[i] ? s.yellow : s.green }} />
                    </div>
                    {u ? (
                      <div style={{ color: s.text2, fontSize: 11, fontFamily: s.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.url}</div>
                    ) : (
                      <div style={{ color: s.text3, fontSize: 11, fontStyle: 'italic' }}>Idle</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ color: s.text3, fontSize: 12 }}>Processed: <span style={{ color: s.green, fontFamily: s.mono }}>{completed}</span></span>
            <span style={{ color: s.text3, fontSize: 12 }}>Queued: <span style={{ color: s.text, fontFamily: s.mono }}>{queued.length}</span></span>
            <span style={{ color: s.text3, fontSize: 12 }}>Workers: <span style={{ color: workerBusy.every(Boolean) ? s.red : s.green, fontFamily: s.mono }}>{workerBusy.filter(Boolean).length}/3</span></span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addUrl} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px',
              color: s.text2, cursor: 'pointer', fontSize: 12,
            }}>Add URL</button>
            <button onClick={reset} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 14px',
              color: s.text2, cursor: 'pointer', fontSize: 12,
            }}>Reset</button>
            <button onClick={processNext} disabled={processing || workerBusy.every(Boolean) || queued.length === 0} style={{
              background: s.accent, border: 'none', borderRadius: 8, padding: '8px 18px',
              color: '#fff', cursor: (processing || workerBusy.every(Boolean) || queued.length === 0) ? 'default' : 'pointer',
              fontSize: 12, fontWeight: 600, opacity: (processing || workerBusy.every(Boolean) || queued.length === 0) ? 0.5 : 1,
            }}>Process Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UrlFrontierDemo() {
  return (
    <DemoBoundary name="URL Frontier">
      <UrlFrontierInner />
    </DemoBoundary>
  )
}
