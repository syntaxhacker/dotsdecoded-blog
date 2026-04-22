import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const flexCode = `.page {
  display: flex;
  flex-direction: column;
}
.body {
  display: flex;
  flex: 1;
}
.sidebar {
  width: 200px;
}
.main {
  flex: 1;
}`

const gridCode = `.page {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns:
    200px 1fr;
  grid-template-rows:
    50px 1fr 40px;
  min-height: 100vh;
}`

function renderLayout(mode: 'flex' | 'grid', sidebarW: number) {
  if (mode === 'grid') {
    return (
      <div style={{
        display: 'grid',
        gridTemplateAreas: '"header header" "sidebar main" "footer footer"',
        gridTemplateColumns: `${sidebarW}px 1fr`,
        gridTemplateRows: '40px 1fr 32px',
        gap: 6,
        height: 240,
      }}>
        <div style={{ gridArea: 'header', background: s.accent, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: s.mono, color: s.bg }}>header</div>
        <div style={{ gridArea: 'sidebar', background: s.purple, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: s.mono, color: s.bg, transition: 'all 0.2s' }}>sidebar</div>
        <div style={{ gridArea: 'main', background: s.bg3, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: s.mono, color: s.text3 }}>main content</div>
        <div style={{ gridArea: 'footer', background: s.orange, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: s.mono, color: s.bg }}>footer</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 240, gap: 6 }}>
      <div style={{ height: 40, background: s.accent, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: s.mono, color: s.bg }}>header</div>
      <div style={{ flex: 1, display: 'flex', gap: 6 }}>
        <div style={{ width: sidebarW, background: s.purple, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: s.mono, color: s.bg, transition: 'all 0.2s', flexShrink: 0 }}>sidebar</div>
        <div style={{ flex: 1, background: s.bg3, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: s.mono, color: s.text3 }}>main content</div>
      </div>
      <div style={{ height: 32, background: s.orange, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: s.mono, color: s.bg }}>footer</div>
    </div>
  )
}

export default function FlexVsGridDemo() {
  const [sidebarW, setSidebarW] = useState(160)
  const [showCode, setShowCode] = useState(false)

  return (
    <DemoBoundary name="Flexbox vs Grid">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text2 }}>Sidebar width:</span>
          <input type="range" min={80} max={260} value={sidebarW} onChange={e => setSidebarW(+e.target.value)} style={{ width: 180, accentColor: s.accent }} />
          <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>{sidebarW}px</span>
          <button onClick={() => setShowCode(v => !v)} style={codeBtnStyle}>
            {showCode ? 'Hide Code' : 'Show Code'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.accent, fontFamily: s.mono, marginBottom: 10 }}>Flexbox</div>
            <div style={{ background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`, padding: 12 }}>
              {renderLayout('flex', sidebarW)}
            </div>
            {showCode && (
              <style>{`
                .fvg-flex .token.keyword { color: #f92672; }
                .fvg-flex .token.property { color: #66d9ef; }
                .fvg-flex .token.value { color: #e6db74; }
                .fvg-flex .token.selector { color: #a6e22e; }
                .fvg-flex .token.punctuation { color: #f8f8f2; }
              `}</style>
            )}
            {showCode && (
              <div className="fvg-flex" style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 10, lineHeight: 1.5, color: s.text, background: s.bg, padding: 10, borderRadius: 6, border: `1px solid ${s.border}`, marginTop: 8, overflowX: 'auto' }}>
                <code dangerouslySetInnerHTML={{ __html: useMemo(() => Prism.highlight(flexCode, Prism.languages.css, 'css'), []) }} />
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.green, fontFamily: s.mono, marginBottom: 10 }}>Grid</div>
            <div style={{ background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`, padding: 12 }}>
              {renderLayout('grid', sidebarW)}
            </div>
            {showCode && (
              <style>{`
                .fvg-grid .token.keyword { color: #f92672; }
                .fvg-grid .token.property { color: #66d9ef; }
                .fvg-grid .token.value { color: #e6db74; }
                .fvg-grid .token.selector { color: #a6e22e; }
                .fvg-grid .token.punctuation { color: #f8f8f2; }
              `}</style>
            )}
            {showCode && (
              <div className="fvg-grid" style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 10, lineHeight: 1.5, color: s.text, background: s.bg, padding: 10, borderRadius: 6, border: `1px solid ${s.border}`, marginTop: 8, overflowX: 'auto' }}>
                <code dangerouslySetInnerHTML={{ __html: useMemo(() => Prism.highlight(gridCode, Prism.languages.css, 'css'), []) }} />
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 16, background: s.bg2, borderRadius: 8, padding: 14, border: `1px solid ${s.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: s.text2, marginBottom: 8 }}>Key Difference</div>
          <div style={{ fontSize: 12, lineHeight: 1.7, color: s.text3 }}>
            Flexbox needs nested containers (one for column direction, one for row). Grid defines the entire layout in one declaration with named areas. Grid is cleaner for page-level layouts. Flexbox is simpler for single-axis component alignment.
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

const codeBtnStyle: React.CSSProperties = {
  background: s.bg3,
  color: s.text2,
  border: `1px solid ${s.border}`,
  borderRadius: 6,
  padding: '4px 10px',
  fontSize: 11,
  fontFamily: s.mono,
  cursor: 'pointer',
  marginLeft: 'auto',
}
