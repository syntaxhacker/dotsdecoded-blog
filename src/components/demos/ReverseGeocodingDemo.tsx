import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const GRID = 16
const CELL = 28

interface Polygon {
  name: string
  type: 'country' | 'state' | 'city' | 'neighborhood' | 'street'
  points: { x: number; y: number }[]
  color: string
  address?: string
  postalCode?: string
}

const POLYGONS: Polygon[] = [
  {
    name: 'United States', type: 'country',
    points: [{ x: 4, y: 1 }, { x: 15, y: 1 }, { x: 15, y: 12 }, { x: 4, y: 12 }],
    color: s.accent,
  },
  {
    name: 'California', type: 'state',
    points: [{ x: 4, y: 5 }, { x: 7, y: 5 }, { x: 7, y: 11 }, { x: 4, y: 11 }],
    color: s.green,
  },
  {
    name: 'San Francisco', type: 'city',
    points: [{ x: 4.5, y: 5.5 }, { x: 6.5, y: 5.5 }, { x: 6.5, y: 7.5 }, { x: 4.5, y: 7.5 }],
    color: s.orange,
  },
  {
    name: 'SoMa', type: 'neighborhood',
    points: [{ x: 4.8, y: 6.2 }, { x: 6.2, y: 6.2 }, { x: 6.2, y: 7.2 }, { x: 4.8, y: 7.2 }],
    color: s.purple,
  },
  {
    name: '855 Brannan St', type: 'street',
    points: [{ x: 5.2, y: 6.6 }, { x: 5.9, y: 6.6 }, { x: 5.9, y: 6.9 }, { x: 5.2, y: 6.9 }],
    color: s.yellow,
    address: '855 Brannan St, San Francisco, CA 94103',
    postalCode: '94103',
  },
]

const PT_DATA: { id: string; label: string; x: number; y: number }[] = [
  { id: 'sf', label: 'SF City Hall', x: 5.3, y: 6.8 },
  { id: 'oak', label: 'Oakland Airport', x: 6.8, y: 6.5 },
  { id: 'sj', label: 'San Jose', x: 6.0, y: 9.5 },
  { id: 'la', label: 'Los Angeles', x: 5.5, y: 10.5 },
  { id: 'nyc', label: 'New York', x: 13, y: 4 },
]

function pointInPolygon(px: number, py: number, polygon: { x: number; y: number }[]): boolean {
  let inside = false
  const n = polygon.length
  let j = n - 1
  for (let i = 0; i < n; i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
    j = i
  }
  return inside
}

interface QuadTreeCell {
  x: number; y: number; w: number; h: number
  depth: number
  polygons: Polygon[]
  children: QuadTreeCell[] | null
}

function buildSpatialIndex(polygons: Polygon[]): QuadTreeCell {
  function subdivide(cell: QuadTreeCell): QuadTreeCell {
    if (cell.depth >= 4 || cell.w < 1) {
      cell.polygons = polygons.filter(p =>
        p.points.some(pt =>
          pt.x >= cell.x && pt.x < cell.x + cell.w &&
          pt.y >= cell.y && pt.y < cell.y + cell.h
        )
      )
      return cell
    }
    const hw = cell.w / 2
    const hh = cell.h / 2
    cell.children = [
      { x: cell.x, y: cell.y, w: hw, h: hh, depth: cell.depth + 1, polygons: [], children: null },
      { x: cell.x + hw, y: cell.y, w: hw, h: hh, depth: cell.depth + 1, polygons: [], children: null },
      { x: cell.x, y: cell.y + hh, w: hw, h: hh, depth: cell.depth + 1, polygons: [], children: null },
      { x: cell.x + hw, y: cell.y + hh, w: hw, h: hh, depth: cell.depth + 1, polygons: [], children: null },
    ]
    for (const child of cell.children) {
      subdivide(child)
    }
    return cell
  }
  return subdivide({ x: 0, y: 0, w: GRID, h: GRID, depth: 0, polygons: [], children: null })
}

function findContainingCell(
  tree: QuadTreeCell, px: number, py: number,
): { polygons: Polygon[]; path: QuadTreeCell[] } {
  const path: QuadTreeCell[] = [tree]
  if (tree.children) {
    for (const child of tree.children) {
      if (px >= child.x && px < child.x + child.w && py >= child.y && py < child.y + child.h) {
        const deeper = findContainingCell(child, px, py)
        path.push(...deeper.path)
        break
      }
    }
  }
  const containing = POLYGONS.filter(p => pointInPolygon(px, py, p.points))
  return { polygons: containing, path }
}

const SVG_W = GRID * CELL
const SVG_H = GRID * CELL

export default function ReverseGeocodingDemo() {
  const [clicked, setClicked] = useState<{ x: number; y: number } | null>(null)
  const [highlightedPoly, setHighlightedPoly] = useState<string | null>(null)

  const tree = useMemo(() => buildSpatialIndex(POLYGONS), [])

  const handleClick = (gx: number, gy: number) => {
    setClicked({ x: gx, y: gy })
  }

  const result = clicked
    ? findContainingCell(tree, clicked.x, clicked.y)
    : null

  return (
    <DemoBoundary name="Reverse Geocoding">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 14, letterSpacing: -0.3 }}>Reverse Geocoding</div>

          <p style={{ color: s.text2, fontSize: 13, margin: '0 0 14px', lineHeight: 1.5 }}>
            Click any location on the map. The system finds the containing polygon at each administrative level
            (country, state, city, neighborhood, street address) using quadtree spatial indexing.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 8, overflow: 'hidden' }}>
              <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
                {POLYGONS.map((poly, i) => {
                  const pts = poly.points
                  const isHighlighted = highlightedPoly === poly.name || (result && result.polygons.includes(poly))
                  const fill = isHighlighted ? `${poly.color}30` : `${poly.color}08`
                  return (
                    <polygon key={i}
                      points={pts.map(p => `${p.x * CELL},${p.y * CELL}`).join(' ')}
                      fill={fill}
                      stroke={isHighlighted ? poly.color : `${poly.color}40`}
                      strokeWidth={isHighlighted ? 2 : 0.8}
                      strokeDasharray={poly.type === 'country' ? '4 3' : 'none'}
                      onMouseEnter={() => setHighlightedPoly(poly.name)}
                      onMouseLeave={() => setHighlightedPoly(null)}
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    />
                  )
                })}
                {PT_DATA.map(pt => (
                  <g key={pt.id} onClick={() => handleClick(Math.round(pt.x), Math.round(pt.y))} style={{ cursor: 'pointer' }}>
                    <circle cx={pt.x * CELL} cy={pt.y * CELL} r={4}
                      fill={clicked && Math.abs(clicked.x - pt.x) < 1 && Math.abs(clicked.y - pt.y) < 1 ? s.accent : s.text3}
                      stroke={s.bg2} strokeWidth={1.5} />
                    <text x={pt.x * CELL + 7} y={pt.y * CELL + 2}
                      fill={s.text3} fontSize={7} fontFamily={s.mono}>{pt.label}</text>
                  </g>
                ))}
                {clicked && (
                  <g>
                    <circle cx={clicked.x * CELL} cy={clicked.y * CELL} r={6}
                      fill={s.accent} stroke="#fff" strokeWidth={2} />
                    <line x1={clicked.x * CELL - 10} y1={clicked.y * CELL} x2={clicked.x * CELL + 10} y2={clicked.y * CELL}
                      stroke="#fff" strokeWidth={1.5} />
                    <line x1={clicked.x * CELL} y1={clicked.y * CELL - 10} x2={clicked.x * CELL} y2={clicked.y * CELL + 10}
                      stroke="#fff" strokeWidth={1.5} />
                  </g>
                )}
              </svg>
              <div style={{ fontSize: 10, color: s.text3, marginTop: 6, textAlign: 'center', fontFamily: s.mono }}>
                Click a location or preset point
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result && result.polygons.length > 0 ? (
                <div style={{ background: s.bg, border: `1px solid ${s.accent}40`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 11, color: s.text3, marginBottom: 8, fontFamily: s.mono, textTransform: 'uppercase', letterSpacing: 1 }}>Address Components</div>
                  {result.polygons.slice().reverse().map((poly, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '5px 0', borderBottom: i < result.polygons.length - 1 ? `1px solid ${s.bg3}` : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: poly.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: s.text }}>{poly.name}</div>
                          <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, textTransform: 'capitalize' }}>{poly.type}</div>
                        </div>
                      </div>
                      {poly.postalCode && (
                        <div style={{ fontSize: 11, fontFamily: s.mono, color: s.yellow }}>{poly.postalCode}</div>
                      )}
                    </div>
                  ))}
                  {(() => {
                    const street = result.polygons.find(p => p.address)
                    return street ? (
                      <div style={{ marginTop: 8, padding: '6px 10px', background: `${s.yellow}10`, borderRadius: 6, border: `1px solid ${s.yellow}30` }}>
                        <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, marginBottom: 2 }}>Full Address</div>
                        <div style={{ fontSize: 12, fontFamily: s.mono, color: s.yellow }}>{street.address}</div>
                      </div>
                    ) : null
                  })()}
                </div>
              ) : (
                <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: s.text3, marginBottom: 6 }}>Click a location</div>
                  <div style={{ fontSize: 11, color: s.text3 }}>The system finds the containing administrative boundaries using quadtree spatial indexing.</div>
                </div>
              )}

              <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, fontFamily: s.mono, textTransform: 'uppercase', letterSpacing: 1 }}>Spatial Index Lookup</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10, fontFamily: s.mono, color: s.text3 }}>
                  {result ? (
                    <>
                      <div>1. Point received: ({clicked!.x}, {clicked!.y})</div>
                      <div>2. QuadTree: {result.path.length} cells traversed</div>
                      <div>3. Found {result.polygons.length} containing polygons</div>
                      <div>4. Ray-cast: {result.polygons.length} point-in-polygon checks</div>
                      <div style={{ color: s.green, marginTop: 4 }}>5. Address resolved</div>
                    </>
                  ) : (
                    <>
                      <div>1. Point received: (?, ?)</div>
                      <div>2. QuadTree: searching...</div>
                      <div>3. Waiting for input</div>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {PT_DATA.map(pt => (
                  <button key={pt.id} onClick={() => handleClick(Math.round(pt.x), Math.round(pt.y))} style={{
                    padding: '4px 10px', borderRadius: 4, border: `1px solid ${s.border}`,
                    background: s.bg3, color: s.text2, fontSize: 10, cursor: 'pointer', fontFamily: s.mono,
                  }}>
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
