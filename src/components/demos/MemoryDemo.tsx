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

interface MemoryFile {
  path: string
  scope: 'managed' | 'user' | 'project' | 'local'
  label: string
  content: string
  active: boolean
}

const initialFiles: MemoryFile[] = [
  {
    path: '/etc/claude-code/CLAUDE.md',
    scope: 'managed',
    label: 'Enterprise Policy',
    content: '# Enterprise Rules\n\n- Never commit secrets to the repository\n- All code must pass CI before merge\n- Use approved dependency versions only',
    active: true,
  },
  {
    path: '~/.claude/CLAUDE.md',
    scope: 'user',
    label: 'User Global',
    content: '# My Preferences\n\n- I prefer TypeScript over JavaScript\n- Use functional programming style\n- Always write tests for new code',
    active: true,
  },
  {
    path: '~/project/CLAUDE.md',
    scope: 'project',
    label: 'Project Root',
    content: '# Project Conventions\n\n- Use Bun (not npm)\n- Components go in src/components/\n- Run `bun run build` to verify changes',
    active: true,
  },
  {
    path: '~/project/.claude/rules/typescript.md',
    scope: 'project',
    label: 'Conditional Rule',
    content: '---\npaths:\n  - "**/*.ts"\n  - "**/*.tsx"\n---\n\n# TypeScript Rules\n\n- Use `interface` over `type` for objects\n- No `any` types allowed',
    active: true,
  },
  {
    path: '~/project/CLAUDE.local.md',
    scope: 'local',
    label: 'Local Only',
    content: '# Local Settings\n\n- My dev server runs on port 3001\n- Test database is at localhost:5433',
    active: true,
  },
]

interface MemoryEntry {
  type: 'user' | 'feedback' | 'project' | 'reference'
  content: string
  scope: 'private' | 'team'
}

const initialMemories: MemoryEntry[] = [
  { type: 'user', content: 'Prefers concise commit messages, no period at end', scope: 'private' },
  { type: 'project', content: 'API routes use tRPC, not REST', scope: 'team' },
  { type: 'feedback', content: 'User prefers inline edits over creating new files', scope: 'private' },
]

const scopeColors: Record<string, string> = {
  managed: s.red,
  user: s.purple,
  project: s.accent,
  local: s.yellow,
}

const typeColors: Record<string, string> = {
  user: s.purple,
  feedback: s.orange,
  project: s.accent,
  reference: s.green,
}

const scopeLabels: Record<string, string> = {
  managed: 'Enterprise',
  user: 'User Global',
  project: 'Project (team)',
  local: 'Local (private)',
}

export default function MemoryDemo() {
  const [files, setFiles] = useState<MemoryFile[]>(initialFiles)
  const [memories, setMemories] = useState<MemoryEntry[]>(initialMemories)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [tab, setTab] = useState<'claude-md' | 'auto-memory' | 'scratchpad'>('claude-md')
  const [scratchpad, setScratchpad] = useState('')
  const [session, setSession] = useState(1)

  const activeFiles = files.filter((f) => f.active)
  const totalChars = activeFiles.reduce((sum, f) => sum + f.content.length, 0)

  const toggleFile = (path: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, active: !f.active } : f))
    )
    if (selectedFile === path) setSelectedFile(null)
  }

  const addMemory = () => {
    const types: MemoryEntry['type'][] = ['user', 'feedback', 'project', 'reference']
    const contents = [
      'User likes detailed explanations with analogies',
      'Project uses monorepo with Turborepo',
      'Avoid breaking changes in minor versions',
      'Test runner is vitest, not jest',
    ]
    const idx = memories.length % contents.length
    setMemories((prev) => [
      ...prev,
      { type: types[idx % types.length], content: contents[idx], scope: idx % 2 === 0 ? 'private' : 'team' },
    ])
  }

  const clearMemory = (idx: number) => {
    setMemories((prev) => prev.filter((_, i) => i !== idx))
  }

  const newSession = () => {
    setSession((p) => p + 1)
    setScratchpad('')
  }

  const tabs = [
    { key: 'claude-md' as const, label: 'CLAUDE.md' },
    { key: 'auto-memory' as const, label: 'Auto Memory' },
    { key: 'scratchpad' as const, label: 'Scratchpad' },
  ]

  return (
    <DemoBoundary name="Project Memory">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{
          display: 'flex',
          gap: 2,
          marginBottom: 16,
          background: s.bg,
          borderRadius: 8,
          padding: 3,
          border: `1px solid ${s.border}`,
        }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                padding: '7px 12px',
                borderRadius: 6,
                border: 'none',
                background: tab === t.key ? s.bg3 : 'transparent',
                color: tab === t.key ? s.text : s.text3,
                fontFamily: s.mono,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'claude-md' && (
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 240, flexShrink: 0 }}>
              <div style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '8px 12px',
                  borderBottom: `1px solid ${s.border}`,
                  fontFamily: s.mono,
                  fontSize: 11,
                  color: s.text3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>Memory Files</span>
                  <span>{activeFiles.length}/{files.length}</span>
                </div>
                <div style={{ padding: '4px' }}>
                  {files.map((f) => (
                    <div
                      key={f.path}
                      onClick={() => setSelectedFile(selectedFile === f.path ? null : f.path)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        marginBottom: 2,
                        background: selectedFile === f.path ? `${scopeColors[f.scope]}10` : 'transparent',
                        opacity: f.active ? 1 : 0.4,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: f.active ? scopeColors[f.scope] : s.text3,
                          flexShrink: 0,
                        }} />
                        <span style={{
                          fontFamily: s.mono,
                          fontSize: 10,
                          color: f.active ? s.text2 : s.text3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {f.label}
                        </span>
                      </div>
                      <div style={{
                        fontFamily: s.mono,
                        fontSize: 9,
                        color: s.text3,
                        paddingLeft: 13,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {f.path}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                }}>
                  <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Loading Order
                  </div>
                  {['managed', 'user', 'project', 'local'].map((scope, i) => (
                    <div key={scope} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                      <span style={{
                        fontFamily: s.mono,
                        fontSize: 9,
                        color: s.text3,
                        width: 16,
                        textAlign: 'right',
                        flexShrink: 0,
                      }}>
                        {i + 1}.
                      </span>
                      <span style={{
                        fontFamily: s.mono,
                        fontSize: 10,
                        color: scopeColors[scope],
                      }}>
                        {scopeLabels[scope]}
                      </span>
                      <span style={{ fontSize: 10, color: s.text3 }}>(lowest)</span>
                    </div>
                  ))}
                  <div style={{ fontFamily: s.mono, fontSize: 9, color: s.text3, marginTop: 4, paddingLeft: 22 }}>
                    local = highest priority
                  </div>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {selectedFile ? (
                <div style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: 8,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '10px 14px',
                    borderBottom: `1px solid ${s.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontFamily: s.mono,
                        fontSize: 12,
                        fontWeight: 600,
                        color: s.text,
                      }}>
                        {files.find((f) => f.path === selectedFile)?.label}
                      </span>
                      <span style={{
                        fontFamily: s.mono,
                        fontSize: 10,
                        color: scopeColors[files.find((f) => f.path === selectedFile)?.scope || 'project'],
                        background: `${scopeColors[files.find((f) => f.path === selectedFile)?.scope || 'project']}18`,
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}>
                        {scopeLabels[files.find((f) => f.path === selectedFile)?.scope || 'project']}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleFile(selectedFile)}
                      style={{
                        padding: '4px 10px',
                        background: files.find((f) => f.path === selectedFile)?.active ? `${s.red}18` : `${s.green}18`,
                        border: `1px solid ${files.find((f) => f.path === selectedFile)?.active ? s.red : s.green}`,
                        borderRadius: 4,
                        color: files.find((f) => f.path === selectedFile)?.active ? s.red : s.green,
                        fontFamily: s.mono,
                        fontSize: 10,
                        cursor: 'pointer',
                      }}
                    >
                      {files.find((f) => f.path === selectedFile)?.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                  <pre style={{
                    fontFamily: s.mono,
                    fontSize: 11,
                    color: s.text2,
                    padding: 14,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                    maxHeight: 260,
                    overflow: 'auto',
                  }}>
                    {files.find((f) => f.path === selectedFile)?.content}
                  </pre>
                </div>
              ) : (
                <div style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: 8,
                  padding: '16px 14px',
                }}>
                  <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    System Prompt Preview
                  </div>
                  <div style={{
                    background: s.bg2,
                    border: `1px solid ${s.border}`,
                    borderRadius: 6,
                    padding: '10px 12px',
                    fontFamily: s.mono,
                    fontSize: 10,
                    color: s.text2,
                    lineHeight: 1.6,
                    maxHeight: 300,
                    overflow: 'auto',
                  }}>
                    <div style={{ color: s.yellow, marginBottom: 8 }}>Codebase and user instructions are shown below. Be sure to adhere to these instructions. IMPORTANT: These instructions OVERRIDE any default behavior.</div>
                    {activeFiles.length === 0 ? (
                      <div style={{ color: s.text3, fontStyle: 'italic' }}>(No active memory files)</div>
                    ) : (
                      activeFiles.map((f) => (
                        <div key={f.path} style={{ marginBottom: 8 }}>
                          <div style={{ color: scopeColors[f.scope], marginBottom: 2, fontWeight: 600 }}>
                            {/* {scopeLabels[f.scope]} -- {f.label} */}
                          </div>
                          <div style={{ color: s.text3, marginBottom: 2 }}>
                            {'<'}{scopeLabels[f.scope]} -- {f.path}{'>'}
                          </div>
                          <div style={{ color: s.text2, whiteSpace: 'pre-wrap' }}>
                            {f.content.split('\n').map((line, i) => (
                              <div key={i}>{line}</div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                    <div style={{ color: s.text3, marginTop: 8, borderTop: `1px solid ${s.border}`, paddingTop: 6 }}>
                      Total: {totalChars} chars from {activeFiles.length} files
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'auto-memory' && (
          <div>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Persistent Memories
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={addMemory}
                    style={{
                      padding: '4px 10px',
                      background: `${s.accent}18`,
                      border: `1px solid ${s.accent}`,
                      borderRadius: 4,
                      color: s.accent,
                      fontFamily: s.mono,
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                  >
                    + Save Memory
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {['user', 'feedback', 'project', 'reference'].map((t) => (
                  <span key={t} style={{
                    fontFamily: s.mono,
                    fontSize: 9,
                    color: typeColors[t],
                    background: `${typeColors[t]}18`,
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>
                    {t}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {memories.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      background: s.bg2,
                      border: `1px solid ${s.border}`,
                      borderRadius: 6,
                    }}
                  >
                    <span style={{
                      fontFamily: s.mono,
                      fontSize: 9,
                      fontWeight: 600,
                      color: typeColors[m.type],
                      background: `${typeColors[m.type]}18`,
                      padding: '2px 6px',
                      borderRadius: 3,
                      flexShrink: 0,
                      width: 60,
                      textAlign: 'center',
                    }}>
                      {m.type}
                    </span>
                    <span style={{
                      fontSize: 12,
                      color: s.text2,
                      flex: 1,
                    }}>
                      {m.content}
                    </span>
                    <span style={{
                      fontFamily: s.mono,
                      fontSize: 9,
                      color: m.scope === 'team' ? s.accent : s.text3,
                      flexShrink: 0,
                    }}>
                      {m.scope}
                    </span>
                    <button
                      onClick={() => clearMemory(i)}
                      style={{
                        padding: '2px 6px',
                        background: 'transparent',
                        border: `1px solid ${s.border}`,
                        borderRadius: 3,
                        color: s.text3,
                        fontFamily: s.mono,
                        fontSize: 9,
                        cursor: 'pointer',
                      }}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '10px 14px',
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                How Auto Memory Works
              </div>
              {[
                ['Save', 'Claude writes observations to .claude/agent-memory/'],
                ['Index', 'MEMORY.md entrypoint is updated with a pointer'],
                ['Load', 'On next session, MEMORY.md is read into context'],
                ['Trust', 'Stale memories are flagged -- do not blindly trust'],
              ].map(([step, desc], i) => (
                <div key={step} style={{ display: 'flex', gap: 8, padding: '3px 0', fontFamily: s.mono, fontSize: 10 }}>
                  <span style={{ color: s.accent, flexShrink: 0, width: 46 }}>{step}</span>
                  <span style={{ color: s.text3 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'scratchpad' && (
          <div>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '10px 14px',
                borderBottom: `1px solid ${s.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: s.mono, fontSize: 11, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Session Scratchpad
                  </span>
                  <span style={{
                    fontFamily: s.mono,
                    fontSize: 10,
                    color: s.yellow,
                    background: `${s.yellow}18`,
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>
                    session #{session}
                  </span>
                </div>
                <button
                  onClick={newSession}
                  style={{
                    padding: '4px 10px',
                    background: `${s.accent}18`,
                    border: `1px solid ${s.accent}`,
                    borderRadius: 4,
                    color: s.accent,
                    fontFamily: s.mono,
                    fontSize: 10,
                    cursor: 'pointer',
                  }}
                >
                  New Session
                </button>
              </div>
              <textarea
                value={scratchpad}
                onChange={(e) => setScratchpad(e.target.value)}
                placeholder={`Claude writes temporary notes here...\n\nPath: /tmp/claude-<uid>/dotsdecoded-blog/${session}/scratchpad/\n\nWrites bypass permission checks.`}
                style={{
                  width: '100%',
                  minHeight: 120,
                  padding: '12px 14px',
                  background: s.bg2,
                  border: 'none',
                  color: s.text2,
                  fontFamily: s.mono,
                  fontSize: 12,
                  lineHeight: 1.6,
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: '10px 14px',
              marginTop: 12,
            }}>
              <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Scratchpad Properties
              </div>
              {[
                ['Scope', 'Per-session (cleared on new session)'],
                ['Path', '/tmp/claude-<uid>/<cwd>/<sessionId>/scratchpad/'],
                ['Permissions', 'Bypasses all permission checks'],
                ['Isolation', 'Each session gets its own directory'],
                ['Cleanup', 'Automatic on session end'],
              ].map(([key, val]) => (
                <div key={key} style={{ display: 'flex', gap: 8, padding: '3px 0', fontFamily: s.mono, fontSize: 10 }}>
                  <span style={{ color: s.yellow, flexShrink: 0, width: 76 }}>{key}</span>
                  <span style={{ color: s.text3 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
