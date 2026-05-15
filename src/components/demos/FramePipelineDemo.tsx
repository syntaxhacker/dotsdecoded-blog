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

const BUDGET = 16

interface Stage {
  label: string
  time: number
  color: string
}

type WorkloadKey = 'light' | 'heavy-js' | 'layout-storm' | 'animation'

interface Workload {
  label: string
  desc: string
  stages: Stage[]
}

const WORKLOADS: Record<WorkloadKey, Workload> = {
  'light': {
    label: 'Light',
    desc: 'Simple update with minimal changes.',
    stages: [
      { label: 'JS', time: 2, color: s.accent },
      { label: 'Style', time: 1, color: s.green },
      { label: 'Layout', time: 1, color: s.yellow },
      { label: 'Paint', time: 2, color: s.orange },
      { label: 'Composite', time: 1, color: s.purple },
    ],
  },
  'heavy-js': {
    label: 'Heavy JS',
    desc: 'Long-running script blocks the main thread.',
    stages: [
      { label: 'JS', time: 14, color: s.accent },
      { label: 'Style', time: 1, color: s.green },
      { label: 'Layout', time: 1, color: s.yellow },
      { label: 'Paint', time: 2, color: s.orange },
      { label: 'Composite', time: 1, color: s.purple },
    ],
  },
  'layout-storm': {
    label: 'Layout Storm',
    desc: 'DOM mutations trigger expensive reflow.',
    stages: [
      { label: 'JS', time: 2, color: s.accent },
      { label: 'Style', time: 5, color: s.green },
      { label: 'Layout', time: 8, color: s.yellow },
      { label: 'Paint', time: 4, color: s.orange },
      { label: 'Composite', time: 2, color: s.purple },
    ],
  },
  'animation': {
    label: 'Animation',
    desc: 'Transform-only animation. No layout, no paint.',
    stages: [
      { label: 'JS', time: 1, color: s.accent },
      { label: 'Style', time: 0, color: s.green },
      { label: 'Layout', time: 0, color: s.yellow },
      { label: 'Paint', time: 0, color: s.orange },
      { label: 'Composite', time: 3, color: s.purple },
    ],
  },
}

const W = 600
const H = 48

export default function FramePipelineDemo() {
  const [workload, setWorkload] = useState<WorkloadKey>('light')

  const wl = WORKLOADS[workload]
  const total = useMemo(() => wl.stages.reduce((sum, st) => sum + st.time, 0), [wl])
  const exceeds = total > BUDGET
  const fps = total > 0 ? Math.round(1000 / Math.max(total, BUDGET)) : 0
  const actualFps = total > 0 ? (total <= BUDGET ? 60 : Math.round(1000 / total)) : 0

  let bottleneckIdx = -1
  let maxTime = 0
  for (let i = 0; i < wl.stages.length; i++) {
    if (wl.stages[i].time > maxTime) {
      maxTime = wl.stages[i].time
      bottleneckIdx = i
    }
  }

  const scale = W / Math.max(total, BUDGET)

  return (
    <DemoBoundary name="Frame Pipeline">
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
          Frame Pipeline
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Workload</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(Object.keys(WORKLOADS) as WorkloadKey[]).map(k => (
              <button key={k} onClick={() => setWorkload(k)} style={{
                padding: '7px 14px', borderRadius: 6,
                border: `1px solid ${workload === k ? s.accent : s.border}`,
                background: workload === k ? `${s.accent}18` : s.bg,
                color: workload === k ? s.accent : s.text2,
                fontSize: 12, cursor: 'pointer', fontWeight: workload === k ? 600 : 400,
                transition: 'all .15s',
              }}>{WORKLOADS[k].label}</button>
            ))}
          </div>
          <div style={{ color: s.text3, fontSize: 12, marginTop: 8 }}>{wl.desc}</div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>
              0ms
            </span>
            <span style={{
              color: s.text3, fontSize: 11, fontFamily: s.mono,
              fontWeight: 700, padding: '2px 10px', borderRadius: 4,
              background: exceeds ? `${s.red}18` : `${s.green}18`,
              color: exceeds ? s.red : s.green,
            }}>
              Budget: {BUDGET}ms
            </span>
            <span style={{
              color: s.text3, fontSize: 11, fontFamily: s.mono,
            }}>
              {Math.max(total, BUDGET)}ms
            </span>
          </div>

          <div style={{ position: 'relative', width: W, height: H, background: s.bg, borderRadius: 8, overflow: 'hidden' }}>
            {wl.stages.map((st, i) => {
              const left = wl.stages.slice(0, i).reduce((sum, s) => sum + s.time * scale, 0)
              const stageW = Math.max(st.time * scale, st.time === 0 ? 0 : 4)
              return (
                <div key={st.label} style={{
                  position: 'absolute', left, top: 0, width: stageW, height: H,
                  background: st.color, opacity: st.time === 0 ? 0.2 : 0.85,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#fff',
                  flexDirection: 'column', lineHeight: 1.3,
                  transition: 'all 0.4s ease',
                }}>
                  {stageW > 30 && <>{st.label}</>}
                  {stageW > 45 && <span style={{ fontSize: 8, opacity: 0.8 }}>{st.time}ms</span>}
                </div>
              )
            })}

            {exceeds && (
              <div style={{
                position: 'absolute', left: BUDGET * scale, top: 0,
                width: (total - BUDGET) * scale, height: H,
                background: `repeating-linear-gradient(45deg, ${s.red}44, ${s.red}44 4px, transparent 4px, transparent 8px)`,
                zIndex: 2,
              }} />
            )}

            <div style={{
              position: 'absolute', left: BUDGET * scale - 1, top: 0, width: 2, height: H,
              background: s.red, zIndex: 3,
            }} />

            <div style={{
              position: 'absolute', left: BUDGET * scale, top: -2,
              color: s.red, fontSize: 9, fontFamily: s.mono, fontWeight: 700,
            }}>
              
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 120, background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, padding: 14 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Time</div>
            <div style={{ fontFamily: s.mono, fontSize: 22, fontWeight: 700, color: exceeds ? s.red : s.green }}>
              {total}ms
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 120, background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, padding: 14 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actual FPS</div>
            <div style={{ fontFamily: s.mono, fontSize: 22, fontWeight: 700, color: exceeds ? s.red : s.green }}>
              {actualFps}
            </div>
            <div style={{ fontSize: 11, color: s.text3, marginTop: 2 }}>
              {exceeds ? 'Frame drop' : 'Smooth'}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 120, background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`, padding: 14 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bottleneck</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: wl.stages[bottleneckIdx]?.color || s.text }}>
              {wl.stages[bottleneckIdx]?.label || '-'}
            </div>
            <div style={{ fontSize: 11, color: s.text3, marginTop: 2 }}>
              {wl.stages[bottleneckIdx]?.time || 0}ms (longest stage)
            </div>
          </div>
        </div>

        <div style={{
          padding: '12px 16px', background: s.bg, borderRadius: 8,
          border: `1px solid ${s.border2}`,
          animation: exceeds ? 'framePipelineFlash 0.5s ease' : 'none',
        }}>
          <style>{`
            @keyframes framePipelineFlash {
              0%, 100% { border-color: ${s.border2}; }
              50% { border-color: ${s.red}; }
            }
          `}</style>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: s.text3, lineHeight: 1.6 }}>
            {wl.stages.map((st, i) => (
              <div key={st.label} style={{ flex: 1, minWidth: 90 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color }} />
                  <span style={{ color: s.text, fontWeight: 600, fontSize: 12 }}>{st.label}</span>
                </div>
                <div style={{ fontFamily: s.mono, fontSize: 11, color: i === bottleneckIdx ? s.yellow : s.text3 }}>
                  {st.time}ms {i === bottleneckIdx ? '(bottleneck)' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
