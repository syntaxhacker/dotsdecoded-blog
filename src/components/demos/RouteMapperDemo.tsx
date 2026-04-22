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

const routes = [
  { verb: 'GET', path: '/articles', action: 'articles#index', desc: 'List all articles' },
  { verb: 'GET', path: '/articles/new', action: 'articles#new', desc: 'Form to create article' },
  { verb: 'POST', path: '/articles', action: 'articles#create', desc: 'Save new article' },
  { verb: 'GET', path: '/articles/:id', action: 'articles#show', desc: 'Show one article' },
  { verb: 'GET', path: '/articles/:id/edit', action: 'articles#edit', desc: 'Form to edit article' },
  { verb: 'PATCH', path: '/articles/:id', action: 'articles#update', desc: 'Update the article' },
  { verb: 'DELETE', path: '/articles/:id', action: 'articles#destroy', desc: 'Delete the article' },
]

const verbColors: Record<string, string> = {
  GET: s.green, POST: s.accent, PATCH: s.yellow, DELETE: s.red,
}

const examples = ['/articles', '/articles/42', '/articles/new', '/articles/42/edit', '/comments']

function matchRoute(input: string) {
  const inputParts = input.split('/').filter(Boolean)
  for (const route of routes) {
    const routeParts = route.path.split('/').filter(Boolean)
    if (inputParts.length !== routeParts.length) continue
    let match = true
    const params: Record<string, string> = {}
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = inputParts[i]
      } else if (routeParts[i] !== inputParts[i]) {
        match = false
        break
      }
    }
    if (match) return { route, params }
  }
  return null
}

const routesCode = `Rails.application.routes.draw do
  resources :articles
end

# This single line generates all 7 routes above`
const routesCodeHtml = Prism.highlight(routesCode, Prism.languages.ruby, 'ruby')

export default function RouteMapperDemo() {
  const [input, setInput] = useState('/articles')
  const [verb, setVerb] = useState('GET')

  const result = useMemo(() => matchRoute(input), [input])

  return (
    <DemoBoundary name="Route Mapper Demo">
      <div className="rmc" style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', background: s.bg2,
            borderRadius: 8, border: `1px solid ${s.border}`, overflow: 'hidden',
          }}>
            {Object.keys(verbColors).map((v) => (
              <button
                key={v}
                onClick={() => setVerb(v)}
                style={{
                  background: verb === v ? verbColors[v] : 'transparent',
                  border: 'none', padding: '8px 12px',
                  color: verb === v ? '#fff' : verbColors[v],
                  fontFamily: s.mono, fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center',
            background: s.bg2, borderRadius: 8,
            border: `1px solid ${s.border}`, padding: '0 12px',
            minWidth: 200,
          }}>
            <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 12, marginRight: 6 }}>
              GET
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="/articles/42"
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: s.text, fontFamily: s.mono, fontSize: 13,
                padding: '8px 0', outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', minWidth: 280 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.text, marginBottom: 8 }}>
              Try These URLs
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setInput(ex)}
                  style={{
                    background: input === ex ? s.accent + '20' : s.bg2,
                    border: `1px solid ${input === ex ? s.accent : s.border}`,
                    borderRadius: 5, padding: '4px 10px',
                    color: input === ex ? s.accent : s.text2,
                    fontFamily: s.mono, fontSize: 11,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: '1 1 300px', minWidth: 280 }}>
            {result ? (
              <div style={{
                background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`,
                padding: 14,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: s.green, marginBottom: 8 }}>
                  Route Matched
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                }}>
                  <span style={{
                    fontFamily: s.mono, fontSize: 11, fontWeight: 700,
                    color: '#fff', background: verbColors[verb],
                    padding: '2px 8px', borderRadius: 4,
                  }}>
                    {verb}
                  </span>
                  <span style={{ fontFamily: s.mono, fontSize: 12, color: s.text }}>
                    {result.route.path}
                  </span>
                </div>
                <div style={{
                  fontFamily: s.mono, fontSize: 12, color: s.accent, marginBottom: 4,
                }}>
                  {result.route.action}
                </div>
                <div style={{ fontSize: 11, color: s.text3, marginBottom: 6 }}>
                  {result.route.desc}
                </div>
                {Object.keys(result.params).length > 0 && (
                  <div style={{
                    fontFamily: s.mono, fontSize: 11, color: s.yellow,
                    background: s.bg, borderRadius: 4, padding: '4px 8px',
                  }}>
                    params: {'{'}
                    {Object.entries(result.params).map(([k, v], i) => (
                      <span key={k}>
                        {i > 0 ? ', ' : ''}{k}: {v}
                      </span>
                    ))}
                    {'}'}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`,
                padding: 14,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: s.red, marginBottom: 4 }}>
                  No Match
                </div>
                <div style={{ fontSize: 11, color: s.text3 }}>
                  No route matches the path and verb. Rails would return a 404 or raise RoutingError.
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: s.text, marginBottom: 8 }}>
            routes.rb
          </div>
          <div style={{
            background: s.bg, borderRadius: 8, padding: 12,
            border: `1px solid ${s.border}`,
            fontFamily: s.mono, fontSize: 11, lineHeight: 1.7, whiteSpace: 'pre',
          }}>
            <code dangerouslySetInnerHTML={{ __html: routesCodeHtml }} />
          </div>
        </div>
      </div>
      <style>{`
        .rmc code .token.keyword { color: #f92672; }
        .rmc code .token.string, .rmc code .token.char, .rmc code .token.builtin, .rmc code .token.inserted { color: #e6db74; }
        .rmc code .token.number, .rmc code .token.constant, .rmc code .token.symbol, .rmc code .token.property, .rmc code .token.tag, .rmc code .token.boolean, .rmc code .token.deleted { color: #ae81ff; }
        .rmc code .token.selector, .rmc code .token.attr-name { color: #f92672; }
        .rmc code .token.attr-value, .rmc code .token.atrule { color: #e6db74; }
        .rmc code .token.function, .rmc code .token.class-name { color: #a6e22e; }
        .rmc code .token.operator, .rmc code .token.entity, .rmc code .token.url, .rmc code .token.punctuation { color: #f8f8f2; }
        .rmc code .token.comment, .rmc code .token.prolog, .rmc code .token.doctype, .rmc code .token.cdata { color: #75715e; font-style: italic; }
        .rmc code .token.parameter, .rmc code .token.variable, .rmc code .token.regex, .rmc code .token.important { color: #fd971f; }
      `}</style>
    </DemoBoundary>
  )
}
