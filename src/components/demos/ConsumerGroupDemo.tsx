import { useState, useEffect, useRef } from 'react'
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

const PARTITION_COLORS = [
  '#5b8def', '#3dd68c', '#e0b040', '#e85d5d', '#9b7bea', '#e8945a',
  '#f1f2f3', '#acb0b9', '#747c8b',
]

const TOTAL_PARTITIONS = 6

function assignPartitions(numConsumers: number, totalPartitions: number): number[][] {
  const assignments: number[][] = Array.from({ length: numConsumers }, () => [])
  for (let p = 0; p < totalPartitions; p++) {
    const c = p % numConsumers
    assignments[c].push(p)
  }
  return assignments
}

export default function ConsumerGroupDemo() {
  const [numConsumers, setNumConsumers] = useState(3)
  const [isRebalancing, setIsRebalancing] = useState(false)
  const [flashConsumer, setFlashConsumer] = useState<number | null>(null)
  const [flashPartition, setFlashPartition] = useState<number | null>(null)
  const [rebalanceStep, setRebalanceStep] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const assignments = assignPartitions(numConsumers, TOTAL_PARTITIONS)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const changeConsumers = (delta: number) => {
    const next = Math.max(1, Math.min(8, numConsumers + delta))
    if (next === numConsumers) return

    setIsRebalancing(true)
    setRebalanceStep(0)

    const animate = (step: number) => {
      if (step < 3) {
        setRebalanceStep(step)
        if (step === 0) {
          setFlashConsumer(null)
          setFlashPartition(null)
        }
        timerRef.current = setTimeout(() => animate(step + 1), 350)
      } else {
        setIsRebalancing(false)
        setRebalanceStep(0)
        setNumConsumers(next)
        setFlashConsumer(null)
        setFlashPartition(null)
      }
    }
    animate(0)
  }

  const maxPartitionsPerConsumer = Math.ceil(TOTAL_PARTITIONS / numConsumers)

  return (
    <DemoBoundary name="Consumer Group Rebalancing">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={H}>Consumer Group Scaling</div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <button onClick={() => changeConsumers(-1)} disabled={numConsumers <= 1 || isRebalancing} style={{
          background: s.bg3, border: `1px solid ${numConsumers <= 1 || isRebalancing ? s.bg3 : s.border}`,
          borderRadius: 8, padding: '8px 16px',
          color: numConsumers <= 1 || isRebalancing ? s.text3 : s.text,
          cursor: numConsumers <= 1 || isRebalancing ? 'default' : 'pointer', fontSize: 13,
        }}>Remove Consumer</button>
        <span style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>
          {numConsumers} consumer{numConsumers > 1 ? 's' : ''}
        </span>
        <button onClick={() => changeConsumers(1)} disabled={numConsumers >= 8 || isRebalancing} style={{
          background: s.accent, border: 'none', borderRadius: 8, padding: '8px 16px',
          color: '#fff', cursor: numConsumers >= 8 || isRebalancing ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
          opacity: numConsumers >= 8 || isRebalancing ? 0.4 : 1,
        }}>Add Consumer</button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span style={{ color: s.text3, fontSize: 11 }}>6 partitions</span>
          {isRebalancing && (
            <span style={{ color: s.yellow, fontSize: 11, fontFamily: s.mono, fontWeight: 600 }}>
              rebalancing...
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Partitions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: TOTAL_PARTITIONS }).map((_, p) => {
              const assignedConsumer = assignments.findIndex(a => a.includes(p))
              const isAssigned = assignedConsumer >= 0
              const isFlashing = flashPartition === p || (isRebalancing && rebalanceStep === 1)
              return (
                <div key={p} style={{
                  background: s.bg2, border: `2px solid ${isFlashing ? s.yellow : s.border}`,
                  borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.3s',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: `${PARTITION_COLORS[p]}20`,
                    border: `1px solid ${PARTITION_COLORS[p]}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: s.mono, fontSize: 10, color: PARTITION_COLORS[p], fontWeight: 600,
                  }}>P{p}</div>
                  {isAssigned && !isRebalancing && (
                    <div style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontFamily: s.mono,
                      background: `${s.accent}20`, color: s.accent, border: `1px solid ${s.accent}30`,
                    }}>
                      assigned to C{assignedConsumer}
                    </div>
                  )}
                  {isRebalancing && (
                    <div style={{ color: s.yellow, fontSize: 11, fontFamily: s.mono }}>...</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ width: 220 }}>
          <div style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Consumer Group (group.id=processor)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: numConsumers }).map((_, c) => {
              const assigned = assignments[c] || []
              const isFlashing = flashConsumer === c || (isRebalancing && rebalanceStep === 2)
              return (
                <div key={c} style={{
                  background: s.bg2, border: `2px solid ${isFlashing ? s.yellow : s.accent}`,
                  borderRadius: 10, padding: '10px 12px', transition: 'all 0.3s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#fff',
                    }}>{c}</div>
                    <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>Consumer {c}</span>
                  </div>
                  {!isRebalancing && (
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
                      {assigned.map(p => (
                        <span key={p} style={{
                          background: `${PARTITION_COLORS[p]}20`,
                          color: PARTITION_COLORS[p], fontFamily: s.mono, fontSize: 10, fontWeight: 600,
                          padding: '1px 5px', borderRadius: 3,
                        }}>P{p}</span>
                      ))}
                    </div>
                  )}
                  {isRebalancing && (
                    <div style={{ color: s.yellow, fontSize: 10, fontFamily: s.mono }}>waiting...</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ background: s.bg2, borderRadius: 8, padding: '8px 14px' }}>
            <div style={{ color: s.text3, fontSize: 10 }}>Partitions per consumer (max)</div>
            <div style={{ color: s.text, fontFamily: s.mono, fontSize: 16, fontWeight: 700 }}>{maxPartitionsPerConsumer}</div>
          </div>
          <div style={{ background: s.bg2, borderRadius: 8, padding: '8px 14px' }}>
            <div style={{ color: s.text3, fontSize: 10 }}>Total consumers</div>
            <div style={{ color: s.text, fontFamily: s.mono, fontSize: 16, fontWeight: 700 }}>{numConsumers}</div>
          </div>
          <div style={{ background: s.bg2, borderRadius: 8, padding: '8px 14px' }}>
            <div style={{ color: s.text3, fontSize: 10 }}>Idle consumers (no partitions)</div>
            <div style={{
              color: numConsumers > TOTAL_PARTITIONS ? s.red : s.text,
              fontFamily: s.mono, fontSize: 16, fontWeight: 700,
            }}>{Math.max(0, numConsumers - TOTAL_PARTITIONS)}</div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
