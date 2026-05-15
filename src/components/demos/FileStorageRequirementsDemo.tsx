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
  label: string
  desc: string
  type: 'functional' | 'non-functional'
}

const allReqs: Req[] = [
  { id: 'upload', label: 'Upload Files', desc: 'Upload files of any type up to 100GB', type: 'functional' },
  { id: 'download', label: 'Download Files', desc: 'Stream files to any device on demand', type: 'functional' },
  { id: 'sync', label: 'Cross-Device Sync', desc: 'Changes on one device appear on all others', type: 'functional' },
  { id: 'sharing', label: 'File Sharing', desc: 'Share files via links with permissions', type: 'functional' },
  { id: 'versions', label: 'Version History', desc: 'Access previous versions, 30-day retention', type: 'functional' },
  { id: 'conflict', label: 'Conflict Resolution', desc: 'Handle simultaneous edits without data loss', type: 'functional' },
  { id: 'offline', label: 'Offline Support', desc: 'Edit files offline, sync when connected', type: 'functional' },
  { id: 'encryption', label: 'Encryption', desc: 'AES-256 at rest, TLS in transit', type: 'non-functional' },
  { id: 'avail', label: 'High Availability', desc: '99.9% uptime SLA across regions', type: 'non-functional' },
  { id: 'scalability', label: 'Scalability', desc: '500M+ users, exabytes of storage', type: 'non-functional' },
]

export default function FileStorageRequirementsDemo() {
  const [selected, setSelected] = useState<Set<string>>(new Set(allReqs.map(r => r.id)))

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const functional = allReqs.filter(r => r.type === 'functional')
  const nonFunctional = allReqs.filter(r => r.type === 'non-functional')

  return (
    <DemoBoundary name="File Storage Requirements">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
        Requirements Checklist
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Click any requirement to toggle it in or out of scope. Build your own design spec.
      </p>

      <div style={{ marginBottom: 24 }}>
        <div style={{ color: s.text3, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Functional Requirements
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {functional.map(req => {
            const active = selected.has(req.id)
            return (
              <div
                key={req.id}
                onClick={() => toggle(req.id)}
                style={{
                  background: active ? `${s.accent}12` : s.bg2,
                  border: `1px solid ${active ? s.accent : s.border}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: active ? s.accent : 'transparent',
                  border: `2px solid ${active ? s.accent : s.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', marginTop: 1,
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke={active ? '#fff' : 'transparent'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ color: active ? s.text : s.text2, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                    {req.label}
                  </div>
                  <div style={{ color: active ? s.text3 : s.text3, fontSize: 11, lineHeight: 1.4 }}>
                    {req.desc}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div style={{ color: s.text3, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Non-Functional Requirements
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {nonFunctional.map(req => {
            const active = selected.has(req.id)
            return (
              <div
                key={req.id}
                onClick={() => toggle(req.id)}
                style={{
                  background: active ? `${s.accent}12` : s.bg2,
                  border: `1px solid ${active ? s.accent : s.border}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: active ? s.accent : 'transparent',
                  border: `2px solid ${active ? s.accent : s.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', marginTop: 1,
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke={active ? '#fff' : 'transparent'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ color: active ? s.text : s.text2, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                    {req.label}
                  </div>
                  <div style={{ color: active ? s.text3 : s.text3, fontSize: 11, lineHeight: 1.4 }}>
                    {req.desc}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{
        marginTop: 20, borderTop: `1px solid ${s.border}`, paddingTop: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ color: s.text3, fontSize: 12 }}>
          {selected.size} of {allReqs.length} requirements selected
        </div>
        <button
          onClick={() => {
            if (selected.size === allReqs.length) setSelected(new Set())
            else setSelected(new Set(allReqs.map(r => r.id)))
          }}
          style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6,
            padding: '6px 14px', color: s.text2, cursor: 'pointer', fontSize: 12,
          }}
        >
          {selected.size === allReqs.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
    </div>
    </DemoBoundary>
  )
}
