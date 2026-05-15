import { useState, useMemo, useEffect } from 'react'
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
  id: string
  path: string
  name: string
  size: string
}

interface UpperEntry {
  id: string
  path: string
  name: string
  size: string
  kind: 'new' | 'modified' | 'whiteout'
}

const lowerBase: FileEntry[] = [
  { id: 'osr', path: '/etc/os-release', name: 'os-release', size: '250 B' },
  { id: 'sh', path: '/bin/sh', name: 'sh', size: '1.2 MB' },
  { id: 'libc', path: '/usr/lib/libc.so', name: 'libc.so', size: '2.1 MB' },
  { id: 'hosts', path: '/etc/hosts', name: 'hosts', size: '200 B' },
]

const upperBase: UpperEntry[] = [
  { id: 'sp', path: '/app/server.py', name: 'server.py', size: '800 B', kind: 'new' },
  { id: 'al', path: '/var/log/app.log', name: 'app.log', size: '4.0 KB', kind: 'new' },
]

const addPool: FileEntry[] = [
  { id: 'cfg', path: '/app/config.json', name: 'config.json', size: '250 B' },
  { id: 'dcsv', path: '/app/data.csv', name: 'data.csv', size: '1.2 KB' },
  { id: 'esh', path: '/app/entry.sh', name: 'entry.sh', size: '800 B' },
]

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 16, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

export default function UnionFsDemo() {
  const [upper, setUpper] = useState<UpperEntry[]>(upperBase)
  const [nextAddIdx, setNextAddIdx] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [animPath, setAnimPath] = useState<string | null>(null)

  useEffect(() => {
    if (!animPath) return
    const t = setTimeout(() => setAnimPath(null), 700)
    return () => clearTimeout(t)
  }, [animPath])

  const merged = useMemo(() => {
    const modified = new Set(upper.filter((u) => u.kind === 'modified').map((u) => u.path))
    const whiteout = new Set(upper.filter((u) => u.kind === 'whiteout').map((u) => u.path))
    const lowerMerged = lowerBase.filter((l) => !modified.has(l.path) && !whiteout.has(l.path))
    const active = upper.filter((u) => u.kind !== 'whiteout')
    return { lowerMerged, active }
  }, [upper])

  const lowerStatus = useMemo(() => {
    const modified = new Set(upper.filter((u) => u.kind === 'modified').map((u) => u.path))
    const whiteout = new Set(upper.filter((u) => u.kind === 'whiteout').map((u) => u.path))
    return lowerBase.map((l) => ({
      ...l,
      covered: modified.has(l.path) || whiteout.has(l.path),
      isWhiteout: whiteout.has(l.path),
      isModified: modified.has(l.path),
    }))
  }, [upper])

  const canModify = lowerBase.some(
    (l) => !upper.some((u) => u.path === l.path)
  )

  const canDelete = lowerBase.some(
    (l) => !upper.some((u) => u.path === l.path)
  )

  const canAdd = nextAddIdx < addPool.length

  const handleAdd = () => {
    if (!canAdd) return
    const file = addPool[nextAddIdx]
    const entry: UpperEntry = { ...file, id: `add-${nextAddIdx}`, kind: 'new' }
    setUpper((prev) => [...prev, entry])
    setNextAddIdx((prev) => prev + 1)
    setAnimPath(file.path)
    setMessage(`Added ${file.path} to upperdir`)
  }

  const handleModify = () => {
    const avail = lowerBase.filter((l) => !upper.some((u) => u.path === l.path))
    if (avail.length === 0) return
    const file = avail[0]
    const entry: UpperEntry = { ...file, id: `mod-${file.id}`, kind: 'modified' }
    setUpper((prev) => [...prev, entry])
    setAnimPath(file.path)
    setMessage(`Copy-up: ${file.path} copied from lowerdir to upperdir and modified`)
  }

  const handleDelete = () => {
    const avail = lowerBase.filter((l) => !upper.some((u) => u.path === l.path))
    if (avail.length === 0) return
    const file = avail[0]
    const entry: UpperEntry = {
      id: `wh-${file.id}`,
      path: file.path,
      name: `.wh.${file.name}`,
      size: '0 B',
      kind: 'whiteout',
    }
    setUpper((prev) => [...prev, entry])
    setAnimPath(file.path)
    setMessage(`Whiteout: ${file.path} hidden from merged view`)
  }

  const handleReset = () => {
    setUpper(upperBase)
    setNextAddIdx(0)
    setMessage(null)
    setAnimPath(null)
  }

  const renderFileRow = (
    entry: { name: string; path: string; size: string },
    opts: { dim?: boolean; special?: string; anim?: boolean } = {}
  ) => (
    <div key={entry.path} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '5px 8px', borderRadius: 4,
      background: opts.anim ? `${s.yellow}20` : 'transparent',
      opacity: opts.dim ? 0.4 : 1,
      border: opts.anim ? `1px solid ${s.yellow}50` : '1px solid transparent',
      transition: 'all 0.3s',
      fontSize: 12, fontFamily: s.mono,
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        background: opts.special === 'whiteout' ? s.red :
          opts.special === 'modified' ? s.orange :
          opts.special === 'new' ? s.green : s.text3,
      }} />
      <span style={{
        color: opts.dim ? s.text3 : s.text,
        textDecoration: opts.special === 'whiteout' ? 'line-through' : 'none',
        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {opts.special === 'whiteout' ? `.wh.${entry.name}` : entry.name}
      </span>
      <span style={{ color: s.text3, fontSize: 10, flexShrink: 0 }}>{entry.size}</span>
    </div>
  )

  return (
    <DemoBoundary name="Union Filesystem">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Overlay2 Union Filesystem</div>
        <p style={{ color: s.text2, fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.6 }}>
          Overlay2 merges multiple directories into one view. Lowerdir is read-only (base layers).
          Upperdir is read-write (container layer). Writes use copy-on-write.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Lowerdir
              <span style={{ color: s.red, marginLeft: 6, textTransform: 'none' }}>(read-only)</span>
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 8, minHeight: 180 }}>
              {lowerStatus.map((l) => renderFileRow(l, {
                dim: l.covered,
                special: l.isWhiteout ? 'whiteout' : l.isModified ? 'modified' : undefined,
                anim: animPath === l.path && !l.isWhiteout,
              }))}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Upperdir
              <span style={{ color: s.green, marginLeft: 6, textTransform: 'none' }}>(read-write)</span>
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 8, minHeight: 180 }}>
              {upper.length === 0 && (
                <div style={{ color: s.text3, fontSize: 11, textAlign: 'center', paddingTop: 70 }}>empty</div>
              )}
              {upper.map((u) => {
                if (u.kind === 'whiteout') {
                  return renderFileRow(u, { special: 'whiteout', dim: true, anim: animPath === u.path })
                }
                return renderFileRow(u, {
                  special: u.kind,
                  anim: animPath === u.path,
                })
              })}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Merged View
              <span style={{ color: s.accent, marginLeft: 6, textTransform: 'none' }}>(container sees)</span>
            </div>
            <div style={{ background: s.bg, border: `1px solid ${s.accent}40`, borderRadius: 8, padding: 8, minHeight: 180 }}>
              {merged.lowerMerged.map((l) => renderFileRow(l, { anim: animPath === l.path }))}
              {merged.active.map((u) => renderFileRow(u, {
                special: u.kind,
                anim: animPath === u.path,
              }))}
              {merged.lowerMerged.length === 0 && merged.active.length === 0 && (
                <div style={{ color: s.text3, fontSize: 11, textAlign: 'center', paddingTop: 70 }}>empty</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleAdd} disabled={!canAdd} style={{
            background: canAdd ? s.green : s.bg3, border: 'none', borderRadius: 8,
            padding: '7px 14px', color: '#fff', cursor: canAdd ? 'pointer' : 'default',
            fontSize: 12, fontWeight: 600, opacity: canAdd ? 1 : 0.3,
          }}>Add File</button>
          <button onClick={handleModify} disabled={!canModify} style={{
            background: canModify ? s.orange : s.bg3, border: 'none', borderRadius: 8,
            padding: '7px 14px', color: '#fff', cursor: canModify ? 'pointer' : 'default',
            fontSize: 12, fontWeight: 600, opacity: canModify ? 1 : 0.3,
          }}>Modify File (Copy-Up)</button>
          <button onClick={handleDelete} disabled={!canDelete} style={{
            background: canDelete ? s.red : s.bg3, border: 'none', borderRadius: 8,
            padding: '7px 14px', color: '#fff', cursor: canDelete ? 'pointer' : 'default',
            fontSize: 12, fontWeight: 600, opacity: canDelete ? 1 : 0.3,
          }}>Delete File (Whiteout)</button>
          <button onClick={handleReset} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 8,
            padding: '7px 14px', color: s.text2, cursor: 'pointer', fontSize: 12,
          }}>Reset</button>
        </div>

        {message && (
          <div style={{
            marginTop: 12, background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 6, padding: '8px 12px', color: s.text2,
            fontFamily: s.mono, fontSize: 11, transition: 'all 0.3s',
          }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Legend</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[
              { color: s.green, label: 'New file (upperdir)' },
              { color: s.orange, label: 'Copy-up modified' },
              { color: s.red, label: 'Whiteout (deleted)' },
              { color: s.text3, label: 'Unchanged (lowerdir)' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ color: s.text3, fontSize: 11 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
