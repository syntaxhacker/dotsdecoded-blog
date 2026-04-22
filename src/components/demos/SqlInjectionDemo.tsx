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

const INJECTION_EXAMPLES = [
  { input: "admin", desc: "Normal login attempt" },
  { input: "' OR '1'='1' --", desc: "Classic injection — bypasses WHERE clause" },
  { input: "'; DROP TABLE users; --", desc: "Destructive — drops the entire users table" },
  { input: "' UNION SELECT * FROM secrets --", desc: "Data exfiltration — reads secrets table" },
]

function escapeSql(input: string): string {
  return input
    .replace(/'/g, "\\'")
    .replace(/;/g, '\\;')
    .replace(/--/g, '\\-\\-')
}

function generateUnsafeSql(input: string): string {
  return `SELECT * FROM users WHERE username = '${input}' AND password = '${input}'`
}

function generateSafeSql(input: string): string {
  return `SELECT * FROM users WHERE username = $1 AND password = $2\n  [["${input}", "${input}"]]`
}

function Panel({ mode }: { mode: 'unsafe' | 'safe' }) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)

  const isUnsafe = mode === 'unsafe'
  const accent = isUnsafe ? s.red : s.green
  const label = isUnsafe ? 'String Interpolation (Vulnerable)' : 'Parameterized Query (Rails Default)'

  const isInjected = input.includes("'") || input.includes(';') || input.includes('--')
  const sql = isUnsafe ? generateUnsafeSql(input) : generateSafeSql(input)

  return (
    <div style={{
      flex: 1, minWidth: 280, background: s.bg, borderRadius: 12,
      border: `1px solid ${accent}33`, overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${s.border}`,
        background: accent + '11', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', background: accent,
        }} />
        <div style={{ fontWeight: 700, fontSize: 12, color: accent, ...M }}>{label}</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ ...M, fontSize: 10, color: s.text3, marginBottom: 6 }}>USERNAME INPUT</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setSubmitted(false); setSelectedPreset(null) }}
            placeholder="Enter username..."
            style={{
              flex: 1, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
              padding: '10px 14px', color: s.text, ...M, fontSize: 12, outline: 'none',
            }}
          />
          <button onClick={() => setSubmitted(true)} style={{
            background: accent, border: 'none', borderRadius: 8, padding: '10px 16px',
            color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, ...M,
          }}>
            Run
          </button>
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
          {INJECTION_EXAMPLES.map((ex, idx) => (
            <button key={idx} onClick={() => { setInput(ex.input); setSelectedPreset(idx); setSubmitted(false) }} style={{
              background: selectedPreset === idx ? accent + '22' : s.bg3,
              border: `1px solid ${selectedPreset === idx ? accent + '44' : s.border}`,
              borderRadius: 6, padding: '4px 8px', color: selectedPreset === idx ? accent : s.text3,
              cursor: 'pointer', ...M, fontSize: 9, transition: 'all 0.2s',
            }}>
              {ex.desc}
            </button>
          ))}
        </div>

        {submitted && (
          <div>
            <div style={{ ...M, fontSize: 10, color: s.text3, marginBottom: 6 }}>GENERATED SQL</div>
            <div style={{
              background: s.bg2, borderRadius: 8, padding: '12px 14px',
              border: `1px solid ${isUnsafe && isInjected ? s.red + '44' : s.border}`,
              ...M, fontSize: 11, color: isUnsafe && isInjected ? s.red : s.green, lineHeight: 1.6,
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {sql}
            </div>

            {isUnsafe && isInjected && (
              <div style={{
                marginTop: 10, padding: '10px 14px', borderRadius: 8,
                background: s.red + '15', border: `1px solid ${s.red}33`,
              }}>
                <div style={{ ...M, fontSize: 11, color: s.red, fontWeight: 700, marginBottom: 4 }}>SQL INJECTION SUCCESSFUL</div>
                <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
                  The attacker&apos;s input was concatenated directly into the SQL query. The injected SQL code was executed as part of the original query, potentially exposing or destroying data.
                </div>
              </div>
            )}

            {!isUnsafe && isInjected && (
              <div style={{
                marginTop: 10, padding: '10px 14px', borderRadius: 8,
                background: s.green + '15', border: `1px solid ${s.green}33`,
              }}>
                <div style={{ ...M, fontSize: 11, color: s.green, fontWeight: 700, marginBottom: 4 }}>SAFE — PARAMETER ESCAPED</div>
                <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
                  The input is sent as a parameter (marked as {'{ $1 }'}). It is never part of the SQL string itself, so injection is impossible.
                </div>
              </div>
            )}

            {submitted && !isInjected && (
              <div style={{
                marginTop: 10, padding: '10px 14px', borderRadius: 8,
                background: s.accent + '11', border: `1px solid ${s.accent}33`,
                ...M, fontSize: 11, color: s.accent,
              }}>
                Normal query — no injection detected in input
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SqlInjectionDemo() {
  return (
    <DemoBoundary name="SQL Injection Demo">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>SQL Injection Prevention</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Panel mode="unsafe" />
          <Panel mode="safe" />
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
