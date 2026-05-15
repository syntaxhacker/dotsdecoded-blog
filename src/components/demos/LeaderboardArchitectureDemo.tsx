import { useState, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type CompId = 'client' | 'api' | 'score' | 'redis' | 'cache' | 'db'

interface CompInfo {
  id: CompId
  label: string
  sub: string
  color: string
  desc: string
}

const components: CompInfo[] = [
  { id: 'client', label: 'Game Client', sub: 'Mobile / Web', color: s.text2, desc: 'Player submits a score or views the leaderboard. Sends HTTP requests through the API gateway.' },
  { id: 'api', label: 'API Gateway', sub: 'Auth / Routing / Throttle', color: s.yellow, desc: 'Authenticates the player, routes to the score service, applies rate limits per user.' },
  { id: 'score', label: 'Score Service', sub: 'Business Logic', color: s.accent, desc: 'Validates the score, applies anti-cheat rules, writes to Redis and queues DB persistence.' },
  { id: 'redis', label: 'Redis Sorted Set', sub: 'leaderboard:global', color: s.red, desc: 'The single source of truth for rankings. O(log N) insert with ZADD. O(1) rank lookup with ZREVRANK.' },
  { id: 'cache', label: 'Cache (Top 100)', sub: 'Redis String / Memory', color: s.green, desc: 'Cached top 100 leaderboard as a JSON string. TTL-based. Invalidated when a top-100 score changes.' },
  { id: 'db', label: 'Database', sub: 'PostgreSQL / S3', color: s.purple, desc: 'Persistent store for score history, player profiles, and audit logs. Written async via queue.' },
]

const compPos: Record<CompId, { x: number; y: number }> = {
  client: { x: 70, y: 165 },
  api: { x: 210, y: 165 },
  score: { x: 350, y: 165 },
  redis: { x: 510, y: 100 },
  cache: { x: 510, y: 230 },
  db: { x: 650, y: 165 },
}

interface FlowStep {
  from: CompId
  to: CompId
  label: string
}

const submitFlow: FlowStep[] = [
  { from: 'client', to: 'api', label: 'POST /api/scores { score: 2450 }' },
  { from: 'api', to: 'score', label: 'Authenticate, forward score' },
  { from: 'score', to: 'redis', label: 'ZADD leaderboard 2450 "p42"' },
  { from: 'redis', to: 'cache', label: 'Check if score enters top 100' },
  { from: 'cache', to: 'redis', label: 'Invalidate if needed' },
  { from: 'score', to: 'db', label: 'Async: persist score history' },
  { from: 'redis', to: 'score', label: 'Return rank: 3' },
  { from: 'score', to: 'api', label: '{ rank: 3 }' },
  { from: 'api', to: 'client', label: '200 OK { rank: 3 }' },
]

const queryFlow: FlowStep[] = [
  { from: 'client', to: 'api', label: 'GET /leaderboard?type=top100' },
  { from: 'api', to: 'score', label: 'Forward query' },
  { from: 'score', to: 'cache', label: 'Check cache for top 100' },
  { from: 'cache', to: 'score', label: 'Cache hit: return JSON' },
  { from: 'score', to: 'api', label: 'Return leaderboard data' },
  { from: 'api', to: 'client', label: '200 OK [ { rank, name, score } ]' },
]

const queryMissFlow: FlowStep[] = [
  { from: 'client', to: 'api', label: 'GET /leaderboard?type=top100' },
  { from: 'api', to: 'score', label: 'Forward query' },
  { from: 'score', to: 'cache', label: 'Check cache for top 100' },
  { from: 'cache', to: 'score', label: 'Cache miss' },
  { from: 'score', to: 'redis', label: 'ZREVRANGE 0 99 WITHSCORES' },
  { from: 'redis', to: 'score', label: 'Return top 100 entries' },
  { from: 'score', to: 'cache', label: 'SET cache (TTL: 30s)' },
  { from: 'score', to: 'api', label: 'Return leaderboard data' },
  { from: 'api', to: 'client', label: '200 OK [ { rank, name, score } ]' },
]

const allEdges: [CompId, CompId][] = [
  ['client', 'api'],
  ['api', 'score'],
  ['score', 'redis'],
  ['score', 'cache'],
  ['score', 'db'],
  ['redis', 'cache'],
]

export default function LeaderboardArchitectureDemo() {
  const [mode, setMode] = useState<'submit' | 'query-hit' | 'query-miss'>('submit')
  const [step, setStep] = useState(-1)
  const [selected, setSelected] = useState<CompId | null>(null)

  const flowData = mode === 'submit' ? submitFlow : mode === 'query-hit' ? queryFlow : queryMissFlow
  const selectedInfo = selected ? components.find(c => c.id === selected) : null

  const activeFrom = step >= 0 ? flowData[Math.min(step, flowData.length - 1)]?.from : null
  const activeTo = step >= 0 ? flowData[Math.min(step, flowData.length - 1)]?.to : null

  const compsVisited = new Set<CompId>()
  if (step >= 0) {
    for (let i = 0; i <= Math.min(step, flowData.length - 1); i++) {
      compsVisited.add(flowData[i].from)
      compsVisited.add(flowData[i].to)
    }
  }

  return (
    <DemoBoundary name="Leaderboard Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${s.border}`, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginRight: 2 }}>Flow:</span>
          {([
            { key: 'submit' as const, label: 'Score Submission' },
            { key: 'query-hit' as const, label: 'Query (cache hit)' },
            { key: 'query-miss' as const, label: 'Query (cache miss)' },
          ]).map(f => (
            <button key={f.key} onClick={() => { setMode(f.key); setStep(-1) }} style={{
              padding: '5px 10px', fontSize: 10, fontFamily: s.mono, borderRadius: 5, cursor: 'pointer',
              border: `1px solid ${mode === f.key ? s.accent : s.border}`,
              background: mode === f.key ? 'rgba(91,141,239,0.15)' : 'transparent',
              color: mode === f.key ? s.accent : s.text3,
            }}>
              {f.label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button onClick={() => setStep(st => st >= flowData.length - 1 ? 0 : st + 1)} style={{
              padding: '5px 10px', fontSize: 10, fontFamily: s.mono, borderRadius: 5, cursor: 'pointer',
              border: `1px solid ${s.green}`, background: 'rgba(61,214,140,0.1)', color: s.green,
            }}>
              {step < 0 ? 'Play' : 'Next'}
            </button>
            <button onClick={() => setStep(-1)} style={{
              padding: '5px 10px', fontSize: 10, fontFamily: s.mono, borderRadius: 5, cursor: 'pointer',
              border: `1px solid ${s.border}`, background: 'transparent', color: s.text3,
            }}>
              Reset
            </button>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          <svg width="100%" viewBox="-20 -10 740 300" style={{ display: 'block', overflow: 'hidden' }}>
            {allEdges.map(([from, to]) => {
              const fp = compPos[from]; const tp = compPos[to]
              const active = step >= 0 && ((activeFrom === from && activeTo === to) || (activeFrom === to && activeTo === from))
              const visited = step >= 0 && compsVisited.has(from) && compsVisited.has(to)
              const isCurrent = step >= 0 && step < flowData.length && ((flowData[step].from === from && flowData[step].to === to) || (flowData[step].from === to && flowData[step].to === from))
              return (
                <line key={`${from}-${to}`} x1={fp.x} y1={fp.y} x2={tp.x} y2={tp.y}
                  stroke={isCurrent ? s.accent : visited ? `${s.accent}66` : s.border}
                  strokeWidth={isCurrent ? 2.5 : visited ? 2 : 1}
                  opacity={isCurrent ? 1 : visited ? 0.7 : 0.35}
                  style={{ transition: 'all 0.3s' }}
                />
              )
            })}

            {components.map(comp => {
              const pos = compPos[comp.id]
              const isActive = comp.id === activeFrom || comp.id === activeTo
              const visited = compsVisited.has(comp.id)
              const isSel = selected === comp.id
              const w = 110; const h = 44
              return (
                <g key={comp.id} onClick={() => setSelected(isSel ? null : comp.id)} style={{ cursor: 'pointer' }}>
                  <rect x={pos.x - w / 2} y={pos.y - h / 2} width={w} height={h} rx={8}
                    fill={isActive ? `${s.accent}22` : visited ? `${s.accent}0c` : isSel ? `${s.accent}10` : s.bg3}
                    stroke={isActive ? s.accent : isSel ? s.accent : visited ? `${s.accent}66` : s.border2}
                    strokeWidth={isActive || isSel ? 2 : 1}
                    style={{ transition: 'all 0.3s' }}
                  />
                  <text x={pos.x} y={pos.y - 4} textAnchor="middle"
                    fill={isActive ? '#fff' : comp.color} fontSize={12} fontFamily={s.mono} fontWeight={600}>
                    {comp.label}
                  </text>
                  <text x={pos.x} y={pos.y + 12} textAnchor="middle"
                    fill={isActive ? s.text2 : s.text3} fontSize={9} fontFamily={s.mono}>
                    {comp.sub}
                  </text>
                </g>
              )
            })}

            {step >= 0 && step < flowData.length && (() => {
              const st = flowData[step]
              const from = compPos[st.from]
              const to = compPos[st.to]
              const mx = (from.x + to.x) / 2
              const my = (from.y + to.y) / 2
              const dy = to.y - from.y
              const labelY = my + (dy >= 0 ? -14 : 14)
              return (
                <g>
                  <rect x={mx - 3} y={my - 3} width={6} height={6} rx={2}
                    fill={s.accent} />
                  <text x={mx} y={labelY} textAnchor="middle"
                    fill={s.accent} fontSize={9} fontFamily={s.mono} fontWeight={500}>
                    {st.label}
                  </text>
                </g>
              )
            })()}
          </svg>
        </div>

        {step >= 0 && step < flowData.length && (
          <div style={{
            padding: '10px 16px', borderTop: `1px solid ${s.border}`, borderBottom: `1px solid ${s.border}`,
            background: 'rgba(91,141,239,0.06)', fontSize: 12, fontFamily: s.mono,
          }}>
            <span style={{ color: s.accent }}>Step {step + 1}/{flowData.length}: </span>
            <span style={{ color: s.text2 }}>{components.find(c => c.id === flowData[step].from)?.label} → {components.find(c => c.id === flowData[step].to)?.label}</span>
            <span style={{ color: s.text }}> — {flowData[step].label}</span>
          </div>
        )}

        {selectedInfo && (
          <div style={{ padding: '14px 16px', borderTop: `1px solid ${s.border}`, background: s.bg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: selectedInfo.color }} />
              <span style={{ fontSize: 14, fontFamily: s.mono, color: selectedInfo.color, fontWeight: 600 }}>{selectedInfo.label}</span>
            </div>
            <div style={{ fontSize: 13, color: s.text2 }}>{selectedInfo.desc}</div>
          </div>
        )}

        <div style={{ padding: '10px 16px', borderTop: `1px solid ${s.border}`, display: 'flex', gap: 16, fontSize: 10, fontFamily: s.mono, color: s.text3, flexWrap: 'wrap' }}>
          <span>Click any component for details</span>
          <span style={{ color: s.accent }}>Blue highlight = active step</span>
          <span>Arrows show data flow direction</span>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
