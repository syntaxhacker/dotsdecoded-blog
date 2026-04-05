import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-markup-templating'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-erb'

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

interface Partial {
  id: string
  label: string
  file: string
  code: string
  color: string
  y: number
  h: number
}

const partials: Partial[] = [
  {
    id: 'header',
    label: 'Header',
    file: 'app/views/shared/_header.html.erb',
    code: `<nav class="main-nav">
  <%= link_to "MyApp", root_path, class: "logo" %>
  <%= render "shared/nav_links" %>
  <%= render "shared/user_menu" %>
</nav>`,
    color: s.accent,
    y: 0,
    h: 60,
  },
  {
    id: 'sidebar',
    label: 'Sidebar',
    file: 'app/views/posts/_sidebar.html.erb',
    code: `<aside class="sidebar">
  <%= render "shared/search_box" %>
  <%= render "shared/categories" %>
  <%= render "shared/recent_posts" %>
</aside>`,
    color: s.purple,
    y: 64,
    h: 180,
  },
  {
    id: 'post',
    label: 'Post Card',
    file: 'app/views/posts/_post.html.erb',
    code: `<article class="post-card">
  <h2><%= link_to post.title, post %></h2>
  <div class="meta">
    <%= post.author.name %> &middot; <%= time_ago_in_words(post.created_at) %>
  </div>
  <p><%= truncate(post.body, length: 200) %></p>
  <%= render post.comments.limit(3), partial: "comments/comment" %>
</article>`,
    color: s.green,
    y: 64,
    h: 120,
  },
  {
    id: 'comment',
    label: 'Comment',
    file: 'app/views/comments/_comment.html.erb',
    code: `<div class="comment">
  <div class="comment-header">
    <strong><%= comment.author_name %></strong>
    <time><%= time_ago_in_words(comment.created_at) %> ago</time>
  </div>
  <p><%= comment.body %></p>
</div>`,
    color: s.orange,
    y: 188,
    h: 56,
  },
  {
    id: 'footer',
    label: 'Footer',
    file: 'app/views/shared/_footer.html.erb',
    code: `<footer class="main-footer">
  <p>&copy; <%= Date.today.year %> MyApp</p>
  <%= render "shared/footer_links" %>
</footer>`,
    color: s.yellow,
    y: 248,
    h: 52,
  },
]

export default function PartialDemo() {
  const [selected, setSelected] = useState<string | null>(null)

  const current = partials.find((p) => p.id === selected)

  const codeHtml = useMemo(() => {
    if (!current) return ''
    return Prism.highlight(current.code, Prism.languages.erb, 'erb')
  }, [current])

  return (
    <DemoBoundary name="Rails Partials">
    <div className="pdc" style={{ background: s.bg, padding: '28px 20px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <style>{`
.pdc code .token.keyword { color: #f92672; }
.pdc code .token.string, .pdc code .token.char, .pdc code .token.builtin, .pdc code .token.inserted { color: #e6db74; }
.pdc code .token.number, .pdc code .token.constant, .pdc code .token.symbol, .pdc code .token.property, .pdc code .token.tag, .pdc code .token.boolean, .pdc code .token.deleted { color: #ae81ff; }
.pdc code .token.selector, .pdc code .token.attr-name { color: #f92672; }
.pdc code .token.attr-value, .pdc code .token.atrule { color: #e6db74; }
.pdc code .token.function, .pdc code .token.class-name { color: #a6e22e; }
.pdc code .token.operator, .pdc code .token.entity, .pdc code .token.url, .pdc code .token.punctuation { color: #f8f8f2; }
.pdc code .token.comment, .pdc code .token.prolog, .pdc code .token.doctype, .pdc code .token.cdata { color: #75715e; font-style: italic; }
.pdc code .token.parameter, .pdc code .token.variable, .pdc code .token.regex, .pdc code .token.important { color: #fd971f; }
      `}</style>
      <div style={{ fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 6, letterSpacing: -0.3 }}>Partials: Reusable View Fragments</div>
      <p style={{ color: s.text3, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
        Click any section of the page layout to see its partial file and source code.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: s.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Page Layout</div>
          <div style={{
            background: s.bg2, borderRadius: 10, padding: 12, border: `1px solid ${s.border}`,
            position: 'relative', height: 300,
          }}>
            <div
              onClick={() => setSelected('header')}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 56,
                background: selected === 'header' ? s.accent : s.bg3,
                border: `2px solid ${selected === 'header' ? s.accent : s.border2}`,
                borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: selected === 'header' ? '#fff' : s.text2, fontSize: 12, fontWeight: 600,
              }}
            >
              _header
            </div>
            <div style={{ position: 'absolute', top: 60, left: 0, bottom: 56, right: 0, display: 'flex', gap: 6 }}>
              <div
                onClick={() => setSelected('sidebar')}
                style={{
                  width: 70, background: selected === 'sidebar' ? s.purple : s.bg3,
                  border: `2px solid ${selected === 'sidebar' ? s.purple : s.border2}`,
                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: selected === 'sidebar' ? '#fff' : s.text2, fontSize: 10, fontWeight: 600,
                }}
              >
                _sidebar
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div
                  onClick={() => setSelected('post')}
                  style={{
                    flex: 1, background: selected === 'post' ? s.green : s.bg3,
                    border: `2px solid ${selected === 'post' ? s.green : s.border2}`,
                    borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: selected === 'post' ? '#000' : s.text2, fontSize: 11, fontWeight: 600,
                  }}
                >
                  _post
                </div>
                <div
                  onClick={() => setSelected('comment')}
                  style={{
                    height: 52, background: selected === 'comment' ? s.orange : s.bg3,
                    border: `2px solid ${selected === 'comment' ? s.orange : s.border2}`,
                    borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: selected === 'comment' ? '#000' : s.text2, fontSize: 10, fontWeight: 600,
                  }}
                >
                  _comment
                </div>
              </div>
            </div>
            <div
              onClick={() => setSelected('footer')}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
                background: selected === 'footer' ? s.yellow : s.bg3,
                border: `2px solid ${selected === 'footer' ? s.yellow : s.border2}`,
                borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: selected === 'footer' ? '#000' : s.text2, fontSize: 12, fontWeight: 600,
              }}
            >
              _footer
            </div>
          </div>
        </div>

        <div>
          {current ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: current.color, borderRadius: 4, padding: '2px 8px', fontFamily: s.mono, fontSize: 11, color: '#fff', fontWeight: 700 }}>
                  {current.label}
                </span>
                <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3 }}>{current.file}</span>
              </div>
              <div style={{ background: s.bg2, borderRadius: 8, padding: '14px 16px', border: `1px solid ${s.border}` }}>
                <div style={{ fontFamily: s.mono, fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre' }}>
                  <code dangerouslySetInnerHTML={{ __html: codeHtml }} />
                </div>
              </div>
              <div style={{ background: s.bg3, borderRadius: 6, padding: '8px 10px', fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
                <span style={{ fontFamily: s.mono, color: s.accent }}>render</span> {'"'}{current.id}{'"'} {'{'} renders the file with the underscore prefix. The underscore tells Rails this is a partial, not a full template.
              </div>
            </div>
          ) : (
            <div style={{ background: s.bg2, borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.border}`, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: s.text3, fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
                Select a section to see its partial source code
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
