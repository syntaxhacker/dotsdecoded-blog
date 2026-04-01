import React, { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const features = [
  {
    label: 'Direction',
    sse: { value: 'Server to Client only', positive: false, hint: 'SSE is unidirectional - server pushes data, client cannot send events back through the same connection' },
    ws: { value: 'Bidirectional', positive: true, hint: 'Full-duplex communication - both client and server can send messages anytime' },
  },
  {
    label: 'Protocol',
    sse: { value: 'HTTP/1.1', positive: true, hint: 'Uses plain HTTP, works with existing infrastructure, proxies, and firewalls' },
    ws: { value: 'ws:// (custom)', positive: false, hint: 'Custom protocol over TCP, may be blocked by proxies and firewalls' },
  },
  {
    label: 'Auto-reconnect',
    sse: { value: 'Built-in', positive: true, hint: 'Browser automatically reconnects if connection drops, with configurable retry' },
    ws: { value: 'Manual', positive: false, hint: 'You must implement reconnection logic, backoff, and state management yourself' },
  },
  {
    label: 'Firewalls',
    sse: { value: 'Works through proxies', positive: true, hint: 'Standard HTTP traffic passes through proxies and corporate firewalls easily' },
    ws: { value: 'May be blocked', positive: false, hint: 'Uses TCP directly, often blocked by corporate proxies and firewalls' },
  },
  {
    label: 'Complexity',
    sse: { value: 'Simple', positive: true, hint: 'Just EventSource API, few lines of code to get started' },
    ws: { value: 'Complex', positive: false, hint: 'Requires protocol handshake, framing, heartbeat, error handling' },
  },
  {
    label: 'Browser Support',
    sse: { value: 'Modern browsers', positive: false, hint: 'No IE/Edge legacy support, but works in all modern browsers' },
    ws: { value: 'Universal', positive: true, hint: 'Supported everywhere, including older browsers and mobile' },
  },
  {
    label: 'Use case fit',
    sse: { value: 'Live updates, notifications', positive: true, hint: 'Perfect for: stock ticks, news feeds, notifications, monitoring dashboards' },
    ws: { value: 'Chat, gaming, real-time', positive: true, hint: 'Perfect for: chat apps, multiplayer games, collaborative editing, live queries' },
  },
]

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M13.5 4.5L6 12L2.5 8.5" stroke={s.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M12 4L4 12M4 4L12 12" stroke={s.red} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const SseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" stroke={s.accent} strokeWidth="2"/>
    <path d="M10 6V10L13 13" stroke={s.accent} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const WsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M4 10H16M10 4V16" stroke={s.purple} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="10" cy="10" r="8" stroke={s.purple} strokeWidth="2"/>
  </svg>
)

const SseVsWebSocketDemo = () => {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)
  const [hoveredCard, setHoveredCard] = useState<'sse' | 'ws' | null>(null)

  const activeHint = hoveredFeature ? features.find(f => f.label === hoveredFeature)?.[hoveredCard === 'ws' ? 'ws' : 'sse'].hint : null

  return (
    <DemoBoundary name="SSE vs WebSocket">
      <style>{`
        .sse-ws-demo * { box-sizing: border-box; }
        .sse-ws-demo .hint-box {
          background: ${s.bg3};
          border: 1px solid ${s.border};
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
          font-size: 13px;
          color: ${s.text2};
          min-height: 48px;
          display: flex;
          align-items: center;
        }
        .sse-ws-demo .cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 600px) {
          .sse-ws-demo .cards { grid-template-columns: 1fr; }
        }
        .sse-ws-demo .card {
          background: ${s.bg2};
          border: 1px solid ${s.border};
          border-radius: 12px;
          overflow: hidden;
        }
        .sse-ws-demo .card-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid ${s.border};
        }
        .sse-ws-demo .card-header.sse { background: ${s.accent}18; border-bottom-color: ${s.accent}40; }
        .sse-ws-demo .card-header.ws { background: ${s.purple}18; border-bottom-color: ${s.purple}40; }
        .sse-ws-demo .card-title {
          font-size: 16px;
          font-weight: 600;
          color: ${s.text};
        }
        .sse-ws-demo .card-title.sse { color: ${s.accent}; }
        .sse-ws-demo .card-title.ws { color: ${s.purple}; }
        .sse-ws-demo .card-badge {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .sse-ws-demo .card-badge.sse { background: ${s.accent}30; color: ${s.accent}; }
        .sse-ws-demo .card-badge.ws { background: ${s.purple}30; color: ${s.purple}; }
        .sse-ws-demo .feature-list { padding: 8px 0; }
        .sse-ws-demo .feature-row {
          display: flex;
          align-items: center;
          padding: 10px 20px;
          gap: 12px;
          transition: background 0.15s;
          cursor: default;
        }
        .sse-ws-demo .feature-row:hover { background: ${s.bg3}; }
        .sse-ws-demo .feature-label { width: 100px; font-size: 12px; color: ${s.text3}; flex-shrink: 0; }
        .sse-ws-demo .feature-value {
          flex: 1;
          font-size: 13px;
          color: ${s.text};
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sse-ws-demo .feature-icon { flex-shrink: 0; }
      `}</style>
      <div className="sse-ws-demo" style={{ maxWidth: 820, fontFamily: s.mono.split(',')[0].replace(/'/g, '') }}>
        <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
          <div className="hint-box">
            {activeHint || 'Hover over a feature row to see details'}
          </div>
          <div className="cards">
            <div 
              className="card"
              onMouseEnter={() => setHoveredCard('sse')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="card-header sse">
                <SseIcon />
                <span className="card-title sse">Server-Sent Events</span>
                <span className="card-badge sse">SSE</span>
              </div>
              <div className="feature-list">
                {features.map((f) => (
                  <div 
                    key={f.label}
                    className="feature-row"
                    onMouseEnter={() => setHoveredFeature(f.label)}
                    onMouseLeave={() => setHoveredFeature(null)}
                  >
                    <span className="feature-label">{f.label}</span>
                    <span className="feature-value">
                      <span className="feature-icon">
                        {f.sse.positive ? <CheckIcon /> : <XIcon />}
                      </span>
                      {f.sse.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div 
              className="card"
              onMouseEnter={() => setHoveredCard('ws')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="card-header ws">
                <WsIcon />
                <span className="card-title ws">WebSocket</span>
                <span className="card-badge ws">WS</span>
              </div>
              <div className="feature-list">
                {features.map((f) => (
                  <div 
                    key={f.label}
                    className="feature-row"
                    onMouseEnter={() => setHoveredFeature(f.label)}
                    onMouseLeave={() => setHoveredFeature(null)}
                  >
                    <span className="feature-label">{f.label}</span>
                    <span className="feature-value">
                      <span className="feature-icon">
                        {f.ws.positive ? <CheckIcon /> : <XIcon />}
                      </span>
                      {f.ws.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

export default SseVsWebSocketDemo
