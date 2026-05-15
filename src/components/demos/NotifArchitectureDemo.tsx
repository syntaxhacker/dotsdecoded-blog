import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController from './SpeedController'
import { getStepDelay } from './SpeedController'

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

interface NodeInfo {
  id: string
  label: string
  desc: string
  color: string
}

const nodes: NodeInfo[] = [
  { id: 'client', label: 'Client Apps', desc: 'Mobile, web, backend services send notification requests via REST API', color: s.accent },
  { id: 'api', label: 'Notification API', desc: 'Ingress: validates, deduplicates, enriches, and publishes to message queue', color: s.green },
  { id: 'queue', label: 'Message Queue', desc: 'Kafka / SQS topic per channel. Buffers spikes, enables async processing', color: s.yellow },
  { id: 'workers', label: 'Notification Workers', desc: 'Consumer groups: render templates, check prefs, apply rate limits', color: s.purple },
  { id: 'handlers', label: 'Channel Handlers', desc: 'Push handler, Email handler, SMS handler, In-App handler', color: s.orange },
  { id: 'gateways', label: 'External Gateways', desc: 'APNS, FCM, SendGrid, SES, Twilio, Vonage', color: s.red },
  { id: 'devices', label: 'End Devices', desc: 'iPhones, Android phones, email inboxes, SMS inboxes, browser UIs', color: s.accent },
]

const edges: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
]

export default function NotifArchitectureDemo() {
  const [activeNode, setActiveNode] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [completedNodes, setCompletedNodes] = useState<number[]>([])
  const [speed, setSpeed] = useState(1)

  const stop = useCallback(() => {
    setIsPlaying(false)
    setActiveNode(-1)
    setCompletedNodes([])
  }, [])

  const play = useCallback(() => {
    if (isPlaying) { stop(); return }
    setCompletedNodes([])
    setActiveNode(0)
    setIsPlaying(true)
  }, [isPlaying, stop])

  useEffect(() => {
    if (!isPlaying) return
    if (activeNode >= nodes.length) {
      setIsPlaying(false)
      return
    }
    const timer = setTimeout(() => {
      setCompletedNodes(prev => [...prev, activeNode])
      setActiveNode(prev => prev + 1)
    }, getStepDelay(1200, speed))
    return () => clearTimeout(timer)
  }, [isPlaying, activeNode, speed])

  const cols = 4
  const rows = Math.ceil(nodes.length / cols)

  const getNodePosition = (i: number) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    return {
      x: col * (100 / cols) + (100 / cols / 2),
      y: row * (100 / rows) + (100 / rows / 2),
    }
  }

  return (
    <DemoBoundary name="Notification Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={H}>Full Architecture</div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Play the animation to trace a notification through the entire distributed system — from client apps to end devices.
        </p>

        <div style={{
          position: 'relative', background: s.bg, border: `1px solid ${s.border}`,
          borderRadius: 12, padding: 20, marginBottom: 20, minHeight: 260,
        }}>
          <svg width="100%" height="260" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            {edges.map(([from, to]) => {
              const p1 = getNodePosition(from)
              const p2 = getNodePosition(to)
              const x1 = (p1.x / 100) * 760
              const y1 = (p1.y / 100) * 260
              const x2 = (p2.x / 100) * 760
              const y2 = (p2.y / 100) * 260
              const isComplete = completedNodes.includes(to)
              return (
                <line
                  key={`${from}-${to}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isComplete ? s.green : s.border}
                  strokeWidth={isComplete ? 2.5 : 1.5}
                  strokeDasharray={isComplete ? 'none' : '6 4'}
                  style={{ transition: 'stroke 0.5s' }}
                />
              )
            })}

            {activeNode > 0 && activeNode < nodes.length && (
              (() => {
                const from = getNodePosition(activeNode - 1)
                const to = getNodePosition(activeNode)
                return (
                  <circle
                    r={6}
                    fill={s.accent}
                    style={{ transition: 'all 0.3s' }}
                  >
                    <animateMotion
                      dur={`${getStepDelay(0.8, speed)}s`}
                      repeatCount="1"
                      path={`M${(from.x / 100) * 760},${(from.y / 100) * 260} L${(to.x / 100) * 760},${(to.y / 100) * 260}`}
                    />
                  </circle>
                )
              })()
            )}
          </svg>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 12,
            position: 'relative',
          }}>
            {nodes.map((node, i) => {
              const isActive = activeNode === i
              const isComplete = completedNodes.includes(i)
              return (
                <div
                  key={node.id}
                  onClick={() => { if (!isPlaying) setActiveNode(i) }}
                  style={{
                    background: isActive ? `${node.color}25` : isComplete ? `${node.color}15` : s.bg2,
                    border: `1px solid ${isActive ? node.color : isComplete ? `${node.color}50` : s.border}`,
                    borderRadius: 10, padding: '14px 10px', cursor: isPlaying ? 'default' : 'pointer',
                    textAlign: 'center', transition: 'all 0.3s',
                    opacity: isActive || isComplete ? 1 : 0.6,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, margin: '0 auto 8px',
                    background: isActive ? node.color : isComplete ? `${node.color}40` : s.bg3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: isActive ? '#fff' : isComplete ? node.color : s.text3,
                    transition: 'all 0.3s',
                  }}>
                    {node.label.charAt(0)}
                  </div>
                  <div style={{
                    color: isActive ? node.color : isComplete ? s.text : s.text2,
                    fontSize: 11, fontWeight: 600, marginBottom: 4,
                    transition: 'color 0.3s',
                  }}>{node.label}</div>
                  <div style={{
                    color: isActive ? s.text2 : s.text3,
                    fontSize: 9, lineHeight: 1.4,
                  }}>{node.desc}</div>
                </div>
              )
            })}
          </div>
        </div>

        {activeNode >= 0 && activeNode < nodes.length && (
          <div style={{
            background: s.bg, border: `1px solid ${nodes[activeNode].color}`,
            borderLeft: `3px solid ${nodes[activeNode].color}`,
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          }}>
            <div style={{ color: nodes[activeNode].color, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
              Step {activeNode + 1}: {nodes[activeNode].label}
            </div>
            <div style={{ color: s.text2, fontSize: 12 }}>{nodes[activeNode].desc}</div>
          </div>
        )}

        {activeNode < 0 && (
          <div style={{
            background: s.bg, border: `1px dashed ${s.border}`,
            borderRadius: 8, padding: 12, marginBottom: 16, textAlign: 'center',
          }}>
            <div style={{ color: s.text3, fontSize: 12 }}>Press Play to trace a notification through the system.</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={play} style={{
            background: isPlaying ? s.red : s.accent, border: 'none', borderRadius: 8,
            padding: '10px 24px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
          }}>{isPlaying ? 'Stop' : 'Play Animation'}</button>
        </div>

        <div style={{ marginTop: 12, borderTop: `1px solid ${s.border}`, paddingTop: 12 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Architecture Components</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {[
              { label: 'API Gateway', desc: 'Auth, rate limiting, routing', color: s.green },
              { label: 'Message Queue', desc: 'Kafka, SQS, RabbitMQ', color: s.yellow },
              { label: 'Workers', desc: 'Scalable consumer groups', color: s.purple },
              { label: 'Channel Handlers', desc: 'Push, Email, SMS, In-App', color: s.orange },
              { label: 'Provider SDKs', desc: 'FCM, APNS, SendGrid, Twilio', color: s.red },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: s.bg3, borderRadius: 4, padding: '2px 8px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ color: s.text, fontSize: 10, fontWeight: 600 }}>{item.label}</span>
                <span style={{ color: s.text3, fontSize: 9 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
