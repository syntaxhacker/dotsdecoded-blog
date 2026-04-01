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

type TabType = 'heartbeat' | 'retry' | 'multiplexing'

interface LogEntry {
  time: string
  type: 'sent' | 'received' | 'comment' | 'event' | 'info'
  content: string
}

function formatTime(): string {
  const now = new Date()
  return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function HeartbeatTab({ speed, onSimulate }: { speed: number; onSimulate: () => void }) {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [inactiveDied, setInactiveDied] = useState(false)
  const [heartbeatDied, setHeartbeatDied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  const addLog = useCallback((type: LogEntry['type'], content: string) => {
    setLogs(prev => [...prev, { time: formatTime(), type, content }])
  }, [])

  const runHeartbeatSimulation = useCallback(async () => {
    setIsRunning(true)
    setLogs([])
    setInactiveDied(false)
    setHeartbeatDied(false)

    addLog('info', '--- Stream A: Without heartbeat (30s timeout) ---')
    addLog('sent', 'GET /stream HTTP/1.1')
    addLog('received', 'HTTP/1.1 200 OK')
    addLog('received', 'Content-Type: text/event-stream')

    let tick = 0
    const baseDelay = getStepDelay(800, speed)

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'data: {"type":"update","value":42}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'data: {"type":"update","value":43}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'data: {"type":"update","value":44}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('info', '... no activity for 30 seconds ...')

    await new Promise(r => setTimeout(r, baseDelay * 2))
    addLog('info', 'Browser: "No data received, closing connection"')
    setInactiveDied(true)

    await new Promise(r => setTimeout(r, baseDelay * 2))
    addLog('info', '--- Stream B: With heartbeat (comments every 15s) ---')
    addLog('sent', 'GET /stream HTTP/1.1')
    addLog('received', 'HTTP/1.1 200 OK')
    addLog('received', 'Content-Type: text/event-stream')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'data: {"type":"update","value":100}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'data: {"type":"update","value":101}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('comment', ': heartbeat')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'data: {"type":"update","value":102}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('comment', ': heartbeat')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'data: {"type":"update","value":103}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('comment', ': heartbeat')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'data: {"type":"update","value":104}')

    await new Promise(r => setTimeout(r, baseDelay * 2))
    addLog('info', 'Connection maintained - stream continues indefinitely')
    setHeartbeatDied(false)
    setIsRunning(false)
  }, [speed, addLog])

  const handleSimulate = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    if (intervalRef.current) clearInterval(intervalRef.current)
    runHeartbeatSimulation()
  }, [runHeartbeatSimulation])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button
          onClick={handleSimulate}
          disabled={isRunning}
          style={{
            background: isRunning ? s.bg3 : s.accent,
            color: s.text,
            border: `1px solid ${s.border}`,
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontFamily: 'inherit',
            opacity: isRunning ? 0.6 : 1,
          }}
        >
          {isRunning ? 'Running...' : 'Simulate'}
        </button>
        <span style={{ color: s.text2, fontSize: '12px' }}>
          Compares stream with and without heartbeat comments
        </span>
      </div>

      <div
        ref={containerRef}
        style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: '8px',
          padding: '12px',
          height: '280px',
          overflowY: 'auto',
          fontFamily: s.mono,
          fontSize: '11px',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: s.text3, textAlign: 'center', paddingTop: '100px' }}>
            Click Simulate to see heartbeat pattern
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '4px', color: log.type === 'comment' ? s.text3 : log.type === 'info' ? s.yellow : log.type === 'sent' ? s.orange : log.type === 'received' ? s.green : s.text }}>
              <span style={{ color: s.text3 }}>[{log.time}]</span>{' '}
              {log.type === 'sent' && <span style={{ color: s.orange }}>{'>'}{' '}</span>}
              {log.type === 'received' && <span style={{ color: s.green }}>{'<'}{' '}</span>}
              {log.type === 'comment' && <span style={{ color: s.text3 }}>{':'}{' '}</span>}
              {log.content}
            </div>
          ))
        )}
      </div>

      {logs.length > 0 && (
        <div style={{ display: 'flex', gap: '24px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: inactiveDied ? s.red : s.bg3 }} />
            <span style={{ color: s.text2 }}>
              Without heartbeat: {inactiveDied ? 'Connection died' : 'Active'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: heartbeatDied ? s.red : s.green }} />
            <span style={{ color: s.text2 }}>
              With heartbeat: {heartbeatDied ? 'Connection died' : 'Alive'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function RetryTab({ speed }: { speed: number }) {
  const [isRunning, setIsRunning] = useState(false)
  const [retryValue, setRetryValue] = useState(10000)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  const addLog = useCallback((type: LogEntry['type'], content: string) => {
    setLogs(prev => [...prev, { time: formatTime(), type, content }])
  }, [])

  const runRetrySimulation = useCallback(async () => {
    setIsRunning(true)
    setLogs([])

    addLog('sent', 'GET /stream HTTP/1.1')
    addLog('received', 'HTTP/1.1 200 OK')
    addLog('received', 'Content-Type: text/event-stream')

    const baseDelay = getStepDelay(600, speed)

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', `retry: ${retryValue}`)
    addLog('info', `Server set retry interval to ${retryValue / 1000} seconds`)

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'data: {"type":"init","status":"connected"}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'data: {"value":1}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'data: {"value":2}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('info', 'Connection lost...')

    await new Promise(r => setTimeout(r, baseDelay * 2))
    addLog('info', `Browser waits ${retryValue / 1000}s before reconnecting...`)

    await new Promise(r => setTimeout(r, baseDelay * 2))
    addLog('sent', 'GET /stream HTTP/1.1 (reconnect)')
    addLog('received', 'HTTP/1.1 200 OK')
    addLog('info', 'Connection restored')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'data: {"value":3}')

    setIsRunning(false)
  }, [speed, retryValue, addLog])

  const handleSimulate = useCallback(() => {
    runRetrySimulation()
  }, [runRetrySimulation])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={handleSimulate}
          disabled={isRunning}
          style={{
            background: isRunning ? s.bg3 : s.accent,
            color: s.text,
            border: `1px solid ${s.border}`,
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontFamily: 'inherit',
            opacity: isRunning ? 0.6 : 1,
          }}
        >
          {isRunning ? 'Running...' : 'Simulate'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: s.text2, fontSize: '12px' }}>Retry interval:</span>
          <select
            value={retryValue}
            onChange={e => setRetryValue(Number(e.target.value))}
            disabled={isRunning}
            style={{
              background: s.bg3,
              color: s.text,
              border: `1px solid ${s.border}`,
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              fontFamily: 'inherit',
              cursor: isRunning ? 'not-allowed' : 'pointer',
            }}
          >
            <option value={3000}>3 seconds (default)</option>
            <option value={5000}>5 seconds</option>
            <option value={10000}>10 seconds</option>
            <option value={30000}>30 seconds</option>
          </select>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: '8px',
          padding: '12px',
          height: '280px',
          overflowY: 'auto',
          fontFamily: s.mono,
          fontSize: '11px',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: s.text3, textAlign: 'center', paddingTop: '100px' }}>
            Click Simulate to see retry mechanism
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '4px', color: log.type === 'comment' ? s.text3 : log.type === 'info' ? s.yellow : log.type === 'sent' ? s.orange : log.type === 'received' ? s.green : s.text }}>
              <span style={{ color: s.text3 }}>[{log.time}]</span>{' '}
              {log.type === 'sent' && <span style={{ color: s.orange }}>{'>'}{' '}</span>}
              {log.type === 'received' && <span style={{ color: s.green }}>{'<'}{' '}</span>}
              {log.type === 'comment' && <span style={{ color: s.text3 }}>{':'}{' '}</span>}
              {log.content}
            </div>
          ))
        )}
      </div>

      <div style={{ fontSize: '12px', color: s.text2, padding: '8px 12px', background: s.bg2, borderRadius: '6px', border: `1px solid ${s.border}` }}>
        <span style={{ color: s.yellow }}>Note:</span> The <code style={{ fontFamily: s.mono, color: s.accent }}>retry:</code> field sets the reconnection delay. Lower values = faster recovery but more server load.
      </div>
    </div>
  )
}

function MultiplexingTab({ speed }: { speed: number }) {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  const addLog = useCallback((type: LogEntry['type'], content: string) => {
    setLogs(prev => [...prev, { time: formatTime(), type, content }])
  }, [])

  const runMultiplexingSimulation = useCallback(async () => {
    setIsRunning(true)
    setLogs([])

    addLog('info', '--- Single SSE connection carrying 3 channels ---')
    addLog('sent', 'GET /stream HTTP/1.1')
    addLog('received', 'HTTP/1.1 200 OK')
    addLog('received', 'Content-Type: text/event-stream')

    const baseDelay = getStepDelay(700, speed)

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'event: channel-a')
    addLog('received', 'data: {"channel":"a","value":"temperature","data":22.5}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'event: channel-b')
    addLog('received', 'data: {"channel":"b","value":"humidity","data":65}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'event: channel-c')
    addLog('received', 'data: {"channel":"c","value":"pressure","data":1013.25}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'event: channel-a')
    addLog('received', 'data: {"channel":"a","value":"temperature","data":22.7}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'event: channel-b')
    addLog('received', 'data: {"channel":"b","value":"humidity","data":64}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'event: channel-a')
    addLog('received', 'data: {"channel":"a","value":"temperature","data":22.9}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'event: channel-c')
    addLog('received', 'data: {"channel":"c","value":"pressure","data":1013.30}')

    await new Promise(r => setTimeout(r, baseDelay))
    addLog('received', 'event: channel-b')
    addLog('received', 'data: {"channel":"b","value":"humidity","data":63}')

    await new Promise(r => setTimeout(r, baseDelay * 2))
    addLog('info', 'Single TCP connection carries all channels')
    addLog('info', 'Client dispatches events by "event" type field')

    setIsRunning(false)
  }, [speed, addLog])

  const handleSimulate = useCallback(() => {
    runMultiplexingSimulation()
  }, [runMultiplexingSimulation])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button
          onClick={handleSimulate}
          disabled={isRunning}
          style={{
            background: isRunning ? s.bg3 : s.accent,
            color: s.text,
            border: `1px solid ${s.border}`,
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontFamily: 'inherit',
            opacity: isRunning ? 0.6 : 1,
          }}
        >
          {isRunning ? 'Running...' : 'Simulate'}
        </button>
        <span style={{ color: s.text2, fontSize: '12px' }}>
          One connection, multiple event streams
        </span>
      </div>

      <div
        ref={containerRef}
        style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: '8px',
          padding: '12px',
          height: '280px',
          overflowY: 'auto',
          fontFamily: s.mono,
          fontSize: '11px',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: s.text3, textAlign: 'center', paddingTop: '100px' }}>
            Click Simulate to see multiplexing
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '4px', color: log.type === 'comment' ? s.text3 : log.type === 'info' ? s.yellow : log.type === 'event' ? s.purple : log.type === 'sent' ? s.orange : log.type === 'received' ? s.green : s.text }}>
              <span style={{ color: s.text3 }}>[{log.time}]</span>{' '}
              {log.type === 'sent' && <span style={{ color: s.orange }}>{'>'}{' '}</span>}
              {log.type === 'received' && <span style={{ color: s.green }}>{'<'}{' '}</span>}
              {log.type === 'event' && <span style={{ color: s.purple }}>{'event:'}{' '}</span>}
              {log.type === 'comment' && <span style={{ color: s.text3 }}>{':'}{' '}</span>}
              {log.content}
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.accent }} />
          <span style={{ color: s.text2 }}>channel-a</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.green }} />
          <span style={{ color: s.text2 }}>channel-b</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.purple }} />
          <span style={{ color: s.text2 }}>channel-c</span>
        </div>
      </div>
    </div>
  )
}

export default function SseAdvancedDemo() {
  const [activeTab, setActiveTab] = useState<TabType>('heartbeat')
  const [speed, setSpeed] = useState(1)

  const tabs: { id: TabType; label: string }[] = [
    { id: 'heartbeat', label: 'Heartbeat' },
    { id: 'retry', label: 'Custom Retry' },
    { id: 'multiplexing', label: 'Multiplexing' },
  ]

  return (
    <DemoBoundary name="Advanced Patterns">
      <div
        style={{
          maxWidth: 820,
          margin: '0 auto',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: s.bg,
          borderRadius: '12px',
          border: `1px solid ${s.border}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid ${s.border}`,
            background: s.bg2,
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: activeTab === tab.id ? s.bg : s.bg2,
                color: activeTab === tab.id ? s.accent : s.text2,
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${s.accent}` : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: 'inherit',
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>
          {activeTab === 'heartbeat' && <HeartbeatTab speed={speed} onSimulate={() => {}} />}
          {activeTab === 'retry' && <RetryTab speed={speed} />}
          {activeTab === 'multiplexing' && <MultiplexingTab speed={speed} />}
        </div>
      </div>
    </DemoBoundary>
  )
}
