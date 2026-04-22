import { useState, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type Pt = { id: number; x: number; y: number; hash: string }

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

function geohashEncode(x: number, y: number, len: number): string {
  let latMin = 0, latMax = 1, lngMin = 0, lngMax = 1
  let hash = ''
  let bits = 0
  let combined = 0
  for (let i = 0; i < len * 5; i++) {
    if (i % 2 === 0) {
      const mid = (lngMin + lngMax) / 2
      if (x >= mid) { combined = combined * 2 + 1; lngMin = mid } else { combined = combined * 2; lngMax = mid }
    } else {
      const mid = (latMin + latMax) / 2
      if (y >= mid) { combined = combined * 2 + 1; latMin = mid } else { combined = combined * 2; latMax = mid }
    }
    bits++
    if (bits === 5) { hash += BASE32[combined]; bits = 0; combined = 0 }
  }
  return hash
}

const GRID = 16
const CELL = 28

export default function GeoIndexDemo() {
  const [mode, setMode] = useState<'geohash' | 'quadtree'>('geohash')
  const [points, setPoints] = useState<Pt[]>([])
  const [queryPt, setQueryPt] = useState<{ x: number; y: number } | null>(null)
  const [hashLen, setHashLen] = useState(4)
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null)

  const handleClick = useCallback((gx: number, gy: number) => {
    const nx = gx / GRID
    const ny = gy / GRID
    const hash = geohashEncode(nx, ny, hashLen)
    if (!queryPt) {
      setQueryPt({ x: gx, y: gy })
    } else {
      setPoints((prev) => [...prev, { id: prev.length + 1, x: gx, y: gy, hash }])
    }
  }, [queryPt, hashLen])

  const handleReset = () => {
    setPoints([])
    setQueryPt(null)
  }

  const queryHash = queryPt ? geohashEncode(queryPt.x / GRID, queryPt.y / GRID, hashLen) : ''
  const nearby = points.filter((p) => p.hash.startsWith(queryHash.slice(0, hashLen - 1)))
  const inRange = points.filter((p) => {
    if (!queryPt) return false
    const dx = p.x - queryPt.x
    const dy = p.y - queryPt.y
    return Math.sqrt(dx * dx + dy * dy) <= 4
  })

  const getGeoColor = (gx: number, gy: number) => {
    const prefix = geohashEncode(gx / GRID, gy / GRID, hashLen - 1)
    if (!queryHash) return s.bg3
    if (queryHash.startsWith(prefix)) return `${s.accent}22`
    return s.bg3
  }

  const getQuadColor = (gx: number, gy: number, depth: number) => {
    if (queryPt) {
      const sameQuad = depth === 0
        ? Math.floor(gx / 8) === Math.floor(queryPt.x / 8) && Math.floor(gy / 8) === Math.floor(queryPt.y / 8)
        : depth === 1
          ? Math.floor(gx / 4) === Math.floor(queryPt.x / 4) && Math.floor(gy / 4) === Math.floor(queryPt.y / 4)
          : Math.floor(gx / 2) === Math.floor(queryPt.x / 2) && Math.floor(gy / 2) === Math.floor(queryPt.y / 2)
      if (sameQuad) return `${s.green}22`
    }
    return s.bg3
  }

  const svgW = GRID * CELL
  const svgH = GRID * CELL

  return (
    <DemoBoundary name="Geospatial Indexing">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['geohash', 'quadtree'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); handleReset() }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 6, border: 'none',
                background: mode === m ? s.accent : s.bg3, color: mode === m ? '#fff' : s.text2,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              {m === 'geohash' ? 'Geohash' : 'QuadTree'}
            </button>
          ))}
          {mode === 'geohash' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
              <span style={{ fontSize: 12, color: s.text3 }}>Precision:</span>
              {[3, 4, 5, 6].map((v) => (
                <button key={v} onClick={() => { setHashLen(v); setPoints([]); setQueryPt(null) }}
                  style={{
                    padding: '4px 10px', borderRadius: 4, border: `1px solid ${s.border}`,
                    background: hashLen === v ? s.accent : s.bg2, color: hashLen === v ? '#fff' : s.text2,
                    fontSize: 12, cursor: 'pointer', fontFamily: s.mono,
                  }}
                >{v}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16 }}>
          <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 12, overflow: 'hidden' }}>
            <svg width={svgW} height={svgH} style={{ display: 'block' }}>
              {Array.from({ length: GRID }, (_, gy) =>
                Array.from({ length: GRID }, (_, gx) => {
                  const fill = mode === 'geohash' ? getGeoColor(gx, gy) : getQuadColor(gx, gy, hashLen - 3)
                  const isHover = hoverCell && hoverCell.x === gx && hoverCell.y === gy
                  return (
                    <rect key={`${gx}-${gy}`} x={gx * CELL} y={gy * CELL} width={CELL} height={CELL}
                      fill={fill} stroke={s.border} strokeWidth={0.5}
                      onMouseEnter={() => setHoverCell({ x: gx, y: gy })}
                      onMouseLeave={() => setHoverCell(null)}
                      onClick={() => handleClick(gx, gy)}
                      style={{ cursor: 'pointer', transition: 'fill 0.15s' }}
                    />
                  )
                })
              )}
              {mode === 'quadtree' && queryPt && (
                <>
                  <line x1={8 * CELL} y1={0} x2={8 * CELL} y2={svgH} stroke={s.green} strokeWidth={1.5} opacity={0.6} />
                  <line x1={0} y1={8 * CELL} x2={svgW} y2={8 * CELL} stroke={s.green} strokeWidth={1.5} opacity={0.6} />
                  <line x1={Math.floor(queryPt.x / 8) * 8 * CELL + (queryPt.x % 8 >= 4 ? 4 * CELL : 0)} y1={Math.floor(queryPt.y / 8) * 8 * CELL} x2={Math.floor(queryPt.x / 8) * 8 * CELL + (queryPt.x % 8 >= 4 ? 4 * CELL : 0)} y2={(Math.floor(queryPt.y / 8) + 1) * 8 * CELL} stroke={s.green} strokeWidth={1} opacity={0.4} />
                </>
              )}
              {queryPt && (
                <>
                  <circle cx={queryPt.x * CELL + CELL / 2} cy={queryPt.y * CELL + CELL / 2} r={CELL * 4}
                    fill="none" stroke={s.accent} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} />
                  <circle cx={queryPt.x * CELL + CELL / 2} cy={queryPt.y * CELL + CELL / 2} r={7}
                    fill={s.accent} stroke={s.bg2} strokeWidth={2} />
                </>
              )}
              {points.map((p) => {
                const found = inRange.some((f) => f.id === p.id)
                return (
                  <g key={p.id}>
                    <circle cx={p.x * CELL + CELL / 2} cy={p.y * CELL + CELL / 2} r={6}
                      fill={found ? s.green : s.red} stroke={s.bg2} strokeWidth={2} />
                    <text x={p.x * CELL + CELL / 2} y={p.y * CELL + CELL / 2 + 1}
                      textAnchor="middle" dominantBaseline="middle"
                      fill="#fff" fontSize={7} fontWeight={700} fontFamily={s.mono}>
                      {p.id}
                    </text>
                  </g>
                )
              })}
            </svg>
            <div style={{ fontSize: 11, color: s.text3, marginTop: 8, textAlign: 'center' }}>
              {!queryPt ? 'Click to place query point' : 'Click to add drivers'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {queryPt && (
              <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 6 }}>Query Point</div>
                <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3 }}>
                  Cell: ({queryPt.x}, {queryPt.y})
                </div>
                {mode === 'geohash' && (
                  <div style={{ fontSize: 12, fontFamily: s.mono, color: s.accent, marginTop: 4 }}>
                    Geohash: {queryHash}
                  </div>
                )}
              </div>
            )}

            {points.length > 0 && (
              <div style={{ background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 6 }}>
                  Indexed Drivers ({points.length})
                </div>
                {points.map((p) => {
                  const found = inRange.some((f) => f.id === p.id)
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${s.bg3}` }}>
                      <span style={{ fontSize: 12, fontFamily: s.mono, color: found ? s.green : s.text3 }}>
                        D{p.id} ({p.x},{p.y})
                      </span>
                      {mode === 'geohash' && (
                        <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>{p.hash}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {queryPt && points.length > 0 && (
              <div style={{ background: s.bg2, border: `1px solid ${s.green}44`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.green, marginBottom: 6 }}>
                  Nearby: {inRange.length} / {points.length}
                </div>
                <div style={{ fontSize: 12, color: s.text2 }}>
                  {mode === 'geohash'
                    ? `Drivers sharing prefix "${queryHash.slice(0, hashLen - 1)}"`
                    : 'Drivers in same quadrant within radius'}
                </div>
              </div>
            )}

            <button onClick={handleReset} style={{
              padding: '8px 0', borderRadius: 6, border: `1px solid ${s.border}`,
              background: s.bg3, color: s.text2, fontSize: 13, cursor: 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
