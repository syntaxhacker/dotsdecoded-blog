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

interface CommitNode {
  id: string
  label: string
  branch: 'main' | 'feature' | 'replay'
  parent: string | null
}

const initialCommits: CommitNode[] = [
  { id: 'base', label: 'Base', branch: 'main', parent: null },
  { id: 'm1', label: 'M1', branch: 'main', parent: 'base' },
  { id: 'm2', label: 'M2', branch: 'main', parent: 'm1' },
  { id: 'm3', label: 'M3', branch: 'main', parent: 'm2' },
  { id: 'f1', label: 'F1', branch: 'feature', parent: 'base' },
  { id: 'f2', label: 'F2', branch: 'feature', parent: 'f1' },
]

const shortHash = (label: string) => {
  const h = { Base: 'a1b2c3d', M1: 'b2c3d4e', M2: 'c3d4e5f', M3: 'd4e5f6g', F1: 'e5f6g7h', F2: 'f6g7h8i', "F1'": 'x1y2z3a', "F2'": 'x2y3z4b' }
  return (h as Record<string, string>)[label] || '0000000'
}

interface ReorderItem {
  id: string
  label: string
  skipped: boolean
}

export default function RebaseDemo() {
  const [view, setView] = useState<'before' | 'animating' | 'after'>('before')
  const [speed, setSpeed] = useState(1)
  const [animStep, setAnimStep] = useState(0)
  const [interactive, setInteractive] = useState(false)
  const [reorderList, setReorderList] = useState<ReorderItem[]>([
    { id: 'f1', label: 'F1', skipped: false },
    { id: 'f2', label: 'F2', skipped: false },
  ])
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const replayCount = reorderList.filter(item => !item.skipped).length

  const startRebase = useCallback(() => {
    setView('animating')
    setAnimStep(0)
  }, [])

  useEffect(() => {
    if (view !== 'animating') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }
    const maxSteps = 4 + replayCount
    intervalRef.current = setInterval(() => {
      setAnimStep(prev => {
        const next = prev + 1
        if (next >= maxSteps) {
          setView('after')
          return maxSteps
        }
        return next
      })
    }, getStepDelay(600, speed))
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [view, speed, replayCount])

  const reset = () => {
    setView('before')
    setAnimStep(0)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const toggleSkip = (id: string) => {
    setReorderList(prev => prev.map(item => item.id === id ? { ...item, skipped: !item.skipped } : item))
  }

  const handleDragStart = (idx: number) => setDragIdx(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    setReorderList(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(idx, 0, moved)
      return next
    })
    setDragIdx(idx)
  }
  const handleDragEnd = () => setDragIdx(null)

  const mainCommits = initialCommits.filter(c => c.branch === 'main')
  const featureCommits = initialCommits.filter(c => c.branch === 'feature')

  const renderCommit = (c: CommitNode, offsetY: number, animOffsetX: number = 0, animOpacity: number = 1, isReplay: boolean = false) => (
    <div key={c.id} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      transform: `translateX(${animOffsetX}px)`,
      opacity: animOpacity,
      transition: 'all 0.5s ease',
    }}>
      <div style={{
        width: 14, height: 14, borderRadius: '50%',
        background: c.branch === 'replay' ? s.purple : c.branch === 'feature' ? s.green : s.accent,
        border: `3px solid ${isReplay ? s.purple : c.branch === 'feature' ? s.green : s.accent}`,
        flexShrink: 0,
      }} />
      <div style={{
        background: s.bg3, border: `1px solid ${isReplay ? s.purple : s.border}`,
        borderRadius: 6, padding: '4px 10px',
        fontFamily: s.mono, fontSize: 12, color: s.text,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>{c.label}</span>
        <span style={{ color: s.text3, fontSize: 10 }}>
          {shortHash(c.label)}
        </span>
        {isReplay && (
          <span style={{ color: s.purple, fontSize: 10, fontWeight: 600 }}>'</span>
        )}
      </div>
    </div>
  )

  const renderBeforeView = () => (
    <div style={{ display: 'flex', gap: 60, justifyContent: 'center', padding: '20px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
        <div style={{ color: s.accent, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>main</div>
        {mainCommits.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <div style={{ width: 0, height: 16, borderLeft: `2px solid ${s.border}`, marginLeft: 7 }} />}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginLeft: i === 0 ? 0 : 0,
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: s.accent, border: `2px solid ${s.accent}`,
              }} />
              <div style={{
                background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 5, padding: '3px 8px',
                fontFamily: s.mono, fontSize: 11, color: s.text,
              }}>
                {c.label}
                <span style={{ color: s.text3, fontSize: 9, marginLeft: 6 }}>{shortHash(c.label)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
        <div style={{ color: s.green, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>feature</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 0, height: 44, borderLeft: `2px dashed ${s.green}`, marginLeft: 7 }} />
        </div>
        {featureCommits.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <div style={{ width: 0, height: 16, borderLeft: `2px solid ${s.green}`, marginLeft: 7 }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: s.green, border: `2px solid ${s.green}`,
              }} />
              <div style={{
                background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 5, padding: '3px 8px',
                fontFamily: s.mono, fontSize: 11, color: s.text,
              }}>
                {c.label}
                <span style={{ color: s.text3, fontSize: 9, marginLeft: 6 }}>{shortHash(c.label)}</span>
              </div>
            </div>
          </div>
        ))}
        <div style={{
          marginTop: 8, padding: '6px 10px', background: `${s.green}15`,
          border: `1px solid ${s.green}`, borderRadius: 6, fontSize: 11, color: s.green,
          fontFamily: s.mono,
        }}>
          BRANCH POINT: {shortHash('base')}
        </div>
      </div>
    </div>
  )

  const renderAnimatingView = () => {
    const allMain = mainCommits
    const allFeat = featureCommits
    const replayLabels = reorderList.filter(item => !item.skipped).map((item, i) => `F${i + 1}'`)

    const visible = (idx: number) => animStep > idx ? 1 : 0
    const lifted = (idx: number) => animStep >= 1 && animStep <= 3 ? -20 : 0
    const movedRight = (idx: number) => animStep >= 2 ? 120 : 0
    const faded = (idx: number) => animStep >= 2 && animStep <= 3 ? 0.3 : 1
    const landed = (idx: number) => animStep >= 3 + idx ? 1 : 0

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', padding: '20px 0', position: 'relative', minHeight: 260 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', alignSelf: 'flex-start' }}>
          <div style={{ color: s.accent, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>main</div>
          {allMain.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i > 0 && <div style={{ width: 0, height: 16, borderLeft: `2px solid ${s.border}`, marginLeft: 7 }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: s.accent, border: `2px solid ${s.accent}`,
                }} />
                <div style={{
                  background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 5, padding: '3px 8px',
                  fontFamily: s.mono, fontSize: 11, color: s.text,
                  opacity: c.id === 'm3' ? 1 : 1,
                }}>
                  {c.label}
                  <span style={{ color: s.text3, fontSize: 9, marginLeft: 6 }}>{shortHash(c.label)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', alignSelf: 'flex-start', marginTop: 8 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 4 }}>Replaying feature onto main...</div>
          {allFeat.map((c, idx) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              opacity: faded(idx),
              transform: `translate(${movedRight(idx)}px, ${lifted(idx)}px)`,
              transition: 'all 0.6s ease',
              pointerEvents: 'none' as const,
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: s.green, border: `2px solid ${s.green}`,
              }} />
              <div style={{
                background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 5, padding: '3px 8px',
                fontFamily: s.mono, fontSize: 11, color: s.text,
              }}>
                {c.label}
                <span style={{ color: s.text3, fontSize: 9, marginLeft: 6 }}>{shortHash(c.label)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', alignSelf: 'flex-start' }}>
          {replayLabels.map((label, idx) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              opacity: landed(idx),
              transition: 'all 0.5s ease',
              transform: `translateY(${landed(idx) ? 0 : 20}px)`,
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: s.purple, border: `2px solid ${s.purple}`,
              }} />
              <div style={{
                background: s.bg3, border: `1px solid ${s.purple}`, borderRadius: 5, padding: '3px 8px',
                fontFamily: s.mono, fontSize: 11, color: s.text,
              }}>
                {label}
                <span style={{ color: s.purple, fontSize: 9, marginLeft: 6 }}>
                  {shortHash(label)} (new)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderAfterView = () => {
    const replayLabels = reorderList.filter(item => !item.skipped).map((item, i) => item.label + "'")

    return (
      <div style={{ display: 'flex', gap: 60, justifyContent: 'center', padding: '20px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
          <div style={{ color: s.accent, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>main (after rebase)</div>
          {mainCommits.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i > 0 && <div style={{ width: 0, height: 16, borderLeft: `2px solid ${s.border}`, marginLeft: 7 }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: s.accent, border: `2px solid ${s.accent}`,
                }} />
                <div style={{
                  background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 5, padding: '3px 8px',
                  fontFamily: s.mono, fontSize: 11, color: s.text,
                }}>
                  {c.label}
                  <span style={{ color: s.text3, fontSize: 9, marginLeft: 6 }}>{shortHash(c.label)}</span>
                </div>
              </div>
            </div>
          ))}
          {replayLabels.map((label, idx) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 0, height: 16, borderLeft: `2px solid ${s.purple}`, marginLeft: 7 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: s.purple, border: `2px solid ${s.purple}`,
                }} />
                <div style={{
                  background: s.bg3, border: `1px solid ${s.purple}`, borderRadius: 5, padding: '3px 8px',
                  fontFamily: s.mono, fontSize: 11, color: s.text,
                }}>
                  {label}
                  <span style={{ color: s.purple, fontSize: 9, marginLeft: 6 }}>
                    {shortHash(label)} (new hash)
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div style={{
            marginTop: 10, padding: '8px 12px', background: `${s.purple}12`,
            border: `1px solid ${s.purple}`, borderRadius: 6, fontSize: 11, color: s.purple, lineHeight: 1.5,
            maxWidth: 300,
          }}>
            feature now points to {replayLabels[replayLabels.length - 1] || 'M3'}.
            Original F1/F2 still exist but are orphaned from feature branch.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
          <div style={{ color: s.text3, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>old feature (orphaned)</div>
          {featureCommits.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.5 }}>
              {i > 0 && <div style={{ width: 0, height: 16, borderLeft: `2px solid ${s.border}`, marginLeft: 7 }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: s.green, border: `2px solid ${s.green}`,
                }} />
                <div style={{
                  background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 5, padding: '3px 8px',
                  fontFamily: s.mono, fontSize: 11, color: s.text,
                  textDecoration: 'line-through',
                }}>
                  {c.label}
                  <span style={{ color: s.text3, fontSize: 9, marginLeft: 6 }}>{shortHash(c.label)}</span>
                </div>
              </div>
            </div>
          ))}
          <div style={{ color: s.text3, fontSize: 10, marginTop: 6, fontStyle: 'italic' }}>
            still in reflog -- not deleted
          </div>
        </div>
      </div>
    )
  }

  return (
    <DemoBoundary name="Git Rebase">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={H}>Git Rebase</div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => { setView('before'); if (intervalRef.current) clearInterval(intervalRef.current); }}
            style={{
              background: view === 'before' ? s.accent : s.bg3,
              border: `1px solid ${view === 'before' ? s.accent : s.border}`, borderRadius: 6,
              padding: '6px 16px', color: s.text, cursor: 'pointer', fontSize: 12, fontWeight: view === 'before' ? 600 : 400,
            }}>Before Rebase</button>
          <button onClick={view !== 'animating' && view !== 'after' ? startRebase : reset}
            style={{
              background: view === 'animating' ? s.yellow : s.accent,
              border: 'none', borderRadius: 6,
              padding: '6px 16px', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>
            {view === 'animating' ? 'Rebasing...' : view === 'after' ? 'Reset' : 'Start Rebase'}
          </button>
          <button onClick={() => setView('after')}
            style={{
              background: view === 'after' ? s.green : s.bg3,
              border: `1px solid ${view === 'after' ? s.green : s.border}`, borderRadius: 6,
              padding: '6px 16px', color: s.text, cursor: 'pointer', fontSize: 12, fontWeight: view === 'after' ? 600 : 400,
            }}>After Rebase</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <span style={{ color: s.text3, fontSize: 11 }}>Replayed: </span>
          <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 13, fontWeight: 600 }}>{replayCount}</span>
          <span style={{ color: s.text3, fontSize: 11, marginLeft: 4 }}> commit{replayCount !== 1 ? 's' : ''}</span>
        </div>

        {view === 'before' && renderBeforeView()}
        {view === 'animating' && renderAnimatingView()}
        {view === 'after' && renderAfterView()}

        <div style={{ marginTop: 20, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <button
            onClick={() => setInteractive(!interactive)}
            style={{
              background: interactive ? s.accent : s.bg3,
              border: `1px solid ${interactive ? s.accent : s.border}`, borderRadius: 6,
              padding: '6px 14px', color: s.text, cursor: 'pointer', fontSize: 11, fontWeight: interactive ? 600 : 400,
            }}
          >
            {interactive ? 'Hide Interactive Mode' : 'Interactive Rebase Mode'}
          </button>

          {interactive && (
            <div style={{ marginTop: 12, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: s.text2, fontSize: 11, marginBottom: 8 }}>Drag to reorder, click to skip:</div>
              {reorderList.map((item, idx) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px',
                    background: dragIdx === idx ? s.bg3 : 'transparent',
                    border: `1px solid ${item.skipped ? s.red : s.border}`,
                    borderRadius: 6, marginBottom: 4, cursor: 'grab',
                    transition: 'all 0.15s', opacity: item.skipped ? 0.4 : 1,
                  }}
                >
                  <span style={{ color: s.text3, fontSize: 11 }}>#{idx + 1}</span>
                  <span style={{ fontFamily: s.mono, fontSize: 12, color: s.text }}>{item.label}</span>
                  <span style={{ color: s.text3, fontSize: 10 }}>{shortHash(item.label)}</span>
                  <button
                    onClick={() => toggleSkip(item.id)}
                    style={{
                      marginLeft: 'auto', background: item.skipped ? s.green : s.red,
                      border: 'none', borderRadius: 4, padding: '3px 8px',
                      color: '#fff', cursor: 'pointer', fontSize: 10, fontWeight: 600,
                    }}
                  >
                    {item.skipped ? 'Include' : 'Skip'}
                  </button>
                </div>
              ))}
              <div style={{ color: s.text3, fontSize: 10, marginTop: 6 }}>
                {replayCount} commit{replayCount !== 1 ? 's' : ''} will be replayed
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Why new hashes?</div>
          <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.6 }}>
            Each commit's hash includes its parent's hash. When F1 is replayed on top of M3 (instead of Base),
            its parent changes, so its hash changes. This creates F1'. Same diff content, but a brand new identity.
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
