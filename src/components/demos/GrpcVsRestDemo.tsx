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

interface OpData {
  key: string
  label: string
  grpcMethod: string
  restMethod: string
  grpcPayload: string
  restPayload: string
  grpcBytes: number
  restBytes: number
  grpcLatency: string
  restLatency: string
}

const ops: OpData[] = [
  {
    key: 'get',
    label: 'GetUser',
    grpcMethod: 'Unary',
    restMethod: 'GET /users/:id',
    grpcPayload: '{"id": 42}',
    restPayload: '{"id": 42, "name": "Alice", "email": "alice@example.com"}',
    grpcBytes: 42,
    restBytes: 167,
    grpcLatency: '2 ms',
    restLatency: '4 ms',
  },
  {
    key: 'list',
    label: 'ListUsers',
    grpcMethod: 'Server Streaming',
    restMethod: 'GET /users?page=1&limit=50',
    grpcPayload: 'Stream<{id, name} per record>',
    restPayload: '{"data": [...], "page": 1, "total": 142}',
    grpcBytes: 16,
    restBytes: 2840,
    grpcLatency: '1 ms (first msg)',
    restLatency: '12 ms',
  },
  {
    key: 'create',
    label: 'CreateUser',
    grpcMethod: 'Unary',
    restMethod: 'POST /users (JSON body)',
    grpcPayload: '{"name": "Bob", "email": "bob@x.com"}',
    restPayload: '{"name": "Bob", "email": "bob@x.com"}',
    grpcBytes: 36,
    restBytes: 164,
    grpcLatency: '3 ms',
    restLatency: '5 ms',
  },
  {
    key: 'stream',
    label: 'StreamUpdates',
    grpcMethod: 'Bidirectional',
    restMethod: 'Polling GET /updates?since=...',
    grpcPayload: 'Stream<Update> bidirectional',
    restPayload: '{"updates": [...], "next_poll": "..."}',
    grpcBytes: 8,
    restBytes: 520,
    grpcLatency: '< 1 ms per msg',
    restLatency: '5s polling interval',
  },
]

const features = [
  { label: 'Schema enforcement', grpc: true, rest: false },
  { label: 'Code generation', grpc: true, rest: false },
  { label: 'Native streaming', grpc: true, rest: false },
  { label: 'Browser support', grpc: false, rest: true },
  { label: 'Human readable', grpc: false, rest: true },
  { label: 'Caching (HTTP cache)', grpc: false, rest: true },
  { label: 'Strong typing', grpc: true, rest: false },
  { label: 'Payload compression', grpc: true, rest: false },
]

const maxBarWidth = 140

function Bar({ value, maxValue, color, label }: { value: number; maxValue: number; color: string; label: string }) {
  const pct = Math.min((value / maxValue) * 100, 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 10, minWidth: 30, textAlign: 'right' }}>{label}</span>
      <div style={{
        flex: 1, height: 14, background: s.bg3, borderRadius: 7,
        overflow: 'hidden', maxWidth: maxBarWidth,
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}66, ${color})`,
          borderRadius: 7, transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ color: s.text, fontFamily: s.mono, fontSize: 11, minWidth: 40 }}>{value} B</span>
    </div>
  )
}

export default function GrpcVsRestDemo() {
  const [activeOp, setActiveOp] = useState(0)
  const op = ops[activeOp]
  const allBytes = Math.max(...ops.map(o => Math.max(o.grpcBytes, o.restBytes)))

  return (
    <DemoBoundary name="gRPC vs REST Comparison">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>gRPC vs REST</div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: s.bg, borderRadius: 8, padding: 3, border: `1px solid ${s.border}` }}>
          {ops.map((o, i) => (
            <button key={o.key} onClick={() => setActiveOp(i)} style={{
              flex: 1, padding: '8px 12px', borderRadius: 6, border: 'none',
              background: activeOp === i ? s.bg3 : 'transparent',
              color: activeOp === i ? s.text : s.text3,
              cursor: 'pointer', fontSize: 12, fontWeight: activeOp === i ? 600 : 400,
              transition: 'all 0.15s',
            }}>{o.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.accent}`, borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ color: s.accent, fontSize: 14, fontWeight: 700 }}>gRPC</span>
              <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>{op.grpcMethod}</span>
            </div>
            <div style={{ color: s.text2, fontFamily: s.mono, fontSize: 11, marginBottom: 12, whiteSpace: 'pre-line' }}>
              {op.grpcPayload}
            </div>
            <Bar value={op.grpcBytes} maxValue={allBytes} color={s.accent} label="Payload" />
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: s.text3, fontSize: 10 }}>Latency:</span>
              <span style={{ color: s.green, fontFamily: s.mono, fontSize: 11 }}>{op.grpcLatency}</span>
            </div>
          </div>

          <div style={{ flex: 1, background: s.bg, border: `1px solid ${s.orange}`, borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ color: s.orange, fontSize: 14, fontWeight: 700 }}>REST</span>
              <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>{op.restMethod}</span>
            </div>
            <div style={{ color: s.text2, fontFamily: s.mono, fontSize: 11, marginBottom: 12, whiteSpace: 'pre-line' }}>
              {op.restPayload}
            </div>
            <Bar value={op.restBytes} maxValue={allBytes} color={s.orange} label="Payload" />
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: s.text3, fontSize: 10 }}>Latency:</span>
              <span style={{ color: s.orange, fontFamily: s.mono, fontSize: 11 }}>{op.restLatency}</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16, marginBottom: 8 }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Feature Comparison</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px', gap: '4px 12px' }}>
            <div style={{ color: s.text3, fontSize: 10, fontWeight: 600, paddingBottom: 4, borderBottom: `1px solid ${s.border}` }}>Feature</div>
            <div style={{ color: s.accent, fontSize: 10, fontWeight: 600, textAlign: 'center', paddingBottom: 4, borderBottom: `1px solid ${s.border}` }}>gRPC</div>
            <div style={{ color: s.orange, fontSize: 10, fontWeight: 600, textAlign: 'center', paddingBottom: 4, borderBottom: `1px solid ${s.border}` }}>REST</div>
            {features.map(f => (
              <div key={f.label} style={{ display: 'contents' }}>
                <div style={{ color: s.text2, fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${s.border}30` }}>{f.label}</div>
                <div style={{ textAlign: 'center', padding: '5px 0', borderBottom: `1px solid ${s.border}30` }}>
                  <span style={{ color: f.grpc ? s.green : s.red, fontSize: 14, fontWeight: 700 }}>{f.grpc ? 'Y' : 'N'}</span>
                </div>
                <div style={{ textAlign: 'center', padding: '5px 0', borderBottom: `1px solid ${s.border}30` }}>
                  <span style={{ color: f.rest ? s.green : s.red, fontSize: 14, fontWeight: 700 }}>{f.rest ? 'Y' : 'N'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12, borderTop: `1px solid ${s.border}`, paddingTop: 12 }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>When to Choose</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, lineHeight: 1.5 }}>
            <div style={{ flex: 1, color: s.accent }}>
              <strong style={{ color: s.text }}>gRPC wins:</strong>
              <br />Microservices, real-time streaming, low-latency internal APIs, polyglot environments
            </div>
            <div style={{ flex: 1, color: s.orange }}>
              <strong style={{ color: s.text }}>REST wins:</strong>
              <br />Browser clients, public APIs, simple CRUD, caching-critical systems, debugging ease
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
