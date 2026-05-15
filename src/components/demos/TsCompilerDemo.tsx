import { useState, useEffect, useMemo, useCallback } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
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

const sourceCode = `function greet(name: string): string {
  return "Hello, " + name
}

const msg = greet("World")
console.log(msg)`

interface Phase {
  id: string
  label: string
  icon: string
  desc: string
  detail: string
  color: string
}

const phases: Phase[] = [
  { id: 'source', label: 'Source Code', icon: 'S', desc: 'Raw TypeScript text', detail: 'The .ts file as the developer wrote it — a stream of characters.', color: s.text3 },
  { id: 'scanner', label: 'Scanner', icon: 'SC', desc: 'Tokenization', detail: 'Breaks the source text into tokens: keywords, identifiers, operators, literals, and punctuation. Whitespace and comments are discarded.', color: s.yellow },
  { id: 'parser', label: 'Parser', icon: 'P', desc: 'AST Construction', detail: 'Builds an Abstract Syntax Tree from the token stream. Each node represents a language construct: function declaration, variable statement, call expression.', color: s.orange },
  { id: 'binder', label: 'Binder', icon: 'B', desc: 'Symbol Table', detail: 'Creates a Symbol for each declaration (function, variable, parameter, type). Builds the symbol table by walking the AST and assigning scopes.', color: s.purple },
  { id: 'checker', label: 'Checker', icon: 'C', desc: 'Type Checking', detail: 'Resolves types for every expression using the symbol table. Checks assignability, validates generic arguments, and reports type errors.', color: s.accent },
  { id: 'emitter', label: 'Emitter', icon: 'E', desc: 'JS Output', detail: 'Transforms the checked AST into JavaScript output. Removes type annotations, compiles downlevel features, produces the final .js file.', color: s.green },
]

const phaseData: Record<string, { content: string; tokens?: string[]; ast?: string; symbols?: string; errors?: string }> = {
  source: {
    content: sourceCode,
  },
  scanner: {
    content: sourceCode,
    tokens: [
      'Keyword: function',
      'Identifier: greet',
      'OpenParen: (',
      'Identifier: name',
      'Colon: :',
      'Keyword: string',
      'CloseParen: )',
      'Colon: :',
      'Keyword: string',
      'OpenBrace: {',
      'Keyword: return',
      'StringLiteral: "Hello, "',
      'Plus: +',
      'Identifier: name',
      'Semicolon: ;',
      'CloseBrace: }',
      'Keyword: const',
      'Identifier: msg',
      'Equals: =',
      'Identifier: greet',
      'OpenParen: (',
      'StringLiteral: "World"',
      'CloseParen: )',
      'Semicolon: ;',
      'Identifier: console',
      'Dot: .',
      'Identifier: log',
      'OpenParen: (',
      'Identifier: msg',
      'CloseParen: )',
      'Semicolon: ;',
    ],
  },
  parser: {
    content: sourceCode,
    ast: `SourceFile
  FunctionDeclaration "greet"
    Parameter: name: string
    ReturnType: string
    Block
      ReturnStatement
        BinaryExpression +
          StringLiteral "Hello, "
          Identifier name
  VariableStatement
    VariableDeclaration "msg"
      CallExpression
        Identifier greet
        Argument: StringLiteral "World"
  ExpressionStatement
    CallExpression
      PropertyAccess console.log
        Identifier msg`,
  },
  binder: {
    content: sourceCode,
    symbols: `Symbol Table
  greet  -> Function  [global scope]
    name -> Parameter [function scope: greet]
  msg    -> Variable  [global scope]
  console -> External [lib.d.ts]
  log    -> Function  [namespace: console]`,
  },
  checker: {
    content: sourceCode,
    errors: 'No type errors found.',
  },
  emitter: {
    content: `function greet(name) {
  return "Hello, " + name;
}
var msg = greet("World");
console.log(msg);`,
  },
}

export default function TsCompilerDemo() {
  const [activePhase, setActivePhase] = useState('')
  const [speed, setSpeed] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playPhaseIdx, setPlayPhaseIdx] = useState(-1)
  const [completedPhases, setCompletedPhases] = useState<Set<string>>(new Set())

  const highlightedSource = useMemo(
    () => Prism.highlight(sourceCode, Prism.languages.typescript, 'typescript'),
    [],
  )

  const highlightedEmitter = useMemo(() => {
    if (!phaseData.emitter) return ''
    return Prism.highlight(phaseData.emitter.content, Prism.languages.javascript, 'javascript')
  }, [])

  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    setPlayPhaseIdx(0)
    setActivePhase(phases[0].id)
    setCompletedPhases(new Set())
  }, [])

  const handleReset = useCallback(() => {
    setIsPlaying(false)
    setPlayPhaseIdx(-1)
    setActivePhase('')
    setCompletedPhases(new Set())
  }, [])

  useEffect(() => {
    if (!isPlaying || playPhaseIdx < 0) return
    if (playPhaseIdx >= phases.length) {
      setIsPlaying(false)
      setPlayPhaseIdx(-1)
      return
    }
    const phase = phases[playPhaseIdx]
    setActivePhase(phase.id)
    const t = setTimeout(() => {
      setCompletedPhases(prev => new Set([...prev, phase.id]))
      setPlayPhaseIdx(playPhaseIdx + 1)
    }, getStepDelay(1200, speed))
    return () => clearTimeout(t)
  }, [isPlaying, playPhaseIdx, speed])

  const phase = phases.find(p => p.id === activePhase)
  const data = activePhase ? phaseData[activePhase] : null

  return (
    <DemoBoundary name="TypeScript Compiler Pipeline">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{`
          .tsc2-code .token.keyword { color: #f92672; }
          .tsc2-code .token.string, .tsc2-code .token.char, .tsc2-code .token.builtin, .tsc2-code .token.inserted { color: #e6db74; }
          .tsc2-code .token.number, .tsc2-code .token.constant, .tsc2-code .token.symbol, .tsc2-code .token.property, .tsc2-code .token.tag, .tsc2-code .token.boolean, .tsc2-code .token.deleted { color: #ae81ff; }
          .tsc2-code .token.selector, .tsc2-code .token.attr-name { color: #f92672; }
          .tsc2-code .token.attr-value, .tsc2-code .token.atrule { color: #e6db74; }
          .tsc2-code .token.function, .tsc2-code .token.class-name { color: #a6e22e; }
          .tsc2-code .token.operator, .tsc2-code .token.entity, .tsc2-code .token.url, .tsc2-code .token.punctuation { color: #f8f8f2; }
          .tsc2-code .token.comment, .tsc2-code .token.prolog, .tsc2-code .token.doctype, .tsc2-code .token.cdata { color: #75715e; font-style: italic; }
          .tsc2-code .token.parameter, .tsc2-code .token.variable, .tsc2-code .token.regex, .tsc2-code .token.important { color: #fd971f; }
        `}</style>

        <div style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          <div style={{
            padding: '8px 14px',
            borderBottom: `1px solid ${s.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Input: greet.ts
            </span>
          </div>
          <div style={{
            padding: 14,
            fontFamily: s.mono,
            fontSize: 13,
            lineHeight: 1.7,
            overflowX: 'auto',
            opacity: activePhase && activePhase !== 'source' ? 0.5 : 1,
            transition: 'opacity 0.3s',
          }}>
            <code className="tsc2-code" dangerouslySetInnerHTML={{ __html: highlightedSource }} />
          </div>
        </div>

        <div style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, flexWrap: 'wrap' }}>
            {phases.map((p, idx) => {
              const isActive = activePhase === p.id
              const isComplete = completedPhases.has(p.id)
              return (
                <div key={p.id} style={{ flex: '1 1 120px', display: 'flex', alignItems: 'stretch' }}>
                  <div
                    onClick={() => {
                      if (!isPlaying) {
                        setActivePhase(p.id)
                        setCompletedPhases(prev => new Set([...prev, p.id]))
                      }
                    }}
                    style={{
                      flex: 1,
                      background: isActive ? `${p.color}15` : isComplete ? `${p.color}08` : s.bg,
                      border: `1.5px solid ${isActive ? p.color : isComplete ? `${p.color}50` : s.border}`,
                      borderRadius: 6,
                      padding: '10px 8px',
                      cursor: isPlaying ? 'default' : 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: isActive ? `0 0 12px ${p.color}20` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 4,
                        background: isActive ? p.color : isComplete ? `${p.color}40` : s.bg3,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: s.mono, fontSize: 8, fontWeight: 700,
                        color: isActive ? '#000' : isComplete ? p.color : s.text3,
                        transition: 'all 0.3s', flexShrink: 0,
                      }}>
                        {isComplete && !isActive ? '\u2713' : p.icon}
                      </div>
                      <span style={{
                        fontFamily: s.mono, fontSize: 9, fontWeight: 600,
                        color: isActive ? p.color : isComplete ? `${p.color}bb` : s.text3,
                        transition: 'color 0.3s',
                      }}>
                        {p.label}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: s.mono, fontSize: 8.5,
                      color: isActive ? s.text2 : s.text3,
                      lineHeight: 1.3,
                      opacity: isActive || isComplete ? 1 : 0.5,
                    }}>
                      {p.desc}
                    </div>
                  </div>
                  {idx < phases.length - 1 && (
                    <div style={{
                      width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <svg width="20" height="10" viewBox="0 0 20 10">
                        <line x1="1" y1="5" x2="14" y2="5"
                          stroke={isComplete ? p.color : s.border}
                          strokeWidth="1.5"
                          strokeDasharray={isComplete ? 'none' : '2 3'}
                        />
                        {isComplete && (
                          <circle cx="14" cy="5" r="1.5" fill={p.color} />
                        )}
                        <path d="M14 2.5l4 2.5-4 2.5"
                          stroke={isComplete ? p.color : s.border}
                          strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {activePhase && data && (
          <div style={{
            background: s.bg,
            border: `1px solid ${(phase?.color || s.border)}50`,
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            <div style={{
              padding: '8px 14px',
              borderBottom: `1px solid ${s.border}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: phase?.color || s.text3, flexShrink: 0,
              }} />
              <span style={{ fontFamily: s.mono, fontSize: 10, color: phase?.color || s.text, fontWeight: 600 }}>
                {phase?.label}
              </span>
              <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>
                {phase?.desc}
              </span>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, lineHeight: 1.5, marginBottom: 12 }}>
                {phase?.detail}
              </div>

              {activePhase === 'scanner' && data.tokens && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 4,
                  fontFamily: s.mono, fontSize: 11,
                }}>
                  {data.tokens.map((token, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '3px 8px',
                        background: s.bg2,
                        border: `1px solid ${s.border}`,
                        borderRadius: 4,
                        color: token.startsWith('Keyword') ? s.yellow
                          : token.startsWith('StringLiteral') ? s.green
                          : token.startsWith('Identifier') ? s.text
                          : s.text3,
                        fontSize: 10,
                      }}
                    >
                      {token}
                    </span>
                  ))}
                </div>
              )}

              {activePhase === 'parser' && data.ast && (
                <div style={{
                  background: s.bg2,
                  border: `1px solid ${s.border}`,
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontFamily: s.mono,
                  fontSize: 11,
                  lineHeight: 1.7,
                  color: s.text,
                  whiteSpace: 'pre',
                  overflowX: 'auto',
                }}>
                  {data.ast.split('\n').map((line, i) => (
                    <div key={i}>
                      {line.split(/(?<=\w)(?=[A-Z])/).map((part, j) => (
                        <span key={j} style={{
                          color: part.includes('Declaration') || part.includes('Statement') || part.includes('Expression') || part.includes('Block')
                            ? s.orange
                            : part.includes('Parameter') || part.includes('ReturnType')
                              ? s.purple
                              : part.includes('StringLiteral') || part.includes('Identifier')
                                ? s.accent
                                : s.text,
                        }}>
                          {i === 0 && j === 0 ? part : part}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {activePhase === 'binder' && data.symbols && (
                <div style={{
                  background: s.bg2,
                  border: `1px solid ${s.border}`,
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontFamily: s.mono,
                  fontSize: 11,
                  lineHeight: 1.7,
                  color: s.text,
                  whiteSpace: 'pre',
                }}>
                  {data.symbols.split('\n').map((line, i) => (
                    <div key={i} style={{
                      color: line.includes('->') ? s.text
                        : line.includes('global') || line.includes('function') || line.includes('namespace')
                          ? s.text3 : s.text,
                    }}>
                      {line}
                    </div>
                  ))}
                </div>
              )}

              {activePhase === 'checker' && (
                <div style={{
                  background: `${s.green}08`,
                  border: `1px solid ${s.green}30`,
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontFamily: s.mono,
                  fontSize: 12,
                  color: s.green,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: s.green,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#000', fontSize: 10, fontWeight: 700, flexShrink: 0,
                  }}>
                    OK
                  </span>
                  No type errors found. All type annotations are satisfied.
                </div>
              )}

              {activePhase === 'emitter' && (
                <div style={{
                  background: s.bg2,
                  border: `1px solid ${s.border}`,
                  borderRadius: 6,
                  padding: 12,
                  fontFamily: s.mono,
                  fontSize: 13,
                  lineHeight: 1.7,
                  overflowX: 'auto',
                }}>
                  <code className="tsc2-code" dangerouslySetInnerHTML={{ __html: highlightedEmitter }} />
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              style={{
                padding: '8px 28px',
                background: s.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: s.mono,
              }}
            >
              Run Pipeline
            </button>
          ) : (
            <span style={{ fontFamily: s.mono, fontSize: 12, color: s.accent, animation: 'tspulse 1s infinite' }}>
              Processing...
            </span>
          )}
          {(activePhase || completedPhases.size > 0) && (
            <button
              onClick={handleReset}
              style={{
                padding: '8px 20px',
                background: s.bg2,
                color: s.text2,
                border: `1px solid ${s.border}`,
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: s.mono,
              }}
            >
              Reset
            </button>
          )}
          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <style>{`
          @keyframes tspulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        `}</style>
      </div>
    </DemoBoundary>
  )
}
