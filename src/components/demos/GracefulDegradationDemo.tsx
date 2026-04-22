import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type ComponentName = 'api' | 'database' | 'cache' | 'search'
type DegradationLevel = 'full' | 'degraded' | 'minimal'

interface SystemComponent {
  key: ComponentName
  name: string
  icon: string
  color: string
  brokenMsg: string
}

const components: SystemComponent[] = [
  { key: 'api', name: 'API Gateway', icon: 'AP', color: s.accent, brokenMsg: 'API is unreachable' },
  { key: 'database', name: 'Database', icon: 'DB', color: s.purple, brokenMsg: 'Connection refused' },
  { key: 'cache', name: 'Redis Cache', icon: 'CA', color: s.orange, brokenMsg: 'Cache miss fallback' },
  { key: 'search', name: 'Search Service', icon: 'SE', color: s.green, brokenMsg: 'Search unavailable' },
]

export default function GracefulDegradationDemo() {
  const [broken, setBroken] = useState<Set<ComponentName>>(new Set())
  const [responseTime, setResponseTime] = useState(120)
  const [requestLog, setRequestLog] = useState<{ action: string; status: 'ok' | 'warn' | 'error'; detail: string }[]>([])

  const toggle = (key: ComponentName) => {
    setBroken(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const getLevel = (): DegradationLevel => {
    if (broken.has('api')) return 'minimal'
    if (broken.size >= 3) return 'minimal'
    if (broken.size >= 1) return 'degraded'
    return 'full'
  }

  const level = getLevel()

  const simulateRequest = () => {
    const entries: { action: string; status: 'ok' | 'warn' | 'error'; detail: string }[] = []
    let rt = 50

    if (broken.has('api')) {
      entries.push({ action: 'API Gateway', status: 'error', detail: 'Service unavailable — static fallback served' })
      rt = 800
    } else {
      entries.push({ action: 'API Gateway', status: 'ok', detail: `Routed in ${30 + Math.floor(Math.random() * 20)}ms` })
      rt += 40
    }

    if (broken.has('database')) {
      if (!broken.has('cache')) {
        entries.push({ action: 'Database', status: 'warn', detail: 'Serving stale data from cache' })
        rt += 10
      } else {
        entries.push({ action: 'Database', status: 'error', detail: 'No data available — empty response' })
        rt += 500
      }
    } else {
      entries.push({ action: 'Database', status: 'ok', detail: `Query completed in ${10 + Math.floor(Math.random() * 30)}ms` })
      rt += 25
    }

    if (broken.has('cache')) {
      entries.push({ action: 'Cache', status: 'warn', detail: 'Cache unavailable — hitting DB directly (slower)' })
      rt += 80
    } else {
      entries.push({ action: 'Cache', status: 'ok', detail: 'Cache hit' })
      rt += 2
    }

    if (broken.has('search')) {
      entries.push({ action: 'Search', status: 'warn', detail: 'Search disabled — showing recent items instead' })
      rt += 5
    } else {
      entries.push({ action: 'Search', status: 'ok', detail: `Results in ${20 + Math.floor(Math.random() * 40)}ms` })
      rt += 30
    }

    setResponseTime(rt + Math.floor(Math.random() * 50))
    setRequestLog(prev => [...prev.slice(-20), ...entries])
  }

  const levelConfig = {
    full: { label: 'FULL', color: s.green, desc: 'All systems operational' },
    degraded: { label: 'DEGRADED', color: s.yellow, desc: 'Some features reduced, core functionality intact' },
    minimal: { label: 'MINIMAL', color: s.red, desc: 'Critical failures — serving static content only' },
  }

  const cfg = levelConfig[level]

  return (
    <DemoBoundary name="Graceful Degradation">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            padding: '4px 12px', borderRadius: 6, fontFamily: s.mono, fontSize: 12, fontWeight: 700,
            background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}`,
          }}>
            {cfg.label}
          </div>
          <span style={{ fontSize: 13, color: s.text2 }}>{cfg.desc}</span>
        </div>
        <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3 }}>
          Response: <span style={{ color: responseTime > 300 ? s.red : responseTime > 150 ? s.yellow : s.green }}>{responseTime}ms</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
        {components.map(comp => {
          const isBroken = broken.has(comp.key)
          return (
            <button key={comp.key} onClick={() => toggle(comp.key)} style={{
              padding: 16, borderRadius: 10, textAlign: 'center', cursor: 'pointer',
              background: isBroken ? 'rgba(232,93,93,0.08)' : `${comp.color}08`,
              border: `1px solid ${isBroken ? s.red : comp.color}`,
              transition: 'all 0.2s',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, margin: '0 auto 8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: s.mono, fontSize: 14, fontWeight: 700,
                background: isBroken ? 'rgba(232,93,93,0.2)' : `${comp.color}18`,
                color: isBroken ? s.red : comp.color,
                transition: 'all 0.2s',
              }}>
                {comp.icon}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: isBroken ? s.red : comp.color, marginBottom: 2 }}>
                {comp.name}
              </div>
              <div style={{ fontSize: 10, fontFamily: s.mono, color: isBroken ? s.red : s.text3 }}>
                {isBroken ? comp.brokenMsg : 'Healthy'}
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={simulateRequest} style={{
          flex: 1, padding: '10px 16px', fontSize: 13, fontFamily: s.mono, cursor: 'pointer',
          border: `1px solid ${s.accent}`, borderRadius: 8, background: 'rgba(91,141,239,0.12)', color: s.accent,
          fontWeight: 600,
        }}>
          Simulate Request
        </button>
        <button onClick={() => { setBroken(new Set()); setRequestLog([]); setResponseTime(120) }} style={{
          padding: '10px 16px', fontSize: 12, fontFamily: s.mono, cursor: 'pointer',
          border: `1px solid ${s.border}`, borderRadius: 8, background: s.bg3, color: s.text3,
        }}>
          Reset All
        </button>
      </div>

      {requestLog.length > 0 && (
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: `1px solid ${s.border}`, fontSize: 12, fontFamily: s.mono, color: s.text3 }}>
            REQUEST LOG
          </div>
          <div style={{ padding: 10, maxHeight: 200, overflowY: 'auto' }}>
            {requestLog.map((entry, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0',
                borderBottom: i < requestLog.length - 1 ? `1px solid ${s.bg3}` : 'none',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: entry.status === 'ok' ? s.green : entry.status === 'warn' ? s.yellow : s.red,
                }} />
                <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text2, minWidth: 100 }}>
                  {entry.action}
                </span>
                <span style={{ fontSize: 11, color: entry.status === 'ok' ? s.green : entry.status === 'warn' ? s.yellow : s.red, flex: 1 }}>
                  {entry.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {components.map(comp => {
          const isBroken = broken.has(comp.key)
          return (
            <div key={comp.key} style={{
              flex: 1, minWidth: 170, padding: '10px 12px', borderRadius: 8, background: s.bg3,
              borderLeft: `3px solid ${isBroken ? s.red : comp.color}`,
            }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: isBroken ? s.red : comp.color, marginBottom: 4 }}>
                {comp.name} {isBroken ? 'DOWN' : 'UP'}
              </div>
              <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.4 }}>
                {isBroken
                  ? comp.key === 'database'
                    ? 'Serves stale cached data. If cache also down, returns empty with error banner.'
                    : comp.key === 'search'
                      ? 'Search bar hidden. Users browse categories and recent items instead.'
                      : comp.key === 'cache'
                        ? 'All queries hit the database directly. Slower but functional.'
                        : 'Static error page served. No dynamic content.'
                  : `Responds normally within SLA.`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
    </DemoBoundary>
  )
}
