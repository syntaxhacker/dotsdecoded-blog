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

const OW = 80, OH = 38

interface Obj { id: string; label: string; x: number; y: number }
interface Edge { from: string; to: string }

const objects: Obj[] = [
  { id: 'R', label: 'root', x: 10, y: 100 },
  { id: 'A', label: 'user', x: 160, y: 40 },
  { id: 'B', label: 'config', x: 160, y: 160 },
  { id: 'C', label: 'profile', x: 330, y: 40 },
  { id: 'D', label: 'session', x: 330, y: 160 },
  { id: 'E', label: 'cache', x: 500, y: 40 },
  { id: 'F', label: 'temp', x: 500, y: 160 },
  { id: 'Z', label: 'new_ref', x: 330, y: 260 },
]

const edges: Edge[] = [
  { from: 'R', to: 'A' }, { from: 'R', to: 'B' },
  { from: 'A', to: 'C' }, { from: 'B', to: 'D' },
]

const objMap = new Map(objects.map((o) => [o.id, o]))

type Color = 'white' | 'gray' | 'black'

interface Step {
  label: string
  colors: Record<string, Color>
  queue: string[]
  barrier?: string
  unreachable?: string[]
}

const steps: Step[] = [
  {
    label: 'Initial: all objects are white (unvisited). The mark queue is empty.',
    colors: { R: 'white', A: 'white', B: 'white', C: 'white', D: 'white', E: 'white', F: 'white', Z: 'white' },
    queue: [],
    unreachable: ['E', 'F', 'Z'],
  },
  {
    label: 'Mark Phase starts. Root (R) is discovered and turned gray. Gray = in queue.',
    colors: { R: 'gray', A: 'white', B: 'white', C: 'white', D: 'white', E: 'white', F: 'white', Z: 'white' },
    queue: ['R'],
    unreachable: ['E', 'F', 'Z'],
  },
  {
    label: 'Scan R: mark its children (A, B) as gray. R becomes black (fully scanned).',
    colors: { R: 'black', A: 'gray', B: 'gray', C: 'white', D: 'white', E: 'white', F: 'white', Z: 'white' },
    queue: ['A', 'B'],
    unreachable: ['E', 'F', 'Z'],
  },
  {
    label: 'Scan A: mark child C as gray. A becomes black.',
    colors: { R: 'black', A: 'black', B: 'gray', C: 'gray', D: 'white', E: 'white', F: 'white', Z: 'white' },
    queue: ['B', 'C'],
    unreachable: ['E', 'F', 'Z'],
  },
  {
    label: 'Scan B: mark child D as gray. B becomes black.',
    colors: { R: 'black', A: 'black', B: 'black', C: 'gray', D: 'gray', E: 'white', F: 'white', Z: 'white' },
    queue: ['C', 'D'],
    unreachable: ['E', 'F', 'Z'],
  },
  {
    label: 'Scan C: no children. C becomes black.',
    colors: { R: 'black', A: 'black', B: 'black', C: 'black', D: 'gray', E: 'white', F: 'white', Z: 'white' },
    queue: ['D'],
    unreachable: ['E', 'F', 'Z'],
  },
  {
    label: 'Scan D: no children. D becomes black. Queue empty. Mark complete.',
    colors: { R: 'black', A: 'black', B: 'black', C: 'black', D: 'black', E: 'white', F: 'white', Z: 'white' },
    queue: [],
    unreachable: ['E', 'F', 'Z'],
  },
  {
    label: 'E, F, Z are white (unreachable from root). They will be swept. Z is a new allocation by the mutator.',
    colors: { R: 'black', A: 'black', B: 'black', C: 'black', D: 'black', E: 'white', F: 'white', Z: 'white' },
    queue: [],
    unreachable: ['E', 'F', 'Z'],
  },
  {
    label: 'Write Barrier: mutator stores a reference from C (black) to Z (white). The barrier detects this and turns Z gray.',
    colors: { R: 'black', A: 'black', B: 'black', C: 'black', D: 'black', E: 'white', F: 'white', Z: 'gray' },
    queue: ['Z'],
    barrier: 'C -> Z',
  },
  {
    label: 'Concurrent GC resumes. Scan Z: no children. Z becomes black. Queue empty again. All reachable objects are black.',
    colors: { R: 'black', A: 'black', B: 'black', C: 'black', D: 'black', E: 'white', F: 'white', Z: 'black' },
    queue: [],
    barrier: 'C -> Z',
    unreachable: ['E', 'F'],
  },
]

function colorToStyle(col: Color) {
  switch (col) {
    case 'white': return { fill: s.bg3, stroke: s.border, text: s.text3 }
    case 'gray': return { fill: s.yellow + '80', stroke: s.yellow, text: '#fff' }
    case 'black': return { fill: s.accent + '80', stroke: s.accent, text: '#fff' }
  }
}

export default function GcTriColorDemo() {
  const [step, setStep] = useState(0)
  const lastStep = steps.length - 1

  const current = steps[step]
  const barrierEdge = current.barrier

  const edgeColor = (from: string, to: string) => {
    if (barrierEdge === `${from} -> ${to}`) return s.red
    return s.text3
  }

  const edgeWidth = (from: string, to: string) => {
    if (barrierEdge === `${from} -> ${to}`) return 3
    return 1.5
  }

  const showEdge = (from: string, to: string) => {
    if (barrierEdge === `${from} -> ${to}`) return true
    if (to === 'Z' && barrierEdge !== `${from} -> ${to}`) return false
    return true
  }

  const allEdges: Edge[] = [
    ...edges,
    ...(step >= 8 ? [{ from: 'C', to: 'Z' }] : []),
  ]

  return (
    <DemoBoundary name="Tri-Color Marking">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Tri-Color Marking</div>
        <p style={{ color: s.text2, fontSize: 13, margin: '0 0 12px 0', lineHeight: 1.6 }}>
          White = unvisited, Gray = discovered (in queue), Black = scanned. The write barrier catches concurrent modifications.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setStep(Math.min(step + 1, lastStep))} disabled={step >= lastStep} style={{
            background: step >= lastStep ? s.bg3 : s.accent, border: 'none', borderRadius: 6,
            padding: '6px 16px', color: '#fff', fontSize: 12, cursor: step >= lastStep ? 'default' : 'pointer',
            fontWeight: 600, opacity: step >= lastStep ? 0.5 : 1,
          }}>Next Step</button>
          <button onClick={() => setStep(0)} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6,
            padding: '6px 16px', color: s.text2, fontSize: 12, cursor: 'pointer',
          }}>Reset</button>
          <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>
            {step}/{lastStep}
          </span>
        </div>

        <div style={{
          background: `${s.accent}10`, border: `1px solid ${s.accent}30`, borderRadius: 8,
          padding: '8px 14px', color: s.text, fontSize: 12, marginBottom: 16, lineHeight: 1.5,
        }}>
          {current.label}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, padding: '8px 14px', flex: 1 }}>
            <div style={{ color: s.text3, fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Mark Queue</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {current.queue.length === 0 ? (
                <span style={{ color: s.text3, fontSize: 11, fontStyle: 'italic' }}>empty</span>
              ) : (
                current.queue.map((id) => (
                  <span key={id} style={{
                    background: s.yellow + '30', color: s.yellow, fontFamily: s.mono, fontSize: 11,
                    padding: '2px 8px', borderRadius: 4, border: `1px solid ${s.yellow}50`,
                  }}>{id}</span>
                ))
              )}
            </div>
          </div>
          <div style={{ background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, padding: '8px 14px', flex: 1 }}>
            <div style={{ color: s.text3, fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Unreachable</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(current.unreachable || []).length === 0 ? (
                <span style={{ color: s.text3, fontSize: 11, fontStyle: 'italic' }}>none</span>
              ) : (
                (current.unreachable || []).map((id) => (
                  <span key={id} style={{
                    background: s.red + '20', color: s.red, fontFamily: s.mono, fontSize: 11,
                    padding: '2px 8px', borderRadius: 4, border: `1px solid ${s.red}40`,
                  }}>{id}</span>
                ))
              )}
            </div>
          </div>
        </div>

        {current.barrier && (
          <div style={{
            background: `${s.orange}15`, border: `1px solid ${s.orange}40`, borderRadius: 8,
            padding: '8px 14px', color: s.orange, fontSize: 12, marginBottom: 16, lineHeight: 1.5,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontWeight: 700 }}>Write Barrier Triggered:</span>
            {current.barrier}
          </div>
        )}

        <div style={{
          background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`,
          padding: 10, overflow: 'hidden',
        }}>
          <svg viewBox="-10 -10 620 320" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={s.text3} />
              </marker>
              <marker id="arrRed" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={s.red} />
              </marker>
            </defs>

            {allEdges.map((e) => {
              const src = objMap.get(e.from)!
              const tgt = objMap.get(e.to)!
              if (!showEdge(e.from, e.to)) return null
              const x1 = src.x + OW, y1 = src.y + OH / 2
              const x2 = tgt.x, y2 = tgt.y + OH / 2
              const isDiag = Math.abs(y1 - y2) > 5
              if (isDiag) {
                const cpx = (x1 + x2) / 2
                const cpy = (y1 + y2) / 2 + 15
                return (
                  <path key={`${e.from}-${e.to}`} d={`M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`}
                    fill="none" stroke={edgeColor(e.from, e.to)} strokeWidth={edgeWidth(e.from, e.to)}
                    markerEnd={edgeColor(e.from, e.to) === s.red ? 'url(#arrRed)' : 'url(#arr)'} />
                )
              }
              return (
                <line key={`${e.from}-${e.to}`} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={edgeColor(e.from, e.to)} strokeWidth={edgeWidth(e.from, e.to)}
                  markerEnd={edgeColor(e.from, e.to) === s.red ? 'url(#arrRed)' : 'url(#arr)'} />
              )
            })}

            {objects.map((obj) => {
              const col = current.colors[obj.id]
              const st = colorToStyle(col)
              const pulse = col === 'gray' ? s.yellow : 'transparent'
              return (
                <g key={obj.id}>
                  <rect x={obj.x} y={obj.y} width={OW} height={OH} rx={5}
                    fill={st.fill} stroke={pulse} strokeWidth={col === 'gray' ? 3 : 2}
                    style={{ transition: 'fill 0.35s ease, stroke 0.35s ease' }} />
                  <text x={obj.x + OW / 2} y={obj.y + OH / 2 + 4} textAnchor="middle"
                    fill={st.text} fontSize={12} fontFamily={s.mono}
                    style={{ transition: 'fill 0.35s ease' }}>
                    {obj.label}
                  </text>
                  <text x={obj.x + OW - 3} y={obj.y + OH + 12} textAnchor="end"
                    fill={s.text3} fontSize={9} fontFamily={s.mono}>
                    {col}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <div style={{
          marginTop: 14, display: 'flex', gap: 14, fontSize: 11, color: s.text3, flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.bg3, border: `1px solid ${s.border}` }} />
            White (unvisited)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.yellow }} />
            Gray (in queue)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.accent }} />
            Black (scanned)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.red }} />
            Write barrier
          </span>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
