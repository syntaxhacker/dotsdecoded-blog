import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

function ordinal(n: number) {
  const j = n % 10
  if (n >= 11 && n <= 13) return `${n}th`
  if (j === 1) return `${n}st`
  if (j === 2) return `${n}nd`
  if (j === 3) return `${n}rd`
  return `${n}th`
}

export default function CausalMaskDemo() {
  const [input, setInput] = useState('')
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const N = 8

  const chars = input.padEnd(N, '\u00b7').slice(0, N).split('')

  const isAllowed = (row: number, col: number) => col <= row

  return (
    <DemoBoundary name="Causal Mask">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '24px 28px 20px' }}>
          <div style={{ color: s.text, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            Causal (Autoregressive) Mask
          </div>
          <div style={{ color: s.text3, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
            A lower-triangular mask that prevents tokens from attending to future positions.
            Each row shows which previous positions a token can look at.
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ color: s.text2, fontSize: 13, marginBottom: 6 }}>
              Type a sequence (max {N} characters):
            </div>
            <input
              value={input}
              onChange={e => {
                setInput(e.target.value.slice(0, N))
                setSelectedRow(null)
              }}
              maxLength={N}
              style={{
                background: s.bg2,
                border: `1px solid ${s.border}`,
                borderRadius: 6,
                padding: '8px 12px',
                color: s.text,
                fontFamily: s.mono,
                fontSize: 16,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 20, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: s.green }} />
              <span style={{ color: s.text2, fontSize: 12 }}>Allowed (past + self)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: s.red, opacity: 0.35 }} />
              <span style={{ color: s.text2, fontSize: 12 }}>Blocked (future)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: s.accent }} />
              <span style={{ color: s.text2, fontSize: 12 }}>Hovered cell</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'inline-block' }}>
              <div style={{ display: 'flex', marginBottom: 4, paddingLeft: 44 }}>
                {chars.map((char, col) => (
                  <div
                    key={`ch-${col}`}
                    style={{
                      width: 48,
                      textAlign: 'center',
                      color: s.purple,
                      fontSize: 11,
                      fontFamily: s.mono,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {col}:{char}
                  </div>
                ))}
              </div>

              {chars.map((char, row) => (
                <div key={`r-${row}`} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                  <div
                    style={{
                      width: 44,
                      textAlign: 'right',
                      paddingRight: 8,
                      color: s.accent,
                      fontSize: 11,
                      fontFamily: s.mono,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {row}:{char}
                  </div>
                  {chars.map((_, col) => {
                    const allowed = isAllowed(row, col)
                    const cellHovered = hovered?.row === row && hovered?.col === col
                    const rowSelected = selectedRow === row && !cellHovered
                    const cellDim = hovered !== null && !cellHovered

                    return (
                      <div
                        key={`c-${row}-${col}`}
                        onMouseEnter={() => setHovered({ row, col })}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => setSelectedRow(row === selectedRow ? null : row)}
                        style={{
                          width: 48,
                          height: 36,
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: s.mono,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          marginRight: 2,
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                          ...(allowed
                            ? {
                                background: cellHovered
                                  ? s.green
                                  : rowSelected
                                    ? `${s.green}40`
                                    : `${s.green}20`,
                                color: cellHovered ? '#000' : s.green,
                                border: cellHovered
                                  ? `2px solid ${s.green}`
                                  : `1px solid ${s.green}40`,
                              }
                            : {
                                background: cellHovered
                                  ? `${s.red}50`
                                  : `${s.red}10`,
                                color: cellHovered ? s.text : s.text3,
                                border: cellHovered
                                  ? `2px solid ${s.red}80`
                                  : `1px solid ${s.red}20`,
                              }),
                          opacity: allowed ? (cellDim ? 0.5 : 1) : (cellDim ? 0.25 : 0.5),
                        }}
                      >
                        {allowed ? '\u2713' : '\u2717'}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {hovered && (() => {
            const { row, col } = hovered
            const allowed = isAllowed(row, col)
            const rowChar = chars[row]
            const colChar = chars[col]
            return (
              <div style={{
                marginTop: 16,
                padding: 12,
                background: s.bg2,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                color: s.text2,
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: s.mono,
              }}>
                <div>
                  Token at position <strong style={{ color: s.text }}>{row}</strong> ({rowChar}){' '}
                  <strong style={{ color: allowed ? s.green : s.red }}>
                    {allowed ? 'CAN' : 'CANNOT'}
                  </strong>{' '}
                  attend to token at position <strong style={{ color: s.text }}>{col}</strong> ({colChar})
                </div>
                <div style={{ color: s.text3, marginTop: 4 }}>
                  The {ordinal(row + 1)} character can see positions 0 through {row}
                  {allowed
                    ? ` (including position ${col})`
                    : ` but NOT position ${col} (future)`}
                </div>
              </div>
            )
          })()}

          {selectedRow !== null && !hovered && (() => {
            const r = selectedRow
            const allowedChars = chars.slice(0, r + 1).map((c, i) => `${i}(${c})`).join(', ')
            return (
              <div style={{
                marginTop: 16,
                padding: 12,
                background: s.bg2,
                border: `1px solid ${s.accent}60`,
                borderRadius: 8,
                color: s.text2,
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: s.mono,
              }}>
                Position <strong style={{ color: s.text }}>{r}</strong> ({chars[r]}) can attend to:{' '}
                <strong style={{ color: s.green }}>{allowedChars}</strong>
              </div>
            )
          })()}

          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${s.border}`,
            textAlign: 'center',
            color: s.text3,
            fontSize: 12,
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}>
            The causal mask ensures tokens only attend to themselves and previous tokens. No peeking into the future!
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
