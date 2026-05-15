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

const nodeColors = [s.accent, s.green, s.orange, s.purple, s.yellow, s.red, '#00d4aa', '#ff87ab']

function hashKey(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) - h + key.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function consistentHash(key: string, nodeCount: number): number {
  return hashKey(key) % nodeCount
}

function modHash(key: string, nodeCount: number): number {
  return hashKey(key) % nodeCount
}

const keyNames = [
  'session:alice', 'session:bob', 'session:carol', 'session:dave',
  'user:1', 'user:2', 'user:3', 'user:4', 'user:5',
  'post:100', 'post:200', 'post:300', 'post:400',
  'cart:alice', 'cart:bob', 'cart:carol',
  'feed:home', 'feed:trending', 'feed:recent',
  'config:limits', 'config:features',
]

export default function CacheShardingDemo() {
  const [nodeCount, setNodeCount] = useState(4)
  const [useVirtual, setUseVirtual] = useState(true)
  const [showSimple, setShowSimple] = useState(false)

  const usedColors = nodeColors.slice(0, nodeCount)

  const keyNodes = keyNames.map((key, i) => {
    const nodeIdx = showSimple
      ? modHash(key, nodeCount)
      : consistentHash(key, nodeCount * (useVirtual ? 100 : 1)) % nodeCount
    return { key, nodeIdx, hash: hashKey(key) }
  })

  const sortedKeys = [...keyNodes].sort((a, b) => a.hash - b.hash)
  const ringSize = 360

  const getAngle = (hash: number) => (hash / 2147483647) * ringSize

  const nodeAngles = usedColors.map((_, i) => {
    const h = hashKey(`node-${i}`)
    return (h / 2147483647) * ringSize
  }).sort((a, b) => a - b)

  const getStatsByNode = () => {
    const counts: Record<number, number> = {}
    for (const k of keyNodes) {
      counts[k.nodeIdx] = (counts[k.nodeIdx] || 0) + 1
    }
    return counts
  }

  const stats = getStatsByNode()

  return (
    <DemoBoundary name="Cache Sharding">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>
        Consistent Hashing Ring
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Keys are distributed across nodes on a hash ring. Adding or removing a node moves only 1/N of keys.
      </p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>
            Cache Nodes: {nodeCount}
          </label>
          <input
            type="range" min={2} max={6}
            value={nodeCount}
            onChange={e => setNodeCount(Number(e.target.value))}
            style={{ width: '100%', accentColor: s.accent }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setUseVirtual(!useVirtual)}
            style={{
              padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
              background: useVirtual ? s.green : s.bg3,
              border: `1px solid ${useVirtual ? s.green : s.border}`,
              color: '#fff', fontSize: 11, fontWeight: 600,
            }}
          >
            Virtual Nodes {useVirtual ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowSimple(!showSimple)}
            style={{
              padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
              background: showSimple ? s.red : s.bg3,
              border: `1px solid ${showSimple ? s.red : s.border}`,
              color: '#fff', fontSize: 11, fontWeight: 600,
            }}
          >
            {showSimple ? 'Simple Mod' : 'Consistent Hash'}
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 20, alignItems: 'flex-start',
      }}>
        <div style={{
          position: 'relative', width: 300, height: 300, flexShrink: 0,
        }}>
          <svg width="300" height="300" viewBox="0 0 300 300">
            <circle cx="150" cy="150" r="130" fill="none" stroke={s.border} strokeWidth="1" strokeDasharray="4 4" />
            {sortedKeys.map((item, i) => {
              const angle = getAngle(item.hash)
              const rad = (angle - 90) * Math.PI / 180
              const r = 115
              const x = 150 + r * Math.cos(rad)
              const y = 150 + r * Math.sin(rad)
              const color = usedColors[item.nodeIdx] || s.text3
              return (
                <g key={i}>
                  <title>{`${item.key} -> node ${item.nodeIdx + 1}`}</title>
                  <circle cx={x} cy={y} r="3" fill={color} opacity={0.8} />
                </g>
              )
            })}
            {nodeAngles.map((angle, i) => {
              const rad = (angle - 90) * Math.PI / 180
              const r = 130
              const x = 150 + r * Math.cos(rad)
              const y = 150 + r * Math.sin(rad)
              return (
                <g key={`node-${i}`}>
                  <circle cx={x} cy={y} r="12" fill={usedColors[i]} stroke={s.bg} strokeWidth="2" />
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central"
                    fill="#fff" fontSize="10" fontWeight="700">{i + 1}</text>
                </g>
              )
            })}
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: s.bg2, borderRadius: 10, padding: 12, marginBottom: 10,
            border: `1px solid ${s.border}`,
          }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Key Distribution
            </div>
            {usedColors.map((color, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '3px 0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  <span style={{ color: s.text2, fontSize: 12 }}>Node {i + 1}</span>
                </div>
                <span style={{ color: s.text, fontFamily: s.mono, fontSize: 12 }}>
                  {stats[i] || 0} keys
                </span>
              </div>
            ))}
          </div>

          <div style={{
            background: s.bg2, borderRadius: 10, padding: 12,
            border: `1px solid ${s.border}`,
          }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Keys on Ring
            </div>
            <div style={{
              maxHeight: 110, overflowY: 'auto',
              display: 'flex', flexWrap: 'wrap', gap: 4,
            }}>
              {keyNodes.map((item, i) => (
                <span
                  key={i}
                  title={`${item.key}`}
                  style={{
                    background: `${usedColors[item.nodeIdx]}20`,
                    color: usedColors[item.nodeIdx],
                    fontFamily: s.mono, fontSize: 10,
                    padding: '1px 6px', borderRadius: 4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.key}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showSimple && (
        <div style={{
          marginTop: 16, background: `${s.red}12`, border: `1px solid ${s.red}`,
          borderRadius: 8, padding: '10px 14px',
        }}>
          <span style={{ color: s.red, fontSize: 12, fontWeight: 600 }}>Warning: </span>
          <span style={{ color: s.text2, fontSize: 12 }}>
            Simple modulo (key % N) redistributes ALL keys when N changes. Consistent hashing
            moves only the keys that hash to the added/removed node.
          </span>
        </div>
      )}
    </div>
    </DemoBoundary>
  )
}
