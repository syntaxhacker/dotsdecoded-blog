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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }

interface Plugin {
  id: string
  name: string
  color: string
  desc: string
  onRequest: string
  onResponse: string
}

const allPlugins: Plugin[] = [
  { id: 'auth', name: 'Auth', color: s.green, desc: 'Verify JWT / API key / OAuth', onRequest: 'Validating credentials...', onResponse: 'No response processing' },
  { id: 'rate-limit', name: 'Rate Limit', color: s.yellow, desc: 'Check request frequency', onRequest: 'Checking token bucket...', onResponse: 'No response processing' },
  { id: 'transform-req', name: 'Req Transform', color: s.purple, desc: 'Modify request headers/body', onRequest: 'Adding headers, rewriting path...', onResponse: 'No response processing' },
  { id: 'route', name: 'Router', color: s.accent, desc: 'Match and forward to upstream', onRequest: 'Matching path -> upstream...', onResponse: 'No response processing' },
  { id: 'upstream', name: 'Upstream', color: s.orange, desc: 'Call backend service', onRequest: 'Forwarding to backend...', onResponse: 'Received response from backend' },
  { id: 'transform-res', name: 'Res Transform', color: s.purple, desc: 'Modify response headers/body', onRequest: 'No request processing', onResponse: 'Stripping internal fields...' },
  { id: 'log', name: 'Logger', color: s.text2, desc: 'Record request metadata', onRequest: 'No request processing', onResponse: 'Logging status, latency...' },
]

const pipelineOrder = ['auth', 'rate-limit', 'transform-req', 'route', 'upstream', 'transform-res', 'log']

const reqMethods = ['GET', 'POST', 'PUT', 'DELETE']
const reqPaths = ['/api/users', '/api/orders', '/api/products', '/api/payments']

export default function GatewayPluginChainDemo() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    allPlugins.forEach(p => { map[p.id] = true })
    return map
  })
  const [running, setRunning] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [log, setLog] = useState<string[]>([])
  const [method, setMethod] = useState('GET')
  const [path, setPath] = useState('/api/users')

  const activePlugins = pipelineOrder.filter(id => enabled[id])
  const activeIds = new Set(activePlugins)

  const runPipeline = () => {
    setRunning(true)
    setCurrentIdx(0)
    setLog([])
  }

  const advance = () => {
    if (currentIdx < 0) return
    const nextIdx = currentIdx + 1
    if (nextIdx >= activePlugins.length) {
      setLog(l => [...l, `200 OK | ${method} ${path} -> completed`])
      setRunning(false)
      setCurrentIdx(-1)
      return
    }
    setCurrentIdx(nextIdx)
    const pluginId = activePlugins[currentIdx]
    const plugin = allPlugins.find(p => p.id === pluginId)
    if (plugin) {
      const msg = currentIdx < 4
        ? `[${plugin.name}] ${plugin.onRequest}`
        : `[${plugin.name}] ${plugin.onResponse}`
      setLog(l => [...l, msg])
    }
  }

  const autoRun = () => {
    if (running) return
    setRunning(true)
    setCurrentIdx(0)
    setLog([])
    let idx = 0
    const interval = setInterval(() => {
      idx++
      if (idx >= activePlugins.length) {
        setLog(l => [...l, `200 OK | ${method} ${path} -> completed`])
        setRunning(false)
        clearInterval(interval)
        return
      }
      setCurrentIdx(idx)
      const pluginId = activePlugins[idx - 1]
      const plugin = allPlugins.find(p => p.id === pluginId)
      if (plugin) {
        const msg = (idx - 1) < 4
          ? `[${plugin.name}] ${plugin.onRequest}`
          : `[${plugin.name}] ${plugin.onResponse}`
        setLog(l => [...l, msg])
      }
    }, 600)
  }

  const togglePlugin = (id: string) => {
    if (running) return
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const reset = () => {
    setRunning(false)
    setCurrentIdx(-1)
    setLog([])
  }

  return (
    <DemoBoundary name="Gateway Plugin Chain">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={H}>Plugin Execution Chain</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Toggle plugins on or off to see how the request flows through the gateway pipeline. The order of execution is fixed.
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: s.text3, fontSize: 12 }}>Request:</span>
          <select value={method} onChange={e => { setMethod(e.target.value); reset() }} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '4px 8px',
            color: s.text, fontSize: 12, fontFamily: s.mono, cursor: 'pointer', outline: 'none',
          }}>
            {reqMethods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={path} onChange={e => { setPath(e.target.value); reset() }} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '4px 8px',
            color: s.text, fontSize: 12, fontFamily: s.mono, cursor: 'pointer', outline: 'none', flex: 1, maxWidth: 200,
          }}>
            {reqPaths.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <button onClick={autoRun} disabled={running} style={{
            background: running ? s.bg3 : s.accent, border: 'none', borderRadius: 6, padding: '6px 16px',
            color: '#fff', cursor: running ? 'default' : 'pointer', fontSize: 12, fontWeight: 600,
            opacity: running ? 0.6 : 1,
          }}>{running ? 'Running...' : 'Auto-Run'}</button>
          <button onClick={advance} disabled={!running} style={{
            background: running ? s.yellow : s.bg3, border: 'none', borderRadius: 6, padding: '6px 16px',
            color: running ? '#000' : s.text3, cursor: running ? 'pointer' : 'default', fontSize: 12, fontWeight: 600,
          }}>Step</button>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 12px',
            color: s.text2, cursor: 'pointer', fontSize: 12,
          }}>Reset</button>
        </div>

        <div style={{
          display: 'flex', gap: 10, marginBottom: 20, overflowX: 'auto',
          paddingBottom: 8,
        }}>
          {pipelineOrder.map((id, i) => {
            const plugin = allPlugins.find(p => p.id === id)!
            const isActive = enabled[id]
            const isCurrent = running && currentIdx >= 0 && activePlugins[currentIdx] === id

            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {i > 0 && (
                  <div style={{ color: s.text3, fontSize: 18, opacity: isActive ? 0.6 : 0.2 }}>{'\u2192'}</div>
                )}
                <button onClick={() => togglePlugin(id)} style={{
                  background: isActive
                    ? (isCurrent ? `${plugin.color}25` : `${plugin.color}12`)
                    : s.bg3,
                  border: `2px solid ${isCurrent ? plugin.color : isActive ? plugin.color + '60' : s.border}`,
                  borderRadius: 10, padding: '12px 14px', cursor: running ? 'default' : 'pointer',
                  textAlign: 'center', minWidth: 90, width: 100,
                  transition: 'all 0.25s', opacity: isActive ? 1 : 0.4,
                  outline: 'none',
                  transform: isCurrent ? 'scale(1.05)' : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, margin: '0 auto 6px auto',
                    background: isActive ? `${plugin.color}30` : s.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: isActive ? plugin.color : s.text3, fontWeight: 700,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{
                    color: isCurrent ? plugin.color : (isActive ? s.text : s.text3),
                    fontSize: 11, fontWeight: 600,
                  }}>
                    {plugin.name}
                  </div>
                  <div style={{ color: isActive ? s.text3 : s.text3, fontSize: 9, marginTop: 2, lineHeight: 1.3 }}>
                    {plugin.desc}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 9, color: isActive ? s.text3 : s.text3 }}>
                    {enabled[id] ? 'ON' : 'OFF'}
                  </div>
                </button>
              </div>
            )
          })}
        </div>

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Execution Log
          </div>
          <div style={{
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12,
            maxHeight: 160, overflowY: 'auto', fontFamily: s.mono, fontSize: 11, lineHeight: 1.7,
          }}>
            {log.length === 0 && (
              <span style={{ color: s.text3 }}>Press Auto-Run or Step to start the pipeline</span>
            )}
            {log.map((entry, i) => {
              const isOk = entry.startsWith('200')
              return (
                <div key={i} style={{ color: isOk ? s.green : s.text2 }}>
                  {'>'} {entry}
                </div>
              )
            })}
            {running && currentIdx >= 0 && (
              <div style={{ color: s.accent }}>
                {'>'} Processing: {allPlugins.find(p => p.id === activePlugins[currentIdx])?.name}...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
