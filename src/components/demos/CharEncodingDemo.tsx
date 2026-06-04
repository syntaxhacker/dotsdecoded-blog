import { useState } from 'react'
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

const VOCAB = " \n!$&',-.3:;?ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

function charToId(ch: string): number | undefined {
  const idx = VOCAB.indexOf(ch)
  return idx >= 0 ? idx : undefined
}

function displayChar(ch: string): string {
  if (ch === ' ') return '\u2423'
  if (ch === '\n') return '\\n'
  return ch
}

export default function CharEncodingDemo() {
  const [text, setText] = useState('')

  const chars = text.split('')
  const ids = chars.map(charToId)
  const inputChars = chars.slice(0, -1)
  const targetChars = chars.slice(1)
  const inputIds = inputChars.map(charToId)
  const targetIds = targetChars.map(charToId)
  const hasShift = chars.length >= 2

  return (
    <DemoBoundary name="Char Encoding">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, padding: 20 }}>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Character Vocabulary (0-64)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: 4 }}>
              {VOCAB.split('').map((ch, i) => (
                <div key={i} style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: 5,
                  padding: '4px 0',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: 15,
                    fontFamily: s.mono,
                    color: ch === '\n' ? s.yellow : s.text,
                    lineHeight: 1.3,
                  }}>
                    {displayChar(ch)}
                  </div>
                  <div style={{ fontSize: 9, fontFamily: s.mono, color: s.text3 }}>{i}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Encode Text
            </div>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type some text..."
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                fontFamily: s.mono,
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 6,
                color: s.text,
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 10,
              }}
            />
            {text.length > 0 && (
              <div style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 6,
                padding: '10px 12px',
              }}>
                <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 6 }}>Encoded IDs</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, fontFamily: s.mono, fontSize: 13 }}>
                  {chars.map((ch, i) => (
                    <span key={i} style={{
                      background: ids[i] !== undefined ? `${s.accent}22` : `${s.red}22`,
                      color: ids[i] !== undefined ? s.accent : s.red,
                      padding: '2px 6px',
                      borderRadius: 3,
                    }}>
                      {ids[i] !== undefined ? ids[i] : '?'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {hasShift && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                Input / Target Shift
              </div>
              <div style={{ marginBottom: 4, fontSize: 10, fontFamily: s.mono, color: s.text3 }}>
                INPUT (chars 0..n-1)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
                {inputChars.map((ch, i) => (
                  <div key={i} style={{
                    background: `${s.accent}22`,
                    border: `1px solid ${s.accent}`,
                    borderRadius: 4,
                    padding: '4px 8px',
                    textAlign: 'center',
                    minWidth: 32,
                  }}>
                    <div style={{ fontSize: 14, fontFamily: s.mono, color: s.accent, lineHeight: 1.3 }}>
                      {displayChar(ch)}
                    </div>
                    <div style={{ fontSize: 9, fontFamily: s.mono, color: s.text3 }}>{inputIds[i]}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 4, fontSize: 10, fontFamily: s.mono, color: s.text3 }}>
                TARGET (chars 1..n)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {targetChars.map((ch, i) => (
                  <div key={i} style={{
                    background: `${s.green}22`,
                    border: `1px solid ${s.green}`,
                    borderRadius: 4,
                    padding: '4px 8px',
                    textAlign: 'center',
                    minWidth: 32,
                  }}>
                    <div style={{ fontSize: 14, fontFamily: s.mono, color: s.green, lineHeight: 1.3 }}>
                      {displayChar(ch)}
                    </div>
                    <div style={{ fontSize: 9, fontFamily: s.mono, color: s.text3 }}>{targetIds[i]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <button
              onClick={() => setText('To be, or not to be')}
              style={{
                padding: '8px 16px',
                fontSize: 12,
                fontFamily: s.mono,
                background: s.bg,
                border: `1px solid ${s.purple}`,
                borderRadius: 6,
                color: s.purple,
                cursor: 'pointer',
              }}
            >
              Try a random Shakespeare snippet
            </button>
          </div>

          <div style={{
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 6,
            padding: 14,
          }}>
            <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Summary
            </div>
            <div style={{ display: 'flex', gap: 24, fontFamily: s.mono, fontSize: 12, flexWrap: 'wrap' }}>
              <div><span style={{ color: s.text3 }}>Total characters: </span><span style={{ color: s.text }}>{text.length}</span></div>
              <div><span style={{ color: s.text3 }}>Unique characters: </span><span style={{ color: s.text }}>{new Set(text).size}</span></div>
              <div><span style={{ color: s.text3 }}>Vocabulary size: </span><span style={{ color: s.green }}>65</span></div>
            </div>
          </div>

        </div>
      </div>
    </DemoBoundary>
  )
}
