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

interface Layer {
  name: string
  components: string[]
  color: string
  active: boolean
}

const layers: Layer[] = [
  { name: 'Crawling', components: ['Seed URLs', 'URL Frontier', 'Fetcher Pool', 'Link Extractor', 'Bloom Filter'], color: s.accent, active: false },
  { name: 'Indexing', components: ['Content Store', 'Document Processor', 'Tokenizer', 'Indexer Workers', 'Segment Store'], color: s.green, active: false },
  { name: 'Serving', components: ['Load Balancer', 'Query Parser', 'Index Shards', 'Score Workers', 'Result Cache'], color: s.purple, active: false },
  { name: 'Storage', components: ['Raw Content (S3)', 'Compressed Index', 'Doc Metadata', 'Redis Cache', 'Bigtable'], color: s.orange, active: false },
]

export default function SearchArchitectureDemo() {
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null)

  return (
    <DemoBoundary name="Search Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>Search Engine Architecture</div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
        Four-layer architecture. Hover a layer to highlight its components and see how data flows through the system.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {layers.map((layer, li) => (
          <div key={layer.name}
            onMouseEnter={() => setHoveredLayer(li)}
            onMouseLeave={() => setHoveredLayer(null)}
            style={{
              background: hoveredLayer === li ? layer.color + '22' : s.bg2,
              border: `1px solid ${hoveredLayer === li ? layer.color : s.border}`,
              borderRadius: 12, padding: '14px 18px',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ color: layer.color, fontSize: 14, fontWeight: 600 }}>{layer.name} Layer</div>
              <svg width={16} height={16} viewBox="0 0 16 16" style={{ transform: hoveredLayer === li ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <path d="M4 6l4 4 4-4" stroke={layer.color} strokeWidth={2} fill="none" />
              </svg>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {layer.components.map((comp, ci) => (
                <span key={ci} style={{
                  background: hoveredLayer === li ? layer.color + '33' : s.bg3,
                  color: hoveredLayer === li ? '#fff' : s.text2,
                  border: `1px solid ${hoveredLayer === li ? layer.color : s.border}`,
                  borderRadius: 6, padding: '4px 10px', fontSize: 11, fontFamily: s.mono,
                  transition: 'all 0.2s',
                }}>{comp}</span>
              ))}
            </div>

            {hoveredLayer === li && li < layers.length - 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                <svg width={120} height={20}>
                  <line x1={0} y1={10} x2={120} y2={10} stroke={s.border2} strokeWidth={2} strokeDasharray="4 3" />
                  <polygon points="118,6 120,10 118,14" fill={s.border2} />
                  <text x={60} y={8} textAnchor="middle" fill={s.border2} fontSize={8} fontFamily={s.mono}>data flow</text>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: s.accent }} />
          <span style={{ color: s.text3, fontSize: 11 }}>Crawling</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: s.green }} />
          <span style={{ color: s.text3, fontSize: 11 }}>Indexing</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: s.purple }} />
          <span style={{ color: s.text3, fontSize: 11 }}>Serving</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: s.orange }} />
          <span style={{ color: s.text3, fontSize: 11 }}>Storage</span>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
