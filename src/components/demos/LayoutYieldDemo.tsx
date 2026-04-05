import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-markup-templating'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-erb'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const pages = [
  {
    name: 'Home',
    path: '/',
    title: 'Welcome to the Blog',
    body: 'Latest articles and updates from our team.',
    hasSidebar: false,
  },
  {
    name: 'Articles',
    path: '/articles',
    title: 'All Articles',
    body: 'A list of all published articles sorted by date.',
    hasSidebar: true,
  },
  {
    name: 'About',
    path: '/about',
    title: 'About Us',
    body: 'We are a team of developers passionate about Rails.',
    hasSidebar: false,
  },
]

const layoutCode = `<!DOCTYPE html>
<html>
  <head>
    <title><%= yield :page_title %></title>
    <%= stylesheet_link_tag "application" %>
    <%= csrf_meta_tags %>
  </head>
  <body>
    <header class="main-header">
      <h1>My Blog</h1>
      <nav>
        <%= link_to "Home", root_path %>
        <%= link_to "Articles", articles_path %>
        <%= link_to "About", about_path %>
      </nav>
    </header>

    <main>
      <%= yield %>
    </main>

    <% if content_for? :sidebar %>
      <aside>
        <%= yield :sidebar %>
      </aside>
    <% end %>

    <footer>
      &copy; 2026 My Blog
    </footer>
  </body>
</html>`

const pageCode = (page: typeof pages[0]) => `<% content_for :page_title do %>
  ${page.title}
<% end %>

<h1>${page.title}</h1>
<p>${page.body}</p>${page.hasSidebar ? `\n\n<% content_for :sidebar do %>\n  <h3>Categories</h3>\n  <ul>\n    <li>Ruby</li>\n    <li>Rails</li>\n    <li>Database</li>\n  </ul>\n<% end %>` : ''}`

export default function LayoutYieldDemo() {
  const [activePage, setActivePage] = useState(0)
  const [view, setView] = useState<'layout' | 'page' | 'rendered'>('layout')
  const page = pages[activePage]

  const tabs: { key: typeof view; label: string }[] = [
    { key: 'layout', label: 'Layout' },
    { key: 'page', label: 'Page Template' },
    { key: 'rendered', label: 'Rendered HTML' },
  ]

  const codeHtml = useMemo(() => {
    if (view === 'layout') {
      return Prism.highlight(layoutCode, Prism.languages.erb, 'erb')
    }
    if (view === 'page') {
      return Prism.highlight(pageCode(page), Prism.languages.erb, 'erb')
    }
    const htmlCode = `<!DOCTYPE html>
<html>
  <head>
    <title>${page.title}</title>
    <link rel="stylesheet" href="/assets/application.css" />
    <meta name="csrf-token" content="abc123" />
  </head>
  <body>
    <header class="main-header">
      <h1>My Blog</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/articles">Articles</a>
        <a href="/about">About</a>
      </nav>
    </header>

    <main>
      <h1>${page.title}</h1>
      <p>${page.body}</p>
    </main>${page.hasSidebar ? `

    <aside>
      <h3>Categories</h3>
      <ul>
        <li>Ruby</li>
        <li>Rails</li>
        <li>Database</li>
      </ul>
    </aside>` : ''}

    <footer>
      &copy; 2026 My Blog
    </footer>
  </body>
</html>`
    return Prism.highlight(htmlCode, Prism.languages.markup, 'markup')
  }, [view, page])

  return (
    <DemoBoundary name="Layout and Yield Demo">
      <div className="lyc" style={{
        maxWidth: 820, margin: '0 auto',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <style>{`
.lyc code .token.keyword { color: #f92672; }
.lyc code .token.string, .lyc code .token.char, .lyc code .token.builtin, .lyc code .token.inserted { color: #e6db74; }
.lyc code .token.number, .lyc code .token.constant, .lyc code .token.symbol, .lyc code .token.property, .lyc code .token.tag, .lyc code .token.boolean, .lyc code .token.deleted { color: #ae81ff; }
.lyc code .token.selector, .lyc code .token.attr-name { color: #f92672; }
.lyc code .token.attr-value, .lyc code .token.atrule { color: #e6db74; }
.lyc code .token.function, .lyc code .token.class-name { color: #a6e22e; }
.lyc code .token.operator, .lyc code .token.entity, .lyc code .token.url, .lyc code .token.punctuation { color: #f8f8f2; }
.lyc code .token.comment, .lyc code .token.prolog, .lyc code .token.doctype, .lyc code .token.cdata { color: #75715e; font-style: italic; }
.lyc code .token.parameter, .lyc code .token.variable, .lyc code .token.regex, .lyc code .token.important { color: #fd971f; }
        `}</style>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {pages.map((p, i) => (
            <button
              key={p.name}
              onClick={() => setActivePage(i)}
              style={{
                background: activePage === i ? s.accent : s.bg2,
                border: `1px solid ${activePage === i ? s.accent : s.border}`,
                borderRadius: 6, padding: '6px 14px',
                color: activePage === i ? '#fff' : s.text2,
                fontFamily: s.mono, fontSize: 12,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              style={{
                background: view === t.key ? s.bg3 : 'transparent',
                border: `1px solid ${view === t.key ? s.border2 : s.border}`,
                borderRadius: 6, padding: '5px 12px',
                color: view === t.key ? s.text : s.text3,
                fontFamily: s.mono, fontSize: 11,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
          <div style={{
            flex: 1, background: s.bg, borderRadius: 8,
            border: `1px solid ${s.border}`, overflow: 'hidden',
          }}>
            <div style={{
              padding: '6px 12px', borderBottom: `1px solid ${s.border}`,
              fontSize: 11, fontWeight: 600, color: s.text3, fontFamily: s.mono,
            }}>
              {view === 'layout' ? 'app/views/layouts/application.html.erb' : view === 'page' ? `app/views/pages/${page.name.toLowerCase()}.html.erb` : 'Rendered Output'}
            </div>
            <div style={{
              padding: 14, fontFamily: s.mono, fontSize: 11,
              lineHeight: 1.65, whiteSpace: 'pre',
              maxHeight: 380, overflowY: 'auto',
            }}>
              <code dangerouslySetInnerHTML={{ __html: codeHtml }} />
            </div>
          </div>

          <div style={{
            width: 200, flexShrink: 0,
            background: s.bg2, borderRadius: 8,
            border: `1px solid ${s.border}`, padding: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.text, marginBottom: 10 }}>
              Yield Map
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: ':page_title', target: '<head><title>', active: true, color: s.accent },
                { label: 'yield (main)', target: '<main>', active: true, color: s.green },
                { label: ':sidebar', target: '<aside>', active: page.hasSidebar, color: s.orange },
              ].map((slot) => (
                <div key={slot.label}>
                  <div style={{
                    fontSize: 11, fontFamily: s.mono, fontWeight: 600,
                    color: slot.active ? slot.color : s.text3,
                    opacity: slot.active ? 1 : 0.4,
                    transition: 'all 0.2s',
                  }}>
                    {'<%='} yield {slot.label === 'yield (main)' ? '' : `:${slot.label.split(':')[1]}"`} {'%>'}
                  </div>
                  <div style={{
                    fontSize: 10, color: s.text3, marginTop: 2,
                    opacity: slot.active ? 1 : 0.4,
                  }}>
                    {slot.target}
                  </div>
                  {!slot.active && (
                    <div style={{ fontSize: 10, color: s.text3, marginTop: 2, fontStyle: 'italic' }}>
                      not provided by this page
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
