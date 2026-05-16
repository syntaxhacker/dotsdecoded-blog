import { useState, useEffect, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Event {
  id: number
  type: string
  message: string
  timestamp: string
}

const eventTypes = [
  { type: 'POST_CREATED', messages: ['New post: "Hello World"', 'New post: "GraphQL Tips"', 'New post: "Deep Dive"'] },
  { type: 'POST_UPDATED', messages: ['Post #42 updated', 'Post #17 title changed', 'Post #8 body edited'] },
  { type: 'COMMENT_ADDED', messages: ['Alice commented on Post #42', 'Bob replied to your comment', 'Charlie liked your post'] },
  { type: 'USER_ONLINE', messages: ['Alice is now online', 'Bob is now online', 'Diana connected'] },
]

let eventCounter = 0

function generateEvent(): Event {
  const cat = eventTypes[Math.floor(Math.random() * eventTypes.length)]
  const msg = cat.messages[Math.floor(Math.random() * cat.messages.length)]
  eventCounter++
  const now = new Date()
  return {
    id: eventCounter,
    type: cat.type,
    message: msg,
    timestamp: now.toLocaleTimeString(),
  }
}

export default function GraphqlSubscriptionDemo() {
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [subscribing, setSubscribing] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [wsState, setWsState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')

  const subscribe = useCallback(() => {
    setWsState('connecting')
    setSubscribing(true)
    setTimeout(() => {
      setWsState('connected')
      setConnected(true)
      setSubscribing(false)
    }, 800)
  }, [])

  const unsubscribe = useCallback(() => {
    setConnected(false)
    setWsState('disconnected')
    setEvents([])
    setAnimating(false)
    eventCounter = 0
  }, [])

  useEffect(() => {
    if (!connected) return
    const interval = setInterval(() => {
      const evt = generateEvent()
      setAnimating(true)
      setTimeout(() => setAnimating(false), 400)
      setEvents((prev) => [evt, ...prev].slice(0, 20))
    }, 2000)
    return () => clearInterval(interval)
  }, [connected])

  const connectionColor = wsState === 'connected' ? s.green : wsState === 'connecting' ? s.yellow : s.red

  return (
    <DemoBoundary name="GraphQL Subscription Event Stream">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <button onClick={subscribe} disabled={connected || subscribing} style={{
          background: connected ? s.bg3 : s.accent, border: 'none', borderRadius: 8,
          padding: '10px 20px', color: connected ? s.text3 : '#fff',
          cursor: connected ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
        }}>{subscribing ? 'Connecting...' : connected ? 'Subscribed' : 'Subscribe'}</button>
        <button onClick={unsubscribe} disabled={!connected} style={{
          background: !connected ? s.bg3 : s.red, border: 'none', borderRadius: 8,
          padding: '10px 20px', color: !connected ? s.text3 : '#fff',
          cursor: !connected ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
        }}>Disconnect</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: connectionColor, transition: 'background 0.3s' }} />
          <span style={{ color: s.text2, fontFamily: s.mono, fontSize: 12, textTransform: 'uppercase' }}>
            {wsState === 'connected' ? 'Connected' : wsState === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1, background: s.bg2, borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Subscription Query
          </div>
          <div style={{
            fontFamily: s.mono, fontSize: 13, color: s.text, lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}>
            {`subscription {\n  postEvents {\n    type\n    message\n    timestamp\n  }\n}`}
          </div>
        </div>
        <div style={{ flex: 1, background: s.bg2, borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Connection
          </div>
          {wsState === 'connected' ? (
            <div style={{ fontFamily: s.mono, fontSize: 12, color: s.text, lineHeight: 1.6 }}>
              <div style={{ color: s.green }}>WebSocket open</div>
              <div style={{ color: s.text3 }}>Protocol: graphql-transport-ws</div>
              <div style={{ color: s.text3 }}>Events received: {events.length}</div>
            </div>
          ) : wsState === 'connecting' ? (
            <div style={{ fontFamily: s.mono, fontSize: 12, color: s.yellow }}>
              <div>Opening WebSocket...</div>
              <div>ws://api.example.com/graphql</div>
            </div>
          ) : (
            <div style={{ fontFamily: s.mono, fontSize: 12, color: s.text3 }}>
              <div>No active connection</div>
              <div>Click Subscribe to start</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: '14px 18px' }}>
        <div style={{ fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Event Stream
        </div>
        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
          {events.length === 0 ? (
            <div style={{ color: s.text3, fontSize: 12, padding: 20, textAlign: 'center' }}>
              No events yet. Subscribe to start receiving real-time updates.
            </div>
          ) : (
            events.map((evt, i) => (
              <div key={evt.id} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '8px 0', borderBottom: i < events.length - 1 ? `1px solid ${s.border}` : 'none',
                animation: i === 0 && animating ? 'eventSlide 0.35s ease' : 'none',
              }}>
                <div style={{
                  background: evt.type === 'POST_CREATED' ? s.green
                    : evt.type === 'POST_UPDATED' ? s.accent
                      : evt.type === 'COMMENT_ADDED' ? s.purple
                        : s.orange,
                  borderRadius: 4, padding: '2px 8px',
                  color: '#fff', fontSize: 10, fontWeight: 600,
                  whiteSpace: 'nowrap', fontFamily: s.mono, marginTop: 1,
                }}>
                  {evt.type}
                </div>
                <div style={{ flex: 1, color: s.text, fontSize: 13 }}>{evt.message}</div>
                <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 11, whiteSpace: 'nowrap' }}>
                  {evt.timestamp}
                </div>
              </div>
            ))
          )}
        </div>
        <style>{`
          @keyframes eventSlide {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
    </DemoBoundary>
  )
}
