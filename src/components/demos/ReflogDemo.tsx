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

interface Commit {
  hash: string
  message: string
}

interface ReflogEntry {
  idx: number
  action: 'commit' | 'reset' | 'checkout'
  hash: string
  message: string
  prevHash: string
  ref: string
}

let globalIdx = 0
const genHash = () => {
  globalIdx++
  const chars = '0123456789abcdef'
  let h = ''
  for (let i = 0; i < 7; i++) h += chars[Math.floor(Math.random() * 16)]
  return h
}

const actionColors: Record<string, string> = {
  commit: s.green,
  reset: s.red,
  checkout: s.accent,
}

const actionLabels: Record<string, string> = {
  commit: 'commit',
  reset: 'reset',
  checkout: 'checkout',
}

const makeInitialHistory = (): { commits: Commit[]; reflog: ReflogEntry[]; currentBranch: string; branches: Record<string, string> } => {
  const c1 = { hash: genHash(), message: 'Initial commit' }
  const c2 = { hash: genHash(), message: 'Add README' }
  const c3 = { hash: genHash(), message: 'Setup CI' }
  const c4 = { hash: genHash(), message: 'Add tests' }

  return {
    commits: [c1, c2, c3, c4],
    reflog: [
      { idx: 0, action: 'commit', hash: c1.hash, message: 'Initial commit', prevHash: '0000000', ref: 'HEAD@{0}' },
      { idx: 1, action: 'commit', hash: c2.hash, message: 'Add README', prevHash: c1.hash, ref: 'HEAD@{1}' },
      { idx: 2, action: 'commit', hash: c3.hash, message: 'Setup CI', prevHash: c2.hash, ref: 'HEAD@{2}' },
      { idx: 3, action: 'commit', hash: c4.hash, message: 'Add tests', prevHash: c3.hash, ref: 'HEAD@{3}' },
    ],
    currentBranch: 'main',
    branches: { main: c4.hash, feature: c2.hash },
  }
}

export default function ReflogDemo() {
  const [state, setState] = useState(() => makeInitialHistory())
  const [selectedEntry, setSelectedEntry] = useState<ReflogEntry | null>(null)
  const [autoAdvancing, setAutoAdvancing] = useState(false)
  const [speed, setSpeed] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const addEntry = useCallback((action: 'commit' | 'reset' | 'checkout') => {
    setState(prev => {
      const headCommit = prev.commits[prev.commits.length - 1]
      let newHash: string
      let newCommits = [...prev.commits]
      let newMsg: string
      let newBranch = prev.currentBranch

      if (action === 'commit') {
        newHash = genHash()
        newMsg = `Feature change #${prev.commits.length + 1}`
        newCommits.push({ hash: newHash, message: newMsg })
        prev.branches[prev.currentBranch] = newHash
      } else if (action === 'reset') {
        if (prev.commits.length <= 1) return prev
        const prevCommit = prev.commits[prev.commits.length - 2]
        newHash = prevCommit.hash
        newMsg = `move HEAD to ${prevCommit.hash}`
        newCommits = newCommits.slice(0, -1)
        prev.branches[prev.currentBranch] = newHash
      } else {
        newBranch = prev.currentBranch === 'main' ? 'feature' : 'main'
        newHash = prev.branches[newBranch]
        newMsg = `switch to ${newBranch}`
      }

      const newEntry: ReflogEntry = {
        idx: prev.reflog.length,
        action,
        hash: newHash,
        message: newMsg,
        prevHash: headCommit?.hash || '0000000',
        ref: `HEAD@{${prev.reflog.length}}`,
      }

      const newReflog = [newEntry, ...prev.reflog]

      if (containerRef.current) {
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = 0
          }
        }, 50)
      }

      return {
        commits: newCommits,
        reflog: newReflog,
        currentBranch: newBranch,
        branches: prev.branches,
      }
    })
  }, [])

  useEffect(() => {
    if (!autoAdvancing) return
    const actions: ('commit' | 'reset' | 'checkout')[] = ['commit', 'commit', 'checkout', 'commit', 'reset', 'checkout', 'commit']
    let actionIdx = 0
    const interval = setInterval(() => {
      if (actionIdx >= actions.length) {
        setAutoAdvancing(false)
        clearInterval(interval)
        return
      }
      addEntry(actions[actionIdx])
      actionIdx++
    }, getStepDelay(1200, speed))
    return () => clearInterval(interval)
  }, [autoAdvancing, speed, addEntry])

  const currentHead = state.commits[state.commits.length - 1]

  return (
    <DemoBoundary name="Git Reflog">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={H}>Git Reflog</div>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ color: s.text3, fontSize: 12 }}>Current HEAD:</span>
            <span style={{
              fontFamily: s.mono, fontSize: 13, color: s.accent, fontWeight: 600,
              background: s.bg, padding: '3px 10px', borderRadius: 5,
              border: `1px solid ${s.border}`,
            }}>
              {currentHead.hash.substring(0, 7)}
            </span>
            <span style={{ color: s.text2, fontSize: 12, fontFamily: s.mono }}>{currentHead.message}</span>
            <span style={{
              fontFamily: s.mono, fontSize: 11, color: s.text3,
              background: s.bg3, padding: '2px 8px', borderRadius: 4,
            }}>
              {state.currentBranch}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => addEntry('commit')} style={{
              background: s.green, border: 'none', borderRadius: 6, padding: '7px 16px',
              color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>Commit</button>
            <button onClick={() => addEntry('reset')} disabled={state.commits.length <= 1} style={{
              background: s.red, border: 'none', borderRadius: 6, padding: '7px 16px',
              color: '#fff', cursor: state.commits.length <= 1 ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 600, opacity: state.commits.length <= 1 ? 0.4 : 1,
            }}>Reset --hard HEAD~1</button>
            <button onClick={() => addEntry('checkout')} style={{
              background: s.accent, border: 'none', borderRadius: 6, padding: '7px 16px',
              color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>Checkout ({state.currentBranch === 'main' ? 'feature' : 'main'})</button>
            <button onClick={() => setAutoAdvancing(!autoAdvancing)} style={{
              background: autoAdvancing ? s.yellow : s.bg3,
              border: `1px solid ${s.border}`, borderRadius: 6, padding: '7px 16px',
              color: s.text, cursor: 'pointer', fontSize: 12,
            }}>
              {autoAdvancing ? 'Stop Auto' : 'Auto Play'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <span style={{ color: s.text3, fontSize: 11 }}>Reflog entries: </span>
          <span style={{ color: s.accent, fontFamily: s.mono, fontSize: 13, fontWeight: 600 }}>{state.reflog.length}</span>
        </div>

        <div ref={containerRef} style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
          maxHeight: 280, overflowY: 'auto',
        }}>
          {state.reflog.map((entry, arrIdx) => {
            const isCurrent = arrIdx === 0
            return (
              <div
                key={`${entry.idx}-${entry.hash}`}
                onClick={() => setSelectedEntry(entry)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px',
                  borderBottom: arrIdx < state.reflog.length - 1 ? `1px solid ${s.border}` : 'none',
                  background: isCurrent ? `${s.accent}10` : selectedEntry?.idx === entry.idx ? `${s.yellow}10` : 'transparent',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
              >
                <div style={{
                  fontFamily: s.mono, fontSize: 11, color: s.text3, minWidth: 64,
                }}>
                  {entry.ref}
                </div>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: actionColors[entry.action],
                  flexShrink: 0,
                }} />
                <div style={{
                  fontFamily: s.mono, fontSize: 11, color: actionColors[entry.action],
                  minWidth: 60, fontWeight: 600,
                }}>
                  {actionLabels[entry.action]}
                </div>
                <div style={{
                  fontFamily: s.mono, fontSize: 11, color: s.text,
                  minWidth: 70,
                }}>
                  {entry.hash.substring(0, 7)}
                </div>
                <div style={{
                  fontSize: 12, color: s.text2, flex: 1, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {entry.message}
                </div>
                {isCurrent && (
                  <div style={{
                    background: s.accent, color: '#fff', fontSize: 9, fontWeight: 700,
                    padding: '2px 6px', borderRadius: 3,
                  }}>
                    HEAD
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {selectedEntry && (
          <div style={{
            marginTop: 12, padding: 12, background: s.bg, border: `1px solid ${s.yellow}`,
            borderRadius: 8,
          }}>
            <div style={{ color: s.yellow, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
              State at {selectedEntry.ref}
            </div>
            <div style={{ fontSize: 12, color: s.text2, lineHeight: 1.6 }}>
              <div>Action: <span style={{ color: actionColors[selectedEntry.action], fontFamily: s.mono }}>{selectedEntry.action}</span></div>
              <div>Commit: <span style={{ fontFamily: s.mono, color: s.text }}>{selectedEntry.hash}</span></div>
              <div>Previous: <span style={{ fontFamily: s.mono, color: s.text3 }}>{selectedEntry.prevHash}</span></div>
              <div>Message: {selectedEntry.message}</div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, borderTop: `1px solid ${s.border}`, paddingTop: 16 }}>
          <div style={{ color: s.text3, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Safety Net</div>
          <div style={{ color: s.text2, fontSize: 12, lineHeight: 1.6 }}>
            Even after a reset, the old commits remain in the reflog for 90 days (default).
            You can recover any state by checking out its HEAD{'{N}'} reference. Lost commits are not garbage collected until they expire from the reflog.
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
