import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface AuditIssue {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  weight: number
  beforeSnippet: string
  afterSnippet: string
  fixed: boolean
}

const initialIssues: AuditIssue[] = [
  {
    id: 'images',
    title: 'Unoptimized images',
    description: 'Large raster images are served at full resolution instead of using responsive sizes and modern formats like WebP or AVIF.',
    impact: 'high',
    weight: 25,
    beforeSnippet: '<img src="hero.jpg" alt="Hero">',
    afterSnippet: '<img src="hero.webp" alt="Hero" srcset="hero-400.webp 400w, hero-800.webp 800w" sizes="(max-width: 600px) 400px, 800px">',
    fixed: false,
  },
  {
    id: 'css',
    title: 'Render-blocking CSS',
    description: 'External stylesheets block the initial render. Inline critical CSS and defer non-critical styles.',
    impact: 'high',
    weight: 20,
    beforeSnippet: '<link rel="stylesheet" href="styles.css">',
    afterSnippet: '<style>/* critical CSS inline */</style>\n<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">',
    fixed: false,
  },
  {
    id: 'dims',
    title: 'Missing image dimensions',
    description: 'Images without explicit width/height attributes cause Cumulative Layout Shift when they load.',
    impact: 'medium',
    weight: 15,
    beforeSnippet: '<img src="photo.jpg" alt="Photo">',
    afterSnippet: '<img src="photo.jpg" alt="Photo" width="800" height="600">',
    fixed: false,
  },
  {
    id: 'font',
    title: 'No font-display strategy',
    description: 'Custom web fonts cause invisible text (FOIT) during load. Use font-display: swap or optional.',
    impact: 'medium',
    weight: 15,
    beforeSnippet: '@font-face {\n  font-family: "Custom";\n  src: url("custom.woff2");\n}',
    afterSnippet: '@font-face {\n  font-family: "Custom";\n  src: url("custom.woff2");\n  font-display: swap;\n}',
    fixed: false,
  },
  {
    id: 'preconnect',
    title: 'No preconnect to origins',
    description: 'Connections to third-party origins (CDN, analytics, fonts) are established lazily, adding DNS + TCP + TLS latency.',
    impact: 'low',
    weight: 10,
    beforeSnippet: '<!-- no preconnect for third-party origins -->',
    afterSnippet: '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://analytics.example.com">',
    fixed: false,
  },
]

export default function PerfAuditDemo() {
  const [issues, setIssues] = useState<AuditIssue[]>(initialIssues)
  const [animatingId, setAnimatingId] = useState<string | null>(null)

  const toggleIssue = (id: string) => {
    setAnimatingId(id)
    setIssues(prev => prev.map(issue =>
      issue.id === id ? { ...issue, fixed: !issue.fixed } : issue
    ))
    setTimeout(() => setAnimatingId(null), 600)
  }

  const reset = () => {
    setIssues(initialIssues.map(i => ({ ...i })))
  }

  const totalBefore = issues.reduce((sum, i) => sum + (i.fixed ? 0 : i.weight), 0)
  const totalAfter = issues.reduce((sum, i) => sum + (i.fixed ? i.weight : 0), 0)
  const baseScore = 100
  const beforeScore = Math.max(0, baseScore - totalBefore)
  const afterScore = Math.max(0, baseScore - (totalBefore - totalAfter))

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return s.red
      case 'medium': return s.yellow
      case 'low': return s.accent
      default: return s.text3
    }
  }

  return (
    <DemoBoundary name="Performance Audit">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Performance Audit</div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: s.text2, fontSize: 12, marginBottom: 12 }}>Issues Found</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {issues.map(issue => (
                <div key={issue.id} style={{
                  background: issue.fixed ? `${s.green}10` : s.bg,
                  border: `1px solid ${issue.fixed ? s.green : animatingId === issue.id ? s.accent : s.border}`,
                  borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                  transition: 'all 0.3s',
                  opacity: animatingId === issue.id ? 0.7 : 1,
                }} onClick={() => toggleIssue(issue.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4,
                        background: issue.fixed ? s.green : s.bg3,
                        border: `2px solid ${issue.fixed ? s.green : s.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: '#fff', fontWeight: 700,
                        transition: 'all 0.3s',
                      }}>
                        {issue.fixed ? 'v' : ''}
                      </div>
                      <span style={{ color: issue.fixed ? s.green : s.text, fontSize: 13, fontWeight: 600 }}>{issue.title}</span>
                    </div>
                    <div style={{
                      background: getImpactColor(issue.impact), borderRadius: 4,
                      padding: '1px 8px', fontSize: 9, color: '#fff', fontWeight: 600,
                      textTransform: 'uppercase',
                    }}>
                      {issue.impact}
                    </div>
                  </div>
                  <p style={{ color: s.text3, fontSize: 12, margin: '0 0 8px 26px', lineHeight: 1.4 }}>{issue.description}</p>
                  <div style={{ marginLeft: 26 }}>
                    <div style={{
                      background: s.bg2, borderRadius: 6, padding: '6px 10px',
                      fontFamily: s.mono, fontSize: 11, color: issue.fixed ? s.green : s.red,
                      whiteSpace: 'pre-wrap', lineHeight: 1.5,
                    }}>
                      {issue.fixed ? issue.afterSnippet : issue.beforeSnippet}
                    </div>
                    <div style={{ color: s.text3, fontSize: 10, marginTop: 4 }}>
                      {issue.fixed ? 'Fixed' : `-${issue.weight} pts`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ width: 200 }}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 16, marginBottom: 12, textAlign: 'center' }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Performance Score</div>

              <div style={{ position: 'relative', width: 120, height: 72, margin: '0 auto 12px', overflow: 'hidden' }}>
                <svg width="120" height="72" viewBox="0 0 120 72">
                  <path d="M 10 66 A 50 50 0 0 1 110 66" fill="none" stroke={s.bg3} strokeWidth="10" strokeLinecap="round" />
                  <path
                    d="M 10 66 A 50 50 0 0 1 110 66"
                    fill="none"
                    stroke={afterScore >= 90 ? s.green : afterScore >= 50 ? s.yellow : s.red}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(afterScore / 100) * 157} 157`}
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                </svg>
              </div>

              <div style={{ fontSize: 32, fontWeight: 700, fontFamily: s.mono, color: afterScore >= 90 ? s.green : afterScore >= 50 ? s.yellow : s.red, marginBottom: 4 }}>
                {afterScore}
              </div>
              <div style={{ color: s.text3, fontSize: 11 }}>out of 100</div>

              <div style={{ borderTop: `1px solid ${s.border}`, marginTop: 12, paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: s.red, fontSize: 11 }}>Before</span>
                  <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 12 }}>{beforeScore}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: s.green, fontSize: 11 }}>After</span>
                  <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 12 }}>{afterScore}</span>
                </div>
                {totalAfter > 0 && (
                  <div style={{ marginTop: 8, background: `${s.green}20`, borderRadius: 6, padding: '4px 8px' }}>
                    <span style={{ color: s.green, fontSize: 11, fontFamily: s.mono }}>
                      +{totalAfter} pts from fixes
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button onClick={reset} style={{
              width: '100%', background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px',
              color: s.text2, cursor: 'pointer', fontSize: 12,
            }}>Reset All</button>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>How to Read</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { label: 'High', desc: 'Major impact, fix first', color: s.red },
              { label: 'Medium', desc: 'Significant but not critical', color: s.yellow },
              { label: 'Low', desc: 'Opportunistic improvement', color: s.accent },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                <span style={{ color: s.text2, fontSize: 11 }}>{item.label}: {item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
