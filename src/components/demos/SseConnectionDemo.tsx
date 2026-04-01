import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
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

const codeLines = [
  { num: 1, code: "const source = new EventSource('/events');" },
  { num: 2, code: "" },
  { num: 3, code: "source.onmessage = (event) => {" },
  { num: 4, code: "  console.log('Received:', event.data);" },
  { num: 5, code: "};" },
]

const highlightedLines = codeLines.map((line) =>
  line.code
    ? Prism.highlight(line.code, Prism.languages.javascript, 'javascript')
    : ''
)

const steps = [
  {
    line: 1,
    state: 'connecting',
    label: 'Creating EventSource',
    detail: "new EventSource('/events')",
    request: null,
    response: null,
    eventData: null,
    handler: false,
  },
  {
    line: null,
    state: 'connecting',
    label: 'Opening HTTP Connection',
    detail: 'GET /events HTTP/1.1\nAccept: text/event-stream',
    request: true,
    response: null,
    eventData: null,
    handler: false,
  },
  {
    line: null,
    state: 'connecting',
    label: 'Server Responds',
    detail: 'HTTP/1.1 200 OK\nContent-Type: text/event-stream',
    request: null,
    response: true,
    eventData: null,
    handler: false,
  },
  {
    line: null,
    state: 'open',
    label: 'Connection Open',
    detail: 'Persistent connection established',
    request: null,
    response: null,
    eventData: null,
    handler: false,
  },
  {
    line: null,
    state: 'receiving',
    label: 'Event Arrives',
    detail: 'data: {"price": 142.50}',
    request: null,
    response: null,
    eventData: { price: 142.50, symbol: 'AAPL', time: '10:32:15' },
    handler: false,
  },
  {
    line: 3,
    state: 'handling',
    label: 'onmessage Handler',
    detail: 'Handler executed with event.data',
    request: null,
    response: null,
    eventData: { price: 142.50, symbol: 'AAPL', time: '10:32:15' },
    handler: true,
  },
]

export default function SseConnectionDemo() {
  const [currentStep, setCurrentStep] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSequence = useCallback(() => {
    setIsRunning(true)
    setCurrentStep(0)
    setFinished(false)

    steps.forEach((_, index) => {
      timeoutRef.current = setTimeout(() => {
        setCurrentStep(index)
        if (index === steps.length - 1) {
          setIsRunning(false)
          setFinished(true)
        }
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      }, (index + 1) * 1200)
    })
  }, [])

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setCurrentStep(-1)
    setIsRunning(false)
    setFinished(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const step = currentStep >= 0 ? steps[currentStep] : null

  return (
    <DemoBoundary name="EventSource Connection">
      <div style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 8,
        padding: 24,
        maxWidth: 820,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: s.text,
      }}>
        <style>{`
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
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 360px', minWidth: 300 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: s.text3,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              JavaScript Code
            </div>
            <div style={{
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
              padding: 16,
              fontFamily: s.mono,
              fontSize: 13,
              lineHeight: 1.6,
              overflowX: 'auto',
            }}>
              {codeLines.map((line, idx) => {
                const isHighlighted = step?.line === line.num
                const isPastHighlight = step && step.line !== null && line.num < step.line
                return (
                  <div
                    key={line.num}
                    style={{
                      display: 'flex',
                      background: isHighlighted ? `${s.accent}22` : 'transparent',
                      borderLeft: isHighlighted ? `2px solid ${s.accent}` : '2px solid transparent',
                      marginLeft: -2,
                      paddingLeft: 14,
                      paddingRight: 14,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{
                      color: s.text3,
                      width: 24,
                      userSelect: 'none',
                      flexShrink: 0,
                    }}>
                      {line.num}
                    </span>
                    <span style={{
                      color: isPastHighlight ? s.text2 : isHighlighted ? s.accent : s.text,
                      transition: 'color 0.2s ease',
                    }}>
                      {highlightedLines[idx] ? (
                        <code dangerouslySetInnerHTML={{ __html: highlightedLines[idx] }} />
                      ) : '\u00A0'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ flex: '1 1 280px', minWidth: 280 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: s.text3,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Connection State
            </div>
            <div style={{
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
              padding: 16,
              fontFamily: s.mono,
              fontSize: 13,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 16,
              }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: currentStep < 0 ? s.text3 :
                    step?.state === 'open' || step?.state === 'receiving' || step?.state === 'handling' ? s.green :
                    step?.state === 'connecting' ? s.yellow : s.text3,
                  boxShadow: currentStep >= 0 && (step?.state === 'open' || step?.state === 'receiving' || step?.state === 'handling')
                    ? `0 0 8px ${s.green}80`
                    : 'none',
                  transition: 'all 0.3s ease',
                }} />
                <span style={{
                  color: currentStep < 0 ? s.text3 :
                    step?.state === 'open' || step?.state === 'receiving' || step?.state === 'handling' ? s.green : s.yellow,
                  fontWeight: 600,
                }}>
                  {currentStep < 0 ? 'Idle' :
                    step?.state === 'connecting' ? 'Connecting...' :
                    step?.state === 'open' ? 'Open' :
                    step?.state === 'receiving' ? 'Receiving' :
                    step?.state === 'handling' ? 'Handling' : 'Idle'}
                </span>
              </div>

              {step && (
                <div style={{
                  background: s.bg3,
                  borderRadius: 4,
                  padding: '10px 12px',
                  marginBottom: 12,
                }}>
                  <div style={{ color: s.accent, fontWeight: 600, marginBottom: 4 }}>
                    {step.label}
                  </div>
                  <div style={{
                    color: s.text2,
                    fontSize: 11,
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-all',
                  }}>
                    {step.detail}
                  </div>
                </div>
              )}

              {step?.request && (
                <div style={{
                  border: `1px solid ${s.border}`,
                  borderRadius: 4,
                  padding: 10,
                  marginBottom: 12,
                  animation: 'fadeSlideIn 0.3s ease',
                }}>
                  <div style={{ color: s.orange, fontSize: 10, marginBottom: 4, fontWeight: 600 }}>
                    REQUEST
                  </div>
                  <div style={{ color: s.text2, fontSize: 11 }}>
                    GET /events HTTP/1.1
                  </div>
                  <div style={{ color: s.text3, fontSize: 11 }}>
                    Accept: text/event-stream
                  </div>
                </div>
              )}

              {step?.response && (
                <div style={{
                  border: `1px solid ${s.green}40`,
                  borderRadius: 4,
                  padding: 10,
                  marginBottom: 12,
                  animation: 'fadeSlideIn 0.3s ease',
                }}>
                  <div style={{ color: s.green, fontSize: 10, marginBottom: 4, fontWeight: 600 }}>
                    RESPONSE
                  </div>
                  <div style={{ color: s.green, fontSize: 11 }}>
                    HTTP/1.1 200 OK
                  </div>
                  <div style={{ color: s.text3, fontSize: 11 }}>
                    Content-Type: text/event-stream
                  </div>
                </div>
              )}

              {step?.eventData && (
                <div style={{
                  border: `1px solid ${s.accent}40`,
                  borderRadius: 4,
                  padding: 10,
                  marginBottom: 12,
                  animation: 'fadeSlideIn 0.3s ease',
                }}>
                  <div style={{ color: s.accent, fontSize: 10, marginBottom: 4, fontWeight: 600 }}>
                    SSE EVENT
                  </div>
                  <div style={{ color: s.text2, fontSize: 11, fontFamily: s.mono }}>
                    data: {JSON.stringify(step.eventData)}
                  </div>
                </div>
              )}

              {step?.handler && (
                <div style={{
                  background: `${s.green}15`,
                  border: `1px solid ${s.green}40`,
                  borderRadius: 4,
                  padding: 10,
                  animation: 'fadeSlideIn 0.3s ease',
                }}>
                  <div style={{ color: s.green, fontSize: 10, marginBottom: 4, fontWeight: 600 }}>
                    HANDLER FIRED
                  </div>
                  <div style={{ color: s.text2, fontSize: 11 }}>
                    onmessage called with event.data
                  </div>
                </div>
              )}

              {!step && (
                <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                  Click Connect to start the sequence
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 20,
          justifyContent: 'center',
        }}>
          <button
            onClick={runSequence}
            disabled={isRunning}
            style={{
              background: isRunning ? s.bg3 : s.accent,
              color: isRunning ? s.text3 : s.bg,
              border: 'none',
              borderRadius: 6,
              padding: '10px 24px',
              fontSize: 13,
              fontWeight: 600,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "inherit",
            }}
          >
            {finished ? 'Replay' : isRunning ? 'Connecting...' : 'Connect'}
          </button>
          {(finished || currentStep > 0) && !isRunning && (
            <button
              onClick={reset}
              style={{
                background: 'transparent',
                color: s.text2,
                border: `1px solid ${s.border}`,
                borderRadius: 6,
                padding: '10px 24px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "inherit",
              }}
            >
              Reset
            </button>
          )}
        </div>

        <style>{`
          @keyframes fadeSlideIn {
            from {
              opacity: 0;
              transform: translateX(-8px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    </DemoBoundary>
  )
}
