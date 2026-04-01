import { useState, useEffect, useCallback, useMemo } from 'react'
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

interface Diagnostic {
  severity: 'error'
  message: string
  line: number
  col: number
  endCol: number
}

const cleanLines = [
  'function add(a: number, b: number): number {',
  '  return a + b;',
  '}',
  '',
  'const result: number = add(1, 2);',
  'console.log(result);',
]

const brokenLines = [
  'function add(a: number, b: number): number {',
  '  return a + b;',
  '}',
  '',
  'const result: number = add("1", 2);',
  'console.log(result);',
]

const errorDiagnostic: Diagnostic = {
  severity: 'error',
  message: "Argument of type 'string' is not assignable to parameter of type 'number'.",
  line: 4,
  col: 27,
  endCol: 30,
}

const pipelineStages = [
  { id: 'edit', label: 'Claude Edits', icon: '{ }', color: s.yellow, detail: 'FileEdit replaces 1 with "1"' },
  { id: 'lsp', label: 'LSP Server', icon: 'TS', color: s.accent, detail: 'publishDiagnostics notification' },
  { id: 'registry', label: 'Registry', icon: 'DB', color: s.purple, detail: 'Dedup: LRU cache (500 files)' },
  { id: 'attach', label: 'Attachment', icon: '+', color: s.orange, detail: 'Injected into next API call' },
  { id: 'claude', label: 'Claude Fixes', icon: '*', color: s.green, detail: 'Sees error, self-corrects' },
]

type Phase = 'idle' | 'editing' | 'pipeline' | 'error' | 'fixing' | 'fixed'

export default function LspDiagnosticDemo() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [lines, setLines] = useState(cleanLines)
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null)
  const [activeStage, setActiveStage] = useState(-1)
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set())
  const [dedupCount, setDedupCount] = useState(0)
  const [fixStep, setFixStep] = useState(-1)
  const [speed, setSpeed] = useState(1)

  const highlighted = useMemo(() => {
    const map: Record<string, string> = {}
    for (const line of [...cleanLines, ...brokenLines]) {
      map[line] = Prism.highlight(line, Prism.languages.typescript, 'typescript')
    }
    return map
  }, [])

  const reset = useCallback(() => {
    setPhase('idle')
    setLines(cleanLines)
    setDiagnostic(null)
    setActiveStage(-1)
    setCompletedStages(new Set())
    setDedupCount(0)
    setFixStep(-1)
  }, [])

  const handleEdit = useCallback(() => {
    setPhase('editing')
    setDiagnostic(null)
    setCompletedStages(new Set())
    setActiveStage(-1)
    setFixStep(-1)
  }, [])

  useEffect(() => {
    if (phase === 'editing') {
      const t = setTimeout(() => {
        setLines(brokenLines)
        setPhase('pipeline')
        setActiveStage(0)
      }, getStepDelay(800, speed))
      return () => clearTimeout(t)
    }
  }, [phase, speed])

  useEffect(() => {
    if (phase !== 'pipeline') return
    if (activeStage < 0 || activeStage >= pipelineStages.length) return

    const t = setTimeout(() => {
      setCompletedStages((prev) => new Set([...prev, pipelineStages[activeStage].id]))

      if (activeStage === pipelineStages.length - 1) {
        setTimeout(() => {
          setDiagnostic(errorDiagnostic)
          setPhase('error')
          setActiveStage(-1)
        }, getStepDelay(300, speed))
      } else {
        setActiveStage(activeStage + 1)
      }
    }, getStepDelay(700, speed))

    return () => clearTimeout(t)
  }, [phase, activeStage, speed])

  const fixSteps = [
    'Claude reads diagnostic from context',
    'Identifies type mismatch on line 4',
    'Replaces "1" with 1',
    'LSP re-checks: 0 errors',
  ]

  useEffect(() => {
    if (phase !== 'fixing') return
    if (fixStep < 0) {
      setFixStep(0)
      return
    }
    if (fixStep >= fixSteps.length) {
      setLines(cleanLines)
      setDiagnostic(null)
      setPhase('fixed')
      return
    }
    const t = setTimeout(() => {
      setFixStep(fixStep + 1)
    }, getStepDelay(500, speed))
    return () => clearTimeout(t)
  }, [phase, fixStep, speed])

  const handleFix = useCallback(() => {
    setPhase('fixing')
    setFixStep(-1)
  }, [])

  const handleDedup = useCallback(() => {
    setDedupCount((c) => c + 1)
  }, [])

  const errorLine = diagnostic ? diagnostic.line - 1 : -1

  return (
    <DemoBoundary name="LSP Diagnostic Feedback">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

        <style>{`
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
          background: s.bg,
          border: `1px solid ${phase === 'error' ? s.red + '60' : s.border}`,
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 16,
          transition: 'border-color 0.3s',
        }}>
          <div style={{
            padding: '8px 14px',
            borderBottom: `1px solid ${s.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: s.mono, fontSize: 12, fontWeight: 600, color: s.text }}>
                calculator.ts
              </span>
              <span style={{ fontFamily: s.mono, fontSize: 10, color: s.text3 }}>TypeScript</span>
            </div>
            <span style={{
              fontFamily: s.mono, fontSize: 10,
              color: phase === 'error' ? s.red : phase === 'fixed' ? s.green : s.text3,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {phase === 'error' && (
                <>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.red }} />
                  1 error
                </>
              )}
              {phase === 'fixed' && (
                <>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.green }} />
                  0 errors
                </>
              )}
              {phase !== 'error' && phase !== 'fixed' && (
                <>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.text3 }} />
                  {phase === 'pipeline' ? 'analyzing...' : '0 errors'}
                </>
              )}
            </span>
          </div>

          <div style={{ padding: '6px 0', fontFamily: s.mono, fontSize: 12.5, lineHeight: 1.7 }}>
            {lines.map((line, idx) => {
              const isError = idx === errorLine
              const isEditing = phase === 'editing' && idx === 4
              return (
                <div key={idx} style={{
                  display: 'flex',
                  background: isError ? `${s.red}0c` : isEditing ? `${s.yellow}0c` : 'transparent',
                  borderLeft: isError ? `2px solid ${s.red}` : isEditing ? `2px solid ${s.yellow}` : '2px solid transparent',
                  transition: 'all 0.3s',
                }}>
                  <span style={{
                    width: 44, textAlign: 'right', paddingRight: 14,
                    color: s.text3, userSelect: 'none', flexShrink: 0, opacity: 0.6,
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{
                    color: isError ? s.red : s.text,
                    position: 'relative',
                    whiteSpace: 'pre',
                    transition: 'color 0.3s',
                  }}>
                    {line ? <code dangerouslySetInnerHTML={{ __html: highlighted[line] || line }} /> : '\u00A0'}
                    {isError && diagnostic && (
                      <span style={{
                        position: 'absolute',
                        bottom: -2,
                        left: diagnostic.col,
                        width: diagnostic.endCol - diagnostic.col,
                        height: 2,
                        borderRadius: 1,
                        background: s.red,
                      }} />
                    )}
                  </span>
                </div>
              )
            })}
          </div>

          {diagnostic && phase === 'error' && (
            <div style={{
              padding: '8px 14px',
              borderTop: `1px solid ${s.border}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              background: `${s.red}08`,
            }}>
              <span style={{
                fontFamily: s.mono, fontSize: 9, fontWeight: 700,
                color: '#fff', background: s.red,
                padding: '1px 6px', borderRadius: 3, flexShrink: 0, marginTop: 1,
              }}>
                ERR
              </span>
              <div>
                <div style={{ fontFamily: s.mono, fontSize: 11, color: s.text2, lineHeight: 1.5 }}>
                  {diagnostic.message}
                </div>
                <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginTop: 2 }}>
                  calculator.ts:{diagnostic.line}:{diagnostic.col + 1}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          padding: '14px 16px 10px',
          marginBottom: 16,
        }}>
          <div style={{
            fontFamily: s.mono, fontSize: 10, color: s.text3,
            textTransform: 'uppercase', letterSpacing: '0.5px',
            marginBottom: 14,
          }}>
            Diagnostic Pipeline
          </div>

          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
            {pipelineStages.map((stage, idx) => {
              const isActive = activeStage === idx
              const isComplete = completedStages.has(stage.id)
              return (
                <div key={stage.id} style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
                  <div style={{
                    flex: 1,
                    background: isActive ? `${stage.color}10` : isComplete ? `${stage.color}06` : s.bg2,
                    border: `1.5px solid ${isActive ? stage.color : isComplete ? `${stage.color}40` : s.border}`,
                    borderRadius: 6,
                    padding: '10px 10px 8px',
                    transition: 'all 0.35s ease',
                    position: 'relative',
                    boxShadow: isActive ? `0 0 16px ${stage.color}15` : 'none',
                    minWidth: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <div style={{
                        width: 22, height: 22,
                        borderRadius: 4,
                        background: isActive ? stage.color : isComplete ? `${stage.color}30` : s.bg3,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: s.mono, fontSize: 9, fontWeight: 700,
                        color: isActive ? s.bg : isComplete ? stage.color : s.text3,
                        transition: 'all 0.35s',
                        flexShrink: 0,
                      }}>
                        {isComplete ? '\u2713' : stage.icon}
                      </div>
                      <span style={{
                        fontFamily: s.mono, fontSize: 10, fontWeight: 600,
                        color: isActive ? stage.color : isComplete ? `${stage.color}cc` : s.text3,
                        transition: 'color 0.35s',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {stage.label}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: s.mono, fontSize: 9.5,
                      color: isActive ? s.text2 : s.text3,
                      lineHeight: 1.4,
                      opacity: isActive || isComplete ? 1 : 0.5,
                      transition: 'all 0.35s',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {stage.detail}
                    </div>
                    {isActive && (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: 2, background: stage.color,
                        borderRadius: '0 0 5px 5px',
                        animation: 'barSlide 0.7s ease forwards',
                      }} />
                    )}
                  </div>
                  {idx < pipelineStages.length - 1 && (
                    <div style={{
                      width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, position: 'relative',
                    }}>
                      <svg width="28" height="12" viewBox="0 0 28 12" style={{ overflow: 'hidden' }}>
                        <line x1="2" y1="6" x2="20" y2="6"
                          stroke={isComplete ? stage.color : s.border}
                          strokeWidth="1.5"
                          strokeDasharray={isComplete ? 'none' : '3 2'}
                          style={{ transition: 'stroke 0.3s, stroke-dasharray 0.3s' }}
                        />
                        {isComplete && (
                          <circle cx="20" cy="6" r="2" fill={stage.color}>
                            <animate attributeName="cx" from="2" to="20" dur="0.4s" fill="freeze" />
                          </circle>
                        )}
                        {isActive && (
                          <circle cx="2" cy="6" r="2" fill={stage.color}>
                            <animate attributeName="cx" from="2" to="20" dur="0.7s" fill="freeze" />
                          </circle>
                        )}
                        <path d="M20 3l5 3-5 3"
                          stroke={isComplete ? stage.color : s.border}
                          strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
                          style={{ transition: 'stroke 0.3s' }}
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {phase === 'fixing' && fixStep >= 0 && (
          <div style={{
            background: `${s.green}08`,
            border: `1px solid ${s.green}30`,
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 16,
          }}>
            <div style={{
              padding: '8px 14px',
              borderBottom: `1px solid ${s.green}20`,
              fontFamily: s.mono, fontSize: 10, color: s.green,
              textTransform: 'uppercase', letterSpacing: '0.5px',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.green }} />
              Claude Self-Correction
            </div>
            <div style={{ padding: '8px 14px', fontFamily: s.mono, fontSize: 10.5, lineHeight: 1.8 }}>
              {fixSteps.map((step, i) => (
                <div key={i} style={{
                  color: i < fixStep ? s.green : i === fixStep ? s.text : s.text3,
                  transition: 'color 0.2s',
                  opacity: i <= fixStep ? 1 : 0.4,
                }}>
                  {i < fixStep ? '\u2713' : i === fixStep ? '\u25B6' : ' '} {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {(phase === 'error' || phase === 'fixed') && (
          <div style={{
            display: 'flex',
            gap: 12,
            marginBottom: 16,
            alignItems: 'center',
          }}>
            <div style={{
              flex: 1,
              background: s.bg2,
              border: `1px solid ${s.border}`,
              borderRadius: 6,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <div>
                <div style={{ fontFamily: s.mono, fontSize: 9, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Deduplication
                </div>
                <div style={{ fontFamily: s.mono, fontSize: 10, color: s.text3, marginTop: 2 }}>
                  LRU cache by file URI + error hash
                </div>
              </div>
              <div style={{
                fontFamily: s.mono, fontSize: 20, fontWeight: 700,
                color: s.accent, flexShrink: 0,
              }}>
                {dedupCount}
                <span style={{ fontSize: 10, color: s.text3, fontWeight: 400, marginLeft: 4 }}>
                  pushed
                </span>
              </div>
              <div style={{
                fontFamily: s.mono, fontSize: 20, fontWeight: 700,
                color: s.green, flexShrink: 0,
              }}>
                1
                <span style={{ fontSize: 10, color: s.text3, fontWeight: 400, marginLeft: 4 }}>
                  unique
                </span>
              </div>
            </div>
            <button
              onClick={handleDedup}
              style={{
                padding: '7px 16px',
                background: s.bg2,
                color: s.text2,
                border: `1px solid ${s.border}`,
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: s.mono,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              Re-push Diagnostic
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {(phase === 'idle' || phase === 'fixed') && (
            <button
              onClick={phase === 'fixed' ? reset : handleEdit}
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
                transition: 'all 0.2s',
              }}
            >
              {phase === 'fixed' ? 'Replay' : 'Claude Edits Code'}
            </button>
          )}

          {(phase === 'editing' || phase === 'pipeline') && (
            <span style={{ fontFamily: s.mono, fontSize: 12, color: phase === 'editing' ? s.yellow : s.accent, animation: 'blink 1s infinite' }}>
              {phase === 'editing' ? 'Claude is editing...' : 'LSP analyzing...'}
            </span>
          )}

          {phase === 'error' && (
            <button
              onClick={handleFix}
              style={{
                padding: '8px 28px',
                background: s.green,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: s.mono,
                transition: 'all 0.2s',
              }}
            >
              Claude Fixes
            </button>
          )}

          {phase === 'fixing' && (
            <span style={{ fontFamily: s.mono, fontSize: 12, color: s.green, animation: 'blink 1s infinite' }}>
              Claude is fixing...
            </span>
          )}

          <SpeedController speed={speed} onSpeedChange={setSpeed} />
        </div>

        <style>{`
          @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
          @keyframes barSlide { from { transform: scaleX(0); transform-origin: left; } to { transform: scaleX(1); transform-origin: left; } }
        `}</style>
      </div>
    </DemoBoundary>
  )
}
