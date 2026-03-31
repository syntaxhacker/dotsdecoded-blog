import { useState, useEffect, Fragment, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }
const M: React.CSSProperties = { fontFamily: s.mono }

const TABS = ['DDoS', 'Spoofing', 'MitM', 'Port Scan']

const PORTS = [
  { port: 22, name: 'SSH', open: true },
  { port: 80, name: 'HTTP', open: false },
  { port: 443, name: 'HTTPS', open: true },
  { port: 3306, name: 'MySQL', open: false },
  { port: 5432, name: 'PostgreSQL', open: false },
  { port: 8080, name: 'HTTP Alt', open: true },
  { port: 25, name: 'SMTP', open: false },
]

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
}

function DDoSTab() {
  const [attacking, setAttacking] = useState(false)
  const [traffic, setTraffic] = useState(0)
  const [overloaded, setOverloaded] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!attacking) return
    const id = setInterval(() => {
      setTraffic(t => {
        const next = t + Math.random() * 4.2 + 1
        if (next > 100 && !overloaded) setOverloaded(true)
        return next
      })
      setParticles(prev => {
        const next = [...prev]
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2
          const dist = 140 + Math.random() * 60
          next.push({
            id: Date.now() + i,
            x: 300 + Math.cos(angle) * dist,
            y: 120 + Math.sin(angle) * dist,
            vx: -Math.cos(angle) * (1.5 + Math.random() * 2),
            vy: -Math.sin(angle) * (1.5 + Math.random() * 2),
            color: [s.red, s.orange, s.yellow][Math.floor(Math.random() * 3)],
          })
        }
        return next.slice(-30).map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
        }))
      })
    }, 200)
    return () => clearInterval(id)
  }, [attacking, overloaded])

  useEffect(() => {
    if (!attacking) {
      setTraffic(0)
      setOverloaded(false)
      setParticles([])
    }
  }, [attacking])

  return (
    <Fragment>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={() => setAttacking(a => !a)} style={{
          background: attacking ? s.red : s.accent, border: 'none', borderRadius: 8,
          padding: '10px 24px', color: '#fff', cursor: 'pointer', fontSize: 14,
          fontWeight: 600, fontFamily: s.mono, transition: 'all 0.2s',
        }}>
          {attacking ? 'Stop' : 'Start Attack'}
        </button>
        <div style={{ ...M, fontSize: 13, color: traffic > 100 ? s.red : s.yellow }}>
          Traffic: {traffic.toFixed(1)} Gbps
        </div>
      </div>
      <div style={{ position: 'relative', height: 240, background: s.bg, borderRadius: 12, border: `1px solid ${s.border}`, overflow: 'hidden', marginBottom: 16 }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: p.x, top: p.y, width: 6, height: 6,
            borderRadius: '50%', background: p.color, opacity: 0.9,
          }} />
        ))}
        <div style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          width: 80, height: 80, borderRadius: 12,
          background: overloaded ? s.red + '33' : s.green + '22',
          border: `2px solid ${overloaded ? s.red : s.green}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', ...M, fontSize: 10, color: overloaded ? s.red : s.green,
          transition: 'all 0.3s', boxShadow: overloaded ? `0 0 30px ${s.red}44` : 'none',
        }}>
          <div style={{ fontSize: 18, marginBottom: 4 }}>{overloaded ? '!!' : 'OK'}</div>
          <div style={{ fontSize: 9 }}>Server</div>
        </div>
        {overloaded && (
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            ...M, fontSize: 12, color: s.red, fontWeight: 700,
            background: s.red + '22', padding: '4px 14px', borderRadius: 6,
          }}>
            OVERLOADED
          </div>
        )}
      </div>
    </Fragment>
  )
}

function SpoofingTab() {
  const [phase, setPhase] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (!animating) return
    const id = setInterval(() => setPhase(p => p + 1), 1000)
    return () => clearInterval(id)
  }, [animating])

  useEffect(() => {
    if (phase > 2) setAnimating(false)
  }, [phase])

  const reset = () => { setPhase(0); setAnimating(false) }

  const boxStyle = (color: string, active: boolean): React.CSSProperties => ({
    background: active ? color + '22' : s.bg3, border: `2px solid ${active ? color : s.border}`,
    borderRadius: 10, padding: '14px 18px', textAlign: 'center',
    ...M, fontSize: 11, color: active ? color : s.text2, transition: 'all 0.3s',
    minWidth: 90, boxShadow: active ? `0 0 12px ${color}33` : 'none',
  })

  return (
    <Fragment>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setAnimating(true)} style={{
          background: s.accent, border: 'none', borderRadius: 8, padding: '8px 20px',
          color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: s.mono,
        }}>
          Start
        </button>
        <button onClick={reset} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: '8px 20px', color: s.text2, cursor: 'pointer', fontSize: 13, fontFamily: s.mono,
        }}>
          Reset
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 16 }}>
        <div style={boxStyle(s.red, phase >= 1)}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Attacker</div>
          <div style={{ fontSize: 9 }}>192.0.2.1</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {phase >= 1 && (
            <div style={{ ...M, fontSize: 9, color: s.red, textAlign: 'center' }}>
              src: <span style={{ color: s.red, fontWeight: 700, textDecoration: 'underline' }}>203.0.113.42</span> (forged)
            </div>
          )}
          <div style={{ width: '100%', height: 2, background: phase >= 1 ? s.red : s.border, transition: 'background 0.3s' }} />
          <div style={{ ...M, fontSize: 8, color: s.text3 }}>DNS Query</div>
        </div>
        <div style={boxStyle(s.accent, phase >= 1)}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>DNS Server</div>
          <div style={{ fontSize: 9 }}>1.1.1.1</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {phase >= 2 && (
            <div style={{ ...M, fontSize: 9, color: s.accent, textAlign: 'center' }}>
              dst: 203.0.113.42
            </div>
          )}
          <div style={{ width: '100%', height: 2, background: phase >= 2 ? s.accent : s.border, transition: 'background 0.3s' }} />
          <div style={{ ...M, fontSize: 8, color: s.text3 }}>Large Response</div>
        </div>
        <div style={boxStyle(s.orange, phase >= 2)}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Victim</div>
          <div style={{ fontSize: 9 }}>203.0.113.42</div>
        </div>
      </div>
      {phase >= 2 && (
        <div style={{ marginTop: 16, ...M, fontSize: 11, color: s.red, textAlign: 'center', padding: '10px', background: s.red + '11', borderRadius: 8, border: `1px solid ${s.red}33` }}>
          Spoofed source IP highlighted in red — Victim receives unrequested traffic
        </div>
      )}
    </Fragment>
  )
}

function MitMTab() {
  const [showHttps, setShowHttps] = useState(false)

  const nodeBox = (label: string, color: string, active: boolean, desc: string): React.CSSProperties => ({
    background: active ? color + '22' : s.bg3, border: `2px solid ${active ? color : s.border}`,
    borderRadius: 10, padding: '12px 14px', textAlign: 'center',
    ...M, fontSize: 10, color: active ? color : s.text2, transition: 'all 0.3s',
    minWidth: 80,
  })

  const lineStyle = (active: boolean, color: string): React.CSSProperties => ({
    flex: 1, height: 2, background: active ? color : s.border, transition: 'background 0.3s', position: 'relative',
  })

  return (
    <Fragment>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setShowHttps(false)} style={{
          background: !showHttps ? s.red : s.bg3, border: `1px solid ${!showHttps ? s.red : s.border}`,
          borderRadius: 8, padding: '8px 18px', color: !showHttps ? '#fff' : s.text2,
          cursor: 'pointer', fontSize: 12, fontFamily: s.mono, fontWeight: 600, transition: 'all 0.2s',
        }}>
          HTTP (Insecure)
        </button>
        <button onClick={() => setShowHttps(true)} style={{
          background: showHttps ? s.green : s.bg3, border: `1px solid ${showHttps ? s.green : s.border}`,
          borderRadius: 8, padding: '8px 18px', color: showHttps ? '#fff' : s.text2,
          cursor: 'pointer', fontSize: 12, fontFamily: s.mono, fontWeight: 600, transition: 'all 0.2s',
        }}>
          HTTPS (Secure)
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16 }}>
        <div style={nodeBox('Your Device', s.green, true, '')}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Your Device</div>
          <div style={{ fontSize: 16 }}>{showHttps ? String.fromCharCode(128274) : String.fromCharCode(128274)}</div>
          <div style={{ fontSize: 9 }}>{showHttps ? 'Encrypted' : 'Encrypted'}</div>
        </div>
        <div style={lineStyle(true, s.green)}>
          <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', ...M, fontSize: 8, color: s.green, whiteSpace: 'nowrap' }}>
            {showHttps ? 'encrypted' : 'plaintext'}
          </div>
        </div>
        <div style={nodeBox('Attacker', showHttps ? s.text3 : s.red, !showHttps, '')}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, color: showHttps ? s.text3 : s.red }}>Attacker</div>
          <div style={{ fontSize: 8, color: showHttps ? s.text3 : s.text2, marginBottom: 2 }}>(Wi-Fi AP)</div>
          <div style={{ fontSize: 16 }}>
            {!showHttps ? String.fromCharCode(128275) : String.fromCharCode(128274)}
          </div>
          <div style={{ fontSize: 9, color: showHttps ? s.text3 : s.red }}>
            {showHttps ? 'Cannot read' : 'Decrypted!'}
          </div>
        </div>
        <div style={lineStyle(true, showHttps ? s.green : s.red)}>
          <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', ...M, fontSize: 8, color: showHttps ? s.green : s.red, whiteSpace: 'nowrap' }}>
            {showHttps ? 'still encrypted' : 'relayed plaintext'}
          </div>
        </div>
        <div style={nodeBox('Router', s.accent, true, '')}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Router</div>
          <div style={{ fontSize: 9 }}>Forwarding</div>
        </div>
      </div>
      <div style={{
        ...M, fontSize: 11, textAlign: 'center', padding: '12px', borderRadius: 8,
        background: showHttps ? s.green + '11' : s.red + '11',
        border: `1px solid ${showHttps ? s.green + '33' : s.red + '33'}`,
        color: showHttps ? s.green : s.red, lineHeight: 1.6,
      }}>
        {showHttps
          ? 'HTTPS protected — Attacker can see traffic but cannot read or modify it (TLS encryption remains end-to-end)'
          : 'HTTP insecure — Attacker can read and modify all traffic between your device and the server'
        }
      </div>
    </Fragment>
  )
}

function PortScanTab() {
  const [scanning, setScanning] = useState(false)
  const [scanIdx, setScanIdx] = useState(-1)
  const [results, setResults] = useState<{ port: number; name: string; open: boolean }[]>([])

  useEffect(() => {
    if (!scanning) return
    const id = setInterval(() => {
      setScanIdx(prev => {
        const next = prev + 1
        if (next >= PORTS.length) {
          setScanning(false)
          return prev
        }
        setResults(r => [...r, PORTS[next]])
        return next
      })
    }, 600)
    return () => clearInterval(id)
  }, [scanning])

  const reset = () => { setScanning(false); setScanIdx(-1); setResults([]) }

  return (
    <Fragment>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={() => { reset(); setScanning(true) }} style={{
          background: scanning ? s.bg3 : s.accent, border: 'none', borderRadius: 8,
          padding: '8px 20px', color: scanning ? s.text3 : '#fff', cursor: scanning ? 'default' : 'pointer',
          fontSize: 13, fontWeight: 600, fontFamily: s.mono,
        }}>
          {scanning ? 'Scanning...' : 'Scan'}
        </button>
        <button onClick={reset} style={{
          background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
          padding: '8px 20px', color: s.text2, cursor: 'pointer', fontSize: 13, fontFamily: s.mono,
        }}>
          Reset
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, justifyContent: 'center' }}>
        {PORTS.map((p, i) => {
          const isScanning = i === scanIdx && scanning
          const isDone = results.some(r => r.port === p.port)
          const result = results.find(r => r.port === p.port)
          const color = isScanning ? s.yellow : isDone ? (result?.open ? s.green : s.red) : s.text3
          return (
            <div key={p.port} style={{
              ...M, fontSize: 11, padding: '10px 14px', borderRadius: 8,
              background: isScanning ? s.yellow + '22' : isDone ? (result?.open ? s.green + '15' : s.red + '15') : s.bg3,
              border: `1px solid ${color}44`,
              color, transition: 'all 0.3s', textAlign: 'center', minWidth: 60,
              boxShadow: isScanning ? `0 0 12px ${s.yellow}33` : 'none',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{p.port}</div>
              <div style={{ fontSize: 8, color: s.text3 }}>{isScanning ? '...' : isDone ? (result?.open ? 'OPEN' : 'CLOSED') : p.name}</div>
            </div>
          )
        })}
      </div>
      {results.length > 0 && (
        <div style={{ background: s.bg, borderRadius: 8, padding: '14px 18px', maxHeight: 180, overflowY: 'auto' }}>
          {results.map(r => (
            <div key={r.port} style={{ ...M, fontSize: 11, marginBottom: 4, color: r.open ? s.green : s.red }}>
              {String(r.port).padEnd(6)} {r.open ? 'OPEN' : 'CLOSED'}{r.open ? ` - ${r.name}` : ''}
            </div>
          ))}
        </div>
      )}
      {results.length === PORTS.length && (
        <div style={{ marginTop: 12, ...M, fontSize: 11, color: s.text2, textAlign: 'center' }}>
          Scan complete — {results.filter(r => r.open).length} open ports found
        </div>
      )}
    </Fragment>
  )
}

export default function AttackDemo() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <DemoBoundary name="Network Attacks">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Network Attacks</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)} style={{
              flex: 1, background: activeTab === i ? s.accent : s.bg3,
              border: `1px solid ${activeTab === i ? s.accent : s.border}`,
              borderRadius: 8, padding: '10px 8px', color: activeTab === i ? '#fff' : s.text2,
              cursor: 'pointer', ...M, fontSize: 11, fontWeight: 600, transition: 'all 0.2s',
            }}>
              {tab}
            </button>
          ))}
        </div>
        {activeTab === 0 && <DDoSTab />}
        {activeTab === 1 && <SpoofingTab />}
        {activeTab === 2 && <MitMTab />}
        {activeTab === 3 && <PortScanTab />}
      </div>
    </div>
    </DemoBoundary>
  )
}
