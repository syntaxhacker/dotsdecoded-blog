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
    name: 'Responsive Grid',
    code: `.grid {
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}`,
    render: (width: number) => {
      const cols = Math.max(1, Math.floor((width - 16) / 80))
      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(80px, 1fr))`, gap: 8 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{
              background: [s.accent, s.green, s.yellow, s.purple, s.orange, s.red][i],
              borderRadius: 6,
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: s.bg,
              fontWeight: 700,
              fontSize: 12,
              fontFamily: s.mono,
            }}>
              {cols} col{cols !== 1 ? 's' : ''}
            </div>
          ))}
        </div>
      )
    },
    hasWidth: true,
  },
  {
    name: 'Dashboard',
    code: `.dashboard {
  display: grid;
  grid-template-areas:
    "header  header  header"
    "sidebar content content"
    "footer  footer  footer";
  grid-template-columns:
    200px 1fr 1fr;
  grid-template-rows:
    50px 1fr 40px;
  gap: 8px;
}`,
    render: () => (
      <div style={{
        display: 'grid',
        gridTemplateAreas: '"header header header" "sidebar content content" "footer footer footer"',
        gridTemplateColumns: '80px 1fr 1fr',
        gridTemplateRows: '36px 1fr 28px',
        gap: 6,
        height: 180,
      }}>
        <div style={{ gridArea: 'header', background: s.accent, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: s.mono, color: s.bg }}>header</div>
        <div style={{ gridArea: 'sidebar', background: s.purple, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: s.mono, color: s.bg }}>sidebar</div>
        <div style={{ gridArea: 'content', background: s.bg3, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: s.mono, color: s.text3 }}>content</div>
        <div style={{ gridArea: 'footer', background: s.orange, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: s.mono, color: s.bg }}>footer</div>
      </div>
    ),
    hasWidth: false,
  },
  {
    name: 'Bento Layout',
    code: `.bento {
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  grid-auto-rows: 80px;
  gap: 12px;
}
.featured {
  grid-column: span 2;
  grid-row: span 2;
}`,
    render: () => (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridAutoRows: '50px',
        gap: 6,
      }}>
        <div style={{ gridColumn: 'span 2', gridRow: 'span 2', background: s.accent, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: s.mono, color: s.bg }}>span 2x2</div>
        <div style={{ background: s.green, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: s.mono, color: s.bg }}>1x1</div>
        <div style={{ background: s.yellow, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: s.mono, color: s.bg }}>1x1</div>
        <div style={{ gridColumn: 'span 2', background: s.purple, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: s.mono, color: s.bg }}>span 2x1</div>
        <div style={{ background: s.orange, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: s.mono, color: s.bg }}>1x1</div>
      </div>
    ),
    hasWidth: false,
  },
]

export default function GridPatternsDemo() {
  const [tab, setTab] = useState(0)
  const [simWidth, setSimWidth] = useState(400)
  const p = patterns[tab]

  const highlighted = useMemo(() => Prism.highlight(p.code, Prism.languages.css, 'css'), [tab])

  return (
    <DemoBoundary name="Grid Patterns">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
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

        {p.hasWidth && (
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text2 }}>Simulated width:</span>
            <input type="range" min={160} max={780} value={simWidth} onChange={e => setSimWidth(+e.target.value)} style={{ width: 200, accentColor: s.accent }} />
            <span style={{ fontSize: 10, fontFamily: s.mono, color: s.text3 }}>{simWidth}px</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Preview</div>
            <div style={{
              width: p.hasWidth ? simWidth : undefined,
              background: s.bg3,
              borderRadius: 6,
              padding: 10,
              overflow: 'hidden',
              transition: 'width 0.2s',
            }}>
              {p.render(simWidth)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>CSS</div>
            <style>{`
              .gridpat-code .token.selector { color: #a6e22e; }
              .gridpat-code .token.property { color: #66d9ef; }
              .gridpat-code .token.value { color: #e6db74; }
              .gridpat-code .token.punctuation { color: #f8f8f2; }
              .gridpat-code .token.comment { color: #75715e; font-style: italic; }
            `}</style>
            <div className="gridpat-code" style={{ whiteSpace: 'pre', fontFamily: s.mono, fontSize: 11, lineHeight: 1.6, color: s.text, background: s.bg2, padding: 12, borderRadius: 6, border: `1px solid ${s.border}`, overflowX: 'auto' }}>
              <code dangerouslySetInnerHTML={{ __html: highlighted }} />
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
