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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 12, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

interface DomNode {
  id: string
  tag: string
  text?: string
  children: DomNode[]
  displayNone?: boolean
  pseudo?: 'before' | 'after'
}

const domTree: DomNode = {
  id: 'html', tag: 'html', children: [
    {
      id: 'head', tag: 'head', children: [
        { id: 'title', tag: 'title', children: [{ id: 'title-text', tag: '', text: 'My Page', children: [] }] },
      ],
    },
    {
      id: 'body', tag: 'body', children: [
        { id: 'header', tag: 'header', children: [{ id: 'header-text', tag: '', text: 'Welcome!', children: [] }] },
        {
          id: 'nav', tag: 'nav', displayNone: true, children: [
            { id: 'nav-text', tag: '', text: 'Navigation links', children: [] },
          ],
        },
        {
          id: 'main', tag: 'main', children: [
            {
              id: 'article', tag: 'article', children: [
                { id: 'article-title', tag: 'h1', children: [{ id: 'article-title-text', tag: '', text: 'Hello World', children: [] }] },
                { id: 'article-text', tag: 'p', children: [{ id: 'article-text-text', tag: '', text: 'This is content.', children: [] }] },
              ],
            },
          ],
        },
        {
          id: 'footer', tag: 'footer', children: [
            { id: 'footer-text', tag: '', text: 'Footer info', children: [] },
            { id: 'footer-before', tag: '::before', pseudo: 'before', children: [] },
            { id: 'footer-after', tag: '::after', pseudo: 'after', children: [] },
          ],
        },
      ],
    },
  ],
}

const cssomRules = [
  { selector: 'body', props: { font: '16px sans-serif', color: '#333', margin: '0' } },
  { selector: 'header', props: { font: 'bold 24px sans-serif', color: '#111', padding: '20px', background: '#f0f0f0' } },
  { selector: 'nav', props: { display: 'none', background: '#eee' } },
  { selector: 'main', props: { font: '16px sans-serif', color: '#222', padding: '20px', lineHeight: '1.6' } },
  { selector: 'article', props: { font: '16px sans-serif', color: '#222', maxWidth: '800px', margin: '0 auto' } },
  { selector: 'h1', props: { font: 'bold 28px sans-serif', color: '#000', marginBottom: '10px' } },
  { selector: 'p', props: { font: '16px sans-serif', color: '#444', marginBottom: '10px' } },
  { selector: 'footer', props: { font: '14px sans-serif', color: '#666', padding: '10px', borderTop: '1px solid #ccc', position: 'relative' } },
  { selector: 'footer::before', props: { content: '""', display: 'block', height: '2px', background: '#999' } },
  { selector: 'footer::after', props: { content: '"---end---"', display: 'block', textAlign: 'center', color: '#aaa' } },
]

const nodeToStyle: Record<string, Record<string, string>> = {
  'body': { font: '16px sans-serif', color: '#333', margin: '0' },
  'header': { font: 'bold 24px sans-serif', color: '#111', padding: '20px', background: '#f0f0f0' },
  'nav': { display: 'none', background: '#eee' },
  'main': { font: '16px sans-serif', color: '#222', padding: '20px', lineHeight: '1.6' },
  'article': { font: '16px sans-serif', color: '#222', maxWidth: '800px', margin: '0 auto' },
  'h1': { font: 'bold 28px sans-serif', color: '#000', marginBottom: '10px' },
  'p': { font: '16px sans-serif', color: '#444', marginBottom: '10px' },
  'footer': { font: '14px sans-serif', color: '#666', padding: '10px', borderTop: '1px solid #ccc', position: 'relative' },
  '::before': { content: '""', display: 'block', height: '2px', background: '#999' },
  '::after': { content: '"---end---"', display: 'block', textAlign: 'center', color: '#aaa' },
}

function collectRenderNodes(node: DomNode, showAll: boolean): { node: DomNode; inRenderTree: boolean; reason?: string }[] {
  const result: { node: DomNode; inRenderTree: boolean; reason?: string }[] = []
  const excluded = node.displayNone
  const isPseudo = node.pseudo === 'before' || node.pseudo === 'after'
  const isText = !node.tag && !!node.text
  const isVisible = !excluded
  const hasVisibleChildren = node.children.some(c => !c.displayNone)
  const inRenderTree = isVisible && (isText || isPseudo || hasVisibleChildren || node.children.length === 0)

  if (showAll || inRenderTree || isPseudo) {
    result.push({
      node,
      inRenderTree: isVisible && !isText,
      reason: excluded ? 'display: none' : isPseudo ? 'pseudo-element' : undefined,
    })
  }
  for (const child of node.children) {
    result.push(...collectRenderNodes(child, showAll))
  }
  return result
}

function flattenDom(node: DomNode, depth: number): { node: DomNode; depth: number }[] {
  const result: { node: DomNode; depth: number }[] = [{ node, depth }]
  for (const child of node.children) {
    result.push(...flattenDom(child, depth + 1))
  }
  return result
}

function TreeNodeDisplay({ node, depth, highlighted, grayed }: { node: DomNode; depth: number; highlighted: boolean; grayed: boolean }) {
  const icon = node.pseudo === 'before' ? '::before' : node.pseudo === 'after' ? '::after' : node.tag ? `<${node.tag}>` : node.text || ''
  const style: React.CSSProperties = {
    paddingLeft: depth * 16,
    color: grayed ? s.text3 : highlighted ? s.green : node.pseudo ? s.purple : node.displayNone ? s.text3 : s.accent,
    fontSize: 12,
    fontFamily: s.mono,
    lineHeight: 1.8,
    opacity: grayed ? 0.35 : 1,
    transition: 'all .3s',
    textDecoration: grayed ? 'line-through' : 'none',
  }
  return (
    <div style={style}>
      {'\u2502 '.repeat(depth)}{highlighted ? '\u25B6 ' : '  '}{icon}
    </div>
  )
}

export default function RenderTreeDemo() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showFull, setShowFull] = useState(false)

  const flatDom = flattenDom(domTree, 0)
  const renderNodes = collectRenderNodes(domTree, showFull)
  const styles = selectedNode ? nodeToStyle[selectedNode] || nodeToStyle[flatDom.find(n => n.node.id === selectedNode)?.node.tag || ''] || {} : {}

  return (
    <DemoBoundary name="Render Tree">
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text }}>
      <div style={SEC}>
        <div style={H}>Render Tree Construction</div>
        <p style={{ color: s.text2, fontSize: 13, margin: '0 0 16px 0', lineHeight: 1.6 }}>
          The render tree combines DOM and CSSOM. Nodes with <code style={{ color: s.yellow }}>display: none</code>
          are excluded. Pseudo-elements like <code style={{ color: s.purple }}>::before</code> and <code style={{ color: s.purple }}>::after</code> are included.
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: s.text2, fontSize: 13 }}>
            <input type="checkbox" checked={showFull} onChange={e => setShowFull(e.target.checked)}
              style={{ accentColor: s.accent }} />
            Show full tree (including excluded)
          </label>
          {selectedNode && (
            <button onClick={() => setSelectedNode(null)} style={{
              padding: '4px 12px', background: s.bg3, border: `1px solid ${s.border}`,
              borderRadius: 6, color: s.text2, cursor: 'pointer', fontSize: 11,
            }}>Clear selection</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: '1 1 30%' }}>
            <div style={{
              padding: '8px 14px', background: s.bg3, borderTopLeftRadius: 8, borderTopRightRadius: 8,
              fontSize: 11, fontWeight: 700, color: s.text2, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center',
            }}>DOM Tree</div>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderTop: 'none',
              borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
              padding: 14, overflowY: 'auto', maxHeight: 340, fontSize: 12, fontFamily: s.mono,
            }}>
              {flatDom.map(({ node, depth }) => (
                <div key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  style={{
                    paddingLeft: depth * 14, lineHeight: 1.8, cursor: 'pointer',
                    color: node.displayNone ? s.text3 : selectedNode === node.id ? s.yellow : s.accent,
                    opacity: node.displayNone ? 0.35 : 1,
                    textDecoration: node.displayNone ? 'line-through' : 'none',
                    transition: 'all .15s',
                    borderRadius: 3,
                    background: selectedNode === node.id ? 'rgba(224,176,64,.08)' : 'transparent',
                  }}
                >
                  {'\u2502 '.repeat(depth)}{node.pseudo ? node.pseudo === 'before' ? '::before' : '::after' : node.tag ? `<${node.tag}>` : `"${node.text}"`}
                  {node.displayNone && <span style={{ color: s.red, marginLeft: 6, fontSize: 10 }}>hidden</span>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: '1 1 30%' }}>
            <div style={{
              padding: '8px 14px', background: s.bg3, borderTopLeftRadius: 8, borderTopRightRadius: 8,
              fontSize: 11, fontWeight: 700, color: s.text2, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center',
            }}>CSSOM</div>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderTop: 'none',
              borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
              padding: 14, overflowY: 'auto', maxHeight: 340, fontSize: 12, fontFamily: s.mono,
            }}>
              {cssomRules.map((rule, idx) => {
                const isForSelected = selectedNode && (rule.selector === flatDom.find(n => n.node.id === selectedNode)?.node.tag || rule.selector.endsWith(`::${flatDom.find(n => n.node.id === selectedNode)?.node.pseudo || ''}`))
                return (
                  <div key={idx} style={{
                    marginBottom: 6, padding: '6px 8px',
                    border: `1px solid ${isForSelected ? s.accent : s.border}`,
                    borderRadius: 4, background: isForSelected ? 'rgba(91,141,239,.06)' : 'transparent',
                    transition: 'all .15s',
                  }}>
                    <div style={{ color: s.orange, fontSize: 11, fontWeight: 600, marginBottom: 3 }}>
                      {rule.selector}
                    </div>
                    {Object.entries(rule.props).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 6, fontSize: 10, lineHeight: 1.5 }}>
                        <span style={{ color: s.text3 }}>{k}</span>
                        <span style={{ color: s.text3 }}>:</span>
                        <span style={{ color: s.green }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ flex: '1 1 40%' }}>
            <div style={{
              padding: '8px 14px', background: s.bg3, borderTopLeftRadius: 8, borderTopRightRadius: 8,
              fontSize: 11, fontWeight: 700, color: s.text2, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center',
            }}>
              Render Tree {!showFull && <span style={{ color: s.text3, fontWeight: 400 }}>(renderable only)</span>}
            </div>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderTop: 'none',
              borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
              padding: 14, overflowY: 'auto', maxHeight: 340,
            }}>
              {renderNodes.length === 0 && (
                <div style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>No renderable nodes</div>
              )}
              {renderNodes.map((rn) => {
                const depth = flatDom.find(n => n.node.id === rn.node.id)?.depth ?? 0
                return (
                  <div key={rn.node.id}
                    onClick={() => setSelectedNode(rn.node.id)}
                    style={{
                      paddingLeft: depth * 14, lineHeight: 1.8,
                      fontFamily: s.mono, fontSize: 12, cursor: 'pointer',
                      color: !rn.inRenderTree && !rn.reason ? s.text3
                        : rn.reason === 'display: none' ? s.red
                        : rn.reason === 'pseudo-element' ? s.purple
                        : selectedNode === rn.node.id ? s.yellow
                        : s.green,
                      opacity: rn.reason === 'display: none' ? 0.3 : 1,
                      textDecoration: rn.reason === 'display: none' ? 'line-through' : 'none',
                      background: selectedNode === rn.node.id ? 'rgba(224,176,64,.08)' : 'transparent',
                      borderRadius: 3,
                      transition: 'all .15s',
                    }}
                  >
                    {'\u2502 '.repeat(depth)}
                    {rn.node.pseudo ? (rn.node.pseudo === 'before' ? '::before' : '::after')
                      : rn.node.tag ? `<${rn.node.tag}>` : `"${rn.node.text}"`}
                    {rn.reason && (
                      <span style={{
                        marginLeft: 6, fontSize: 9, padding: '1px 5px', borderRadius: 3,
                        background: rn.reason === 'display: none' ? 'rgba(232,93,93,.15)' : 'rgba(155,123,234,.15)',
                        color: rn.reason === 'display: none' ? s.red : s.purple,
                        textDecoration: 'none',
                      }}>
                        {rn.reason}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {selectedNode && Object.keys(styles).length > 0 && (
          <div style={{
            marginTop: 14, padding: '12px 16px', background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Computed Styles for {flatDom.find(n => n.node.id === selectedNode)?.node.tag || selectedNode}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(styles).map(([k, v]) => (
                <span key={k} style={{
                  padding: '3px 10px', background: s.bg3, borderRadius: 4, fontSize: 11,
                  fontFamily: s.mono,
                }}>
                  <span style={{ color: s.orange }}>{k}</span>
                  <span style={{ color: s.text3 }}>: </span>
                  <span style={{ color: s.green }}>{v}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </DemoBoundary>
  )
}
