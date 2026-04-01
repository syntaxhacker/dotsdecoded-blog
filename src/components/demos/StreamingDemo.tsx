import { useState, useEffect, useRef, useCallback } from 'react'
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

type EventType = 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop'

interface StreamEvent {
  type: EventType
  detail: string
  blockType?: string
  delta?: string
  color: string
}

const responseText = "The function at line 42 is the main handler. It parses the request body, validates the input against the Zod schema, and delegates to the appropriate service layer."
const toolInput = '{"file_path":"/src/handlers/user.ts","offset":40,"limit":30}'
const toolName = 'FileRead'

const generateEvents = (): StreamEvent[] => {
  const evts: StreamEvent[] = []

  evts.push({ type: 'message_start', detail: 'Connection established, TTFB: 340ms', color: s.green })
  evts.push({ type: 'content_block_start', detail: 'Block #0 started', blockType: 'text', color: s.accent })

  for (let i = 1; i <= responseText.length; i += 4) {
    const chunk = responseText.slice(i - 1, Math.min(i + 3, responseText.length))
    evts.push({ type: 'content_block_delta', detail: `Block #0 delta (${chunk.length} chars)`, blockType: 'text', delta: chunk, color: s.accent })
  }

  evts.push({ type: 'content_block_stop', detail: 'Block #0 complete (text)', blockType: 'text', color: s.accent })
  evts.push({ type: 'content_block_start', detail: 'Block #1 started', blockType: 'tool_use', color: s.orange })

  for (let i = 1; i <= toolInput.length; i += 8) {
    const chunk = toolInput.slice(i - 1, Math.min(i + 7, toolInput.length))
    evts.push({ type: 'content_block_delta', detail: `Block #1 delta (${chunk.length} chars)`, blockType: 'tool_use', delta: chunk, color: s.orange })
  }

  evts.push({ type: 'content_block_stop', detail: 'Block #1 complete (tool_use: FileRead)', blockType: 'tool_use', color: s.orange })
  evts.push({ type: 'message_delta', detail: 'stop_reason: tool_use, output_tokens: 87', color: s.purple })
  evts.push({ type: 'message_stop', detail: 'Stream complete', color: s.green })

  return evts
}

const allEvents = generateEvents()

const blockTypeLabel: Record<string, string> = {
  text: 'TEXT',
  tool_use: 'TOOL_USE',
  thinking: 'THINKING',
}

const blockTypeColor: Record<string, string> = {
  text: s.accent,
  tool_use: s.orange,
  thinking: s.purple,
}

export default function StreamingDemo() {
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [eventLog, setEventLog] = useState<StreamEvent[]>([])
  const [accumulatedText, setAccumulatedText] = useState('')
  const [accumulatedToolInput, setAccumulatedToolInput] = useState('')
  const [currentBlock, setCurrentBlock] = useState<string | null>(null)
  const [speed, setSpeed] = useState(1)
  const logRef = useRef<HTMLDivElement>(null)

  const start = useCallback(() => {
    setRunning(true)
    setDone(false)
    setEventLog([])
    setAccumulatedText('')
    setAccumulatedToolInput('')
    setCurrentBlock(null)
  }, [])

  useEffect(() => {
    if (!running) return
    let idx = eventLog.length
    if (idx >= allEvents.length) {
      setRunning(false)
      setDone(true)
      return
    }

    const baseDelay = 30
    const delay = getStepDelay(baseDelay, speed)
    const t = setTimeout(() => {
      const evt = allEvents[idx]
      setEventLog((prev) => [...prev, evt])

      if (evt.type === 'content_block_start') {
        setCurrentBlock(evt.blockType || null)
      } else if (evt.type === 'content_block_delta') {
        if (evt.blockType === 'text' && evt.delta) {
          setAccumulatedText((prev) => prev + evt.delta)
        } else if (evt.blockType === 'tool_use' && evt.delta) {
          setAccumulatedToolInput((prev) => prev + evt.delta)
        }
      } else if (evt.type === 'content_block_stop') {
        setCurrentBlock(null)
      } else if (evt.type === 'message_stop') {
        setRunning(false)
        setDone(true)
      }
    }, delay)

    return () => clearTimeout(t)
  }, [running, eventLog.length, speed])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [eventLog])

  const eventTypeIcon: Record<EventType, string> = {
    message_start: 'MSG',
    content_block_start: 'BLK+',
    content_block_delta: 'BLKd',
    content_block_stop: 'BLK-',
    message_delta: 'MSGd',
    message_stop: 'END',
  }

  return (
    <DemoBoundary name="SSE Streaming">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '8px 14px',
                borderBottom: `1px solid ${s.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  SSE Event Stream
                </span>
                <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
                  {eventLog.length}/{allEvents.length} events
                </span>
              </div>
              <div ref={logRef} style={{
                height: 260,
                overflowY: 'auto',
                padding: '6px 10px',
                fontFamily: s.mono,
                fontSize: 11,
                lineHeight: 1.6,
              }}>
                {eventLog.length === 0 && (
                  <div style={{ color: s.text3, padding: '60px 0', textAlign: 'center' }}>
                    Waiting for stream...
                  </div>
                )}
                {eventLog.map((evt, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: 8,
                    padding: '2px 4px',
                    borderRadius: 3,
                    background: i === eventLog.length - 1 && running ? `${evt.color}08` : 'transparent',
                  }}>
                    <span style={{ color: evt.color, fontWeight: 600, flexShrink: 0, width: 42 }}>
                      {eventTypeIcon[evt.type]}
                    </span>
                    <span style={{ color: s.text2 }}>
                      {evt.detail}
                    </span>
                    {evt.delta && (
                      <span style={{ color: s.text3, marginLeft: 'auto', flexShrink: 0, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        +&quot;{evt.delta}&quot;
                      </span>
                    )}
                  </div>
                ))}
                {running && (
                  <div style={{ color: s.accent, animation: 'blink 1s infinite' }}>
                    {'>'} streaming...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ width: 340, flexShrink: 0 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: 12,
            }}>
              <div style={{
                padding: '8px 14px',
                borderBottom: `1px solid ${s.border}`,
                fontFamily: s.mono,
                fontSize: 11,
                color: s.text3,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Accumulated Blocks
              </div>
              <div style={{ padding: '10px 14px', minHeight: 80 }}>
                {accumulatedText && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{
                        fontFamily: s.mono,
                        fontSize: 9,
                        fontWeight: 600,
                        color: blockTypeColor.text,
                        background: `${blockTypeColor.text}18`,
                        padding: '1px 6px',
                        borderRadius: 3,
                      }}>
                        TEXT
                      </span>
                      <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
                        {accumulatedText.length} chars
                      </span>
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: s.text2,
                      lineHeight: 1.5,
                      maxHeight: 60,
                      overflow: 'hidden',
                    }}>
                      {accumulatedText}
                      {currentBlock === 'text' && <span style={{ color: s.accent }}>|</span>}
                    </div>
                  </div>
                )}
                {accumulatedToolInput && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{
                        fontFamily: s.mono,
                        fontSize: 9,
                        fontWeight: 600,
                        color: blockTypeColor.tool_use,
                        background: `${blockTypeColor.tool_use}18`,
                        padding: '1px 6px',
                        borderRadius: 3,
                      }}>
                        TOOL_USE
                      </span>
                      <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
                        {toolName}
                      </span>
                    </div>
                    <pre style={{
                      fontFamily: s.mono,
                      fontSize: 10,
                      color: s.orange,
                      background: s.bg2,
                      padding: 6,
                      borderRadius: 4,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.4,
                      maxHeight: 60,
                      overflow: 'hidden',
                    }}>
                      {accumulatedToolInput}
                      {currentBlock === 'tool_use' && <span style={{ color: s.orange }}>|</span>}
                    </pre>
                  </div>
                )}
                {!accumulatedText && !accumulatedToolInput && (
                  <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                    Blocks will appear here
                  </div>
                )}
              </div>
            </div>

            <div style={{
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '10px 14px',
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Stream Protocol
              </div>
              {[
                ['message_start', 'TTFB, model info'],
                ['content_block_start', 'Block type + index'],
                ['content_block_delta', 'Incremental content'],
                ['content_block_stop', 'Block finalized'],
                ['message_delta', 'Token counts'],
                ['message_stop', 'Stream ended'],
              ].map(([evt, desc]) => (
                <div key={evt} style={{ display: 'flex', gap: 8, padding: '2px 0', fontFamily: s.mono, fontSize: 10 }}>
                  <span style={{ color: s.accent, flexShrink: 0, width: 120 }}>{evt}</span>
                  <span style={{ color: s.text3 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={start}
            disabled={running}
            style={{
              padding: '8px 28px',
              background: running ? s.bg3 : s.accent,
              color: running ? s.text3 : '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: running ? 'not-allowed' : 'pointer',
              fontFamily: s.mono,
              transition: 'all 0.2s',
            }}
          >
            {done ? 'Replay' : running ? 'Streaming...' : 'Start Stream'}
          </button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <style>{`@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
      </div>
    </DemoBoundary>
  )
}
