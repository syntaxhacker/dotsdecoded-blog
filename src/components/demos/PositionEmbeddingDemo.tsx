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

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz '
const DIMS = 8

function tVec(code: number): number[] {
  return Array.from({ length: DIMS }, (_, d) =>
    (Math.sin(code * (d + 1) * 0.7 + d * 1.3) * 0.5 + 0.5) * 0.8 + 0.1
  )
}

function pVec(p: number): number[] {
  return Array.from({ length: DIMS }, (_, d) =>
    (Math.cos(p * (d + 1) * 0.6 + d * 2.1) * 0.5 + 0.5) * 0.8 + 0.1
  )
}

function cVec(t: number[], p: number[]): number[] {
  return t.map((v, i) => (v + p[i]) / 2)
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 14, background: s.bg3, borderRadius: 3, overflow: 'hidden', flex: 1 }}>
      <div style={{
        height: '100%',
        width: `${Math.max(2, value * 100)}%`,
        background: color,
        borderRadius: 3,
        transition: 'width 0.25s ease',
      }} />
    </div>
  )
}

function DimsRow({ values, color, label, labelW = 55 }: { values: number[]; color: string; label?: string; labelW?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
      {label !== undefined && (
        <div style={{
          width: labelW,
          fontSize: 11,
          fontFamily: s.mono,
          color: s.text3,
          flexShrink: 0,
          textAlign: 'right',
          paddingRight: 6,
        }}>
          {label}
        </div>
      )}
      {values.map((v, i) => (
        <Bar key={i} value={v} color={color} />
      ))}
    </div>
  )
}

function PositionEmbeddingDemo() {
  const [word, setWord] = useState('AI')
  const [selPos, setSelPos] = useState<number | null>(null)

  const clean = word.replace(/[^\x20-\x7E]/g, '').slice(0, 8)
  const letters = clean.split('')

  return (
    <div style={{
      maxWidth: 820, margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{ padding: '20px 24px 24px', background: s.bg, borderRadius: 12, border: `1px solid ${s.border}` }}>

        <div style={{ fontSize: 16, fontWeight: 600, color: s.text, marginBottom: 20 }}>
          Token + Position Embeddings
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 10 }}>
            Token Embeddings (the "what")
          </div>
          <div style={{
            maxHeight: 240,
            overflowY: 'auto',
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            padding: '8px 12px',
            background: s.bg2,
          }}>
            {CHARS.split('').map(ch => (
              <DimsRow
                key={ch === ' ' ? '_space' : ch}
                values={tVec(ch.charCodeAt(0))}
                color={s.accent}
                label={ch === ' ' ? '\u2423' : ch}
                labelW={28}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 10 }}>
            Position Embeddings (the "where")
          </div>
          <div style={{
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            padding: '8px 12px',
            background: s.bg2,
          }}>
            {Array.from({ length: 16 }, (_, p) => (
              <DimsRow
                key={p}
                values={pVec(p)}
                color={s.green}
                label={`p${p}`}
                labelW={28}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 12 }}>
            Combine: Type a word
          </div>
          <input
            value={word}
            onChange={e => setWord(e.target.value)}
            maxLength={8}
            placeholder='e.g. Hello'
            style={{
              width: '100%',
              padding: '10px 12px',
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
              color: s.text,
              fontFamily: s.mono,
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 16,
            }}
          />

          {letters.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '24px 0',
              color: s.text3,
              fontSize: 13,
            }}>
              Type a word to see how token and position embeddings combine
            </div>
          )}

          {letters.map((ch, i) => {
            const tv = tVec(ch.charCodeAt(0))
            const pv = pVec(i)
            const sv = cVec(tv, pv)
            const open = selPos === i

            return (
              <div
                key={i}
                onClick={() => setSelPos(open ? null : i)}
                style={{
                  marginBottom: 10,
                  padding: '10px 12px',
                  background: open ? s.bg3 : s.bg2,
                  borderRadius: 8,
                  border: `1px solid ${open ? s.border2 : s.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  fontSize: 11, color: s.text3, fontFamily: s.mono, marginBottom: 8,
                }}>
                  Position {i}: '{ch}'
                </div>
                <DimsRow values={tv} color={s.accent} label="token" />
                <DimsRow values={pv} color={s.green} label="+ pos" />
                <DimsRow values={sv} color={s.purple} label="= sum" />

                {open && (
                  <div style={{
                    marginTop: 10,
                    padding: 12,
                    background: s.bg,
                    borderRadius: 6,
                    border: `1px solid ${s.border}`,
                  }}>
                    <div style={{
                      fontSize: 11, color: s.text3, fontFamily: s.mono, marginBottom: 10,
                    }}>
                      Combined vector per-dimension values
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {sv.map((v, di) => (
                        <div key={di} style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{
                            fontSize: 10, color: s.text3, fontFamily: s.mono, marginBottom: 4,
                          }}>
                            d{di + 1}
                          </div>
                          <div style={{
                            height: 32,
                            background: s.bg3,
                            borderRadius: 4,
                            overflow: 'hidden',
                            marginBottom: 4,
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${v * 100}%`,
                              background: s.purple,
                              borderRadius: 4,
                              minWidth: 2,
                            }} />
                          </div>
                          <div style={{
                            fontSize: 10,
                            fontFamily: s.mono,
                            color: s.purple,
                            fontWeight: 600,
                          }}>
                            {v.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{
          fontSize: 12,
          color: s.text3,
          fontFamily: s.mono,
          lineHeight: 1.6,
          padding: '12px 16px',
          background: s.bg2,
          borderRadius: 8,
          border: `1px solid ${s.border}`,
        }}>
          In the real model, each embedding has 128 dimensions and is learned during training. We show 8 simplified dimensions for clarity.
        </div>
      </div>
    </div>
  )
}

export default function PositionEmbeddingDemoWrapper() {
  return (
    <DemoBoundary name="Position Embedding Demo">
      <PositionEmbeddingDemo />
    </DemoBoundary>
  )
}
