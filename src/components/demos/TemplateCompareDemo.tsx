import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import Prism from 'prismjs'
import 'prismjs/components/prism-markup-templating'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-erb'
import 'prismjs/components/prism-ruby'

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

type Tab = 'erb' | 'haml' | 'slim'

const examples: Record<Tab, { code: string; label: string; color: string }> = {
  erb: {
    label: 'ERB',
    color: s.red,
    code: `<h1><%= @post.title %></h1>
<div class="post-body">
  <% if @post.published? %>
    <p><%= @post.body %></p>
    <span>By <%= @post.author.name %></span>
  <% else %>
    <p>This post is a draft.</p>
  <% end %>
</div>
<ul>
  <% @post.comments.each do |c| %>
    <li><%= c.body %></li>
  <% end %>
</ul>`,
  },
  haml: {
    label: 'HAML',
    color: s.yellow,
    code: `%h1= @post.title
.post-body
  - if @post.published?
    %p= @post.body
    %span By #{@post.author.name}
  - else
    %p This post is a draft.
  %ul
    - @post.comments.each do |c|
      %li= c.body`,
  },
  slim: {
    label: 'Slim',
    color: s.green,
    code: `h1 = @post.title
.post-body
  - if @post.published?
    p = @post.body
    span "By #{@post.author.name}"
  - else
    p This post is a draft.
  ul
    - @post.comments.each do |c|
      li = c.body`,
  },
}

const htmlOutput = `<h1>My First Post</h1>
<div class="post-body">
  <p>This is the post content...</p>
  <span>By Jane Developer</span>
</div>
<ul>
  <li>Great post!</li>
  <li>Thanks for sharing.</li>
</ul>`

const htmlOutputHtml = Prism.highlight(htmlOutput, Prism.languages.markup, 'markup')

const features: Record<Tab, string[]> = {
  erb: ['Uses <%= %> for output, <% %> for logic', 'Full Ruby power -- any Ruby code works', 'Familiar to anyone who knows HTML', 'Verbose -- lots of <% %> noise'],
  haml: ['Indentation-based -- no closing tags', 'Uses % for elements, = for output', 'Significant whitespace (like Python)', 'Clean but can be hard to debug indentation'],
  slim: ['Minimal syntax -- fewest characters', 'No % needed for standard tags', 'Fastest rendering of the three', 'Smallest community, fewer gems'],
}

export default function TemplateCompareDemo() {
  const [activeTab, setActiveTab] = useState<Tab>('erb')
  const [showOutput, setShowOutput] = useState(false)

  const current = examples[activeTab]

  const templateHtml = useMemo(() => {
    if (activeTab === 'erb') {
      return Prism.highlight(current.code, Prism.languages.erb, 'erb')
    }
    return Prism.highlight(current.code, Prism.languages.ruby, 'ruby')
  }, [activeTab, current])

  return (
    <DemoBoundary name="Template Engine Comparison">
    <div className="tcc" style={{ background: s.bg, padding: '28px 20px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <style>{`
.tcc code .token.keyword { color: #f92672; }
.tcc code .token.string, .tcc code .token.char, .tcc code .token.builtin, .tcc code .token.inserted { color: #e6db74; }
.tcc code .token.number, .tcc code .token.constant, .tcc code .token.symbol, .tcc code .token.property, .tcc code .token.tag, .tcc code .token.boolean, .tcc code .token.deleted { color: #ae81ff; }
.tcc code .token.selector, .tcc code .token.attr-name { color: #f92672; }
.tcc code .token.attr-value, .tcc code .token.atrule { color: #e6db74; }
.tcc code .token.function, .tcc code .token.class-name { color: #a6e22e; }
.tcc code .token.operator, .tcc code .token.entity, .tcc code .token.url, .tcc code .token.punctuation { color: #f8f8f2; }
.tcc code .token.comment, .tcc code .token.prolog, .tcc code .token.doctype, .tcc code .token.cdata { color: #75715e; font-style: italic; }
.tcc code .token.parameter, .tcc code .token.variable, .tcc code .token.regex, .tcc code .token.important { color: #fd971f; }
      `}</style>
      <div style={{ fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Template Engines Compared</div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(Object.keys(examples) as Tab[]).map((tab) => {
          const ex = examples[tab]
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? ex.color : s.bg2,
                border: `1px solid ${activeTab === tab ? ex.color : s.border}`,
                borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
                color: activeTab === tab ? '#fff' : s.text2,
                fontFamily: s.mono, fontSize: 13, fontWeight: activeTab === tab ? 700 : 400,
                transition: 'all 0.2s ease',
              }}
            >
              {ex.label}
            </button>
          )
        })}
        <button
          onClick={() => setShowOutput(!showOutput)}
          style={{
            background: showOutput ? s.green : s.bg2,
            border: `1px solid ${showOutput ? s.green : s.border}`,
            borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
            color: showOutput ? '#000' : s.text2,
            fontFamily: s.mono, fontSize: 13, fontWeight: showOutput ? 700 : 400,
            transition: 'all 0.2s ease', marginLeft: 'auto',
          }}
        >
          HTML Output
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showOutput ? '1fr 1fr' : '1fr', gap: 12 }}>
        <div style={{ background: s.bg2, borderRadius: 10, padding: '16px 18px', border: `1px solid ${s.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ background: current.color, borderRadius: 4, padding: '2px 8px', fontFamily: s.mono, fontSize: 11, color: '#fff', fontWeight: 700 }}>{current.label}</span>
            <span style={{ color: s.text3, fontSize: 11 }}>Source Template</span>
          </div>
          <div style={{ background: s.bg, borderRadius: 8, padding: '14px 16px', border: `1px solid ${s.border}` }}>
            <div style={{ fontFamily: s.mono, fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre' }}>
              <code dangerouslySetInnerHTML={{ __html: templateHtml }} />
            </div>
          </div>
        </div>

        {showOutput && (
          <div style={{ background: s.bg2, borderRadius: 10, padding: '16px 18px', border: `1px solid ${s.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ background: s.accent, borderRadius: 4, padding: '2px 8px', fontFamily: s.mono, fontSize: 11, color: '#fff', fontWeight: 700 }}>HTML</span>
              <span style={{ color: s.text3, fontSize: 11 }}>Rendered Output (same for all three)</span>
            </div>
            <div style={{ background: s.bg, borderRadius: 8, padding: '14px 16px', border: `1px solid ${s.border}` }}>
              <div style={{ fontFamily: s.mono, fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre' }}>
                <code dangerouslySetInnerHTML={{ __html: htmlOutputHtml }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: s.bg2, borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.border}`, marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: s.text2, marginBottom: 8 }}>{current.label} Characteristics</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {features[activeTab].map((feat, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: s.text2, lineHeight: 1.5 }}>
              <span style={{ color: current.color, marginTop: 1 }}>*</span>
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
