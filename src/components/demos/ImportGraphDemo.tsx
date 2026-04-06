import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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

type ExportInfo = { name: string; reached: boolean }
type ImportRef = { from: string; names: string[] }
type ModuleData = {
  id: string
  name: string
  isEntry: boolean
  exports: ExportInfo[]
  imports: ImportRef[]
  x: number
  y: number
  w: number
  h: number
}
type EdgeData = { from: string; to: string; label: string }

const modulesData: ModuleData[] = [
  {
    id: 'app', name: 'app.js', isEntry: true,
    exports: [],
    imports: [
      { from: 'format', names: ['format'] },
      { from: 'validate', names: ['validate'] },
    ],
    x: 310, y: 15, w: 200, h: 48,
  },
  {
    id: 'format', name: 'format.js', isEntry: false,
    exports: [
      { name: 'format', reached: true },
      { name: 'formatNumber', reached: false },
    ],
    imports: [{ from: 'pad', names: ['padZero'] }],
    x: 70, y: 115, w: 255, h: 72,
  },
  {
    id: 'validate', name: 'validate.js', isEntry: false,
    exports: [
      { name: 'validate', reached: true },
      { name: 'isPhone', reached: false },
    ],
    imports: [{ from: 'regex', names: ['emailRegex'] }],
    x: 495, y: 115, w: 255, h: 72,
  },
  {
    id: 'pad', name: 'pad.js', isEntry: false,
    exports: [
      { name: 'padZero', reached: true },
      { name: 'padLeft', reached: false },
      { name: 'padRight', reached: false },
      { name: 'truncate', reached: false },
    ],
    imports: [],
    x: 40, y: 265, w: 290, h: 96,
  },
  {
    id: 'regex', name: 'regex.js', isEntry: false,
    exports: [
      { name: 'emailRegex', reached: true },
      { name: 'urlRegex', reached: false },
      { name: 'phoneRegex', reached: false },
      { name: 'ipv4Regex', reached: false },
    ],
    imports: [],
    x: 490, y: 265, w: 290, h: 96,
  },
]

const edgesData: EdgeData[] = [
  { from: 'app', to: 'format', label: 'format' },
  { from: 'app', to: 'validate', label: 'validate' },
  { from: 'format', to: 'pad', label: 'padZero' },
  { from: 'validate', to: 'regex', label: 'emailRegex' },
]

const traceSteps = [
  { modules: ['app'], edges: [] as string[] },
  { modules: ['format', 'validate'], edges: ['app-format', 'app-validate'] },
  { modules: ['pad', 'regex'], edges: ['format-pad', 'validate-regex'] },
]

const GW = 820
const GH = 380

export default function ImportGraphDemo() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [traced, setTraced] = useState<Set<string>>(
    () => new Set(modulesData.map(m => m.id)),
  )
  const [tracedEdges, setTracedEdges] = useState<Set<string>>(
    () => new Set(edgesData.map(e => `${e.from}-${e.to}`)),
  )
  const [pulseIds, setPulseIds] = useState<Set<string>>(new Set())
  const [isTracing, setIsTracing] = useState(false)
  const [dimUnreached, setDimUnreached] = useState(true)
  const tracingRef = useRef(false)
  const timersRef = useRef<number[]>([])
  const nodeRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    if (pulseIds.size === 0) return
    pulseIds.forEach(id => {
      const el = nodeRefs.current[id]
      if (!el) return
      el.animate([
        { boxShadow: `0 0 0 0 rgba(61, 214, 140, 0.5)` },
        { boxShadow: `0 0 24px 6px rgba(61, 214, 140, 0.35)` },
        { boxShadow: `0 0 0 0 rgba(61, 214, 140, 0)` },
      ], { duration: 500, easing: 'ease-out' })
    })
  }, [pulseIds])

  useEffect(() => () => {
    timersRef.current.forEach(t => clearTimeout(t))
  }, [])

  const handleTrace = useCallback(() => {
    if (tracingRef.current) return
    tracingRef.current = true
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []

    setIsTracing(true)
    setTraced(new Set())
    setTracedEdges(new Set())
    setDimUnreached(false)
    setSelectedId(null)

    let delay = 0
    traceSteps.forEach((step, idx) => {
      delay += 300
      const t1 = window.setTimeout(() => {
        setTraced(prev => {
          const n = new Set(prev)
          step.modules.forEach(id => n.add(id))
          return n
        })
        setTracedEdges(prev => {
          const n = new Set(prev)
          step.edges.forEach(k => n.add(k))
          return n
        })
        setPulseIds(new Set(step.modules))
        const t2 = window.setTimeout(() => setPulseIds(new Set()), 250)
        timersRef.current.push(t2)
        if (idx === traceSteps.length - 1) {
          const t3 = window.setTimeout(() => {
            setIsTracing(false)
            tracingRef.current = false
            setDimUnreached(true)
          }, 400)
          timersRef.current.push(t3)
        }
      }, delay)
      timersRef.current.push(t1)
    })
  }, [])

  const edgePath = (from: ModuleData, to: ModuleData) => {
    const x1 = from.x + from.w / 2
    const y1 = from.y + from.h
    const x2 = to.x + to.w / 2
    const y2 = to.y
    const my = (y1 + y2) / 2
    return `M ${x1},${y1} C ${x1},${my} ${x2},${my} ${x2},${y2}`
  }

  const selectedMod = useMemo(
    () => (selectedId ? modulesData.find(m => m.id === selectedId) ?? null : null),
    [selectedId],
  )

  const importedBy = useMemo(() => {
    if (!selectedId) return []
    return modulesData
      .filter(m => m.imports.some(imp => imp.from === selectedId))
      .map(m => ({
        name: m.name,
        names: m.imports.find(imp => imp.from === selectedId)!.names,
      }))
  }, [selectedId])

  const ff = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

  return (
    <DemoBoundary name="Import Dependency Graph">
      <div style={{ maxWidth: 820, fontFamily: ff }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}>
          <span style={{ color: s.text2, fontSize: 13 }}>
            Click on modules to see what the bundler traces
          </span>
          <button
            onClick={handleTrace}
            disabled={isTracing}
            style={{
              background: isTracing ? s.bg3 : s.accent,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 12,
              fontFamily: s.mono,
              cursor: isTracing ? 'default' : 'pointer',
              opacity: isTracing ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            Trace from Entry
          </button>
        </div>

        <div style={{
          position: 'relative',
          width: GW,
          height: GH,
          background: s.bg,
          borderRadius: 12,
          border: `1px solid ${s.border}`,
          overflow: 'hidden',
          userSelect: 'none',
        }}>
          <svg
            width={GW}
            height={GH}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          >
            <defs>
              <marker id="ah" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={s.border} />
              </marker>
              <marker id="ahg" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={s.green} />
              </marker>
            </defs>
            {edgesData.map(edge => {
              const from = modulesData.find(m => m.id === edge.from)!
              const to = modulesData.find(m => m.id === edge.to)!
              const key = `${edge.from}-${edge.to}`
              const active = tracedEdges.has(key)
              const d = edgePath(from, to)
              const mx = (from.x + from.w / 2 + to.x + to.w / 2) / 2
              const my = (from.y + from.h + to.y) / 2
              return (
                <g key={key}>
                  <path
                    d={d}
                    fill="none"
                    stroke={active ? s.green : s.border}
                    strokeWidth={active ? 2 : 1.5}
                    strokeDasharray={active ? 'none' : '5 4'}
                    opacity={active ? 0.9 : 0.35}
                    markerEnd={`url(#${active ? 'ahg' : 'ah'})`}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  <text
                    x={mx}
                    y={my - 6}
                    textAnchor="middle"
                    fill={active ? s.green : s.text3}
                    fontSize={11}
                    fontFamily={s.mono}
                    opacity={active ? 0.85 : 0.4}
                    stroke={s.bg}
                    strokeWidth={3}
                    paintOrder="stroke"
                    style={{ transition: 'all 0.3s ease' }}
                  >
                    {edge.label}
                  </text>
                </g>
              )
            })}
          </svg>

          {modulesData.map(mod => {
            const isTraced = traced.has(mod.id)
            const isPulsing = pulseIds.has(mod.id)
            const isSelected = selectedId === mod.id
            let borderColor = s.border
            let opacity = 0.3
            let glow = 'none'
            if (isTraced) {
              opacity = 1
              borderColor = mod.isEntry ? s.accent : s.green
              glow = mod.isEntry
                ? `0 0 14px ${s.accent}25`
                : `0 0 14px ${s.green}18`
            }
            if (isSelected) {
              borderColor = s.accent
              glow = `0 0 0 2px ${s.accent}30, 0 0 16px ${s.accent}20`
            }
            return (
              <div
                key={mod.id}
                onClick={() => setSelectedId(prev => prev === mod.id ? null : mod.id)}
                style={{
                  position: 'absolute',
                  left: mod.x,
                  top: mod.y,
                  width: mod.w,
                  height: mod.h,
                  background: s.bg2,
                  border: `1.5px solid ${borderColor}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  opacity,
                  transition: 'all 0.3s ease',
                  boxShadow: glow,
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{
                    color: s.text,
                    fontSize: 14,
                    fontFamily: s.mono,
                    fontWeight: 600,
                  }}>
                    {mod.name}
                  </span>
                  {mod.isEntry && (
                    <span style={{
                      fontSize: 9,
                      fontFamily: s.mono,
                      color: '#fff',
                      background: s.accent,
                      borderRadius: 4,
                      padding: '1px 6px',
                      fontWeight: 700,
                      letterSpacing: 0.5,
                    }}>
                      ENTRY
                    </span>
                  )}
                </div>
                {mod.exports.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                    marginTop: 6,
                  }}>
                    {mod.exports.map(exp => {
                      const dimmed = dimUnreached && !exp.reached
                      return (
                        <span
                          key={exp.name}
                ref={(el) => { nodeRefs.current[mod.id] = el }}
                style={{
                            fontSize: 11,
                            fontFamily: s.mono,
                            borderRadius: 4,
                            padding: '2px 7px',
                            background: exp.reached ? `${s.green}15` : `${s.text3}10`,
                            color: exp.reached ? s.green : s.text3,
                            border: `1px solid ${exp.reached ? `${s.green}28` : `${s.text3}18`}`,
                            opacity: dimmed ? 0.35 : 1,
                            transition: 'opacity 0.4s ease',
                          }}
                        >
                          {exp.name}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {selectedMod && (
          <div style={{
            marginTop: 12,
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 10,
            padding: '14px 16px',
          }}>
            <div style={{
              fontSize: 15,
              fontFamily: s.mono,
              color: s.text,
              fontWeight: 600,
              marginBottom: 12,
            }}>
              {selectedMod.name}
              {selectedMod.isEntry && (
                <span style={{
                  fontSize: 9,
                  fontFamily: s.mono,
                  color: '#fff',
                  background: s.accent,
                  borderRadius: 4,
                  padding: '2px 7px',
                  marginLeft: 8,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}>
                  ENTRY
                </span>
              )}
            </div>

            {selectedMod.exports.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{
                  fontSize: 10,
                  color: s.text3,
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  marginBottom: 6,
                  fontFamily: s.mono,
                }}>
                  Exports
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedMod.exports.map(exp => (
                    <span key={exp.name} style={{
                      fontSize: 12,
                      fontFamily: s.mono,
                      borderRadius: 5,
                      padding: '3px 10px',
                      background: exp.reached ? `${s.green}15` : `${s.text3}10`,
                      color: exp.reached ? s.green : s.text3,
                      border: `1px solid ${exp.reached ? `${s.green}28` : `${s.text3}18`}`,
                    }}>
                      {exp.reached ? '\u25cf ' : '\u25cb '}{exp.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {importedBy.length > 0 && (
              <div style={{ marginBottom: selectedMod.imports.length > 0 ? 12 : 0 }}>
                <div style={{
                  fontSize: 10,
                  color: s.text3,
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  marginBottom: 6,
                  fontFamily: s.mono,
                }}>
                  Imported by
                </div>
                {importedBy.map(ib => (
                  <div key={ib.name} style={{
                    fontSize: 12,
                    fontFamily: s.mono,
                    color: s.text2,
                    marginBottom: 3,
                  }}>
                    {ib.name}{' '}
                    <span style={{ color: s.text3 }}>
                      ({ib.names.join(', ')})
                    </span>
                  </div>
                ))}
              </div>
            )}

            {selectedMod.imports.length > 0 && (
              <div>
                <div style={{
                  fontSize: 10,
                  color: s.text3,
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  marginBottom: 6,
                  fontFamily: s.mono,
                }}>
                  Imports from
                </div>
                {selectedMod.imports.map(imp => {
                  const target = modulesData.find(m => m.id === imp.from)!
                  return (
                    <div key={imp.from} style={{
                      fontSize: 12,
                      fontFamily: s.mono,
                      color: s.text2,
                      marginBottom: 3,
                    }}>
                      {target.name}{' '}
                      <span style={{ color: s.text3 }}>
                        ({imp.names.join(', ')})
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {selectedMod.exports.length === 0 && selectedMod.imports.length > 0 && (
              <div style={{ fontSize: 12, color: s.text3, fontFamily: s.mono }}>
                Entry point with no exports. Triggers the import chain.
              </div>
            )}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: 16,
          marginTop: 12,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 3,
              background: 'transparent',
              border: `1.5px solid ${s.accent}`,
            }} />
            <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>
              Entry point
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 3,
              background: 'transparent',
              border: `1.5px solid ${s.green}`,
            }} />
            <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>
              Reached module
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 11, fontFamily: s.mono,
              color: s.green,
              background: `${s.green}15`,
              borderRadius: 3, padding: '0 5px',
              border: `1px solid ${s.green}28`,
            }}>
              exp
            </span>
            <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>
              Reached export
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 11, fontFamily: s.mono,
              color: s.text3, opacity: 0.35,
              background: `${s.text3}10`,
              borderRadius: 3, padding: '0 5px',
              border: `1px solid ${s.text3}18`,
            }}>
              exp
            </span>
            <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>
              Tree-shaken
            </span>
          </div>
        </div>

      </div>
    </DemoBoundary>
  )
}
