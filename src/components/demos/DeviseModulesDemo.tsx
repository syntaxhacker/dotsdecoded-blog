import { useState, useMemo } from 'react'
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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const M: React.CSSProperties = { fontFamily: s.mono }

interface ModuleInfo {
  name: string
  desc: string
  routes: string[]
  modelMethods: string[]
  views: string[]
  email: string
  color: string
}

const MODULES: Record<string, ModuleInfo> = {
  database_authenticatable: {
    name: 'Database Authenticatable',
    desc: 'Hashes and stores passwords in the database. Validates the user against the stored hash on every sign in.',
    routes: ['POST /users/sign_in', 'DELETE /users/sign_out'],
    modelMethods: ['valid_password?(password)', 'email=', 'encrypted_password='],
    views: ['sessions/new.html.erb'],
    email: '',
    color: s.accent,
  },
  registerable: {
    name: 'Registerable',
    desc: 'Allows users to sign up and edit/delete their own account. Provides the registration form and account management pages.',
    routes: ['POST /users', 'GET /users/edit', 'PATCH /users', 'DELETE /users'],
    modelMethods: [],
    views: ['registrations/new.html.erb', 'registrations/edit.html.erb'],
    email: '',
    color: s.green,
  },
  recoverable: {
    name: 'Recoverable',
    desc: 'Resets the user password and sends reset instructions by email. Generates a reset token stored in the database.',
    routes: ['POST /users/password', 'GET /users/password/new', 'GET /users/password/edit', 'PATCH /users/password'],
    modelMethods: ['send_reset_password_instructions', 'reset_password!', 'reset_password_token=', 'reset_password_sent_at='],
    views: ['passwords/new.html.erb', 'passwords/edit.html.erb'],
    email: 'reset_password_instructions',
    color: s.yellow,
  },
  rememberable: {
    name: 'Rememberable',
    desc: 'Manages generating and clearing the token for remembering the user from a saved cookie. Keeps users logged in across browser sessions.',
    routes: [],
    modelMethods: ['remember_me!', 'forget_me!', 'remember_token=', 'remember_created_at='],
    views: [],
    email: '',
    color: s.purple,
  },
  validatable: {
    name: 'Validatable',
    desc: 'Provides email and password validations. Requires the email to be present, unique, and the password to have a minimum length.',
    routes: [],
    modelMethods: [],
    views: [],
    email: '',
    color: s.orange,
  },
  confirmable: {
    name: 'Confirmable',
    desc: 'Requires users to confirm their email address after sign up. Accounts are locked until a confirmation link is clicked.',
    routes: ['GET /users/confirmation/new', 'POST /users/confirmation', 'GET /users/confirmation'],
    modelMethods: ['send_confirmation_instructions', 'confirm!', 'confirmed_at=', 'confirmation_token=', 'unconfirmed_email='],
    views: ['confirmations/new.html.erb'],
    email: 'confirmation_instructions',
    color: s.red,
  },
  lockable: {
    name: 'Lockable',
    desc: 'Locks an account after a specified number of failed sign-in attempts. Can unlock via email or after a time period.',
    routes: ['GET /users/unlock/new', 'POST /users/unlock', 'GET /users/unlock'],
    modelMethods: ['lock_access!', 'unlock_access!', 'access_locked?', 'failed_attempts=', 'unlock_token=', 'locked_at='],
    views: ['unlocks/new.html.erb'],
    email: 'unlock_instructions',
    color: '#e8a05a',
  },
  timeoutable: {
    name: 'Timeoutable',
    desc: 'Expires sessions that have been inactive for a specified amount of time. Requires the user to sign in again.',
    routes: [],
    modelMethods: ['timeout_in='],
    views: [],
    email: '',
    color: '#5ab8e8',
  },
  trackable: {
    name: 'Trackable',
    desc: 'Tracks sign-in count, timestamps, and IP address. Useful for security auditing and detecting suspicious activity.',
    routes: [],
    modelMethods: ['sign_in_count=', 'current_sign_in_at=', 'last_sign_in_at=', 'current_sign_in_ip=', 'last_sign_in_ip='],
    views: [],
    email: '',
    color: '#a0d95a',
  },
  omniauthable: {
    name: 'Omniauthable',
    desc: 'Adds OmniAuth support for third-party authentication (Google, GitHub, Facebook, etc.). Requires the omniauth gem.',
    routes: ['GET /users/auth/:provider', 'GET /users/auth/:provider/callback'],
    modelMethods: ['self.from_omniauth(auth)'],
    views: [],
    email: '',
    color: '#d95aa0',
  },
}

const DEFAULT_MODULES = ['database_authenticatable', 'registerable', 'recoverable', 'rememberable', 'validatable']

export default function DeviseModulesDemo() {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(DEFAULT_MODULES))
  const [selected, setSelected] = useState<string | null>(null)

  const toggle = (key: string) => {
    setEnabled(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setSelected(key)
  }

  const activeModule = selected && MODULES[selected] ? MODULES[selected] : null

  const generatedModel = () => {
    const lines = ['class User < ApplicationRecord', '  devise(']
    const arr = Array.from(enabled).map(k => MODULES[k]?.name.split(' ')[0].toLowerCase() || k)
    arr.forEach((m, i) => {
      const comma = i < arr.length - 1 ? ',' : ''
      lines.push(`    :${m}${comma}`)
    })
    lines.push('  )')
    lines.push('end')
    return lines.join('\n')
  }

  const modelHtml = useMemo(() => {
    return Prism.highlight(generatedModel(), Prism.languages.ruby, 'ruby')
  }, [enabled])

  const totalRoutes = Array.from(enabled).reduce((acc, key) => acc + MODULES[key].routes.length, 0)
  const totalViews = Array.from(enabled).reduce((acc, key) => acc + MODULES[key].views.length, 0)
  const totalEmails = Array.from(enabled).reduce((acc, key) => acc + (MODULES[key].email ? 1 : 0), 0)

  return (
    <DemoBoundary name="Devise Modules Explorer">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Devise Module Explorer</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.entries(MODULES).map(([key, mod]) => {
            const isOn = enabled.has(key)
            const isSel = selected === key
            return (
              <button key={key} onClick={() => toggle(key)} style={{
                background: isOn ? mod.color + '22' : s.bg3,
                border: `1px solid ${isOn ? mod.color + '66' : isSel ? s.border2 : s.border}`,
                borderRadius: 8, padding: '8px 12px', color: isOn ? mod.color : s.text3,
                cursor: 'pointer', ...M, fontSize: 10, fontWeight: isOn ? 700 : 400,
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}>
                {mod.name}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Routes', value: totalRoutes, color: s.accent },
            { label: 'Views', value: totalViews, color: s.green },
            { label: 'Emails', value: totalEmails, color: s.yellow },
          ].map(st => (
            <div key={st.label} style={{
              flex: 1, padding: '10px 12px', background: st.color + '11',
              borderRadius: 8, border: `1px solid ${st.color}22`, textAlign: 'center',
            }}>
              <div style={{ ...M, fontSize: 18, fontWeight: 700, color: st.color }}>{st.value}</div>
              <div style={{ fontSize: 11, color: s.text3, marginTop: 2 }}>{st.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ ...M, fontSize: 10, color: s.text3, marginBottom: 8 }}>GENERATED MODEL</div>
            <div className="dmc" style={{
              background: s.bg, borderRadius: 8, padding: '14px 16px',
              border: `1px solid ${s.border}`, ...M, fontSize: 11, lineHeight: 1.6,
              whiteSpace: 'pre', overflowX: 'auto',
            }}>
              <style>{`
.dmc code .token.keyword { color: #f92672; }
.dmc code .token.string, .dmc code .token.char, .dmc code .token.builtin, .dmc code .token.inserted { color: #e6db74; }
.dmc code .token.number, .dmc code .token.constant, .dmc code .token.symbol, .dmc code .token.property, .dmc code .token.tag, .dmc code .token.boolean, .dmc code .token.deleted { color: #ae81ff; }
.dmc code .token.selector, .dmc code .token.attr-name { color: #f92672; }
.dmc code .token.attr-value, .dmc code .token.atrule { color: #e6db74; }
.dmc code .token.function, .dmc code .token.class-name { color: #a6e22e; }
.dmc code .token.operator, .dmc code .token.entity, .dmc code .token.url, .dmc code .token.punctuation { color: #f8f8f2; }
.dmc code .token.comment, .dmc code .token.prolog, .dmc code .token.doctype, .dmc code .token.cdata { color: #75715e; font-style: italic; }
.dmc code .token.parameter, .dmc code .token.variable, .dmc code .token.regex, .dmc code .token.important { color: #fd971f; }
`}</style>
              <code dangerouslySetInnerHTML={{ __html: modelHtml }} />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            {activeModule ? (
              <div>
                <div style={{ ...M, fontSize: 10, color: activeModule.color, marginBottom: 8, fontWeight: 700 }}>
                  {activeModule.name.toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.6, marginBottom: 12 }}>
                  {activeModule.desc}
                </div>
                {activeModule.routes.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ ...M, fontSize: 9, color: s.text3, marginBottom: 4 }}>ROUTES</div>
                    {activeModule.routes.map(r => (
                      <div key={r} style={{ ...M, fontSize: 10, color: s.accent, marginBottom: 2 }}>{r}</div>
                    ))}
                  </div>
                )}
                {activeModule.modelMethods.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ ...M, fontSize: 9, color: s.text3, marginBottom: 4 }}>MODEL METHODS</div>
                    {activeModule.modelMethods.slice(0, 5).map(m => (
                      <div key={m} style={{ ...M, fontSize: 10, color: s.yellow, marginBottom: 2 }}>{m}</div>
                    ))}
                    {activeModule.modelMethods.length > 5 && (
                      <div style={{ ...M, fontSize: 9, color: s.text3 }}>+{activeModule.modelMethods.length - 5} more</div>
                    )}
                  </div>
                )}
                {activeModule.views.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ ...M, fontSize: 9, color: s.text3, marginBottom: 4 }}>VIEWS</div>
                    {activeModule.views.map(v => (
                      <div key={v} style={{ ...M, fontSize: 10, color: s.purple, marginBottom: 2 }}>{v}</div>
                    ))}
                  </div>
                )}
                {activeModule.email && (
                  <div>
                    <div style={{ ...M, fontSize: 9, color: s.text3, marginBottom: 4 }}>MAILER</div>
                    <div style={{ ...M, fontSize: 10, color: s.orange }}>Devise::Mailer#{activeModule.email}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: s.text3, fontSize: 12 }}>
                Click a module above to see details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
