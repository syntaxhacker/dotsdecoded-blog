import { useState } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface Req {
  id: string
  title: string
  desc: string
  detail: string
}

const requirements: Req[] = [
  {
    id: 'realtime',
    title: 'Real-Time Editing',
    desc: 'Multiple users edit the same document simultaneously. Changes appear on all screens within milliseconds. No page refreshes or manual sync.',
    detail: 'Powered by WebSocket connections. Each keystroke is sent as an operation. The server broadcasts to all connected clients. Target latency under 100ms for text edits. Conflict resolution must happen before broadcast.',
  },
  {
    id: 'multicursor',
    title: 'Multi-Cursor Display',
    desc: 'Every collaborator sees where others are editing. Cursors are color-coded with user name labels. Selection highlighting shows what text each user has selected.',
    detail: 'Cursor positions are broadcast as frequent position updates throttled to about 30fps. Each client renders remote cursors as overlays on the document surface. Cursor positions are ephemeral -- they do not need conflict resolution or persistence.',
  },
  {
    id: 'conflict',
    title: 'Conflict Resolution',
    desc: 'When two users edit the same text simultaneously, the system must reconcile both changes. No data loss. No corruption. Both edits survive.',
    detail: 'Two main approaches: Operational Transformation (OT) and CRDTs. OT transforms operations against each other before applying. CRDTs use commutative data structures where merge order does not matter. Both guarantee convergence to a consistent state.',
  },
  {
    id: 'undo',
    title: 'Undo / Redo',
    desc: 'Each user has their own undo stack. Undoing only affects that user changes. Other users edits remain intact.',
    detail: 'Implemented as inverse operations. When User A undoes an insertion, a delete operation is generated. The undo stack is per-user, ordered by that user operation history. Undone operations are skipped during redo by maintaining a version vector per user.',
  },
  {
    id: 'offline',
    title: 'Offline Support',
    desc: 'Users can edit while disconnected. Changes are queued locally and synced when the connection is restored.',
    detail: 'Requires a CRDT-based approach since offline edits must be merged deterministically without a central server. The operation log is persisted locally (IndexedDB for browsers). On reconnect, queued operations are sent and merged. Conflict resolution must handle divergent states cleanly.',
  },
  {
    id: 'permissions',
    title: 'Permission Management',
    desc: 'Document owners control who can view, comment, or edit. Roles include owner, editor, commenter, and viewer.',
    detail: 'Access control list (ACL) stored with each document. The WebSocket server checks permissions before accepting or applying operations. View-only clients receive document state but cannot submit operations. Permission changes themselves must be versioned and auditable.',
  },
  {
    id: 'history',
    title: 'Version History',
    desc: 'Full edit history accessible as a timeline. Users can see who changed what and when. Reverting to previous versions is supported.',
    detail: 'Implemented as a combination of full document snapshots (taken every N operations) and delta records. Stored in an append-only operation log. Version diffs are reconstructed by replaying operations from the nearest snapshot. This is the most storage-intensive requirement.',
  },
]

const cardColors = [s.accent, s.green, s.red, s.yellow, s.purple, s.orange, s.accent]

export default function CollabRequirementsDemo() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <DemoBoundary name="Collaborative Editor Requirements">
    <div style={{ background: s.bg, padding: '32px 24px', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", maxWidth: 820, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 8, letterSpacing: -0.3 }}>System Requirements</div>
      <p style={{ color: s.text2, fontSize: 14, margin: '0 0 24px 0', lineHeight: 1.6 }}>
        Click any requirement to explore the design considerations behind it. These seven areas define what a production collaborative editor must support.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {requirements.map((req, idx) => {
          const isExpanded = expanded === req.id
          const dotColor = cardColors[idx % cardColors.length]
          return (
            <div key={req.id} style={{
              background: s.bg2,
              border: `1px solid ${isExpanded ? dotColor : s.border}`,
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}>
              <div
                onClick={() => setExpanded(isExpanded ? null : req.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 20px',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${dotColor}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13, color: dotColor, flexShrink: 0,
                }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: s.text, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{req.title}</div>
                  <div style={{ color: s.text3, fontSize: 12, lineHeight: 1.5 }}>{req.desc}</div>
                </div>
                <div style={{
                  color: s.text3, fontSize: 16, transition: 'transform 0.2s',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                }}>
                  {'\u25BC'}
                </div>
              </div>
              {isExpanded && (
                <div style={{
                  borderTop: `1px solid ${s.border}`,
                  padding: '14px 20px 18px 66px',
                  color: s.text2, fontSize: 13, lineHeight: 1.7,
                }}>
                  {req.detail}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 20, padding: '14px 18px', background: s.bg3, borderRadius: 10, border: `1px solid ${s.border}` }}>
        <div style={{ color: s.accent, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Design Insight</div>
        <div style={{ color: s.text2, fontSize: 13, lineHeight: 1.6 }}>
          Conflict resolution is the hardest requirement. It affects the entire architecture: how operations are structured, how the server processes them, how clients merge updates, and how undo/offline/version-history are implemented. Every other requirement depends on getting conflict resolution right.
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
