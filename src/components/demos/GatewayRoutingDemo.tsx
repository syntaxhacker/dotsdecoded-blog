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

interface Route {
  id: string
  type: 'path' | 'host' | 'header'
  rule: string
  upstream: string
  color: string
  icon: string
}

const routes: Route[] = [
  { id: 'path-users', type: 'path', rule: '/api/users/*', upstream: 'Users Service', color: s.accent, icon: '\u2192' },
  { id: 'path-orders', type: 'path', rule: '/api/orders/*', upstream: 'Orders Service', color: s.green, icon: '\u2192' },
  { id: 'path-products', type: 'path', rule: '/api/products/*', upstream: 'Products Service', color: s.orange, icon: '\u2192' },
  { id: 'host-api', type: 'host', rule: 'Host: api.example.com', upstream: 'API Gateway', color: s.purple, icon: '\u2191' },
  { id: 'host-admin', type: 'host', rule: 'Host: admin.example.com', upstream: 'Admin Service', color: s.yellow, icon: '\u2191' },
  { id: 'header-v2', type: 'header', rule: 'X-Version: v2', upstream: 'V2 Stack', color: s.red, icon: '\u2194' },
  { id: 'header-canary', type: 'header', rule: 'X-Canary: true', upstream: 'Canary Stack', color: s.purple, icon: '\u2194' },
]

interface ClientReq {
  label: string
  method: string
  path: string
  host: string
  headers: { key: string; value: string }[]
  matchedRouteId: string
}

const testRequests: ClientReq[] = [
  { label: 'GET /api/users', method: 'GET', path: '/api/users/123', host: 'api.example.com', headers: [], matchedRouteId: 'path-users' },
  { label: 'POST /api/orders', method: 'POST', path: '/api/orders', host: 'api.example.com', headers: [], matchedRouteId: 'path-orders' },
  { label: 'GET /api/products', method: 'GET', path: '/api/products/42', host: 'api.example.com', headers: [], matchedRouteId: 'path-products' },
  { label: 'GET /admin', method: 'GET', path: '/admin/dashboard', host: 'admin.example.com', headers: [], matchedRouteId: 'host-admin' },
  { label: 'GET /api (v2 header)', method: 'GET', path: '/api/users', host: 'api.example.com', headers: [{ key: 'X-Version', value: 'v2' }], matchedRouteId: 'header-v2' },
  { label: 'GET /api (canary)', method: 'GET', path: '/api/products', host: 'api.example.com', headers: [{ key: 'X-Canary', value: 'true' }], matchedRouteId: 'header-canary' },
]

export default function GatewayRoutingDemo() {
  const [selectedReq, setSelectedReq] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [progress, setProgress] = useState<'idle' | 'entering' | 'routing' | 'arrived'>('idle')

  const req = testRequests[selectedReq]
  const matchedRoute = routes.find(r => r.id === req.matchedRouteId)!

  const startAnimation = useCallback(() => {
    if (animating) return
    setAnimating(true)
    setProgress('entering')
    setTimeout(() => {
      setProgress('routing')
      setTimeout(() => {
        setProgress('arrived')
        setAnimating(false)
      }, 800)
    }, 600)
  }, [animating])

  const resetAnimation = () => {
    setAnimating(false)
    setProgress('idle')
  }

  const dotColor = matchedRoute ? matchedRoute.color : s.red

  return (
    <DemoBoundary name="Gateway Routing">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={H}>Request Routing</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          The gateway matches incoming requests using path, host, and header rules. Route to different upstreams based on the match.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: s.text3, fontSize: 12 }}>Request:</span>
          <select value={selectedReq} onChange={e => { setSelectedReq(Number(e.target.value)); resetAnimation() }} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 10px',
            color: s.text, fontSize: 11, fontFamily: s.mono, cursor: 'pointer', outline: 'none', maxWidth: 300,
          }}>
            {testRequests.map((r, i) => (
              <option key={i} value={i}>{r.label}</option>
            ))}
          </select>
          <button onClick={startAnimation} disabled={animating} style={{
            background: s.accent, border: 'none', borderRadius: 6, padding: '6px 16px',
            color: '#fff', cursor: animating ? 'default' : 'pointer', fontSize: 12, fontWeight: 600,
            opacity: animating ? 0.6 : 1,
          }}>Send Request</button>
          <button onClick={resetAnimation} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 12px',
            color: s.text2, cursor: 'pointer', fontSize: 12,
          }}>Reset</button>
        </div>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 20,
          position: 'relative', overflow: 'hidden', minHeight: 240,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{
              background: s.bg3, borderRadius: 8, padding: '10px 14px', border: `1px solid ${s.border}`,
              borderColor: progress === 'entering' || progress === 'routing' || progress === 'arrived' ? dotColor : s.border,
              transition: 'border-color 0.3s',
            }}>
              <div style={{ color: s.text3, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Client</div>
              <div style={{ color: s.text, fontFamily: s.mono, fontSize: 13, fontWeight: 600 }}>{req.method} {req.path}</div>
              <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>Host: {req.host}</div>
              {req.headers.map(h => (
                <div key={h.key} style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>{h.key}: {h.value}</div>
              ))}
            </div>

            <div style={{
              background: s.bg3, borderRadius: 8, padding: '10px 14px',
              border: `1px solid ${progress === 'arrived' ? dotColor : s.border}`,
              transition: 'border-color 0.5s', textAlign: 'center',
            }}>
              <div style={{ color: s.text3, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{'\u2192'} Upstream</div>
              <div style={{
                color: progress === 'arrived' ? dotColor : s.text3, fontSize: 13, fontWeight: 600,
                transition: 'color 0.5s',
              }}>
                {matchedRoute.upstream}
              </div>
              <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>
                route: {matchedRoute.rule}
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', height: 40, margin: '12px 0' }}>
            {progress !== 'idle' && (
              <div style={{
                position: 'absolute', left: 0, top: '50%', marginTop: -8,
                width: 20, height: 20, borderRadius: '50%', background: dotColor,
                transition: 'all 0.6s ease',
                transform: `translateX(${progress === 'entering' ? 0 : progress === 'routing' ? 120 : progress === 'arrived' ? 580 : 0}px)`,
                opacity: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
              </div>
            )}
            <div style={{
              position: 'absolute', top: '50%', left: 20, right: 20, height: 2,
              background: `${dotColor}40`, marginTop: -1,
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: 20, marginTop: -1, height: 2,
              background: dotColor, transition: 'width 0.8s ease', width: 0,
            }} />
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Route Table ({matchedRoute.type}-based routing)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {routes.map(route => {
                const isMatch = route.id === req.matchedRouteId
                return (
                  <div key={route.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 6,
                    background: isMatch ? `${route.color}15` : 'transparent',
                    border: `1px solid ${isMatch ? route.color + '40' : 'transparent'}`,
                    transition: 'all 0.3s',
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 4,
                      background: `${route.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, color: route.color, flexShrink: 0,
                    }}>
                      {route.icon}
                    </div>
                    <div style={{
                      color: isMatch ? route.color : s.text3, fontSize: 12, fontFamily: s.mono, flex: 1,
                      fontWeight: isMatch ? 600 : 400,
                    }}>
                      {route.rule}
                    </div>
                    <div style={{
                      color: isMatch ? route.color : s.text3, fontSize: 11,
                      fontWeight: isMatch ? 600 : 400,
                    }}>
                      {'\u2192'} {route.upstream}
                    </div>
                    {isMatch && (
                      <div style={{
                        background: route.color, borderRadius: 4, padding: '2px 8px',
                        color: '#fff', fontSize: 9, fontWeight: 700,
                      }}>
                        MATCH
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            {[
              { label: 'Path-based', desc: '/api/users/* matches Users Service', color: s.accent },
              { label: 'Host-based', desc: 'Host header determines routing', color: s.purple },
              { label: 'Header-based', desc: 'Custom headers route to specific stack', color: s.red },
            ].map(item => (
              <div key={item.label} style={{
                flex: 1, background: s.bg3, borderRadius: 6, padding: '8px 10px',
                border: `1px solid ${item.color}30`,
              }}>
                <div style={{ color: item.color, fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                <div style={{ color: s.text3, fontSize: 9 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
