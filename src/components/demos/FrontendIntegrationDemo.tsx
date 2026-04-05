import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-markup-templating'
import 'prismjs/components/prism-erb'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Approach {
  id: string
  label: string
  subtitle: string
  color: string
  pros: string[]
  cons: string[]
  flow: { from: string; to: string; label: string; type: 'html' | 'json' | 'wire' }[]
  when: string
  setup: string
}

const approaches: Approach[] = [
  {
    id: 'erb',
    label: 'Traditional Rails',
    subtitle: 'ERB Templates + Turbolinks',
    color: s.red,
    pros: [
      'Zero frontend build step',
      'Fast initial page load (server-rendered HTML)',
      'Full Rails ecosystem available in views',
      'Low complexity, easy to onboard',
      'Great for content-heavy sites',
    ],
    cons: [
      'Limited interactivity without custom JS',
      'Turbolinks can cause subtle caching bugs',
      'Harder to build complex UIs',
      'Shared state between pages is manual',
    ],
    flow: [
      { from: 'Browser', to: 'Rails Server', label: 'HTTP Request', type: 'html' },
      { from: 'Rails Server', to: 'Database', label: 'ActiveRecord Query', type: 'html' },
      { from: 'Database', to: 'Rails Server', label: 'Data', type: 'json' },
      { from: 'Rails Server', to: 'ERB Engine', label: 'Render Template', type: 'html' },
      { from: 'ERB Engine', to: 'Browser', label: 'Full HTML Page', type: 'html' },
    ],
    when: 'Content-heavy sites, admin dashboards, CRUD apps, when speed-to-ship matters most.',
    setup: "# config/routes.rb\nRails.application.routes.draw do\n  resources :posts\n  root 'posts#index'\nend\n\n# app/controllers/posts_controller.rb\nclass PostsController < ApplicationController\n  def index\n    @posts = Post.all\n  end\nend\n\n# app/views/posts/index.html.erb\n<% @posts.each do |post| %>\n  <div class=\"post\">\n    <h2><%= post.title %></h2>\n    <p><%= post.body %></p>\n  </div>\n<% end %>",
  },
  {
    id: 'api',
    label: 'Rails API + React SPA',
    subtitle: 'JSON API + React/Vue Frontend',
    color: s.accent,
    pros: [
      'Rich, dynamic client-side UIs',
      'Full power of React/Vue ecosystem',
      'Offline-capable, state management',
      'Separation of concerns (backend/frontend teams)',
      'Reuse API for mobile apps',
    ],
    cons: [
      'More complex architecture (two codebases)',
      'Slower initial load (JS bundle)',
      'SEO requires SSR or pre-rendering',
      'Auth flows are more involved',
      'Doubles deployment complexity',
    ],
    flow: [
      { from: 'React App', to: 'Rails API', label: 'GET /api/posts', type: 'json' },
      { from: 'Rails API', to: 'Database', label: 'ActiveRecord Query', type: 'json' },
      { from: 'Database', to: 'Rails API', label: 'Data', type: 'json' },
      { from: 'Rails API', to: 'React App', label: 'JSON Response', type: 'json' },
      { from: 'React App', to: 'React App', label: 'Update DOM', type: 'wire' },
    ],
    when: 'Highly interactive apps, real-time dashboards, when you need a mobile app too.',
    setup: "# config/routes.rb\nnamespace :api do\n  namespace :v1 do\n    resources :posts\n  end\nend\n\n# app/controllers/api/v1/posts_controller.rb\nclass Api::V1::PostsController < ApplicationController\n  def index\n    posts = Post.includes(:user)\n    render json: posts\n  end\nend\n\n# React: src/App.tsx\nconst Posts = () => {\n  const [posts, setPosts] = useState([])\n  useEffect(() => {\n    fetch('/api/v1/posts')\n      .then(r => r.json())\n      .then(setPosts)\n  }, [])\n  return posts.map(p => <PostCard key={p.id} post={p} />)\n}",
  },
  {
    id: 'hotwire',
    label: 'Hotwire / Turbo',
    subtitle: 'HTML Over the Wire',
    color: s.green,
    pros: [
      'Server-rendered HTML (fast, SEO-friendly)',
      'Partial page updates (no full reload)',
      'Minimal JavaScript needed',
      'Stays in the Rails ecosystem',
      'Fast development velocity',
    ],
    cons: [
      'Less control over client-side state',
      'Complex animations are harder',
      'Smaller community than React/Vue',
      'Learning curve for Turbo Frames/Streams',
      'Not ideal for highly dynamic UIs',
    ],
    flow: [
      { from: 'Browser', to: 'Rails Server', label: 'HTTP Request', type: 'html' },
      { from: 'Rails Server', to: 'Database', label: 'ActiveRecord Query', type: 'json' },
      { from: 'Database', to: 'Rails Server', label: 'Data', type: 'json' },
      { from: 'Rails Server', to: 'Browser', label: 'HTML Fragment (Turbo)', type: 'wire' },
      { from: 'Browser', to: 'Browser', label: 'Swap DOM Element', type: 'wire' },
    ],
    when: 'Most Rails apps. Best balance of speed, simplicity, and interactivity.',
    setup: "# app/views/posts/index.html.erb\n<%= turbo_frame_tag 'posts' do %>\n  <%= render @posts %>\n  <%= link_to 'Next page', posts_path(page: @posts.next_page),\n      data: { turbo_stream: true } %>\n<% end %>\n\n# app/views/posts/_post.html.erb (Turbo Stream)\n<%= turbo_stream_from @post %>\n<div id='<%= dom_id(@post) %>'>\n  <h2><%= @post.title %></h2>\n  <p><%= @post.body %></p>\n  <button onclick=\"this.closest('div').remove()\">\n    Remove\n  </button>\n</div>\n\n# Turbo Streams for real-time updates\n# app/controllers/posts_controller.rb\ndef create\n  @post = Post.create!(post_params)\n  respond_to do |format|\n    format.turbo_stream\n  end\nend",
  },
]

const typeColors: Record<string, string> = {
  html: s.red,
  json: s.accent,
  wire: s.green,
}

const typeLabels: Record<string, string> = {
  html: 'HTML',
  json: 'JSON',
  wire: 'DOM',
}

export default function FrontendIntegrationDemo() {
  const [active, setActive] = useState<string>('hotwire')
  const approach = approaches.find((a) => a.id === active)!

  const setupHtml = useMemo(() => {
    return Prism.highlight(approach.setup, Prism.languages.ruby, 'ruby')
  }, [approach])

  return (
    <DemoBoundary name="Frontend Integration Comparison">
      <div className="fic" style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <style>{`
.fic code .token.keyword { color: #f92672; }
.fic code .token.string, .fic code .token.char, .fic code .token.builtin, .fic code .token.inserted { color: #e6db74; }
.fic code .token.number, .fic code .token.constant, .fic code .token.symbol, .fic code .token.property, .fic code .token.tag, .fic code .token.boolean, .fic code .token.deleted { color: #ae81ff; }
.fic code .token.selector, .fic code .token.attr-name { color: #f92672; }
.fic code .token.attr-value, .fic code .token.atrule { color: #e6db74; }
.fic code .token.function, .fic code .token.class-name { color: #a6e22e; }
.fic code .token.operator, .fic code .token.entity, .fic code .token.url, .fic code .token.punctuation { color: #f8f8f2; }
.fic code .token.comment, .fic code .token.prolog, .fic code .token.doctype, .fic code .token.cdata { color: #75715e; font-style: italic; }
.fic code .token.parameter, .fic code .token.variable, .fic code .token.regex, .fic code .token.important { color: #fd971f; }
        `}</style>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {approaches.map((a) => {
            const isActive = a.id === active
            return (
              <div
                key={a.id}
                onClick={() => setActive(a.id)}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8,
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: isActive ? a.color + '15' : s.bg2,
                  border: `1px solid ${isActive ? a.color + '50' : s.border}`,
                  textAlign: 'center',
                }}
              >
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: isActive ? a.color : s.text3,
                }}>
                  {a.label}
                </div>
                <div style={{ fontSize: 11, color: s.text3, marginTop: 2 }}>
                  {a.subtitle}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 360px', minWidth: 280 }}>
            <div style={{
              padding: 16, borderRadius: 10,
              background: s.bg2, border: `1px solid ${s.border}`,
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                Request / Response Flow
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {approach.flow.map((f, i) => {
                  const tc = typeColors[f.type]
                  return (
                    <div key={i}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px',
                        background: s.bg, borderRadius: 6,
                        border: `1px solid ${s.border}`,
                      }}>
                        <div style={{
                          fontSize: 12, fontWeight: 600, fontFamily: s.mono,
                          color: s.text2, minWidth: 100,
                        }}>
                          {f.from}
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 1, background: s.border }} />
                          <div style={{
                            padding: '2px 8px', borderRadius: 4,
                            background: tc + '20', fontSize: 10, fontWeight: 600,
                            color: tc, fontFamily: s.mono,
                            border: `1px solid ${tc}30`,
                          }}>
                            {f.label}
                          </div>
                          <div style={{
                            padding: '2px 6px', borderRadius: 3,
                            background: tc + '15', fontSize: 9, fontWeight: 700,
                            color: tc, fontFamily: s.mono,
                          }}>
                            {typeLabels[f.type]}
                          </div>
                          <div style={{ flex: 1, height: 1, background: s.border }} />
                        </div>
                        <div style={{
                          fontSize: 12, fontWeight: 600, fontFamily: s.mono,
                          color: s.text2, minWidth: 100, textAlign: 'right',
                        }}>
                          {f.to}
                        </div>
                      </div>
                      {i < approach.flow.length - 1 && (
                        <div style={{ width: 2, height: 8, background: s.border, margin: '0 auto' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{
              padding: 16, borderRadius: 10,
              background: s.bg2, border: `1px solid ${s.border}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                When to Choose This
              </div>
              <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.6 }}>
                {approach.when}
              </div>
            </div>
          </div>

          <div style={{ flex: '1 1 360px', minWidth: 280 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{
                flex: 1, padding: 14, borderRadius: 10,
                background: s.bg2, border: `1px solid ${s.border}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: s.green, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Pros
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {approach.pros.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: s.text2, lineHeight: 1.5 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.green, flexShrink: 0, marginTop: 6 }} />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{
                flex: 1, padding: 14, borderRadius: 10,
                background: s.bg2, border: `1px solid ${s.border}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: s.red, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Cons
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {approach.cons.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: s.text2, lineHeight: 1.5 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.red, flexShrink: 0, marginTop: 6 }} />
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{
              padding: 14, borderRadius: 10,
              background: s.bg2, border: `1px solid ${s.border}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Example Setup
              </div>
              <div style={{
                background: s.bg, borderRadius: 8, padding: 12,
                border: `1px solid ${s.border}`,
                maxHeight: 320, overflowY: 'auto',
              }}>
                <div style={{ fontFamily: s.mono, fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre' }}>
                  <code dangerouslySetInnerHTML={{ __html: setupHtml }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
