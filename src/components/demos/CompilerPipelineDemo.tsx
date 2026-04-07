import { useState, useEffect, useRef } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f',
  bg2: '#15191e',
  bg3: '#29313d',
  text: '#f1f2f3',
  text2: '#acb0b9',
  text3: '#747c8b',
  border: '#3e4a5b',
  border2: '#536279',
  accent: '#5b8def',
  green: '#3dd68c',
  red: '#e85d5d',
  yellow: '#e0b040',
  purple: '#9b7bea',
  orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

const phases = [
  {
    name: 'HIR Construction',
    color: s.accent,
    passes: ['lower', 'enterSSA', 'eliminateRedundantPhi'],
    description: 'Transforms JSX and JavaScript into the High-level Intermediate Representation (HIR). This normalized form is what all subsequent passes operate on, providing a consistent structure for analysis and transformation.',
  },
  {
    name: 'Optimization',
    color: s.green,
    passes: ['constantPropagation', 'deadCodeElimination'],
    description: 'Applies classic compiler optimizations to simplify the IR before reactive analysis begins. Constant folding replaces expressions with known values, and dead code elimination removes unreachable branches.',
  },
  {
    name: 'Type & Effect Inference',
    color: s.purple,
    passes: ['inferTypes', 'analyseFunctions', 'inferMutationAliasingEffects', 'inferReactivePlaces'],
    description: 'Infers types and side-effect profiles for every value in the program. This determines which values are stable (never change) and which are reactive (may change on re-render).',
  },
  {
    name: 'Reactive Scope Construction',
    color: s.orange,
    passes: ['inferReactiveScopeVariables', 'alignScopes', 'buildTerminals', 'flattenLoops'],
    description: 'Identifies which variables are reactive and builds the dependency graph between scopes. Each scope represents a unit of recomputation that re-runs when its dependencies change.',
  },
  {
    name: 'HIR to Reactive Function',
    color: s.yellow,
    passes: ['buildReactiveFunction'],
    description: 'Converts the optimized HIR into reactive functions \u2014 self-contained units that track their dependencies and re-execute only when those dependencies produce new values.',
  },
  {
    name: 'Reactive Fn. Optimization',
    color: s.red,
    passes: ['pruneUnused', 'mergeScopes', 'propagateEarlyReturns'],
    description: 'Optimizes reactive functions by pruning scopes with no external effects, merging adjacent scopes that share dependencies, and propagating early returns to skip unnecessary work.',
  },
  {
    name: 'Code Generation',
    color: s.green,
    passes: ['renameVariables', 'codegenReactiveFunction'],
    description: 'Emits the final JavaScript from reactive functions. Variables are renamed to avoid collisions, and the output is structured as efficient, minimal update functions.',
  },
]

export default function CompilerPipelineDemo() {
  const [selected, setSelected] = useState<number | null>(null)
  const [active, setActive] = useState<number | null>(null)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [running, setRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const boxRefs = useRef<(HTMLDivElement | null)[]>([])
  const detailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (active !== null) {
      const el = boxRefs.current[active]
      if (el) {
        el.animate(
          [
            { transform: 'scale(1)', boxShadow: `0 0 0 0 ${phases[active].color}60` },
            { transform: 'scale(1.015)', boxShadow: `0 0 28px 6px ${phases[active].color}30` },
            { transform: 'scale(1)', boxShadow: `0 0 18px 3px ${phases[active].color}20` },
          ],
          { duration: 400, iterations: 1, easing: 'ease-out' }
        )
      }
    }
  }, [active])

  useEffect(() => {
    if (selected !== null && detailRef.current) {
      detailRef.current.animate(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 220, iterations: 1, easing: 'ease-out', fill: 'forwards' }
      )
    }
  }, [selected])

  const runPipeline = () => {
    if (running) return
    setRunning(true)
    setSelected(null)
    setCompleted(new Set())
    let step = 0

    const tick = () => {
      if (step > 0) {
        setCompleted((prev) => new Set([...prev, step - 1]))
      }
      if (step < 7) {
        setActive(step)
        step++
        timerRef.current = setTimeout(tick, 500)
      } else {
        setActive(null)
        setRunning(false)
        setCompleted(new Set([0, 1, 2, 3, 4, 5, 6]))
      }
    }

    tick()
  }

  const selectedPhase = selected !== null ? phases[selected] : null

  return (
    <DemoBoundary name="Compiler Pipeline">
      <div
        style={{
          maxWidth: 820,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <button
            onClick={runPipeline}
            disabled={running}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              border: `1px solid ${running ? s.border : s.accent}`,
              background: running ? s.bg2 : `${s.accent}12`,
              color: running ? s.text3 : s.accent,
              cursor: running ? 'not-allowed' : 'pointer',
              fontFamily: s.mono,
              fontSize: 13,
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
          >
            {running ? 'Running...' : 'Run Pipeline'}
          </button>
          {completed.size === 7 && !running && (
            <span style={{ fontSize: 12, color: s.green, fontFamily: s.mono }}>
              Pipeline complete
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {phases.map((phase, i) => {
            const isActive = active === i
            const isCompleted = completed.has(i)
            const isSelected = selected === i
            const arrowNextActive = i < 6 && active === i + 1
            const arrowCompleted = i < 6 && completed.has(i)

            return (
              <div key={i}>
                <div
                  ref={(el) => {
                    boxRefs.current[i] = el
                  }}
                  onClick={() => {
                    if (!running) setSelected(isSelected ? null : i)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: isActive
                      ? `${phase.color}14`
                      : isSelected
                        ? `${phase.color}0c`
                        : s.bg2,
                    border: `1px solid ${
                      isActive ? phase.color : isSelected ? `${phase.color}50` : s.border
                    }`,
                    borderLeft: `3px solid ${
                      isActive ? phase.color : isCompleted ? s.green : `${phase.color}40`
                    }`,
                    cursor: running ? 'default' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive
                      ? `0 0 18px 3px ${phase.color}20`
                      : isCompleted
                        ? `0 0 8px 0 ${s.green}10`
                        : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      border: `2px solid ${
                        isActive ? phase.color : isCompleted ? s.green : s.border2
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: s.mono,
                      fontSize: 12,
                      fontWeight: 600,
                      color: isActive ? phase.color : isCompleted ? s.green : s.text3,
                      flexShrink: 0,
                      background: isActive
                        ? `${phase.color}18`
                        : isCompleted
                          ? `${s.green}15`
                          : 'transparent',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isCompleted && !isActive ? '\u2713' : i + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: isActive ? phase.color : s.text,
                        transition: 'color 0.3s ease',
                        marginBottom: 2,
                      }}
                    >
                      {phase.name}
                    </div>
                    <div style={{ fontSize: 11, color: s.text3, fontFamily: s.mono }}>
                      {phase.passes.length} pass{phase.passes.length !== 1 ? 'es' : ''}
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ fontSize: 10, color: phase.color, flexShrink: 0 }}>
                      {'\u25BC'}
                    </div>
                  )}
                </div>

                {i < 6 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      height: 20,
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: 1,
                          height: 10,
                          background: arrowNextActive
                            ? phases[i + 1].color
                            : arrowCompleted
                              ? s.green
                              : s.border,
                          transition: 'background 0.3s ease',
                        }}
                      />
                      <div
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: '4px solid transparent',
                          borderRight: '4px solid transparent',
                          borderTop: `4px solid ${
                            arrowNextActive
                              ? phases[i + 1].color
                              : arrowCompleted
                                ? s.green
                                : s.border
                          }`,
                          transition: 'border-color 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {selectedPhase && selected !== null && (
          <div
            ref={detailRef}
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 8,
              background: s.bg2,
              border: `1px solid ${selectedPhase.color}30`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontFamily: s.mono,
                color: selectedPhase.color,
                marginBottom: 4,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Phase {selected + 1}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: s.text, marginBottom: 8 }}>
              {selectedPhase.name}
            </div>
            <div
              style={{
                fontSize: 13,
                color: s.text2,
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            >
              {selectedPhase.description}
            </div>
            <div
              style={{
                fontSize: 10,
                fontFamily: s.mono,
                color: s.text3,
                marginBottom: 8,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Passes
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selectedPhase.passes.map((pass) => (
                <div
                  key={pass}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    background: `${selectedPhase.color}10`,
                    border: `1px solid ${selectedPhase.color}20`,
                    fontFamily: s.mono,
                    fontSize: 11,
                    color: selectedPhase.color,
                  }}
                >
                  {pass}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
