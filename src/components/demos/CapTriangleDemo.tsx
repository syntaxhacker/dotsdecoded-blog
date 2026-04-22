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

type Vertex = 'C' | 'A' | 'P'

const VERTEX_INFO: Record<Vertex, { label: string; full: string; color: string; x: number; y: number }> = {
  C: { label: 'C', full: 'Consistency', color: s.accent, x: 50, y: 20 },
  A: { label: 'A', full: 'Availability', color: s.green, x: 15, y: 80 },
  P: { label: 'P', full: 'Partition Tolerance', color: s.orange, x: 85, y: 80 },
}

const COMBOS: { picked: Vertex[]; sacrificed: Vertex; example: string; description: string }[] = [
  { picked: ['C', 'P'], sacrificed: 'A', example: 'HBase, MongoDB (primary)', description: 'Returns errors rather than stale data. Blocks writes during partitions.' },
  { picked: ['A', 'P'], sacrificed: 'C', example: 'Cassandra, DynamoDB, CouchDB', description: 'Always responds, but data might be stale. Reconciles after partition heals.' },
  { picked: ['C', 'A'], sacrificed: 'P', example: 'Single-node RDBMS, Redis', description: 'No network partitions to worry about. Single machine = no partition.' },
]

function CapTriangleDemoInner() {
  const [selected, setSelected] = useState<Set<Vertex>>(new Set())
  const [partitioned, setPartitioned] = useState(false)

  const toggle = (v: Vertex) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(v)) next.delete(v)
      else if (next.size < 2) next.add(v)
      return next
    })
    if (partitioned) setPartitioned(false)
  }

  const combo = COMBOS.find(c => c.picked.length === selected.size && c.picked.every(v => selected.has(v)))

  const edges = [
    ['C', 'A'] as [Vertex, Vertex],
    ['A', 'P'] as [Vertex, Vertex],
    ['P', 'C'] as [Vertex, Vertex],
  ]

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
      <svg width="100%" viewBox="0 0 100 100" style={{ maxHeight: 280, marginBottom: 14 }}>
        {edges.map(([from, to]) => {
          const bothSelected = selected.has(from) && selected.has(to)
          return (
            <line
              key={`${from}-${to}`}
              x1={VERTEX_INFO[from].x}
              y1={VERTEX_INFO[from].y}
              x2={VERTEX_INFO[to].x}
              y2={VERTEX_INFO[to].y}
              stroke={bothSelected ? '#5b8def' : s.border}
              strokeWidth={bothSelected ? 1.2 : 0.5}
              strokeDasharray={bothSelected ? 'none' : '2 1'}
            />
          )
        })}

        {combo && (
          <line
            x1={VERTEX_INFO[combo.sacrificed].x}
            y1={VERTEX_INFO[combo.sacrificed].y}
            x2={
              (VERTEX_INFO[combo.picked[0]].x + VERTEX_INFO[combo.picked[1]].x) / 2
            }
            y2={
              (VERTEX_INFO[combo.picked[0]].y + VERTEX_INFO[combo.picked[1]].y) / 2
            }
            stroke={s.red}
            strokeWidth={0.6}
            strokeDasharray="2 1.5"
            opacity={0.7}
          />
        )}

        {(Object.entries(VERTEX_INFO) as [Vertex, typeof VERTEX_INFO[Vertex]][]).map(([key, v]) => (
          <g key={key} onClick={() => toggle(key)} style={{ cursor: 'pointer' }}>
            <circle
              cx={v.x}
              cy={v.y}
              r={selected.has(key) ? 8 : 6}
              fill={selected.has(key) ? v.color : s.bg2}
              stroke={v.color}
              strokeWidth={1}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text
              x={v.x}
              y={v.y + 0.8}
              textAnchor="middle"
              fill={selected.has(key) ? s.bg : v.color}
              fontSize="7"
              fontWeight="700"
              fontFamily={s.mono}
              style={{ pointerEvents: 'none' }}
            >
              {v.label}
            </text>
            <text
              x={key === 'C' ? v.x : key === 'A' ? v.x - 2 : v.x + 2}
              y={key === 'C' ? v.y - 13 : v.y + 14}
              textAnchor={key === 'A' ? 'end' : key === 'P' ? 'start' : 'middle'}
              fill={v.color}
              fontSize="4"
              fontWeight="600"
              fontFamily={s.mono}
              style={{ pointerEvents: 'none' }}
            >
              {v.full}
            </text>
            {!selected.has(key) && combo && combo.sacrificed === key && (
              <text
                x={v.x}
                y={key === 'C' ? v.y - 8 : v.y + 20}
                textAnchor="middle"
                fill={s.red}
                fontSize="3.2"
                fontWeight="700"
                fontFamily={s.mono}
                style={{ pointerEvents: 'none' }}
              >
                SACRIFICED
              </text>
            )}
          </g>
        ))}

        {partitioned && (
          <line
            x1={30}
            y1={100}
            x2={70}
            y2={100}
            stroke={s.red}
            strokeWidth={1.5}
            opacity={0.8}
          />
        )}
      </svg>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(Object.entries(VERTEX_INFO) as [Vertex, typeof VERTEX_INFO[Vertex]][]).map(([key, v]) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: 6,
              border: `1px solid ${selected.has(key) ? v.color : s.border}`,
              background: selected.has(key) ? `${v.color}15` : s.bg2,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ fontFamily: s.mono, fontSize: 14, fontWeight: 700, color: selected.has(key) ? v.color : s.text3 }}>
              {v.label}
            </div>
            <div style={{ fontSize: 10, color: s.text2, marginTop: 2 }}>{v.full}</div>
          </button>
        ))}
      </div>

      <button
        onClick={() => { setPartitioned(!partitioned); setSelected(new Set(['A', 'P'])) }}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: 6,
          border: `1px solid ${partitioned ? s.red : s.border}`,
          background: partitioned ? `${s.red}15` : s.bg2,
          color: partitioned ? s.red : s.text2,
          fontFamily: s.mono,
          fontSize: 12,
          cursor: 'pointer',
          marginBottom: 14,
        }}
      >
        {partitioned ? 'Heal Network Partition' : 'Simulate Network Partition'}
      </button>

      {partitioned && (
        <div style={{
          background: `${s.red}10`,
          border: `1px solid ${s.red}30`,
          borderRadius: 6,
          padding: '10px 14px',
          marginBottom: 14,
          fontSize: 12,
          color: s.red,
          lineHeight: 1.5,
        }}>
          Network is partitioned! In reality, P is always required -- networks fail. So you really choose between CP (block until consistent) and AP (serve stale data).
        </div>
      )}

      {combo && (
        <div style={{
          background: s.bg2,
          borderRadius: 8,
          padding: 14,
          border: `1px solid ${s.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: s.mono, fontSize: 14, fontWeight: 700 }}>
              {combo.picked.join(' + ')}
            </span>
            <span style={{ color: s.red, fontFamily: s.mono, fontSize: 12 }}>
              (no {combo.sacrificed})
            </span>
          </div>
          <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.6, marginBottom: 8 }}>
            {combo.description}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {combo.example.split(', ').map(ex => (
              <span key={ex} style={{
                padding: '3px 10px',
                borderRadius: 4,
                background: s.bg,
                border: `1px solid ${s.border}`,
                fontFamily: s.mono,
                fontSize: 11,
                color: s.text2,
              }}>
                {ex}
              </span>
            ))}
          </div>
        </div>
      )}

      {!combo && selected.size === 0 && (
        <div style={{
          background: s.bg2,
          borderRadius: 8,
          padding: 20,
          border: `1px solid ${s.border}`,
          textAlign: 'center',
          color: s.text3,
          fontSize: 13,
        }}>
          Click two vertices to see the trade-off
        </div>
      )}
    </div>
  )
}

export default function CapTriangleDemo() {
  return (
    <DemoBoundary name="CAP Theorem">
      <CapTriangleDemoInner />
    </DemoBoundary>
  )
}
