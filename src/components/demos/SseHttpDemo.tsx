import React, { useState } from 'react'
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

interface HeaderLine {
  label: string
  value: string
  highlight?: 'request' | 'response' | 'diff' | 'key'
  tooltip?: string
}

const regularHttpRequest: HeaderLine[] = [
  { label: 'GET', value: '/api/data HTTP/1.1', highlight: 'request' },
  { label: 'Host:', value: 'example.com', highlight: 'request' },
  { label: 'Accept:', value: 'application/json', highlight: 'request' },
]

const regularHttpResponse: HeaderLine[] = [
  { label: 'HTTP/1.1', value: '200 OK', highlight: 'response' },
  { label: 'Content-Type:', value: 'application/json', highlight: 'key', tooltip: 'JSON format - client expects structured data' },
  { label: 'Content-Length:', value: '8472', highlight: 'key', tooltip: 'Fixed size - response has known length' },
  { label: 'Connection:', value: 'close', highlight: 'key', tooltip: 'Connection closes after response - no persistence' },
  { label: 'Cache-Control:', value: 'no-cache', highlight: 'response' },
]

const sseRequest: HeaderLine[] = [
  { label: 'GET', value: '/events HTTP/1.1', highlight: 'request' },
  { label: 'Host:', value: 'example.com', highlight: 'request' },
  { label: 'Accept:', value: 'text/event-stream', highlight: 'key', tooltip: 'SSE MIME type - tells server this is an events stream' },
]

const sseResponse: HeaderLine[] = [
  { label: 'HTTP/1.1', value: '200 OK', highlight: 'response' },
  { label: 'Content-Type:', value: 'text/event-stream', highlight: 'key', tooltip: 'SSE stream - continuous event format' },
  { label: 'Transfer-Encoding:', value: 'chunked', highlight: 'key', tooltip: 'Dynamic chunks - no Content-Length needed' },
  { label: 'Connection:', value: 'keep-alive', highlight: 'key', tooltip: 'Persistent connection - stays open for events' },
  { label: 'Cache-Control:', value: 'no-cache', highlight: 'response' },
  { label: 'X-Accel-Buffering:', value: 'no', highlight: 'key', tooltip: 'Disables nginx buffering for real-time events' },
]

function HeaderPanel({
  title,
  headers,
  type,
  visible
}: {
  title: string
  headers: HeaderLine[]
  type: 'request' | 'response'
  visible: boolean
}) {
  const borderColor = type === 'request' ? s.accent : s.green
  const typeColor = type === 'request' ? s.accent : s.green

  return (
    <div
      style={{
        background: s.bg2,
        borderRadius: 8,
        border: `1px solid ${s.border}`,
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.4s ease-out',
      }}
    >
      <div
        style={{
          background: s.bg3,
          padding: '10px 14px',
          borderBottom: `1px solid ${s.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            color: typeColor,
            fontFamily: s.mono,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {type}
        </span>
        <span
          style={{
            color: s.text2,
            fontFamily: s.mono,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ padding: '12px 14px' }}>
        {headers.map((header, i) => (
          <div
            key={i}
            style={{
              fontFamily: s.mono,
              fontSize: 12,
              lineHeight: 1.7,
              display: 'flex',
              gap: 8,
              cursor: header.tooltip ? 'help' : 'default',
              position: 'relative',
            }}
          >
            <span
              style={{
                color: s.text3,
                minWidth: 140,
              }}
            >
              {header.label}
            </span>
            <span
              style={{
                color: header.highlight === 'key' ? s.yellow : s.text,
                fontWeight: header.highlight === 'key' ? 600 : 400,
              }}
            >
              {header.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DifferenceTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)

  return (
    <div style={{ position: 'relative', display: 'inline' }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          background: s.yellow,
          color: s.bg,
          padding: '1px 4px',
          borderRadius: 3,
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        !
      </span>
      {show && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: s.text,
            color: s.bg,
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 11,
            fontFamily: 'sans-serif',
            fontWeight: 400,
            whiteSpace: 'nowrap',
            zIndex: 100,
            marginBottom: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {text}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              border: '6px solid transparent',
              borderTopColor: s.text,
            }}
          />
        </div>
      )}
    </div>
  )
}

function DifferencesPanel({ visible }: { visible: boolean }) {
  const differences = [
    { regular: 'Content-Length: 8472', sse: 'Transfer-Encoding: chunked', desc: 'Fixed size vs dynamic chunks' },
    { regular: 'Connection: close', sse: 'Connection: keep-alive', desc: 'One-shot vs persistent' },
    { regular: 'Content-Type: application/json', sse: 'Content-Type: text/event-stream', desc: 'Data format vs stream format' },
  ]

  return (
    <div
      style={{
        background: s.bg2,
        borderRadius: 8,
        border: `1px solid ${s.border}`,
        padding: '16px 14px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.4s ease-out 0.2s',
      }}
    >
      <div
        style={{
          color: s.purple,
          fontFamily: 'sans-serif',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: 12,
        }}
      >
        Key Differences
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {differences.map((diff, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              fontFamily: s.mono,
              fontSize: 11,
            }}
          >
            <div style={{ color: s.text3 }}>
              <span style={{ color: s.orange }}>-</span> {diff.regular}
            </div>
            <div style={{ color: s.text3 }}>
              <span style={{ color: s.green }}>+</span> {diff.sse}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SseHttpDemo() {
  const [show, setShow] = useState(false)

  return (
    <DemoBoundary name="HTTP Headers">
      <div
        style={{
          maxWidth: 820,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            background: s.bg2,
            borderRadius: 8,
            border: `1px solid ${s.border}`,
            padding: '16px 20px',
            marginBottom: 16,
          }}
        >
          <p style={{ color: s.text2, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            SSE reuses HTTP for streaming, but changes how the response is delivered.
            Compare the headers below to see the mechanical differences.
          </p>
          <button
            onClick={() => setShow(!show)}
            style={{
              marginTop: 14,
              background: show ? s.bg3 : s.accent,
              color: s.text,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
              padding: '8px 16px',
              fontFamily: 'sans-serif',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {show ? 'Reset' : 'Compare'}
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                color: s.orange,
                fontFamily: 'sans-serif',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 10,
              }}
            >
              Regular HTTP
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <HeaderPanel
                title="Request"
                headers={regularHttpRequest}
                type="request"
                visible={show}
              />
              <HeaderPanel
                title="Response"
                headers={regularHttpResponse}
                type="response"
                visible={show}
              />
            </div>
          </div>

          <div>
            <div
              style={{
                color: s.green,
                fontFamily: 'sans-serif',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 10,
              }}
            >
              Server-Sent Events
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <HeaderPanel
                title="Request"
                headers={sseRequest}
                type="request"
                visible={show}
              />
              <HeaderPanel
                title="Response"
                headers={sseResponse}
                type="response"
                visible={show}
              />
            </div>
          </div>
        </div>

        <DifferencesPanel visible={show} />

        {show && (
          <div
            style={{
              marginTop: 16,
              padding: '14px 16px',
              background: s.bg3,
              borderRadius: 8,
              border: `1px solid ${s.border}`,
              opacity: 1,
              transition: 'opacity 0.4s ease-out 0.3s',
            }}
          >
            <div
              style={{
                color: s.accent,
                fontFamily: 'sans-serif',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 8,
              }}
            >
              Why These Differences Matter
            </div>
            <div
              style={{
                color: s.text2,
                fontFamily: 'sans-serif',
                fontSize: 12,
                lineHeight: 1.7,
              }}
            >
              <p style={{ margin: '0 0 10px 0' }}>
                <span style={{ color: s.yellow }}>chunked</span> means the server sends data in pieces as it becomes available, without a predetermined size. This is essential for real-time events where you cannot know the total length upfront.
              </p>
              <p style={{ margin: '0 0 10px 0' }}>
                <span style={{ color: s.yellow }}>keep-alive</span> means the TCP connection stays open after the response, allowing the server to push multiple events over time without re-establishing connection overhead.
              </p>
              <p style={{ margin: 0 }}>
                <span style={{ color: s.yellow }}>X-Accel-Buffering: no</span> tells proxies not to buffer the response, ensuring events flow through to the client immediately as they are sent.
              </p>
            </div>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
