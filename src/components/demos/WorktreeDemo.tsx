import { useState, useEffect, useCallback, useMemo } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

interface FileEntry {
  name: string
  content: string
  modified: boolean
}

const FILES: FileEntry[] = [
  { name: 'app.ts', content: 'export const app = { version: "1.0" }', modified: false },
  { name: 'utils.ts', content: 'export const log = (msg: string) => console.log(msg)', modified: false },
  { name: 'index.ts', content: 'import { app } from "./app"\nconsole.log(app)', modified: false },
  { name: 'config.ts', content: 'export const port = 3000', modified: false },
]

const EDIT_MAP: Record<string, string> = {
  'app.ts': 'export const app = { version: "2.0", name: "claude-code" }',
  'utils.ts': 'export const log = (msg: string, level?: string) => {\n  const ts = Date.now()\n  console.log(`[${ts}] ${level ?? "info"}: ${msg}`)\n}',
}

type Phase = 'idle' | 'creating' | 'created' | 'editing' | 'edited' | 'merging' | 'merged' | 'removing'

function FileTree({
  title,
  files,
  highlight,
  label,
  labelColor,
  fadeOut,
  pulseFiles,
  highlightedFiles,
}: {
  title: string
  files: FileEntry[]
  highlight: boolean
  label?: string
  labelColor?: string
  fadeOut?: boolean
  pulseFiles?: string[]
  highlightedFiles: Record<string, string>
}) {
  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      background: s.bg2,
      borderRadius: 8,
      border: `1px solid ${s.border}`,
      overflow: 'hidden',
      opacity: fadeOut ? 0 : 1,
      transform: fadeOut ? 'translateY(8px) scale(0.98)' : 'translateY(0) scale(1)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${s.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: highlight ? s.accent : s.green,
          boxShadow: highlight ? `0 0 8px ${s.accent}60` : `0 0 8px ${s.green}40`,
        }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: s.text }}>{title}</span>
        {label && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: labelColor ?? s.text3,
            background: `${labelColor ?? s.text3}18`,
            padding: '2px 8px', borderRadius: 4, marginLeft: 'auto',
            fontFamily: s.mono, letterSpacing: 0.5,
          }}>
            {label}
          </span>
        )}
      </div>
      <div style={{ padding: '4px 0' }}>
        {files.map((f) => {
          const isPulsing = pulseFiles?.includes(f.name)
          return (
            <div key={f.name} style={{
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: f.modified
                ? `${s.yellow}10`
                : 'transparent',
              borderLeft: f.modified
                ? `3px solid ${s.yellow}`
                : '3px solid transparent',
              transition: 'background 0.3s ease, border-color 0.3s ease',
              opacity: isPulsing ? 1 : undefined,
              animation: isPulsing ? `pulse 1s ease infinite` : undefined,
            }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={f.modified ? s.yellow : s.text3} strokeWidth="1.4" fill="none"/>
                <path d="M10 2v3h3" stroke={f.modified ? s.yellow : s.text3} strokeWidth="1.4" fill="none"/>
              </svg>
              <span style={{
                fontSize: 12.5,
                fontFamily: s.mono,
                color: f.modified ? s.yellow : s.text2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {f.name}
              </span>
              {f.modified && (
                <span style={{
                  fontSize: 9, fontWeight: 700, color: s.bg,
                  background: s.yellow, padding: '1px 5px', borderRadius: 3,
                  marginLeft: 'auto', flexShrink: 0,
                }}>MOD</span>
              )}
            </div>
          )
        })}
      </div>
      <div style={{
        padding: '8px 14px 10px',
        borderTop: `1px solid ${s.border}`,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
      }}>
        {files.filter((f) => f.modified).map((f) => (
          <div key={f.name} style={{
            fontSize: 10.5, fontFamily: s.mono, color: s.yellow,
            background: `${s.yellow}12`, padding: '3px 7px', borderRadius: 4,
            border: `1px solid ${s.yellow}30`, lineHeight: 1.4,
          }}>
            <span style={{ color: s.text3 }}>{'// '}{f.name}{':\n'}</span>
            <code dangerouslySetInnerHTML={{ __html: highlightedFiles[f.content] || f.content }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ArrowBetween({ label, color }: { label: string; color: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 12px',
      gap: 4,
      minWidth: 80,
    }}>
      <div style={{ fontSize: 10, color: s.text3, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {label}
      </div>
      <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
        <path d="M2 12h24m0 0l-6-6m6 6l-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

function WorktreeDemo() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [mainFiles, setMainFiles] = useState<FileEntry[]>(FILES.map((f) => ({ ...f })))
  const [wtFiles, setWtFiles] = useState<FileEntry[]>([])
  const [speed, setSpeed] = useState(1)

  const highlightedFiles = useMemo(() => {
    const map: Record<string, string> = {}
    for (const f of FILES) map[f.content] = Prism.highlight(f.content, Prism.languages.typescript, 'typescript')
    for (const [, content] of Object.entries(EDIT_MAP)) map[content] = Prism.highlight(content, Prism.languages.typescript, 'typescript')
    return map
  }, [])

  const reset = useCallback(() => {
    setPhase('idle')
    setMainFiles(FILES.map((f) => ({ ...f })))
    setWtFiles([])
  }, [])

  const createWorktree = useCallback(() => {
    setPhase('creating')
    setWtFiles(FILES.map((f) => ({ ...f })))
    setTimeout(() => setPhase('created'), getStepDelay(600, speed))
  }, [speed])

  const simulateEdits = useCallback(() => {
    setPhase('editing')
    const editOrder = Object.keys(EDIT_MAP)
    let idx = 0

    const tick = () => {
      if (idx >= editOrder.length) {
        setPhase('edited')
        return
      }
      const fname = editOrder[idx]
      setWtFiles((prev) =>
        prev.map((f) =>
          f.name === fname
            ? { ...f, modified: true, content: EDIT_MAP[fname] }
            : f
        )
      )
      idx++
      setTimeout(tick, getStepDelay(500, speed))
    }

    setTimeout(tick, getStepDelay(300, speed))
  }, [speed])

  const keepBranch = useCallback(() => {
    setPhase('merging')
    setTimeout(() => {
      setMainFiles((prev) =>
        prev.map((f) =>
          EDIT_MAP[f.name] ? { ...f, content: EDIT_MAP[f.name], modified: true } : f
        )
      )
      setTimeout(() => {
        setMainFiles((prev) => prev.map((f) => ({ ...f, modified: false })))
        setWtFiles([])
        setPhase('merged')
      }, getStepDelay(800, speed))
    }, getStepDelay(600, speed))
  }, [speed])

  const removeWorktree = useCallback(() => {
    setPhase('removing')
    setTimeout(() => {
      setWtFiles([])
      setPhase('idle')
    }, getStepDelay(600, speed))
  }, [speed])

  const wtVisible = ['created', 'editing', 'edited', 'merging', 'removing'].includes(phase)

  return (
    <div style={{
      maxWidth: 820,
      margin: '0 auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        code .token.keyword { color: #f92672; }
        code .token.string, code .token.char, code .token.builtin, code .token.inserted { color: #e6db74; }
        code .token.number, code .token.constant, code .token.symbol, code .token.property, code .token.tag, code .token.boolean, code .token.deleted { color: #ae81ff; }
        code .token.selector, code .token.attr-name { color: #f92672; }
        code .token.attr-value, code .token.atrule { color: #e6db74; }
        code .token.function, code .token.class-name { color: #a6e22e; }
        code .token.operator, code .token.entity, code .token.url, code .token.punctuation { color: #f8f8f2; }
        code .token.comment, code .token.prolog, code .token.doctype, code .token.cdata { color: #75715e; font-style: italic; }
        code .token.parameter, code .token.variable, code .token.regex, code .token.important { color: #fd971f; }
      `}</style>

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0,
        transition: 'all 0.3s ease',
      }}>
        <FileTree
          title="Main Working Tree"
          files={mainFiles}
          highlight={phase === 'merging'}
          label={phase === 'merged' ? 'merged' : phase === 'merging' ? 'receiving...' : 'main'}
          labelColor={
            phase === 'merged' ? s.green
            : phase === 'merging' ? s.accent
            : s.text3
          }
          pulseFiles={phase === 'merging' ? Object.keys(EDIT_MAP) : undefined}
          highlightedFiles={highlightedFiles}
        />

        {wtVisible && (
          <>
            <ArrowBetween
              label={phase === 'merging' ? 'merging' : 'isolated'}
              color={phase === 'merging' ? s.green : s.accent}
            />
            <FileTree
              title="Worktree (claude/patch-1)"
              files={wtFiles}
              highlight
              label="worktree"
              labelColor={s.accent}
              fadeOut={phase === 'removing'}
              pulseFiles={phase === 'editing' ? Object.keys(EDIT_MAP) : undefined}
              highlightedFiles={highlightedFiles}
            />
          </>
        )}
      </div>

      <div style={{
        marginTop: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}>
        {phase === 'idle' && (
          <button
            onClick={createWorktree}
            style={btnStyle(s.accent)}
          >
            Create Worktree
          </button>
        )}

        {phase === 'created' && (
          <button
            onClick={simulateEdits}
            style={btnStyle(s.yellow, s.bg)}
          >
            Simulate Edits
          </button>
        )}

        {phase === 'edited' && (
          <>
            <button onClick={keepBranch} style={btnStyle(s.green)}>
              Keep Branch
            </button>
            <button onClick={removeWorktree} style={btnStyle(s.red, s.bg)}>
              Remove
            </button>
          </>
        )}

        {phase === 'merged' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 13, color: s.green, fontWeight: 600 }}>
              Changes merged successfully
            </span>
            <button onClick={reset} style={btnStyle(s.text3, s.bg2)}>
              Reset
            </button>
          </div>
        )}

        {['creating', 'editing', 'merging', 'removing'].includes(phase) && (
          <span style={{
            fontSize: 12, color: s.text3, fontFamily: s.mono,
            animation: 'pulse 1s ease infinite',
          }}>
            {phase === 'creating' && 'Creating worktree...'}
            {phase === 'editing' && 'Claude is editing files...'}
            {phase === 'merging' && 'Merging changes...'}
            {phase === 'removing' && 'Cleaning up worktree...'}
          </span>
        )}
      </div>

      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
        <SpeedController speed={speed} onSpeedChange={setSpeed} />
      </div>
    </div>
  )
}

function btnStyle(bg: string, color?: string): React.CSSProperties {
  return {
    background: bg,
    color: color ?? (bg === s.accent || bg === s.yellow || bg === s.green || bg === s.red ? s.bg : s.text),
    border: 'none',
    borderRadius: 6,
    padding: '8px 18px',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    cursor: 'pointer',
    transition: 'opacity 0.15s ease',
    letterSpacing: 0.2,
  }
}

function WrappedDemo() {
  return (
    <DemoBoundary name="Git Worktree Isolation">
      <WorktreeDemo />
    </DemoBoundary>
  )
}

export { WrappedDemo as default }
