import { useState } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const rawData = [
  { field: 'name', raw: '"Alice Chen"', decorated: '"Alice Chen"' },
  { field: 'email', raw: '"alice@example.com"', decorated: '"ali***@example.com"' },
  { field: 'role', raw: '"admin"', decorated: '<span style="color:#e85d5d;font-weight:600">[ ADMIN ]</span>' },
  { field: 'created_at', raw: '2026-04-05 13:42:07 UTC', decorated: '"2 hours ago"' },
  { field: 'avatar_url', raw: '"/avatars/abc123.jpg"', decorated: '<img /> (Gravatar fallback)' },
  { field: 'is_active', raw: 'true', decorated: '"Active" (green badge)' },
  { field: 'posts_count', raw: '142', decorated: '"142 posts" (pluralized)' },
  { field: 'revenue', raw: '4850.75', decorated: '"$4,850.75" (formatted)' },
]

const rawCode = `<%= user.name %>
<%= user.email %>
<%= user.role %>
<%= user.created_at %>
<%= user.avatar_url %>
<%= user.is_active %>
<%= user.posts_count %>
<%= user.revenue %>`

const decoratorCode = `class UserDecorator < Draper::Decorator
  delegate_all

  def display_name
    object.name
  end

  def masked_email
    email.gsub(/(.{3}).+@/, '\\\\1***@')
  end

  def role_badge
    case object.role
    when 'admin' then '[ ADMIN ]'
    when 'mod'   then '[ MOD ]'
    else              object.role
    end
  end

  def created_ago
    h.time_ago_in_words(object.created_at) + ' ago'
  end

  def avatar_image
    h.image_tag(
      object.avatar_url || gravatar_url
    )
  end

  def status_badge
    object.is_active ? 'Active' : 'Inactive'
  end

  def posts_summary
    "\#{object.posts_count} posts"
  end

  def formatted_revenue
    h.number_to_currency(object.revenue)
  end
end`

const decoratedViewCode = `<%= decorated_user.display_name %>
<%= decorated_user.masked_email %>
<%= decorated_user.role_badge %>
<%= decorated_user.created_ago %>
<%= decorated_user.avatar_image %>
<%= decorated_user.status_badge %>
<%= decorated_user.posts_summary %>
<%= decorated_user.formatted_revenue %>`

const codeHtmlMap: Record<string, string> = {
  raw: Prism.highlight(rawCode, Prism.languages.ruby, 'ruby'),
  decorator: Prism.highlight(decoratorCode, Prism.languages.ruby, 'ruby'),
  view: Prism.highlight(decoratedViewCode, Prism.languages.ruby, 'ruby'),
}

function FieldRow({ d, index, decorated }: { d: typeof rawData[0]; index: number; decorated: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 14px', borderRadius: 6,
      background: index % 2 === 0 ? s.bg2 : 'transparent',
      border: '1px solid transparent',
    }}>
      <span style={{
        width: 110, flexShrink: 0, fontSize: 12, fontFamily: s.mono,
        color: s.accent, fontWeight: 600,
      }}>
        {d.field}
      </span>
      {decorated ? (
        <span style={{ fontSize: 12, fontFamily: s.mono, color: s.green }} dangerouslySetInnerHTML={{ __html: d.decorated }} />
      ) : (
        <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text3 }}>{d.raw}</span>
      )}
    </div>
  )
}

export default function DecoratorPatternDemo() {
  const [decorated, setDecorated] = useState(false)
  const [showCode, setShowCode] = useState<'raw' | 'decorator' | 'view'>('raw')

  return (
    <DemoBoundary name="Decorator Pattern">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'raw' as const, label: 'Raw View' },
            { key: 'decorator' as const, label: 'Decorator Class' },
            { key: 'view' as const, label: 'Decorated View' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setShowCode(tab.key)} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              border: `1px solid ${showCode === tab.key ? s.accent : s.border}`,
              background: showCode === tab.key ? `${s.accent}18` : s.bg2,
              color: showCode === tab.key ? s.accent : s.text3,
              fontFamily: s.mono, transition: 'all 0.2s ease',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={() => setDecorated(!decorated)} style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
          border: `1px solid ${decorated ? s.green : s.border}`,
          background: decorated ? `${s.green}18` : s.bg2,
          color: decorated ? s.green : s.text2,
          fontFamily: s.mono, fontWeight: 600, transition: 'all 0.2s ease',
        }}>
          {decorated ? 'DECORATED ON' : 'DECORATED OFF'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{
            fontSize: 11, fontFamily: s.mono, color: s.text3,
            marginBottom: 8, fontWeight: 600,
          }}>
            {decorated ? 'Decorated Output' : 'Raw Model Data'}
          </div>
          <div style={{
            background: s.bg2, border: `1px solid ${s.border}`,
            borderRadius: 10, overflow: 'hidden',
          }}>
            {rawData.map((d, i) => (
              <FieldRow key={d.field} d={d} index={i} decorated={decorated} />
            ))}
          </div>
        </div>

        <div style={{ flex: 1.2, minWidth: 280 }}>
          <div style={{
            fontSize: 11, fontFamily: s.mono, color: s.text3,
            marginBottom: 8, fontWeight: 600,
          }}>
            {showCode === 'raw' && 'app/views/users/_profile.html.erb'}
            {showCode === 'decorator' && 'app/decorators/user_decorator.rb'}
            {showCode === 'view' && 'app/views/users/_profile.html.erb'}
          </div>
          <div className="dpc" style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 10, padding: '14px 16px',
            fontFamily: s.mono, fontSize: 11.5, lineHeight: 1.65,
            whiteSpace: 'pre', overflow: 'auto',
          }}>
            <style>{`
.dpc code .token.keyword { color: #f92672; }
.dpc code .token.string, .dpc code .token.char, .dpc code .token.builtin, .dpc code .token.inserted { color: #e6db74; }
.dpc code .token.number, .dpc code .token.constant, .dpc code .token.symbol, .dpc code .token.property, .dpc code .token.tag, .dpc code .token.boolean, .dpc code .token.deleted { color: #ae81ff; }
.dpc code .token.selector, .dpc code .token.attr-name { color: #f92672; }
.dpc code .token.attr-value, .dpc code .token.atrule { color: #e6db74; }
.dpc code .token.function, .dpc code .token.class-name { color: #a6e22e; }
.dpc code .token.operator, .dpc code .token.entity, .dpc code .token.url, .dpc code .token.punctuation { color: #f8f8f2; }
.dpc code .token.comment, .dpc code .token.prolog, .dpc code .token.doctype, .dpc code .token.cdata { color: #75715e; font-style: italic; }
.dpc code .token.parameter, .dpc code .token.variable, .dpc code .token.regex, .dpc code .token.important { color: #fd971f; }
`}</style>
            <code dangerouslySetInnerHTML={{ __html: codeHtmlMap[showCode] }} />
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
