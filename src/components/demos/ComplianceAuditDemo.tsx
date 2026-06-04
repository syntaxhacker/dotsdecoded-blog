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

interface LogRow {
  ts: string
  actor: string
  action: string
  target: string
  ip: string
  result: string
  type: 'export' | 'delete' | 'share'
}

const BASE_LOGS: LogRow[] = [
  { ts: '2026-05-21 09:14', actor: 'user_042', action: 'EXPORT', target: 'calendar:personal', ip: '203.0.113.45', result: 'OK', type: 'export' },
  { ts: '2026-05-21 10:02', actor: 'admin@co', action: 'DELETE', target: 'event:evt_9x3k', ip: '198.51.100.7', result: 'OK', type: 'delete' },
  { ts: '2026-05-21 11:33', actor: 'user_007', action: 'SHARE', target: 'calendar:team-q4', ip: '192.0.2.33', result: 'OK', type: 'share' },
  { ts: '2026-05-21 14:55', actor: 'user_119', action: 'EXPORT', target: 'all events', ip: '203.0.113.12', result: 'OK', type: 'export' },
  { ts: '2026-05-22 08:41', actor: 'gdpr-bot', action: 'RIGHT_TO_FORGET', target: 'user_042', ip: '10.0.0.5', result: 'OK', type: 'delete' },
  { ts: '2026-05-22 09:10', actor: 'user_042', action: 'SHARE', target: 'event:evt_8p2m', ip: '203.0.113.45', result: 'DENIED', type: 'share' },
]

export default function ComplianceAuditDemo() {
  const [logs, setLogs] = useState(BASE_LOGS)
  const [filter, setFilter] = useState<'all' | 'export' | 'delete' | 'share'>('all')
  const [selected, setSelected] = useState<number[]>([])
  const [exportBlob, setExportBlob] = useState('')
  const [wipeLog, setWipeLog] = useState<string[]>([])
  const [checklist, setChecklist] = useState({ audit: true, encrypt: true, cross: false })

  const filtered = filter === 'all' ? logs : logs.filter(l => l.type === filter)

  const toggle = (i: number) => {
    setSelected(sel => sel.includes(i) ? sel.filter(x => x !== i) : [...sel, i])
  }

  const doExport = () => {
    const rows = selected.map(i => logs[i])
    const redacted = rows.map(r => ({
      ts: r.ts,
      actor: r.actor,
      action: r.action,
      target: r.target,
      ip: '[REDACTED]',
      result: r.result,
    }))
    setExportBlob(JSON.stringify({ exported_for: 'gdpr-request-2026-05-23', rows: redacted, redacted_fields: ['ip'] }, null, 2))
  }

  const simulateWipe = () => {
    const steps = [
      'Soft-delete 47 events for user_042',
      'Revoke 12 ACL entries (calendar shares)',
      'Tombstone 47 rows in search index',
      'Cancel 3 pending notification fanouts',
      'Set retention_hold=true (legal hold)',
      'Write immutable audit: RIGHT_TO_FORGET user_042',
    ]
    setWipeLog([])
    steps.forEach((txt, i) => setTimeout(() => setWipeLog(w => [...w, txt]), i * 240))
    setTimeout(() => {
      setLogs(l => l.filter(r => r.actor !== 'user_042'))
      setChecklist(c => ({ ...c, cross: true }))
    }, 1600)
  }

  const reset = () => {
    setLogs(BASE_LOGS); setSelected([]); setExportBlob(''); setWipeLog([]); setFilter('all')
    setChecklist({ audit: true, encrypt: true, cross: false })
  }

  return (
    <DemoBoundary name="Compliance and Audit">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {(['all', 'export', 'delete', 'share'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? s.accent : s.bg3, color: s.text, border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>{f}</button>
          ))}
          <button onClick={doExport} disabled={selected.length === 0} style={{ background: s.green, color: '#000', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer', marginLeft: 8 }}>Export Selected for GDPR</button>
          <button onClick={simulateWipe} style={{ background: s.red, color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Simulate Full User Wipe</button>
          <button onClick={reset} style={{ background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Reset</button>
        </div>

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: s.bg3, color: s.text3 }}>
              <th style={{ padding: 6, textAlign: 'left' }}></th>
              <th style={{ padding: 6, textAlign: 'left' }}>Timestamp</th>
              <th style={{ padding: 6, textAlign: 'left' }}>Actor</th>
              <th style={{ padding: 6, textAlign: 'left' }}>Action</th>
              <th style={{ padding: 6, textAlign: 'left' }}>Target</th>
              <th style={{ padding: 6, textAlign: 'left' }}>IP</th>
              <th style={{ padding: 6, textAlign: 'left' }}>Result</th>
            </tr></thead>
            <tbody>
              {filtered.map((r, idx) => {
                const realIdx = logs.indexOf(r)
                const sel = selected.includes(realIdx)
                return (
                  <tr key={idx} onClick={() => toggle(realIdx)} style={{ background: sel ? 'rgba(91,141,239,0.1)' : 'transparent', cursor: 'pointer', borderTop: `1px solid ${s.border}` }}>
                    <td style={{ padding: 6 }}><input type="checkbox" checked={sel} readOnly /></td>
                    <td style={{ padding: 6, fontFamily: s.mono }}>{r.ts}</td>
                    <td style={{ padding: 6, fontFamily: s.mono }}>{r.actor}</td>
                    <td style={{ padding: 6 }}><span style={{ color: r.type === 'delete' ? s.red : s.accent }}>{r.action}</span></td>
                    <td style={{ padding: 6, fontFamily: s.mono }}>{r.target}</td>
                    <td style={{ padding: 6, fontFamily: s.mono, color: s.text3 }}>{r.ip}</td>
                    <td style={{ padding: 6, color: r.result === 'OK' ? s.green : s.red }}>{r.result}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {exportBlob && <pre style={{ background: s.bg, border: `1px solid ${s.green}`, borderRadius: 6, padding: 10, fontSize: 10, fontFamily: s.mono, color: s.text2, overflowX: 'auto' }}>{exportBlob}</pre>}

        {wipeLog.length > 0 && (
          <div style={{ background: s.bg, border: `1px solid ${s.red}`, borderRadius: 6, padding: 8, marginTop: 8, fontSize: 11, fontFamily: s.mono, color: s.text2 }}>
            {wipeLog.map((l, i) => <div key={i}>→ {l}</div>)}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {Object.entries(checklist).map(([k, v]) => (
            <div key={k} style={{ flex: 1, background: v ? 'rgba(61,214,140,0.1)' : s.bg, border: `1px solid ${v ? s.green : s.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 10, textAlign: 'center', color: v ? s.green : s.text3 }}>
              {k === 'audit' ? 'Audit immutable' : k === 'encrypt' ? 'Encryption at rest' : 'Cross-region copy deleted'} {v ? '✓' : ''}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 10, fontSize: 10, color: s.text3 }}>Every mutating action is append-only logged with actor, target, IP, and result. GDPR export redacts PII (IP). Full wipe does soft-delete + tombstone + retention hold so the audit trail itself survives the "forget".</div>
      </div>
    </DemoBoundary>
  )
}
