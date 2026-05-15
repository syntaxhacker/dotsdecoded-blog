import { useState, useEffect, useRef, useCallback } from 'react'
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

const H: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: s.text, marginBottom: 12, letterSpacing: -0.3 }
const SEC: React.CSSProperties = { background: s.bg2, borderRadius: 12, padding: '24px 28px', marginBottom: 24 }

const SAMPLE_HTML = `<html>
  <body>
    <div>
      <h1>Title</h1>
      <p>Text</p>
    </div>
  </body>
</html>`

interface Token {
  type: 'StartTag' | 'EndTag' | 'Text'
  name: string
  start: number
  end: number
}

interface TreeNode {
  name: string
  children: TreeNode[]
  depth: number
  tokenIdx: number
}

function tokenize(html: string): Token[] {
  const tokens: Token[] = []
  const tagRe = /<\/?[a-zA-Z0-9-]+>|[^<]+/g
  let m: RegExpExecArray | null
  const re = new RegExp(tagRe.source, 'g')
  while ((m = re.exec(html)) !== null) {
    const raw = m[0]
    if (raw.startsWith('</')) {
      tokens.push({ type: 'EndTag', name: raw.slice(2, -1), start: m.index, end: m.index + raw.length })
    } else if (raw.startsWith('<')) {
      tokens.push({ type: 'StartTag', name: raw.slice(1, -1), start: m.index, end: m.index + raw.length })
    } else {
      const text = raw.trim()
      if (text) {
        tokens.push({ type: 'Text', name: text, start: m.index, end: m.index + raw.length })
      }
    }
  }
  return tokens
}

function buildTree(tokens: Token[], count: number): TreeNode[] {
  const stack: { node: TreeNode; idx: number }[] = []
  const roots: TreeNode[] = []
  for (let i = 0; i < Math.min(count, tokens.length); i++) {
    const t = tokens[i]
    if (t.type === 'StartTag') {
      const node: TreeNode = { name: t.name, children: [], depth: stack.length, tokenIdx: i }
      if (stack.length > 0) {
        stack[stack.length - 1].node.children.push(node)
      } else {
        roots.push(node)
      }
      stack.push({ node, idx: i })
    } else if (t.type === 'EndTag') {
      if (stack.length > 0) {
        const top = stack[stack.length - 1]
        if (top.node.name === t.name) {
          stack.pop()
        }
      }
    } else if (t.type === 'Text') {
      const node: TreeNode = { name: t.name, children: [], depth: stack.length, tokenIdx: i }
      if (stack.length > 0) {
        stack[stack.length - 1].node.children.push(node)
      } else {
        roots.push(node)
      }
    }
  }
  return roots
}

const tokens = tokenize(SAMPLE_HTML)
const totalSteps = tokens.length

function renderTree(nodes: TreeNode[], currentTokenIdx: number, depth: number): string[] {
  let lines: string[] = []
  for (const node of nodes) {
    const isNew = node.tokenIdx === currentTokenIdx
    const indent = '  '.repeat(depth)
    const prefix = isNew ? '> ' : '  '
    const connector = depth === 0 ? '' : '| '
    if (node.children.length > 0 || (node.tokenIdx >= 0 && tokens[node.tokenIdx]?.type === 'StartTag')) {
      lines.push(`${indent}${connector}${prefix}<span style="color:${isNew ? s.yellow : s.accent}">${node.name}</span>`)
    } else {
      lines.push(`${indent}${connector}${prefix}<span style="color:${isNew ? s.yellow : s.green}">"${node.name}"</span>`)
    }
    if (node.children.length > 0) {
      lines = lines.concat(renderTree(node.children, currentTokenIdx, depth + 1))
    }
  }
  return lines
}

export default function HtmlParsingDemo() {
  const [step, setStep] = useState(0)
  const [autoPlaying, setAutoPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const treeRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  useEffect(() => {
    if (treeRef.current) {
      treeRef.current.scrollTop = treeRef.current.scrollHeight
    }
  }, [step])

  useEffect(() => {
    if (!autoPlaying) return
    if (step >= totalSteps) {
      setAutoPlaying(false)
      return
    }
    const t = window.setTimeout(() => {
      setStep(prev => prev + 1)
    }, getStepDelay(600, speed))
    timerRef.current = t
    return () => clearTimeout(t)
  }, [autoPlaying, step, speed])

  const handleStep = useCallback(() => {
    if (step < totalSteps) setStep(prev => prev + 1)
  }, [step])

  const handleAuto = useCallback(() => {
    if (step >= totalSteps) {
      setStep(0)
    }
    setAutoPlaying(prev => !prev)
  }, [step])

  const handleReset = useCallback(() => {
    setAutoPlaying(false)
    setStep(0)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const currentToken = step > 0 ? step - 1 : -1
  const tree = buildTree(tokens, step)
  const currentTok = currentToken >= 0 ? tokens[currentToken] : null

  return (
    <DemoBoundary name="HTML Parsing">
    <div style={{ maxWidth: 820, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: s.text }}>
      <div style={SEC}>
        <div style={H}>HTML Parsing</div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleStep} disabled={autoPlaying || step >= totalSteps} style={{
            padding: '8px 18px', background: step >= totalSteps ? s.bg3 : s.accent, color: s.text,
            border: 'none', borderRadius: 6, cursor: step >= totalSteps || autoPlaying ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600, opacity: step >= totalSteps || autoPlaying ? 0.5 : 1,
            transition: 'opacity .2s',
          }}>Step</button>
          <button onClick={handleAuto} style={{
            padding: '8px 18px', background: autoPlaying ? s.red : s.green, color: s.text,
            border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            transition: 'background .2s',
          }}>{autoPlaying ? 'Stop' : 'Auto-Play'}</button>
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
          <button onClick={handleReset} style={{
            padding: '8px 18px', background: s.bg3, color: s.text2,
            border: `1px solid ${s.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 13,
          }}>Reset</button>
          <span style={{ color: s.text3, fontFamily: s.mono, fontSize: 12, marginLeft: 'auto' }}>
            {step} / {totalSteps} tokens
          </span>
        </div>

        {currentTok && (
          <div style={{
            padding: '8px 14px', background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 6, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ color: s.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Token:</span>
            <span style={{
              padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600,
              background: currentTok.type === 'StartTag' ? 'rgba(91,141,239,.15)' : currentTok.type === 'EndTag' ? 'rgba(224,176,64,.12)' : 'rgba(61,214,140,.15)',
              color: currentTok.type === 'StartTag' ? s.accent : currentTok.type === 'EndTag' ? s.yellow : s.green,
            }}>{currentTok.type}</span>
            <span style={{ color: s.text, fontFamily: s.mono, fontSize: 12 }}>
              {currentTok.type === 'Text' ? `"${currentTok.name}"` : `${currentTok.name}`}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: '1 1 45%' }}>
            <div style={{
              padding: '8px 14px', background: s.bg3, borderTopLeftRadius: 8, borderTopRightRadius: 8,
              fontSize: 11, fontWeight: 700, color: s.text2, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>HTML Source</div>
            <div style={{
              background: s.bg, border: `1px solid ${s.border}`, borderTop: 'none',
              borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
              padding: 14, fontFamily: s.mono, fontSize: 12, lineHeight: 1.8,
              overflow: 'auto', maxHeight: 300,
            }}>
              {SAMPLE_HTML.split('\n').map((line, idx) => {
                const lineStart = SAMPLE_HTML.indexOf(line)
                const lineEnd = lineStart + line.length
                const hasHighlight = currentToken >= 0 && tokens[currentToken] &&
                  tokens[currentToken].start >= lineStart && tokens[currentToken].start < lineEnd
                return (
                  <div key={idx} style={{
                    background: hasHighlight ? 'rgba(91,141,239,.1)' : 'transparent',
                    borderRadius: 3, padding: '0 4px',
                    transition: 'background .15s',
                  }}>
                    {line || '\u00A0'}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ flex: '1 1 55%' }}>
            <div style={{
              padding: '8px 14px', background: s.bg3, borderTopLeftRadius: 8, borderTopRightRadius: 8,
              fontSize: 11, fontWeight: 700, color: s.text2, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>DOM Tree</div>
            <div ref={treeRef} style={{
              background: s.bg, border: `1px solid ${s.border}`, borderTop: 'none',
              borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
              padding: 14, fontFamily: s.mono, fontSize: 12, lineHeight: 1.8,
              overflowY: 'auto', maxHeight: 300,
            }}>
              {tree.length === 0 ? (
                <div style={{ color: s.text3, fontStyle: 'italic' }}>Parsing not started...</div>
              ) : (
                <div style={{ whiteSpace: 'pre' }} dangerouslySetInnerHTML={{
                  __html: renderTree(tree, currentToken, 0).join('\n')
                }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </DemoBoundary>
  )
}
