import { useState, useRef } from 'react'

const s = {
  bg: '#12121a', bg2: '#1a1a25', bg3: '#22222e',
  text: '#e4e4e7', text2: '#a1a1aa', text3: '#71717a',
  border: '#27272a', border2: '#3f3f46',
  accent: '#3b82f6', green: '#22c55e', red: '#ef4444',
  yellow: '#eab308', purple: '#a78bfa', orange: '#fb923c',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const M: React.CSSProperties = { fontFamily: s.mono }

const dnsSteps = [
  { label: 'Browser', desc: 'User types dotsdecoded.com in the address bar', msg: 'GET https://dotsdecoded.com', color: s.accent },
  { label: 'Local Cache', desc: 'Browser checks local DNS cache', msg: 'CACHE MISS -- no entry for dotsdecoded.com', color: s.red },
  { label: 'Resolver', desc: 'Query sent to recursive resolver', msg: 'QUERY dotsdecoded.com IN A -> 1.1.1.1:53', color: s.accent },
  { label: 'Root NS', desc: 'Root nameserver queried for dotsdecoded.com', msg: 'REFERRAL: "Ask .com TLD server"', color: s.yellow },
  { label: 'TLD NS', desc: '.com TLD server queried', msg: 'REFERRAL: "Ask ns1.dotsdecoded.com"', color: s.orange },
  { label: 'Auth NS', desc: 'Authoritative nameserver responds', msg: 'RESPONSE: dotsdecoded.com A 104.21.76.8 TTL=300', color: s.green },
  { label: 'Cached', desc: 'Resolver caches and returns result to browser', msg: 'ANSWER: dotsdecoded.com -> 104.21.76.8', color: s.green },
  { label: 'Connected', desc: 'Browser establishes TCP/TLS connection', msg: 'CONNECTED to 104.21.76.8:443 (TLS 1.3)', color: s.green },
]

export default function DnsResolutionDemo() {
  const [dnsStep, setDnsStep] = useState(-1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startAutoplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setDnsStep(-1)
    let step = -1
    intervalRef.current = setInterval(() => {
      step++
      setDnsStep(step)
      if (step >= dnsSteps.length - 1 && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, 1200)
  }

  return (
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>How DNS Resolution Works</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          DNS translates human-readable domain names into IP addresses. Click "Resolve" to step through the lookup process for dotsdecoded.com.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { if (dnsStep >= dnsSteps.length - 1) setDnsStep(-1); else setDnsStep(p => p + 1) }}
            style={{
              background: dnsStep >= dnsSteps.length - 1 ? s.border2 : s.accent, border: 'none',
              borderRadius: 8, padding: '8px 20px', color: dnsStep >= dnsSteps.length - 1 ? s.text2 : '#fff',
              cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
            }}
          >
            {dnsStep >= dnsSteps.length - 1 ? 'Reset' : 'Resolve'}
          </button>
          <button
            onClick={startAutoplay}
            disabled={dnsStep >= 0}
            style={{
              background: 'transparent', border: `1px solid ${s.border}`,
              borderRadius: 8, padding: '8px 16px', color: dnsStep >= 0 ? s.text3 : s.text2,
              cursor: dnsStep >= 0 ? 'not-allowed' : 'pointer', fontSize: 13, transition: 'all 0.2s',
            }}
          >
            Auto-play
          </button>
          {dnsStep >= 0 && (
            <span style={{ ...M, fontSize: 12, color: s.text3 }}>Step {Math.min(dnsStep + 1, dnsSteps.length)} / {dnsSteps.length}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {dnsSteps.map((step, i) => {
            const active = i === dnsStep
            const done = i < dnsStep
            const pending = i > dnsStep
            return (
              <div key={i} style={{ display: 'flex', gap: 14, opacity: pending ? 0.3 : 1, transition: 'opacity 0.3s' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: done ? s.green : active ? step.color : s.bg3,
                    border: `2px solid ${done ? s.green : active ? step.color : s.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: (done || active) ? '#fff' : s.text3,
                    transition: 'all 0.3s', flexShrink: 0,
                  }}>
                    {done ? String.fromCharCode(10003) : String(i + 1)}
                  </div>
                  {i < dnsSteps.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 16, background: done ? s.green : s.border, transition: 'background 0.3s' }} />
                  )}
                </div>
                <div style={{ paddingBottom: 14, flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: done ? s.green : active ? step.color : s.text2, transition: 'color 0.3s', marginBottom: 2 }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: 12, color: s.text2, marginBottom: active ? 6 : 0, lineHeight: 1.5 }}>{step.desc}</div>
                  {active && (
                    <div style={{
                      background: s.bg, border: `1px solid ${s.border2}`, borderRadius: 6,
                      padding: '8px 12px', ...M, fontSize: 12, color: step.color,
                      transition: 'all 0.25s', wordBreak: 'break-all',
                    }}>
                      {step.msg}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
