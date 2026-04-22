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

const safeFields = [
  { key: 'title', value: 'My First Blog Post', category: 'safe' },
  { key: 'body', value: 'Lorem ipsum dolor sit amet...', category: 'safe' },
  { key: 'published', value: 'true', category: 'safe' },
]

const dangerousFields = [
  { key: 'admin', value: 'true', category: 'dangerous' },
  { key: 'role', value: 'superadmin', category: 'dangerous' },
  { key: 'account_balance', value: '999999', category: 'dangerous' },
]

const allFields = [...safeFields, ...dangerousFields]

const strongParamsCode = `def create
  @post = Post.new(post_params)
  @post.save
end

private

def post_params
  params.require(:post)
        .permit(:title, :body, :published)
end`

const noStrongParamsCode = `def create
  @post = Post.new(params[:post])
  @post.save
end`

const strongParamsHtml = Prism.highlight(strongParamsCode, Prism.languages.ruby, 'ruby')
const noStrongParamsHtml = Prism.highlight(noStrongParamsCode, Prism.languages.ruby, 'ruby')

export default function StrongParamsDemo() {
  const [strongParams, setStrongParams] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const permittedFields = strongParams
    ? safeFields
    : allFields

  const rejectedFields = strongParams
    ? dangerousFields
    : []

  return (
    <DemoBoundary name="Strong Parameters">
    <div className="spc" style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Strong Parameters</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          A malicious user can add hidden form fields like admin=true or role=superadmin. Toggle strong parameters to see how they prevent mass assignment attacks.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => { setStrongParams(!strongParams); setSubmitted(false) }}
            style={{
              background: strongParams ? s.green : s.red,
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              transition: 'all 0.2s',
            }}
          >
            Strong Params: {strongParams ? 'ON' : 'OFF'}
          </button>
          <span style={{ fontSize: 12, color: s.text3 }}>
            {strongParams ? 'Only permitted attributes will be saved' : 'All submitted attributes will be saved (vulnerable!)'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Submitted Form Data</div>
            <div style={{ background: s.bg3, borderRadius: 8, padding: 14, border: `1px solid ${s.border}` }}>
              {allFields.map(f => (
                <div key={f.key} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0',
                  borderBottom: f.key !== 'account_balance' ? `1px solid ${s.border}33` : 'none',
                }}>
                  <span style={{ ...M, fontSize: 12, color: f.category === 'dangerous' ? s.red : s.text2 }}>{f.key}</span>
                  <span style={{ ...M, fontSize: 12, color: f.category === 'dangerous' ? s.red : s.text }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: s.text3, marginTop: 6 }}>
              Note the red fields -- a user added hidden fields to the form
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 20, color: s.text3 }}>{'->'}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Controller Code
            </div>
            <div style={{
              background: s.bg3, borderRadius: 8, padding: 14, border: `1px solid ${s.border}`,
              ...M, fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre',
            }}>
              <code dangerouslySetInnerHTML={{ __html: strongParams ? strongParamsHtml : noStrongParamsHtml }} />
            </div>
          </div>
        </div>
        <button
          onClick={() => setSubmitted(true)}
          style={{
            background: s.accent, border: 'none', borderRadius: 8,
            padding: '10px 24px', color: '#fff', cursor: 'pointer',
            fontWeight: 600, fontSize: 14, transition: 'all 0.2s', width: '100%',
          }}
        >
          Submit Form
        </button>
        {submitted && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Result: What Gets Saved to the Database
            </div>
            <div style={{ background: s.bg3, borderRadius: 8, padding: 14, border: `1px solid ${strongParams ? s.green : s.red}` }}>
              {permittedFields.map(f => (
                <div key={f.key} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0',
                  borderBottom: `1px solid ${s.border}33`,
                }}>
                  <span style={{ ...M, fontSize: 12, color: s.green }}>{f.key}</span>
                  <span style={{ ...M, fontSize: 12, color: s.text }}>{f.value}</span>
                </div>
              ))}
              {rejectedFields.length > 0 && (
                <>
                  <div style={{ padding: '8px 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: s.red }}>STRIPPED:</span>
                  </div>
                  {rejectedFields.map(f => (
                    <div key={f.key} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '4px 0', opacity: 0.5,
                    }}>
                      <span style={{ ...M, fontSize: 12, color: s.red, textDecoration: 'line-through' }}>{f.key}</span>
                      <span style={{ ...M, fontSize: 12, color: s.red, textDecoration: 'line-through' }}>{f.value}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div style={{
              marginTop: 8, padding: '10px 14px', borderRadius: 8,
              background: strongParams ? `${s.green}15` : `${s.red}15`,
              border: `1px solid ${strongParams ? `${s.green}33` : `${s.red}33`}`,
              fontSize: 13, color: strongParams ? s.green : s.red, lineHeight: 1.5,
            }}>
              {strongParams
                ? 'Strong parameters blocked 3 dangerous attributes. Only the permitted fields were saved.'
                : 'Without strong parameters, all 6 fields were saved -- including admin=true and role=superadmin. The user is now a superadmin!'}
            </div>
          </div>
        )}
      </div>
    </div>
    <style>{`
      .spc code .token.keyword { color: #f92672; }
      .spc code .token.string, .spc code .token.char, .spc code .token.builtin, .spc code .token.inserted { color: #e6db74; }
      .spc code .token.number, .spc code .token.constant, .spc code .token.symbol, .spc code .token.property, .spc code .token.tag, .spc code .token.boolean, .spc code .token.deleted { color: #ae81ff; }
      .spc code .token.selector, .spc code .token.attr-name { color: #f92672; }
      .spc code .token.attr-value, .spc code .token.atrule { color: #e6db74; }
      .spc code .token.function, .spc code .token.class-name { color: #a6e22e; }
      .spc code .token.operator, .spc code .token.entity, .spc code .token.url, .spc code .token.punctuation { color: #f8f8f2; }
      .spc code .token.comment, .spc code .token.prolog, .spc code .token.doctype, .spc code .token.cdata { color: #75715e; font-style: italic; }
      .spc code .token.parameter, .spc code .token.variable, .spc code .token.regex, .spc code .token.important { color: #fd971f; }
    `}</style>
    </DemoBoundary>
  )
}
