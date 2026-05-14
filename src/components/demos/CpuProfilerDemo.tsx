import { useState, useCallback, useMemo } from 'react'
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

const ROW_H = 30
const FONT_SIZE = 11

interface FlameFrame {
  id: string
  name: string
  selfTime: number
  totalTime: number
  depth: number
  startPct: number
  widthPct: number
  parentId: string | null
  callCount: number
  sourceHint: string
  category: 'compute' | 'cache' | 'io'
}

interface Profile {
  name: string
  desc: string
  colorLabel: string
  frames: FlameFrame[]
  maxDepth: number
}

const COMPUTE_PROFILE: Profile = {
  name: 'Compute-Bound',
  desc: 'Deep call stack; hot in math kernels. CPU time dominated by matrix multiplication.',
  colorLabel: 'Reds / Oranges',
  frames: [
    { id: 'main', name: 'main', selfTime: 0, totalTime: 100, depth: 0, startPct: 0, widthPct: 100, parentId: null, callCount: 1, sourceHint: 'main.c:10', category: 'compute' },
    { id: 'parseInput', name: 'parseInput', selfTime: 5, totalTime: 60, depth: 1, startPct: 0, widthPct: 60, parentId: 'main', callCount: 1, sourceHint: 'parse.c:25', category: 'compute' },
    { id: 'reportResults', name: 'reportResults', selfTime: 5, totalTime: 40, depth: 1, startPct: 60, widthPct: 40, parentId: 'main', callCount: 1, sourceHint: 'report.c:8', category: 'compute' },
    { id: 'validateData', name: 'validateData', selfTime: 5, totalTime: 55, depth: 2, startPct: 0, widthPct: 55, parentId: 'parseInput', callCount: 1, sourceHint: 'validate.c:42', category: 'compute' },
    { id: 'formatOutput', name: 'formatOutput', selfTime: 35, totalTime: 35, depth: 2, startPct: 60, widthPct: 35, parentId: 'reportResults', callCount: 1, sourceHint: 'fmt.c:17', category: 'compute' },
    { id: 'computeStats', name: 'computeStats', selfTime: 0, totalTime: 50, depth: 3, startPct: 0, widthPct: 50, parentId: 'validateData', callCount: 1, sourceHint: 'stats.c:5', category: 'compute' },
    { id: 'matrixMultiply', name: 'matrixMultiply', selfTime: 5, totalTime: 35, depth: 4, startPct: 0, widthPct: 35, parentId: 'computeStats', callCount: 8, sourceHint: 'linalg.c:112', category: 'compute' },
    { id: 'vectorNorm', name: 'vectorNorm', selfTime: 15, totalTime: 15, depth: 4, startPct: 35, widthPct: 15, parentId: 'computeStats', callCount: 12, sourceHint: 'linalg.c:200', category: 'compute' },
    { id: 'innerKernel', name: 'innerKernel', selfTime: 30, totalTime: 30, depth: 5, startPct: 0, widthPct: 30, parentId: 'matrixMultiply', callCount: 64, sourceHint: 'linalg.c:156', category: 'compute' },
  ],
  maxDepth: 6,
}

const CACHE_PROFILE: Profile = {
  name: 'Cache-Bound',
  desc: 'Memory access dominated. Time spent waiting on cache misses and hash table lookups.',
  colorLabel: 'Blues / Purples',
  frames: [
    { id: 'main', name: 'main', selfTime: 0, totalTime: 100, depth: 0, startPct: 0, widthPct: 100, parentId: null, callCount: 1, sourceHint: 'main.c:10', category: 'cache' },
    { id: 'processDataset', name: 'processDataset', selfTime: 0, totalTime: 100, depth: 1, startPct: 0, widthPct: 100, parentId: 'main', callCount: 1, sourceHint: 'process.c:5', category: 'cache' },
    { id: 'scanRows', name: 'scanRows', selfTime: 5, totalTime: 60, depth: 2, startPct: 0, widthPct: 60, parentId: 'processDataset', callCount: 1, sourceHint: 'scan.c:33', category: 'cache' },
    { id: 'hashJoin', name: 'hashJoin', selfTime: 3, totalTime: 25, depth: 2, startPct: 60, widthPct: 25, parentId: 'processDataset', callCount: 2, sourceHint: 'join.c:78', category: 'cache' },
    { id: 'aggregateResults', name: 'aggregateResults', selfTime: 3, totalTime: 15, depth: 2, startPct: 85, widthPct: 15, parentId: 'processDataset', callCount: 1, sourceHint: 'agg.c:12', category: 'cache' },
    { id: 'accessColumn', name: 'accessColumn', selfTime: 5, totalTime: 55, depth: 3, startPct: 0, widthPct: 55, parentId: 'scanRows', callCount: 24, sourceHint: 'scan.c:89', category: 'cache' },
    { id: 'probeHashTable', name: 'probeHashTable', selfTime: 22, totalTime: 22, depth: 3, startPct: 60, widthPct: 22, parentId: 'hashJoin', callCount: 96, sourceHint: 'join.c:145', category: 'cache' },
    { id: 'updateAccumulator', name: 'updateAccumulator', selfTime: 12, totalTime: 12, depth: 3, startPct: 85, widthPct: 12, parentId: 'aggregateResults', callCount: 48, sourceHint: 'agg.c:56', category: 'cache' },
    { id: 'cacheMissHeavy', name: 'cacheMissHeavy', selfTime: 50, totalTime: 50, depth: 4, startPct: 0, widthPct: 50, parentId: 'accessColumn', callCount: 128, sourceHint: 'mem.c:204', category: 'cache' },
  ],
  maxDepth: 5,
}

const IO_PROFILE: Profile = {
  name: 'I/O Bound',
  desc: 'Waiting on network and disk. CPU is idle while waiting for external I/O.',
  colorLabel: 'Greens',
  frames: [
    { id: 'main', name: 'main', selfTime: 0, totalTime: 100, depth: 0, startPct: 0, widthPct: 100, parentId: null, callCount: 1, sourceHint: 'main.c:10', category: 'io' },
    { id: 'readConfig', name: 'readConfig', selfTime: 2, totalTime: 20, depth: 1, startPct: 0, widthPct: 20, parentId: 'main', callCount: 1, sourceHint: 'config.c:12', category: 'io' },
    { id: 'fetchRecords', name: 'fetchRecords', selfTime: 3, totalTime: 55, depth: 1, startPct: 20, widthPct: 55, parentId: 'main', callCount: 1, sourceHint: 'fetch.c:5', category: 'io' },
    { id: 'writeReport', name: 'writeReport', selfTime: 3, totalTime: 25, depth: 1, startPct: 75, widthPct: 25, parentId: 'main', callCount: 1, sourceHint: 'report.c:30', category: 'io' },
    { id: 'parseSettings', name: 'parseSettings', selfTime: 18, totalTime: 18, depth: 2, startPct: 0, widthPct: 18, parentId: 'readConfig', callCount: 1, sourceHint: 'config.c:48', category: 'io' },
    { id: 'sendQuery', name: 'sendQuery', selfTime: 2, totalTime: 30, depth: 2, startPct: 20, widthPct: 30, parentId: 'fetchRecords', callCount: 4, sourceHint: 'db.c:67', category: 'io' },
    { id: 'recvResponse', name: 'recvResponse', selfTime: 2, totalTime: 22, depth: 2, startPct: 50, widthPct: 22, parentId: 'fetchRecords', callCount: 4, sourceHint: 'db.c:92', category: 'io' },
    { id: 'flushOutput', name: 'flushOutput', selfTime: 2, totalTime: 22, depth: 2, startPct: 75, widthPct: 22, parentId: 'writeReport', callCount: 1, sourceHint: 'io.c:55', category: 'io' },
    { id: 'waitForSocket', name: 'waitForSocket', selfTime: 28, totalTime: 28, depth: 3, startPct: 20, widthPct: 28, parentId: 'sendQuery', callCount: 12, sourceHint: 'net.c:33', category: 'io' },
    { id: 'readBuffer', name: 'readBuffer', selfTime: 20, totalTime: 20, depth: 3, startPct: 50, widthPct: 20, parentId: 'recvResponse', callCount: 8, sourceHint: 'io.c:112', category: 'io' },
    { id: 'fsync', name: 'fsync', selfTime: 20, totalTime: 20, depth: 3, startPct: 75, widthPct: 20, parentId: 'flushOutput', callCount: 2, sourceHint: 'io.c:178', category: 'io' },
  ],
  maxDepth: 4,
}

const PROFILES: Profile[] = [COMPUTE_PROFILE, CACHE_PROFILE, IO_PROFILE]

function frameColor(frame: FlameFrame, depth: number, maxDepth: number, isHovered: boolean, isRelated: boolean): string {
  const maxL = 38
  const minL = 22
  const t = maxDepth > 1 ? depth / (maxDepth - 1) : 0
  const lightness = maxL - (maxL - minL) * t
  const sat = 55
  let hue: number
  switch (frame.category) {
    case 'compute': hue = 12; break
    case 'cache': hue = 225; break
    case 'io': hue = 140; break
    default: hue = 0
  }
  if (isHovered) return `hsl(${hue}, ${sat}%, ${Math.min(lightness + 20, 70)}%)`
  if (isRelated) return `hsl(${hue}, ${sat}%, ${Math.min(lightness + 10, 60)}%)`
  return `hsl(${hue}, ${sat}%, ${lightness}%)`
}

function getAncestors(frameId: string, frames: FlameFrame[]): string[] {
  const ancestors: string[] = []
  let current = frames.find(f => f.id === frameId)
  while (current && current.parentId) {
    ancestors.push(current.parentId)
    current = frames.find(f => f.id === current!.parentId)
  }
  return ancestors
}

function getDescendants(frameId: string, frames: FlameFrame[]): string[] {
  const descendants: string[] = []
  const stack = [frameId]
  while (stack.length > 0) {
    const id = stack.pop()!
    const children = frames.filter(f => f.parentId === id)
    for (const child of children) {
      descendants.push(child.id)
      stack.push(child.id)
    }
  }
  return descendants
}

export default function CpuProfilerDemo() {
  const [profileIdx, setProfileIdx] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [containerWidth, setContainerWidth] = useState(700)

  const profile = PROFILES[profileIdx]
  const frames = profile.frames
  const svgH = profile.maxDepth * ROW_H + 4

  const ancestors = useMemo(() => {
    if (!hoveredId) return new Set<string>()
    return new Set(getAncestors(hoveredId, frames))
  }, [hoveredId, frames])

  const descendants = useMemo(() => {
    if (!hoveredId) return new Set<string>()
    return new Set(getDescendants(hoveredId, frames))
  }, [hoveredId, frames])

  const selectedFrame = selectedId ? frames.find(f => f.id === selectedId) ?? null : null

  const handleClick = useCallback((frameId: string) => {
    setSelectedId(prev => prev === frameId ? null : frameId)
  }, [])

  const handleMouseEnter = useCallback((frameId: string) => {
    setHoveredId(frameId)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null)
  }, [])

  const handleContainerRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      setContainerWidth(el.clientWidth)
    }
  }, [])

  return (
    <DemoBoundary name="CPU Profiler Flame Graph">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>CPU Flame Graph</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Each rectangle is a stack frame. Width = CPU time spent (including children).
          Hover to see relationships. Click for details. Wider frames = more CPU time.
        </p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {PROFILES.map((p, i) => (
            <button key={p.name} onClick={() => { setProfileIdx(i); setSelectedId(null); setHoveredId(null) }} style={{
              background: profileIdx === i ? s.accent : s.bg3,
              border: `1px solid ${profileIdx === i ? s.accent : s.border}`,
              borderRadius: 8, padding: '7px 14px',
              color: profileIdx === i ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 12, fontWeight: profileIdx === i ? 600 : 400,
              transition: 'all 0.2s',
            }}>{p.name}</button>
          ))}
        </div>

        <div style={{ background: s.bg, borderRadius: 8, padding: '10px 14px', marginBottom: 16, border: `1px solid ${s.border}`, color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
          {profile.desc}
        </div>

        <div ref={handleContainerRef} style={{ width: '100%', overflowX: 'auto', marginBottom: selectedFrame ? 16 : 0 }}>
          <svg
            width={containerWidth}
            height={svgH}
            viewBox={`0 0 ${containerWidth} ${svgH}`}
            style={{ display: 'block', minWidth: 400 }}
          >
            {frames.map(frame => {
              const isHovered = hoveredId === frame.id
              const isAncestor = ancestors.has(frame.id)
              const isDescendant = descendants.has(frame.id)
              const isRelated = isHovered || isAncestor || isDescendant
              const isDimmed = hoveredId !== null && !isRelated

              const x = (frame.startPct / 100) * containerWidth
              const w = (frame.widthPct / 100) * containerWidth
              const y = (profile.maxDepth - 1 - frame.depth) * ROW_H
              const color = frameColor(frame, frame.depth, profile.maxDepth, isHovered, isAncestor || isDescendant)

              const textFits = w > frame.name.length * (FONT_SIZE * 0.6) + 8

              return (
                <g key={frame.id}>
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={ROW_H - 2}
                    rx={3}
                    ry={3}
                    fill={color}
                    stroke={isHovered ? '#fff' : isAncestor || isDescendant ? s.border2 : 'transparent'}
                    strokeWidth={isHovered ? 1.5 : isAncestor || isDescendant ? 1 : 0}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                      opacity: isDimmed ? 0.3 : 1,
                    }}
                    onClick={() => handleClick(frame.id)}
                    onMouseEnter={() => handleMouseEnter(frame.id)}
                    onMouseLeave={handleMouseLeave}
                  />
                  {textFits && (
                    <text
                      x={x + 5}
                      y={y + ROW_H / 2 + 1}
                      fill="#fff"
                      fontSize={FONT_SIZE}
                      fontFamily={s.mono}
                      fontWeight={isHovered ? 600 : 400}
                      style={{ pointerEvents: 'none', opacity: isDimmed ? 0.3 : 0.9 }}
                    >
                      {frame.name}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {selectedFrame && (
          <div style={{
            background: s.bg, border: `1px solid ${s.border2}`,
            borderRadius: 10, padding: '14px 18px', marginBottom: 16,
          }}>
            <div style={{ color: s.text, fontSize: 16, fontWeight: 700, fontFamily: s.mono, marginBottom: 10 }}>
              {selectedFrame.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Self Time', value: `${selectedFrame.selfTime}%`, color: selectedFrame.selfTime > 20 ? s.red : s.text },
                { label: 'Total Time', value: `${selectedFrame.totalTime}%`, color: selectedFrame.totalTime > 50 ? s.yellow : s.text },
                { label: 'Call Count', value: selectedFrame.callCount.toString(), color: s.text },
                { label: 'Source', value: selectedFrame.sourceHint, color: s.text2 },
              ].map(item => (
                <div key={item.label} style={{
                  background: s.bg2, borderRadius: 6, padding: '8px 12px',
                }}>
                  <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                    {item.label}
                  </div>
                  <div style={{ color: item.color, fontFamily: s.mono, fontSize: 13, fontWeight: 600 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            {selectedFrame.selfTime === 0 && frames.some(f => f.parentId === selectedFrame.id) && (
              <div style={{ color: s.text3, fontSize: 11, marginTop: 8, fontStyle: 'italic' }}>
                Self time of 0% means this function only calls other functions.
              </div>
            )}
          </div>
        )}

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Legend</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: 'hsl(12, 55%, 30%)' }} />
              <span style={{ color: s.text2, fontSize: 11 }}>Compute (Reds)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: 'hsl(225, 55%, 30%)' }} />
              <span style={{ color: s.text2, fontSize: 11 }}>Cache (Blues)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: 'hsl(140, 55%, 30%)' }} />
              <span style={{ color: s.text2, fontSize: 11 }}>I/O (Greens)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: 'hsl(0, 0%, 70%)', opacity: 0.3 }} />
              <span style={{ color: s.text2, fontSize: 11 }}>Deeper = darker</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
