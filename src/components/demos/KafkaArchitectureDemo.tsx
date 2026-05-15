import { useState, useEffect, useRef, useCallback } from 'react'
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

const STEPS = [
  { label: 'Producer sends message', desc: 'App writes to Kafka producer client with topic + key' },
  { label: 'Partition assignment', desc: 'hash(key) % numPartitions routes to partition P1 on Broker 0' },
  { label: 'Leader appends to log', desc: 'Broker 0 (partition leader) appends message to its commit log' },
  { label: 'ISR replication', desc: 'Followers on Broker 1, 2 pull the message and confirm' },
  { label: 'Consumer poll', desc: 'Consumer in group "processor" polls topic for new messages' },
  { label: 'Consumer reads offset', desc: 'Consumer fetches message at offset X from the partition leader' },
  { label: 'Offset commit', desc: 'Consumer commits offset X+1 to the internal __consumer_offsets topic' },
]

const STEP_COLORS = [s.accent, s.green, s.yellow, s.orange, s.purple, s.accent, s.green]

export default function KafkaArchitectureDemo() {
  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [animPos, setAnimPos] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const goToStep = useCallback((s: number) => {
    setStep(s)
    setAnimPos(0)
    const startTime = Date.now()
    const duration = 500
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setAnimPos(progress)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    if (isPlaying) {
      goToStep(0)
      let currentStep = 0
      intervalRef.current = setInterval(() => {
        currentStep = (currentStep + 1) % STEPS.length
        goToStep(currentStep)
      }, 1800)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, goToStep])

  const pulseOpacity = 0.3 + 0.7 * animPos

  return (
    <DemoBoundary name="Kafka Full Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={H}>Full Architecture</div>
        <button onClick={() => setIsPlaying(!isPlaying)} style={{
          background: isPlaying ? s.red : s.green, border: 'none', borderRadius: 8,
          padding: '6px 16px', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
        }}>{isPlaying ? 'Stop' : 'Auto-Play'}</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflow: 'auto', paddingBottom: 6 }}>
        {STEPS.map((st, i) => (
          <button key={i} onClick={() => { setIsPlaying(false); goToStep(i) }} style={{
            padding: '5px 12px', borderRadius: 20, border: `1px solid ${step === i ? STEP_COLORS[i] : s.border}`,
            background: step === i ? `${STEP_COLORS[i]}20` : s.bg2,
            color: step === i ? STEP_COLORS[i] : s.text2, cursor: 'pointer', fontSize: 11,
            whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: s.mono,
          }}>
            {i + 1}. {st.label}
          </button>
        ))}
      </div>

      <div style={{
        background: s.bg2, borderRadius: 16, border: `1px solid ${s.border}`,
        padding: 20, position: 'relative', overflow: 'hidden', minHeight: 240,
      }}>
        <div style={{ display: 'flex', gap: 12, height: 200, position: 'relative' }}>
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 8, position: 'relative',
          }}>
            <div style={{
              border: `2px solid ${step === 0 ? STEP_COLORS[0] : s.border}`,
              borderRadius: 12, padding: '16px 20px', textAlign: 'center',
              background: step === 0 ? `${STEP_COLORS[0]}15` : s.bg,
              transition: 'all 0.3s',
            }}>
              <div style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>Producer</div>
              <div style={{ color: s.text2, fontSize: 11 }}>write(topic="orders", key="user:1")</div>
            </div>
            {step === 0 && (
              <div style={{ position: 'absolute', top: '50%', right: -8, transform: 'translate(100%, -50%)' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: STEP_COLORS[0],
                  opacity: pulseOpacity, transition: 'opacity 0.1s',
                }} />
              </div>
            )}
            <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>Application</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 2, height: 40, background: s.border }} />
            <div style={{
              width: 0, height: 0, borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent', borderLeft: `8px solid ${s.border}`,
            }} />
          </div>

          <div style={{
            flex: 2, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2].map(b => {
                const isFocused = (step === 2 && b === 0) || (step === 3 && (b === 1 || b === 2))
                return (
                  <div key={b} style={{
                    flex: 1, background: s.bg, borderRadius: 10, border: `2px solid ${isFocused ? s.yellow : s.border}`,
                    padding: 10, transition: 'all 0.3s',
                  }}>
                    <div style={{
                      color: s.text3, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
                    }}>Broker {b}</div>
                    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {['P0', 'P1', 'P2'].map(p => {
                        const isActive = step === 1 && b === 0 && p === 'P1'
                        return (
                          <span key={p} style={{
                            padding: '2px 5px', borderRadius: 3, fontFamily: s.mono, fontSize: 9,
                            background: isActive ? `${s.green}20` : s.bg2,
                            color: isActive ? s.green : s.text3,
                            border: `1px solid ${isActive ? s.green : s.bg3}`,
                            transition: 'all 0.3s',
                          }}>{p}</span>
                        )
                      })}
                    </div>
                    {isFocused && (
                      <div style={{
                        marginTop: 4, fontSize: 9, color: s.yellow, fontFamily: s.mono,
                        background: `${s.yellow}10`, borderRadius: 4, padding: '2px 5px',
                      }}>
                        {b === 0 ? 'leader: P0,P1' : (step === 3 ? 'ISR: replicating...' : '')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {(step === 2 || step === 3) && (
              <div style={{
                position: 'absolute', display: 'flex', gap: 4, alignItems: 'center',
                top: -16, left: '25%', transform: 'translateX(-50%)',
                background: `${s.yellow}15`, padding: '2px 10px', borderRadius: 10,
                border: `1px solid ${s.yellow}`,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: s.yellow,
                  opacity: pulseOpacity,
                }} />
                <span style={{ color: s.yellow, fontSize: 9, fontFamily: s.mono }}>
                  {step === 2 ? 'apending to log...' : 'ISR replication...'}
                </span>
              </div>
            )}
            <div style={{ color: s.text3, fontSize: 10, textAlign: 'center', fontFamily: s.mono }}>
              Kafka Cluster (broker.router...) {step >= 1 && step <= 3 ? '- message in flight' : ''}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 2, height: 40, background: s.border }} />
            <div style={{
              width: 0, height: 0, borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent', borderLeft: `8px solid ${s.border}`,
            }} />
          </div>

          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              border: `2px solid ${step === 4 ? s.purple : s.border}`,
              borderRadius: 12, padding: '16px', textAlign: 'center',
              background: step === 4 ? `${s.purple}15` : s.bg,
              transition: 'all 0.3s',
            }}>
              <div style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>Consumer</div>
              <div style={{ color: s.text2, fontSize: 11 }}>poll("orders") @ offset X</div>
              {(step === 5 || step === 6) && (
                <div style={{ marginTop: 6 }}>
                  <div style={{
                    background: `${STEP_COLORS[step]}15`, border: `1px solid ${STEP_COLORS[step]}`,
                    borderRadius: 4, padding: '2px 6px', fontSize: 9, color: STEP_COLORS[step],
                    fontFamily: s.mono,
                  }}>
                    {step === 5 ? 'reading message X...' : 'committing X+1'}
                  </div>
                </div>
              )}
            </div>
            <div style={{ color: s.text3, fontSize: 10, textAlign: 'center', fontFamily: s.mono, marginTop: 4 }}>
              Consumer Group: processor
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${s.border}`, marginTop: 12, paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              padding: '4px 12px', borderRadius: 6, fontSize: 10, fontFamily: s.mono,
              background: `${s.border}20`, border: `1px solid ${s.border}`, color: s.text3,
            }}>metadata: ZooKeeper / KRaft</div>
            <div style={{
              padding: '4px 12px', borderRadius: 6, fontSize: 10, fontFamily: s.mono,
              background: `${s.border}20`, border: `1px solid ${s.border}`, color: s.text3,
            }}>__consumer_offsets topic</div>
            <span style={{ color: s.text3, fontSize: 10, fontFamily: s.mono }}>controller: broker 0</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{
          background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`, padding: '12px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${STEP_COLORS[step]}20`, border: `1px solid ${STEP_COLORS[step]}`,
              fontFamily: s.mono, fontSize: 11, color: STEP_COLORS[step], fontWeight: 700,
            }}>{step + 1}</div>
            <div style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>{STEPS[step].label}</div>
          </div>
          <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.6, marginLeft: 34 }}>{STEPS[step].desc}</div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
