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

interface Column {
  name: string
  type: string
  constraint?: string
  description: string
  isIndex?: boolean
}

interface Table {
  name: string
  columns: Column[]
  color: string
}

const tables: Table[] = [
  {
    name: 'Users',
    color: s.accent,
    columns: [
      { name: 'id', type: 'BIGINT', constraint: 'PRIMARY KEY', description: 'Auto-incrementing unique user identifier' },
      { name: 'username', type: 'VARCHAR(30)', constraint: 'UNIQUE, NOT NULL', description: 'Public display name, used for profile URLs' },
      { name: 'email', type: 'VARCHAR(255)', constraint: 'UNIQUE, NOT NULL', description: 'Login email, used for authentication' },
      { name: 'avatar_url', type: 'VARCHAR(512)', description: 'CDN URL to profile picture (nullable)' },
      { name: 'bio', type: 'VARCHAR(150)', description: 'Profile bio text, max 150 characters' },
      { name: 'created_at', type: 'TIMESTAMP', constraint: 'DEFAULT NOW()', description: 'Account creation time' },
    ],
  },
  {
    name: 'Posts',
    color: s.green,
    columns: [
      { name: 'id', type: 'BIGINT', constraint: 'PRIMARY KEY', description: 'Unique post identifier' },
      { name: 'user_id', type: 'BIGINT', constraint: 'FK -> Users.id, NOT NULL', description: 'Author of the post', isIndex: true },
      { name: 'media_url', type: 'VARCHAR(512)', constraint: 'NOT NULL', description: 'CDN URL to the media file' },
      { name: 'media_type', type: "ENUM('photo','video')", constraint: 'NOT NULL', description: 'Type of media content' },
      { name: 'caption', type: 'TEXT', description: 'Post caption text' },
      { name: 'width', type: 'INT', description: 'Media width in pixels' },
      { name: 'height', type: 'INT', description: 'Media height in pixels' },
      { name: 'created_at', type: 'TIMESTAMP', constraint: 'DEFAULT NOW()', description: 'Post creation time, used for feed sorting', isIndex: true },
    ],
  },
  {
    name: 'Followers',
    color: s.purple,
    columns: [
      { name: 'follower_id', type: 'BIGINT', constraint: 'FK -> Users.id, PK', description: 'User who follows', isIndex: true },
      { name: 'followee_id', type: 'BIGINT', constraint: 'FK -> Users.id, PK', description: 'User being followed', isIndex: true },
      { name: 'created_at', type: 'TIMESTAMP', constraint: 'DEFAULT NOW()', description: 'When the follow relationship was created' },
    ],
  },
  {
    name: 'Likes',
    color: s.red,
    columns: [
      { name: 'user_id', type: 'BIGINT', constraint: 'FK -> Users.id, PK', description: 'User who liked the post', isIndex: true },
      { name: 'post_id', type: 'BIGINT', constraint: 'FK -> Posts.id, PK', description: 'Post that was liked', isIndex: true },
      { name: 'created_at', type: 'TIMESTAMP', constraint: 'DEFAULT NOW()', description: 'When the like was created' },
    ],
  },
  {
    name: 'Comments',
    color: s.yellow,
    columns: [
      { name: 'id', type: 'BIGINT', constraint: 'PRIMARY KEY', description: 'Unique comment identifier' },
      { name: 'post_id', type: 'BIGINT', constraint: 'FK -> Posts.id, NOT NULL', description: 'Post this comment belongs to', isIndex: true },
      { name: 'user_id', type: 'BIGINT', constraint: 'FK -> Users.id, NOT NULL', description: 'Author of the comment' },
      { name: 'parent_id', type: 'BIGINT', constraint: 'FK -> Comments.id', description: 'Parent comment for threaded replies', isIndex: true },
      { name: 'text', type: 'TEXT', constraint: 'NOT NULL', description: 'Comment body text' },
      { name: 'created_at', type: 'TIMESTAMP', constraint: 'DEFAULT NOW()', description: 'Comment creation time' },
    ],
  },
]

const relationships = [
  { from: 'Users', to: 'Posts', label: 'user_id' },
  { from: 'Users', to: 'Followers', label: 'follower_id' },
  { from: 'Users', to: 'Followers', label: 'followee_id' },
  { from: 'Users', to: 'Likes', label: 'user_id' },
  { from: 'Posts', to: 'Likes', label: 'post_id' },
  { from: 'Users', to: 'Comments', label: 'user_id' },
  { from: 'Posts', to: 'Comments', label: 'post_id' },
  { from: 'Comments', to: 'Comments', label: 'parent_id' },
]

function InstaSchemaDesignDemo() {
  const [selected, setSelected] = useState<string | null>(null)
  const selectedTable = tables.find(t => t.name === selected)

  const diagramW = 780
  const diagramH = 220

  const tablePositions: Record<string, { x: number; y: number }> = {
    Users: { x: 50, y: 30 },
    Posts: { x: 280, y: 30 },
    Followers: { x: 50, y: 140 },
    Likes: { x: 280, y: 140 },
    Comments: { x: 540, y: 85 },
  }

  const tw = 130
  const th = 50

  const lineColor = s.border2

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: s.text, padding: '16px 0' }}>
      <div style={{ background: s.bg2, borderRadius: 8, padding: 16, border: `1px solid ${s.border}`, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ fontSize: 12, color: s.text3, marginBottom: 10 }}>Click a table to inspect its columns</div>
        <svg width="100%" viewBox={`0 0 ${diagramW} ${diagramH}`} style={{ display: 'block' }}>
          {relationships.map((rel, i) => {
            const fromPos = tablePositions[rel.from]
            const toPos = tablePositions[rel.to]
            if (!fromPos || !toPos) return null
            const fx = fromPos.x + tw / 2
            const fy = fromPos.y + th / 2
            const tx = toPos.x + tw / 2
            const ty = toPos.y + th / 2

            const dx = tx - fx
            const dy = ty - fy
            const len = Math.sqrt(dx * dx + dy * dy)
            const offset = tw / 2 + 4
            const sx = fx + (dx / len) * offset
            const sy = fy + (dy / len) * offset
            const ex = tx - (dx / len) * offset
            const ey = ty - (dy / len) * offset

            const isSelfRef = rel.from === rel.to
            if (isSelfRef) return null

            return (
              <line
                key={i}
                x1={sx}
                y1={sy}
                x2={ex}
                y2={ey}
                stroke={lineColor}
                strokeWidth={1.5}
                strokeDasharray={rel.label === 'parent_id' ? '4 3' : 'none'}
              />
            )
          })}

          {tables.map((tbl) => {
            const pos = tablePositions[tbl.name]
            if (!pos) return null
            const isSelected = selected === tbl.name
            return (
              <g key={tbl.name} onClick={() => setSelected(isSelected ? null : tbl.name)} style={{ cursor: 'pointer' }}>
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={tw}
                  height={th}
                  rx={6}
                  fill={isSelected ? `${tbl.color}20` : s.bg3}
                  stroke={isSelected ? tbl.color : s.border}
                  strokeWidth={isSelected ? 2 : 1}
                />
                <text
                  x={pos.x + tw / 2}
                  y={pos.y + th / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={tbl.color}
                  fontSize={13}
                  fontWeight={600}
                  fontFamily={s.mono}
                >
                  {tbl.name}
                </text>
              </g>
            )
          })}

          {relationships.filter(r => r.from === 'Comments' && r.to === 'Comments').map((rel, i) => {
            const pos = tablePositions['Comments']
            if (!pos) return null
            return (
              <path
                key={`self-${i}`}
                d={`M ${pos.x + tw} ${pos.y + th / 2} C ${pos.x + tw + 25} ${pos.y + th / 2}, ${pos.x + tw + 25} ${pos.y - 10}, ${pos.x + tw / 2} ${pos.y}`}
                fill="none"
                stroke={lineColor}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            )
          })}
        </svg>
      </div>

      {selectedTable && (
        <div style={{ background: s.bg2, borderRadius: 8, border: `1px solid ${selectedTable.color}50`, overflow: 'hidden' }}>
          <div style={{
            padding: '10px 16px',
            borderBottom: `1px solid ${s.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: selectedTable.color,
            }} />
            <span style={{ fontFamily: s.mono, fontSize: 14, fontWeight: 600, color: selectedTable.color }}>{selectedTable.name}</span>
            <span style={{ fontSize: 11, color: s.text3 }}>{selectedTable.columns.length} columns</span>
          </div>

          {selectedTable.columns.map((col, i) => (
            <div
              key={col.name}
              style={{
                padding: '10px 16px',
                borderBottom: i < selectedTable.columns.length - 1 ? `1px solid ${s.bg3}` : 'none',
                background: col.isIndex ? `${s.yellow}08` : 'transparent',
                display: 'flex',
                gap: 12,
                alignItems: 'baseline',
              }}
            >
              <span style={{
                fontFamily: s.mono,
                fontSize: 13,
                color: col.constraint?.includes('PRIMARY') ? s.green : col.constraint?.includes('FK') ? s.accent : s.text,
                fontWeight: col.constraint?.includes('PRIMARY') ? 700 : 500,
                minWidth: 100,
              }}>
                {col.name}
              </span>
              <span style={{
                fontFamily: s.mono,
                fontSize: 11,
                color: s.purple,
                minWidth: 140,
              }}>
                {col.type}
              </span>
              {col.constraint && (
                <span style={{
                  fontFamily: s.mono,
                  fontSize: 10,
                  color: s.text3,
                  background: s.bg3,
                  padding: '2px 6px',
                  borderRadius: 3,
                  whiteSpace: 'nowrap',
                }}>
                  {col.constraint}
                </span>
              )}
              {col.isIndex && (
                <span style={{
                  fontFamily: s.mono,
                  fontSize: 10,
                  color: s.yellow,
                  background: `${s.yellow}15`,
                  padding: '2px 6px',
                  borderRadius: 3,
                  whiteSpace: 'nowrap',
                }}>
                  INDEX
                </span>
              )}
            </div>
          ))}

          <div style={{ padding: '10px 16px', borderTop: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 11, color: s.text3, fontWeight: 600, marginBottom: 6 }}>Column descriptions</div>
            {selectedTable.columns.map((col) => (
              <div key={col.name} style={{ marginBottom: 4, fontSize: 12, lineHeight: 1.5 }}>
                <span style={{ fontFamily: s.mono, color: s.text2 }}>{col.name}</span>
                <span style={{ color: s.text3 }}> -- {col.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedTable && (
        <div style={{
          background: s.bg2,
          borderRadius: 8,
          padding: '20px 16px',
          border: `1px solid ${s.border}`,
          textAlign: 'center',
          color: s.text3,
          fontSize: 13,
        }}>
          Select a table in the diagram above to view its schema, column types, constraints, and indexes.
        </div>
      )}

      <div style={{ marginTop: 12, background: s.bg2, borderRadius: 8, padding: '12px 16px', border: `1px solid ${s.border}` }}>
        <div style={{ fontSize: 11, color: s.text3, fontWeight: 600, marginBottom: 8 }}>Key Indexes</div>
        {[
          { idx: 'posts(user_id)', reason: 'Fetch all posts by a user for their profile page' },
          { idx: 'posts(created_at)', reason: 'Sort the feed by recency' },
          { idx: 'PRIMARY (follower_id, followee_id)', reason: 'Composite PK prevents duplicate follows' },
          { idx: 'PRIMARY (user_id, post_id)', reason: 'Composite PK prevents duplicate likes' },
          { idx: 'comments(post_id)', reason: 'Load all comments for a post' },
          { idx: 'comments(parent_id)', reason: 'Threaded replies under a parent comment' },
        ].map((item, i) => (
          <div key={i} style={{
            padding: '6px 10px',
            borderRadius: 4,
            background: i % 2 === 0 ? s.bg : 'transparent',
            marginBottom: 4,
            display: 'flex',
            gap: 12,
            alignItems: 'baseline',
          }}>
            <span style={{ fontFamily: s.mono, fontSize: 11, color: s.yellow, minWidth: 200 }}>{item.idx}</span>
            <span style={{ fontSize: 11, color: s.text3 }}>{item.reason}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InstaSchemaDesignDemoWrapped() {
  return (
    <DemoBoundary name="Database Schema Designer">
      <InstaSchemaDesignDemo />
    </DemoBoundary>
  )
}
