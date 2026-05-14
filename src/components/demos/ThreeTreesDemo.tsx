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
  hash: string
}

const INITIAL_FILES: FileEntry[] = [
  { name: 'index.html', hash: 'a1b2c3d' },
  { name: 'style.css', hash: 'e4f5g6h' },
  { name: 'app.js', hash: 'i7j8k9l' },
]

const EDITED_HASHES: Record<string, string> = {
  'index.html': 'm0n1o2p',
  'style.css': 'q3r4s5t',
}

export default function ThreeTreesDemo() {
  const [working, setWorking] = useState<FileEntry[]>(INITIAL_FILES.map(f => ({...f})))
  const [staging, setStaging] = useState<FileEntry[]>(INITIAL_FILES.map(f => ({...f})))
  const [head, setHead] = useState<FileEntry[]>(INITIAL_FILES.map(f => ({...f})))
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [animFrom, setAnimFrom] = useState<string | null>(null)
  const [animTo, setAnimTo] = useState<string | null>(null)
  const [animFile, setAnimFile] = useState<string | null>(null)

  const editFile = useCallback((name: string) => {
    const newHash = EDITED_HASHES[name]
    if (!newHash) return
    setWorking(prev => prev.map(f => f.name === name ? { ...f, hash: newHash } : f))
    setActiveFile(name)
    setAnimFile(name)
    setTimeout(() => setAnimFile(null), 400)
    setLastAction(`edited ${name}`)
  }, [])

  const gitAdd = useCallback((name: string) => {
    const wf = working.find(f => f.name === name)
    if (!wf) return
    setAnimFrom('working')
    setAnimTo('staging')
    setAnimFile(name)
    setTimeout(() => {
      setStaging(prev => prev.map(f => f.name === name ? { ...wf } : f))
      setAnimFrom(null)
      setAnimTo(null)
      setAnimFile(null)
      setLastAction(`git add ${name}`)
    }, 400)
  }, [working])

  const gitAddAll = useCallback(() => {
    setAnimFrom('working')
    setAnimTo('staging')
    setAnimFile('ALL')
    setTimeout(() => {
      setStaging(working.map(f => ({...f})))
      setAnimFrom(null)
      setAnimTo(null)
      setAnimFile(null)
      setLastAction('git add .')
    }, 400)
  }, [working])

  const gitCommit = useCallback(() => {
    const changed = staging.filter(s => {
      const h = head.find(hd => hd.name === s.name)
      return !h || h.hash !== s.hash
    })
    if (changed.length === 0) return
    setAnimFrom('staging')
    setAnimTo('head')
    setAnimFile('ALL')
    setTimeout(() => {
      setHead(staging.map(f => ({...f})))
      setAnimFrom(null)
      setAnimTo(null)
      setAnimFile(null)
      setLastAction('git commit')
    }, 400)
  }, [staging, head])

  const gitReset = useCallback((name: string) => {
    const hf = head.find(f => f.name === name)
    if (!hf) return
    setAnimFrom('head')
    setAnimTo('staging')
    setAnimFile(name)
    setTimeout(() => {
      setStaging(prev => prev.map(f => f.name === name ? { ...hf } : f))
      setAnimFrom(null)
      setAnimTo(null)
      setAnimFile(null)
      setLastAction(`git reset HEAD ${name}`)
    }, 400)
  }, [head])

  const gitCheckout = useCallback((name: string) => {
    const sf = staging.find(f => f.name === name)
    if (!sf) return
    setAnimFrom('staging')
    setAnimTo('working')
    setAnimFile(name)
    setTimeout(() => {
      setWorking(prev => prev.map(f => f.name === name ? { ...sf } : f))
      setAnimFrom(null)
      setAnimTo(null)
      setAnimFile(null)
      setLastAction(`git checkout -- ${name}`)
    }, 400)
  }, [staging])

  const resetAll = useCallback(() => {
    setWorking(INITIAL_FILES.map(f => ({...f})))
    setStaging(INITIAL_FILES.map(f => ({...f})))
    setHead(INITIAL_FILES.map(f => ({...f})))
    setActiveFile(null)
    setLastAction(null)
    setAnimFrom(null)
    setAnimTo(null)
    setAnimFile(null)
  }, [])

  const isEdited = (name: string) => {
    const wf = working.find(f => f.name === name)
    const sf = staging.find(f => f.name === name)
    return wf && sf && wf.hash !== sf.hash
  }

  const isStaged = (name: string) => {
    const sf = staging.find(f => f.name === name)
    const hf = head.find(f => f.name === name)
    return sf && hf && sf.hash !== hf.hash
  }

  const getStatus = (name: string): string | null => {
    if (isEdited(name)) return 'modified'
    if (isStaged(name)) return 'staged'
    return null
  }

  const renderColumn = (
    title: string,
    files: FileEntry[],
    baseline: FileEntry[],
    accent: string,
    colKey: string,
    clickFile?: (name: string) => void
  ) => (
    <div style={{
      flex: 1, minWidth: 0,
      background: s.bg2, borderRadius: 10,
      border: `1px solid ${s.border}`, overflow: 'hidden',
      transition: 'border-color 0.3s ease',
      borderColor: animTo === colKey ? s.accent : animFrom === colKey ? s.orange : s.border,
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${s.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: s.text }}>{title}</span>
      </div>
      <div style={{ padding: '4px 0' }}>
        {files.map(f => {
          const blFile = baseline.find(b => b.name === f.name)
          const isSame = blFile && blFile.hash === f.hash
          const isActive = activeFile === f.name
          const isAnim = animFile === f.name || animFile === 'ALL'
          const status = getStatus(f.name)
          return (
            <div
              key={f.name}
              onClick={() => clickFile?.(f.name)}
              style={{
                padding: '8px 14px',
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: clickFile ? 'pointer' : 'default',
                background: isAnim ? `${s.accent}15` : isActive ? `${s.orange}08` : 'transparent',
                borderLeft: `3px solid ${isAnim ? s.accent : status === 'modified' ? s.yellow : status === 'staged' ? s.accent : 'transparent'}`,
                transition: 'all 0.3s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"
                  stroke={isSame ? s.green : s.yellow} strokeWidth="1.4" fill="none"/>
                <path d="M10 2v3h3"
                  stroke={isSame ? s.green : s.yellow} strokeWidth="1.4" fill="none"/>
              </svg>
              <span style={{
                fontSize: 12.5, fontFamily: s.mono, color: s.text2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {f.name}
              </span>
              <span style={{
                fontSize: 10, fontFamily: s.mono,
                color: isSame ? s.green : s.yellow,
                marginLeft: 'auto',
                background: isSame ? `${s.green}15` : `${s.yellow}15`,
                padding: '1px 6px', borderRadius: 3,
              }}>
                {f.hash}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )

  const Btn = ({ label, onClick, bg, disabled }: { label: string; onClick: () => void; bg?: string; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? s.bg3 : (bg || s.accent),
      border: 'none', borderRadius: 6, padding: '6px 14px',
      color: disabled ? s.text3 : (bg === s.yellow || bg === s.green || bg === s.orange || bg === s.red ? s.bg : '#fff'),
      cursor: disabled ? 'default' : 'pointer',
      fontSize: 12, fontWeight: 600, fontFamily: s.mono,
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.15s',
    }}>{label}</button>
  )

  return (
    <DemoBoundary name="The Three Trees">
    <div style={{
      maxWidth: 820, margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'stretch' }}>
        {renderColumn('Working Directory', working, head, s.yellow, 'working', editFile)}
        {renderColumn('Staging Index', staging, head, s.accent, 'staging')}
        {renderColumn('HEAD', head, head, s.green, 'head')}
      </div>

      <div style={{
        background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, padding: 14, marginBottom: 12,
      }}>
        <div style={{ fontSize: 11, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          click a file in Working Directory to edit it
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {working.map(f => (
            <Btn key={f.name} label={`EDIT ${f.name}`} onClick={() => editFile(f.name)}
              bg={activeFile === f.name ? s.yellow : s.bg3} />
          ))}
        </div>
        <div style={{
          borderTop: `1px solid ${s.border}`, marginTop: 10, paddingTop: 10,
          display: 'flex', flexWrap: 'wrap', gap: 6,
        }}>
          <Btn label={`git add ${activeFile || '<file>'}`} onClick={() => activeFile && gitAdd(activeFile)}
            bg={s.yellow} disabled={!activeFile} />
          <Btn label="git add ." onClick={gitAddAll} bg={s.yellow} />
          <Btn label="git commit" onClick={gitCommit} bg={s.green} />
          <Btn label={`git reset HEAD ${activeFile || '<file>'}`} onClick={() => activeFile && gitReset(activeFile)}
            bg={s.orange} disabled={!activeFile} />
          <Btn label={`git checkout -- ${activeFile || '<file>'}`} onClick={() => activeFile && gitCheckout(activeFile)}
            bg={s.red} disabled={!activeFile} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.green }} />
            <span style={{ fontSize: 11, color: s.text3 }}>same hash</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.yellow }} />
            <span style={{ fontSize: 11, color: s.text3 }}>different hash (modified)</span>
          </div>
        </div>
        <button onClick={resetAll} style={{
          background: 'transparent', border: `1px solid ${s.border}`, borderRadius: 6,
          padding: '5px 14px', color: s.text3, cursor: 'pointer', fontSize: 12,
        }}>
          Reset All
        </button>
      </div>

      {lastAction && (
        <div style={{
          marginTop: 10, padding: '8px 14px', background: `${s.accent}10`,
          border: `1px solid ${s.accent}30`, borderRadius: 8, fontFamily: s.mono, fontSize: 12,
          color: s.accent,
        }}>
          {'>'} {lastAction}
        </div>
      )}
    </div>
    </DemoBoundary>
  )
}
