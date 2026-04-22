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

type ServiceNode = {
  id: string
  label: string
  color: string
  desc: string
  tech: string[]
}

const SERVICES: ServiceNode[] = [
  { id: 'api', label: 'API Gateway', color: s.accent, desc: 'Routes requests to microservices', tech: ['NGINX', 'Kong', 'Rate Limiting'] },
  { id: 'location', label: 'Location Service', color: s.green, desc: 'Ingests and indexes GPS positions', tech: ['Redis Geo', 'Geohash', 'Kafka'] },
  { id: 'matching', label: 'Matching Service', color: s.purple, desc: 'Finds nearest available driver', tech: ['QuadTree', 'gRPC', 'Cassandra'] },
  { id: 'trip', label: 'Trip Service', color: s.orange, desc: 'Manages trip state machine', tech: ['PostgreSQL', 'Redis', 'State Machine'] },
  { id: 'pricing', label: 'Pricing Service', color: s.yellow, desc: 'Calculates fare and surge', tech: ['Rules Engine', 'Time-series DB'] },
  { id: 'payment', label: 'Payment Service', color: s.red, desc: 'Processes charges and payouts', tech: ['Stripe', 'Idempotency Keys', 'Ledger'] },
  { id: 'notify', label: 'Notification Service', color: s.accent, desc: 'Push notifications to riders and drivers', tech: ['FCM', 'APNS', 'WebSocket'] },
  { id: 'tracking', label: 'Tracking Service', color: s.green, desc: 'Real-time GPS streaming', tech: ['WebSocket', 'Kafka Streams', 'Redis Pub/Sub'] },
]

const CONNECTIONS = [
  { from: 'api', to: 'matching', label: 'find driver' },
  { from: 'api', to: 'trip', label: 'create trip' },
  { from: 'location', to: 'matching', label: 'driver positions' },
  { from: 'matching', to: 'trip', label: 'driver matched' },
  { from: 'matching', to: 'notify', label: 'notify driver' },
  { from: 'trip', to: 'tracking', label: 'track trip' },
  { from: 'trip', to: 'pricing', label: 'calc fare' },
  { from: 'trip', to: 'payment', label: 'charge rider' },
  { from: 'payment', to: 'notify', label: 'receipt' },
  { from: 'tracking', to: 'location', label: 'GPS updates' },
]

export default function UberArchitectureDemo() {
  const [selected, setSelected] = useState<string | null>(null)

  const svc = SERVICES.find((sv) => sv.id === selected)
  const relatedConns = CONNECTIONS.filter((c) => c.from === selected || c.to === selected)

  const positions: Record<string, { x: number; y: number }> = {
    api: { x: 350, y: 40 },
    location: { x: 80, y: 140 },
    matching: { x: 280, y: 140 },
    trip: { x: 480, y: 140 },
    pricing: { x: 620, y: 260 },
    payment: { x: 480, y: 280 },
    notify: { x: 280, y: 280 },
    tracking: { x: 80, y: 280 },
  }

  return (
    <DemoBoundary name="Uber System Architecture">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16 }}>
          <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 12, overflow: 'hidden' }}>
            <svg width={760} height={340} viewBox="-10 -10 780 360" style={{ display: 'block', borderRadius: 6 }}>
              {CONNECTIONS.map((c, i) => {
                const from = positions[c.from]
                const to = positions[c.to]
                const highlighted = selected && (c.from === selected || c.to === selected)
                return (
                  <g key={i}>
                    <line x1={from.x + 60} y1={from.y + 20} x2={to.x + 60} y2={to.y + 20}
                      stroke={highlighted ? s.accent : s.border} strokeWidth={highlighted ? 2 : 1}
                      strokeDasharray={highlighted ? 'none' : '4 3'} opacity={highlighted ? 1 : 0.5} />
                    <text
                      x={(from.x + to.x) / 2 + 60}
                      y={(from.y + to.y) / 2 + 20 + (from.y < to.y ? -6 : 10)}
                      textAnchor="middle"
                      fill={highlighted ? s.accent : s.text3}
                      fontSize={9}
                      fontFamily={s.mono}
                      opacity={highlighted ? 1 : 0.6}
                    >
                      {c.label}
                    </text>
                  </g>
                )
              })}
              {SERVICES.map((sv) => {
                const pos = positions[sv.id]
                const isSelected = selected === sv.id
                const isRelated = selected && CONNECTIONS.some(
                  (c) => (c.from === selected && c.to === sv.id) || (c.to === selected && c.from === sv.id)
                )
                return (
                  <g key={sv.id} onClick={() => setSelected(isSelected ? null : sv.id)}
                    style={{ cursor: 'pointer' }}>
                    <rect x={pos.x} y={pos.y} width={120} height={40} rx={8}
                      fill={isSelected ? `${sv.color}22` : isRelated ? `${sv.color}11` : s.bg3}
                      stroke={isSelected ? sv.color : isRelated ? `${sv.color}66` : s.border}
                      strokeWidth={isSelected ? 2 : 1}
                      style={{ transition: 'all 0.2s' }}
                    />
                    <text x={pos.x + 60} y={pos.y + 20} textAnchor="middle" dominantBaseline="middle"
                      fill={isSelected ? sv.color : isRelated ? s.text : s.text2}
                      fontSize={11} fontWeight={600}
                      fontFamily={s.mono}
                      style={{ transition: 'fill 0.2s' }}
                    >
                      {sv.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {svc ? (
              <div style={{ background: s.bg2, border: `1px solid ${svc.color}44`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: svc.color, marginBottom: 6 }}>{svc.label}</div>
                <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.5, marginBottom: 10 }}>{svc.desc}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, marginBottom: 6 }}>Tech Stack</div>
                {svc.tech.map((t) => (
                  <div key={t} style={{
                    fontSize: 11, fontFamily: s.mono, color: s.text2, padding: '3px 8px',
                    background: s.bg, borderRadius: 4, marginBottom: 4, display: 'inline-block',
                    marginRight: 4,
                  }}>
                    {t}
                  </div>
                ))}
                {relatedConns.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, marginBottom: 6 }}>Connections</div>
                    {relatedConns.map((c) => (
                      <div key={`${c.from}-${c.to}`} style={{ fontSize: 11, color: s.text3, padding: '2px 0' }}>
                        {c.from === selected ? '->' : '<-'} {c.label} {' '} {c.from === selected ? c.to : c.from}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, color: s.text3, textAlign: 'center', paddingTop: 30 }}>
                  Click a service to see details
                </div>
              </div>
            )}

            <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, marginBottom: 6 }}>Data Flow</div>
              <div style={{ fontSize: 11, color: s.text3, lineHeight: 1.5 }}>
                {'GPS -> Kafka -> Location Service -> Matching Service -> Trip Service -> Payment Service'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
