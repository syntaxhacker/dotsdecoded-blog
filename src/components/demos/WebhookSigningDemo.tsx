import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

function mockHmacHex(payload: string, secret: string): string {
  let hash = 0
  const combined = secret + payload
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const abs = Math.abs(hash).toString(16).padStart(8, '0')
  return abs + abs.split('').reverse().join('').slice(0, 32)
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }

const defaultPayload = JSON.stringify({
  id: 'evt_3QpLmN7XyZ',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_3QpLmN7XyZ',
      amount: 2999,
      currency: 'usd',
      status: 'succeeded',
    },
  },
}, null, 2)

const tamperedPayload = JSON.stringify({
  id: 'evt_3QpLmN7XyZ',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_3QpLmN7XyZ',
      amount: 100,
      currency: 'usd',
      status: 'succeeded',
    },
  },
}, null, 2)

export default function WebhookSigningDemo() {
  const [secret, setSecret] = useState('whsec_abc123def456')
  const [payload, setPayload] = useState(defaultPayload)
  const [tampered, setTampered] = useState(false)

  const signature = useMemo(() => mockHmacHex(payload, secret), [payload, secret])
  const recomputed = useMemo(() => mockHmacHex(payload, secret), [payload, secret])
  const signatureMatches = signature === recomputed

  const useTampered = () => {
    setPayload(tamperedPayload)
    setTampered(true)
  }

  const resetPayload = () => {
    setPayload(defaultPayload)
    setTampered(false)
  }

  return (
    <DemoBoundary name="Webhook Payload Signing">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>Webhook Payload Signing</div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        The sender signs the payload with a shared secret. The receiver recomputes the signature and compares.
        If they match, the payload is authentic. If not, the request is rejected.
      </p>

      <div style={SEC}>
        <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Shared Secret</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="text" value={secret} onChange={e => setSecret(e.target.value)}
            style={{
              flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 12px',
              color: s.text, fontFamily: s.mono, fontSize: 13, outline: 'none',
            }} />
          <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>(change to invalidate)</div>
        </div>
      </div>

      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, textTransform: 'uppercase', letterSpacing: 1 }}>Payload Body</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={resetPayload} disabled={!tampered} style={{
              padding: '4px 10px', fontSize: 10, fontFamily: s.mono, cursor: tampered ? 'pointer' : 'default',
              border: `1px solid ${s.border}`, borderRadius: 4, background: s.bg3, color: tampered ? s.text2 : s.text3,
            }}>Original</button>
            <button onClick={useTampered} disabled={tampered} style={{
              padding: '4px 10px', fontSize: 10, fontFamily: s.mono, cursor: tampered ? 'default' : 'pointer',
              border: `1px solid ${s.red}`, borderRadius: 4, background: tampered ? s.bg3 : 'rgba(232,93,93,0.1)',
              color: tampered ? s.text3 : s.red,
            }}>Tamper Payload</button>
          </div>
        </div>
        <div style={{
          background: s.bg, border: `1px solid ${tampered ? s.red : s.border}`, borderRadius: 8, padding: 12,
          fontFamily: s.mono, fontSize: 11, color: tampered ? s.red : s.text, lineHeight: 1.7, whiteSpace: 'pre', overflowX: 'auto',
          transition: 'border-color 0.3s',
        }}>
          {payload}
        </div>
      </div>

      <div style={SEC}>
        <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>HMAC-SHA256 Computation</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 12px', fontFamily: s.mono, fontSize: 11, color: s.text3 }}>
            HMAC-SHA256( secret, payload )
          </div>
          <span style={{ color: s.text3, fontSize: 16 }}>{'='}</span>
          <div style={{
            background: s.bg, border: `1px solid ${signatureMatches ? s.green : s.red}`, borderRadius: 6, padding: '6px 12px',
            fontFamily: s.mono, fontSize: 11, color: signatureMatches ? s.green : s.red, transition: 'all 0.3s',
          }}>
            {signature}
          </div>
        </div>

        <div style={{ background: s.bg3, borderRadius: 8, padding: '10px 14px', border: `1px solid ${s.border}` }}>
          <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 6 }}>Webhook-Signature Header (Stripe format)</div>
          <div style={{
            background: s.bg, border: `1px solid ${s.border2}`, borderRadius: 6, padding: '8px 12px',
            fontFamily: s.mono, fontSize: 11, color: s.yellow, overflowWrap: 'break-word',
          }}>
            webhook-signature: t=1716000000,sig_profile=v1,{'{'}&quot;sig&quot;{':'}&quot;{signature}&quot;, &quot;v1&quot;{':'}&quot;...&quot;, &quot;v2&quot;{':'}&quot;...&quot;{'}'}
          </div>
        </div>
      </div>

      <div style={{
        background: s.bg2, borderRadius: 12, padding: '16px 20px', border: `1px solid ${signatureMatches ? s.green : s.red}`,
        display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.3s',
      }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%',
          background: signatureMatches ? s.green : s.red,
          flexShrink: 0,
        }} />
        <div>
          <div style={{ fontSize: 13, fontFamily: s.mono, fontWeight: 700, color: signatureMatches ? s.green : s.red }}>
            {signatureMatches ? 'SIGNATURE VERIFIED' : 'SIGNATURE MISMATCH'}
          </div>
          <div style={{ fontSize: 12, color: s.text2, marginTop: 2 }}>
            {signatureMatches
              ? 'The payload is authentic and has not been tampered with. Process the webhook.'
              : tampered
                ? 'Payload was modified after signing. Reject the webhook and log the incident.'
                : 'The secret may have changed or the payload was altered. Reject and investigate.'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, background: s.bg3, borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${s.green}` }}>
          <div style={{ fontSize: 11, fontFamily: s.mono, color: s.green, marginBottom: 4 }}>SENDER (Webhook Provider)</div>
          <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.6 }}>
            Signs payload with shared secret<br />
            Adds webhook-signature header<br />
            Posts to client endpoint
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200, background: s.bg3, borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${s.accent}` }}>
          <div style={{ fontSize: 11, fontFamily: s.mono, color: s.accent, marginBottom: 4 }}>RECEIVER (Webhook Client)</div>
          <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.6 }}>
            Extracts signature from header<br />
            Recomputes HMAC from payload + secret<br />
            Compares: match = authentic, reject if not
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
