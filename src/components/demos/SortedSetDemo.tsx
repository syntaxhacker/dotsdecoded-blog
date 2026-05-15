import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Player {
  id: string; name: string; score: number
}

const initialPlayers: Player[] = [
  { id: 'p1', name: 'ShadowStrike', score: 2500 },
  { id: 'p2', name: 'PixelWarden', score: 2350 },
  { id: 'p3', name: 'NeonFury', score: 2200 },
  { id: 'p4', name: 'CyberViper', score: 2100 },
  { id: 'p5', name: 'ThunderAxe', score: 1950 },
  { id: 'p6', name: 'BladeDancer', score: 1800 },
  { id: 'p7', name: 'FrostByte', score: 1700 },
  { id: 'p8', name: 'StormChaser', score: 1550 },
  { id: 'p9', name: 'VoidWalker', score: 1400 },
  { id: 'p10', name: 'EmberLord', score: 1250 },
]

const skiplistNodes: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [0, 2, 4, 6, 8],
  [0, 4, 8],
]

const searchPaths: Record<number, [number, number][]> = {
  0: [[2,0],[1,0],[0,0]],
  1: [[2,0],[1,0],[0,0],[0,1]],
  2: [[2,0],[1,0],[1,2],[0,2]],
  3: [[2,0],[1,0],[1,2],[0,2],[0,3]],
  4: [[2,0],[2,4],[1,4],[0,4]],
  5: [[2,0],[2,4],[1,4],[0,4],[0,5]],
  6: [[2,0],[2,4],[1,4],[1,6],[0,6]],
  7: [[2,0],[2,4],[1,4],[1,6],[0,6],[0,7]],
  8: [[2,0],[2,4],[2,8],[1,8],[0,8]],
  9: [[2,0],[2,4],[2,8],[1,8],[0,8],[0,9]],
}

const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

export default function SortedSetDemo() {
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [selectedId, setSelectedId] = useState<string>('p5')
  const [moveMsg, setMoveMsg] = useState<{ name: string; from: number; to: number; dir: 'up' | 'down' | null } | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const sorted = useMemo(() =>
    [...players].sort((a, b) => b.score - a.score),
    [players]
  )

  const selectedPlayer = players.find(p => p.id === selectedId)
  const selectedRank = sorted.findIndex(p => p.id === selectedId) + 1

  const adjustScore = useCallback((delta: number) => {
    setPlayers(prev => {
      const oldRank = [...prev].sort((a, b) => b.score - a.score).findIndex(p => p.id === selectedId) + 1
      const updated = prev.map(p => p.id === selectedId ? { ...p, score: Math.max(0, p.score + delta) } : p)
      const newRank = [...updated].sort((a, b) => b.score - a.score).findIndex(p => p.id === selectedId) + 1
      const player = updated.find(p => p.id === selectedId)!
      let dir: 'up' | 'down' | null = null
      if (newRank < oldRank) dir = 'up'
      else if (newRank > oldRank) dir = 'down'
      setMoveMsg({ name: player.name, from: oldRank, to: newRank, dir })
      setHighlightId(selectedId)
      setTimeout(() => setHighlightId(null), 1500)
      return updated
    })
  }, [selectedId])

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setPlayers(prev => prev.map(p => p.id === selectedId ? { ...p, score: val } : p))
  }, [selectedId])

  const selectedIdx = sorted.findIndex(p => p.id === selectedId)
  const path = selectedIdx >= 0 ? searchPaths[selectedIdx] : []

  const slotW = 52
  const svgW = 10 * slotW + 40
  const svgH = 130

  return (
    <DemoBoundary name="Redis Sorted Set">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>Redis Sorted Set</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Players ranked by score. Click a row to select, then adjust the score to see the entry move.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ color: s.text2, fontSize: 13 }}>Selected: <strong style={{ color: s.text, fontFamily: s.mono }}>{selectedPlayer?.name}</strong></span>
          <span style={{ color: s.text2, fontSize: 13 }}>Score: <strong style={{ color: s.accent, fontFamily: s.mono }}>{selectedPlayer?.score}</strong></span>
          <span style={{ color: s.text2, fontSize: 13 }}>Rank: <strong style={{ color: s.green, fontFamily: s.mono }}>#{selectedRank}</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>Score</span>
          <input type="range" min={0} max={3000} value={selectedPlayer?.score ?? 0} onChange={handleSlider}
            style={{ flex: 1, accentColor: s.accent }} />
          <button onClick={() => adjustScore(-100)} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 14px',
            color: s.text2, cursor: 'pointer', fontSize: 12, fontFamily: s.mono,
          }}>-100</button>
          <button onClick={() => adjustScore(100)} style={{
            background: s.accent, border: 'none', borderRadius: 6, padding: '6px 14px',
            color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: s.mono, fontWeight: 600,
          }}>+100</button>
          <button onClick={() => adjustScore(500)} style={{
            background: s.green, border: 'none', borderRadius: 6, padding: '6px 14px',
            color: '#000', cursor: 'pointer', fontSize: 12, fontFamily: s.mono, fontWeight: 600,
          }}>+500</button>
        </div>

        {moveMsg && (
          <div style={{
            marginBottom: 16, padding: '8px 14px', borderRadius: 8,
            background: moveMsg.dir === 'up' ? `${s.green}15` : moveMsg.dir === 'down' ? `${s.red}15` : s.bg3,
            border: `1px solid ${moveMsg.dir === 'up' ? s.green : moveMsg.dir === 'down' ? s.red : s.border}`,
            fontSize: 13, fontFamily: s.mono,
            color: moveMsg.dir === 'up' ? s.green : moveMsg.dir === 'down' ? s.red : s.text2,
          }}>
            {moveMsg.name}: #{moveMsg.from} → #{moveMsg.to} {moveMsg.dir === 'up' ? '(moved up)' : moveMsg.dir === 'down' ? '(moved down)' : '(unchanged)'}
          </div>
        )}

        <div style={{
          border: `1px solid ${s.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16,
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '50px 1fr 80px',
            padding: '8px 14px', background: s.bg3, fontSize: 11, fontFamily: s.mono,
            color: s.text3, textTransform: 'uppercase', letterSpacing: 1, borderBottom: `1px solid ${s.border}`,
          }}>
            <span>Rank</span><span>Player</span><span style={{ textAlign: 'right' }}>Score</span>
          </div>
          {sorted.map((pl, i) => (
            <div key={pl.id} onClick={() => setSelectedId(pl.id)} style={{
              display: 'grid', gridTemplateColumns: '50px 1fr 80px', padding: '7px 14px', cursor: 'pointer',
              borderBottom: i < sorted.length - 1 ? `1px solid ${s.border}33` : 'none',
              background: pl.id === selectedId ? `${s.accent}12` : highlightId === pl.id ? `${s.yellow}18` : 'transparent',
              transition: 'background 0.3s',
            }}>
              <span style={{ color: i < 3 ? s.yellow : s.text3, fontFamily: s.mono, fontSize: 13, fontWeight: i < 3 ? 700 : 400 }}>
                {i + 1}
              </span>
              <span style={{ color: s.text, fontSize: 13, fontWeight: pl.id === selectedId ? 600 : 400 }}>{pl.name}</span>
              <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 13, textAlign: 'right', fontWeight: 600 }}>{pl.score}</span>
            </div>
          ))}
        </div>

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          fontFamily: s.mono, fontSize: 12, lineHeight: 1.8,
        }}>
          <div style={{ color: s.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Redis Commands</div>
          <div style={{ color: s.green }}>$ ZADD leaderboard:global {selectedPlayer?.score} &quot;{selectedPlayer?.name}&quot;</div>
          <div style={{ color: s.text2 }}>&gt; (integer) 1</div>
          <div style={{ color: s.green }}>$ ZREVRANK leaderboard:global &quot;{selectedPlayer?.name}&quot;</div>
          <div style={{ color: s.text2 }}>&gt; (integer) {selectedRank - 1}</div>
          <div style={{ color: s.text3, marginTop: 6, fontSize: 11 }}>
            O(log N) insert — {sorted.length} members, ~{Math.ceil(Math.log2(sorted.length + 1))} steps
          </div>
        </div>
      </div>

      <div style={SEC}>
        <div style={{ fontSize: 18, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>Skiplist Search Path</div>
        <p style={{ color: s.text2, fontSize: 13, margin: '0 0 12px 0', lineHeight: 1.5 }}>
          Redis sorted sets are backed by a skiplist. The highlighted path shows how the skiplist finds rank #{selectedIdx + 1} in O(log N) time.
        </p>

        <svg width="100%" viewBox={`0 -10 ${svgW} ${svgH}`} style={{ display: 'block', overflow: 'hidden' }}>
          {[0, 1, 2].map(level => {
            const nodes = skiplistNodes[level]
            const y = level === 0 ? 90 : level === 1 ? 50 : 10
            const cy = y + 10
            const pathSet = new Set(path.filter(p => p[0] === level).map(p => p[1]))
            const conS = `rgba(255,255,255,0.15)`

            return (
              <g key={level}>
                {nodes.slice(0, -1).map((n, i) => {
                  const nx = 20 + n * slotW
                  const nnx = 20 + nodes[i + 1] * slotW
                  return (
                    <line key={`c${level}-${n}`} x1={nx + 16} y1={cy} x2={nnx + 16} y2={cy}
                      stroke={conS} strokeWidth={1.5} />
                  )
                })}
                {(level + 1 <= 2 ? path.filter(p => p[0] === level + 1) : []).filter(p => {
                  const levelNodes = new Set(skiplistNodes[level])
                  return levelNodes.has(p[1])
                }).map(p => {
                  const nx = 20 + p[1] * slotW
                  return (
                    <line key={`drop-${level}-${p[1]}`} x1={nx + 16} y1={cy - 10} x2={nx + 16} y2={cy}
                      stroke={`${s.accent}44`} strokeWidth={1} strokeDasharray="3,3" />
                  )
                })}
                {nodes.map(n => {
                  const visited = pathSet.has(n)
                  const isFound = level === 0 && n === selectedIdx
                  const nx = 20 + n * slotW
                  return (
                    <g key={`node-${level}-${n}`}>
                      <rect x={nx} y={y} width={32} height={20} rx={4}
                        fill={isFound ? s.green : visited ? s.accent : s.bg3}
                        stroke={visited ? (isFound ? s.green : s.accent) : s.border}
                        strokeWidth={visited ? 2 : 1}
                        style={{ transition: 'all 0.3s' }}
                      />
                      <text x={nx + 16} y={y + 14} textAnchor="middle" fill={visited ? '#fff' : s.text3}
                        fontSize={10} fontFamily={s.mono} fontWeight={visited ? 700 : 400}>
                        {n}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })}
          <text x={20} y={-1} fill={s.text3} fontSize={9} fontFamily={s.mono}>Level 2</text>
          <text x={20} y={39} fill={s.text3} fontSize={9} fontFamily={s.mono}>Level 1</text>
          <text x={20} y={79} fill={s.text3} fontSize={9} fontFamily={s.mono}>Level 0</text>
        </svg>

        <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 11, fontFamily: s.mono, color: s.text3, flexWrap: 'wrap' }}>
          <span><span style={{ color: s.accent }}>Blue</span> = visited during search</span>
          <span><span style={{ color: s.green }}>Green</span> = target found</span>
          <span>Dashed = drop down</span>
          <span style={{ color: s.text2 }}>N = {sorted.length}, O(log N) = {Math.ceil(Math.log2(sorted.length))} levels</span>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
