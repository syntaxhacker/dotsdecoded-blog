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

interface Field {
  name: string
  desc: string
  args: string
}

interface SchemaType {
  name: string
  kind: string
  fields: Field[]
}

const types: SchemaType[] = [
  {
    name: 'Query', kind: 'object',
    fields: [
      { name: 'user', args: '(id: ID!)', desc: 'Fetch a single user by ID' },
      { name: 'users', args: '(limit: Int)', desc: 'Fetch a list of users' },
      { name: 'post', args: '(id: ID!)', desc: 'Fetch a single post by ID' },
      { name: 'posts', args: '(limit: Int)', desc: 'Fetch a list of posts' },
    ],
  },
  {
    name: 'User', kind: 'object',
    fields: [
      { name: 'id', args: '', desc: 'Unique identifier' },
      { name: 'name', args: '', desc: "User's display name" },
      { name: 'email', args: '', desc: "User's email address" },
      { name: 'posts', args: '(limit: Int)', desc: "User's posts" },
    ],
  },
  {
    name: 'Post', kind: 'object',
    fields: [
      { name: 'id', args: '', desc: 'Unique identifier' },
      { name: 'title', args: '', desc: 'Post title' },
      { name: 'body', args: '', desc: 'Post body content' },
      { name: 'author', args: '', desc: 'The user who wrote this' },
      { name: 'comments', args: '', desc: 'Comments on this post' },
    ],
  },
  {
    name: 'Comment', kind: 'object',
    fields: [
      { name: 'id', args: '', desc: 'Unique identifier' },
      { name: 'text', args: '', desc: 'Comment body text' },
      { name: 'author', args: '', desc: 'Who wrote this comment' },
    ],
  },
  {
    name: 'ID', kind: 'scalar',
    fields: [
      { name: 'serializes as', args: '', desc: 'String — unique identifier format' },
    ],
  },
  {
    name: 'String', kind: 'scalar',
    fields: [
      { name: 'serializes as', args: '', desc: 'UTF-8 character sequence' },
    ],
  },
  {
    name: 'Int', kind: 'scalar',
    fields: [
      { name: 'serializes as', args: '', desc: 'Signed 32-bit integer' },
    ],
  },
]

const queriesForValidation = [
  { label: 'Valid query', query: `{ user(id: "1") { name email } }`, valid: true },
  { label: 'Missing args', query: `{ user { name } }`, valid: false, error: 'Field "user" argument "id" of type "ID!" is required' },
  { label: 'Nonexistent field', query: `{ user(id: "1") { age } }`, valid: false, error: 'Cannot query field "age" on type "User"' },
  { label: 'Nested fields', query: `{ user(id: "1") { posts { title comments { text } } } }`, valid: true },
]

export default function GraphqlSchemaDemo() {
  const [activeType, setActiveType] = useState(0)
  const [validIdx, setValidIdx] = useState(0)
  const current = types[activeType]

  return (
    <DemoBoundary name="GraphQL Schema Explorer">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {types.map((t, i) => (
          <button key={t.name} onClick={() => setActiveType(i)} style={{
            background: i === activeType ? s.accent : s.bg2,
            border: `1px solid ${i === activeType ? s.accent : s.border}`,
            borderRadius: 8, padding: '8px 16px',
            color: i === activeType ? '#fff' : s.text2,
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            transition: 'all 0.15s',
          }}>
            {t.name}
            <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7, textTransform: 'uppercase' }}>{t.kind}</span>
          </button>
        ))}
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          type {current.name}
        </div>
        {current.fields.map((f) => (
          <div key={f.name} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderBottom: `1px solid ${s.border}`,
          }}>
            <div>
              <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 13 }}>{f.name}</span>
              <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 12 }}>{f.args}</span>
            </div>
            <span style={{ color: s.text2, fontSize: 12, marginLeft: 16, textAlign: 'right' }}>{f.desc}</span>
          </div>
        ))}
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontSize: 12, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Validate Query
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {queriesForValidation.map((q, i) => (
            <button key={q.label} onClick={() => setValidIdx(i)} style={{
              background: i === validIdx ? s.accent : s.bg3,
              border: `1px solid ${i === validIdx ? s.accent : s.border}`,
              borderRadius: 6, padding: '5px 10px',
              color: i === validIdx ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 11,
              transition: 'all 0.15s',
            }}>
              {q.label}
            </button>
          ))}
        </div>
        <div style={{
          background: s.bg, borderRadius: 8, padding: '12px 16px',
          fontFamily: s.mono, fontSize: 13, color: s.text, marginBottom: 10,
          whiteSpace: 'pre-wrap', lineHeight: 1.6,
        }}>
          {queriesForValidation[validIdx].query}
        </div>
        {queriesForValidation[validIdx].valid ? (
          <div style={{ color: s.green, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>PASS</span>
            <span style={{ color: s.text3, fontSize: 12 }}>Query is valid against schema</span>
          </div>
        ) : (
          <div style={{ color: s.red, fontSize: 13 }}>
            <div>FAIL</div>
            <div style={{ color: s.text2, fontSize: 12, marginTop: 2 }}>{queriesForValidation[validIdx].error}</div>
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
