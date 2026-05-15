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

interface RuntimeInfo {
  id: string
  name: string
  strategy: string
  gen: string
  concurrent: string
  pause: string
  overhead: string
  detail: string
}

const runtimes: RuntimeInfo[] = [
  {
    id: 'v8',
    name: 'V8 (Chrome / Node.js)',
    strategy: 'Generational (Young + Old) with concurrent marking',
    gen: 'Yes -- Eden, Survivor, Old',
    concurrent: 'Concurrent marking, parallel sweep, parallel scavenge',
    pause: '1-5 ms minor GC, up to 30 ms major GC',
    overhead: '~10-20% throughput; pointer compression helps',
    detail: 'V8 divides the heap into a young generation (fast allocation in Eden, two survivor spaces for promotion) and an old generation. Minor GCs use a semispace copy collector (scavenge) that moves surviving objects. Major GCs use concurrent tri-color marking followed by parallel compaction. A generational write barrier ensures the remembered set stays correct. V8 also uses pointer compression on 64-bit to store 32-bit offsets, reducing memory use.',
  },
  {
    id: 'go',
    name: 'Go (Golang)',
    strategy: 'Non-generational concurrent tri-color mark-sweep',
    gen: 'No',
    concurrent: 'Concurrent mark + sweep; non-generational',
    pause: '< 1 ms (typically 0.2-0.5 ms)',
    overhead: '~10-25% throughput; higher at large heap sizes',
    detail: 'Go uses a non-generational concurrent tri-color mark-sweep GC. It avoids generational complexity by keeping stop-the-world pauses extremely short via concurrent marking and sweeping. GC pacing triggers collection when the heap grows by a configurable factor. The write barrier is a hybrid (Dijkstra insertion + Yuasa deletion) to support concurrent marking. Go trades throughput for low latency -- allocation-heavy code may trigger frequent GC cycles.',
  },
  {
    id: 'java',
    name: 'Java G1 GC',
    strategy: 'Generational, region-based, concurrent',
    gen: 'Yes -- Young + Old regions',
    concurrent: 'Concurrent marking (SATB), parallel evacuation',
    pause: '10-50 ms target (configurable with -XX:MaxGCPauseMillis)',
    overhead: '~5-15% throughput',
    detail: 'G1 splits the heap into equal-sized regions (typically ~2048). Young collections evacuate Eden + Survivor regions into empty regions, pausing all threads but finishing quickly. Old collections use concurrent marking with a SATB (snapshot-at-the-beginning) write barrier, then a mixed collection pause that evacuates selected old regions. G1 compacts incrementally to avoid fragmentation. Region sizing avoids full-heap compaction.',
  },
  {
    id: 'python',
    name: 'Python (CPython)',
    strategy: 'Reference counting + generational cycle detector',
    gen: 'Yes (cycle detector only, 3 generations)',
    concurrent: 'No -- stop-the-world for cycle detection',
    pause: 'Refcounting is real-time; cycle detector adds ms-level pauses',
    overhead: 'Every assignment modifies refcounts (cache traffic)',
    detail: 'CPython uses reference counting as its primary GC. Every Py_INCREF / Py_DECREF updates a counter; when it hits zero, memory is freed immediately. This means deterministic cleanup but high overhead on pointer-heavy workloads. A separate generational cycle detector (3 generations) runs periodically to find unreachable cycles that refcounting misses. It is stop-the-world and triggers when allocation counts exceed per-generation thresholds.',
  },
]

export default function GcComparisonDemo() {
  const [selected, setSelected] = useState('v8')
  const rt = runtimes.find((r) => r.id === selected)!

  const tabStyle = (id: string): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: 8,
    border: `1px solid ${selected === id ? s.accent : s.border}`,
    background: selected === id ? `${s.accent}20` : s.bg2,
    color: selected === id ? s.accent : s.text2,
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: selected === id ? 600 : 400,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  })

  return (
    <DemoBoundary name="GC Strategy Comparison">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>GC Strategy Comparison</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {runtimes.map((r) => (
            <button key={r.id} onClick={() => setSelected(r.id)} style={tabStyle(r.id)}>
              {r.name}
            </button>
          ))}
        </div>
        <div style={{ background: s.bg, borderRadius: 12, padding: 20, overflowX: 'auto', border: `1px solid ${s.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${s.border}` }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: s.text3, fontWeight: 600, width: 140 }}>Property</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: s.text3, fontWeight: 600 }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Strategy', rt.strategy],
                ['Generational', rt.gen],
                ['Concurrent', rt.concurrent],
                ['Pause Time', rt.pause],
                ['Throughput Cost', rt.overhead],
              ].map((st) => {
                const [prop, val] = st
                return (
                  <tr key={prop} style={{ borderBottom: `1px solid ${s.border2}` }}>
                    <td style={{ padding: '10px 12px', color: s.text2, fontWeight: 500, whiteSpace: 'nowrap' }}>{prop}</td>
                    <td style={{ padding: '10px 12px', color: s.text }}>{val}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 20, marginTop: 16 }}>
          <div style={{ color: s.text, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{rt.name}</div>
          <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.7 }}>{rt.detail}</div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
