import React, { useState, useEffect, useRef, useCallback } from 'react'
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

type Phase = 'idle' | 'streaming' | 'disconnected' | 'reconnecting' | 'resumed' | 'complete'

interface TimelineEvent {
  id: string
  type: 'connect' | 'event' | 'disconnect' | 'reconnect' | 'header'
  content: string
  timestamp: string
  highlight?: boolean
}

export default function SseReconnectDemo() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [countdown, setCountdown] = useState(3)
  const [speed, setSpeed] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [])

  const addEvent = useCallback((event: TimelineEvent) => {
    setEvents(prev => [...prev, event])
    setTimeout(scrollToBottom, 10)
  }, [scrollToBottom])

  const formatTime = () => {
    const now = new Date()
    return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const runSimulation = useCallback(async () => {
    setPhase('streaming')
    setEvents([])

    await new Promise(r => setTimeout(r, getStepDelay(300, speed)))
    addEvent({ id: '0', type: 'connect', content: 'Connected to SSE endpoint', timestamp: formatTime() })

    await new Promise(r => setTimeout(r, getStepDelay(400, speed)))
    addEvent({ id: '1', type: 'event', content: 'event-1: {"type":"update","data":"Item added to cart"}', timestamp: formatTime() })

    await new Promise(r => setTimeout(r, getStepDelay(500, speed)))
    addEvent({ id: '2', type: 'event', content: 'event-2: {"type":"update","data":"Profile viewed"}', timestamp: formatTime() })

    await new Promise(r => setTimeout(r, getStepDelay(500, speed)))
    addEvent({ id: '3', type: 'event', content: 'event-3: {"type":"update","data":"Notification sent"}', timestamp: formatTime() })

    setPhase('disconnected')
    await new Promise(r => setTimeout(r, getStepDelay(200, speed)))
    addEvent({ id: '4', type: 'disconnect', content: 'Connection lost (network timeout)', timestamp: formatTime() })

    setPhase('reconnecting')
    setCountdown(3)

    for (let i = 3; i >= 1; i--) {
      setCountdown(i)
      await new Promise(r => setTimeout(r, getStepDelay(800, speed)))
    }

    addEvent({ id: '5', type: 'reconnect', content: 'Reconnecting to SSE endpoint...', timestamp: formatTime() })
    await new Promise(r => setTimeout(r, getStepDelay(300, speed)))

    addEvent({
      id: '6',
      type: 'header',
      content: 'GET /stream HTTP/1.1\nLast-Event-ID: event-3',
      timestamp: formatTime(),
      highlight: true
    })

    await new Promise(r => setTimeout(r, getStepDelay(400, speed)))
    addEvent({ id: '7', type: 'connect', content: 'Connected (resuming from event-4)', timestamp: formatTime() })

    await new Promise(r => setTimeout(r, getStepDelay(500, speed)))
    addEvent({ id: '8', type: 'event', content: 'event-4: {"type":"update","data":"Email received"}', timestamp: formatTime() })

    await new Promise(r => setTimeout(r, getStepDelay(500, speed)))
    addEvent({ id: '9', type: 'event', content: 'event-5: {"type":"update","data":"File uploaded"}', timestamp: formatTime() })

    setPhase('complete')
  }, [speed, addEvent])

  const reset = () => {
    setPhase('idle')
    setEvents([])
    setCountdown(3)
  }

  useEffect(() => {
    if (phase === 'streaming' || phase === 'disconnected' || phase === 'reconnecting' || phase === 'resumed' || phase === 'complete') {
      scrollToBottom()
    }
  }, [events, phase, scrollToBottom])

  return (
    <DemoBoundary name="Reconnection">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      <div style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 8,
        padding: 20,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: s.text,
        maxWidth: 820,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: `1px solid ${s.border}`,
        }}>
          <div>
            <div style={{ fontSize: 14, color: s.text2, marginBottom: 2 }}>SSE Auto-Reconnection</div>
            <div style={{ fontSize: 12, color: s.text3 }}>
              {phase === 'idle' && 'Click Start to begin simulation'}
              {phase === 'streaming' && 'Receiving events...'}
              {phase === 'disconnected' && 'Connection lost'}
              {phase === 'reconnecting' && `Reconnecting in ${countdown}...`}
              {phase === 'resumed' && 'Stream resumed'}
              {phase === 'complete' && 'Stream complete'}
            </div>
          </div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div
          ref={containerRef}
          style={{
            background: s.bg2,
            border: `1px solid ${s.border}`,
            borderRadius: 6,
            padding: 12,
            height: 280,
            overflowY: 'auto',
            marginBottom: 16,
            fontFamily: s.mono,
            fontSize: 12,
          }}
        >
          {events.length === 0 && phase === 'idle' && (
            <div style={{ color: s.text3, textAlign: 'center', paddingTop: 100 }}>
              Waiting to start...
            </div>
          )}
          {events.map((event, index) => (
            <div
              key={index}
              style={{
                padding: '6px 8px',
                marginBottom: 4,
                borderRadius: 4,
                background: event.type === 'disconnect' ? `${s.red}15` :
                           event.type === 'reconnect' ? `${s.yellow}15` :
                           event.type === 'header' ? `${s.accent}15` :
                           event.highlight ? `${s.green}10` : 'transparent',
                borderLeft: `3px solid ${
                  event.type === 'connect' ? s.green :
                  event.type === 'disconnect' ? s.red :
                  event.type === 'reconnect' ? s.yellow :
                  event.type === 'header' ? s.accent :
                  s.border2
                }`,
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 2,
              }}>
                <span style={{
                  color: event.type === 'connect' ? s.green :
                         event.type === 'disconnect' ? s.red :
                         event.type === 'reconnect' ? s.yellow :
                         event.type === 'header' ? s.accent : s.text2,
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}>
                  {event.type === 'header' ? 'HTTP REQUEST' : event.type.toUpperCase()}
                </span>
                <span style={{ color: s.text3, fontSize: 10 }}>{event.timestamp}</span>
              </div>
              <div style={{
                color: event.type === 'disconnect' ? s.red :
                       event.type === 'reconnect' ? s.yellow :
                       event.type === 'header' ? s.accent : s.text,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {event.content}
              </div>
            </div>
          ))}
          {phase === 'reconnecting' && (
            <div style={{
              padding: '6px 8px',
              marginBottom: 4,
              borderRadius: 4,
              background: `${s.yellow}15`,
              borderLeft: `3px solid ${s.yellow}`,
              animation: 'pulse 1s ease-in-out infinite',
            }}>
              <span style={{ color: s.yellow, fontSize: 12 }}>
                Reconnecting in {countdown}...
              </span>
            </div>
          )}
          {phase === 'streaming' && (
            <div style={{
              padding: '6px 8px',
              marginBottom: 4,
              borderRadius: 4,
              background: `${s.green}10`,
              borderLeft: `3px solid ${s.green}`,
            }}>
              <span style={{ color: s.green, fontSize: 12, animation: 'blink 1s step-end infinite' }}>
                Waiting for events...
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {phase === 'idle' && (
            <button
              onClick={runSimulation}
              style={{
                background: s.accent,
                color: s.bg,
                border: 'none',
                borderRadius: 6,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "inherit",
              }}
            >
              Start
            </button>
          )}
          {phase !== 'idle' && (
            <button
              onClick={reset}
              style={{
                background: s.bg3,
                color: s.text,
                border: `1px solid ${s.border}`,
                borderRadius: 6,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "inherit",
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </DemoBoundary>
  )
}
