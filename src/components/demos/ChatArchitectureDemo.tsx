import { useState, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type CompId = 'client' | 'ws_server' | 'mq' | 'msg_service' | 'notification' | 'db' | 'cache'

interface Comp {
  id: CompId
  label: string
  color: string
  details: string[]
}

const components: Comp[] = [
  { id: 'client', label: 'Client', color: s.accent, details: ['Mobile or web app', 'Maintains persistent WebSocket connection', 'Sends/receives messages in real time', 'Caches recent messages locally', 'Shows online/offline status'] },
  { id: 'ws_server', label: 'WebSocket\nServers', color: s.green, details: ['Manages persistent client connections', 'Authenticates users on connect', 'Routes messages to/from clients', 'Tracks which users are online', 'Handles reconnection logic', 'Horizontal scaling via consistent hashing'] },
  { id: 'mq', label: 'Message\nQueue', color: s.purple, details: ['Decouples message sending from processing', 'Kafka or RabbitMQ cluster', 'Topic per conversation or sharded', 'Provides ordering guarantees', 'Buffers spikes in message volume', 'Enables async fan-out for groups'] },
  { id: 'msg_service', label: 'Message\nService', color: s.orange, details: ['Consumes messages from queue', 'Persists to database', 'Checks recipient online status', 'Forwards to recipient WebSocket server', 'Triggers push notification if offline', 'Handles deduplication'] },
  { id: 'notification', label: 'Push\nNotification', color: s.red, details: ['FCM (Android) / APNs (iOS)', 'Sends silent notification for new messages', 'Wakes app to fetch full message', 'Rate-limited per user', 'Fallback delivery channel'] },
  { id: 'db', label: 'Database', color: s.yellow, details: ['PostgreSQL primary + read replicas', 'Messages table partitioned by time', 'Indexes on conversation_id, sender_id', 'Read receipts tracked per user', 'Sharded by user_id at scale'] },
  { id: 'cache', label: 'Cache\n(Redis)', color: s.border2, details: ['Stores online/offline status per user', 'Caches recent messages per conversation', 'Session tokens and auth data', 'Rate limiting counters', 'Presence pub/sub channels'] },
]

const compPositions: Record<CompId, { x: number; y: number }> = {
  client: { x: 30, y: 60 },
  ws_server: { x: 190, y: 60 },
  mq: { x: 350, y: 60 },
  msg_service: { x: 350, y: 220 },
  notification: { x: 510, y: 220 },
  db: { x: 190, y: 220 },
  cache: { x: 30, y: 220 },
}

const compSize = { w: 120, h: 52 }

type FlowStep = {
  from: CompId
  to: CompId
  label: string
}

const sendMsgFlow: FlowStep[] = [
  { from: 'client', to: 'ws_server', label: '1. Send message' },
  { from: 'ws_server', to: 'mq', label: '2. Publish to queue' },
  { from: 'mq', to: 'msg_service', label: '3. Consume' },
  { from: 'msg_service', to: 'db', label: '4. Persist' },
  { from: 'msg_service', to: 'ws_server', label: '5. Forward to recipient' },
  { from: 'ws_server', to: 'client', label: '6. Deliver to recipient' },
]

const sendMsgFlowOffline: FlowStep[] = [
  { from: 'client', to: 'ws_server', label: '1. Send message' },
  { from: 'ws_server', to: 'mq', label: '2. Publish to queue' },
  { from: 'mq', to: 'msg_service', label: '3. Consume' },
  { from: 'msg_service', to: 'db', label: '4. Persist' },
  { from: 'msg_service', to: 'notification', label: '5. Push notification' },
]

const onlineFlow: FlowStep[] = [
  { from: 'client', to: 'ws_server', label: '1. Connect + auth' },
  { from: 'ws_server', to: 'cache', label: '2. Set online status' },
  { from: 'ws_server', to: 'db', label: '3. Fetch offline messages' },
  { from: 'db', to: 'ws_server', label: '4. Return unread' },
  { from: 'ws_server', to: 'client', label: '5. Deliver offline queue' },
]

function getMidpoint(from: CompId, to: CompId): { x: number; y: number } {
  const fp = compPositions[from]
  const tp = compPositions[to]
  return {
    x: (fp.x + compSize.w / 2 + tp.x + compSize.w / 2) / 2,
    y: (fp.y + compSize.h / 2 + tp.y + compSize.h / 2) / 2,
  }
}

export default function ChatArchitectureDemo() {
  const [selectedComp, setSelectedComp] = useState<Comp | null>(null)
  const [scenario, setScenario] = useState<'send_online' | 'send_offline' | 'online'>('send_online')
  const [activeStep, setActiveStep] = useState(-1)
  const [animating, setAnimating] = useState(false)

  const flows: Record<string, FlowStep[]> = {
    send_online: sendMsgFlow,
    send_offline: sendMsgFlowOffline,
    online: onlineFlow,
  }

  const flow = flows[scenario]

  useEffect(() => {
    setActiveStep(-1)
    setAnimating(false)
  }, [scenario])

  const animate = () => {
    setAnimating(true)
    setActiveStep(0)
  }

  useEffect(() => {
    if (!animating || activeStep < 0) return
    if (activeStep >= flow.length) {
      setAnimating(false)
      return
    }
    const t = setTimeout(() => setActiveStep((prev) => prev + 1), 800)
    return () => clearTimeout(t)
  }, [animating, activeStep, flow])

  const arrowColor = (stepIdx: number) => {
    if (activeStep < 0) return s.border2
    if (stepIdx < activeStep) return s.green
    if (stepIdx === activeStep) return s.yellow
    return s.border2
  }

  const stepActive = (stepIdx: number) => activeStep >= 0 && stepIdx <= activeStep

  return (
    <DemoBoundary name="Chat System Architecture">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {([
            ['send_online', 'Send Message (recipient online)'],
            ['send_offline', 'Send Message (recipient offline)'],
            ['online', 'User Comes Online'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setScenario(key)}
              style={{
                flex: 1,
                padding: '7px 10px',
                background: scenario === key ? `${s.accent}20` : s.bg2,
                border: `1px solid ${scenario === key ? s.accent : s.border}`,
                borderRadius: 6,
                color: scenario === key ? s.accent : s.text2,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: s.mono,
                transition: 'all 0.2s',
                textAlign: 'center',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <svg viewBox={-20 + ' ' + -10 + ' ' + 680 + ' ' + 320} style={{ width: '100%', display: 'block', overflow: 'hidden' }}>
                {flow.map((step, i) => {
                  const fp = compPositions[step.from]
                  const tp = compPositions[step.to]
                  const fx = fp.x + compSize.w / 2
                  const fy = fp.y + compSize.h / 2
                  const tx = tp.x + compSize.w / 2
                  const ty = tp.y + compSize.h / 2
                  const mid = getMidpoint(step.from, step.to)
                  const col = arrowColor(i)
                  const active = stepActive(i)
                  return (
                    <g key={i}>
                      <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={col} strokeWidth={active ? 2 : 1.5} />
                      <circle cx={mid.x} cy={mid.y} r={active ? 10 : 8} fill={active ? `${col}20` : s.bg} stroke={col} strokeWidth={1} />
                      <text x={mid.x} y={mid.y + 3} textAnchor="middle" fill={active ? s.text : s.text3} fontSize={7} fontWeight={600} fontFamily={s.mono}>
                        {i + 1}
                      </text>
                    </g>
                  )
                })}

                {components.map((comp) => {
                  const pos = compPositions[comp.id]
                  const isSelected = selectedComp?.id === comp.id
                  const isFlowComp = flow.some((st) => st.from === comp.id || st.to === comp.id)
                  return (
                    <g key={comp.id}>
                      <rect
                        x={pos.x}
                        y={pos.y}
                        width={compSize.w}
                        height={compSize.h}
                        rx={6}
                        fill={isSelected ? `${comp.color}15` : s.bg2}
                        stroke={isSelected ? comp.color : isFlowComp ? `${comp.color}60` : s.border}
                        strokeWidth={isSelected ? 2 : 1}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedComp(comp)}
                      />
                      {comp.label.split('\n').map((line, li) => (
                        <text
                          key={li}
                          x={pos.x + compSize.w / 2}
                          y={pos.y + compSize.h / 2 + (li - (comp.label.includes('\n') ? 0.5 : 0)) * 13 + 4}
                          textAnchor="middle"
                          fill={isFlowComp ? comp.color : s.text3}
                          fontSize={10}
                          fontWeight={600}
                          fontFamily={s.mono}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedComp(comp)}
                        >
                          {line}
                        </text>
                      ))}
                    </g>
                  )
                })}
              </svg>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginTop: 12 }}>
              <button
                onClick={animate}
                disabled={animating}
                style={{
                  padding: '7px 24px',
                  background: animating ? s.bg3 : s.accent,
                  color: animating ? s.text3 : '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: animating ? 'not-allowed' : 'pointer',
                  fontFamily: s.mono,
                  transition: 'all 0.2s',
                }}
              >
                {activeStep >= flow.length ? 'Replay' : animating ? 'Running...' : 'Animate Flow'}
              </button>
            </div>
          </div>

          <div style={{ width: 300, flexShrink: 0 }}>
            {selectedComp ? (
              <div style={{
                background: s.bg,
                border: `1px solid ${selectedComp.color}`,
                borderRadius: 8,
                overflow: 'hidden',
                marginBottom: 12,
              }}>
                <div style={{
                  padding: '10px 14px',
                  borderBottom: `1px solid ${s.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedComp.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: s.mono, fontSize: 12, fontWeight: 700, color: selectedComp.color }}>
                    {selectedComp.label.replace('\n', ' ')}
                  </span>
                </div>
                <div style={{ padding: '10px 14px' }}>
                  {selectedComp.details.map((d, i) => (
                    <div key={i} style={{ fontSize: 11, color: s.text2, lineHeight: 1.6, marginBottom: 4 }}>
                      <span style={{ color: s.text3, marginRight: 6 }}>{i + 1}.</span>{d}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                padding: '30px 20px',
                textAlign: 'center',
                marginBottom: 12,
              }}>
                <div style={{ color: s.text3, fontSize: 12 }}>Click a component to inspect</div>
              </div>
            )}

            <div style={{
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Flow Steps
              </div>
              {flow.map((step, i) => {
                const fromLabel = components.find((c) => c.id === step.from)?.label.replace('\n', ' ') || step.from
                const toLabel = components.find((c) => c.id === step.to)?.label.replace('\n', ' ') || step.to
                return (
                  <div key={i} style={{
                    display: 'flex',
                    gap: 6,
                    padding: '3px 0',
                    fontFamily: s.mono,
                    fontSize: 10,
                    color: stepActive(i) ? s.text : s.text3,
                    opacity: activeStep >= 0 && i > activeStep ? 0.4 : 1,
                  }}>
                    <span style={{ color: arrowColor(i), fontWeight: 600, width: 14, flexShrink: 0 }}>{i + 1}.</span>
                    <span>{fromLabel} → {toLabel}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
