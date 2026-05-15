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

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

function geohashEncode(x: number, y: number, len: number): string {
  let latMin = 0, latMax = 1, lngMin = 0, lngMax = 1
  let hash = ''
  let bits = 0
  let combined = 0
  for (let i = 0; i < len * 5; i++) {
    if (i % 2 === 0) {
      const mid = (lngMin + lngMax) / 2
      if (x >= mid) { combined = combined * 2 + 1; lngMin = mid }
      else { combined = combined * 2; lngMax = mid }
    } else {
      const mid = (latMin + latMax) / 2
      if (y >= mid) { combined = combined * 2 + 1; latMin = mid }
      else { combined = combined * 2; latMax = mid }
    }
    bits++
    if (bits === 5) { hash += BASE32[combined]; bits = 0; combined = 0 }
  }
  return hash
}

const GRID = 20
const CELL = 24

const SAMPLE_POINTS = [
  { label: 'SF', x: 2, y: 7 }, { label: 'Oakland', x: 4, y: 7.5 },
  { label: 'SJ', x: 2, y: 10 }, { label: 'Palo Alto', x: 2.5, y: 9.2 },
  { label: 'Berkeley', x: 3.5, y: 6.5 }, { label: 'NYC', x: 13, y: 7 },
  { label: 'Brooklyn', x: 13.5, y: 8 }, { label: 'London', x: 16.5, y: 2.5 },
  { label: 'Paris', x: 17, y: 3.5 }, { label: 'Tokyo', x: 6.5, y: 14 },
  { label: 'Sydney', x: 14, y: 16.5 }, { label: 'Mumbai', x: 10.5, y: 12.5 },
]

export default function GeohashDemo() {
  const [precision, setPrecision] = useState(3)
  const [clicked, setClicked] = useState<{ x: number; y: number; nx: number; ny: number } | null>(null)
  const [hovered, setHovered] = useState<{ x: number; y: number } | null>(null)

  const handleClick = useCallback((gx: number, gy: number) => {
    const nx = gx / GRID
    const ny = gy / GRID
    setClicked({ x: gx, y: gy, nx, ny })
  }, [])

  const hash = clicked ? geohashEncode(clicked.nx, clicked.ny, 8) : ''
  const prefixLen = precision

  const cellColor = (gx: number, gy: number) => {
    if (!clicked) return s.bg3
    const cHash = geohashEncode(gx / GRID, gy / GRID, prefixLen)
    const baseHash = geohashEncode(clicked.nx, clicked.ny, prefixLen)
    if (cHash === baseHash) return `${s.accent}30`
    if (cHash.slice(0, prefixLen - 1) === baseHash.slice(0, prefixLen - 1)) return `${s.green}18`
    return s.bg3
  }

  const svgW = GRID * CELL
  const svgH = GRID * CELL

  return (
    <DemoBoundary name="Geohash Explorer">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.text, letterSpacing: -0.3 }}>Geohash Explorer</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[2, 3, 4, 5, 6].map(v => (
                <button key={v} onClick={() => { setPrecision(v); setClicked(null) }}
                  style={{
                    padding: '4px 10px', borderRadius: 4, border: `1px solid ${s.border}`,
                    background: precision === v ? s.accent : s.bg, color: precision === v ? '#fff' : s.text2,
                    fontSize: 11, fontFamily: s.mono, cursor: 'pointer',
                  }}
                >Prec {v}</button>
              ))}
            </div>
          </div>

          <p style={{ color: s.text2, fontSize: 13, margin: '0 0 14px', lineHeight: 1.5 }}>
            Click a location on the map to see its geohash. Nearby locations share common prefixes.
            Increase precision to see finer-grained cells.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 8, overflow: 'hidden' }}>
              <svg width={svgW} height={svgH} style={{ display: 'block' }}>
                {Array.from({ length: GRID }, (_, gy) =>
                  Array.from({ length: GRID }, (_, gx) => {
                    const fill = cellColor(gx, gy)
                    const isHover = hovered && hovered.x === gx && hovered.y === gy
                    return (
                      <rect key={`${gx}-${gy}`} x={gx * CELL} y={gy * CELL} width={CELL} height={CELL}
                        fill={fill} stroke={s.border} strokeWidth={0.3}
                        onMouseEnter={() => setHovered({ x: gx, y: gy })}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => handleClick(gx, gy)}
                        style={{ cursor: 'pointer', transition: 'fill 0.1s' }}
                      />
                    )
                  })
                )}
                {SAMPLE_POINTS.map((pt, i) => {
                  const isSameCell = clicked &&
                    geohashEncode(pt.x / GRID, pt.y / GRID, prefixLen) ===
                    geohashEncode(clicked.nx, clicked.ny, prefixLen)
                  const isNearby = clicked &&
                    geohashEncode(pt.x / GRID, pt.y / GRID, prefixLen - 1) ===
                    geohashEncode(clicked.nx, clicked.ny, prefixLen - 1) &&
                    !isSameCell
                  return (
                    <g key={i}>
                      <circle cx={pt.x * CELL + CELL / 2} cy={pt.y * CELL + CELL / 2} r={3}
                        fill={isSameCell ? s.accent : isNearby ? s.green : s.text3}
                        stroke={s.bg2} strokeWidth={1.5}
                        onClick={() => handleClick(Math.round(pt.x), Math.round(pt.y))}
                        style={{ cursor: 'pointer' }}
                      />
                      <text x={pt.x * CELL + CELL / 2} y={pt.y * CELL + CELL / 2 - 5}
                        textAnchor="middle" fill={isSameCell ? s.accent : s.text3}
                        fontSize={7} fontFamily={s.mono} fontWeight={isSameCell ? 700 : 400}>
                        {pt.label}
                      </text>
                    </g>
                  )
                })}
                {clicked && (
                  <circle cx={clicked.x * CELL + CELL / 2} cy={clicked.y * CELL + CELL / 2} r={8}
                    fill="none" stroke={s.accent} strokeWidth={2} strokeDasharray="4 3" />
                )}
                {hovered && (
                  <rect x={hovered.x * CELL} y={hovered.y * CELL} width={CELL} height={CELL}
                    fill="none" stroke={s.accent} strokeWidth={1.5} strokeDasharray="3 2" />
                )}
              </svg>
              <div style={{ fontSize: 10, color: s.text3, marginTop: 6, textAlign: 'center', fontFamily: s.mono }}>
                Click a dot or cell
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {clicked && (
                <>
                  <div style={{ background: s.bg, border: `1px solid ${s.accent}40`, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, fontFamily: s.mono, textTransform: 'uppercase', letterSpacing: 1 }}>Clicked Location</div>
                    <div style={{ fontSize: 12, color: s.text2, fontFamily: s.mono, marginBottom: 4 }}>
                      ({clicked.nx.toFixed(3)}, {clicked.ny.toFixed(3)})
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.accent, fontFamily: s.mono, letterSpacing: 2 }}>
                      {hash.slice(0, precision)}
                      <span style={{ color: s.text3, fontWeight: 400 }}>{hash.slice(precision)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                      {Array.from(hash.slice(0, precision)).map((ch, i) => (
                        <span key={i} style={{
                          padding: '2px 6px', borderRadius: 3, fontSize: 10, fontFamily: s.mono,
                          background: `${s.accent}20`, color: s.accent, border: `1px solid ${s.accent}30`,
                        }}>
                          {ch}
                        </span>
                      ))}
                      {hash.slice(precision).split('').map((ch, i) => (
                        <span key={i} style={{
                          padding: '2px 6px', borderRadius: 3, fontSize: 10, fontFamily: s.mono,
                          background: s.bg3, color: s.text3, border: `1px solid ${s.border}`,
                        }}>
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, fontFamily: s.mono, textTransform: 'uppercase', letterSpacing: 1 }}>Sharing Cell (Same Prefix)</div>
                    {SAMPLE_POINTS.filter(pt =>
                      geohashEncode(pt.x / GRID, pt.y / GRID, prefixLen) ===
                      geohashEncode(clicked.nx, clicked.ny, prefixLen) &&
                      pt.x !== clicked.x && pt.y !== clicked.y
                    ).map(pt => (
                      <div key={pt.label} style={{ fontSize: 12, fontFamily: s.mono, color: s.accent, padding: '3px 0' }}>
                        {pt.label}: {geohashEncode(pt.x / GRID, pt.y / GRID, prefixLen)}
                      </div>
                    ))}
                    {SAMPLE_POINTS.filter(pt =>
                      geohashEncode(pt.x / GRID, pt.y / GRID, prefixLen) ===
                      geohashEncode(clicked.nx, clicked.ny, prefixLen) &&
                      pt.x !== clicked.x && pt.y !== clicked.y
                    ).length === 0 && (
                      <div style={{ fontSize: 12, color: s.text3 }}>No other points at this precision</div>
                    )}
                  </div>

                  <div style={{ background: s.bg, border: `1px solid ${s.green}30`, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, fontFamily: s.mono, textTransform: 'uppercase', letterSpacing: 1 }}>Precision: {(1 / Math.pow(2, Math.floor(precision * 5 / 2))).toFixed(4)} deg</div>
                    <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.5 }}>
                      Cell size decreases by 32x per character. At precision {precision}, cells span approximately{' '}
                      {(180 / Math.pow(2, Math.ceil(precision * 5 / 2))).toFixed(2)} degrees longitude.
                    </div>
                  </div>
                </>
              )}

              {!clicked && (
                <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: s.text3, marginBottom: 8 }}>Click a location to see its geohash</div>
                  <div style={{ fontSize: 11, color: s.text3, lineHeight: 1.5 }}>
                    Precision controls how many characters the geohash has.<br />
                    More characters = smaller cell = higher precision.
                  </div>
                </div>
              )}

              <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: s.text3, marginBottom: 6, fontFamily: s.mono, textTransform: 'uppercase', letterSpacing: 1 }}>How Geohash Works</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.accent, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: s.text2 }}>Alternates between longitude and latitude bits</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.green, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: s.text2 }}>Each character encodes 5 bits (32 values)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.yellow, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: s.text2 }}>Longer prefix = physically closer locations</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
