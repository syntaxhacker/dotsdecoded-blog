import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type LineType = 'event' | 'data' | 'id' | 'retry' | 'comment' | 'blank'

interface SseLine {
  text: string
  type: LineType
  label: string
  explanation: string
}

interface ParseRule {
  id: string
  text: string
  activatesOn: LineType[]
}

const sseLines: SseLine[] = [
  { text: ': server started — listening on :8080', type: 'comment', label: 'comment', explanation: 'Lines starting with ":" are comments. The browser ignores them entirely — they exist only for server-side debugging or human readability.' },
  { text: '', type: 'blank', label: 'blank line', explanation: 'A blank line signals the end of the current event. The browser dispatches what it has collected so far as a single MessageEvent.' },
  { text: 'event: user-joined', type: 'event', label: 'event:', explanation: 'Sets the event type. Instead of firing onmessage, the browser fires a named listener like addEventListener("user-joined", ...). Defaults to "message" if omitted.' },
  { text: 'data: {"name":"Alice","role":"admin"}', type: 'data', label: 'data:', explanation: 'Carries the payload. The browser appends the value to an internal buffer. If multiple data: lines appear, they are joined with "\\n" into a single string.' },
  { text: 'id: 42', type: 'id', label: 'id:', explanation: 'Sets the Last-Event-ID header on the next reconnection attempt. The server uses this to resume from where it left off — no data lost.' },
  { text: '', type: 'blank', label: 'blank line', explanation: 'Another blank line — dispatches the "user-joined" event with its data and id. The browser resets its field buffer and starts collecting the next event.' },
  { text: 'data: pong', type: 'data', label: 'data:', explanation: 'A bare data: line with no event: field. The browser uses the default event type "message" and fires the onmessage handler.' },
  { text: 'retry: 3000', type: 'retry', label: 'retry:', explanation: 'Tells the browser to wait 3000ms before attempting to reconnect after a connection drop. The browser remembers this value until the page unloads or a new retry: overrides it.' },
  { text: '', type: 'blank', label: 'blank line', explanation: 'Dispatches the default "message" event with data "pong". The retry value is stored but does not trigger an event.' },
  { text: 'event: chat-message', type: 'event', label: 'event:', explanation: 'A new named event type. Any listener attached with addEventListener("chat-message", handler) will fire when this event is dispatched.' },
  { text: 'data: Hello!', type: 'data', label: 'data:', explanation: 'First data: line of a multi-line payload. The browser starts a new buffer for this event.' },
  { text: 'data: How are you?', type: 'data', label: 'data:', explanation: 'Second data: line. The browser appends this with a "\\n" separator. The final data will be "Hello!\\nHow are you?".' },
  { text: 'id: 43', type: 'id', label: 'id:', explanation: 'Updates the last event ID to 43. If the connection drops now, the browser will reconnect with Last-Event-ID: 43 so the server can send event 44 onwards.' },
  { text: '', type: 'blank', label: 'blank line', explanation: 'Dispatches the "chat-message" event. The data field is "Hello!\\nHow are you?" — two lines joined. The id field is set to 43.' },
]

const rules: ParseRule[] = [
  { id: 'format', text: 'Each field is "field: value" — a colon followed by a space and the payload', activatesOn: ['event', 'data', 'id', 'retry'] },
  { id: 'data-multi', text: 'data: can appear multiple times — the browser joins them with "\\n" into one string', activatesOn: ['data'] },
  { id: 'blank', text: 'A blank line signals the end of the current event and triggers dispatch', activatesOn: ['blank'] },
  { id: 'comment', text: 'Lines starting with ":" are comments — the browser silently ignores them', activatesOn: ['comment'] },
  { id: 'id', text: 'id: sets the Last-Event-ID for automatic reconnection after a drop', activatesOn: ['id'] },
  { id: 'retry', text: 'retry: tells the client how many milliseconds to wait before reconnecting', activatesOn: ['retry'] },
  { id: 'event', text: 'event: sets the event type — defaults to "message" if omitted', activatesOn: ['event'] },
]

export default function SseWireFormatDemo() {
  const [activeType, setActiveType] = useState<LineType | null>(null)

  const activeRules = useMemo(() => {
    if (!activeType) return new Set<string>()
    return new Set(rules.filter(r => r.activatesOn.includes(activeType)).map(r => r.id))
  }, [activeType])

  const activeExplanation = useMemo(() => {
    if (!activeType) return null
    const line = sseLines.find(l => l.type === activeType)
    return line ?? null
  }, [activeType])

  const typeColor = (t: LineType | null): string => {
    if (!t) return s.text3
    const map: Record<LineType, string> = {
      event: s.accent,
      data: s.green,
      id: s.purple,
      retry: s.orange,
      comment: s.text3,
      blank: s.yellow,
    }
    return map[t]
  }

  const lineBg = (line: SseLine): string => {
    if (!activeType) return 'transparent'
    if (line.type === activeType) {
      const map: Record<LineType, string> = {
        event: 'rgba(91,141,239,0.12)',
        data: 'rgba(61,214,140,0.12)',
        id: 'rgba(155,123,234,0.12)',
        retry: 'rgba(232,148,90,0.12)',
        comment: 'rgba(116,124,139,0.08)',
        blank: 'rgba(224,176,64,0.12)',
      }
      return map[line.type]
    }
    return 'transparent'
  }

  const typeLabel = (t: LineType): string => {
    const map: Record<LineType, string> = {
      event: 'event:',
      data: 'data:',
      id: 'id:',
      retry: 'retry:',
      comment: ': comment',
      blank: 'blank',
    }
    return map[t]
  }

  return (
    <DemoBoundary name="SSE Wire Format">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 12,
        }}>
          <div style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${s.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>Raw SSE Wire Format</span>
            <span style={{ color: s.text3, fontSize: 11, marginLeft: 'auto' }}>click any line to explore</span>
          </div>
          <div style={{ padding: 16 }}>
            {sseLines.map((line, idx) => {
              const isBlank = line.type === 'blank'
              return (
                <div
                  key={idx}
                  onClick={() => setActiveType(line.type)}
                  style={{
                    background: lineBg(line),
                    padding: '4px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    marginBottom: 2,
                  }}
                >
                  {isBlank ? (
                    <span style={{ color: activeType === 'blank' ? s.yellow : s.border2, fontSize: 11, userSelect: 'none' }}>
                      {activeType === 'blank' ? '↵ blank line — end of event' : '·'}
                    </span>
                  ) : (
                    <span>
                      {line.text.split(/^(event:|data:|id:|retry:|:\s)/).map((part, pi) => {
                        if (pi % 2 === 1) {
                          return (
                            <span key={pi} style={{ color: typeColor(line.type), fontWeight: 600 }}>
                              {part}
                            </span>
                          )
                        }
                        if (part) {
                          return (
                            <span key={pi} style={{ color: line.type === 'comment' ? s.text3 : s.text2 }}>
                              {part}
                            </span>
                          )
                        }
                        return null
                      })}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${s.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>Parse Rules</span>
            {activeType && (
              <span style={{
                fontFamily: s.mono,
                fontSize: 10,
                color: typeColor(activeType),
                background: `${typeColor(activeType)}18`,
                padding: '2px 8px',
                borderRadius: 4,
                marginLeft: 8,
              }}>
                {typeLabel(activeType)}
              </span>
            )}
          </div>
          <div style={{ padding: 14 }}>
            {rules.map((rule) => {
              const isActive = activeRules.has(rule.id)
              return (
                <div
                  key={rule.id}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 4,
                    background: isActive ? `${s.accent}10` : 'transparent',
                    border: `1px solid ${isActive ? s.accent : 'transparent'}`,
                    marginBottom: 4,
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                  }}
                  onClick={() => setActiveType(activeType === rule.activatesOn[0] ? null : rule.activatesOn[0])}
                >
                  <span style={{
                    fontFamily: s.mono,
                    fontSize: 12,
                    color: isActive ? s.accent : s.text2,
                  }}>
                    {rule.text}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {activeExplanation && (
          <div style={{
            marginTop: 12,
            padding: 14,
            background: `${typeColor(activeType)}10`,
            border: `1px solid ${typeColor(activeType)}40`,
            borderRadius: 8,
          }}>
            <div style={{
              fontFamily: s.mono,
              fontSize: 11,
              color: typeColor(activeType),
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {activeExplanation.label}
            </div>
            <div style={{
              fontSize: 13,
              color: s.text2,
              lineHeight: 1.6,
            }}>
              {activeExplanation.explanation}
            </div>
          </div>
        )}

        {activeType && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button
              onClick={() => setActiveType(null)}
              style={{
                background: 'transparent',
                border: `1px solid ${s.border}`,
                borderRadius: 6,
                color: s.text3,
                fontSize: 12,
                padding: '6px 16px',
                cursor: 'pointer',
                fontFamily: s.mono,
              }}
            >
              clear selection
            </button>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
