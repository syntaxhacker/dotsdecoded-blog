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
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

const monoModules = ['Auth', 'Users', 'Orders', 'Payments', 'Notifications', 'Search']
const microServices = ['Auth Svc', 'Users Svc', 'Orders Svc', 'Payments Svc', 'Notifs Svc', 'Search Svc']

const moduleColors: Record<string, string> = {
  Auth: s.red, Users: s.accent, Orders: s.orange, Payments: s.green, Notifications: s.purple, Search: s.yellow,
}

export default function MonolithVsMicroDemo() {
  const [scenario, setScenario] = useState<'deploy' | 'failure' | null>(null)
  const [phase, setPhase] = useState(0)
  const [animating, setAnimating] = useState(false)

  const runScenario = (type: 'deploy' | 'failure') => {
    setScenario(type)
    setPhase(0)
    setAnimating(true)
    let p = 0
    const tick = () => {
      p++
      if (p <= 3) {
        setPhase(p)
        setTimeout(tick, 800)
      } else {
        setAnimating(false)
      }
    }
    setTimeout(tick, 600)
  }

  const reset = () => {
    setScenario(null)
    setPhase(0)
    setAnimating(false)
  }

  return (
    <DemoBoundary name="Monolith vs Microservices">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Monolith vs Microservices</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Compare both architectures side by side. Run a deployment or a failure to see how each handles it.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => runScenario('deploy')} disabled={animating} style={actionBtn(s.accent)}>
            Simulate Deploy
          </button>
          <button onClick={() => runScenario('failure')} disabled={animating} style={actionBtn(s.red)}>
            Simulate Failure
          </button>
          {(scenario !== null || phase > 0) && (
            <button onClick={reset} style={actionBtn(s.bg3)}>Reset</button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>Monolith</div>
            <div style={{
              background: s.bg3, borderRadius: 10, padding: 12, minHeight: 180,
              border: scenario === 'deploy' && phase >= 1 ? `2px solid ${s.yellow}` : scenario === 'failure' && phase >= 1 ? `2px solid ${s.red}` : `1px solid ${s.border}`,
              transition: 'all 0.3s', display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {monoModules.map((mod) => {
                const color = moduleColors[mod]
                const isDeploying = scenario === 'deploy' && phase >= 1 && mod === 'Orders'
                const isDown = scenario === 'failure' && phase >= 1 && mod === 'Payments'
                return (
                  <div key={mod} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                    background: isDown ? `${s.red}20` : isDeploying ? `${s.yellow}20` : `${color}08`,
                    borderRadius: 6, border: `1px solid ${isDown ? s.red : isDeploying ? s.yellow : s.border}`,
                    transition: 'all 0.3s',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: isDown ? s.red : isDeploying ? s.yellow : color, flexShrink: 0 }} />
                    <span style={{ color: isDown ? s.red : s.text2, fontSize: 12, fontWeight: 600, flex: 1 }}>{mod}</span>
                    {isDown && <span style={{ color: s.red, fontSize: 10, fontFamily: s.mono }}>DOWN</span>}
                    {isDeploying && phase < 3 && <span style={{ color: s.yellow, fontSize: 10, fontFamily: s.mono }}>DEPLOYING</span>}
                    {isDeploying && phase >= 3 && <span style={{ color: s.green, fontSize: 10, fontFamily: s.mono }}>DONE</span>}
                  </div>
                )
              })}
            </div>
            {scenario === 'deploy' && phase >= 3 && (
              <div style={{ color: s.yellow, fontSize: 11, marginTop: 8, textAlign: 'center', lineHeight: 1.5 }}>
                Entire application redeployed. All modules restarted. Users experienced downtime during deploy.
              </div>
            )}
            {scenario === 'failure' && phase >= 3 && (
              <div style={{ color: s.red, fontSize: 11, marginTop: 8, textAlign: 'center', lineHeight: 1.5 }}>
                Payment crash brought down the entire application. No module is reachable.
              </div>
            )}
          </div>

          <div>
            <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>Microservices</div>
            <div style={{
              borderRadius: 10, padding: 12, minHeight: 180,
              border: `1px solid ${s.border}`,
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
            }}>
              {microServices.map((svc) => {
                const mod = svc.replace(' Svc', '')
                const color = moduleColors[mod]
                const isDeploying = scenario === 'deploy' && phase >= 1 && svc === 'Orders Svc'
                const isDown = scenario === 'failure' && phase >= 1 && svc === 'Payments Svc'
                return (
                  <div key={svc} style={{
                    background: s.bg3, borderRadius: 8, padding: '8px 10px',
                    border: `1px solid ${isDown ? s.red : isDeploying ? s.yellow : s.border}`,
                    transition: 'all 0.3s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: isDown ? s.red : isDeploying ? s.yellow : color }} />
                      <span style={{ color: s.text2, fontSize: 11, fontWeight: 600 }}>{svc}</span>
                    </div>
                    {isDown && (
                      <div style={{ color: s.red, fontSize: 10, fontFamily: s.mono }}>UNHEALTHY</div>
                    )}
                    {!isDown && (
                      <div style={{ color: s.green, fontSize: 10, fontFamily: s.mono }}>HEALTHY</div>
                    )}
                    {isDeploying && phase < 3 && (
                      <div style={{ color: s.yellow, fontSize: 10, fontFamily: s.mono }}>RESTARTING</div>
                    )}
                    {isDeploying && phase >= 3 && (
                      <div style={{ color: s.green, fontSize: 10, fontFamily: s.mono }}>DEPLOYED</div>
                    )}
                  </div>
                )
              })}
            </div>
            {scenario === 'deploy' && phase >= 3 && (
              <div style={{ color: s.green, fontSize: 11, marginTop: 8, textAlign: 'center', lineHeight: 1.5 }}>
                Only Orders Svc redeployed. All other services continued serving traffic. Zero downtime.
              </div>
            )}
            {scenario === 'failure' && phase >= 3 && (
              <div style={{ color: s.green, fontSize: 11, marginTop: 8, textAlign: 'center', lineHeight: 1.5 }}>
                Payments Svc is down, but all other services remain healthy. Circuit breaker prevents cascade.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )

  function actionBtn(color: string): React.CSSProperties {
    return { background: `${color}18`, border: `1px solid ${color}`, borderRadius: 8, padding: '8px 16px', color: color, cursor: animating ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: animating ? 0.6 : 1 }
  }
}
