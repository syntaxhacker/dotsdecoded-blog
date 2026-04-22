import { useState, useCallback } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type Mode = 'real' | 'stub' | 'mock'

interface LogEntry {
  text: string
  color: string
}

const modes: Array<{ id: Mode; label: string; color: string; description: string }> = [
  { id: 'real', label: 'Real Object', color: s.orange, description: 'Makes a real HTTP request to the payment gateway. Slow, depends on network, costs money per call.' },
  { id: 'stub', label: 'Stub', color: s.green, description: 'Returns a canned response instantly. No network call. Predictable. Does not verify the call was made.' },
  { id: 'mock', label: 'Mock', color: s.accent, description: 'Returns a canned response AND verifies the method was called with the correct arguments.' },
]

export default function MockStubDemo() {
  const [mode, setMode] = useState<Mode>('real')
  const [logs, setLogs] = useState<Array<LogEntry>>([])
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const currentMode = modes.find((m) => m.id === mode)

  const runTest = useCallback(() => {
    setLogs([])
    setResult(null)
    setRunning(true)

    const timeline: Array<{ delay: number; log: LogEntry }> = []

    timeline.push({ delay: 100, log: { text: '# test/models/payment_test.rb', color: s.text3 } })
    timeline.push({ delay: 200, log: { text: '', color: s.text3 } })

    if (mode === 'real') {
      timeline.push({ delay: 400, log: { text: 'PaymentProcessor.charge(50_00, "tok_1234")', color: s.text2 } })
      timeline.push({ delay: 600, log: { text: '  Connecting to api.stripe.com:443...', color: s.yellow } })
      timeline.push({ delay: 1200, log: { text: '  TLS handshake complete (150ms)', color: s.text3 } })
      timeline.push({ delay: 1600, log: { text: '  POST /v1/charges (request body: 2.3KB)', color: s.text3 } })
      timeline.push({ delay: 2400, log: { text: '  Waiting for response...', color: s.yellow } })
      timeline.push({ delay: 3200, log: { text: '  Response: 200 OK (latency: 1600ms)', color: s.green } })
      timeline.push({ delay: 3600, log: { text: '  Decoded JSON response', color: s.text3 } })
      timeline.push({ delay: 3800, log: { text: '', color: s.text3 } })
      timeline.push({ delay: 4000, log: { text: '  Charge successful: $50.00', color: s.green } })
    } else if (mode === 'stub') {
      timeline.push({ delay: 400, log: { text: '# Stub: replace the gateway with a fake', color: s.text3 } })
      timeline.push({ delay: 500, log: { text: 'allow(PaymentGateway).to receive(:charge)', color: s.purple } })
      timeline.push({ delay: 600, log: { text: '  .and_return({ id: "ch_abc", status: "succeeded" })', color: s.purple } })
      timeline.push({ delay: 800, log: { text: '', color: s.text3 } })
      timeline.push({ delay: 900, log: { text: 'PaymentProcessor.charge(50_00, "tok_1234")', color: s.text2 } })
      timeline.push({ delay: 1000, log: { text: '  (using stubbed response)', color: s.text3 } })
      timeline.push({ delay: 1100, log: { text: '', color: s.text3 } })
      timeline.push({ delay: 1200, log: { text: '  Charge successful: $50.00', color: s.green } })
    } else {
      timeline.push({ delay: 400, log: { text: '# Mock: verify the call is made correctly', color: s.text3 } })
      timeline.push({ delay: 500, log: { text: 'expect(PaymentGateway).to receive(:charge)', color: s.accent } })
      timeline.push({ delay: 600, log: { text: '  .with(50_00, "tok_1234")', color: s.accent } })
      timeline.push({ delay: 700, log: { text: '  .and_return({ id: "ch_abc", status: "succeeded" })', color: s.accent } })
      timeline.push({ delay: 900, log: { text: '', color: s.text3 } })
      timeline.push({ delay: 1000, log: { text: 'PaymentProcessor.charge(50_00, "tok_1234")', color: s.text2 } })
      timeline.push({ delay: 1100, log: { text: '  Mock received: charge(5000, "tok_1234")', color: s.green } })
      timeline.push({ delay: 1200, log: { text: '  Arguments match expectation', color: s.green } })
      timeline.push({ delay: 1300, log: { text: '', color: s.text3 } })
      timeline.push({ delay: 1400, log: { text: '  Charge successful: $50.00', color: s.green } })
    }

    timeline.forEach(({ delay, log }) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, log])
      }, delay)
    })

    const finalDelay = timeline[timeline.length - 1].delay + 200
    setTimeout(() => {
      setRunning(false)
      setResult(mode === 'real' ? 'PASS (3.8s)' : mode === 'stub' ? 'PASS (0.2s)' : 'PASS (0.3s)')
    }, finalDelay)
  }, [mode])

  return (
    <DemoBoundary name="Mock vs Stub vs Real">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setLogs([]); setResult(null) }}
              style={{
                flex: 1,
                background: mode === m.id ? `${m.color}18` : s.bg2,
                border: `1px solid ${mode === m.id ? m.color : s.border}`,
                borderRadius: 8,
                padding: '12px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ color: mode === m.id ? m.color : s.text2, fontWeight: 600, fontSize: 13, fontFamily: s.mono, marginBottom: 4 }}>
                {m.label}
              </div>
              <div style={{ color: s.text3, fontSize: 11, lineHeight: 1.4 }}>
                {m.description}
              </div>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>
            {mode === 'real' ? 'Real HTTP call to external API' : mode === 'stub' ? 'Replaced with canned response' : 'Replaced + call is verified'}
          </span>
          <button
            onClick={runTest}
            disabled={running}
            style={{
              background: currentMode?.color || s.accent,
              border: 'none',
              borderRadius: 6,
              padding: '6px 16px',
              color: '#fff',
              fontFamily: s.mono,
              fontSize: 12,
              cursor: running ? 'wait' : 'pointer',
              opacity: running ? 0.6 : 1,
            }}
          >
            {running ? 'Running...' : 'Run Test'}
          </button>
        </div>

        <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ background: s.bg3, padding: '8px 14px', borderBottom: `1px solid ${s.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>Terminal Output</span>
            {result && (
              <span style={{ color: s.green, fontSize: 12, fontFamily: s.mono, fontWeight: 600 }}>{result}</span>
            )}
          </div>
          <div style={{ padding: 14, maxHeight: 260, overflowY: 'auto' }}>
            {logs.length === 0 && !running ? (
              <div style={{ color: s.text3, fontSize: 12, fontFamily: s.mono, fontStyle: 'italic' }}>
                Click "Run Test" to see the difference...
              </div>
            ) : (
              <div style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 12, lineHeight: 1.6 }}>
                {logs.map((entry, idx) => (
                  <div key={idx} style={{ color: entry.color }}>{entry.text}</div>
                ))}
                {running && (
                  <div style={{ color: s.yellow }}>{'>'}</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 4 }}>WHEN TO USE</div>
            <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
              {mode === 'real'
                ? 'Almost never in tests. Real calls belong in integration tests or manual QA, not in your automated test suite.'
                : mode === 'stub'
                  ? 'When you need a predictable return value and do not care whether the method was called. Great for isolating dependencies.'
                  : 'When you need to verify that a specific method was called with specific arguments. Tests interaction, not just outcome.'}
            </div>
          </div>
          <div style={{ flex: 1, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono, marginBottom: 4 }}>ANALOGY</div>
            <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
              {mode === 'real'
                ? 'Like calling the actual bank to process a payment. It works, but it is slow, costs money, and the bank might be down.'
                : mode === 'stub'
                  ? 'Like a cardboard cutout of a bank teller that always hands back the same receipt. Fast and reliable, but you never know if anyone actually visited.'
                  : 'Like a detective who watches the bank door and records who entered and what they asked for. Confirms the interaction happened correctly.'}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
