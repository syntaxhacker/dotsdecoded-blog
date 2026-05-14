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

interface TreeNode {
  name: string
  mode: string
  type: 'blob' | 'tree'
  hash: string
  children?: TreeNode[]
}

const ROOT_TREE: TreeNode = {
  name: '/',
  mode: '040000',
  type: 'tree',
  hash: 'a1b2c3d4e5',
  children: [
    {
      name: 'src',
      mode: '040000',
      type: 'tree',
      hash: 'f6g7h8i9j0',
      children: [
        { name: 'index.js', mode: '100644', type: 'blob', hash: 'k1l2m3n4o5' },
        { name: 'utils.js', mode: '100644', type: 'blob', hash: 'p6q7r8s9t0' },
      ],
    },
    {
      name: 'README.md',
      mode: '100644',
      type: 'blob',
      hash: 'u1v2w3x4y5',
    },
    {
      name: 'package.json',
      mode: '100644',
      type: 'blob',
      hash: 'z6a7b8c9d0',
    },
  ],
}

const TREE_LINE = `100644 blob k1l2m3n4o5    index.js\n100644 blob p6q7r8s9t0    utils.js`

export default function GitTreeDemo() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['/']))
  const [showContents, setShowContents] = useState(false)

  const toggleNode = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const renderTree = (node: TreeNode, depth: number, path: string): JSX.Element => {
    const isExpanded = expanded.has(path)
    const indent = depth * 20

    return (
      <div key={path}>
        <div
          onClick={() => node.type === 'tree' && toggleNode(path)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 8px', paddingLeft: 12 + indent,
            cursor: node.type === 'tree' ? 'pointer' : 'default',
            background: depth === 0 ? `${s.accent}08` : 'transparent',
            borderRadius: 4,
            transition: 'background 0.15s',
          }}
        >
          {node.type === 'tree' ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              <path d="M6 4l4 4-4 4" stroke={s.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={s.text3} strokeWidth="1.4" fill="none"/>
              <path d="M10 2v3h3" stroke={s.text3} strokeWidth="1.4" fill="none"/>
            </svg>
          )}
          <span style={{
            fontSize: 12.5, fontFamily: s.mono,
            color: node.type === 'tree' ? s.accent : s.text2,
            fontWeight: node.type === 'tree' ? 600 : 400,
          }}>
            {node.name}
          </span>
          <span style={{
            fontSize: 10, fontFamily: s.mono, color: s.text3,
            marginLeft: 'auto',
          }}>
            {node.mode}
          </span>
          <span style={{
            fontSize: 10, fontFamily: s.mono, color: node.type === 'tree' ? s.yellow : s.green,
            background: `${node.type === 'tree' ? s.yellow : s.green}12`,
            padding: '1px 6px', borderRadius: 3,
          }}>
            {node.hash}
          </span>
          <span style={{
            fontSize: 9, fontFamily: s.mono, color: s.text3,
            textTransform: 'uppercase', letterSpacing: 0.3,
            background: s.bg3, padding: '1px 5px', borderRadius: 3,
          }}>
            {node.type}
          </span>
        </div>
        {node.type === 'tree' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTree(child, depth + 1, `${path}/${child.name}`))}
          </div>
        )}
      </div>
    )
  }

  return (
    <DemoBoundary name="Git Tree Object Structure">
    <div style={{
      maxWidth: 820, margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        background: s.bg2, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: '20px 24px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: s.text, marginBottom: 14 }}>
          Tree Object Structure
        </div>

        <div style={{
          background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
          padding: 8, marginBottom: 14, maxHeight: 280, overflowY: 'auto',
        }}>
          {renderTree(ROOT_TREE, 0, '/')}
        </div>

        <button
          onClick={() => setShowContents(!showContents)}
          style={{
            background: s.bg3, border: `1px solid ${s.border}`, borderRadius: 6,
            padding: '6px 14px', color: s.text2, cursor: 'pointer', fontSize: 12,
            fontFamily: s.mono, marginBottom: showContents ? 10 : 0,
          }}
        >
          {showContents ? 'Hide' : 'Show'} tree contents
        </button>

        {showContents && (
          <div style={{
            background: s.bg, borderRadius: 8, border: `1px solid ${s.border}`,
            padding: 12, fontFamily: s.mono, fontSize: 12, whiteSpace: 'pre',
          }}>
            <div style={{ color: s.text3, marginBottom: 4 }}>src/ tree:</div>
            <div style={{ color: s.text2 }}>{TREE_LINE}</div>
          </div>
        )}
      </div>

      <div style={{
        padding: '10px 16px', background: s.bg2, borderRadius: 8,
        border: `1px solid ${s.border}`,
        fontSize: 11, color: s.text3, lineHeight: 1.6,
      }}>
        A tree maps names to hashes. Expand folders (tree nodes) to see their contents. Each entry has a mode, type, hash, and filename. Two directories with identical contents produce the same tree hash.
      </div>
    </div>
    </DemoBoundary>
  )
}
