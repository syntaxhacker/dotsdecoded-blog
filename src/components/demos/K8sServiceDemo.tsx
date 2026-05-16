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

const podIps = ['10.1.0.2', '10.1.0.3', '10.1.0.4']
const podNames = ['pod-a', 'pod-b', 'pod-c']

const iptablesRules = [
  { proto: 'tcp', dport: '80', target: 'KUBE-SVC-XXXXX', desc: 'Service DNAT chain' },
  { target: 'KUBE-SEP-A', stat: '1/3', pod: 'pod-a (10.1.0.2:80)', desc: 'Endpoint A' },
  { target: 'KUBE-SEP-B', stat: '2/3', pod: 'pod-b (10.1.0.3:80)', desc: 'Endpoint B' },
  { target: 'KUBE-SEP-C', stat: '3/3', pod: 'pod-c (10.1.0.4:80)', desc: 'Endpoint C' },
]

export default function K8sServiceDemo() {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [showIptables, setShowIptables] = useState(true)
  const [log, setLog] = useState<string[]>([])
  const roundRobinRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sendRequest = useCallback(() => {
    if (animating) return
    setAnimating(true)

    const targetIdx = roundRobinRef.current % podIps.length
    roundRobinRef.current += 1

    setLog(prev => [`Client -> Service (10.96.0.1:80)`, ...prev].slice(0, 5))

    setTimeout(() => {
      setCurrentIdx(targetIdx)
      setLog(prev => [`iptables DNAT -> ${podNames[targetIdx]} (${podIps[targetIdx]})`, ...prev].slice(0, 5))
      setTimeout(() => {
        setAnimating(false)
      }, 500)
    }, 400)
  }, [animating])

  const resetDemo = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setAnimating(false)
    setCurrentIdx(-1)
    setLog([])
    roundRobinRef.current = 0
  }

  return (
    <DemoBoundary name="Service Networking">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Service Networking</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: '14px 20', textAlign: 'center',
        }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Client</div>
          <div style={{ fontSize: 24, color: s.text2, marginTop: 4 }}>Laptop</div>
        </div>

        <div style={{ color: s.text3, fontSize: 18 }}>{'\u2192'}</div>

        <div style={{
          background: `${s.accent}10`, border: `2px solid ${s.accent}`, borderRadius: 10, padding: '14px 20', textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{ color: s.accent, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Service</div>
          <div style={{ fontFamily: s.mono, fontSize: 13, color: s.text, fontWeight: 600 }}>my-service</div>
          <div style={{ fontFamily: s.mono, fontSize: 11, color: s.accent }}>10.96.0.1:80</div>
          {animating && (
            <div style={{
              position: 'absolute', top: -6, right: -6, width: 12, height: 12,
              borderRadius: '50%', background: s.green,
              animation: 'none',
            }} />
          )}
        </div>

        <div style={{ color: s.text3, fontSize: 18 }}>{'\u2192'}</div>

        <div style={{ display: 'flex', gap: 8 }}>
          {podIps.map((ip, i) => (
            <div key={ip} style={{
              background: currentIdx === i ? `${s.green}15` : s.bg2,
              border: `2px solid ${currentIdx === i ? s.green : s.border}`,
              borderRadius: 10, padding: '10px 14px', textAlign: 'center',
              transition: 'all 0.4s', minWidth: 90,
            }}>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{podNames[i]}</div>
              <div style={{ fontFamily: s.mono, fontSize: 12, color: currentIdx === i ? s.green : s.text, transition: 'color 0.4s' }}>{ip}</div>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>Port: 80</div>
              {currentIdx === i && <div style={{ fontFamily: s.mono, fontSize: 10, color: s.green, marginTop: 4 }}>ACTIVE</div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, marginBottom: 16, overflow: 'hidden',
      }}>
        <div
          onClick={() => setShowIptables(!showIptables)}
          style={{
            padding: '10px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: showIptables ? `1px solid ${s.border}` : 'none',
          }}
        >
          <span style={{ color: s.text2, fontSize: 12, fontWeight: 600 }}>kube-proxy iptables Rules</span>
          <span style={{ color: s.text3, fontSize: 11 }}>{showIptables ? 'Hide' : 'Show'}</span>
        </div>
        {showIptables && (
          <div style={{ padding: 8 }}>
            {iptablesRules.map((rule, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, padding: '6px 10px', fontFamily: s.mono, fontSize: 12,
                background: i === 0 ? `${s.accent}08` : (i > 0 && (i-1) === currentIdx ? `${s.green}10` : 'transparent'),
                borderLeft: `2px solid ${
                  i === 0 ? s.accent :
                  (i > 0 && (i-1) === currentIdx) ? s.green :
                  'transparent'
                }`,
                borderRadius: 4, marginBottom: 2, transition: 'all 0.3s',
              }}>
                {rule.proto && <span style={{ color: s.text3 }}>-A PREROUTING -p {rule.proto} --dport {rule.dport} -j {rule.target}</span>}
                {!rule.proto && rule.stat && <span style={{ color: s.text3 }}>-A {rule.target} -m statistic --mode random --probability {rule.stat} -j {rule.target}</span>}
                {!rule.proto && !rule.stat && <span style={{ color: s.text3 }}>-A {rule.target} -j DNAT --to-destination 10.1.0.2:80</span>}
                {rule.desc && <span style={{ color: s.text2, marginLeft: 8 }}># {rule.desc}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={sendRequest} disabled={animating} style={{
          background: animating ? s.bg3 : s.accent, border: 'none', borderRadius: 8, padding: '10px 24px',
          color: '#fff', cursor: animating ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
          opacity: animating ? 0.5 : 1,
        }}>Send Request</button>
        <button onClick={resetDemo} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
          color: s.text2, cursor: 'pointer', fontSize: 13,
        }}>Reset</button>
      </div>

      {log.length > 0 && (
        <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: 10 }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Request Log</div>
          {log.map((entry, i) => (
            <div key={i} style={{
              fontFamily: s.mono, fontSize: 11, color: i === 0 ? s.green : s.text2, marginBottom: 2,
            }}>
              {entry}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>How Services Work</div>
        {[
          { label: 'Stable IP', desc: 'Service gets a stable ClusterIP (10.96.0.1) that does not change', color: s.accent },
          { label: 'kube-proxy', desc: 'Watches the API server and creates iptables DNAT rules for each endpoint', color: s.green },
          { label: 'Round Robin', desc: 'iptables statistic module distributes traffic across pods with random probability', color: s.purple },
        ].map((st) => (
          <div key={st.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
            <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 72 }}>{st.label}</span>
            <span style={{ color: s.text2, fontSize: 12 }}>{st.desc}</span>
          </div>
        ))}
      </div>
    </div>
    </DemoBoundary>
  )
}
