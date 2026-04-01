import { useState, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'
import SpeedController, { getStepDelay } from './SpeedController'

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

const CACHE_COMPONENTS = [
  { label: 'System Prompt', detail: '4,280 tok', color: s.accent, breakKey: null as string | null },
  { label: 'Tools', detail: '12 tools', color: s.green, breakKey: 'tool' as string | null },
  { label: 'Model', detail: 'claude-sonnet-4', color: s.purple, breakKey: 'model' as string | null },
  { label: 'Msg Prefix', detail: '1,024 tok', color: s.orange, breakKey: null as string | null },
]

const TASKS = [
  { id: 'memory', name: 'Memory Extraction', desc: 'Extracts conversation context for long-term memory' },
  { id: 'suggestions', name: 'Prompt Suggestions', desc: 'Generates next-step suggestions based on context' },
  { id: 'dream', name: 'Auto-Dream', desc: 'Background reasoning to anticipate user needs' },
  { id: 'speculation', name: 'Speculation', desc: 'Pre-computes likely responses for faster delivery' },
]

function hashKey(changeModel: boolean, addTool: boolean): string {
  const str = `prompt:4280:tools:${addTool ? 13 : 12}:model:${changeModel ? 'opus' : 'sonnet'}:prefix:1024`
  let h = 0
  for (let idx = 0; idx < str.length; idx++) {
    h = ((h << 5) - h) + str.charCodeAt(idx)
    h |= 0
  }
  return Math.abs(h).toString(16).padStart(8, '0').slice(0, 8)
}

export default function ForkedAgentDemo() {
  const [phase, setPhase] = useState<'idle' | 'building' | 'ready'>('idle')
  const [buildStep, setBuildStep] = useState(-1)
  const [taskPhases, setTaskPhases] = useState<Record<string, 'idle' | 'checking' | 'result' | 'done'>>({})
  const [taskHits, setTaskHits] = useState<Record<string, boolean>>({})
  const [changeModel, setChangeModel] = useState(false)
  const [addTool, setAddTool] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [flashResult, setFlashResult] = useState<'hit' | 'miss' | null>(null)

  const isBroken = changeModel || addTool
  const hash = hashKey(changeModel, addTool)
  const runningId = Object.entries(taskPhases).find(([, ph]) => ph === 'checking' || ph === 'result')?.[0]

  const hits = Object.values(taskHits).filter(Boolean).length
  const misses = Object.values(taskHits).filter(v => !v).length
  const total = hits + misses
  const saved = hits * 0.06
  const pct = total > 0 ? Math.round((hits / total) * 100) : 0

  useEffect(() => {
    if (phase !== 'building') return
    if (buildStep >= CACHE_COMPONENTS.length) {
      setPhase('ready')
      return
    }
    const t = setTimeout(() => setBuildStep(prev => prev + 1), getStepDelay(450, speed))
    return () => clearTimeout(t)
  }, [phase, buildStep, speed])

  useEffect(() => {
    if (!runningId) return
    const ph = taskPhases[runningId]
    if (ph === 'checking') {
      setFlashResult(null)
      const t = setTimeout(() => {
        const hit = !isBroken
        setTaskHits(prev => ({ ...prev, [runningId]: hit }))
        setTaskPhases(prev => ({ ...prev, [runningId]: 'result' }))
        setFlashResult(hit ? 'hit' : 'miss')
      }, getStepDelay(700, speed))
      return () => clearTimeout(t)
    }
    if (ph === 'result') {
      const t = setTimeout(() => {
        setTaskPhases(prev => ({ ...prev, [runningId]: 'done' }))
        setFlashResult(null)
      }, getStepDelay(500, speed))
      return () => clearTimeout(t)
    }
  }, [runningId, taskPhases, isBroken, speed])

  const handleRunParent = () => {
    if (phase === 'building') return
    setPhase('building')
    setBuildStep(-1)
    setTaskPhases({})
    setTaskHits({})
    setFlashResult(null)
  }

  const handleRunTask = (id: string) => {
    if (phase !== 'ready' || runningId) return
    const ph = taskPhases[id]
    if (ph === 'checking' || ph === 'result') return
    if (taskHits[id] !== undefined) {
      setTaskHits(prev => {
        const nxt = { ...prev }
        delete nxt[id]
        return nxt
      })
    }
    setTaskPhases(prev => ({ ...prev, [id]: 'checking' }))
  }

  const handleReset = () => {
    setPhase('idle')
    setBuildStep(-1)
    setTaskPhases({})
    setTaskHits({})
    setChangeModel(false)
    setAddTool(false)
    setFlashResult(null)
  }

  const renderCompBox = (comp: typeof CACHE_COMPONENTS[number], idx: number) => {
    const active = buildStep >= idx && phase !== 'idle'
    const broken = (comp.breakKey === 'model' && changeModel) || (comp.breakKey === 'tool' && addTool)
    const bc = broken ? s.red : active ? comp.color : s.border
    const bgc = active ? (broken ? `${s.red}06` : `${comp.color}06`) : s.bg2
    return (
      <div key={comp.label} style={{
        flex: 1, background: bgc, border: `1.5px solid ${bc}`,
        borderRadius: 8, padding: '10px 10px', opacity: active ? 1 : 0.35,
        transition: 'all 0.3s ease', borderLeftWidth: 3,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: broken ? s.red : active ? comp.color : s.text3,
          textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4,
        }}>
          {comp.label}
        </div>
        <div style={{
          fontSize: 10, color: broken ? s.red : s.text2, fontFamily: s.mono,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {broken && comp.breakKey === 'model' ? 'claude-opus-4' : broken && comp.breakKey === 'tool' ? '13 tools (+web_search)' : comp.detail}
        </div>
      </div>
    )
  }

  const renderTaskCard = (task: typeof TASKS[number]) => {
    const ph = taskPhases[task.id] || 'idle'
    const hit = taskHits[task.id]
    const isRunning = ph === 'checking' || ph === 'result'
    const isDone = ph === 'done'
    const canClick = phase === 'ready' && !runningId && (ph === 'idle' || ph === 'done')
    const btnLabel = isRunning ? 'Running...' : isDone ? 'Run Again' : 'Run Task'

    return (
      <div key={task.id} style={{
        background: s.bg2,
        border: `1px solid ${isRunning ? s.accent : isDone && hit ? `${s.green}30` : isDone && hit === false ? `${s.red}30` : s.border}`,
        borderRadius: 8, padding: 14, transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: s.text }}>{task.name}</span>
              {phase === 'ready' && (
                <span style={{
                  fontSize: 8, fontWeight: 700, color: s.text3, background: s.bg3,
                  padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>forked</span>
              )}
            </div>
            <div style={{ fontSize: 10, color: s.text3, lineHeight: 1.4 }}>{task.desc}</div>
          </div>
          {isDone && hit !== undefined && (
            <div style={{
              fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 4, whiteSpace: 'nowrap',
              background: hit ? `${s.green}12` : `${s.red}12`,
              color: hit ? s.green : s.red,
              border: `1px solid ${hit ? `${s.green}35` : `${s.red}35`}`,
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {hit ? 'CACHE HIT' : 'CACHE MISS'}
            </div>
          )}
          {isRunning && ph === 'checking' && (
            <div style={{ fontSize: 10, color: s.accent, fontWeight: 600, whiteSpace: 'nowrap' }}>
              Checking...
            </div>
          )}
          {isRunning && ph === 'result' && hit !== undefined && (
            <div style={{
              fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 4, whiteSpace: 'nowrap',
              background: hit ? `${s.green}12` : `${s.red}12`,
              color: hit ? s.green : s.red,
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {hit ? 'HIT' : 'MISS'}
            </div>
          )}
        </div>

        {isRunning && (
          <div style={{ height: 3, background: s.bg3, borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: ph === 'checking' ? s.accent : hit ? s.green : s.red,
              width: ph === 'checking' ? '35%' : '85%',
              transition: 'width 0.4s ease, background 0.3s ease',
            }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => handleRunTask(task.id)} disabled={!canClick} style={{
            fontSize: 11, fontWeight: 600,
            color: canClick ? s.accent : s.text3,
            background: 'none', border: `1px solid ${canClick ? `${s.accent}50` : s.border}`,
            borderRadius: 6, padding: '5px 12px', cursor: canClick ? 'pointer' : 'default',
            opacity: canClick ? 1 : 0.4, transition: 'all 0.2s ease',
          }}>
            {btnLabel}
          </button>
          {isDone && hit !== undefined && (
            <div style={{ fontSize: 11, fontFamily: s.mono, fontWeight: 600, color: hit ? s.green : s.red }}>
              {hit ? '$0.02 cached' : '$0.08 full'}
            </div>
          )}
        </div>
      </div>
    )
  }

  const cacheKeyBorder = flashResult === 'hit' ? s.green
    : flashResult === 'miss' ? s.red
    : runningId ? s.accent
    : isBroken && phase === 'ready' ? s.red
    : phase === 'ready' ? s.green
    : s.border

  const cacheKeyShadow = flashResult === 'hit' ? `0 0 12px ${s.green}20`
    : flashResult === 'miss' ? `0 0 12px ${s.red}20`
    : runningId ? `0 0 8px ${s.accent}15`
    : 'none'

  const statusBg = phase === 'building' ? `${s.yellow}12`
    : phase === 'ready' && !isBroken ? `${s.green}12`
    : phase === 'ready' && isBroken ? `${s.red}12`
    : `${s.bg3}50`

  const statusColor = phase === 'building' ? s.yellow
    : phase === 'ready' && !isBroken ? s.green
    : phase === 'ready' && isBroken ? s.red
    : s.text3

  const statusText = phase === 'idle' ? 'Waiting'
    : phase === 'building' ? 'Building...'
    : isBroken ? 'Invalidated'
    : 'Ready'

  const hashColor = phase === 'idle' ? s.text3
    : isBroken && phase === 'ready' ? s.red
    : phase === 'ready' ? s.green
    : s.text2

  return (
    <DemoBoundary name="Forked Agent Cache">
      <div style={{
        maxWidth: 820,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: s.bg, borderRadius: 12, border: `1px solid ${s.border}`,
        padding: 24, color: s.text,
      }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Claude Code: Forked Agent Pattern</div>
          <div style={{ fontSize: 12, color: s.text3 }}>
            Background tasks share the parent request prompt cache, cutting per-task cost by ~75%
          </div>
        </div>

        <div style={{
          background: s.bg2, borderRadius: 10, border: `1px solid ${s.border}`,
          padding: 16, marginBottom: 16,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: s.text3, textTransform: 'uppercase',
            letterSpacing: '0.5px', marginBottom: 12,
          }}>
            Prompt Cache Pipeline
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {CACHE_COMPONENTS.map((comp, idx) => renderCompBox(comp, idx))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 4px' }}>
            <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
              <line x1="7" y1="0" x2="7" y2="12" stroke={phase === 'ready' ? s.green : s.border2} strokeWidth="1.5" />
              <polygon points="2.5,10 7,16 11.5,10" fill={phase === 'ready' ? s.green : s.border2} />
            </svg>
          </div>

          <div style={{
            background: s.bg, borderRadius: 8,
            border: `1.5px solid ${cacheKeyBorder}`,
            boxShadow: cacheKeyShadow,
            padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            transition: 'all 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, color: s.text3 }}>Cache Key:</span>
              <span style={{
                fontSize: 12, fontFamily: s.mono, fontWeight: 600,
                color: hashColor, transition: 'color 0.3s ease',
              }}>
                {phase !== 'idle' ? hash : '--------'}
              </span>
              {isBroken && phase === 'ready' && (
                <span style={{ fontSize: 9, color: s.red, fontWeight: 600 }}>(key changed)</span>
              )}
            </div>
            <div style={{
              fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
              background: statusBg, color: statusColor,
              textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'all 0.3s ease',
            }}>
              {statusText}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <button onClick={handleRunParent} disabled={phase === 'building'} style={{
            fontSize: 13, fontWeight: 600,
            color: phase === 'building' ? s.text3 : s.bg,
            background: phase === 'building' ? s.bg3 : s.accent,
            border: 'none', borderRadius: 8, padding: '10px 20px',
            cursor: phase === 'building' ? 'default' : 'pointer',
            transition: 'all 0.2s ease', flexShrink: 0,
          }}>
            {phase === 'idle' ? 'Run Parent Request' : phase === 'building' ? 'Establishing...' : 'Cache Ready'}
          </button>
          {phase === 'ready' && (
            <span style={{ fontSize: 11, color: s.green }}>Forked agents can now reuse this cache</span>
          )}
          {phase !== 'idle' && (
            <button onClick={handleReset} style={{
              fontSize: 11, color: s.text3, background: 'none',
              border: `1px solid ${s.border}`, borderRadius: 6,
              padding: '6px 12px', cursor: 'pointer', marginLeft: 'auto',
            }}>
              Reset
            </button>
          )}
        </div>

        {phase === 'ready' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: s.text3, textTransform: 'uppercase',
                letterSpacing: '0.5px', marginBottom: 10,
              }}>
                Cache Breakers
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setChangeModel(v => !v)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                  background: changeModel ? `${s.red}06` : s.bg2,
                  border: `1px solid ${changeModel ? `${s.red}30` : s.border}`,
                  borderRadius: 8, padding: '10px 12px', cursor: 'pointer',
                  transition: 'all 0.2s ease', textAlign: 'left' as const,
                }}>
                  <div style={{
                    width: 30, height: 16, borderRadius: 8,
                    background: changeModel ? s.red : s.bg3,
                    position: 'relative', flexShrink: 0, transition: 'background 0.2s ease',
                  }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: 6,
                      background: s.text, position: 'absolute', top: 2,
                      left: changeModel ? 16 : 2, transition: 'left 0.2s ease',
                    }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: changeModel ? s.red : s.text }}>Change Model</div>
                    <div style={{ fontSize: 9, color: s.text3 }}>Switch to claude-opus-4</div>
                  </div>
                </button>
                <button onClick={() => setAddTool(v => !v)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                  background: addTool ? `${s.red}06` : s.bg2,
                  border: `1px solid ${addTool ? `${s.red}30` : s.border}`,
                  borderRadius: 8, padding: '10px 12px', cursor: 'pointer',
                  transition: 'all 0.2s ease', textAlign: 'left' as const,
                }}>
                  <div style={{
                    width: 30, height: 16, borderRadius: 8,
                    background: addTool ? s.red : s.bg3,
                    position: 'relative', flexShrink: 0, transition: 'background 0.2s ease',
                  }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: 6,
                      background: s.text, position: 'absolute', top: 2,
                      left: addTool ? 16 : 2, transition: 'left 0.2s ease',
                    }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: addTool ? s.red : s.text }}>Add Tool</div>
                    <div style={{ fontSize: 9, color: s.text3 }}>Add web_search tool</div>
                  </div>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: s.text3, textTransform: 'uppercase',
                letterSpacing: '0.5px', marginBottom: 10,
              }}>
                Forked Background Tasks
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {TASKS.map(task => renderTaskCard(task))}
              </div>
            </div>

            {total > 0 && (
              <div style={{
                background: s.bg2, borderRadius: 8, border: `1px solid ${s.border}`,
                padding: '12px 16px', marginBottom: 16,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
              }}>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 9, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Hits</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.green, fontFamily: s.mono }}>{hits}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Misses</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.red, fontFamily: s.mono }}>{misses}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Saved</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.green, fontFamily: s.mono }}>${saved.toFixed(2)}</div>
                  </div>
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 600,
                  color: pct > 50 ? s.green : s.text3,
                  background: pct > 50 ? `${s.green}10` : `${s.bg3}30`,
                  padding: '4px 10px', borderRadius: 6,
                }}>
                  {pct}% cache hit rate
                </div>
              </div>
            )}

            {total === 0 && (
              <div style={{
                fontSize: 11, color: s.text3, marginBottom: 16,
                padding: '10px 14px', background: s.bg2, borderRadius: 8,
                border: `1px solid ${s.border}`,
              }}>
                <div style={{ fontWeight: 600, color: s.text2, marginBottom: 4 }}>Cost per request</div>
                <div style={{ display: 'flex', gap: 16, fontFamily: s.mono, fontSize: 11 }}>
                  <span>Cached: <span style={{ color: s.green, fontWeight: 600 }}>$0.02</span></span>
                  <span>Full: <span style={{ color: s.red, fontWeight: 600 }}>$0.08</span></span>
                  <span>Saving: <span style={{ color: s.green, fontWeight: 600 }}>75%</span></span>
                </div>
              </div>
            )}
          </>
        )}

        <SpeedController speed={speed} onSpeedChange={setSpeed} />
      </div>
    </DemoBoundary>
  )
}
