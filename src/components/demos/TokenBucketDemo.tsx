import { useState, useEffect, useCallback, useRef } from 'react'
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
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

export default function TokenBucketDemo() {
  const [bucketSize, setBucketSize] = useState(5)
  const [refillRate, setRefillRate] = useState(1)
  const [tokens, setTokens] = useState(5)
  const [allowed, setAllowed] = useState(0)
  const [rejected, setRejected] = useState(0)
  const [lastResult, setLastResult] = useState<'allowed' | 'rejected' | null>(null)
  const [flashingIdx, setFlashingIdx] = useState<number | null>(null)
  const tokensRef = useRef(5)

  useEffect(() => {
    setTokens(bucketSize)
    tokensRef.current = bucketSize
  }, [bucketSize])

  useEffect(() => {
    const interval = setInterval(() => {
      setTokens(prev => {
        const next = Math.min(prev + refillRate, bucketSize)
        tokensRef.current = next
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [refillRate, bucketSize])

  const sendRequest = useCallback(() => {
    if (tokensRef.current > 0) {
      tokensRef.current -= 1
      setTokens(tokensRef.current)
      setAllowed(prev => prev + 1)
      setLastResult('allowed')
      const idx = tokensRef.current
      setFlashingIdx(idx)
      setTimeout(() => setFlashingIdx(null), 400)
    } else {
      setRejected(prev => prev + 1)
      setLastResult('rejected')
    }
    setTimeout(() => setLastResult(null), 800)
  }, [tokens])

  const reset = () => {
    setTokens(bucketSize)
    tokensRef.current = bucketSize
    setAllowed(0)
    setRejected(0)
    setLastResult(null)
    setFlashingIdx(null)
  }

  const fillPct = bucketSize > 0 ? (tokens / bucketSize) * 100 : 0

  return (
    <DemoBoundary name="Token Bucket Algorithm">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Token Bucket</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Tokens refill at a steady rate. Each request consumes one token. When the bucket is empty, requests are rejected.
          Burst traffic is allowed up to the bucket capacity.
        </p>

        <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>Bucket Size (burst capacity)</label>
            <input type="range" min={1} max={10} value={bucketSize} onChange={e => setBucketSize(Number(e.target.value))} style={{ width: '100%', accentColor: s.accent }} />
            <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{bucketSize}</span>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>Refill Rate (tokens/sec)</label>
            <input type="range" min={1} max={5} value={refillRate} onChange={e => setRefillRate(Number(e.target.value))} style={{ width: '100%', accentColor: s.green }} />
            <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{refillRate}/s</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'stretch', marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12,
              height: 180, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: `${fillPct}%`, background: `linear-gradient(180deg, ${s.accent}33 0%, ${s.accent}11 100%)`,
                transition: 'height 0.3s ease', borderRadius: '0 0 11px 11px',
              }} />
              <div style={{
                position: 'absolute', bottom: 8, left: 0, right: 0,
                display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6,
                padding: '0 12px',
              }}>
                {Array.from({ length: bucketSize }).map((_, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: i < tokens
                      ? (flashingIdx === i ? s.yellow : s.accent)
                      : s.bg3,
                    border: `2px solid ${i < tokens ? s.accent : s.border}`,
                    transition: 'all 0.3s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: i < tokens ? '#fff' : s.text3,
                    fontWeight: 700,
                  }}>
                    {i < tokens ? 'T' : ''}
                  </div>
                ))}
              </div>
              <div style={{
                position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                color: s.text3, fontFamily: s.mono, fontSize: 11,
              }}>
                {tokens}/{bucketSize} tokens
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 140 }}>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ color: s.green, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>{allowed}</div>
              <div style={{ color: s.text3, fontSize: 11 }}>Allowed</div>
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ color: s.red, fontFamily: s.mono, fontSize: 22, fontWeight: 700 }}>{rejected}</div>
              <div style={{ color: s.text3, fontSize: 11 }}>Rejected</div>
            </div>
            <div style={{
              background: lastResult === 'allowed' ? `${s.green}15` : lastResult === 'rejected' ? `${s.red}15` : s.bg,
              border: `1px solid ${lastResult === 'allowed' ? s.green : lastResult === 'rejected' ? s.red : s.border}`,
              borderRadius: 8, padding: '10px 14px', textAlign: 'center', transition: 'all 0.3s',
            }}>
              <div style={{
                color: lastResult === 'allowed' ? s.green : lastResult === 'rejected' ? s.red : s.text3,
                fontSize: 13, fontWeight: 600, transition: 'color 0.3s',
              }}>
                {lastResult === 'allowed' ? 'ALLOWED' : lastResult === 'rejected' ? 'REJECTED' : 'Waiting...'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 20px',
            color: s.text2, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <button onClick={sendRequest} style={{
            background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
          }}>Send Request</button>
        </div>

        <div style={{ marginTop: 20, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>How It Works</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Burst', desc: 'Up to N requests can fire instantly (bucket capacity)', color: s.accent },
              { label: 'Steady', desc: `After burst, ${refillRate} token${refillRate > 1 ? 's' : ''} refill${refillRate > 1 ? '' : 's'} per second`, color: s.green },
              { label: 'Reject', desc: 'When empty, requests get 429 Too Many Requests', color: s.red },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ color: s.text, fontSize: 13, fontWeight: 600, minWidth: 50 }}>{item.label}</span>
                <span style={{ color: s.text2, fontSize: 12 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
