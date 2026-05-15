import React, { useState } from 'react'
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

interface Page {
  id: string
  pr: number
  outbound: string[]
  inbound: string[]
}

function createGraph(): Page[] {
  return [
    { id: 'A', pr: 0.25, outbound: ['B', 'C'], inbound: ['C', 'D'] },
    { id: 'B', pr: 0.25, outbound: ['C'], inbound: ['A', 'D'] },
    { id: 'C', pr: 0.25, outbound: ['A'], inbound: ['A', 'B'] },
    { id: 'D', pr: 0.25, outbound: ['A', 'B'], inbound: [] },
  ]
}

function computePageRank(pages: Page[], damping: number): Page[] {
  const n = pages.length
  const pr: Record<string, number> = {}
  pages.forEach(p => { pr[p.id] = p.pr })
  const next: Record<string, number> = {}
  pages.forEach(p => {
    let sum = 0
    p.inbound.forEach(srcId => {
      const src = pages.find(x => x.id === srcId)!
      sum += (pr[srcId] || 0) / src.outbound.length
    })
    next[p.id] = (1 - damping) / n + damping * sum
  })
  return pages.map(p => ({ ...p, pr: next[p.id] }))
}

export default function PageRankDemo() {
  const [pages, setPages] = useState<Page[]>(createGraph)
  const [iterations, setIterations] = useState(0)
  const [damping, setDamping] = useState(0.85)

  const iterate = () => {
    setPages(prev => computePageRank(prev, damping))
    setIterations(i => i + 1)
  }

  const reset = () => {
    setPages(createGraph())
    setIterations(0)
  }

  const total = pages.reduce((s, p) => s + p.pr, 0)

  return (
    <DemoBoundary name="PageRank">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>PageRank Simulation</div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
        Four pages with inbound links. Each iteration redistributes rank. Damping factor controls random-surfer reset probability.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: s.text2, fontSize: 12 }}>Damping:</span>
          <input type="range" min={0.5} max={0.95} step={0.05} value={damping}
            onChange={e => setDamping(parseFloat(e.target.value))}
            style={{ width: 100, accentColor: s.accent }} />
          <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>{damping.toFixed(2)}</span>
        </div>
        <button onClick={iterate} style={{ background: s.accent, border: 'none', borderRadius: 8, padding: '8px 20px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Iterate</button>
        <button onClick={reset} style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 20px', color: s.text2, cursor: 'pointer', fontSize: 13 }}>Reset</button>
        <span style={{ color: s.text3, fontSize: 11 }}>Iterations: {iterations}</span>
        <span style={{ color: s.text3, fontSize: 11 }}>Sum: {total.toFixed(4)}</span>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        {pages.map(p => (
          <div key={p.id} style={{
            background: s.bg2, borderRadius: 12, padding: '16px 20px',
            border: `1px solid ${s.border}`, textAlign: 'center', minWidth: 100,
          }}>
            <div style={{ color: s.accent, fontSize: 24, fontWeight: 700, fontFamily: s.mono }}>{p.id}</div>
            <div style={{ color: s.text, fontSize: 18, fontWeight: 600, fontFamily: s.mono, marginTop: 4 }}>
              {p.pr.toFixed(4)}
            </div>
            <div style={{ color: s.text3, fontSize: 10, marginTop: 8 }}>
              Out: {p.outbound.join(', ')}
            </div>
            <div style={{ color: s.text3, fontSize: 10 }}>
              In: {p.inbound.length > 0 ? p.inbound.join(', ') : 'none'}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: s.bg2, borderRadius: 10, padding: 14, border: `1px solid ${s.border}` }}>
        <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Graph</div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontSize: 11, color: s.text2, flexWrap: 'wrap' }}>
          {pages.map(p => (
            <React.Fragment key={p.id}>
              <span style={{ color: s.accent, fontWeight: 600 }}>{p.id}</span>
              {p.outbound.map((target, i) => (
                <React.Fragment key={i}>
                  <span style={{ color: s.border2 }}>→</span>
                  <span style={{ color: s.green }}>{target}</span>
                </React.Fragment>
              ))}
              <span style={{ color: s.border, margin: '0 8px' }}>|</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
