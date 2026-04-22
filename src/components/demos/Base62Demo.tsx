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

function decodeBase62(str: string): number {
  let result = 0
  for (let i = 0; i < str.length; i++) {
    const idx = BASE62.indexOf(str[i])
    if (idx === -1) return -1
    result = result * 62 + idx
  }
  return result
}

interface Step {
  dividend: number
  quotient: number
  remainder: number
  char: string
}

function getSteps(num: number): Step[] {
  if (num === 0) return [{ dividend: 0, quotient: 0, remainder: 0, char: '0' }]
  const steps: Step[] = []
  let n = num
  while (n > 0) {
    const q = Math.floor(n / 62)
    const r = n % 62
    steps.push({ dividend: n, quotient: q, remainder: r, char: BASE62[r] })
    n = q
  }
  return steps
}

export default function Base62Demo() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [input, setInput] = useState('12345678')

  const encodeNum = parseInt(input)
  const encodeResult = useMemo(() => {
    const num = parseInt(input)
    if (isNaN(num) || num < 0) return null
    return { encoded: encodeBase62(num), steps: getSteps(num) }
  }, [input])

  const decodeResult = useMemo(() => {
    if (!/^[0-9a-zA-Z]+$/.test(input)) return null
    const num = decodeBase62(input)
    if (num < 0) return null
    return { decoded: num, chars: input.split('').map((ch, i) => ({
      char: ch, index: BASE62.indexOf(ch), power: input.length - 1 - i, value: BASE62.indexOf(ch) * Math.pow(62, input.length - 1 - i),
    })) }
  }, [input])

  const handleSwitch = () => {
    if (mode === 'encode' && encodeResult) {
      setInput(encodeResult.encoded)
      setMode('decode')
    } else if (mode === 'decode' && decodeResult) {
      setInput(decodeResult.decoded.toString())
      setMode('encode')
    }
  }

  return (
    <DemoBoundary name="Base62 Encoding">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', background: s.bg, borderRadius: 6, border: `1px solid ${s.border}` }}>
              <button onClick={() => { setMode('encode'); setInput('12345678'); }} style={{
                padding: '5px 14px', fontSize: 12, fontFamily: s.mono, borderRadius: 5, border: 'none',
                cursor: 'pointer', background: mode === 'encode' ? s.green : 'transparent',
                color: mode === 'encode' ? '#fff' : s.text3, transition: 'all 0.2s',
              }}>
                Encode
              </button>
              <button onClick={() => { setMode('decode'); setInput('4pVd'); }} style={{
                padding: '5px 14px', fontSize: 12, fontFamily: s.mono, borderRadius: 5, border: 'none',
                cursor: 'pointer', background: mode === 'decode' ? s.accent : 'transparent',
                color: mode === 'decode' ? '#fff' : s.text3, transition: 'all 0.2s',
              }}>
                Decode
              </button>
            </div>
            <button onClick={handleSwitch} style={{
              padding: '5px 12px', fontSize: 11, fontFamily: s.mono, borderRadius: 5,
              border: `1px solid ${s.border}`, background: 'transparent', color: s.text3, cursor: 'pointer',
            }}>
              Swap
            </button>
          </div>

          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, display: 'block', marginBottom: 6 }}>
                  {mode === 'encode' ? 'Numeric ID' : 'Base62 String'}
                </label>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: 14, fontFamily: s.mono, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, color: s.text, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ color: s.text3, fontSize: 18, fontFamily: s.mono }}>=</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, display: 'block', marginBottom: 6 }}>
                  {mode === 'encode' ? 'Base62 String' : 'Numeric ID'}
                </label>
                <div style={{ padding: '8px 10px', fontSize: 14, fontFamily: s.mono, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, color: mode === 'encode' ? s.green : s.accent, fontWeight: 700, minHeight: 37, display: 'flex', alignItems: 'center' }}>
                  {mode === 'encode'
                    ? (encodeResult ? encodeResult.encoded : 'invalid')
                    : (decodeResult ? decodeResult.decoded.toString() : 'invalid')
                  }
                </div>
              </div>
            </div>
          </div>

          {mode === 'encode' && encodeResult && encodeResult.steps.length > 0 && (
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 10 }}>STEP-BY-STEP DIVISION</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: s.mono }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '6px 10px', color: s.text3, fontWeight: 400, borderBottom: `1px solid ${s.border}` }}>Step</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', color: s.text3, fontWeight: 400, borderBottom: `1px solid ${s.border}` }}>Dividend</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', color: s.text3, fontWeight: 400, borderBottom: `1px solid ${s.border}` }}>Divide by 62</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', color: s.text3, fontWeight: 400, borderBottom: `1px solid ${s.border}` }}>Quotient</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', color: s.text3, fontWeight: 400, borderBottom: `1px solid ${s.border}` }}>Remainder</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', color: s.text3, fontWeight: 400, borderBottom: `1px solid ${s.border}` }}>Char</th>
                    </tr>
                  </thead>
                  <tbody>
                    {encodeResult.steps.map((step, i) => (
                      <tr key={i}>
                        <td style={{ padding: '6px 10px', color: s.text3 }}>{i + 1}</td>
                        <td style={{ padding: '6px 10px', color: s.text }}>{step.dividend}</td>
                        <td style={{ padding: '6px 10px', color: s.text3 }}>{step.dividend} / 62</td>
                        <td style={{ padding: '6px 10px', color: s.text2 }}>{step.quotient}</td>
                        <td style={{ padding: '6px 10px', color: s.yellow }}>{step.remainder}</td>
                        <td style={{ padding: '6px 10px', color: s.green, fontWeight: 700, fontSize: 14 }}>{step.char}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, fontFamily: s.mono, color: s.text3 }}>
                Read remainders <span style={{ color: s.red }}>bottom to top</span>: {encodeResult.steps.map(st => st.char).reverse().join('')}
              </div>
            </div>
          )}

          {mode === 'decode' && decodeResult && (
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 10 }}>STEP-BY-STEP MULTIPLICATION</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: s.mono }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '6px 10px', color: s.text3, fontWeight: 400, borderBottom: `1px solid ${s.border}` }}>Char</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', color: s.text3, fontWeight: 400, borderBottom: `1px solid ${s.border}` }}>Index</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', color: s.text3, fontWeight: 400, borderBottom: `1px solid ${s.border}` }}>Position</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', color: s.text3, fontWeight: 400, borderBottom: `1px solid ${s.border}` }}>Calculation</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', color: s.text3, fontWeight: 400, borderBottom: `1px solid ${s.border}` }}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decodeResult.chars.map((c, i) => (
                      <tr key={i}>
                        <td style={{ padding: '6px 10px', color: s.green, fontWeight: 700, fontSize: 14 }}>{c.char}</td>
                        <td style={{ padding: '6px 10px', color: s.text2 }}>{c.index}</td>
                        <td style={{ padding: '6px 10px', color: s.text3 }}>{c.power}</td>
                        <td style={{ padding: '6px 10px', color: s.text3 }}>{c.index} x 62^{c.power}</td>
                        <td style={{ padding: '6px 10px', color: s.yellow }}>{c.value}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={4} style={{ padding: '6px 10px', color: s.text, fontWeight: 600, borderTop: `1px solid ${s.border}` }}>Sum</td>
                      <td style={{ padding: '6px 10px', color: s.accent, fontWeight: 700, borderTop: `1px solid ${s.border}` }}>{decodeResult.decoded}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ padding: '14px 16px', borderTop: `1px solid ${s.border}`, background: s.bg }}>
            <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text3, marginBottom: 8 }}>COMBINATIONS PER LENGTH</div>
            <div style={{ display: 'flex', gap: 20, fontSize: 12, fontFamily: s.mono, flexWrap: 'wrap' }}>
              <span>1 char: <span style={{ color: s.text2 }}>62</span></span>
              <span>4 chars: <span style={{ color: s.text2 }}>14.7M</span></span>
              <span>6 chars: <span style={{ color: s.text2 }}>56.8B</span></span>
              <span>7 chars: <span style={{ color: s.green }}>3.5T</span></span>
              <span>8 chars: <span style={{ color: s.accent }}>218T</span></span>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
