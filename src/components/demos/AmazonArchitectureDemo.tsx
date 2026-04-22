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
  db: string
}

const SERVICES: ServiceNode[] = [
  { id: 'gateway', label: 'API Gateway', color: s.accent, desc: 'Routes requests, handles auth, rate limiting', tech: ['Kong', 'JWT', 'Rate Limit'], db: '' },
  { id: 'catalog', label: 'Catalog Service', color: s.purple, desc: 'Product metadata, categories, attributes', tech: ['REST API', 'Cache'], db: 'PostgreSQL' },
  { id: 'search', label: 'Search Service', color: s.green, desc: 'Full-text search, autocomplete, faceting', tech: ['Elasticsearch', 'Inverted Index'], db: 'Elasticsearch' },
  { id: 'cart', label: 'Cart Service', color: s.orange, desc: 'Session-based cart storage and price calc', tech: ['Redis', 'Session Store'], db: 'Redis' },
  { id: 'order', label: 'Order Service', color: s.yellow, desc: 'Order lifecycle, state machine, event publisher', tech: ['Event Sourcing', 'Saga'], db: 'PostgreSQL' },
  { id: 'payment', label: 'Payment Service', color: s.red, desc: 'Charge processing, refunds, idempotency', tech: ['Stripe', 'Idempotency Keys'], db: 'PostgreSQL' },
  { id: 'inventory', label: 'Inventory Service', color: s.green, desc: 'Real-time stock tracking, distributed locks', tech: ['Redis Lock', 'Optimistic CC'], db: 'Redis + PostgreSQL' },
  { id: 'shipping', label: 'Shipping Service', color: s.accent, desc: 'Warehouse allocation, carrier integration', tech: ['FedEx API', 'UPS API'], db: 'PostgreSQL' },
  { id: 'notify', label: 'Notification Service', color: s.purple, desc: 'Email, push, SMS order updates', tech: ['SQS', 'SES', 'FCM'], db: '' },
  { id: 'reco', label: 'Recommendations', color: s.orange, desc: 'Collaborative filtering, personalization', tech: ['ML Pipeline', 'Feature Store'], db: 'Neo4j + S3' },
]

const CONNECTIONS = [
  { from: 'gateway', to: 'search', label: 'search' },
  { from: 'gateway', to: 'catalog', label: 'browse' },
  { from: 'gateway', to: 'cart', label: 'cart ops' },
  { from: 'gateway', to: 'order', label: 'checkout' },
  { from: 'catalog', to: 'search', label: 'index updates' },
  { from: 'cart', to: 'order', label: 'cart contents' },
  { from: 'order', to: 'payment', label: 'charge' },
  { from: 'order', to: 'inventory', label: 'reserve stock' },
  { from: 'order', to: 'shipping', label: 'fulfill' },
  { from: 'payment', to: 'notify', label: 'receipt' },
  { from: 'inventory', to: 'notify', label: 'low stock' },
  { from: 'shipping', to: 'notify', label: 'tracking' },
  { from: 'reco', to: 'search', label: 'personalize' },
]

export default function AmazonArchitectureDemo() {
  const [selected, setSelected] = useState<string | null>(null)

  const svc = SERVICES.find((sv) => sv.id === selected)
  const relatedConns = CONNECTIONS.filter((c) => c.from === selected || c.to === selected)

  const positions: Record<string, { x: number; y: number }> = {
    gateway: { x: 330, y: 30 },
    catalog: { x: 100, y: 120 },
    search: { x: 330, y: 120 },
    reco: { x: 560, y: 120 },
    cart: { x: 100, y: 210 },
    order: { x: 330, y: 210 },
    payment: { x: 100, y: 300 },
    inventory: { x: 330, y: 300 },
    shipping: { x: 560, y: 300 },
    notify: { x: 560, y: 210 },
  }

  return (
    <DemoBoundary name="Amazon E-Commerce Architecture">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16 }}>
          <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 12, overflow: 'hidden' }}>
            <svg width={760} height={370} viewBox="-10 -10 780 390" style={{ display: 'block', borderRadius: 6 }}>
              {CONNECTIONS.map((c, i) => {
                const from = positions[c.from]
                const to = positions[c.to]
                const highlighted = selected && (c.from === selected || c.to === selected)
                return (
                  <g key={i}>
                    <line x1={from.x + 65} y1={from.y + 20} x2={to.x + 65} y2={to.y + 20}
                      stroke={highlighted ? s.accent : s.border} strokeWidth={highlighted ? 2 : 1}
                      strokeDasharray={highlighted ? 'none' : '4 3'} opacity={highlighted ? 1 : 0.4} />
                    <text
                      x={(from.x + to.x) / 2 + 65}
                      y={(from.y + to.y) / 2 + 20 + (from.y < to.y ? -5 : 9)}
                      textAnchor="middle"
                      fill={highlighted ? s.accent : s.text3}
                      fontSize={8}
                      fontFamily={s.mono}
                      opacity={highlighted ? 1 : 0.5}
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
                    <rect x={pos.x} y={pos.y} width={130} height={40} rx={8}
                      fill={isSelected ? `${sv.color}22` : isRelated ? `${sv.color}11` : s.bg3}
                      stroke={isSelected ? sv.color : isRelated ? `${sv.color}66` : s.border}
                      strokeWidth={isSelected ? 2 : 1}
                      style={{ transition: 'all 0.2s' }}
                    />
                    <text x={pos.x + 65} y={pos.y + 20} textAnchor="middle" dominantBaseline="middle"
                      fill={isSelected ? sv.color : isRelated ? s.text : s.text2}
                      fontSize={10} fontWeight={600}
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
                  <span key={t} style={{
                    fontSize: 11, fontFamily: s.mono, color: s.text2, padding: '3px 8px',
                    background: s.bg, borderRadius: 4, display: 'inline-block', marginRight: 4, marginBottom: 4,
                  }}>
                    {t}
                  </span>
                ))}
                {svc.db && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: s.mono, color: s.yellow, padding: '3px 8px', background: `${s.yellow}11`, borderRadius: 4 }}>
                      DB: {svc.db}
                    </span>
                  </div>
                )}
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
              <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, marginBottom: 6 }}>Event-Driven Flow</div>
              <div style={{ fontSize: 11, color: s.text3, lineHeight: 1.5 }}>
                {'Order Placed -> Payment -> Inventory -> Shipping -> Notification'}
              </div>
              <div style={{ fontSize: 11, color: s.text3, lineHeight: 1.5, marginTop: 4 }}>
                Uses Saga pattern for distributed transactions across services
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
