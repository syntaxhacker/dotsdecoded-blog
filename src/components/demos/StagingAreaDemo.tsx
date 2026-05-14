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

type Status = 'committed' | 'modified' | 'staged' | 'untracked'

interface FileItem {
  name: string
  status: Status
}

const INITIAL_FILES: FileItem[] = [
  { name: 'index.html', status: 'committed' },
  { name: 'style.css', status: 'committed' },
  { name: 'app.js', status: 'committed' },
  { name: 'README.md', status: 'committed' },
]

type Phase = 'idle' | 'anim-working' | 'anim-staging' | 'anim-repo'

export default function StagingAreaDemo() {
  const [files, setFiles] = useState<FileItem[]>(INITIAL_FILES.map(f => ({...f})))
  const [phase, setPhase] = useState<Phase>('idle')
  const [animFile, setAnimFile] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<string | null>(null)

  const modifyFile = useCallback((name: string) => {
    setFiles(prev => prev.map(f => f.name === name && (f.status === 'committed' || f.status === 'staged')
      ? { ...f, status: 'modified' } : f
    ))
    setPhase('anim-working')
    setAnimFile(name)
    setTimeout(() => { setPhase('idle'); setAnimFile(null) }, 400)
    setLastAction(`modified ${name}`)
  }, [])

  const gitAddFile = useCallback((name: string) => {
    const file = files.find(f => f.name === name)
    if (!file || file.status !== 'modified') return
    setAnimFile(name)
    setPhase('anim-staging')
    setTimeout(() => {
      setFiles(prev => prev.map(f => f.name === name ? { ...f, status: 'staged' } : f))
      setPhase('idle')
      setAnimFile(null)
      setLastAction(`git add ${name}`)
    }, 400)
  }, [files])

  const gitAddAll = useCallback(() => {
    const modified = files.filter(f => f.status === 'modified')
    if (modified.length === 0) return
    setAnimFile('ALL')
    setPhase('anim-staging')
    setTimeout(() => {
      setFiles(prev => prev.map(f => f.status === 'modified' ? { ...f, status: 'staged' } : f))
      setPhase('idle')
      setAnimFile(null)
      setLastAction('git add .')
    }, 500)
  }, [files])

  const gitCommit = useCallback(() => {
    const staged = files.filter(f => f.status === 'staged')
    if (staged.length === 0) return
    setAnimFile('ALL')
    setPhase('anim-repo')
    setTimeout(() => {
      setFiles(prev => prev.map(f => f.status === 'staged' ? { ...f, status: 'committed' } : f))
      setPhase('idle')
      setAnimFile(null)
      setLastAction('git commit')
    }, 500)
  }, [files])

  const gitReset = useCallback((name: string) => {
    const file = files.find(f => f.name === name)
    if (!file || file.status !== 'staged') return
    setAnimFile(name)
    setPhase('anim-working')
    setTimeout(() => {
      setFiles(prev => prev.map(f => f.name === name ? { ...f, status: 'modified' } : f))
      setPhase('idle')
      setAnimFile(null)
      setLastAction(`git reset ${name}`)
    }, 400)
  }, [files])

  const gitCheckout = useCallback((name: string) => {
    const file = files.find(f => f.name === name)
    if (!file || file.status !== 'modified') return
    setAnimFile(name)
    setPhase('anim-working')
    setTimeout(() => {
      setFiles(prev => prev.map(f => f.name === name ? { ...f, status: 'committed' } : f))
      setPhase('idle')
      setAnimFile(null)
      setLastAction(`git checkout -- ${name}`)
    }, 400)
  }, [files])

  const reset = useCallback(() => {
    setFiles(INITIAL_FILES.map(f => ({...f})))
    setPhase('idle')
    setAnimFile(null)
    setLastAction(null)
  }, [])

  const statusColors: Record<Status, string> = {
    committed: s.green,
    modified: s.red,
    staged: s.yellow,
    untracked: s.text3,
  }

  const statusLabels: Record<Status, string> = {
    committed: 'committed',
    modified: 'modified',
    staged: 'staged',
    untracked: 'untracked',
  }

  const stagedCount = files.filter(f => f.status === 'staged').length
  const unstagedCount = files.filter(f => f.status === 'modified' || f.status === 'untracked').length
  const committedCount = files.filter(f => f.status === 'committed').length
  const modifiedCount = files.filter(f => f.status === 'modified').length

  const renderArea = (
    label: string,
    color: string,
    icon: string,
    statuses: Status[],
    glow: boolean,
  ) => {
    const areaFiles = files.filter(f => statuses.includes(f.status))
    return (
      <div style={{
        flex: 1, minWidth: 0,
        background: s.bg2, borderRadius: 10,
        border: `1px solid ${glow ? color : s.border}`,
        overflow: 'hidden',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        boxShadow: glow ? `0 0 12px ${color}30` : 'none',
      }}>
        <div style={{
          padding: '10px 14px', borderBottom: `1px solid ${s.border}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: s.text }}>{label}</span>
          <span style={{
            fontSize: 10, fontFamily: s.mono, color: s.text3,
            marginLeft: 'auto', background: s.bg3, padding: '1px 6px', borderRadius: 4,
          }}>
            {areaFiles.length} file{areaFiles.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ padding: '4px 0' }}>
          {areaFiles.map(f => {
            const isAnim = animFile === f.name || animFile === 'ALL'
            return (
              <div key={f.name} style={{
                padding: '8px 14px',
                display: 'flex', alignItems: 'center', gap: 8,
                background: isAnim ? `${color}15` : 'transparent',
                borderLeft: `3px solid ${isAnim ? color : 'transparent'}`,
                transition: 'all 0.3s ease',
              }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"
                    stroke={color} strokeWidth="1.4" fill="none"/>
                  <path d="M10 2v3h3" stroke={color} strokeWidth="1.4" fill="none"/>
                </svg>
                <span style={{
                  fontSize: 12.5, fontFamily: s.mono, color: s.text2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {f.name}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                  color: statusColors[f.status],
                  background: `${statusColors[f.status]}18`,
                  padding: '1px 6px', borderRadius: 3,
                  marginLeft: 'auto', fontFamily: s.mono,
                  letterSpacing: 0.3,
                }}>
                  {statusLabels[f.status]}
                </span>
              </div>
            )
          })}
          {areaFiles.length === 0 && (
            <div style={{ padding: '16px 14px', textAlign: 'center', color: s.text3, fontSize: 12 }}>
              no files
            </div>
          )}
        </div>
      </div>
    )
  }

  const Btn = ({ label, onClick, bg, color, disabled }: { label: string; onClick: () => void; bg?: string; color?: string; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? s.bg3 : (bg || s.accent),
      color: disabled ? s.text3 : (color || (bg === s.yellow || bg === s.green || bg === s.red ? s.bg : '#fff')),
      border: 'none', borderRadius: 6, padding: '6px 14px',
      cursor: disabled ? 'default' : 'pointer',
      fontSize: 12, fontWeight: 600, fontFamily: s.mono,
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}>{label}</button>
  )

  return (
    <DemoBoundary name="Staging Area">
    <div style={{
      maxWidth: 820, margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        display: 'flex', gap: 10, marginBottom: 16, alignItems: 'stretch',
      }}>
        {renderArea('Working Directory', s.red, 'W',
          ['modified', 'untracked'],
          phase === 'anim-working')}
        {renderArea('Staging Area', s.yellow, 'S',
          ['staged'],
          phase === 'anim-staging')}
        {renderArea('Repository', s.green, 'R',
          ['committed'],
          phase === 'anim-repo')}
      </div>

      <div style={{
        display: 'flex', gap: 10, marginBottom: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{
          background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`,
          padding: '10px 14px', display: 'flex', gap: 16,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.green, fontFamily: s.mono }}>{committedCount}</div>
            <div style={{ fontSize: 10, color: s.text3 }}>committed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.yellow, fontFamily: s.mono }}>{stagedCount}</div>
            <div style={{ fontSize: 10, color: s.text3 }}>staged</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.red, fontFamily: s.mono }}>{unstagedCount}</div>
            <div style={{ fontSize: 10, color: s.text3 }}>unstaged</div>
          </div>
        </div>
      </div>

      <div style={{
        background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`, padding: 14, marginBottom: 12,
      }}>
        <div style={{ fontSize: 11, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          click a file below to modify it
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {files.filter(f => f.status !== 'untracked').map(f => (
            <Btn key={'mod-'+f.name}
              label={`edit ${f.name}`}
              onClick={() => modifyFile(f.name)}
              bg={s.bg3}
              disabled={f.status === 'modified'}
            />
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Btn label="git add <file>" onClick={() => {
            const mod = files.find(f => f.status === 'modified')
            if (mod) gitAddFile(mod.name)
          }} bg={s.yellow} color={s.bg} disabled={modifiedCount === 0} />
          <Btn label="git add ." onClick={gitAddAll} bg={s.yellow} color={s.bg} disabled={modifiedCount === 0} />
          <Btn label="git commit" onClick={gitCommit} bg={s.green} color={s.bg} disabled={stagedCount === 0} />
          <Btn label="git reset <file>" onClick={() => {
            const st = files.find(f => f.status === 'staged')
            if (st) gitReset(st.name)
          }} bg={s.orange} color={s.bg} disabled={stagedCount === 0} />
          <Btn label="git checkout -- <file>" onClick={() => {
            const mod = files.find(f => f.status === 'modified')
            if (mod) gitCheckout(mod.name)
          }} bg={s.red} color={s.bg} disabled={modifiedCount === 0} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.red }} />
            <span style={{ fontSize: 11, color: s.text3 }}>modified</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.yellow }} />
            <span style={{ fontSize: 11, color: s.text3 }}>staged</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.green }} />
            <span style={{ fontSize: 11, color: s.text3 }}>committed</span>
          </div>
        </div>
        <button onClick={reset} style={{
          background: 'transparent', border: `1px solid ${s.border}`, borderRadius: 6,
          padding: '5px 14px', color: s.text3, cursor: 'pointer', fontSize: 12,
        }}>
          Reset
        </button>
      </div>

      {lastAction && (
        <div style={{
          marginTop: 10, padding: '8px 14px', background: `${s.accent}10`,
          border: `1px solid ${s.accent}30`, borderRadius: 8,
          fontFamily: s.mono, fontSize: 12, color: s.accent,
        }}>
          {'>'} {lastAction}
        </div>
      )}
    </div>
    </DemoBoundary>
  )
}
