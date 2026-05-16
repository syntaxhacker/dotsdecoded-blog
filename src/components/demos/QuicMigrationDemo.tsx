import { useState, useEffect, useRef } from 'react'
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

interface MigStep {
  label: string
  detail: string
  network: 'wifi' | 'cellular' | 'none'
  status: 'connected' | 'migrating' | 'broken' | 'resumed'
}

const steps: MigStep[] = [
  { label: 'Connected via WiFi', detail: 'Device: 192.168.1.42\nServer: 203.0.113.5\nCID: abc123', network: 'wifi', status: 'connected' },
  { label: 'Data flowing on WiFi', detail: 'QUIC packets flowing through WiFi path\nUsing Connection ID: abc123', network: 'wifi', status: 'connected' },
  { label: 'WiFi signal weakening', detail: 'Device moving out of WiFi range...', network: 'wifi', status: 'migrating' },
  { label: 'WiFi disconnects', detail: 'TCP break: old IP 192.168.1.42 unreachable\nBut QUIC connection ID (abc123) survives', network: 'none', status: 'broken' },
  { label: 'Cellular interface active', detail: 'New IP: 10.0.0.5\nQUIC reconnects using same CID: abc123', network: 'cellular', status: 'migrating' },
  { label: 'Connection migrated to cellular', detail: 'Packets now flowing over cellular path\nServer sees same CID: abc123, continues seamlessly', network: 'cellular', status: 'resumed' },
]

export default function QuicMigrationDemo() {
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (!running || step >= steps.length - 1) {
      if (step >= steps.length - 1) { setRunning(false); setFinished(true) }
      return
    }
    const t = setTimeout(() => setStep(p => p + 1), getStepDelay(1200, speed))
    return () => clearTimeout(t)
  }, [running, step, speed])

  const start = () => { setStep(0); setRunning(true); setFinished(false) }
  const reset = () => { setStep(0); setRunning(false); setFinished(false) }

  const st = steps[step]
  const showPackets = st && (st.status === 'connected' || st.status === 'resumed')
  const showBroken = st && st.status === 'broken'

  return (
    <DemoBoundary name="QUIC Connection Migration">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
          QUIC Connection Migration
        </div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          QUIC identifies connections by a Connection ID instead of IP:port. When a device switches networks (WiFi to cellular),
          the connection survives because the CID stays the same. TCP would break because the IP address changes.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ position: 'relative', background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 16, minHeight: 300 }}>
          <svg width="100%" height="240" viewBox="0 0 700 240" style={{ display: 'block' }}>
            <defs>
              <marker id="arrowWifi" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={s.accent} />
              </marker>
              <marker id="arrowCell" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={s.green} />
              </marker>
              <marker id="arrowBroken" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={s.red} />
              </marker>
            </defs>

            <rect x="20" y="80" width="100" height="80" rx="12" fill={s.bg} stroke={s.accent} strokeWidth="2" />
            <text x="70" y="110" textAnchor="middle" fill={s.accent} fontSize="12" fontWeight="700">Device</text>
            <text x="70" y="128" textAnchor="middle" fill={s.text3} fontSize="10" fontFamily={s.mono}>CID: abc123</text>
            {st && (
              <text x="70" y="145" textAnchor="middle" fill={s.text3} fontSize="9" fontFamily={s.mono}>
                {st.network === 'wifi' ? '192.168.1.42' : st.network === 'cellular' ? '10.0.0.5' : '???.???.?.?'}
              </text>
            )}

            <rect x="580" y="80" width="100" height="80" rx="12" fill={s.bg} stroke={s.green} strokeWidth="2" />
            <text x="630" y="110" textAnchor="middle" fill={s.green} fontSize="12" fontWeight="700">Server</text>
            <text x="630" y="128" textAnchor="middle" fill={s.text3} fontSize="10" fontFamily={s.mono}>203.0.113.5</text>

            {st && st.network === 'wifi' && (
              <>
                <line x1="120" y1="100" x2="580" y2="100" stroke={s.accent} strokeWidth="3" strokeDasharray="8 4" markerEnd="url(#arrowWifi)" />
                <line x1="580" y1="140" x2="120" y2="140" stroke={s.accent} strokeWidth="2" strokeDasharray="8 4" markerEnd="url(#arrowWifi)" opacity="0.5" />
                <text x="350" y="90" textAnchor="middle" fill={s.accent} fontSize="10" fontWeight="600">WiFi Path</text>
                {showPackets && (
                  <>
                    <circle cx="250" cy="100" r="4" fill={s.accent} opacity="0.8">
                      <animate attributeName="cx" values="120;580" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="250" cy="140" r="4" fill={s.green} opacity="0.8">
                      <animate attributeName="cx" values="580;120" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
              </>
            )}

            {st && st.network === 'none' && (
              <>
                <line x1="120" y1="100" x2="580" y2="100" stroke={s.red} strokeWidth="3" strokeDasharray="4 6" markerEnd="url(#arrowBroken)" />
                <text x="350" y="90" textAnchor="middle" fill={s.red} fontSize="10" fontWeight="600">CONNECTION BROKEN</text>
                <text x="350" y="165" textAnchor="middle" fill={s.red} fontSize="11" fontFamily={s.mono}>TCP would fail (IP changed)</text>
                <text x="350" y="182" textAnchor="middle" fill={s.yellow} fontSize="11" fontFamily={s.mono}>QUIC CID: abc123 -- still alive</text>
              </>
            )}

            {st && st.network === 'cellular' && (
              <>
                <path d="M 120 100 Q 200 200 400 160 Q 520 130 580 100" fill="none" stroke={s.green} strokeWidth="3" strokeDasharray="6 4" markerEnd="url(#arrowCell)" />
                <path d="M 580 140 Q 520 170 400 190 Q 200 220 120 140" fill="none" stroke={s.green} strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
                <text x="400" y="200" textAnchor="middle" fill={s.green} fontSize="10" fontWeight="600">Cellular Path</text>
                {showPackets && (
                  <>
                    <circle cx="250" cy="130" r="4" fill={s.green} opacity="0.8">
                      <animate attributeName="cx" values="120;250;400;520;580" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="cy" values="100;140;160;145;100" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
              </>
            )}

            {st && st.network === 'cellular' && st.status === 'resumed' && (
              <text x="350" y="225" textAnchor="middle" fill={s.green} fontSize="13" fontWeight="700" fontFamily={s.mono}>
                Connection Migrated -- Same CID: abc123
              </text>
            )}
          </svg>
        </div>

        <div style={{ background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: st ? (
              st.status === 'connected' ? s.green : st.status === 'migrating' ? s.yellow : st.status === 'broken' ? s.red : s.green
            ) : s.text3, marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: s.text, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{st ? st.label : 'Ready'}</div>
              <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-line', fontFamily: s.mono }}>
                {st ? st.detail : 'Press Start to see connection migration in action'}
              </div>
            </div>
            <div style={{
              padding: '2px 8px', borderRadius: 4,
              background: st && st.status === 'connected' ? `${s.green}20` : st && st.status === 'migrating' ? `${s.yellow}20` : st && st.status === 'broken' ? `${s.red}20` : `${s.text3}20`,
              fontSize: 10, fontFamily: s.mono, color: st && st.status === 'connected' ? s.green : st && st.status === 'migrating' ? s.yellow : st && st.status === 'broken' ? s.red : s.text3,
              flexShrink: 0,
            }}>
              {st ? st.status.toUpperCase() : 'WAITING'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={start} disabled={running} style={{
            background: running ? s.bg3 : s.accent,
            border: 'none', borderRadius: 8, padding: '10px 20px',
            color: running ? s.text3 : '#fff', cursor: running ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600, flex: 1,
          }}>{finished ? 'Replay' : running ? 'Running...' : 'Start Migration'}</button>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
