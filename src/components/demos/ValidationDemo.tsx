import { useState, useMemo } from 'react'
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

interface ValidationRule {
  id: string
  label: string
  code: string
  check: (name: string, email: string, age: string, bio: string) => string | null
  active: boolean
}

function createRules(): ValidationRule[] {
  return [
    {
      id: 'presence',
      label: 'Presence',
      code: 'validates :name, presence: true\nvalidates :email, presence: true',
      check: (_n, email, _a, _b) => !email.trim() ? 'Email can\'t be blank' : null,
      active: true,
    },
    {
      id: 'uniqueness',
      label: 'Uniqueness',
      code: 'validates :email, uniqueness: true',
      check: (_n, email, _a, _b) => email.trim() && email.trim().toLowerCase() === 'alice@example.com' ? 'Email has already been taken' : null,
      active: false,
    },
    {
      id: 'length',
      label: 'Length',
      code: 'validates :name, length: { minimum: 2, maximum: 50 }\nvalidates :bio, length: { maximum: 200 }',
      check: (name, _e, _a, bio) => {
        if (name.trim().length > 0 && name.trim().length < 2) return 'Name is too short (minimum is 2 characters)'
        if (bio.length > 200) return 'Bio is too long (maximum is 200 characters)'
        return null
      },
      active: false,
    },
    {
      id: 'format',
      label: 'Format',
      code: 'validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }',
      check: (_n, email, _a, _b) => {
        if (!email.trim()) return null
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return !re.test(email.trim()) ? 'Email is invalid' : null
      },
      active: false,
    },
    {
      id: 'numericality',
      label: 'Numericality',
      code: 'validates :age, numericality: { only_integer: true,\n  greater_than_or_equal_to: 0,\n  less_than_or_equal_to: 150 }',
      check: (_n, _e, age, _b) => {
        if (!age.trim()) return null
        const n = parseInt(age)
        if (isNaN(n) || age.trim() !== String(n)) return 'Age is not a number'
        if (n < 0 || n > 150) return 'Age must be between 0 and 150'
        return null
      },
      active: false,
    },
    {
      id: 'custom',
      label: 'Custom',
      code: 'validate :name_must_not_contain_numbers\n\ndef name_must_not_contain_numbers\n  if name =~ /\\d/\n    errors.add(:name, "cannot contain numbers")\n  end\nend',
      check: (name, _e, _a, _b) => {
        if (/\d/.test(name)) return 'Name cannot contain numbers'
        return null
      },
      active: false,
    },
  ]
}

export default function ValidationDemo() {
  const [rules, setRules] = useState(createRules)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const errors = useMemo(() => {
    if (!submitted) return [] as { field: string; message: string; rule: string }[]
    const result: { field: string; message: string; rule: string }[] = []
    for (const rule of rules) {
      if (!rule.active) continue
      const err = rule.check(name, email, age, bio)
      if (err) {
        const field = err.includes('Email') ? 'email' : err.includes('Name') ? 'name' : err.includes('Age') ? 'age' : 'bio'
        result.push({ field, message: err, rule: rule.label })
      }
    }
    return result
  }, [rules, name, email, age, bio, submitted])

  const toggle = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r))
    setSubmitted(false)
  }

  const valid = submitted && errors.length === 0

  const inputStyle = (field: string): React.CSSProperties => {
    const hasErr = errors.some(e => e.field === field)
    return {
      background: s.bg,
      border: `1px solid ${hasErr ? s.red : s.border}`,
      borderRadius: 6,
      padding: '8px 12px',
      color: s.text,
      fontFamily: s.mono,
      fontSize: 13,
      width: '100%',
      outline: 'none',
      boxSizing: 'border-box' as const,
    }
  }

  const activeCode = rules.filter(r => r.active).map(r => r.code).join('\n\n')

  const activeCodeHtml = useMemo(() => Prism.highlight(activeCode || '# Enable validations above', Prism.languages.ruby, 'ruby'), [activeCode])

  return (
    <DemoBoundary name="Validation Demo">
      <div className="vdc" style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Validation Rules</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
              {rules.map(rule => (
                <button
                  key={rule.id}
                  onClick={() => toggle(rule.id)}
                  style={{
                    background: rule.active ? s.accent : s.bg2,
                    border: `1px solid ${rule.active ? s.accent : s.border}`,
                    borderRadius: 6,
                    padding: '6px 12px',
                    color: rule.active ? s.bg : s.text2,
                    fontFamily: s.mono,
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left' as const,
                    transition: 'all 0.2s',
                  }}
                >
                  {rule.active ? '[x] ' : '[ ] '}{rule.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Active Validations</div>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: 12,
              fontFamily: s.mono,
              fontSize: 11,
              lineHeight: 1.6,
              whiteSpace: 'pre' as const,
              minHeight: 120,
            }}>
              <code dangerouslySetInnerHTML={{ __html: activeCodeHtml }} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>User Form</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, color: s.text3, fontFamily: s.mono, marginBottom: 4, display: 'block' }}>name</label>
                <input style={inputStyle('name')} value={name} onChange={e => { setName(e.target.value); setSubmitted(false) }} placeholder="John Doe" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: s.text3, fontFamily: s.mono, marginBottom: 4, display: 'block' }}>email</label>
                <input style={inputStyle('email')} value={email} onChange={e => { setEmail(e.target.value); setSubmitted(false) }} placeholder="john@example.com" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: s.text3, fontFamily: s.mono, marginBottom: 4, display: 'block' }}>age</label>
                <input style={inputStyle('age')} value={age} onChange={e => { setAge(e.target.value); setSubmitted(false) }} placeholder="25" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: s.text3, fontFamily: s.mono, marginBottom: 4, display: 'block' }}>bio</label>
                <textarea style={{ ...inputStyle('bio'), minHeight: 48, resize: 'vertical' as const }} value={bio} onChange={e => { setBio(e.target.value); setSubmitted(false) }} placeholder="A short bio..." />
              </div>
            </div>

            <button
              onClick={() => setSubmitted(true)}
              style={{
                marginTop: 12,
                background: s.accent,
                border: 'none',
                borderRadius: 6,
                padding: '10px 20px',
                color: s.bg,
                fontFamily: s.mono,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s',
              }}
            >
              user.save
            </button>

            {submitted && (
              <div style={{ marginTop: 12 }}>
                {valid ? (
                  <div style={{ background: `${s.green}15`, border: `1px solid ${s.green}`, borderRadius: 6, padding: 10, color: s.green, fontSize: 13, fontFamily: s.mono }}>
                    {'{'} "id": 1, "name": "{name}", "email": "{email}" {'}'}
                    {'\n'}# Valid -- saved to database
                  </div>
                ) : (
                  <div style={{ background: `${s.red}15`, border: `1px solid ${s.red}`, borderRadius: 6, padding: 10 }}>
                    <div style={{ color: s.red, fontSize: 12, fontFamily: s.mono, marginBottom: 6, fontWeight: 600 }}>Validation failed:</div>
                    {errors.map((err, i) => (
                      <div key={i} style={{ color: s.text2, fontSize: 12, fontFamily: s.mono, marginBottom: 2 }}>
                        <span style={{ color: s.yellow }}>{err.field}</span>: {err.message} <span style={{ color: s.text3 }}>({err.rule})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .vdc code .token.keyword { color: #f92672; }
        .vdc code .token.string, .vdc code .token.char, .vdc code .token.builtin, .vdc code .token.inserted { color: #e6db74; }
        .vdc code .token.number, .vdc code .token.constant, .vdc code .token.symbol, .vdc code .token.property, .vdc code .token.tag, .vdc code .token.boolean, .vdc code .token.deleted { color: #ae81ff; }
        .vdc code .token.selector, .vdc code .token.attr-name { color: #f92672; }
        .vdc code .token.attr-value, .vdc code .token.atrule { color: #e6db74; }
        .vdc code .token.function, .vdc code .token.class-name { color: #a6e22e; }
        .vdc code .token.operator, .vdc code .token.entity, .vdc code .token.url, .vdc code .token.punctuation { color: #f8f8f2; }
        .vdc code .token.comment, .vdc code .token.prolog, .vdc code .token.doctype, .vdc code .token.cdata { color: #75715e; font-style: italic; }
        .vdc code .token.parameter, .vdc code .token.variable, .vdc code .token.regex, .vdc code .token.important { color: #fd971f; }
      `}</style>
    </DemoBoundary>
  )
}
