import { useState, useEffect, useRef, useCallback } from 'react'
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

type NetMode = 'bridge' | 'host' | 'none'
type Step = 'container' | 'veth' | 'bridge' | 'nat' | 'internet' | 'done'

const nodes: { key: string; label: string; x: number; y: number }[] = [
  { key: 'c1', label: 'Container A\n172.17.0.2', x: 100, y: 160 },
  { key: 'c2', label: 'Container B\n172.17.0.3', x: 100, y: 320 },
  { key: 'veth1', label: 'veth0', x: 250, y: 160 },
  { key: 'veth2', label: 'veth1', x: 250, y: 320 },
  { key: 'bridge', label: 'docker0\n172.17.0.1', x: 400, y: 240 },
  { key: 'nat', label: 'iptables\nDNAT:80->8080', x: 550, y: 240 },
  { key: 'eth0', label: 'eth0\n192.168.1.5', x: 700, y: 240 },
]

const edges: { from: string; to: string }[] = [
  { from: 'c1', to: 'veth1' },
  { from: 'veth1', to: 'bridge' },
  { from: 'c2', to: 'veth2' },
  { from: 'veth2', to: 'bridge' },
  { from: 'bridge', to: 'nat' },
  { from: 'nat', to: 'eth0' },
]

const nodePos: Record<string, { x: number; y: number }> = {}
for (const n of nodes) {
  nodePos[n.key] = { x: n.x, y: n.y }
}

export default function ContainerNetworkDemo() {
  const [mode, setMode] = useState<NetMode>('bridge')
  const [animating, setAnimating] = useState(false)
  const [step, setStep] = useState<Step | null>(null)
  const [packetPos, setPacketPos] = useState({ x: 100, y: 160 })
  const [showRules, setShowRules] = useState(false)
  const [speed, setSpeed] = useState(1)
  const animRef = useRef<number | null>(null)
  const stepIdxRef = useRef(0)

  const stepSequence: { from: string; to: string; label: string }[] = [
    { from: 'c1', to: 'veth1', label: 'Packet leaves container via veth pair' },
    { from: 'veth1', to: 'bridge', label: 'Packet reaches docker0 bridge' },
    { from: 'bridge', to: 'nat', label: 'Bridge forwards to iptables NAT' },
    { from: 'nat', to: 'eth0', label: 'DNAT: 172.17.0.2:80 -> 192.168.1.5:8080' },
    { from: 'eth0', to: 'internet', label: 'Packet reaches internet' },
  ]

  const getEdgeEndpoints = useCallback((from: string, to: string) => {
    const p1 = nodePos[from]
    if (to === 'internet') {
      return { x1: p1.x, y1: p1.y, x2: 780, y2: p1.y }
    }
    const p2 = nodePos[to]
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
  }, [])

  const animateStep = useCallback(() => {
    const st = stepSequence[stepIdxRef.current]
    if (!st) {
      setStep('done')
      setAnimating(false)
      return
    }
    setStep(st.from as Step)
    const { x1, y1, x2, y2 } = getEdgeEndpoints(st.from, st.to)
    const startX = st.from === 'c1' ? x1 + 30 : x1
    const startY = y1
    const endX = st.to === 'internet' ? x2 : x2 - 30
    const endY = y2
    const duration = getStepDelay(600, speed)
    const startTime = performance.now()

    const frame = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      const cx = startX + (endX - startX) * ease
      const cy = startY + (endY - startY) * ease
      setPacketPos({ x: cx, y: cy })

      if (t < 1) {
        animRef.current = requestAnimationFrame(frame)
      } else {
        stepIdxRef.current += 1
        setTimeout(() => {
          if (stepIdxRef.current < stepSequence.length) {
            animateStep()
          } else {
            setStep('done')
            setAnimating(false)
          }
        }, getStepDelay(300, speed))
      }
    }
    animRef.current = requestAnimationFrame(frame)
  }, [speed, getEdgeEndpoints])

  const startAnimation = () => {
    if (animating) return
    stepIdxRef.current = 0
    setAnimating(true)
    setStep(null)
    animateStep()
  }

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  const iptablesRules = `-A PREROUTING -t nat -p tcp --dport 8080 \\
    -j DNAT --to-destination 172.17.0.2:80
-A POSTROUTING -t nat -s 172.17.0.0/16 \\
    -j MASQUERADE
-A FORWARD -i docker0 -o eth0 -j ACCEPT
-A FORWARD -i eth0 -o docker0 -j ACCEPT`

  const currentStep = stepIdxRef.current >= 0 && stepIdxRef.current < stepSequence.length
    ? stepSequence[stepIdxRef.current]
    : null

  const showContainerB = mode === 'bridge'

  return (
    <DemoBoundary name="Container Networking">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>Container Networking</div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Packets flow through virtual Ethernet pairs, a bridge, and iptables NAT to reach the outside world.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: s.bg2, borderRadius: 8, padding: 3 }}>
          {(['bridge', 'host', 'none'] as NetMode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setStep(null); setShowRules(false) }}
              style={{
                background: mode === m ? s.accent : 'transparent',
                border: 'none', borderRadius: 6, padding: '6px 16px',
                color: mode === m ? '#fff' : s.text2,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s',
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <SpeedController speed={speed} onSpeedChange={setSpeed} />
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: 20, marginBottom: 16, overflow: 'hidden' }}>
        {mode === 'bridge' && (
          <>
            <svg width="700" height="430" viewBox="-20 -10 740 430" style={{ display: 'block' }}>
              {edges.map((ed, i) => {
                const p1 = nodePos[ed.from]
                const p2 = nodePos[ed.to]
                const isActive = currentStep && (currentStep.from === ed.from && currentStep.to === ed.to)
                return (
                  <line
                    key={i}
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke={isActive ? s.accent : s.border}
                    strokeWidth={isActive ? 3 : 1.5}
                    strokeDasharray={isActive ? 'none' : '6 4'}
                  />
                )
              })}
              <line x1={700} y1={240} x2={760} y2={240} stroke={s.border2} strokeWidth={1.5} strokeDasharray="6 4" />

              {nodes.filter(n => showContainerB || n.key !== 'c2').map(n => (
                <g key={n.key}>
                  <rect
                    x={n.x - 50} y={n.y - 22} width={100} height={44} rx={8}
                    fill={n.key.startsWith('c') ? `${s.purple}22` : n.key === 'bridge' ? `${s.green}22` : n.key === 'nat' ? `${s.orange}22` : `${s.accent}22`}
                    stroke={n.key.startsWith('c') ? s.purple : n.key === 'bridge' ? s.green : n.key === 'nat' ? s.orange : s.accent}
                    strokeWidth={1.5}
                  />
                  {n.label.split('\n').map((line, i) => (
                    <text
                      key={i}
                      x={n.x} y={n.y - 6 + i * 16}
                      textAnchor="middle"
                      fill={n.key.startsWith('c') ? s.purple : n.key === 'bridge' ? s.green : n.key === 'nat' ? s.orange : s.accent}
                      fontSize={11}
                      fontWeight={i === 0 ? 600 : 400}
                      fontFamily={s.mono}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              ))}

              <text x={730} y={244} fill={s.text3} fontSize={11} fontFamily={s.mono}>Internet</text>

              {animating && currentStep && (
                <circle cx={packetPos.x} cy={packetPos.y} r={6} fill={s.yellow}>
                  <animate attributeName="opacity" values="1;0.4;1" dur="0.5s" repeatCount="indefinite" />
                </circle>
              )}
            </svg>

            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 14px', marginTop: 12, fontFamily: s.mono, fontSize: 12, color: s.text2,
            }}>
              {animating && currentStep
                ? currentStep.label
                : step === 'done'
                  ? 'Packet reached the internet successfully'
                  : 'Click "Animate Packet" to see the flow'}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={startAnimation}
                disabled={animating}
                style={{
                  background: animating ? s.bg3 : s.accent,
                  border: 'none', borderRadius: 8, padding: '10px 20px',
                  color: animating ? s.text3 : '#fff',
                  fontSize: 13, fontWeight: 600, cursor: animating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {animating ? 'Animating...' : 'Animate Packet'}
              </button>
              <button
                onClick={() => setShowRules(!showRules)}
                style={{
                  background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
                  color: s.text2, fontSize: 13, cursor: 'pointer',
                }}
              >
                {showRules ? 'Hide iptables' : 'Show iptables'}
              </button>
            </div>
          </>
        )}

        {mode === 'host' && (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <div style={{
              background: `${s.yellow}15`, border: `1px solid ${s.yellow}`, borderRadius: 12,
              padding: 24, marginBottom: 16,
            }}>
              <div style={{ color: s.yellow, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Host Network Mode</div>
              <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6 }}>
                Container shares the host's network stack directly -- no veth pairs, no bridge, no NAT.
                The container sees the same eth0, same IP, same ports as the host.
                Port mapping with -p is ignored.
              </div>
            </div>
            <svg width="400" height="120" viewBox="0 0 400 120" style={{ display: 'block', margin: '0 auto' }}>
              <rect x={10} y={10} width={120} height={60} rx={8} fill={`${s.purple}22`} stroke={s.purple} strokeWidth={1.5} />
              <text x={70} y={46} textAnchor="middle" fill={s.purple} fontSize={11} fontFamily={s.mono} fontWeight={600}>Container</text>
              <line x1={130} y1={40} x2={170} y2={40} stroke={s.border} strokeWidth={2} />
              <rect x={170} y={10} width={120} height={60} rx={8} fill={`${s.accent}22`} stroke={s.accent} strokeWidth={1.5} />
              <text x={230} y={46} textAnchor="middle" fill={s.accent} fontSize={11} fontFamily={s.mono} fontWeight={600}>Host Stack</text>
              <line x1={290} y1={40} x2={330} y2={40} stroke={s.border2} strokeWidth={1.5} strokeDasharray="6 4" />
              <text x={370} y={44} textAnchor="middle" fill={s.text3} fontSize={11} fontFamily={s.mono}>Internet</text>
            </svg>
          </div>
        )}

        {mode === 'none' && (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <div style={{
              background: `${s.red}15`, border: `1px solid ${s.red}`, borderRadius: 12,
              padding: 24, marginBottom: 16,
            }}>
              <div style={{ color: s.red, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No Networking Mode</div>
              <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6 }}>
                Container has only loopback (lo). No eth0, no external connectivity.
                The container is completely isolated from the network. Only local IPC via lo works.
              </div>
            </div>
            <svg width="200" height="100" viewBox="0 0 200 100" style={{ display: 'block', margin: '0 auto' }}>
              <rect x={40} y={20} width={120} height={60} rx={8} fill={`${s.purple}22`} stroke={s.purple} strokeWidth={1.5} />
              <text x={100} y={56} textAnchor="middle" fill={s.purple} fontSize={11} fontFamily={s.mono} fontWeight={600}>lo only</text>
            </svg>
          </div>
        )}
      </div>

      {showRules && mode === 'bridge' && (
        <div style={{ background: s.bg2, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: s.text2, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            iptables NAT Rules
          </div>
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 14, fontFamily: s.mono, fontSize: 12, lineHeight: 1.8, color: s.text, whiteSpace: 'pre' }}>
            {iptablesRules}
          </div>
        </div>
      )}

      <div style={{ background: s.bg2, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: s.text2, marginBottom: 12 }}>Network Modes</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { mode: 'bridge', desc: 'Default. Each container gets a veth pair, connected to docker0 bridge. Uses NAT for external access.' },
            { mode: 'host', desc: 'Container uses the host network stack directly. No isolation, but zero latency.' },
            { mode: 'none', desc: 'No external networking. Only loopback interface. Maximum isolation.' },
          ].map(item => (
            <div key={item.mode} style={{
              background: s.bg, border: `1px solid ${mode === item.mode ? s.accent : s.border}`,
              borderRadius: 8, padding: 12, transition: 'border-color 0.2s',
            }}>
              <div style={{ color: s.accent, fontSize: 12, fontWeight: 700, textTransform: 'capitalize', marginBottom: 4 }}>{item.mode}</div>
              <div style={{ color: s.text3, fontSize: 11, lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
