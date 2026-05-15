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

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'SQL', 'Bash', 'Ruby', 'C++', 'Java', 'YAML', 'JSON', 'HTML', 'CSS']

const EXPIRATIONS = ['Burn After Read', '10 min', '1 hr', '24 hr', '1 week', '1 month', 'Never']

interface ReqItem {
  key: string
  label: string
  category: string
}

const ALL_REQS: ReqItem[] = [
  { key: 'create', label: 'Create a paste with content', category: 'core' },
  { key: 'view', label: 'View a paste by slug URL', category: 'core' },
  { key: 'raw', label: 'Raw text access via /raw/:slug', category: 'core' },
  { key: 'highlight', label: 'Syntax highlighting per language', category: 'core' },
  { key: 'expire', label: 'Expiration: TTL per paste', category: 'core' },
  { key: 'burn', label: 'Burn After Read option', category: 'expiration' },
  { key: 'visibility', label: 'Public / Private / Unlisted', category: 'privacy' },
  { key: 'customSlug', label: 'Custom slug / alias', category: 'url' },
  { key: 'randomSlug', label: 'Auto-generated random slug', category: 'url' },
  { key: 'title', label: 'Optional title for the paste', category: 'metadata' },
  { key: 'language', label: 'Language auto-detection + override', category: 'metadata' },
  { key: 'edit', label: 'Edit existing paste (within time window)', category: 'advanced' },
  { key: 'delete', label: 'Delete own paste', category: 'advanced' },
  { key: 'report', label: 'Report abuse on a paste', category: 'abuse' },
  { key: 'rateLimit', label: 'Rate limiting per IP / user', category: 'abuse' },
  { key: 'search', label: 'Search public pastes', category: 'advanced' },
  { key: 'embed', label: 'Embed paste as rich embed', category: 'advanced' },
  { key: 'api', label: 'API for programmatic creation', category: 'api' },
  { key: 'clipboard', label: 'One-click copy to clipboard', category: 'ux' },
  { key: 'lineNumbers', label: 'Line numbers in viewer', category: 'ux' },
]

const CATEGORIES = ['core', 'expiration', 'privacy', 'url', 'metadata', 'advanced', 'abuse', 'api', 'ux']

const CAT_LABELS: Record<string, string> = {
  core: 'Core',
  expiration: 'Expiration',
  privacy: 'Privacy',
  url: 'URL / Slug',
  metadata: 'Metadata',
  advanced: 'Advanced',
  abuse: 'Abuse Prevention',
  api: 'API',
  ux: 'UX',
}

const CAT_COLORS: Record<string, string> = {
  core: s.accent,
  expiration: s.orange,
  privacy: s.purple,
  url: s.green,
  metadata: s.yellow,
  advanced: s.text2,
  abuse: s.red,
  api: s.text,
  ux: s.green,
}

function CheckIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PasteRequirementsDemo() {
  const [checked, setChecked] = useState<Set<string>>(new Set(ALL_REQS.map(r => r.key)))

  const toggle = (key: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleAll = (on: boolean) => {
    if (on) setChecked(new Set(ALL_REQS.map(r => r.key)))
    else setChecked(new Set())
  }

  const pct = Math.round((checked.size / ALL_REQS.length) * 100)

  return (
    <DemoBoundary name="Pastebin Requirements">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Requirements Checklist</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          A pastebin service needs more than just storing text. Click any item to include or exclude it from your design scope.
        </p>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20, padding: '12px 16px', background: s.bg, borderRadius: 8, border: `1px solid ${s.border}` }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: s.text2, fontSize: 12 }}>Coverage</span>
              <span style={{ color: s.text, fontFamily: s.mono, fontSize: 12 }}>{checked.size}/{ALL_REQS.length} ({pct}%)</span>
            </div>
            <div style={{ width: '100%', height: 6, background: s.bg3, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${s.green}, ${s.accent})`, borderRadius: 3, transition: 'width 0.3s ease' }} />
            </div>
          </div>
          <button onClick={() => toggleAll(true)} style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 12px', color: s.text2, cursor: 'pointer', fontSize: 11 }}>All</button>
          <button onClick={() => toggleAll(false)} style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 12px', color: s.text2, cursor: 'pointer', fontSize: 11 }}>None</button>
        </div>

        {CATEGORIES.map(cat => {
          const items = ALL_REQS.filter(r => r.category === cat)
          const allChecked = items.every(i => checked.has(i.key))
          return (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: CAT_COLORS[cat], flexShrink: 0 }} />
                <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>{CAT_LABELS[cat]}</span>
                <span style={{ color: s.text3, fontSize: 11 }}>({items.filter(i => checked.has(i.key)).length}/{items.length})</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {items.map(item => {
                  const on = checked.has(item.key)
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggle(item.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 10px',
                        background: on ? `${CAT_COLORS[cat]}15` : s.bg,
                        border: `1px solid ${on ? CAT_COLORS[cat] : s.border}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        color: on ? s.text : s.text3,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: on ? CAT_COLORS[cat] : 'transparent', display: 'flex', alignItems: 'center' }}>
                        <CheckIcon />
                      </span>
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div style={SEC}>
        <div style={H}>Paste Configuration</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Each paste stores its content, metadata, and behavior settings.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ color: s.text3, fontSize: 11, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Syntax Highlighting</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {LANGUAGES.slice(0, 8).map(lang => (
                <span key={lang} style={{ background: s.bg3, borderRadius: 4, padding: '2px 8px', color: s.accent, fontSize: 11, fontFamily: s.mono }}>
                  {lang}
                </span>
              ))}
              <span style={{ background: s.bg3, borderRadius: 4, padding: '2px 8px', color: s.text3, fontSize: 11, fontFamily: s.mono }}>+{LANGUAGES.length - 8} more</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ color: s.text3, fontSize: 11, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Expiration Options</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {EXPIRATIONS.map(exp => (
                <span key={exp} style={{
                  background: exp === 'Burn After Read' ? `${s.red}15` : exp === 'Never' ? `${s.green}15` : s.bg3,
                  borderRadius: 4, padding: '2px 8px',
                  color: exp === 'Burn After Read' ? s.red : exp === 'Never' ? s.green : s.text2,
                  fontSize: 11, fontFamily: s.mono,
                }}>
                  {exp}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={{ color: s.text3, fontSize: 11, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Visibility</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { label: 'Public', desc: 'Visible in search and listings', color: s.green },
              { label: 'Unlisted', desc: 'Only accessible via direct URL', color: s.yellow },
              { label: 'Private', desc: 'Only accessible by creator', color: s.red },
            ].map(v => (
              <div key={v.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ color: v.color, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{v.label}</div>
                <div style={{ color: s.text3, fontSize: 11 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
