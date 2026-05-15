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

type TabType = 'architecture' | 'admin'

interface DeliveryRecord {
  id: string
  event: string
  url: string
  attempts: number
  status: 'delivered' | 'retrying' | 'failed' | 'dlq'
  lastAttempt: string
}

const initialRecords: DeliveryRecord[] = [
  { id: 'del_001', event: 'payment_intent.succeeded', url: 'https://api.client.com/webhooks', attempts: 1, status: 'delivered', lastAttempt: '2026-05-18 01:00:32' },
  { id: 'del_002', event: 'customer.created', url: 'https://api.client.com/webhooks', attempts: 3, status: 'delivered', lastAttempt: '2026-05-18 01:05:12' },
  { id: 'del_003', event: 'invoice.paid', url: 'https://hooks.company.com/payments', attempts: 6, status: 'dlq', lastAttempt: '2026-05-18 01:30:45' },
  { id: 'del_004', event: 'charge.refunded', url: 'https://api.client.com/webhooks', attempts: 1, status: 'delivered', lastAttempt: '2026-05-18 01:45:18' },
  { id: 'del_005', event: 'subscription.updated', url: 'https://hooks.other.com/events', attempts: 4, status: 'retrying', lastAttempt: '2026-05-18 02:15:33' },
  { id: 'del_006', event: 'payment_intent.failed', url: 'https://api.client.com/webhooks', attempts: 2, status: 'delivered', lastAttempt: '2026-05-18 02:30:01' },
  { id: 'del_007', event: 'customer.deleted', url: 'https://hooks.company.com/payments', attempts: 6, status: 'failed', lastAttempt: '2026-05-18 03:00:22' },
]

const statusColor = (st: string) => {
  switch (st) {
    case 'delivered': return s.green
    case 'retrying': return s.orange
    case 'failed': return s.red
    case 'dlq': return s.purple
    default: return s.text3
  }
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }

export default function WebhookArchitectureDemo() {
  const [tab, setTab] = useState<TabType>('architecture')
  const [records, setRecords] = useState<DeliveryRecord[]>(initialRecords)
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null)

  const handleReplay = (id: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id === id && (r.status === 'dlq' || r.status === 'failed')) {
        return { ...r, status: 'retrying' as const, attempts: r.attempts + 1 }
      }
      return r
    }))
  }

  const totalEvents = records.length
  const deliveredCount = records.filter(r => r.status === 'delivered').length
  const retryingCount = records.filter(r => r.status === 'retrying').length
  const failedCount = records.filter(r => r.status === 'failed' || r.status === 'dlq').length

  return (
    <DemoBoundary name="Webhook System Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>Webhook System Architecture</div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['architecture', 'admin'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 16px', fontSize: 12, fontFamily: s.mono, cursor: 'pointer',
            border: `1px solid ${tab === t ? s.accent : s.border}`, borderRadius: 6,
            background: tab === t ? 'rgba(91,141,239,0.15)' : s.bg3,
            color: tab === t ? s.accent : s.text3, fontWeight: tab === t ? 600 : 400,
            textTransform: 'capitalize', transition: 'all 0.2s',
          }}>
            {t === 'architecture' ? 'Architecture Diagram' : 'Admin Panel'}
          </button>
        ))}
      </div>

      {tab === 'architecture' && (
        <>
          <div style={SEC}>
            <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Event Flow</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <NodeBox label="Event Producer" color={s.accent} sub="Payment Service, User Service, etc." />
              <Arrow />
              <NodeBox label="Event Service" color={s.purple} sub="Validates, signs, enqueues" />
              <Arrow />
              <NodeBox label="Message Queue" color={s.yellow} sub="Redis, RabbitMQ, or SQS (per client or shared)" icon="Q" />
              <Arrow />
              <NodeBox label="Delivery Workers" color={s.orange} sub="N workers pull events, POST to client URLs" />
              <Arrow />
              <NodeBox label="Client Endpoint" color={s.green} sub="Receives POST with signed payload" />
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <MiniNode label="200 OK" color={s.green} />
                <MiniNode label="4xx/5xx" color={s.red} />
                <MiniNode label="Timeout" color={s.orange} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <NodeBox label="Dead Letter Queue" color={s.red} sub="Failed after max retries" />
                <NodeBox label="Delivery Log" color={s.text2} sub="Full audit trail" />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180, background: s.bg3, borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${s.accent}` }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.accent, marginBottom: 4 }}>PER-CLIENT QUEUE</div>
              <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
                Each client gets its own queue. A slow or failing client does not block deliveries to others.
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 180, background: s.bg3, borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${s.yellow}` }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.yellow, marginBottom: 4 }}>RATE LIMITING</div>
              <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
                Workers throttle POSTs to each client based on their configured rate limit. Excess events are queued.
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 180, background: s.bg3, borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${s.purple}` }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.purple, marginBottom: 4 }}>SIGNING + IDEMPOTENCY</div>
              <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
                Payloads are signed with HMAC-SHA256. Each event carries a unique idempotency key for safe retries.
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'admin' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <StatBox label="Total Events" value={totalEvents} color={s.text} />
            <StatBox label="Delivered" value={deliveredCount} color={s.green} />
            <StatBox label="Retrying" value={retryingCount} color={s.orange} />
            <StatBox label="Failed / DLQ" value={failedCount} color={s.red} />
          </div>

          {selectedRecord && (
            <div style={{
              background: s.bg3, borderRadius: 10, padding: 16, marginBottom: 16,
              border: `1px solid ${s.border2}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontFamily: s.mono, color: s.accent, fontWeight: 600 }}>{selectedRecord}</div>
                <button onClick={() => setSelectedRecord(null)} style={{
                  padding: '2px 8px', fontSize: 10, fontFamily: s.mono, cursor: 'pointer',
                  border: `1px solid ${s.border}`, borderRadius: 4, background: s.bg, color: s.text3,
                }}>Close</button>
              </div>
              <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.7 }}>
                <strong style={{ color: s.text }}>Event:</strong> {records.find(r => r.id === selectedRecord)?.event}<br />
                <strong style={{ color: s.text }}>URL:</strong> {records.find(r => r.id === selectedRecord)?.url}<br />
                <strong style={{ color: s.text }}>Attempts:</strong> {records.find(r => r.id === selectedRecord)?.attempts}<br />
                <strong style={{ color: s.text }}>Last Attempt:</strong> {records.find(r => r.id === selectedRecord)?.lastAttempt}<br />
                <strong style={{ color: s.text }}>Status:</strong>{' '}
                <span style={{ color: statusColor(records.find(r => r.id === selectedRecord)?.status || ''), fontWeight: 600 }}>
                  {(records.find(r => r.id === selectedRecord)?.status || '').toUpperCase()}
                </span>
              </div>
            </div>
          )}

          <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text3 }}>DELIVERY LOG</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['all', 'delivered', 'retrying', 'failed', 'dlq'] as const).map(f => (
                  <button key={f} style={{
                    padding: '2px 8px', fontSize: 9, fontFamily: s.mono, cursor: 'pointer',
                    border: `1px solid ${s.border}`, borderRadius: 4, background: s.bg3, color: s.text3,
                    textTransform: 'uppercase',
                  }}>{f}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {records.map((rec, i) => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecord(rec.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    borderBottom: i < records.length - 1 ? `1px solid ${s.bg3}` : 'none',
                    cursor: 'pointer', transition: 'background 0.15s',
                    background: selectedRecord === rec.id ? s.bg3 : 'transparent',
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(rec.status), flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text }}>{rec.event}</div>
                    <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.url}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontFamily: s.mono, color: statusColor(rec.status), fontWeight: 600 }}>
                      {rec.status.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>{rec.attempts} attempts</div>
                  </div>
                  {(rec.status === 'dlq' || rec.status === 'failed') && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReplay(rec.id) }}
                      style={{
                        padding: '4px 10px', fontSize: 10, fontFamily: s.mono, cursor: 'pointer',
                        border: `1px solid ${s.accent}`, borderRadius: 4, background: 'rgba(91,141,239,0.12)',
                        color: s.accent, fontWeight: 600,
                      }}
                    >
                      Replay
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16, background: s.bg3, borderRadius: 8, padding: '10px 14px', border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 4 }}>QUICK STATS</div>
            <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.6 }}>
              Delivery success rate: {totalEvents > 0 ? Math.round((deliveredCount / totalEvents) * 100) : 0}% |
              DLQ rate: {totalEvents > 0 ? Math.round((records.filter(r => r.status === 'dlq').length / totalEvents) * 100) : 0}% |
              Avg attempts per event: {(totalEvents > 0 ? (records.reduce((a, r) => a + r.attempts, 0) / totalEvents).toFixed(1) : '0')}
            </div>
          </div>
        </>
      )}
    </div>
    </DemoBoundary>
  )
}

function NodeBox({ label, color, sub, icon }: { label: string; color: string; sub?: string; icon?: string }) {
  return (
    <div style={{
      background: `${color}08`, border: `1px solid ${color}40`, borderRadius: 8,
      padding: '10px 20px', textAlign: 'center', minWidth: 180,
    }}>
      <div style={{ fontSize: 13, fontFamily: s.mono, color, fontWeight: 600 }}>
        {icon && <span style={{ marginRight: 6, opacity: 0.6 }}>{icon}</span>}
        {label}
      </div>
      {sub && <div style={{ fontSize: 10, color: s.text3, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Arrow() {
  return <div style={{ color: s.text3, fontSize: 14, lineHeight: 1 }}>{'|'}<br />{'v'}</div>
}

function MiniNode({ label, color }: { label: string; color: string }) {
  return (
    <div style={{
      fontSize: 10, fontFamily: s.mono, color, border: `1px solid ${color}40`,
      borderRadius: 4, padding: '3px 8px', background: `${color}10`,
    }}>
      {label}
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 16px',
      textAlign: 'center', flex: 1, minWidth: 100,
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: s.mono, color }}>{value}</div>
      <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginTop: 2 }}>{label}</div>
    </div>
  )
}
