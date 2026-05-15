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
const SW = 640, SH = 300, PAD = 10

interface ObjData { id: string; label: string; x: number; y: number; root: boolean }
interface EdgeData { from: string; to: string }

const objects: ObjData[] = [
  { id: 'R1', label: 'window', x: 10, y: 30, root: true },
  { id: 'R2', label: 'stack', x: 10, y: 120, root: true },
  { id: 'A', label: 'user', x: 160, y: 30, root: false },
  { id: 'B', label: 'config', x: 160, y: 120, root: false },
  { id: 'C', label: 'profile', x: 330, y: 30, root: false },
  { id: 'D', label: 'session', x: 330, y: 120, root: false },
  { id: 'E', label: 'cache', x: 160, y: 220, root: false },
  { id: 'F', label: 'tmp_buf', x: 330, y: 220, root: false },
  { id: 'G', label: 'old_log', x: 500, y: 30, root: false },
]

const edges: EdgeData[] = [
  { from: 'R1', to: 'A' }, { from: 'R2', to: 'B' },
  { from: 'A', to: 'C' }, { from: 'A', to: 'D' },
  { from: 'B', to: 'D' }, { from: 'E', to: 'F' },
]

const objMap = new Map(objects.map((o) => [o.id, o]))

interface StepDef {
  label: string
  marked: string[]
  freed: string[]
}

const steps: StepDef[] = [
  { label: 'Initial heap. Roots: window (global), stack (local vars).', marked: [], freed: [] },
  { label: 'Step 1 -- Mark Phase: GC marks roots as reachable.', marked: ['R1', 'R2'], freed: [] },
  { label: 'Follow R1 -> user object. Mark user.', marked: ['R1', 'R2', 'A'], freed: [] },
  { label: 'Follow A -> profile. Mark profile.', marked: ['R1', 'R2', 'A', 'C'], freed: [] },
  { label: 'Follow A -> session. Mark session.', marked: ['R1', 'R2', 'A', 'C', 'D'], freed: [] },
  { label: 'Follow R2 -> config. Mark config.', marked: ['R1', 'R2', 'A', 'C', 'D', 'B'], freed: [] },
  { label: 'Mark complete! 6 objects reachable. 3 objects (cache, tmp_buf, old_log) are garbage.', marked: ['R1', 'R2', 'A', 'C', 'D', 'B'], freed: [] },
  { label: 'Step 2 -- Sweep Phase: GC reclaims memory from unmarked objects.', marked: ['R1', 'R2', 'A', 'C', 'D', 'B'], freed: ['E', 'F', 'G'] },
  { label: 'After GC: only reachable objects remain. Dark gaps show fragmentation in the heap.', marked: ['R1', 'R2', 'A', 'C', 'D', 'B'], freed: ['E', 'F', 'G'] },
]

function getObjState(stepIdx: number, id: string) {
  const st = steps[stepIdx]
  if (st.freed.includes(id)) return 'freed'
  if (st.marked.includes(id)) return 'marked'
  return 'unvisited'
}

export default function GcMarkSweepDemo() {
  const [step, setStep] = useState(0)
  const lastStep = steps.length - 1

  const fillColor = (state: string, isRoot: boolean) => {
    switch (state) {
      case 'marked': return isRoot ? s.green : s.accent
      case 'freed': return 'transparent'
      default: return s.bg3
    }
  }

  const strokeColor = (state: string) => {
    switch (state) {
      case 'marked': return s.accent
      case 'freed': return 'transparent'
      default: return s.border
    }
  }

  const textColor = (state: string) => {
    switch (state) {
      case 'marked': return '#fff'
      case 'freed': return 'transparent'
      default: return s.text3
    }
  }

  const rectW = (id: string) => {
    const st = getObjState(step, id)
    if (st === 'freed' && step < lastStep) return OW
    if (st === 'freed') return 0
    return OW
  }

  const edgeVisible = (from: string, to: string) => {
    const sf = getObjState(step, from)
    const st = getObjState(step, to)
    return sf !== 'freed' && st !== 'freed' && sf !== 'unvisited'
  }

  const totalReachable = objects.filter((o) => getObjState(step, o.id) === 'marked').length
  const totalFreed = objects.filter((o) => getObjState(step, o.id) === 'freed').length

  return (
    <DemoBoundary name="Mark-Sweep GC">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Mark-Sweep GC</div>
        <p style={{ color: s.text2, fontSize: 13, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Step through a mark-sweep collection. Roots are red. Reachable objects turn blue. Unreachable objects (gray) are freed during sweep.
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
          <span style={{ color: s.text3, fontSize: 11, marginLeft: 8 }}>
            Reachable: <span style={{ color: s.green }}>{totalReachable}</span> |
            Freed: <span style={{ color: s.red }}>{totalFreed}</span>
          </span>
        </div>

        <div style={{
          background: `${s.accent}10`, border: `1px solid ${s.accent}30`, borderRadius: 8,
          padding: '8px 14px', color: s.text, fontSize: 12, marginBottom: 16, lineHeight: 1.5,
        }}>
          {steps[step].label}
        </div>

        <div style={{
          background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`,
          padding: PAD, overflow: 'hidden',
        }}>
          <svg viewBox={`${-PAD} ${-PAD} ${SW + PAD * 2} ${SH + PAD * 2}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={s.text3} />
              </marker>
              <marker id="arrowAccent" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={s.accent} />
              </marker>
            </defs>

            {edges.map((e) => {
              const src = objMap.get(e.from)!
              const tgt = objMap.get(e.to)!
              if (!edgeVisible(e.from, e.to)) return null
              const x1 = src.x + OW, y1 = src.y + OH / 2
              const x2 = tgt.x, y2 = tgt.y + OH / 2
              const sameRow = Math.abs(y1 - y2) < 5
              if (sameRow) {
                return (
                  <line key={`${e.from}-${e.to}`} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={s.text3} strokeWidth={1.5} markerEnd="url(#arrow)" />
                )
              }
              const cpx = (x1 + x2) / 2
              const cpy = (y1 + y2) / 2 + 10
              return (
                <path key={`${e.from}-${e.to}`} d={`M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`}
                  fill="none" stroke={s.text3} strokeWidth={1.5} markerEnd="url(#arrow)" />
              )
            })}

            {objects.map((obj) => {
              const state = getObjState(step, obj.id)
              const visible = state !== 'freed' || (state === 'freed' && step < lastStep - 1)
              if (state === 'freed' && step >= lastStep - 1) return (
                <g key={obj.id}>
                  <rect x={obj.x} y={obj.y} width={OW} height={OH} rx={4}
                    fill={s.bg} stroke={s.border2} strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
                  <text x={obj.x + OW / 2} y={obj.y + OH / 2 + 4} textAnchor="middle"
                    fill={s.text3} fontSize={9} fontFamily={s.mono} opacity={0.5}>freed</text>
                </g>
              )
              const fill = fillColor(state, obj.root)
              const stroke = strokeColor(state)
              return (
                <g key={obj.id}>
                  {obj.root && (
                    <rect x={obj.x - 3} y={obj.y - 3} width={OW + 6} height={OH + 6} rx={7}
                      fill="none" stroke={s.red} strokeWidth={1.5} strokeDasharray="3 2" opacity={state === 'marked' ? 0.8 : 0.3} />
                  )}
                  <rect x={obj.x} y={obj.y} width={OW} height={OH} rx={4}
                    fill={fill} stroke={stroke} strokeWidth={state === 'marked' ? 2.5 : 1.5}
                    style={{ transition: 'fill 0.4s ease, stroke 0.4s ease' }} />
                  <text x={obj.x + OW / 2} y={obj.y + OH / 2 + 4} textAnchor="middle"
                    fill={textColor(state)} fontSize={12} fontFamily={s.mono}
                    style={{ transition: 'fill 0.4s ease' }}>
                    {obj.label}
                  </text>
                  {obj.root && (
                    <text x={obj.x + OW - 4} y={obj.y - 4}
                      fill={state === 'marked' ? s.green : s.text3} fontSize={8} textAnchor="end" fontFamily={s.mono}>
                      root
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        <div style={{
          marginTop: 14, display: 'flex', gap: 14, fontSize: 11, color: s.text3, flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.green }} />
            Root (marked)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.accent }} />
            Reachable (marked)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.bg3 }} />
            Unvisited
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, border: `1px dashed ${s.border2}`, background: s.bg }} />
            Freed / Gap
          </span>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
