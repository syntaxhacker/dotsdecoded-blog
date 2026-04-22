import { useState, useMemo } from 'react'
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

const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

function encodeBase62(num: number): string {
  if (num === 0) return '0'
  let result = ''
  let n = num
  while (n > 0) {
    result = BASE62[n % 62] + result
    n = Math.floor(n / 62)
  }
  return result
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    hash = ((hash << 5) - hash + ch) | 0
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

function randomString(len: number): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

function birthdayParadox(n: number, space: number): number {
  return 1 - Math.exp(-((n * (n - 1)) / (2 * space)))
}

export default function EncodingDemo() {
  const [inputId, setInputId] = useState('12345678')
  const [inputUrl, setInputUrl] = useState('https://docs.google.com/spreadsheets/d/1aBcDeF/edit')

  const numId = parseInt(inputId) || 0

  const base62Result = useMemo(() => encodeBase62(numId), [numId])
  const hashResult = useMemo(() => simpleHash(inputUrl).slice(0, 7), [inputUrl])
  const [randomResult, setRandomResult] = useState(randomString(7))

  const handleRandomize = () => setRandomResult(randomString(7))

  const totalUrls = 500_000_000
  const collisionRate6 = (birthdayParadox(totalUrls, Math.pow(62, 6)) * 100).toFixed(1)
  const collisionRate7 = (birthdayParadox(totalUrls, Math.pow(62, 7)) * 100).toFixed(1)
  const collisionRate8 = (birthdayParadox(totalUrls, Math.pow(62, 8)) * 100).toFixed(6)

  const approaches = [
    {
      name: 'Auto-increment + Base62',
      color: s.green,
      pros: ['No collisions', 'Predictable length', 'Simple to implement', 'Easy to reverse to ID'],
      cons: ['Sequential = guessable', 'Requires distributed ID generator at scale', 'Single point of failure for ID assignment'],
    },
    {
      name: 'Hash + Truncate',
      color: s.accent,
      pros: ['No shared state needed', 'Same URL always gets same code', 'Works distributed'],
      cons: ['Collisions possible', 'Unpredictable length', 'Cannot reverse to original'],
    },
    {
      name: 'Random Generation',
      color: s.purple,
      pros: ['No coordination needed', 'Truly unpredictable', 'Works at any scale'],
      cons: ['Collisions must be handled', 'Need DB uniqueness check on every write', 'Slightly longer codes on average'],
    },
  ]

  return (
    <DemoBoundary name="Encoding Comparison">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 240px', minWidth: 200 }}>
                <label style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, display: 'block', marginBottom: 6 }}>Numeric ID (for Base62)</label>
                <input
                  value={inputId}
                  onChange={e => setInputId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 13, fontFamily: s.mono, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, color: s.text, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: '1 1 300px', minWidth: 250 }}>
                <label style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, display: 'block', marginBottom: 6 }}>URL (for Hash)</label>
                <input
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 13, fontFamily: s.mono, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, color: s.text, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {[
              { label: 'Base62', result: base62Result, color: s.green, sub: `ID ${numId} -> "${base62Result}"` },
              { label: 'Hash (7 chars)', result: hashResult, color: s.accent, sub: `hash("${inputUrl.slice(0, 30)}...")` },
              { label: 'Random (7 chars)', result: randomResult, color: s.purple, sub: undefined },
            ].map(item => (
              <div key={item.label} style={{ flex: '1 1 200px', minWidth: 160, padding: '12px 16px', borderRight: `1px solid ${s.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 20, fontFamily: s.mono, color: item.color, fontWeight: 700, letterSpacing: 2 }}>{item.result}</div>
                {item.sub && <div style={{ fontSize: 10, fontFamily: s.mono, color: s.text3, marginTop: 6 }}>{item.sub}</div>}
                {item.label === 'Random (7 chars)' && (
                  <button onClick={handleRandomize} style={{
                    marginTop: 8, padding: '4px 10px', fontSize: 11, fontFamily: s.mono, borderRadius: 4,
                    border: `1px solid ${s.purple}`, background: 'transparent', color: s.purple, cursor: 'pointer',
                  }}>
                    Regenerate
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ padding: '14px 16px', borderTop: `1px solid ${s.border}`, background: s.bg }}>
            <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 10 }}>COLLISION PROBABILITY (500M URLs, birthday paradox)</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, fontFamily: s.mono, flexWrap: 'wrap' }}>
              <span>6 chars: <span style={{ color: s.red }}>{collisionRate6}%</span></span>
              <span>7 chars: <span style={{ color: s.yellow }}>{collisionRate7}%</span></span>
              <span>8 chars: <span style={{ color: s.green }}>{collisionRate8}%</span></span>
            </div>
          </div>

          <div style={{ padding: 16, borderTop: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Comparison</div>
            {approaches.map(ap => (
              <div key={ap.name} style={{ marginBottom: 14, padding: '10px 14px', background: s.bg, borderRadius: 8, border: `1px solid ${s.border}` }}>
                <div style={{ fontSize: 13, fontFamily: s.mono, color: ap.color, fontWeight: 600, marginBottom: 8 }}>{ap.name}</div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    {ap.pros.map((p, i) => (
                      <div key={i} style={{ fontSize: 11, color: s.green, marginBottom: 3, fontFamily: s.mono }}>+ {p}</div>
                    ))}
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    {ap.cons.map((c, i) => (
                      <div key={i} style={{ fontSize: 11, color: s.red, marginBottom: 3, fontFamily: s.mono }}>- {c}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
