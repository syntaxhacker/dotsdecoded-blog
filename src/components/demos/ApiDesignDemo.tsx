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

type EndpointCategory = 'rest' | 'ws'

interface Endpoint {
  method: string
  path: string
  description: string
  request: string | null
  response: string | null
  category: EndpointCategory
}

const endpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/api/v1/messages',
    description: 'Send a message to a conversation',
    category: 'rest',
    request: `POST /api/v1/messages
Authorization: Bearer eyJhbG...
Content-Type: application/json

{
  "conversation_id": "conv_abc123",
  "content": "Hey, are you free tonight?",
  "type": "text"
}`,
    response: `HTTP 201 Created

{
  "id": "msg_xyz789",
  "conversation_id": "conv_abc123",
  "sender_id": "user_alice",
  "content": "Hey, are you free tonight?",
  "type": "text",
  "created_at": "2026-04-22T18:30:00Z",
  "message_number": 42
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/conversations/{id}/messages',
    description: 'Fetch message history with pagination',
    category: 'rest',
    request: `GET /api/v1/conversations/conv_abc123/messages
  ?before=msg_xyz789&limit=50
Authorization: Bearer eyJhbG...`,
    response: `HTTP 200 OK

{
  "messages": [
    {
      "id": "msg_xyz788",
      "sender_id": "user_bob",
      "content": "Sounds good!",
      "type": "text",
      "created_at": "2026-04-22T18:29:45Z"
    }
  ],
  "has_more": true,
  "next_cursor": "msg_xyz700"
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/groups',
    description: 'Create a new group conversation',
    category: 'rest',
    request: `POST /api/v1/groups
Authorization: Bearer eyJhbG...
Content-Type: application/json

{
  "name": "Project Alpha",
  "member_ids": ["user_bob", "user_carol"]
}`,
    response: `HTTP 201 Created

{
  "id": "grp_def456",
  "name": "Project Alpha",
  "type": "group",
  "created_at": "2026-04-22T18:30:00Z",
  "members": [
    {"user_id": "user_alice", "role": "admin"},
    {"user_id": "user_bob", "role": "member"},
    {"user_id": "user_carol", "role": "member"}
  ]
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/messages/{id}/read',
    description: 'Mark a message as read (read receipt)',
    category: 'rest',
    request: `POST /api/v1/messages/msg_xyz789/read
Authorization: Bearer eyJhbG...
Content-Type: application/json

{
  "read_at": "2026-04-22T18:31:00Z"
}`,
    response: `HTTP 200 OK

{
  "message_id": "msg_xyz789",
  "user_id": "user_alice",
  "read_at": "2026-04-22T18:31:00Z"
}`,
  },
  {
    method: 'WS',
    path: 'wss://api.chat.com/ws',
    description: 'WebSocket connection for real-time events',
    category: 'ws',
    request: `// Client connects:
new WebSocket('wss://api.chat.com/ws',
  { headers: { Authorization: 'Bearer ...' } }
)`,
    response: `// Server sends on connect:
{
  "type": "connection_established",
  "user_id": "user_alice",
  "online_users": 142
}`,
  },
  {
    method: 'EVT',
    path: 'message:new',
    description: 'Incoming message event (server -> client)',
    category: 'ws',
    request: null,
    response: `{
  "type": "message:new",
  "data": {
    "id": "msg_xyz789",
    "conversation_id": "conv_abc123",
    "sender_id": "user_bob",
    "content": "Hey, are you free tonight?",
    "created_at": "2026-04-22T18:30:00Z"
  }
}`,
  },
  {
    method: 'EVT',
    path: 'typing:start',
    description: 'Typing indicator event',
    category: 'ws',
    request: `// Client sends:
{
  "type": "typing:start",
  "conversation_id": "conv_abc123"
}`,
    response: `// Other participants receive:
{
  "type": "typing:start",
  "user_id": "user_bob",
  "conversation_id": "conv_abc123"
}`,
  },
  {
    method: 'EVT',
    path: 'presence:update',
    description: 'Online/offline status change',
    category: 'ws',
    request: null,
    response: `{
  "type": "presence:update",
  "data": {
    "user_id": "user_bob",
    "status": "online",
    "last_seen": "2026-04-22T18:30:00Z"
  }
}`,
  },
  {
    method: 'EVT',
    path: 'message:read',
    description: 'Read receipt event (server -> client)',
    category: 'ws',
    request: null,
    response: `{
  "type": "message:read",
  "data": {
    "message_id": "msg_xyz789",
    "user_id": "user_alice",
    "read_at": "2026-04-22T18:31:00Z"
  }
}`,
  },
]

const methodColor: Record<string, string> = {
  GET: s.green,
  POST: s.accent,
  PUT: s.orange,
  DELETE: s.red,
  WS: s.purple,
  EVT: s.yellow,
}

export default function ApiDesignDemo() {
  const [selected, setSelected] = useState<number | null>(null)
  const [filter, setFilter] = useState<EndpointCategory | 'all'>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return endpoints
    return endpoints.filter((ep) => ep.category === filter)
  }, [filter])

  const active = selected !== null ? filtered[selected] : null

  return (
    <DemoBoundary name="API Explorer">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['all', 'rest', 'ws'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setSelected(null) }}
              style={{
                padding: '4px 14px',
                background: filter === f ? s.bg3 : s.bg2,
                border: `1px solid ${filter === f ? s.border2 : s.border}`,
                borderRadius: 6,
                color: filter === f ? s.text : s.text3,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f === 'all' ? 'All' : f === 'rest' ? 'REST' : 'WebSocket'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
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
                fontFamily: s.mono,
                fontSize: 10,
                color: s.text3,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Endpoints ({filtered.length})
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {filtered.map((ep, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '10px 14px',
                      background: selected === i ? `${s.accent}10` : 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${s.border}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{
                      fontFamily: s.mono,
                      fontSize: 10,
                      fontWeight: 700,
                      color: methodColor[ep.method],
                      flexShrink: 0,
                      width: 38,
                    }}>
                      {ep.method}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontFamily: s.mono,
                        fontSize: 11,
                        color: selected === i ? s.text : s.text2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {ep.path}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: s.text3,
                        marginTop: 2,
                      }}>
                        {ep.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ width: 420, flexShrink: 0 }}>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
              position: 'sticky',
              top: 0,
            }}>
              <div style={{
                padding: '8px 14px',
                borderBottom: `1px solid ${s.border}`,
                fontFamily: s.mono,
                fontSize: 10,
                color: s.text3,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {active ? `${active.method} ${active.path}` : 'Select an endpoint'}
              </div>
              <div style={{ padding: 14, minHeight: 360 }}>
                {!active && (
                  <div style={{ color: s.text3, fontSize: 12, textAlign: 'center', paddingTop: 80 }}>
                    Click an endpoint to see request/response
                  </div>
                )}
                {active && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.5 }}>
                      {active.description}
                    </div>
                    {active.request && (
                      <CodeBlock label="Request" code={active.request} />
                    )}
                    {active.response && (
                      <CodeBlock label="Response" code={active.response} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div>
      <div style={{
        fontFamily: s.mono,
        fontSize: 9,
        color: s.text3,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        background: s.bg2,
        border: `1px solid ${s.border}`,
        borderRadius: 6,
        padding: '10px 12px',
        fontFamily: s.mono,
        fontSize: 10,
        lineHeight: 1.6,
        color: s.text2,
        whiteSpace: 'pre',
        overflow: 'auto',
        maxHeight: 220,
      }}>
        {code}
      </div>
    </div>
  )
}
