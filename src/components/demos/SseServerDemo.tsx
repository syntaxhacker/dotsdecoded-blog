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

const codeLines = [
  { num: 1, code: "app.get('/events', (req, res) => {" },
  { num: 2, code: "  res.writeHead(200, {" },
  { num: 3, code: "    'Content-Type': 'text/event-stream'," },
  { num: 4, code: "    'Cache-Control': 'no-cache'," },
  { num: 5, code: "    'Connection': 'keep-alive'" },
  { num: 6, code: "  });" },
  { num: 7, code: "" },
  { num: 8, code: "  res.flushHeaders();" },
  { num: 9, code: "" },
  { num: 10, code: "  const interval = setInterval(() => {" },
  { num: 11, code: "    res.write('data: message\\\\n\\\\n');" },
  { num: 12, code: "  }, 1000);" },
  { num: 13, code: "" },
  { num: 14, code: "  res.on('close', () => {" },
  { num: 15, code: "    clearInterval(interval);" },
  { num: 16, code: "  });" },
  { num: 17, code: "});" },
]

const blockRanges: [number, number][] = [
  [1, 6],
  [8, 8],
  [10, 12],
  [14, 16],
]

const lineToBlock = new Map<number, number>()
blockRanges.forEach(([start, end], blockIdx) => {
  for (let n = start; n <= end; n++) lineToBlock.set(n, blockIdx)
})

const blockLabels = ['Route Handler + Headers', 'Flush Headers', 'Event Loop (setInterval)', 'Cleanup on Disconnect']

const explanations: Record<number, string> = {
  1: "Defines the SSE endpoint. The route handler receives the request (req) and response (res) objects. This is the same Express pattern used for any API route.",
  2: "Sets the HTTP response headers. The Content-Type tells the browser this is an event stream, not regular JSON or HTML. Cache-Control prevents caching, and Connection: keep-alive maintains the TCP connection.",
  3: "The critical header: 'text/event-stream' tells the browser to treat this as Server-Sent Events. Without this, the browser would just treat it as a normal response.",
  4: "Prevents proxies and CDNs from caching the response. SSE is real-time — cached data is stale data.",
  5: "Keeps the TCP connection open. Without keep-alive, the connection would close after the first response.",
  6: "Sends the headers. The semicolon after the closing brace is required because res.writeHead() is a statement.",
  8: "Forces the headers to be sent immediately. Without flushHeaders(), Node.js would buffer the headers until the first write() call. SSE needs headers sent right away so the browser can start processing the stream.",
  10: "Sets up a timer that fires every 1000ms (1 second). This keeps the connection alive and sends events at regular intervals. The interval variable is stored so we can stop it later.",
  11: "Writes a properly formatted SSE event. The format is 'data: ' followed by the payload, ending with double newline. The \\\\n\\\\n signals the end of this event to the browser.",
  12: "Closes the setInterval call. The 1000ms interval means one event per second.",
  14: "Event listener for when the client disconnects. The 'close' event fires when the client closes the connection or navigates away. This lets us clean up properly.",
  15: "Stops the interval timer when the client disconnects. Without this cleanup, the server would keep running intervals for disconnected clients, causing memory leaks.",
  16: "Closes the event listener registration.",
}

export default function SseServerDemo() {
  const [activeLine, setActiveLine] = useState<number | null>(null)

  const activeBlock = activeLine !== null ? (lineToBlock.get(activeLine) ?? null) : null

  const highlighted = useMemo(() => {
    const map: Record<number, string> = {}
    for (const line of codeLines) {
      map[line.num] = Prism.highlight(line.code, Prism.languages.javascript, 'javascript')
    }
    return map
  }, [])

  const getBlockBg = (lineNum: number): string | undefined => {
    if (activeBlock === null) return undefined
    const blockIdx = lineToBlock.get(lineNum)
    if (blockIdx !== activeBlock) return undefined
    const range = blockRanges[blockIdx]
    const isFirst = lineNum === range[0]
    const isLast = lineNum === range[1]
    if (isFirst && isLast) return s.bg3
    return undefined
  }

  const getBlockBorderRadius = (lineNum: number): string => {
    if (activeBlock === null) return '4px'
    const blockIdx = lineToBlock.get(lineNum)
    if (blockIdx !== activeBlock) return '4px'
    const range = blockRanges[blockIdx]
    if (lineNum === range[0] && lineNum === range[1]) return '4px'
    if (lineNum === range[0]) return '4px 4px 0 0'
    if (lineNum === range[1]) return '0 0 4px 4px'
    return '0'
  }

  const getLineNumColor = (lineNum: number): string => {
    if (activeBlock === null) return s.text3
    const blockIdx = lineToBlock.get(lineNum)
    return blockIdx === activeBlock ? s.accent : s.text3
  }

  return (
    <DemoBoundary name="SSE Server Code">
      <div style={{
        maxWidth: 820,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 8,
        overflow: 'hidden',
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
        <div style={{
          display: 'flex',
          backgroundColor: s.bg2,
          minHeight: 480,
        }}>
          <div style={{
            width: 48,
            borderRight: `1px solid ${s.border}`,
            padding: '16px 0',
            backgroundColor: s.bg,
          }}>
            {codeLines.map((line) => (
              <div
                key={line.num}
                style={{
                  padding: '0 12px',
                  textAlign: 'right',
                  fontFamily: s.mono,
                  fontSize: 13,
                  lineHeight: '22px',
                  color: getLineNumColor(line.num),
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
                onClick={() => setActiveLine(line.num)}
              >
                {line.num}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, padding: '16px 20px', overflowX: 'auto' }}>
            {codeLines.map((line) => {
              const inBlock = activeBlock !== null && lineToBlock.get(line.num) === activeBlock
              const range = activeBlock !== null ? blockRanges[activeBlock] : null
              const isFirst = range ? line.num === range[0] : false
              const isLast = range ? line.num === range[1] : false
              const isSingle = isFirst && isLast
              return (
                <div
                  key={line.num}
                  onClick={() => setActiveLine(line.num)}
                  style={{
                    fontFamily: s.mono,
                    fontSize: 13,
                    lineHeight: '22px',
                    padding: '0 8px',
                    margin: '0 -8px',
                    borderRadius: getBlockBorderRadius(line.num),
                    cursor: 'pointer',
                    backgroundColor: inBlock ? s.bg3 : 'transparent',
                    transition: 'background-color 0.15s',
                    borderTop: inBlock && isFirst && !isSingle ? `1px solid ${s.accent}30` : 'none',
                    borderBottom: inBlock && isLast && !isSingle ? `1px solid ${s.accent}30` : 'none',
                    borderLeft: inBlock ? `2px solid ${s.accent}` : 'none',
                    borderRight: inBlock ? `1px solid ${s.accent}30` : 'none',
                  }}
                >
                  <div style={{ margin: 0, whiteSpace: 'pre' }}>
                    {line.code ? <code dangerouslySetInnerHTML={{ __html: highlighted[line.num] }} /> : '\u00A0'}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{
            width: 280,
            borderLeft: `1px solid ${s.border}`,
            padding: 16,
            backgroundColor: s.bg,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: s.text3,
              marginBottom: 12,
            }}>
              Explanation
            </div>
            {activeBlock !== null && (
              <div style={{
                fontFamily: s.mono,
                fontSize: 10,
                color: s.accent,
                background: `${s.accent}15`,
                padding: '4px 8px',
                borderRadius: 4,
                marginBottom: 12,
                display: 'inline-block',
                alignSelf: 'flex-start',
              }}>
                {blockLabels[activeBlock]}
              </div>
            )}
            {activeLine !== null ? (
              <div>
                <div style={{
                  fontFamily: s.mono,
                  fontSize: 11,
                  color: s.text3,
                  marginBottom: 8,
                }}>
                  Line {activeLine}
                </div>
                <div style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: explanations[activeLine] ? s.text : s.text3,
                }}>
                  {explanations[activeLine] || 'No explanation for this line.'}
                </div>
              </div>
            ) : (
              <div style={{
                fontSize: 13,
                color: s.text3,
                fontStyle: 'italic',
              }}>
                Click a line to see its explanation.
              </div>
            )}
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
