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

type ErrorType = 'connection' | 'cors' | 'timeout' | null

interface ErrorCardProps {
  type: 'connection' | 'cors' | 'timeout'
  title: string
  headerColor: string
  headerBg: string
  icon: string
  isActive: boolean
  onClick: () => void
  children?: React.ReactNode
}

function ErrorCard({ type, title, headerColor, headerBg, icon, isActive, onClick, children }: ErrorCardProps) {
  return (
    <div style={{
      border: `1px solid ${isActive ? s.accent : s.border}`,
      borderRadius: 8,
      overflow: 'hidden',
      background: s.bg2,
      transition: 'border-color 0.2s',
      cursor: 'pointer',
    }} onClick={onClick}>
      <div style={{
        background: headerBg,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: `1px solid ${s.border}`,
      }}>
        <span style={{
          background: headerColor,
          color: s.bg,
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {icon}
        </span>
        <span style={{ color: s.text, fontWeight: 600, fontSize: 14 }}>{title}</span>
      </div>
      {isActive && (
        <div style={{ padding: 16 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function ConsoleOutput({ lines }: { lines: string[] }) {
  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 6,
      padding: 12,
      fontFamily: s.mono,
      fontSize: 12,
      maxHeight: 120,
      overflowY: 'auto',
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{
          color: line.includes('ERROR') ? s.red :
                 line.includes('WARN') ? s.yellow :
                 line.includes('RETRY') ? s.accent : s.text2,
          marginBottom: i < lines.length - 1 ? 4 : 0,
        }}>
          {line}
        </div>
      ))}
    </div>
  )
}

function CodeSnippet({ code }: { code: string }) {
  const highlightedHtml = useMemo(() => Prism.highlight(code, Prism.languages.javascript, 'javascript'), [code])
  return (
      <div style={{ position: 'relative' }}>
      <div style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 6,
        padding: 12,
        fontFamily: s.mono,
        fontSize: 11,
        overflowX: 'auto',
        margin: 0,
      }}>
        <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </div>
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
    </div>
  )
}

function RecoveryBadge({ delay }: { delay: string }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: `${s.green}20`,
      border: `1px solid ${s.green}40`,
      borderRadius: 4,
      padding: '4px 10px',
      marginTop: 12,
    }}>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: s.green,
      }} />
      <span style={{ color: s.green, fontSize: 12, fontWeight: 500 }}>
        Auto-reconnect in {delay}
      </span>
    </div>
  )
}

const errorData = {
  connection: {
    title: 'Connection Refused',
    headerColor: s.red,
    headerBg: `${s.red}15`,
    icon: 'ERR',
    consoleLines: [
      '[SSE] Connecting to EventSource...',
      '[SSE] Connection failed: ERR_CONNECTION_REFUSED',
      '[SSE] Error event fired',
      `[SSE] Scheduling reconnect in 3s...`,
      '[SSE] Attempting reconnect (attempt 2)...',
    ],
    code: `const es = new EventSource('/api/events');

es.onerror = (err) => {
  console.error('SSE Error:', err);
  es.readyState === EventSource.CLOSED;
};`,
    recovery: '3s',
    description: 'Server is not running or port is blocked. The browser fires onerror and EventSource automatically attempts reconnection with exponential backoff.',
  },
  cors: {
    title: 'CORS Error',
    headerColor: s.yellow,
    headerBg: `${s.yellow}15`,
    icon: 'CORS',
    consoleLines: [
      '[SSE] Connecting to EventSource...',
      '[SSE] Cross-origin request blocked',
      '[SSE] Error: Access-Control-Allow-Origin',
      '[SSE] Connection failed - CORS policy',
      '[SSE] Will NOT auto-reconnect (CORS)',
    ],
    code: `// Server must send:
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Accept

// Or for credentials:
Access-Control-Allow-Origin: https://your-site.com
Access-Control-Allow-Credentials: true`,
    recovery: 'Manual',
    description: 'Cross-origin request blocked by browser security policy. Server must include proper CORS headers. EventSource will NOT retry after CORS errors.',
  },
  timeout: {
    title: 'Server Timeout',
    headerColor: s.orange,
    headerBg: `${s.orange}15`,
    icon: 'TIMEOUT',
    consoleLines: [
      '[SSE] Connection established',
      '[SSE] Receiving events...',
      '[SSE] No activity for 45s...',
      '[SSE] Server closed connection',
      '[SSE] EventSource closed by server',
      '[SSE] Reconnecting in 2s...',
    ],
    code: `// Server closes connection after timeout
// Nginx default: 60s
// Node.js default: free

// Handle cleanup:
es.onclose = () => {
  console.log('Connection closed');
  cleanupResources();
};

// Note: Most servers send a "heartbeat"
// event to keep connection alive`,
    recovery: '2s',
    description: 'Server closed the connection due to inactivity. Many proxies and servers have connection timeouts. Automatic reconnection occurs after server closes.',
  },
}

export default function SseErrorDemo() {
  const [activeError, setActiveError] = useState<ErrorType>('connection')
  const [reconnectCount, setReconnectCount] = useState(0)

  const handleCardClick = (type: ErrorType) => {
    setActiveError(type)
    setReconnectCount(0)
  }

  const handleReconnect = () => {
    setReconnectCount(c => c + 1)
  }

  const currentData = activeError ? errorData[activeError] : null

  return (
    <DemoBoundary name="Error Handling">
      <div style={{
        maxWidth: 820,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ color: s.text, margin: '0 0 8px 0', fontSize: 16, fontWeight: 600 }}>
            Error Scenarios
          </h3>
          <p style={{ color: s.text2, margin: 0, fontSize: 13, lineHeight: 1.5 }}>
            Click each card to explore common SSE failure modes and how to handle them gracefully.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
          {(Object.keys(errorData) as Array<'connection' | 'cors' | 'timeout'>).map((type) => {
            const data = errorData[type]
            return (
              <ErrorCard
                key={type}
                type={type}
                title={data.title}
                headerColor={data.headerColor}
                headerBg={data.headerBg}
                icon={data.icon}
                isActive={activeError === type}
                onClick={() => handleCardClick(type)}
              />
            )
          })}
        </div>

        {currentData && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}>
                <span style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: s.red,
                }} />
                <span style={{ color: s.text, fontWeight: 600, fontSize: 13 }}>
                  Error Condition
                </span>
              </div>
              <p style={{ color: s.text2, margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                {currentData.description}
              </p>
            </div>

            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}>
                <span style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: s.yellow,
                }} />
                <span style={{ color: s.text, fontWeight: 600, fontSize: 13 }}>
                  Browser Console
                </span>
              </div>
              <ConsoleOutput lines={currentData.consoleLines} />
            </div>

            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}>
                <span style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: s.accent,
                }} />
                <span style={{ color: s.text, fontWeight: 600, fontSize: 13 }}>
                  Handling Code
                </span>
              </div>
              <CodeSnippet code={currentData.code} />
            </div>

            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}>
                <span style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: s.green,
                }} />
                <span style={{ color: s.text, fontWeight: 600, fontSize: 13 }}>
                  Recovery Mechanism
                </span>
              </div>
              <RecoveryBadge delay={currentData.recovery} />
              {reconnectCount > 0 && (
                <div style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  background: s.bg3,
                  borderRadius: 6,
                  color: s.text2,
                  fontSize: 12,
                }}>
                  Reconnection attempts: <span style={{ color: s.accent, fontWeight: 600 }}>{reconnectCount}</span>
                  <button
                    onClick={handleReconnect}
                    style={{
                      marginLeft: 12,
                      padding: '4px 10px',
                      background: s.accent,
                      color: s.bg,
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Simulate Reconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
