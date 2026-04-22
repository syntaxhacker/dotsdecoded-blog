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

const words = [
  { text: 'I', vec: [1.0, 0.0, 1.0, 0.0] },
  { text: 'love', vec: [0.0, 1.0, 0.0, 1.0] },
  { text: 'AI', vec: [1.0, 1.0, 0.0, 0.0] },
]

const dimLabels = ['d1', 'd2', 'd3', 'd4']

function EmbeddingExplorerDemo() {
  const [selectedWord, setSelectedWord] = useState<number | null>(null)

  const handleNext = () => {
    if (selectedWord === null) {
      setSelectedWord(0)
    } else {
      setSelectedWord((selectedWord + 1) % words.length)
    }
  }

  const currentVec = selectedWord !== null ? words[selectedWord].vec : null

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div style={{ padding: '20px 24px 24px', background: s.bg, borderRadius: 12, border: `1px solid ${s.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, flex: 1 }}>
            {words.map((w, i) => (
              <button
                key={w.text}
                onClick={() => setSelectedWord(selectedWord === i ? null : i)}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  background: selectedWord === i ? s.bg3 : s.bg2,
                  border: selectedWord === i ? `2px solid ${s.accent}` : `1px solid ${s.border}`,
                  borderRadius: 8,
                  color: selectedWord === i ? s.accent : s.text,
                  fontSize: 18,
                  fontFamily: s.mono,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.4s ease',
                  outline: 'none',
                }}
              >
                {w.text}
              </button>
            ))}
          </div>
          <button
            onClick={handleNext}
            style={{
              padding: '10px 20px',
              background: s.accent,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              flexShrink: 0,
            }}
          >
            Next
          </button>
        </div>

        {selectedWord === null && (
          <div style={{
            textAlign: 'center',
            padding: '32px 0',
            color: s.text3,
            fontSize: 14,
            transition: 'all 0.4s ease',
          }}>
            Click a word to explore its embedding vector
          </div>
        )}

        {currentVec !== null && (
          <div style={{
            padding: '20px',
            background: s.bg2,
            borderRadius: 8,
            border: `1px solid ${s.border}`,
            transition: 'all 0.4s ease',
          }}>
            <div style={{
              fontSize: 12,
              color: s.text3,
              marginBottom: 16,
              fontFamily: s.mono,
              letterSpacing: 0.5,
            }}>
              Embedding vector (d=4)
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {currentVec.map((val, di) => (
                <div key={dimLabels[di]} style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 6,
                  }}>
                    <span style={{
                      fontSize: 11,
                      color: s.text3,
                      fontFamily: s.mono,
                    }}>
                      {dimLabels[di]}
                    </span>
                    <span style={{
                      fontSize: 13,
                      color: val > 0 ? s.accent : s.text3,
                      fontFamily: s.mono,
                      fontWeight: 600,
                      transition: 'color 0.4s ease',
                    }}>
                      {val.toFixed(1)}
                    </span>
                  </div>
                  <div style={{
                    height: 28,
                    background: s.bg3,
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${val * 100}%`,
                      background: val > 0
                        ? `linear-gradient(90deg, ${s.accent}cc, ${s.accent})`
                        : s.bg3,
                      borderRadius: 4,
                      transition: 'width 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), background 0.4s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 14,
              padding: '10px 14px',
              background: s.bg,
              borderRadius: 6,
              border: `1px solid ${s.border}`,
              fontFamily: s.mono,
              fontSize: 13,
              color: s.text2,
              textAlign: 'center',
              transition: 'all 0.4s ease',
            }}>
              [{currentVec.map(v => v.toFixed(1)).join(', ')}]
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function EmbeddingExplorerDemoWrapper() {
  return (
    <DemoBoundary name="Embedding Explorer">
      <EmbeddingExplorerDemo />
    </DemoBoundary>
  )
}
