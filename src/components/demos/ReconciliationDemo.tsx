import { useState, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Txn {
  id: string
  amount: number
  date: string
  status: 'succeeded' | 'refunded' | 'failed'
  description: string
}

interface ReconItem {
  processorId: string
  internalId: string
  processorAmt: number
  internalAmt: number
  status: 'match' | 'missing_internal' | 'missing_processor' | 'amount_mismatch'
  description: string
}

const processorTxns: Txn[] = [
  { id: 'ch_1A', amount: 49.99, date: '2026-05-01', status: 'succeeded', description: 'Monthly subscription' },
  { id: 'ch_2B', amount: 129.99, date: '2026-05-01', status: 'succeeded', description: 'Annual plan' },
  { id: 'ch_3C', amount: 19.99, date: '2026-05-02', status: 'succeeded', description: 'E-book purchase' },
  { id: 'ch_4D', amount: 249.00, date: '2026-05-02', status: 'succeeded', description: 'Consulting session' },
  { id: 'ch_5E', amount: 9.99, date: '2026-05-03', status: 'succeeded', description: 'App add-on' },
  { id: 'ch_6F', amount: 59.99, date: '2026-05-03', status: 'refunded', description: 'Refund - wrong charge' },
  { id: 'ch_7G', amount: 299.00, date: '2026-05-04', status: 'succeeded', description: 'Premium package' },
  { id: 'ch_8H', amount: 14.99, date: '2026-05-04', status: 'succeeded', description: 'Newsletter annual' },
  { id: 'ch_9I', amount: 79.99, date: '2026-05-05', status: 'succeeded', description: 'Workshop ticket' },
  { id: 'ch_10J', amount: 34.99, date: '2026-05-05', status: 'succeeded', description: 'API usage credit' },
]

const internalTxns: Txn[] = [
  { id: 'txn_001', amount: 49.99, date: '2026-05-01', status: 'succeeded', description: 'Monthly subscription' },
  { id: 'txn_002', amount: 129.99, date: '2026-05-01', status: 'succeeded', description: 'Annual plan' },
  { id: 'txn_003', amount: 19.99, date: '2026-05-02', status: 'succeeded', description: 'E-book purchase' },
  { id: 'txn_004', amount: 249.00, date: '2026-05-02', status: 'succeeded', description: 'Consulting session' },
  { id: 'txn_005', amount: 9.99, date: '2026-05-03', status: 'succeeded', description: 'App add-on' },
  { id: 'txn_006', amount: 59.99, date: '2026-05-03', status: 'refunded', description: 'Refund - wrong charge' },
  { id: 'txn_007', amount: 299.00, date: '2026-05-04', status: 'succeeded', description: 'Premium package' },
  { id: 'txn_008', amount: 14.99, date: '2026-05-04', status: 'succeeded', description: 'Newsletter annual' },
  { id: 'txn_009', amount: 79.99, date: '2026-05-05', status: 'succeeded', description: 'Workshop ticket' },
  { id: 'txn_010', amount: 29.99, date: '2026-05-05', status: 'succeeded', description: 'API usage credit' },
]

function generateReconItems(): ReconItem[] {
  const items: ReconItem[] = []

  for (const p of processorTxns) {
    const match = internalTxns.find(t =>
      t.amount === p.amount &&
      t.date === p.date &&
      t.status === p.status
    )
    if (match) {
      items.push({
        processorId: p.id,
        internalId: match.id,
        processorAmt: p.amount,
        internalAmt: match.amount,
        status: 'match',
        description: p.description,
      })
    } else {
      const partialMatch = internalTxns.find(t =>
        t.date === p.date &&
        t.description === p.description
      )
      if (partialMatch) {
        items.push({
          processorId: p.id,
          internalId: partialMatch.id,
          processorAmt: p.amount,
          internalAmt: partialMatch.amount,
          status: 'amount_mismatch',
          description: p.description,
        })
      } else {
        items.push({
          processorId: p.id,
          internalId: '-',
          processorAmt: p.amount,
          internalAmt: 0,
          status: 'missing_internal',
          description: p.description,
        })
      }
    }
  }

  for (const t of internalTxns) {
    const matched = items.find(item => item.internalId === t.id)
    if (!matched) {
      items.push({
        processorId: '-',
        internalId: t.id,
        processorAmt: 0,
        internalAmt: t.amount,
        status: 'missing_processor',
        description: t.description,
      })
    }
  }

  items.sort((a, b) => {
    const order = { match: 0, amount_mismatch: 1, missing_internal: 2, missing_processor: 3 }
    return order[a.status] - order[b.status]
  })

  return items
}

export default function ReconciliationDemo() {
  const [items, setItems] = useState<ReconItem[]>(generateReconItems)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const rerun = useCallback(() => {
    setItems(generateReconItems())
    setExpandedId(null)
  }, [])

  const matchedCount = items.filter(i => i.status === 'match').length
  const mismatchCount = items.filter(i => i.status === 'amount_mismatch').length
  const missingProcCount = items.filter(i => i.status === 'missing_processor').length
  const missingIntCount = items.filter(i => i.status === 'missing_internal').length

  const statusConfig = {
    match: { label: 'Matched', color: s.green, bg: `${s.green}10` },
    amount_mismatch: { label: 'Amount Mismatch', color: s.yellow, bg: `${s.yellow}10` },
    missing_internal: { label: 'Missing in Internal', color: s.red, bg: `${s.red}10` },
    missing_processor: { label: 'Missing in Processor', color: s.orange, bg: `${s.orange}10` },
  }

  return (
    <DemoBoundary name="Reconciliation">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, letterSpacing: -0.3 }}>Transaction Reconciliation</div>
          <p style={{ color: s.text2, fontSize: 13, margin: '4px 0 0 0', lineHeight: 1.5 }}>
            Matching processor transactions against internal records. Discrepancies must be investigated and resolved.
          </p>
        </div>
        <button onClick={rerun} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6,
          padding: '6px 14px', color: s.text2, cursor: 'pointer', fontSize: 12,
        }}>
          Rerun Reconciliation
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Matched', value: matchedCount, color: s.green },
          { label: 'Amount Mismatch', value: mismatchCount, color: s.yellow },
          { label: 'Missing in Processor', value: missingProcCount, color: s.orange },
          { label: 'Missing in Internal', value: missingIntCount, color: s.red },
        ].map(stat => (
          <div key={stat.label} style={{
            background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: '10px 14px', textAlign: 'center', minWidth: 100, flex: 1,
          }}>
            <div style={{ color: stat.color, fontFamily: s.mono, fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
            <div style={{ color: s.text3, fontSize: 10, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '100px 1fr 1fr 80px',
          gap: 8, padding: '6px 12px', color: s.text3, fontSize: 10,
          textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${s.border}`,
        }}>
          <span>Status</span>
          <span>Processor (Stripe)</span>
          <span>Internal</span>
          <span style={{ textAlign: 'right' }}>Amount</span>
        </div>
        {items.map((item, i) => {
          const cfg = statusConfig[item.status]
          const isExpanded = expandedId === `${item.processorId}-${item.internalId}-${i}`
          return (
            <div key={`${item.processorId}-${item.internalId}-${i}`}>
              <div
                onClick={() => setExpandedId(isExpanded ? null : `${item.processorId}-${item.internalId}-${i}`)}
                style={{
                  display: 'grid', gridTemplateColumns: '100px 1fr 1fr 80px',
                  gap: 8, padding: '8px 12px', borderRadius: 6,
                  background: cfg.bg,
                  border: `1px solid ${item.status === 'match' ? 'transparent' : cfg.color}40`,
                  cursor: 'pointer', transition: 'all 0.15s', alignItems: 'center',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0,
                  }} />
                  <span style={{ color: cfg.color, fontSize: 11, fontWeight: 600 }}>{cfg.label}</span>
                </div>
                <div style={{ color: s.text, fontFamily: s.mono, fontSize: 12 }}>{item.processorId}</div>
                <div style={{ color: s.text, fontFamily: s.mono, fontSize: 12 }}>{item.internalId}</div>
                <div style={{ color: s.text, fontFamily: s.mono, fontSize: 12, textAlign: 'right' }}>
                  {item.processorAmt > 0 ? (
                    <span>{item.internalAmt !== item.processorAmt ? (
                      <span>
                        <span style={{ color: s.red }}>${item.internalAmt.toFixed(2)}</span>
                        {' vs '}
                        <span style={{ color: s.yellow }}>${item.processorAmt.toFixed(2)}</span>
                      </span>
                    ) : `$${item.processorAmt.toFixed(2)}`}</span>
                  ) : (
                    <span style={{ color: s.orange }}>$${item.internalAmt.toFixed(2)}</span>
                  )}
                </div>
              </div>
              {isExpanded && (
                <div style={{
                  margin: '2px 0 4px 12px', padding: '8px 12px', background: s.bg3,
                  borderRadius: 6, fontSize: 12, color: s.text2, lineHeight: 1.5,
                }}>
                  {item.status === 'match' ? (
                    `Transaction ${item.processorId} matches internal record ${item.internalId}. Amount: $${item.processorAmt.toFixed(2)}. No action needed.`
                  ) : item.status === 'amount_mismatch' ? (
                    `Processor reports $${item.processorAmt.toFixed(2)} for ${item.processorId} but internal record ${item.internalId} shows $${item.internalAmt.toFixed(2)}. Difference: $${Math.abs(item.processorAmt - item.internalAmt).toFixed(2)}. Flag for manual review.`
                  ) : item.status === 'missing_internal' ? (
                    `Transaction ${item.processorId} for $${item.processorAmt.toFixed(2)} exists in processor records but has no matching internal record. Possible causes: webhook delivery failure, race condition in ledger service.`
                  ) : (
                    `Internal record ${item.internalId} for $${item.internalAmt.toFixed(2)} has no matching processor transaction. Possible causes: test transaction not cleaned up, manual adjustment not synced.`
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
    </DemoBoundary>
  )
}
