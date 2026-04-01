import React, { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface CodeLine {
  id: string
  label: string
  code: string
  explanation: string
}

const codeLines: CodeLine[] = [
  {
    id: 'open',
    label: 'Opening connection',
    code: "const source = new EventSource('/events');",
    explanation: 'Creates an EventSource that connects to /events. The browser automatically maintains a persistent connection and reconnects on disconnect.',
  },
  {
    id: 'onmessage',
    label: 'Default message handler',
    code: "source.onmessage = (event) => {\n  console.log(event.data);\n};",
    explanation: 'Handles messages without a specific event type. The event.data property contains the message body as a string.',
  },
  {
    id: 'addEventListener',
    label: 'Named event handler',
    code: "source.addEventListener('notification', (e) => {\n  const data = JSON.parse(e.data);\n});",
    explanation: 'Listens for events of a specific type. Named events are sent with the event: field in the SSE response.',
  },
  {
    id: 'onerror',
    label: 'Error handling',
    code: "source.onerror = (err) => {\n  console.error('SSE error:', err);\n};",
    explanation: 'Triggered on connection failures. The EventSource automatically attempts to reconnect. Check readyState to determine connection status.',
  },
  {
    id: 'close',
    label: 'Closing connection',
    code: 'source.close();',
    explanation: 'Gracefully terminates the SSE connection. No automatic reconnection will occur after calling close().',
  },
  {
    id: 'readyState',
    label: 'Checking readyState',
    code: 'source.readyState;\n// 0 = CONNECTING\n// 1 = OPEN\n// 2 = CLOSED',
    explanation: 'Returns the connection state: CONNECTING (0) during setup, OPEN (1) when receiving data, or CLOSED (2) after close() or fatal error.',
  },
]

const readyStateColors: Record<number, string> = {
  0: s.yellow,
  1: s.green,
  2: s.red,
}

const readyStateLabels: Record<number, string> = {
  0: 'CONNECTING',
  1: 'OPEN',
  2: 'CLOSED',
}

export default function SseClientDemo() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [simulatedState, setSimulatedState] = useState<number>(1)

  const selected = codeLines.find((line) => line.id === selectedId)
  const highlightedCode = useMemo(
    () => (selected ? Prism.highlight(selected.code, Prism.languages.javascript, 'javascript') : ''),
    [selected]
  )

  return (
    <DemoBoundary name="EventSource Client">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        code .token.keyword { color: #f92672; }
        code .token.string, code .token.char, code .token.builtin, code .token.inserted { color: #e6db74; }
        code .token.number, code .token.constant, code .token.symbol, code .token.property, code .token.tag, code .token.boolean, code .token.deleted { color: #ae81ff; }
        code .token.selector, code .token.attr-name { color: #f92672; }
        code .token.attr-value, code .token.atrule { color: #e6db74; }
        code .token.function, code .token.class-name { color: #a6e22e; }
        code .token.operator, code .token.entity, code .token.url, code .token.punctuation { color: #f8f8f2; }
        code .token.comment, code .token.prolog, code .token.doctype, code .token.cdata { color: #75715e; font-style: italic; }
        code .token.parameter, code .token.variable, code .token.regex, code .token.important { color: #fd971f; }
      `}</style>
      <div
        style={{
          maxWidth: 820,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          backgroundColor: s.bg,
          borderRadius: 12,
          border: `1px solid ${s.border}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${s.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>
              EventSource API
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: readyStateColors[simulatedState],
                  animation: simulatedState === 0 ? 'pulse 1s infinite' : 'none',
                }}
              />
              <span style={{ color: s.text2, fontSize: 12, fontFamily: s.mono }}>
                {readyStateLabels[simulatedState]}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0, 1, 2].map((state) => (
              <button
                key={state}
                onClick={() => setSimulatedState(state)}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  fontFamily: s.mono,
                  backgroundColor: simulatedState === state ? s.bg3 : 'transparent',
                  border: `1px solid ${s.border}`,
                  borderRadius: 4,
                  color: readyStateColors[state],
                  cursor: 'pointer',
                }}
              >
                {readyStateLabels[state]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', padding: 16, gap: 16 }}>
          <div
            style={{
              backgroundColor: s.bg2,
              borderRadius: 8,
              border: `1px solid ${s.border}`,
              overflow: 'hidden',
            }}
          >
            {codeLines.map((line, index) => (
              <button
                key={line.id}
                onClick={() => setSelectedId(selectedId === line.id ? null : line.id)}
                style={{
                  display: 'flex',
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: selectedId === line.id ? s.bg3 : 'transparent',
                  border: 'none',
                  borderBottom: index < codeLines.length - 1 ? `1px solid ${s.border}` : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    color: s.text3,
                    fontFamily: s.mono,
                    fontSize: 13,
                    minWidth: 24,
                    userSelect: 'none',
                  }}
                >
                  {index + 1}
                </span>
                <span style={{ color: s.text2, fontSize: 14 }}>
                  {line.label}
                </span>
              </button>
            ))}
          </div>

          {selected && (
            <div
              style={{
                backgroundColor: s.bg2,
                borderRadius: 8,
                border: `1px solid ${s.border}`,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${s.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: s.accent,
                  }}
                />
                <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>
                  {selected.label}
                </span>
              </div>
              <div style={{ padding: 16 }}>
                <div
                  style={{
                    margin: 0,
                    fontFamily: s.mono,
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: s.text,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                </div>
              </div>
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: `1px solid ${s.border}`,
                  backgroundColor: s.bg,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: s.text2,
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                >
                  {selected.explanation}
                </p>
              </div>
            </div>
          )}

          {!selected && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: s.text3,
                fontSize: 13,
              }}
            >
              Click a line to see the code and explanation
            </div>
          )}
        </div>
      </div>
    </DemoBoundary>
  )
}
