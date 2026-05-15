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

interface Requirement {
  id: string
  label: string
  detail: string
  category: 'design' | 'infra' | 'analysis'
}

const requirements: Requirement[] = [
  { id: 'create', label: 'Create Experiment', detail: 'Name, description, hypothesis, start/end date, targeting rules', category: 'design' },
  { id: 'variants', label: 'Assign Users to Variants', detail: 'Deterministic hashing, sticky assignments, equal or custom traffic splits', category: 'design' },
  { id: 'metrics', label: 'Collect Metrics', detail: 'Client-side and server-side event tracking, custom goal definitions', category: 'infra' },
  { id: 'analyze', label: 'Analyze Results', detail: 'Statistical significance, confidence intervals, p-value calculation, power analysis', category: 'analysis' },
  { id: 'fflags', label: 'Feature Flags', detail: 'Gradual rollout, kill switch, targeted release by user attribute or region', category: 'infra' },
  { id: 'collision', label: 'Handle Experiment Collisions', detail: 'Mutually exclusive groups, overlapping experiment support, interaction detection', category: 'design' },
  { id: 'peeking', label: 'Prevent Peeking', detail: 'Sequential testing, always-valid p-values, fixed horizon vs continuous monitoring', category: 'analysis' },
  { id: 'audit', label: 'Audit Trail', detail: 'Log all configuration changes, assignment logs, data retention policies', category: 'infra' },
]

const categoryColors: Record<string, string> = {
  design: s.accent,
  infra: s.green,
  analysis: s.purple,
}

export default function AbRequirementsDemo() {
  const [checked, setChecked] = useState<Set<string>>(new Set(['create', 'variants', 'metrics', 'analyze']))

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allChecked = requirements.every(r => checked.has(r.id))
  const pct = Math.round((checked.size / requirements.length) * 100)

  return (
    <DemoBoundary name="A/B Testing Requirements">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 12, letterSpacing: -0.3 }}>
          A/B Testing Platform Requirements
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ flex: 1, height: 6, background: s.bg2, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${s.accent}, ${s.green})`,
              borderRadius: 3,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 12 }}>{checked.size}/{requirements.length}</span>
        </div>
        <div style={{ color: s.text3, fontSize: 12 }}>
          {allChecked ? 'All requirements covered' : `Coverage: ${pct}%`}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {requirements.map(req => {
          const isChecked = checked.has(req.id)
          const catColor = categoryColors[req.category]
          return (
            <button
              key={req.id}
              onClick={() => toggle(req.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 16px',
                background: isChecked ? s.bg2 : 'transparent',
                border: `1px solid ${isChecked ? catColor + '66' : s.border}`,
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                border: `2px solid ${isChecked ? catColor : s.border2}`,
                background: isChecked ? catColor : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
                transition: 'all 0.2s',
              }}>
                {isChecked && (
                  <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  color: isChecked ? s.text : s.text2,
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 2,
                  transition: 'color 0.2s',
                }}>
                  {req.label}
                </div>
                <div style={{ color: isChecked ? s.text2 : s.text3, fontSize: 12, lineHeight: 1.4 }}>
                  {req.detail}
                </div>
              </div>
              <div style={{
                padding: '2px 8px',
                borderRadius: 4,
                background: catColor + '22',
                color: catColor,
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                flexShrink: 0,
              }}>
                {req.category}
              </div>
            </button>
          )
        })}
      </div>

      <div style={{
        marginTop: 20,
        padding: 14,
        background: s.bg2,
        borderRadius: 10,
        border: `1px solid ${s.border}`,
      }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          Coverage Breakdown
        </div>
        {(['design', 'infra', 'analysis'] as const).map(cat => {
          const total = requirements.filter(r => r.category === cat).length
          const done = requirements.filter(r => r.category === cat && checked.has(r.id)).length
          const color = categoryColors[cat]
          return (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 60, color: color, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{cat}</div>
              <div style={{ flex: 1, height: 4, background: s.bg3, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  width: `${(done / total) * 100}%`,
                  height: '100%',
                  background: color,
                  borderRadius: 2,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>{done}/{total}</span>
            </div>
          )
        })}
      </div>
    </div>
    </DemoBoundary>
  )
}
