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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

const SCHEMA_COLS = [
  { field: 'id', type: 'BIGSERIAL PK', desc: 'Internal primary key' },
  { field: 'slug', type: 'VARCHAR(12) UNIQUE', desc: 'Public short identifier' },
  { field: 'title', type: 'VARCHAR(200)', desc: 'Optional paste title' },
  { field: 'content_hash', type: 'CHAR(64) INDEX', desc: 'SHA-256 of content (dedup)' },
  { field: 'content_path', type: 'VARCHAR(500)', desc: 'Object storage key or blob path' },
  { field: 'language', type: 'VARCHAR(30)', desc: 'Syntax highlight language' },
  { field: 'visibility', type: 'VARCHAR(10)', desc: 'public / unlisted / private' },
  { field: 'expiration', type: 'TIMESTAMP NULL', desc: 'TTL expiry time, NULL = never' },
  { field: 'burn_after_read', type: 'BOOLEAN', desc: 'Delete after first view' },
  { field: 'access_count', type: 'INT DEFAULT 0', desc: 'Number of views' },
  { field: 'content_size', type: 'INT', desc: 'Uncompressed content bytes' },
  { field: 'compressed_size', type: 'INT', desc: 'Compressed content bytes' },
  { field: 'created_at', type: 'TIMESTAMP', desc: 'Creation time' },
]

const contentSamples = [
  { hash: 'a3f2...8c1d', content: 'def hello(name):\n    print(f"Hello, {name}!")', size: '45 B', compressed: '38 B', deduped: false },
  { hash: 'b7e1...4a2f', content: 'const greet = (name) => {\n  return `Hello, ${name}!`;\n};', size: '64 B', compressed: '52 B', deduped: false },
  { hash: 'a3f2...8c1d', content: 'def hello(name):\n    print(f"Hello, {name}!")', size: '45 B', compressed: '38 B', deduped: true },
]

const STORAGE_TIERS = [
  { name: 'Hot', store: 'Redis / In-memory', ttl: 'Minutes-hours', access: 'Frequent reads (popular pastes)' },
  { name: 'Warm', store: 'PostgreSQL / RDBMS', ttl: 'Days-weeks', access: 'Metadata + recent pastes' },
  { name: 'Cold', store: 'S3 / Object Storage', ttl: 'Indefinite', access: 'Raw content, older pastes' },
]

export default function PasteStorageDemo() {
  const [tab, setTab] = useState<'schema' | 'dedup' | 'tiers'>('schema')

  return (
    <DemoBoundary name="Pastebin Storage Architecture">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Storage Architecture</div>

        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: `1px solid ${s.border}` }}>
          {[
            { key: 'schema' as const, label: 'Schema' },
            { key: 'dedup' as const, label: 'Deduplication' },
            { key: 'tiers' as const, label: 'Storage Tiers' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === t.key ? `2px solid ${s.accent}` : `2px solid transparent`,
                color: tab === t.key ? s.accent : s.text3,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: tab === t.key ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'schema' && (
          <>
            <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
              Metadata lives in a relational database. Content is stored separately in object storage, referenced by path.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${s.border}` }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: s.text3, fontWeight: 600 }}>Column</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: s.text3, fontWeight: 600 }}>Type</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: s.text3, fontWeight: 600 }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {SCHEMA_COLS.map((col, i) => (
                    <tr key={col.field} style={{
                      borderBottom: `1px solid ${s.bg3}`,
                      background: i % 2 === 0 ? 'transparent' : `${s.bg3}33`,
                    }}>
                      <td style={{ padding: '7px 10px', color: s.accent, fontFamily: s.mono, whiteSpace: 'nowrap' }}>{col.field}</td>
                      <td style={{ padding: '7px 10px', color: s.yellow, fontFamily: s.mono, whiteSpace: 'nowrap' }}>{col.type}</td>
                      <td style={{ padding: '7px 10px', color: s.text2 }}>{col.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'dedup' && (
          <>
            <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
              Content is hashed with SHA-256 before storage. If the hash already exists, the new paste reuses the same content blob. This saves storage when users paste identical code.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {contentSamples.map((item, i) => (
                <div key={i} style={{
                  background: s.bg,
                  border: `1px solid ${item.deduped ? s.yellow : s.border}`,
                  borderRadius: 8,
                  padding: 12,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 11 }}>{item.hash}</span>
                      {item.deduped && (
                        <span style={{ background: `${s.yellow}20`, color: s.yellow, fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
                          DUPLICATE - reused
                        </span>
                      )}
                    </div>
                    <span style={{ color: s.text3, fontSize: 11, fontFamily: s.mono }}>
                      {item.size} / {item.compressed}
                    </span>
                  </div>
                  <div style={{
                    background: s.bg2, borderRadius: 4, padding: '8px 10px',
                    color: s.text2, fontFamily: s.mono, fontSize: 11, lineHeight: 1.5,
                    whiteSpace: 'pre',
                  }}>
                    {item.content}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '10px 14px', background: `${s.yellow}10`, border: `1px solid ${s.yellow}30`, borderRadius: 8 }}>
              <div style={{ color: s.yellow, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Content-Defined Deduplication</div>
              <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.5 }}>
                When creating a paste, compute SHA-256 of the raw content. If the hash exists in the content_index table, reuse the existing content_path and increment the reference count. No new blob is stored.
              </div>
            </div>
          </>
        )}

        {tab === 'tiers' && (
          <>
            <p style={{ color: s.text2, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.6 }}>
              Pastes move through storage tiers based on access patterns. Hot data stays in memory. Cold data lives in cheap object storage.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {STORAGE_TIERS.map((tier, i) => (
                <div key={tier.name} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: 8,
                  padding: 14,
                  borderLeft: `3px solid ${i === 0 ? s.red : i === 1 ? s.yellow : s.accent}`,
                }}>
                  <div style={{ minWidth: 60 }}>
                    <span style={{
                      display: 'inline-block',
                      background: i === 0 ? `${s.red}20` : i === 1 ? `${s.yellow}20` : `${s.accent}20`,
                      color: i === 0 ? s.red : i === 1 ? s.yellow : s.accent,
                      fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 4,
                    }}>
                      {tier.name}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: s.text, fontSize: 13, fontWeight: 600 }}>{tier.store}</div>
                    <div style={{ color: s.text3, fontSize: 11, marginTop: 4 }}>TTL: {tier.ttl}</div>
                    <div style={{ color: s.text2, fontSize: 12, marginTop: 4 }}>{tier.access}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: '12px 16px', background: s.bg, borderRadius: 8, border: `1px solid ${s.border}` }}>
              <div style={{ color: s.text, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Storage Flow</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {['Content', 'Compress (gzip)', 'Encrypt (AES-256)', 'Store in S3', 'Metadata in SQL'].map((step, i) => (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      background: s.bg3, borderRadius: 6, padding: '6px 12px',
                      color: s.text2, fontSize: 11, fontFamily: s.mono, whiteSpace: 'nowrap',
                    }}>
                      {step}
                    </span>
                    {i < 4 && <span style={{ color: s.text3 }}>→</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
