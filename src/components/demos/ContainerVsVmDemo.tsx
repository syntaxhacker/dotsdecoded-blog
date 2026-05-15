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

interface LayerDef {
  id: string
  label: string
  sub: string
  color: string
  info: string
  diffLeft: string
  diffRight: string
}

const vm: LayerDef[] = [
  { id: 'apps', label: 'Apps', sub: 'App A / App B', color: s.green, info: 'Each VM runs its own apps on a dedicated guest OS with virtualized hardware allocated by the hypervisor.', diffLeft: 'Apps run on a full guest OS', diffRight: 'Apps are host processes' },
  { id: 'guest', label: 'Guest OS', sub: 'Full Kernel (GBs)', color: s.accent, info: 'Every VM bundles a complete operating system including its own kernel. This is the primary source of overhead -- GBs per VM just for the OS.', diffLeft: 'Separate kernel per VM', diffRight: 'No guest OS needed' },
  { id: 'hypervisor', label: 'Hypervisor', sub: 'Type 1 / 2', color: s.orange, info: 'The hypervisor virtualizes physical hardware -- CPU, RAM, disk, NICs -- and presents virtual devices to each guest OS.', diffLeft: 'Virtualizes entire hardware stack', diffRight: 'Uses host OS primitives' },
  { id: 'host', label: 'Host OS', sub: 'Drives Hardware', color: s.purple, info: 'The host operating system owns the physical machine. The hypervisor runs on top of it (Type 2) or is baked into it (Type 1).', diffLeft: 'Runs hypervisor above', diffRight: 'Shared by all containers' },
  { id: 'hardware', label: 'Hardware', sub: 'CPU / RAM / Disk', color: s.text3, info: 'Physical server. Same regardless of whether you run VMs or containers.', diffLeft: 'Same physical infra', diffRight: 'Same physical infra' },
]

const ctr: LayerDef[] = [
  { id: 'apps', label: 'Apps', sub: 'App 1 / App 2', color: s.green, info: 'Containers run as isolated processes on the host OS. Linux namespaces provide process-level isolation without virtualization overhead.', diffLeft: 'Apps run on a full guest OS', diffRight: 'Apps are host processes' },
  { id: 'libs', label: 'Libraries', sub: 'Bins / Libs (MBs)', color: s.yellow, info: 'Containers only bundle the libraries and binaries the app needs. No kernel, no OS -- just dependencies. This keeps images tiny (MBs).', diffLeft: 'Separate kernel per VM', diffRight: 'No guest OS needed' },
  { id: 'engine', label: 'Container Engine', sub: 'Docker / containerd', color: s.orange, info: 'The engine manages images, containers, volumes, and networking. It uses namespaces for isolation and cgroups for resource limits -- no hardware emulation.', diffLeft: 'Virtualizes entire hardware stack', diffRight: 'Uses host OS primitives' },
  { id: 'host', label: 'Host OS', sub: 'Shared Kernel', color: s.purple, info: 'All containers on a host share the same kernel. The kernel enforces namespace isolation. No duplicate OS overhead -- one kernel serves all containers.', diffLeft: 'Runs hypervisor above', diffRight: 'Shared by all containers' },
  { id: 'hardware', label: 'Hardware', sub: 'CPU / RAM / Disk', color: s.text3, info: 'Physical server. Same regardless of whether you run VMs or containers.', diffLeft: 'Same physical infra', diffRight: 'Same physical infra' },
]

const stats = [
  { label: 'Boot Time', vm: '30-60 s', ctr: '< 1 s', unit: '' },
  { label: 'Size Overhead', vm: '1-5 GB', ctr: '5-200 MB', unit: '' },
  { label: 'Density / Host', vm: '~10', ctr: '~100+', unit: '' },
  { label: 'Kernel', vm: 'Separate per VM', ctr: 'Shared (host)', unit: '' },
  { label: 'Isolation', vm: 'Hardware-level', ctr: 'Process-level', unit: '' },
]

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

export default function ContainerVsVmDemo() {
  const [sel, setSel] = useState<{ side: 'vm' | 'ctr'; idx: number } | null>(null)

  const info = useMemo(() => {
    if (!sel) return null
    const layers = sel.side === 'vm' ? vm : ctr
    const l = layers[sel.idx]
    return { label: l.label, info: l.info, diffLeft: l.diffLeft, diffRight: l.diffRight, color: l.color }
  }, [sel])

  const renderStack = (layers: LayerDef[], side: 'vm' | 'ctr', title: string) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ textAlign: 'center', color: s.text2, fontSize: 14, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        {title}
      </div>
      <div style={{
        background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10,
        overflow: 'hidden',
      }}>
        {layers.map((l, i) => {
          const isSelf = sel?.side === side && sel?.idx === i
          const isPaired = sel && sel.idx === i && sel.side !== side
          return (
            <div key={l.id + i} onClick={() => setSel({ side, idx: i })} style={{
              padding: '10px 14px',
              borderBottom: i < layers.length - 1 ? `1px solid ${s.border}` : 'none',
              background: isSelf ? `${l.color}18` : isPaired ? `${l.color}10` : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderLeft: `3px solid ${isSelf ? l.color : isPaired ? l.color : 'transparent'}`,
            }}>
              <div style={{ color: l.color, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{l.label}</div>
              <div style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>{l.sub}</div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <DemoBoundary name="Container vs VM">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Architecture Comparison</div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {renderStack(vm, 'vm', 'Virtual Machines')}
          <div style={{ width: 1, background: s.border, alignSelf: 'stretch' }} />
          {renderStack(ctr, 'ctr', 'Containers')}
        </div>

        {info && (
          <div style={{
            background: `${info.color}10`,
            border: `1px solid ${info.color}30`,
            borderRadius: 8, padding: '12px 16px', marginBottom: 16,
            transition: 'all 0.3s',
          }}>
            <div style={{ color: info.color, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{info.label}</div>
            <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>{info.info}</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <div style={{ flex: 1, background: s.bg, borderRadius: 6, padding: '6px 10px' }}>
                <span style={{ color: s.text3 }}>VM: </span>
                <span style={{ color: s.text }}>{info.diffLeft}</span>
              </div>
              <div style={{ flex: 1, background: s.bg, borderRadius: 6, padding: '6px 10px' }}>
                <span style={{ color: s.text3 }}>Container: </span>
                <span style={{ color: s.text }}>{info.diffRight}</span>
              </div>
            </div>
          </div>
        )}

        {!info && (
          <div style={{ background: s.bg, borderRadius: 8, padding: '12px 16px', marginBottom: 16, textAlign: 'center' }}>
            <span style={{ color: s.text3, fontSize: 12 }}>Click a layer on either side to see the architectural comparison.</span>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            Side-by-Side Comparison
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 8, padding: '0 4px', marginBottom: 2 }}>
              <div style={{ flex: 2 }} />
              <div style={{ flex: 1, textAlign: 'center', color: s.accent, fontSize: 11, fontWeight: 600 }}>VM</div>
              <div style={{ flex: 1, textAlign: 'center', color: s.green, fontSize: 11, fontWeight: 600 }}>Container</div>
            </div>
            {stats.map((st) => (
              <div key={st.label} style={{
                display: 'flex', gap: 8, alignItems: 'center',
                background: s.bg, borderRadius: 6, padding: '6px 10px',
              }}>
                <div style={{ flex: 2, color: s.text2, fontSize: 12, fontWeight: 500 }}>{st.label}</div>
                <div style={{ flex: 1, textAlign: 'center', color: s.text, fontFamily: s.mono, fontSize: 11 }}>{st.vm}</div>
                <div style={{ flex: 1, textAlign: 'center', color: s.green, fontFamily: s.mono, fontSize: 11 }}>{st.ctr}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
