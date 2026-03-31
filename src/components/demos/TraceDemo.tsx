import { useState, useEffect, Fragment } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#3c6bc3',
  green: '#5a9e8e',
  red: '#c46060',
  yellow: '#bfa03a',
  purple: '#4a6eb5',
  orange: '#c48a4a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const M: React.CSSProperties = { fontFamily: s.mono }

const CHAIN = [
  { title: "Victim's Server", detail: 'Source IP logged: 203.0.113.42', color: s.green },
  { title: 'WHOIS Lookup', detail: 'Owner: Example ISP, Range: 203.0.113.0/24', color: s.accent },
  { title: 'ISP Logs', detail: 'Customer: John Doe, Assigned: 203.0.113.42 at 2024-03-15 14:23:01 UTC', color: s.purple },
  { title: 'Legal Process', detail: 'Subpoena issued: 2024-03-16, Case #CR-2024-0315', color: s.yellow },
  { title: 'Suspect Identified', detail: 'Address: 123 Main St, Device seized', color: s.red },
]

type VpnScenario = 'none' | 'commercial' | 'nolog'

export default function TraceDemo() {
  const [traceStep, setTraceStep] = useState(0)
  const [running, setRunning] = useState(false)
  const [vpnScenario, setVpnScenario] = useState<VpnScenario>('none')

  useEffect(() => {
    if (!running || traceStep >= 5) {
      if (traceStep >= 5) setRunning(false)
      return
    }
    const timer = setInterval(() => setTraceStep(prev => prev + 1), 800)
    return () => clearInterval(timer)
  }, [running, traceStep])

  const handleTrace = () => {
    if (traceStep >= 5) setTraceStep(0)
    setRunning(true)
  }

  const effectiveStep = vpnScenario === 'nolog' ? Math.min(traceStep, 2) : traceStep

  const boxStyle = (i: number, borderColor: string): React.CSSProperties => {
    const isActive = i === effectiveStep - 1
    const isDone = i < effectiveStep
    const blocked = vpnScenario === 'nolog' && i >= 2 && effectiveStep >= 2
    return {
      background: isActive ? borderColor + '18' : isDone ? s.green + '11' : s.bg3,
      border: `2px solid ${isActive ? borderColor : isDone ? s.green : s.border}`,
      borderRadius: 10, padding: '14px 18px', marginBottom: 0,
      ...M, fontSize: 11, color: isActive ? borderColor : isDone ? s.green : s.text2,
      transition: 'all 0.3s',
      boxShadow: isActive ? `0 0 16px ${borderColor}44` : blocked ? 'none' : isDone ? `0 0 8px ${s.green}22` : 'none',
      opacity: blocked ? 0.35 : 1,
      position: 'relative' as const,
    }
  }

  return (
    <DemoBoundary name="IP Trace">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>IP Tracing</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={handleTrace} style={{
            background: running ? s.bg3 : s.accent, border: `1px solid ${running ? s.border : s.accent}`,
            borderRadius: 8, padding: '10px 28px', color: running ? s.text3 : '#fff',
            cursor: running ? 'default' : 'pointer', fontSize: 14, fontWeight: 600, fontFamily: s.mono,
            transition: 'all 0.2s',
          }}>
            {running ? 'Tracing...' : traceStep >= 5 ? 'Replay' : 'Trace IP'}
          </button>
          {traceStep > 0 && traceStep < 5 && (
            <div style={{ ...M, fontSize: 12, color: s.accent }}>
              Step {traceStep}/5
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {CHAIN.map((item, i) => (
            <Fragment key={item.title}>
              {i > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
                  <div style={{
                    width: 2, height: 24,
                    background: i < effectiveStep ? s.green : s.border,
                    transition: 'background 0.3s', borderRadius: 1,
                  }} />
                </div>
              )}
              <div style={boxStyle(i, item.color)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{item.title}</div>
                  {i === 0 && (
                    <div style={{ fontSize: 8, padding: '2px 8px', borderRadius: 4, background: s.green + '22', color: s.green }}>
                      SOURCE
                    </div>
                  )}
                  {i === 4 && effectiveStep >= 5 && (
                    <div style={{ fontSize: 8, padding: '2px 8px', borderRadius: 4, background: s.red + '22', color: s.red }}>
                      IDENTIFIED
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: i < effectiveStep ? s.text : s.text3, lineHeight: 1.5 }}>
                  {item.detail}
                </div>
              </div>
            </Fragment>
          ))}
        </div>

        {traceStep >= 5 && vpnScenario !== 'nolog' && (
          <div style={{
            marginTop: 16, background: s.green + '11', border: `1px solid ${s.green}44`,
            borderRadius: 10, padding: '16px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.green, marginBottom: 4 }}>
              Trace Complete
            </div>
            <div style={{ ...M, fontSize: 12, color: s.text2 }}>
              3 days elapsed — Suspect identified
            </div>
          </div>
        )}

        {vpnScenario === 'nolog' && traceStep >= 2 && (
          <div style={{
            marginTop: 16, background: s.red + '11', border: `1px solid ${s.red}44`,
            borderRadius: 10, padding: '16px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.red, marginBottom: 4 }}>
              Trace Blocked
            </div>
            <div style={{ ...M, fontSize: 12, color: s.text2 }}>
              No logs available — Cannot identify suspect
            </div>
          </div>
        )}
      </div>

      <div style={SEC}>
        <div style={{ fontSize: 14, fontWeight: 600, color: s.text2, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, ...M }}>
          VPNs and Tracing
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {([
            { key: 'none' as VpnScenario, label: 'No VPN' },
            { key: 'commercial' as VpnScenario, label: 'Commercial VPN' },
            { key: 'nolog' as VpnScenario, label: 'No-Log VPN' },
          ]).map(opt => (
            <button key={opt.key} onClick={() => { setVpnScenario(opt.key); setTraceStep(0) }} style={{
              flex: 1, background: vpnScenario === opt.key ? s.accent : s.bg3,
              border: `1px solid ${vpnScenario === opt.key ? s.accent : s.border}`,
              borderRadius: 8, padding: '10px 8px', color: vpnScenario === opt.key ? '#fff' : s.text2,
              cursor: 'pointer', ...M, fontSize: 10, fontWeight: 600, transition: 'all 0.2s',
            }}>
              {opt.label}
            </button>
          ))}
        </div>

        {vpnScenario === 'none' && (
          <div style={{ background: s.bg, borderRadius: 8, padding: '14px 18px', border: `1px solid ${s.green}33` }}>
            <div style={{ ...M, fontSize: 11, color: s.green, marginBottom: 6, fontWeight: 700 }}>Direct Connection</div>
            <div style={{ ...M, fontSize: 11, color: s.text2, lineHeight: 1.6 }}>
              IP address 203.0.113.42 is visible to the server. Full trace works — ISP logs map the IP to the subscriber.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', justifyContent: 'center' }}>
              {['Victim Server', 'ISP', 'Suspect'].map((node, i) => (
                <Fragment key={node}>
                  {i > 0 && <div style={{ width: 24, height: 1, background: s.green }} />}
                  <div style={{ ...M, fontSize: 9, padding: '6px 10px', borderRadius: 6, background: s.green + '15', color: s.green, border: `1px solid ${s.green}44` }}>
                    {node}
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        )}

        {vpnScenario === 'commercial' && (
          <div style={{ background: s.bg, borderRadius: 8, padding: '14px 18px', border: `1px solid ${s.yellow}33` }}>
            <div style={{ ...M, fontSize: 11, color: s.yellow, marginBottom: 6, fontWeight: 700 }}>Commercial VPN</div>
            <div style={{ ...M, fontSize: 11, color: s.text2, lineHeight: 1.6 }}>
              Server sees VPN's IP. VPN provider keeps logs and can hand them over under legal pressure.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', justifyContent: 'center' }}>
              {['Victim Server', 'VPN Provider', 'ISP', 'Suspect'].map((node, i) => (
                <Fragment key={node}>
                  {i > 0 && <div style={{ width: 20, height: 1, background: s.yellow }} />}
                  <div style={{ ...M, fontSize: 8, padding: '6px 8px', borderRadius: 6, background: s.yellow + '15', color: s.yellow, border: `1px solid ${s.yellow}44` }}>
                    {node}
                  </div>
                </Fragment>
              ))}
            </div>
            <div style={{ ...M, fontSize: 10, color: s.yellow, textAlign: 'center', marginTop: 10 }}>
              VPN logs handed over — suspect found
            </div>
          </div>
        )}

        {vpnScenario === 'nolog' && (
          <div style={{ background: s.bg, borderRadius: 8, padding: '14px 18px', border: `1px solid ${s.red}33` }}>
            <div style={{ ...M, fontSize: 11, color: s.red, marginBottom: 6, fontWeight: 700 }}>No-Log VPN</div>
            <div style={{ ...M, fontSize: 11, color: s.text2, lineHeight: 1.6 }}>
              Server sees VPN's IP. VPN provider claims no logs exist. Trace stops here.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', justifyContent: 'center' }}>
              {['Victim Server', 'VPN Provider'].map((node, i) => (
                <Fragment key={node}>
                  {i > 0 && <div style={{ width: 24, height: 1, background: s.red }} />}
                  <div style={{ ...M, fontSize: 9, padding: '6px 10px', borderRadius: 6, background: s.red + '15', color: s.red, border: `1px solid ${s.red}44` }}>
                    {node}
                  </div>
                </Fragment>
              ))}
              <div style={{ width: 20, height: 1, background: s.border, opacity: 0.3 }} />
              <div style={{ ...M, fontSize: 9, padding: '6px 10px', borderRadius: 6, background: s.bg3, color: s.text3, border: `1px solid ${s.border}`, opacity: 0.35 }}>
                ISP
              </div>
              <div style={{ width: 20, height: 1, background: s.border, opacity: 0.3 }} />
              <div style={{ ...M, fontSize: 9, padding: '6px 10px', borderRadius: 6, background: s.bg3, color: s.text3, border: `1px solid ${s.border}`, opacity: 0.35 }}>
                Suspect
              </div>
            </div>
            <div style={{ ...M, fontSize: 10, color: s.red, textAlign: 'center', marginTop: 10 }}>
              No logs available — trace blocked at this point
            </div>
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
