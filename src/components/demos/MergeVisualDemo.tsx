import { useState, useCallback, useEffect, useRef } from 'react'
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

interface Commit {
  id: string
  message: string
  branch: 'main' | 'feature'
  parents: number[]
  isMerge?: boolean
}

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

function shortHash(): string {
  let h = ''
  for (let i = 0; i < 6; i++) h += CHARS[Math.floor(Math.random() * CHARS.length)]
  return h
}

type Step = 'start' | 'feature-created' | 'main-commit' | 'feature-commit' | 'merged'

export default function MergeVisualDemo() {
  const [commits, setCommits] = useState<Commit[]>([
    { id: shortHash(), message: 'Initial commit', branch: 'main', parents: [] },
    { id: shortHash(), message: 'Add base layout', branch: 'main', parents: [0] },
    { id: shortHash(), message: 'Add routing', branch: 'main', parents: [1] },
  ])
  const [mainHead, setMainHead] = useState(2)
  const [featureHead, setFeatureHead] = useState<number | null>(null)
  const [step, setStep] = useState<Step>('start')
  const [autoPlaying, setAutoPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [conflict, setConflict] = useState(false)
  const [mergeCommitId, setMergeCommitId] = useState<number | null>(null)
  const autoRef = useRef(false)

  const hasFeature = featureHead !== null
  const commonAncestor = featureHead !== null
    ? commits.findIndex((c, i) => {
        const fAncestors = new Set<number>()
        const collectF = (idx: number) => { fAncestors.add(idx); for (const p of commits[idx].parents) collectF(p) }
        collectF(featureHead)
        const collectM = (idx: number): boolean => { if (fAncestors.has(idx)) return true; for (const p of commits[idx].parents) if (collectM(p)) return true; return false }
        return collectM(mainHead)
      })
    : -1

  useEffect(() => {
    if (!autoPlaying) return
    autoRef.current = true
    const steps = [
      () => setStep('feature-created'),
      () => commitOnFeature(),
      () => commitOnMain(),
      () => handleMerge(),
      () => setAutoPlaying(false),
    ]
    let i = 0
    const tick = () => {
      if (i >= steps.length || !autoRef.current) { setAutoPlaying(false); return }
      steps[i]()
      i++
      if (i < steps.length && autoRef.current) {
        setTimeout(tick, getStepDelay(1200, speed))
      } else {
        setAutoPlaying(false)
      }
    }
    setTimeout(tick, getStepDelay(500, speed))
    return () => { autoRef.current = false }
  }, [autoPlaying, speed, mainHead, featureHead, commits])

  const createFeature = useCallback(() => {
    if (hasFeature) return
    const newId = shortHash()
    const newCommit: Commit = { id: newId, message: 'Branch from main', branch: 'feature', parents: [mainHead] }
    setCommits(prev => [...prev, newCommit])
    const newIdx = commits.length
    setFeatureHead(newIdx)
    setStep('feature-created')
  }, [hasFeature, mainHead, commits])

  const commitOnFeature = useCallback(() => {
    if (featureHead === null) return
    const msgs = ['Add feature flag', 'Implement feature', 'Test feature', 'Refactor feature']
    const msgIdx = commits.filter(c => c.branch === 'feature').length - 1
    const msg = msgs[Math.min(msgIdx, msgs.length - 1)]
    const newCommit: Commit = { id: shortHash(), message: msg, branch: 'feature', parents: [featureHead] }
    setCommits(prev => [...prev, newCommit])
    setFeatureHead(commits.length)
    setStep('feature-commit')
  }, [featureHead, commits])

  const commitOnMain = useCallback(() => {
    const msgs = ['Update homepage', 'Fix navigation', 'Add footer', 'Optimize images']
    const msgIdx = commits.filter(c => c.branch === 'main').length - 1
    const msg = msgs[Math.min(msgIdx, msgs.length - 1)]
    const newCommit: Commit = { id: shortHash(), message: msg, branch: 'main', parents: [mainHead] }
    setCommits(prev => [...prev, newCommit])
    setMainHead(commits.length)
    setStep('main-commit')
  }, [mainHead, commits])

  const handleMerge = useCallback(() => {
    if (featureHead === null) return
    const isFastForward = featureHead > mainHead
    if (isFastForward) {
      setMainHead(featureHead)
      setFeatureHead(null)
      setStep('merged')
      setMergeCommitId(null)
      setConflict(false)
    } else {
      setConflict(true)
      const mergeMsg = `Merge feature into main`
      const newCommit: Commit = {
        id: shortHash(), message: mergeMsg, branch: 'main',
        parents: [mainHead, featureHead],
        isMerge: true,
      }
      setCommits(prev => [...prev, newCommit])
      const newIdx = commits.length
      setMainHead(newIdx)
      setFeatureHead(null)
      setMergeCommitId(newIdx)
      setStep('merged')
    }
  }, [featureHead, mainHead, commits])

  const reset = useCallback(() => {
    const baseCommits: Commit[] = [
      { id: shortHash(), message: 'Initial commit', branch: 'main', parents: [] },
      { id: shortHash(), message: 'Add base layout', branch: 'main', parents: [0] },
      { id: shortHash(), message: 'Add routing', branch: 'main', parents: [1] },
    ]
    setCommits(baseCommits)
    setMainHead(2)
    setFeatureHead(null)
    setStep('start')
    setAutoPlaying(false)
    setConflict(false)
    setMergeCommitId(null)
  }, [])

  const getBranchParents = (branch: 'main' | 'feature', headIdx: number): number[][] => {
    const chain: number[][] = []
    let current = headIdx
    const seen = new Set<number>()
    while (current >= 0 && !seen.has(current)) {
      const c = commits[current]
      if (!c) break
      if (c.isMerge) {
        chain.push([current])
        break
      }
      if (c.branch !== branch && branch === 'main') break
      chain.push([current])
      seen.add(current)
      if (c.parents.length > 0) {
        current = c.parents[0]
      } else break
    }
    return chain.reverse()
  }

  const mainBranch = getBranchParents('main', mainHead)
  const featureBranch = featureHead !== null ? getBranchParents('feature', featureHead).filter(p => {
    return !mainBranch.some(mp => mp[0] === p[0])
  }) : []

  const allBranchCommits = [...mainBranch, ...featureBranch]

  const mergeBase = featureHead !== null
    ? (() => {
        const fAncestors = new Set<number>()
        const collectF = (idx: number) => {
          if (idx < 0 || fAncestors.has(idx)) return
          fAncestors.add(idx)
          for (const p of commits[idx]?.parents || []) collectF(p)
        }
        collectF(featureHead)
        const collectM = (idx: number): number | null => {
          if (idx < 0) return null
          if (fAncestors.has(idx)) return idx
          for (const p of commits[idx]?.parents || []) {
            const r = collectM(p)
            if (r !== null) return r
          }
          return null
        }
        return collectM(mainHead)
      })()
    : -1

  return (
    <DemoBoundary name="Git Merge Visualization">
    <div style={{
      maxWidth: 820, margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: '20px 20px', marginBottom: 16, overflow: 'hidden',
      }}>
        {commits.length > 0 && (
          <div style={{ position: 'relative', minHeight: 130, overflowX: 'auto' }}>
            <svg width={Math.max(commits.length * 120 + 40, 300)} height="130" style={{ display: 'block' }}>
              {commits.map((c, i) => {
                const isMain = c.branch === 'main' || c.isMerge
                const x = 20 + i * 100
                const row = c.isMerge ? 0 : (c.branch === 'feature' ? 70 : 0)
                const y = 30 + row
                const isMergeBase = i === mergeBase
                const isMergeCommit = c.isMerge

                return (
                  <g key={i}>
                    {c.parents.map((p, pi) => {
                      const px = 20 + p * 100
                      const pCommit = commits[p]
                      const pRow = pCommit?.isMerge ? 0 : (pCommit?.branch === 'feature' ? 70 : 0)
                      const py = 30 + pRow
                      const isDashed = c.isMerge && pi > 0
                      return (
                        <line
                          key={pi}
                          x1={px + 24} y1={py + 18}
                          x2={x} y2={y + 18}
                          stroke={isDashed ? s.orange : s.border2}
                          strokeWidth={isDashed ? 1.5 : 2}
                          strokeDasharray={isDashed ? '5,3' : 'none'}
                        />
                      )
                    })}

                    {isMergeBase && (
                      <rect x={x - 6} y={y - 6} width={38} height={50}
                        rx={10} fill="none" stroke={s.yellow} strokeWidth={2}
                        strokeDasharray="4,3"
                      />
                    )}

                    <rect x={x} y={y} width={26} height={36} rx={6}
                      fill={isMergeCommit ? `${s.purple}20` : isMain ? `${s.accent}15` : `${s.green}15`}
                      stroke={isMergeCommit ? s.purple : isMain ? s.accent : s.green}
                      strokeWidth={2}
                    />

                    <text x={x + 13} y={y + 16} textAnchor="middle"
                      fill={isMergeCommit ? s.purple : isMain ? s.accent : s.green}
                      fontSize="9" fontFamily={s.mono}
                    >
                      {c.id.substring(0, 5)}
                    </text>
                    <text x={x + 13} y={y + 28} textAnchor="middle"
                      fill={s.text3} fontSize="8" fontFamily={s.mono}
                    >
                      {c.message.substring(0, 12)}
                    </text>

                    {i === mainHead && (
                      <text x={x + 13} y={y - 8} textAnchor="middle"
                        fill={s.accent} fontSize="11" fontWeight="700"
                        fontFamily={s.mono}
                      >
                        main
                      </text>
                    )}
                    {i === featureHead && (
                      <text x={x + 13} y={y + 52} textAnchor="middle"
                        fill={s.green} fontSize="11" fontWeight="700"
                        fontFamily={s.mono}
                      >
                        feature
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
        )}
      </div>

      <div style={{
        background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: 16, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>
            main: {mainBranch.length} commits
          </div>
          <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>
            feature: {featureBranch.length} commits
          </div>
          {mergeBase >= 0 && (
            <div style={{
              fontSize: 11, fontFamily: s.mono, color: s.yellow,
              background: `${s.yellow}12`, padding: '2px 8px', borderRadius: 4,
            }}>
              merge base: {commits[mergeBase]?.id?.substring(0, 5)}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {!hasFeature && step === 'start' && (
            <button onClick={createFeature} style={btnStyle(s.green, s.bg)}>
              Create Feature Branch
            </button>
          )}

          {hasFeature && step !== 'merged' && (
            <>
              <button onClick={commitOnFeature} style={btnStyle(s.green, s.bg)}>
                Commit on Feature
              </button>
              <button onClick={commitOnMain} style={btnStyle(s.accent, '#fff')}>
                Commit on Main
              </button>
              <button onClick={handleMerge} style={btnStyle(s.purple, '#fff')}>
                Merge
              </button>
            </>
          )}

          {step === 'merged' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 12, color: s.green, fontWeight: 600,
              }}>
                {conflict ? '3-way merge complete (merge commit)' : 'Fast-forward merge complete'}
              </span>
              <button onClick={reset} style={btnStyle(s.text3, s.bg)}>
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.accent }} />
            <span style={{ fontSize: 11, color: s.text3 }}>main branch</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.green }} />
            <span style={{ fontSize: 11, color: s.text3 }}>feature branch</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.purple }} />
            <span style={{ fontSize: 11, color: s.text3 }}>merge commit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.yellow }} />
            <span style={{ fontSize: 11, color: s.text3 }}>merge base</span>
          </div>
        </div>
        {!autoPlaying && step !== 'merged' && (
          <button onClick={() => setAutoPlaying(true)} style={btnStyle(s.yellow, s.bg)}>
            Auto-Play
          </button>
        )}
        {autoPlaying && (
          <span style={{ fontSize: 12, color: s.text3, fontFamily: s.mono }}>
            auto-playing...
          </span>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SpeedController speed={speed} onSpeedChange={setSpeed} />
      </div>
    </div>
    </DemoBoundary>
  )
}

function btnStyle(bg: string, color?: string): React.CSSProperties {
  return {
    background: bg,
    color: color ?? s.text,
    border: 'none', borderRadius: 6, padding: '6px 14px',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    transition: 'opacity 0.15s',
  }
}
