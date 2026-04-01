import { useState, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-json'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const blogPost = {
  _id: 'doc_001',
  title: 'Getting Started with NoSQL',
  author: 'Jane Developer',
  content: 'Document databases store data as flexible JSON-like documents...',
  tags: ['nosql', 'database', 'tutorial'],
  published: true,
}

const userProfile = {
  _id: 'user_042',
  name: 'Alex Chen',
  email: 'alex@example.com',
  address: { city: 'San Francisco', state: 'CA', zip: '94105' },
  preferences: { theme: 'dark', language: 'en', notifications: true },
}

const sensorReading = {
  _id: 'sensor_a7f3',
  device_id: 'TH-2847',
  timestamp: '2025-03-15T14:32:00Z',
  temperature: 23.7,
  humidity: 61,
  battery: 0.82,
  location: { lat: 37.7749, lng: -122.4194 },
}

interface DocItem {
  label: string
  icon: string
  doc: Record<string, unknown>
  color: string
}

const docs: DocItem[] = [
  { label: 'Blog Post', icon: 'B', doc: blogPost, color: s.accent },
  { label: 'User Profile', icon: 'U', doc: userProfile, color: s.purple },
  { label: 'Sensor Reading', icon: 'S', doc: sensorReading, color: s.orange },
]

function renderDoc(obj: Record<string, unknown>): React.ReactNode {
  const highlighted = useMemo(() => {
    const json = JSON.stringify(obj, null, 2)
    return Prism.highlight(json, Prism.languages.json, 'json')
  }, [obj])
  return (
    <div style={{ margin: 0, whiteSpace: 'pre', fontFamily: s.mono, fontSize: 13, lineHeight: 1.7 }}>
      <style>{`
        code .token.keyword { color: #f92672; }
        code .token.string, code .token.char, code .token.builtin, code .token.inserted { color: #e6db74; }
        code .token.number, code .token.constant, code .token.symbol, code .token.property, code .token.tag, code .token.boolean, code .token.deleted { color: #ae81ff; }
        code .token.selector, code .token.attr-name { color: #f92672; }
        code .token.attr-value, code .token.atrule { color: #e6db74; }
        code .token.function, code .token.class-name { color: #a6e22e; }
        code .token.operator, code .token.entity, code .token.url, code .token.punctuation { color: #f8f8f2; }
        code .token.comment, code .token.prolog, code .token.doctype, code .token.cdata { color: #75715e; font-style: italic; }
        code .token.parameter, code .token.variable, code .token.regex, code .token.important { color: #fd971f; }
      `}</style>
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </div>
  )
}

export default function DocumentExplorerDemo() {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {docs.map((d, i) => {
          const isOpen = expanded === i
          const fieldCount = Object.keys(d.doc).length
          const nestedKeys = Object.values(d.doc).filter(
            (v) => typeof v === 'object' && v !== null && !Array.isArray(v)
          ).length

          return (
            <div
              key={i}
              style={{
                flex: '1 1 220px',
                minWidth: 200,
                background: s.bg2,
                border: `1px solid ${isOpen ? d.color : s.border}`,
                borderRadius: 10,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onClick={() => setExpanded(isOpen ? null : i)}
            >
              <div
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: `${d.color}18`,
                    border: `1px solid ${d.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: d.color,
                    fontWeight: 700,
                    fontSize: 15,
                    fontFamily: s.mono,
                    flexShrink: 0,
                  }}
                >
                  {d.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: s.text, fontWeight: 600, fontSize: 14 }}>{d.label}</div>
                  <div style={{ color: s.text3, fontSize: 12, marginTop: 2 }}>
                    {fieldCount} fields{nestedKeys > 0 ? ` / ${nestedKeys} nested` : ''}
                  </div>
                </div>
                <div
                  style={{
                    color: s.text3,
                    fontSize: 18,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                    lineHeight: 1,
                  }}
                >
                  ▾
                </div>
              </div>

              {isOpen && (
                <div
                  style={{
                    borderTop: `1px solid ${s.border}`,
                    padding: '16px 18px',
                    background: s.bg,
                  }}
                >
                  <div style={{ color: s.text3, fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Document Structure
                  </div>
                  <div style={{ color: s.text }}>{renderDoc(d.doc)}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {expanded !== null && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 16px',
            background: `${s.yellow}0d`,
            border: `1px solid ${s.yellow}30`,
            borderRadius: 8,
            color: s.yellow,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          Notice: each document has different fields, different nesting levels, and different data types — the database accepts all of them
        </div>
      )}
    </div>
  )
}
