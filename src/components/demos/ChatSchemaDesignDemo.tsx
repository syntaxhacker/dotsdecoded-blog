import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type ColType = 'BIGSERIAL' | 'BIGINT' | 'VARCHAR(50)' | 'VARCHAR(20)' | 'VARCHAR(100)' | 'TIMESTAMP' | 'ENUM' | 'TEXT' | 'BOOLEAN' | 'SERIAL'

interface Column {
  name: string
  type: ColType
  constraint?: string
  explanation: string
}

interface Table {
  name: string
  color: string
  columns: Column[]
  highlight?: string
}

const tables: Table[] = [
  {
    name: 'Users',
    color: s.accent,
    columns: [
      { name: 'id', type: 'BIGSERIAL', constraint: 'PK', explanation: 'Auto-incrementing primary key' },
      { name: 'username', type: 'VARCHAR(50)', constraint: 'UNIQUE NOT NULL', explanation: 'Public display name, must be unique' },
      { name: 'phone', type: 'VARCHAR(20)', constraint: 'UNIQUE NOT NULL', explanation: 'Phone number for login and discovery' },
      { name: 'last_seen', type: 'TIMESTAMP', constraint: '', explanation: 'Last time user was active' },
      { name: 'online_status', type: 'ENUM', constraint: 'NOT NULL DEFAULT offline', explanation: 'online, offline, away' },
    ],
  },
  {
    name: 'Conversations',
    color: s.green,
    columns: [
      { name: 'id', type: 'BIGSERIAL', constraint: 'PK', explanation: 'Unique conversation identifier' },
      { name: 'type', type: 'ENUM', constraint: 'NOT NULL', explanation: 'direct (1:1) or group' },
      { name: 'name', type: 'VARCHAR(100)', constraint: '', explanation: 'Group name, NULL for direct chats' },
      { name: 'created_at', type: 'TIMESTAMP', constraint: 'NOT NULL DEFAULT NOW()', explanation: 'When conversation was created' },
    ],
  },
  {
    name: 'Conversation_Members',
    color: s.purple,
    columns: [
      { name: 'conversation_id', type: 'BIGINT', constraint: 'PK (composite)', explanation: 'References Conversations.id' },
      { name: 'user_id', type: 'BIGINT', constraint: 'PK (composite)', explanation: 'References Users.id' },
      { name: 'role', type: 'ENUM', constraint: 'NOT NULL DEFAULT member', explanation: 'admin, member' },
      { name: 'joined_at', type: 'TIMESTAMP', constraint: 'NOT NULL DEFAULT NOW()', explanation: 'When user joined this conversation' },
    ],
    highlight: 'Composite PK on (conversation_id, user_id) ensures a user appears at most once per conversation',
  },
  {
    name: 'Messages',
    color: s.orange,
    columns: [
      { name: 'id', type: 'BIGSERIAL', constraint: 'PK', explanation: 'Unique message identifier' },
      { name: 'conversation_id', type: 'BIGINT', constraint: 'NOT NULL', explanation: 'Which conversation this belongs to' },
      { name: 'sender_id', type: 'BIGINT', constraint: 'NOT NULL', explanation: 'Who sent the message' },
      { name: 'content', type: 'TEXT', constraint: '', explanation: 'Message text or media URL' },
      { name: 'message_type', type: 'ENUM', constraint: 'NOT NULL DEFAULT text', explanation: 'text, image, video, file' },
      { name: 'message_number', type: 'BIGINT', constraint: 'NOT NULL', explanation: 'Monotonic counter for ordering' },
      { name: 'created_at', type: 'TIMESTAMP', constraint: 'NOT NULL DEFAULT NOW()', explanation: 'Server receive timestamp' },
    ],
    highlight: 'message_number provides strict ordering. Partition by created_at for time-series queries',
  },
  {
    name: 'Read_Receipts',
    color: s.yellow,
    columns: [
      { name: 'message_id', type: 'BIGINT', constraint: 'PK (composite)', explanation: 'References Messages.id' },
      { name: 'user_id', type: 'BIGINT', constraint: 'PK (composite)', explanation: 'Which user read it' },
      { name: 'read_at', type: 'TIMESTAMP', constraint: 'NOT NULL DEFAULT NOW()', explanation: 'When the message was read' },
    ],
    highlight: 'Composite PK prevents duplicate receipts. Query by user_id to get unread count',
  },
]

interface Relationship {
  from: string
  to: string
  label: string
}

const relationships: Relationship[] = [
  { from: 'Users', to: 'Conversation_Members', label: '1 : many' },
  { from: 'Conversations', to: 'Conversation_Members', label: '1 : many' },
  { from: 'Conversations', to: 'Messages', label: '1 : many' },
  { from: 'Users', to: 'Messages', label: '1 : many' },
  { from: 'Messages', to: 'Read_Receipts', label: '1 : many' },
  { from: 'Users', to: 'Read_Receipts', label: '1 : many' },
]

const tablePositions: Record<string, { x: number; y: number }> = {
  Users: { x: 60, y: 40 },
  Conversations: { x: 370, y: 40 },
  Conversation_Members: { x: 370, y: 200 },
  Messages: { x: 60, y: 310 },
  Read_Receipts: { x: 370, y: 380 },
}

const tableWidth = 200
const tableHeight = 36

export default function ChatSchemaDesignDemo() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)

  return (
    <DemoBoundary name="Chat Schema Design">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', gap: 16 }}>
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
                fontSize: 11,
                color: s.text3,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Schema Diagram
              </div>
              <svg viewBox={-20 + ' ' + -20 + ' ' + 640 + ' ' + 480} style={{ width: '100%', display: 'block', overflow: 'hidden' }}>
                {relationships.map((rel, i) => {
                  const fp = tablePositions[rel.from]
                  const tp = tablePositions[rel.to]
                  const fx = fp.x + tableWidth / 2
                  const fy = fp.y + tableHeight / 2
                  const tx = tp.x + tableWidth / 2
                  const ty = tp.y + tableHeight / 2
                  return (
                    <g key={i}>
                      <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={s.border2} strokeWidth={1.5} strokeDasharray="4 3" />
                      <rect
                        x={(fx + tx) / 2 - 22}
                        y={(fy + ty) / 2 - 8}
                        width={44}
                        height={16}
                        rx={3}
                        fill={s.bg}
                        stroke={s.border}
                        strokeWidth={0.5}
                      />
                      <text
                        x={(fx + tx) / 2}
                        y={(fy + ty) / 2 + 4}
                        textAnchor="middle"
                        fill={s.text3}
                        fontSize={8}
                        fontFamily={s.mono}
                      >
                        {rel.label}
                      </text>
                    </g>
                  )
                })}

                {tables.map((tbl) => {
                  const pos = tablePositions[tbl.name]
                  const isSelected = selectedTable?.name === tbl.name
                  return (
                    <g key={tbl.name}>
                      <rect
                        x={pos.x}
                        y={pos.y}
                        width={tableWidth}
                        height={tableHeight}
                        rx={6}
                        fill={isSelected ? `${tbl.color}15` : s.bg2}
                        stroke={isSelected ? tbl.color : s.border}
                        strokeWidth={isSelected ? 2 : 1}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedTable(tbl)}
                      />
                      <text
                        x={pos.x + tableWidth / 2}
                        y={pos.y + tableHeight / 2 + 4}
                        textAnchor="middle"
                        fill={tbl.color}
                        fontSize={11}
                        fontWeight={700}
                        fontFamily={s.mono}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedTable(tbl)}
                      >
                        {tbl.name}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          <div style={{ width: 340, flexShrink: 0 }}>
            {selectedTable ? (
              <div style={{
                background: s.bg,
                border: `1px solid ${selectedTable.color}`,
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
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: selectedTable.color,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontFamily: s.mono, fontSize: 13, fontWeight: 700, color: selectedTable.color }}>
                    {selectedTable.name}
                  </span>
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {selectedTable.columns.map((col) => (
                    <div key={col.name} style={{
                      padding: '8px 14px',
                      borderBottom: `1px solid ${s.border}30`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontFamily: s.mono, fontSize: 11, fontWeight: 600, color: s.text }}>{col.name}</span>
                        {col.constraint && (
                          <span style={{
                            fontFamily: s.mono,
                            fontSize: 8,
                            fontWeight: 600,
                            color: col.constraint.includes('PK') ? s.yellow : s.green,
                            background: col.constraint.includes('PK') ? `${s.yellow}18` : `${s.green}18`,
                            padding: '1px 5px',
                            borderRadius: 3,
                          }}>
                            {col.constraint}
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 3 }}>{col.type}</div>
                      <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.4 }}>{col.explanation}</div>
                    </div>
                  ))}
                </div>
                {selectedTable.highlight && (
                  <div style={{
                    padding: '10px 14px',
                    background: `${s.yellow}08`,
                    borderTop: `1px solid ${s.border}`,
                    fontSize: 11,
                    color: s.yellow,
                    lineHeight: 1.4,
                  }}>
                    {selectedTable.highlight}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                padding: '40px 20px',
                textAlign: 'center',
              }}>
                <div style={{ color: s.text3, fontSize: 13 }}>Click a table to inspect columns</div>
              </div>
            )}

            <div style={{
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '12px 14px',
              marginTop: 12,
            }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Design Notes</div>
              <div style={{ fontSize: 11, color: s.text2, lineHeight: 1.6 }}>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: s.purple, fontWeight: 600 }}>Composite PKs</span> on join tables prevent duplicates without extra indexes
                </div>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: s.orange, fontWeight: 600 }}>message_number</span> is a monotonic counter per conversation, not a global sequence
                </div>
                <div>
                  <span style={{ color: s.green, fontWeight: 600 }}>Partition Messages</span> by created_at for efficient time-range queries on large tables
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoBoundary>
  )
}
