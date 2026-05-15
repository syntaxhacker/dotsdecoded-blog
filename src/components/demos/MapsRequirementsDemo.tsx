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

interface Requirement {
  id: string
  label: string
  category: 'maps' | 'search' | 'navigation' | 'traffic' | 'geocoding' | 'streetview'
  detail: string
  scale: string
  icon: string
}

const ALL: Requirement[] = [
  { id: 'tiles', label: 'View Map (Tiles)', category: 'maps', detail: 'Serve raster or vector map tiles at 20+ zoom levels. Each tile is a 256x256 image. The client fetches only visible tiles as the user pans and zooms. Tiles are pre-rendered and cached at CDN edges for sub-50ms delivery.', scale: '10B+ tile requests/day', icon: 'M' },
  { id: 'search', label: 'Search Places', category: 'search', detail: 'Full-text search across 150M+ points of interest. Queries support autocomplete, spell correction, and category filters. The search index combines geohash prefix pruning with inverted term index for fast geo-filtered text search.', scale: '1B search queries/day', icon: 'S' },
  { id: 'directions', label: 'Get Directions', category: 'navigation', detail: 'Compute shortest/fastest routes between any two points on the global road graph (1B+ edges). Supports multiple transport modes: driving, walking, cycling, transit. Route computation must complete in under 500ms p95.', scale: '100M route requests/day', icon: 'D' },
  { id: 'traffic', label: 'Real-Time Traffic', category: 'traffic', detail: 'Overlay live traffic conditions on the map. Color-code roads: green (free-flow), yellow (moderate), red (congested). Data comes from GPS probes, road sensors, and historical patterns. Updated every 1-2 minutes.', scale: '100M+ GPS probes/hour', icon: 'T' },
  { id: 'nearby', label: 'Nearby Search', category: 'search', detail: 'Find points of interest within a radius: "restaurants near me". Uses geohash prefix to prune the search space, then exact distance filtering. Returns results sorted by a blend of distance and popularity.', scale: '500M nearby queries/day', icon: 'N' },
  { id: 'geocode', label: 'Geocoding / Reverse', category: 'geocoding', detail: 'Forward geocoding: address text to latitude/longitude. Reverse geocoding: lat/lng to structured address (street, city, state, postal code, country). Powered by n-gram address index and quadtree polygon containment.', scale: '60M geocode requests/day', icon: 'G' },
  { id: 'streetview', label: 'Street View', category: 'streetview', detail: '360-degree panoramic imagery captured by a fleet of 5,000+ cars. Each panorama is stitched from 8 fisheye lenses, blurred for privacy, and served as tiled JPEGs. Depth maps enable rough 3D reconstruction.', scale: '200+ PB imagery', icon: 'V' },
  { id: 'eta', label: 'ETA Prediction', category: 'navigation', detail: 'Machine-learned model predicting arrival time. Features: traffic speed, time-of-day, weather, road class, local events, driver behavior. Returns a confidence band: "Arriving in 15-20 min" with 95% accuracy.', scale: '100M ETAs predicted/day', icon: 'E' },
]

const CATS: Record<string, { label: string; color: string }> = {
  maps: { label: 'Map Rendering', color: s.accent },
  search: { label: 'Search & Discovery', color: s.green },
  navigation: { label: 'Navigation', color: s.orange },
  traffic: { label: 'Traffic', color: s.yellow },
  geocoding: { label: 'Geocoding', color: s.purple },
  streetview: { label: 'Street View', color: s.red },
}

export default function MapsRequirementsDemo() {
  const [selected, setSelected] = useState<string | null>(null)

  const active = ALL.find(r => r.id === selected)

  return (
    <DemoBoundary name="Maps Requirements">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={SEC}>
          <div style={H}>System Requirements</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {ALL.map(r => {
              const cat = CATS[r.category]
              const isActive = selected === r.id
              return (
                <div key={r.id} onClick={() => setSelected(isActive ? null : r.id)}
                  style={{
                    padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                    background: isActive ? `${cat.color}15` : s.bg,
                    border: `1px solid ${isActive ? cat.color : s.border}`,
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `${cat.color}20`, color: cat.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: s.mono, fontSize: 16, fontWeight: 700, flexShrink: 0,
                  }}>
                    {r.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: cat.color, fontFamily: s.mono }}>{cat.label}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {active && (
            <div style={{
              background: s.bg, borderRadius: 10, padding: 16,
              border: `1px solid ${CATS[active.category].color}40`,
              transition: 'all 0.3s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: CATS[active.category].color }}>
                  {active.label}
                </div>
                <div style={{
                  fontSize: 10, fontFamily: s.mono, padding: '3px 10px', borderRadius: 4,
                  background: `${s.yellow}15`, color: s.yellow, border: `1px solid ${s.yellow}30`,
                }}>
                  {active.scale}
                </div>
              </div>
              <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.7 }}>{active.detail}</div>
            </div>
          )}

          {!active && (
            <div style={{ textAlign: 'center', padding: 20, color: s.text3, fontSize: 13 }}>
              Click any requirement card for details
            </div>
          )}

          <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Categories</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {Object.entries(CATS).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: s.text3 }}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
