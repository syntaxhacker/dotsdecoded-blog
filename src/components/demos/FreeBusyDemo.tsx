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

const USERS = ['Alice', 'Bob', 'Carol', 'Dave']
const SLOTS = 48

export default function FreeBusyDemo() {
  const [busy, setBusy] = useState<Record<string, boolean[]>>(() => {
    const init: Record<string, boolean[]> = {}
    USERS.forEach(u => { init[u] = Array(SLOTS).fill(false) })
    return init
  })
  const [painting, setPainting] = useState<{ user: string; val: boolean } | null>(null)
  const [workingOnly, setWorkingOnly] = useState(true)
  const [computed, setComputed] = useState(false)

  const toggleSlot = (user: string, slot: number, forceVal?: boolean) => {
    setBusy(prev => {
      const next = { ...prev, [user]: [...prev[user]] }
      next[user][slot] = forceVal !== undefined ? forceVal : !next[user][slot]
      return next
    })
  }

  const startPaint = (user: string, slot: number) => {
    const val = !busy[user][slot]
    setPainting({ user, val })
    toggleSlot(user, slot, val)
  }

  const doPaint = (user: string, slot: number) => {
    if (painting && painting.user === user) toggleSlot(user, slot, painting.val)
  }

  const endPaint = () => setPainting(null)

  const freeSlots = useMemo(() => {
    const res: number[] = []
    for (let i = 0; i < SLOTS; i++) {
      const allFree = USERS.every(u => !busy[u][i])
      res.push(allFree ? 1 : 0)
    }
    return res
  }, [busy])

  const commonFree = useMemo(() => {
    const blocks: { start: number; len: number }[] = []
    let cur = -1
    freeSlots.forEach((f, i) => {
      if (f && cur === -1) cur = i
      if (!f && cur !== -1) { blocks.push({ start: cur, len: i - cur }); cur = -1 }
    })
    if (cur !== -1) blocks.push({ start: cur, len: SLOTS - cur })
    return blocks.filter(b => b.len >= 1)
  }, [freeSlots])

  const suggestions = useMemo(() => {
    const bizStart = workingOnly ? 18 : 0
    const bizEnd = workingOnly ? 34 : 48
    return commonFree
      .filter(b => b.start >= bizStart && b.start + b.len <= bizEnd)
      .sort((a, b) => b.len - a.len)
      .slice(0, 3)
      .map(b => {
        const h = Math.floor(b.start / 2)
        const m = (b.start % 2) * 30
        const endH = Math.floor((b.start + b.len) / 2)
        const endM = ((b.start + b.len) % 2) * 30
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} - ${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
      })
  }, [commonFree, workingOnly])

  const clearAll = () => {
    const cleared: Record<string, boolean[]> = {}
    USERS.forEach(u => { cleared[u] = Array(SLOTS).fill(false) })
    setBusy(cleared)
    setComputed(false)
  }

  const compute = () => setComputed(true)

  return (
    <DemoBoundary name="Free/Busy Aggregation">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 14 }} onMouseLeave={endPaint}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: s.text2 }}>Click or drag on rows to mark busy blocks (30 min slots)</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setWorkingOnly(!workingOnly)} style={{ background: workingOnly ? s.accent : s.bg3, color: workingOnly ? '#fff' : s.text2, border: 'none', borderRadius: 4, padding: '3px 9px', fontSize: 11, cursor: 'pointer' }}>{workingOnly ? 'Business hours only' : 'All 24h'}</button>
            <button onClick={compute} style={{ background: s.green, color: '#000', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Compute Common Free</button>
            <button onClick={clearAll} style={{ background: s.bg3, color: s.text2, border: `1px solid ${s.border}`, borderRadius: 4, padding: '3px 9px', fontSize: 11, cursor: 'pointer' }}>Clear</button>
          </div>
        </div>

        {USERS.map(user => (
          <div key={user} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 11, color: s.text2, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>{user} <span style={{ color: s.text3, fontSize: 9 }}>24h timeline</span></div>
            <div style={{ display: 'flex', gap: 1, background: s.bg, padding: 3, borderRadius: 4 }} onMouseUp={endPaint}>
              {Array.from({ length: SLOTS }).map((_, i) => {
                const isBusy = busy[user][i]
                return (
                  <div key={i} onMouseDown={() => startPaint(user, i)} onMouseEnter={() => doPaint(user, i)} style={{ flex: 1, height: 18, background: isBusy ? s.red : s.bg3, borderRadius: 2, cursor: 'pointer', transition: 'background 0.1s' }} title={`${Math.floor(i / 2)}:${(i % 2) * 30}`} />
                )
              })}
            </div>
          </div>
        ))}

        {computed && (
          <div style={{ marginTop: 12, background: s.bg, borderRadius: 6, padding: 10, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 11, color: s.text2, marginBottom: 6 }}>MERGED FREE/BUSY (green = all 4 free)</div>
            <div style={{ display: 'flex', gap: 1, height: 22, background: s.bg3, borderRadius: 3, overflow: 'hidden' }}>
              {freeSlots.map((f, i) => <div key={i} style={{ flex: 1, background: f ? s.green : s.red, opacity: f ? 0.9 : 0.35 }} />)}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: s.text2 }}>Suggested meeting times (longest free windows):</div>
            <div style={{ fontFamily: s.mono, color: s.green, fontSize: 13, marginTop: 4 }}>{suggestions.length ? suggestions.join('  •  ') : 'No overlapping free slots of 30+ min in range'}</div>
          </div>
        )}

        <div style={{ fontSize: 10, color: s.text3, marginTop: 10 }}>Real systems use roaring bitmaps (one per calendar) for O(1) intersection of 10M calendars. 30-min granularity keeps bitmap ~2 KB per user per year.</div>
      </div>
    </DemoBoundary>
  )
}
