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

interface LogEntry {
  id: number
  user: string
  op: string
  details: string
  highlight: string
}

const LOG_ENTRIES: LogEntry[] = [
  { id: 1, user: 'Alice', op: 'insert', details: '"Hello" at pos 0', highlight: 'client' },
  { id: 2, user: 'Bob', op: 'insert', details: '" " at pos 5', highlight: 'ws' },
  { id: 3, user: 'Alice', op: 'insert', details: '"World" at pos 6', highlight: 'doc' },
  { id: 4, user: 'Bob', op: 'delete', details: 'pos 3-5 (3 chars)', highlight: 'broadcast' },
  { id: 5, user: 'Alice', op: 'insert', details: '"!" at pos 5', highlight: 'persist' },
  { id: 6, user: 'System', op: 'snapshot', details: 'v1 at op 10', highlight: 'history' },
  { id: 7, user: 'Bob', op: 'insert', details: '"How are" at pos 0', highlight: 'client' },
  { id: 8, user: 'Alice', op: 'delete', details: 'pos 7-12 (5 chars)', highlight: 'ws' },
  { id: 9, user: 'System', op: 'snapshot', details: 'v2 at op 20', highlight: 'persist' },
  { id: 10, user: 'Bob', op: 'insert', details: '"?" at pos 10', highlight: 'broadcast' },
]

const LAYERS = [
  { id: 'client', label: 'Client', desc: 'Browser app with local state and operation queue', color: s.red },
  { id: 'ws', label: 'WebSocket', desc: 'Persistent bidirectional connection, message routing', color: s.orange },
  { id: 'doc', label: 'Document Service', desc: 'OT/CRDT engine, operation validation, apply', color: s.accent },
  { id: 'broadcast', label: 'Broadcast', desc: 'Fan-out transformed ops to all other clients', color: s.purple },
  { id: 'persist', label: 'Persistence', desc: 'Append-only operation log, periodic snapshots', color: s.green },
  { id: 'history', label: 'Version History', desc: 'Timeline reconstruction from snapshots + deltas', color: s.yellow },
]

const LAYER_FLOW: [string, string][] = [
  ['client', 'ws'],
  ['ws', 'doc'],
  ['doc', 'broadcast'],
  ['doc', 'persist'],
  ['persist', 'history'],
  ['broadcast', 'client'],
]

export default function CollabArchitectureDemo() {
  const [activeLog, setActiveLog] = useState<number | null>(null)
  const [activeLayer, setActiveLayer] = useState<string | null>(null)

  const getHighlight = (entry: LogEntry): string => entry.highlight

  return (
    <DemoBoundary name="Collaborative Editor Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>Architecture</div>
      <p style={{ color: s.text2, fontSize: 13, margin: '0 0 20px 0', lineHeight: 1.5 }}>
        Click a layer to highlight its role. Click a log entry to trace it through the system.
      </p>

      <div style={{
        background: s.bg2, borderRadius: 12, padding: '20px 16px', marginBottom: 20,
        border: `1px solid ${s.border}`,
      }}>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          {LAYERS.map((layer, i) => (
            <div key={layer.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)} style={{
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: activeLayer === layer.id ? `${layer.color}25` : s.bg,
                border: `1px solid ${activeLayer === layer.id ? layer.color : s.border}`,
                color: activeLayer === layer.id ? layer.color : s.text2,
                transition: 'all 0.15s',
              }}>
                {layer.label}
              </button>
              {i < LAYERS.length - 1 && (
                <div style={{ color: s.text3, fontSize: 14 }}>{'\u2192'}</div>
              )}
            </div>
          ))}
        </div>

        {activeLayer && (
          <div style={{
            marginTop: 12, padding: '10px 14px', background: s.bg3, borderRadius: 8,
            border: `1px solid ${s.border}`,
          }}>
            <div style={{ color: LAYERS.find(l => l.id === activeLayer)?.color || s.text, fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
              {LAYERS.find(l => l.id === activeLayer)?.label}
            </div>
            <div style={{ color: s.text2, fontSize: 12 }}>{LAYERS.find(l => l.id === activeLayer)?.desc}</div>
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
          {LAYER_FLOW.map(([from, to], i) => {
            const f = LAYERS.find(l => l.id === from)
            const t = LAYERS.find(l => l.id === to)
            const isActivePath = activeLayer === from || activeLayer === to
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                opacity: activeLayer && !isActivePath ? 0.3 : 1,
                transition: 'opacity 0.2s',
              }}>
                <div style={{
                  height: 2, width: 20,
                  background: isActivePath ? (activeLayer === from ? f?.color : t?.color) : s.border,
                  borderRadius: 1,
                }} />
                <div style={{ color: s.text3, fontSize: 9, whiteSpace: 'nowrap' }}>
                  {from}{'\u2192'}{to}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Operation Log (append-only)</div>
          <button onClick={() => setActiveLog(null)} style={{
            background: 'none', border: 'none', color: s.text3, cursor: 'pointer', fontSize: 11,
            textDecoration: 'underline', padding: 0,
          }}>Clear selection</button>
        </div>
        <div style={{
          background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`,
          maxHeight: 260, overflowY: 'auto',
          fontFamily: s.mono, fontSize: 11,
        }}>
          {LOG_ENTRIES.map(entry => {
            const isSelected = activeLog === entry.id
            const hl = getHighlight(entry)
            const layer = LAYERS.find(l => l.id === hl)
            const hlColor = layer?.color || s.text3
            return (
              <div key={entry.id} onClick={() => setActiveLog(isSelected ? null : entry.id)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', cursor: 'pointer',
                background: isSelected ? `${hlColor}15` : 'transparent',
                borderBottom: `1px solid ${s.border}`,
                transition: 'background 0.15s',
              }}>
                <span style={{ color: s.text3, minWidth: 24 }}>#{entry.id}</span>
                <span style={{
                  color: entry.user === 'System' ? s.purple : (entry.user === 'Alice' ? s.red : s.accent),
                  fontWeight: 600, minWidth: 44,
                }}>{entry.user}</span>
                <span style={{
                  color: entry.op === 'snapshot' ? s.yellow : (entry.op === 'insert' ? s.green : s.red),
                  minWidth: 46,
                }}>{entry.op}</span>
                <span style={{ color: s.text, flex: 1 }}>{entry.details}</span>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: hlColor,
                  flexShrink: 0,
                }} title={hl} />
              </div>
            )
          })}
        </div>
      </div>

      {activeLog && (
        <div style={{
          background: s.bg3, borderRadius: 8, padding: '12px 16px',
          border: `1px solid ${s.border}`,
        }}>
          {(() => {
            const entry = LOG_ENTRIES.find(e => e.id === activeLog)!
            const layer = LAYERS.find(l => l.id === getHighlight(entry))
            return (
              <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.6 }}>
                <span style={{ color: layer?.color, fontWeight: 600 }}>#{entry.id}</span>{' '}
                <span style={{ color: entry.user === 'Alice' ? s.red : entry.user === 'Bob' ? s.accent : s.purple }}>
                  {entry.user}
                </span>{' '}
                performed a <span style={{
                  color: entry.op === 'snapshot' ? s.yellow : (entry.op === 'insert' ? s.green : s.red),
                }}>{entry.op}</span> operation: {entry.details}.
                This operation flows through the <span style={{ color: layer?.color }}>{layer?.label}</span> layer.
                The log is append-only and immutable.
              </div>
            )
          })()}
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, background: s.bg2, borderRadius: 8, padding: '10px 14px', border: `1px solid ${s.border}` }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Data Flow</div>
          <div style={{ color: s.text2, fontSize: 12, fontFamily: s.mono, lineHeight: 1.6 }}>
            Client {'\u2192'} WS {'\u2192'} DocSvc {'\u2192'} Broadcast {'\u2192'} Clients {'\n'}
            DocSvc {'\u2192'} Persist {'\u2192'} History
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200, background: s.bg2, borderRadius: 8, padding: '10px 14px', border: `1px solid ${s.border}` }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Storage Strategy</div>
          <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
            Snapshots every N ops for fast recovery. Deltas between snapshots for version diffs. Append-only log for audit trail.
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
