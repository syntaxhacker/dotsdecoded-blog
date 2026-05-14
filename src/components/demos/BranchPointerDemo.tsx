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

interface CommitNode {
  id: string
  message: string
}

interface BranchPtr {
  name: string
  commitIdx: number
}

type HeadTarget = { type: 'branch'; name: string } | { type: 'detached'; commitIdx: number }

const COMMIT_MSGS = ['Initial commit', 'Add README', 'Add styles', 'Add auth', 'Fix bug', 'Refactor', 'Add tests', 'Update deps']
const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

function shortHash(): string {
  let h = ''
  for (let i = 0; i < 7; i++) h += CHARS[Math.floor(Math.random() * CHARS.length)]
  return h
}

export default function BranchPointerDemo() {
  const [commits, setCommits] = useState<CommitNode[]>([
    { id: shortHash(), message: 'Initial commit' },
    { id: shortHash(), message: 'Add README' },
    { id: shortHash(), message: 'Add styles' },
  ])
  const [branches, setBranches] = useState<BranchPtr[]>([{ name: 'main', commitIdx: 2 }])
  const [head, setHead] = useState<HeadTarget>({ type: 'branch', name: 'main' })
  const [branchInput, setBranchInput] = useState('')
  const [moveDialog, setMoveDialog] = useState<{ branch: string } | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const currentCommitIdx = (): number => {
    if (head.type === 'branch') {
      const b = branches.find(b => b.name === head.name)
      return b ? b.commitIdx : 0
    }
    return head.commitIdx
  }

  const createBranch = useCallback(() => {
    const name = branchInput.trim()
    if (!name) return
    if (branches.find(b => b.name === name)) {
      setMessage(`Branch "${name}" already exists`)
      return
    }
    setBranches(prev => [...prev, { name, commitIdx: currentCommitIdx() }])
    setBranchInput('')
    setMessage(`Created branch "${name}"`)
  }, [branchInput, branches, head])

  const deleteBranch = useCallback((name: string) => {
    if (branches.length <= 1) {
      setMessage('Cannot delete the only branch')
      return
    }
    const wasOnBranch = head.type === 'branch' && head.name === name
    setBranches(prev => prev.filter(b => b.name !== name))
    if (wasOnBranch) {
      const remaining = branches.filter(b => b.name !== name)
      setHead({ type: 'branch', name: remaining[0].name })
      setMessage(`Deleted "${name}", switched to "${remaining[0].name}"`)
    } else {
      setMessage(`Deleted branch "${name}" (commits preserved)`)
    }
  }, [branches, head])

  const switchBranch = useCallback((name: string) => {
    setHead({ type: 'branch', name })
    setMessage(`Switched to branch "${name}"`)
  }, [])

  const commit = useCallback(() => {
    const idx = currentCommitIdx()
    const msgIdx = Math.min(commits.length, COMMIT_MSGS.length - 1)
    const newCommit: CommitNode = { id: shortHash(), message: `${COMMIT_MSGS[msgIdx]}` }
    setCommits(prev => [...prev, newCommit])
    const newIdx = idx + 1
    if (head.type === 'branch') {
      setBranches(prev => prev.map(b => b.name === head.name ? { ...b, commitIdx: newIdx } : b))
    } else {
      setHead({ type: 'detached', commitIdx: newIdx })
    }
    setMessage(`Commit ${newCommit.id} on ${head.type === 'branch' ? head.name : 'HEAD'}`)
  }, [head, commits])

  const moveBranch = useCallback((name: string, targetIdx: number) => {
    setBranches(prev => prev.map(b => b.name === name ? { ...b, commitIdx: targetIdx } : b))
    setMoveDialog(null)
    setMessage(`Moved "${name}" to commit ${commits[targetIdx].id}`)
  }, [commits])

  const enterDetached = useCallback(() => {
    setHead({ type: 'detached', commitIdx: currentCommitIdx() })
    setMessage('Entered detached HEAD state')
  }, [head])

  const currentIdx = currentCommitIdx()

  const commitWidth = 110
  const commitHeight = 56
  const gapX = 24

  return (
    <DemoBoundary name="Branches as Pointers">
    <div style={{
      maxWidth: 820, margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: '24px 20px', marginBottom: 16, overflow: 'hidden',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 16 }}>
          Commit Graph
        </div>

        <div style={{ position: 'relative', minHeight: 120, overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{
            display: 'flex', gap: gapX, alignItems: 'center',
            position: 'relative', padding: '20px 0',
          }}>
            {commits.map((c, i) => {
              const isCurrent = i === currentIdx
              const branchHere = branches.filter(b => b.commitIdx === i)
              const isDetached = head.type === 'detached' && i === head.commitIdx
              return (
                <div key={i} style={{ position: 'relative', minWidth: commitWidth }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                    {i < commits.length - 1 && (
                      <div style={{
                        position: 'absolute', top: 28, left: commitWidth - 2,
                        width: gapX, height: 2, background: s.border2, zIndex: 0,
                      }} />
                    )}
                    <div style={{
                      width: commitWidth, padding: '8px 10px',
                      background: isCurrent ? `${s.accent}15` : s.bg3,
                      border: `2px solid ${isCurrent ? s.accent : s.border}`,
                      borderRadius: 8, position: 'relative', zIndex: 1,
                      transition: 'all 0.2s',
                    }}>
                      <div style={{
                        fontSize: 10, fontFamily: s.mono, color: s.accent,
                        marginBottom: 2,
                      }}>
                        {c.id}
                      </div>
                      <div style={{
                        fontSize: 10, color: s.text2, lineHeight: 1.3,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {c.message}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', minHeight: 20 }}>
                      {branchHere.map(b => (
                        <div
                          key={b.name}
                          onClick={() => head.type === 'branch' && head.name === b.name ? null : switchBranch(b.name)}
                          style={{
                            fontSize: 10, fontFamily: s.mono, fontWeight: 700,
                            color: head.type === 'branch' && head.name === b.name ? s.text : s.text3,
                            background: head.type === 'branch' && head.name === b.name ? s.accent : s.bg3,
                            padding: '1px 8px', borderRadius: 4,
                            border: `1px solid ${head.type === 'branch' && head.name === b.name ? s.accent : s.border}`,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                            transition: 'all 0.15s',
                          }}
                        >
                          {b.name}
                        </div>
                      ))}
                      {isDetached && (
                        <div style={{
                          fontSize: 10, fontFamily: s.mono, fontWeight: 700,
                          color: s.orange, background: `${s.orange}15`,
                          padding: '1px 8px', borderRadius: 4,
                          border: `1px solid ${s.orange}`,
                          whiteSpace: 'nowrap',
                        }}>
                          HEAD (detached)
                        </div>
                      )}
                      {i === currentIdx && !isDetached && branchHere.length === 0 && (
                        <div style={{
                          fontSize: 10, fontFamily: s.mono, fontWeight: 700,
                          color: s.accent,
                          whiteSpace: 'nowrap',
                        }}>
                          HEAD
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{
        background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: 16, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginRight: 4 }}>
            Current: {head.type === 'branch' ? head.name : 'detached HEAD'}
          </div>
          {head.type === 'branch' && (
            <span style={{
              fontSize: 11, fontFamily: s.mono, color: s.accent,
              background: `${s.accent}15`, padding: '2px 8px', borderRadius: 4,
            }}>
              @ {commits[currentIdx]?.id}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <input
            value={branchInput}
            onChange={e => setBranchInput(e.target.value)}
            placeholder="branch name"
            onKeyDown={e => e.key === 'Enter' && createBranch()}
            style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
              padding: '5px 10px', color: s.text, fontFamily: s.mono, fontSize: 12,
              width: 130, outline: 'none',
            }}
          />
          <button onClick={createBranch} style={btnStyle(s.green, s.bg)}>
            Create Branch
          </button>

          {branches.map(b => (
            <div key={b.name} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <button onClick={() => switchBranch(b.name)} style={btnStyle(
                head.type === 'branch' && head.name === b.name ? s.accent : s.bg3,
                head.type === 'branch' && head.name === b.name ? '#fff' : s.text2,
              )}>
                switch {b.name}
              </button>
              <button onClick={() => deleteBranch(b.name)} style={btnStyle(s.red, s.bg)}>
                del
              </button>
              <button onClick={() => setMoveDialog({ branch: b.name })} style={btnStyle(s.orange, s.bg)}>
                move
              </button>
            </div>
          ))}

          <button onClick={commit} style={btnStyle(s.accent, '#fff')}>
            Commit
          </button>

          <button onClick={enterDetached} style={btnStyle(s.yellow, s.bg)}>
            Detach HEAD
          </button>
        </div>
      </div>

      {moveDialog && (
        <div style={{
          background: s.bg2, borderRadius: 10, border: `1px solid ${s.orange}`, padding: 14, marginBottom: 12,
        }}>
          <div style={{ fontSize: 12, color: s.text2, marginBottom: 8 }}>
            Move "{moveDialog.branch}" to which commit?
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {commits.map((c, i) => (
              <button key={i} onClick={() => moveBranch(moveDialog.branch, i)} style={{
                background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6,
                padding: '4px 10px', color: s.text2, cursor: 'pointer', fontSize: 11,
                fontFamily: s.mono,
              }}>
                {c.id}
              </button>
            ))}
            <button onClick={() => setMoveDialog(null)} style={btnStyle(s.text3, s.bg)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <div style={{
          padding: '8px 14px', background: `${s.accent}10`,
          border: `1px solid ${s.accent}30`, borderRadius: 8, fontFamily: s.mono, fontSize: 12,
          color: s.accent, marginBottom: 8,
        }}>
          {'>'} {message}
        </div>
      )}

      <div style={{
        display: 'flex', gap: 16, padding: '8px 0',
        borderTop: `1px solid ${s.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.accent }} />
          <span style={{ fontSize: 11, color: s.text3 }}>Current HEAD</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.orange }} />
          <span style={{ fontSize: 11, color: s.text3 }}>Detached HEAD</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: s.bg3, border: `1px solid ${s.border}` }} />
          <span style={{ fontSize: 11, color: s.text3 }}>Branches = labels</span>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}

function btnStyle(bg: string, color?: string): React.CSSProperties {
  return {
    background: bg,
    color: color ?? s.text,
    border: 'none', borderRadius: 6, padding: '5px 12px',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    transition: 'opacity 0.15s',
  }
}
