import { useState, useEffect, useCallback } from 'react'
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

type AgentStatus = 'idle' | 'initializing' | 'working' | 'complete'

interface SubAgent {
  id: string
  label: string
  type: 'explore' | 'general'
  duration: number
  result: string
  status: AgentStatus
  progress: number
  startTime: number | null
  endTime: number | null
}

const AGENT_DEFS: Omit<SubAgent, 'status' | 'progress' | 'startTime' | 'endTime'>[] = [
  { id: 'explore', label: 'Explore Codebase', type: 'explore', duration: 2000, result: 'Found 23 files' },
  { id: 'create', label: 'Create Demo Component', type: 'general', duration: 5000, result: 'Created Button.tsx' },
  { id: 'tests', label: 'Run Tests', type: 'general', duration: 3000, result: 'All 5 tests pass' },
]

const TICK_MS = 50

function createAgents(): SubAgent[] {
  return AGENT_DEFS.map((d) => ({
    ...d,
    status: 'idle' as AgentStatus,
    progress: 0,
    startTime: null,
    endTime: null,
  }))
}

const badgeColor = (type: 'explore' | 'general') => (type === 'explore' ? s.yellow : s.accent)
const badgeLabel = (type: 'explore' | 'general') => (type === 'explore' ? 'EXPLORE' : 'GENERAL')

const statusColor = (st: AgentStatus) => {
  if (st === 'initializing') return s.yellow
  if (st === 'working') return s.orange
  if (st === 'complete') return s.green
  return s.text3
}

const statusLabel = (st: AgentStatus) => {
  if (st === 'initializing') return 'Initializing...'
  if (st === 'working') return 'Working...'
  if (st === 'complete') return 'Complete'
  return 'Waiting'
}

export default function SubAgentDemo() {
  const [agents, setAgents] = useState<SubAgent[]>(createAgents)
  const [spawned, setSpawned] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [allDone, setAllDone] = useState(false)
  const [parentDone, setParentDone] = useState(false)
  const [originTime, setOriginTime] = useState<number | null>(null)

  const reset = useCallback(() => {
    setAgents(createAgents())
    setSpawned(false)
    setElapsed(0)
    setAllDone(false)
    setParentDone(false)
    setOriginTime(null)
  }, [])

  const spawn = useCallback(() => {
    const now = performance.now()
    setOriginTime(now)
    setSpawned(true)
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        status: 'initializing' as AgentStatus,
        startTime: now,
      }))
    )
  }, [])

  useEffect(() => {
    if (!spawned) return
    const timer = setInterval(() => {
      setElapsed(performance.now() - (originTime ?? performance.now()))
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [spawned, originTime])

  useEffect(() => {
    if (!spawned) return
    const initTimer = setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.status === 'initializing' ? { ...a, status: 'working' } : a
        )
      )
    }, 300)
    return () => clearTimeout(initTimer)
  }, [spawned])

  useEffect(() => {
    if (!spawned || !originTime) return
    const timer = setInterval(() => {
      setAgents((prev) => {
        const now = performance.now()
        let allComplete = true
        const updated = prev.map((a) => {
          if (a.status === 'complete') return a
          if (a.status === 'idle') {
            allComplete = false
            return a
          }
          const age = now - (a.startTime ?? now)
          const initOffset = 300
          const workAge = Math.max(0, age - initOffset)
          const progress = Math.min(100, (workAge / a.duration) * 100)
          const done = progress >= 100
          if (!done) allComplete = false
          return {
            ...a,
            progress,
            status: done ? 'complete' : a.status,
            endTime: done ? now : null,
          }
        })
        return updated
      })
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [spawned, originTime])

  useEffect(() => {
    if (!spawned) return
    const anyComplete = agents.some((a) => a.status === 'complete')
    if (!anyComplete) return
    const allComplete = agents.every((a) => a.status === 'complete')
    if (allComplete) {
      setAllDone(true)
      const timer = setTimeout(() => setParentDone(true), 600)
      return () => clearTimeout(timer)
    }
  }, [agents, spawned])

  const maxDuration = 5000

  return (
    <DemoBoundary name="Sub-Agents">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{
          background: s.bg2,
          border: `1px solid ${s.border}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${s.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: `linear-gradient(135deg, ${s.accent}, ${s.purple})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.text, fontWeight: 700, fontSize: 14, fontFamily: s.mono,
              }}>C</div>
              <div>
                <div style={{ color: s.text, fontWeight: 600, fontSize: 15 }}>Parent Agent</div>
                <div style={{ color: s.text3, fontSize: 12, fontFamily: s.mono }}>claude-code main session</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!spawned && (
                <button onClick={spawn} style={{
                  background: s.accent, color: '#fff', border: 'none', borderRadius: 6,
                  padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: s.mono,
                }}>Spawn Sub-Agents</button>
              )}
              {spawned && (
                <button onClick={reset} style={{
                  background: s.bg3, color: s.text2, border: `1px solid ${s.border}`,
                  borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: s.mono,
                }}>Reset</button>
              )}
            </div>
          </div>

          <div style={{ padding: '16px 24px' }}>
            <div style={{
              display: 'flex', gap: 12, flexDirection: 'column',
            }}>
              {agents.map((agent) => (
                <div key={agent.id} style={{
                  background: s.bg,
                  border: `1px solid ${agent.status === 'complete' ? s.green + '40' : s.border}`,
                  borderRadius: 10,
                  padding: '16px 18px',
                  opacity: agent.status === 'idle' ? 0.35 : 1,
                  transition: 'opacity 0.3s, border-color 0.3s',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: agent.status !== 'idle' ? 10 : 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 10,
                        fontWeight: 700, fontFamily: s.mono, letterSpacing: 0.5,
                        background: badgeColor(agent.type) + '20',
                        color: badgeColor(agent.type),
                      }}>{badgeLabel(agent.type)}</div>
                      <span style={{ color: s.text, fontSize: 14, fontWeight: 500 }}>{agent.label}</span>
                    </div>
                    {agent.status !== 'idle' && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        color: statusColor(agent.status), fontSize: 12, fontFamily: s.mono,
                      }}>
                        <div style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: statusColor(agent.status),
                          boxShadow: agent.status === 'working' ? `0 0 6px ${s.orange}` : 'none',
                          animation: agent.status === 'working' ? 'subagentpulse 1s ease-in-out infinite' : 'none',
                        }} />
                        {statusLabel(agent.status)}
                      </div>
                    )}
                  </div>

                  {agent.status !== 'idle' && (
                    <>
                      <div style={{
                        height: 4, borderRadius: 2, background: s.bg3, overflow: 'hidden',
                        marginBottom: 8,
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          background: agent.status === 'complete'
                            ? `linear-gradient(90deg, ${s.green}, ${s.green}cc)`
                            : `linear-gradient(90deg, ${s.accent}, ${s.purple})`,
                          width: `${agent.progress}%`,
                          transition: 'width 0.1s linear',
                        }} />
                      </div>
                      {agent.status === 'complete' && (
                        <div style={{
                          color: s.green, fontSize: 12, fontFamily: s.mono,
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {agent.result}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {spawned && (
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${s.border}`,
              background: s.bg2,
            }}>
              <div style={{
                color: s.text3, fontSize: 11, fontWeight: 600, fontFamily: s.mono,
                letterSpacing: 0.8, marginBottom: 12, textTransform: 'uppercase',
              }}>Execution Timeline</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {agents.map((agent) => {
                  const startPct = 0
                  const widthPct = agent.status === 'complete'
                    ? (agent.duration / maxDuration) * 100
                    : agent.status !== 'idle'
                      ? Math.max(2, (agent.progress / 100) * (agent.duration / maxDuration) * 100)
                      : 0
                  const barColor = agent.status === 'complete' ? s.green : agent.type === 'explore' ? s.yellow : s.accent
                  return (
                    <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 130, fontSize: 11, color: s.text2,
                        fontFamily: s.mono, textAlign: 'right', flexShrink: 0,
                      }}>{agent.label}</div>
                      <div style={{ flex: 1, height: 14, background: s.bg, borderRadius: 3, position: 'relative' }}>
                        <div style={{
                          position: 'absolute', left: `${startPct}%`, top: 0,
                          height: '100%', width: `${widthPct}%`,
                          background: barColor + '50', borderRadius: 3,
                          transition: 'width 0.1s linear',
                        }} />
                        <div style={{
                          position: 'absolute', left: `${startPct}%`, top: 0,
                          height: '100%', width: `${Math.min(widthPct, 100)}%`,
                          background: `linear-gradient(90deg, ${barColor}30, ${barColor}80)`,
                          borderRadius: 3, transition: 'width 0.1s linear',
                        }} />
                      </div>
                      <div style={{
                        width: 36, fontSize: 11, color: s.text3, fontFamily: s.mono, flexShrink: 0,
                      }}>
                        {agent.status === 'complete'
                          ? `${agent.duration / 1000}s`
                          : agent.status !== 'idle'
                            ? `${((elapsed / 1000) * (agent.duration / maxDuration)).toFixed(1)}s`
                            : '--'}
                      </div>
                    </div>
                  )
                })}
                {parentDone && (
                  <div style={{
                    marginTop: 6, padding: '8px 12px',
                    background: s.green + '10', border: `1px solid ${s.green}30`,
                    borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ color: s.green, fontSize: 12, fontFamily: s.mono, fontWeight: 500 }}>
                      All sub-agents complete -- results combined
                    </span>
                  </div>
                )}
              </div>

              <div style={{
                marginTop: 14, padding: '10px 14px',
                background: s.bg, borderRadius: 6,
                display: 'flex', gap: 24, justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                {[
                  { label: 'Sequential time', value: '~10s' },
                  { label: 'Parallel time', value: `~${(maxDuration / 1000)}s` },
                  { label: 'Speedup', value: `${(10 / (maxDuration / 1000)).toFixed(0)}x` },
                ].map((st) => (
                  <div key={st.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.text3, fontSize: 10, fontFamily: s.mono, marginBottom: 2 }}>
                      {st.label}
                    </div>
                    <div style={{
                      color: st.label === 'Speedup' ? s.green : s.text,
                      fontSize: 15, fontWeight: 700, fontFamily: s.mono,
                    }}>
                      {st.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes subagentpulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    </DemoBoundary>
  )
}
