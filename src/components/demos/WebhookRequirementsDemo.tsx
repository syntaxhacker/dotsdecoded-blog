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

interface Req {
  id: string
  text: string
  category: 'delivery' | 'security' | 'reliability' | 'observability'
  priority: 'must' | 'should' | 'nice'
  enabled: boolean
}

const initialReqs: Req[] = [
  { id: 'r1', text: 'Deliver events to registered webhook URLs via HTTP POST', category: 'delivery', priority: 'must', enabled: true },
  { id: 'r2', text: 'Retry failed deliveries with exponential backoff', category: 'delivery', priority: 'must', enabled: true },
  { id: 'r3', text: 'Idempotent event delivery via unique event IDs', category: 'delivery', priority: 'must', enabled: true },
  { id: 'r4', text: 'HMAC-SHA256 signature in header for payload verification', category: 'security', priority: 'must', enabled: true },
  { id: 'r5', text: 'At-least-once delivery guarantee per event', category: 'delivery', priority: 'must', enabled: true },
  { id: 'r6', text: 'Rate limiting per client URL (max N requests per second)', category: 'reliability', priority: 'must', enabled: true },
  { id: 'r7', text: 'Dead letter queue for events exceeding max retries', category: 'reliability', priority: 'must', enabled: true },
  { id: 'r8', text: 'Delivery log with timestamps, status codes, and response bodies', category: 'observability', priority: 'must', enabled: true },
  { id: 'r9', text: 'Manually replay events from the delivery log', category: 'observability', priority: 'should', enabled: true },
  { id: 'r10', text: 'Circuit breaker to pause delivery to failing endpoints', category: 'reliability', priority: 'should', enabled: true },
  { id: 'r11', text: 'Webhook secret rotation without downtime', category: 'security', priority: 'should', enabled: true },
  { id: 'r12', text: 'Fan-out delivery to multiple registered URLs per event', category: 'delivery', priority: 'should', enabled: true },
  { id: 'r13', text: 'Partial payload delivery (send only changed fields)', category: 'delivery', priority: 'nice', enabled: false },
  { id: 'r14', text: 'Custom retry intervals per client configuration', category: 'delivery', priority: 'nice', enabled: false },
]

const priorityColor: Record<string, string> = { must: s.red, should: s.yellow, nice: s.green }
const priorityLabel: Record<string, string> = { must: 'MUST', should: 'SHOULD', nice: 'NICE' }
const priorityOrder = { must: 0, should: 1, nice: 2 } as const
const categoryColor: Record<string, string> = { delivery: s.accent, security: s.purple, reliability: s.orange, observability: s.green }

function nextPriority(current: 'must' | 'should' | 'nice'): 'must' | 'should' | 'nice' {
  const order: ('must' | 'should' | 'nice')[] = ['must', 'should', 'nice']
  return order[(order.indexOf(current) + 1) % 3]
}

export default function WebhookRequirementsDemo() {
  const [reqs, setReqs] = useState<Req[]>(initialReqs)

  const toggleReq = (id: string) => {
    setReqs(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const cyclePriority = (id: string) => {
    setReqs(prev => prev.map(r => r.id === id ? { ...r, priority: nextPriority(r.priority) } : r))
  }

  const enabled = reqs.filter(r => r.enabled)
  const byCategory = ['delivery', 'security', 'reliability', 'observability'].map(cat => ({
    category: cat,
    items: reqs.filter(r => r.category === cat),
    enabledItems: enabled.filter(r => r.category === cat),
  }))
  const mustCount = enabled.filter(r => r.priority === 'must').length
  const shouldCount = enabled.filter(r => r.priority === 'should').length
  const niceCount = enabled.filter(r => r.priority === 'nice').length

  return (
    <DemoBoundary name="Webhook System Requirements">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg, borderRadius: 16, padding: '24px 24px', border: `1px solid ${s.border}` }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>Webhook System Requirements</div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
            Toggle requirements on/off and cycle priorities to plan your webhook delivery system.
          </p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20, fontSize: 12, fontFamily: s.mono, flexWrap: 'wrap' }}>
            <span style={{ color: s.red }}>{mustCount} MUST</span>
            <span style={{ color: s.yellow }}>{shouldCount} SHOULD</span>
            <span style={{ color: s.green }}>{niceCount} NICE</span>
            <span style={{ color: s.text3 }}>|</span>
            <span style={{ color: s.text2 }}>{enabled.length} / {reqs.length} enabled</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {byCategory.map(({ category, items, enabledItems }) => (
              <div key={category} style={{ background: s.bg2, borderRadius: 10, padding: 16, border: `1px solid ${s.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: categoryColor[category], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontFamily: s.mono, color: categoryColor[category], textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                    {category}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginLeft: 'auto' }}>
                    {enabledItems.length}/{items.length}
                  </span>
                </div>
                {items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).map(r => (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', marginBottom: 3,
                    borderRadius: 6, background: r.enabled ? `${categoryColor[category]}06` : 'transparent',
                    opacity: r.enabled ? 1 : 0.35, transition: 'all 0.2s',
                  }}>
                    <button onClick={() => toggleReq(r.id)} style={{
                      width: 18, height: 18, borderRadius: 4, border: `2px solid ${r.enabled ? categoryColor[category] : s.border}`,
                      background: r.enabled ? categoryColor[category] : 'transparent', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {r.enabled && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>x</span>}
                    </button>
                    <span style={{ fontSize: 13, color: s.text, flex: 1 }}>{r.text}</span>
                    <button onClick={() => cyclePriority(r.id)} style={{
                      fontSize: 10, fontFamily: s.mono, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                      border: `1px solid ${priorityColor[r.priority]}`,
                      background: 'transparent', color: priorityColor[r.priority], fontWeight: 600,
                    }}>
                      {priorityLabel[r.priority]}
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
