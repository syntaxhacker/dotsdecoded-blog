import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-css'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const patterns = [
  {
    name: 'Centering',
    code: `.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}`,
    render: () => (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120, background: s.bg3, borderRadius: 6 }}>
        <div style={{ width: 60, height: 60, background: s.accent, borderRadius: 8 }} />
      </div>
    ),
  },
  {
    name: 'Navbar',
    code: `nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}`,
    render: () => (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', height: 50, background: s.bg3, borderRadius: 6 }}>
        <div style={{ width: 40, height: 20, background: s.accent, borderRadius: 4 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          {['Home', 'About', 'Contact'].map(t => (
            <div key={t} style={{ padding: '4px 10px', fontSize: 11, fontFamily: s.mono, color: s.text2, borderRadius: 4, background: s.bg2 }}>{t}</div>
          ))}
        </div>
      </div>
    ),
  },
  {
    name: 'Holy Grail',
    code: `.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.main {
  display: flex;
  flex: 1;
}
.sidebar {
  width: 200px;
}`,
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', height: 200, background: s.bg3, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ height: 32, background: s.accent, borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: s.mono, color: s.bg }}>header</div>
        <div style={{ flex: 1, display: 'flex' }}>
          <div style={{ width: 60, background: s.purple, borderRight: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: s.mono, color: s.bg }}>side</div>
          <div style={{ flex: 1, background: s.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: s.mono, color: s.text3 }}>main</div>
        </div>
        <div style={{ height: 28, background: s.orange, borderTop: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: s.mono, color: s.bg }}>footer</div>
      </div>
    ),
  },
  {
    name: 'Equal Columns',
    code: `.columns {
  display: flex;
  gap: 16px;
}
.column {
  flex: 1;
}`,
    render: () => (
      <div style={{ display: 'flex', gap: 8, height: 120, background: s.bg3, borderRadius: 6, padding: 12 }}>
        {[s.accent, s.green, s.yellow].map((c, i) => (
          <div key={i} style={{ flex: 1, background: c, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: s.mono, color: s.bg }}>
            flex: 1
          </div>
        ))}
      </div>
    ),
  },
  {
    name: 'Card Grid',
    code: `.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.card {
  flex: 1 1 140px;
}`,
    render: () => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, background: s.bg3, borderRadius: 6, padding: 12 }}>
        {[s.accent, s.green, s.yellow, s.purple, s.orange].map((c, i) => (
          <div key={i} style={{ flex: '1 1 80px', background: c, borderRadius: 6, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: s.mono, color: s.bg }}>
            Card {i + 1}
          </div>
        ))}
      </div>
    ),
  },
]

export default function FlexPatternsDemo() {
  const [tab, setTab] = useState(0)
  const p = patterns[tab]

  const highlighted = useMemo(() => Prism.highlight(p.code, Prism.languages.css, 'css'), [tab])

  return (
    <DemoBoundary name="Flex Patterns">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
          {patterns.map((pt, i) => (
            <button
              key={pt.name}
              onClick={() => setTab(i)}
              style={{
                background: i === tab ? s.accent : s.bg3,
                color: i === tab ? s.bg : s.text2,
                border: `1px solid ${i === tab ? s.accent : s.border}`,
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 11,
                fontFamily: s.mono,
                cursor: 'pointer',
              }}
            >
              {pt.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Preview</div>
            {p.render()}
          </div>
          <div>
            <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>CSS</div>
            <style>{`
              .flexpat-code .token.selector { color: #a6e22e; }
              .flexpat-code .token.property { color: #66d9ef; }
              .flexpat-code .token.value { color: #e6db74; }
              .flexpat-code .token.punctuation { color: #f8f8f2; }
              .flexpat-code .token.comment { color: #75715e; font-style: italic; }
            `}</style>
            <div className="flexpat-code" style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 11, lineHeight: 1.6, color: s.text, background: s.bg2, padding: 12, borderRadius: 6, border: `1px solid ${s.border}`, overflowX: 'auto' }}>
              <code dangerouslySetInnerHTML={{ __html: highlighted }} />
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
