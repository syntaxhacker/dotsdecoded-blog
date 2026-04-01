import { useState, useEffect, useRef } from 'react'
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

type Phase = 'idle' | 'claude_responds' | 'speculating' | 'awaiting_accept' | 'accepted' | 'complete'

const SPEC_STEPS = [
  { label: 'Creating COW overlay...', color: s.purple },
  { label: 'Forking agent process...', color: s.purple },
  { label: 'Reading utils.ts...', color: s.accent },
  { label: 'Editing utils.ts (overlay)...', color: s.orange },
  { label: 'Running typecheck (overlay)...', color: s.accent },
  { label: 'Speculation complete', color: s.green },
]

function FileIcon({ label, color, highlight, isOverlay }: { label: string; color: string; highlight: boolean; isOverlay: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      borderRadius: 6,
      border: `1px solid ${highlight ? color : s.border}`,
      background: highlight ? `${color}15` : s.bg,
      transition: 'all 0.4s',
      opacity: isOverlay && !highlight ? 0.4 : 1,
    }}>
      <svg width={18} height={22} viewBox="0 0 18 22" fill="none">
        <path d="M1 1h10l6 6v14a1 1 0 01-1 1H1a1 1 0 01-1-1V2a1 1 0 011-1z" stroke={highlight ? color : s.border2} strokeWidth={1.5} fill={highlight ? `${color}10` : 'none'} />
        <path d="M11 1v6h6" stroke={highlight ? color : s.border2} strokeWidth={1.5} fill="none" />
        <line x1="4" y1="12" x2="14" y2="12" stroke={highlight ? color : s.border} strokeWidth={1} strokeDasharray={isOverlay ? "3 2" : "none"} opacity={isOverlay ? 0.5 : 0.4} />
        <line x1="4" y1="15" x2="11" y2="15" stroke={highlight ? color : s.border} strokeWidth={1} strokeDasharray={isOverlay ? "3 2" : "none"} opacity={isOverlay ? 0.5 : 0.4} />
        <line x1="4" y1="18" x2="13" y2="18" stroke={highlight ? color : s.border} strokeWidth={1} strokeDasharray={isOverlay ? "3 2" : "none"} opacity={isOverlay ? 0.5 : 0.4} />
      </svg>
      <div>
        <div style={{ fontSize: 12, fontFamily: s.mono, color: highlight ? color : s.text2, fontWeight: highlight ? 600 : 400, transition: 'color 0.3s' }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: s.text3, marginTop: 2 }}>
          {isOverlay ? 'overlay (copy-on-write)' : 'real filesystem'}
        </div>
      </div>
      {highlight && (
        <div style={{
          marginLeft: 'auto',
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
          animation: 'pulse 1s infinite',
        }} />
      )}
    </div>
  )
}

function TimelineNode({ label, color, active, done, time, isDashed }: { label: string; color: string; active: boolean; done: boolean; time?: string; isDashed?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, opacity: done ? 1 : active ? 1 : 0.35, transition: 'opacity 0.3s' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
        <div style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: `2px solid ${done ? color : active ? color : s.border}`,
          background: done ? color : active ? `${color}30` : 'transparent',
          transition: 'all 0.3s',
          flexShrink: 0,
        }} />
        <div style={{
          width: 2,
          height: 28,
          background: done ? color : s.border,
          borderStyle: isDashed ? 'dashed' : 'solid',
          opacity: done || active ? 0.6 : 0.25,
          transition: 'all 0.3s',
        }} />
      </div>
      <div style={{ paddingTop: 0, minWidth: 0 }}>
        <div style={{
          fontSize: 12,
          fontFamily: s.mono,
          color: done || active ? color : s.text3,
          transition: 'color 0.3s',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {label}
        </div>
        {time && (
          <div style={{ fontSize: 10, color: s.text3, marginTop: 1, fontFamily: s.mono }}>{time}</div>
        )}
      </div>
    </div>
  )
}

export default function SpeculationDemo() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [specStep, setSpecStep] = useState(-1)
  const [userStep, setUserStep] = useState(-1)
  const [speed, setSpeed] = useState(1)
  const [elapsed, setElapsed] = useState(0)
  const [savedTime, setSavedTime] = useState<number | null>(null)
  const [showMerge, setShowMerge] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const reset = () => {
    setPhase('idle')
    setSpecStep(-1)
    setUserStep(-1)
    setElapsed(0)
    setSavedTime(null)
    setShowMerge(false)
    if (timerRef.current) clearInterval(timerRef.current)
    if (elapsedRef.current) clearInterval(elapsedRef.current)
    timerRef.current = null
    elapsedRef.current = null
  }

  useEffect(() => {
    if (phase === 'idle' || phase === 'complete') {
      if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null }
      return
    }
    const start = Date.now() - elapsed * 1000
    elapsedRef.current = setInterval(() => {
      setElapsed((Date.now() - start) / 1000)
    }, 100)
    return () => {
      if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null }
    }
  }, [phase, elapsed])

  useEffect(() => {
    if (phase !== 'idle') return

    const d = getStepDelay
    const steps: Array<{ action: () => void; delay: number }> = [
      { action: () => { setPhase('claude_responds'); setUserStep(0) }, delay: d(400, speed) },
      { action: () => setUserStep(1), delay: d(800, speed) },
      { action: () => { setPhase('speculating'); setUserStep(2); setSpecStep(0) }, delay: d(600, speed) },
      { action: () => setSpecStep(1), delay: d(700, speed) },
      { action: () => setSpecStep(2), delay: d(900, speed) },
      { action: () => setSpecStep(3), delay: d(1100, speed) },
      { action: () => setSpecStep(4), delay: d(1000, speed) },
      { action: () => { setSpecStep(5); setPhase('awaiting_accept'); setUserStep(3) }, delay: d(600, speed) },
    ]

    let idx = 0
    let timeout: ReturnType<typeof setTimeout> | null = null

    const run = () => {
      if (idx >= steps.length) { timerRef.current = null; return }
      const st = steps[idx]
      timeout = setTimeout(() => { st.action(); idx++; run() }, st.delay)
    }

    timerRef.current = null as unknown as ReturnType<typeof setInterval>
    run()

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [phase, speed])

  const handleAccept = () => {
    setPhase('accepted')
    setUserStep(4)
    setShowMerge(true)
    setTimeout(() => {
      setShowMerge(false)
      setSavedTime(4.2)
      setPhase('complete')
      setUserStep(5)
    }, getStepDelay(1500, speed))
  }

  const USER_STEPS = [
    { label: 'Claude responds with suggestion', color: s.accent },
    { label: 'User is idle (thinking)', color: s.text3 },
    { label: 'Background speculation active', color: s.purple },
    { label: 'Waiting for user to accept', color: s.yellow },
    { label: 'User accepts -- instant result', color: s.green },
    { label: 'Session complete', color: s.green },
  ]

  return (
    <DemoBoundary name="Speculative Execution">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } } @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } } @keyframes mergeGlow { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }`}</style>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: phase !== 'idle' && phase !== 'complete' ? s.accent : s.border, boxShadow: phase !== 'idle' && phase !== 'complete' ? `0 0 8px ${s.accent}` : 'none' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: s.text2, letterSpacing: 0.5 }}>SPECULATION ENGINE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {phase !== 'idle' && (
              <span style={{ fontSize: 11, fontFamily: s.mono, color: s.text3 }}>
                {elapsed.toFixed(1)}s
              </span>
            )}
            <SpeedController speed={speed} onSpeedChange={setSpeed} />
            {phase !== 'idle' && (
              <button onClick={reset} style={{
                background: s.bg2,
                border: `1px solid ${s.border}`,
                borderRadius: 6,
                padding: '4px 10px',
                color: s.text3,
                fontFamily: s.mono,
                fontSize: 11,
                cursor: 'pointer',
              }}>
                Reset
              </button>
            )}
          </div>
        </div>

        {phase === 'idle' && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: s.bg2,
            borderRadius: 10,
            border: `1px solid ${s.border}`,
          }}>
            <div style={{ fontSize: 13, color: s.text2, marginBottom: 16, lineHeight: 1.6 }}>
              Claude Code pre-executes the next agentic loop before you type anything,
              using a copy-on-write overlay filesystem so speculative edits never touch your real files.
            </div>
            <button onClick={() => setPhase('idle')} style={{
              background: s.accent,
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              color: '#fff',
              fontFamily: s.mono,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: `0 2px 12px ${s.accent}40`,
            }}>
              Start Session
            </button>
          </div>
        )}

        {phase !== 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              background: s.bg2,
              borderRadius: 10,
              border: `1px solid ${s.border}`,
              padding: '16px 16px 8px',
            }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.accent, marginBottom: 10, fontWeight: 600, letterSpacing: 0.8 }}>USER TIMELINE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {USER_STEPS.map((st, i) => (
                  <TimelineNode
                    key={i}
                    label={st.label}
                    color={st.color}
                    active={i === userStep}
                    done={i < userStep}
                    isDashed={i === 1}
                  />
                ))}
              </div>
            </div>

            <div style={{
              background: s.bg2,
              borderRadius: 10,
              border: `1px solid ${s.border}`,
              padding: '16px 16px 8px',
              opacity: specStep >= 0 ? 1 : 0.5,
              transition: 'opacity 0.4s',
            }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.purple, marginBottom: 10, fontWeight: 600, letterSpacing: 0.8 }}>
                BACKGROUND SPECULATION
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {SPEC_STEPS.map((st, i) => (
                  <TimelineNode
                    key={i}
                    label={st.label}
                    color={st.color}
                    active={i === specStep}
                    done={i < specStep}
                    isDashed={true}
                  />
                ))}
              </div>
            </div>

            <div style={{
              background: s.bg2,
              borderRadius: 10,
              border: `1px solid ${s.border}`,
              padding: 16,
            }}>
              <div style={{ fontSize: 11, fontFamily: s.mono, color: s.orange, marginBottom: 12, fontWeight: 600, letterSpacing: 0.8 }}>
                COPY-ON-WRITE OVERLAY
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                <div style={{ flex: 1 }}>
                  <FileIcon
                    label="utils.ts"
                    color={s.accent}
                    highlight={phase === 'speculating' && specStep === 2}
                    isOverlay={false}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 4,
                  padding: '0 4px',
                }}>
                  {showMerge ? (
                    <svg width={40} height={24} viewBox="-4 -4 48 32" fill="none">
                      <path d="M0 12 L16 12" stroke={s.green} strokeWidth={2} />
                      <path d="M40 12 L24 12" stroke={s.green} strokeWidth={2} />
                      <path d="M16 6 L22 12 L16 18" stroke={s.green} strokeWidth={2} fill="none" />
                      <path d="M24 6 L18 12 L24 18" stroke={s.green} strokeWidth={2} fill="none" />
                      <circle cx="20" cy="12" r="3" fill={s.green} opacity={0.6} />
                    </svg>
                  ) : (
                    <svg width={40} height={24} viewBox="-4 -4 48 32" fill="none">
                      <line x1="0" y1="12" x2="40" y2="12" stroke={s.border} strokeWidth={1} strokeDasharray="4 3" />
                    </svg>
                  )}
                  <span style={{ fontSize: 9, fontFamily: s.mono, color: s.text3 }}>
                    {showMerge ? 'MERGING' : specStep >= 2 ? 'COW' : '---'}
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <FileIcon
                    label="utils.ts"
                    color={s.orange}
                    highlight={phase === 'speculating' && specStep >= 3 && specStep <= 4}
                    isOverlay={true}
                  />
                </div>
              </div>
              <div style={{
                textAlign: 'center',
                marginTop: 10,
                fontSize: 11,
                color: s.text3,
                fontFamily: s.mono,
                lineHeight: 1.5,
              }}>
                {specStep < 0 && 'Overlay not yet created'}
                {specStep === 0 && 'Creating isolated copy-on-write layer...'}
                {specStep === 1 && 'Forking agent -- all writes go to overlay'}
                {specStep === 2 && 'Reading from real file into overlay'}
                {specStep === 3 && 'Editing only the overlay copy'}
                {specStep === 4 && 'Typecheck passes on overlay'}
                {specStep === 5 && !showMerge && 'Speculation ready -- awaiting merge'}
                {showMerge && 'Copying overlay changes to real filesystem...'}
                {savedTime !== null && `Merge complete -- changes applied atomically`}
              </div>
            </div>

            {phase === 'awaiting_accept' && (
              <div style={{
                background: `${s.yellow}10`,
                border: `1px solid ${s.yellow}40`,
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                animation: 'slideDown 0.3s ease-out',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.yellow, marginBottom: 2 }}>
                    Suggestion Ready
                  </div>
                  <div style={{ fontSize: 12, color: s.text2, fontFamily: s.mono }}>
                    Fix the type error in utils.ts
                  </div>
                </div>
                <button onClick={handleAccept} style={{
                  background: s.green,
                  border: 'none',
                  borderRadius: 7,
                  padding: '8px 20px',
                  color: '#000',
                  fontFamily: s.mono,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: `0 2px 10px ${s.green}40`,
                  transition: 'transform 0.1s',
                }}>
                  Accept
                </button>
              </div>
            )}

            {savedTime !== null && (
              <div style={{
                background: `${s.green}10`,
                border: `1px solid ${s.green}40`,
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                animation: 'slideDown 0.3s ease-out',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.green, marginBottom: 2 }}>
                    Result Applied Instantly
                  </div>
                  <div style={{ fontSize: 12, color: s.text2 }}>
                    Speculative execution completed while you were idle. No wait time.
                  </div>
                </div>
                <div style={{
                  background: s.bg,
                  borderRadius: 8,
                  padding: '8px 16px',
                  border: `1px solid ${s.green}40`,
                }}>
                  <div style={{ fontSize: 10, color: s.text3, fontFamily: s.mono }}>TIME SAVED</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.green, fontFamily: s.mono }}>
                    {savedTime}s
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
