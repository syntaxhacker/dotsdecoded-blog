import { useState, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface CommitData {
  hash: string
  tree: string
  parent: string | null
  authorName: string
  authorEmail: string
  timestamp: string
  message: string
}

const COMMITS: CommitData[] = [
  {
    hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
    tree: 't1u2v3w4x5y6z7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    parent: null,
    authorName: 'Alice',
    authorEmail: 'alice@example.com',
    timestamp: '1747267200 +0000',
    message: 'Initial commit',
  },
  {
    hash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
    tree: 'u2v3w4x5y6z7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
    parent: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
    authorName: 'Alice',
    authorEmail: 'alice@example.com',
    timestamp: '1747267300 +0000',
    message: 'Add README and config',
  },
  {
    hash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d',
    tree: 'v3w4x5y6z7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    parent: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
    authorName: 'Bob',
    authorEmail: 'bob@example.com',
    timestamp: '1747267400 +0000',
    message: 'Add user authentication',
  },
]

export default function GitCommitDemo() {
  const [selectedIdx, setSelectedIdx] = useState(2)

  const commit = COMMITS[selectedIdx]

  const commitContent = useMemo(() => {
    const lines: string[] = []
    lines.push(`tree ${commit.tree}`)
    if (commit.parent) lines.push(`parent ${commit.parent}`)
    lines.push(`author ${commit.authorName} <${commit.authorEmail}> ${commit.timestamp}`)
    lines.push(`committer ${commit.authorName} <${commit.authorEmail}> ${commit.timestamp}`)
    lines.push('')
    lines.push(commit.message)
    return lines.join('\n')
  }, [commit])

  return (
    <DemoBoundary name="Git Commit Object">
    <div style={{
      maxWidth: 820, margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: '20px 24px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 14 }}>
          Commit Object Structure
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {COMMITS.map((c, i) => (
            <button key={i} onClick={() => setSelectedIdx(i)} style={{
              background: i === selectedIdx ? s.accent : s.bg3,
              border: 'none', borderRadius: 6, padding: '6px 14px',
              color: i === selectedIdx ? '#fff' : s.text2,
              cursor: 'pointer', fontSize: 11, fontFamily: s.mono, fontWeight: 600,
              transition: 'all 0.15s',
            }}>
              {c.hash.substring(0, 7)}
            </button>
          ))}
        </div>

        <div style={{
          background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
          padding: 14, fontFamily: s.mono, fontSize: 12, lineHeight: 1.6,
        }}>
          <div style={{ color: s.accent, marginBottom: 6, fontWeight: 600 }}>
            commit {commit.hash}
          </div>
          <div style={{ color: s.orange }}>
            tree <span style={{ color: s.yellow }}>{commit.tree}</span>
          </div>
          {commit.parent && (
            <div style={{ color: s.purple }}>
              parent <span style={{ color: s.text2 }}>{commit.parent}</span>
            </div>
          )}
          <div style={{ color: s.text3 }}>
            author <span style={{ color: s.green }}>{commit.authorName}</span>
            {' <'}<span style={{ color: s.text2 }}>{commit.authorEmail}</span>
            {'> '}{commit.timestamp}
          </div>
          <div style={{ color: s.text3 }}>
            committer <span style={{ color: s.green }}>{commit.authorName}</span>
            {' <'}<span style={{ color: s.text2 }}>{commit.authorEmail}</span>
            {'> '}{commit.timestamp}
          </div>
          <div style={{ marginTop: 4, borderTop: `1px solid ${s.border}`, paddingTop: 4 }}>
            <div style={{ color: s.text2 }}>{commit.message}</div>
          </div>
        </div>

        <div style={{
          marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ background: s.bg3, borderRadius: 6, padding: '8px 12px', flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 10, color: s.text3, marginBottom: 2 }}>Type</div>
            <div style={{ fontSize: 12, fontFamily: s.mono, color: s.accent, fontWeight: 600 }}>commit</div>
          </div>
          <div style={{ background: s.bg3, borderRadius: 6, padding: '8px 12px', flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 10, color: s.text3, marginBottom: 2 }}>Size</div>
            <div style={{ fontSize: 12, fontFamily: s.mono, color: s.text, fontWeight: 600 }}>{new TextEncoder().encode(commitContent).length} B</div>
          </div>
          <div style={{ background: s.bg3, borderRadius: 6, padding: '8px 12px', flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 10, color: s.text3, marginBottom: 2 }}>Parents</div>
            <div style={{ fontSize: 12, fontFamily: s.mono, color: commit.parent ? s.purple : s.text3, fontWeight: 600 }}>
              {commit.parent ? 1 : 0} (initial)
            </div>
          </div>
        </div>
      </div>

      <div style={{
        padding: '10px 16px', background: s.bg2, borderRadius: 8,
        border: `1px solid ${s.border}`,
        fontSize: 11, color: s.text3, lineHeight: 1.6,
      }}>
        A commit points to a tree (the full snapshot), has zero or more parent pointers, author/committer metadata, and a message. The commit's own hash is derived from all of this content.
      </div>
    </div>
    </DemoBoundary>
  )
}
