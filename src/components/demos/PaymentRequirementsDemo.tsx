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

const requirements = [
  {
    id: 'payments',
    title: 'Accept Payments',
    short: 'Cards, wallets, bank transfers, BNPL',
    color: s.accent,
    detail: 'Support multiple payment methods: credit/debit cards (Visa, Mastercard, Amex), digital wallets (Apple Pay, Google Pay, PayPal), bank transfers (ACH, SEPA, wire), and buy-now-pay-later (Klarna, Afterpay). Each method has unique integration, settlement timing, and fee structures.',
  },
  {
    id: 'disputes',
    title: 'Disputes & Refunds',
    short: 'Chargebacks, partial refunds, full refunds',
    color: s.orange,
    detail: 'Handle the full dispute lifecycle: customer initiates chargeback, merchant receives notification, evidence submission window, dispute resolution. Partial/full refunds must reverse the original transaction in the ledger without creating accounting imbalances.',
  },
  {
    id: 'idempotency',
    title: 'Idempotency',
    short: 'Retry-safe API operations',
    color: s.green,
    detail: 'Every payment API request carries a unique idempotency key. If the client retries (network timeout, 500 error), the server returns the original result instead of processing twice. This is critical for payments -- charging a card twice is a production incident.',
  },
  {
    id: 'reporting',
    title: 'Reporting & Analytics',
    short: 'Dashboard, reconciliation reports, P&L',
    color: s.purple,
    detail: 'Provide real-time dashboards for transaction volume, success rates, and revenue. Generate reconciliation reports that match processor statements against internal records. P&L reports show gross revenue minus fees, refunds, and chargebacks per merchant.',
  },
  {
    id: 'fraud',
    title: 'Fraud Detection',
    short: 'ML models, rules engine, 3DS',
    color: s.red,
    detail: 'Multi-layer fraud detection: rule-based checks (velocity, unusual amounts, high-risk countries), ML model scoring (behavioral analysis, device fingerprinting), and 3D Secure authentication for card-not-present transactions. Flagged transactions are held for manual review.',
  },
  {
    id: 'multicurrency',
    title: 'Multi-Currency',
    short: 'FX rates, settlement currency, local methods',
    color: s.yellow,
    detail: 'Accept payments in 135+ currencies. Show prices in local currency, settle in merchant\'s base currency. Real-time FX rate handling with 0.5% spreads. Support local payment methods per region (iDEAL in Netherlands, Alipay in China, Boleto in Brazil).',
  },
  {
    id: 'compliance',
    title: 'PCI-DSS Compliance',
    short: 'SAQ A, tokenization, card data never touches servers',
    color: s.accent,
    detail: 'PCI DSS Level 1 compliance. Use client-side tokenization (Stripe Elements, hosted fields) so card PAN never reaches your server. All card data is replaced with tokens. Annual SAQ validation, quarterly ASV scans, and strict access controls on the payment environment.',
  },
  {
    id: 'scalability',
    title: 'Scalability & Reliability',
    short: '99.99% uptime, sub-100ms p99 latency',
    color: s.green,
    detail: 'Horizontal scaling across multiple AZs. Payment processing must have p99 latency under 100ms. Stateless services for easy scaling. Database sharding by merchant_id. Circuit breakers for downstream processor failures. 99.99% uptime SLA with multi-region failover.',
  },
]

const cardStyle = (selected: boolean, color: string): React.CSSProperties => ({
  background: s.bg2,
  border: `1px solid ${selected ? color : s.border}`,
  borderRadius: 10,
  padding: '16px 18px',
  cursor: 'pointer',
  transition: 'all 0.2s',
})

export default function PaymentRequirementsDemo() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <DemoBoundary name="Payment System Requirements">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>System Requirements</div>
        <p style={{ color: s.text2, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          A production payment system must satisfy requirements across security, reliability, compliance, and business domains.
          Click any card below for details.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {requirements.map((req) => {
          const isSelected = selected === req.id
          return (
            <div
              key={req.id}
              onClick={() => setSelected(isSelected ? null : req.id)}
              style={cardStyle(isSelected, req.color)}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: isSelected ? 10 : 0,
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', background: req.color, flexShrink: 0,
                }} />
                <div style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>{req.title}</div>
              </div>
              {!isSelected && (
                <div style={{ color: s.text3, fontSize: 12, marginTop: 6, marginLeft: 20 }}>
                  {req.short}
                </div>
              )}
              {isSelected && (
                <div style={{
                  marginLeft: 20, marginTop: 4, paddingTop: 10, borderTop: `1px solid ${s.border}`,
                  color: s.text2, fontSize: 13, lineHeight: 1.6,
                }}>
                  {req.detail}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selected && (
        <div style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: '14px 18px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: s.text3, fontSize: 12 }}>
            {requirements.find(r => r.id === selected)?.title} selected
          </span>
          <button
            onClick={() => setSelected(null)}
            style={{
              background: 'transparent', border: `1px solid ${s.border}`, borderRadius: 6,
              padding: '5px 12px', color: s.text2, cursor: 'pointer', fontSize: 12,
            }}
          >
            Deselect
          </button>
        </div>
      )}
    </div>
    </DemoBoundary>
  )
}
