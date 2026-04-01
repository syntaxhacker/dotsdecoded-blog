import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface SseEvent {
  type: 'event' | 'comment' | 'keepalive'
  raw: string[]
  parsed?: {
    event?: string
    data: string
    id?: string
  }
}

const EVENTS: SseEvent[] = [
  {
    type: 'event',
    raw: ['data: Hello from the server', ''],
    parsed: { data: 'Hello from the server' },
  },
  {
    type: 'event',
    raw: ['event: notification', 'data: New message from Alice', ''],
    parsed: { event: 'notification', data: 'New message from Alice' },
  },
  {
    type: 'event',
    raw: ['event: notification', 'data: New message from Bob', 'id: msg-42', ''],
    parsed: { event: 'notification', data: 'New message from Bob', id: 'msg-42' },
  },
  {
    type: 'event',
    raw: ['event: update', 'data: Status: online', 'data: Users: 1,024', ''],
    parsed: { event: 'update', data: 'Status: online\nUsers: 1,024' },
  },
  {
    type: 'keepalive',
    raw: [': keepalive', ''],
  },
  {
    type: 'event',
    raw: ['event: error', 'data: Connection unstable', ''],
    parsed: { event: 'error', data: 'Connection unstable' },
  },
  {
    type: 'event',
    raw: ['data: Stream complete', ''],
    parsed: { data: 'Stream complete' },
  },
]

function SseStreamDemo() {
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [currentEventIdx, setCurrentEventIdx] = useState(-1)
  const [typedLines, setTypedLines] = useState<string[]>([])
  const [visibleChars, setVisibleChars] = useState(0)
  const [parsedEvents, setParsedEvents] = useState<SseEvent[]>([])

  const rawPanelRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentEvent = currentEventIdx >= 0 && currentEventIdx < EVENTS.length ? EVENTS[currentEventIdx] : null

  const fullRawText = useMemo(() => {
    if (!currentEvent) return ''
    return currentEvent.raw.join('\n')
  }, [currentEvent])

  useEffect(() => {
    if (rawPanelRef.current) {
      rawPanelRef.current.scrollTop = rawPanelRef.current.scrollHeight
    }
  }, [typedLines, visibleChars])

  const typeNextChar = useCallback(() => {
    if (!currentEvent) return

    if (visibleChars < fullRawText.length) {
      setVisibleChars(prev => prev + 1)
      const delay = getStepDelay(20, speed)
      timeoutRef.current = setTimeout(typeNextChar, delay)
    } else {
      setTypedLines(prev => [...prev, fullRawText])
      setVisibleChars(0)

      if (currentEvent.parsed) {
        setParsedEvents(prev => [...prev, currentEvent])
      }

      const nextIdx = currentEventIdx + 1
      if (nextIdx < EVENTS.length) {
        const pause = getStepDelay(600, speed)
        timeoutRef.current = setTimeout(() => {
          setCurrentEventIdx(nextIdx)
        }, pause)
      } else {
        setDone(true)
        setRunning(false)
      }
    }
  }, [currentEvent, fullRawText, visibleChars, currentEventIdx, speed])

  useEffect(() => {
    if (currentEvent && visibleChars === 0 && fullRawText.length > 0) {
      const delay = getStepDelay(30, speed)
      timeoutRef.current = setTimeout(typeNextChar, delay)
    }
  }, [currentEvent, fullRawText, typeNextChar, visibleChars, speed])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const start = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setCurrentEventIdx(0)
    setTypedLines([])
    setVisibleChars(0)
    setParsedEvents([])
    setDone(false)
    setRunning(true)
  }

  const reset = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setCurrentEventIdx(-1)
    setTypedLines([])
    setVisibleChars(0)
    setParsedEvents([])
    setDone(false)
    setRunning(false)
  }

  const completedRawLines = [...typedLines]
  if (currentEvent && visibleChars > 0) {
    completedRawLines.push(fullRawText.slice(0, visibleChars))
  }
  const rawDisplay = completedRawLines.join('\n')

  const renderRawLine = (line: string, i: number) => {
    if (line.startsWith(': ')) {
      return (
        <span key={i}>
          <span style={{ color: s.text3 }}>{line}</span>
          {'\n'}
        </span>
      )
    }
    const colonIdx = line.indexOf(':')
    if (colonIdx > 0) {
      const field = line.slice(0, colonIdx + 1)
      const value = line.slice(colonIdx + 1)
      return (
        <span key={i}>
          <span style={{ color: s.accent }}>{field}</span>
          <span style={{ color: s.green }}>{value}</span>
          {'\n'}
        </span>
      )
    }
    if (line === '') {
      return <span key={i}>{'\n'}</span>
    }
    return (
      <span key={i}>
        <span style={{ color: s.text }}>{line}</span>
        {'\n'}
      </span>
    )
  }

  const lines = rawDisplay.split('\n')

  const eventColor = (type?: string) => {
    if (!type) return s.accent
    if (type === 'notification') return s.green
    if (type === 'update') return s.purple
    if (type === 'error') return s.red
    return s.yellow
  }

  const panelStyle: React.CSSProperties = {
    background: s.bg2,
    border: `1px solid ${s.border}`,
    borderRadius: 8,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }

  const panelHeaderStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderBottom: `1px solid ${s.border}`,
    fontSize: 12,
    fontWeight: 600,
    color: s.text2,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: s.mono,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <DemoBoundary name="Live SSE Stream">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {!running && !done && (
              <button
                onClick={start}
                style={{
                  padding: '8px 18px',
                  background: s.accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: s.mono,
                }}
              >
                Start Stream
              </button>
            )}
            {running && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.green, display: 'inline-block', animation: 'pulse 1s infinite' }} />
                <span style={{ color: s.green, fontSize: 13, fontFamily: s.mono }}>Streaming...</span>
              </div>
            )}
            {done && (
              <button
                onClick={reset}
                style={{
                  padding: '8px 18px',
                  background: s.bg3,
                  color: s.text,
                  border: `1px solid ${s.border}`,
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: s.mono,
                }}
              >
                Reset
              </button>
            )}
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={panelStyle}>
              <div style={panelHeaderStyle}>
                <span style={{ color: s.accent }}>{'>'}</span>
                Raw Wire Format
              </div>
              <div
                ref={rawPanelRef}
                style={{
                  padding: 14,
                  minHeight: 280,
                  maxHeight: 380,
                  overflowY: 'auto',
                  fontFamily: s.mono,
                  fontSize: 12.5,
                  lineHeight: 1.7,
                  whiteSpace: 'pre',
                  color: s.text,
                }}
              >
                {lines.length === 0 ? (
                  <span style={{ color: s.text3 }}>Waiting for stream...</span>
                ) : (
                  lines.map((line, i) => renderRawLine(line, i))
                )}
                {currentEvent && visibleChars > 0 && fullRawText[visibleChars - 1] !== '\n' && (
                  <span style={{ color: s.text, animation: 'blink 0.7s step-end infinite' }}>|</span>
                )}
              </div>
            </div>

            <div style={panelStyle}>
              <div style={panelHeaderStyle}>
                <span style={{ color: s.green }}>{'{'}</span>
                Parsed Events
              </div>
              <div
                style={{
                  padding: 14,
                  minHeight: 280,
                  maxHeight: 380,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {parsedEvents.length === 0 ? (
                  <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 12.5 }}>
                    No events parsed yet...
                  </span>
                ) : (
                  parsedEvents.map((ev, i) => (
                    <div
                      key={i}
                      style={{
                        background: s.bg,
                        border: `1px solid ${s.border}`,
                        borderRadius: 6,
                        padding: '10px 12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span
                          style={{
                            background: eventColor(ev.parsed?.event),
                            color: s.bg,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 3,
                            fontFamily: s.mono,
                            textTransform: 'uppercase',
                          }}
                        >
                          {ev.parsed?.event || 'message'}
                        </span>
                        {ev.parsed?.id && (
                          <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>
                            id: {ev.parsed.id}
                          </span>
                        )}
                      </div>
                      <div style={{ color: s.text, fontSize: 12.5, fontFamily: s.mono, lineHeight: 1.5 }}>
                        {ev.parsed?.data.split('\n').map((line, li) => (
                          <div key={li}>{line}</div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes blink {
            50% { opacity: 0; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </DemoBoundary>
    </div>
  )
}

export default SseStreamDemo
