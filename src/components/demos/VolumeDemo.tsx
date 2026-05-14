import { useState, useCallback } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface FileEntry {
  name: string
  location: 'writable' | 'bind' | 'volume' | 'tmpfs'
  persistent: boolean
  content: string
}

const initialFiles: FileEntry[] = [
  { name: '/app/config.json', location: 'bind', persistent: true, content: '{"debug": true}' },
  { name: '/data/db.sqlite', location: 'volume', persistent: true, content: '[SQLite data]' },
  { name: '/tmp/cache.dat', location: 'tmpfs', persistent: false, content: '[cache data]' },
  { name: '/var/log/app.log', location: 'writable', persistent: false, content: '[log output]' },
]

export default function VolumeDemo() {
  const [files, setFiles] = useState<FileEntry[]>(initialFiles)
  const [containerExists, setContainerExists] = useState(true)
  const [message, setMessage] = useState('')

  const addFile = useCallback(() => {
    const newFiles: FileEntry[] = [
      { name: '/app/config.json', location: 'bind', persistent: true, content: '{"debug": true}' },
      { name: '/data/db.sqlite', location: 'volume', persistent: true, content: '[SQLite data]' },
      { name: '/opt/output.bin', location: 'writable', persistent: false, content: '[build output]' },
      { name: '/tmp/session.dat', location: 'tmpfs', persistent: false, content: '[session state]' },
    ]
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name))
      const merged = [...prev]
      for (const f of newFiles) {
        if (!existingNames.has(f.name)) {
          merged.push(f)
        }
      }
      return merged
    })
    setMessage('Wrote files to container and mounted volumes')
    setContainerExists(true)
    setTimeout(() => setMessage(''), 2000)
  }, [])

  const deleteContainer = useCallback(() => {
    setContainerExists(false)
    const surviving = files.filter(f => f.persistent)
    setFiles(surviving.map(f => ({ ...f })))
    const lost = files.filter(f => !f.persistent)
    setMessage(`Container deleted. Lost ${lost.length} ephemeral file${lost.length > 1 ? 's' : ''} (writable layer + tmpfs). ${surviving.length} persisted.`)
    setTimeout(() => setMessage(''), 4000)
  }, [files])

  const recreateContainer = useCallback(() => {
    setContainerExists(true)
    const existing = files.filter(f => f.persistent)
    const writable: FileEntry[] = [
      { name: '/var/log/app.log', location: 'writable', persistent: false, content: '[log output - new container]' },
    ]
    const newTmpfs: FileEntry[] = [
      { name: '/tmp/cache.dat', location: 'tmpfs', persistent: false, content: '[empty cache]' },
    ]
    setFiles([...existing, ...writable, ...newTmpfs])
    setMessage('New container started. Persistent volumes remounted, writable layer recreated.')
    setTimeout(() => setMessage(''), 3000)
  }, [files])

  const locationColor: Record<string, string> = {
    writable: s.orange,
    bind: s.accent,
    volume: s.green,
    tmpfs: s.yellow,
  }

  return (
    <DemoBoundary name="Docker Volumes">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 4, letterSpacing: -0.3 }}>Docker Volumes and Data Persistence</div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
        Containers have an ephemeral writable layer. Mounted volumes persist beyond the container lifecycle.
      </p>

      {message && (
        <div style={{
          background: `${s.accent}15`, border: `1px solid ${s.accent}`, borderRadius: 8,
          padding: '8px 14px', marginBottom: 16, fontSize: 12, color: s.accent, fontFamily: s.mono,
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={addFile} style={{
          background: s.green, border: 'none', borderRadius: 8, padding: '10px 20px',
          color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          Write File
        </button>
        <button onClick={deleteContainer} style={{
          background: s.red, border: 'none', borderRadius: 8, padding: '10px 20px',
          color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          Delete Container
        </button>
        <button onClick={recreateContainer} style={{
          background: s.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
          color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          Recreate Container
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{
          flex: 1, background: s.bg2, borderRadius: 12, padding: 16,
          border: `2px solid ${containerExists ? s.purple : s.red}`,
          transition: 'border-color 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: containerExists ? s.purple : s.red }}>
              {containerExists ? 'Container (Running)' : 'Container (Deleted)'}
            </div>
            {containerExists && <div style={{ color: s.green, fontSize: 11, fontFamily: s.mono }}>UP</div>}
          </div>

          <div style={{
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: 12, minHeight: 80,
          }}>
            {containerExists ? (
              <>
                <div style={{ color: s.orange, fontSize: 12, fontFamily: s.mono, marginBottom: 4 }}>
                  / (overlay writable layer)
                </div>
                {files.filter(f => f.location === 'writable').map(f => (
                  <div key={f.name} style={{ color: s.orange, fontFamily: s.mono, fontSize: 11, padding: '2px 0 2px 12px' }}>
                    {f.name}
                  </div>
                ))}
              </>
            ) : (
              <div style={{ color: s.text3, fontSize: 12, fontStyle: 'italic' }}>
                Container removed -- writable layer destroyed
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: s.text2, marginBottom: 12 }}>Mounted Volumes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { type: 'bind', label: 'Bind Mount (/app)', color: s.accent, desc: 'Host directory mounted into container' },
            { type: 'volume', label: 'Named Volume (/data)', color: s.green, desc: 'Managed by Docker, stored on host' },
            { type: 'tmpfs', label: 'tmpfs (/tmp)', color: s.yellow, desc: 'In-memory, fast but ephemeral' },
          ].map(vt => (
            <div key={vt.type} style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12,
              borderLeft: `3px solid ${vt.color}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ color: vt.color, fontSize: 13, fontWeight: 600 }}>{vt.label}</div>
                <div style={{ fontSize: 11, color: s.text3 }}>{vt.desc}</div>
              </div>
              <div style={{ fontSize: 11, color: s.text3, marginBottom: 4 }}>
                Persists across container deletion: {vt.type === 'tmpfs' ? 'No' : 'Yes'}
              </div>
              {files.filter(f => f.location === vt.type).map(f => (
                <div key={f.name} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0',
                  fontFamily: s.mono, fontSize: 11, color: s.text,
                }}>
                  <span style={{ color: f.persistent ? s.green : s.red }}>{f.persistent ? '[P]' : '[E]'}</span>
                  {f.name}
                  <span style={{ color: s.text3, marginLeft: 'auto' }}>{f.content}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: s.bg2, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: s.text2, marginBottom: 12 }}>Lifecycle Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
          {[
            { location: 'Writable Layer', persistent: false, onDelete: 'Destroyed', color: s.orange },
            { location: 'Bind Mount', persistent: true, onDelete: 'Persists on host', color: s.accent },
            { location: 'Named Volume', persistent: true, onDelete: 'Persists in Docker area', color: s.green },
            { location: 'tmpfs', persistent: false, onDelete: 'Destroyed (in memory)', color: s.yellow },
          ].map(item => (
            <div key={item.location} style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 10,
              borderTop: `3px solid ${item.color}`,
            }}>
              <div style={{ color: item.color, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{item.location}</div>
              <div style={{ color: item.persistent ? s.green : s.red, fontSize: 11, fontFamily: s.mono }}>
                {item.persistent ? 'PERSISTS' : 'EPHEMERAL'}
              </div>
              <div style={{ color: s.text3, fontSize: 10, marginTop: 2 }}>{item.onDelete}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
