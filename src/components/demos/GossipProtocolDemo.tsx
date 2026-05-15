import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController from './SpeedController'
import { getStepDelay } from './SpeedController'

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

const NUM_NODES = 6
const NODE_NAMES = ['N0', 'N1', 'N2', 'N3', 'N4', 'N5']

interface GossipRound {
  knowledge: boolean[][]
  connections: [number, number][]
}

function seededRandom(seed: number) {
  let state = seed
  return function (max: number) {
    state = (state * 16807) % 2147483647
    return state % max
  }
}

function generateRounds(): GossipRound[] {
  const rand = seededRandom(42)
  const NUM_ROUNDS = 10

  let knowledge: boolean[][] = Array.from({ length: NUM_NODES }, () =>
    Array.from({ length: NUM_NODES }, () => false)
  )
  for (let i = 0; i < NUM_NODES; i++) {
    knowledge[i][i] = true
  }

  const rounds: GossipRound[] = [
    { knowledge: knowledge.map((row) => [...row]), connections: [] },
  ]

  for (let round = 0; round < NUM_ROUNDS; round++) {
    const connections: [number, number][] = []
    const newKnowledge = knowledge.map((row) => [...row])

    for (let i = 0; i < NUM_NODES; i++) {
      const numPeers = 1 + rand(3)
      const peers: number[] = []
      for (let p = 0; p < NUM_NODES; p++) {
        if (p !== i) peers.push(p)
      }
      for (let p = peers.length - 1; p > 0; p--) {
        const j = rand(p + 1);
        [peers[p], peers[j]] = [peers[j], peers[p]]
      }
      const selected = peers.slice(0, numPeers)

      for (const peer of selected) {
        connections.push([i, peer])
        for (let k = 0; k < NUM_NODES; k++) {
          if (knowledge[peer][k]) newKnowledge[i][k] = true
        }
      }
    }

    rounds.push({
      knowledge: newKnowledge.map((row) => [...row]),
      connections: [...connections],
    })
    knowledge = newKnowledge
  }

  return rounds
}

const ROUNDS = generateRounds()
const TOTAL_STEPS = ROUNDS.length

function convergence(knowledge: boolean[][]): number {
  let known = 0
  for (let i = 0; i < NUM_NODES; i++) {
    for (let j = 0; j < NUM_NODES; j++) {
      if (knowledge[i][j]) known++
    }
  }
  return Math.round((known / (NUM_NODES * NUM_NODES)) * 100)
}

const CX = 380
const CY = 190
const R = 150

const NODE_POSITIONS = [0, 60, 120, 180, 240, 300].map((angle) => {
  const rad = (angle * Math.PI) / 180
  return {
    x: CX + R * Math.cos(rad),
    y: CY + R * Math.sin(rad),
  }
})

export default function GossipProtocolDemo() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  const round = ROUNDS[step]
  const conv = round ? convergence(round.knowledge) : 0
  const connections = round?.connections ?? []

  const goNext = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1))
  }, [])

  const goPrev = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const reset = useCallback(() => {
    setStep(0)
    setPlaying(false)
  }, [])

  useEffect(() => {
    if (!playing || step >= TOTAL_STEPS - 1) return
    const delay = getStepDelay(1200, speed)
    const timer = setTimeout(() => goNext(), delay)
    return () => clearTimeout(timer)
  }, [playing, step, speed, goNext])

  return (
    <DemoBoundary name="Gossip Protocol">
      <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
        <div style={SEC}>
          <div style={H}>Gossip Protocol Spread</div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
            Each node periodically gossips with 1-3 random peers, exchanging membership information. Knowledge spreads exponentially.
          </p>

          <svg viewBox="0 0 760 380" style={{ width: '100%', height: 300, overflow: 'hidden', marginBottom: 16 }}>
            {connections.map(([from, to], i) => {
              const p1 = NODE_POSITIONS[from]
              const p2 = NODE_POSITIONS[to]
              if (!p1 || !p2) return null
              return (
                <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke={s.accent} strokeWidth={1.5} opacity={0.5}
                  strokeDasharray="4 3"
                >
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" repeatCount="indefinite" />
                </line>
              )
            })}

            {NODE_POSITIONS.map((pos, i) => (
              <g key={i}>
                <circle cx={pos.x} cy={pos.y} r={28}
                  fill={s.bg3} stroke={s.accent} strokeWidth={2}
                />
                <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
                  fill={s.text} fontSize={13} fontWeight={700}
                >
                  {NODE_NAMES[i]}
                </text>
              </g>
            ))}

            {NODE_POSITIONS.map((pos, i) => {
              const known = round?.knowledge[i] ?? []
              return (
                <g key={`k-${i}`}>
                  {Array.from({ length: NUM_NODES }).map((_, j) => (
                    <circle key={j} cx={pos.x - 35 + j * 14} cy={pos.y + 42} r={5}
                      fill={known[j] ? s.green : s.bg3}
                      stroke={known[j] ? s.green : s.border}
                      strokeWidth={1}
                    >
                      <title>Node {NODE_NAMES[i]} knows about {NODE_NAMES[j]}: {known[j] ? 'yes' : 'no'}</title>
                    </circle>
                  ))}
                  <text x={pos.x} y={pos.y + 56} textAnchor="middle" fill={s.text3} fontSize={8} fontFamily={s.mono}>
                    {known.filter(Boolean).length}/{NUM_NODES} known
                  </text>
                </g>
              )
            })}
          </svg>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 16, gap: 16,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>Convergence</div>
              <div style={{ height: 8, background: s.bg3, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${conv}%`, height: '100%',
                  background: `linear-gradient(90deg, ${s.accent}, ${s.green})`,
                  borderRadius: 4, transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
            <div style={{
              fontFamily: s.mono, fontSize: 18, fontWeight: 700,
              color: conv === 100 ? s.green : s.accent,
            }}>
              {conv}%
            </div>
          </div>

          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: s.bg, border: `1px solid ${s.border}`,
            color: s.text2, fontSize: 12, marginBottom: 16, fontFamily: s.mono,
          }}>
            Round {step}: {connections.length} gossip connections
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={goPrev} disabled={step === 0} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 16px', color: step === 0 ? s.text3 : s.text2,
              cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: 13,
            }}>
              Prev
            </button>
            <button onClick={goNext} disabled={step >= TOTAL_STEPS - 1} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 16px', color: step >= TOTAL_STEPS - 1 ? s.text3 : s.text2,
              cursor: step >= TOTAL_STEPS - 1 ? 'not-allowed' : 'pointer', fontSize: 13,
            }}>
              Next
            </button>
            <button onClick={() => setPlaying(!playing)} style={{
              background: playing ? s.red : s.green, border: 'none', borderRadius: 8,
              padding: '10px 20px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {playing ? 'Stop' : 'Auto Play'}
            </button>
            <button onClick={reset} style={{
              background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 16px', color: s.text2, cursor: 'pointer', fontSize: 13,
            }}>
              Reset
            </button>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
