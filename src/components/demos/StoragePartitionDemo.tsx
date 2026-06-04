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

export default function StoragePartitionDemo() {
  const [userId, setUserId] = useState(74291)
  const [month, setMonth] = useState('2026-06')
  const [events, setEvents] = useState<{ shard: number; m: string }[]>([])
  const [showExplain, setShowExplain] = useState(false)

  const shard = useMemo(() => {
    const hash = (userId * 2654435761) >>> 0
    return hash % 1024
  }, [userId])

  const timeBucket = month

  const vizShard = shard % 16

  const addEvent = () => {
    setEvents(prev => [...prev.slice(-18), { shard, m: month }])
  }

  const simulateBatch = () => {
    const batch: { shard: number; m: string }[] = []
    for (let i = 0; i < 50; i++) {
      const uid = 10000 + Math.floor(Math.random() * 90000)
      const h = (uid * 2654435761) >>> 0
      batch.push({ shard: h % 1024, m: month })
    }
    setEvents(prev => [...prev.slice(-5), ...batch])
  }

  const shardCounts = useMemo(() => {
    const c: Record<number, number> = {}
    events.forEach(e => { c[e.shard] = (c[e.shard] || 0) + 1 })
    return c
  }, [events])

  const hotShards = Object.entries(shardCounts).filter(([, v]) => v > 4).length
  const maxLoad = Math.max(0, ...Object.values(shardCounts))

  const shards = Array.from({ length: 16 }, (_, i) => i)

  const presets = [1423, 47891, 99102, 234567]

  return (
    <DemoBoundary name="Storage Partitioning">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {presets.map((p, i) => (
            <button key={i} onClick={() => setUserId(p)} style={{ background: userId === p ? s.accent : s.bg3, color: userId === p ? '#fff' : s.text2, border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>User {p}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 3 }}>USER ID</div>
            <input type="number" value={userId} onChange={e => setUserId(Number(e.target.value) || 1)} style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, color: s.text, borderRadius: 6, padding: '8px 10px', fontFamily: s.mono, fontSize: 15 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: s.text3, marginBottom: 3 }}>EVENT MONTH</div>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, color: s.text, borderRadius: 6, padding: '7px 10px', fontSize: 14 }} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <button onClick={addEvent} style={{ background: s.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', flex: 1 }}>Route 1</button>
            <button onClick={simulateBatch} style={{ background: s.orange, color: '#000', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', flex: 1 }}>Sim 50</button>
          </div>
        </div>

        <div style={{ background: s.bg, borderRadius: 6, padding: 10, border: `1px solid ${s.border}`, marginBottom: 10, fontFamily: s.mono, fontSize: 12 }}>
          shard = hash({userId}) % 1024 = <span style={{ color: s.accent, fontWeight: 700 }}>{shard}</span> &nbsp;|&nbsp; time_bucket = {timeBucket} &nbsp;|&nbsp; region us-east-1
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
          {shards.map(i => {
            const isTarget = i === vizShard
            const cnt = shardCounts[(i < 8 ? i : i + 1000)] || 0
            return (
              <div key={i} style={{ background: isTarget ? s.accent : s.bg3, color: isTarget ? '#fff' : s.text2, borderRadius: 6, padding: '9px 4px', textAlign: 'center', border: isTarget ? `2px solid ${s.green}` : `1px solid ${s.border}`, transition: 'all 0.2s' }}>
                <div style={{ fontSize: 9, opacity: 0.7 }}>SHARD</div>
                <div style={{ fontFamily: s.mono, fontSize: 16, fontWeight: 700 }}>{(i * 64) % 1024}</div>
                <div style={{ fontSize: 9 }}>{cnt} ev</div>
              </div>
            )
          })}
        </div>

        {hotShards > 0 && <div style={{ background: `${s.red}20`, border: `1px solid ${s.red}`, color: s.red, borderRadius: 6, padding: '6px 10px', fontSize: 12, marginBottom: 8 }}>Hot shards: {hotShards} shards have {maxLoad}+ events. Bad distribution hurts tail latency.</div>}

        <div style={{ fontSize: 11, color: s.text2, marginBottom: 4 }}>Last {events.length} routed events (hover to see skew):</div>
        <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, background: s.bg, padding: 8, borderRadius: 4, minHeight: 36, marginBottom: 8 }}>
          {events.length === 0 && 'Add events to see routing distribution across shards'}
          {events.slice(-8).map((e, i) => <span key={i} style={{ marginRight: 10, color: shardCounts[e.shard] > 3 ? s.red : s.text2 }}>s{e.shard}</span>)}
        </div>

        <button onClick={() => setShowExplain(!showExplain)} style={{ background: 'transparent', border: `1px solid ${s.border}`, color: s.text3, borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer', marginBottom: 6 }}>Why (user_id, time) composite?</button>
        {showExplain && <div style={{ fontSize: 10, color: s.text3, lineHeight: 1.45, background: s.bg, padding: 8, borderRadius: 4 }}>User hash gives even spread (no user owns a shard). Time bucket gives query locality (all June events for a user live in same 2-3 shards). Secondary index on (owner, month) lets month-view hit O(1) shards instead of fan-out to 1024.</div>}

        <div style={{ fontSize: 10, color: s.text3, lineHeight: 1.4 }}>1024 logical shards per region. Events are co-located by (hash(user), month) so a month view for one calendar touches &lt;4 physical nodes.</div>
      </div>
    </DemoBoundary>
  )
}
