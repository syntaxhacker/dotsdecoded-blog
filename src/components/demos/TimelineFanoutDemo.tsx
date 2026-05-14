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

type Strategy = 'push' | 'pull' | 'hybrid'

const strategies: Strategy[] = ['push', 'pull', 'hybrid']

const strategyMeta: Record<Strategy, { label: string; color: string; desc: string }> = {
  push: { label: 'Fan-out on Write', color: s.accent, desc: 'Write tweet ID into every followers timeline cache at post time. Fast reads, expensive writes.' },
  pull: { label: 'Fan-out on Read', color: s.orange, desc: 'Query all followed users tweets when loading timeline. Zero write cost, slow reads.' },
  hybrid: { label: 'Hybrid (Push + Pull)', color: s.green, desc: 'Push to active followers, pull from celebrities. Best trade-off at scale.' },
}

const followerNames = ['alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry', 'iris', 'jack']

function fmtNum(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

export default function TimelineFanoutDemo() {
  const [strategy, setStrategy] = useState<Strategy>('push')
  const [followerCount, setFollowerCount] = useState(50)
  const [activeRatio, setActiveRatio] = useState(0.3)
  const [phase, setPhase] = useState<'idle' | 'posting' | 'faming' | 'reading'>('idle')
  const [pushProgress, setPushProgress] = useState(0)
  const [pullProgress, setPullProgress] = useState(0)
  const [tweetId, setTweetId] = useState(1)
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isCelebrity = followerCount > 100
  const pushCount = strategy === 'pull' ? 0 : strategy === 'hybrid' ? Math.floor(followerCount * activeRatio) : followerCount
  const pullCount = strategy === 'push' ? 0 : strategy === 'hybrid' ? Math.ceil(followerCount * (1 - activeRatio)) : followerCount

  const runSimulation = () => {
    setPhase('posting')
    setPushProgress(0)
    setPullProgress(0)
    setTweetId(prev => prev + 1)

    let steps = 0
    const totalSteps = 20

    animRef.current = setTimeout(function tick() {
      steps++
      if (strategy !== 'pull') {
        setPushProgress(Math.min(1, steps / (totalSteps * 0.6)))
      }
      if (strategy !== 'push') {
        setPullProgress(Math.min(1, steps / totalSteps))
      }
      if (steps < totalSteps) {
        animRef.current = setTimeout(tick, 80)
      } else {
        setPhase('reading')
        setPushProgress(1)
        setPullProgress(1)
        setTimeout(() => {
          if (animRef.current) clearTimeout(animRef.current)
          setPhase('idle')
        }, 1200)
      }
    }, 80)
  }

  useEffect(() => {
    return () => {
      if (animRef.current) clearTimeout(animRef.current)
    }
  }, [])

  const meta = strategyMeta[strategy]
  const maxFollowers = 300

  const displayFollowers = Math.min(followerCount, maxFollowers)
  const pushFollowers = Math.floor(displayFollowers * (strategy === 'hybrid' ? activeRatio : 1))
  const pullFollowers = Math.ceil(displayFollowers * (strategy === 'hybrid' ? (1 - activeRatio) : 0))

  return (
    <DemoBoundary name="Timeline Fanout Strategies">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {strategies.map(st => (
            <button key={st} onClick={() => { setStrategy(st); setPhase('idle'); setPushProgress(0); setPullProgress(0) }} style={{
              flex: 1, padding: '9px 0', borderRadius: 6, border: `1px solid ${strategy === st ? strategyMeta[st].color : s.border}`,
              background: strategy === st ? `${strategyMeta[st].color}18` : s.bg2,
              color: strategy === st ? strategyMeta[st].color : s.text3,
              fontFamily: s.mono, fontSize: 10, fontWeight: strategy === st ? 600 : 400, cursor: 'pointer',
            }}>
              {strategyMeta[st].label}
            </button>
          ))}
        </div>

        <div style={{ background: s.bg2, borderRadius: 8, padding: 14, border: `1px solid ${s.border}`, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: meta.color, fontFamily: s.mono, marginBottom: 8 }}>{meta.desc}</div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: s.text3 }}>Followers</span>
                <span style={{ fontSize: 10, fontFamily: s.mono, color: s.accent }}>{fmtNum(followerCount)}</span>
              </div>
              <input type="range" min={5} max={500} value={followerCount} onChange={e => { setFollowerCount(Number(e.target.value)); setPhase('idle') }} style={{ width: '100%', accentColor: s.accent, height: 4 }} />
            </div>
            {strategy === 'hybrid' && (
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: s.text3 }}>Active ratio</span>
                  <span style={{ fontSize: 10, fontFamily: s.mono, color: s.green }}>{(activeRatio * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min={0.05} max={0.95} step={0.05} value={activeRatio} onChange={e => setActiveRatio(Number(e.target.value))} style={{ width: '100%', accentColor: s.green, height: 4 }} />
              </div>
            )}
          </div>

          {isCelebrity && strategy === 'push' && (
            <div style={{ fontSize: 10, color: s.red, fontFamily: s.mono, padding: '6px 10px', background: `${s.red}10`, borderRadius: 5, marginBottom: 8 }}>
              Celebrity-scale follower count. Push fanout would generate {fmtNum(followerCount)} writes per tweet -- likely to saturate the database.
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, background: s.bg, borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, color: s.text3, fontFamily: s.mono }}>Write ops / tweet</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: pushCount > 100 ? s.red : s.green, fontFamily: s.mono }}>{fmtNum(pushCount)}</div>
            </div>
            <div style={{ flex: 1, background: s.bg, borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, color: s.text3, fontFamily: s.mono }}>Read ops / feed load</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: pullCount > 100 ? s.red : s.green, fontFamily: s.mono }}>{fmtNum(pullCount)}</div>
            </div>
            <div style={{ flex: 1, background: s.bg, borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, color: s.text3, fontFamily: s.mono }}>Feed latency</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: s.accent, fontFamily: s.mono }}>
                {strategy === 'push' ? '<10ms' : strategy === 'pull' ? '~200ms' : '~15ms'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button onClick={runSimulation} disabled={phase !== 'idle'} style={{
              padding: '8px 18px', borderRadius: 6, border: `1px solid ${phase === 'idle' ? meta.color : s.border}`,
              background: phase === 'idle' ? `${meta.color}15` : s.bg3, color: phase === 'idle' ? meta.color : s.text3,
              fontFamily: s.mono, fontSize: 11, cursor: phase === 'idle' ? 'pointer' : 'wait',
            }}>
              {phase === 'idle' ? 'Simulate Tweet' : phase === 'posting' ? 'Posting...' : phase === 'faming' ? 'Fanning out...' : 'Reading timeline...'}
            </button>
          </div>

          <div style={{ background: s.bg, borderRadius: 6, padding: 12, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono, marginBottom: 8 }}>TWEET #{tweetId} FANOUT</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {Array.from({ length: displayFollowers }).map((_, i) => {
                const isPush = strategy === 'hybrid' ? i < pushFollowers : strategy === 'push'
                const isPushed = isPush && phase !== 'idle'
                const isPulled = !isPush && phase !== 'idle'
                const delivered = (isPushed && pushProgress > i / pushFollowers) || (isPulled && pullProgress > i / Math.max(pullFollowers, 1))
                const color = isPush ? s.accent : s.orange
                return (
                  <div key={i} style={{
                    width: 16, height: 16, borderRadius: 3,
                    background: delivered ? color : s.bg3,
                    border: `1px solid ${delivered ? color : s.border}`,
                    opacity: delivered ? 1 : 0.5,
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 7, color: delivered ? '#fff' : 'transparent',
                    fontWeight: 700,
                  }}>
                    {followerNames[i % followerNames.length][0]}
                  </div>
                )
              })}
              {followerCount > maxFollowers && (
                <div style={{ fontSize: 9, color: s.text3, fontFamily: s.mono, alignSelf: 'center', marginLeft: 4 }}>
                  +{followerCount - maxFollowers}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 9, fontFamily: s.mono, color: s.text3 }}>
              <span style={{ color: s.accent }}>Push: {fmtNum(pushCount)} followers</span>
              {strategy !== 'push' && <span style={{ color: s.orange }}>Pull: {fmtNum(pullCount)} followers</span>}
              <span style={{ color: s.green }}>
                Delivered: {phase !== 'idle' ? Math.floor((pushProgress * pushCount + pullProgress * pullCount)) : 0}/{followerCount}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ background: s.bg2, borderRadius: 6, padding: 10, border: `1px solid ${strategy === 'push' ? `${s.accent}50` : s.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: strategy === 'push' ? s.accent : s.text3, marginBottom: 4 }}>Push Model</div>
            <div style={{ fontSize: 9, color: s.text3, lineHeight: 1.5 }}>
              Best for: small creators, {'<'} 10K followers. Low latency reads. High write cost at scale.
            </div>
          </div>
          <div style={{ background: s.bg2, borderRadius: 6, padding: 10, border: `1px solid ${strategy === 'pull' ? `${s.orange}50` : s.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: strategy === 'pull' ? s.orange : s.text3, marginBottom: 4 }}>Pull Model</div>
            <div style={{ fontSize: 9, color: s.text3, lineHeight: 1.5 }}>
              Best for: celebrities, {'>'} 1M followers. Zero write cost. Higher read latency.
            </div>
          </div>
          <div style={{ background: s.bg2, borderRadius: 6, padding: 10, border: `1px solid ${strategy === 'hybrid' ? `${s.green}50` : s.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: strategy === 'hybrid' ? s.green : s.text3, marginBottom: 4 }}>Hybrid Model</div>
            <div style={{ fontSize: 9, color: s.text3, lineHeight: 1.5 }}>
              Best trade-off. Push to active, pull from inactive/celebrities. Used by Twitter.
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
