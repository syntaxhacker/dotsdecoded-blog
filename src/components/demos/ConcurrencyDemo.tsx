import { useState, useEffect } from 'react'
import DemoBoundary from './DemoBoundary'

const s = {
  bg: '#0a0c0f', bg2: '#15191e', bg3: '#29313d',
  text: '#f1f2f3', text2: '#acb0b9', text3: '#747c8b',
  border: '#3e4a5b', border2: '#536279',
  accent: '#5b8def', green: '#3dd68c', red: '#e85d5d',
  yellow: '#e0b040', purple: '#9b7bea', orange: '#e8945a',
  mono: "'SF Mono', 'Cascadia Code', Consolas, monospace",
}

type Event = {
  step: number
  side: 'A' | 'B' | 'shared'
  label: string
  detail: string
  color: string
  blocked?: boolean
}

const noLockEvents: Event[] = [
  { step: 0, side: 'shared', label: 'Start', detail: 'Both transactions begin', color: s.accent },
  { step: 1, side: 'A', label: 'READ', detail: 'Reads balance: $1000', color: s.accent },
  { step: 2, side: 'B', label: 'READ', detail: 'Reads balance: $1000', color: s.accent },
  { step: 3, side: 'A', label: 'COMPUTE', detail: 'balance - 100 = $900', color: s.text2 },
  { step: 4, side: 'B', label: 'COMPUTE', detail: 'balance + 50 = $1050', color: s.text2 },
  { step: 5, side: 'A', label: 'WRITE', detail: 'Writes $900', color: s.green },
  { step: 6, side: 'B', label: 'WRITE', detail: 'Writes $1050 (stale)', color: s.red },
  { step: 7, side: 'shared', label: 'DONE', detail: 'Final balance: $1050', color: s.red },
]

const lockEvents: Event[] = [
  { step: 0, side: 'shared', label: 'Start', detail: 'Both transactions begin', color: s.accent },
  { step: 1, side: 'A', label: 'READ + LOCK', detail: 'Reads $1000, acquires lock', color: s.green },
  { step: 2, side: 'B', label: 'READ', detail: 'Waits for lock...', color: s.yellow, blocked: true },
  { step: 3, side: 'A', label: 'COMPUTE', detail: 'balance - 100 = $900', color: s.text2 },
  { step: 4, side: 'A', label: 'WRITE + UNLOCK', detail: 'Writes $900, releases lock', color: s.green },
  { step: 5, side: 'B', label: 'READ + LOCK', detail: 'Reads $900, acquires lock', color: s.green },
  { step: 6, side: 'B', label: 'COMPUTE', detail: 'balance + 50 = $950', color: s.text2 },
  { step: 7, side: 'B', label: 'WRITE + UNLOCK', detail: 'Writes $950, releases lock', color: s.green },
  { step: 8, side: 'shared', label: 'DONE', detail: 'Final balance: $950', color: s.green },
]

export default function ConcurrencyDemo() {
  const [locked, setLocked] = useState(false)
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(-1)

  const events = locked ? lockEvents : noLockEvents
  const totalSteps = events.length

  const balanceNoLock = step >= 7 ? 1050 : step >= 6 ? 1050 : step >= 5 ? 900 : 1000
  const balanceLock = step >= 8 ? 950 : step >= 7 ? 950 : step >= 5 ? 900 : step >= 4 ? 900 : 1000
  const displayBalance = locked ? balanceLock : balanceNoLock

  const aActive = step >= 0 && step < totalSteps && events.slice(0, step + 1).some((e) => e.side === 'A' && e.step === step)
  const bActive = step >= 0 && step < totalSteps && events.slice(0, step + 1).some((e) => e.side === 'B' && e.step === step)
  const aDone = step >= totalSteps || events.slice(0, step + 1).some((e) => e.side === 'A' && (e.label.includes('WRITE') || e.label.includes('UNLOCK')))
  const bDone = step >= totalSteps || events.slice(0, step + 1).some((e) => e.side === 'B' && (e.label.includes('WRITE') || e.label.includes('UNLOCK')))

  const isLocked = locked && step >= 1 && !(step >= 4 && (events[step]?.side === 'A' && events[step]?.label.includes('UNLOCK'))) && step < 4
  const bBlocked = locked && step === 2

  useEffect(() => {
    if (!running) return
    setStep(-1)
    const timeout = setTimeout(() => setStep(0), 400)
    return () => clearTimeout(timeout)
  }, [running, locked])

  useEffect(() => {
    if (step < 0 || !running) return
    if (step >= totalSteps - 1) {
      const t = setTimeout(() => setRunning(false), 300)
      return () => clearTimeout(t)
    }
    const delay = bBlocked && step === 2 ? 1400 : 800
    const t = setTimeout(() => setStep((prev) => prev + 1), delay)
    return () => clearTimeout(t)
  }, [step, running, totalSteps, bBlocked])

  const reset = () => {
    setRunning(false)
    setStep(-1)
  }

  const visibleEvents = step >= 0 ? events.filter((e) => e.step <= step) : []

  return (
    <DemoBoundary name="Concurrency and Locks">
      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: s.text, margin: 0 }}>Concurrent Transactions</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: s.text3 }}>Enable locking</span>
            <button
              onClick={() => { reset(); setLocked((v) => !v) }}
              disabled={running}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', padding: 0,
                background: locked ? s.accent : s.bg3, cursor: running ? 'not-allowed' : 'pointer',
                position: 'relative', transition: 'background 0.2s',
                opacity: running ? 0.6 : 1,
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 9, background: s.text,
                position: 'absolute', top: 3,
                left: locked ? 23 : 3,
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
        </div>

        <div style={{
          background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10, padding: 16,
          marginBottom: 16, position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: s.bg3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${s.border}`,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.text2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: s.text }}>Account #42</div>
                <div style={{ fontSize: 12, color: s.text3, marginTop: 2 }}>Primary key: accounts.id = 42</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: s.text3 }}>Balance:</span>
              <span style={{
                fontSize: 20, fontWeight: 700, fontFamily: s.mono,
                color: step >= totalSteps - 1
                  ? (locked ? s.green : s.red)
                  : s.text,
                transition: 'color 0.3s',
              }}>
                ${displayBalance}
              </span>
              {isLocked && (
                <div style={{
                  width: 24, height: 24, borderRadius: 6, background: `${s.yellow}22`,
                  border: `1px solid ${s.yellow}66`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  animation: 'pulse 1s infinite',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.yellow} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{
            background: s.bg2, border: `1px solid ${aActive ? s.purple : s.border}`,
            borderRadius: 10, padding: 14, transition: 'border-color 0.3s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: aDone ? s.green : aActive ? s.purple : s.text3,
                transition: 'background 0.3s',
              }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: s.text }}>Transaction A</span>
            </div>
            <div style={{
              fontSize: 13, fontFamily: s.mono, color: s.text2,
              background: s.bg, borderRadius: 6, padding: '8px 10px',
              border: `1px solid ${s.border}`,
            }}>
              SET balance = balance - 100
            </div>
            <div style={{ fontSize: 12, color: s.text3, marginTop: 8 }}>
              {step < 0 && 'Waiting to start...'}
              {step >= 0 && !locked && step < 5 && 'Read $1000, computing...'}
              {step >= 0 && !locked && step >= 5 && step < 7 && 'Wrote $900'}
              {step >= 0 && !locked && step >= 7 && 'Wrote $900 (overwritten)'}
              {step >= 0 && locked && step < 1 && 'Waiting to start...'}
              {step >= 0 && locked && step === 1 && 'Reading $1000, locking row...'}
              {step >= 0 && locked && step >= 2 && step < 4 && 'Computing $900...'}
              {step >= 0 && locked && step >= 4 && step < 5 && 'Wrote $900, lock released'}
              {step >= 0 && locked && step >= 5 && 'Committed: $900'}
            </div>
          </div>

          <div style={{
            background: s.bg2, border: `1px solid ${bBlocked ? s.yellow : bActive ? s.orange : s.border}`,
            borderRadius: 10, padding: 14, transition: 'border-color 0.3s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: bBlocked ? s.yellow : bDone ? s.green : bActive ? s.orange : s.text3,
                transition: 'background 0.3s',
              }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: s.text }}>Transaction B</span>
              {bBlocked && (
                <span style={{
                  fontSize: 11, fontFamily: s.mono, color: s.yellow,
                  background: `${s.yellow}15`, padding: '2px 8px',
                  borderRadius: 4, border: `1px solid ${s.yellow}33`,
                }}>
                  BLOCKED
                </span>
              )}
            </div>
            <div style={{
              fontSize: 13, fontFamily: s.mono, color: s.text2,
              background: s.bg, borderRadius: 6, padding: '8px 10px',
              border: `1px solid ${s.border}`,
            }}>
              SET balance = balance + 50
            </div>
            <div style={{ fontSize: 12, color: s.text3, marginTop: 8 }}>
              {step < 0 && 'Waiting to start...'}
              {step >= 0 && !locked && step < 2 && 'Read $1000, computing...'}
              {step >= 0 && !locked && step >= 2 && step < 6 && 'Computed $1050 (stale)'}
              {step >= 0 && !locked && step >= 6 && step < 7 && 'Writing $1050...'}
              {step >= 0 && !locked && step >= 7 && 'Wrote $1050 (overwrote A)'}
              {step >= 0 && locked && step < 2 && 'Waiting to start...'}
              {step >= 0 && locked && step === 2 && 'Waiting for lock...'}
              {step >= 0 && locked && step >= 3 && step < 5 && 'Still waiting for lock...'}
              {step >= 0 && locked && step === 5 && 'Lock acquired, reading $900...'}
              {step >= 0 && locked && step >= 6 && step < 8 && 'Computing $950...'}
              {step >= 0 && locked && step >= 8 && 'Committed: $950'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => { reset(); setRunning(true) }}
            disabled={running}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
              background: running ? s.bg3 : s.accent, color: running ? s.text3 : '#fff',
              fontSize: 14, fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              transition: 'background 0.2s, opacity 0.2s',
            }}
          >
            Run Both
          </button>
          <button
            onClick={reset}
            style={{
              padding: '10px 18px', borderRadius: 8,
              border: `1px solid ${s.border}`, background: s.bg2,
              color: s.text2, fontSize: 14, cursor: 'pointer',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            Reset
          </button>
        </div>

        {step >= 0 && (
          <div style={{
            background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 10,
            padding: 16, marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: s.text2, marginBottom: 12 }}>Timeline</div>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '50%', top: 0, bottom: 0,
                width: 2, background: s.bg3, transform: 'translateX(-50%)',
              }} />
              {visibleEvents.map((ev) => {
                const isLeft = ev.side === 'A'
                return (
                  <div key={ev.step} style={{
                    display: 'flex', alignItems: 'center', marginBottom: 8,
                    flexDirection: isLeft ? 'row' : 'row-reverse',
                    opacity: ev.step === step ? 1 : 0.5,
                    transition: 'opacity 0.3s',
                  }}>
                    <div style={{
                      flex: 1, padding: isLeft ? '0 16px 0 0' : '0 0 0 16px',
                      textAlign: isLeft ? 'right' : 'left',
                    }}>
                      <div style={{
                        background: s.bg, border: `1px solid ${ev.blocked ? s.yellow : ev.color}44`,
                        borderRadius: 8, padding: '8px 12px', display: 'inline-block',
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, fontFamily: s.mono, color: ev.blocked ? s.yellow : ev.color }}>
                          {ev.side !== 'shared' && `[Tx ${ev.side}] `}{ev.label}
                        </div>
                        <div style={{ fontSize: 12, color: s.text2, marginTop: 3 }}>{ev.detail}</div>
                      </div>
                    </div>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: ev.blocked ? s.yellow : ev.color,
                      border: `2px solid ${s.bg2}`, flexShrink: 0,
                      zIndex: 1,
                    }} />
                    <div style={{ flex: 1 }} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {step >= totalSteps - 1 && !locked && (
          <div style={{
            background: `${s.red}10`, border: `1px solid ${s.red}44`,
            borderRadius: 10, padding: 14, marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: s.red, marginBottom: 4 }}>
              Lost update! Transaction A's change was overwritten.
            </div>
            <div style={{ fontSize: 13, color: s.text2 }}>
              Expected $950 ($1000 - 100 + 50), got $1050. Without locking, Transaction B read the original
              $1000 before A's write, then overwrote A's result.
            </div>
          </div>
        )}

        {step >= totalSteps - 1 && locked && (
          <div style={{
            background: `${s.green}10`, border: `1px solid ${s.green}44`,
            borderRadius: 10, padding: 14, marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: s.green, marginBottom: 4 }}>
              Lock prevented the lost update.
            </div>
            <div style={{ fontSize: 13, color: s.text2 }}>
              Transaction A acquired an exclusive lock, forcing B to wait. B then read the correct $900
              and computed the right final balance of $950.
            </div>
          </div>
        )}
      </div>
    </DemoBoundary>
  )
}
