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

type Strategy = 'hash' | 'range' | 'directory'

function simpleHash(key: string, numShards: number): number {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % numShards
}

const COLORS = [s.accent, s.green, s.orange, s.purple]

function ShardingStrategyDemoInner() {
  const [strategy, setStrategy] = useState<Strategy>('hash')
  const [inputKey, setInputKey] = useState('')
  const [numShards, setNumShards] = useState(3)
  const [records, setRecords] = useState<{ key: string; shard: number }[]>([])
  const [directory, setDirectory] = useState<Record<string, number>>({
    'users': 0, 'products': 1, 'orders': 2, 'sessions': 0,
  })

  const shardCounts = useMemo(() => {
    const counts = new Array(numShards).fill(0)
    records.forEach(r => { counts[r.shard]++ })
    return counts
  }, [records, numShards])

  const assignShard = (key: string): number => {
    switch (strategy) {
      case 'hash': return simpleHash(key, numShards)
      case 'range': {
        const code = key.charCodeAt(0) || 0
        const bucket = Math.floor((code - 97) / (26 / numShards))
        return Math.min(bucket, numShards - 1)
      }
      case 'directory': return directory[key] ?? 0
      default: return 0
    }
  }

  const handleAdd = () => {
    const trimmed = inputKey.trim().toLowerCase()
    if (!trimmed || records.some(r => r.key === trimmed)) return
    const shard = assignShard(trimmed)
    setRecords(prev => [...prev, { key: trimmed, shard }])
    setInputKey('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  const handleReset = () => {
    setRecords([])
    setInputKey('')
  }

  const rangeBounds = useMemo(() => {
    if (strategy !== 'range') return []
    const bounds: { start: string; end: string; shard: number }[] = []
    for (let i = 0; i < numShards; i++) {
      const start = String.fromCharCode(97 + Math.floor(i * 26 / numShards))
      const end = String.fromCharCode(96 + Math.floor((i + 1) * 26 / numShards))
      bounds.push({ start, end, shard: i })
    }
    return bounds
  }, [strategy, numShards])

  const isHot = (idx: number) => shardCounts[idx] > (records.length / numShards) * 1.8 && records.length > 2

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['hash', 'range', 'directory'] as Strategy[]).map(st => (
          <button
            key={st}
            onClick={() => { setStrategy(st); setRecords([]) }}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: `1px solid ${strategy === st ? COLORS[(['hash', 'range', 'directory'] as Strategy[]).indexOf(st)] : s.border}`,
              background: strategy === st ? `${COLORS[(['hash', 'range', 'directory'] as Strategy[]).indexOf(st)]}20` : s.bg2,
              color: strategy === st ? COLORS[(['hash', 'range', 'directory'] as Strategy[]).indexOf(st)] : s.text3,
              fontFamily: s.mono,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {st === 'hash' ? 'Hash' : st === 'range' ? 'Range' : 'Directory'}
          </button>
        ))}
      </div>

      {strategy === 'hash' && (
        <div style={{ background: `${s.accent}10`, border: `1px solid ${s.accent}30`, borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 11, color: s.accent, fontFamily: s.mono, lineHeight: 1.5 }}>
          hash(key) mod {numShards} = shard index. Even distribution, but cross-shard queries are expensive.
        </div>
      )}
      {strategy === 'range' && (
        <div style={{ background: `${s.green}10`, border: `1px solid ${s.green}30`, borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 11, color: s.green, fontFamily: s.mono, lineHeight: 1.5 }}>
          Keys sorted by first character into ranges. Range scans are fast, but hotspots form on popular ranges.
        </div>
      )}
      {strategy === 'directory' && (
        <div style={{ background: `${s.orange}10`, border: `1px solid ${s.orange}30`, borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 11, color: s.orange, fontFamily: s.mono, lineHeight: 1.5 }}>
          Lookup table maps each key to a shard. Most flexible, but the directory itself becomes a bottleneck.
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <input
          type="text"
          value={inputKey}
          onChange={e => setInputKey(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={strategy === 'directory' ? 'users, products, orders...' : 'any key (e.g. alice, order42)'}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 6,
            border: `1px solid ${s.border}`,
            background: s.bg2,
            color: s.text,
            fontFamily: s.mono,
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={!inputKey.trim()}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: `1px solid ${s.accent}`,
            background: `${s.accent}20`,
            color: s.accent,
            fontFamily: s.mono,
            fontSize: 12,
            cursor: inputKey.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Add
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: `1px solid ${s.border}`,
            background: s.bg2,
            color: s.text3,
            fontFamily: s.mono,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono, whiteSpace: 'nowrap' }}>Shards</span>
        <input
          type="range"
          min={2}
          max={4}
          value={numShards}
          onChange={e => { setNumShards(Number(e.target.value)); setRecords([]) }}
          style={{ flex: 1, accentColor: s.accent, height: 4 }}
        />
        <span style={{ fontFamily: s.mono, fontSize: 13, color: s.accent, minWidth: 16 }}>{numShards}</span>
      </div>

      {strategy === 'directory' && (
        <div style={{ background: s.bg2, borderRadius: 8, padding: 12, border: `1px solid ${s.border}`, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>Directory Table</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {Object.entries(directory).map(([k, sh]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: s.bg, borderRadius: 4 }}>
                <span style={{ fontFamily: s.mono, fontSize: 12, color: s.text2 }}>{k}</span>
                <span style={{ fontFamily: s.mono, fontSize: 12, color: COLORS[sh] }}>Shard {sh + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {strategy === 'range' && rangeBounds.length > 0 && (
        <div style={{ background: s.bg2, borderRadius: 8, padding: 12, border: `1px solid ${s.border}`, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>Range Mapping</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {rangeBounds.map(rb => (
              <div key={rb.shard} style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 4,
                background: s.bg,
                border: `1px solid ${COLORS[rb.shard]}40`,
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: s.mono, fontSize: 13, color: COLORS[rb.shard], fontWeight: 600 }}>
                  {rb.start.toUpperCase()}-{rb.end.toUpperCase()}
                </div>
                <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>Shard {rb.shard + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${numShards}, 1fr)`, gap: 10, marginBottom: 14 }}>
        {Array.from({ length: numShards }, (_, i) => {
          const shardRecords = records.filter(r => r.shard === i)
          return (
            <div key={i} style={{
              background: s.bg2,
              borderRadius: 8,
              padding: 12,
              border: `1px solid ${isHot(i) ? s.red : COLORS[i]}40`,
              minHeight: 120,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontFamily: s.mono, fontSize: 12, fontWeight: 600, color: COLORS[i] }}>Shard {i + 1}</span>
                <span style={{ fontFamily: s.mono, fontSize: 10, color: isHot(i) ? s.red : s.text3 }}>
                  {shardRecords.length} records{isHot(i) ? ' (HOTSPOT)' : ''}
                </span>
              </div>
              <div style={{
                height: 6,
                background: s.bg3,
                borderRadius: 3,
                marginBottom: 8,
              }}>
                <div style={{
                  width: `${records.length > 0 ? (shardRecords.length / records.length) * 100 : 0}%`,
                  height: '100%',
                  background: isHot(i) ? s.red : COLORS[i],
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                  minWidth: records.length > 0 ? 4 : 0,
                }} />
              </div>
              {shardRecords.length === 0 ? (
                <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono, textAlign: 'center', paddingTop: 16 }}>Empty</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {shardRecords.map(r => (
                    <div key={r.key} style={{
                      padding: '4px 8px',
                      background: s.bg,
                      borderRadius: 4,
                      fontFamily: s.mono,
                      fontSize: 11,
                      color: s.text2,
                    }}>
                      {r.key}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {records.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 8,
          background: s.bg2,
          borderRadius: 6,
          padding: '8px 12px',
          border: `1px solid ${s.border}`,
        }}>
          <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>Distribution:</span>
          {shardCounts.map((c, i) => (
            <span key={i} style={{ fontSize: 11, fontFamily: s.mono, color: COLORS[i] }}>
              S{i + 1}: {c}
            </span>
          ))}
          <span style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>
            Total: {records.length}
          </span>
        </div>
      )}
    </div>
  )
}

export default function ShardingStrategyDemo() {
  return (
    <DemoBoundary name="Sharding Strategy">
      <ShardingStrategyDemoInner />
    </DemoBoundary>
  )
}
