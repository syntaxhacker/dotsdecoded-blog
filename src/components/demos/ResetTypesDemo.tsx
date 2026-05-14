import { useState, useEffect, useCallback, useRef } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

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
const ZONE: React.CSSProperties = { background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 14, flex: 1 }

interface FileState {
  name: string
  headVer: number
  indexVer: number
  workVer: number
}

const FILE_NAMES = ['README.md', 'main.c', 'lib.py']
const INIT_VER = 1

const makeInitialFiles = (): FileState[] =>
  FILE_NAMES.map(name => ({ name, headVer: INIT_VER, indexVer: INIT_VER, workVer: INIT_VER }))

const statusIcon = (head: number, idx: number, work: number, zone: 'head' | 'index' | 'work') => {
  if (zone === 'head') return head === idx && head === work ? s.green : s.text3
  if (zone === 'index') return idx !== head ? s.yellow : s.text3
  return work !== idx ? s.orange : s.text3
}

const statusLabel = (head: number, idx: number, work: number, zone: 'head' | 'index' | 'work') => {
  if (zone === 'head') return head === idx && head === work ? 'committed' : 'stale'
  if (zone === 'index') return idx !== head ? 'staged' : 'unchanged'
  return work !== idx ? 'modified' : 'unchanged'
}

export default function ResetTypesDemo() {
  const [files, setFiles] = useState<FileState[]>(makeInitialFiles)
  const [actionLog, setActionLog] = useState<string[]>([])
  const [animatingFile, setAnimatingFile] = useState<string | null>(null)
  const [animatingType, setAnimatingType] = useState<'soft' | 'mixed' | 'hard' | null>(null)
  const [animatingPhase, setAnimatingPhase] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [committedCount, setCommittedCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getZoneStatus = (f: FileState, zone: 'head' | 'index' | 'work') => {
    const h = f.headVer
    const i = f.indexVer
    const w = f.workVer
    if (zone === 'head') return `v${h}`
    if (zone === 'index') return i !== h ? `v${i} (staged)` : `v${i}`
    return w !== i ? `v${w} (modified)` : `v${w}`
  }

  const modifyFile = useCallback(() => {
    setFiles(prev => {
      const newFiles = prev.map(f => {
        if (f.name === 'main.c') {
          return { ...f, workVer: f.workVer + 1 }
        }
        return f
      })
      setAnimatingFile('main.c')
      setTimeout(() => setAnimatingFile(null), 400)
      return newFiles
    })
    setActionLog(prev => ['Modified main.c in working directory', ...prev].slice(0, 10))
  }, [])

  const stageFile = useCallback(() => {
    const toStage = files.find(f => f.workVer !== f.indexVer)
    if (!toStage) return
    setFiles(prev => prev.map(f => f.name === toStage.name ? { ...f, indexVer: f.workVer } : f))
    setAnimatingFile(toStage.name)
    setTimeout(() => setAnimatingFile(null), 400)
    setActionLog(prev => [`Staged ${toStage.name} (index updated)`, ...prev].slice(0, 10))
  }, [files])

  const commitFiles = useCallback(() => {
    const toCommit = files.find(f => f.indexVer !== f.headVer)
    if (!toCommit) return
    setFiles(prev => prev.map(f => f.indexVer !== f.headVer ? { ...f, headVer: f.indexVer } : f))
    setCommittedCount(prev => prev + 1)
    setActionLog(prev => ['Committed staged changes to HEAD', ...prev].slice(0, 10))
  }, [files])

  const runReset = useCallback((type: 'soft' | 'mixed' | 'hard') => {
    setAnimatingType(type)
    setAnimatingPhase(0)

    const phases = type === 'soft' ? 1 : type === 'mixed' ? 2 : 3
    intervalRef.current = setInterval(() => {
      setAnimatingPhase(prev => {
        const next = prev + 1
        if (next >= phases) {
          if (intervalRef.current) clearInterval(intervalRef.current)

          const targetVer = files[0].headVer

          if (type === 'soft') {
            setFiles(prev => prev.map(f => ({
              ...f,
              headVer: f.headVer === targetVer ? f.headVer : f.headVer,
            })))
            setActionLog(prev => [`--soft: HEAD moved to v${targetVer} (index and workdir unchanged)`, ...prev].slice(0, 10))
          } else if (type === 'mixed') {
            setFiles(prev => prev.map(f => ({
              ...f,
              headVer: f.headVer === targetVer ? f.headVer : f.headVer,
              indexVer: f.headVer,
            })))
            setActionLog(prev => [`--mixed: HEAD moved, index reset to match HEAD (workdir unchanged)`, ...prev].slice(0, 10))
          } else {
            setFiles(prev => prev.map(f => ({
              ...f,
              headVer: f.headVer === targetVer ? f.headVer : f.headVer,
              indexVer: f.headVer,
              workVer: f.headVer,
            })))
            setActionLog(prev => [`--hard: HEAD moved, index + workdir reset to match HEAD (lost uncommitted changes)`, ...prev].slice(0, 10))
          }

          setAnimatingType(null)
          setAnimatingPhase(0)
          return phases
        }
        return next
      })
    }, getStepDelay(500, speed))
  }, [files, speed])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const resetAll = () => {
    setFiles(makeInitialFiles())
    setActionLog([])
    setAnimatingFile(null)
    setAnimatingType(null)
    setAnimatingPhase(0)
    setCommittedCount(0)
  }

  const hasModifications = files.some(f => f.workVer !== f.indexVer)
  const hasStaged = files.some(f => f.indexVer !== f.headVer)

  const renderZone = (zone: 'head' | 'index' | 'work', label: string, accent: string) => {
    const zoneAnimating = (zone === 'head' && (animatingType === 'soft' || animatingType === 'mixed' || animatingType === 'hard'))
      || (zone === 'index' && (animatingType === 'mixed' || animatingType === 'hard'))
      || (zone === 'work' && animatingType === 'hard')

    const zonePhase = zone === 'head' ? 1 : zone === 'index' ? 2 : 3

    return (
      <div style={{
        ...ZONE, borderColor: zoneAnimating && animatingPhase >= zonePhase ? s.yellow : s.border,
        transition: 'border-color 0.3s',
      }}>
        <div style={{ color: accent, fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>
          {label}
        </div>
        {files.map(f => (
          <div key={f.name} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
            borderBottom: `1px solid ${s.border}`, transition: 'all 0.3s',
            opacity: animatingType && zoneAnimating && animatingPhase >= zonePhase ? 0.6 : 1,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: zone === 'head'
                ? (f.headVer === f.indexVer && f.headVer === f.workVer ? s.green : s.text3)
                : zone === 'index'
                ? (f.indexVer !== f.headVer ? s.yellow : s.text3)
                : (f.workVer !== f.indexVer ? s.orange : s.text3),
              flexShrink: 0,
            }} />
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text, flex: 1 }}>
              {f.name}
            </div>
            <div style={{
              fontFamily: s.mono, fontSize: 10, color: s.text3,
              background: animatingFile === f.name ? `${s.yellow}20` : 'transparent',
              padding: '2px 6px', borderRadius: 3, transition: 'background 0.2s',
            }}>
              {getZoneStatus(f, zone)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <DemoBoundary name="Git Reset Types">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={H}>Git Reset Types</div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          <button onClick={modifyFile} style={{
            background: s.orange, border: 'none', borderRadius: 6, padding: '7px 16px',
            color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>Modify File (main.c)</button>
          <button onClick={stageFile} disabled={!hasModifications} style={{
            background: s.yellow, border: 'none', borderRadius: 6, padding: '7px 16px',
            color: '#fff', cursor: hasModifications ? 'pointer' : 'not-allowed',
            fontSize: 12, fontWeight: 600, opacity: hasModifications ? 1 : 0.4,
          }}>Stage File</button>
          <button onClick={commitFiles} disabled={!hasStaged} style={{
            background: s.green, border: 'none', borderRadius: 6, padding: '7px 16px',
            color: '#fff', cursor: hasStaged ? 'pointer' : 'not-allowed',
            fontSize: 12, fontWeight: 600, opacity: hasStaged ? 1 : 0.4,
          }}>Commit</button>
          <button onClick={resetAll} style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6, padding: '7px 16px',
            color: s.text2, cursor: 'pointer', fontSize: 12,
          }}>Reset All</button>
        </div>

        <div style={{ marginBottom: 8 }}>
          <span style={{ color: s.text3, fontSize: 11 }}>Commits: </span>
          <span style={{ color: s.green, fontFamily: s.mono, fontSize: 13, fontWeight: 600 }}>{committedCount}</span>
          <span style={{ color: s.text3, fontSize: 11, marginLeft: 4 }}> | HEAD: v{files[0].headVer}</span>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {renderZone('head', 'HEAD (last commit)', s.green)}
          {renderZone('index', 'Staging Index', s.yellow)}
          {renderZone('work', 'Working Directory', s.orange)}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Reset Commands</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([
              { type: 'soft' as const, label: '--soft', desc: 'HEAD only', color: s.accent },
              { type: 'mixed' as const, label: '--mixed', desc: 'HEAD + Index', color: s.yellow },
              { type: 'hard' as const, label: '--hard', desc: 'HEAD + Index + Workdir', color: s.red },
            ]).map(btn => (
              <button
                key={btn.type}
                onClick={() => runReset(btn.type)}
                style={{
                  flex: 1, background: s.bg, border: `1px solid ${btn.color}`,
                  borderRadius: 8, padding: '10px 12px', cursor: 'pointer',
                  transition: 'all 0.15s',
                  opacity: animatingType ? 0.5 : 1,
                  pointerEvents: animatingType ? 'none' as const : 'auto' as const,
                }}
              >
                <div style={{ color: btn.color, fontFamily: s.mono, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                  {btn.label}
                </div>
                <div style={{ color: s.text3, fontSize: 10 }}>{btn.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {animatingType === 'hard' && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', background: `${s.red}15`,
            border: `1px solid ${s.red}`, borderRadius: 8,
          }}>
            <div style={{ color: s.red, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
              Warning: --hard is destructive
            </div>
            <div style={{ color: s.text2, fontSize: 11 }}>
              Uncommitted changes in the working directory will be permanently lost.
              Use with caution. Recover via reflog if needed.
            </div>
          </div>
        )}

        <div style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12,
          maxHeight: 120, overflowY: 'auto',
        }}>
          <div style={{ color: s.text3, fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Action Log</div>
          {actionLog.length === 0 && (
            <div style={{ color: s.text3, fontSize: 11, fontStyle: 'italic' }}>No actions yet. Modify a file to start.</div>
          )}
          {actionLog.map((log, i) => (
            <div key={i} style={{ fontFamily: s.mono, fontSize: 10, color: s.text2, padding: '2px 0', borderBottom: i < actionLog.length - 1 ? `1px solid ${s.border2}` : 'none' }}>
              {log}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Before / After Comparison</div>
          {(() => {
            const f = files[0]
            return (
              <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.8, fontFamily: s.mono }}>
                <div>HEAD: v{f.headVer}</div>
                <div>Index: v{f.indexVer}{f.indexVer !== f.headVer ? ` (diff from HEAD)` : ''}</div>
                <div>Workdir: v{f.workVer}{f.workVer !== f.indexVer ? ` (diff from Index)` : ''}</div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
