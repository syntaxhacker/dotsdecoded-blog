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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

const templates = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    template: `Hi {{username}},

Welcome to {{app_name}}! We are excited to have you on board.

Get started by {{action}}.

Best,
The {{app_name}} Team`,
    version: 'v2.1.0',
  },
  {
    id: 'password_reset',
    name: 'Password Reset',
    template: `Hi {{username}},

Someone requested a password reset for your {{app_name}} account.

Click here to reset: {{reset_link}}

This link expires in {{expiry_hours}} hours.

If you did not request this, please ignore this email.`,
    version: 'v1.4.0',
  },
  {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    template: `Hi {{username}},

Your order #{{order_id}} has been confirmed!

Items: {{item_count}}
Total: ${'{{total_amount}}'}
Estimated delivery: {{delivery_date}}

Track your order: {{tracking_link}}`,
    version: 'v3.0.1',
  },
  {
    id: 'comment_notification',
    name: 'Comment Notification',
    template: `Hi {{username}},

{{commenter_name}} commented on your {{post_title}}:

"{{comment_preview}}"

View the comment: {{post_link}}`,
    version: 'v2.0.0',
  },
]

const sampleData: Record<string, Record<string, string>> = {
  welcome: {
    username: 'Alice',
    app_name: 'DotsDecoded',
    action: 'completing your profile',
  },
  password_reset: {
    username: 'Bob',
    app_name: 'DotsDecoded',
    reset_link: 'https://dotsdecoded.com/reset/abc123',
    expiry_hours: '24',
  },
  order_confirmation: {
    username: 'Charlie',
    order_id: 'ORD-2026-4815',
    item_count: '3',
    total_amount: '89.97',
    delivery_date: 'May 20, 2026',
    tracking_link: 'https://dotsdecoded.com/track/ORD-2026-4815',
  },
  comment_notification: {
    username: 'Diana',
    commenter_name: 'Eve',
    post_title: 'Design a Notification System',
    comment_preview: 'Great article! I would add...',
    post_link: 'https://dotsdecoded.com/blog/design-notification-system#comment-42',
  },
}

function renderTemplate(tpl: string, data: Record<string, string>): string {
  let result = tpl
  for (const [key, val] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val)
  }
  return result
}

function findVariables(tpl: string): string[] {
  const matches = tpl.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
}

export default function TemplateEngineDemo() {
  const [selectedTpl, setSelectedTpl] = useState(templates[0].id)
  const [editMode, setEditMode] = useState(false)
  const [activeVersion, setActiveVersion] = useState(templates[0].version)

  const currentTemplate = templates.find(t => t.id === selectedTpl)!
  const variables = useMemo(() => findVariables(currentTemplate.template), [currentTemplate])
  const data = sampleData[selectedTpl]
  const rendered = useMemo(() => renderTemplate(currentTemplate.template, data), [currentTemplate, data])

  const handleTemplateChange = (id: string) => {
    setSelectedTpl(id)
    const tpl = templates.find(t => t.id === id)!
    setActiveVersion(tpl.version)
  }

  return (
    <DemoBoundary name="Template Engine">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Template Engine</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Select a template to see how variables get substituted. Templates use the Liquid/Jinja-style {'{{variable}}'} syntax.
        </p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {templates.map(tpl => (
            <button key={tpl.id} onClick={() => handleTemplateChange(tpl.id)} style={{
              background: selectedTpl === tpl.id ? `${s.accent}20` : s.bg,
              border: `1px solid ${selectedTpl === tpl.id ? s.accent : s.border}`,
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
              color: selectedTpl === tpl.id ? s.accent : s.text2, fontSize: 12, fontWeight: 600,
              transition: 'all 0.2s',
            }}>{tpl.name}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Template ({currentTemplate.version})</div>
              <button onClick={() => setEditMode(!editMode)} style={{
                background: 'transparent', border: `1px solid ${s.border}`, borderRadius: 4,
                padding: '2px 8px', color: s.text3, fontSize: 10, cursor: 'pointer',
              }}>{editMode ? 'Preview' : 'Edit'}</button>
            </div>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12,
              fontFamily: s.mono, fontSize: 11, color: s.text2, lineHeight: 1.6,
              whiteSpace: 'pre-wrap', minHeight: 180, overflow: 'auto',
            }}>
              {editMode ? currentTemplate.template : rendered.split('\n').map((line, i) => {
                const parts = line.split(/(\{\{(\w+)\}\})/g)
                return (
                  <div key={i}>
                    {parts.map((part, j) => {
                      const match = part.match(/\{\{(\w+)\}\}/)
                      if (match) {
                        const val = data[match[1]]
                        return (
                          <span key={j} style={{
                            background: val ? `${s.green}20` : `${s.red}20`,
                            color: val ? s.green : s.red,
                            borderRadius: 3, padding: '0 3px',
                          }}>{val || `{{${match[1]}}}`}</span>
                        )
                      }
                      return <span key={j} style={{ color: s.text2 }}>{part}</span>
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ width: 1, background: s.border, alignSelf: 'stretch' }} />

          <div style={{ flex: 1, minWidth: 250 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Variables</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {variables.map(v => (
                <div key={v} style={{
                  background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
                  padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontFamily: s.mono, fontSize: 11, color: s.accent }}>{'\u007b\u007b'}{v}{'\u007d\u007d'}</span>
                  <span style={{
                    fontFamily: s.mono, fontSize: 11, color: s.green,
                    background: `${s.green}15`, padding: '1px 6px', borderRadius: 4,
                  }}>{data[v]}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 10 }}>
              <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Version</div>
              <div style={{ color: s.text, fontSize: 13, fontFamily: s.mono }}>{currentTemplate.version}</div>
              <div style={{ color: s.text3, fontSize: 10, marginTop: 4 }}>Published: 2026-05-01</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, borderTop: `1px solid ${s.border}`, paddingTop: 12 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Template System Features</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: 'Variable Substitution', desc: '{{key}} replaced with user-provided values', color: s.green },
              { label: 'Versioning', desc: 'Each template version is immutable. New versions are created, not mutated.', color: s.accent },
              { label: 'Preview', desc: 'Render with sample data before sending to verify correctness', color: s.orange },
              { label: 'Conditionals', desc: 'Advanced: {% if %} blocks for optional content sections', color: s.purple },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ color: s.text, fontSize: 12, fontWeight: 600, minWidth: 100 }}>{item.label}</span>
                <span style={{ color: s.text2, fontSize: 11 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
