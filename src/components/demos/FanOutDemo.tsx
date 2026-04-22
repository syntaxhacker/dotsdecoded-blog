import { useState, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type Strategy = 'write' | 'read' | 'hybrid'

const strategyInfo: Record<Strategy, { label: string; color: string; desc: string }> = {
  write: { label: 'Fan-out on Write (Push)', color: s.accent, desc: 'When a user posts, copy the post to ALL followers\' feed caches immediately.' },
  read: { label: 'Fan-out on Read (Pull)', color: s.orange, desc: 'When a user opens their feed, query all followed users\' recent posts on the fly.' },
  hybrid: { label: 'Hybrid (Push + Pull)', color: s.green, desc: 'Push to active followers\' caches. Pull for inactive or celebrity followers.' },
}

function fmtNum(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toString()
}

export default function FanOutDemo() {
  const [strategy, setStrategy] = useState<Strategy>('write')
  const [followerCount, setFollowerCount] = useState(1000)
  const [activeFollowers, setActiveFollowers] = useState(0.3)
  const [isAnimating, setIsAnimating] = useState(false)
  const [step, setStep] = useState(0)
  const [pushedCount, setPushedCount] = useState(0)
  const [pulledCount, setPulledCount] = useState(0)

  const info = strategyInfo[strategy]

  const pushCount = strategy === 'read' ? 0 : strategy === 'hybrid' ? Math.floor(followerCount * activeFollowers) : followerCount
  const pullCount = strategy === 'write' ? 0 : strategy === 'hybrid' ? Math.ceil(followerCount * (1 - activeFollowers)) : followerCount

  const handleAnimate = () => {
    setIsAnimating(true)
    setStep(0)
    setPushedCount(0)
    setPulledCount(0)
  }

  useEffect(() => {
    if (!isAnimating) return
    let timer: ReturnType<typeof setTimeout>
    let currentStep = 0

    const tick = () => {
      currentStep++
      setStep(currentStep)

      if (strategy === 'write' || strategy === 'hybrid') {
        const target = pushCount
        const perTick = Math.max(1, Math.floor(target / 10))
        setPushedCount(prev => Math.min(prev + perTick, target))
      }
      if (strategy === 'read' || strategy === 'hybrid') {
        const target = pullCount
        const perTick = Math.max(1, Math.floor(target / 10))
        setPulledCount(prev => Math.min(prev + perTick, target))
      }

      if (currentStep >= 12) {
        setIsAnimating(false)
        setPushedCount(pushCount)
        setPulledCount(pullCount)
        return
      }
      timer = setTimeout(tick, 150)
    }
    timer = setTimeout(tick, 200)
    return () => clearTimeout(timer)
  }, [isAnimating, strategy, pushCount, pullCount])

  const displayPushed = isAnimating ? pushedCount : pushCount
  const displayPulled = isAnimating ? pulledCount : pullCount

  const maxOps = Math.max(followerCount, 1)
  const pushBarPct = maxOps > 0 ? (displayPushed / maxOps) * 100 : 0
  const pullBarPct = maxOps > 0 ? (displayPulled / maxOps) * 100 : 0

  return (
    <DemoBoundary name="Fan-out Problem">
      <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['write', 'read', 'hybrid'] as Strategy[]).map(st => (
            <button key={st} onClick={() => { setStrategy(st); setIsAnimating(false); setStep(0) }} style={{
              flex: 1, padding: '10px 0', borderRadius: 6, border: `1px solid ${strategy === st ? strategyInfo[st].color : s.border}`,
              background: strategy === st ? `${strategyInfo[st].color}20` : s.bg2,
              color: strategy === st ? strategyInfo[st].color : s.text3,
              fontFamily: s.mono, fontSize: 11, fontWeight: strategy === st ? 600 : 400, cursor: 'pointer',
            }}>
              {strategyInfo[st].label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: s.bg2, borderRadius: 8, padding: '12px 18px', border: `1px solid ${s.border}`, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: s.text2, whiteSpace: 'nowrap' }}>Followers</span>
          <input type="range" min={10} max={5000000} step={10000} value={followerCount} onChange={e => { setFollowerCount(Number(e.target.value)); setIsAnimating(false) }} style={{ flex: 1, accentColor: s.accent, height: 5 }} />
          <span style={{ fontFamily: s.mono, fontSize: 13, color: s.accent, minWidth: 60, textAlign: 'right' }}>{fmtNum(followerCount)}</span>
        </div>

        {strategy === 'hybrid' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: s.bg2, borderRadius: 8, padding: '12px 18px', border: `1px solid ${s.border}`, marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: s.text2, whiteSpace: 'nowrap' }}>Active follower ratio</span>
            <input type="range" min={0.05} max={0.95} step={0.05} value={activeFollowers} onChange={e => setActiveFollowers(Number(e.target.value))} style={{ flex: 1, accentColor: s.green, height: 5 }} />
            <span style={{ fontFamily: s.mono, fontSize: 13, color: s.green, minWidth: 40, textAlign: 'right' }}>{(activeFollowers * 100).toFixed(0)}%</span>
          </div>
        )}

        <div style={{ background: s.bg2, borderRadius: 8, padding: 16, border: `1px solid ${s.border}`, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: s.text2, marginBottom: 12, lineHeight: 1.5 }}>{info.desc}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {strategy !== 'read' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: s.accent, fontFamily: s.mono }}>Write operations (push to feed cache)</span>
                  <span style={{ fontSize: 11, color: s.accent, fontFamily: s.mono }}>{fmtNum(displayPushed)} writes</span>
                </div>
                <div style={{ height: 8, background: s.bg3, borderRadius: 4 }}>
                  <div style={{ width: `${pushBarPct}%`, height: '100%', background: s.accent, borderRadius: 4, transition: 'width 0.2s ease' }} />
                </div>
              </div>
            )}
            {strategy !== 'write' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: s.orange, fontFamily: s.mono }}>Read operations (query on feed open)</span>
                  <span style={{ fontSize: 11, color: s.orange, fontFamily: s.mono }}>{fmtNum(displayPulled)} reads</span>
                </div>
                <div style={{ height: 8, background: s.bg3, borderRadius: 4 }}>
                  <div style={{ width: `${pullBarPct}%`, height: '100%', background: s.orange, borderRadius: 4, transition: 'width 0.2s ease' }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button onClick={handleAnimate} disabled={isAnimating} style={{
              padding: '7px 16px', borderRadius: 6, border: `1px solid ${info.color}`,
              background: `${info.color}20`, color: info.color, fontFamily: s.mono, fontSize: 12,
              cursor: isAnimating ? 'wait' : 'pointer',
            }}>
              {isAnimating ? 'Running...' : 'Simulate'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div style={{ background: s.bg, borderRadius: 6, padding: '10px 12px', borderLeft: `3px solid ${strategy === 'write' ? s.red : s.green}` }}>
              <div style={{ fontSize: 10, color: s.text3, marginBottom: 2 }}>Write Cost</div>
              <div style={{ fontFamily: s.mono, fontSize: 14, color: strategy === 'write' && followerCount > 100000 ? s.red : s.green, fontWeight: 600 }}>
                {fmtNum(pushCount)}
              </div>
              <div style={{ fontSize: 9, color: s.text3 }}>ops per post</div>
            </div>
            <div style={{ background: s.bg, borderRadius: 6, padding: '10px 12px', borderLeft: `3px solid ${strategy === 'read' ? s.red : s.green}` }}>
              <div style={{ fontSize: 10, color: s.text3, marginBottom: 2 }}>Read Cost</div>
              <div style={{ fontFamily: s.mono, fontSize: 14, color: strategy === 'read' && followerCount > 100000 ? s.red : s.green, fontWeight: 600 }}>
                {fmtNum(pullCount)}
              </div>
              <div style={{ fontSize: 9, color: s.text3 }}>ops per feed open</div>
            </div>
            <div style={{ background: s.bg, borderRadius: 6, padding: '10px 12px', borderLeft: `3px solid ${s.accent}` }}>
              <div style={{ fontSize: 10, color: s.text3, marginBottom: 2 }}>Feed Latency</div>
              <div style={{ fontFamily: s.mono, fontSize: 14, color: s.accent, fontWeight: 600 }}>
                {strategy === 'write' ? '~0ms' : strategy === 'read' ? '~200ms' : '~5ms'}
              </div>
              <div style={{ fontSize: 9, color: s.text3 }}>per feed load</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div style={{ background: s.bg2, borderRadius: 6, padding: 12, border: `1px solid ${strategy === 'write' ? s.accent + '60' : s.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: strategy === 'write' ? s.accent : s.text3, marginBottom: 4 }}>Push Model</div>
            <div style={{ fontSize: 11, color: s.text3, lineHeight: 1.5 }}>
              {strategy === 'write' ? 'Active' : strategy === 'hybrid' ? `Push to ${fmtNum(Math.floor(followerCount * activeFollowers))} active` : 'Not used'}
            </div>
            <div style={{ fontSize: 10, color: s.text3, marginTop: 4, lineHeight: 1.4 }}>
              Fast feed reads. High write cost for celebrities. Cache invalidation on delete.
            </div>
          </div>
          <div style={{ background: s.bg2, borderRadius: 6, padding: 12, border: `1px solid ${strategy === 'read' ? s.orange + '60' : s.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: strategy === 'read' ? s.orange : s.text3, marginBottom: 4 }}>Pull Model</div>
            <div style={{ fontSize: 11, color: s.text3, lineHeight: 1.5 }}>
              {strategy === 'read' ? 'Active' : strategy === 'hybrid' ? `Pull for ${fmtNum(Math.ceil(followerCount * (1 - activeFollowers)))} inactive` : 'Not used'}
            </div>
            <div style={{ fontSize: 10, color: s.text3, marginTop: 4, lineHeight: 1.4 }}>
              Zero write cost. Slow feed reads (query N users). Better for celebrity accounts.
            </div>
          </div>
          <div style={{ background: s.bg2, borderRadius: 6, padding: 12, border: `1px solid ${strategy === 'hybrid' ? s.green + '60' : s.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: strategy === 'hybrid' ? s.green : s.text3, marginBottom: 4 }}>Best For</div>
            <div style={{ fontSize: 10, color: s.text3, lineHeight: 1.5 }}>
              {strategy === 'write' ? 'Small creators (<10K followers)' : strategy === 'read' ? 'Celebrity accounts (>1M followers)' : 'Most users. Best trade-off at scale.'}
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
