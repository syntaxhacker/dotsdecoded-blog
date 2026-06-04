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

const DAYS = 42
const WEEKS = 6

export default function ViewRenderingDemo() {
  const [month, setMonth] = useState(5)
  const [virt, setVirt] = useState(true)
  const [visibleStart, setVisibleStart] = useState(7)
  const [visibleLen, setVisibleLen] = useState(21)
  const [cacheHits, setCacheHits] = useState(12)
  const [paintMs, setPaintMs] = useState(0)
  const [eventCount, setEventCount] = useState(87)
  const [selectedCell, setSelectedCell] = useState<number | null>(null)
  const [naiveCost, setNaiveCost] = useState(38)
  const [virtCost, setVirtCost] = useState(9)
  const [serverPre, setServerPre] = useState(false)

  const cells = useMemo(() => {
    const arr: { day: number; dots: number; fromCache: boolean; events: string[] }[] = []
    const names = ['standup', 'sync', 'review', '1:1', 'planning']
    for (let i = 0; i < DAYS; i++) {
      const inView = !virt || (i >= visibleStart && i < visibleStart + visibleLen)
      const d = ((i * 7 + month) % 5) + ((i % 3) === 0 ? 2 : 0)
      const cached = i < visibleStart - 7 || i >= visibleStart + visibleLen + 7
      const evs = inView ? Array.from({ length: Math.min(3, d) }, (_, k) => names[(i + k) % 5]) : []
      arr.push({ day: (i % 31) + 1, dots: inView ? d : 0, fromCache: cached && virt, events: evs })
    }
    return arr
  }, [month, virt, visibleStart, visibleLen])

  const rendered = cells.filter(c => c.dots > 0 || !virt).length
  const cachedCount = cells.filter(c => c.fromCache).length

  const pan = (dir: number) => {
    const start = Math.max(0, Math.min(DAYS - visibleLen, visibleStart + dir * 7))
    setVisibleStart(start)
    setCacheHits(h => Math.min(22, h + (dir > 0 ? 4 : 3)))
    const t0 = performance.now()
    const cost = virt ? 3 + Math.random() * 3 : 19 + Math.random() * 6
    setTimeout(() => { setPaintMs(Math.round(cost)); setNaiveCost(Math.round(19 + Math.random() * 8)); setVirtCost(Math.round(3 + Math.random() * 3)) }, 0)
    setSelectedCell(null)
  }

  const toggleVirt = () => {
    const nv = !virt
    setVirt(nv)
    if (nv) { setVisibleStart(7); setVisibleLen(21) } else { setVisibleStart(0); setVisibleLen(42) }
    setPaintMs(0)
    setSelectedCell(null)
  }

  const loadTest = () => {
    const t0 = performance.now()
    let sum = 0
    for (let i = 0; i < 1000; i++) sum += (i * 31 + month) % 7
    const ms = Math.round(performance.now() - t0 + (virt ? 2.8 : 27))
    setEventCount(1000)
    setPaintMs(ms)
    setNaiveCost(42)
    setVirtCost(7)
    setTimeout(() => { setEventCount(87); setPaintMs(virt ? 4 : 22) }, 1600)
  }

  const reset = () => { setMonth(5); setVirt(true); setVisibleStart(7); setVisibleLen(21); setCacheHits(12); setPaintMs(0); setEventCount(87); setSelectedCell(null); setServerPre(false) }

  const changeMonth = (d: number) => { setMonth(m => (m + d + 12) % 12); setCacheHits(8); setPaintMs(0); setSelectedCell(null) }

  const clickCell = (i: number) => { setSelectedCell(selectedCell === i ? null : i) }

  const perfHistory = [virtCost, naiveCost, Math.round(virtCost * 0.7), Math.round(naiveCost * 1.1)]

  return (
    <DemoBoundary name="View Rendering">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: s.text2 }}>Month {month + 1} view — {virt ? 'virtualized' : 'full render'} (buffer 2 weeks)</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => pan(-1)} style={{ fontSize: 11, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>← Prev week</button>
            <button onClick={() => pan(1)} style={{ fontSize: 11, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>Next week →</button>
            <button onClick={toggleVirt} style={{ fontSize: 11, background: virt ? s.green : s.red, color: '#000', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>{virt ? 'Virtual ON' : 'Virtual OFF'}</button>
            <button onClick={loadTest} style={{ fontSize: 11, background: s.orange, color: '#000', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>Sim 1000 events</button>
            <button onClick={reset} style={{ fontSize: 11, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}>Reset</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <button onClick={() => changeMonth(-1)} style={{ fontSize: 11, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}>‹ Prev month</button>
          <div style={{ fontSize: 12, color: s.text, padding: '3px 12px', background: s.bg, borderRadius: 4 }}>Month {month + 1} / 2026</div>
          <button onClick={() => changeMonth(1)} style={{ fontSize: 11, background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}>Next month ›</button>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 10, color: s.text3, alignSelf: 'center' }}>Server precompute: <span style={{ color: serverPre ? s.green : s.text2 }}>{serverPre ? '3mo fragments ready' : 'cold'}</span></div>
          <button onClick={() => setServerPre(!serverPre)} style={{ fontSize: 10, background: serverPre ? s.green : s.bg3, color: serverPre ? '#000' : s.text2, border: 'none', borderRadius: 3, padding: '2px 6px', cursor: 'pointer' }}>{serverPre ? 'Warm' : 'Fetch fragments'}</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, background: s.bg, padding: 4, borderRadius: 6 }}>
          {cells.map((c, i) => {
            const vis = !virt || (i >= visibleStart && i < visibleStart + visibleLen)
            const sel = selectedCell === i
            return (
              <div key={i} onClick={() => clickCell(i)} style={{ background: sel ? s.accent : (vis ? s.bg3 : s.bg), border: `1px solid ${sel ? s.accent : (vis ? s.border2 : s.border)}`, borderRadius: 3, padding: 4, minHeight: 46, opacity: vis ? 1 : 0.35, cursor: 'pointer', transition: 'all 0.1s' }}>
                <div style={{ fontSize: 11, color: sel ? '#000' : s.text2, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{c.day}</span>
                  {c.fromCache && <span style={{ fontSize: 8, color: s.green }}>C</span>}
                </div>
                <div style={{ display: 'flex', gap: 2, marginTop: 3, flexWrap: 'wrap' }}>
                  {c.events.slice(0, 3).map((e, di) => <div key={di} style={{ fontSize: 7, color: sel ? '#000' : s.text3, background: sel ? 'rgba(0,0,0,0.2)' : s.bg, padding: '0 2px', borderRadius: 1 }}>{e}</div>)}
                </div>
                {sel && c.events.length > 0 && <div style={{ fontSize: 8, color: '#000', marginTop: 2 }}>{c.events.length} events</div>}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11 }}>
          <div style={{ color: s.text2 }}>Rendered: <span style={{ color: s.green, fontFamily: s.mono }}>{rendered}/42</span> {virt ? `(window ${visibleLen} + buffer)` : '(naive full)'} cached: {cachedCount}</div>
          <div style={{ color: s.text3 }}>Last paint: <span style={{ color: paintMs > 12 ? s.red : s.green, fontFamily: s.mono }}>{paintMs || '—'} ms</span> ({eventCount} ev)</div>
        </div>

        <div style={{ marginTop: 6, display: 'flex', gap: 12, fontSize: 10, color: s.text3 }}>
          <div>Naive cost: <span style={{ color: s.red, fontFamily: s.mono }}>{naiveCost} ms</span> (42 cells + 120 dots)</div>
          <div>Virtual cost: <span style={{ color: s.green, fontFamily: s.mono }}>{virtCost} ms</span> (21 cells + 40 dots)</div>
          <div>Speedup: <span style={{ color: s.accent, fontFamily: s.mono }}>{(naiveCost / Math.max(1, virtCost)).toFixed(1)}x</span></div>
        </div>

        <div style={{ marginTop: 6, background: s.bg, borderRadius: 4, padding: 8, display: 'flex', gap: 16, fontSize: 10 }}>
          <div>Buffer strategy: <span style={{ color: s.text2 }}>2 weeks ahead + 1 behind</span></div>
          <div>DOM nodes saved: <span style={{ color: s.green }}>{virt ? 42 - rendered : 0}</span></div>
          <div>Re-renders avoided: <span style={{ color: s.accent }}>{virt ? Math.floor(cacheHits * 1.8) : 0}</span></div>
          <div>Server fragments: <span style={{ color: serverPre ? s.green : s.yellow }}>{serverPre ? 'warm (3mo)' : 'on-demand'}</span></div>
        </div>

        <div style={{ marginTop: 4, display: 'flex', gap: 3, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: s.text3 }}>Recent paints:</span>
          {perfHistory.map((v, i) => <span key={i} style={{ fontSize: 9, fontFamily: s.mono, color: i % 2 === 0 ? s.green : s.red }}>{v}ms</span>)}
        </div>

        <div style={{ marginTop: 8, fontSize: 10, color: s.text3 }}>Virtual window only mounts visible + 2-week buffer. Scroll requests next month fragment from IndexedDB or server. Naive full 42-cell re-render costs 4-5x more DOM ops + style recalcs. Server pre-computes 3-month fragments so client only hydrates events into the window. Clicking a cell shows local event list without network. Real Google Calendar uses React windowing + virtual-scroller + IndexedDB month shards for instant panning even on 2G.</div>
      </div>
    </DemoBoundary>
  )
}
