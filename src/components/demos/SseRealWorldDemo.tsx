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

const AI_RESPONSES = [
  "Server-Sent Events allow servers to push data to clients over HTTP...",
  "Unlike WebSockets, SSE is one-directional - the client receives but doesn't send...",
  "SSE is perfect for live dashboards, notifications, and streaming updates...",
  "The EventSource API makes SSE easy to use in browsers...",
  "SSE automatically reconnects if the connection drops...",
]

const NOTIFICATION_TYPES = [
  { icon: '!', color: s.red, titles: ['Error', 'Alert', 'Warning'], msgs: ['Connection failed', 'High CPU usage', 'Memory threshold exceeded'] },
  { icon: 'i', color: s.accent, titles: ['Info', 'Update', 'Notice'], msgs: ['New message received', 'System updated', 'Configuration changed'] },
  { icon: 'V', color: s.green, titles: ['Success', 'Complete', 'Done'], msgs: ['File uploaded', 'Process finished', 'Backup completed'] },
]

const STOCKS = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'GOOGL', name: 'Google' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'AMZN', name: 'Amazon' },
]

function AiStreamCard({ speed }: { speed: number }) {
  const [running, setRunning] = useState(false)
  const [text, setText] = useState('')
  const [responseIdx, setResponseIdx] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!running) return
    const fullText = AI_RESPONSES[responseIdx % AI_RESPONSES.length]
    let charIdx = 0
    const interval = setInterval(() => {
      if (charIdx <= fullText.length) {
        setText(fullText.slice(0, charIdx))
        charIdx++
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      } else {
        clearInterval(interval)
      }
    }, getStepDelay(60, speed))
    return () => clearInterval(interval)
  }, [running, responseIdx, speed])

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setResponseIdx(i => i + 1)
    }, getStepDelay(4000, speed))
    return () => clearInterval(interval)
  }, [running, speed])

  const handleStart = () => {
    setRunning(true)
    setText('')
    setResponseIdx(0)
  }

  const handleStop = () => setRunning(false)

  return (
    <div style={{
      background: s.bg2,
      border: `1px solid ${s.border}`,
      borderRadius: 8,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{
          width: 32, height: 32,
          background: s.purple + '30',
          border: `1px solid ${s.purple}`,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: s.purple, fontWeight: 600,
        }}>AI</div>
        <span style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>AI Response Streaming</span>
      </div>
      <div
        ref={containerRef}
        style={{
          height: 120,
          overflowY: 'auto',
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 6,
          padding: 12,
        }}
      >
        <div style={{
          background: s.bg3,
          borderRadius: 8,
          padding: '10px 14px',
          color: s.text,
          fontSize: 13,
          lineHeight: 1.5,
          fontFamily: s.mono,
        }}>
          {text || (running ? '...' : 'Click Start to stream AI response')}
        </div>
      </div>
      <button
        onClick={running ? handleStop : handleStart}
        style={{
          padding: '8px 16px',
          background: running ? s.red + '20' : s.green + '20',
          border: `1px solid ${running ? s.red : s.green}`,
          borderRadius: 6,
          color: running ? s.red : s.green,
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {running ? 'Stop' : 'Start'}
      </button>
    </div>
  )
}

function NotificationCard({ speed }: { speed: number }) {
  const [running, setRunning] = useState(false)
  const [notifications, setNotifications] = useState<Array<{ id: number, icon: string, color: string, title: string, msg: string, time: string }>>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const countRef = useRef(0)

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      const type = NOTIFICATION_TYPES[Math.floor(Math.random() * NOTIFICATION_TYPES.length)]
      const titleIdx = Math.floor(Math.random() * type.titles.length)
      const newNotif = {
        id: countRef.current++,
        icon: type.icon,
        color: type.color,
        title: type.titles[titleIdx],
        msg: type.msgs[titleIdx],
        time: new Date().toLocaleTimeString(),
      }
      setNotifications(prev => [newNotif, ...prev].slice(0, 8))
      if (containerRef.current) {
        containerRef.current.scrollTop = 0
      }
    }, getStepDelay(1200, speed))
    return () => clearInterval(interval)
  }, [running, speed])

  const handleStart = () => {
    setRunning(true)
    setNotifications([])
    countRef.current = 0
  }
  const handleStop = () => setRunning(false)

  return (
    <div style={{
      background: s.bg2,
      border: `1px solid ${s.border}`,
      borderRadius: 8,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{
          position: 'relative',
          width: 32, height: 32,
          background: s.accent + '30',
          border: `1px solid ${s.accent}`,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: s.accent,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a5 5 0 0 0-5 5v3H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H9V6a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v3H5V6a3 3 0 0 1 3-3z"/>
          </svg>
          {running && notifications.length > 0 && (
            <div style={{
              position: 'absolute',
              top: -4, right: -4,
              background: s.red,
              color: s.text,
              fontSize: 9,
              fontWeight: 700,
              minWidth: 14, height: 14,
              borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px',
            }}>
              {notifications.length}
            </div>
          )}
        </div>
        <span style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>Live Notifications</span>
      </div>
      <div
        ref={containerRef}
        style={{
          height: 120,
          overflowY: 'auto',
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 6,
          padding: 8,
        }}
      >
        {notifications.length === 0 && (
          <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: 20 }}>
            {running ? 'Waiting for events...' : 'Click Start to receive notifications'}
          </div>
        )}
        {notifications.map(n => (
          <div key={n.id} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '6px 8px',
            borderBottom: `1px solid ${s.border}`,
          }}>
            <div style={{
              width: 20, height: 20,
              background: n.color + '30',
              border: `1px solid ${n.color}`,
              borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: n.color, fontWeight: 700, flexShrink: 0,
            }}>
              {n.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: s.text, fontSize: 12, fontWeight: 600 }}>{n.title}</div>
              <div style={{ color: s.text2, fontSize: 11 }}>{n.msg}</div>
            </div>
            <div style={{ color: s.text3, fontSize: 10, flexShrink: 0 }}>{n.time}</div>
          </div>
        ))}
      </div>
      <button
        onClick={running ? handleStop : handleStart}
        style={{
          padding: '8px 16px',
          background: running ? s.red + '20' : s.green + '20',
          border: `1px solid ${running ? s.red : s.green}`,
          borderRadius: 6,
          color: running ? s.red : s.green,
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {running ? 'Stop' : 'Start'}
      </button>
    </div>
  )
}

function StockCard({ speed }: { speed: number }) {
  const [running, setRunning] = useState(false)
  const [prices, setPrices] = useState<Record<string, { price: number, prev: number, history: number[] }>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initial: Record<string, { price: number, prev: number, history: number[] }> = {}
    STOCKS.forEach(stock => {
      const price = 100 + Math.random() * 400
      initial[stock.symbol] = { price, prev: price, history: [price] }
    })
    setPrices(initial)
  }, [])

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev }
        const symbol = STOCKS[Math.floor(Math.random() * STOCKS.length)].symbol
        const change = (Math.random() - 0.5) * 10
        next[symbol] = {
          price: Math.max(1, next[symbol].price + change),
          prev: next[symbol].price,
          history: [...next[symbol].history, Math.max(1, next[symbol].price + change)].slice(-10),
        }
        return next
      })
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
    }, getStepDelay(500, speed))
    return () => clearInterval(interval)
  }, [running, speed])

  const handleStart = () => setRunning(true)
  const handleStop = () => setRunning(false)

  return (
    <div style={{
      background: s.bg2,
      border: `1px solid ${s.border}`,
      borderRadius: 8,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{
          width: 32, height: 32,
          background: s.green + '30',
          border: `1px solid ${s.green}`,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill={s.green}>
            <path d="M2 12l4-5 3 3 5-6v8H2z"/>
          </svg>
        </div>
        <span style={{ color: s.text, fontSize: 14, fontWeight: 600 }}>Stock Price Feed</span>
      </div>
      <div
        ref={containerRef}
        style={{
          height: 120,
          overflowY: 'auto',
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 6,
          padding: 8,
        }}
      >
        {Object.keys(prices).length === 0 && (
          <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', padding: 20 }}>
            Loading prices...
          </div>
        )}
        {STOCKS.map(stock => {
          const data = prices[stock.symbol]
          if (!data) return null
          const up = data.price >= data.prev
          const change = data.price - data.prev
          return (
            <div key={stock.symbol} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderBottom: `1px solid ${s.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: s.text, fontSize: 12, fontWeight: 600, fontFamily: s.mono }}>{stock.symbol}</span>
                <span style={{ color: s.text3, fontSize: 10 }}>{stock.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: s.mono,
                  color: up ? s.green : s.red,
                }}>
                  ${data.price.toFixed(2)}
                </span>
                <span style={{
                  fontSize: 10,
                  color: up ? s.green : s.red,
                  fontFamily: s.mono,
                }}>
                  {up ? '+' : ''}{change.toFixed(2)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <button
        onClick={running ? handleStop : handleStart}
        style={{
          padding: '8px 16px',
          background: running ? s.red + '20' : s.green + '20',
          border: `1px solid ${running ? s.red : s.green}`,
          borderRadius: 6,
          color: running ? s.red : s.green,
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {running ? 'Stop' : 'Start'}
      </button>
    </div>
  )
}

export default function SseRealWorldDemo() {
  const [speed, setSpeed] = useState(1)

  return (
    <DemoBoundary name="Real-World SSE">
      <div style={{
        maxWidth: 820,
        width: '100%',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: s.text,
      }}>
        <div style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: 13, color: s.text2, lineHeight: 1.5 }}>
            SSE powers real-time features across the web. Each card below simulates a different use case:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: s.text3 }}>Speed:</span>
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}>
          <AiStreamCard speed={speed} />
          <NotificationCard speed={speed} />
          <StockCard speed={speed} />
        </div>
      </div>
    </DemoBoundary>
  )
}
