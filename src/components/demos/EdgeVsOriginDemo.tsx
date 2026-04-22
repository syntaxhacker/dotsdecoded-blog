import { useState, useEffect } from 'react'
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

type ReqType = 'static' | 'dynamic'
type Panel = 'edge' | 'origin'

interface ContentItem {
  name: string
  type: ReqType
  size: string
}

const staticContent: ContentItem[] = [
  { name: 'style.css', type: 'static', size: '45 KB' },
  { name: 'app.js', type: 'static', size: '128 KB' },
  { name: 'logo.svg', type: 'static', size: '3 KB' },
  { name: 'hero.jpg', type: 'static', size: '340 KB' },
  { name: 'fonts.woff2', type: 'static', size: '52 KB' },
]

const dynamicContent: ContentItem[] = [
  { name: '/api/user/profile', type: 'dynamic', size: '2 KB' },
  { name: '/api/feed', type: 'dynamic', size: '15 KB' },
  { name: '/api/cart', type: 'dynamic', size: '4 KB' },
  { name: '/api/recommendations', type: 'dynamic', size: '8 KB' },
  { name: '/api/notifications', type: 'dynamic', size: '6 KB' },
]

interface RequestLog {
  id: number
  content: ContentItem
  servedFrom: Panel
  latency: number
  cacheHit: boolean
  edgeFunction: boolean
}

function generateRequests(items: ContentItem[], edgeFunctions: boolean): RequestLog[] {
  return items.map((item, i) => {
    if (item.type === 'static') {
      const cacheHit = Math.random() > 0.1
      return {
        id: i, content: item, servedFrom: 'edge' as Panel,
        latency: cacheHit ? Math.round(5 + Math.random() * 15) : Math.round(40 + Math.random() * 30),
        cacheHit, edgeFunction: false,
      }
    } else {
      const canEdge = edgeFunctions && item.name === '/api/recommendations'
      if (canEdge) {
        return {
          id: i, content: item, servedFrom: 'edge' as Panel,
          latency: Math.round(15 + Math.random() * 25),
          cacheHit: false, edgeFunction: true,
        }
      }
      return {
        id: i, content: item, servedFrom: 'origin' as Panel,
        latency: Math.round(120 + Math.random() * 180),
        cacheHit: false, edgeFunction: false,
      }
    }
  })
}

export default function EdgeVsOriginDemo() {
  const [edgeFunctions, setEdgeFunctions] = useState(false)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [logs, setLogs] = useState<RequestLog[]>([])
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [done, setDone] = useState(false)

  const allContent = [...staticContent, ...dynamicContent]

  useEffect(() => {
    if (!running || currentIdx >= allContent.length - 1) {
      if (currentIdx >= allContent.length - 1) { setRunning(false); setDone(true) }
      return
    }

    const t = setTimeout(() => {
      const next = currentIdx + 1
      const item = allContent[next]
      const reqs = generateRequests([item], edgeFunctions)
      setLogs(prev => [...prev, ...reqs])
      setCurrentIdx(next)
    }, getStepDelay(600, speed))

    return () => clearTimeout(t)
  }, [running, currentIdx, speed, edgeFunctions])

  const start = () => {
    setLogs([])
    setCurrentIdx(-1)
    setRunning(true)
    setDone(false)
  }

  const edgeLogs = logs.filter(l => l.servedFrom === 'edge')
  const originLogs = logs.filter(l => l.servedFrom === 'origin')

  const edgeAvgLatency = edgeLogs.length > 0 ? Math.round(edgeLogs.reduce((a, l) => a + l.latency, 0) / edgeLogs.length) : 0
  const originAvgLatency = originLogs.length > 0 ? Math.round(originLogs.reduce((a, l) => a + l.latency, 0) / originLogs.length) : 0
  const totalCacheHits = edgeLogs.filter(l => l.cacheHit).length
  const totalEdgeFunctions = logs.filter(l => l.edgeFunction).length

  function LogPanel({ title, panelLogs, color, panel }: { title: string; panelLogs: RequestLog[]; color: string; panel: Panel }) {
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
          <span style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>{title}</span>
          <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>
            ({panelLogs.length} requests, avg {panelLogs.length > 0 ? Math.round(panelLogs.reduce((a, l) => a + l.latency, 0) / panelLogs.length) : 0}ms)
          </span>
        </div>
        <div style={{ background: s.bg, borderRadius: 8, padding: 10, minHeight: 200, maxHeight: 200, overflowY: 'auto', border: `1px solid ${s.border}` }}>
          {panelLogs.length === 0 && (
            <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: 30 }}>Waiting for requests...</div>
          )}
          {panelLogs.map(log => (
            <div key={log.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
              marginBottom: 4, borderRadius: 6, background: s.bg2,
              border: `1px solid ${log.edgeFunction ? s.purple + '40' : s.border}`,
            }}>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                background: log.cacheHit ? s.green + '20' : log.edgeFunction ? s.purple + '20' : log.content.type === 'static' ? s.accent + '20' : s.orange + '20',
                color: log.cacheHit ? s.green : log.edgeFunction ? s.purple : log.content.type === 'static' ? s.accent : s.orange,
                fontFamily: s.mono, minWidth: 44, textAlign: 'center',
              }}>
                {log.cacheHit ? 'HIT' : log.edgeFunction ? 'EDGE FN' : log.content.type === 'static' ? 'MISS' : 'ORIGIN'}
              </span>
              <span style={{ color: s.text, fontSize: 12, fontFamily: s.mono, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {log.content.name}
              </span>
              <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>{log.content.size}</span>
              <span style={{
                color: log.latency < 20 ? s.green : log.latency < 100 ? s.yellow : s.red,
                fontSize: 11, fontFamily: s.mono, fontWeight: 600, minWidth: 45, textAlign: 'right',
              }}>{log.latency}ms</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <DemoBoundary name="Edge vs Origin">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Edge vs Origin</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Static content is served from edge (fast, cached). Dynamic content goes to origin (slower, personalized). Toggle edge functions for semi-dynamic content.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={start} disabled={running} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '8px 20px',
            color: '#fff', cursor: running ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
            opacity: running ? 0.6 : 1,
          }}>{done ? 'Run Again' : 'Send Requests'}</button>
          <button onClick={() => setEdgeFunctions(!edgeFunctions)} style={{
            background: edgeFunctions ? s.purple + '20' : s.bg3,
            border: `1px solid ${edgeFunctions ? s.purple : s.border}`,
            borderRadius: 8, padding: '8px 16px', color: edgeFunctions ? s.purple : s.text2,
            cursor: 'pointer', fontSize: 13,
          }}>{edgeFunctions ? 'Edge Functions: ON' : 'Edge Functions: OFF'}</button>
          <div style={{ flex: 1 }} />
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        {edgeFunctions && (
          <div style={{ background: s.purple + '10', border: `1px solid ${s.purple}30`, borderRadius: 8, padding: '8px 14px', marginBottom: 16 }}>
            <span style={{ color: s.purple, fontSize: 12, fontWeight: 600 }}>Edge Functions active: </span>
            <span style={{ color: s.text3, fontSize: 12 }}>{'/api/recommendations runs at the edge using cached user segments instead of hitting the origin server.'}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{
            flex: 1, background: s.bg3, borderRadius: 8, padding: '12px 16px', textAlign: 'center',
            border: `1px solid ${s.green + '30'}`,
          }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Edge Avg</div>
            <div style={{ color: s.green, fontSize: 22, fontWeight: 700, fontFamily: s.mono }}>{edgeAvgLatency}<span style={{ fontSize: 12, color: s.text3 }}>ms</span></div>
          </div>
          <div style={{
            flex: 1, background: s.bg3, borderRadius: 8, padding: '12px 16px', textAlign: 'center',
            border: `1px solid ${s.orange + '30'}`,
          }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Origin Avg</div>
            <div style={{ color: s.orange, fontSize: 22, fontWeight: 700, fontFamily: s.mono }}>{originAvgLatency}<span style={{ fontSize: 12, color: s.text3 }}>ms</span></div>
          </div>
          <div style={{
            flex: 1, background: s.bg3, borderRadius: 8, padding: '12px 16px', textAlign: 'center',
            border: `1px solid ${s.border}`,
          }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Cache Hits</div>
            <div style={{ color: s.accent, fontSize: 22, fontWeight: 700, fontFamily: s.mono }}>{totalCacheHits}<span style={{ fontSize: 12, color: s.text3 }}>/5 static</span></div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <LogPanel title="Edge Server" panelLogs={edgeLogs} color={s.green} panel="edge" />
          <LogPanel title="Origin Server" panelLogs={originLogs} color={s.orange} panel="origin" />
        </div>

        {done && (
          <div style={{
            marginTop: 16, background: s.bg3, borderRadius: 8, padding: '12px 16px',
            display: 'flex', gap: 24, justifyContent: 'center',
          }}>
            <span style={{ color: s.text3, fontSize: 12 }}>
              Static requests served from <span style={{ color: s.green, fontWeight: 600 }}>edge</span> ({edgeAvgLatency}ms avg)
            </span>
            <span style={{ color: s.text3, fontSize: 12 }}>
              Dynamic requests served from <span style={{ color: s.orange, fontWeight: 600 }}>origin</span> ({originAvgLatency}ms avg)
            </span>
            {totalEdgeFunctions > 0 && (
              <span style={{ color: s.text3, fontSize: 12 }}>
                <span style={{ color: s.purple, fontWeight: 600 }}>{totalEdgeFunctions} request(s)</span> handled by edge functions
              </span>
            )}
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
