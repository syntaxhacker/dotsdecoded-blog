import { useState, useEffect, useCallback, useRef } from 'react'
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

type EventType = 'ping' | 'pong' | 'timeout'

interface Event {
  type: EventType
  time: number
}

export default function WsPingPongDemo() {
  const [interval_, setInterval_] = useState(3)
  const [events, setEvents] = useState<Event[]>([])
  const [connected, setConnected] = useState(true)
  const [rtt, setRtt] = useState<number | null>(null)
  const [speed, setSpeed] = useState(1)
  const [running, setRunning] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'ping' | 'pong' | 'timeout'>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pingTimeRef = useRef<number | null>(null)
  const eventIdRef = useRef(0)

  const addEvent = useCallback((type: EventType) => {
    eventIdRef.current += 1
    setEvents(prev => [...prev, { type, time: eventIdRef.current }].slice(-20))
  }, [])

  const runCycle = useCallback(() => {
    if (!connected) return
    setCurrentPhase('ping')
    pingTimeRef.current = Date.now()
    addEvent('ping')

    const pongDelay = getStepDelay(600 + Math.random() * 400, speed)
    const timeoutThreshold = getStepDelay(interval_ * 1000 * 0.8, speed)

    timeoutRef.current = setTimeout(() => {
      if (pingTimeRef.current !== null) {
        const elapsed = Date.now() - pingTimeRef.current
        if (elapsed >= interval_ * 800) {
          setCurrentPhase('timeout')
          addEvent('timeout')
          setRtt(null)
          setConnected(false)
          setTimeout(() => {
            setConnected(true)
            setCurrentPhase('idle')
          }, getStepDelay(1500, speed))
          return
        }
      }
      setCurrentPhase('pong')
      addEvent('pong')
      if (pingTimeRef.current !== null) {
        setRtt(Date.now() - pingTimeRef.current)
      }
      pingTimeRef.current = null
      setTimeout(() => {
        setCurrentPhase('idle')
      }, getStepDelay(300, speed))
    }, pongDelay)
  }, [connected, interval_, speed, addEvent])

  useEffect(() => {
    if (!running) return
    setEvents([])
    eventIdRef.current = 0
    setRtt(null)
    setConnected(true)
    setCurrentPhase('idle')

    intervalRef.current = setInterval(() => {
      runCycle()
    }, getStepDelay(interval_ * 1000, speed))

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [running, interval_, speed, runCycle])

  const start = useCallback(() => {
    setRunning(true)
  }, [])

  const stop = useCallback(() => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setCurrentPhase('idle')
    setRtt(null)
    setConnected(true)
    setEvents([])
    eventIdRef.current = 0
  }, [])

  return (
    <DemoBoundary name="WebSocket Ping Pong">
      <div style={{
        background: s.bg, padding: '32px 24px', borderRadius: 16,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        maxWidth: 820, margin: '0 auto',
      }}>
        <div style={{ background: s.bg2, borderRadius: 12, padding: '24px 28px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
            Ping / Pong Keepalive
          </div>
          <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
            WebSocket control frames keep idle connections alive. The client sends a Ping (opcode 9),
            the server responds with a Pong (opcode 10). If no Pong arrives, the connection is considered dead.
          </p>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>
                Heartbeat Interval (seconds)
              </label>
              <input
                type="range" min={1} max={10} value={interval_}
                onChange={e => setInterval_(Number(e.target.value))}
                style={{ width: '100%', accentColor: s.accent }}
                disabled={running}
              />
              <span style={{ color: s.text, fontFamily: s.mono, fontSize: 13 }}>{interval_}s</span>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>
                Round-Trip Time
              </label>
              <div style={{
                background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
                padding: '10px 14px', fontFamily: s.mono, fontSize: 16, fontWeight: 700,
                color: rtt !== null ? s.green : s.text3,
              }}>
                {rtt !== null ? `${rtt}ms` : '---'}
              </div>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ color: s.text2, fontSize: 12, display: 'block', marginBottom: 6 }}>
                Connection Status
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
                padding: '10px 14px',
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: connected ? s.green : s.red,
                  boxShadow: connected ? `0 0 6px ${s.green}80` : 'none',
                  transition: 'all 0.3s',
                }} />
                <span style={{ color: connected ? s.green : s.red, fontSize: 13, fontWeight: 600 }}>
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 20, padding: '24px 0', marginBottom: 16,
            background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`,
            position: 'relative', minHeight: 80,
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: currentPhase === 'ping' ? `${s.yellow}30` : s.bg3,
                border: `2px solid ${currentPhase === 'ping' ? s.yellow : s.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
              }}>
                <span style={{ color: currentPhase === 'ping' ? s.yellow : s.text3, fontSize: 11, fontWeight: 600 }}>PING</span>
              </div>
              <span style={{ color: s.text3, fontSize: 11 }}>Client</span>
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              flex: 1, maxWidth: 200,
            }}>
              <div style={{
                height: 2, width: '100%', background: s.border, position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: -6, right: -6,
                  color: currentPhase === 'ping' ? s.yellow : currentPhase === 'pong' ? s.green : s.text3,
                  fontSize: 18, transition: 'color 0.3s',
                }}>
                  {currentPhase === 'ping' ? '>' : currentPhase === 'pong' ? '<' : '-'}
                </div>
              </div>
              <span style={{
                color: currentPhase === 'ping' ? s.yellow : currentPhase === 'pong' ? s.green : s.text3,
                fontSize: 11, fontFamily: s.mono,
              }}>
                {currentPhase === 'ping' ? 'Ping opcode 9' : currentPhase === 'pong' ? 'Pong opcode 10' : currentPhase === 'timeout' ? 'Timeout!' : 'Idle'}
              </span>
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: currentPhase === 'pong' ? `${s.green}30` : s.bg3,
                border: `2px solid ${currentPhase === 'pong' ? s.green : s.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
              }}>
                <span style={{ color: currentPhase === 'pong' ? s.green : s.text3, fontSize: 11, fontWeight: 600 }}>PONG</span>
              </div>
              <span style={{ color: s.text3, fontSize: 11 }}>Server</span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Event Log
            </div>
            <div style={{
              background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
              padding: '8px 12px', maxHeight: 140, overflowY: 'auto',
              fontFamily: s.mono, fontSize: 11, lineHeight: 1.8,
            }}>
              {events.length === 0 ? (
                <span style={{ color: s.text3 }}>No events yet. Click Start to begin.</span>
              ) : (
                events.map((ev, idx) => (
                  <div key={idx} style={{
                    display: 'flex', gap: 8,
                    color: ev.type === 'ping' ? s.yellow : ev.type === 'pong' ? s.green : s.red,
                  }}>
                    <span style={{ color: s.text3 }}>#{ev.time}</span>
                    <span>{ev.type === 'ping' ? 'PING sent' : ev.type === 'pong' ? 'PONG received' : 'TIMEOUT'}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!running ? (
              <button onClick={start} style={{
                background: s.accent, border: 'none', borderRadius: 8, padding: '10px 24px',
                color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>
                Start
              </button>
            ) : (
              <button onClick={stop} style={{
                background: s.red, border: 'none', borderRadius: 8, padding: '10px 24px',
                color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>
                Stop
              </button>
            )}
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
