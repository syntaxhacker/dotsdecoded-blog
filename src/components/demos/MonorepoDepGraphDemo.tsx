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

interface PkgInfo {
  label: string
  x: number
  y: number
  deps: string[]
}

const PKGS: Record<string, PkgInfo> = {
  utils: { label: 'utils', x: 120, y: 260, deps: [] },
  shared: { label: 'shared', x: 360, y: 260, deps: [] },
  ui: { label: 'ui', x: 120, y: 170, deps: ['utils', 'shared'] },
  api: { label: 'api', x: 360, y: 170, deps: ['utils', 'shared'] },
  app1: { label: 'app1', x: 120, y: 80, deps: ['ui', 'utils'] },
  app2: { label: 'app2', x: 360, y: 80, deps: ['ui', 'api'] },
}

const PKG_NAMES = Object.keys(PKGS)

const DEPENDENTS: Record<string, string[]> = {}
for (const name of PKG_NAMES) DEPENDENTS[name] = []
for (const [name, info] of Object.entries(PKGS)) {
  for (const dep of info.deps) {
    DEPENDENTS[dep].push(name)
  }
}

function getAffected(name: string): Set<string> {
  const affected = new Set<string>([name])
  const queue = [name]
  while (queue.length > 0) {
    const cur = queue.shift()!
    for (const dep of DEPENDENTS[cur]) {
      if (!affected.has(dep)) {
        affected.add(dep)
        queue.push(dep)
      }
    }
  }
  return affected
}

const EDGES: { from: string; to: string }[] = []
for (const [name, info] of Object.entries(PKGS)) {
  for (const dep of info.deps) {
    EDGES.push({ from: dep, to: name })
  }
}

export default function MonorepoDepGraphDemo() {
  const [changed, setChanged] = useState<string | null>(null)
  const [affected, setAffected] = useState<Set<string>>(new Set())

  const handleNodeClick = (name: string) => {
    if (changed === name) {
      setChanged(null)
      setAffected(new Set())
    } else {
      setChanged(name)
      setAffected(getAffected(name))
    }
  }

  const NW = 120
  const NH = 44

  const edgeColor = (from: string, to: string) => {
    if (!changed) return s.border2
    if (from === changed && affected.has(to)) return s.accent
    if (to === changed && affected.has(from)) return s.accent
    if (affected.has(from) && affected.has(to)) return s.yellow
    return s.border2
  }

  const legendItems = [
    { color: s.border, label: 'Unchanged' },
    { color: s.accent, label: 'Changed' },
    { color: s.yellow, label: 'Affected' },
  ]

  return (
    <DemoBoundary name="Monorepo Dependency Graph">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Dependency Graph</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Click any package to see which other packages are affected when it changes.
          The graph shows dependencies flowing upward -- arrows point from dependency to dependent.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <svg width="520" height="340" viewBox="0 0 520 340" style={{ display: 'block' }}>
            {EDGES.map(edge => {
              const from = PKGS[edge.from]
              const to = PKGS[edge.to]
              const x1 = from.x + NW / 2
              const y1 = from.y + NH
              const x2 = to.x + NW / 2
              const y2 = to.y
              const midY = (y1 + y2) / 2
              const eColor = edgeColor(edge.from, edge.to)
              return (
                <g key={`${edge.from}->${edge.to}`}>
                  <path
                    d={`M ${x1} ${y1} C ${x1} ${midY} ${x2} ${midY} ${x2} ${y2}`}
                    fill="none" stroke={eColor} strokeWidth={2}
                    strokeDasharray={eColor === s.border2 ? '5,3' : 'none'}
                    style={{ transition: 'stroke 0.4s' }}
                  />
                  <polygon
                    points={`${x2 - 5},${y2 - 2} ${x2 + 5},${y2 - 2} ${x2},${y2 + 6}`}
                    fill={eColor} style={{ transition: 'fill 0.4s' }}
                  />
                </g>
              )
            })}

            {PKG_NAMES.map(name => {
              const pkg = PKGS[name]
              const isChanged = changed === name
              const isAffected = affected.has(name) && !isChanged
              const bColor = isChanged ? s.accent : isAffected ? s.yellow : s.border
              const bgColor = isChanged ? `${s.accent}22` : isAffected ? `${s.yellow}15` : s.bg3
              const tColor = isChanged ? s.accent : isAffected ? s.yellow : s.text
              return (
                <g key={name} onClick={() => handleNodeClick(name)} style={{ cursor: 'pointer' }}>
                  <rect x={pkg.x} y={pkg.y} width={NW} height={NH} rx={8} ry={8}
                    fill={bgColor} stroke={bColor} strokeWidth={isChanged || isAffected ? 2.5 : 1.5}
                    style={{ transition: 'all 0.3s' }}
                  />
                  {isChanged && (
                    <rect x={pkg.x - 2} y={pkg.y - 2} width={NW + 4} height={NH + 4} rx={10} ry={10}
                      fill="none" stroke={s.accent} strokeWidth={1.5} opacity={0.5}
                    >
                      <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
                    </rect>
                  )}
                  <text x={pkg.x + NW / 2} y={pkg.y + NH / 2 + 1}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={tColor} fontSize={13} fontWeight={600}
                    fontFamily={s.mono}
                  >
                    {pkg.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 16 }}>
          {legendItems.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} />
              <span style={{ color: s.text2, fontSize: 12 }}>{item.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {PKG_NAMES.map(name => (
            <button key={name} onClick={() => handleNodeClick(name)} style={{
              background: changed === name ? `${s.accent}22` : s.bg3,
              border: `1px solid ${changed === name ? s.accent : s.border}`,
              borderRadius: 6, padding: '6px 14px',
              color: changed === name ? s.accent : s.text2,
              cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
              transition: 'all 0.2s',
            }}>
              {PKGS[name].label}
            </button>
          ))}
          {changed && (
            <button onClick={() => { setChanged(null); setAffected(new Set()) }} style={{
              background: s.bg3, border: `1px solid ${s.border}`,
              borderRadius: 6, padding: '6px 14px',
              color: s.text2, cursor: 'pointer', fontSize: 12,
            }}>Clear</button>
          )}
        </div>

        {changed ? (
          <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Impact Analysis
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Array.from(affected).sort().map(name => {
                const isCh = name === changed
                return (
                  <span key={name} style={{
                    background: isCh ? `${s.accent}22` : `${s.yellow}15`,
                    border: `1px solid ${isCh ? s.accent : s.yellow}`,
                    borderRadius: 6, padding: '4px 10px',
                    color: isCh ? s.accent : s.yellow,
                    fontFamily: s.mono, fontSize: 12,
                  }}>
                    {isCh ? `${PKGS[name].label} (changed)` : `${PKGS[name].label} (affected)`}
                  </span>
                )
              })}
            </div>
            <div style={{ color: s.text2, fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
              {affected.size === 1
                ? `${PKGS[changed].label} is a leaf package -- no other packages depend on it. Changes are isolated.`
                : `Changing ${PKGS[changed].label} affects ${affected.size - 1} ${affected.size - 1 === 1 ? 'package' : 'packages'} transitively. ${affected.size - 1} task${affected.size - 1 === 1 ? '' : 's'} need${affected.size - 1 === 1 ? 's' : ''} re-execution.`}
            </div>
          </div>
        ) : (
          <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
            <div style={{ color: s.text3, fontSize: 12, lineHeight: 1.5 }}>
              Click a package to simulate a change and see the dependency impact. Packages that depend on the changed package
              (directly or transitively) must be rebuilt or retested.
            </div>
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
