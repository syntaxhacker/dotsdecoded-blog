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

interface Component {
  id: string
  name: string
  desc: string
  color: string
  layer: number
  children?: string[]
}

const components: Component[] = [
  { id: 'source', name: 'Go Source', desc: '*.go files with goroutines, channels, and concurrency primitives', color: s.accent, layer: 0 },
  { id: 'compiler', name: 'Compiler (gc)', desc: 'go tool compile: parsing, AST, SSA, code generation', color: s.green, layer: 0 },
  { id: 'linker', name: 'Linker', desc: 'go tool link: resolves symbols, embeds runtime, produces binary', color: s.green, layer: 0 },
  { id: 'binary', name: 'Go Binary', desc: 'Static executable with embedded runtime (scheduler, GC, allocator)', color: s.yellow, layer: 1 },
  { id: 'scheduler', name: 'GMP Scheduler', desc: 'Goroutine schedule: M spins, P context, work stealing, sysmon', color: s.purple, layer: 2, children: ['goroutines', 'machines', 'processors', 'sysmon'] },
  { id: 'goroutines', name: 'Goroutines (G)', desc: 'Lightweight stacks (~2KB), cooperative yield, channel blocking states', color: s.orange, layer: 3 },
  { id: 'machines', name: 'Machines (M)', desc: 'OS threads managed by runtime, sysmon monitors, thread caching', color: s.red, layer: 3 },
  { id: 'processors', name: 'Processors (P)', desc: 'Scheduling context, local run queue, max N = GOMAXPROCS', color: s.accent, layer: 3 },
  { id: 'sysmon', name: 'Sysmon Thread', desc: 'Background monitor: preempts long-running G, retakes P from blocked M', color: s.yellow, layer: 3 },
  { id: 'gc', name: 'GC (Garbage Collector)', desc: 'Concurrent mark-sweep, tri-color algorithm, assists scheduling', color: s.green, layer: 2, children: ['marker', 'sweeper', 'gcworker'] },
  { id: 'marker', name: 'Marker', desc: 'Concurrent marking phase, write barriers, assists', color: s.green, layer: 3 },
  { id: 'sweeper', name: 'Sweeper', desc: 'Background sweep phase, lazily frees spans', color: s.green, layer: 3 },
  { id: 'gcworker', name: 'GC Worker G', desc: 'Dedicated goroutines for concurrent GC work', color: s.green, layer: 3 },
  { id: 'allocator', name: 'Memory Allocator', desc: 'mspan, mcache, mcentral, mheap — per-P caches, no global lock', color: s.accent, layer: 2, children: ['mcache', 'mcentral', 'mheap'] },
  { id: 'mcache', name: 'mcache', desc: 'Per-P small object cache, no lock required', color: s.accent, layer: 3 },
  { id: 'mcentral', name: 'mcentral', desc: 'Central span lists, per size class, lock contention', color: s.accent, layer: 3 },
  { id: 'mheap', name: 'mheap', desc: 'Heap arena, page allocator, manages OS memory', color: s.accent, layer: 3 },
  { id: 'os', name: 'OS Kernel', desc: 'Linux/macOS/Windows: syscalls, threads, virtual memory', color: s.red, layer: 4 },
]

const toolchainSteps = [
  { label: 'go build', desc: 'Entry point. go build compiles and links in one step' },
  { label: 'go tool compile', desc: 'Parses Go source -> AST -> SSA (static single assignment) -> machine code (.o)' },
  { label: 'go tool link', desc: 'Links objects + runtime.a into a static binary. Runtime is always included' },
  { label: 'Executable', desc: 'Static binary with embedded runtime. No external dependencies. Runs on any Linux x86_64' },
]

export default function GoArchitectureDemo() {
  const [selected, setSelected] = useState<string | null>(null)

  const sel = components.find(c => c.id === selected)

  return (
    <DemoBoundary name="Go Runtime Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Go Runtime Architecture</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Go's runtime is compiled into every binary. It includes the GMP scheduler, concurrent garbage collector,
          memory allocator, and the sysmon thread. No VM, no runtime dependency — just a static binary.
        </p>

        <div style={{ marginBottom: 24 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Toolchain</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {toolchainSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                <div style={{
                  flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
                  padding: '8px 12px', textAlign: 'center',
                }}>
                  <div style={{ color: s.accent, fontSize: 12, fontFamily: s.mono, fontWeight: 600 }}>{step.label}</div>
                  <div style={{ color: s.text2, fontSize: 10, marginTop: 4 }}>{step.desc}</div>
                </div>
                {i < toolchainSteps.length - 1 && (
                  <span style={{ color: s.text3, fontSize: 16 }}>{'>'}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Runtime Architecture Layers
          </div>
          {[0, 1, 2, 3, 4].map(layer => {
            const layerComponents = components.filter(c => c.layer === layer)
            return (
              <div key={layer} style={{
                display: 'flex', gap: 6, marginBottom: 6,
                flexWrap: 'wrap',
              }}>
                {layerComponents.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(selected === c.id ? null : c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px', borderRadius: 8,
                      background: selected === c.id ? c.color : s.bg3,
                      border: `1px solid ${selected === c.id ? c.color : s.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontSize: 11,
                      color: selected === c.id ? '#000' : s.text2,
                      fontFamily: s.mono,
                      fontWeight: selected === c.id ? 600 : 400,
                    }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: c.color,
                      flexShrink: 0,
                    }} />
                    {c.name}
                  </button>
                ))}
              </div>
            )
          })}
        </div>

        {sel && (
          <div style={{
            background: s.bg, border: `1px solid ${sel.color}`, borderRadius: 12,
            padding: 16, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: sel.color, flexShrink: 0,
              }} />
              <span style={{ color: sel.color, fontSize: 15, fontWeight: 700, fontFamily: s.mono }}>{sel.name}</span>
            </div>
            <p style={{ color: s.text2, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              {sel.desc}
            </p>
            {sel.children && (
              <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {sel.children.map(ch => {
                  const child = components.find(c => c.id === ch)
                  return child ? (
                    <div key={ch} style={{
                      background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 6,
                      padding: '4px 10px', fontSize: 11, fontFamily: s.mono, color: s.text2,
                    }}>
                      {child.name}
                    </div>
                  ) : null
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Key Design Properties</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Static Binary', desc: 'Everything is linked into one executable. No VM, no JIT, no shared runtime DLL.', color: s.accent },
              { label: 'M:N Scheduling', desc: 'M goroutines scheduled onto N OS threads. GOMAXPROCS (default = CPU cores) controls P count.', color: s.purple },
              { label: 'Concurrent GC', desc: 'Tri-color mark-sweep collector runs concurrently with application goroutines. Pauses are sub-millisecond.', color: s.green },
              { label: 'Per-P Caching', desc: 'Each P has its own mcache for allocation and local run queue for scheduling. No global lock in hot paths.', color: s.orange },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 100 }}>{item.label}</span>
                <span style={{ color: s.text2, fontSize: 12 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
