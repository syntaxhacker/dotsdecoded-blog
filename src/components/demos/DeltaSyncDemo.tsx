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

const originalLines = [
  'import React from "react"',
  'import { render } from "react-dom"',
  '',
  'function App() {',
  '  return <div>Hello World</div>',
  '}',
  '',
  'render(<App />, document.getElementById("root"))',
]

const editedLines = [
  'import React, { useState } from "react"',
  'import { render } from "react-dom"',
  '',
  'function App() {',
  '  const [count, setCount] = useState(0)',
  '  return <div>Hello World</div>',
  '}',
  '',
  'render(<App />, document.getElementById("root"))',
]

const chunkSizeBytes = 40
const totalBytes = originalLines.join('\n').length

function getChunks(text: string): string[] {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += chunkSizeBytes) {
    chunks.push(text.slice(i, i + chunkSizeBytes))
  }
  return chunks
}

const origChunks = getChunks(originalLines.join('\n'))
const editChunks = getChunks(editedLines.join('\n'))

const changedChunks = origChunks.map((ch, i) => ch !== editChunks[i])

export default function DeltaSyncDemo() {
  const [showDelta, setShowDelta] = useState(false)

  return (
    <DemoBoundary name="Delta Sync">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
        Delta Sync
      </div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        A small edit changes only a few chunks. Delta sync uploads only the modified chunks instead of the entire file.
      </p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: s.text3, fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Original File
          </div>
          <div style={{
            background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: 12, fontFamily: s.mono, fontSize: 12, lineHeight: 1.6, color: s.text, whiteSpace: 'pre',
          }}>
            {originalLines.join('\n')}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: s.text3, fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Edited File
          </div>
          <div style={{
            background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: 12, fontFamily: s.mono, fontSize: 12, lineHeight: 1.6, color: s.text, whiteSpace: 'pre',
          }}>
            {showDelta ? (
              editedLines.map((line, i) => {
                const isChanged = line !== originalLines[i]
                return (
                  <span key={i} style={{ background: isChanged ? `${s.green}25` : 'transparent', borderRadius: 2 }}>
                    {line}
                    {'\n'}
                  </span>
                )
              })
            ) : (
              editedLines.join('\n')
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ color: s.text3, fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Chunks (changed = green, unchanged = grey)
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {origChunks.map((_, i) => (
            <div key={i} style={{
              padding: '4px 8px', borderRadius: 4, fontSize: 10,
              fontFamily: s.mono, background: changedChunks[i] ? `${s.green}20` : s.bg3,
              border: `1px solid ${changedChunks[i] ? s.green : s.border}`,
              color: changedChunks[i] ? s.green : s.text3,
              transition: 'all 0.3s',
            }}>
              #{i + 1} {changedChunks[i] ? 'CHANGED' : 'SAME'}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12,
        padding: 16, marginBottom: 16,
      }}>
        <div style={{ color: s.text3, fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          Delta Sync Calculation
        </div>
        <div style={{ fontFamily: s.mono, fontSize: 12, color: s.text2, lineHeight: 1.8 }}>
          <div>Total chunks: {origChunks.length}</div>
          <div>Changed chunks: <span style={{ color: s.green }}>{changedChunks.filter(Boolean).length}</span></div>
          <div>Unchanged chunks (skip): <span style={{ color: s.text3 }}>{changedChunks.filter(c => !c).length}</span></div>
          <div style={{ borderTop: `1px solid ${s.border}`, marginTop: 4, paddingTop: 4 }}>
            Data to upload: <span style={{ color: s.green }}>{changedChunks.filter(Boolean).length * chunkSizeBytes} bytes</span>
            <span style={{ color: s.text3 }}> (instead of {totalBytes} bytes)</span>
          </div>
          <div style={{ color: s.yellow, marginTop: 4 }}>
            Savings: {Math.round((1 - (changedChunks.filter(Boolean).length * chunkSizeBytes) / totalBytes) * 100)}% less data transferred
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowDelta(!showDelta)}
        style={{
          background: showDelta ? s.bg3 : s.accent,
          border: showDelta ? `1px solid ${s.border}` : 'none',
          borderRadius: 8, padding: '10px 24px',
          color: showDelta ? s.text2 : '#fff',
          cursor: 'pointer', fontSize: 13, fontWeight: 600,
          width: '100%',
        }}
      >
        {showDelta ? 'Hide Changes' : 'Highlight Changes'}
      </button>
    </div>
    </DemoBoundary>
  )
}
