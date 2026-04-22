import { useState, useEffect, useCallback } from 'react'
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
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type Phase = 'idle' | 'dns' | 'tcp' | 'request' | 'server' | 'response' | 'done'

const phases: { key: Phase; label: string; desc: string; time: string }[] = [
  { key: 'idle', label: 'Ready', desc: 'Press Send Request to start the flow', time: '-' },
  { key: 'dns', label: 'DNS Lookup', desc: 'Client asks DNS server to resolve domain name to IP address', time: '20-120ms' },
  { key: 'tcp', label: 'TCP Handshake', desc: 'Client and server establish a reliable connection (SYN, SYN-ACK, ACK)', time: '10-100ms' },
  { key: 'request', label: 'Send HTTP Request', desc: 'Client sends the request packet through the network to the server', time: '5-50ms' },
  { key: 'server', label: 'Server Processing', desc: 'Server receives request, runs business logic, queries database', time: '10-500ms' },
  { key: 'response', label: 'HTTP Response', desc: 'Server sends response back through the network to the client', time: '5-50ms' },
  { key: 'done', label: 'Complete', desc: 'Client receives and renders the response. Request lifecycle finished.', time: 'Total' },
]

const phaseIdx = (p: Phase) => phases.findIndex(ph => ph.key === p)

export default function ClientServerFlowDemo() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [animating, setAnimating] = useState(false)
  const [progress, setProgress] = useState(0)

  const send = useCallback(() => {
    setAnimating(true)
    setProgress(0)
    setPhase('dns')
  }, [])

  useEffect(() => {
    if (!animating) return
    if (phase === 'done') { setAnimating(false); return }
    const t = setTimeout(() => {
      const cur = phaseIdx(phase)
      if (cur < phases.length - 1) {
        setPhase(phases[cur + 1].key)
      }
    }, 1200)
    return () => clearTimeout(t)
  }, [animating, phase])

  useEffect(() => {
    if (!animating || phase === 'idle' || phase === 'done') { setProgress(0); return }
    let start: number
    let frame: number
    const animate = (ts: number) => {
      if (!start) start = ts
      setProgress(Math.min((ts - start) / 1200, 1))
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [animating, phase])

  const reset = () => { setPhase('idle'); setAnimating(false); setProgress(0) }

  const activeIdx = phaseIdx(phase)

  const compColor = (key: string, isActive: boolean) => {
    if (isActive) return s.accent
    if (phase === 'done') return s.green
    return s.border
  }

  const isReqPhase = phase === 'dns' || phase === 'request'
  const isRespPhase = phase === 'response'
  const isServerPhase = phase === 'server'

  return (
    <DemoBoundary name="Client-Server Flow">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Client-Server Architecture</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Click Send Request to watch a packet travel from client to server and back.
        </p>

        <svg viewBox="0 0 700 120" style={{ width: '100%', height: 'auto', marginBottom: 20, overflow: 'hidden' }}>
          <defs>
            <marker id="arrowReq" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={isReqPhase ? s.accent : s.border} />
            </marker>
            <marker id="arrowResp" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={isRespPhase ? s.green : s.border} />
            </marker>
          </defs>

          <rect x={10} y={20} width={120} height={80} rx={12} fill={s.bg3} stroke={compColor('client', isReqPhase || isRespPhase)} strokeWidth={2} />
          <text x={70} y={55} textAnchor="middle" fill={compColor('client', isReqPhase || isRespPhase)} fontSize={13} fontWeight={600} fontFamily={s.mono}>Client</text>
          <text x={70} y={75} textAnchor="middle" fill={s.text3} fontSize={10} fontFamily={s.mono}>Browser/App</text>

          <rect x={175} y={30} width={80} height={60} rx={10} fill={s.bg3} stroke={compColor('dns', phase === 'dns')} strokeWidth={2} />
          <text x={215} y={57} textAnchor="middle" fill={compColor('dns', phase === 'dns')} fontSize={12} fontWeight={600} fontFamily={s.mono}>DNS</text>
          <text x={215} y={75} textAnchor="middle" fill={s.text3} fontSize={9} fontFamily={s.mono}>Resolver</text>

          <line x1={130} y1={60} x2={175} y2={60} stroke={phase === 'dns' ? s.accent : s.border} strokeWidth={1.5} markerEnd="url(#arrowReq)" strokeDasharray={phase === 'dns' ? 'none' : '4 4'} />

          <rect x={310} y={20} width={120} height={80} rx={12} fill={s.bg3} stroke={compColor('server', isServerPhase || phase === 'request' || isRespPhase)} strokeWidth={2} />
          <text x={370} y={55} textAnchor="middle" fill={compColor('server', isServerPhase || phase === 'request' || isRespPhase)} fontSize={13} fontWeight={600} fontFamily={s.mono}>Server</text>
          <text x={370} y={75} textAnchor="middle" fill={s.text3} fontSize={10} fontFamily={s.mono}>App Server</text>

          <line x1={255} y1={60} x2={310} y2={60} stroke={(isReqPhase || phase === 'tcp') ? s.accent : s.border} strokeWidth={1.5} markerEnd="url(#arrowReq)" strokeDasharray={(isReqPhase || phase === 'tcp') ? 'none' : '4 4'} />

          <rect x={490} y={20} width={120} height={80} rx={12} fill={s.bg3} stroke={compColor('db', isServerPhase)} strokeWidth={2} />
          <text x={550} y={55} textAnchor="middle" fill={compColor('db', isServerPhase)} fontSize={13} fontWeight={600} fontFamily={s.mono}>Database</text>
          <text x={550} y={75} textAnchor="middle" fill={s.text3} fontSize={10} fontFamily={s.mono}>Storage</text>

          <line x1={430} y1={60} x2={490} y2={60} stroke={isServerPhase ? s.orange : s.border} strokeWidth={1.5} markerEnd="url(#arrowReq)" strokeDasharray={isServerPhase ? 'none' : '4 4'} />

          {isReqPhase && (
            <circle cx={130 + progress * 180} cy={42} r={5} fill={s.accent} opacity={0.8}>
              <animate attributeName="opacity" values="0.4;1;0.4" dur="0.6s" repeatCount="indefinite" />
            </circle>
          )}
          {isRespPhase && (
            <circle cx={430 - progress * 300} cy={100} r={5} fill={s.green} opacity={0.8}>
              <animate attributeName="opacity" values="0.4;1;0.4" dur="0.6s" repeatCount="indefinite" />
            </circle>
          )}
          {isRespPhase && (
            <line x1={430} y1={100} x2={130} y2={100} stroke={s.green} strokeWidth={1.5} markerEnd="url(#arrowResp)" strokeDasharray="6 3" />
          )}
          {isServerPhase && (
            <circle cx={430 + progress * 60} cy={60} r={4} fill={s.orange}>
              <animate attributeName="opacity" values="0.4;1;0.4" dur="0.5s" repeatCount="indefinite" />
            </circle>
          )}
        </svg>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {phases.map((ph, idx) => (
            <div key={ph.key} style={{
              flex: 1, padding: '8px 6px', borderRadius: 6, textAlign: 'center',
              background: idx === activeIdx ? `${s.accent}18` : s.bg3,
              border: `1px solid ${idx === activeIdx ? s.accent : idx < activeIdx ? s.green + '40' : s.border}`,
              transition: 'all 0.3s',
            }}>
              <div style={{ fontSize: 10, color: idx === activeIdx ? s.accent : idx < activeIdx ? s.green : s.text3, fontWeight: 600, marginBottom: 2 }}>{ph.label}</div>
              <div style={{ fontSize: 9, color: s.text3, fontFamily: s.mono }}>{ph.time}</div>
              {idx < activeIdx && <div style={{ color: s.green, fontSize: 10, marginTop: 2 }}>done</div>}
            </div>
          ))}
        </div>

        <div style={{ background: s.bg, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: phase === 'done' ? s.green : s.accent, marginBottom: 4 }}>
            {phases[activeIdx].label}
          </div>
          <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.5 }}>
            {phases[activeIdx].desc}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={reset} style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 20px', color: s.text2, cursor: 'pointer', fontSize: 13 }}>Reset</button>
          <button onClick={send} disabled={animating} style={{ background: s.accent, border: 'none', borderRadius: 8, padding: '8px 20px', color: '#fff', cursor: animating ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: animating ? 0.6 : 1 }}>
            {animating ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
