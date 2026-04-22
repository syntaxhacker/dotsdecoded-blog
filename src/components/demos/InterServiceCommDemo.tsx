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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

export default function InterServiceCommDemo() {
  const [mode, setMode] = useState<'sync' | 'async'>('sync')
  const [paymentDown, setPaymentDown] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [sending, setSending] = useState(false)

  const sendRequest = () => {
    setSending(true)
    setLog([])

    if (mode === 'sync') {
      setLog(prev => [...prev, 'Order Service sends REST POST to Payment Service...'])
      if (paymentDown) {
        setTimeout(() => setLog(prev => [...prev, 'Connection refused: Payment Service is unreachable (ECONNREFUSED)']), 600)
        setTimeout(() => setLog(prev => [...prev, 'Order Service throws error. Order creation FAILS.']), 1200)
        setTimeout(() => setLog(prev => [...prev, 'User sees 500 error. No order was created.']), 1800)
        setTimeout(() => setSending(false), 2000)
      } else {
        setTimeout(() => setLog(prev => [...prev, 'Payment Service receives request. Processing...']), 500)
        setTimeout(() => setLog(prev => [...prev, 'Payment Service responds: 200 OK { transaction_id: "tx_123" }']), 1000)
        setTimeout(() => setLog(prev => [...prev, 'Order Service receives response. Order created successfully.']), 1500)
        setTimeout(() => setLog(prev => [...prev, 'Total latency: ~100ms (sequential call)']), 2000)
        setTimeout(() => setSending(false), 2100)
      }
    } else {
      setLog(prev => [...prev, 'Order Service publishes message to Queue: { type: "payment_request", order_id: "ord_42" }'])
      setTimeout(() => setLog(prev => [...prev, 'Message Broker stores message. Order Service returns immediately: 202 Accepted']), 500)
      setTimeout(() => setLog(prev => [...prev, 'Order Service is FREE. Can handle more requests.']), 900)
      if (paymentDown) {
        setTimeout(() => setLog(prev => [...prev, 'Payment Service is DOWN. Message stays in queue.']), 1400)
        setTimeout(() => setLog(prev => [...prev, 'Message Broker retries delivery. Will keep trying until Payment recovers.']), 1900)
        setTimeout(() => setLog(prev => [...prev, 'No data lost. Order is recorded. Payment will process when service recovers.']), 2400)
      } else {
        setTimeout(() => setLog(prev => [...prev, 'Payment Service consumes message from queue. Processing...']), 1400)
        setTimeout(() => setLog(prev => [...prev, 'Payment processed: { transaction_id: "tx_123" }. ACK sent to broker.']), 1900)
        setTimeout(() => setLog(prev => [...prev, 'Order Service polls callback / Payment publishes completion event. Order marked paid.']), 2400)
      }
      setTimeout(() => setSending(false), 2500)
    }
  }

  return (
    <DemoBoundary name="Inter-Service Communication">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Inter-Service Communication</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Toggle between synchronous and asynchronous communication. Take down the Payment Service to see how each handles failures.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => { setMode('sync'); setLog([]) }} style={modeBtn(mode === 'sync', s.accent)}>Synchronous (REST/gRPC)</button>
          <button onClick={() => { setMode('async'); setLog([]) }} style={modeBtn(mode === 'async', s.purple)}>Asynchronous (Message Queue)</button>
          <button onClick={() => setPaymentDown(prev => !prev)} style={modeBtn(paymentDown, s.red)}>
            Payment Service: {paymentDown ? 'DOWN' : 'UP'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'stretch' }}>
          <div style={{ flex: 1, background: s.bg3, borderRadius: 10, padding: 16, border: `1px solid ${s.accent}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>O</div>
              <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>Order Service</span>
            </div>
            <div style={{ color: s.green, fontSize: 11, fontFamily: s.mono }}>HEALTHY</div>
            <div style={{ color: s.text3, fontSize: 11, marginTop: 6 }}>Creates orders. Needs payment confirmation.</div>
          </div>

          {mode === 'async' && (
            <div style={{ flex: 0.7, background: s.bg3, borderRadius: 10, padding: 16, border: `1px solid ${s.purple}30`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: s.purple, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Message Broker</div>
              <div style={{ color: s.text3, fontSize: 11 }}>RabbitMQ / Kafka</div>
              <div style={{ color: s.text3, fontSize: 10, marginTop: 4, fontFamily: s.mono }}>Queue: 0 msgs</div>
            </div>
          )}

          <div style={{ flex: 1, background: s.bg3, borderRadius: 10, padding: 16, border: `1px solid ${paymentDown ? s.red : s.green}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: paymentDown ? s.red : s.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>P</div>
              <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>Payment Service</span>
            </div>
            <div style={{ color: paymentDown ? s.red : s.green, fontSize: 11, fontFamily: s.mono }}>{paymentDown ? 'UNHEALTHY' : 'HEALTHY'}</div>
            <div style={{ color: s.text3, fontSize: 11, marginTop: 6 }}>{paymentDown ? 'Service is down. Requests will fail.' : 'Processes payments. Returns transaction ID.'}</div>
          </div>
        </div>

        {mode === 'sync' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 16, color: s.text3, fontSize: 11 }}>
            <span>Order Svc</span>
            <span style={{ color: s.accent }}>{'\u2500'.repeat(12)} REST POST {'\u2500'.repeat(12)}</span>
            <span>Payment Svc</span>
          </div>
        )}

        {mode === 'async' && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 16, color: s.text3, fontSize: 11 }}>
            <span>Order Svc</span>
            <span style={{ color: s.accent }}>{'\u2500'.repeat(6)} publish {'\u2500'.repeat(6)}</span>
            <span style={{ color: s.purple }}>Queue</span>
            <span style={{ color: s.green }}>{'\u2500'.repeat(6)} consume {'\u2500'.repeat(6)}</span>
            <span>Payment Svc</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <button onClick={sendRequest} disabled={sending} style={{
            background: sending ? s.bg3 : `${s.accent}18`, border: `1px solid ${sending ? s.border : s.accent}`,
            borderRadius: 8, padding: '10px 24px', color: sending ? s.text3 : s.accent,
            cursor: sending ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: sending ? 0.6 : 1,
          }}>
            {sending ? 'Processing...' : 'Send Order Request'}
          </button>
        </div>

        {log.length > 0 && (
          <div style={{ background: s.bg, borderRadius: 8, padding: 12, maxHeight: 200, overflowY: 'auto', border: `1px solid ${s.border}` }}>
            <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Request Log</div>
            {log.map((entry, idx) => (
              <div key={idx} style={{
                color: entry.includes('FAILS') || entry.includes('refused') || entry.includes('500') || entry.includes('DOWN')
                  ? s.red
                  : entry.includes('OK') || entry.includes('successfully') || entry.includes('FREE') || entry.includes('No data lost')
                  ? s.green
                  : s.text2,
                fontSize: 12, fontFamily: s.mono, lineHeight: 1.8, padding: '2px 0',
              }}>
                {'> '}{entry}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <div style={{ background: s.bg3, borderRadius: 8, padding: 12 }}>
            <div style={{ color: s.accent, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{mode === 'sync' ? 'REST / gRPC' : 'Message Queue'}</div>
            <div style={{ color: s.text3, fontSize: 11, lineHeight: 1.6 }}>
              {mode === 'sync'
                ? 'Direct call. Caller waits for response. Simple mental model. Tight coupling — if the callee is down, the caller fails.'
                : 'Producer publishes a message. Consumer processes it later. Loose coupling — services don\'t need to be available at the same time.'}
            </div>
          </div>
          <div style={{ background: s.bg3, borderRadius: 8, padding: 12 }}>
            <div style={{ color: s.orange, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Failure Handling</div>
            <div style={{ color: s.text3, fontSize: 11, lineHeight: 1.6 }}>
              {mode === 'sync'
                ? paymentDown
                  ? 'Order fails immediately. No retry (unless you add retry logic). User sees an error.'
                  : 'Works fine when all services are healthy. But one slow service blocks the entire chain.'
                : paymentDown
                  ? 'Message is safely stored in the queue. It will be delivered when Payment recovers. No data loss.'
                  : 'Extra latency from queue overhead. But Order Service is free immediately after publishing.'}
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )

  function modeBtn(active: boolean, color: string): React.CSSProperties {
    return { background: active ? `${color}18` : s.bg3, border: `1px solid ${active ? color : s.border}`, borderRadius: 8, padding: '8px 14px', color: active ? color : s.text3, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }
  }
}
