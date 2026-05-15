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
  pk?: boolean
  fk?: string
}

interface TableDef {
  name: string
  columns: Column[]
}

const tables: TableDef[] = [
  {
    name: 'users',
    columns: [
      { name: 'id', type: 'BIGINT', pk: true },
      { name: 'email', type: 'VARCHAR(255)' },
      { name: 'name', type: 'VARCHAR(255)' },
      { name: 'storage_used', type: 'BIGINT' },
      { name: 'created_at', type: 'TIMESTAMP' },
    ],
  },
  {
    name: 'files',
    columns: [
      { name: 'id', type: 'BIGINT', pk: true },
      { name: 'user_id', type: 'BIGINT', fk: 'users.id' },
      { name: 'parent_folder_id', type: 'BIGINT' },
      { name: 'name', type: 'VARCHAR(1024)' },
      { name: 'mime_type', type: 'VARCHAR(127)' },
      { name: 'is_folder', type: 'BOOLEAN' },
      { name: 'is_deleted', type: 'BOOLEAN' },
      { name: 'created_at', type: 'TIMESTAMP' },
    ],
  },
  {
    name: 'file_versions',
    columns: [
      { name: 'id', type: 'BIGINT', pk: true },
      { name: 'file_id', type: 'BIGINT', fk: 'files.id' },
      { name: 'version_num', type: 'INT' },
      { name: 'size_bytes', type: 'BIGINT' },
      { name: 'content_hash', type: 'VARCHAR(64)' },
      { name: 'chunk_count', type: 'INT' },
      { name: 'created_at', type: 'TIMESTAMP' },
    ],
  },
  {
    name: 'chunks',
    columns: [
      { name: 'id', type: 'BIGINT', pk: true },
      { name: 'sha256', type: 'CHAR(64)' },
      { name: 'size_bytes', type: 'INT' },
      { name: 'compressed_size', type: 'INT' },
      { name: 'storage_path', type: 'VARCHAR(1024)' },
      { name: 'ref_count', type: 'INT' },
    ],
  },
  {
    name: 'chunk_assignments',
    columns: [
      { name: 'version_id', type: 'BIGINT', fk: 'file_versions.id' },
      { name: 'chunk_id', type: 'BIGINT', fk: 'chunks.id' },
      { name: 'chunk_index', type: 'INT' },
    ],
  },
  {
    name: 'share_links',
    columns: [
      { name: 'id', type: 'BIGINT', pk: true },
      { name: 'file_id', type: 'BIGINT', fk: 'files.id' },
      { name: 'created_by', type: 'BIGINT', fk: 'users.id' },
      { name: 'token', type: 'VARCHAR(64)' },
      { name: 'permission', type: 'VARCHAR(16)' },
      { name: 'expires_at', type: 'TIMESTAMP' },
    ],
  },
]

const tableColors = [s.accent, s.green, s.yellow, s.purple, s.orange, s.red]

interface VersionEntry {
  version: number
  date: string
  size: string
  chunks: number
  action: string
}

const versionHistory: VersionEntry[] = [
  { version: 3, date: '2026-05-14 15:32', size: '23.0 MB', chunks: 6, action: 'Edited budget figures' },
  { version: 2, date: '2026-05-13 09:15', size: '22.1 MB', chunks: 6, action: 'Added Q2 projections' },
  { version: 1, date: '2026-05-10 11:00', size: '18.4 MB', chunks: 5, action: 'Initial upload' },
]

export default function FileMetadataDbDemo() {
  const [activeTab, setActiveTab] = useState<'schema' | 'versions'>('schema')
  const [selectedVersion, setSelectedVersion] = useState<number>(3)

  return (
    <DemoBoundary name="Metadata Database Schema">
    <div style={{
      background: s.bg, padding: '32px 24px', borderRadius: 16,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: 820, margin: '0 auto',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }}>
        Metadata Database Schema
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('schema')}
          style={{
            flex: 1, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: activeTab === 'schema' ? `${s.accent}20` : s.bg2,
            border: `1px solid ${activeTab === 'schema' ? s.accent : s.border}`,
            color: activeTab === 'schema' ? s.accent : s.text2,
          }}
        >
          Schema Diagram
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          style={{
            flex: 1, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: activeTab === 'versions' ? `${s.accent}20` : s.bg2,
            border: `1px solid ${activeTab === 'versions' ? s.accent : s.border}`,
            color: activeTab === 'versions' ? s.accent : s.text2,
          }}
        >
          Version History
        </button>
      </div>

      {activeTab === 'schema' && (
        <div>
          <p style={{ color: s.text2, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            Six tables store file metadata, version history, chunk references, and sharing data.
            The chunk table stores content hashes for deduplication.
          </p>
          <div style={{
            background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12,
            padding: 16, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tables.map((table, ti) => (
                <div key={table.name} style={{
                  background: s.bg, border: `1px solid ${tableColors[ti % tableColors.length]}40`,
                  borderRadius: 8, overflow: 'hidden',
                }}>
                  <div style={{
                    background: `${tableColors[ti % tableColors.length]}20`,
                    padding: '8px 12px', borderBottom: `1px solid ${tableColors[ti % tableColors.length]}40`,
                    color: tableColors[ti % tableColors.length], fontSize: 13, fontWeight: 600, fontFamily: s.mono,
                  }}>
                    {table.name}
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    {table.columns.map(col => (
                      <div key={col.name} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '4px 12px', fontFamily: s.mono, fontSize: 11,
                      }}>
                        <div style={{ display: 'flex', gap: 4, minWidth: 18 }}>
                          {col.pk && <span style={{ color: s.yellow, fontSize: 10 }}>PK</span>}
                          {col.fk && <span style={{ color: s.green, fontSize: 10 }}>FK</span>}
                          {!col.pk && !col.fk && <span style={{ color: 'transparent', fontSize: 10 }}>-</span>}
                        </div>
                        <span style={{ color: s.text }}>{col.name}</span>
                        <span style={{ color: s.text3 }}>{col.type}</span>
                        {col.fk && <span style={{ color: s.green, fontSize: 10 }}>{`-> ${col.fk}`}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12,
            padding: 16,
          }}>
            <div style={{ color: s.text3, fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Sample Queries
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: s.mono, fontSize: 11, color: s.text2 }}>
              <div>
                <span style={{ color: s.purple }}>-- Latest version of a file</span>
              </div>
              <div>
                {`SELECT fv.* FROM file_versions fv`}
                <br />
                {`JOIN files f ON f.id = fv.file_id`}
                <br />
                {`WHERE f.user_id = ? AND f.name = ?`}
                <br />
                {`ORDER BY fv.version_num DESC LIMIT 1`}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'versions' && (
        <div>
          <p style={{ color: s.text2, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            A file named <span style={{ color: s.text, fontFamily: s.mono }}>report_2026_q2.pdf</span> has 3 versions.
            Each version stores its own chunk list. Click a version to see its details.
          </p>

          <div style={{
            background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12,
            padding: 16, marginBottom: 16,
          }}>
            <div style={{ color: s.text3, fontSize: 11, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Version Timeline
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {versionHistory.map(v => {
                const isSelected = selectedVersion === v.version
                return (
                  <div
                    key={v.version}
                    onClick={() => setSelectedVersion(v.version)}
                    style={{
                      background: isSelected ? `${s.accent}15` : s.bg,
                      border: `1px solid ${isSelected ? s.accent : s.border}`,
                      borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 6,
                          background: isSelected ? s.accent : s.bg3,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isSelected ? '#fff' : s.text3,
                          fontSize: 11, fontWeight: 700, fontFamily: s.mono,
                        }}>
                          v{v.version}
                        </div>
                        <div>
                          <div style={{ color: s.text, fontSize: 12, fontWeight: 600 }}>{v.action}</div>
                          <div style={{ color: s.text3, fontSize: 10 }}>{v.date}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: s.text2, fontFamily: s.mono, fontSize: 11 }}>{v.size}</div>
                        <div style={{ color: s.text3, fontFamily: s.mono, fontSize: 10 }}>{v.chunks} chunks</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{
                        marginTop: 10, borderTop: `1px solid ${s.border}`, paddingTop: 10,
                        fontFamily: s.mono, fontSize: 11,
                      }}>
                        <div style={{ color: s.text3, marginBottom: 4 }}>chunks:</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {Array.from({ length: v.chunks }).map((_, ci) => (
                            <span key={ci} style={{
                              padding: '2px 6px', borderRadius: 4, background: s.bg3,
                              color: s.text2, fontSize: 10,
                            }}>
                              chunk_{ci + 1}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{
            background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 12,
            padding: 16,
          }}>
            <div style={{ color: s.text3, fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              SQL: Get Specific Version
            </div>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, lineHeight: 1.6 }}>
              {`SELECT c.sha256, c.storage_path, ca.chunk_index`}
              <br />
              {`FROM chunk_assignments ca`}
              <br />
              {`JOIN chunks c ON c.id = ca.chunk_id`}
              <br />
              {`JOIN file_versions fv ON fv.id = ca.version_id`}
              <br />
              {`WHERE fv.file_id = ? AND fv.version_num = ?`}
              <br />
              {`ORDER BY ca.chunk_index`}
            </div>
          </div>
        </div>
      )}
    </div>
    </DemoBoundary>
  )
}
