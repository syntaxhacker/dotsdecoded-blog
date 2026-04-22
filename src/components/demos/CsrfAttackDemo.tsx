import { useState, Fragment } from 'react'
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

interface LogEntry {
  text: string
  color: string
}

function ScenarioPanel({ protected: isProtected }: { protected: boolean }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [phase, setPhase] = useState(0)
  const [result, setResult] = useState<'none' | 'success' | 'blocked'>('none')

  const run = () => {
    setLogs([])
    setResult('none')
    const sequence: LogEntry[] = [
      { text: 'User visits evil.com', color: s.yellow },
      { text: 'evil.com sends hidden form POST', color: s.yellow },
      { text: 'POST /transfer to bank.com', color: s.orange },
      { text: `Cookie: session=abc123 (auto-attached)`, color: s.text2 },
    ]

    if (isProtected) {
      sequence.push({ text: 'Form missing authenticity_token', color: s.red })
      sequence.push({ text: 'ActionController::InvalidAuthenticityToken', color: s.red })
      sequence.push({ text: '422 Unprocessable Entity', color: s.red })
    } else {
      sequence.push({ text: 'No CSRF check configured', color: s.text3 })
      sequence.push({ text: 'Request accepted', color: s.green })
      sequence.push({ text: '$500 transferred to attacker', color: s.green })
    }

    setLogs(sequence.slice(0, 1))
    setPhase(1)

    let i = 1
    const id = setInterval(() => {
      if (i >= sequence.length) {
        clearInterval(id)
        setResult(isProtected ? 'blocked' : 'success')
        setPhase(sequence.length)
        return
      }
      setLogs(prev => [...prev, sequence[i]])
      setPhase(i + 1)
      i++
    }, 600)

    return () => clearInterval(id)
  }

  const label = isProtected ? 'With Rails CSRF Protection' : 'Without CSRF Protection'
  const accentColor = isProtected ? s.green : s.red

  return (
    <div style={{
      flex: 1, minWidth: 280, background: s.bg, borderRadius: 12,
      border: `1px solid ${accentColor}33`, overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 18px', borderBottom: `1px solid ${s.border}`,
        background: accentColor + '11', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', background: accentColor,
          boxShadow: result === 'none' ? 'none' : `0 0 8px ${accentColor}66`,
        }} />
        <div style={{ fontWeight: 700, fontSize: 13, color: accentColor }}>{label}</div>
      </div>

      <div style={{ padding: 16 }}>
        <button onClick={run} disabled={phase > 0 && phase < 8} style={{
          width: '100%', background: phase > 0 && phase < 8 ? s.bg3 : accentColor,
          border: 'none', borderRadius: 8, padding: '10px', color: phase > 0 && phase < 8 ? s.text3 : '#fff',
          cursor: phase > 0 && phase < 8 ? 'default' : 'pointer', fontSize: 12,
          fontWeight: 600, fontFamily: s.mono, marginBottom: 14, transition: 'all 0.2s',
        }}>
          {phase > 0 && phase < 8 ? 'Running...' : 'Send Transfer Request'}
        </button>

        <div style={{
          background: s.bg2, borderRadius: 8, padding: '12px 14px',
          minHeight: 180, maxHeight: 180, overflowY: 'auto',
          border: `1px solid ${s.border}`,
        }}>
          {logs.length === 0 && (
            <div style={{ ...M, fontSize: 11, color: s.text3 }}>Click the button to simulate...</div>
          )}
          {logs.map((entry, idx) => (
            <div key={idx} style={{
              ...M, fontSize: 10, color: entry.color,
              marginBottom: 6, lineHeight: 1.5,
              opacity: idx === logs.length - 1 ? 1 : 0.7,
              animation: idx === logs.length - 1 ? 'none' : undefined,
            }}>
              {'> '}{entry.text}
            </div>
          ))}
        </div>

        {result === 'success' && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8,
            background: s.red + '15', border: `1px solid ${s.red}33`,
            ...M, fontSize: 11, color: s.red, fontWeight: 600,
          }}>
            ATTACK SUCCEEDED — $500 stolen
          </div>
        )}
        {result === 'blocked' && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8,
            background: s.green + '15', border: `1px solid ${s.green}33`,
            ...M, fontSize: 11, color: s.green, fontWeight: 600,
          }}>
            BLOCKED — authenticity_token missing
          </div>
        )}
      </div>
    </div>
  )
}

function FlowDiagram() {
  const boxes = [
    { label: 'Your Browser', sub: 'bank.com logged in', color: s.accent, x: 0 },
    { label: 'evil.com', sub: 'Malicious site', color: s.red, x: 1 },
    { label: 'bank.com', sub: 'Your bank', color: s.green, x: 2 },
  ]

  return (
    <div style={{ marginTop: 16, padding: '16px', background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}` }}>
      <div style={{ ...M, fontSize: 10, color: s.text3, marginBottom: 12, textAlign: 'center' }}>REQUEST FLOW</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {boxes.map((box, idx) => (
          <Fragment key={box.label}>
            <div style={{
              flex: 1, padding: '12px 10px', borderRadius: 8,
              background: box.color + '15', border: `1px solid ${box.color}44`,
              textAlign: 'center',
            }}>
              <div style={{ ...M, fontSize: 11, fontWeight: 700, color: box.color, marginBottom: 4 }}>{box.label}</div>
              <div style={{ ...M, fontSize: 9, color: s.text3 }}>{box.sub}</div>
            </div>
            {idx < 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 60 }}>
                <div style={{ ...M, fontSize: 9, color: idx === 0 ? s.red : s.orange }}>POST /transfer</div>
                <div style={{ width: 50, height: 2, background: idx === 0 ? s.red : s.orange, borderRadius: 1 }} />
                <div style={{ ...M, fontSize: 8, color: s.text3 }}>
                  {idx === 0 ? 'hidden form' : 'cookie sent'}
                </div>
              </div>
            )}
          </Fragment>
        ))}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, padding: '8px 10px', background: s.green + '11', borderRadius: 6, border: `1px solid ${s.green}22` }}>
          <div style={{ ...M, fontSize: 9, color: s.green, fontWeight: 700 }}>Rails Check</div>
          <div style={{ ...M, fontSize: 9, color: s.text3, marginTop: 2 }}>session token matches authenticity_token?</div>
        </div>
        <div style={{ flex: 1, padding: '8px 10px', background: s.red + '11', borderRadius: 6, border: `1px solid ${s.red}22` }}>
          <div style={{ ...M, fontSize: 9, color: s.red, fontWeight: 700 }}>Missing Token</div>
          <div style={{ ...M, fontSize: 9, color: s.text3, marginTop: 2 }}>cross-origin form has no token</div>
        </div>
      </div>
    </div>
  )
}

export default function CsrfAttackDemo() {
  return (
    <DemoBoundary name="CSRF Attack Demo">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>CSRF Attack Simulation</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <ScenarioPanel protected={false} />
          <ScenarioPanel protected={true} />
        </div>
        <FlowDiagram />
      </div>
    </div>
    </DemoBoundary>
  )
}
