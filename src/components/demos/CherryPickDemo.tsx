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
  id: string
  label: string
  hash: string
  branch: 'main' | 'feature'
  changes: string
}

const renderHash = () => {
  const chars = '0123456789abcdef'
  let h = ''
  for (let i = 0; i < 7; i++) h += chars[Math.floor(Math.random() * 16)]
  return h
}

const initialMainCommits: Commit[] = [
  { id: 'm0', label: 'Initial', hash: renderHash(), branch: 'main', changes: 'Project setup' },
  { id: 'm1', label: 'Auth', hash: renderHash(), branch: 'main', changes: 'Add login page' },
  { id: 'm2', label: 'DB', hash: renderHash(), branch: 'main', changes: 'Add user model' },
  { id: 'm3', label: 'UI', hash: renderHash(), branch: 'main', changes: 'Add dashboard layout' },
]

const initialFeatureCommits: Commit[] = [
  { id: 'f0', label: 'F-Base', hash: renderHash(), branch: 'feature', changes: 'Branch from auth' },
  { id: 'f1', label: 'Search', hash: renderHash(), branch: 'feature', changes: 'Add search bar component' },
  { id: 'f2', label: 'Filter', hash: renderHash(), branch: 'feature', changes: 'Add filter logic' },
  { id: 'f3', label: 'Results', hash: renderHash(), branch: 'feature', changes: 'Add results grid view' },
]

export default function CherryPickDemo() {
  const [mainCommits, setMainCommits] = useState<Commit[]>(initialMainCommits)
  const [featureCommits] = useState<Commit[]>(initialFeatureCommits)
  const [selectedCommits, setSelectedCommits] = useState<Set<string>>(new Set())
  const [cherryPicked, setCherryPicked] = useState<Set<string>>(new Set())
  const [animatingHash, setAnimatingHash] = useState<string | null>(null)
  const [animatingLabel, setAnimatingLabel] = useState<string>('')
  const [animatingChanges, setAnimatingChanges] = useState<string>('')
  const [cherryCount, setCherryCount] = useState(0)
  const speed = 1

  const handleSelect = (commitId: string) => {
    setSelectedCommits(prev => {
      const next = new Set(prev)
      if (next.has(commitId)) {
        next.delete(commitId)
      } else {
        next.add(commitId)
      }
      return next
    })
  }

  const handleCherryPick = useCallback(() => {
    if (selectedCommits.size === 0) return
    const picked: Commit[] = []
    selectedCommits.forEach(id => {
      const found = featureCommits.find(c => c.id === id)
      if (found) picked.push(found)
    })
    if (picked.length === 0) return

    picked.forEach((pick, idx) => {
      const newHash = renderHash()
      const newCommit: Commit = {
        id: `cp-${pick.id}-${Date.now()}-${idx}`,
        label: pick.label,
        hash: newHash,
        branch: 'main',
        changes: pick.changes,
      }

      setTimeout(() => {
        setAnimatingHash(newHash)
        setAnimatingLabel(pick.label)
        setAnimatingChanges(pick.changes)
        setMainCommits(prev => [...prev, newCommit])
        setCherryPicked(prev => new Set(prev).add(pick.id))
        setCherryCount(prev => prev + 1)
        setSelectedCommits(prev => {
          const next = new Set(prev)
          next.delete(pick.id)
          return next
        })
        setTimeout(() => {
          setAnimatingHash(null)
        }, 500)
      }, idx * 400)
    })
  }, [selectedCommits, featureCommits])

  const renderChanges = (changes: string) => (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6,
      padding: '8px 12px', marginTop: 8,
    }}>
      <div style={{ color: s.text3, fontSize: 10, marginBottom: 4 }}>CHANGES INTRODUCED</div>
      <div style={{ fontFamily: s.mono, fontSize: 11, color: s.green }}>
        + {changes}
      </div>
    </div>
  )

  const renderCommitBox = (commit: Commit, isPicked: boolean, isSelected: boolean, isAnimating: boolean) => (
    <div
      key={commit.id}
      onClick={() => commit.branch === 'feature' && handleSelect(commit.id)}
      style={{
        background: s.bg3,
        border: `2px solid ${
          isAnimating ? s.yellow
            : isPicked ? s.purple
            : isSelected ? s.accent
            : s.border
        }`,
        borderRadius: 8, padding: '10px 14px',
        cursor: commit.branch === 'feature' ? 'pointer' : 'default',
        opacity: isAnimating ? 0.7 : 1,
        transition: 'all 0.3s ease',
        transform: isSelected ? 'scale(1.03)' : isAnimating ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: isPicked ? s.purple : commit.branch === 'feature' ? s.green : s.accent,
        }} />
        <div style={{ fontFamily: s.mono, fontSize: 12, color: s.text, fontWeight: 600 }}>
          {commit.label}
        </div>
        {isPicked && (
          <div style={{
            background: s.purple, color: '#fff', fontSize: 9, fontWeight: 700,
            padding: '1px 6px', borderRadius: 3,
          }}>
            CHERRY-PICKED
          </div>
        )}
      </div>
      <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
        {commit.hash}
      </div>
      <div style={{ fontSize: 11, color: s.text2, marginTop: 4 }}>
        {commit.changes}
      </div>
      {isAnimating && (
        <div style={{ fontSize: 10, color: s.yellow, fontFamily: s.mono, marginTop: 4 }}>
          cherry-picking...
        </div>
      )}
    </div>
  )

  return (
    <DemoBoundary name="Cherry-Pick">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={SEC}>
        <div style={H}>Cherry-Pick</div>

        <div style={{ marginBottom: 12 }}>
          <span style={{ color: s.text3, fontSize: 11 }}>Cherry-picked: </span>
          <span style={{ color: s.purple, fontFamily: s.mono, fontSize: 13, fontWeight: 600 }}>{cherryCount}</span>
          <span style={{ color: s.text3, fontSize: 11, marginLeft: 4 }}> commit{cherryCount !== 1 ? 's' : ''}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ color: s.accent, fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>
              main (current branch)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {mainCommits.map((commit, idx) => (
                <div key={commit.id}>
                  {idx > 0 && idx === mainCommits.length - 1 && (
                    <div style={{
                      width: 0, height: 8, borderLeft: `2px dashed ${s.yellow}`, marginLeft: 7, marginBottom: 6,
                    }} />
                  )}
                  {idx > 0 && idx !== mainCommits.length - 1 && (
                    <div style={{ width: 0, height: 6, borderLeft: `2px solid ${s.border}`, marginLeft: 7 }} />
                  )}
                  {renderCommitBox(
                    commit,
                    false,
                    false,
                    animatingHash === commit.hash
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ color: s.green, fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: 0.5 }}>
              feature (click commits to select)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {featureCommits.map((commit, idx) => (
                <div key={commit.id}>
                  {idx > 0 && <div style={{ width: 0, height: 6, borderLeft: `2px solid ${s.border}`, marginLeft: 7 }} />}
                  {renderCommitBox(
                    commit,
                    cherryPicked.has(commit.id),
                    selectedCommits.has(commit.id),
                    false
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            onClick={handleCherryPick}
            disabled={selectedCommits.size === 0}
            style={{
              flex: 1,
              background: selectedCommits.size === 0 ? s.bg3 : s.purple,
              border: 'none', borderRadius: 8, padding: '10px 20px',
              color: selectedCommits.size === 0 ? s.text3 : '#fff',
              cursor: selectedCommits.size === 0 ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            Cherry-Pick Selected ({selectedCommits.size})
          </button>
        </div>

        {animatingHash && (
          <div style={{
            marginTop: 16, padding: 12, background: `${s.yellow}12`,
            border: `1px solid ${s.yellow}`, borderRadius: 8,
          }}>
            <div style={{ color: s.yellow, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
              Cherry-picked: {animatingLabel}
            </div>
            <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text }}>
              New commit hash: {animatingHash}
            </div>
            <div style={{ color: s.text2, fontSize: 11, marginTop: 4 }}>
              Parent changed from original branch's base to current HEAD of main. New hash = new identity.
            </div>
            {renderChanges(animatingChanges)}
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
