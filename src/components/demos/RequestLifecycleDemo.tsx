import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const steps = [
  { label: 'DNS Lookup', time: '20-120ms', desc: 'The browser asks the DNS resolver to translate "example.com" into an IP address like 93.184.216.34. This involves checking the browser cache, OS cache, router cache, ISP DNS, and recursive lookups if needed.', color: s.accent, icon: 'D' },
  { label: 'TCP Handshake', time: '10-100ms', desc: 'The client sends a SYN packet, the server responds with SYN-ACK, and the client sends ACK. Three packets to establish a reliable, ordered connection before any data flows.', color: s.green, icon: 'T' },
  { label: 'TLS Handshake', time: '30-150ms', desc: 'Client and server negotiate encryption: the server presents its certificate, both agree on a cipher suite, and exchange key material. After this, all data is encrypted with HTTPS.', color: s.purple, icon: 'L' },
  { label: 'HTTP Request', time: '5-50ms', desc: 'The browser sends the actual HTTP request: method (GET), path (/api/users), headers (Authorization, Content-Type, cookies), and optionally a request body.', color: s.orange, icon: 'H' },
  { label: 'Server Processing', time: '10-500ms', desc: 'The server parses the request, runs middleware (auth, rate limiting), executes the route handler, queries the database or cache, and constructs the response.', color: s.yellow, icon: 'S' },
  { label: 'HTTP Response', time: '5-50ms', desc: 'The server sends back the response: status code (200 OK), response headers (Content-Type, Cache-Control), and the response body (JSON, HTML, or binary data).', color: s.green, icon: 'R' },
  { label: 'Browser Rendering', time: '50-300ms', desc: 'The browser parses the HTML, builds the DOM tree, applies CSS to create the render tree, executes JavaScript, and paints pixels on screen. This is when the user actually sees the page.', color: s.accent, icon: 'B' },
]

export default function RequestLifecycleDemo() {
  const [activeStep, setActiveStep] = useState(-1)
  const [autoPlay, setAutoPlay] = useState(false)
  const [speed, setSpeed] = useState(1)

  const next = useCallback(() => {
    setActiveStep(prev => Math.min(prev + 1, steps.length - 1))
  }, [])

  const prev = useCallback(() => {
    setActiveStep(prev => Math.max(prev - 1, -1))
  }, [])

  const reset = () => { setActiveStep(-1); setAutoPlay(false) }

  useEffect(() => {
    if (!autoPlay || activeStep >= steps.length - 1) {
      if (activeStep >= steps.length - 1) setAutoPlay(false)
      return
    }
    const t = setTimeout(next, getStepDelay(1500, speed))
    return () => clearTimeout(t)
  }, [autoPlay, activeStep, speed, next])

  return (
    <DemoBoundary name="Request Lifecycle">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>Request-Response Lifecycle</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Step through each phase of a single HTTP request. Click Next or use Auto Play.
        </p>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, alignItems: 'center' }}>
          {steps.map((st, idx) => (
            <div key={st.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: idx < activeStep ? `${st.color}20` : idx === activeStep ? st.color : s.bg3,
                border: `2px solid ${idx < activeStep ? st.color : idx === activeStep ? st.color : s.border}`,
                color: idx <= activeStep ? '#fff' : s.text3, fontSize: 14, fontWeight: 700, fontFamily: s.mono,
                transition: 'all 0.3s', boxShadow: idx === activeStep ? `0 0 12px ${st.color}40` : 'none',
              }}>{st.icon}</div>
              {idx < steps.length - 1 && (
                <div style={{ width: '100%', height: 2, background: idx < activeStep ? st.color : s.border, marginTop: -18, marginBottom: 14, transition: 'all 0.3s' }} />
              )}
              <div style={{ fontSize: 9, color: idx === activeStep ? st.color : s.text3, fontWeight: 600, textAlign: 'center', marginTop: 4, whiteSpace: 'nowrap' }}>{st.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: s.bg, borderRadius: 8, padding: 20, marginBottom: 16, minHeight: 100, transition: 'all 0.3s' }}>
          {activeStep === -1 ? (
            <div style={{ color: s.text3, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Click "Next Step" to begin walking through the request lifecycle</div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: steps[activeStep].color }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: steps[activeStep].color }}>{steps[activeStep].label}</span>
                </div>
                <span style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, background: s.bg3, padding: '2px 8px', borderRadius: 4 }}>{steps[activeStep].time}</span>
              </div>
              <div style={{ fontSize: 13, color: s.text2, lineHeight: 1.7 }}>{steps[activeStep].desc}</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
          <button onClick={prev} disabled={activeStep <= -1} style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 16px', color: activeStep <= -1 ? s.text3 : s.text2, cursor: activeStep <= -1 ? 'default' : 'pointer', fontSize: 13, opacity: activeStep <= -1 ? 0.5 : 1 }}>
            Prev
          </button>
          <button onClick={next} disabled={activeStep >= steps.length - 1} style={{ background: s.accent, border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: activeStep >= steps.length - 1 ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: activeStep >= steps.length - 1 ? 0.5 : 1 }}>
            Next Step
          </button>
          <button onClick={() => setAutoPlay(!autoPlay)} style={{ background: autoPlay ? s.orange : s.bg3, border: `1px solid ${autoPlay ? s.orange : s.border}`, borderRadius: 8, padding: '8px 16px', color: autoPlay ? '#fff' : s.text2, cursor: 'pointer', fontSize: 13 }}>
            {autoPlay ? 'Pause' : 'Auto Play'}
          </button>
          <button onClick={reset} style={{ background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 16px', color: s.text2, cursor: 'pointer', fontSize: 13 }}>Reset</button>
          <div style={{ flex: 1 }} />
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
