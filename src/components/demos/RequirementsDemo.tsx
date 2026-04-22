import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

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

interface Req {
  id: string
  text: string
  category: 'functional' | 'non-functional'
  priority: 'must' | 'should' | 'nice'
  enabled: boolean
}

const initialReqs: Req[] = [
  { id: 'f1', text: 'Shorten a long URL into a short code', category: 'functional', priority: 'must', enabled: true },
  { id: 'f2', text: 'Redirect short URL to original', category: 'functional', priority: 'must', enabled: true },
  { id: 'f3', text: 'Custom alias support', category: 'functional', priority: 'should', enabled: true },
  { id: 'f4', text: 'Click analytics (location, referrer, browser)', category: 'functional', priority: 'should', enabled: true },
  { id: 'f5', text: 'Link expiration', category: 'functional', priority: 'nice', enabled: true },
  { id: 'f6', text: 'Bulk shortening', category: 'functional', priority: 'nice', enabled: false },
  { id: 'nf1', text: 'High availability (99.9%+ uptime)', category: 'non-functional', priority: 'must', enabled: true },
  { id: 'nf2', text: 'Low latency redirect (<50ms p99)', category: 'non-functional', priority: 'must', enabled: true },
  { id: 'nf3', text: 'Scalable to billions of URLs', category: 'non-functional', priority: 'must', enabled: true },
  { id: 'nf4', text: 'Data durability (no lost links)', category: 'non-functional', priority: 'must', enabled: true },
  { id: 'nf5', text: 'Predictable performance under load', category: 'non-functional', priority: 'should', enabled: true },
  { id: 'nf6', text: 'Multi-region deployment', category: 'non-functional', priority: 'nice', enabled: false },
]

const priorityOrder = { must: 0, should: 1, nice: 2 } as const
const priorityLabel = { must: 'MUST', should: 'SHOULD', nice: 'NICE' }
const priorityColor: Record<string, string> = { must: s.red, should: s.yellow, nice: s.green }

function nextPriority(current: 'must' | 'should' | 'nice'): 'must' | 'should' | 'nice' {
  const order: ('must' | 'should' | 'nice')[] = ['must', 'should', 'nice']
  return order[(order.indexOf(current) + 1) % 3]
}

export default function RequirementsDemo() {
  const [reqs, setReqs] = useState<Req[]>(initialReqs)

  const toggleReq = (id: string) => {
    setReqs(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const cyclePriority = (id: string) => {
    setReqs(prev => prev.map(r => r.id === id ? { ...r, priority: nextPriority(r.priority) } : r))
  }

  const enabled = reqs.filter(r => r.enabled)
  const functional = enabled.filter(r => r.category === 'functional')
  const nonFunctional = enabled.filter(r => r.category === 'non-functional')
  const mustCount = enabled.filter(r => r.priority === 'must').length
  const shouldCount = enabled.filter(r => r.priority === 'should').length
  const niceCount = enabled.filter(r => r.priority === 'nice').length

  return (
    <DemoBoundary name="Requirements Gathering">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontFamily: s.mono, color: s.text2 }}>Toggle requirements and set priorities</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 12, fontFamily: s.mono }}>
              <span style={{ color: s.red }}>{mustCount} MUST</span>
              <span style={{ color: s.yellow }}>{shouldCount} SHOULD</span>
              <span style={{ color: s.green }}>{niceCount} NICE</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 380px', minWidth: 300, padding: 16, borderRight: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.accent, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Functional</div>
              {reqs.filter(r => r.category === 'functional').sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 4,
                  borderRadius: 6, background: r.enabled ? 'rgba(91,141,239,0.06)' : 'transparent',
                  opacity: r.enabled ? 1 : 0.4, transition: 'all 0.2s',
                }}>
                  <button onClick={() => toggleReq(r.id)} style={{
                    width: 18, height: 18, borderRadius: 4, border: `2px solid ${r.enabled ? s.accent : s.border}`,
                    background: r.enabled ? s.accent : 'transparent', cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {r.enabled && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>x</span>}
                  </button>
                  <span style={{ fontSize: 13, color: s.text, flex: 1 }}>{r.text}</span>
                  <button onClick={() => cyclePriority(r.id)} style={{
                    fontSize: 10, fontFamily: s.mono, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                    border: `1px solid ${priorityColor[r.priority]}`,
                    background: 'transparent', color: priorityColor[r.priority], fontWeight: 600,
                  }}>
                    {priorityLabel[r.priority]}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ flex: '1 1 380px', minWidth: 300, padding: 16 }}>
              <div style={{ fontSize: 12, fontFamily: s.mono, color: s.purple, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Non-Functional</div>
              {reqs.filter(r => r.category === 'non-functional').sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 4,
                  borderRadius: 6, background: r.enabled ? 'rgba(155,123,234,0.06)' : 'transparent',
                  opacity: r.enabled ? 1 : 0.4, transition: 'all 0.2s',
                }}>
                  <button onClick={() => toggleReq(r.id)} style={{
                    width: 18, height: 18, borderRadius: 4, border: `2px solid ${r.enabled ? s.purple : s.border}`,
                    background: r.enabled ? s.purple : 'transparent', cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {r.enabled && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>x</span>}
                  </button>
                  <span style={{ fontSize: 13, color: s.text, flex: 1 }}>{r.text}</span>
                  <button onClick={() => cyclePriority(r.id)} style={{
                    fontSize: 10, fontFamily: s.mono, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                    border: `1px solid ${priorityColor[r.priority]}`,
                    background: 'transparent', color: priorityColor[r.priority], fontWeight: 600,
                  }}>
                    {priorityLabel[r.priority]}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '14px 16px', borderTop: `1px solid ${s.border}`, background: s.bg }}>
            <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>SUMMARY</div>
            <div style={{ display: 'flex', gap: 24, fontSize: 13, fontFamily: s.mono, flexWrap: 'wrap' }}>
              <span>{enabled.length} requirements enabled</span>
              <span style={{ color: s.accent }}>{functional.length} functional</span>
              <span style={{ color: s.purple }}>{nonFunctional.length} non-functional</span>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
