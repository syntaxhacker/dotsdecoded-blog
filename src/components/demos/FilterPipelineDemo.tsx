import { useState } from 'react'
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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const M: React.CSSProperties = { fontFamily: s.mono }

interface Filter {
  id: string
  name: string
  type: 'before' | 'after' | 'around'
  only: string[]
  code: string
  desc: string
}

const allFilters: Filter[] = [
  {
    id: 'auth',
    name: 'authenticate_user!',
    type: 'before',
    only: [],
    code: 'before_action :authenticate_user!',
    desc: 'Checks session for a logged-in user. Redirects to login page if not found.',
  },
  {
    id: 'set_post',
    name: 'set_post',
    type: 'before',
    only: ['show', 'edit', 'update', 'destroy'],
    code: 'before_action :set_post, only: [:show, :edit, :update, :destroy]',
    desc: 'Loads @post from the database using params[:id]. Only runs on actions that need it.',
  },
  {
    id: 'set_locale',
    name: 'set_locale',
    type: 'before',
    only: [],
    code: 'before_action :set_locale\ndef set_locale\n  I18n.locale = params[:locale] || I18n.default_locale\nend',
    desc: 'Sets the locale for internationalization based on a URL parameter or default.',
  },
  {
    id: 'verify_admin',
    name: 'verify_admin',
    type: 'before',
    only: ['destroy'],
    code: 'before_action :verify_admin, only: [:destroy]',
    desc: 'Ensures only admin users can delete posts. Returns 403 if unauthorized.',
  },
  {
    id: 'log',
    name: 'log_request',
    type: 'after',
    only: [],
    code: 'after_action :log_request\ndef log_request\n  RequestLogger.log(request.path, response.status)\nend',
    desc: 'Logs every request path and response status for analytics and debugging.',
  },
]

const actions = ['index', 'show', 'new', 'create', 'edit', 'update', 'destroy']

export default function FilterPipelineDemo() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    auth: true,
    set_post: true,
    set_locale: true,
    verify_admin: true,
    log: true,
  })
  const [selectedAction, setSelectedAction] = useState('show')

  const toggleFilter = (id: string) => {
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const getExecutionOrder = () => {
    const beforeFilters = allFilters.filter(f => f.type === 'before' && enabled[f.id])
    const afterFilters = allFilters.filter(f => f.type === 'after' && enabled[f.id])
    const beforeResults = beforeFilters.filter(f => {
      if (f.only.length === 0) return true
      return f.only.includes(selectedAction)
    })
    const afterResults = afterFilters.filter(f => {
      if (f.only.length === 0) return true
      return f.only.includes(selectedAction)
    })
    return { beforeResults, afterResults }
  }

  const { beforeResults, afterResults } = getExecutionOrder()

  return (
    <DemoBoundary name="Filter Pipeline">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Filter Pipeline</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Toggle filters on and off, then select an action to see which filters execute and in what order.
        </p>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Filters</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {allFilters.map(f => (
              <button
                key={f.id}
                onClick={() => toggleFilter(f.id)}
                style={{
                  background: enabled[f.id] ? s.bg3 : s.bg,
                  border: `1px solid ${enabled[f.id] ? s.border2 : s.border}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 4,
                  border: `2px solid ${enabled[f.id] ? s.accent : s.border}`,
                  background: enabled[f.id] ? s.accent : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.2s',
                }}>
                  {enabled[f.id] && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{String.fromCharCode(10003)}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{
                      ...M, fontSize: 12, fontWeight: 600,
                      color: enabled[f.id] ? (f.type === 'before' ? s.orange : s.yellow) : s.text3,
                    }}>
                      {f.type}_action
                    </span>
                    <span style={{ ...M, fontSize: 12, color: enabled[f.id] ? s.text : s.text3 }}>:{f.name}</span>
                    {f.only.length > 0 && (
                      <span style={{ ...M, fontSize: 10, color: s.text3, background: s.bg, padding: '2px 6px', borderRadius: 4 }}>
                        only: [{f.only.map(a => `:${a}`).join(', ')}]
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: s.text3, lineHeight: 1.4 }}>{f.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Select Action</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {actions.map(action => (
              <button
                key={action}
                onClick={() => setSelectedAction(action)}
                style={{
                  background: selectedAction === action ? s.accent : s.bg3,
                  border: `1px solid ${selectedAction === action ? s.accent : s.border}`,
                  borderRadius: 6, padding: '6px 14px',
                  color: selectedAction === action ? '#fff' : s.text2,
                  ...M, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background: s.bg3, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Execution Order for <span style={{ color: s.accent }}>{selectedAction}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {beforeResults.length === 0 && afterResults.length === 0 && (
              <div style={{ fontSize: 13, color: s.text3, textAlign: 'center', padding: '20px 0' }}>No filters will execute for this action</div>
            )}
            {beforeResults.map((f, i) => (
              <div key={`b-${f.id}`} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 12px', background: i % 2 === 0 ? 'transparent' : s.bg2,
                borderRadius: 6,
              }}>
                <span style={{ ...M, fontSize: 10, color: s.text3, width: 24, textAlign: 'right', flexShrink: 0 }}>
                  {i + 1}.
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: s.orange, textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: 4, background: `${s.orange}22`, flexShrink: 0,
                }}>
                  before
                </span>
                <span style={{ ...M, fontSize: 12, color: s.text }}>:{f.name}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px',
              borderRadius: 6, background: `${s.green}15`, border: `1px solid ${s.green}33`,
              margin: '4px 0',
            }}>
              <span style={{ ...M, fontSize: 10, color: s.green, width: 24, textAlign: 'right', flexShrink: 0 }}>
                {beforeResults.length + 1}.
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: s.green, textTransform: 'uppercase',
                padding: '2px 8px', borderRadius: 4, background: `${s.green}22`, flexShrink: 0,
              }}>
                action
              </span>
              <span style={{ ...M, fontSize: 12, color: s.green, fontWeight: 600 }}>#{selectedAction}</span>
            </div>
            {afterResults.map((f, i) => (
              <div key={`a-${f.id}`} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 12px', background: (beforeResults.length + i) % 2 === 0 ? 'transparent' : s.bg2,
                borderRadius: 6,
              }}>
                <span style={{ ...M, fontSize: 10, color: s.text3, width: 24, textAlign: 'right', flexShrink: 0 }}>
                  {beforeResults.length + 2 + i}.
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: s.yellow, textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: 4, background: `${s.yellow}22`, flexShrink: 0,
                }}>
                  after
                </span>
                <span style={{ ...M, fontSize: 12, color: s.text }}>:{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
